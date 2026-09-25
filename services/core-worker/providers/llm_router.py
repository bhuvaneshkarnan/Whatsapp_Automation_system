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

# ── Persistent HTTP Clients (connection-pooled, reused across all LLM calls) ──
# This avoids ~50-200ms TCP/TLS handshake overhead on every request.
_GEMINI_CLIENT = httpx.AsyncClient(
    timeout=14.0,
    limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
)
_GROQ_CLIENT = httpx.AsyncClient(
    timeout=10.0,
    limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
    headers={
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
)
_OPENCODE_CLIENT = httpx.AsyncClient(
    timeout=10.0,
    limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
)


async def close_llm_clients():
    """Gracefully close persistent HTTP clients on shutdown."""
    for client in (_GEMINI_CLIENT, _GROQ_CLIENT, _OPENCODE_CLIENT):
        try:
            if not client.is_closed:
                await client.aclose()
        except Exception:
            pass


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
                selected_sentences = [raw_sentences[0], raw_sentences[1], raw_sentences[-1]]
            else:
                selected_sentences = raw_sentences[:3]
            
            rebuilt = []
            for l in lines:
                l_sents = _split_into_sentences(l)
                kept = [s for s in l_sents if s in selected_sentences]
                if kept:
                    rebuilt.append(" ".join(kept))
            lines = rebuilt if rebuilt else [" ".join(selected_sentences)]

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

    res = cleaned.strip()
    if not res or len(res) < 4:
        return ""
    words = res.split()
    if len(words) < 2 and not any(res.lower().startswith(w) for w in ["yes", "no", "ok", "sure", "hi", "hello", "hey", "vanakkam"]):
        return ""
    lower_res = res.lower().strip()
    if lower_res in ["25 to", "to 45", "45 words", "25 to 45", "25 to 45 words", "words max", "line 1", "line 2", "sentence 1", "sentence 2", "sentence 3"]:
        return ""
    if len(words) == 2 and words[0].isdigit() and words[1].lower() in ["to", "words", "lines"]:
        return ""
    return res


def strip_repetitive_greetings(text: str) -> str:
    """
    In ongoing conversations (turn 2+), strip repetitive, robotic greetings like
    'Hi again!', 'Hello again!', 'Hi Bhuvanesh Karnan!', 'Hello [Name]!'
    so the assistant dives straight into conversation like a real person.
    Guards against truncating into tiny 1- or 2-word fragments (e.g. 'How').
    """
    if not text:
        return ""
    original = text.strip()
    # Strip "Hi again!", "Hello again!", "Hey again!"
    t = re.sub(r'^(?:hi\s+again|hello\s+again|hey\s+again)[!,\.]*\s*', '', original, flags=re.IGNORECASE)
    # Strip any leading greeting with optional multi-word name:
    # Matches: "Hi Bhuvanesh Karnan!", "Hello John!", "Hey!", "Welcome back to Boldlabs!"
    t = re.sub(r'^(?:hi|hello|hey|welcome back)(?:\s+[^!,\.\n]+)?[!,\.]+\s*', '', t, flags=re.IGNORECASE)
    t = t.strip()
    # Never return truncated 1- or 2-word fragments like "How"
    if len(t.split()) < 3:
        return original
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
        return [{"role": "user", "content": "Please continue."}]

    # Keep only the last 12 messages for ultra-fast, lightweight context
    if len(cleaned) > 12:
        cleaned = cleaned[-12:]

    # Ensure starts with user turn (drop orphan assistant response from window slice)
    if cleaned[0]["role"] != "user":
        cleaned = cleaned[1:]
        if not cleaned:
            return [{"role": "user", "content": "Please continue."}]

    # Ensure ends with user turn (natural continuation instruction instead of fake customer greeting)
    if cleaned[-1]["role"] != "user":
        cleaned.append({"role": "user", "content": "Please continue."})

    return cleaned


async def call_gemini(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    model: str = "gemini-3.5-flash-lite",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 4.0,
    tenant_id: str = "",
    single_line: bool = False,
) -> str:
    """Call Google Gemini API with fast failover using verified active models."""
    start = time.monotonic()
    sanitized = sanitize_conversation_history(messages)
    contents = []
    for msg in sanitized:
        gemini_role = "user" if msg["role"] == "user" else "model"
        contents.append({
            "role": gemini_role,
            "parts": [{"text": msg["content"]}],
        })

    # For Gemini 2.5 / 3.x, thought tokens count against maxOutputTokens!
    # Minimum 2048 tokens is required so thought tokens (400-900) never starve candidate text.
    gemini_tokens = max(max_tokens, 2048)
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

    # Verified active Gemini models (ordered fastest/most-reliable first)
    # gemini-2.5-flash: Google's recommended current fast model
    # gemini-3.5-flash: Also active, reliable
    # gemini-3.6-flash: Active, slightly slower
    active_gemini_models = [
        "gemini-2.5-flash",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
    ]
    candidate_models = []
    # Strip known-dead/retired model aliases
    bad_aliases = ["2.5-pro", "2.0-flash", "1.5-flash", "flash-lite-latest", "flash-latest",
                   "gemma-4-26b-a4b-it", "3.5-flash-lite", "3.7-flash", "3.8-flash"]
    if model and not any(bad in model.lower() for bad in bad_aliases):
        candidate_models.append(model)
    for m in active_gemini_models:
        if m not in candidate_models:
            candidate_models.append(m)


    last_err = None
    # Fast per-model timeout: max 6.5s so we never hang or delay customer replies
    req_timeout = min(max(timeout_seconds, 4.0), 6.5)
    for m in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            # Use persistent pooled client — avoids TCP/TLS handshake overhead per call
            response = await _GEMINI_CLIENT.post(
                url,
                json=payload,
                timeout=req_timeout,
            )

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
            elif response.status_code == 503:
                last_err = f"Gemini {m} high demand (503)"
            else:
                last_err = f"Gemini {m} HTTP {response.status_code}: {response.text[:150]}"
        except httpx.TimeoutException:
            last_err = f"Gemini {m} timeout after {req_timeout}s"
        except httpx.RequestError as e:
            last_err = f"Gemini {m} network error: {e}"
        except Exception as e:
            last_err = f"Gemini {m} parse error: {e}"

    raise LLMError(last_err or "Gemini API call failed")


def budget_prompt_for_groq(system_prompt: str, max_chars: int = 28000) -> str:
    """
    Intelligently budget system prompt for Groq LPU inference.
    Preserves ALL critical business context in priority order.
    Groq qwen/qwen3.8-27b supports 32k token context (approx 128k chars), so
    we budget conservatively at 28k chars to leave room for history + output.
    """
    if not system_prompt or len(system_prompt) <= max_chars:
        return system_prompt or ""

    # Split prompt into sections using '### ' as section delimiter
    raw_sections = re.split(r'\n(?=###\s+)', system_prompt)

    identity_parts = []
    global_rules = []
    tenant_strict_rules = ""
    pricing_text = ""
    kb_text = ""
    calendar_text = ""
    customer_text = ""
    action_text = ""
    location_and_web = []
    other_sections = []

    for sec in raw_sections:
        sec_strip = sec.strip()
        sec_upper = sec_strip.upper()

        if "LIVE GOOGLE CALENDAR" in sec_upper or "VERIFIED EMPTY" in sec_upper and "AVAILABLE SLOTS" in sec_upper:
            if not calendar_text:
                cal_clean = sec_strip
                if "OCCUPIED / BUSY SLOTS" in cal_clean:
                    cal_clean = cal_clean.split("OCCUPIED / BUSY SLOTS")[0].strip()
                if "### STRICT DIRECTIVES" in cal_clean:
                    cal_clean = cal_clean.split("### STRICT DIRECTIVES")[0].strip()
                calendar_text = cal_clean[:1200].rsplit("\n", 1)[0] if len(cal_clean) > 1200 else cal_clean

        elif "ACTION TAG PROTOCOLS" in sec_upper:
            if not action_text:
                action_text = sec_strip[:1000].rsplit("\n", 1)[0] if len(sec_strip) > 1000 else sec_strip

        elif any(k in sec_upper for k in ["STRICT IDENTITY, NAMES", "TALKING TO: CUSTOMER", "CUSTOMER PROFILE", "ZERO CROSS-TENANT"]):
            if not customer_text:
                customer_text = sec_strip[:800].rsplit("\n", 1)[0] if len(sec_strip) > 800 else sec_strip

        elif "VERIFIED SERVICES" in sec_upper and "PRICING" in sec_upper:
            if not pricing_text:
                pricing_text = sec_strip[:3500].rsplit("\n", 1)[0] if len(sec_strip) > 3500 else sec_strip

        elif "TENANT CUSTOM AI INSTRUCTIONS" in sec_upper or "BUSINESS KNOWLEDGE BASE" in sec_upper:
            if not kb_text:
                kb_text = sec_strip[:14000].rsplit("\n", 1)[0] if len(sec_strip) > 14000 else sec_strip

        elif any(k in sec_upper for k in [
            "GLOBAL CONVERSATION ENGINE", "ABSOLUTE GLOBAL", "GLOBAL PLATFORM",
            "HOW THE AI BEHAVES", "MANDATORY WHATSAPP", "FINAL WHATSAPP FORMAT",
        ]):
            global_rules.append(sec_strip[:2500])

        elif "TENANT STRICT BUSINESS RULES" in sec_upper or "STRICT BUSINESS RULES" in sec_upper:
            if not tenant_strict_rules:
                tenant_strict_rules = sec_strip[:2000].rsplit("\n", 1)[0] if len(sec_strip) > 2000 else sec_strip

        elif "BUSINESS ADDRESS" in sec_upper or "OFFICIAL BUSINESS WEBSITE" in sec_upper:
            location_and_web.append(sec_strip[:800])

        elif any(k in sec_upper for k in ["GOALS & OBJECTIVES", "OBJECTION HANDLING", "UNIVERSAL OBJECTION", "CONVERSATION STYLE", "CONVERSATION METHODOLOGY", "DIALECT & STYLE"]):
            other_sections.append(sec_strip[:1500])

        elif "You are " in sec_strip and "representing " in sec_strip:
            identity_parts.append(sec_strip[:500])
        elif "Today is " in sec_strip or "Current time is" in sec_strip.title():
            identity_parts.append(sec_strip[:600])

    if not identity_parts:
        top_lines = [l for l in system_prompt[:1500].split("\n") if "You are " in l or "Today is " in l or "Organization" in l]
        if top_lines:
            identity_parts.append("\n".join(top_lines[:4]))

    # If kb_text is still empty (section header not matched), try a broader search
    if not kb_text:
        for sec in raw_sections:
            sec_strip = sec.strip()
            sec_upper = sec_strip.upper()
            if ("PRIMARY BUSINESS DIRECTIVE" in sec_upper or "KNOWLEDGE BASE" in sec_upper) and len(sec_strip) > 200:
                kb_text = sec_strip[:14000].rsplit("\n", 1)[0] if len(sec_strip) > 14000 else sec_strip
                break

    concise_rules = (
        "### MANDATORY WHATSAPP CONVERSATION RULES:\n"
        "- Friendly, helpful, authentic WhatsApp conversational texting.\n"
        "- ZERO hyphens (-), dashes (--), bullets (•), asterisks (*), or emojis.\n"
        "- When asked about services, treatments, prices, or details, ALWAYS answer directly using the verified knowledge base and pricing above (2 to 3 natural sentences, up to 60 words).\n"
        "- For casual greetings or quick checks, reply in 1 to 2 short lines.\n"
        "- Binary Assumptive Close: Offer two specific choices when suggesting a time (e.g. 'Tomorrow 11 AM or 4 PM — which works?'). Never say 'Would you like to book?'.\n"
        "- Match customer's language organically (English, Tanglish, Tamil, Hindi)."
    )

    parts = []
    if identity_parts:
        parts.append("\n".join(identity_parts))
    if global_rules:
        parts.extend(global_rules[:2])  # Keep first 2 global rule sections
    if tenant_strict_rules:
        parts.append(tenant_strict_rules)
    if kb_text:
        parts.append(kb_text)
    if pricing_text:
        parts.append(pricing_text)
    if location_and_web:
        parts.extend(location_and_web)
    if other_sections:
        parts.extend(other_sections[:3])  # Keep first 3 other sections
    if customer_text:
        parts.append(customer_text)
    if calendar_text:
        parts.append(calendar_text)
    parts.append(concise_rules)
    if action_text:
        parts.append(action_text)

    assembled = "\n\n".join(parts)
    if len(assembled) > max_chars:
        return assembled[:max_chars].rsplit("\n", 1)[0]
    return assembled



async def call_groq(
    messages: list[dict],
    api_key: str,
    system_prompt: str,
    model: str = "qwen/qwen3.8-27b",
    max_tokens: int = 350,
    temperature: float = 0.3,
    timeout_seconds: float = 8.0,
    tenant_id: str = "",
    single_line: bool = False,
) -> str:
    """
    Call Groq API with ultra-fast LPU inference (sub-500ms latency) and verified active models.
    """
    start = time.monotonic()
    url = "https://api.groq.com/openai/v1/chat/completions"

    # Intelligent prompt budgeting guarantees safe TPM usage and avoids HTTP 413
    groq_system_prompt = budget_prompt_for_groq(system_prompt, max_chars=24000)

    sanitized = sanitize_conversation_history(messages)
    formatted_msgs = [{"role": "system", "content": groq_system_prompt}]
    for m in sanitized:
        formatted_msgs.append({"role": m["role"], "content": m["content"]})

    # Active Groq models (all verified active and working)
    active_groq_models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
    candidate_models = []
    # Strip decommissioned llama / mixtral models from request
    if model and not any(m_bad in model.lower() for m_bad in ["llama", "mixtral"]):
        candidate_models.append(model)
    for m in active_groq_models:
        if m not in candidate_models:
            candidate_models.append(m)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }

    last_err = None
    req_timeout = min(max(timeout_seconds, 5.0), 8.0)
    toks = min(max_tokens, 75) if single_line else min(max_tokens, 350)
    for m in candidate_models:
        payload = {
            "model": m,
            "messages": formatted_msgs,
            "max_tokens": toks,
            "temperature": temperature,
        }

        try:
            # Use persistent pooled client — avoids TCP/TLS handshake overhead per call
            response = await _GROQ_CLIENT.post(
                url,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
                timeout=req_timeout,
            )
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                cleaned = clean_llm_response(text, single_line=single_line)
                if cleaned:
                    latency_ms = int((time.monotonic() - start) * 1000)
                    logger.info("groq_success", tenant_id=tenant_id, model=m, latency_ms=latency_ms)
                    return cleaned
            elif response.status_code in (413, 429):
                last_err = f"Groq {m} rate limited (429)" if response.status_code == 429 else f"Groq {m} HTTP 413: Request too large"
                # If prompt tripped 413/429, aggressively compact prompt AND slice history to latest 2 turns
                compact_prompt = budget_prompt_for_groq(system_prompt, max_chars=1800)
                compact_msgs = [{"role": "system", "content": compact_prompt}]
                for m_turn in sanitized[-2:]:
                    compact_msgs.append({"role": m_turn["role"], "content": m_turn["content"]})
                payload["messages"] = compact_msgs
                await asyncio.sleep(0.2)
                try:
                    retry_resp = await _GROQ_CLIENT.post(
                        url,
                        headers={"Authorization": f"Bearer {api_key}"},
                        json=payload,
                        timeout=req_timeout,
                    )
                    if retry_resp.status_code == 200:
                        data = retry_resp.json()
                        text = data["choices"][0]["message"]["content"]
                        cleaned = clean_llm_response(text, single_line=single_line)
                        if cleaned:
                            latency_ms = int((time.monotonic() - start) * 1000)
                            logger.info("groq_success_after_compact", tenant_id=tenant_id, model=m, latency_ms=latency_ms)
                            return cleaned
                except Exception:
                    pass
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
    model: str = "deepseek-v4-flash",
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

    active_opencode_models = [
        "deepseek-v4-flash",
        "deepseek-v4.1-flash",
        "gpt-5-nano",
        "qwen3.8-flash",
    ]
    candidate_models = []
    if model and not any(bad in model.lower() for bad in ["free", "deepseek-chat", "gpt-4o-mini", "qwen-2.5", "qwen/qwen-2.5"]):
        candidate_models.append(model)
    for m in active_opencode_models:
        if m not in candidate_models:
            candidate_models.append(m)

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
            # Use persistent pooled client — avoids TCP/TLS handshake overhead per call
            response = await _OPENCODE_CLIENT.post(
                url,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
                timeout=timeout_seconds,
            )
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                cleaned = clean_llm_response(text, single_line=single_line)
                if cleaned:
                    latency_ms = int((time.monotonic() - start) * 1000)
                    logger.info("opencode_success", tenant_id=tenant_id, model=m, latency_ms=latency_ms)
                    return cleaned
            elif response.status_code in (402, 403):
                # Account out of funds or forbidden — abort immediately without wasting time on remaining models
                last_err = f"OpenCode {m} unavailable (HTTP {response.status_code})"
                raise LLMError(last_err)
            elif response.status_code == 429:
                last_err = f"OpenCode {m} rate limited (429)"
            else:
                last_err = f"OpenCode {m} HTTP {response.status_code}: {response.text[:150]}"
        except httpx.TimeoutException:
            last_err = f"OpenCode {m} timeout after {timeout_seconds}s"
        except httpx.RequestError as e:
            last_err = f"OpenCode {m} network error: {e}"
        except LLMError:
            raise
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
    master_gemini_key: Optional[str] = None,
    master_groq_key: Optional[str] = None,
    master_opencode_key: Optional[str] = None,
    master_opencode_base_url: str = "https://opencode.ai/zen/v1",
    primary_provider: str = "groq",
    gemini_model: str = "gemini-2.5-flash",
    max_tokens: int = 2048,
    temperature: float = 0.3,
    timeout_seconds: float = 4.0,
    tenant_id: str = "",
    single_line: bool = False,
) -> Tuple[Optional[str], str]:
    """
    Two-Tier Multi-LLM Cascading Router:
    1. Tier 1 (Tenant-First): Each tenant strictly uses their own 3 AI provider keys
       (Gemini -> Groq -> OpenCode or ordered by primary_provider).
    2. Tier 2 (Platform Master Parachute): Only if ALL 3 tenant keys fail/exhaust,
       it automatically falls back to the central Master AI Keys.
    3. Self-Healing Return: Evaluated per-message, so the exact moment the tenant's
       rate-limit window resets or quota refreshes, the next message immediately uses Tier 1 again.
    """
    effective_max_tokens = min(max_tokens, 75) if single_line else min(max_tokens, 300)
    effective_gemini_tokens = max(max_tokens, 2048)

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
                model=gemini_model or "gemini-2.5-flash",
                max_tokens=effective_gemini_tokens,
                temperature=temperature,
                timeout_seconds=12.0,
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
            except asyncio.CancelledError:
                logger.warning("racer_remaining_task_cancelled", tenant_id=tenant_id)
            except Exception as e:
                logger.warning("racer_remaining_task_failed", tenant_id=tenant_id, error=str(e))

    # ── Tier 1: Tenant's Own 3 AI Keys (Evaluated First on Every Message) ──
    tenant_providers = []
    if primary_provider in ("groq", "fastest", "racer"):
        tenant_providers = [
            ("groq", groq_key),
            ("gemini", gemini_key),
            ("opencode", opencode_key),
        ]
    elif primary_provider == "opencode":
        tenant_providers = [
            ("opencode", opencode_key),
            ("groq", groq_key),
            ("gemini", gemini_key),
        ]
    else:  # Default to "gemini" as primary
        tenant_providers = [
            ("gemini", gemini_key),
            ("groq", groq_key),
            ("opencode", opencode_key),
        ]

    for name, key in tenant_providers:
        if not key:
            continue

        try:
            if name == "gemini":
                text = await call_gemini(
                    messages=messages,
                    api_key=key,
                    system_prompt=system_prompt,
                    model=gemini_model or "gemini-2.5-flash",
                    max_tokens=effective_gemini_tokens,
                    temperature=temperature,
                    timeout_seconds=min(max(timeout_seconds, 4.0), 6.5),
                    tenant_id=tenant_id,
                    single_line=single_line,
                )
                if text and len(text.strip()) > 0:
                    logger.info("tenant_ai_success", tenant_id=tenant_id, provider="gemini")
                    return text, "gemini"

            elif name == "groq":
                text = await call_groq(
                    messages=messages,
                    api_key=key,
                    system_prompt=system_prompt,
                    model="qwen/qwen3.8-27b",
                    max_tokens=effective_max_tokens,
                    temperature=temperature,
                    timeout_seconds=min(timeout_seconds, 8.0),
                    tenant_id=tenant_id,
                    single_line=single_line,
                )
                if text and len(text.strip()) > 0:
                    logger.info("tenant_ai_success", tenant_id=tenant_id, provider="groq")
                    return text, "groq"

            elif name == "opencode":
                text = await call_opencode(
                    messages=messages,
                    api_key=key,
                    base_url=opencode_base_url or "https://opencode.ai/zen/v1",
                    system_prompt=system_prompt,
                    model="deepseek-v4-flash",
                    max_tokens=effective_max_tokens,
                    temperature=temperature,
                    timeout_seconds=8.0,
                    tenant_id=tenant_id,
                    single_line=single_line,
                )
                if text and len(text.strip()) > 0:
                    logger.info("tenant_ai_success", tenant_id=tenant_id, provider="opencode")
                    return text, "opencode"

        except Exception as e:
            logger.warning(
                "tenant_ai_provider_failed_cascading",
                tenant_id=tenant_id,
                provider=name,
                error=str(e),
            )
            continue

    # ── Tier 2: Platform Master Key Fallback (Only executed when ALL 3 tenant keys fail) ──
    # Master Groq is prioritized first as it provides verified <500ms reliable uptime.
    master_providers = [
        ("groq", master_groq_key, groq_key, "qwen/qwen3.8-27b", None),
        ("gemini", master_gemini_key, gemini_key, "gemini-2.5-flash", None),
    ]
    if master_opencode_key:
        master_providers.append(("opencode", master_opencode_key, opencode_key, "deepseek-v4-flash", master_opencode_base_url))

    has_any_master = any(k and (not tk or k.strip() != tk.strip()) for _, k, tk, _, _ in master_providers)
    if has_any_master:
        logger.warning(
            "all_tenant_ai_keys_exhausted_falling_back_to_master",
            tenant_id=tenant_id,
            has_master_gemini=bool(master_gemini_key),
            has_master_groq=bool(master_groq_key),
            has_master_opencode=bool(master_opencode_key),
        )

        for name, m_key, t_key, m_model, custom_base in master_providers:
            # Skip if master key is missing or is identical to the tenant key that just failed
            if not m_key or (t_key and m_key.strip() == t_key.strip()):
                continue

            try:
                if name == "groq":
                    text = await call_groq(
                        messages=messages,
                        api_key=m_key,
                        system_prompt=system_prompt,
                        model=m_model,
                        max_tokens=effective_max_tokens,
                        temperature=temperature,
                        timeout_seconds=min(timeout_seconds, 8.0),
                        tenant_id=tenant_id,
                        single_line=single_line,
                    )
                    if text and len(text.strip()) > 0:
                        logger.info("master_ai_fallback_success", tenant_id=tenant_id, provider="groq")
                        return text, "master_groq"

                elif name == "gemini":
                    text = await call_gemini(
                        messages=messages,
                        api_key=m_key,
                        system_prompt=system_prompt,
                        model=m_model,
                        max_tokens=effective_gemini_tokens,
                        temperature=temperature,
                        timeout_seconds=min(max(timeout_seconds, 4.0), 6.5),
                        tenant_id=tenant_id,
                        single_line=single_line,
                    )
                    if text and len(text.strip()) > 0:
                        logger.info("master_ai_fallback_success", tenant_id=tenant_id, provider="gemini")
                        return text, "master_gemini"

                elif name == "opencode":
                    text = await call_opencode(
                        messages=messages,
                        api_key=m_key,
                        base_url=custom_base or "https://opencode.ai/zen/v1",
                        system_prompt=system_prompt,
                        model=m_model,
                        max_tokens=effective_max_tokens,
                        temperature=temperature,
                        timeout_seconds=8.0,
                        tenant_id=tenant_id,
                        single_line=single_line,
                    )
                    if text and len(text.strip()) > 0:
                        logger.info("master_ai_fallback_success", tenant_id=tenant_id, provider="opencode")
                        return text, "master_opencode"

            except Exception as e:
                logger.warning(
                    "master_ai_provider_failed",
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
        emergency_prompt = budget_prompt_for_groq(system_prompt, max_chars=1800)
        for g_k in (groq_key, master_groq_key):
            if g_k:
                try:
                    text = await call_groq(
                        messages=emergency_messages,
                        api_key=g_k,
                        system_prompt=emergency_prompt,
                        model="qwen/qwen3.8-27b",
                        max_tokens=max_tokens,
                        temperature=temperature,
                        timeout_seconds=4.0,
                        tenant_id=tenant_id,
                    )
                    if text and len(text.strip()) > 0:
                        logger.info("emergency_single_turn_groq_success", tenant_id=tenant_id)
                        return text, "groq"
                except Exception:
                    pass

        for gm_k in (gemini_key, master_gemini_key):
            if gm_k:
                try:
                    text = await call_gemini(
                        messages=emergency_messages,
                        api_key=gm_k,
                        system_prompt=emergency_prompt,
                        model="gemini-2.5-flash",
                        max_tokens=max_tokens,
                        temperature=temperature,
                        timeout_seconds=5.0,
                        tenant_id=tenant_id,
                    )
                    if text and len(text.strip()) > 0:
                        logger.info("emergency_single_turn_gemini_success", tenant_id=tenant_id)
                        return text, "gemini"
                except Exception:
                    pass

    return None, "fallback"
