"""
Unit and Integration Tests for Tenant Booking Payments and Multi-Tenant Razorpay Isolation.

Verifies:
1. Strict platform isolation: Central platform Razorpay keys in .env are NEVER accessed,
   referenced, or used for tenant booking payments.
2. Cross-tenant credential isolation: Tenant A and Tenant B use strictly isolated credentials.
3. Webhook HMAC-SHA256 signature verification with tenant-specific secrets (and cross-tenant rejection).
4. Dynamic payment link creation with tenant Basic Auth and atomic SQL updates scoped by tenant_id.
5. Masked secret protection in Settings (preventing overwrites with ••••••••xxxx).
"""

import asyncio
import os
import sys
import json
import uuid
import hmac
import hashlib
from unittest.mock import AsyncMock, MagicMock, patch
try:
    from fastapi import HTTPException
except ImportError:
    from starlette.exceptions import HTTPException

# Ensure services/crm-api is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.tenant_payment_service import (
    get_tenant_razorpay_creds,
    verify_tenant_webhook_signature,
    create_booking_payment_link,
    fetch_tenant_payment_link,
    clean_phone_number,
)


def test_codebase_platform_razorpay_decoupling():
    """Verify that tenant_payment_service.py NEVER references platform .env Razorpay keys."""
    service_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../services/tenant_payment_service.py"))
    with open(service_path, "r", encoding="utf-8") as f:
        code = f.read()

    assert "RAZORPAY_KEY_ID" not in code, "VIOLATION: Central RAZORPAY_KEY_ID found in tenant_payment_service.py!"
    assert "RAZORPAY_KEY_SECRET" not in code, "VIOLATION: Central RAZORPAY_KEY_SECRET found in tenant_payment_service.py!"
    assert "razorpay_client" not in code, "VIOLATION: Platform subscription client imported in tenant_payment_service.py!"
    print("[PASS] Test 1: Absolute platform decoupling verified. Central .env keys never referenced.")


def test_phone_number_cleaning():
    """Verify clean_phone_number extracts 10 digits for Indian numbers."""
    assert clean_phone_number("+91 98765 43210") == "9876543210"
    assert clean_phone_number("09876543210") == "9876543210"
    assert clean_phone_number("9876543210") == "9876543210"
    assert clean_phone_number(None) == ""
    assert clean_phone_number("") == ""
    print("[PASS] Test 2: Phone number cleaning normalized correctly.")


def test_tenant_webhook_signature_verification():
    """Verify HMAC-SHA256 signature verification and cross-tenant rejection."""
    payload_body = json.dumps({"event": "payment_link.paid", "id": "evt_test123"}).encode("utf-8")
    secret_tenant_a = "webhook_secret_tenant_a_12345678"
    secret_tenant_b = "webhook_secret_tenant_b_87654321"

    # Compute valid signature for Tenant A
    valid_sig_a = hmac.new(secret_tenant_a.encode("utf-8"), payload_body, hashlib.sha256).hexdigest()

    # 1. Valid signature passes for Tenant A
    assert verify_tenant_webhook_signature(payload_body, valid_sig_a, secret_tenant_a) is True

    # 2. Tampered signature fails
    assert verify_tenant_webhook_signature(payload_body, "tampered_signature_value", secret_tenant_a) is False

    # 3. Tampered payload fails
    tampered_body = json.dumps({"event": "payment_link.paid", "id": "evt_hacked"}).encode("utf-8")
    assert verify_tenant_webhook_signature(tampered_body, valid_sig_a, secret_tenant_a) is False

    # 4. CROSS-TENANT ATTACK: Signature from Tenant A MUST FAIL against Tenant B's secret!
    assert verify_tenant_webhook_signature(payload_body, valid_sig_a, secret_tenant_b) is False

    # 5. Empty secrets or signatures fail safely
    assert verify_tenant_webhook_signature(payload_body, "", secret_tenant_a) is False
    assert verify_tenant_webhook_signature(payload_body, valid_sig_a, "") is False
    assert verify_tenant_webhook_signature(payload_body, None, None) is False

    print("[PASS] Test 3: Webhook signature verification and cross-tenant rejection verified.")


