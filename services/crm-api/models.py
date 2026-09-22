from pydantic import BaseModel, Field

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

from typing import Optional, List, Dict, Any, Union
from datetime import datetime, time
from uuid import UUID

class ContactConsentPayload(BaseModel):
    opt_in: bool


class BatchConsentPayload(BaseModel):
    contact_ids: List[str]
    opt_in: bool


class CustomerCreatePayload(BaseModel):
    phone: str
    name: Optional[str] = None
    internal_name: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    preferred_doctor: Optional[str] = None
    status: Optional[str] = "new"
    health_concern: Optional[str] = "General Consultation"
    lead_probability: Optional[str] = "warm"
    converted: Optional[bool] = False
    followup_date: Optional[str] = None
    followup_time: Optional[str] = "10:00 AM"
    initial_note: Optional[str] = None
    conversion_rate: Optional[int] = 50
    call_status: Optional[str] = "New (Fresh)"
    next_action: Optional[str] = "Call Again"
    primary_concerns: Optional[List[str]] = []
    interested_services: Optional[List[str]] = []
    deal_value: Optional[float] = 0.0
    ai_summary: Optional[str] = None


class CustomerUpdatePayload(BaseModel):
    name: Optional[str] = None
    internal_name: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    preferred_doctor: Optional[str] = None
    status: Optional[str] = None
    health_concern: Optional[str] = None
    lead_probability: Optional[str] = None
    converted: Optional[bool] = None
    followup_date: Optional[str] = None
    followup_time: Optional[str] = None
    clear_followup: Optional[bool] = False
    conversion_rate: Optional[int] = None
    call_status: Optional[str] = None
    next_action: Optional[str] = None
    primary_concerns: Optional[List[str]] = None
    interested_services: Optional[List[str]] = None
    deal_value: Optional[float] = None
    ai_summary: Optional[str] = None


class CustomerMergePayload(BaseModel):
    primary_customer_id: str
    secondary_customer_ids: List[str]
    internal_name: Optional[str] = None



class CustomerNotePayload(BaseModel):
    customer_id: Optional[str] = None
    author: Optional[str] = "Staff"
    note_text: str
    color: Optional[str] = "slate"


class CustomerChatSendPayload(BaseModel):
    message: str


class TaskCreatePayload(BaseModel):
    customer_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    sync_google_tasks: Optional[bool] = False
    sync_google_calendar: Optional[bool] = False


class CrmDropdownsUpdatePayload(BaseModel):
    outcome_statuses: Optional[List[str]] = None
    next_actions: Optional[List[str]] = None
    services_list: Optional[List[str]] = None
    concerns_list: Optional[List[str]] = None


class BookingCreatePayload(BaseModel):
    contact_name: str
    contact_phone: str
    service: str
    start_time: str
    end_time: Optional[str] = None
    price: Optional[float] = 0.0
    notes: Optional[str] = ""
    staff_member: Optional[str] = None
    doctor_name: Optional[str] = None
    send_whatsapp_confirmation: Optional[bool] = True


class BookingPricePayload(BaseModel):
    price: float

class BookingStatusPayload(BaseModel):
    status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    send_review: Optional[bool] = None

class MessageCreate(BaseModel):
    body: Optional[str] = ""
    template_name: Optional[str] = None
    template_params: Optional[list] = None

class DirectWhatsAppPayload(BaseModel):
    phone: str
    body: Optional[str] = ""
    customer_id: Optional[str] = None
    template_name: Optional[str] = None
    template_params: Optional[list] = None


class ConvStatusUpdate(BaseModel):
    status: str

class AssignConversationRequest(BaseModel):
    assigned_to: Optional[str] = None


class ToggleAllPayload(BaseModel):
    ai_enabled: bool

