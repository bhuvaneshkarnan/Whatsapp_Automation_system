import os
import urllib.parse
import random
import base64
import hmac
from utils import safe_json_loads, get_tenant_base_url
from dependencies import JWT_SECRET
from fastapi.responses import RedirectResponse


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
import uuid
from datetime import datetime, timezone
import structlog
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Response
from typing import Optional, List, Any
import database
from models import PublicReviewSubmitRequest, ReviewStatusUpdateRequest, GoogleBusinessOAuthInitPayload, GoogleReviewReplyPayload, AiReplyDraftPayload
from dependencies import get_tenant_id
import utils

router = APIRouter()
logger = structlog.get_logger('crm-api-reviews')

@router.get("/public/{slug}/review-info")
@router.get("/api/v1/crm/public/{slug}/review-info")
async def get_public_review_info(slug: str):
    """Public endpoint for /{slug}/review page. Returns public business name, logo, custom experience tags, and service presets without authentication."""
    slug_clean = (slug or "").strip().lower()
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow(
            "SELECT id, name, slug, plan, settings FROM tenants WHERE LOWER(slug) = $1 OR id::text = $1 LIMIT 1",
            slug_clean
        )
        if not tenant:
            raise HTTPException(404, "Organization not found")
        
        cfg = tenant["settings"] or {}
        if isinstance(cfg, str):
            try: cfg = json.loads(cfg)
            except: cfg = {}
            
        tax = cfg.get("taxonomy") or {}
        if isinstance(tax, str):
            try: tax = json.loads(tax)
            except: tax = {}

        industry = cfg.get("industry") or "clinic"
        default_concerns = {
            "clinic": ["General Consultation", "Dental Checkup & Cleaning", "Skin Health & Dermatology", "Back Pain & Physio", "Diabetes & Wellness"],
            "education": ["Class 10 Board Exam", "Class 12 IIT-JEE (Physics/Math)", "NEET Medical Entrance", "Spoken English & Fluency"],
            "real_estate": ["2 BHK Apartment (Mid-Budget)", "3 BHK Luxury Villa", "Commercial Office Space", "Residential Plot / Land"],
            "salon_spa": ["Haircut & Styling", "Keratin / Hair Spa", "Facial & Skin Rejuvenation", "Bridal Makeup Package"],
            "automobile": ["Periodic General Service", "Brake & Suspension Check", "Engine Diagnostics & Oil Change"],
        }.get(industry, ["General Consultation", "Follow-up Visit", "Specialist Consultation"])

        services = tax.get("requirement_presets") or cfg.get("requirement_presets") or default_concerns
        
        default_tags = [
            'Friendly & Caring Staff',
            'Clean & Hygienic Space',
            'Quick & Prompt Service',
            'Detailed Explanation',
            'Great Results & Treatment',
            'Value for Money',
            'Comfortable & Relaxing',
            'Easy Booking & Response',
        ]
        tags = cfg.get("review_experience_tags") or default_tags
        gmb_url = (cfg.get("gmb_review_url") or cfg.get("google_review_link") or "").strip()
        if not gmb_url:
            place_id = (cfg.get("google_place_id") or "").strip()
            if place_id:
                gmb_url = f"https://search.google.com/local/writereview?placeid={place_id}"
            else:
                gmb_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(tenant['name'])}"

        loc_city = extract_city(cfg.get("full_location_text", "")) or cfg.get("city") or cfg.get("location") or ""

        return {
            "status": "ok",
            "name": tenant["name"],
            "slug": tenant["slug"],
            "plan": tenant["plan"],
            "industry": industry,
            "logo_url": cfg.get("logo_url", ""),
            "gmb_review_url": gmb_url,
            "review_experience_tags": tags,
            "requirement_presets": services,
            "services": services,
            "city": loc_city,
            "location": loc_city
        }


def clean_human_review_text(text: str) -> str:
    """
    Ensures the review text looks 100% natural and human-written.
    Strips internal thoughts, quotes, hyphens, and robotic label artifacts.
    """
    if not text:
        return ""
    # Strip thinking blocks if any
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    # Strip all quotation marks, backticks
    text = re.sub(r'["\u201c\u201d\u201e\u201f`]', '', text)
    # Strip all hyphens, en-dashes, em-dashes (per user requirement: strictly no hyphens)
    text = re.sub(r'[-\u2013\u2014]', ' ', text)
    # Strip robotic labels like 'Highlights:', 'Notes:', 'Review:'
    text = re.sub(r'(?i)\b(highlights|notes|review|service|rating|experience):\s*', '', text)
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    # Strip leading/trailing single quotes
    text = text.strip("'").strip("\u2018").strip("\u2019").strip()
    return text


def extract_city(full_loc: str) -> str:
    if not full_loc or not isinstance(full_loc, str):
        return ""
    m = re.search(r'([a-zA-Z\s]+)(?:-\s*\d{5,6}|\b\d{5,6}\b)', full_loc)
    if m:
        candidate = m.group(1).strip().strip(',').strip()
        words = candidate.split()
        if words:
            return words[-1].title()
    parts = [p.strip() for p in full_loc.split(',') if p.strip()]
    if parts:
        cleaned = re.sub(r'[-\d]+', '', parts[-1]).strip()
        if cleaned:
            return cleaned.title()
    return ""


