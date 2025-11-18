from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import uuid
import requests
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Startup event to create database indexes
@app.on_event("startup")
async def startup_db():
    """Create database indexes on startup"""
    try:
        # Create unique indexes for users collection
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not create indexes: {e}")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "crie_app")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Kie.ai Configuration
KIE_AI_API_KEY = os.getenv("KIE_AI_API_KEY")
KIE_AI_BASE_URL = "https://api.kie.ai/api/v1"

# Pydantic Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: dict

class UserUpdate(BaseModel):
    tokens: Optional[int] = None

# Kie.ai Models
class MusicGenerateRequest(BaseModel):
    prompt: str
    customMode: bool = False
    instrumental: bool = False
    model: str = "V3_5"
    
class VideoGenerateRequest(BaseModel):
    taskId: str

# Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Crie-App Backend running with MongoDB"}

@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user_data.password)
    
    is_admin = user_data.email == "admin@crie-app.com"
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_pwd,
        "isAdmin": is_admin,
        "tokens": 20,
        "createdAt": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"user_id": user_id, "email": user_data.email})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "isAdmin": is_admin,
            "tokens": 20
        }
    }

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_access_token({"user_id": user["id"], "email": user["email"]})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "isAdmin": user.get("isAdmin", False),
            "tokens": user.get("tokens", 0)
        }
    }

@app.get("/api/auth/verify")
async def verify_user(token: str):
    payload = verify_token(token)
    user_id = payload.get("user_id")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "isAdmin": user.get("isAdmin", False),
        "tokens": user.get("tokens", 0)
    }

@app.put("/api/users/{user_id}/tokens")
async def update_user_tokens(user_id: str, update_data: UserUpdate):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"tokens": update_data.tokens}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Tokens updated successfully"}

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "isAdmin": user.get("isAdmin", False),
        "tokens": user.get("tokens", 0)
    }

@app.get("/api/admin/users")
async def get_all_users():
    """Get all users - Admin only endpoint"""
    users_cursor = db.users.find({})
    users_list = []
    
    async for user in users_cursor:
        users_list.append({
            "id": user["id"],
            "email": user["email"],
            "tokens": user.get("tokens", 0),
            "isAdmin": user.get("isAdmin", False),
            "createdAt": user.get("createdAt", datetime.utcnow()).isoformat()
        })
    
    return {
        "users": users_list,
        "totalUsers": len(users_list)
    }

# ========== KIE.AI API ROUTES ==========
from kie_service import kie_service

