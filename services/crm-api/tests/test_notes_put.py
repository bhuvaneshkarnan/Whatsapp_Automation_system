"""
Regression test: PUT /api/v1/crm/customers/{customer_id}/notes/{note_id}

Previously crashed with:
  asyncpg.exceptions.UndefinedColumnError: column "notes" of relation "customers" does not exist

Root cause: handler tried UPDATE customers SET notes = $1 but the customers
table has no notes column — notes are stored in customer_notes table.

Fix: removed the stale UPDATE customers SET notes= lines from update_customer_note
     and delete_customer_latest_note handlers.

Run inside the container:
  docker exec whatsapp-app-backend-monolith-1 python3 /app/tests/test_notes_put.py
"""
import asyncio
import asyncpg
import uuid
import json
import sys

# --- Constants ---
TENANT_ID = "b97ca3e5-7d43-44cf-8021-6e3659def878"   # Mind Body Recovery
CUSTOMER_ID = "da25414b-6c1c-4e76-861c-d3ae1caa3f48"
DB_URL = "postgresql://platform_user:newSecurePass2026@postgres:5432/whatsapp_platform"
JWT_SECRET = "18d73e947ecf30719ab9a2c4e919fc892f36e5c74207429b4a9e82f5ad0e5e7f"
BASE = "http://localhost:8000"


def make_token():
    from jose import jwt
    import datetime
    return jwt.encode(
        {
            "tenant_id": TENANT_ID,
            "role": "admin",
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        },
        JWT_SECRET,
        algorithm="HS256",
    )


async def ensure_test_note(conn, note_id: str):
    existing = await conn.fetchval(
        "SELECT id FROM customer_notes WHERE id = $1::uuid AND tenant_id = $2::uuid",
        note_id, TENANT_ID,
    )
    if not existing:
        await conn.execute(
            """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6)
               ON CONFLICT (id) DO NOTHING""",
            note_id, TENANT_ID, CUSTOMER_ID, "TestRunner", "Original text", "slate",
        )


async def run_tests():
    import httpx

    token = make_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    note_id = str(uuid.uuid4())  # fresh note for each run

    conn = await asyncpg.connect(DB_URL)
    try:
        await ensure_test_note(conn, note_id)
    finally:
        await conn.close()

    results = []

    async with httpx.AsyncClient(timeout=30) as client:
        # ---- Test 1: PUT update note ----
        url = f"{BASE}/api/v1/crm/customers/{CUSTOMER_ID}/notes/{note_id}"
        body = {"note_text": "Regression test update", "color": "green", "author": "TestRunner"}
        resp = await client.put(url, headers=headers, json=body)
        passed = resp.status_code == 200
        results.append(("PUT /customers/{id}/notes/{note_id}", resp.status_code, passed))
        if passed:
            data = resp.json()
            assert data["status"] == "ok", f"Unexpected body: {data}"
            assert data["note_text"] == "Regression test update", f"note_text mismatch: {data}"
            assert data["color"] == "green", f"color mismatch: {data}"

        # ---- Test 2: DELETE latest-note ----
        # Create one more note to delete as latest
        del_note_id = str(uuid.uuid4())
        conn2 = await asyncpg.connect(DB_URL)
        try:
            await conn2.execute(
                """INSERT INTO customer_notes (id, tenant_id, customer_id, author, note_text, color)
                   VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6)""",
                del_note_id, TENANT_ID, CUSTOMER_ID, "TestRunner", "To be deleted", "red",
            )
        finally:
            await conn2.close()

        del_url = f"{BASE}/api/v1/crm/customers/{CUSTOMER_ID}/latest-note"
        del_resp = await client.delete(del_url, headers=headers)
        passed2 = del_resp.status_code == 200
        results.append(("DELETE /customers/{id}/latest-note", del_resp.status_code, passed2))

    # ---- Report ----
    print("\n" + "=" * 60)
    print("  REGRESSION TEST: Customer Notes Endpoints")
    print("=" * 60)
    all_passed = True
    for name, code, ok in results:
        status = "✅ PASS" if ok else "❌ FAIL"
        print(f"  {status}  [{code}]  {name}")
        if not ok:
            all_passed = False
    print("=" * 60)

    if all_passed:
        print("  ALL TESTS PASSED")
        sys.exit(0)
    else:
        print("  SOME TESTS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
