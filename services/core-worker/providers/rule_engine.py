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
    Rule("owner_inquiry", 110, "keyword", r"\b(who are you|who is the owner|who built|founder|who runs|what is your name)\b",
         "I'm the virtual assistant for this business. How can I help you today?"),

    Rule("help_inquiry",  105, "keyword", r"\b(how can you help|help me|what do you do|what does it do|how does it work|features)\b",
         "I can help you with information about our services, scheduling appointments, and answering your questions. What would you like to know?"),

    Rule("greeting",      100, "keyword", r"\b(hello|hi|hey|hii+|bii+|hola|namaste|good morning|good afternoon|good evening)\b",
         "Hello! Welcome, how can I assist you today?"),

    Rule("bye",           90,  "keyword", r"\b(bye|goodbye|see you|thanks|thank you|dhanyavaad)\b",
         "You're very welcome! Have a wonderful day ahead. 😊"),

    Rule("book",          85,  "keyword", r"\b(book|appointment|schedule|reserve|booking|consultation|call|demo)\b",
         "I'd love to help you schedule an appointment or consultation! 📅 What date and time works best for you?"),

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
         "I can share our pricing details with you. Could you let me know which service you are interested in?"),

    Rule("fallback",      0,   "fallback", None,
         "Thank you for reaching out! I am here to help. Could you tell me more about what you are looking for?"),
]


def apply_rule_engine(
    message_text: str,
    tenant_id: str,
    tenant_rules: list[Rule] | None = None,
    assistant_name: str = "Assistant",
    business_name: str = "",
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
                    if rule.name == "greeting":
                        a_name = (assistant_name or "").strip()
                        b_name = (business_name or "").strip()
                        has_custom_name = bool(a_name and a_name.lower() != "assistant")
                        if has_custom_name and b_name:
                            return f"Hello! Welcome to {b_name}, I'm {a_name}. How can I assist you today?"
                        elif has_custom_name:
                            return f"Hello! Welcome, I'm {a_name}. How can I assist you today?"
                        elif b_name:
                            return f"Hello! Welcome to {b_name}, how can I assist you today?"
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
