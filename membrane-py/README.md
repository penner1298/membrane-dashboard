# membrane-py

Python SDK for Membrane: The Drop-In LLM Proxy That Actually Saves You Money.

## Installation

```bash
pip install membrane-py
```

## Quickstart

```python
from membrane import MembraneClient

client = MembraneClient()

# Normal chat completions — now with semantic caching
completion = client.client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract liabilities from this contract..."}]
)

# Swarm ingestion with forecasting
payload = {
    "model": "membrane-engagement-layer",
    "chunks": [
        "Chunk 1 of document content...",
        "Chunk 2 of document content..."
    ],
    "extraction_criteria": {
        "system_persona": "Extract liability terms.",
        "target_signals": ["indemnify", "breach", "liability"]
    }
}

# 1. Get an honest forecast first
forecast = client.swarm.plan(payload)
print("Forecasted cost:", forecast.get("trajectory", {}).get("estimated_retail_cost"))

# 2. Fire the real parallel swarm map
results = client.swarm.map(payload)
print(results)
```
