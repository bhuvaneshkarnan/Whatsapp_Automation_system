"""
Multi-LLM Provider Router.
Supports:
  1. Google Gemini (1.5 Flash / 2.0 Flash)
  2. Groq (Llama 3.3 70B Versatile, Llama 3.1 8B Instant)
  3. OpenCode / OpenAI / OpenRouter / DeepSeek Compatible
  4. Automatic Cascading Fallback & Rule Engine
"""
import asyncio
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


def strip_repetitive_greetings(text: str) -> str:
    """
    In ongoing conversations (turn 2+), strip repetitive, robotic greetings like
    'Hi again!', 'Hello again!', 'Hey again!', or 'Hi [Name]! Thanks for sharing...'
    so the assistant dives straight into conversation like a real person.
    """
    if not text:
        return ""
    # Strip "Hi again!", "Hello again!", "Hey again!"
    t = re.sub(r'^(hi\s+again|hello\s+again|hey\s+again)[!,\.]*\s*', '', text, flags=re.IGNORECASE)
    # Strip "Hi Bhuvanesh! Thanks for sharing..." or "Hi! Thanks for sharing..."
    t = re.sub(
        r'^(hi|hello|hey)(\s+[a-zA-Z]+)?[!,\.]*\s*(thanks|thank you|got it|makes sense|sorry|sure|absolutely|i understand|do you|are you|can you|how|what|when|where|why|that|we|i\b)',
        r'\3',
        t,
        flags=re.IGNORECASE
    )
    t = t.strip()
    if t and len(t) > 0:
        t = t[0].upper() + t[1:]
    return t


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
    model: str = "gemini-3.1-flash-lite",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 4.0,
    tenant_id: str = "",
) -> str:
    """Call Google Gemini API with automatic model failover using verified active models."""
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
            "maxOutputTokens": min(max_tokens, 350),
            "temperature": temperature,
            "candidateCount": 1,
        },
    }

    # Verified active Gemini models; gemini-3.1-flash-lite is the fastest and active
    candidate_models = ["gemini-3.1-flash-lite"]
    if model and model == "gemini-3.1-flash-lite":
        candidate_models = [model]

    last_err = None
    req_timeout = timeout_seconds
    for m in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=req_timeout) as client:
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
            last_err = f"Gemini {m} timeout after {req_timeout}s"
        except httpx.RequestError as e:
            last_err = f"Gemini {m} network error: {e}"
        except Exception as e:
            last_err = f"Gemini {m} parse error: {e}"

    raise LLMError(last_err or "Gemini API call failed")


