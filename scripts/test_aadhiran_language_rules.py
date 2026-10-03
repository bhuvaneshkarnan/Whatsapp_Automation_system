import asyncio
import asyncpg
import json
import os
import re

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://platform_user:newSecurePass2026@postgres:5432/whatsapp_platform")

import sys
sys.path.insert(0, "/app")
sys.path.insert(0, "/app/core_worker")
from core_worker.main import CoreWorker

async def test_scenarios():
    print("=== STARTING AADHIRAN CENTER LANGUAGE VERIFICATION ===")
    worker = CoreWorker()
    worker.db_pool = await asyncpg.connect(DATABASE_URL)

    test_cases = [
        {
            "name": "Scenario 1: Customer writes in English",
            "message": "Hi, what are your operating hours?",
            "history": [],
            "stored_lang": "",
            "is_aadhiran": True,
            "expected_dialect": "tanglish",
            "expected_lang": "tanglish",
        },
        {
            "name": "Scenario 2: Customer asks price in English",
            "message": "How much for full body massage?",
            "history": [],
            "stored_lang": "",
            "is_aadhiran": True,
            "expected_dialect": "tanglish",
            "expected_lang": "tanglish",
        },
        {
            "name": "Scenario 3: Customer sends English voice note",
            "message": "🎤 [Voice Note]: Can I book an appointment for tomorrow?",
            "history": [],
            "stored_lang": "",
            "is_aadhiran": True,
            "expected_dialect": "tanglish",
            "expected_lang": "tanglish",
        },
        {
            "name": "Scenario 4: Customer starts texting in Tamil script",
            "message": "வணக்கம், மசாஜ் கட்டணம் எவ்வளவு?",
            "history": [
                {"role": "user", "content": "Hi"},
                {"role": "assistant", "content": "Vanakkam sir! Ungalukku entha service pathi details thevai nu sollunga?"}
            ],
            "stored_lang": "tanglish",
            "is_aadhiran": True,
            "expected_dialect": "tamil_script",
            "expected_lang": "tamil",
        },
        {
            "name": "Scenario 5: Customer sends Tamil voice note",
            "message": "🎤 [Voice Note]: உடம்பு வலிக்கு என்ன சிகிச்சை இருக்கு",
            "history": [],
            "stored_lang": "",
            "is_aadhiran": True,
            "expected_dialect": "tamil_script",
            "expected_lang": "tamil",
        },
        {
            "name": "Scenario 6: Ongoing Tamil chat sends neutral 'ok'",
            "message": "ok",
            "history": [
                {"role": "user", "content": "வணக்கம்"},
                {"role": "assistant", "content": "வணக்கம்! உங்களுக்கு என்ன சிகிச்சை தேவை?"}
            ],
            "stored_lang": "tamil_script",
            "is_aadhiran": True,
            "expected_dialect": "tamil_script",
            "expected_lang": "tamil",
        },
        {
            "name": "Scenario 7: Other tenant (Boldlabs) writes in English (Must stay English!)",
            "message": "Hi, what are your features?",
            "history": [],
            "stored_lang": "",
            "is_aadhiran": False,
            "expected_dialect": "indian_english",
            "expected_lang": "indian_english",
        },
    ]

    all_passed = True
    for tc in test_cases:
        res = worker._detect_dialect_and_texting_style(
            message_text=tc["message"],
            history=tc["history"],
            stored_language=tc["stored_lang"],
            is_aadhiran=tc["is_aadhiran"],
        )
        d = res.get("dialect")
        l = res.get("language")
        passed = (d == tc["expected_dialect"] and l == tc["expected_lang"])
        status = "PASSED" if passed else "FAILED"
        if not passed:
            all_passed = False
        print(f"[{status}] {tc['name']}")
        print(f"   Input: '{tc['message']}' | is_aadhiran={tc['is_aadhiran']}")
        print(f"   Detected: dialect={d}, language={l}, label={res.get('label')}")
        if not passed:
            print(f"   EXPECTED: dialect={tc['expected_dialect']}, language={tc['expected_lang']}")

    await worker.db_pool.close()
    print("\nOVERALL TEST RESULT:", "ALL PASSED (100%)" if all_passed else "SOME TESTS FAILED")
    return all_passed

if __name__ == "__main__":
    asyncio.run(test_scenarios())
