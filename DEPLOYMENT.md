# 🚀 Deployment Guide - Crie-App

## ⚠️ CRITICAL: Configure Environment Variables in Emergent Dashboard

**The build is failing because environment variables must be configured in the Emergent deployment dashboard, not just in `.env` files.**

## Step-by-Step Deployment Instructions

### 1. Configure Secrets in Emergent Dashboard

Go to your Emergent deployment settings and add these environment variables:

#### **Backend Environment Variables** (Namespace: `backend`)

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=crie_app
JWT_SECRET_KEY=your_jwt_secret_key_here
KIE_AI_API_KEY=your_kie_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

#### **Frontend Environment Variables** (Namespace: `frontend`)

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 2. How to Add Variables in Emergent Dashboard

1. Go to your project settings in Emergent
2. Find the "Environment Variables" or "Secrets" section
3. Add each variable listed above
4. Make sure to select the correct namespace (backend/frontend)
5. Save the configuration
6. Trigger a new deployment

### 3. Important Notes

- ✅ The `.env` files in the repository are for **local development only**
- ✅ For **production deployment**, variables MUST be in the Emergent dashboard
- ✅ Never commit real API keys to git
- ✅ The `.env.example` files show which variables are needed

### 4. Generating JWT Secret (if needed)

If you need to generate a new JWT secret:
```bash
openssl rand -hex 32
```

## Required API Keys

- **GEMINI_API_KEY**: Get from https://aistudio.google.com/app/apikey
- **KIE_AI_API_KEY**: Your kie.ai API key for music/video generation  
- **JWT_SECRET_KEY**: A secure random string (use `openssl rand -hex 32`)

## Troubleshooting

### "failed to read backend and frontend envs" Error

This means the environment variables are not configured in the Emergent dashboard. Follow Step 1 above.

### Variables Not Loading

1. Verify variables are in the correct namespace (backend/frontend)
2. Check for typos in variable names
3. Ensure there are no extra spaces or special characters
4. Try triggering a fresh deployment after saving

## Local Development vs Production

- **Local**: Uses `.env` files
- **Production (Emergent)**: Uses dashboard-configured environment variables
