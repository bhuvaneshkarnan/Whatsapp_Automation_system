import asyncio
import asyncpg
import os
import json
import redis.asyncio as aioredis

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://platform_user:newSecurePass2026@postgres:5432/whatsapp_platform")
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

AADHIRAN_TENANT_ID = "ad4768fc-08c4-4d78-8bc8-11583f7e7a74"

async def patch():
    conn = await asyncpg.connect(DATABASE_URL)
    row = await conn.fetchrow("SELECT * FROM ai_config WHERE tenant_id = $1::uuid", AADHIRAN_TENANT_ID)
    if not row:
        print("Aadhiran tenant not found in ai_config")
        await conn.close()
        return

    sys_prompt = row["system_prompt"] or ""
    # Update system_prompt language directive
    old_lang_str = "- Match the customer's language (Tamil, Tanglish, English)."
    new_lang_str = (
        "- STRICT LANGUAGE MANDATE FOR AADHIRAN CENTER: Reply ONLY in Tanglish or Tamil (Tamil script). NEVER reply in English!\n"
        "- If the customer texts in English or sends an English voice message -> Reply in 100% natural conversational spoken WhatsApp Tanglish.\n"
        "- If the customer texts in Tamil or sends a Tamil voice message -> Reply in 100% natural polite Tamil using Tamil script.\n"
        "- NEVER use English in any response for Aadhiran Center!"
    )
    if old_lang_str in sys_prompt:
        sys_prompt = sys_prompt.replace(old_lang_str, new_lang_str)
    elif "STRICT LANGUAGE MANDATE FOR AADHIRAN CENTER" not in sys_prompt:
        sys_prompt += "\n\n### 4. WHATSAPP CONVERSATIONAL FLOW & STRICT TANGLISH/TAMIL DIRECTIVE\n" + new_lang_str

    # Update response_style
    new_response_style = (
        "Warm, hospitable, and empathetic front-desk coordinator tone. "
        "Outgoing messages must contain zero formatting characters (no hyphens, bullets, asterisks, or emojis) and consist of natural, flowing sentences. "
        "Prices must appear immediately on line one for pricing questions. "
        "MANDATORY LANGUAGE: Strictly reply ONLY in Tanglish or Tamil (Tamil script). Never reply in English. "
        "If customer texts in English or sends an English voice message, reply in Tanglish. "
        "If customer texts in Tamil or sends a Tamil voice message, reply in Tamil."
    )

    # Update bot_goal to ensure no "in-clinic" terminology
    bot_goal = (row["bot_goal"] or "").replace("in-clinic", "at-center")

    await conn.execute(
        """UPDATE ai_config
           SET system_prompt = $1,
               response_style = $2,
               bot_goal = $3,
               updated_at = NOW()
           WHERE tenant_id = $4::uuid""",
        sys_prompt, new_response_style, bot_goal, AADHIRAN_TENANT_ID
    )
    print("ai_config updated successfully for Aadhiran Center.")

    # Also check if any existing customer under Aadhiran has preferred_language set to 'indian_english'
    # and update to 'tanglish' so historical chats don't force English
    res = await conn.execute(
        """UPDATE customers
           SET preferred_language = 'tanglish', updated_at = NOW()
           WHERE tenant_id = $1::uuid AND (preferred_language = 'indian_english' OR preferred_language = 'english')""",
        AADHIRAN_TENANT_ID
    )
    print(f"Updated customer preferred_language records: {res}")

    await conn.close()

    # Clear Redis cache for ai_config
    try:
        r = aioredis.from_url(REDIS_URL)
        await r.delete(f"ai_config:{AADHIRAN_TENANT_ID}")
        print("Cleared Redis cache for ai_config:ad4768fc-08c4-4d78-8bc8-11583f7e7a74")
        await r.aclose()
    except Exception as e:
        print(f"Redis cache clear error (non-fatal): {e}")

if __name__ == "__main__":
    asyncio.run(patch())
