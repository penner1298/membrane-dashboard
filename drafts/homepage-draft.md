# Membrane

**High-fidelity extraction and structured handoffs for agent systems.**

I built this after repeatedly getting destroyed by token costs and cascading hallucinations in multi-agent work. One weak response would poison the swarm — agents would lose track of reality, context would explode, and costs would spiral.

Membrane is an open-source proxy and extraction engine that helps with some of these problems in practice today.

### What It Does

- Drop-in OpenAI-compatible endpoint (`/v1/chat/completions`)
- Specialized `/v1/swarm/map` endpoint for parallel structured extraction across document chunks
- Strong chunk isolation so individual sections don’t contaminate each other
- Usage tracking, cost attribution, and easy local or self-hosted deployment
- Semantic caching and context pruning controls

It is currently used in production for reliable document processing and analysis workloads (including internal tools like Contract Pulse).

### Pricing

- Free for local development and testing.
- $29 per month flat fee for commercial production use (when running on public cloud infrastructure).
- 20% discount for annual payment.

We keep it simple: no usage metering and no feature restrictions. You only pay when you put it into production outside of your own machine.

### The Longer-Term Direction

The current tools are practical and useful on their own. The bigger direction is building toward more reliable communication patterns between specialized agents — reducing hallucination cascades, bias creep, and uncontrolled context growth as agents hand work to each other.

### Get Started

**Local:**
```bash
docker compose up
# or
python3 server.py
```

Point any OpenAI-compatible client to the endpoint. Any string works as a key during local development.

### Philosophy

Send work as arrays of chunks. Process them in isolation. Only synthesize when you have clean, structured outputs.

This is not magic. It is a set of patterns and infrastructure that makes certain classes of agent work more reliable and cheaper.

**Built in public. Feedback welcome.**

[GitHub](https://github.com/thejoshuapenner/membrane) • [Docs](#) • [Dashboard](#)
