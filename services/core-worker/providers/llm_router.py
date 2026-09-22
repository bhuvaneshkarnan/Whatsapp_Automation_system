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


COMMON_SENTENCE_ABBREVS = [
    ("Dr.", "__TITLE_DR__"),
    ("dr.", "__TITLE_dr__"),
    ("Mr.", "__TITLE_MR__"),
    ("mr.", "__TITLE_mr__"),
    ("Mrs.", "__TITLE_MRS__"),
    ("mrs.", "__TITLE_mrs__"),
    ("Ms.", "__TITLE_MS__"),
    ("ms.", "__TITLE_ms__"),
    ("Prof.", "__TITLE_PROF__"),
    ("prof.", "__TITLE_prof__"),
    ("vs.", "__TITLE_VS__"),
    ("e.g.", "__ABBR_EG__"),
    ("i.e.", "__ABBR_IE__"),
    ("etc.", "__ABBR_ETC__"),
    ("approx.", "__ABBR_APPROX__"),
    ("appt.", "__ABBR_APPT__"),
    ("Rs.", "__ABBR_RS__"),
    ("rs.", "__ABBR_rs__"),
    ("A.M.", "__ABBR_AM_CAP__"),
    ("P.M.", "__ABBR_PM_CAP__"),
    ("a.m.", "__ABBR_AM__"),
    ("p.m.", "__ABBR_PM__"),
]

def _split_into_sentences(text: str) -> list[str]:
    """Split text into sentences while strictly protecting abbreviations, doctor titles, and currencies."""
    if not text or not text.strip():
        return []
    protected = text
    for orig, placeholder in COMMON_SENTENCE_ABBREVS:
        protected = re.sub(rf'\b{re.escape(orig)}', placeholder, protected)

    raw_splits = [s.strip() for s in re.split(r'(?<=[.!?])\s+', protected) if s.strip()]
    if not raw_splits:
        raw_splits = [protected.strip()]

    restored = []
    for s in raw_splits:
        for orig, placeholder in COMMON_SENTENCE_ABBREVS:
            s = s.replace(placeholder, orig)
        restored.append(s)
    return restored