def generate_varied_human_review_fallback(
    business_name: str,
    service_name: str,
    notes: str,
    location: str = "",
    person_name: str = ""
) -> str:
    """
    High-variety randomized human review generator with dozens of SEO and location-tailored permutations.
    Strictly free of quotes, hyphens, and robotic phrasing.
    """
    clean_notes = clean_human_review_text(notes)
    b_name = business_name.strip() or "this business"
    s_name = service_name.strip() or "service"
    loc_part = f"in {location}" if location else ""
    c_part = f"{person_name} and the team" if person_name else "the team"

    templates = [
        f"Setting up {s_name} with {b_name} {loc_part} was hands down the best decision for our workflow. {c_part} made the entire process crystal clear and quick. Really glad we partnered with them.",
        f"If you are looking for reliable {s_name} {loc_part}, {b_name} is definitely the team to reach out to. Communication was prompt and {c_part} took care of everything seamlessly.",
        f"Our day to day operations {loc_part} became so much smoother after implementing {s_name} through {b_name}. Customer response times improved right away.",
        f"Top notch experience with {b_name} for {s_name}. {c_part} was patient, knowledgeable, and delivered exactly what was promised {loc_part}.",
        f"Super impressed with the speed and attention to detail at {b_name}. Their {s_name} setup {loc_part} has saved us countless hours already.",
        f"Managing inquiries used to be hectic until we got {s_name} from {b_name}. Big thanks to {c_part} for making the transition effortless {loc_part}.",
        f"Fantastic support and quick turnaround on our {s_name}. {b_name} is easily one of the most professional teams {loc_part}.",
        f"Could not be happier with how smoothly our {s_name} is running now with {b_name}. Highly recommend their solutions to any business {loc_part}."
    ]
    if clean_notes:
        templates.extend([
            f"Really impressed with {b_name} and their {s_name} service {loc_part}. {clean_notes} was handled with great care and {c_part} was super helpful.",
            f"Had a seamless experience with {s_name} at {b_name} {loc_part}. Special appreciation for {clean_notes}. Will gladly recommend them to others."
        ])
    return clean_human_review_text(random.choice(templates))


async def generate_ai_smart_review(
    tenant_id: str,
    business_name: str,
    service_name: str,
    notes: str,
    rating: int,
    conn: Any,
    settings: Optional[dict] = None,
    customer_name: Optional[str] = "",
    customer_location: Optional[str] = ""
) -> str:
    """
    Generates a unique, natural, human-feeling review using LLM (Gemini / Groq),
    with automatic cascading fallback to our dynamic randomized generator.
    Enforces local SEO (city, service, business, name) and avoids identical previous reviews.
    """
    clean_notes = clean_human_review_text(notes)
    b_name = business_name.strip() or "the business"
    s_name = service_name.strip() or "service"
    c_name = (customer_name or "").strip()

    settings = settings or {}
    loc = (customer_location or settings.get("city") or settings.get("location") or extract_city(settings.get("full_location_text", "")) or "").strip()

    # Fetch recent reviews to enforce uniqueness and avoid duplicate phrasing
    avoid_block = ""
    try:
        prev_rows = await conn.fetch(
            "SELECT generated_review_text FROM customer_reviews WHERE tenant_id = $1::uuid ORDER BY created_at DESC LIMIT 5",
            tenant_id
        )
        prev_texts = [clean_human_review_text(r["generated_review_text"]) for r in prev_rows if r["generated_review_text"]]
        if prev_texts:
            avoid_block = "PREVIOUS REVIEWS FOR THIS BUSINESS (YOU MUST STRICTLY AVOID THESE OPENING WORDS, PATTERNS, AND PHRASING):\n" + "\n".join([f'- "{pt[:110]}..."' for pt in prev_texts[:4]])
    except Exception as _e:
        logger.debug("fetch_prev_reviews_failed", error=str(_e))

    archetypes = [
        f"A brief, simple 1-2 sentence review focusing directly on the service received.",
        f"A direct, casual review in natural Indian English highlighting the quality of work.",
        f"Focus entirely on the helpfulness of {c_name if c_name else 'the staff'}.",
        f"A straightforward, minimal recommendation mentioning the shop and location."
    ]
    chosen_archetype = random.choice(archetypes)

    gem_key = ""
    groq_key = ""
    try:
        gem_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'gemini' AND is_active = true",
            tenant_id
        )
        if gem_row and gem_row["credential_data"]:
            d = gem_row["credential_data"]
            gem_key = (d if isinstance(d, dict) else json.loads(d)).get("api_key", "")
    except Exception:
        pass
    if not gem_key:
        gem_key = os.getenv("GEMINI_API_KEY", "")

    try:
        groq_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'groq' AND is_active = true",
            tenant_id
        )
        if groq_row and groq_row["credential_data"]:
            d = groq_row["credential_data"]
            groq_key = (d if isinstance(d, dict) else json.loads(d)).get("api_key", "")
    except Exception:
        pass
    if not groq_key:
        groq_key = os.getenv("GROQ_API_KEY", "")

    prompt = f"""You are a genuine, satisfied customer writing a brief, realistic Google review for {b_name}.
Service experienced: {s_name}
Location: {loc if loc else "local area"}
Staff/Team: {c_name if c_name else "the team"}
Customer highlights/Tags: {clean_notes if clean_notes else "good service"}

REVIEW PERSPECTIVE TO ADOPT:
{chosen_archetype}

{avoid_block}

CRITICAL SEO & AUTHENTICITY RULES:
- Write like a real person typing casually on their phone in natural Indian English (simple, polite, straightforward).
- STRICTLY 1 to 2 short sentences MAX. Do not over-explain.
- Naturally include the location ({loc}) and the brand name ({b_name}) for Google Maps Local SEO.
- Mention the service ({s_name}) and the specific highlights/tags provided.
- NO dramatic or overly enthusiastic storytelling (e.g., avoid "chaotic day", "saved my life", "absolute rockstars").
- STRICTLY NO quotation marks and NO hyphens.
- Output ONLY the review text. Nothing else."""

    if gem_key:
        for model in ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash-preview"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gem_key}"
            try:
                async with httpx.AsyncClient(timeout=3.5) as client:
                    res = await client.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {"temperature": 1.05, "maxOutputTokens": 130}
                        }
                    )
                    if res.status_code == 200:
                        raw = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                        cleaned = clean_human_review_text(raw)
                        if len(cleaned.split()) >= 6:
                            return cleaned
            except Exception as _gem_err:
                logger.debug("gemini_review_gen_fallback", model=model, error=str(_gem_err))

    return generate_varied_human_review_fallback(b_name, s_name, clean_notes, loc, c_name)