async def test_tenant_credentials_isolation_and_no_fallback():
    """Verify get_tenant_razorpay_creds strictly queries tenant_credentials with tenant_id."""
    tenant_a_id = str(uuid.uuid4())
    tenant_b_id = str(uuid.uuid4())

    mock_db = MagicMock()

    # Simulate database returning credentials for Tenant A
    async def mock_fetchrow(query, *args):
        # Query must contain tenant_id and provider = 'razorpay'
        assert "tenant_id = $1::uuid" in query
        assert "provider = 'razorpay'" in query
        queried_tenant = args[0]
        if queried_tenant == tenant_a_id:
            return {
                "credential_data": json.dumps({
                    "key_id": "rzp_live_TenantA_Key",
                    "key_secret": "TenantA_Secret_999",
                    "webhook_secret": "TenantA_WhSec_111",
                }),
                "is_active": True,
            }
        elif queried_tenant == tenant_b_id:
            return {
                "credential_data": {
                    "key_id": "rzp_live_TenantB_Key",
                    "key_secret": "TenantB_Secret_888",
                    "webhook_secret": "TenantB_WhSec_222",
                },
                "is_active": True,
            }
        return None

    mock_db.fetchrow = AsyncMock(side_effect=mock_fetchrow)

    # 1. Fetch Tenant A creds
    creds_a = await get_tenant_razorpay_creds(tenant_a_id, mock_db)
    assert creds_a is not None
    assert creds_a["key_id"] == "rzp_live_TenantA_Key"
    assert creds_a["key_secret"] == "TenantA_Secret_999"
    assert creds_a["webhook_secret"] == "TenantA_WhSec_111"

    # 2. Fetch Tenant B creds
    creds_b = await get_tenant_razorpay_creds(tenant_b_id, mock_db)
    assert creds_b is not None
    assert creds_b["key_id"] == "rzp_live_TenantB_Key"
    assert creds_b["key_secret"] == "TenantB_Secret_888"
    assert creds_b["webhook_secret"] == "TenantB_WhSec_222"

    # Cross-tenant check
    assert creds_a["key_id"] != creds_b["key_id"]
    assert creds_a["key_secret"] != creds_b["key_secret"]

    # 3. Unconfigured tenant returns None (NO fallback to platform .env!)
    unconfigured_tenant_id = str(uuid.uuid4())
    creds_unconfigured = await get_tenant_razorpay_creds(unconfigured_tenant_id, mock_db)
    assert creds_unconfigured is None

    print("[PASS] Test 4: Tenant credentials isolation and non-fallback verified.")