def clean_llm_response(text: str, single_line: bool = False) -> str:
    """
    Strips internal thinking process (<think>...</think>), reasoning blocks,
    markdown wrappers, bullet hyphens, and enforces crisp WhatsApp formatting.
    If single_line=True, guarantees strictly 1 single line with zero newlines.
    Preserves action tags [ACTION:...] at the end.
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

    # Extract action tags to protect them from line-stripping
    action_tags = re.findall(r'\[ACTION:[^\]]+\]', cleaned)
    for tag in action_tags:
        cleaned = cleaned.replace(tag, "").strip()

    # Protect URLs and emails from hyphen replacement
    url_matches = re.findall(r'https?://[^\s]+', cleaned)
    for i, u in enumerate(url_matches):
        cleaned = cleaned.replace(u, f"__URL_TOKEN_{i}__")

    email_matches = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', cleaned)
    for i, em in enumerate(email_matches):
        cleaned = cleaned.replace(em, f"__EMAIL_TOKEN_{i}__")

    # Strip markdown headers (e.g. "### ...")
    cleaned = re.sub(r'^#{1,6}\s+.*$', '', cleaned, flags=re.MULTILINE)

    # Strip bullet hyphens, asterisks, bullet points at beginning of lines
    cleaned = re.sub(r'^\s*[-*•–—]\s+', '', cleaned, flags=re.MULTILINE)

    # Replace em-dashes, en-dashes, and double hyphens with a comma
    cleaned = re.sub(r'\s*--\s*', ', ', cleaned)
    cleaned = re.sub(r'\s*[—–]\s*', ', ', cleaned)
    # Replace spaced hyphens with a comma
    cleaned = re.sub(r'\s+-\s+', ', ', cleaned)
    # Replace hyphens between words/suffixes with a space (e.g. 'business-ku' -> 'business ku', 'pesalam-a' -> 'pesalam a')
    cleaned = re.sub(r'(\w)-(\w)', r'\1 \2', cleaned)
    # Remove any remaining stray hyphens
    cleaned = re.sub(r'-', ' ', cleaned)

    # Restore URLs and emails
    for i, em in enumerate(email_matches):
        cleaned = cleaned.replace(f"__EMAIL_TOKEN_{i}__", em)

    for i, u in enumerate(url_matches):
        cleaned = cleaned.replace(f"__URL_TOKEN_{i}__", u)

    if single_line:
        # STRICT SINGLE LINE WHATSAPP ENFORCEMENT
        # Flatten all newlines and multiple spaces into a single space
        cleaned = re.sub(r'[\r\n]+', ' ', cleaned).strip()
        cleaned = re.sub(r'\s{2,}', ' ', cleaned)

        # Split into sentences using abbreviation-protected splitter
        raw_sentences = _split_into_sentences(cleaned)
        if len(raw_sentences) > 2:
            # If the last sentence is a question, keep the first sentence + the question
            if raw_sentences[-1].endswith('?'):
                chosen = [raw_sentences[0], raw_sentences[-1]]
            else:
                chosen = raw_sentences[:2]
            cleaned = " ".join(chosen).strip()
        elif raw_sentences:
            cleaned = " ".join(raw_sentences).strip()

        # Word cap for 1 line: at most 28 words
        words = cleaned.split()
        if len(words) > 28:
            joined = " ".join(words[:28])
            m = re.search(r'^(.*[.!?])', joined)
            if m and len(m.group(1).split()) >= 8:
                cleaned = m.group(1).strip()
            else:
                cleaned = " ".join(words[:24]) + "?"
    else:
        # Connect short conversational openers that have artificial double newlines (e.g. "Great!\n\nWould you..." -> "Great! Would you...")
        def _join_opener(m):
            opener = m.group(1).rstrip()
            next_char = m.group(2)
            if opener.endswith(('!', '.', '?')):
                return f"{opener} {next_char}"
            return f"{opener}, {next_char}"

        cleaned = re.sub(
            r'^([A-Za-z\s]{1,25}[.!?]?)\s*\n+([A-Za-z0-9])',
            lambda m: _join_opener(m) if len(m.group(1).split()) <= 4 else f"{m.group(1)}\n\n{m.group(2)}",
            cleaned
        )

        lines = [l.strip() for l in cleaned.split("\n") if l.strip()]
        
        # Sentence cap: allow up to 3 sentences to support the 3-Beat Consultative Sales Formula
        # (1. Direct Answer, 2. Value/Diagnostic hook, 3. Binary closing question) without dropping the middle explanation.
        raw_sentences = _split_into_sentences(cleaned)
        if len(raw_sentences) > 3:
            # If the last sentence is a closing question, keep first 2 sentences + the question
            if raw_sentences[-1].endswith('?'):
                sentences_kept = set([raw_sentences[0], raw_sentences[1], raw_sentences[-1]])
            else:
                sentences_kept = set(raw_sentences[:3])
            
            rebuilt = []
            for l in lines:
                l_sents = _split_into_sentences(l)
                kept = [s for s in l_sents if s in sentences_kept]
                if kept:
                    rebuilt.append(" ".join(kept))
            lines = rebuilt

        # If lines == 2, only keep double newline if both lines are substantial
        if len(lines) == 2:
            if len(lines[0].split()) <= 5 or len(lines[0]) <= 30 or len(" ".join(lines).split()) <= 25:
                cleaned = f"{lines[0]} {lines[1]}"
            else:
                cleaned = "\n\n".join(lines)
        elif len(lines) > 2:
            cleaned = "\n\n".join(lines[:3])
        else:
            cleaned = "\n".join(lines)

    # Re-attach action tags on their own line at the very end
    if action_tags:
        cleaned = cleaned + "\n" + "\n".join(action_tags)

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
    timeout_seconds: float = 8.0,
    tenant_id: str = "",
    single_line: bool = False,
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

    gemini_tokens = min(max_tokens, 75) if single_line else max(min(max_tokens, 500), 80)
    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": gemini_tokens,
            "temperature": temperature,
            "candidateCount": 1,
        },
    }

    # Verified active Gemini models on live API (sub-second generation)
    active_gemini_models = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
    candidate_models = []
    if model and model in active_gemini_models:
        candidate_models.append(model)
    for m in active_gemini_models:
        if m not in candidate_models:
            candidate_models.append(m)

    last_err = None
    req_timeout = min(timeout_seconds, 12.0)
    for m in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=req_timeout) as client:
                response = await client.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data["candidates"][0].get("content", {})
                parts = content.get("parts", [])
                text_parts = [p.get("text", "") for p in parts if not p.get("thought") and p.get("text")]
                if not text_parts and parts:
                    text_parts = [p.get("text", "") for p in parts if p.get("text")]
                text = "".join(text_parts)
                cleaned = clean_llm_response(text, single_line=single_line)
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
    single_line: bool = False,
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

    # Verified active models on Groq: qwen/qwen3.8-27b
    active_groq_models = ["qwen/qwen3.8-27b"]
    candidate_models = []
    if model and model in active_groq_models:
        candidate_models.append(model)
    for m in active_groq_models:
        if m not in candidate_models:
            candidate_models.append(m)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "WhatsAppAutomation/1.0 (Linux; x86_64)",
    }

    last_err = None
    req_timeout = min(timeout_seconds, 2.5)
    toks = min(max_tokens, 75) if single_line else min(max_tokens, 350)
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
                cleaned = clean_llm_response(text, single_line=single_line)
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
    model: str = "deepseek-chat",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 10.0,
    tenant_id: str = "",
    single_line: bool = False,
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

    candidate_models = [
        model or "deepseek-chat",
        "deepseek-chat",
        "gpt-4o-mini",
        "qwen/qwen-2.5-72b-instruct",
    ]
    candidate_models = [m for m in candidate_models if m]
    candidate_models = list(dict.fromkeys(candidate_models))

    last_err = None
    toks = min(max_tokens, 75) if single_line else min(max_tokens, 500)
    for m in candidate_models:
        payload = {
            "model": m,
            "messages": formatted_msgs,
            "max_tokens": toks,
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
                cleaned = clean_llm_response(text, single_line=single_line)
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
    single_line: bool = False,
) -> Tuple[Optional[str], str]:
    """
    Ultra-Fast Multi-LLM Cascading Router with 3-Model Fallback:
    1. Primary (Groq / Gemini) executes with ultra-fast latency.
    2. If primary fails or is rate-limited, secondary model seamlessly provides reply.
    3. If both primary & secondary fail, tertiary 3rd model (OpenCode) executes and replies.
    """
    effective_max_tokens = min(max_tokens, 75) if single_line else min(max_tokens, 500)

    # ── Option A: Concurrent Racer (Only if explicitly requested as 'fastest' or 'racer') ──
    if primary_provider in ("fastest", "racer") and groq_key and gemini_key:
        async def _run_groq():
            return await call_groq(
                messages=messages,
                api_key=groq_key,
                system_prompt=system_prompt,
                model="qwen/qwen3.8-27b",
                max_tokens=effective_max_tokens,
                temperature=temperature,
                timeout_seconds=8.0,
                tenant_id=tenant_id,
                single_line=single_line,
            ), "groq"

        async def _run_gemini():
            return await call_gemini(
                messages=messages,
                api_key=gemini_key,
                system_prompt=system_prompt,
                model=gemini_model or "gemini-3.1-flash-lite",
                max_tokens=effective_max_tokens,
                temperature=temperature,
                timeout_seconds=8.0,
                tenant_id=tenant_id,
                single_line=single_line,
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

        for remaining_task in pending:
            try:
                text, prov = await remaining_task
                if text and len(text.strip()) > 0:
                    return text, prov
            except Exception as e:
                logger.warning("racer_remaining_task_failed", tenant_id=tenant_id, error=str(e))

    # ── Option B: Strict Priority-Based Sequential Cascade ──
    providers = []
    if primary_provider == "groq":
        providers = [
            ("groq", groq_key),
            ("gemini", gemini_key),
            ("opencode", opencode_key),
        ]
    elif primary_provider == "opencode":
        providers = [
            ("opencode", opencode_key),
            ("gemini", gemini_key),
            ("groq", groq_key),
        ]
    else:  # Default to "gemini" as primary for highest prompt fidelity
        providers = [
            ("gemini", gemini_key),
            ("groq", groq_key),
            ("opencode", opencode_key),
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
                    model=gemini_model or "gemini-3.1-flash-lite",
                    max_tokens=effective_max_tokens,
                    temperature=temperature,
                    timeout_seconds=min(timeout_seconds, 10.0),
                    tenant_id=tenant_id,
                    single_line=single_line,
                )
                if text and len(text.strip()) > 0:
                    return text, "gemini"

            elif name == "groq":
                text = await call_groq(
                    messages=messages,
                    api_key=key,
                    system_prompt=system_prompt,
                    model="qwen/qwen3.8-27b",
                    max_tokens=effective_max_tokens,
                    temperature=temperature,
                    timeout_seconds=min(timeout_seconds, 4.0),
                    tenant_id=tenant_id,
                    single_line=single_line,
                )
                if text and len(text.strip()) > 0:
                    return text, "groq"

            elif name == "opencode":
                text = await call_opencode(
                    messages=messages,
                    api_key=key,
                    base_url=opencode_base_url or "https://opencode.ai/zen/v1",
                    system_prompt=system_prompt,
                    model="nemotron-3.5-lightning-free",
                    max_tokens=effective_max_tokens,
                    temperature=temperature,
                    timeout_seconds=8.0,
                    tenant_id=tenant_id,
                    single_line=single_line,
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
