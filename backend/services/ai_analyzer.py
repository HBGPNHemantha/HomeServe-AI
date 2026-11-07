import os
import re
import json
from typing import Dict, Any, List

def analyze_call_with_heuristic(
    transcript: str,
    caller_phone: str = "",
    caller_name: str = "",
    emergency_keywords: str = ""
) -> Dict[str, Any]:
    text_lower = transcript.lower()

    # 1. Detect Urgency
    default_keywords = [
        "burst pipe", "gas odor", "flooding", "smoke", "fire",
        "electrical fire", "no heat", "no ac", "water pouring", "active leak", "emergency"
    ]
    if emergency_keywords:
        custom_kw = [k.strip().lower() for k in emergency_keywords.split(",") if k.strip()]
        keywords_to_check = custom_kw or default_keywords
    else:
        keywords_to_check = default_keywords

    is_emergency = any(kw in text_lower for kw in keywords_to_check)
    urgency = "emergency" if is_emergency else "standard"

    # 2. Detect Service Type
    service_type = "Plumbing"
    if any(k in text_lower for k in ["ac", "air condition", "hvac", "heat", "furnace", "thermostat", "cooling", "filter"]):
        service_type = "HVAC"
    elif any(k in text_lower for k in ["breaker", "electric", "wiring", "outlet", "power outage", "fuse", "short circuit"]):
        service_type = "Electrical"
    elif any(k in text_lower for k in ["roof", "shingle", "gutter", "hail damage", "tile"]):
        service_type = "Roofing"
    elif any(k in text_lower for k in ["clean", "maid", "move-out", "deep clean", "vacuum", "carpet"]):
        service_type = "Cleaning"
    elif any(k in text_lower for k in ["pipe", "leak", "faucet", "drain", "toilet", "clog", "sink", "water pressure"]):
        service_type = "Plumbing"
    elif is_emergency:
        service_type = "Emergency"

    # 3. Extract Name if not provided
    name = caller_name
    if not name or name.lower() in ["unknown", "caller"]:
        name_match = re.search(r"(?:my name is|this is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", transcript, re.IGNORECASE)
        if name_match:
            name = name_match.group(1).title()
        else:
            name = "Inbound Caller"

    # 4. Extract Address
    address = "Austin, TX"
    addr_match = re.search(r"(\d{3,5}\s+[A-Za-z0-9\s,\.]+?(?:St|Street|Rd|Road|Dr|Drive|Ave|Avenue|Blvd|Lane|Way|Ct|Court)(?:,\s*[A-Za-z\s]+)?(?:\s*\d{5})?)", transcript, re.IGNORECASE)
    if addr_match:
        address = addr_match.group(1).strip()

    # 5. Calculate Lead Score
    score = 55
    if is_emergency:
        score += 30
    if address != "Austin, TX":
        score += 10
    if any(k in text_lower for k in ["book", "appointment", "schedule", "tomorrow", "today", "slot", "come out", "quote"]):
        score += 15
    if len(transcript) < 50:
        score -= 25 # very short/dropped call
    score = max(15, min(98, score))

    # 6. Assign Tier
    if score >= 85:
        tier = "hot"
    elif score >= 65:
        tier = "warm"
    elif score >= 45:
        tier = "cold"
    else:
        tier = "new"

    # 7. Estimated Value
    value_map = {
        "Plumbing": 650,
        "HVAC": 850,
        "Electrical": 450,
        "Roofing": 2800,
        "Cleaning": 380,
        "Emergency": 1200
    }
    est_value = value_map.get(service_type, 500)
    if is_emergency and service_type != "Emergency":
        est_value = int(est_value * 1.5)

    # 8. Generate Summary
    if is_emergency:
        summary = f"Emergency {service_type.lower()} request detected from {name}. Immediate assistance required."
    else:
        summary = f"Customer {name} called regarding {service_type.lower()} service. Intake completed."

    return {
        "summary": summary,
        "service_type": service_type,
        "lead_score": score,
        "tier": tier,
        "urgency": urgency,
        "customer_name": name,
        "address": address,
        "estimated_value": float(est_value)
    }

async def analyze_call_transcript(
    transcript: str,
    caller_phone: str = "",
    caller_name: str = "",
    emergency_keywords: str = "",
    api_key: str = ""
) -> Dict[str, Any]:
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        return analyze_call_with_heuristic(transcript, caller_phone, caller_name, emergency_keywords)

    try:
        from google import genai
        client = genai.Client(api_key=key)

        prompt = f"""
You are an expert dispatcher and intake analyst for HomeServe AI, an emergency and home service provider.
Analyze the following phone call transcript and return a JSON object with these exact keys:
- "summary": A concise 1-2 sentence summary of what the customer needed and what action was taken.
- "service_type": Exactly one of ["Plumbing", "HVAC", "Electrical", "Roofing", "Cleaning", "Emergency"].
- "lead_score": An integer from 0 to 100 representing lead quality and purchase intent.
- "tier": Exactly one of ["hot", "warm", "cold", "new"] (score >=85 is hot, >=65 is warm, >=45 is cold).
- "urgency": Exactly "emergency" or "standard". Look for active water leaks, smoke, power outages in heat/freeze, gas smells.
- "customer_name": Extracted caller's full name, or "{caller_name or 'Inbound Caller'}" if not stated.
- "address": Extracted street address or "Austin, TX".
- "estimated_value": An estimated dollar job value as a number (e.g. 850).

Transcript:
\"\"\"{transcript}\"\"\"

Return ONLY valid JSON.
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        raw_text = response.text.strip()
        # Clean json markdown tags if returned
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\n", "", raw_text)
            raw_text = re.sub(r"\n```$", "", raw_text)

        data = json.loads(raw_text)
        return {
            "summary": data.get("summary", "Inbound call processed."),
            "service_type": data.get("service_type", "Plumbing"),
            "lead_score": int(data.get("lead_score", 75)),
            "tier": data.get("tier", "warm"),
            "urgency": data.get("urgency", "standard"),
            "customer_name": data.get("customer_name") or caller_name or "Inbound Caller",
            "address": data.get("address", "Austin, TX"),
            "estimated_value": float(data.get("estimated_value", 650))
        }
    except Exception as e:
        print(f"Gemini API analysis failed or key invalid ({e}), falling back to heuristic analysis")
        return analyze_call_with_heuristic(transcript, caller_phone, caller_name, emergency_keywords)