@router.post("/reviews/submit")
@router.post("/api/v1/crm/reviews/submit")
async def submit_public_review(payload: PublicReviewSubmitRequest):
    """Public endpoint for customer smart reviews & GMB feedback collection."""
    slug = (payload.tenant_slug or "").strip().lower()
    async with database.db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, name, settings FROM tenants WHERE LOWER(slug) = $1 OR id::text = $1 LIMIT 1", slug)
        if not tenant:
            raise HTTPException(status_code=404, detail="Client business workspace not found.")

        t_id = tenant["id"]
        t_name = tenant["name"]
        settings = tenant["settings"] if isinstance(tenant["settings"], dict) else json.loads(tenant["settings"] or "{}")
        gmb_url = (settings.get("gmb_review_url") or settings.get("google_review_link") or "").strip()
        if not gmb_url:
            place_id = (settings.get("google_place_id") or "").strip()
            if place_id:
                gmb_url = f"https://search.google.com/local/writereview?placeid={place_id}"
            else:
                gmb_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(t_name)}"

        srv = (payload.service_name or "service").strip()
        notes = (payload.experience_notes or "").strip()
        name = (payload.customer_name or "").strip()
        cust_loc = (getattr(payload, "customer_location", "") or "").strip()

        # Build AI / Smart Review Text
        if payload.rating >= 4:
            gen_text = await generate_ai_smart_review(
                t_id, t_name, srv, notes, payload.rating, conn,
                settings=settings,
                customer_name=name,
                customer_location=cust_loc
            )
            destination = "gmb"
        else:
            clean_n = clean_human_review_text(notes)
            if clean_n:
                gen_text = f"Customer feedback regarding {srv}: {clean_n}"
            else:
                gen_text = f"Customer provided {payload.rating} star feedback for {srv}."
            gen_text = clean_human_review_text(gen_text)
            destination = "crm_internal"

        # Save review to database
        row = await conn.fetchrow("""
            INSERT INTO customer_reviews (
                tenant_id, customer_name, customer_phone, service_name,
                rating, experience_notes, generated_review_text, destination, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING id, created_at
        """, t_id, name, payload.customer_phone or "", srv, payload.rating, notes, gen_text, destination)

        return {
            "status": "ok",
            "review_id": str(row["id"]),
            "destination": destination,
            "rating": payload.rating,
            "generated_review_text": gen_text,
            "gmb_review_url": gmb_url,
            "tenant_name": t_name
        }


