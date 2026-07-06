"""
ToEat Agent CLI — Agent Skills Demonstration
============================================
Run from the backend/ directory:

  python agent_cli.py "I eat dal, roti, spinach, and milk daily"

This script calls the /api/agent endpoint locally and prints
a structured step-by-step deficiency analysis to the terminal.

Demonstrates: Agent Skills (agents-cli equivalent workflow),
multi-step tool use, and grounded USDA data retrieval.
"""

import sys
import json
import httpx

BASE_URL = "http://localhost:8000"


def colour(text: str, code: str) -> str:
    return f"\033[{code}m{text}\033[0m"


def print_step(step: dict):
    n = step["step"]
    name = step["name"]
    desc = step["description"]
    output = step["output"]

    print(colour(f"\n── Step {n}: {name} ──────────────────────────", "36"))
    print(colour(f"   {desc}", "37"))

    if isinstance(output, list) and output and isinstance(output[0], str):
        print("   Foods identified:", colour(", ".join(output), "32"))

    elif isinstance(output, list) and output and isinstance(output[0], dict):
        for item in output:
            if "food" in item:
                status = colour("✓ found", "32") if item.get("found") else colour("✗ not found", "33")
                print(f"   {item['food']}: {status}", end="")
                if item.get("matched_to"):
                    print(f" → {item['matched_to']}", end="")
                print()
            elif "nutrient" in item:
                risk = item.get("risk_level", "")
                col = "31" if risk == "high" else "33" if risk == "moderate" else "32"
                print(f"   {item['nutrient']}: {colour(risk.upper(), col)} — {item.get('reasoning','')[:80]}...")

    elif isinstance(output, dict):
        if "summary" in output:
            print(colour(f"   {output['summary']}", "37"))
        if "overall_risk" in output:
            risk = output["overall_risk"]
            col = "31" if risk == "high" else "33" if risk == "moderate" else "32"
            print(f"   Overall risk: {colour(risk.upper(), col)}")

    elif isinstance(output, list) and output:
        for s in output:
            if isinstance(s, dict) and "food" in s:
                emoji = s.get("emoji", "")
                action = s.get("action", "add").upper()
                targets = ", ".join(s.get("targets", []))
                tip = s.get("tip", "")
                print(f"   {emoji} [{action}] {s['food']} → helps: {targets}")
                print(f"       {colour(tip, '37')}")


def main():
    if len(sys.argv) < 2:
        print(colour("Usage: python agent_cli.py \"<your daily meal description>\"", "33"))
        print('Example: python agent_cli.py "I eat dal, roti, spinach, and curd daily"')
        sys.exit(1)

    meal = " ".join(sys.argv[1:])

    print(colour("\n🥗 ToEat Deficiency Agent", "1;32"))
    print(colour("─" * 50, "32"))
    print(f"Analysing meal: {colour(meal, '1')}\n")

    try:
        r = httpx.post(
            f"{BASE_URL}/api/agent",
            json={"meal_description": meal},
            timeout=30.0,
        )
        r.raise_for_status()
        data = r.json()
    except httpx.ConnectError:
        print(colour("✗ Cannot connect to ToEat API. Make sure the server is running:", "31"))
        print("  cd backend && uvicorn main:app --reload")
        sys.exit(1)
    except Exception as e:
        print(colour(f"✗ Error: {e}", "31"))
        sys.exit(1)

    for step in data.get("agent_steps", []):
        print_step(step)

    print(colour("\n── Final Assessment ─────────────────────────", "36"))
    print(colour(f"   {data.get('summary', '')}", "37"))

    risks = data.get("deficiency_risks", [])
    if risks:
        print()
        for r in risks:
            risk = r.get("risk_level", "")
            col = "31" if risk == "high" else "33" if risk == "moderate" else "32"
            print(f"   {r['nutrient']}: {colour(risk.upper(), col)}")

    print(colour("\n── Medical Disclaimer ────────────────────────", "90"))
    print(colour(
        "   This analysis is for informational purposes only.\n"
        "   Always consult a physician before changing your diet.",
        "90"
    ))
    print()


if __name__ == "__main__":
    main()
