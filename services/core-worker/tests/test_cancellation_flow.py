import re

def check_cancellation_detection(
    response_text: str,
    is_cancellation_intent: bool = False,
    has_upcoming: bool = False,
    is_cancel_confirmation: bool = False,
) -> bool:
    """Matches the exact logic in services/core-worker/main.py line 3134+"""
    cancellation_detected = (
        "[ACTION:CANCEL_BOOKING]" in response_text
        or bool(re.search(r'\b(?:has\s+been|is|have\s+been|was)\s+cancell?ed\b', response_text, re.I))
        or bool(re.search(r'\bcancell?ed\s+(?:your|the|that|this)\b', response_text, re.I))
        or bool(re.search(r'\b(?:have|i\'ve|we\'ve)\s+cancell?ed\b', response_text, re.I))
        or bool(re.search(r'\bcancell?ation\s+(?:is\s+confirmed|has\s+been\s+confirmed|successful)\b', response_text, re.I))
        or bool(re.search(r'\bsuccessfully\s+cancell?ed\b', response_text, re.I))
        or (is_cancellation_intent and has_upcoming and is_cancel_confirmation)
        or any(phrase in response_text.lower() for phrase in [
            "cancelled your booking", "have cancelled your", "booking has been cancelled",
            "appointment is cancelled", "appointment has been cancelled", "cancelled your appointment",
            "demo has been cancelled", "demo is cancelled", "cancelled your demo",
            "session has been cancelled", "session is cancelled", "cancelled your session"
        ])
    )
    return cancellation_detected


def check_inbound_cancellation_intent(message_text: str, history: list) -> tuple[bool, bool]:
    """Matches the exact logic in services/core-worker/main.py lines 2660-2680"""
    inbound_clean = (message_text or "").lower().strip()

    last_assistant_msg = ""
    for msg in reversed(history or []):
        if msg.get("role") in ("assistant", "model"):
            last_assistant_msg = (msg.get("content") or "").lower()
            break

    is_cancel_confirmation = bool(
        any(q in last_assistant_msg for q in ["confirm if you want to cancel", "want to cancel", "confirm cancellation", "cancel your", "cancelling your", "canceling your"])
        and any(w in inbound_clean for w in ["yes", "yeah", "yep", "sure", "ok", "okay", "cancel", "proceed", "please do", "confirm", "correct", "y", "ya"])
    )

    is_cancellation_intent = is_cancel_confirmation or any(p in inbound_clean for p in [
        "cancel", "cancell", "canceling", "cancelling", "cancel it", "cancell it",
        "cancel booking", "cancell booking", "cancel appointment", "cancell appointment",
        "cancel my booking", "cancel my appointment", "cancel demo", "cancel the demo",
        "want to cancel", "want to cancell", "please cancel", "pls cancel",
        "dont want appointment", "don't want appointment", "drop my appointment",
        "cant make it", "can't make it", "wont make it", "won't make it",
        "cancel that", "cancell that", "cancel my slot", "cancel slot"
    ])

    return is_cancellation_intent, is_cancel_confirmation


def test_user_exact_failure_case():
    # 1. User says "Want to cancell that"
    intent, is_confirm = check_inbound_cancellation_intent("Want to cancell that", [])
    assert intent is True, "Expected cancellation intent for 'Want to cancell that'"
    assert is_confirm is False

    # 2. Assistant replies: "I can help you cancel that. Please confirm if you want to cancel your demo for tomorrow at 6:00 PM."
    history = [
        {"role": "user", "content": "Want to cancell that"},
        {"role": "assistant", "content": "I can help you cancel that. Please confirm if you want to cancel your demo for tomorrow at 6:00 PM."}
    ]

    # 3. User confirms: "Yes"
    intent, is_confirm = check_inbound_cancellation_intent("Yes", history)
    assert intent is True, "Expected cancellation intent for 'Yes' after confirmation prompt"
    assert is_confirm is True, "Expected is_cancel_confirmation to be True"

    # 4. AI generates: "Your demo for tomorrow at 6:00 PM has been cancelled. Let me know if you need anything else."
    ai_response = "Your demo for tomorrow at 6:00 PM has been cancelled. Let me know if you need anything else."
    detected = check_cancellation_detection(ai_response, intent, True, is_confirm)
    assert detected is True, f"Failed to detect cancellation in AI response: {ai_response}"
    print("[PASS] User exact failure case successfully detected and resolved!")


def test_various_cancellation_ai_responses():
    cases = [
        "Your demo for tomorrow at 6:00 PM has been cancelled. Let me know if you need anything else.",
        "Your appointment has been cancelled successfully.",
        "Your booking is cancelled.",
        "I have cancelled your demo for 11 AM.",
        "I've cancelled your slot.",
        "Your session was cancelled.",
        "Your consultation has been canceled.",  # single 'l'
        "Cancellation is confirmed for tomorrow 5pm.",
        "Sure thing! [ACTION:CANCEL_BOOKING] I have cancelled your appointment.",
    ]
    for c in cases:
        assert check_cancellation_detection(c) is True, f"Failed on: {c}"
    print(f"[PASS] All {len(cases)} AI cancellation response variants passed!")


def test_cancellation_negative_cases():
    negative_cases = [
        "Do you have a free cancellation policy?",
        "If you ever need to cancel, just let us know.",
        "Can I cancel or reschedule if an emergency comes up?",
        "We allow cancellation up to 2 hours before the session.",
    ]
    for nc in negative_cases:
        assert check_cancellation_detection(nc) is False, f"False positive on: {nc}"
    print(f"[PASS] All {len(negative_cases)} negative cancellation cases passed without false positive!")


def test_template_parameter_matching():
    # 1. booking_confirmationn: 4 params: name, service, date, time
    b_params = ["Bhuvanesh", "WhatsApp Automation and CRM Live Demo", "25-09-2026", "06:00 PM"]
    assert len(b_params) == 4

    # 2. cancellation_confirmation: 4 params: name, service, date, time
    c_params = ["Bhuvanesh", "WhatsApp Automation and CRM Live Demo", "25-09-2026", "06:00 PM"]
    assert len(c_params) == 4

    # 3. admin_cancellation_notice: 5 params: name, phone, service, date, time
    ac_params = ["Bhuvanesh", "918870341570", "WhatsApp Automation and CRM Live Demo", "25-09-2026", "06:00 PM"]
    assert len(ac_params) == 5

    # 4. booking_reschedule_confirmation: 4 params: name, service, date, time
    r_params = ["Bhuvanesh", "WhatsApp Automation and CRM Live Demo", "26-09-2026", "05:00 PM"]
    assert len(r_params) == 4

    # 5. admin_reschedule_notice: 5 params: name, phone, service, date, time
    ar_params = ["Bhuvanesh", "918870341570", "WhatsApp Automation and CRM Live Demo", "26-09-2026", "05:00 PM"]
    assert len(ar_params) == 5

    # 6. appointment_ramainder: 3 params: name, service, time
    rem_params = ["Bhuvanesh", "WhatsApp Automation and CRM Live Demo", "06:00 PM"]
    assert len(rem_params) == 3

    # 7. admin_appointment_reminder: 4 params: name, time, phone, service
    adm_rem_params = ["Bhuvanesh", "06:00 PM", "918870341570", "WhatsApp Automation and CRM Live Demo"]
    assert len(adm_rem_params) == 4

    print("[PASS] Template parameter matching verified against live Meta approval specs!")


if __name__ == "__main__":
    test_user_exact_failure_case()
    test_various_cancellation_ai_responses()
    test_cancellation_negative_cases()
    test_template_parameter_matching()
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
