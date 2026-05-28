# Membrane — The Drop-In LLM Proxy That Actually Saves You Money

**Stop burning tokens on failed extractions.**

Membrane is an open-source OpenAI-compatible proxy + parallel swarm extraction engine. Point your existing SDK at it and get semantic caching, honest pre-flight cost forecasting, and a specialized `/v1/swarm/map` endpoint for processing large documents as isolated chunks instead of one giant context.

One line of code. Real savings. No new abstractions.

[![License](https://img.shields.io/badge/License-BSL_1.1-blue.svg)](LICENSE)  
**Free forever for local development & testing.** Commercial production use (public cloud) = **$29/mo flat** or **$490 lifetime** (founding, first 75 only).

## Why this exists

Developers doing serious structured extraction (contracts, transcripts, logs, policy packets, RAG prep) hit the same wall:

- Full documents blow past context windows or get truncated
- One bad chunk poisons the whole response
- Token bills are unpredictable and often shocking
- Caching is either exact-match only or nonexistent

Membrane solves the mechanical part: split work into chunks, process in true parallel with isolation, validate early so bad jobs die cheap, cache semantically when it makes sense, and tell you the cost/latency/risk **before** you spend anything.

It is not magic. It is infrastructure for the class of workload where the same structured analysis runs across many similar pieces of content.

## The numbers (real workloads, same prompts/models)

From production use on 200-page contracts, 50 earnings transcripts, 1,000 log lines, and multi-PDF research sets:

- **75-85% cost reduction** typical vs direct OpenAI calls
- **3-5× faster** end-to-end on repetitive extraction
- High semantic cache hit rates (often 70-90% on recurring document types)
- Early gate + canary modes routinely save 40-90% on malformed or failing jobs

See [BENCHMARKS.md](BENCHMARKS.md) for methodology and raw data.

## Quickstart (literally one line)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://membrane-api.com/v1",   # or http://localhost:8000/v1 locally
    api_key="your-key-here"                    # any string works for local dev
)

# Your existing code works. You now get caching + swarm primitives.
completion = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract all liability caps and indemnity terms from this contract..."}]
)
```

For the real power (large docs):

```python
# Get an honest forecast first
plan = client.post("/v1/swarm/plan", json={
    "chunks": [page1_text, page2_text, ...],   # full pages, no manual truncation
    ...
})

# Then run the parallel extraction
result = client.post("/v1/swarm/map", json={...})
```

Full Python/JS examples in `membrane-py/` and `membrane-js/`.

## What you actually get

- Drop-in OpenAI SDK compatibility (no client changes beyond base_url)
- `/v1/swarm/map` — parallel map-reduce with strong per-chunk isolation
- `/v1/swarm/plan` — cost, latency, concurrency, and risk forecast with zero upstream spend
- Early rejection modes (`early_gate`, `canary`) so garbage fails before it costs real money
- L1 semantic + exact caching (the savings you actually feel)
- Self-host in one Docker command: `docker run -p 8000:8000 membraneapi/gateway`
- Model-agnostic routing (bring your own keys for OpenAI, Claude, Gemini, local, etc.)
- Sandboxed code verification endpoint (`/v1/swarm/state`) for agent-generated scripts

## Real production usage

Membrane powers extraction in:

- **[Contract Pulse](https://contract-pulse.app)** — AI contract scanner that turns predatory legal language into plain English + ready-to-send pushback emails. Heavy use of swarm + early gating on 20-100+ page PDFs.
- **[Pennergraph.ai](https://pennergraph.ai)** — Civic intelligence platform monitoring state audits, city council minutes, and regulatory filings at volume. Structured signals extracted reliably across long, messy government documents.

These are not demos. They are live systems that chose Membrane because direct LLM calls were dropping critical clauses and producing surprise bills.

## Honest limitations

Membrane is optimized for **repetitive structured extraction** across many similar documents or chunks. It is less magical on:

- Highly dynamic, open-ended conversational agents
- One-off creative or reasoning tasks where full context is genuinely required
- Workloads where the "map" step itself is trivial and the hard part is the synthesis

You still pay the underlying model providers. We just try very hard to make fewer of those calls wasteful.

## Pricing (open core, honor-based)

| Plan              | Price             | Notes                                      |
|-------------------|-------------------|--------------------------------------------|
| Local / Dev       | $0 forever        | Full features, any key works, unlimited    |
| Commercial Prod   | $29 / month       | Flat. No metering. Public cloud deployments |
| Annual            | $290 / year       | ~20% discount                              |
| Founding License  | $490 one-time     | Lifetime. Limited to first 75 buyers       |

**Commercial production** = running on AWS, GCP, Render, Fly, Vercel, etc. powering anything outside your laptop or private network.

We do not enforce this technically. We ship the full software and ask you to license it if you are using it in production. The bet is that if it saves you serious money, you will support the work.

## Getting started locally

```bash
git clone https://github.com/thejoshuapenner/membrane-dashboard
cd membrane-dashboard
pip install -r requirements.txt
python3 server.py
```

Or Docker:

```bash
docker run -d -p 8000:8000 membraneapi/gateway
```

Point any OpenAI-compatible client at `http://localhost:8000/v1`.

## Project status

Actively used in production by the authors for legal and government document workloads. Public documentation, examples, and integrations are maturing quickly.

Feedback, real usage reports, and contributions are genuinely welcome — especially benchmarks on your own workloads and integration examples for LangChain, LlamaIndex, CrewAI, etc.

**Built in public. No hype.**

## Links

- Live site + playground: https://membrane-api.com
- Docs: https://membrane-api.com/docs
- Python SDK/examples: `membrane-py/`
- JavaScript SDK/examples: `membrane-js/`
- Swarm protocol & ingestion rules: [MEMBRANE_SWARM_PROTOCOL.md](MEMBRANE_SWARM_PROTOCOL.md)
- Benchmarks: [BENCHMARKS.md](BENCHMARKS.md)

---

**License:** Business Source License 1.1 (see LICENSE). Commercial production requires separate license.