class TenantSettingsUpdate(BaseModel):
    name: Optional[str] = None
    admin_name: Optional[str] = None
    logo_url: Optional[str] = None
    meta_phone_id: Optional[str] = None
    meta_waba_id: Optional[str] = None
    meta_access_token: Optional[str] = None
    meta_app_secret: Optional[str] = None
    verify_token: Optional[str] = None
    
    primary_model_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    opencode_api_key: Optional[str] = None
    opencode_base_url: Optional[str] = None
    
    assistant_name: Optional[str] = None
    bot_goal: Optional[str] = None
    services_text: Optional[str] = None
    ai_prompt: Optional[str] = None
    ai_model: Optional[str] = None
    response_style: Optional[str] = None
    methodology: Optional[str] = None
    strict_rules: Optional[str] = None
    objection_handling: Optional[str] = None
    
    full_location_text: Optional[str] = None
    timezone: Optional[str] = None
    country_code: Optional[str] = None
    currency: Optional[str] = None
    gmb_review_url: Optional[str] = None
    currency_symbol: Optional[str] = None
    admin_whatsapp_number: Optional[str] = None
    template_booking_confirmation: Optional[str] = None
    template_admin_notification: Optional[str] = None
    template_admin_human_request: Optional[str] = None
    template_cancellation_confirmation: Optional[str] = None
    template_admin_cancellation_notice: Optional[str] = None
    template_reschedule_confirmation: Optional[str] = None
    template_admin_reschedule_notice: Optional[str] = None
    template_post_service_review: Optional[str] = None
    template_appointment_reminder: Optional[str] = None
    template_reschedule_nudge: Optional[str] = None
    template_review_request: Optional[str] = None
    template_admin_daily_digest: Optional[str] = None
    template_admin_appointment_reminder: Optional[str] = None
    template_client_followup: Optional[str] = None
    google_review_link: Optional[str] = None
    enable_auto_review: Optional[bool] = None
    allow_text_fallback: Optional[bool] = False
    disable_template_text_fallback: Optional[bool] = True
    
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_calendar_id: Optional[str] = None
    notification_email: Optional[str] = None
    
    industry: Optional[str] = None
    taxonomy: Optional[Dict[str, Any]] = None
    review_experience_tags: Optional[List[str]] = None
    requirement_presets: Optional[List[str]] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    slot_booking_mode: Optional[str] = None
    max_concurrent_bookings: Optional[int] = None
    razorpay_short_url: Optional[str] = None
    monthly_price: Optional[float] = None
    target_tenant_id: Optional[str] = None
    tenant_id: Optional[str] = None

    # White-label & Custom Domain
    custom_domain: Optional[str] = None
    brand_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    brand_favicon_url: Optional[str] = None
    brand_primary_color: Optional[str] = None
    brand_support_email: Optional[str] = None
    brand_support_phone: Optional[str] = None
    hide_platform_branding: Optional[bool] = None

    # Partner & Revenue Sharing
    sales_channel: Optional[str] = None
    partner_name: Optional[str] = None
    partner_share_pct: Optional[float] = None
    owner_share_pct: Optional[float] = None

    model_config = {"extra": "allow"}


class TenantPaymentLinkUpdate(BaseModel):
    payment_url: str


class GoogleOAuthInitPayload(BaseModel):
    client_id: Optional[str] = ""
    client_secret: Optional[str] = ""
    target_tenant_id: Optional[str] = None
    source: Optional[str] = "dashboard"

class TenantCreate(BaseModel):
    name: str
    slug: str
    admin_name: Optional[str] = ""
    admin_email: str
    admin_password: str
    plan: Optional[str] = "pro"
    industry: Optional[str] = "clinic"
    monthly_price: Optional[float] = None
    billing_cycle_day: Optional[int] = None
    razorpay_subscription_id: Optional[str] = None
    meta_phone_id: Optional[str] = ""
    meta_waba_id: Optional[str] = ""
    meta_access_token: Optional[str] = ""
    meta_app_secret: Optional[str] = ""
    verify_token: Optional[str] = ""
    ai_prompt: Optional[str] = ""
    ai_model: Optional[str] = "gemini-1.5-flash"
    primary_model_provider: Optional[str] = "gemini"
    gemini_api_key: Optional[str] = ""
    groq_api_key: Optional[str] = ""
    opencode_api_key: Optional[str] = ""
    opencode_base_url: Optional[str] = "https://api.openai.com/v1"
    assistant_name: Optional[str] = ""
    bot_goal: Optional[str] = ""
    services_text: Optional[str] = ""
    full_location_text: Optional[str] = ""
    admin_whatsapp_number: Optional[str] = ""
    template_booking_confirmation: Optional[str] = "booking_confirmationn"
    template_admin_notification: Optional[str] = "admin_notification"
    template_admin_human_request: Optional[str] = "admin_human_request"
    template_cancellation_confirmation: Optional[str] = "cancellation_confirmation"
    template_admin_cancellation_notice: Optional[str] = "admin_cancellation_notice"
    template_reschedule_confirmation: Optional[str] = "booking_reschedule_confirmation"
    template_admin_reschedule_notice: Optional[str] = "admin_reschedule_notice"
    google_client_id: Optional[str] = ""
    google_client_secret: Optional[str] = ""
    google_refresh_token: Optional[str] = ""
    google_calendar_id: Optional[str] = "primary"
    notification_email: Optional[str] = ""


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    admin_name: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    primary_model_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    opencode_api_key: Optional[str] = None
    opencode_base_url: Optional[str] = None
    assistant_name: Optional[str] = None
    bot_goal: Optional[str] = None
    services_text: Optional[str] = None
    full_location_text: Optional[str] = None
    admin_whatsapp_number: Optional[str] = None
    template_booking_confirmation: Optional[str] = None
    template_admin_notification: Optional[str] = None
    template_admin_human_request: Optional[str] = None
    template_cancellation_confirmation: Optional[str] = None
    template_admin_cancellation_notice: Optional[str] = None
    template_reschedule_confirmation: Optional[str] = None
    template_admin_reschedule_notice: Optional[str] = None
    ai_prompt: Optional[str] = None
    meta_phone_id: Optional[str] = None
    meta_access_token: Optional[str] = None
    meta_app_secret: Optional[str] = None
    verify_token: Optional[str] = None


