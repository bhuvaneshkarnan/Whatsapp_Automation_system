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

    Rule("greeting",      100, "keyword", r"^\s*(hello|hi|hey|hii+|bii+|hola|namaste|good morning|good afternoon|good evening)(\s+(there|team|everyone|all|friend))?[\s!.,~-]*$",
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
        if rule.trigger_value and rule.trigger_type in ("keyword", "regex"):
            try:
                if re.search(rule.trigger_value, text_lower, re.IGNORECASE):
                    # SAFETY CHECK FOR GREETINGS:
                    # Greeting rule must ONLY trigger on pure greetings (e.g. "hi", "hello!", "hey there").
                    # If the message contains inquiry keywords, questions, or > 3 words, skip the greeting rule!
                    if rule.name == "greeting":
                        inquiry_indicators = [
                            "?", "info", "information", "detail", "more", "help", "price", "cost", "fee", "rate",
                            "how", "what", "where", "when", "why", "who", "which", "can i", "could you", "appointment",
                            "book", "doctor", "consult", "treatment", "therapy", "package", "service", "available",
                            "address", "location", "timing", "hours", "open", "tell me", "i want", "need"
                        ]
                        words = text_lower.split()
                        if len(words) > 3 or any(ind in text_lower for ind in inquiry_indicators):
                            continue

                    logger.info("rule_matched", rule=rule.name, tenant_id=tenant_id)
                    return rule.response_text.replace("{assistant_name}", assistant_name).replace("{business_name}", business_name)
            except re.error:
                # Bad regex in DB — skip this rule
                continue

        if rule.trigger_type == "fallback":
            logger.info("rule_fallback_triggered", tenant_id=tenant_id)
            b_name = business_name.strip() if business_name else "our team"
            has_substance = len(text_lower.split()) > 3 or any(
                k in text_lower for k in ["info", "what", "how", "where", "when", "cost", "price", "doctor", "treatment", "book", "help", "?"]
            )
            if has_substance:
                return f"Thank you for reaching out to {b_name}! We have noted your inquiry and our team will guide you with complete details and consultation options shortly. 🙏"
            resp = rule.response_text or "Thank you for reaching out! How can we assist you today?"
            return resp.replace("{assistant_name}", assistant_name).replace("{business_name}", business_name)

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
