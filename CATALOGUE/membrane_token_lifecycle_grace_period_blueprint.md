# Membrane Token Lifecycle, Asynchronous Key Rotation Grace Period & Stateless Trial Fallback Blueprint

This blueprint describes the architectural methodology and engineering design for unifying client-side token synchronization, non-blocking asynchronous key rotation, database-synchronized sliding grace periods, and stateless trial key fallbacks in production environments.

---

## The Core Philosophy
A standard API key rotation instantly revokes active keys, causing in-flight request streams, scripts, and agent pipelines to crash mid-execution. To guarantee zero user-facing friction and maximum service availability, token rotation must utilize an asynchronous sliding grace period while synchronizing credentials across multiple page layouts instantly. 

Furthermore, in database-less serverless deployments (such as frontend sites running on Vercel), client-side onboarding elements generate trial API keys but cannot persist them to the backend database. To prevent persistent HTTP 401 Unauthorized errors in production playgrounds, the gateway must fall back to a stateless verification mechanism for public sandbox/trial credentials without exposing PostgreSQL instances to row-exhaustion Denial of Service (DoS) attacks.

---

## 🗺️ Architectural Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor Developer as Client Developer / AI Swarm
    participant Web as Next.js Dashboard (Vercel)
    participant Gateway as Python API Gateway (Render)
    database DB as PostgreSQL (pgvector)

    rect rgb(240, 248, 255)
    note right of Developer: 1. Asynchronous Rotation & Grace Period
    Developer->>Web: Request Key Rotation (Console UI)
    Web->>Web: Open Custom Skeuomorphic Modal (Non-Blocking)
    Web->>Web: Trigger POST /api/keys/reset
    Web->>DB: Write Old Key Hash + Tenant Balance to deprecated_keys
    Web->>DB: Delete Old Key Hash from tenants & Write New Key Hash
    Web-->>Developer: Return New API Key (Synced instantly via useApiKey)
    Developer->>Gateway: In-flight requests using deprecated key
    Gateway->>DB: Query tenants (Miss) -> Query deprecated_keys (Hit)
    alt Deprecated Key < 300s old
        Gateway-->>Developer: Allow Request + Inject Expiry Warning Header
    else Deprecated Key >= 300s old
        Gateway-->>Developer: Reject Request with HTTP 401 Unauthorized
    end
    end

    rect rgb(245, 255, 250)
    note right of Developer: 2. Stateless Production Sandbox Fallback
    Developer->>Web: Run Sandbox Query (Homepage / Docs Playground)
    Web->>Gateway: POST /v1/chat/completions (Bearer sk_live_...)
    Gateway->>DB: verify_access (Query tenants & deprecated_keys -> Miss)
    alt is_prod = True and Key starts with "sk_live_" or "sk_membrane_"
        Gateway-->>Developer: Allow stateless trial session (Bypass DB write)
    else is_prod = True and Key is arbitrary / unformatted
        Gateway-->>Developer: Block request immediately (Prevents DB row exhaustion DoS)
    end
    end
