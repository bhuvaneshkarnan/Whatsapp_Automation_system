"""
Multi-LLM Provider Router.
Supports:
  1. Google Gemini (1.5 Flash / 2.0 Flash)
  2. Groq (Llama 3.3 70B Versatile, Llama 3.1 8B Instant)
  3. OpenCode / OpenAI / OpenRouter / DeepSeek Compatible
  4. Automatic Cascading Fallback & Rule Engine
"""
import re
import time
import httpx
import structlog
from typing import Optional, Tuple

logger = structlog.get_logger()


class LLMError(Exception):
    pass


def clean_llm_response(text: str) -> str:
    """
    Strips internal thinking process (<think>...</think>), reasoning blocks,
    and markdown wrappers so WhatsApp messages are clean, crisp, and direct.
    Also normalizes unnatural artificial line gaps into natural WhatsApp flow.
    """
    if not text:
        return ""
    # Strip <think>...</think> tags and everything between them
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    # If unclosed <think> remains, strip from that point
    if "<think>" in cleaned.lower():
        cleaned = re.split(r"<think>", cleaned, flags=re.IGNORECASE)[0]
    if "</think>" in cleaned.lower():
        cleaned = re.split(r"</think>", cleaned, flags=re.IGNORECASE)[-1]

    cleaned = cleaned.strip()
    # If whole message is wrapped in ```, unwrap
    if cleaned.startswith("```") and cleaned.endswith("```"):
        lines = cleaned.split("\n")
        if len(lines) >= 2:
            cleaned = "\n".join(lines[1:-1])

    # Connect short conversational openers that have artificial double newlines (e.g. "Awesome\n\nI have..." -> "Awesome, I have...")
    cleaned = re.sub(
        r'^(Awesome|Got it|Sure thing|Sure|Thanks|Thanks for sharing that|Great|Hey there|Hey|Hello|Hi)\s*\n+([A-Z0-9])',
        r'\1, \2',
        cleaned,
        flags=re.IGNORECASE
    )
    # Collapse 3+ newlines into 1
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    return cleaned.strip()


def sanitize_conversation_history(messages: list[dict]) -> list[dict]:
    """
    Ensures:
    1. Only non-empty strings.
    2. Consecutive messages with same role are combined cleanly.
    3. The FINAL message in the array is GUARANTEED to have role == 'user'.
    """
    if not messages:
        return [{"role": "user", "content": "Hello"}]

    cleaned = []
    for m in messages:
        role = "user" if m.get("role") == "user" else "assistant"
        content = (m.get("content") or "").strip()
        if not content:
            continue
        if cleaned and cleaned[-1]["role"] == role:
            cleaned[-1]["content"] += f"\n{content}"
        else:
            cleaned.append({"role": role, "content": content})

    if not cleaned:
        return [{"role": "user", "content": "Hello"}]

    # Keep only the last 12 messages for ultra-fast, lightweight context
    if len(cleaned) > 12:
        cleaned = cleaned[-12:]

    # Ensure starts with user
    if cleaned[0]["role"] != "user":
        cleaned = [{"role": "user", "content": "Hello"}] + cleaned

    # Ensure ends with user
    if cleaned[-1]["role"] != "user":
        cleaned.append({"role": "user", "content": "Hello"})

    return cleaned


async def call_gemini(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    model: str = "gemini-3.5-flash-lite",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 12.0,
    tenant_id: str = "",
) -> str:
    """Call Google Gemini API with automatic model failover."""
    start = time.monotonic()
    sanitized = sanitize_conversation_history(messages)
    contents = []
    for msg in sanitized:
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
    }

    # Verified active Gemini models with gemini-3.5-flash-lite as main
    candidate_models = [
        model or "gemini-3.5-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-flash-latest",
    ]
    candidate_models = list(dict.fromkeys(candidate_models))

    last_err = None
    for m in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                response = await client.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = clean_llm_response(text)
                if cleaned:
                    latency_ms = int((time.monotonic() - start) * 1000)
                    logger.info("gemini_success", tenant_id=tenant_id, model=m, latency_ms=latency_ms)
                    return cleaned
            elif response.status_code == 429:
                last_err = f"Gemini {m} rate limited (429)"
            else:
                last_err = f"Gemini {m} HTTP {response.status_code}: {response.text[:150]}"
        except httpx.TimeoutException:
            last_err = f"Gemini {m} timeout after {timeout_seconds}s"
        except httpx.RequestError as e:
            last_err = f"Gemini {m} network error: {e}"
        except Exception as e:
            last_err = f"Gemini {m} parse error: {e}"

    raise LLMError(last_err or "Gemini API call failed")


async def call_groq(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    model: str = "openai/gpt-oss-120b",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 4.0,
    tenant_id: str = "",
) -> str:
    """
    Call Groq API with ultra-fast LPU inference and verified 128k active models.
    """
    start = time.monotonic()
    url = "https://api.groq.com/openai/v1/chat/completions"

    sanitized = sanitize_conversation_history(messages)
    formatted_msgs = [{"role": "system", "content": system_prompt}]
    for m in sanitized:
        formatted_msgs.append({"role": m["role"], "content": m["content"]})

    # Verified 128k context high-capacity models on Groq
    candidate_models = [
        model or "openai/gpt-oss-120b",
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "qwen/qwen3.6-27b",
    ]
    candidate_models = list(dict.fromkeys(candidate_models))

    last_err = None
    for m in candidate_models:
        payload = {
            "model": m,
            "messages": formatted_msgs,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload,
                )
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                cleaned = clean_llm_response(text)
                if cleaned:
                    latency_ms = int((time.monotonic() - start) * 1000)
                    logger.info("groq_success", tenant_id=tenant_id, model=m, latency_ms=latency_ms)
                    return cleaned
            elif response.status_code == 429:
                last_err = f"Groq {m} rate limited (429)"
            else:
                last_err = f"Groq {m} HTTP {response.status_code}: {response.text[:150]}"
        except httpx.TimeoutException:
            last_err = f"Groq {m} timeout after {timeout_seconds}s"
        except httpx.RequestError as e:
            last_err = f"Groq {m} network error: {e}"
        except Exception as e:
            last_err = f"Groq {m} parse error: {e}"

    raise LLMError(last_err or "Groq API call failed")


