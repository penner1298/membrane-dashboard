# Membrane Ingestion & Caching Gateway

Membrane is an **open-core multi-agent gateway proxy** designed for high-recall structured data extraction on large documents. It operates as a drop-in replacement for OpenAI SDK clients, providing Ast/TypeScript schema verification, concurrent parallel map-reduce processing, and local/global L1/L2 semantic caching to eliminate attention decay and surprise token charges on repeat requests.

This repository is the full Membrane monorepo, despite the historical `membrane-dashboard` repository/folder name. The product surface includes the Python gateway backend, the Next.js dashboard/docs app, tests, scripts, and technical documentation.

---

## 🚀 Key Features

*   **OpenAI SDK Drop-in Compatibility**: Redirect standard client requests by simply changing `base_url` to target Membrane's completions endpoint `/v1/chat/completions`.
*   **Parallel Swarm Ingestion (`/v1/swarm/map`)**: Splits large documents into isolated chunks, extracts target signals in parallel using cheap Flash models, and compiles/reduces them via a smart Pro model to eliminate redundancies.
*   **Adaptive Early Guardrails**:
    *   `early_gate`: Validates inbound payloads, boundaries, and schema invariants at code-AST level with zero model cost.
    *   `canary`: Runs a serialized sentinel probe over chunk 0, aborting execution immediately if schema checks fail (saving up to 90% in token costs).
*   **L1/L2 Semantic Caching**: Local/global persistent memory caches requests based on prompt similarity and schema matches, reducing repeat query costs to flat **$0.00** and latency to **~0.1s**.
*   **PII Sanitization & AST Compilers**: Automatically scrubs raw inputs, verifies agent-generated code structures in a secure sandbox, and signs verified signatures.

---

## Repository Layout

| Path | Purpose |
| :--- | :--- |
| `membrane/` | Python backend package: FastAPI app, routers, auth, licensing, caching, telemetry, and swarm execution. |
| `dashboard/` | Next.js dashboard, docs, marketing pages, and dashboard API proxy routes. |
| `tests/` | Python unit and regression tests for backend, cache, licensing, telemetry, and swarm behavior. |
| `scripts/` | Operational and experiment helpers, including Polar setup and swarm load simulation. |
| `docs/` | Maintainer-facing technical notes, experiment history, and repo documentation. |
| `sandbox_scratch/` | Local development cache files only. Do not commit generated contents. |

No public SDK packages are active in this repository right now. Until SDKs are formally published, use the OpenAI-compatible API examples below as the integration path.

---

## 🛠️ Quick Start

### 1. Backend Server (FastAPI)
The backend coordinates LLM routing, cache checking, rate throttling, and license key checks.

```bash
# Install dependencies
pip3 install -r requirements.txt

# Run the server on port 8000
python3 server.py
```

### 2. Dashboard App (Next.js)
The dashboard provides visual comparison controls, dev logs, traffic metrics, and API documentation.

```bash
cd dashboard

# Install client packages
npm install

# Start the dev server on port 3001
npm run dev
```

### 3. Pre-Push Checks

Run these before opening a pull request or pushing a production update:

```bash
python3 -m unittest discover -s tests -p 'test*.py'

cd dashboard
npm run lint -- --quiet
npx tsc --noEmit --incremental false
npm run build
```

---

## ⚙️ Configuration (Environment Variables)

Configure these in a root `.env` file for the backend server:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Upstream Google Gemini key for swarm/canary tasks. | Required for Gemini runs |
| `OPENAI_API_KEY` | Upstream OpenAI key for GPT runs. | Optional |
| `ANTHROPIC_API_KEY` | Upstream Anthropic key for Claude runs. | Optional |
| `MEMBRANE_LICENSE_KEY` | Polar.sh license key (use `test_license_key` for local developer sandbox). | `None` (Trial limits apply) |
| `DATABASE_URL` | PostgreSQL connection string for saving DLQ logs and ledger balances. | `None` (Sandbox memory fallback) |
| `MEMBRANE_BACKEND_URL`| Target API base for Next.js proxy routing. | `http://localhost:8000` |

---

## 🔑 Authorization & Sandboxing

During local testing, Membrane provides a **Developer Sandbox Mode**. You can pass any custom string (such as your own Gemini API key or `local_dev_key`) in the `Authorization` header.
- For Google Cloud keys, validation supports both standard `AIza` and `AIzaSy` prefixes.
- For OpenAI, validation supports standard `sk-` prefix.

---

## 📝 API Integration

### Python Example
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="local_dev_key"
)

response = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[
        {"role": "system", "content": "You are a professional auditor."},
        {"role": "user", "content": "Extract liabilities from document..."}
    ],
    # Pass header to preserve middle conversational context
    extra_headers={
        "X-Membrane-Preserve-Context": "true"
    }
)
print(response.choices[0].message.content)
```

---

## ⚖️ Open Core Licensing

*   **Developer Sandbox**: Free forever for local experimentation and development on `localhost`.
*   **Commercial Production**: Requires a paid subscription key ($29/mo or founding lifetime license) when deployed on public cloud instances (AWS, Render, GCP, Vercel, Fly.io) powering user-facing workloads.

---

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, pull request expectations, and the release checklist. Security-sensitive reports should follow [SECURITY.md](SECURITY.md), not public issues.
