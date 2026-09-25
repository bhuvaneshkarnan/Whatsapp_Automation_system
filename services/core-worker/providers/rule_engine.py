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
         "I'm the virtual assistant for {business_name}. How can I help you today?"),

    Rule("help_inquiry",  105, "keyword", r"\b(how can you help|help me|what do you do|what does it do|how does it work|features)\b",
         "I can help you with information about {business_name} services, scheduling appointments, and answering your questions. What would you like to know?"),

    Rule("greeting",      100, "keyword", r"^\s*(hello|hi|hey|hii+|bii+|hola|namaste|good morning|good afternoon|good evening)(\s+(there|team|everyone|all|friend))?[\s!.,~-]*$",
         "Hello! Welcome to {business_name}, how can I assist you today?"),

    Rule("bye",           90,  "keyword", r"\b(bye|goodbye|see you|thanks|thank you|dhanyavaad)\b",
         "You're very welcome from {business_name}! Have a wonderful day ahead. 😊"),

    Rule("book",          85,  "keyword", r"\b(book|appointment|schedule|reserve|booking|consultation|call|demo)\b",
         "I'd love to help you schedule an appointment or consultation with {business_name}! 📅 What date and time works best for you?"),

    Rule("reschedule",    84,  "keyword", r"\b(reschedule|change.*appointment|move.*booking|shift.*appointment)\b",
         "Sure, I can help you reschedule your appointment with {business_name}. What new date and time would you prefer?"),

    Rule("cancel",        83,  "keyword", r"\b(cancel|cancellation|don't need|not coming)\b",
         "I can help cancel your booking with {business_name}. Could you please confirm your name or phone number?"),

    Rule("hours",         80,  "keyword", r"\b(hours|open|timing|when|available|schedule)\b",
         "We are available throughout standard business hours at {business_name}. When would you like to schedule? 🕐"),

    Rule("status",        75,  "keyword", r"\b(status|my booking|appointment status|confirmed)\b",
         "Let me check your booking status with {business_name}! Please share your name or phone number."),

    Rule("human",         70,  "keyword", r"\b(talk to human|speak to human|talk to agent|speak to agent|human agent|connect to agent|connect to human|human support|stop bot|switch to human)\b",
         "I'm connecting you with our team at {business_name} right away. One moment! 🤝"),

    Rule("price",         65,  "keyword", r"\b(price|cost|how much|rate|charges|fee)\b",
         "I can share our pricing details with you for {business_name}. Could you let me know which service you are interested in?"),

    Rule("fallback",      0,   "fallback", None,
         "Thank you for reaching out to {business_name}! How can our team help you today?"),
]


def apply_rule_engine(
    message_text: str,
    tenant_id: str,
    tenant_rules: list[Rule] | None = None,
    assistant_name: str = "Assistant",
    business_name: str = "",
    services_text: str = "",
    full_location: str = "",
    admin_phone: str = "",
    empty_slots_text: str = "",
) -> str:
    """
    Match message against rules in priority order.
    Tenant-specific rules are merged with defaults (tenant rules take priority at same level).
    If fallback rule is triggered, intelligently grounds response in verified business context
    (services, pricing, location, slots) instead of returning a generic canned fallback.
    """
    # Merge: tenant rules first, then defaults
    all_rules = sorted(
        (tenant_rules or []) + DEFAULT_RULES,
        key=lambda r: r.priority,
        reverse=True,
    )

    text_lower = message_text.lower().strip()
    b_name = business_name.strip() if business_name else "our team"

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

                    # If the message contains price keywords, don't let booking or hours rules hijack a price inquiry!
                    if rule.name in ("book", "hours") and any(pk in text_lower for pk in ["price", "cost", "fee", "how much", "charges", "rate"]):
                        continue

                    if rule.name == "price" and services_text and services_text.strip():
                        lines = [l.strip() for l in services_text.strip().split("\n") if l.strip()]
                        summary = ", ".join(lines[:3])
                        logger.info("rule_matched_grounded_price", rule=rule.name, tenant_id=tenant_id)
                        return f"Our services at {b_name} start from: {summary}. Would you like to check available slots for today or tomorrow?"
                    if rule.name in ("book", "hours") and empty_slots_text and empty_slots_text.strip():
                        first_line = empty_slots_text.strip().split("\n")[0]
                        logger.info("rule_matched_grounded_slots", rule=rule.name, tenant_id=tenant_id)
                        return f"We have openings available at {b_name}! {first_line}. What time works best for you?"

                    logger.info("rule_matched", rule=rule.name, tenant_id=tenant_id)
                    return rule.response_text.replace("{assistant_name}", assistant_name).replace("{business_name}", b_name)
            except re.error:
                # Bad regex in DB — skip this rule
                continue

        if rule.trigger_type == "fallback":
            logger.info("rule_fallback_triggered", tenant_id=tenant_id)
            
            # 1. Price / Cost / Fee Inquiry
            if any(k in text_lower for k in ["price", "cost", "fee", "rate", "how much", "charges", "package"]):
                if services_text and services_text.strip():
                    lines = [l.strip() for l in services_text.strip().split("\n") if l.strip()]
                    summary = ", ".join(lines[:3])
                    return f"Our services start from: {summary}. Would you like to check available slots for today or tomorrow?"
                return f"Our team at {b_name} can provide complete details and pricing options for you! Which service or consultation are you interested in?"

            # 2. Location / Address / Where Inquiry
            if any(k in text_lower for k in ["where", "location", "address", "landmark", "directions", "how to reach"]):
                if full_location and full_location.strip():
                    loc = full_location.strip()
                    if "Car Parking" in loc:
                        loc = loc.split("Car Parking")[0].strip()
                    return f"We are located at {loc}. What day and convenient time would suit you best for a visit?"
                return f"We would be delighted to guide you to {b_name}! Are you looking for directions to our office, or would you like to schedule an appointment?"

            # 3. Booking / Appointment / Slots / Timing Inquiry
            if any(k in text_lower for k in ["book", "appointment", "slot", "timing", "available", "schedule", "come today", "come tomorrow"]):
                if empty_slots_text and empty_slots_text.strip():
                    first_line = empty_slots_text.strip().split("\n")[0]
                    return f"We have openings available! {first_line}. What time works best for you?"
                return f"We have consultation and appointment openings available this week at {b_name}! What day and convenient time works best for you?"

            # 4. Direct Contact / Phone Inquiry
            if any(k in text_lower for k in ["phone", "call", "number", "contact", "speak", "talk"]):
                if admin_phone and admin_phone.strip():
                    return f"You can reach our team directly at {admin_phone.strip()}. Would you like us to schedule a call or consultation?"
                return f"Our team at {b_name} is right here to assist you! Would you like someone from our team to give you a call?"

            # 5. Casual Remarks / Agreement / Acknowledgment
            if any(text_lower.startswith(w) for w in ["ok", "sure", "fine", "will check", "let you know", "thank", "thanks", "done", "alright"]):
                return "Sounds good! Take your time to decide, and we are right here whenever you are ready."

            # 6. General Intelligent Conversational Fallback
            return f"Hello from {b_name}! We are happy to assist you today. How can our team help you?"

    return f"Hello from {b_name}! How can our team assist you today?"


def db_row_to_rule(row: dict) -> Rule:
    """Convert a reply_rules DB row to a Rule dataclass."""
    return Rule(
        name=row["name"],
        priority=row["priority"],
        trigger_type=row["trigger_type"],
        trigger_value=row.get("trigger_value"),
        response_text=row["response_text"],
    )
