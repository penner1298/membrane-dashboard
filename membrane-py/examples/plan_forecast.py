from membrane import MembraneClient

client = MembraneClient()

payload = {
    "model": "membrane-engagement-layer",
    "chunks": [
        "SYSTEM_LOG: [AUTH] [CRITICAL] Failed to authorize root session for IP: 198.51.100.42.",
        "SYSTEM_LOG: [DB_POOL] [WARNING] Connection pool size peaked at 180 concurrent threads.",
        "SYSTEM_LOG: [API_GATEWAY] [ERROR] Routing exception generated. Endpoint returned 502."
    ],
    "max_concurrency": 3,
    "extraction_criteria": {
        "system_persona": "Identify error signatures, severity tokens, and root system IP addresses.",
        "target_signals": ["CRITICAL", "ERROR", "WARNING"]
    },
    "invariant_set_id": "ent_compliance_lock_v1"
}

print("Requesting pre-flight planning and pricing forecast...")
forecast = client.swarm.plan(payload)

trajectory = forecast.get("trajectory", {})
print("\nForecast Results:")
print(f" - Estimated Cost: ${trajectory.get('estimated_retail_cost', 0):.6f}")
print(f" - Estimated Latency: {trajectory.get('estimated_latency_ms', 0)} ms")
print(f" - Concurrency Recommendation: {trajectory.get('concurrency_recommendation', 0)}")
print(f" - Cache Hits Rate Estimate: {trajectory.get('estimated_cache_hit_rate', 0)}%")
print(f" - System Compliance Check: {'OK' if forecast.get('compliance_handshake') else 'FAIL'}")