async def call_groq(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    model: str = "qwen/qwen3.8-27b",
    max_tokens: int = 350,
    temperature: float = 0.3,
    timeout_seconds: float = 3.0,
    tenant_id: str = "",
) -> str:
    """
    Call Groq API with ultra-fast LPU inference (sub-500ms latency) and verified active models.
    """
    start = time.monotonic()
    url = "https://api.groq.com/openai/v1/chat/completions"

    sanitized = sanitize_conversation_history(messages)
    formatted_msgs = [{"role": "system", "content": system_prompt}]
    for m in sanitized:
        formatted_msgs.append({"role": m["role"], "content": m["content"]})

    # Verified active models on Groq: qwen/qwen3.8-27b (fastest) and groq/compound-mini (70k TPM high volume fallback)
    candidate_models = []
    if model and model in ["qwen/qwen3.8-27b", "groq/compound-mini"]:
        candidate_models.append(model)
    candidate_models.extend(["qwen/qwen3.8-27b", "groq/compound-mini"])
    candidate_models = list(dict.fromkeys(candidate_models))

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "WhatsAppAutomation/1.0 (Linux; x86_64)",
    }

    last_err = None
    req_timeout = min(timeout_seconds, 2.5)
    toks = min(max_tokens, 350)
    for m in candidate_models:
        payload = {
            "model": m,
            "messages": formatted_msgs,
            "max_tokens": toks,
            "temperature": temperature,
        }

        try:
            async with httpx.AsyncClient(timeout=req_timeout) as client:
                response = await client.post(
                    url,
                    headers=headers,
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
            last_err = f"Groq {m} timeout after {req_timeout}s"
        except httpx.RequestError as e:
            last_err = f"Groq {m} network error: {e}"
        except Exception as e:
            last_err = f"Groq {m} parse error: {e}"

    raise LLMError(last_err or "Groq API call failed")


async def call_opencode(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    base_url: str = "https://opencode.ai/zen/v1",
    model: str = "nemotron-3.5-lightning-free",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 10.0,
    tenant_id: str = "",
) -> str:
    """
    Call OpenCode / OpenAI / OpenRouter / DeepSeek compatible endpoint.
    Supports OpenCode Zen endpoint (https://opencode.ai/zen/v1) and custom OpenAI-compatible endpoints.
    """
    start = time.monotonic()
    clean_base = (base_url or "https://opencode.ai/zen/v1").rstrip("/")
    if not clean_base.endswith("/chat/completions"):
        url = f"{clean_base}/chat/completions"
    else:
        url = clean_base

    formatted_msgs = [{"role": "system", "content": system_prompt}]
    for m in messages:
        formatted_msgs.append({"role": m["role"], "content": m["content"]})

    # If OpenCode Zen or key starts with sk-PUap
    if "opencode" in clean_base or (api_key and api_key.startswith("sk-PUap")):
        if "opencode.ai" not in clean_base:
            url = "https://opencode.ai/zen/v1/chat/completions"
        candidate_models = [
            model,
            "nemotron-3.5-lightning-free",
            "mimo-v2.5-free",
            "gpt-5.4-mini",
            "gemini-3.5-flash-lite",
            "claude-haiku-4-5",
            "deepseek-v4-flash-free",
        ]
    else:
        candidate_models = [
            model or "gpt-4o-mini",
            "gpt-4o-mini",
            "deepseek-chat",
            "gpt-4o",
            "qwen/qwen-2.5-72b-instruct",
        ]
    candidate_models = [m for m in candidate_models if m]
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
    opencode_base_url: str = "https://opencode.ai/zen/v1",
    primary_provider: str = "groq",
    gemini_model: str = "gemini-3.1-flash-lite",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 4.0,
    tenant_id: str = "",
) -> Tuple[Optional[str], str]:
    """
    Ultra-Fast Multi-LLM Cascading Router with 3-Model Fallback:
    1. Primary (Groq / Gemini) executes with ultra-fast latency.
    2. If primary fails or is rate-limited, secondary model seamlessly provides reply.
    3. If both primary & secondary fail, tertiary 3rd model (OpenCode) executes and replies.
    """
    racer_ran = False
    # ── Ultra-Fast Racer: Groq & Gemini concurrently ──
    if groq_key and gemini_key and primary_provider != "opencode":
        racer_ran = True
        effective_max_tokens = min(max_tokens, 350)

        async def _run_groq():
            return await call_groq(
                messages=messages,
                api_key=groq_key,
                system_prompt=system_prompt,
                model="qwen/qwen3.8-27b",
                max_tokens=effective_max_tokens,
                temperature=temperature,
                timeout_seconds=3.0,
                tenant_id=tenant_id,
            ), "groq"

        async def _run_gemini():
            return await call_gemini(
                messages=messages,
                api_key=gemini_key,
                system_prompt=system_prompt,
                model=gemini_model or "gemini-3.1-flash-lite",
                max_tokens=effective_max_tokens,
                temperature=temperature,
                timeout_seconds=3.5,
                tenant_id=tenant_id,
            ), "gemini"

        task_groq = asyncio.create_task(_run_groq())
        task_gemini = asyncio.create_task(_run_gemini())

        done, pending = await asyncio.wait(
            [task_groq, task_gemini],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for completed_task in done:
            try:
                text, prov = completed_task.result()
                if text and len(text.strip()) > 0:
                    for p in pending:
                        p.cancel()
                    return text, prov
            except Exception as e:
                logger.warning("racer_task_failed", tenant_id=tenant_id, error=str(e))

        # First completed task failed, wait for remaining task
        for remaining_task in pending:
            try:
                text, prov = await remaining_task
                if text and len(text.strip()) > 0:
                    return text, prov
            except Exception as e:
                logger.warning("racer_remaining_task_failed", tenant_id=tenant_id, error=str(e))

    # Sequential cascade for standalone keys, OpenCode primary, or 3rd-tier OpenCode fallback
    providers = []
    if primary_provider == "groq":
        providers = [
            ("groq", groq_key),
            ("gemini", gemini_key),
            ("opencode", opencode_key),
        ]
    elif primary_provider == "gemini":
        providers = [
            ("gemini", gemini_key),
            ("groq", groq_key),
            ("opencode", opencode_key),
        ]
    elif primary_provider == "opencode":
        providers = [
            ("opencode", opencode_key),
            ("groq", groq_key),
            ("gemini", gemini_key),
        ]
    else:
        providers = [
            ("groq", groq_key),
            ("gemini", gemini_key),
            ("opencode", opencode_key),
        ]

    for name, key in providers:
        if not key:
            continue
        # If racer already tried groq & gemini and both failed, proceed directly to tertiary opencode
        if racer_ran and name in ["groq", "gemini"]:
            continue

        try:
            if name == "groq":
                text = await call_groq(
                    messages=messages,
                    api_key=key,
                    system_prompt=system_prompt,
                    model="qwen/qwen3.8-27b",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=3.5,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    return text, "groq"

            elif name == "gemini":
                text = await call_gemini(
                    messages=messages,
                    api_key=key,
                    system_prompt=system_prompt,
                    model=gemini_model or "gemini-3.1-flash-lite",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=4.0,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    return text, "gemini"

            elif name == "opencode":
                text = await call_opencode(
                    messages=messages,
                    api_key=key,
                    base_url=opencode_base_url or "https://opencode.ai/zen/v1",
                    system_prompt=system_prompt,
                    model="nemotron-3.5-lightning-free",
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

    # Fast emergency single-turn recovery
    latest_user_text = ""
    for m in reversed(messages):
        if m.get("role") == "user" and m.get("content"):
            latest_user_text = m["content"]
            break

    if latest_user_text:
        emergency_messages = [{"role": "user", "content": latest_user_text}]
        if groq_key:
            try:
                text = await call_groq(
                    messages=emergency_messages,
                    api_key=groq_key,
                    system_prompt=system_prompt,
                    model="qwen/qwen3.8-27b",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=3.0,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    logger.info("emergency_single_turn_groq_success", tenant_id=tenant_id)
                    return text, "groq"
            except Exception:
                pass

        if gemini_key:
            try:
                text = await call_gemini(
                    messages=emergency_messages,
                    api_key=gemini_key,
                    system_prompt=system_prompt,
                    model="gemini-3.1-flash-lite",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout_seconds=3.5,
                    tenant_id=tenant_id,
                )
                if text and len(text.strip()) > 0:
                    logger.info("emergency_single_turn_gemini_success", tenant_id=tenant_id)
                    return text, "gemini"
            except Exception:
                pass

    return None, "fallback"
