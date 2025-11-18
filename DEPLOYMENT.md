# 🚀 Deployment Guide - Crie-App

## Environment Variables Configuration

To deploy this application, you need to configure the following environment variables in the Emergent dashboard.

### Frontend Variables

Create `/app/.env` with:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Backend Variables

Create `/app/backend/.env` with:

```bash
# MongoDB Connection (automatically set by Emergent)
MONGO_URL=mongodb://localhost:27017

# Database Name
DB_NAME=crie_app

# JWT Secret Key (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=your_generated_secret_key

# Kie.ai API Key
KIE_AI_API_KEY=your_kie_api_key
```

## Quick Setup

1. Copy example files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

2. Edit the files and replace placeholder values with your actual API keys

3. Deploy!

## Required API Keys

- **GEMINI_API_KEY**: Get from https://aistudio.google.com/app/apikey
- **KIE_AI_API_KEY**: Your kie.ai API key for music/video generation
- **JWT_SECRET_KEY**: Generate with `openssl rand -hex 32`

## Notes

- The `.env` files are NOT committed to git for security
- Example files (`.env.example`) are provided as templates
- Emergent will automatically inject these variables during deployment