@router.get("/reviews")
@router.get("/api/v1/crm/reviews")
async def list_customer_reviews(
    tenant_id: str = Depends(get_tenant_id),
    rating: Optional[int] = None,
    destination: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """List customer reviews & feedback for tenant CRM dashboard."""
    async with database.db_pool.acquire() as conn:
        conditions = ["tenant_id = $1::uuid"]
        params = [tenant_id]
        idx = 2

        if rating is not None:
            conditions.append(f"rating = ${idx}")
            params.append(rating)
            idx += 1
        if destination:
            conditions.append(f"destination = ${idx}")
            params.append(destination)
            idx += 1
        if status:
            conditions.append(f"status = ${idx}")
            params.append(status)
            idx += 1

        where_clause = " WHERE " + " AND ".join(conditions)
        count = await conn.fetchval(f"SELECT COUNT(*) FROM customer_reviews {where_clause}", *params)

        query = f"SELECT id::text, tenant_id::text, customer_name, customer_phone, service_name, rating, experience_notes, generated_review_text, destination, status, created_at::text, COALESCE(google_review_id, '') AS google_review_id, COALESCE(reviewer_photo_url, '') AS reviewer_photo_url, COALESCE(owner_reply_text, '') AS owner_reply_text, owner_replied_at::text, COALESCE(source, 'direct_collector') AS source FROM customer_reviews {where_clause} ORDER BY created_at DESC LIMIT ${idx} OFFSET ${idx+1}"
        rows = await conn.fetch(query, *params, limit, offset)

        return {
            "reviews": [dict(r) for r in rows],
            "total": count or 0
        }


@router.patch("/reviews/{review_id}")
@router.patch("/api/v1/crm/reviews/{review_id}")
async def update_customer_review_status(
    review_id: str,
    payload: ReviewStatusUpdateRequest,
    tenant_id: str = Depends(get_tenant_id)
):
    """Update review resolution status in CRM."""
    async with database.db_pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE customer_reviews
            SET status = $1
            WHERE id = $2::uuid AND tenant_id = $3::uuid
            RETURNING id::text, status
        """, payload.status, review_id, tenant_id)
        if not row:
            raise HTTPException(status_code=404, detail="Review record not found.")
        return {"status": "ok", "review_id": str(row["id"]), "new_status": row["status"]}


@router.delete("/reviews/{review_id}")
@router.delete("/api/v1/crm/reviews/{review_id}")
async def delete_customer_review(
    review_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a review record (e.g. test reviews or unwanted spam entries)."""
    async with database.db_pool.acquire() as conn:
        res = await conn.execute(
            "DELETE FROM customer_reviews WHERE id = $1::uuid AND tenant_id = $2::uuid",
            review_id, tenant_id
        )
        if res == "DELETE 0":
            raise HTTPException(status_code=404, detail="Review record not found.")
        return {"status": "ok", "message": "Review deleted successfully.", "review_id": review_id}



# ── Google Business Profile (GMB) Reviews & Live Reply API ───────────────────────

# Use the exact same Authorized Redirect URI as Google Calendar by default
GOOGLE_BUSINESS_REDIRECT_URI = os.getenv(
    "GOOGLE_BUSINESS_REDIRECT_URI",
    f"{os.getenv('APP_BASE_URL', 'http://localhost')}/oauth/google/callback"
)

async def get_google_business_access_token(conn, tenant_id: str) -> tuple[str, dict]:
    """Retrieve and refresh Google Business access token if expired."""
    row = await conn.fetchrow(
        "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_business' AND is_active = true",
        tenant_id
    )
    if not row or not row["credential_data"]:
        raise HTTPException(status_code=400, detail="Google Business Profile is not connected for this business.")

    data = safe_json_loads(row["credential_data"], {})
    refresh_token = data.get("refresh_token")
    client_id = data.get("client_id") or os.getenv("GOOGLE_CLIENT_ID")
    client_secret = data.get("client_secret") or os.getenv("GOOGLE_CLIENT_SECRET")

    # Fallback to Google Calendar credentials if client_id / secret were not stored in google_business row
    if not client_id or not client_secret:
        gcal_row = await conn.fetchrow(
            "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
            tenant_id
        )
        if gcal_row and gcal_row["credential_data"]:
            gcd = safe_json_loads(gcal_row["credential_data"], {})
            client_id = client_id or gcd.get("client_id")
            client_secret = client_secret or gcd.get("client_secret")

    if not refresh_token or not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="Google Business OAuth credentials incomplete.")

    expiry = data.get("token_expiry", 0)
    now_ts = int(datetime.now(timezone.utc).timestamp())
    if data.get("access_token") and expiry > (now_ts + 60):
        return data["access_token"], data

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
        )
        if resp.status_code != 200:
            logger.error("google_business_token_refresh_failed", status=resp.status_code, body=resp.text)
            raise HTTPException(status_code=400, detail=f"Failed to refresh Google token: {resp.text}")

        token_data = resp.json()
        new_access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 3600)
        data["access_token"] = new_access_token
        data["token_expiry"] = now_ts + expires_in

        await conn.execute(
            "UPDATE tenant_credentials SET credential_data = $1::jsonb WHERE id = $2::uuid",
            json.dumps(data), row["id"]
        )
        return new_access_token, data