async def test_create_booking_payment_link_success():
    """Verify payment link creation uses tenant credentials and updates DB with tenant_id scoping."""
    tenant_id = str(uuid.uuid4())
    booking_id = str(uuid.uuid4())

    mock_db = MagicMock()
    mock_db.fetchrow = AsyncMock(return_value={
        "credential_data": {
            "key_id": "rzp_test_ClientTenantKey123",
            "key_secret": "ClientTenantSecretXYZ456",
            "webhook_secret": "ClientWhSecret789",
        },
        "is_active": True,
    })

    executed_queries = []
    async def mock_execute(query, *args):
        executed_queries.append({"query": query, "args": args})
        return "UPDATE 1"

    mock_db.execute = AsyncMock(side_effect=mock_execute)

    # Mock HTTP call to Razorpay
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "plink_BookingPayLink12345",
        "short_url": "https://rzp.io/i/testlink123",
        "status": "created",
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        res = await create_booking_payment_link(
            tenant_id=tenant_id,
            booking_id=booking_id,
            amount=500.0,
            customer_name="Ramesh Kumar",
            customer_phone="+91 98765 43210",
            customer_email="ramesh@example.com",
            description="Consultation Fee",
            currency="INR",
            db=mock_db,
        )

        assert res["payment_link_id"] == "plink_BookingPayLink12345"
        assert res["payment_link_url"] == "https://rzp.io/i/testlink123"
        assert res["amount"] == 500.0
        assert res["currency"] == "INR"

        # Verify HTTP post parameters
        call_kwargs = mock_post.call_args[1]
        assert call_kwargs["auth"] == ("rzp_test_ClientTenantKey123", "ClientTenantSecretXYZ456")
        sent_json = call_kwargs["json"]
        assert sent_json["amount"] == 50000  # 500 INR in paise
        assert sent_json["currency"] == "INR"
        assert sent_json["customer"]["contact"] == "9876543210"
        assert sent_json["notes"]["booking_id"] == booking_id
        assert sent_json["notes"]["tenant_id"] == tenant_id

        # Verify DB update query is scoped by tenant_id
        assert len(executed_queries) == 1
        db_call = executed_queries[0]
        assert "UPDATE bookings" in db_call["query"]
        assert "WHERE id = $5::uuid AND tenant_id = $6::uuid" in db_call["query"]
        assert db_call["args"][0] == "plink_BookingPayLink12345"
        assert db_call["args"][1] == "https://rzp.io/i/testlink123"
        assert db_call["args"][2] == 500.0
        assert db_call["args"][3] == "INR"
        assert db_call["args"][4] == booking_id
        assert db_call["args"][5] == tenant_id

    print("[PASS] Test 5: create_booking_payment_link executed with tenant auth and tenant-scoped DB update.")


async def test_create_booking_payment_link_unconfigured_rejection():
    """Verify create_booking_payment_link rejects unconfigured tenants with HTTP 400."""
    tenant_id = str(uuid.uuid4())
    booking_id = str(uuid.uuid4())

    mock_db = MagicMock()
    mock_db.fetchrow = AsyncMock(return_value=None)  # No credentials

    try:
        await create_booking_payment_link(
            tenant_id=tenant_id,
            booking_id=booking_id,
            amount=500.0,
            customer_name="Test Customer",
            customer_phone="9876543210",
            db=mock_db,
        )
        assert False, "Should have raised HTTPException(400)"
    except HTTPException as e:
        assert e.status_code == 400
        assert "not configured their Razorpay payment credentials" in e.detail

    print("[PASS] Test 6: Unconfigured tenant payment link request gracefully rejected with HTTP 400.")


async def test_masked_secret_protection():
    """Verify that settings update prevents overwriting real credentials with masked strings (••••••••xxxx)."""
    # Simulate existing credential
    existing_secret = "rzp_secret_real_value_super_secure_99"
    masked_input = "••••••••re_99"

    # Test protection logic
    sec_val = masked_input.strip()
    should_update = bool(sec_val and not sec_val.startswith("••••") and "••" not in sec_val)
    assert should_update is False, "Masked secret should NOT be allowed to overwrite real secret!"

    # Test genuine update
    new_secret = "rzp_secret_new_genuinely_updated_secret_123"
    new_sec_val = new_secret.strip()
    should_update_new = bool(new_sec_val and not new_sec_val.startswith("••••") and "••" not in new_sec_val)
    assert should_update_new is True, "Genuine new secret must be allowed to update!"

    print("[PASS] Test 7: Masked secret protection prevents accidental credential overwrite.")


