# Membrane Swarm Guard Repository Standardization & Consolidation Blueprint

This blueprint documents the design decisions, technical methodologies, and architectural changes implemented during the comprehensive audit, cleanup, and consolidation of the Membrane Swarm Guard repository (`/Users/thejoshuapenner/My Drive/Penner Strategy/membrane-dashboard`) in Sprint 5-22.

---

## 🎨 1. Route Consolidation & The 2-Page Stack Transition

### The Problem
The legacy Next.js frontend code was fragmented across several disconnected pages: `/admin-console`, `/cookbook`, `/dashboard` (along with sub-routes like `/dashboard/chronicle`), and `/govtech-demo`. This fragmentation:
- Increased compilation, build, and route-matching complexity.
- Divided administrative controls and telemetry across multiple inconsistent pages.
- Resulted in duplicate UI modules, conflicting headers, and inconsistent styling.
- Intercepted routes unnecessarily via local Next.js middleware, blocking simplified API flows.

### The Methodology & Implementation
1. **Public Gateway (`/`)**: Consolidated the primary user-facing landing page in `src/app/page.tsx`. Added visual proof sections, product positioning, and an interactive **90-Second Instant Online Trial** playground enabling users to run map-reduce trials directly through `/v1/swarm/map` proxy endpoints without upfront key registrations.
2. **Developer & DevOps Console (`/console`)**: Standardized in `src/app/console/page.tsx` and `console-client.tsx` to act as the single control center. Unified the following sub-components:
   - **Metrics Ledger**: Real-time retail cost tracking, wholesale COGS metrics, calculated margins, and total saved costs.
   - **Traffic Ledger**: Live telemetry tables displaying active API logs, method calls, endpoint metrics, token counts, and transaction cost logs.
   - **DLQ Auditor (Dead Letter Queue)**: Failure debugger panel showing compile errors, JSON validation exceptions, and inbound prompts.
   - **API Key Manager**: Provisioning, balance review, and key rotation features.
3. **Legacy Code Cleanup**:
   - Recursively deleted legacy directories under `src/app`: `/admin-console`, `/cookbook`, `/dashboard`, and `/govtech-demo`.
   - Removed unused component files (e.g., `final-cta-section.tsx`, `problem-section.tsx`, `visual-proof-section.tsx`).
   - Disabled Next.js routing interceptions by renaming the middleware file from `/src/middleware.ts` to `/src/middleware.ts.disabled`.

---

## 🔒 2. Production CORS Hardening

### The Problem
The development backend in `server.py` initially allowed all origins (`allow_origins=["*"]`). While convenient for local debugging, open wildcards in production expose the API sandbox to cross-origin resource access vulnerabilities and malicious cross-site scripting (XSS) from unauthorized browser locations.

### The Methodology & Implementation
Restricted allowed CORS origins to verified production URLs, Render deployment subdomains, and standard local development ports:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://membrane-api.com",
        "http://localhost:3000",
        "https://membrane-wh1g.onrender.com",
        "http://membrane-wh1g.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🚧 3. IP-Based Rate Limiting for Public Trials

### The Problem
Providing public execution sandboxes (like the `/v1/swarm/map` endpoint) without access tokens invites financial and system abuse. High-volume scrapers could flood parallel map-reduce jobs, driving up upstream token usage.

### The Methodology & Implementation
1. **Production-Specific Clamp**: Created a sliding-window rate limiter `enforce_public_throttle` which limits clients to a maximum of 15 API requests per minute.
2. **Client IP Tracking**: Tracks requests dynamically per client IP (`request.client.host`).
3. **Environment Bypass**: The rate limiter is automatically bypassed during local development (when `ENVIRONMENT != "production"`), allowing developers to test swarms unrestricted.
4. **Memory Optimization**: Cleans the historical timestamp array for an IP to minimize memory overhead.

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

## 🔒 4. Workspace Path Isolation & Traversal Protection

### The Problem
Endpoints that execute file operations or save state (like `/v1/swarm/state`) accept destination path inputs. If input paths are joined naively, attackers can perform path traversal attacks using relative escape sequences (e.g. `../../etc/passwd`), overriding system files outside the intended sandbox.

### The Methodology & Implementation
1. **Input Normalization**: Strips leading/trailing slashes and resolves the path to a normalized string via `os.path.normpath`.
2. **Canonical Path Resolution**: Joins the absolute path of the sandbox directory with the normalized relative input path and resolves the absolute result.
3. **Common Path Inspection**: Validates that the resolved absolute path starts strictly with the sandbox root path using `os.path.commonpath`.

```python
import os
from fastapi import HTTPException

def get_safe_destination(destination_path: str, workspace_dir: str) -> str:
    workspace_dir = os.path.abspath(workspace_dir)
    sandbox_dir = os.path.abspath(os.path.join(workspace_dir, "sandbox_scratch"))
    
    # Clean and strip any backslashes or multiple leading slashes
    cleaned_path = os.path.normpath(destination_path)
    while cleaned_path.startswith(("/", "\\")):
        cleaned_path = cleaned_path.lstrip("/\\")
    
    dest_path = os.path.abspath(os.path.join(sandbox_dir, cleaned_path))
    try:
        common = os.path.commonpath([sandbox_dir, dest_path])
    except ValueError:
        raise HTTPException(status_code=400, detail="Security Exception: Path traversal attempt detected.")
        
    if common != sandbox_dir:
        raise HTTPException(status_code=400, detail="Security Exception: Path traversal attempt detected.")
        
    return dest_path
```