@router.post("/oauth/google-business/init")
@router.post("/api/v1/crm/oauth/google-business/init")
async def init_google_business_oauth(
    payload: GoogleBusinessOAuthInitPayload,
    request: Request,
    tenant_id: str = Depends(get_tenant_id)
):
    """Save Google Client ID & Secret, and generate Google OAuth authorization URL for Google Business Profile."""
    c_id = (payload.client_id or "").strip()
    c_sec = (payload.client_secret or "").strip()

    async with database.db_pool.acquire() as conn:
        # Fallback to existing credentials in google_business or google_calendar
        if not c_id or not c_sec:
            existing_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_business'",
                tenant_id
            )
            if existing_row and existing_row["credential_data"]:
                ex_d = safe_json_loads(existing_row["credential_data"], {})
                c_id = c_id or (ex_d.get("client_id") or "").strip()
                c_sec = c_sec or (ex_d.get("client_secret") or "").strip()

        if not c_id or not c_sec:
            gcal_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
                tenant_id
            )
            if gcal_row and gcal_row["credential_data"]:
                gcd = safe_json_loads(gcal_row["credential_data"], {})
                c_id = c_id or (gcd.get("client_id") or "").strip()
                c_sec = c_sec or (gcd.get("client_secret") or "").strip()

        if not c_id:
            c_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
        if not c_sec:
            c_sec = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()

        if not c_id or not c_sec:
            raise HTTPException(400, "Google Client ID and Client Secret are required. Please enter them or configure Google Calendar first.")

        row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_business'",
            tenant_id
        )
        data = safe_json_loads(row["credential_data"] if row else {}, {})
        data["client_id"] = c_id
        data["client_secret"] = c_sec
        g_id = str(row["id"]) if row else str(uuid.uuid4())

        if row:
            await conn.execute(
                "UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true WHERE id = $2::uuid",
                json.dumps(data), g_id
            )
        else:
            await conn.execute(
                "INSERT INTO tenant_credentials (id, tenant_id, provider, credential_data, is_active) VALUES ($1::uuid, $2::uuid, 'google_business', $3::jsonb, true)",
                g_id, tenant_id, json.dumps(data)
            )

    scopes = "https://www.googleapis.com/auth/business.manage openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"

    req_origin = request.headers.get("origin") or ""
    if not req_origin and request.headers.get("referer"):
        parsed = urllib.parse.urlparse(request.headers.get("referer"))
        if parsed.scheme and parsed.netloc:
            req_origin = f"{parsed.scheme}://{parsed.netloc}"

    state_nonce = os.urandom(16).hex()
    state_exp = int(datetime.now(timezone.utc).timestamp()) + 600
    state_dict = {
        "tenant_id": tenant_id,
        "source": (payload.source or "dashboard").strip(),
        "provider": "google_business",
        "redirect_uri": GOOGLE_BUSINESS_REDIRECT_URI,
        "nonce": state_nonce,
        "exp": state_exp,
        "return_origin": req_origin
    }
    state_raw = json.dumps(state_dict, separators=(',', ':'))
    state_b64 = base64.urlsafe_b64encode(state_raw.encode("utf-8")).decode("utf-8").rstrip("=")
    state_sig = hmac.new(JWT_SECRET.encode("utf-8"), state_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    state_payload = f"{state_b64}.{state_sig}"

    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={c_id}&"
        f"redirect_uri={GOOGLE_BUSINESS_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope={scopes}&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={state_payload}"
    )
    return {"auth_url": auth_url, "redirect_uri": GOOGLE_BUSINESS_REDIRECT_URI}


@router.get("/oauth/google-business/callback")
@router.get("/api/v1/crm/oauth/google-business/callback")
async def google_business_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """OAuth callback for Google Business Profile: exchange code for refresh token and auto-discover business location."""
    if not state or "." not in state:
        raise HTTPException(400, "Invalid or missing OAuth state parameter.")
    try:
        parts = state.split(".", 1)
        state_b64, state_sig = parts[0], parts[1]
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), state_b64.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, state_sig):
            raise HTTPException(400, "OAuth state signature verification failed.")
        padded_b64 = state_b64 + "=" * ((4 - len(state_b64) % 4) % 4)
        state_data = json.loads(base64.urlsafe_b64decode(padded_b64.encode("utf-8")).decode("utf-8"))
    except Exception as e:
        raise HTTPException(400, f"Invalid OAuth state: {str(e)}")

    tenant_id = state_data.get("tenant_id")
    if not tenant_id:
        raise HTTPException(400, "Missing tenant ID in OAuth state.")

    ret_origin = (state_data.get("return_origin") or "").rstrip("/")

    async with database.db_pool.acquire() as conn:
        tenant_slug = await conn.fetchval("SELECT slug FROM tenants WHERE id = $1::uuid", tenant_id)
        if not ret_origin:
            ret_origin = await get_tenant_base_url(conn, tenant_id)

        base_redir = f"{ret_origin}/{tenant_slug}" if tenant_slug else f"{ret_origin}/dashboard"

        if error or not code:
            return RedirectResponse(f"{base_redir}?gmb_error={error or 'cancelled'}")

        row = await conn.fetchrow(
            "SELECT id, credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_business'",
            tenant_id
        )
        if not row:
            return RedirectResponse(f"{base_redir}?gmb_error=missing_credentials")

        cdata = safe_json_loads(row["credential_data"], {})
        c_id = cdata.get("client_id")
        c_sec = cdata.get("client_secret")

        if not c_id or not c_sec:
            gcal_row = await conn.fetchrow(
                "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_calendar'",
                tenant_id
            )
            if gcal_row and gcal_row["credential_data"]:
                gcd = safe_json_loads(gcal_row["credential_data"], {})
                c_id = c_id or gcd.get("client_id")
                c_sec = c_sec or gcd.get("client_secret")

        if not c_id:
            c_id = os.getenv("GOOGLE_CLIENT_ID", "")
        if not c_sec:
            c_sec = os.getenv("GOOGLE_CLIENT_SECRET", "")

        eff_redirect_uri = state_data.get("redirect_uri") or GOOGLE_BUSINESS_REDIRECT_URI

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": c_id,
                    "client_secret": c_sec,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": eff_redirect_uri,
                }
            )
            if token_resp.status_code != 200:
                logger.error("google_business_token_exchange_failed", status=token_resp.status_code, body=token_resp.text)
                return RedirectResponse(f"{base_redir}?gmb_error=token_exchange_failed")

            tjson = token_resp.json()
            access_token = tjson.get("access_token")
            refresh_token = tjson.get("refresh_token") or cdata.get("refresh_token")
            expires_in = tjson.get("expires_in", 3600)
            now_ts = int(datetime.now(timezone.utc).timestamp())

            cdata["access_token"] = access_token
            cdata["refresh_token"] = refresh_token
            cdata["token_expiry"] = now_ts + expires_in
            cdata["connected_at"] = datetime.now(timezone.utc).isoformat()

            account_name = ""
            location_name = ""
            location_title = ""
            try:
                acc_resp = await client.get(
                    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if acc_resp.status_code == 200:
                    accounts = acc_resp.json().get("accounts", [])
                    if accounts:
                        account_name = accounts[0].get("name", "")
                        loc_resp = await client.get(
                            f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_name}/locations?readMask=name,title,storefrontAddress",
                            headers={"Authorization": f"Bearer {access_token}"}
                        )
                        if loc_resp.status_code == 200:
                            locations = loc_resp.json().get("locations", [])
                            if locations:
                                location_name = locations[0].get("name", "")
                                location_title = locations[0].get("title", "")
            except Exception as e:
                logger.warning("google_business_account_discovery_error", error=str(e))

            cdata["account_name"] = account_name
            cdata["location_name"] = location_name
            cdata["location_title"] = location_title

            await conn.execute(
                "UPDATE tenant_credentials SET credential_data = $1::jsonb, is_active = true, updated_at = now() WHERE id = $2::uuid",
                json.dumps(cdata), row["id"]
            )

        return RedirectResponse(f"{base_redir}?gmb=connected")


