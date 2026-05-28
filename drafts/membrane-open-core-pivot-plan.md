# Membrane open-core pivot

This plan documents the transition of Membrane to an open-core proxy and parallel extraction engine with a simple flat-fee commercial model ($29/month flat fee for commercial production, free and unrestricted for local development).

We are removing all hardcoded barriers and API key requirements in favor of a permissive, zero-friction, honor-based model.

## Goals of the Pivot
- **Flat-Fee Open-Core Model**: Shift monetization from metered credits to a clean $29/month flat fee for commercial production use, keeping it free and unrestricted for local development.
- **Zero Hard Barriers**: Remove technical enforcement blocks (like chunk truncation or mandatory keys) to deliver a frictionless experience under an honor-based model.
- **Grounded Positioning**: Standardize tone across the codebase, UI, and documentation to focus on practical proxy and extraction capabilities instead of speculative protocol language.

## Long-term Direction
> [!NOTE]
> **Long-term Direction**: The current focus is on a practical proxy and parallel extraction engine. While this serves as a foundation for exploring reliable agent-to-agent coordination patterns over time, that remains a future exploration rather than the current product focus.

## Commercial Production Definition
> [!IMPORTANT]
> **Commercial Production** is defined as any deployment of Membrane on public cloud infrastructure (e.g., AWS, GCP, Azure, Render, Vercel, Fly.io) that powers an active application, API, or service outside of a developer's local machine (`localhost`) or private personal network. 

## Internal Notes on Honor-Based Conversion
- Under this purely permissive, honor-based model, technical barriers are removed. We anticipate low early conversion rates, as monetization relies on goodwill, compliance checks, and value perception (savings visualizers on the console) rather than code enforcement.
- We are prioritizing trust, adoption, and perceived value over aggressive monetization in the early phase. Low initial conversion is acceptable and expected.

## Proposed Changes

### Backend Proxy Server

#### [MODIFY] [server.py](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/server.py)
- Make `verify_access` use `HTTPBearer(auto_error=False)` so that the `Authorization` header is optional. If missing or malformed, default to `local_dev_key`. Remove all format/rejection errors.
- Update `/v1/swarm/map` to process all chunks in full without truncation. Return a non-blocking compliance warning if running without a verified license key:
  `warning_msg = "This instance appears to be running in a production environment without a commercial license. Membrane is free for local development. A $29/month commercial license is required for production use."`
- Update `/llms.txt` endpoint to return a clean, grounded description matching the new positioning.
- Update references to the Docker image from `thejoshuapenner/membrane-guard` to `membraneapi/gateway`.

---

### Dashboard Web Application

#### [MODIFY] [page.tsx](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/membrane-dashboard/src/app/page.tsx)
- Rewrite Hero copy and section content to align with `homepage-draft.md`.
- Explain that API keys are completely optional / any custom string works.
- Update Docker commands from `thejoshuapenner/membrane-guard` to `membraneapi/gateway`.
- Remove the "Segment Safety Guardrail (QA-24)" warning/blocking UI element.
- Add a new "Pricing & Philosophy" responsive section with a clear definition of Commercial Production.

#### [MODIFY] [page.tsx](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/membrane-dashboard/src/app/docs/page.tsx)
- Update documentation copy:
  - Remove all metered-credit and protocol hype language.
  - Clarify that the API key is completely optional.
  - Explain the licensing model (production deployments are on an honor-based model, $29/mo flat).

#### [MODIFY] [page.tsx](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/membrane-dashboard/src/app/console/page.tsx)
- Retrieve `total_savings` and `total_chunks` instead of retail and wholesale costs.
- Compute the client license status based on the presence of `process.env.MEMBRANE_LICENSE_KEY`.
- Pass stats down to `ConsoleClient`.

#### [MODIFY] [console-client.tsx](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/membrane-dashboard/src/app/console/console-client.tsx)
- Redesign metrics to show:
  - **License Status**: Developer Sandbox (Free) vs. Commercial Production (Paid).
  - **Estimated Savings (30d)**: Dynamic caching savings.
  - **Total Swarm Chunks (30d)**: Total processed document chunks.
  - **Total Proxy Requests**: Transaction counter.
- Remove referral/redeem code inputs and replace with a simplified license settings view.

#### [MODIFY] [llms.txt](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/membrane-dashboard/public/llms.txt)
- Rewrite to align with the new grounded proxy and extraction positioning (remove "Cognitive Telemetry", "Hive Mind", "WAF Firewall").

#### [MODIFY] [openapi.json](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/membrane-dashboard/public/openapi.json)
- Update API description to align with new positioning (remove "zero-shot isolation protocol").

---

### Project Documentation

#### [MODIFY] [README.md](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/README.md)
- Replace the README with the `drafts/README-draft.md` content.

#### [MODIFY] [MEMBRANE_SWARM_PROTOCOL.md](file:///Users/thejoshuapenner/My%20Drive/Penner%20Strategy/membrane-dashboard/MEMBRANE_SWARM_PROTOCOL.md)
- Audit and clean tone. Ensure it describes technical ingestion rules (avoiding manual truncation) without reference to the old lossless inter-agent protocol vision.

#### [AUDIT/ARCHIVE] Previous Long-Form Vision Document (e.g. membrane_vision.md style documents if any exist)
- Audit and rewrite (or archive) the previous long-form vision document to align with current grounded positioning.

---

## Verification Plan

### Automated Tests
- Build Next.js application to check for TypeScript type safety:
  ```bash
  cd membrane-dashboard && npm run build
  ```
- Run the FastAPI local server and check endpoints:
  ```bash
  python3 server.py
  ```

### Manual Verification
- **Optional Auth Behavior**: Send requests to `/v1/chat/completions` and `/v1/swarm/map` with:
  1. No `Authorization` header.
  2. Malformed `Authorization` header (e.g., random text).
  3. A valid key.
  Verify that all three requests execute successfully and return status `200` without `401` or `403` auth errors.
- **Unlicensed Swarm Processing**: Test `/v1/swarm/map` with a dummy key and a payload of > 25 chunks. Verify that all chunks are processed in full (no truncation) and that the response contains the new friendly warning message.
- **Dashboard License Status**: 
  1. Run the application locally and check that the console page displays "Developer Sandbox" (Free).
  2. Set `MEMBRANE_LICENSE_KEY` env variable and check that the console displays "Commercial Production" (Paid).
- **Hype Audit & Consistency Spot-Check**: Verify that the homepage (`/`), documentation page (`/docs`), console page (`/console`), and metadata endpoints (`/llms.txt`, `/openapi.json`) are audited, no longer mention "Lossless Inter-Agent Protocol," "WAF," or "zero-shot isolation," and consistently use the term "honor-based model" (avoiding variations like "honor/compliance system").
- **Pricing/License Copy Check**: Verify that the homepage and docs page clearly communicate the $29/month commercial production model and the free local use policy.
