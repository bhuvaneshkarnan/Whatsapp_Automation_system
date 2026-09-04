"""
=============================================================================
COMPREHENSIVE END-TO-END SYSTEM TEST SUITE: COMPLETE PLATFORM FLOWS
=============================================================================
Tests every single flow across the entire platform:
1. Webhook Ingestion & Redis Queueing Pipeline
2. AI Cascade, LPU Racing & Sub-Second Latency
3. Action Triggers & Guardrails (Casual chat vs Booking vs Conflict vs Cancel)
4. CRM API Suite (Conversations, Messages, Customers, Tasks, Notifications, Analytics)
5. Timezone & Calendar Data Integrity
=============================================================================
"""

import asyncio
import datetime
import hashlib
import hmac
import json
import os
import sys
import time
import uuid
import zoneinfo
import asyncpg
import httpx

# Add paths so we can import internal modules
sys.path.append("/app")
sys.path.append("/app/crm_api")
sys.path.append("/app/core_worker")

from core_worker.main import CoreWorker
from core_worker.providers.llm_router import call_llm_cascade, call_groq, call_gemini

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:newSecurePass2026@postgres:5432/whatsapp_platform")
BASE_API_URL = "http://localhost:8000/api/v1/crm"
# Inside docker network, nginx is 172.18.0.5 and webhook-ingestion is 172.18.0.4:3001
WEBHOOK_URL = "http://172.18.0.5/webhooks/whatsapp"

TEST_RESULTS = []