@router.get("/reviews/google/status")
@router.get("/api/v1/crm/reviews/google/status")
async def get_google_business_status(tenant_id: str = Depends(get_tenant_id)):
    """Check whether Google Business Profile is connected and review counts."""
    async with database.db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, credential_data, is_active FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'google_business'",
            tenant_id
        )
        if not row or not row["is_active"]:
            return {"is_connected": False}

        cdata = safe_json_loads(row["credential_data"], {})
        is_conn = bool(cdata.get("refresh_token"))
        google_count = await conn.fetchval(
            "SELECT COUNT(*) FROM customer_reviews WHERE tenant_id = $1::uuid AND source = 'google_business'",
            tenant_id
        )
        return {
            "is_connected": is_conn,
            "account_name": cdata.get("account_name", ""),
            "location_name": cdata.get("location_name", ""),
            "location_title": cdata.get("location_title", ""),
            "last_synced_at": cdata.get("last_synced_at", ""),
            "connected_at": cdata.get("connected_at", ""),
            "google_reviews_count": google_count or 0
        }


STAR_RATING_MAP = {
    "FIVE": 5,
    "FOUR": 4,
    "THREE": 3,
    "TWO": 2,
    "ONE": 1,
    "STAR_RATING_UNSPECIFIED": 5
}

