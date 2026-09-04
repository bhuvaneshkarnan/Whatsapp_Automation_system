import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

import asyncpg
import structlog
from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

logger = structlog.get_logger("auth-service")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform")
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_dev_key_only")
ALGORITHM = "HS256"

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

db_pool: asyncpg.Pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=2)
    yield
    await db_pool.close()

app = FastAPI(lifespan=lifespan, title="Auth Service")

# ── Schemas ───────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    tenant_id: str

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

@app.post("/users", status_code=201)
async def create_user(user: UserCreate):
    """Register a new user (agent) for a tenant."""
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
    remember_me: bool = Form(False)
):
    """OAuth2 compatible token login, returns JWT."""
    username_clean = (form_data.username or "").strip().lower()
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, tenant_id, password_hash, role FROM users WHERE LOWER(TRIM(email)) = $1 AND is_active = true",
            username_clean
        )

        password_valid = user and verify_password(form_data.password, user["password_hash"])
        
        if not user or not password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
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
                # Gating rule: ONLY gate if org_lifecycle_stage == 'billing_active' and subscription_status in ('payment_failed', 'paused', 'cancelled')
                # Orgs in 'setup' or 'ready_to_activate' log in freely!
                if stage == "billing_active" and sub_status in ("payment_failed", "paused", "cancelled"):
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail={
                            "code": "PAYMENT_REQUIRED",
                            "status": sub_status,
                            "org_name": tenant_info["name"],
                            "short_url": tenant_info.get("razorpay_short_url") or "",
                            "message": "Subscription payment required to access this organization's workspace."
                        }
                    )

        try:
            await conn.execute("UPDATE users SET last_login_at = now() WHERE id = $1", user["id"])
        except Exception:
            pass

        # 30 days if remember_me else 24 hours
        access_token_expires = timedelta(days=30) if remember_me else timedelta(hours=24)
        access_token = create_access_token(
            data={"sub": str(user["id"]), "tenant_id": str(user["tenant_id"]), "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "tenant_id": str(user["tenant_id"])
        }

@app.get("/users/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    """Validate token and return current user context."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Invalidate active JWTs if subscription was halted/cancelled (force-logout)
        if role != "super_admin" and tenant_id and db_pool:
            async with db_pool.acquire() as conn:
                tenant_inv = await conn.fetchval(
                    "SELECT token_invalidated_at FROM tenants WHERE id = $1::uuid", tenant_id
                )
                if tenant_inv:
                    token_iat = payload.get("iat")
                    if token_iat and datetime.fromtimestamp(token_iat, tz=timezone.utc) < tenant_inv:
                        raise HTTPException(status_code=401, detail="Session expired due to account status change. Please log in again.")

        return {"id": user_id, "tenant_id": tenant_id, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