---

## 🔌 5. Pydantic Collision & Schema Validation Hardening

### The Problem
Client-side SDKs and agent libraries frequently append extra metadata or parameters to request payloads. In strict Pydantic V2 configurations, receiving undocumented fields throws structural validation errors (HTTP 422), breaking backwards compatibility and crashing runtime executions.

### The Methodology & Implementation
Implemented safe extra-field validation on request schemas by binding `model_config = {"extra": "allow"}` directly onto request models. This enables the API layer to ignore auxiliary query metadata or parameters safely, preventing unwanted server crashes.

```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    model: Optional[str] = None
    response_format: Optional[Dict[str, Any]] = None
    use_global_cache: bool = False
    temperature: Optional[float] = 0.0
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    
    # Prevent validation errors when clients send auxiliary metadata
    model_config = {"extra": "allow"}
```

---

## 🔑 6. Key Rotation, Transaction Security & Self-Healing JIT Onboarding

### The Problem
When rotating API keys, the dashboard generates a new key hash and inserts a new tenant row in the PostgreSQL database. If old developer records remain in the table, the database becomes bloated with abandoned, unused keys. Furthermore, concurrent requests could trigger race conditions or unique constraint violations on the `tenant_id` unique column if they try to auto-provision with duplicate values.

### The Methodology & Implementation
1. **Transactional Operations**: Wrapped database key creation and reset queries in Next.js backend routes (`/api/keys/provision` and `/api/keys/reset`) within explicit database transactions (`BEGIN`/`COMMIT`) to ensure database consistency.
2. **Abandoned Key Purging**: Deleted older `local_dev_` records from the `tenants` table prior to registering the new key.
3. **Double-Nested Retry Catch (Conflict Resolution)**: In the Python backend (`server.py`), if the insertion triggers a duplicate hash error, the query updates `tenant_id`. If it triggers a duplicate `tenant_id` unique violation, the catch block intercepts it using a secondary `ON CONFLICT (tenant_id)` query to update the key hash.
4. **Self-Healing Playground Key Provisioning**: On local development, if a user accesses the backend without a pre-existing tenant database record, the backend dynamically auto-provisions a developer tenant with a `$1,000.00` mock balance to ensure frictionless JIT onboarding.

#### Next.js Rotator Route implementation:
```typescript
await pool.query("BEGIN");

// Delete older local dev keys to prevent abandoned rows
await pool.query(`
  DELETE FROM tenants 
  WHERE tenant_id LIKE 'local_dev_%' AND tenant_id != $1
`, [dynamicTenantId]);

// Insert new rotated key with unique conflict resolution fallback
await pool.query(`
  INSERT INTO tenants (tenant_id, api_key_hash, balance, total_saved, has_paid)
  VALUES ($1, $2, 1000.00, 0, TRUE)
  ON CONFLICT (api_key_hash) 
  DO UPDATE SET tenant_id = EXCLUDED.tenant_id
`, [dynamicTenantId, hashedKey]);

await pool.query("COMMIT");
```

#### FastAPI Self-Healing unique validation conflict resolver:
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

---

## 🪙 7. Upstream Cost Leakage Resolution & Exception-Aware Billing

### The Problem
During concurrent processing or parallel multi-chunk map operations, individual chunks might execute successfully at the upstream LLM provider level but fail during downstream operations (e.g. invalid JSON parsing, compile failures, schema mismatch). If exceptions abort the call chain immediately without capturing upstream token usage, the operator bears 100% of the token costs while charging the tenant $0.00, resulting in financial drainage.

### The Methodology & Implementation
1. **Exception-Aware Token Capture**: In the chat endpoints and parallel map-reduce loops, calls to upstream models are wrapped in exception catchers.
2. **Partial Response Parsing**: Prior to throwing the error, the code inspects whether the response object was populated. If so, it extracts the exact `prompt_tokens` and `completion_tokens` from `response.usage`.
3. **Attributed Error Billing**: Consumed tokens are mapped to their wholesale and retail costs and logged in `api_logs` under a dedicated `"swarm_map_error"` workload profile. This attributes the cost directly to the tenant's balance instead of causing silent leakage.

---

## 🤖 8. Plaintext LLM Auto-Discovery (`/llms.txt`)

### The Problem
Autonomous AI agents, scrapers, and tools need to parse the API capabilities and details of the codebase layout programmatically without executing JavaScript or parsing complex HTML structures.

### The Methodology & Implementation
Added a lightweight plaintext auto-discovery route at `/llms.txt`. The route serves standardized text specifying:
- Live endpoint details
- Default model names (`membrane-engagement-layer`)
- Custom headers required (`X-Membrane-Preserve-Context`)

```python
@app.get("/llms.txt")
async def get_llms_txt():
    from fastapi.responses import PlainTextResponse
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    llms_path = os.path.join(base_dir, "membrane-dashboard", "public", "llms.txt")
    if os.path.exists(llms_path):
        with open(llms_path, "r", encoding="utf-8") as f:
            return PlainTextResponse(f.read())
    
    # Fallback to local hardcoded specifications
    return PlainTextResponse(
        "# Membrane Guard Protocol\n\n"
        "- Live Cloud URL: https://membrane-api.com/v1\n"
        "- Local Proxy URL: http://localhost:8000/v1\n"
        "- Default Model String: membrane-engagement-layer\n"
        "- Custom Context Purge Header: X-Membrane-Preserve-Context\n"
    )
```