@router.post("/reviews/google/sync")
@router.post("/api/v1/crm/reviews/google/sync")
async def sync_google_reviews(tenant_id: str = Depends(get_tenant_id)):
    """Sync public reviews from Google Business Profile into CRM."""
    async with database.db_pool.acquire() as conn:
        access_token, cdata = await get_google_business_access_token(conn, tenant_id)
        account_name = cdata.get("account_name")
        location_name = cdata.get("location_name")

        if not account_name or not location_name:
            async with httpx.AsyncClient(timeout=15.0) as client:
                acc_resp = await client.get(
                    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if acc_resp.status_code == 200:
                    accounts = acc_resp.json().get("accounts", [])
                    if accounts:
                        account_name = accounts[0].get("name", "")
                        loc_resp = await client.get(
                            f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_name}/locations?readMask=name,title",
                            headers={"Authorization": f"Bearer {access_token}"}
                        )
                        if loc_resp.status_code == 200:
                            locations = loc_resp.json().get("locations", [])
                            if locations:
                                location_name = locations[0].get("name", "")
                                cdata["location_title"] = locations[0].get("title", "")
                                cdata["account_name"] = account_name
                                cdata["location_name"] = location_name
                                await conn.execute(
                                    "UPDATE tenant_credentials SET credential_data = $1::jsonb WHERE tenant_id = $2::uuid AND provider = 'google_business'",
                                    json.dumps(cdata), tenant_id
                                )
                elif acc_resp.status_code == 429:
                    logger.warning("gmb_account_quota_zero", body=acc_resp.text)
                    raise HTTPException(
                        400,
                        "Google API Quota Limit: The 'My Business Account Management API' has a quota limit of 0 in your Google Cloud Project. Please enable the 'Google My Business API' and request quota access in Google Cloud Console."
                    )
                elif acc_resp.status_code == 403:
                    logger.warning("gmb_account_permission_denied", body=acc_resp.text)
                    raise HTTPException(
                        403,
                        "Google API Permission Denied: The Google My Business API is disabled in your Google Cloud Project. Please enable it in Google Cloud Console."
                    )

        if not account_name or not location_name:
            raise HTTPException(400, "Google Business location could not be found. Please ensure your Google account manages a verified Business Profile.")

        url = f"https://mybusiness.googleapis.com/v4/{account_name}/{location_name}/reviews?pageSize=50"
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {access_token}"})
            if resp.status_code != 200:
                err_text = resp.text
                logger.error("google_business_sync_failed", status=resp.status_code, body=err_text)
                if "PERMISSION_DENIED" in err_text:
                    raise HTTPException(
                        403,
                        "Google Business Profile API access has not yet been approved by Google for this project. Please submit the Google API Access Request form."
                    )
                raise HTTPException(400, f"Google API Error ({resp.status_code}): {err_text}")

            res_json = resp.json()
            reviews = res_json.get("reviews", [])
            synced_count = 0

            for r in reviews:
                g_id = r.get("reviewId")
                if not g_id:
                    continue
                reviewer = r.get("reviewer", {})
                display_name = reviewer.get("displayName") or "Google User"
                photo_url = reviewer.get("profilePhotoUrl", "")
                raw_rating = r.get("starRating", "FIVE")
                rating_val = STAR_RATING_MAP.get(raw_rating, 5) if isinstance(raw_rating, str) else int(raw_rating or 5)
                comment = r.get("comment", "")
                created_time_str = r.get("createTime")
                created_dt = datetime.fromisoformat(created_time_str.replace("Z", "+00:00")) if created_time_str else datetime.now(timezone.utc)

                reply_obj = r.get("reviewReply", {})
                reply_comment = reply_obj.get("comment") if reply_obj else None
                reply_time_str = reply_obj.get("updateTime") if reply_obj else None
                reply_dt = datetime.fromisoformat(reply_time_str.replace("Z", "+00:00")) if reply_time_str else None
                status = "resolved" if reply_comment else "pending"

                await conn.execute("""
                    INSERT INTO customer_reviews (
                        tenant_id, customer_name, service_name, rating,
                        experience_notes, generated_review_text, destination,
                        status, created_at, google_review_id, reviewer_photo_url,
                        owner_reply_text, owner_replied_at, source
                    ) VALUES (
                        $1::uuid, $2, 'Google Review', $3,
                        $4, $4, 'google_business',
                        $5, $6, $7, $8,
                        $9, $10, 'google_business'
                    )
                    ON CONFLICT (tenant_id, google_review_id) WHERE google_review_id IS NOT NULL
                    DO UPDATE SET
                        customer_name = EXCLUDED.customer_name,
                        rating = EXCLUDED.rating,
                        experience_notes = EXCLUDED.experience_notes,
                        generated_review_text = EXCLUDED.generated_review_text,
                        owner_reply_text = EXCLUDED.owner_reply_text,
                        owner_replied_at = EXCLUDED.owner_replied_at,
                        reviewer_photo_url = EXCLUDED.reviewer_photo_url,
                        status = CASE WHEN EXCLUDED.owner_reply_text IS NOT NULL THEN 'resolved' ELSE customer_reviews.status END
                """, tenant_id, display_name, rating_val, comment, status, created_dt, g_id, photo_url, reply_comment, reply_dt)
                synced_count += 1

            cdata["last_synced_at"] = datetime.now(timezone.utc).isoformat()
            await conn.execute(
                "UPDATE tenant_credentials SET credential_data = $1::jsonb WHERE tenant_id = $2::uuid AND provider = 'google_business'",
                json.dumps(cdata), tenant_id
            )

            return {
                "status": "ok",
                "synced_count": synced_count,
                "total_google_reviews": res_json.get("totalReviewCount", synced_count),
                "average_rating": res_json.get("averageRating", None)
            }


