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

print("Running parallel swarm map-reduce task...")
results = client.swarm.map(payload)

print("\nIngestion Swarm Results:")
print(results)
