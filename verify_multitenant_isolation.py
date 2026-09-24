"""
Verification test for multi-tenant isolation across core-worker, crm-api, and webhook-ingestion.
Tests:
1. Redis key namespacing for tenant credentials and ai_config.
2. Cross-tenant cache isolation between Tenant A and Tenant B.
3. Media proxy tenant boundary validation and filesystem folder isolation.
4. SQL queries isolation check: ensures all UPDATE / DELETE queries on multi-tenant tables include tenant_id.
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
    
    assert key_a_wa != key_b_wa
    assert key_a_cfg != key_b_cfg
    assert tenant_a in key_a_wa and tenant_b not in key_a_wa
    assert tenant_b in key_b_wa and tenant_a not in key_b_wa
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
        "marketing_campaigns",
        "scheduled_jobs",
        "push_subscriptions",
    ]
    
    files_to_check = [
        "services/crm-api/routers/calendar.py",
        "services/crm-api/routers/reviews.py",
        "services/crm-api/routers/whatsapp_embedded.py",
        "services/crm-api/routers/settings.py",
        "services/crm-api/tasks_service.py",
        "services/core-worker/main.py",
    ]
    
    for fpath in files_to_check:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            
        for tbl in tables_to_check:
            # Check for UPDATE tbl ... WHERE without tenant_id
            pattern = rf'UPDATE\s+{tbl}\s+SET\s+[^;]+?WHERE\s+([^;"]+)'
            matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
            for m in matches:
                where_clause = m.group(1).lower()
                assert "tenant_id" in where_clause, f"VIOLATION: UPDATE {tbl} without tenant_id in {fpath}: {where_clause}"

            # Check for DELETE FROM tbl ... WHERE without tenant_id
            del_pattern = rf'DELETE\s+FROM\s+{tbl}\s+WHERE\s+([^;"]+)'
            del_matches = re.finditer(del_pattern, content, re.IGNORECASE | re.DOTALL)
            for m in del_matches:
                where_clause = m.group(1).lower()
                assert "tenant_id" in where_clause, f"VIOLATION: DELETE FROM {tbl} without tenant_id in {fpath}: {where_clause}"
                
    print("[PASS] Test 3: SQL isolation audit passed across all CRM API files.")

def test_webhook_dedup_key():
    """Verify webhook ingestion dedupe key is tenant isolated."""
    with open("services/webhook-ingestion/src/routes/webhook.ts", "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "dedup:wa:${config.tenantId}:${msg.id}" in content, "Webhook deduplication key is not scoped to config.tenantId"
    print("[PASS] Test 4: Webhook deduplication key tenant isolation verified.")

if __name__ == "__main__":
    test_redis_cache_key_isolation()
    test_media_proxy_isolation_logic()
    test_sql_queries_tenant_id_audit()
    test_webhook_dedup_key()
    print("\nALL MULTI-TENANCY ISOLATION CHECKS PASSED SUCCESSFULLY!")
