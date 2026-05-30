import os
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Security, Query, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from membrane.database import verify_access
from membrane.licensing import license_state
from membrane.config import CANARY_MODEL, APEX_MODEL

import membrane.database

router = APIRouter()

class DLQLogResponseModel(BaseModel):
    timestamp: str
    inbound_prompt: str
    requested_schema: Optional[Dict[str, Any]]
    failed_output: str
    error_message: str

@router.get("/")
async def health_check():
    import membrane.app
    return {
        "status": "Membrane Swarm API is Live.",
        "db_connected": membrane.app.db_pool is not None
    }

@router.get("/llms.txt")
async def get_local_llms_txt():
    dashboard_llms = os.path.join("dashboard", "public", "llms.txt")
    if os.path.exists(dashboard_llms):
        try:
            with open(dashboard_llms, "r") as f:
                return PlainTextResponse(f.read())
        except Exception:
            pass
    if os.path.exists("public/llms.txt"):
        try:
            with open("public/llms.txt", "r") as f:
                return PlainTextResponse(f.read())
        except Exception:
            pass
    return PlainTextResponse(
        "# Membrane API Documentation for LLMs & AI Agents\n\n"
        "## What is Membrane?\n"
        "Membrane is an open-core proxy and swarm parallel ingestion engine. It acts as a drop-in proxy for LLM completions, providing L1/L2 semantic caching, AST/TypeScript verification, and parallel map-reduce swarm processing.\n\n"
        "## Integration & Base URL\n"
        "Membrane is compatible with the OpenAI API specification. To integrate, configure your OpenAI client or standard HTTP library to target the active local host:\n"
        "- Local Port Target: http://localhost:8000/v1 (FastAPI backend directly) or /v1 relative route proxied via the dashboard frontend.\n"
        "- API Key: Optional for local development. Any custom string (e.g. local_dev_key) will work during sandbox testing.\n"
    )

@router.get("/api/swarm-ledger")
async def get_swarm_ledger():
    try:
        if os.path.exists("swarm_ledger.json") and os.path.getsize("swarm_ledger.json") > 0:
            with open("swarm_ledger.json", "r") as f:
                return json.load(f)
    except Exception:
        pass
    
    return [
        {
            "timestamp": "2026-05-07T00:00:00",
            "requesting_agent": "System",
            "target_agent": "Ledger",
            "task": "Boot Sequence",
            "policy": "Genesis",
            "status": "Complete",
            "proof_of_work": "0x0000"
        }
    ]

@router.get("/api/logs/dlq", response_model=List[DLQLogResponseModel])
async def fetch_dlq_logs(limit: int = Query(50, le=100), offset: int = Query(0), api_key_hash: str = Security(verify_access)):
    import membrane.app
    db_pool = membrane.app.db_pool

    if not db_pool:
        return [
            DLQLogResponseModel(
                timestamp="2026-05-21T10:00:00Z",
                inbound_prompt="Generate a response for agent coordination",
                requested_schema={"type": "object", "properties": {"agent_id": {"type": "string"}}},
                failed_output='{"agent_id": 123}',
                error_message="Validation Error: 123 is not of type 'string'"
            ),
            DLQLogResponseModel(
                timestamp="2026-05-21T09:45:00Z",
                inbound_prompt="Query financial summary spreadsheet",
                requested_schema={"type": "object", "properties": {"total_cost": {"type": "number"}}},
                failed_output='{"total_cost": "invalid_number"}',
                error_message="Validation Error: 'invalid_number' is not a number"
            )
        ]
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT timestamp, inbound_prompt, requested_schema, failed_output, error_message FROM dlq_logs WHERE api_key_hash = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3", api_key_hash, limit, offset)
            return [DLQLogResponseModel(timestamp=str(r['timestamp']), inbound_prompt=r['inbound_prompt'], requested_schema=json.loads(r['requested_schema']) if r['requested_schema'] else None, failed_output=r['failed_output'], error_message=r['error_message']) for r in rows]
    except Exception:
        return []

@router.get("/api/user/balance")
async def get_balance(api_key_hash: str = Security(verify_access)):
    import membrane.app
    db_pool = membrane.app.db_pool

    if not db_pool:
        return {"balance": 10.00}
    try:
        async with db_pool.acquire() as conn:
            tenant = await conn.fetchrow("SELECT balance FROM tenants WHERE api_key_hash = $1", api_key_hash)
            if not tenant:
                return {"balance": 10.00}
            return {"balance": float(tenant['balance'])}
    except Exception:
        return {"balance": 10.00}

@router.get("/api/license/status")
async def get_license_status():
    return {
        "validated": license_state["validated"],
        "key_configured": license_state["key"] is not None,
        "key_preview": f"{license_state['key'][:4]}..." if license_state["key"] else None,
        "error": license_state["error"]
    }

@router.get("/v1/models")
async def openai_compatible_models():
    return {
        "object": "list",
        "data": [
            {
                "id": "membrane-engagement-layer",
                "object": "model",
                "created": 1714000000,
                "owned_by": "membrane"
            },
            {
                "id": CANARY_MODEL,
                "object": "model",
                "created": 1714000000,
                "owned_by": "membrane"
            },
            {
                "id": APEX_MODEL,
                "object": "model",
                "created": 1714000000,
                "owned_by": "membrane"
            },
            {
                "id": "ollama/llama3",
                "object": "model",
                "created": 1714000000,
                "owned_by": "ollama"
            }
        ]
    }

@router.get("/api/debug/auth_logs")
async def get_debug_auth_logs(api_key_hash: str = Security(verify_access)):
    # --- REMEDIATION: Disable debug auth log key leakage in production ---
    is_prod = (
        os.environ.get("RENDER") == "true" or
        os.environ.get("ENVIRONMENT") == "production" or
        os.environ.get("ENV") == "production" or
        os.environ.get("NODE_ENV") == "production"
    )
    if is_prod:
         raise HTTPException(status_code=403, detail="Forbidden: Debug routes are disabled in production environments.")
    return membrane.database.failed_auth_logs
