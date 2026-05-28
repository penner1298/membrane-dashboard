# Membrane

**An open-source proxy and swarm extraction engine for agent systems.**

Membrane provides an OpenAI-compatible endpoint along with a specialized parallel extraction engine (`/v1/swarm/map`). It is designed to help agent workflows process large documents and datasets by working on discrete chunks in parallel with isolation between them, rather than feeding everything into a single context window.

The current implementation is used internally for reliable document processing and structured extraction workloads. The longer-term direction is building more reliable communication patterns between agents.

## What It Does Today

- A self-hostable OpenAI-compatible proxy (`/v1/chat/completions`) with routing to multiple providers (Gemini, Ollama, and others via LiteLLM).
- A native swarm map-reduce endpoint (`/v1/swarm/map`) that accepts an array of text chunks and returns structured extractions processed concurrently.
- Supporting features including usage tracking, cost attribution, L1 semantic caching, and context controls.

## Current Strengths

- Strong chunk isolation model that reduces context contamination on large documents.
- Explicit support for parallel structured extraction patterns.
- Easy to run locally with self-healing fallbacks and mock modes.
- Built-in visibility into usage and costs.

## Current Limitations

- Latency on standard chat completions is not competitive with direct provider calls.
- Schema enforcement is still immature and can be brittle.
- The system is strongest on document-heavy extraction tasks and less proven on general multi-agent orchestration.

## Pricing (Open Core)

- **Local development & testing**: Completely free and unrestricted.
- **Commercial production use**: $29 per month flat fee when deployed on public cloud infrastructure.
- Annual payment is available at a discount ($290/year, subject to change).

We do not meter usage or restrict features. The only distinction is whether the software is running locally on a developer's machine or powering a production system.

## Getting Started

### Quick Local Start

```bash
git clone https://github.com/thejoshuapenner/membrane-dashboard
cd membrane-dashboard
pip install -r requirements.txt
python3 server.py
```

Then point your OpenAI client to `http://localhost:8000/v1`.

### With Docker

```bash
docker run -d -p 8000:8000 membraneapi/gateway
```

## Key Endpoints

- `POST /v1/chat/completions` — OpenAI-compatible chat
- `POST /v1/swarm/map` — Parallel structured extraction across chunks
- `POST /v1/swarm/state` — Verification / proof-of-work endpoint

## Usage with Contract Pulse (Example)

Membrane powers the extraction layer in internal tools such as Contract Pulse, where large legal documents are broken into chunks and processed by isolated agents before synthesis.

## Philosophy

Membrane prioritizes structural fidelity and explicit control over context. The recommended pattern is to send work as arrays of chunks rather than large monolithic contexts.

## Status

Membrane is open source and under active development. It is currently used heavily in personal and internal projects. Public distribution and documentation are still maturing.

Feedback and contributions are welcome.

---

## License

Apache 2.0 (with a separate commercial production license for cloud deployments).