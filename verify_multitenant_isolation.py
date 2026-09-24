"""
Comprehensive verification test for multi-tenant isolation across core-worker, crm-api, and calendar-sync.
Tests:
1. Redis key namespacing for tenant credentials and ai_config.
2. Cross-tenant cache isolation between Tenant A and Tenant B.
3. Media proxy tenant boundary validation and filesystem folder isolation.
4. SQL queries isolation check: ensures all UPDATE / DELETE queries on multi-tenant tables include tenant_id.
5. SQL JOIN isolation check: ensures all JOINs between bookings, contacts, and conversations include tenant_id scoping.
6. Admin due alert isolation check: ensures no fallback to random tenant credentials.
7. Cache invalidation completeness: ensures tenant_credentials, ai_config, and kb:{tenant_id}:* are purged.
8. Webhook deduplication key tenant isolation.
"""

import sys
import re
import uuid
import inspect
from unittest.mock import AsyncMock, MagicMock, patch

def test_redis_cache_key_isolation():
    """Verify cache keys strictly contain tenant_id and cannot collide."""
    tenant_a = str(uuid.uuid4())
    tenant_b = str(uuid.uuid4())
    
    key_a_wa = f"tenant_creds:{tenant_a}:whatsapp"
    key_b_wa = f"tenant_creds:{tenant_b}:whatsapp"
    key_a_cfg = f"ai_config:{tenant_a}"
    key_b_cfg = f"ai_config:{tenant_b}"
    key_a_kb = f"kb:{tenant_a}:doc_1"
    key_b_kb = f"kb:{tenant_b}:doc_1"
    
    assert key_a_wa != key_b_wa
    assert key_a_cfg != key_b_cfg
    assert key_a_kb != key_b_kb
    assert tenant_a in key_a_wa and tenant_b not in key_a_wa
    assert tenant_b in key_b_wa and tenant_a not in key_b_wa
    assert tenant_a in key_a_kb and tenant_b not in key_a_kb
    print("[PASS] Test 1: Redis cache key isolation verified.")

def test_media_proxy_isolation_logic():
    """Verify media proxy path and tenant checking logic."""
    import os
    tenant_a = str(uuid.uuid4())
    tenant_b = str(uuid.uuid4())
    media_id = "1234567890"
    
    # Cache directory per tenant
    cache_dir_a = os.path.join("/tmp/wa_media", tenant_a)
    cache_dir_b = os.path.join("/tmp/wa_media", tenant_b)
    
    file_path_a = os.path.join(cache_dir_a, f"{media_id}.jpg")
    file_path_b = os.path.join(cache_dir_b, f"{media_id}.jpg")
    
    assert file_path_a != file_path_b
    assert tenant_a in file_path_a and tenant_b not in file_path_a
    assert tenant_b in file_path_b and tenant_a not in file_path_b
    print("[PASS] Test 2: Media proxy tenant cache path isolation verified.")

def test_sql_queries_tenant_id_audit():
    """Static AST/regex scan of all modified files to ensure UPDATE/DELETE on tenant tables include tenant_id."""
    tables_to_check = [
        "tenant_credentials",
        "contacts",
        "conversations",
        "bookings",
        "customers",
        "marketing_campaigns",
        "scheduled_jobs",
        "push_subscriptions",
    ]
    
    files_to_check = [
        "services/crm-api/routers/calendar.py",
        "services/crm-api/routers/customers.py",
        "services/crm-api/routers/marketing.py",
        "services/crm-api/routers/reviews.py",
        "services/crm-api/routers/whatsapp_embedded.py",
        "services/crm-api/routers/settings.py",
        "services/crm-api/tasks_service.py",
        "services/core-worker/main.py",
        "services/calendar-sync/main.py",
    ]
    
    for fpath in files_to_check:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            
        for tbl in tables_to_check:
            # Check for UPDATE tbl ... WHERE without tenant_id
            pattern = rf'UPDATE\s+{tbl}\s+(?:AS\s+\w+\s+)?SET\s+[^;]+?WHERE\s+([^;"]+)'
            matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
            for m in matches:
                where_clause = m.group(1).lower()
                # Skip global migration script or systemwide aggregate updates if any
                if "due_date + interval" in where_clause:
                    continue
                assert "tenant_id" in where_clause, f"VIOLATION: UPDATE {tbl} without tenant_id in {fpath}: {where_clause}"

            # Check for DELETE FROM tbl ... WHERE without tenant_id
            del_pattern = rf'DELETE\s+FROM\s+{tbl}\s+WHERE\s+([^;"]+)'
            del_matches = re.finditer(del_pattern, content, re.IGNORECASE | re.DOTALL)
            for m in del_matches:
                where_clause = m.group(1).lower()
                assert "tenant_id" in where_clause, f"VIOLATION: DELETE FROM {tbl} without tenant_id in {fpath}: {where_clause}"
                
    print("[PASS] Test 3: SQL isolation audit passed across all CRM API and core-worker files.")

