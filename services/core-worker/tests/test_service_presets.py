import asyncio
import os
import sys
import json
import httpx
import asyncpg
from datetime import datetime, timezone, timedelta
from jose import jwt

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://platform_user:devpassword@postgres:5432/whatsapp_platform")
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-jwt-key-change-in-production")
ALGORITHM = "HS256"
API_BASE = "http://localhost:8000/api/v1/crm"

def create_admin_token(tenant_id: str, email: str = "admin@boldlabs.com") -> str:
    payload = {
        "sub": email,
        "tenant_id": tenant_id,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=2)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def test_presets_end_to_end():
    print("--> Connecting to Database...")
    pool = await asyncpg.create_pool(DATABASE_URL)
    
    tenant = await pool.fetchrow("SELECT id, name, slug, settings FROM tenants WHERE slug = 'mindbodyrecovery'")
    if not tenant:
        print("[FAIL] Tenant mindbodyrecovery not found")
        await pool.close()
        sys.exit(1)
        
    tenant_id = str(tenant["id"])
    print(f"--> Found tenant: {tenant['name']} ({tenant_id})")
    
    token = create_admin_token(tenant_id)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(base_url=API_BASE, timeout=15.0) as client:
        # 1. Fetch current settings
        get_res = await client.get("/settings", headers=headers)
        assert get_res.status_code == 200, f"GET /settings failed: {get_res.status_code} {get_res.text}"
        data = get_res.json()
        current_presets = data.get("requirement_presets", [])
        print(f"--> Current presets ({len(current_presets)}): {current_presets}")
        
        # 2. Add a test service
        test_service = "E2E Verification Therapy"
        if test_service not in current_presets:
            new_presets = list(current_presets) + [test_service]
        else:
            new_presets = list(current_presets)
            
        payload = {
            "taxonomy": {
                **(data.get("taxonomy") or {}),
                "requirement_presets": new_presets
            },
            "requirement_presets": new_presets
        }
        
        print(f"--> Testing PUT /settings with {len(new_presets)} presets (adding '{test_service}')...")
        put_res = await client.put("/settings", json=payload, headers=headers)
        assert put_res.status_code == 200, f"PUT /settings failed: {put_res.status_code} {put_res.text}"
        
        put_data = put_res.json()
        put_taxonomy_presets = (put_data.get("taxonomy") or {}).get("requirement_presets", [])
        put_root_presets = put_data.get("requirement_presets", [])
        
        print(f"--> PUT response taxonomy.requirement_presets: {put_taxonomy_presets}")
        print(f"--> PUT response root requirement_presets: {put_root_presets}")
        
        assert test_service in put_taxonomy_presets, f"'{test_service}' NOT in PUT response taxonomy presets!"
        assert test_service in put_root_presets, f"'{test_service}' NOT in PUT response root presets!"
        print("--> [PASS] PUT response returned the newly added service!")
        
        # 3. GET /settings to verify persistence
        get_verify = await client.get("/settings", headers=headers)
        assert get_verify.status_code == 200
        get_data = get_verify.json()
        get_taxonomy_presets = (get_data.get("taxonomy") or {}).get("requirement_presets", [])
        get_root_presets = get_data.get("requirement_presets", [])
        
        assert test_service in get_taxonomy_presets, f"'{test_service}' NOT persisted in GET taxonomy presets!"
        assert test_service in get_root_presets, f"'{test_service}' NOT persisted in GET root presets!"
        print("--> [PASS] GET /settings verified persistent storage of new service!")
        
        # 4. Direct DB inspection
        db_tenant = await pool.fetchrow("SELECT settings FROM tenants WHERE id = $1::uuid", tenant["id"])
        db_settings = db_tenant["settings"]
        if isinstance(db_settings, str):
            db_settings = json.loads(db_settings)
        db_tax_presets = (db_settings.get("taxonomy") or {}).get("requirement_presets", [])
        db_root_presets = db_settings.get("requirement_presets", [])
        
        assert test_service in db_tax_presets, "Direct DB check failed: service not in taxonomy.requirement_presets"
        assert test_service in db_root_presets, "Direct DB check failed: service not in requirement_presets"
        print("--> [PASS] Direct Postgres JSONB inspection confirmed persistence!")
        
        # 5. Clean up - remove test service
        print(f"--> Cleaning up '{test_service}' from presets...")
        cleaned_presets = [p for p in new_presets if p != test_service]
        cleanup_payload = {
            "taxonomy": {
                **(data.get("taxonomy") or {}),
                "requirement_presets": cleaned_presets
            },
            "requirement_presets": cleaned_presets
        }
        clean_res = await client.put("/settings", json=cleanup_payload, headers=headers)
        assert clean_res.status_code == 200
        print("--> [PASS] Cleaned up test service successfully.")
        
    await pool.close()
    print("\n==============================================")
    print("ALL SERVICE PRESET TESTS PASSED SUCCESSFULLY!")
    print("==============================================")

if __name__ == "__main__":
    asyncio.run(test_presets_end_to_end())
