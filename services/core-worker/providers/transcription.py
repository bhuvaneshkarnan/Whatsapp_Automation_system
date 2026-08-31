"""
Audio transcription engine for WhatsApp Voice Notes.
Downloads .ogg/.opus media from Meta Graph API and transcribes via Groq Whisper (or Gemini).
"""
import base64
import os
import time
from typing import Optional
import httpx
import structlog

logger = structlog.get_logger()

GRAPH_API_VERSION = "v19.0"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


class TranscriptionError(Exception):
    pass


async def download_whatsapp_media(media_id: str, access_token: str, timeout: float = 15.0) -> tuple[bytes, str]:
    """
    Download media binary from Meta WhatsApp Graph API:
    1. Query https://graph.facebook.com/v19.0/{media_id} to get direct download URL.
    2. Download binary bytes with Authorization header.
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            # 1. Get media URL
            meta_res = await client.get(
                f"{GRAPH_BASE}/{media_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if meta_res.status_code != 200:
                raise TranscriptionError(f"Meta media query failed ({meta_res.status_code}): {meta_res.text[:200]}")

            meta_data = meta_res.json()
            media_url = meta_data.get("url")
            mime_type = meta_data.get("mime_type", "audio/ogg")

            if not media_url:
                raise TranscriptionError(f"No direct media URL returned for media_id {media_id}")

            # 2. Download binary payload
            audio_res = await client.get(
                media_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if audio_res.status_code != 200:
                raise TranscriptionError(f"Meta media download failed ({audio_res.status_code})")

            return audio_res.content, mime_type
    except httpx.RequestError as e:
        raise TranscriptionError(f"Media download network error: {e}")


async def transcribe_with_groq_whisper(audio_bytes: bytes, mime_type: str, groq_api_key: str, timeout: float = 12.0) -> str:
    """
    Transcribe audio bytes using Groq Whisper API (whisper-large-v3-turbo).
    Ultra-fast (300ms) with state-of-the-art accuracy across Indian English, Tamil, Hindi, etc.
    """
    start = time.monotonic()
    url = "https://api.groq.com/openai/v1/audio/transcriptions"

    ext = "ogg"
    if "opus" in mime_type or "ogg" in mime_type:
        ext = "ogg"
    elif "mp3" in mime_type:
        ext = "mp3"
    elif "m4a" in mime_type or "mp4" in mime_type:
        ext = "m4a"
    elif "wav" in mime_type:
        ext = "wav"

    filename = f"audio.{ext}"

    files = {
        "file": (filename, audio_bytes, mime_type),
    }
    data = {
        "model": "whisper-large-v3-turbo",
        "response_format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(
                url,
                headers={"Authorization": f"Bearer {groq_api_key}"},
                files=files,
                data=data,
            )
    except httpx.RequestError as e:
        raise TranscriptionError(f"Groq Whisper request error: {e}")

    latency_ms = int((time.monotonic() - start) * 1000)

    if res.status_code != 200:
        raise TranscriptionError(f"Groq Whisper HTTP {res.status_code}: {res.text[:200]}")

    try:
        text = res.json().get("text", "")
        logger.info("groq_whisper_success", latency_ms=latency_ms, text_len=len(text))
        return text.strip()
    except Exception as e:
        raise TranscriptionError(f"Groq Whisper parse error: {e}")


async def transcribe_with_gemini_audio(audio_bytes: bytes, mime_type: str, gemini_api_key: str, timeout: float = 15.0) -> str:
    """
    Transcribe audio bytes using Google Gemini 1.5 Flash multimodal capabilities.
    """
    start = time.monotonic()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"

    clean_mime = "audio/ogg"
    if "ogg" in mime_type:
        clean_mime = "audio/ogg"
    elif "mp3" in mime_type:
        clean_mime = "audio/mp3"
    elif "wav" in mime_type:
        clean_mime = "audio/wav"
    elif "m4a" in mime_type:
        clean_mime = "audio/m4a"

    b64_audio = base64.b64encode(audio_bytes).decode("utf-8")

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": clean_mime,
                            "data": b64_audio,
                        }
                    },
                    {
                        "text": "Transcribe this customer voice message accurately word-for-word. Return ONLY the transcribed text. Do not add explanations or notes."
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 300,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(url, json=payload)
    except httpx.RequestError as e:
        raise TranscriptionError(f"Gemini Audio request error: {e}")

    latency_ms = int((time.monotonic() - start) * 1000)

    if res.status_code != 200:
        raise TranscriptionError(f"Gemini Audio HTTP {res.status_code}: {res.text[:200]}")

    try:
        data = res.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        logger.info("gemini_audio_transcription_success", latency_ms=latency_ms, text_len=len(text))
        return text.strip()
    except Exception as e:
        raise TranscriptionError(f"Gemini Audio parse error: {e}")


async def transcribe_voice_message(
    media_id: str,
    wa_access_token: str,
    groq_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
) -> str:
    """
    Full pipeline:
    1. Download audio from WhatsApp
    2. Try Groq Whisper (ultra-fast)
    3. Fallback to Gemini Multimodal Audio
    """
    audio_bytes, mime_type = await download_whatsapp_media(media_id, wa_access_token)

    # Try Groq first if key available
    if groq_api_key:
        try:
            return await transcribe_with_groq_whisper(audio_bytes, mime_type, groq_api_key)
        except Exception as e:
            logger.warning("groq_whisper_failed_trying_gemini", error=str(e))

    # Try Gemini next
    if gemini_api_key:
        try:
            return await transcribe_with_gemini_audio(audio_bytes, mime_type, gemini_api_key)
        except Exception as e:
            logger.warning("gemini_audio_transcription_failed", error=str(e))

    # Platform master key fallbacks (if set in env)
    env_groq = os.getenv("GROQ_API_KEY")
    if env_groq:
        try:
            return await transcribe_with_groq_whisper(audio_bytes, mime_type, env_groq)
        except Exception:
            pass

    env_gemini = os.getenv("GEMINI_API_KEY")
    if env_gemini:
        try:
            return await transcribe_with_gemini_audio(audio_bytes, mime_type, env_gemini)
        except Exception:
            pass

    raise TranscriptionError("No working transcription provider or API key available")
