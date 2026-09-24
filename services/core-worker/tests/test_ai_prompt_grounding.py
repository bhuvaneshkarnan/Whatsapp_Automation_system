import sys
import os

# Add core-worker path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from providers.llm_router import budget_prompt_for_groq

def test_budget_prompt_preserves_large_kb():
    # Simulate a realistic 16,000 character prompt (like Mind Body Recovery or Boldlabs + calendar)
    kb = "### TENANT CUSTOM AI INSTRUCTIONS & BUSINESS KNOWLEDGE BASE (PRIMARY BUSINESS DIRECTIVE):\n" + ("We offer Ayurveda, Physiotherapy, and Naturopathy. " * 200)
    services = "### VERIFIED SERVICES & PRICING CATALOG:\nJunior doctor: 300 INR\nSenior doctor: 500 INR\nAyurveda massage: 1850 INR"
    global_rules = "### GLOBAL PLATFORM DEFAULT RULES & CLOSING FRAMEWORK (STRICT MANDATORY COMPLIANCE):\n- SALES CLOSER\n- EASY INDIAN ENGLISH\n- 3-BEAT SALES FORMULA"
    strict_rules = "### TENANT STRICT BUSINESS RULES & POLICIES (MANDATORY):\n- Never diagnose or prescribe medical treatments"
    website = "### OFFICIAL BUSINESS WEBSITE & PORTAL LINK:\nhttps://crm.goboldlabs.com"
    calendar = "### LIVE GOOGLE CALENDAR (VERIFIED EMPTY & AVAILABLE SLOTS):\n- Tomorrow 10:00 AM\n- Tomorrow 02:00 PM"
    action_tags = "### ACTION TAG PROTOCOLS (Executed by system when appointments or contact details are confirmed):\n- [ACTION:CREATE_BOOKING: ...]"

    full_prompt = "\n\n".join([
        "Today is Thursday, 25 Sep 2026",
        "You are Rakshaya representing Boldlabs",
        global_rules,
        strict_rules,
        kb,
        services,
        website,
        calendar,
        action_tags
    ])

    print(f"Full prompt length: {len(full_prompt)} chars")
    assert len(full_prompt) > 10000

    # Test that budget_prompt_for_groq does not truncate or chop this prompt!
    budgeted = budget_prompt_for_groq(full_prompt, max_chars=24000)
    assert len(budgeted) == len(full_prompt), "Expected prompt to be preserved in full without budgeting when <= 24,000 chars"

    # Verify all critical sections exist in budgeted prompt
    assert "Ayurveda, Physiotherapy, and Naturopathy" in budgeted
    assert "Junior doctor: 300 INR" in budgeted
    assert "SALES CLOSER" in budgeted
    assert "Never diagnose or prescribe" in budgeted
    assert "https://crm.goboldlabs.com" in budgeted
    assert "ACTION:CREATE_BOOKING" in budgeted
    assert "Tomorrow 10:00 AM" in budgeted
    print("[PASS] Full tenant knowledge base and global rules preserved completely for Groq!")

def test_budget_prompt_overflow_preserves_sections():
    # Simulate an extreme 35,000 character prompt
    kb = "### TENANT CUSTOM AI INSTRUCTIONS & BUSINESS KNOWLEDGE BASE (PRIMARY BUSINESS DIRECTIVE):\n" + ("Detailed clinical procedure guideline. " * 500)
    services = "### VERIFIED SERVICES & PRICING CATALOG:\nConsultation: 500 INR"
    global_rules = "### GLOBAL PLATFORM DEFAULT RULES & CLOSING FRAMEWORK (STRICT MANDATORY COMPLIANCE):\n- 3-BEAT SALES FORMULA"
    strict_rules = "### TENANT STRICT BUSINESS RULES & POLICIES (MANDATORY):\n- STRICT MEDICAL RULE"
    website = "### OFFICIAL BUSINESS WEBSITE & PORTAL LINK:\nhttps://crm.goboldlabs.com"
    calendar = "### LIVE GOOGLE CALENDAR (VERIFIED EMPTY & AVAILABLE SLOTS):\n- Tomorrow 11:00 AM"
    action_tags = "### ACTION TAG PROTOCOLS:\n- [ACTION:CREATE_BOOKING: ...]"

    huge_prompt = "\n\n".join([
        "Today is Thursday, 25 Sep 2026",
        "You are Assistant representing Clinic",
        global_rules,
        strict_rules,
        kb,
        services,
        website,
        calendar,
        action_tags
    ])
    print(f"Huge prompt length: {len(huge_prompt)} chars")
    budgeted = budget_prompt_for_groq(huge_prompt, max_chars=24000)
    assert len(budgeted) <= 24000, f"Budgeted prompt exceeded 24,000 chars: {len(budgeted)}"

    # Check that even under extreme overflow, critical sections are NOT dropped
    assert "3-BEAT SALES FORMULA" in budgeted, "Global rules missing!"
    assert "STRICT MEDICAL RULE" in budgeted, "Strict rules missing!"
    assert "Detailed clinical procedure guideline" in budgeted, "Knowledge base missing!"
    assert "Consultation: 500 INR" in budgeted, "Services catalog missing!"
    assert "https://crm.goboldlabs.com" in budgeted, "Website link missing!"
    assert "ACTION:CREATE_BOOKING" in budgeted, "Action tags missing!"
    assert "Tomorrow 11:00 AM" in budgeted, "Calendar missing!"
    print("[PASS] Extreme prompt overflow retains ALL essential sections and rules within budget!")

if __name__ == '__main__':
    test_budget_prompt_preserves_large_kb()
    test_budget_prompt_overflow_preserves_sections()
    print("ALL AI PROMPT GROUNDING TESTS PASSED!")
