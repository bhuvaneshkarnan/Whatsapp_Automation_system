import asyncio
import asyncpg
import json
import os
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/core_worker")

from core_worker.providers.llm_router import call_llm_cascade
from core_worker.main import CoreWorker

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://platform_user:newSecurePass2026@postgres:5432/whatsapp_platform")
AADHIRAN_TENANT_ID = "ad4768fc-08c4-4d78-8bc8-11583f7e7a74"

async def test_live():
    conn = await asyncpg.connect(DATABASE_URL)
    row = await conn.fetchrow("SELECT * FROM ai_config WHERE tenant_id = $1::uuid", AADHIRAN_TENANT_ID)
    worker = CoreWorker()
    worker.db_pool = conn
    gemini_key = await worker._get_tenant_gemini_key(AADHIRAN_TENANT_ID)

    system_prompt = row["system_prompt"]
    custom_prompt = row.get("custom_prompt") or ""
    full_prompt = system_prompt + "\n\n" + custom_prompt

    test_queries = [
        "Hi, what are your operating hours?",
        "How much is full body massage?",
        "வணக்கம், சென்டர் எங்கே இருக்கு?",
    ]

    for q in test_queries:
        print(f"\n--- TESTING QUERY: '{q}' ---")
        is_tamil = any('\u0b80' <= c <= '\u0bff' for c in q)
        lang_directive = (
            "The customer communicated in Tamil (தமிழ்). You MUST reply 100% in polite natural Tamil using Tamil script (தமிழ்). Never reply in English."
            if is_tamil else
            "CRITICAL MANDATE: The customer wrote in English. For Aadhiran Center, you MUST reply EXCLUSIVELY in 100% natural, casual, polite SPOKEN WHATSAPP TANGLISH. NEVER reply in English!"
        )

        test_sys = full_prompt + f"\n\n### MANDATORY LANGUAGE DIRECTIVE:\n{lang_directive}\nKeep response to 1-2 natural sentences, standard digits for prices (₹700, ₹999), zero hyphens, zero emojis."

        resp, prov = await call_llm_cascade(
            messages=[{"role": "user", "content": q}],
            system_prompt=test_sys,
            gemini_key=gemini_key,
            primary_provider="gemini",
            gemini_model="gemini-3.5-flash-lite",
            max_tokens=256,
            temperature=0.1,
            timeout_seconds=6.0,
            tenant_id=AADHIRAN_TENANT_ID,
        )
        print(f"AI REPLY ({prov}): {resp}")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(test_live())
