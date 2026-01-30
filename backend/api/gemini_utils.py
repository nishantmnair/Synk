"""
Server-side Gemini API calls. API key is read from GEMINI_API_KEY (backend .env).
Uses stdlib urllib only (no extra dependencies).
"""
import json
import os
import urllib.request
import urllib.error

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
MODEL = "gemini-2.0-flash"


def _get_api_key():
    return (os.environ.get("GEMINI_API_KEY") or "").strip()


def _call_gemini(prompt: str, response_mime_type: str = "application/json", response_schema: dict = None):
    """Call Gemini generateContent; returns parsed JSON or raw text."""
    api_key = _get_api_key()
    if not api_key:
        return None

    url = f"{GEMINI_BASE}/models/{MODEL}:generateContent?key={api_key}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 1024,
        },
    }
    if response_mime_type:
        body["generationConfig"]["responseMimeType"] = response_mime_type
    if response_schema:
        body["generationConfig"]["responseSchema"] = response_schema

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError):
        return None

    try:
        text = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    except (IndexError, KeyError, TypeError):
        return None
    if not text:
        return None
    if response_mime_type == "application/json":
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None
    return text


def generate_date_idea(vibe: str, hint=None):
    """Return {title, description, location, category} or None. hint: optional int/str for variety on "Try another"."""
    prompt = (
        f'Suggest a creative date idea for a couple who is currently feeling: "{vibe}". '
        'Provide a catchy title, a short description (1-2 sentences), a location type (e.g. "Outdoors", "Home", "Restaurant"), '
        'and an optional category (e.g. "Adventure", "Romantic", "Cozy", "Active"). '
        'Respond with JSON only: {"title": "...", "description": "...", "location": "...", "category": "..."}.'
    )
    if hint is not None:
        prompt += (
            f' This is a follow-up request (hint: {hint}) - suggest a *different* type of date '
            '(different activity, setting, or vibe) so the user gets variety.'
        )
    schema = {
        "type": "OBJECT",
        "properties": {
            "title": {"type": "STRING"},
            "description": {"type": "STRING"},
            "location": {"type": "STRING"},
            "category": {"type": "STRING"},
        },
        "required": ["title", "description", "location"],
    }
    result = _call_gemini(prompt, response_mime_type="application/json", response_schema=schema)
    if not result:
        return None
    return {
        "title": (result.get("title") or "Date idea").strip(),
        "description": (result.get("description") or "").strip(),
        "location": (result.get("location") or "Anywhere").strip(),
        "category": (result.get("category") or "Date idea").strip(),
    }


def get_pro_tip(milestones_summary: str):
    """Return a short pro tip string or None."""
    prompt = (
        f"Based on this couple's road map: {milestones_summary}. "
        'Give them one short, romantic, and actionable "Pro Tip" or encouragement to reach their goals. Keep it under 25 words.'
    )
    return _call_gemini(prompt, response_mime_type=None)


def get_daily_connection_prompt():
    """Return a single conversation starter string or None."""
    prompt = (
        "Generate a single, deep, or fun conversation starter for a couple to ask each other today. "
        "It should be one sentence and promote intimacy or laughter."
    )
    return _call_gemini(prompt, response_mime_type=None)
