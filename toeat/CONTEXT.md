# ToEat — Antigravity Project Context

## Project Overview
ToEat is a nutrition deficiency guidance web app. It helps users understand
what foods to eat based on their specific nutritional deficiency (Iron,
Vitamin D, Vitamin B12, Calcium, Folate), with India-specific dietary context.

## Architecture
```
toeat/
├── frontend/          React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── App.tsx               Main app with 3 tabs: Guide / RDI / Coach Agent
│       └── components/
│           ├── AgentAnalysis.tsx  Multi-step agent UI (Step 1–4 visible)
│           ├── DailyIntake.tsx    Static ICMR RDI education page
│           └── FoodDetailModal.tsx Food detail overlay
└── backend/           Python + FastAPI
    ├── main.py        API with rate limiting, input validation, 3 endpoints
    ├── agent_cli.py   CLI agent skill (run from terminal)
    └── requirements.txt
```

## Key Architectural Decisions
- Gemini handles ONLY explanation and formatting — never invents nutrient values
- All numeric nutrient data comes from USDA FoodData Central API (real, grounded)
- /api/agent runs a transparent 4-step reasoning loop (extracte → lookup → analyse → plan)
- Input whitelist on deficiency + diet fields prevents prompt injection
- Rate limiting: 20 req/min (deficiency/search), 10 req/min (agent)
- CORS locked to FRONTEND_URL env var

## Agent Loop (/api/agent)
Step 1 – EXTRACT: Gemini parses food items from free-text
Step 2 – LOOKUP:  USDA API called per food (parallel, real data)
Step 3 – ANALYSE: Gemini reasons across USDA results for deficiency risk
Step 4 – PLAN:    Gemini generates corrective food suggestions

## Security Implemented
- No hardcoded secrets (all via .env)
- Input whitelisted + sanitised (strips prompt injection chars)
- Generic error messages to client (no internal detail leaked)
- slowapi rate limiting per IP
- CORS locked to specific origin

## Environment Variables
backend/.env  → GEMINI_API_KEY, USDA_API_KEY, FRONTEND_URL
frontend/.env → VITE_API_URL

## Running Locally
```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in keys
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:8000
npm run dev

# Agent CLI
cd backend
python agent_cli.py "I eat dal, roti, spinach, and curd daily"
```

## Deployment
- Frontend → Vercel (set VITE_API_URL to Railway backend URL)
- Backend  → Railway (set all env vars in Railway dashboard)
```
