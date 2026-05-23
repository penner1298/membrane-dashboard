# Membrane Sandbox Security & JIT Onboarding Blueprint

This blueprint documents the technical methodology, configurations, and implementation details for backend security patches, sandbox limit controls, and Just-In-Time (JIT) onboarding protocols established in Sprint 5-22 (2).

---

## 🛠️ 1. Pydantic Collision & Schema Validation Hardening

### The Problem
When client-side SDKs or downstream agents communicate with the Membrane API, they may append extra parameters or metadata fields to the request payloads. In strict Pydantic V2 configurations, receiving undocumented fields causes structural validation errors (HTTP 422), breaking backwards compatibility and crashing runtime executions. Additionally, sandbox bounds need to be reflected in response schemas without disrupting payload structures.

### The Methodology & Implementation
To harden the schema interfaces against field name collisions and dynamic client overrides:
1. **Allow Extra Fields Safely:** Bind `model_config = {"extra": "allow"}` directly onto request models. This permits client SDKs to pass auxiliary fields (e.g. tracking IDs, custom prompts) without throwing validation errors.
2. **Metadata Sandboxing:** Update response schemas with explicit truncation flags (`is_truncated: bool`) and explanation messages (`warning_msg: Optional[str]`) to let client applications know if sandbox caps were enforced.

```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SwarmMapRequest(BaseModel):
    model: str = "membrane-engagement-layer"
    system_prompt: Optional[str] = None
    chunks: List[str]
    max_concurrency: int = 20
    temperature: float = 0.0
    extraction_criteria: Optional[Dict[str, Any]] = None

    # Resolve extra field collisions from various client SDK versions
    model_config = {"extra": "allow"}

class SwarmMapResponse(BaseModel):
    object: str = "swarm.extraction_matrix"
    model: str = "membrane-engagement-layer"
    task_id: str
    is_truncated: bool = False
    warning_msg: Optional[str] = None
    extractions: List[ExtractionEntry]
    membrane_metadata: SwarmMapMetadata
```

---

## 🔌 2. Postgres SSL Connection Setup & Environmental Controls

### The Problem
Deploying applications across diverse environments (local Docker containers vs. cloud-managed PostgreSQL like Render) requires flexible database SSL enforcement. Hardcoding SSL properties leads to local boot failures (due to lack of SSL certificates) or production handshake security vulnerabilities.

### The Methodology & Implementation
1. **Dynamic Boolean Resolution:** Read database SSL configurations from environment variables (e.g., `DATABASE_SSL`, defaulting to `"false"`), parse the string lower-case representations dynamically, and resolve them to a strict boolean.
2. **Conditional Pool Binding:** Configure connection pool initializers (e.g. `asyncpg.create_pool`) to load the boolean flag dynamically.
3. **Connection String SSL Mode:** For standalone scripts and migration routines, append `?sslmode=require` query parameters to DB connection strings when interacting with secure cloud-hosted databases.

```python
import os
import asyncpg

async def lifespan(app):
    db_url = os.environ.get("DATABASE_URL")
    
    # Read, parse, and resolve the SSL parameter dynamically
    db_ssl_str = os.environ.get("DATABASE_SSL", "false")
    db_ssl = db_ssl_str.lower() == "true"
    
    print(f"🔌 Connecting to PostgreSQL (SSL={db_ssl})...")
    try:
        db_pool = await asyncpg.create_pool(db_url, ssl=db_ssl)
    except Exception as e:
        print(f"🚨 Connection failed: {e}")
```

---

## 🪙 3. Upstream Cost Leakage Resolution & Exception Cost Logging

### The Problem
During concurrent processing or parallel multi-chunk map operations, individual chunks might execute successfully at the upstream LLM provider level but fail during downstream operations (e.g. invalid JSON parsing, compile failures, schema mismatch). If exceptions abort the call chain immediately without capturing upstream token usage, the operator bears 100% of the token costs while charging the tenant $0.00, resulting in financial drainage.

### The Methodology & Implementation
1. **Exception-Aware Token Capture:** Wrap upstream LLM invocations in try-except blocks. Prior to raising or logging the error, inspect if the `response` object was partially or fully populated. If so, extract `response.usage` (prompt and completion tokens).
2. **Workload Attribution:** Map the consumed tokens and calculate their retail cost via a specialized value-based ledger helper (`calculate_token_savings`).
3. **Error Billing Profiles:** Attribue these failed-run token charges under a dedicated `"swarm_map_error"` workload profile in the batch billing logger. This ensures the tenant is billed for the exact tokens consumed by their request before it failed, isolating operator costs.

```python
# Inside parallel chunk processing loop
response = None
try:
    response = await acompletion(
        model=mapped_model,
        messages=messages,
        response_format={"type": "json_object"}
    )
    # Process output...
except Exception as e:
    tokens = 0
    actual_cost = 0.0
    
    # Capture usage from response if populated before downstream failure
    if response is not None and getattr(response, "usage", None) is not None:
        try:
            in_tok = response.usage.prompt_tokens
            out_tok = response.usage.completion_tokens
            tokens = in_tok + out_tok
            savings_data = calculate_token_savings(mapped_model, tokens, in_tok)
            actual_cost = savings_data["actual_cost_incurred"]
        except Exception as ex_calc:
            print(f"⚠️ Billing capture failed: {ex_calc}")
            
    return {
        "index": chunk_index,
        "error": str(e),
        "tokens": tokens,
        "actual_cost": actual_cost
    }

# Inside compiler routine
for r in results:
    if r["error"]:
        if r["tokens"] > 0:
            billing_logs.append({
                "endpoint": "/v1/swarm/map",
                "tokens": r["tokens"],
                "retail_cost": r["actual_cost"],
                "workload_profile": "swarm_map_error"  # Charged under error profile
            })
```

