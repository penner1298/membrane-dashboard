# Membrane — The Drop-In LLM Proxy That Actually Saves You Money

**Stop burning tokens on failed extractions.**  
Membrane is the **OpenAI-compatible proxy + swarm extraction engine** built for agentic workflows that process *lots* of documents, transcripts, logs, or data chunks reliably and cheaply.

One line of code and you get:
- Semantic + exact caching (real $ savings)
- `/v1/swarm/map` — parallel map-reduce with strong isolation
- `/v1/swarm/plan` — honest cost, latency, and risk forecast **before** you spend a single token
- Early Gate + Canary mode so bad jobs fail fast and cheap

**Works with every OpenAI SDK out of the box.**  
No new abstractions. Just change the `base_url` and watch your costs drop.

[![License](https://img.shields.io/badge/License-BSL_1.1-blue.svg)](LICENSE)  
**Free forever for local/dev use.** Commercial production = $29/mo (or $490 one-time Founding License — only first 75).

## Why developers are switching

- **70-90% cost reduction** on repetitive RAG / document workloads (see benchmarks below)
- Predictable billing — know your spend *before* you run the swarm
- Production-grade safety: schema gating, AST verification, context isolation
- Self-host with one `docker compose up` or run the cloud version

**Ready to integrate in < 60 seconds?** → [Quickstart](#quickstart)

## Quickstart (literally one line)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://membrane-api.com/v1",   # or http://localhost:8000/v1 for local
    api_key="your-key-here"                    # any string works locally
)

# Normal chat completions — now with semantic caching
completion = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract liabilities from this contract..."}]
)
```

For swarm ingestion (your new superpower):

```python
response = client.post("/v1/swarm/plan", json={...})  # get forecast first!
# Then fire the real swarm/map
```

(Full examples in `/examples` folder + [docs](https://membrane-api.com/docs))

**Continue reading** for architecture, swarm protocol, real applications, and benchmarks.

## New Direction: Invariant-First Orchestration

We are moving toward a more structured approach called **Invariant-First Orchestration**. The core idea is simple:

1. **4D Layer** — Define and lock global invariants (schemas, budgets, output contracts, allowed models).
2. **2D Layer** — Learn from historical execution patterns to recommend better routing.
3. **3D Layer** — Execute with clear predictions and telemetry.

The new `/v1/swarm/plan` endpoint is the practical expression of this: call it first, get a concrete plan and cost forecast, then decide whether to execute.

This approach is particularly useful for production workloads where cost predictability and reliability matter.

## Real Applications

See [REAL_APPLICATIONS.md](REAL_APPLICATIONS.md) for a living list of actual use cases where Membrane is being used today (contract analysis, meeting transcripts, log parsing, etc.). We keep this file updated with real outcomes only — no hype.

## Pricing (Open Core)

Membrane is completely free for personal use, experimentation, and development.

If you are using Membrane for **commercial production work**, a paid license is required:

| Plan                | Price              | Details                                      |
|---------------------|--------------------|----------------------------------------------|
| Monthly             | $29/month          | Pay monthly                                  |
| Annual              | $290/year          | Best value (~$24/month)                      |
| Founding License    | **$490 one-time**  | Lifetime commercial license. Only first 75 buyers. |

The Founding License is limited to the first 75 commercial users. After that, the lifetime option will be removed.

We do not meter usage or restrict features. The only requirement is a valid license for commercial use.

## Getting Started

### Quick Local Start

```bash
git clone https://github.com/thejoshuapenner/membrane-dashboard
cd membrane-dashboard
pip install -r requirements.txt
python3 server.py
```

### Swarm State Verification Endpoint

The `/v1/swarm/state` endpoint provides sandboxed compilation and proof-of-work for agent-generated code.

Key parameters:
- `task_type`: `python_code` or `react_component`
- `payload`: The source code to validate
- `target_agent_id`: **Optional** destination identifier (used for logging/routing after successful verification)
- `destination_path`: Optional relative path to persist the file on success

See `MEMBRANE_SWARM_PROTOCOL.md` for full details and strict validation rules.