class SyncGlobalRulesPayload(BaseModel):
    strict_rules: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None


class PartnerTemplatePayload(BaseModel):
    partner_name: str
    partner_share_pct: Optional[float] = 50.0
    owner_share_pct: Optional[float] = 50.0
    custom_domain: Optional[str] = ""
    brand_name: Optional[str] = ""
    brand_logo_url: Optional[str] = ""
    brand_favicon_url: Optional[str] = ""
    brand_primary_color: Optional[str] = "#7C3AED"
    brand_support_email: Optional[str] = ""
    brand_support_phone: Optional[str] = ""
    hide_platform_branding: Optional[bool] = True
    is_default: Optional[bool] = True


class PasswordReset(BaseModel):
    new_password: str


class PaymentReminderRequest(BaseModel):
    amount: float = 2630.0
    currency: str = "INR"
    due_date: str = "in 3 days"
    payment_link: Optional[str] = ""
    custom_phone: Optional[str] = None
    custom_message: Optional[str] = None


class TenantBillingUpdate(BaseModel):
    plan: Optional[str] = None
    monthly_price: Optional[float] = None
    billing_cycle_day: Optional[int] = None
    razorpay_subscription_id: Optional[str] = None
    next_renewal_date: Optional[str] = None
    sales_channel: Optional[str] = None
    partner_name: Optional[str] = None
    partner_share_pct: Optional[float] = None
    owner_share_pct: Optional[float] = None


class MissedCallPayload(BaseModel):
    caller_phone: Optional[str] = None
    caller_name: Optional[str] = None
    sms_text: Optional[str] = None
    timestamp: Optional[str] = None
    tenant: Optional[str] = None
    token: Optional[str] = None


class AdminDueAlertRequest(BaseModel):
    super_admin_phone: str
    tenant_id: Optional[str] = None
    custom_note: Optional[str] = None


class MarketingBroadcastPayload(BaseModel):
    campaign_name: str
    recipient_phones: List[str]
    message_text: Optional[str] = None
    template_name: Optional[str] = None
    template_params: Optional[List[str]] = None
    target_audience: Optional[str] = "contacts_only"
    message_mode: Optional[str] = "template"
    is_scheduled: Optional[bool] = False
    scheduled_at: Optional[str] = None


class TriggerCreatePayload(BaseModel):
    name: str
    trigger_type: str  # recall_reminder, birthday_greeting, post_treatment_followup, seasonal_promo
    condition_label: str
    condition_days: Optional[int] = 30
    template_name: str
    template_params: Optional[List[str]] = None
    is_active: Optional[bool] = True


class CreateTemplatePayload(BaseModel):
    name: str
    label: Optional[str] = None
    category: str = "UTILITY"
    language: str = "en_US"
    body: str
    variables_count: Optional[int] = 0

class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribePayload(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    user_agent: Optional[str] = None


class PushUnsubscribePayload(BaseModel):
    endpoint: str


class PublicBookingRequest(BaseModel):
    patient_name: str
    patient_phone: str
    patient_email: Optional[str] = None
    doctor_name: Optional[str] = None
    staff_member: Optional[str] = None
    health_concern: Union[str, List[str]]
    booking_date: str  # YYYY-MM-DD
    booking_time: str  # HH:MM or 10:00 AM
    notes: Optional[str] = None
    source: Optional[str] = "website_form"


class StaffCreateRequest(BaseModel):
    email: str
    password: str
    display_name: str
    role: str = "agent"  # admin, doctor, receptionist, agent, viewer
    permissions: Optional[Dict[str, Any]] = None

class StaffUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class PublicReviewSubmitRequest(BaseModel):
    tenant_slug: str
    customer_name: Optional[str] = ""
    customer_phone: Optional[str] = ""
    service_name: Optional[str] = ""
    rating: int
    experience_notes: Optional[str] = ""
    customer_location: Optional[str] = ""


class ReviewStatusUpdateRequest(BaseModel):
    status: str

class GoogleBusinessOAuthInitPayload(BaseModel):
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    source: Optional[str] = "dashboard"

class GoogleReviewReplyPayload(BaseModel):
    comment: str

class AiReplyDraftPayload(BaseModel):
    tone: Optional[str] = "grateful"  # "grateful", "apology", "brief"


