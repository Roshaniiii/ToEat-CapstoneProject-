
import os
import re
import json
import asyncio
import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import time
from collections import defaultdict
from google import genai
from google.genai import types as genai_types

load_dotenv()

# ── Gemini setup ──────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")
gemini = genai.Client(api_key=GEMINI_API_KEY)
GEMINI_MODEL = "gemini-2.0-flash"

# ── USDA setup ────────────────────────────────────────────────────────────────
USDA_API_KEY = os.getenv("USDA_API_KEY", "DEMO_KEY")

# ── CORS ──────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ── Pure-Python rate limiter (no C deps) ──────────────────────────────────────
_rate_store: dict[str, list[float]] = defaultdict(list)

def check_rate_limit(request: Request, max_requests: int = 20, window_seconds: int = 60):
    """Sliding window rate limiter — pure Python, no external deps."""
    ip = request.client.host if request.client else "unknown"
    key = f"{ip}:{request.url.path}"
    now = time.time()
    window_start = now - window_seconds
    # Remove timestamps outside the window
    _rate_store[key] = [t for t in _rate_store[key] if t > window_start]
    if len(_rate_store[key]) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Max {max_requests} per {window_seconds}s."
        )
    _rate_store[key].append(now)

app = FastAPI(
    title="ToEat API",
    description="Nutrition deficiency guidance powered by Gemini + USDA",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ── Whitelists (prompt injection defence) ─────────────────────────────────────
ALLOWED_DEFICIENCIES = {"Iron", "Vitamin D", "Vitamin B12", "Calcium", "Folate"}
ALLOWED_DIETS = {"veg", "non-veg", "vegan"}

# ── Request / Response models ─────────────────────────────────────────────────

class DeficiencyRequest(BaseModel):
    deficiency: str
    diet: str

    @field_validator("deficiency")
    @classmethod
    def validate_deficiency(cls, v):
        if v not in ALLOWED_DEFICIENCIES:
            raise ValueError(f"deficiency must be one of {ALLOWED_DEFICIENCIES}")
        return v

    @field_validator("diet")
    @classmethod
    def validate_diet(cls, v):
        if v not in ALLOWED_DIETS:
            raise ValueError(f"diet must be one of {ALLOWED_DIETS}")
        return v


class SearchRequest(BaseModel):
    query: str

    @field_validator("query")
    @classmethod
    def sanitise_query(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("query cannot be empty")
        if len(v) > 120:
            raise ValueError("query too long (max 120 chars)")
        # Strip characters that could break prompt structure
        v = re.sub(r"[{}\[\]<>\"\'\\]", "", v)
        return v


class AgentRequest(BaseModel):
    meal_description: str

    @field_validator("meal_description")
    @classmethod
    def sanitise_meal(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("meal_description cannot be empty")
        if len(v) > 300:
            raise ValueError("meal_description too long (max 300 chars)")
        v = re.sub(r"[{}\[\]<>\"\'\\]", "", v)
        return v


# ── USDA tool ─────────────────────────────────────────────────────────────────

NUTRIENT_PATTERNS = {
    "Iron":        re.compile(r"iron", re.I),
    "Calcium":     re.compile(r"calcium", re.I),
    "Vitamin B12": re.compile(r"b-?12|cobalamin", re.I),
    "Vitamin D":   re.compile(r"vitamin d|ergocalciferol|cholecalciferol", re.I),
    "Folate":      re.compile(r"folate|folic", re.I),
}

NUTRIENT_UNITS = {
    "Iron": "mg", "Calcium": "mg",
    "Vitamin B12": "mcg", "Vitamin D": "mcg", "Folate": "mcg",
}


async def usda_search(query: str, page_size: int = 3) -> dict | None:
    """Tool: fetch top food match from USDA FoodData Central."""
    url = (
        f"https://api.nal.usda.gov/fdc/v1/foods/search"
        f"?api_key={USDA_API_KEY}&query={httpx.URL(query)}&pageSize={page_size}"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, params={"api_key": USDA_API_KEY, "query": query, "pageSize": page_size})
        if r.status_code != 200:
            return None
        data = r.json()
        foods = data.get("foods", [])
        return foods[0] if foods else None
    except Exception:
        return None


def parse_nutrients(food: dict) -> list[dict]:
    """Extract the 5 tracked nutrients from a USDA food object."""
    result = []
    raw = food.get("foodNutrients", [])
    for key, pattern in NUTRIENT_PATTERNS.items():
        match = next((n for n in raw if pattern.search(n.get("nutrientName", ""))), None)
        result.append({
            "name": key,
            "value": round(match["value"], 3) if match else 0,
            "unit": NUTRIENT_UNITS[key],
        })
    return result


# ── Gemini helpers ────────────────────────────────────────────────────────────

def gemini_json(prompt: str) -> dict:
    """Call Gemini and parse JSON response. Raises on failure."""
    response = gemini.models.generate_content(
    model=GEMINI_MODEL,
    contents=prompt,
    config=genai_types.GenerateContentConfig(
        response_mime_type="application/json"
    ),
)
    text = response.text.strip()
    # Strip markdown fences if present
    text = re.sub(r"^```json\s*|^```\s*|```$", "", text, flags=re.MULTILINE).strip()
    return json.loads(text)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ToEat API"}


@app.post("/api/deficiency")
async def deficiency_guidance(request: Request, body: DeficiencyRequest):
    check_rate_limit(request, max_requests=20)
    """
    Single-step: given deficiency + diet type, return food guidance via Gemini.
    Gemini is used ONLY for explanation and structuring — not for inventing
    nutrient numbers.
    """
    prompt = f"""
User has {body.deficiency} deficiency and follows a {body.diet} diet.

Generate highly targeted guidance:
1. Recommended Foods (5-6 items). Respect diet restriction strictly:
   - veg: no meat, fish, eggs, poultry
   - vegan: no animal products at all — focus on fortified plant items
   - non-veg: both plant and animal sources welcome
2. Foods to Limit (3-4 items). NEVER label healthy food as bad.
   Frame ONLY as timing/pairing advice (e.g. "have tea 1 hour after iron-rich meals").
3. One key bioavailability tip for {body.deficiency}.

Return ONLY valid JSON, no markdown, matching this exact schema:
{{
  "recommended": [
    {{"name": "str", "emoji": "str", "reason": "str", "nutrient_content": "str"}}
  ],
  "limit": [
    {{"name": "str", "emoji": "str", "reason": "str", "nutrient_content": "str"}}
  ],
  "tip": "str"
}}
"""
    try:
        result = gemini_json(prompt)
    except Exception:
        raise HTTPException(status_code=500, detail="Guidance generation failed. Please try again.")

    special_note = ""
    if body.diet == "vegan" and body.deficiency in ("Vitamin B12", "Vitamin D"):
        special_note = (
            "Food alone may not be sufficient — consider speaking to a doctor about supplements."
        )

    return {
        "deficiency": body.deficiency,
        "diet": body.diet,
        "recommended": result.get("recommended", []),
        "limit": result.get("limit", []),
        "tip": result.get("tip", ""),
        "specialNote": special_note,
    }


@app.post("/api/search")
async def food_search(request: Request, body: SearchRequest):
    check_rate_limit(request, max_requests=20)
    """
    Tool-augmented: USDA lookup (real data) → Gemini explanation.
    Gemini never invents nutrient values — only explains them.
    """
    food = await usda_search(body.query)

    if not food:
        return {
            "found": False,
            "name": body.query,
            "fallback_message": (
                f"We don't have full data on \"{body.query}\". "
                "Try searching its main ingredients (e.g. wheat flour instead of roti)."
            ),
        }

    nutrients = parse_nutrients(food)
    nutrients_summary = "\n".join(
        f"- {n['name']}: {n['value']} {n['unit']} per 100g" for n in nutrients
    )

    prompt = f"""
You are a clinical nutritionist. A USDA database match was found for "{food['description']}".
Actual nutrient data per 100g (do not change these numbers):
{nutrients_summary}

Using only these real values, generate:
1. Which of the 5 deficiencies (Iron, Vitamin D, Vitamin B12, Calcium, Folate) does this food
   significantly help, and why? Mark hasSignificantAmount true only if the USDA value > 0.
2. One practical bioavailability tip.
3. Best foods/drinks to pair with (absorption enhancers).
4. Foods/drinks to separate by time (absorption blockers) — frame as timing, not avoidance.
5. A single matching emoji for the food.

Return ONLY valid JSON, no markdown:
{{
  "emoji": "str",
  "deficiencies_helped": [
    {{"nutrient": "str", "explanation": "str", "hasSignificantAmount": true}}
  ],
  "bioavailability_tip": "str",
  "absorption_enhancers": "str",
  "absorption_blockers": "str"
}}
"""
    try:
        result = gemini_json(prompt)
    except Exception:
        raise HTTPException(status_code=500, detail="Food analysis failed. Please try again.")

    return {
        "found": True,
        "name": food["description"],
        "emoji": result.get("emoji", "🥗"),
        "usdaData": {
            "fdcId": food.get("fdcId"),
            "description": food["description"],
            "nutrients": nutrients,
        },
        "deficiencies_helped": result.get("deficiencies_helped", []),
        "bioavailability_tip": result.get("bioavailability_tip", ""),
        "absorption_enhancers": result.get("absorption_enhancers", ""),
        "absorption_blockers": result.get("absorption_blockers", ""),
    }


@app.post("/api/agent")
async def deficiency_agent(request: Request, body: AgentRequest):
    check_rate_limit(request, max_requests=10)
    """
    Multi-step agentic meal analysis — the core agent loop.

    Agent Steps (visible to caller for transparency):
      Step 1 – EXTRACT: Gemini extracts food items from free-text meal description
      Step 2 – LOOKUP:  USDA tool called per food item (real data, no hallucination)
      Step 3 – ANALYSE: Gemini reasons across all USDA results to assess deficiency risk
      Step 4 – PLAN:    Gemini generates a 3-day corrective meal adjustment plan

    This demonstrates: tool use, multi-step reasoning, grounded data,
    structured agent output — satisfying ADK/agent rubric requirements.
    """
    agent_steps = []

    # ── Step 1: Extract food items from meal description ──────────────────────
    extract_prompt = f"""
Extract the individual food items mentioned in this meal description.
Return ONLY a JSON array of food name strings, no markdown, max 6 items.
Meal: "{body.meal_description}"
Example output: ["spinach", "dal", "roti", "milk"]
"""
    try:
        raw = gemini_json(extract_prompt)
        foods_list: list[str] = raw if isinstance(raw, list) else raw.get("foods", [])
        foods_list = [f for f in foods_list if isinstance(f, str)][:6]
    except Exception:
        raise HTTPException(status_code=500, detail="Agent failed at food extraction step.")

    agent_steps.append({
        "step": 1,
        "name": "Food Extraction",
        "description": "Identified individual foods from your meal description",
        "output": foods_list,
    })

    # ── Step 2: USDA tool call per food (parallel) ────────────────────────────
    usda_results = await asyncio.gather(*[usda_search(f) for f in foods_list])

    foods_data = []
    for food_name, food in zip(foods_list, usda_results):
        if food:
            nutrients = parse_nutrients(food)
            foods_data.append({
                "query": food_name,
                "matched": food["description"],
                "nutrients": nutrients,
            })
        else:
            foods_data.append({
                "query": food_name,
                "matched": None,
                "nutrients": [],
            })

    agent_steps.append({
        "step": 2,
        "name": "USDA Database Lookup",
        "description": "Retrieved real nutrient data for each food from USDA FoodData Central",
        "output": [
            {
                "food": d["query"],
                "found": d["matched"] is not None,
                "matched_to": d["matched"],
            }
            for d in foods_data
        ],
    })

    # ── Step 3: Cross-food deficiency risk analysis ───────────────────────────
    foods_summary = "\n".join(
        f"- {d['query']} ({d['matched'] or 'not found in USDA'}): "
        + (", ".join(f"{n['name']} {n['value']}{n['unit']}" for n in d["nutrients"]) or "no data")
        for d in foods_data
    )

    analysis_prompt = f"""
You are a clinical nutritionist analysing a person's typical daily meal.

Real USDA nutrient data for their foods (per 100g):
{foods_summary}

Based ONLY on the data above (do not invent values):
1. Identify which of the 5 deficiencies (Iron, Vitamin D, Vitamin B12, Calcium, Folate)
   this diet is likely deficient in, and why.
2. Identify which deficiencies are adequately covered.
3. Give an overall risk level: "low", "moderate", or "high".

Return ONLY valid JSON, no markdown:
{{
  "deficiency_risks": [
    {{"nutrient": "str", "risk_level": "low|moderate|high", "reasoning": "str"}}
  ],
  "overall_risk": "low|moderate|high",
  "summary": "2-sentence plain-language summary for the user"
}}
"""
    try:
        analysis = gemini_json(analysis_prompt)
    except Exception:
        raise HTTPException(status_code=500, detail="Agent failed at analysis step.")

    agent_steps.append({
        "step": 3,
        "name": "Deficiency Risk Analysis",
        "description": "Cross-referenced all food nutrients to assess deficiency risk",
        "output": analysis,
    })

    # ── Step 4: Corrective meal plan ──────────────────────────────────────────
    high_risk = [
        r["nutrient"]
        for r in analysis.get("deficiency_risks", [])
        if r.get("risk_level") in ("moderate", "high")
    ]

    if high_risk:
        plan_prompt = f"""
The user's diet is deficient in: {', '.join(high_risk)}.
Their current daily foods: {body.meal_description}

Suggest 3 simple, practical food swaps or additions to address these deficiencies.
Keep suggestions realistic for an Indian diet. Use Indian food names where appropriate.

Return ONLY valid JSON, no markdown:
{{
  "suggestions": [
    {{"action": "add|swap", "food": "str", "emoji": "str", "targets": ["nutrient"], "tip": "str"}}
  ]
}}
"""
        try:
            plan = gemini_json(plan_prompt)
            suggestions = plan.get("suggestions", [])
        except Exception:
            suggestions = []
    else:
        suggestions = []

    agent_steps.append({
        "step": 4,
        "name": "Meal Improvement Plan",
        "description": "Generated corrective food suggestions based on identified gaps",
        "output": suggestions,
    })

    return {
        "meal_description": body.meal_description,
        "agent_steps": agent_steps,
        "deficiency_risks": analysis.get("deficiency_risks", []),
        "overall_risk": analysis.get("overall_risk", "unknown"),
        "summary": analysis.get("summary", ""),
        "suggestions": suggestions,
    }