# Perfume Research Task — Redo Batch

For each item in the attached JSON array, research the fragrance and return a complete record with this exact schema for every item:

```json
{
  "row": <same row number as input>,
  "brand": "",
  "gender": "Men" | "Women" | "Unisex" | "",
  "concentration": "EDP" | "EDT" | "EDC" | "Parfum" | "Extrait de Parfum" | "Elixir" | "Cologne" | "Perfume Oil" | "Body Mist" | "Hair Mist" | "",
  "size": "<number> ML" (or GM/G/PCS),
  "category": "Perfume" | "Body Spray" | "Body Mist" | "Hair Mist" | "Perfume Oil" | "Deodorant" | "Gift Set" | "Home Fragrance" | "Bakhoor" | "Charcoal" | "Body Lotion" | "Shower Gel" | "Other" | "",
  "scent_family": "",
  "main_accord": "",
  "top_notes": "",
  "heart_notes": "",
  "base_notes": "",
  "occasion": "",
  "country_of_origin": "",
  "description_en": "2-3 sentence description",
  "description_ar": "Arabic translation of the description",
  "status": "Verified" | "Needs check: <comma-separated list of missing fields>" | "Needs check: could not identify fragrance",
  "sources": "single URL as plain text (not markdown [text](url) format)"
}
```

## Sources — IMPORTANT CHANGE FROM LAST TIME

These items were NOT found or only partially found using Fragrantica alone. This time, please also search and use these additional authentic sources when Fragrantica doesn't have the fragrance or is missing note details:

- The brand's own official website / official online store (most reliable for niche, private-label, or newer releases)
- Parfumo.com
- Basenotes.com
- Sephora, Nordstrom, or other major authorized retailer product pages (for gender, size, concentration, and description — not just marketing copy)
- Notino.com, FragranceX.com, FragranceNet.com (for product specs like size/concentration when the brand site lacks them)
- Official regional distributor sites (many of these are Middle Eastern/Gulf market brands — Arabic-market retailer sites like ounass.com, sephora.ae, or the brand's own .ae/.sa site are often useful)

If a brand name in the input looks garbled, all-caps, or like a private-label/unofficial name (e.g. "GEPRALYS", "MAISON VIP", "FRAGRANCE WORLD"), please still attempt a web search for that exact spelling plus "perfume" — many of these are real (often UAE/Gulf-market) brands that just aren't on Fragrantica.

## Rules (same as before)

- "Oriental" in scent family should be written as "Amber"
- country_of_origin: only fill in if you find an explicit "Made in X" statement — otherwise leave blank
- occasion: always leave as "" (blank) — do not fill this in
- For clone/dupe fragrances, do not borrow notes from the "inspired by" designer original — only use notes confirmed for this specific product
- sources: put the single best URL as plain text — do NOT use markdown format like [text](url)
- If truly nothing can be found after checking multiple sources above, set status to "Needs check: could not identify fragrance" and leave sources blank

## Output

Return ONLY a valid JSON array, one object per input row, in the same row order. Do not skip any rows — even the ones you cannot find should be included with a "Needs check: could not identify fragrance" status.
