import traceback
import textwrap
import main

prompt = textwrap.dedent("""User has Iron deficiency and follows a veg diet.

Generate highly targeted guidance:
1. Recommended Foods (5-6 items). Respect diet restriction strictly:
   - veg: no meat, fish, eggs, poultry
   - vegan: no animal products at all — focus on fortified plant items
   - non-veg: both plant and animal sources welcome
2. Foods to Limit (3-4 items). NEVER label healthy food as bad.
   Frame ONLY as timing/pairing advice (e.g. \"have tea 1 hour after iron-rich meals\").
3. One key bioavailability tip for Iron.

Return ONLY valid JSON, no markdown, matching this exact schema:
{
  \"recommended\": [
    {\"name\": \"str\", \"emoji\": \"str\", \"reason\": \"str\", \"nutrient_content\": \"str\"}
  ],
  \"limit\": [
    {\"name\": \"str\", \"emoji\": \"str\", \"reason\": \"str\", \"nutrient_content\": \"str\"}
  ],
  \"tip\": \"str\"
}
""")

try:
    print('GEMINI_KEY_SET', bool(main.GEMINI_API_KEY))
    result = main.gemini_json(prompt)
    print('RESULT', result)
except Exception:
    traceback.print_exc()
