import re
from datetime import datetime, timezone, timedelta

def extract_loc_snippet(full_location: str) -> str:
    if not full_location:
        return ""
    map_links = re.findall(r'https?://(?:maps\.app\.goo\.gl|goo\.gl/maps|www\.google\.com/maps|maps\.google\.com)[^\s]+', full_location)
    if not map_links:
        map_links = re.findall(r'https?://[^\s]+', full_location)
    if map_links:
        if len(map_links) == 1:
            return f"(📍 Directions: {map_links[0]})"
        else:
            return f"(📍 Gate 1: {map_links[0]} | Gate 2: {map_links[1]})"
    else:
        first_lines = [l.strip() for l in full_location.splitlines() if l.strip()]
        if first_lines:
            return f"(📍 {first_lines[0][:50]})"
    return ""

def test_single_map_link():
    text = "Clinic address: 123 Main St. Maps: https://maps.app.goo.gl/XYZ123"
    snippet = extract_loc_snippet(text)
    assert snippet == "(📍 Directions: https://maps.app.goo.gl/XYZ123)", f"Unexpected: {snippet}"
    print("[PASS] Single map link test passed")

def test_mbr_two_gates():
    text = """🌱 SHANTHA Ayurvedic & Alternative Therapy Centre

📍 Location (Bike Parking – Gate 1):
If you are coming by bike, you can park at Gate 1.
🔗 https://maps.app.goo.gl/r4kEKZYSjMEuHh3t7

🚗 Car Parking – Gate 2:
If you are coming by car, please use Gate 2.
It is located inside the road next to Bewell Hospital.
🔗 https://maps.app.goo.gl/HZWiycS9Z2KUt7cw5

📞 Call : 9042561651, 6374367559"""
    snippet = extract_loc_snippet(text)
    assert "Gate 1: https://maps.app.goo.gl/r4kEKZYSjMEuHh3t7" in snippet
    assert "Gate 2: https://maps.app.goo.gl/HZWiycS9Z2KUt7cw5" in snippet
    print("[PASS] MBR two gates test passed")

def test_plain_address_no_url():
    text = """Dr. Sharma Clinic
Near Apollo Pharmacy, Anna Nagar
Chennai - 600040"""
    snippet = extract_loc_snippet(text)
    assert snippet == "(📍 Dr. Sharma Clinic)", f"Unexpected: {snippet}"
    print("[PASS] Plain address test passed")

def test_outside_24h_parameter_assembly():
    # Outside 24h with MBR
    clean_name = "Valued Customer"
    date_str = "23 Sep 2026"
    clock_str = "02:00 PM"
    loc_snippet = "(📍 Gate 1: https://maps.app.goo.gl/1 | Gate 2: https://maps.app.goo.gl/2)"
    
    # 4-param template
    svc_param = f"Appointment {loc_snippet}".strip()
    tpl_params = [clean_name, svc_param, date_str, clock_str]
    assert len(tpl_params) == 4
    assert "Gate 1" in tpl_params[1]
    
    # Standard tenant
    base_svc = "Panchakarma Consultation"
    tpl_params_std = [clean_name, f"{base_svc} {loc_snippet}".strip(), date_str, clock_str]
    assert tpl_params_std[1].startswith("Panchakarma Consultation (📍 Gate 1:")
    print("[PASS] Parameter assembly test passed")

if __name__ == '__main__':
    test_single_map_link()
    test_mbr_two_gates()
    test_plain_address_no_url()
    test_outside_24h_parameter_assembly()
    print("ALL TESTS PASSED SUCCESSFULLY!")