```

---

## 🛡️ 1. Unified React Context Lifecycle (`ApiKeyContext`)
Playground components, consoles, and documentation test benches must not operate in state isolation or rely on raw, ad-hoc `localStorage` queries.
* **Context Wrapper (`ApiKeyProvider`):** Encapsulates the entire application layout in `src/app/layout.tsx`. On mount, it initializes saved credentials from local storage and synchronizes them across all child views.
* **Client-Side SHA-256 Computation:** Computes tenant IDs locally using browser-safe Web Crypto APIs (`window.crypto.subtle.digest`), ensuring high-speed hashing without Node.js crypto package dependencies or bloated JS bundles.
* **Unified Hook (`useApiKey()`):** Exposes `apiKey`, `tenantId`, `refreshApiKey`, and `updateApiKey` states. Any update to the API key in the developer console instantly propagates across the homepage playground and docs test bench.

### Context Provider Implementation (`ApiKeyContext.tsx`)
```typescript
const computeTenantId = async (key: string): Promise<string> => {
  try {
    const msgBuffer = new TextEncoder().encode(key);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `local_dev_${hashHex.slice(0, 8)}`;
  } catch (err) {
    return "local_dev_active";
  }
};
```

---

## 🎨 2. Asynchronous React Modal Rotation Guard
Native browser blockages (`window.confirm()`) freeze the JavaScript runtime execution thread. This degrades user experience and breaks headless automated testing scripts (causing integration test suites to time out).
* **Tactile Glassmorphism UI:** Replaced the system popup with an embedded skeuomorphic custom React dialog styled with frosted glassmorphic overlay (`bg-white/90 backdrop-blur-md border border-slate-200/85 shadow-2xl`).
* **Asynchronous Callbacks:** Key rotation logic is bound to asynchronous state-driven callbacks (`confirmRotateKey()`) rather than blocking execution loops, allowing automated test runners to seamlessly proceed.

---

## 🗄️ 3. Database-Backed 5-Minute Grace Period
To ensure zero service downtime for production workflows mid-rotation, a sliding deprecation period is managed by both the Next.js API route and the Python gateway.

1. **Deprecation Table Structure:**
   ```sql
   CREATE TABLE IF NOT EXISTS deprecated_keys (
       api_key_hash VARCHAR(255) PRIMARY KEY,
       tenant_id VARCHAR(255),
       balance NUMERIC(10, 4) DEFAULT 0.0000,
       deprecated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. **Rotation Deprecation Pipeline (`/api/keys/reset`):**
   When key rotation is triggered, existing developer keys are selected, written to the `deprecated_keys` table with their current balance, and safely removed from the primary `tenants` table.
3. **Gateway Grace Verification Middleware (`server.py`):**
   If an incoming key hash is not found in the `tenants` table, `verify_access` queries `deprecated_keys`. If found and the `deprecated_at` timestamp is within exactly 300 seconds (5 minutes), the request proceeds. Balance deductions and transaction logs are applied to `deprecated_keys`.
4. **Expiry & Warning telemetry:**
   The gateway warns the developer of pending deprecation in console outputs and headers, calculating remaining seconds before final revocation.
5. **Gateway TTL Garbage Collection:**
   To prevent table bloat and protect row limits, expired deprecated keys are purged during gateway database initialization:
   ```sql
   DELETE FROM deprecated_keys WHERE deprecated_at < NOW() - INTERVAL '5 minutes';
   ```

---

## ⚡ 4. Stateless Trial Key Fallback in Production Environments
In production environments, the frontend portal (Vercel) operates database-less, causing it to provision client-side trial credentials starting with `sk_live_` or `sk_membrane_` that do not exist in the centralized PostgreSQL database. 

### The Security Dilemma
Auto-provisioning missing keys inside the database during verification solves 401 exceptions but opens a high-risk Denial of Service (DoS) vulnerability. Attackers sending requests with random strings as keys would trigger millions of dynamic database inserts, causing table row exhaustion and database crashes.

### The Solution: Stateless Verification Bypass
We implement a stateless production bypass inside `server.py`'s `verify_access`:
1. **Environment Auto-Detection:** Checks if the server is running on a production cloud runtime (`RENDER == "true"`, `ENVIRONMENT == "production"`, or `ENV == "production"`).
2. **Key Prefix Enforcement:** Ensures the incoming API key matches valid trial patterns (`sk_live_` or `sk_membrane_`). If the key does not start with these prefixes, it is blocked immediately without database insertion, mitigating database flood vulnerabilities.
3. **Stateless Sandbox Bypass:** If both conditions are met, the database lookup is bypassed, allowing the request to run with a stateless, simulated sandbox credit balance (e.g. $1,000.00), resolving client-side 401 errors.

### Implementation Snippet (`server.py`)
```python
async def verify_access(credentials: HTTPAuthorizationCredentials = Security(security)):
    api_key = credentials.credentials
    hashed_key = hash_api_key(api_key)

    if api_key == "sk_membrane_instant_trial":
        return hashed_key

    # Enforce key prefix check to prevent database flooding (DoS) from random keys
    if not api_key.startswith("sk_live_") and not api_key.startswith("sk_membrane_") and api_key != "local_dev_key":
        raise HTTPException(status_code=401, detail="Access Denied: Invalid API key format or prefix.")

    if not db_pool:
        print("⚠️ Database offline. Bypassing billing/auth check for local demo.")
        return hashed_key

    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT balance, tenant_id FROM tenants WHERE api_key_hash = $1", hashed_key)
        # (Deprecated Keys Check omitted for brevity...)

        if not tenant:
            is_prod = (
                os.environ.get("RENDER") == "true" or
                os.environ.get("ENVIRONMENT") == "production" or
                os.environ.get("ENV") == "production"
            )
            if is_prod:
                if api_key.startswith("sk_live_") or api_key.startswith("sk_membrane_"):
                    print(f"ℹ️ Stateless trial key session allowed in production: {api_key[:12]}...")
                    return hashed_key
                raise HTTPException(status_code=401, detail="Access Denied: Dynamic registration is restricted in production.")

            # Auto-provision local dev tenant (Non-prod environments only)
            # ...
```

---

## 🧪 5. Validation & Verification Methodology

### 1. Python Compilation Syntax Assurance
Verify that any updates to `server.py` compile clean on the host environment:
```bash
$ python3 -m py_compile server.py
# Must compile successfully with exit code 0
```

### 2. Functional Sandbox Verification
Validate that the stateless sandbox trial fallback works end-to-end, resolving user-facing 401 playground exceptions on the live gateway without writing to the database:

```bash
# Verify balance check bypass
$ curl -H "Authorization: Bearer sk_live_test_123" https://membrane-wh1g.onrender.com/api/user/balance
{"balance":1000.0}

# Verify completions request bypass
$ curl -X POST -H "Authorization: Bearer sk_live_test_123" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "model": "membrane-engagement-layer"}' \
  https://membrane-wh1g.onrender.com/api/chat
{"receipt_id":"95415980c0e367f43fae5f1b7ed317ff","answer":"Hello there! How can I help you today?","route_used":"Membrane-Engagement-Layer","status":"SURFACE_ENGAGEMENT","total_tokens":55,"billed_amount":8.5e-05}
```
All trial credentials generated on `https://membrane-api.com` now execute successfully, bypassing Render gateway DB restrictions while protecting the persistent database layer.
