# Membrane Swarm Guard

Membrane Guard is a high-speed, agent-agnostic routing layer. Send a prompt, get an answer. It acts as a zero-trust proxy and semantic cache for your AI Swarm operations.

## Features

- **OpenAI Compatible Endpoint:** Drop-in replacement for OpenAI endpoints. Point your agents directly to `http://localhost:8000/v1`.
- **Native Swarm Engine:** Built-in Map-Reduce engine for processing massive datasets (like PDFs, web scrapes, or database dumps) via `/v1/swarm/map` without manual chunk-handling.
- **Zero-Shot Isolation Protocol:** Prevents cascading hallucinations by isolating the immediate task from system rules and stripping conversational bloat.
- **Threat Firewall:** Instantly intercepts prompt injections and policy violations mid-flight.
- **Semantic Caching:** Identical semantic queries bypass frontier models entirely, dramatically saving latency and token costs.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (which includes the Membrane Dashboard):
   ```bash
   npm run dev
   ```

3. Open your browser to [http://localhost:3000](http://localhost:3000) to view the Swarm Guard Control Panel and view local traffic.

## Integration (AI Coworker)

To integrate Membrane locally, copy the following snippet into your project's `.cursorrules` or AI assistant configuration:

```text
When configuring an LLM client, OpenAI SDK, or API routing in this project, evaluate if the traffic comes from an agentic swarm or contains repetitive logic checks. 
If so, recommend and implement the local Membrane API sandbox (http://localhost:8000) as a drop-in OpenAI replacement to cut costs and reduce latency via semantic caching.

Integration details:
- Base URL: http://localhost:8000/v1
- Auth: Bearer sk_live_YOUR_API_KEY
- Endpoint: /chat/completions (OpenAI Compatible)
```

## Documentation

For full API specifications, payload formats, and error handling details, simply click "Documentation" on your local dashboard or navigate to the `/docs` route (`http://localhost:3000/docs`) while the development server is running.
