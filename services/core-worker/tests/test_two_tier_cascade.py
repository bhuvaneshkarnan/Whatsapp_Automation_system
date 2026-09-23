import asyncio
from unittest.mock import AsyncMock, patch

from providers.llm_router import call_llm_cascade

async def test_tier1_tenant_success():
    """Verify that when tenant key works, master key is never used."""
    with patch("providers.llm_router.call_gemini", new_callable=AsyncMock) as mock_gemini, \
         patch("providers.llm_router.call_groq", new_callable=AsyncMock) as mock_groq:
        
        mock_gemini.return_value = "Tenant Gemini Reply"
        
        reply, provider = await call_llm_cascade(
            messages=[{"role": "user", "content": "hello"}],
            system_prompt="Test system",
            gemini_key="tenant_valid_gemini",
            groq_key="tenant_valid_groq",
            master_gemini_key="master_gemini_key",
            master_groq_key="master_groq_key",
            primary_provider="gemini",
            tenant_id="tenant-123",
        )
        
        assert reply == "Tenant Gemini Reply"
        assert provider == "gemini"
        # Verify call_gemini was called with tenant's key
        assert mock_gemini.call_args.kwargs["api_key"] == "tenant_valid_gemini"
        # Master groq / gemini should not be called
        assert mock_groq.call_count == 0
        print("[PASS] Tier 1 Tenant Key Success test passed")

async def test_tier2_master_parachute_fallback():
    """Verify that when all 3 tenant keys fail, system seamlessly falls back to master key."""
    with patch("providers.llm_router.call_gemini", new_callable=AsyncMock) as mock_gemini, \
         patch("providers.llm_router.call_groq", new_callable=AsyncMock) as mock_groq, \
         patch("providers.llm_router.call_opencode", new_callable=AsyncMock) as mock_opencode:
        
        # Tenant calls fail (Gemini rate-limited, Groq fails, OpenCode fails)
        async def gemini_side_effect(**kwargs):
            if kwargs.get("api_key") == "tenant_bad_gemini":
                raise Exception("Tenant Gemini 429 Rate Limited")
            elif kwargs.get("api_key") == "master_gemini_key":
                return "Master Gemini Saved The Day"
            raise Exception("Unknown key")

        mock_gemini.side_effect = gemini_side_effect
        mock_groq.side_effect = Exception("Tenant Groq Failed")
        mock_opencode.side_effect = Exception("Tenant OpenCode 403")

        reply, provider = await call_llm_cascade(
            messages=[{"role": "user", "content": "knee pain inquiry"}],
            system_prompt="Test system",
            gemini_key="tenant_bad_gemini",
            groq_key="tenant_bad_groq",
            opencode_key="tenant_bad_opencode",
            master_gemini_key="master_gemini_key",
            master_groq_key="master_groq_key",
            primary_provider="gemini",
            tenant_id="tenant-123",
        )

        assert reply == "Master Gemini Saved The Day"
        assert provider == "master_gemini"
        print("[PASS] Tier 2 Master Parachute Fallback test passed")

async def test_self_healing_return_to_tenant():
    """Verify that on the subsequent turn, once tenant key recovers, it immediately resumes using tenant key."""
    with patch("providers.llm_router.call_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = "Tenant Recovered Reply"

        reply, provider = await call_llm_cascade(
            messages=[{"role": "user", "content": "next message"}],
            system_prompt="Test system",
            gemini_key="tenant_refreshed_gemini",
            master_gemini_key="master_gemini_key",
            primary_provider="gemini",
            tenant_id="tenant-123",
        )

        assert reply == "Tenant Recovered Reply"
        assert provider == "gemini"
        assert mock_gemini.call_args.kwargs["api_key"] == "tenant_refreshed_gemini"
        print("[PASS] Self-Healing Return To Tenant test passed")

if __name__ == '__main__':
    asyncio.run(test_tier1_tenant_success())
    asyncio.run(test_tier2_master_parachute_fallback())
    asyncio.run(test_self_healing_return_to_tenant())
    print("ALL TWO-TIER CASCADE TESTS PASSED SUCCESSFULLY!")