---

## 🚧 4. Workspace Path Isolation & Traversal Guards

### The Problem
Endpoints that execute file operations or save state (like `/v1/swarm/state`) accept destination path inputs. If developers join these parameters naively using `os.path.join()`, attackers can perform path traversal attacks using relative escape sequences (e.g. `../../etc/passwd`) or absolute paths, overriding system files outside the intended sandbox.

### The Methodology & Implementation
To prevent directory escape vulnerabilities:
1. **Clean Input Paths:** Strip leading slashes and run path normalization using `os.path.normpath(input_path).lstrip("/")`.
2. **Compute Canonical Paths:** Combine the workspace path and clean relative path using `os.path.abspath(os.path.join(workspace_dir, cleaned_path))`.
3. **Verify Common Path Ancestry:** Ensure the computed path remains strictly within the canonical bounds of the workspace directory using `os.path.commonpath`.

```python
import os
from fastapi import HTTPException

def get_safe_destination(destination_path: str, workspace_dir: str) -> str:
    # 1. Resolve and normalize workspace boundary
    workspace_dir = os.path.abspath(workspace_dir)
    
    # 2. Normalize and clean destination path parameter
    cleaned_rel_path = os.path.normpath(destination_path).lstrip("/")
    dest_path = os.path.abspath(os.path.join(workspace_dir, cleaned_rel_path))
    
    # 3. Guard against directory escape
    if os.path.commonpath([workspace_dir, dest_path]) != workspace_dir:
        raise HTTPException(status_code=400, detail="Path traversal attempt detected.")
        
    return dest_path
```

---

## 🎚️ 5. Client-Side Density Sandbox Slider Clamps

### The Problem
If user interface inputs allow configuring chunk slices or workloads at levels that exceed backend limits, users will trigger unhandled thread crashes or threshold limit violations.

### The Methodology & Implementation
1. **Clamp at Origin:** Apply client-side logic inside event and chunk division handlers to enforce limits *before* requests hit the network.
2. **Interactive Warning States:** If generated slices exceed the sandbox threshold (e.g. `MAX_SWARM_CEILING_CHUNKS = 50`), disable submission controls (`setSubmitDisabled(true)`) and display an amber warning banner instructing the developer how to optimize chunks or configure a license key to unlock higher capacities.

```typescript
// React UI Division Handler Example
const handleDivideChunks = (text: string) => {
  const slices = chunkText(text, size);
  if (slices.length > 50) {
    setSubmitDisabled(true);
    setWarningMessage("Scale Throttle: Target exceeds the 50-chunk sandbox limit. Reduce density or add a License Key.");
  } else {
    setSubmitDisabled(false);
    setWarningMessage(null);
  }
};
```

---

## 📡 6. External License Platform Degradation Resilience (Polar.sh)

### The Problem
Integrating external platforms (e.g. Polar.sh) for license checking introduces a single-point-of-failure risk. If the licensing server suffers a DNS outage or HTTP 5xx error, the entire application interface might fail-closed, blocking legitimate runs.

### The Methodology & Implementation
1. **Fail-Open Catchers:** Wrap license server check calls inside exception blocks.
2. **Degradation Detection:** If verification calls fail due to network timeouts, DNS errors, or platform 5xx statuses, catch the exception, print an administrative warning, and "fail open" to permit local operation while flagging the outage for async re-verification.

```python
async def validate_polar_license(key: str) -> bool:
    try:
        response = await client.get(f"https://api.polar.sh/v1/licenses/{key}")
        return response.status_code == 200
    except (httpx.HTTPStatusError, httpx.NetworkError) as e:
        # Detect platform degradation and fail open safely
        print(f"⚠️ Polar.sh license provider offline: {e}. Failing open for local operations...")
        return True
```

---

## 🔑 7. Frictionless JIT Onboarding & Auto-Provisioning

### The Problem
Requiring developers to configure complex licenses and database records before running a local development environment increases initial setup friction and delays onboarding.

### The Methodology & Implementation
1. **Conditional Fallback Verification:** If no external license is configured, run in "Sandbox Mode".
2. **Local Auto-Provisioning Balance:** Automatically authorize any mock bearer token key on localhost and provision it with a temporary testing balance (e.g. $1,000) inside the database. This allows immediate playground testing with zero initial external configurations.

```python
async def verify_access(api_key: str):
    # Auto-provision temporary tenant balance for local developer onboarding
    tenant = await db.get_tenant_by_key(api_key)
    if not tenant:
        await db.create_tenant(
            api_key=api_key,
            initial_balance=1000.00,
            profile="local_dev"
        )
    return hash_api_key(api_key)
```

---

## 🏷️ 8. Canary Hashing Protection (Plagiarism Watermark)

### The Methodology
Apply prime-modulo deterministic hash watermark signatures to compilation signatures (using modulo-7919 math) inside sandbox compilers to ensure output integrity.

```python
def make_canary_signature(payload_str: str, prefix: str) -> str:
    payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
    payload_int = int(payload_hash, 16)
    watermark = payload_int % 7919
    return f"{prefix}_{watermark}_{payload_hash[:16]}"
```
