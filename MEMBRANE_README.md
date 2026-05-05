# Membrane API: The Self-Correcting LLM Router

Membrane is a high-speed, agent-agnostic routing layer that sits between your application and frontier AI models. 

By dropping in our Base URL, you instantly cut your API costs by up to 99% via our Semantic Caching engine, while our proprietary execution loop guarantees your chatbots stay reliable and hallucination-free.

---

## ⚡️ Quick Start: The Standard API Drop-In

Membrane utilizes the industry-standard JSON chat schema (often referred to as the OpenAI format). Integration takes seconds—just point your existing code to our endpoint.

*   **Base URL:** `https://membrane-api.com/v1`
*   **Authentication:** `Authorization: Bearer [Your_Membrane_API_Key]`
*   **Model:** Leave blank, or pass any string. *(Membrane intercepts all requests and dynamically routes them through our internal infrastructure to guarantee performance and cost-efficiency. Requested model names are ignored.)*

**Example (Python):**

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://membrane-api.com/v1",
    api_key=os.environ.get("MEMBRANE_API_KEY"),
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Generate a Python script for programmatic SEO.",
        }
    ],
    model="membrane-engagement-layer",
)

# Access your real-time savings data injected by Membrane
metadata = chat_completion.model_dump().get("membrane_metadata", {})
print(f"Billed: ${metadata.get('billed_amount')} | Saved: {metadata.get('savings_percent')}%")
```

---

## 🛡️ Core Features: Why Membrane is Different

Membrane isn't just a dumb pipe or a basic cache. It is an active cognitive firewall for your application.

### 1. The Zero-Shot Isolation Protocol (Anti-Hallucination)
Most AI platforms suffer from "cascading hallucinations" where a model gets confused by a long, messy chat history. Membrane solves this by acting as a precise semantic filter: it strictly preserves your Agent DNA (system rules) while ruthlessly destroying Conversational Memory (history bloat). When you send a standard `messages` array through the `/v1` endpoint, Membrane extracts your `system` instructions, fuses them with the final `user` intent, and executes a clean, zero-shot generation. Your bots always wake up knowing exactly who they are and what rules to follow, but operate in a stateless vacuum to guarantee high-fidelity outputs.

### 2. Self-Correcting Execution
If an underlying model generates a refusal (e.g., "As an AI, I cannot..."), hallucinates a schema, or misses requested code blocks, Membrane intercepts the failure in milliseconds. Our heuristic engine learns from the failure and automatically escalates the request to a more capable reasoning model, ensuring your users never see a broken response. 

### 3. Dynamic Arbitrage Pricing
Membrane doesn't charge a flat subscription. We price dynamically based on computational load. 
*   If your request hits our cache, you pay fractions of a cent. 
*   If your request requires full frontier reasoning, our dynamic arbitrage engine ensures you **never pay more** than the standard wholesale cost of top-tier models. 
*   *You only ever access discounts.* Your savings are injected directly into every API response payload via the `membrane_metadata` object.

---

## 🧠 The Cache Engine: Privacy by Default

Membrane features a dual-tier semantic caching engine.

### L2 Silo Cache (Absolute Privacy - Default)
*   All requests routed through the standard `/v1/chat/completions` drop-in default to your private L2 Cache. 
*   If a user asks a question semantically similar to one *you* have asked before, Membrane retrieves it instantly. Your data never leaves your private namespace.

### L1 Global Cache (The Hive-Mind - Opt-In)
*   For massive savings, you can opt-in to the public L1 Global Cache. 
*   ⚠️ **SECURITY WARNING:** Never opt-in to the Global Cache when processing PII or proprietary code.
*   *Note: Opting into the Global Cache requires using the Native Membrane API.*

---

## 🛠️ Advanced: The Native Membrane API

If you need programmatic control over caching behavior or require strict JSON schema enforcement, use our Native API endpoint.

**Endpoint:**
`POST https://membrane-api.com/api/chat`

**Headers:**
`Authorization: Bearer [Your_Membrane_API_Key]`

**JSON Payload Schema:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `prompt` | string | **(Required)** The core instruction you want processed. |
| `use_global_cache` | boolean | **Defaults to `false`.** Set to `true` to access the subsidized L1 Global Cache. |
| `response_format` | JSON object| **(Optional)** Provide a strict JSON Schema to force structured data output. |

**Success Response (200 OK):**
```json
{
  "receipt_id": "md5_hash_string",
  "answer": "Silicon paths glow...",
  "status": "L1_GLOBAL_CACHE",
  "billed_amount": 0.0001,
  "savings_percent": 99.8
}
```