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

👉 **[Sponsor Membrane on Polar.sh](https://buy.polar.sh/polar_cl_xD35VJkFTyba3qNO9q8D5WZ8pemoyiMxVsEyp3xAnbu)**

---

## 🛡️ Core Architecture & Swarm Operations

### 1. The Zero-Shot Isolation Protocol & Legacy Compatibility
Membrane solves "cascading hallucinations" by acting as a precise semantic filter: it strictly preserves your Agent DNA (system rules) while ruthlessly destroying Conversational Memory (history bloat). When you send a standard `messages` array, Membrane extracts your instructions, fuses them with the final intent, and executes a clean, zero-shot generation.

> [!NOTE]
> **Legacy v1 Backward Compatibility (`X-Membrane-Preserve-Context`)**
> To prevent breaking active campaign projects, Membrane respects the **`X-Membrane-Preserve-Context: true`** HTTP header. 
> * **By Default:** `/v1/chat/completions` runs the Zero-Shot isolation stripper, discarding conversational middle-history to save up to 80% on token bloat.
> * **With Header Set:** Bypasses context isolation completely, passing 100% of historical context to legacy models.

### 2. Sub-2ms Semantic Edge Caching
Membrane features a high-performance vector caching engine (powered by `pgvector`). If a swarm agent asks a semantically identical or exact-match question, Membrane bypasses LLM reasoning entirely, returning the answer in roughly 1.24ms. 

### 3. Strict Schema Enforcement & Fail-Hard API Errors
Membrane features a built-in TypeScript AST compiler task runner. When agents generate React or Next.js components, Membrane verifies compilation syntax in a secure local sandbox before letting the response hit your main frontend application. 

> [!IMPORTANT]
> **No Hallucination Cascades (Fail-Hard)**
> Traditional gateways return raw compiler exceptions inside a successful `200 OK` response payload, causing downstream agents to ingest tracebacks as factual rules and enter a hallucination loop. **Membrane Guard strictly throws HTTP `400 Bad Request` or `500 Internal Server Error` payloads on failures.** This forces the upstream orchestrator to fail-hard and handle exceptions programmatically.

### 4. Arbitrary Model Overrides (Offline & Local Swarms)
To facilitate offline development and ultra-cheap swarm tasks, Membrane Guard does **not** restrict you to Gemini models. You can override and route to arbitrary providers (e.g., `ollama/llama3`, `local/Llama-3-8B`) seamlessly. 
* **LiteLLM Key Resolution Protection:** Passing an explicit cloud `api_key` to offline or local backends causes LiteLLM resolution crashes. Membrane Guard automatically detects local/offline models and conditionally passes the `api_key` argument **only** for `gemini/` or `gemini-` models, guaranteeing zero-config offline runs.

### 5. Frictionless Polar.sh Developer Verification
Setting up a paid Polar.sh developer account is not required to contribute to or test the open-source codebase. Setting `MEMBRANE_LICENSE_KEY` to `"test_license_key"` (which automatically acts as the startup default if empty) bypasses the live Polar license gate, immediately authorizing all local capabilities for friction-free developer onboarding.

---

## ⚠️ Operational Safety & Swarm Guidelines

### 1. The 50-Chunk Limit & Ingestion Batcher
> [!WARNING]
> **Swarm Map-Reduce Size Boundary**
> The parallel map-reduce endpoint `/v1/swarm/map` enforces a strict threshold of **maximum 50 chunks** per request to prevent API rate-limiting or memory exhaustion.

For large datasets, use the following production-grade mathematical batching helper:

```python
def batch_chunks(data_list, batch_size=50):
    """
    Mathematically batches raw datasets for Membrane Guard Swarm ingestion.
    Ensures absolute compliance with the strict 50-chunk Swarm Map-Reduce boundary.
    """
    return [data_list[i:i + batch_size] for i in range(0, len(data_list), batch_size)]
```

### 2. Zero-Latency Threat Firewall Guide
Membrane features a parallel threat firewall that scans prompt intent concurrently in ~150ms using a fast Canary model.
> [!CAUTION]
> **Jailbreak Word Warning**
> To avoid false positive blocks by the Semantic Bouncer, **avoid using overly aggressive jailbreak or threat-monitoring terms in your own system instructions.** The firewall is highly sensitive to hostile prompt framing; descriptive security guidelines are preferred over adversarial threat lists.

### 3. Chaining Best-Practice Warning
When building complex multi-agent orchestrations, always ensure that your pipelines programmatically check for downstream status before handing off payloads:

```
                  ┌───────────────────────────────┐
                  │       Raw Data Source         │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Membrane Swarm Map-Reduce   │
                  │       (/v1/swarm/map)         │
                  └───────────────┬───────────────┘
                                  │
                   (Did it throw HTTP 400/500?)
                   ├── YES ──► [ Stop Handoff & Alert ]
                   └── NO  ──► [ Safely Extract JSON ]
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │     Downstream Synthesis      │
                  │   (Evaluation LLM / Agent)    │
                  └───────────────────────────────┘
```

> [!IMPORTANT]
> **Verify Handoff Payloads**
> Always programmatically validate that the map-reduce payload is not empty or malformed before passing it to subsequent synthesis models to prevent cascading failures. Catch HTTP exceptions at the gateway level rather than propagating empty or corrupted JSON to downstream reasoning loops. 