# Membrane

**An open-source proxy and swarm extraction engine for agent systems.**

Membrane provides an OpenAI-compatible endpoint along with a specialized parallel extraction engine (`/v1/swarm/map`). It is designed to help agent workflows apply the same structured analysis or extraction to many independent pieces of content in parallel, with strong isolation, schema controls, and upfront validation.

The current implementation is used internally for reliable document processing, structured extraction, and similar workloads where predictability matters. The longer-term direction is building more reliable, predictable communication patterns between agents.

## What It Does Today

- A self-hostable OpenAI-compatible proxy (`/v1/chat/completions`) with routing to multiple providers.
- A native swarm map-reduce endpoint (`/v1/swarm/map`) that processes arrays of text chunks in parallel and returns structured results.
- New: `/v1/swarm/plan` — a pre-flight planning endpoint that validates invariants, matches historical routing patterns, and provides cost, latency, and risk forecasts **before** any tokens are spent.
- Supporting features: Early Gate validation, Canary mode, usage tracking, semantic caching, and context controls.

## Current Strengths

- Strong chunk isolation and upfront validation that reduces context contamination and wasted runs.
- Predictable execution through invariant enforcement and planning.
- Built-in telemetry that improves routing decisions over time.
- Easy to run locally with full control.

## Current Limitations

- Still strongest on workloads that involve applying the same structured task to many items (documents, logs, transcripts, etc.) rather than highly dynamic conversational agents.
- Planning and routing intelligence will improve as more real usage data is collected.
- Schema enforcement and invariant locking are actively being hardened.

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
