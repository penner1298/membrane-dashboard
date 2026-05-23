# Membrane 2-Page Stack and Server Optimizations Blueprint

This blueprint documents the design, implementation, and methodology for consolidating the frontend routes of the Membrane platform into a streamlined 2-Page Stack, performing target backend cleanups, and executing key FastAPI server optimizations in Sprint 5-22.

---

## 🎨 1. Consolidation into a 2-Page Stack & Route Cleanup

### The Problem
The legacy frontend structure had split components across multiple disconnected pages: `/admin-console`, `/cookbook`, `/dashboard` (plus subpages like `/dashboard/chronicle`), and `/govtech-demo`. This fragmented design:
- Multiplied compilation times and route-matching complexity.
- Divided states (such as trial logs, DLQ outputs, and metrics keys) across multiple layouts.
- Led to duplicate rendering libraries, conflicting headers, and inconsistent styling behaviors.

### The Methodology & Implementation
To resolve this fragmentation, the application was refactored into a high-density **2-Page Stack**:
1. **The Public Gateway (`/`)**: Located in `src/app/page.tsx`, this route functions as the single public portal. It houses product positioning, structural descriptions, and an interactive **90-Second Instant Online Trial** terminal which sends code/query chunks directly to the `/v1/swarm/map` proxy without requiring signup or API keys.
2. **The Developer & DevOps Console (`/console`)**: Consolidated in `src/app/console/page.tsx` and `console-client.tsx`, this administrative console contains:
   - **Metrics Ledger**: Retail cost tracking, wholesale COGS metrics, calculated margins, and total proxy request counts.
   - **Traffic Ledger**: Live HTTP log monitoring detailing active endpoints, tokens consumed, and actual transaction costs.
   - **Dead Letter Queue (DLQ) Auditor**: A failure inspection pane letting developers debug compiler warnings, exception stack traces, and malformed inputs directly in the browser.
   - **API Key Manager**: A key generation panel linked to dynamic database key rotation endpoints.

### Legacy Cleanup & File Deletions
All legacy directories and matching components under `src/app` were recursively pruned:
- Deleted `/admin-console/` (replaced by `/console`).
- Deleted `/dashboard/` and its subdirectories (replaced by `/console`).
- Deleted `/cookbook/` (consolidated into landing page SDK examples).
- Deleted `/govtech-demo/` (removed legacy product demos).
- Removed redundant routing layers like `/src/middleware.ts` and Next.js eslint-ignore build bypass configurations (`next.config.ts`).

---

## 🔒 2. Production CORS Hardening

### The Problem
During development, the FastAPI server relied on open headers (`allow_origins=["*"]`). While convenient for local development, allowing arbitrary origins in production exposes protected proxy nodes to cross-origin request forgery (CSRF) and unauthorized browser scripts.

### The Methodology & Implementation
Restricted allowed CORS origins in `server.py` to production domains and local workspace environments:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://membrane-api.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🚀 3. Virtual-to-Physical Model Mapping & Robust Param Parsing

### The Problem
The client-side console and external client integrations request completions via a standard virtual model string (`"membrane-engagement-layer"`). The backend server must resolve this virtual string to actual, active AI model endpoints (e.g., Gemini-2.5-Flash, Canary/Apex models) based on environmental config overrides. Additionally, arbitrary parameter configurations (such as `max_tokens` or `top_p`) passed from various client SDKs could cause Pydantic model validation failures if they are not explicitly declared.

### The Methodology & Implementation
1. **Model Redirection Logic**: Created a translation block that maps `"membrane-engagement-layer"` to physical model strings (checking `MEMBRANE_FLASH_MODEL` -> `FLASH_MODEL` -> `CANARY_MODEL` in sequence, defaulting to `"gemini/gemini-2.5-flash"`).
2. **Flexible Pydantic Modeling**: Added `model_config = {"extra": "allow"}` to the request definitions to prevent crashes on auxiliary client parameters.
3. **Parameter Mapping**: Extracted key OpenAI parameters dynamically (e.g., `temperature`, `max_tokens`, `top_p`) and mapped them directly to underlying LiteLLM runtime configurations.

```python
# Model translation block inside endpoint handlers
if request.model == "membrane-engagement-layer":
    request.model = os.getenv("MEMBRANE_FLASH_MODEL") or os.getenv("FLASH_MODEL") or os.environ.get("CANARY_MODEL") or "gemini/gemini-2.5-flash"

# Parameter injection inside chat_endpoint
litellm_kwargs = {}
if temp is not None:
    litellm_kwargs["temperature"] = temp
if request.max_tokens is not None:
    litellm_kwargs["max_tokens"] = request.max_tokens
if request.top_p is not None:
    litellm_kwargs["top_p"] = request.top_p
```

---

## 🚧 4. IP-Based Rate Limiting for Public Trials

### The Problem
Offering public sandbox execution endpoints (such as `/v1/swarm/map` and `/v1/chat/completions`) without authorization headers opens the gateway to computational and financial abuse. High-volume scrapers could flood parallel map-reduce jobs, driving up upstream token usage.

### The Methodology & Implementation
1. **Production Clamp**: Implemented `enforce_public_throttle(request: Request)` which is invoked before executing swarm map-reduce jobs or completions.
2. **Client IP Tracking**: Tracks requests per minute using an in-memory sliding window map keyed by the client's host IP (`request.client.host`).
3. **Unrestricted Local Fallback**: The rate limiter is bypassed during local development (when `ENVIRONMENT != "production"`), allowing unlimited trial runs.
4. **Clean Windows**: Automatically cleans the historical timestamp array for an IP to keep memory overhead to a minimum.

