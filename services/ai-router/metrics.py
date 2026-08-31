from prometheus_client import Counter, Histogram, REGISTRY

ai_requests_total = Counter(
    "ai_requests_total",
    "Total AI requests routed",
    ["provider", "tenant", "status"],
)

ai_request_duration = Histogram(
    "ai_request_duration_seconds",
    "AI provider response latency",
    ["provider", "tenant"],
    buckets=[0.5, 1, 2, 3, 5, 7, 10, 15, 30],
)

ai_fallbacks_total = Counter(
    "ai_provider_fallback_total",
    "AI provider fallback events",
    ["from_provider", "to_provider"],
)

rule_engine_matches = Counter(
    "rule_engine_matches_total",
    "Messages handled by static rule engine",
    ["tenant", "rule_type"],
)