@router.post("/reviews/{review_id}/google-reply")
@router.post("/api/v1/crm/reviews/{review_id}/google-reply")
async def reply_to_google_review(
    review_id: str,
    payload: GoogleReviewReplyPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Publish owner response directly to Google Maps / Google Search, and update review status to resolved."""
    comment_text = payload.comment.strip()
    if not comment_text:
        raise HTTPException(400, "Reply text cannot be empty.")

    async with database.db_pool.acquire() as conn:
        rev = await conn.fetchrow(
            "SELECT id, google_review_id, customer_name, customer_phone, service_name, rating FROM customer_reviews WHERE id = $1::uuid AND tenant_id = $2::uuid",
            review_id, tenant_id
        )
        if not rev:
            raise HTTPException(404, "Review record not found.")

        g_id = rev["google_review_id"]
        if not g_id:
            # Internal private feedback (1-3 stars)
            c_phone = (rev["customer_phone"] or "").strip()
            wa_notified = False

            if c_phone:
                try:
                    cred_row = await conn.fetchrow(
                        "SELECT credential_data FROM tenant_credentials WHERE tenant_id = $1::uuid AND provider = 'whatsapp' AND is_active = true",
                        tenant_id
                    )
                    if cred_row and cred_row["credential_data"]:
                        cdata = cred_row["credential_data"] if isinstance(cred_row["credential_data"], dict) else json.loads(cred_row["credential_data"])
                        pn_id = cdata.get("phone_number_id")
                        tok = cdata.get("access_token")
                        clean_num = re.sub(r"[^0-9]", "", c_phone)
                        if clean_num.startswith("0"):
                            clean_num = clean_num[1:]
                        if len(clean_num) == 10:
                            clean_num = "91" + clean_num

                        if pn_id and tok and not str(tok).startswith("EAAB_test"):
                            t_name = await conn.fetchval("SELECT name FROM tenants WHERE id = $1::uuid", tenant_id) or "Our Team"
                            c_name = rev["customer_name"] or "Valued Customer"
                            wa_body = (
                                f"Hello {c_name},\n\n"
                                f"Thank you for sharing your feedback with {t_name}.\n\n"
                                f"*Response from Management:*\n{comment_text}\n\n"
                                f"We truly value your satisfaction and are committed to assisting you."
                            )
                            async with httpx.AsyncClient(timeout=8.0) as client:
                                res = await client.post(
                                    f"https://graph.facebook.com/v19.0/{pn_id}/messages",
                                    headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
                                    json={"messaging_product": "whatsapp", "recipient_type": "individual", "to": clean_num, "type": "text", "text": {"body": wa_body}}
                                )
                                if res.status_code in (200, 201):
                                    wa_notified = True
                except Exception as _wa_err:
                    logger.warning("internal_feedback_wa_notify_failed", error=str(_wa_err))

            await conn.execute("""
                UPDATE customer_reviews
                SET owner_reply_text = $1, owner_replied_at = now(), status = 'resolved'
                WHERE id = $2::uuid AND tenant_id = $3::uuid
            """, comment_text, review_id, tenant_id)
            return {
                "status": "ok",
                "message": "Reply saved and sent to customer via WhatsApp!" if wa_notified else "Reply saved to CRM record.",
                "comment": comment_text,
                "whatsapp_notified": wa_notified
            }

        access_token, cdata = await get_google_business_access_token(conn, tenant_id)
        account_name = cdata.get("account_name")
        location_name = cdata.get("location_name")
        if not account_name or not location_name:
            raise HTTPException(400, "Google Business account/location not configured.")

        url = f"https://mybusiness.googleapis.com/v4/{account_name}/{location_name}/reviews/{g_id}/reply"
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.put(
                url,
                headers={"Authorization": f"Bearer {access_token}"},
                json={"comment": comment_text}
            )
            if resp.status_code not in (200, 201):
                err_msg = resp.text
                logger.error("google_business_reply_failed", status=resp.status_code, body=err_msg)
                raise HTTPException(400, f"Google rejected reply ({resp.status_code}): {err_msg}")

        await conn.execute("""
            UPDATE customer_reviews
            SET owner_reply_text = $1, owner_replied_at = now(), status = 'resolved'
            WHERE id = $2::uuid AND tenant_id = $3::uuid
        """, comment_text, review_id, tenant_id)

        return {"status": "ok", "message": "Reply posted to Google Maps successfully!", "comment": comment_text}


@router.post("/reviews/{review_id}/ai-reply-draft")
@router.post("/api/v1/crm/reviews/{review_id}/ai-reply-draft")
async def draft_ai_reply(
    review_id: str,
    payload: AiReplyDraftPayload,
    tenant_id: str = Depends(get_tenant_id)
):
    """Generate an AI-assisted professional owner response draft."""
    async with database.db_pool.acquire() as conn:
        rev = await conn.fetchrow(
            "SELECT customer_name, rating, experience_notes, generated_review_text FROM customer_reviews WHERE id = $1::uuid AND tenant_id = $2::uuid",
            review_id, tenant_id
        )
        if not rev:
            raise HTTPException(404, "Review record not found.")

        t_name = await conn.fetchval("SELECT name FROM tenants WHERE id = $1::uuid", tenant_id) or "Our Team"
        c_name = rev["customer_name"] or "valued customer"
        rating = rev["rating"] or 5
        tone = (payload.tone or "grateful").lower()

        if rating >= 4:
            if tone == "brief":
                draft = f"Thank you so much for the review, {c_name}! We really appreciate your support and look forward to seeing you again at {t_name}."
            elif tone == "warm":
                draft = f"Hi {c_name}, thank you for taking the time to share your kind words! We are delighted to hear you had a great experience with us. See you again soon!"
            else:
                draft = f"Thank you so much, {c_name}! The team at {t_name} is thrilled to know you had an exceptional visit. We look forward to welcoming you back!"
        else:
            if tone == "apology":
                draft = f"Dear {c_name}, thank you for your candid feedback. We are truly sorry that your experience did not meet our high standards. Please reach out to us directly so we can make this right for you."
            elif tone == "brief":
                draft = f"Hi {c_name}, we appreciate your feedback and apologize for any inconvenience. Please contact our team directly so we can address your concerns."
            else:
                draft = f"Hello {c_name}, thank you for bringing this to our attention. Customer satisfaction is our top priority, and we regret falling short during your visit. We would love the opportunity to speak with you directly and resolve this."

        return {"status": "ok", "draft": draft}


@router.post("/reviews/google/disconnect")
@router.post("/api/v1/crm/reviews/google/disconnect")
async def disconnect_google_business(tenant_id: str = Depends(get_tenant_id)):
    """Disconnect Google Business Profile."""
    async with database.db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE tenant_credentials SET is_active = false WHERE tenant_id = $1::uuid AND provider = 'google_business'",
            tenant_id
        )
        return {"status": "ok", "message": "Google Business Profile disconnected."}

