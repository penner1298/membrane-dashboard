# Membrane

**An open-source proxy and parallel extraction engine for agent systems.**

Membrane gives you an OpenAI-compatible endpoint (`/v1/chat/completions`) plus a specialized `/v1/swarm/map` primitive for processing arrays of text chunks concurrently, with strong isolation between them. 

It is built for the specific pain of document-heavy workflows: contracts, transcripts, logs, research packets, regulatory filings. Split the work, process in parallel without one weak section contaminating everything, reject early when the input is garbage, and see the actual savings in your console.

This is not magic. These are practical patterns that reduce wasted token spend on failed or low-value extractions.

Local use is free and unrestricted forever. Commercial production use on public cloud infrastructure is $29 per month flat (honor-based). See Pricing section below.

## What It Does Today

- Drop-in OpenAI-compatible proxy (`/v1/chat/completions`) with routing to multiple providers via LiteLLM (OpenAI, Gemini, Ollama, etc.)
- Native `/v1/swarm/map` endpoint: send an array of chunks + extraction criteria, get structured JSON back from parallel isolated workers
- Supporting systems: L1 semantic + exact caching, usage tracking + cost attribution per key/tenant, context pruning controls, early gate + canary rejection modes, basic monitoring dashboard
- Self-hostable in one Docker command. Runs locally with self-healing fallbacks and mock modes for testing.

## Key Proof Points (Real Workloads)

From controlled benchmarks on identical prompts and models (full data and scripts in BENCHMARKS.md):

| Workload                        | Raw OpenAI Cost | Membrane Cost | Savings | Speedup | Cache Hit Rate | Notes |
|--------------------------------|-----------------|---------------|---------|---------|----------------|-------|
| 200-page contract analysis     | $18.40          | $2.71         | **85%** | 3.8×    | 74%            | Full swarm + early gate |
| 50 earnings call transcripts   | $9.20           | $1.38         | **85%** | 4.2×    | 91%            | Heavy semantic repeat |
| 1,000 log-line anomaly detection | $4.10         | $0.82         | **80%** | 2.9×    | 63%            | Canary mode saved 41% of runs |
| Multi-PDF research (32 docs)   | $12.60          | $3.15         | **75%** | 4.7×    | 82%            | Map-reduce isolation |

**Average across workloads: 81% cost reduction, 3.9× faster.**

Live production examples:
- **Contract Pulse** (https://contract-pulse.app): Parallel swarm extraction on 20–200+ page legal PDFs. Strong chunk isolation surfaces hidden risks and clauses that monolithic prompts miss. Early validation prevents garbage extractions from wasting budget.
- **Pennergraph.ai** (https://pennergraph.ai): Processes state audits, city council minutes, and regulatory filings at volume. Extracts structured signals reliably from messy government documents where direct LLM calls frequently drop critical sections.

## Drop-in Integration (One Line)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",   # or your production gateway
    api_key="any-string-works-locally"
)

# Your existing code works unchanged.
response = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract liabilities from this contract..."}]
)
```

For the extraction superpower:

```python
# Plan first (zero upstream spend)
plan = client.post("/v1/swarm/plan", json={ "chunks": [...], ... })

# Then execute the parallel isolated map
result = client.post("/v1/swarm/map", json={ "chunks": [page1, page2, ...], "extraction_criteria": { ... } })
```

JavaScript/TypeScript examples in `membrane-js/`. Python SDK in `membrane-py/`.

Self-host:

```bash
docker run -d -p 8000:8000 membraneapi/gateway
```

Or from source:

```bash
git clone https://github.com/thejoshuapenner/membrane-dashboard
cd membrane-dashboard
pip install -r requirements.txt
python3 server.py
```

Point any OpenAI-compatible client at the endpoint. Any string works as a key in local/dev mode.

## Current Strengths

- Chunk isolation that actually works on long legal and government documents (see live examples above)
- Early rejection (early_gate + canary modes) that saves real money by killing bad jobs before they hit the model
- Visible savings and telemetry in the console/dashboard
- Zero client refactoring — one base_url change
- Fully self-hostable with no external dependencies required for basic use

## Current Limitations (Explicit)

We want developers to trust what we ship. Here is what Membrane is not:

- Latency on standard chat completions is not competitive with direct provider calls (the value is in caching, planning, and swarm extraction paths).
- Schema enforcement and structured output validation can still be brittle on complex or ambiguous extractions.
- Strongest on repetitive structured extraction across many similar chunks/documents. Less proven (and less magical) on highly dynamic, open-ended conversational multi-agent orchestration or one-off creative reasoning tasks.
- You still pay the underlying model providers for every call that reaches them. We just work hard to make fewer of those calls wasteful or redundant.
- Not a general solution for hallucination cascades across arbitrary agent graphs (yet).

See the docs and MEMBRANE_SWARM_PROTOCOL.md for the exact ingestion rules and guardrails that make the extraction path reliable.

## Pricing (Open Core, Honor-Based, No Gotchas)

- **Local development & testing**: Completely free and unrestricted. Forever. Run on your laptop or private network with any key string you want.
- **Commercial production use**: $29 per month flat fee when the software is deployed on public cloud infrastructure (AWS, GCP, Azure, Render, Vercel, Fly.io, etc.) powering an active application, API, or service outside your local machine.
- Annual option: $290/year (~20% discount).
- Founding lifetime license: $490 one-time (limited to the first 75 buyers). After that, the lifetime option is removed.

**Definition of commercial production** (from the LICENSE and pivot docs): Any deployment on public cloud infrastructure that powers anything outside a developer's local machine (`localhost`) or private personal network.

We do not meter usage. We do not restrict features. We do not insert hard blocks, truncation, or paywalls in the code. The software ships fully functional. This is a pure honor-based model.

We ship the full thing because we believe developers who see real savings (visible in the console) will support the work. Low early conversion is expected and acceptable. We prioritize trust and adoption.

Full details and Polar.sh purchase links are on the live site and in the docs.

## Getting Started

See Quickstart above. Full examples in `membrane-py/examples/` and `membrane-js/examples/`.

Key endpoints:
- `POST /v1/chat/completions` — OpenAI-compatible (with caching benefits)
- `POST /v1/swarm/plan` — Zero-cost forecast of tokens, cost, latency, risk, recommended concurrency
- `POST /v1/swarm/map` — Parallel structured extraction with isolation
- `POST /v1/swarm/state` — Sandboxed verification for agent-generated code (Python/TS)

## Philosophy

Send work as arrays of discrete chunks rather than monolithic contexts. Process them in isolation. Validate early. Cache when the signal repeats. Only synthesize when you have clean structured outputs from the map step.

This approach reduces context contamination, makes costs predictable, and stops you from burning tokens on work that was never going to succeed.

## Project Status

Actively used in production by the authors for legal and civic/government document workloads (Contract Pulse + Pennergraph.ai). Public documentation, SDKs, and examples are maturing.

Feedback, real usage reports, benchmarks from your own workloads, and integration examples (LangChain, LlamaIndex, CrewAI, etc.) are genuinely welcome.

Built in public. No hype.

## License

Apache 2.0 for the core (see LICENSE). Commercial production deployments on public cloud require a separate commercial production license under the terms described above and in the LICENSE file.

See also: BENCHMARKS.md, MEMBRANE_SWARM_PROTOCOL.md, use_cases.md, the live dashboard at membrane-api.com, and /docs on the site.