async def call_opencode(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    base_url: str = "https://api.openai.com/v1",
    model: str = "gpt-4o-mini",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 10.0,
    tenant_id: str = "",
) -> str:
    """
    Call OpenCode / OpenAI / OpenRouter / DeepSeek compatible endpoint.
    """
    start = time.monotonic()
    clean_base = base_url.rstrip("/")
    if not clean_base.endswith("/chat/completions"):
        url = f"{clean_base}/chat/completions"
    else:
        url = clean_base

    formatted_msgs = [{"role": "system", "content": system_prompt}]
    for m in messages:
        formatted_msgs.append({"role": m["role"], "content": m["content"]})

    candidate_models = [
        model or "gpt-4o-mini",
        "gpt-4o-mini",
        "deepseek-chat",
        "gpt-4o",
        "qwen/qwen-2.5-72b-instruct",
    ]
    candidate_models = list(dict.fromkeys(candidate_models))

    last_err = None
    for m in candidate_models:
        payload = {
            "model": m,
            "messages": formatted_msgs,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload,
                )
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                cleaned = clean_llm_response(text)
                if cleaned:
                    latency_ms = int((time.monotonic() - start) * 1000)
                    logger.info("opencode_success", tenant_id=tenant_id, model=m, latency_ms=latency_ms)
                    return cleaned
            elif response.status_code == 429:
                last_err = f"OpenCode {m} rate limited (429)"
            else:
                last_err = f"OpenCode {m} HTTP {response.status_code}: {response.text[:150]}"
        except httpx.TimeoutException:
            last_err = f"OpenCode {m} timeout after {timeout_seconds}s"
        except httpx.RequestError as e:
            last_err = f"OpenCode {m} network error: {e}"
        except Exception as e:
            last_err = f"OpenCode {m} parse error: {e}"

    raise LLMError(last_err or "OpenCode API call failed")


async def call_llm_cascade(
    messages: list[dict],
    system_prompt: str,
    gemini_key: Optional[str] = None,
    groq_key: Optional[str] = None,
    opencode_key: Optional[str] = None,
    opencode_base_url: str = "https://api.openai.com/v1",
    primary_provider: str = "gemini",
    gemini_model: str = "gemini-flash-lite-latest",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 10.0,
    tenant_id: str = "",
) -> Tuple[Optional[str], str]:
    """
    Intelligent Multi-LLM Cascading Router:
    1. If primary fails -> cascades to secondary -> cascades to tertiary.
    Returns (response_text, provider_name_used).
    """
    # Build strict fallback order based on primary configuration
    providers = []
    if primary_provider == "groq":
        providers = [
            ("groq", groq_key),
            ("gemini", gemini_key),
            ("opencode", opencode_key)
        ]
    elif primary_provider == "opencode":
        providers = [
            ("opencode", opencode_key),
            ("gemini", gemini_key),
            ("groq", groq_key)
        ]
    else:
        # Default: Gemini -> Groq -> OpenCode
        providers = [
            ("gemini", gemini_key),
            ("groq", groq_key),
            ("opencode", opencode_key)
        ]

    for name, key in providers:
        if not key:
            continue

        try:
            if name == "gemini":
                text = await call_gemini(
                    messages=messages,
                    api_key=key,
                    system_prompt=system_prompt,
                    model="gemini-3.5-flash-lite",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=timeout_seconds,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    return text, "gemini"

            elif name == "groq":
                text = await call_groq(
                    messages=messages,
                    api_key=key,
                    system_prompt=system_prompt,
                    model="openai/gpt-oss-120b",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=timeout_seconds,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    return text, "groq"

            elif name == "opencode":
                text = await call_opencode(
                    messages=messages,
                    api_key=key,
                    base_url=opencode_base_url or "https://api.openai.com/v1",
                    system_prompt=system_prompt,
                    model=opencode_model or "gpt-4o-mini",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=timeout_seconds,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    return text, "opencode"

        except Exception as e:
            logger.warning(
                "llm_provider_failed_cascading",
                tenant_id=tenant_id,
                provider=name,
                error=str(e),
            )
            continue

    # Emergency single-turn recovery
    latest_user_text = ""
    for m in reversed(messages):
        if m.get("role") == "user" and m.get("content"):
            latest_user_text = m["content"]
            break

    if latest_user_text:
        emergency_messages = [{"role": "user", "content": latest_user_text}]
        if gemini_key:
            try:
                text = await call_gemini(
                    messages=emergency_messages,
                    api_key=gemini_key,
                    system_prompt=system_prompt,
                    model="gemini-3.5-flash-lite",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=10.0,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    logger.info("emergency_single_turn_gemini_success", tenant_id=tenant_id)
                    return text, "gemini"
            except Exception:
                pass

        if groq_key:
            try:
                text = await call_groq(
                    messages=emergency_messages,
                    api_key=groq_key,
                    system_prompt=system_prompt,
                    model="openai/gpt-oss-120b",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=6.0,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    logger.info("emergency_single_turn_groq_success", tenant_id=tenant_id)
                    return text, "groq"
            except Exception:
                pass

    return None, "fallback"
