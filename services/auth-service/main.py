import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

import asyncpg
import structlog
from fastapi import FastAPI, Depends, HTTPException, status, Form, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

logger = structlog.get_logger("auth-service")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")
JWT_SECRET = os.getenv("JWT_SECRET", "18d73e947ecf30719ab9a2c4e919fc892f36e5c74207429b4a9e82f5ad0e5e7f")
if not os.getenv("JWT_SECRET"):
    logger.warning("jwt_secret_unset_using_fallback", warning="JWT_SECRET is not set in environment! Using default fallback secret key.")
ALGORITHM = "HS256"

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

db_pool: asyncpg.Pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    if not os.getenv("JWT_SECRET"):
        logger.warning("jwt_secret_unset_startup_warning", warning="CRITICAL: JWT_SECRET environment variable is not set. Using hardcoded fallback secret.")
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=2)
    yield
    await db_pool.close()

app = FastAPI(lifespan=lifespan, title="Auth Service")

# ── Schemas ───────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    tenant_id: Optional[str] = None
    tenant_slug: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    tenant_id: str
    email: str
    password: str
    display_name: Optional[str] = None

# ── Auth Utils ────────────────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Support both standard bcrypt $2b$ and postgres pgcrypto $2a$
        hashed_bytes = hashed_password.encode('utf-8')
        if hashed_bytes.startswith(b"$2a$"):
            hashed_bytes = b"$2b$" + hashed_bytes[4:]
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_bytes)
    except Exception as e:
        logger.error("verify_password_error", error=str(e))
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    expire = now_utc + (expires_delta or timedelta(hours=1))
    to_encode.update({"exp": expire, "iat": int(now_utc.timestamp())})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

