# Membrane Swarm Guard

Membrane Swarm Guard is a high-speed, self-healing inter-agent routing layer and control panel. Sitting as a zero-trust proxy and semantic cache between agent swarms and frontier AI models, it acts as the "Cloudflare for AI Swarms" by stripping conversational hallucination bloat and strictly enforcing JSON schema compliance at sub-2ms cache latencies.

We have officially transitioned from a closed-source SaaS to a fully **Open-Source / Sponsorware** model. You can run Membrane locally or host your own edge proxy.

---

## ⚡️ Features & Architecture

* **OpenAI Compatible Endpoint:** Drop-in replacement for OpenAI SDK/API routing. Point your agents directly to `http://localhost:8000/v1`.
* **Sub-2ms Semantic Edge Caching:** Powered by `pgvector`—identical semantic queries bypass frontier models entirely, returning answers in roughly 1.24ms to save on token costs and latency.
* **Zero-Shot Isolation Protocol:** Prevents cascading hallucinations by isolating the immediate task from system rules and stripping conversational middle-history (saving up to 80% on token overhead).
* **TypeScript AST Schema Enforcement:** Verifies React or Next.js compilation syntax in a secure local sandbox, throwing HTTP `400` or `500` fail-hard errors on compilation exceptions instead of passing exceptions in `200 OK` payloads.
* **Canary Threat Firewall:** Concurrently scans prompt intent in ~150ms using a fast Canary model to intercept prompt injections and policy violations mid-flight.
* **Native Swarm Map-Reduce Engine:** Fans out processing of massive datasets via `/v1/swarm/map` with parallel extraction agents, enforcing a strict threshold of **maximum 50 chunks** per request to prevent rate-limits.
* **Offline Model Overrides:** Route to arbitrary providers (e.g., `ollama/llama3`, `local/Llama-3-8B`). Membrane dynamically isolates and resolves LiteLLM key parameters to prevent offline boot crashes.

---

## 🚀 Getting Started

Membrane is split into two components: the **FastAPI Proxy Backend** (running on port `8000`) and the **Next.js Dashboard Control Panel** (running on port `3000`).

### 1. Start the Membrane Swarm Guard Backend
The fastest way to spin up the backend proxy is using our portable, self-healing Docker container:
```bash
docker run -d -p 8000:8000 thejoshuapenner/membrane-guard
```
Or run the Python core server directly:
```bash
pip install -r requirements.txt
python3 server.py
```
Membrane will automatically self-heal and provision local database structures or fall back to high-fidelity mock telemetry if a database is not present.

### 2. Start the Control Panel Frontend
From the root of the `membrane-dashboard` Next.js project directory:
```bash
cd membrane-dashboard
npm install
npm run dev
```

### 3. Access Dashboard
Open your browser to [http://localhost:3000](http://localhost:3000) to view the Swarm Guard Control Panel and monitor local traffic.

---

## 🔌 Integration (AI Coworker)

Point your LLM client or OpenAI SDK to the local Membrane sandbox endpoint. You can repoint your client in exactly three lines of code:

```python
from openai import OpenAI

# Repoint base_url to local container engine. Any key works during local evaluation!
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="local_tinkering_key"
)

# Gateway seamlessly handles AST verification and model fallback
completion = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract liabilities from my contract."}]
)
```

### Integration Details
* **Base URL:** `http://localhost:8000/v1` (or `https://membrane-api.com/v1` for cloud hosted instance)
* **Authentication:** `Authorization: Bearer sk_live_YOUR_API_KEY` (Any string to track the tenant)
* **Model:** `membrane-engagement-layer` (Or any model name; Membrane routes dynamically)

### Context Memory Preservation (Preventing Amnesia)
By default, Membrane purges intermediate assistant messages to optimize speed. If your multi-turn chat agents require full conversation history preservation, pass the custom HTTP request header:
`X-Membrane-Preserve-Context: true`

---

## 💎 Just-In-Time Onboarding & Sponsorware

Getting started with Membrane is friction-free:
* **Optional Polar.sh Licenses:** A Polar.sh license key is entirely optional for local developer sandboxes. Setting `MEMBRANE_LICENSE_KEY` to `"test_license_key"` (the default if empty) bypasses the live license gate and unlocks all capabilities.
* **Instant Local Balance:** Any local bearer token key (e.g., `sk_live_local_dev_key`) passed in the Authorization header will automatically provision a **$1,000 testing balance** in the local database for rapid integration testing.

If you are building high-growth production systems or want to support development, consider funding us via our **[Polar.sh Sponsor Tiers](https://buy.polar.sh/polar_cl_xD35VJkFTyba3qNO9q8D5WZ8pemoyiMxVsEyp3xAnbu)**.