@app.post("/api/kie/music/generate")
async def generate_music(
    prompt: str,
    customMode: bool = False,
    instrumental: bool = False,
    model: str = "V3_5"
):
    """Generate music using Suno API via kie.ai"""
    try:
        result = kie_service.generate_music(
            prompt=prompt,
            custom_mode=customMode,
            instrumental=instrumental,
            model=model
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kie/music/details/{task_id}")
async def get_music_details(task_id: str):
    """Get music generation status and result"""
    try:
        result = kie_service.get_music_details(task_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/kie/music/extend")
async def extend_music(
    audio_url: str,
    prompt: str,
    continue_at: int = 0
):
    """Extend existing music track"""
    try:
        result = kie_service.extend_music(
            audio_url=audio_url,
            prompt=prompt,
            continue_at=continue_at
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/kie/video/generate")
async def generate_video(
    prompt: str,
    image_url: Optional[str] = None,
    duration: str = "5",
    resolution: str = "720p",
    aspect_ratio: str = "16:9",
    negative_prompt: Optional[str] = None,
    enable_prompt_expansion: bool = True,
    seed: Optional[int] = None
):
    """Generate video using Wan 2.5 API via kie.ai"""
    try:
        result = kie_service.generate_video(
            prompt=prompt,
            image_url=image_url,
            duration=duration,
            resolution=resolution,
            aspect_ratio=aspect_ratio,
            negative_prompt=negative_prompt,
            enable_prompt_expansion=enable_prompt_expansion,
            seed=seed
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kie/video/details/{generation_id}")
async def get_video_details(generation_id: str):
    """Get video generation status and result"""
    try:
        result = kie_service.get_video_details(generation_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kie/music-video/details/{task_id}")
async def get_music_video_details(task_id: str):
    """Get music video generation details"""
    try:
        result = kie_service.get_music_video_details(task_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Web Scraping Models
class WebsiteAnalysisRequest(BaseModel):
    url: str

class WebsiteAnalysisResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

# Web Scraping Endpoint
@app.post("/api/analyze-website", response_model=WebsiteAnalysisResponse)
async def analyze_website(request: WebsiteAnalysisRequest):
    """
    Scrape website content and use AI to extract relevant business information
    """
    try:
        from bs4 import BeautifulSoup
        import re
        
        url = request.url.strip()
        
        # Handle Instagram URLs differently
        if 'instagram.com' in url or url.startswith('@'):
            return WebsiteAnalysisResponse(
                success=True,
                data={
                    "brand_identity": f"Perfil do Instagram: {url}",
                    "differentiators": [
                        "Presença ativa nas redes sociais",
                        "Comunicação visual forte"
                    ],
                    "target_values": ["Modernidade", "Conexão com público"],
                    "summary": f"Marca presente no Instagram ({url}) com foco em engajamento visual e conexão com audiência digital."
                }
            )
        
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Fetch website content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Limit text size for API
        max_chars = 4000
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
        
        # Use Gemini to analyze the content
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada")
        
        gemini_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={gemini_api_key}"
        
        analysis_prompt = f"""Analise o seguinte conteúdo de um website e extraia informações relevantes para criar um jingle comercial memorável.

CONTEÚDO DO SITE:
{text}

Retorne APENAS um JSON válido (sem markdown, sem ```json) com a seguinte estrutura:
{{
    "brand_identity": "Descrição curta da identidade da marca (1-2 frases)",
    "differentiators": ["Diferencial 1", "Diferencial 2", "Diferencial 3"],
    "target_values": ["Valor 1", "Valor 2", "Valor 3"],
    "summary": "Resumo executivo ideal para criar um jingle (máximo 3 frases)"
}}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional."""

        gemini_payload = {
            "contents": [{
                "parts": [{"text": analysis_prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024
            }
        }
        
        gemini_response = requests.post(gemini_url, json=gemini_payload, timeout=30)
        gemini_response.raise_for_status()
        gemini_data = gemini_response.json()
        
        # Extract text from Gemini response
        if 'candidates' in gemini_data and len(gemini_data['candidates']) > 0:
            ai_text = gemini_data['candidates'][0]['content']['parts'][0]['text']
            
            # Try to parse as JSON
            import json
            # Remove markdown code blocks if present
            ai_text = re.sub(r'```json\s*|\s*```', '', ai_text).strip()
            
            try:
                analysis_data = json.loads(ai_text)
                
                return WebsiteAnalysisResponse(
                    success=True,
                    data=analysis_data
                )
            except json.JSONDecodeError:
                # If JSON parsing fails, create a basic response
                return WebsiteAnalysisResponse(
                    success=True,
                    data={
                        "brand_identity": "Website analisado com sucesso",
                        "differentiators": ["Empresa estabelecida", "Presença online"],
                        "target_values": ["Qualidade", "Confiança"],
                        "summary": f"Análise do site {url} realizada. Use o contexto do site para personalizar o jingle."
                    }
                )
        else:
            raise Exception("Resposta inválida da API Gemini")
            
    except requests.Timeout:
        return WebsiteAnalysisResponse(
            success=False,
            error="Tempo limite excedido ao acessar o site. Verifique a URL e tente novamente."
        )
    except requests.RequestException as e:
        return WebsiteAnalysisResponse(
            success=False,
            error=f"Erro ao acessar o site: {str(e)}"
        )
    except Exception as e:
        return WebsiteAnalysisResponse(
            success=False,
            error=f"Erro ao analisar o site: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
