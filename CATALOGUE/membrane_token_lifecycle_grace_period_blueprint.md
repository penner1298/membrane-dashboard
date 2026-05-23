# Membrane Token Lifecycle & Asynchronous Key Rotation Grace Period Blueprint

This blueprint describes the architectural methodology for unifying client token storage state and implementing non-blocking, database-synchronized API key rotation grace periods.

## The Core Philosophy
A standard API key rotation instantly revokes active keys, causing in-flight request streams, scripts, and agent pipelines to crash mid-execution. To guarantee zero user-facing friction and maximum service availability, token rotation must utilize an asynchronous sliding grace period while synchronizing credentials across multiple page layouts instantly.

---

## 1. Unified React Context Lifecycle (`ApiKeyContext`)
Playground components, consoles, and documentation test benches must not operate in state isolation or rely on raw, ad-hoc `localStorage` queries.
- **Context Wrapper:** Encapsulate the application layout with an `ApiKeyProvider`.
- **Automatic Sync:** Load saved tokens from client storage on mount. Compute SHA-256 tenant IDs using Web Crypto APIs to ensure client-side security without Node crypto dependencies.
- **State Synchronization:** Expose a unified hook (`useApiKey()`) to bind playgrounds and inputs. Modifying the key in one component instantly propagates changes across the entire web application tree.

---

## 2. Asynchronous React Modal Rotation Guard
Native browser dialog blocks (`window.confirm()`) freeze the JavaScript runtime execution thread. This breaks headless automation scripts (causing timeout failures) and degrades user experience.
- **Glassmorphic Dialog:** Build a custom React dialog component that overlays the UI using absolute positioning and backdrop-filter styling (`backdrop-blur-md`).
- **Asynchronous Execution:** Bind confirmation callbacks to state changes rather than blocking execution loops. This ensures end-to-end integration test runners can execute seamlessly.

---

## 3. Database-Backed 5-Minute Grace Period
When a key is rotated:
1. **Deprecation Cache:** Write the old key's hash, tenant ID, and current balance to a `deprecated_keys` table.
2. **Grace Middleware:** The Python gateway middleware (`verify_access`) queries `deprecated_keys` when a key is not found in the primary `tenants` table.
3. **Bounded Validity:** Permitted requests authenticated with deprecated keys pass with a warning, charging balance deductions against the `deprecated_keys` cache.
4. **Time-Based Expiry:** Bounded at 300 seconds (5 minutes). After 5 minutes, deprecated keys are treated as expired and raise an HTTP 401 exception.
5. **TTL Pruning:** Run background garbage collection queries at gateway startup to drop expired keys, keeping database row storage clean.
