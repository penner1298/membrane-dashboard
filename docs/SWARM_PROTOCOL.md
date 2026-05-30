# Membrane Swarm Protocol

The swarm protocol is Membrane's parallel extraction path for large or repetitive structured extraction jobs. It exists to reduce attention decay, reject malformed work before fan-out, and keep token spend predictable.

## Endpoints

| Endpoint | Purpose |
| :--- | :--- |
| `POST /v1/swarm/plan` | Forecasts chunk count, cost, latency, risk, and recommended execution mode without model calls. |
| `POST /v1/swarm/map` | Runs parallel map-reduce extraction across document chunks and returns the extraction matrix plus metadata. |
| `POST /v1/swarm/state` | Verifies agent-generated state/code structures in the sandbox before signing accepted state. |

## Execution Modes

Set the mode with the `X-Membrane-Swarm-Mode` header or the `MEMBRANE_SWARM_MODE` environment variable.

| Mode | Behavior | Best fit |
| :--- | :--- | :--- |
| `legacy` | Sends all chunks through the full model path. | Known-good requests where maximum parallelism matters more than failure containment. |
| `early_gate` | Validates chunk count, chunk size, payload shape, and extraction criteria before any model calls. | Unknown clients, noisy integrations, public endpoints, and cost-sensitive flows. |
| `canary` | Runs the first chunk through the model path before fan-out; aborts if the sentinel fails validation. | Valid-looking payloads that may still trigger semantic, refusal, or schema failures. |

## Strict Gated Limits

The gated modes currently expect:

- 1 to 25 chunks.
- No chunk larger than 25,000 characters.
- No request larger than 200,000 total characters.
- `extraction_criteria.system_persona`.
- `extraction_criteria.target_signals` as a list of strings.

Requests that fail the structural gate should return `422` before model fan-out. Canary failures should charge, at most, the sentinel chunk.

## Metadata Expectations

Swarm responses and telemetry should preserve enough metadata to explain:

- Which mode ran.
- Whether the request was rejected at the gate.
- Whether a canary was used and whether it succeeded.
- How many chunks reached the model.
- Estimated avoided or wasted tokens.
- Latency and concurrency signals.

See `docs/internal/SWARM_EXPERIMENT_TRACKER.md` for the experiment history behind these controls.