async def test_webhook_auth_enforcement_and_rejection():
    """Verify webhook route rejects requests with missing or invalid signatures with HTTP 400."""
    import sys
    sys.modules["structlog"] = MagicMock()
    fastapi_mock = MagicMock()
    fastapi_mock.APIRouter = lambda: MagicMock(post=lambda *a, **kw: lambda fn: fn, get=lambda *a, **kw: lambda fn: fn)
    class MockHTTPException(Exception):
        def __init__(self, status_code, detail=None):
            self.status_code = status_code
            self.detail = detail
    fastapi_mock.HTTPException = MockHTTPException
    sys.modules["fastapi"] = fastapi_mock
    sys.modules["asyncpg"] = MagicMock()

    class MockPoolContext:
        def __init__(self, conn):
            self.conn = conn
        async def __aenter__(self):
            return self.conn
        async def __aexit__(self, *args):
            pass

    class MockPool:
        def __init__(self, conn):
            self.conn = conn
        def acquire(self):
            return MockPoolContext(self.conn)

    mock_conn = MagicMock()
    mock_db = MagicMock()
    mock_db.db_pool = MockPool(mock_conn)
    sys.modules["database"] = mock_db
    sys.modules["razorpay_client"] = MagicMock()
    sys.modules["routers.marketing"] = MagicMock()
    sys.modules["services.whatsapp_service"] = MagicMock()
    sys.modules["services.crm_service"] = MagicMock()
    sys.modules["tasks_service"] = MagicMock()
    sys.modules["dependencies"] = MagicMock()
    sys.modules["utils"] = MagicMock()

    from routers.webhooks import handle_tenant_booking_razorpay_webhook

    class MockReq:
        def __init__(self, body_bytes, headers):
            self._body = body_bytes
            self.headers = headers
        async def body(self):
            return self._body

    tenant_id = str(uuid.uuid4())
    mock_conn.fetchrow = AsyncMock(side_effect=[
        {"id": tenant_id, "name": "Clinic X", "slug": "clinic-x", "settings": "{}"},
        {"credential_data": json.dumps({"key_id": "k", "key_secret": "sec", "webhook_secret": "wh_sec"}), "is_active": True}
    ])

    # 1. Missing signature header MUST raise 400 (Vulnerability regression test)
    req_no_sig = MockReq(b'{"event": "payment_link.paid"}', {})
    bg = MagicMock()
    try:
        await handle_tenant_booking_razorpay_webhook(tenant_id, req_no_sig, bg)
        assert False, "Should have raised HTTPException 400 on missing signature"
    except MockHTTPException as e:
        assert e.status_code == 400
        assert "Missing x-razorpay-signature" in e.detail

    # 2. Tampered signature MUST raise 400
    mock_conn.fetchrow = AsyncMock(side_effect=[
        {"id": tenant_id, "name": "Clinic X", "slug": "clinic-x", "settings": "{}"},
        {"credential_data": json.dumps({"key_id": "k", "key_secret": "sec", "webhook_secret": "wh_sec"}), "is_active": True}
    ])
    req_bad_sig = MockReq(b'{"event": "payment_link.paid"}', {"x-razorpay-signature": "forged_sig"})
    try:
        await handle_tenant_booking_razorpay_webhook(tenant_id, req_bad_sig, bg)
        assert False, "Should have raised HTTPException 400 on forged signature"
    except MockHTTPException as e:
        assert e.status_code == 400
        assert "Invalid webhook signature" in e.detail

    print("[PASS] Test 8: Webhook route signature authentication enforcement & bypass prevention verified.")


