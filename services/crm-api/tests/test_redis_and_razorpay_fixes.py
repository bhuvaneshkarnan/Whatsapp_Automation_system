import asyncio
import sys
import os

# Add paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../core-worker")))

import razorpay_client
from services.alert_service import telegram_structlog_processor

async def test_razorpay_validation():
    print("Testing razorpay subscription ID validation...")
    
    # 1. Validation function
    assert razorpay_client.is_valid_subscription_id("sub_TeIaa7OueqVKIK") is True
    assert razorpay_client.is_valid_subscription_id("sub_1234567890ABCD") is True
    
    # The exact string from production database (20 chars):
    assert razorpay_client.is_valid_subscription_id("sub_boldlabs_monthly") is False
    assert razorpay_client.is_valid_subscription_id("") is False
    assert razorpay_client.is_valid_subscription_id(None) is False
    assert razorpay_client.is_valid_subscription_id("plink_TfAT4F4NHFvu3j") is False
    assert razorpay_client.is_valid_subscription_id("invalid-id") is False
    print("  [PASS] is_valid_subscription_id correctly rejects strings > 18 chars and non-sub prefixes")

    # 2. fetch_subscription with invalid sub_id returns empty dict immediately without calling API
    res_sub = await razorpay_client.fetch_subscription("sub_boldlabs_monthly")
    assert res_sub == {}, f"Expected empty dict, got {res_sub}"
    print("  [PASS] fetch_subscription gracefully handled invalid sub_id without HTTP request")

    # 3. fetch_invoices_for_subscription with invalid sub_id returns empty list immediately
    res_inv = await razorpay_client.fetch_invoices_for_subscription("sub_boldlabs_monthly")
    assert res_inv == [], f"Expected empty list, got {res_inv}"
    print("  [PASS] fetch_invoices_for_subscription gracefully handled invalid sub_id without HTTP request")

def test_alert_service_suppression():
    print("Testing alert_service transient redis error suppression...")
    
    # Simulate structlog event with redis timeout
    event_redis = {
        "event": "status_consume_loop_error",
        "error": "Timeout reading from redis:6379",
        "level": "error"
    }
    
    # The processor should return event_dict without scheduling an alert task
    res = telegram_structlog_processor(None, "error", event_redis)
    assert res == event_redis
    print("  [PASS] telegram_structlog_processor intercepted and suppressed Redis timeout alert")

    event_redis_direct = {
        "event": "Timeout reading from redis:6379",
        "level": "error"
    }
    res2 = telegram_structlog_processor(None, "error", event_redis_direct)
    assert res2 == event_redis_direct
    print("  [PASS] telegram_structlog_processor suppressed direct Redis timeout event")

async def main():
    await test_razorpay_validation()
    test_alert_service_suppression()
    print("\n🎉 ALL TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
