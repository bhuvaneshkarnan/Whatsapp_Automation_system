import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

import asyncpg
import structlog
from fastapi import FastAPI, Depends, HTTPException, status
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
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=1))
    to_encode.update({"exp": expire})
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
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible token login, returns JWT."""
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, tenant_id, password_hash, role FROM users WHERE email = $1 AND is_active = true",
            form_data.username
        )
        if not user or not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        await conn.execute("UPDATE users SET last_login_at = now() WHERE id = $1", user["id"])

        access_token_expires = timedelta(hours=8)
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
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "tenant_id": tenant_id, "role": payload.get("role")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
