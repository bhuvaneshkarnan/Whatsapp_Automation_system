"""
Gemini AI provider — uses per-tenant API keys.
Each client provides their own Google AI Studio key.
Fallback: rule engine (no external call).
"""
import time
import httpx
import structlog

logger = structlog.get_logger()


class GeminiError(Exception):
    pass


async def call_gemini(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    max_tokens: int,
    temperature: float,
    timeout_seconds: float,
    tenant_id: str,
) -> str:
    """
    Call Google Gemini API with the client's own API key.

    Args:
        messages:         Conversation history [{role, content}]
        api_key:          Client's own Gemini API key (from tenant_credentials)
        system_prompt:    Business-specific system prompt
        max_tokens:       Max output tokens
        temperature:      Sampling temperature
        timeout_seconds:  Request timeout
        tenant_id:        For logging

    Returns:
        Response text from Gemini

    Raises:
        GeminiError: On non-200 response or timeout
    """
    start = time.monotonic()

    # Build Gemini request body
    # Convert {role: user/assistant, content: str} → Gemini format
    contents = []
    for msg in messages:
        gemini_role = "user" if msg["role"] == "user" else "model"
        contents.append({
            "role": gemini_role,
            "parts": [{"text": msg["content"]}],
        })

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
            "candidateCount": 1,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ],
    }

    model = "gemini-1.5-flash"  # Fast and cheap; upgrade to gemini-1.5-pro per tenant if needed
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(url, json=payload)
    except httpx.TimeoutException:
        raise GeminiError(f"Gemini timeout after {timeout_seconds}s")
    except httpx.RequestError as e:
        raise GeminiError(f"Gemini request error: {e}")

    latency_ms = int((time.monotonic() - start) * 1000)

    if response.status_code == 429:
        raise GeminiError("Gemini rate limited (429) — falling back to rule engine")
    if response.status_code != 200:
        raise GeminiError(f"Gemini HTTP {response.status_code}: {response.text[:200]}")

    try:
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        logger.info("gemini_success", tenant_id=tenant_id, latency_ms=latency_ms, tokens=max_tokens)
        return text.strip()
    except (KeyError, IndexError) as e:
        raise GeminiError(f"Gemini response parse error: {e} — raw: {response.text[:200]}")
