import os
import structlog
logger = structlog.get_logger('dependencies')


import os
import re
import csv
import io
import time
import uuid
import json
import asyncio
import hashlib
import html
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Union

import json
import urllib.parse
from fastapi import Request, Header, HTTPException, Depends
from typing import Optional
import database

JWT_SECRET = os.getenv('JWT_SECRET', '')
ALGORITHM = 'HS256'

async def get_tenant_id(
    request: Request = None,
    authorization: Optional[str] = Header(None),
    x_tenant_id: Optional[str] = Header(None),
    x_tenant_slug: Optional[str] = Header(None)
) -> str:
    """
    Secure dynamic tenant scoping dependency:
    - Decodes and validates caller's JWT bearer token.
    - Dynamically resolves tenant by X-Tenant-ID or X-Tenant-Slug header via DB.
    - If user is super_admin, allows managing any tenant specified by X-Tenant-ID or X-Tenant-Slug.
    - If user is a standard tenant user/admin, strictly scopes to the JWT's tenant_id claim.
      Rejects any spoofed X-Tenant-ID or X-Tenant-Slug header with 403 Forbidden.
    """
    clean_requested_id = x_tenant_id.split(",")[0].strip() if x_tenant_id else None
    clean_requested_slug = x_tenant_slug.split(",")[0].strip().lower() if x_tenant_slug else None

    # Inspect query params for target_tenant_id or target_tenant_slug
    if request:
        try:
            q_target_id = request.query_params.get("target_tenant_id")
            if q_target_id and not clean_requested_id:
                clean_requested_id = q_target_id.split(",")[0].strip()
            q_target_slug = request.query_params.get("target_tenant_slug")
            if q_target_slug and not clean_requested_slug:
                clean_requested_slug = q_target_slug.split(",")[0].strip().lower()
        except Exception:
            pass

    # Dynamically resolve slug to tenant ID if slug was provided
    slug_resolved_id = None
    if clean_requested_slug and database.db_pool:
        try:
            row = await database.db_pool.fetchrow(
                "SELECT id FROM tenants WHERE LOWER(slug) = $1", clean_requested_slug
            )
            if row:
                slug_resolved_id = str(row["id"])
        except Exception as e:
            logger.warning("slug_resolution_in_auth_failed", slug=clean_requested_slug, error=str(e))

    # If requested_id wasn't provided but slug was resolved, adopt slug's tenant ID
    if not clean_requested_id and slug_resolved_id:
        clean_requested_id = slug_resolved_id

    # 1. Bearer Token Verification
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            from jose import jwt
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        except Exception as e:
            logger.warning("jwt_verification_failed", error=str(e))
            raise HTTPException(status_code=401, detail="Invalid or expired session token. Please log in again.")

        role = payload.get("role", "agent")
        token_tenant = payload.get("tenant_id")
        user_id = payload.get("sub")

        # Dynamic DB check: verify role directly in DB in case user was promoted or role differs from active JWT
        if role not in ("super_admin", "owner") and user_id and database.db_pool:
            try:
                db_role_row = await database.db_pool.fetchrow("SELECT role FROM users WHERE id = $1::uuid", user_id)
                if db_role_row and db_role_row["role"] in ("super_admin", "owner"):
                    role = db_role_row["role"]
            except Exception:
                pass

        # Super admin can view/act on behalf of any requested tenant, or defaults to own
        if role in ("super_admin", "owner"):
            if clean_requested_slug == "all" or clean_requested_id == "all":
                return "all"
            if clean_requested_id:
                return clean_requested_id
            if token_tenant:
                return str(token_tenant)
            raise HTTPException(status_code=400, detail="X-Tenant-ID or X-Tenant-Slug header required for super_admin")

        # Regular tenant user: token_tenant MUST be present
        if not token_tenant:
            raise HTTPException(status_code=403, detail="No tenant workspace assigned to this account.")

        token_tenant_str = str(token_tenant)

        # Anti-Spoofing Guard: If client sent a different X-Tenant-ID or X-Tenant-Slug header, reject!
        if clean_requested_id and clean_requested_id.lower() != token_tenant_str.lower():
            logger.warning(
                "cross_tenant_access_blocked",
                token_tenant=token_tenant_str,
                requested_tenant=clean_requested_id,
                requested_slug=clean_requested_slug,
                user_id=payload.get("sub"),
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied: Cross-tenant data access is prohibited."
            )

        if slug_resolved_id and slug_resolved_id.lower() != token_tenant_str.lower():
            logger.warning(
                "cross_tenant_slug_access_blocked",
                token_tenant=token_tenant_str,
                slug_resolved_tenant=slug_resolved_id,
                requested_slug=clean_requested_slug,
                user_id=payload.get("sub"),
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied: Cross-tenant data access is prohibited."
            )

        return token_tenant_str

    # 2. Require authorization header
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    raise HTTPException(status_code=401, detail="Invalid authentication format.")


async def get_caller_context(
    authorization: Optional[str] = Header(None)
) -> dict:
    """Extract caller role, permissions, and assigned specialties from JWT for data scoping."""
    if not authorization or not authorization.startswith("Bearer "):
        return {"user_id": None, "role": "agent", "assigned_health_concerns": [], "assigned_doctor": None, "permissions": {}}
    token = authorization.split(" ", 1)[1].strip()
    try:
        from jose import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except Exception:
        return {"user_id": None, "role": "agent", "assigned_health_concerns": [], "assigned_doctor": None, "permissions": {}}
    role = payload.get("role", "agent")
    user_id = payload.get("sub")
    if role not in ("super_admin", "owner") and user_id and database.db_pool:
        try:
            db_role_row = await database.db_pool.fetchrow("SELECT role FROM users WHERE id = $1::uuid", user_id)
            if db_role_row and db_role_row["role"] in ("super_admin", "owner"):
                role = db_role_row["role"]
        except Exception:
            pass
    perms = payload.get("permissions", {})
    if isinstance(perms, str):
        try:
            perms = json.loads(perms)
        except Exception:
            perms = {}
    if not isinstance(perms, dict):
        perms = {}
    concerns = perms.get("assigned_health_concerns", [])
    if not isinstance(concerns, list):
        concerns = []
    assigned_doc = perms.get("assigned_doctor") or None
    return {
        "user_id": user_id,
        "role": role,
        "assigned_health_concerns": concerns,
        "assigned_doctor": assigned_doc,
        "permissions": perms,
    }


async def verify_super_admin(authorization: Optional[str] = Header(None)) -> dict:
    """Strict Super-Admin Gate: Only platform super_admin is authorized."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    token = authorization.split(" ", 1)[1].strip()
    try:
        from jose import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

    role = payload.get("role")
    user_id = payload.get("sub")
    if role not in ("super_admin", "owner") and user_id and database.db_pool:
        try:
            db_role_row = await database.db_pool.fetchrow("SELECT role FROM users WHERE id = $1::uuid", user_id)
            if db_role_row and db_role_row["role"] in ("super_admin", "owner"):
                role = db_role_row["role"]
        except Exception:
            pass
    if role not in ("super_admin", "owner"):
        raise HTTPException(status_code=403, detail="Platform Super Admin privileges required.")
    return payload