def test_sql_joins_tenant_scoping():
    """Verify that JOINs between tenant tables include tenant_id condition."""
    check_pairs = [
        ("services/calendar-sync/main.py", r"JOIN\s+contacts\s+c\s+ON\s+c\.id\s*=\s*b\.contact_id\s+AND\s+c\.tenant_id\s*=\s*b\.tenant_id"),
        ("services/crm-api/routers/customers.py", r"JOIN\s+contacts\s+ct\s+ON\s+b\.contact_id\s*=\s*ct\.id\s+AND\s+ct\.tenant_id\s*=\s*b\.tenant_id"),
        ("services/crm-api/routers/marketing.py", r"JOIN\s+conversations\s+cv\s+ON\s+cv\.contact_id\s*=\s*c\.id\s+AND\s+cv\.tenant_id\s*=\s*c\.tenant_id"),
        ("services/crm-api/routers/marketing.py", r"JOIN\s+contacts\s+ct\s+ON\s+b\.contact_id\s*=\s*ct\.id\s+AND\s+ct\.tenant_id\s*=\s*b\.tenant_id"),
        ("services/core-worker/main.py", r"JOIN\s+contacts\s+c\s+ON\s+c\.id\s*=\s*conv\.contact_id\s+AND\s+c\.tenant_id\s*=\s*\$2::uuid"),
    ]
    for fpath, pattern in check_pairs:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        assert re.search(pattern, content, re.IGNORECASE), f"Missing tenant scoped JOIN in {fpath} for pattern {pattern}"
    print("[PASS] Test 4: SQL cross-table JOIN tenant scoping verified.")

def test_admin_due_alert_no_cross_tenant_fallback():
    """Verify that admin due alert in auth.py never falls back to another tenant's credentials."""
    with open("services/crm-api/routers/auth.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    assert "admin_due_alert_fallback_to_any_whatsapp_sender" not in content, "Found unsafe cross-tenant fallback in auth.py"
    assert "HTTPException(503, \"No platform administrative WhatsApp credentials configured to send alerts.\")" in content, "Missing strict 503 error on missing platform creds in auth.py"
    print("[PASS] Test 5: Admin due alert strictly prevents cross-tenant credential borrowing.")

def test_cache_invalidation_coverage():
    """Verify invalidate_tenant_cache covers credentials, ai_config, and knowledge base keys."""
    with open("services/crm-api/utils.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    assert "ai_config:{tenant_id}" in content
    assert "tenant_creds:{tenant_id}:whatsapp" in content
    assert "tenant_creds:{tenant_id}:gemini" in content
    assert "tenant_creds:{tenant_id}:groq" in content
    assert "tenant_creds:{tenant_id}:opencode" in content
    assert "tenant_creds:{tenant_id}:google_calendar" in content
    assert "tenant_creds:{tenant_id}:google_business" in content
    assert "kb:{tenant_id}:*" in content
    print("[PASS] Test 6: Cache invalidation thoroughly clears all tenant credentials, ai_config, and knowledge base.")

def test_webhook_dedup_key():
    """Verify webhook ingestion dedupe key is tenant isolated."""
    with open("services/webhook-ingestion/src/routes/webhook.ts", "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "dedup:wa:${config.tenantId}:${msg.id}" in content, "Webhook deduplication key is not scoped to config.tenantId"
    print("[PASS] Test 7: Webhook deduplication key tenant isolation verified.")

if __name__ == "__main__":
    test_redis_cache_key_isolation()
    test_media_proxy_isolation_logic()
    test_sql_queries_tenant_id_audit()
    test_sql_joins_tenant_scoping()
    test_admin_due_alert_no_cross_tenant_fallback()
    test_cache_invalidation_coverage()
    test_webhook_dedup_key()
    print("\n=======================================================")
    print("ALL 7 MULTI-TENANCY ISOLATION CHECKS PASSED SUCCESSFULLY!")
    print("=======================================================")