async def verify_super_admin(
    authorization: Optional[str] = Header(None)
) -> dict:
    """Validates caller's JWT and ensures role is super_admin."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    role = payload.get("role")
    if role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required to create users."
        )
    return payload


@app.post("/users", status_code=201)
async def create_user(
    user: UserCreate,
    caller: dict = Depends(verify_super_admin)
):
    """Register a new user (agent) for a tenant. Restricted to super_admin."""
    async with db_pool.acquire() as conn:
        hashed_pw = get_password_hash(user.password)
        try:
            row = await conn.fetchrow(
                """INSERT INTO users (tenant_id, email, password_hash, display_name)
                   VALUES ($1, $2, $3, $4) RETURNING id""",
                user.tenant_id, user.email, hashed_pw, user.display_name
            )
            return {"id": row["id"], "email": user.email}
        except asyncpg.UniqueViolationError:
            raise HTTPException(400, "User already exists")

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    remember_me: bool = Form(False),
    tenant_slug: Optional[str] = Form(None)
):
    """OAuth2 compatible token login, returns JWT."""
    username_clean = (form_data.username or "").strip().lower()
    clean_tenant_slug = tenant_slug.strip().lower() if tenant_slug and tenant_slug.strip() else None

    async with db_pool.acquire() as conn:
        if clean_tenant_slug:
            user = await conn.fetchrow(
                """SELECT u.id, u.tenant_id, u.password_hash, u.role, u.display_name, u.permissions, u.is_active,
                          t.slug as tenant_slug, t.name as tenant_name
                   FROM users u
                   LEFT JOIN tenants t ON u.tenant_id = t.id
                   WHERE LOWER(TRIM(u.email)) = $1 AND LOWER(TRIM(t.slug)) = $2""",
                username_clean, clean_tenant_slug
            )
        else:
            users = await conn.fetch(
                """SELECT u.id, u.tenant_id, u.password_hash, u.role, u.display_name, u.permissions, u.is_active,
                          t.slug as tenant_slug, t.name as tenant_name
                   FROM users u
                   LEFT JOIN tenants t ON u.tenant_id = t.id
                   WHERE LOWER(TRIM(u.email)) = $1""",
                username_clean
            )
            if len(users) > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Multiple organizations found for this email. Please specify your organization slug (tenant_slug) to log in."
                )
            user = users[0] if users else None

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please check your credentials and try again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please check your credentials and try again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please check your credentials and try again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check tenant subscription gating:
        # Super admin users can ALWAYS log in!
        if user["role"] != "super_admin" and user.get("tenant_id"):
            tenant_info = await conn.fetchrow(
                "SELECT name, org_lifecycle_stage, subscription_status, razorpay_short_url FROM tenants WHERE id = $1::uuid",
                user["tenant_id"]
            )
            if tenant_info:
                stage = tenant_info.get("org_lifecycle_stage") or "setup"
                sub_status = tenant_info.get("subscription_status") or "not_started"
                # Gating rule: Block access if payment is pending (ready_to_activate and not paid)
                # or if billing is active but payment failed/paused/cancelled.
                is_unpaid = (
                    (stage == "ready_to_activate" and sub_status != "active")
                    or (stage == "billing_active" and sub_status in ("payment_failed", "paused", "cancelled"))
                )
                if is_unpaid:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail={
                            "code": "PAYMENT_REQUIRED",
                            "status": sub_status,
                            "org_name": tenant_info["name"],
                            "short_url": tenant_info.get("razorpay_short_url") or "",
                            "message": "Subscription payment required (₹3,499/mo) to access this organization's workspace."
                        }
                    )

        try:
            await conn.execute("UPDATE users SET last_login_at = now() WHERE id = $1", user["id"])
        except Exception:
            pass

        # 30 days if remember_me else 24 hours
        access_token_expires = timedelta(days=30) if remember_me else timedelta(hours=24)
        
        user_perms = user.get("permissions") or {}
        if isinstance(user_perms, str):
            try:
                import json
                user_perms = json.loads(user_perms)
            except Exception:
                user_perms = {}

        tenant_id_val = str(user["tenant_id"]) if user.get("tenant_id") else None
        tenant_slug_val = str(user["tenant_slug"]) if user.get("tenant_slug") else None
        access_token = create_access_token(
            data={
                "sub": str(user["id"]), 
                "tenant_id": tenant_id_val, 
                "tenant_slug": tenant_slug_val,
                "role": user["role"],
                "display_name": user.get("display_name") or "",
                "permissions": user_perms
            },
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "tenant_id": tenant_id_val,
            "tenant_slug": tenant_slug_val,
            "role": user["role"]
        }

@app.get("/users/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    """Validate token and return current user context."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        tenant_slug: str = payload.get("tenant_slug")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        if not tenant_slug and tenant_id and str(tenant_id).lower() != "none" and db_pool:
            try:
                async with db_pool.acquire() as conn:
                    tenant_slug = await conn.fetchval(
                        "SELECT slug FROM tenants WHERE id = $1::uuid", tenant_id
                    )
            except Exception:
                pass

        # Invalidate active JWTs if subscription was halted/cancelled (force-logout)
        if role != "super_admin" and tenant_id and str(tenant_id).lower() != "none" and db_pool:
            async with db_pool.acquire() as conn:
                tenant_inv = await conn.fetchval(
                    "SELECT token_invalidated_at FROM tenants WHERE id = $1::uuid", tenant_id
                )
                if tenant_inv:
                    token_iat = payload.get("iat")
                    if token_iat and datetime.fromtimestamp(token_iat, tz=timezone.utc) < tenant_inv:
                        raise HTTPException(status_code=401, detail="Session expired due to account status change. Please log in again.")

        display_name = payload.get("display_name") or ""
        email = payload.get("email") or ""
        if db_pool and user_id:
            try:
                async with db_pool.acquire() as conn:
                    user_row = await conn.fetchrow(
                        "SELECT email, display_name FROM users WHERE id = $1::uuid", user_id
                    )
                    if user_row:
                        if user_row["display_name"]:
                            display_name = user_row["display_name"]
                        if user_row["email"]:
                            email = user_row["email"]
            except Exception:
                pass

        return {
            "id": user_id, 
            "tenant_id": tenant_id, 
            "tenant_slug": tenant_slug or "",
            "role": role,
            "email": email,
            "display_name": display_name,
            "permissions": payload.get("permissions") or {}
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