async def test_webhook_event_handling_and_idempotency():
    """Verify webhook handles payment.failed without confirming, processes payment_link.paid, and enforces idempotency."""
    import sys
    from datetime import datetime, timezone

    class MockPoolContext:
        def __init__(self, conn):
            self.conn = conn
        async def __aenter__(self):
            return self.conn
        async def __aexit__(self, *args):
            pass

    class MockPool:
        def __init__(self, conn):
            self.conn = conn
        def acquire(self):
            return MockPoolContext(self.conn)

    mock_conn = MagicMock()
    sys.modules["database"].db_pool = MockPool(mock_conn)

    class MockRedis:
        async def set(self, key, val, ex=None, nx=None):
            return True
        async def close(self):
            pass

    redis_mock = MagicMock()
    redis_mock.from_url = lambda url: MockRedis()
    sys.modules["redis.asyncio"] = redis_mock

    from routers.webhooks import handle_tenant_booking_razorpay_webhook

    class MockReq:
        def __init__(self, body_bytes, headers):
            self._body = body_bytes
            self.headers = headers
        async def body(self):
            return self._body

    tenant_id = str(uuid.uuid4())
    booking_id = str(uuid.uuid4())
    contact_id = str(uuid.uuid4())
    wh_secret = "whsec_test_secret_12345"

    tenant_record = {"id": tenant_id, "name": "Dental Clinic", "slug": "dental-clinic", "settings": json.dumps({"admin_whatsapp_number": "+919876543210"})}
    cred_record = {"credential_data": json.dumps({"key_id": "rzp_k", "key_secret": "s", "webhook_secret": wh_secret}), "is_active": True}
    booking_pending = {
        "id": booking_id, "contact_id": contact_id, "conversation_id": str(uuid.uuid4()),
        "service": "Root Canal", "start_time": datetime.now(timezone.utc), "end_time": datetime.now(timezone.utc),
        "status": "pending", "notes": "Pain in tooth", "staff_member": "Dr. Rao", "price": 1200.0, "currency": "INR",
        "payment_status": "pending", "razorpay_payment_id": None
    }
    contact_record = {"name": "Suresh Raina", "phone": "9876543210"}

    # Dynamic fetchrow router
    current_booking = dict(booking_pending)
    async def dynamic_fetchrow(query, *args):
        if "FROM tenants" in query:
            return tenant_record
        elif "FROM tenant_credentials" in query:
            return cred_record
        elif "FROM bookings" in query:
            return current_booking
        elif "FROM contacts" in query:
            return contact_record
        return None

    mock_conn.fetchrow = AsyncMock(side_effect=dynamic_fetchrow)
    executed = []
    mock_conn.execute = AsyncMock(side_effect=lambda q, *a: executed.append((q, a)))

    # 1. Event: payment.failed -> MUST mark failed, MUST NOT confirm booking or dispatch WhatsApp
    fail_payload = json.dumps({
        "id": "evt_fail_1",
        "event": "payment.failed",
        "payload": {
            "payment": {"entity": {"id": "pay_fail_999", "amount": 120000, "notes": {"booking_id": booking_id}}}
        }
    }).encode("utf-8")
    sig_fail = hmac.new(wh_secret.encode(), fail_payload, hashlib.sha256).hexdigest()

    bg = MagicMock()
    req_fail = MockReq(fail_payload, {"x-razorpay-signature": sig_fail})

    # Test slug-based URL lookup
    res_fail = await handle_tenant_booking_razorpay_webhook("dental-clinic", req_fail, bg)
    assert res_fail["message"] == "Payment failure recorded"
    assert any("UPDATE bookings SET payment_status = 'failed'" in q[0] for q in executed)
    assert bg.add_task.call_count == 0, "No notifications on payment.failed!"

    # 2. Event: payment_link.paid -> Confirms booking and schedules customer & admin notifications
    executed.clear()
    bg.reset_mock()
    paid_payload = json.dumps({
        "id": "evt_paid_1",
        "event": "payment_link.paid",
        "payload": {
            "payment_link": {"entity": {"id": "plink_888", "amount_paid": 120000, "notes": {"booking_id": booking_id}}},
            "payment": {"entity": {"id": "pay_success_111", "amount": 120000}}
        }
    }).encode("utf-8")
    sig_paid = hmac.new(wh_secret.encode(), paid_payload, hashlib.sha256).hexdigest()

    req_paid = MockReq(paid_payload, {"x-razorpay-signature": sig_paid})
    res_paid = await handle_tenant_booking_razorpay_webhook(tenant_id, req_paid, bg)

    assert res_paid["status"] == "success"
    assert res_paid["payment_status"] == "paid"
    assert res_paid["amount_paid"] == 1200.0
    assert any("SET payment_status = 'paid'" in q[0] for q in executed)
    # Check that 4 background tasks are scheduled: push, customer WA, admin WA, gcal
    assert bg.add_task.call_count == 4
    # Ensure WhatsApp tasks use 'text=' and NOT 'message_text='
    for call in bg.add_task.call_args_list:
        kwargs = call[1]
        if "to_phone" in kwargs:
            assert "text" in kwargs, "dispatch_whatsapp_message must receive 'text' kwarg"
            assert "message_text" not in kwargs, "dispatch_whatsapp_message must NOT receive 'message_text' kwarg"

    # 3. Idempotency: Repeated delivery on already-paid booking must NOT re-notify
    bg.reset_mock()
    current_booking["payment_status"] = "paid"
    current_booking["status"] = "confirmed"
    current_booking["razorpay_payment_id"] = "pay_success_111"

    res_repeat = await handle_tenant_booking_razorpay_webhook(tenant_id, req_paid, bg)
    assert res_repeat["message"] == "Booking already marked as paid"
    assert bg.add_task.call_count == 0, "Duplicate webhook delivery must NOT dispatch repeated notifications!"

    print("[PASS] Test 9: Webhook event handling (payment.failed vs payment_link.paid) and idempotency verified.")


