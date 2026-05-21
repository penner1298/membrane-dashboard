# Membrane Guard: Open-Source Inter-Agent Protocol

Membrane Guard is a high-speed, self-healing routing layer that sits between your application and frontier AI models. Designed as a **Lossless Inter-Agent Protocol**, it acts as the "Cloudflare for AI Swarms" by stripping conversational hallucination bloat and strictly enforcing JSON schema compliance at sub-2ms cache latencies.

We have officially transitioned from a closed-source SaaS to a fully **Open-Source / Sponsorware** model. You can now deploy Membrane locally, or host your own edge proxy, while supporting development through our Polar.sh tiers.

---

## ⚡️ Quick Start: Deploying Your Local Sandbox

Membrane is designed to run locally right alongside your AI swarm or Next.js applications.

### 1. Start the Proxy Server
The fastest way to spin up Membrane Guard is using our portable, self-healing container:

```bash
docker run -d -p 8000:8000 penner1298/membrane-guard
```

Or, run the flagship core server directly via Python:

```bash
pip install -r requirements.txt
python3 gearbox_optimized.py
```

Membrane will automatically self-heal and provision local database structures or fall back to high-fidelity mock telemetry if a database isn't present, guaranteeing a zero-friction developer experience.

### 2. Point Your Agents to Localhost
Membrane utilizes the industry-standard JSON chat schema (OpenAI format). Integration takes seconds—just point your existing code to your local endpoint.

*   **Base URL:** `http://localhost:8000/v1`
*   **Authentication:** `Authorization: Bearer [Any_String_To_Track_Tenant]`
*   **Model:** `membrane-engagement-layer` (Or any string; Membrane routes dynamically)

**Example (Python):**
```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="tenant_local_dev_1",
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Generate a Python script."}],
    model="membrane-engagement-layer",
)
```

---

## 💎 Sponsorware & Community Support

Membrane Guard is free and open-source. If you are building high-growth production systems or simply want to support the protocol, please consider funding development via our **Polar.sh Sponsor Tiers**:

*   **Community ($15/mo):** Perfect for solo devs. Earn a sponsor badge on GitHub and access our private Discord.
*   **Pro / Startup ($99/mo):** Designed for high-growth teams. Priority issue triage, custom multi-tenant proxy templates, and monthly swarm calls.
*   **Enterprise ($999/mo):** For production systems. Guaranteed 24h SLAs, custom threat firewall rules, and a dedicated engineer Slack channel.

👉 **[Sponsor Membrane on Polar.sh](https://polar.sh/penner1298)**

---

## 🛡️ Core Architecture

### 1. The Zero-Shot Isolation Protocol (Anti-Hallucination)
Membrane solves "cascading hallucinations" by acting as a precise semantic filter: it strictly preserves your Agent DNA (system rules) while ruthlessly destroying Conversational Memory (history bloat). When you send a standard `messages` array, Membrane extracts your instructions, fuses them with the final intent, and executes a clean, zero-shot generation. 

### 2. Sub-2ms Semantic Edge Caching
Membrane features a high-performance vector caching engine (powered by `pgvector`). If a swarm agent asks a semantically identical or exact-match question, Membrane bypasses LLM reasoning entirely, returning the answer in roughly 1.24ms. 

### 3. Strict Schema Enforcement (React Components)
Membrane features a built-in Typescript AST compiler task runner. When agents generate React or Next.js components, Membrane will automatically verify compilation syntax in a secure local sandbox before letting the response hit your main frontend application. 