"""
Static rule engine — the final fallback when Gemini fails or is unconfigured.
Rules are loaded from the DB per tenant; built-in defaults are always present.
"""
import re
from dataclasses import dataclass
import structlog

logger = structlog.get_logger()


@dataclass
class Rule:
    name: str
    priority: int           # Higher number = checked first
    trigger_type: str       # keyword | regex | fallback
    trigger_value: str | None
    response_text: str


# Built-in fallback rules — always active for every tenant
# Tenant-specific rules (from reply_rules table) are merged and sorted by priority
DEFAULT_RULES: list[Rule] = [
    Rule("owner_inquiry", 110, "keyword", r"\b(who are you|who is the owner|who built|founder|boldlabs|who runs|what is your name)\b",
         "I am Rakshaya, an AI assistant built by Bhuvanesh at Boldlabs. We automate WhatsApp conversations to turn incoming ad leads into booked clients instantly."),

    Rule("help_inquiry",  105, "keyword", r"\b(how can you help|help me|what do you do|what does it do|how does it work|features)\b",
         "We set up an AI assistant directly on your WhatsApp number that replies instantly to inquiries 24/7, answers questions naturally, and books appointments on calendar."),

    Rule("business_type", 102, "keyword", r"\b(food|restaurant|clinic|doctor|hospital|agency|ecommerce|store|shop|hotel)\b",
         "We tailor the WhatsApp automation to your specific business workflow so it captures leads, answers inquiries, and schedules bookings smoothly."),

    Rule("greeting",      100, "keyword", r"\b(hello|hi|hey|hii+|bii+|hola|namaste|good morning|good afternoon|good evening)\b",
         "Hey there! How is everything going with your business today?"),

    Rule("bye",           90,  "keyword", r"\b(bye|goodbye|see you|thanks|thank you|dhanyavaad)\b",
         "You're very welcome! Have a wonderful day ahead. 😊"),

    Rule("book",          85,  "keyword", r"\b(book|appointment|schedule|reserve|booking|consultation|call|demo)\b",
         "I'd love to help you schedule a demo or consultation! 📅 What date and time works best for you?"),

    Rule("reschedule",    84,  "keyword", r"\b(reschedule|change.*appointment|move.*booking|shift.*appointment)\b",
         "Sure, I can help you reschedule. What new date and time would you prefer?"),

    Rule("cancel",        83,  "keyword", r"\b(cancel|cancellation|don't need|not coming)\b",
         "I can help cancel your booking. Could you please confirm your name or phone number?"),

    Rule("hours",         80,  "keyword", r"\b(hours|open|timing|when|available|schedule)\b",
         "We are available throughout standard business hours. When would you like to schedule? 🕐"),

    Rule("status",        75,  "keyword", r"\b(status|my booking|appointment status|confirmed)\b",
         "Let me check your booking status! Please share your name or phone number."),

    Rule("human",         70,  "keyword", r"\b(human|agent|person|staff|speak to someone|talk to someone|real person)\b",
         "I'm connecting you with our team right away. One moment! 🤝"),

    Rule("price",         65,  "keyword", r"\b(price|cost|how much|rate|charges|fee)\b",
         "Our automation is Rs 3499 per month with zero setup fee, including continuous server maintenance and support. How many monthly inquiries do you get?"),

    Rule("fallback",      0,   "fallback", None,
         "We provide 24/7 AI automation on WhatsApp that turns customer inquiries into confirmed bookings. How can I help with your setup?"),
]


def apply_rule_engine(
    message_text: str,
    tenant_id: str,
    tenant_rules: list[Rule] | None = None,
) -> str:
    """
    Match message against rules in priority order.
    Tenant-specific rules are merged with defaults (tenant rules take priority at same level).

    Returns the matching response text.
    """
    # Merge: tenant rules first, then defaults
    all_rules = sorted(
        (tenant_rules or []) + DEFAULT_RULES,
        key=lambda r: r.priority,
        reverse=True,
    )

    text_lower = message_text.lower().strip()

    for rule in all_rules:
        if rule.trigger_type == "fallback":
            logger.info("rule_fallback_triggered", tenant_id=tenant_id)
            return rule.response_text

        if rule.trigger_value and rule.trigger_type in ("keyword", "regex"):
            try:
                if re.search(rule.trigger_value, text_lower, re.IGNORECASE):
                    logger.info("rule_matched", rule=rule.name, tenant_id=tenant_id)
                    return rule.response_text
            except re.error:
                # Bad regex in DB — skip this rule
                continue

    return "Thank you for reaching out! We'll be in touch shortly. 🙏"


def db_row_to_rule(row: dict) -> Rule:
    """Convert a reply_rules DB row to a Rule dataclass."""
    return Rule(
        name=row["name"],
        priority=row["priority"],
        trigger_type=row["trigger_type"],
        trigger_value=row.get("trigger_value"),
        response_text=row["response_text"],
    )