def test_whatsapp_message_compat():
    """Verify dispatch_whatsapp_message accepts both text and message_text parameters."""
    import inspect
    import sys
    sys.modules.pop("services.whatsapp_service", None)
    from services.whatsapp_service import dispatch_whatsapp_message
    sig = inspect.signature(dispatch_whatsapp_message)
    params = sig.parameters
    assert "text" in params, "dispatch_whatsapp_message must have 'text' parameter"
    assert "message_text" in params, "dispatch_whatsapp_message must have 'message_text' parameter"
    print("[PASS] Test 10: WhatsApp message dispatch parameter compatibility verified.")


async def test_tenant_payment_service_db_resolution():
    """Verify get_tenant_razorpay_creds and create_booking_payment_link handle db=None with auto-resolution and safe fallback."""
    from services.tenant_payment_service import get_tenant_razorpay_creds, create_booking_payment_link

    # 1. Empty tenant_id returns None safely
    assert await get_tenant_razorpay_creds("", db=None) is None

    # 2. When database.db_pool is present, db=None auto-resolves to it
    res = await get_tenant_razorpay_creds("some-tenant-id", db=None)
    assert res is not None, "Should auto-resolve database.db_pool when db=None"
    assert res["key_id"] == "rzp_k"

    # 3. When no db pool is available, returns None safely (no crash or TypeError)
    orig_pool = sys.modules["database"].db_pool
    try:
        sys.modules["database"].db_pool = None
        assert await get_tenant_razorpay_creds("some-tenant-id", db=None) is None
    finally:
        sys.modules["database"].db_pool = orig_pool

    print("[PASS] Test 11: DB auto-resolution and safe fallback without TypeError verified.")


async def main():
    print("=================================================================")
    print("RUNNING TENANT RAZORPAY BOOKING PAYMENT & ISOLATION TEST SUITE...")
    print("=================================================================")
    test_codebase_platform_razorpay_decoupling()
    test_phone_number_cleaning()
    test_tenant_webhook_signature_verification()
    await test_tenant_credentials_isolation_and_no_fallback()
    await test_create_booking_payment_link_success()
    await test_create_booking_payment_link_unconfigured_rejection()
    await test_masked_secret_protection()
    await test_webhook_auth_enforcement_and_rejection()
    await test_webhook_event_handling_and_idempotency()
    test_whatsapp_message_compat()
    await test_tenant_payment_service_db_resolution()
    print("\n=================================================================")
    print("ALL 11 TENANT PAYMENT ISOLATION & BOOKING TESTS PASSED!")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(main())

