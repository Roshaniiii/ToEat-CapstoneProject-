# 🥗 ToEat — AI Nutrition Deficiency Coach

> Know exactly what to eat for your deficiency.

ToEat is an AI-powered nutrition guidance web app that helps users understand
what to eat based on their specific nutritional deficiency — with a focus on
India-specific dietary context using ICMR-NIN 2020 standards.

Built for the **Kaggle 5-Day AI Agents: Intensive Vibe Coding Capstone** — Track: **Agents for Good**.

---

## The Problem

Generic nutrition search results don't account for:
- Specific deficiencies (Iron vs B12 vs Vitamin D are very different)
- Indian dietary patterns (dal, roti, ragi — absent from most Western databases)
- Bioavailability (spinach iron ≠ meat iron; Vitamin C triples iron absorption)
- Diet restrictions (veg/vegan users have fundamentally different options)


---

## The Solution: A Multi-Step Nutrition Agent

ToEat combines **real USDA nutrient data** with **Gemini AI reasoning** in a
transparent, grounded agent loop — so users get trustworthy advice, not hallucinated values.

### Core principle
> Gemini explains. USDA measures. Never the other way around.

---

## Agent Architecture

```
User input (meal description)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│                  /api/agent                          │
│                                                      │
│  Step 1: EXTRACT  ──► Gemini parses food items       │
│  Step 2: LOOKUP   ──► USDA API (real nutrient data)  │  ← Tool use
│  Step 3: ANALYSE  ──► Gemini cross-food risk assess  │  ← AI reasoning
│  Step 4: PLAN     ──► Gemini corrective suggestions  │
│                                                      │
│  Returns: agent_steps[], deficiency_risks[], plan[]  │
└─────────────────────────────────────────────────────┘
        │
        ▼
Transparent step-by-step UI (judges/users can see reasoning)
```

### Other endpoints
- `/api/deficiency` — single-step guidance for a chosen deficiency + diet type
- `/api/search` — USDA lookup → Gemini explanation for any food

---

## Key Concepts Demonstrated

| Concept | Where |
|---|---|
| Agent / Multi-step reasoning | `/api/agent` — 4-step loop with tool use |
| Agent Skills (CLI) | `backend/agent_cli.py` — run from terminal |
| Security features | Input whitelist, rate limiting, CORS, no hardcoded keys |
| Deployability | Vercel (frontend) + Railway (backend) |
| Antigravity IDE | Used throughout development (shown in video) |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Backend | Python + FastAPI |
| AI | Gemini 2.0 Flash |
| Nutrient Data | USDA FoodData Central API |
| Rate Limiting | slowapi |
| Deployment | Vercel + Railway |

---

## Security Implementation

- **No hardcoded secrets** — all keys via `.env` files
- **Input whitelisting** — `deficiency` and `diet` fields validated against known-good values only
- **Prompt injection mitigation** — query strings sanitised (strips `{}[]<>"'\`)
- **Rate limiting** — Custom sliding-window limiter (pure Python, no C deps)
- **CORS** — locked to `FRONTEND_URL` env var, not wildcard
- **Generic errors** — internal error details never returned to client

---

## Project Structure

```
toeat/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  Main app (Guide / RDI / Coach Agent tabs)
│   │   ├── types.ts                 Shared TypeScript types
│   │   └── components/
│   │       ├── AgentAnalysis.tsx    Multi-step agent UI
│   │       ├── DailyIntake.tsx      ICMR RDI education page
│   │       └── FoodDetailModal.tsx  Food detail overlay
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── main.py                      FastAPI app (3 endpoints + security)
│   ├── agent_cli.py                 Agent Skills CLI demonstration
│   ├── requirements.txt
│   └── .env.example
├── CONTEXT.md                       Antigravity persistent project context
└── README.md
```

---

## Setup & Running Locally

### 1. Get API Keys
- Gemini: [aistudio.google.com](https://aistudio.google.com)
- USDA: [fdc.nal.usda.gov/api-guide](https://fdc.nal.usda.gov/api-guide.html) (free)

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and USDA_API_KEY
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# .env already has VITE_API_URL=http://localhost:8000
npm run dev
```

### 4. Agent CLI (Agent Skills demo)
```bash
cd backend
python agent_cli.py "I eat dal, roti, spinach sabzi, curd and banana daily"
```

---

## Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import in Vercel, set root to `frontend/`
3. Add env var: `VITE_API_URL=https://your-backend.railway.app`

### Backend → Railway
1. Push `backend/` to GitHub
2. New Railway project → Deploy from GitHub
3. Add env vars: `GEMINI_API_KEY`, `USDA_API_KEY`, `FRONTEND_URL`

---

## The Story

This project came from a personal experience with nutritional deficiency.
Generic search results either listed every possible food or gave Western-centric
advice that didn't account for Indian dietary patterns. ToEat was built to solve
that — grounded in real USDA data, contextualised by Gemini, and focused on the
five most common deficiencies in India.

---

## Medical Disclaimer

This app is for informational purposes only and is not a substitute for
professional medical advice. Always consult a physician before changing your diet.

---

## License

Apache 2.0