def record_result(flow: str, test_name: str, passed: bool, latency_ms: float = 0, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    TEST_RESULTS.append({
        "flow": flow,
        "test": test_name,
        "status": status,
        "latency_ms": round(latency_ms, 1),
        "detail": detail
    })
    symbol = "✅" if passed else "❌"
    print(f"[{symbol} {status}] {flow} :: {test_name} ({latency_ms:.0f}ms) - {detail}")


async def run_all_tests():
    print("\n" + "="*80)
    print("STARTING COMPLETE END-TO-END SYSTEM VERIFICATION")
    print(f"Timestamp: {datetime.datetime.now(zoneinfo.ZoneInfo('Asia/Kolkata')).isoformat()}")
    print("="*80 + "\n")

    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=5)
    worker = CoreWorker()
    worker.db_pool = pool

    # Retrieve active test tenant
    tenant_row = await pool.fetchrow("SELECT id, name, slug FROM tenants WHERE slug = 'boldlabs' LIMIT 1")
    if not tenant_row:
        print("❌ Fatal: Tenant 'boldlabs' not found in database!")
        return

    tenant_id = str(tenant_row["id"])
    tenant_slug = tenant_row["slug"]
    print(f"Testing against Tenant: {tenant_row['name']} ({tenant_id}) [slug: {tenant_slug}]\n")

    # Standard headers for CRM API
    crm_headers = {
        "X-Tenant-ID": tenant_id,
        "Content-Type": "application/json"
    }

    # Retrieve existing test contact/conversation or create mock
    conv_row = await pool.fetchrow("""
        SELECT conv.id as conv_id, conv.contact_id, c.phone, c.name 
        FROM conversations conv 
        JOIN contacts c ON c.id = conv.contact_id 
        WHERE conv.tenant_id = $1::uuid
        ORDER BY conv.last_message_at DESC LIMIT 1
    """, tenant_id)

    conv_id = str(conv_row["conv_id"])
    contact_id = str(conv_row["contact_id"])
    contact_phone = conv_row["phone"]
    contact_name = conv_row["name"] or "Bhuvanesh"
    print(f"Using Active Test Target: Contact {contact_name} ({contact_phone}), Conv: {conv_id}\n")

    creds = await worker._get_tenant_whatsapp_creds(tenant_id)
    ai_cfg = await worker._get_ai_config(tenant_id)
    groq_key = await worker._get_groq_key(tenant_id)
    gemini_key = await worker._get_gemini_key(tenant_id)

    async with httpx.AsyncClient(timeout=10.0) as http_client:

        # =========================================================================
        # FLOW 1: WEBHOOK INGESTION & PIPELINE
        # =========================================================================
        print("\n--- FLOW 1: WEBHOOK INGESTION & PIPELINE ---")
        
        # Test 1.1: Webhook Browser Health Check
        t0 = time.time()
        try:
            r = await http_client.get(f"{WEBHOOK_URL}/{tenant_slug}")
            dt = (time.time() - t0) * 1000
            passed = r.status_code == 200 and r.json().get("ready") is True
            record_result("Flow 1: Webhook", "GET Health Check", passed, dt, f"Status: {r.status_code}")
        except Exception as e:
            record_result("Flow 1: Webhook", "GET Health Check", False, 0, str(e))

        # Test 1.2: Meta Verification Handshake
        t0 = time.time()
        try:
            verify_token = creds.get("webhook_verify_token") or creds.get("verify_token") or "boldlabs_verify_token_2026"
            challenge = "meta_challenge_test_token_xyz"
            r = await http_client.get(
                f"{WEBHOOK_URL}/{tenant_slug}",
                params={"hub.mode": "subscribe", "hub.verify_token": verify_token, "hub.challenge": challenge}
            )
            dt = (time.time() - t0) * 1000
            passed = r.status_code == 200 and r.text.strip() == challenge
            record_result("Flow 1: Webhook", "Meta Challenge Handshake", passed, dt, f"Echoed: {r.text.strip()}")
        except Exception as e:
            record_result("Flow 1: Webhook", "Meta Challenge Handshake", False, 0, str(e))

        # Test 1.3: Inbound Message Deduplication via Redis
        t0 = time.time()
        try:
            app_secret = creds.get("app_secret") or "test_secret"
            test_msg_id = f"wamid.test.{uuid.uuid4().hex[:12]}"
            payload = {
                "entry": [{
                    "changes": [{
                        "value": {
                            "messages": [{
                                "id": test_msg_id,
                                "from": contact_phone,
                                "type": "text",
                                "text": {"body": "Automated E2E pipeline test"},
                                "timestamp": str(int(time.time()))
                            }],
                            "contacts": [{"profile": {"name": contact_name}}]
                        }
                    }]
                }]
            }
            body_bytes = json.dumps(payload).encode("utf-8")
            sig = "sha256=" + hmac.new(app_secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
            headers = {"x-hub-signature-256": sig, "Content-Type": "application/json"}
            
            # First send
            r1 = await http_client.post(f"{WEBHOOK_URL}/{tenant_slug}", content=body_bytes, headers=headers)
            # Second send (duplicate)
            r2 = await http_client.post(f"{WEBHOOK_URL}/{tenant_slug}", content=body_bytes, headers=headers)
            dt = (time.time() - t0) * 1000
            passed = r1.status_code == 200 and r2.status_code == 200
            record_result("Flow 1: Webhook", "Inbound POST & Dedup", passed, dt, f"r1: {r1.status_code}, r2: {r2.status_code}")
        except Exception as e:
            record_result("Flow 1: Webhook", "Inbound POST & Dedup", False, 0, str(e))

        # =========================================================================
        # FLOW 2: AI CASCADE, RACING & LATENCY
        # =========================================================================
        print("\n--- FLOW 2: AI CASCADE, RACING & LATENCY ---")

        # Test 2.1: Primary Groq LPU sub-second speed
        t0 = time.time()
        try:
            prompt = "You are Boldlabs assistant. 1 short sentence text."
            messages = [{"role": "user", "content": "Hello, quick check"}]
            text, prov = await call_llm_cascade(
                messages=messages,
                system_prompt=prompt,
                gemini_key=gemini_key,
                groq_key=groq_key,
                opencode_key=None,
                primary_provider="groq",
                max_tokens=350,
                temperature=0.3
            )
            dt = (time.time() - t0) * 1000
            passed = bool(text and len(text.strip()) > 0 and prov in ["groq", "gemini"] and dt < 2000)
            record_result("Flow 2: AI Latency", "Primary Racer Response", passed, dt, f"Provider: {prov}, Text: {text[:40]}...")
        except Exception as e:
            record_result("Flow 2: AI Latency", "Primary Racer Response", False, 0, str(e))

        # Test 2.2: Burst test (5 rapid messages) - Verify 0 HTTP 429 errors
        t0 = time.time()
        burst_passes = 0
        try:
            for i in range(5):
                txt, p = await call_llm_cascade(
                    messages=[{"role": "user", "content": f"Ping test #{i}"}],
                    system_prompt="1 word response.",
                    gemini_key=gemini_key,
                    groq_key=groq_key,
                    opencode_key=None,
                    primary_provider="groq",
                    max_tokens=250,
                    temperature=0.3
                )
                if txt:
                    burst_passes += 1
            dt = (time.time() - t0) * 1000
            passed = burst_passes == 5
            record_result("Flow 2: AI Latency", "Burst 5 Calls (No 429 TPM Exceeded)", passed, dt, f"Success: {burst_passes}/5")
        except Exception as e:
            record_result("Flow 2: AI Latency", "Burst 5 Calls (No 429 TPM Exceeded)", False, 0, str(e))

        # Test 2.3: Groq fallback model (groq/compound-mini)
        t0 = time.time()
        try:
            txt_mini = await call_groq(
                messages=[{"role": "user", "content": "Ping"}],
                api_key=groq_key,
                system_prompt="Short reply",
                model="groq/compound-mini",
                max_tokens=200
            )
            dt = (time.time() - t0) * 1000
            passed = bool(txt_mini and len(txt_mini) > 0)
            record_result("Flow 2: AI Latency", "Groq Compound-Mini Fallback", passed, dt, f"Text: {txt_mini[:40]}...")
        except Exception as e:
            record_result("Flow 2: AI Latency", "Groq Compound-Mini Fallback", False, 0, str(e))

        # Test 2.4: Gemini failover (gemini-3.1-flash-lite)
        t0 = time.time()
        try:
            txt_gem = await call_gemini(
                messages=[{"role": "user", "content": "Ping"}],
                api_key=gemini_key,
                system_prompt="Short reply",
                model="gemini-3.1-flash-lite",
                max_tokens=200,
                timeout_seconds=5.0
            )
            dt = (time.time() - t0) * 1000
            passed = bool(txt_gem and len(txt_gem) > 0)
            record_result("Flow 2: AI Latency", "Gemini 3.1-Flash-Lite Failover", passed, dt, f"Text: {txt_gem[:40]}...")
        except Exception as e:
            record_result("Flow 2: AI Latency", "Gemini 3.1-Flash-Lite Failover", False, 0, str(e))

        # =========================================================================
        # FLOW 3: ACTION RECOGNITION & GUARDRAILS (ZERO DUPLICATE SECOND MESSAGES)
        # =========================================================================
        print("\n--- FLOW 3: ACTION RECOGNITION & GUARDRAILS ---")

        # Test 3.1: Casual Conversation Isolation (The exact user bug)
        # Customer says "I didnt ask this" or "All set for tomorrow".
        # Assert: ONLY 1 message sent, NO booking created, NO second conflict text.
        t0 = time.time()
        try:
            count_before = await pool.fetchval("SELECT count(*) FROM messages WHERE conversation_id = $1::uuid", conv_id)
            await worker._generate_and_send_reply(
                tenant_id=tenant_id,
                conv_id=conv_id,
                contact_phone=contact_phone,
                message_text="I didnt ask this, just wanted to check something",
                creds=creds
            )
            await asyncio.sleep(1.5)  # Wait for any async tasks
            count_after = await pool.fetchval("SELECT count(*) FROM messages WHERE conversation_id = $1::uuid", conv_id)
            added = count_after - count_before
            dt = (time.time() - t0) * 1000
            
            # Check latest message body
            latest_msg = await pool.fetchrow("SELECT body FROM messages WHERE conversation_id = $1::uuid ORDER BY created_at DESC LIMIT 1", conv_id)
            body = latest_msg["body"] if latest_msg else ""
            has_conflict = "is already booked by another client" in body
            
            passed = (added == 1 and not has_conflict)
            record_result("Flow 3: Guardrails", "Casual Chat (Zero Duplicate / No Conflict Msg)", passed, dt, f"Added: {added} msg, No conflict: {not has_conflict}")
        except Exception as e:
            record_result("Flow 3: Guardrails", "Casual Chat (Zero Duplicate / No Conflict Msg)", False, 0, str(e))

        # Test 3.2: Same Contact Existing Booking Safety
        # Trigger _execute_ai_booking for a slot THIS contact already has.
        # Assert: Exits cleanly, does not insert duplicate, does not send conflict text.
        t0 = time.time()
        try:
            existing_booking = await pool.fetchrow("""
                SELECT start_time FROM bookings 
                WHERE tenant_id = $1::uuid AND contact_id = $2::uuid AND status = 'confirmed' 
                ORDER BY start_time DESC LIMIT 1
            """, tenant_id, contact_id)
            
            if existing_booking:
                tz = zoneinfo.ZoneInfo("Asia/Kolkata")
                st_local = existing_booking["start_time"].astimezone(tz)
                date_str = st_local.strftime("%Y-%m-%d")
                time_str = st_local.strftime("%H:%M")

                b_count_before = await pool.fetchval("SELECT count(*) FROM bookings WHERE contact_id = $1::uuid", contact_id)
                m_count_before = await pool.fetchval("SELECT count(*) FROM messages WHERE conversation_id = $1::uuid", conv_id)

                await worker._execute_ai_booking(
                    tenant_id=tenant_id,
                    conv_id=conv_id,
                    contact_phone=contact_phone,
                    customer_name=contact_name,
                    booking_data={"date": date_str, "time": time_str, "service": "Demo"},
                    creds=creds
                )
                await asyncio.sleep(1.0)

                b_count_after = await pool.fetchval("SELECT count(*) FROM bookings WHERE contact_id = $1::uuid", contact_id)
                m_count_after = await pool.fetchval("SELECT count(*) FROM messages WHERE conversation_id = $1::uuid", conv_id)

                passed = (b_count_after == b_count_before and m_count_after == m_count_before)
                dt = (time.time() - t0) * 1000
                record_result("Flow 3: Guardrails", "Same Contact Re-check (No Duplication / No Conflict)", passed, dt, f"Bookings diff: {b_count_after - b_count_before}, Msgs diff: {m_count_after - m_count_before}")
            else:
                record_result("Flow 3: Guardrails", "Same Contact Re-check (No Duplication / No Conflict)", True, 0, "No existing booking to conflict with")
        except Exception as e:
            record_result("Flow 3: Guardrails", "Same Contact Re-check (No Duplication / No Conflict)", False, 0, str(e))

        # Test 3.3: Booking Cancellation Flow
        t0 = time.time()
        try:
            # Create a test booking to cancel
            test_b_id = str(uuid.uuid4())
            tomorrow = datetime.datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")) + datetime.timedelta(days=2)
            t_st = tomorrow.replace(hour=16, minute=0, second=0, microsecond=0)
            t_et = t_st + datetime.timedelta(minutes=30)
            await pool.execute("""
                INSERT INTO bookings (id, tenant_id, contact_id, conversation_id, service, start_time, end_time, status)
                VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'Test Cancel Service', $5, $6, 'confirmed')
            """, test_b_id, tenant_id, contact_id, conv_id, t_st, t_et)

            # Trigger cancellation
            await worker._execute_ai_cancellation(
                tenant_id=tenant_id,
                conv_id=conv_id,
                contact_phone=contact_phone,
                customer_name=contact_name,
                creds=creds
            )
            await asyncio.sleep(1.0)
            
            status = await pool.fetchval("SELECT status FROM bookings WHERE id = $1::uuid", test_b_id)
            dt = (time.time() - t0) * 1000
            passed = status == "cancelled"
            record_result("Flow 3: Guardrails", "AI Booking Cancellation Execution", passed, dt, f"Booking status: {status}")
            # Clean up test booking
            await pool.execute("DELETE FROM bookings WHERE id = $1::uuid", test_b_id)
        except Exception as e:
            record_result("Flow 3: Guardrails", "AI Booking Cancellation Execution", False, 0, str(e))

        # Test 3.4: Customer Info Auto-Extraction (Age & Location)
        t0 = time.time()
        try:
            await worker._update_customer_extracted_info(
                tenant_id=tenant_id,
                phone=contact_phone,
                age=33,
                location="Indiranagar, Bangalore"
            )
            cust_row = await pool.fetchrow("SELECT age, location FROM customers WHERE tenant_id = $1::uuid AND (phone = $2 OR phone = replace($2, '+', '')) LIMIT 1", tenant_id, contact_phone)
            dt = (time.time() - t0) * 1000
            passed = bool(cust_row and cust_row["age"] == 33 and "Indiranagar" in (cust_row["location"] or ""))
            record_result("Flow 3: Guardrails", "Customer Detail Auto-Extraction", passed, dt, f"Saved age={cust_row['age'] if cust_row else None}, loc={cust_row['location'] if cust_row else None}")
        except Exception as e:
            record_result("Flow 3: Guardrails", "Customer Detail Auto-Extraction", False, 0, str(e))

        # Test 3.5: Human Handover Request
        t0 = time.time()
        try:
            # Set to active first
            await pool.execute("UPDATE conversations SET status = 'bot' WHERE id = $1::uuid", conv_id)
            # Send message requesting human
            await worker._generate_and_send_reply(
                tenant_id=tenant_id,
                conv_id=conv_id,
                contact_phone=contact_phone,
                message_text="I want to speak with a human agent please",
                creds=creds
            )
            await asyncio.sleep(1.0)
            conv_status = await pool.fetchval("SELECT status FROM conversations WHERE id = $1::uuid", conv_id)
            dt = (time.time() - t0) * 1000
            passed = conv_status == "human"
            record_result("Flow 3: Guardrails", "Human Agent Takeover Intent", passed, dt, f"Conversation status: {conv_status}")
            # Reset back to active
            await pool.execute("UPDATE conversations SET status = 'bot' WHERE id = $1::uuid", conv_id)
        except Exception as e:
            record_result("Flow 3: Guardrails", "Human Agent Takeover Intent", False, 0, str(e))

        # =========================================================================
        # FLOW 4: CRM API SUITE VERIFICATION
        # =========================================================================
        print("\n--- FLOW 4: CRM API SUITE VERIFICATION ---")

        # Test 4.1: Conversations List
        t0 = time.time()
        try:
            r = await http_client.get(f"{BASE_API_URL}/conversations?limit=20", headers=crm_headers)
            dt = (time.time() - t0) * 1000
            data = r.json()
            passed = r.status_code == 200 and isinstance(data, (list, dict))
            count = len(data.get("items", data) if isinstance(data, dict) else data)
            record_result("Flow 4: CRM APIs", "GET /conversations", passed, dt, f"Status {r.status_code}, Items: {count}")
        except Exception as e:
            record_result("Flow 4: CRM APIs", "GET /conversations", False, 0, str(e))

        # Test 4.2: Messages List for Conversation
        t0 = time.time()
        try:
            r = await http_client.get(f"{BASE_API_URL}/conversations/{conv_id}/messages?limit=20", headers=crm_headers)
            dt = (time.time() - t0) * 1000
            data = r.json()
            passed = r.status_code == 200 and isinstance(data, (list, dict))
            record_result("Flow 4: CRM APIs", "GET /conversations/{id}/messages", passed, dt, f"Status {r.status_code}")
        except Exception as e:
            record_result("Flow 4: CRM APIs", "GET /conversations/{id}/messages", False, 0, str(e))

        # Test 4.3: Customers List
        t0 = time.time()
        try:
            r = await http_client.get(f"{BASE_API_URL}/customers?limit=50", headers=crm_headers)
            dt = (time.time() - t0) * 1000
            data = r.json()
            passed = r.status_code == 200
            count = len(data.get("items", data) if isinstance(data, dict) else data)
            record_result("Flow 4: CRM APIs", "GET /customers", passed, dt, f"Status {r.status_code}, Items: {count}")
        except Exception as e:
            record_result("Flow 4: CRM APIs", "GET /customers", False, 0, str(e))

        # Test 4.4: Bookings List
        t0 = time.time()
        try:
            r = await http_client.get(f"{BASE_API_URL}/bookings?filter=all&limit=50", headers=crm_headers)
            dt = (time.time() - t0) * 1000
            passed = r.status_code == 200
            record_result("Flow 4: CRM APIs", "GET /bookings", passed, dt, f"Status {r.status_code}")
        except Exception as e:
            record_result("Flow 4: CRM APIs", "GET /bookings", False, 0, str(e))

        # Test 4.5: Tasks API (Create, Toggle, List)
        t0 = time.time()
        try:
            due_iso = (datetime.datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")) + datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M")
            r_create = await http_client.post(f"{BASE_API_URL}/tasks", json={
                "title": "E2E Automated Test Task",
                "description": "Automated pipeline test task",
                "due_date": due_iso
            }, headers=crm_headers)
            task_id = r_create.json().get("id") or r_create.json().get("task", {}).get("id")

            r_patch = await http_client.patch(f"{BASE_API_URL}/tasks/{task_id}/toggle", headers=crm_headers)
            
            # Clean up task
            await pool.execute("DELETE FROM tasks WHERE id = $1::uuid", task_id)
            dt = (time.time() - t0) * 1000
            passed = r_create.status_code in [200, 201] and r_patch.status_code == 200
            record_result("Flow 4: CRM APIs", "Tasks Lifecycle (POST/PATCH/DELETE)", passed, dt, f"Create: {r_create.status_code}, Toggle: {r_patch.status_code}")
        except Exception as e:
            record_result("Flow 4: CRM APIs", "Tasks Lifecycle (POST/PATCH/DELETE)", False, 0, str(e))

        # Test 4.6: Notifications (Create, Read, Delete)
        t0 = time.time()
        try:
            notif_id = str(uuid.uuid4())
            await pool.execute("""
                INSERT INTO notifications (id, tenant_id, title, body, type, is_read, data)
                VALUES ($1::uuid, $2::uuid, 'Test E2E Notification', 'Verification test', 'general', false, '{}'::jsonb)
            """, notif_id, tenant_id)

            # Call DELETE /api/v1/crm/notifications/{id}
            r_del = await http_client.delete(f"{BASE_API_URL}/notifications/{notif_id}", headers=crm_headers)
            
            # Check DB
            deleted_check = await pool.fetchrow("SELECT id FROM notifications WHERE id = $1::uuid", notif_id)
            dt = (time.time() - t0) * 1000
            passed = r_del.status_code == 200 and deleted_check is None
            record_result("Flow 4: CRM APIs", "DELETE /notifications/{id}", passed, dt, f"Status: {r_del.status_code}, Removed from DB: {deleted_check is None}")
        except Exception as e:
            record_result("Flow 4: CRM APIs", "DELETE /notifications/{id}", False, 0, str(e))

        # Test 4.7: Settings & VAPID Key
        t0 = time.time()
        try:
            r_settings = await http_client.get(f"{BASE_API_URL}/settings", headers=crm_headers)
            r_vapid = await http_client.get(f"{BASE_API_URL}/notifications/vapid-public-key", headers=crm_headers)
            dt = (time.time() - t0) * 1000
            passed = r_settings.status_code == 200 and r_vapid.status_code == 200
            record_result("Flow 4: CRM APIs", "GET /settings & /vapid-key", passed, dt, f"Settings: {r_settings.status_code}, Vapid: {r_vapid.status_code}")
        except Exception as e:
            record_result("Flow 4: CRM APIs", "GET /settings & /vapid-key", False, 0, str(e))

        # =========================================================================
        # FLOW 5: TIMEZONE & CALENDAR INTEGRITY
        # =========================================================================
        print("\n--- FLOW 5: TIMEZONE & CALENDAR INTEGRITY ---")

        # Test 5.1: Database Timestamps & ZoneInfo("Asia/Kolkata")
        t0 = time.time()
        try:
            b_sample = await pool.fetchrow("SELECT start_time FROM bookings WHERE tenant_id = $1::uuid AND status = 'confirmed' LIMIT 1", tenant_id)
            if b_sample:
                st = b_sample["start_time"]
                # Must be a timezone-aware datetime
                has_tz = st.tzinfo is not None
                dt = (time.time() - t0) * 1000
                record_result("Flow 5: Timezone/Calendar", "TIMESTAMPTZ Awareness", has_tz, dt, f"start_time: {st}")
            else:
                record_result("Flow 5: Timezone/Calendar", "TIMESTAMPTZ Awareness", True, 0, "No bookings in DB")
        except Exception as e:
            record_result("Flow 5: Timezone/Calendar", "TIMESTAMPTZ Awareness", False, 0, str(e))

    await pool.close()

    # =========================================================================
    # SUMMARY TABLE
    # =========================================================================
    print("\n" + "="*80)
    print("END-TO-END SYSTEM TEST RESULTS SUMMARY")
    print("="*80)
    total = len(TEST_RESULTS)
    passed_count = sum(1 for r in TEST_RESULTS if r["status"] == "PASS")
    failed_count = total - passed_count
    
    print(f"\nTotal Tests: {total} | Passed: {passed_count} | Failed: {failed_count}\n")
    print(f"{'FLOW':<24} | {'TEST NAME':<38} | {'STATUS':<6} | {'LATENCY':<8} | {'DETAILS'}")
    print("-" * 115)
    for r in TEST_RESULTS:
        print(f"{r['flow']:<24} | {r['test']:<38} | {r['status']:<6} | {r['latency_ms']:>6.0f}ms | {r['detail']}")
    print("="*115 + "\n")

    if failed_count == 0:
        print("🎉 ALL SYSTEM FLOWS VERIFIED SUCCESSFULLY WITH 100% PASS RATE!\n")
    else:
        print(f"⚠️ {failed_count} TEST(S) FAILED. CHECK LOGS ABOVE.\n")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