```python
PUBLIC_IP_TRACKER = {}

def enforce_public_throttle(request: Request):
    if os.getenv("ENVIRONMENT") == "production":
        client_ip = request.client.host
        current_time = time.time()
        
        # Prune old logs outside the 60-second window
        PUBLIC_IP_TRACKER[client_ip] = [
            t for t in PUBLIC_IP_TRACKER.get(client_ip, []) 
            if current_time - t < 60
        ]
        
        if len(PUBLIC_IP_TRACKER[client_ip]) >= 15:
            raise HTTPException(
                status_code=429, 
                detail="Public Trial Rate Limit Exceeded. Deploy the local container to run unrestricted swarms."
            )
            
        PUBLIC_IP_TRACKER[client_ip].append(current_time)
```

---

## 🤖 5. Plaintext LLM Auto-Discovery (`/llms.txt`)

### The Problem
Autonomous agents and AI-assisted scrapers need to programmatically inspect codebase layouts, API proxy endpoints, and headers without crawling heavy HTML pages.

### The Methodology & Implementation
Exposed a lightweight, plaintext auto-discovery handler returning standard `.txt` formatting containing endpoint URLs, default model signatures, and custom headers.

```python
@app.get("/llms.txt")
async def get_local_llms_txt():
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(
        "# Membrane Guard Protocol\n\n"
        "- Live Cloud URL: https://membrane-api.com/v1\n"
        "- Local Proxy URL: http://localhost:8000/v1\n"
        "- Default Model String: membrane-engagement-layer\n"
        "- Custom Context Purge Header: X-Membrane-Preserve-Context\n"
    )
```

---

## 📡 6. OpenAI-Compatible Chat Streaming & Custom Context Pruning

### The Problem
Client SDKs and dev interfaces require chunk-by-chunk token streaming (`stream: true`) to minimize Time-to-First-Token (TTFT) and improve UI feedback. Furthermore, deep back-and-forth conversational threads accumulate massive context history, leading to slow response times and inflated costs.

### The Methodology & Implementation
1. **Server-Sent Events (SSE)**: Added a custom generator `stream_openai_response` that splits the raw text completion by whitespace/tokens and yields SSE chunks to client connections in a standard OpenAI format.
2. **Header-Controlled Context Pruning**: Intercepts requests for the custom header `X-Membrane-Preserve-Context`.
   - If `X-Membrane-Preserve-Context` is missing or is not `true`, the middleware strips intermediate conversational loops when messages size exceeds 2, preserving only the primary system prompt and the latest user request.
   - If the header is explicitly set to `true`, the conversational context is preserved.
3. **Telemetry Status**: Attributes either `"PURGED_BY_DESIGN"` or `"PRESERVED"` to metadata return outputs.

```python
@app.post("/v1/chat/completions")
async def openai_compatible_endpoint(request: Request, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
    enforce_public_throttle(request)
    body = await request.json()
    messages = body.get("messages", [])
    stream = body.get("stream", False)
    
    preserve_context = request.headers.get("X-Membrane-Preserve-Context", "").lower() == "true"
    context_purged = False

    if not preserve_context and len(messages) > 2:
        # Prune intermediate messages, retaining system (index 0) and current user (last index)
        system_msg = next((m for m in messages if m.get("role") == "system"), None)
        last_user = next((m for m in reversed(messages) if m.get("role") == "user"), None)
        
        new_messages = []
        if system_msg:
            new_messages.append(system_msg)
        if last_user:
            new_messages.append(last_user)
            
        messages = new_messages
        context_purged = True
```

---

## 🧬 7. Unique Constraint Tenant Resolution during Onboarding

### The Problem
During automated local key rotations, concurrent transactions trying to insert or register a new rotated key (or handling duplicate mocked key hashes) could cause unique constraint violations on `api_key_hash` or `tenant_id` indexes inside the PostgreSQL `tenants` table.

### The Methodology & Implementation
Hardened the verification step in `server.py` to use a double-nested retry conflict loop to resolve index collisions. If the first insert triggers a duplicate key hash, the query updates `tenant_id`. If it triggers a duplicate `tenant_id` unique violation, the catch block intercepts it using a secondary `ON CONFLICT (tenant_id)` query:

```python
try:
    new_ref_code = f"REF-{hashlib.md5(hashed_key.encode()).hexdigest()[:6].upper()}"
    await conn.execute(
        "INSERT INTO tenants (api_key_hash, balance, tenant_id, referral_code, has_paid) VALUES ($1, 1000.0000, $2, $3, TRUE) ON CONFLICT (api_key_hash) DO UPDATE SET tenant_id = EXCLUDED.tenant_id",
        hashed_key, dynamic_tenant_id, new_ref_code
    )
except asyncpg.UniqueViolationError:
    try:
        await conn.execute(
            "INSERT INTO tenants (api_key_hash, balance, tenant_id, referral_code, has_paid) VALUES ($1, 1000.0000, $2, $3, TRUE) ON CONFLICT (tenant_id) DO UPDATE SET api_key_hash = EXCLUDED.api_key_hash",
            hashed_key, dynamic_tenant_id, new_ref_code
        )
    except Exception as ex_sub:
        print(f"⚠️ Nested unique validation conflict resolution failed: {ex_sub}")
```
