## What Membrane Actually Is Today

Membrane is an open-source, self-hostable proxy and parallel extraction engine.

**Core capabilities right now:**
- OpenAI-compatible chat completions endpoint with multi-provider routing (primarily via LiteLLM).
- A dedicated `/v1/swarm/map` endpoint that takes an array of text chunks and returns structured JSON extractions processed in parallel with isolation between chunks.
- Supporting systems: L1 semantic caching, usage tracking + cost accounting per tenant/key, context pruning controls, self-healing local mode with mock fallbacks, and a basic monitoring dashboard.

**Primary value today:**
It is most useful for high-fidelity structured extraction from large documents or datasets inside agent workflows. By forcing discrete chunk processing and isolation, it reduces the risk of one bad section poisoning an entire analysis. This pattern is already in active internal use (e.g., Contract Pulse contract analysis).

**Current limitations:**
- Latency on normal chat calls is mediocre.
- Schema validation is inconsistent and can reject valid upstream responses.
- It is not yet a robust general-purpose solution for preventing hallucination cascades across arbitrary multi-agent systems.
- Most of the sophisticated behavior is concentrated in the document/swarm extraction path.

**Monetization approach (updated):**
We are using a simple flat-fee open-core model:
- Completely free and unrestricted for local development and testing.
- $29 per month flat fee for commercial production use (defined as deployment on public cloud infrastructure).
- Annual payment is available at a discount ($290/year, subject to change).

This model removes all feature restrictions and metering. The only trigger for payment is when the software is used to power a production system outside of a developer's local machine.

**Strategic intent:**
The current implementation is real infrastructure we use daily. It is also the practical foundation we are standing on while we figure out what a genuine “lossless inter-agent protocol” should look like. We should not overclaim the protocol vision while the current system is still primarily a strong extraction + proxy layer. Pricing is intentionally simple and accessible at this early stage to acquire real feedback from paying users.