import os
import time
import json
import hashlib
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Security, Request, BackgroundTasks

from membrane.security import validate_model_string, enforce_public_throttle
from membrane.database import verify_access, charge_and_log_api_batch
from membrane.config import MAX_SAFE_CHUNK_CHARS, MARKUP_MULTIPLIER
from membrane.licensing import global_state

from membrane.swarm import (
    SwarmMapRequest,
    SwarmMapResponse,
    ProofOfWorkRequest,
    ProofOfWorkResponse,
    verify_state_machine_logic,
    SwarmExecutionMode,
    validate_strict_swarm_request,
    execute_swarm_experiments,
    SwarmPlanRequest,
    TrajectoryPrediction,
    SwarmPlanResponse,
    validate_invariant_compliance,
)

# Explicit strict shape validation
from membrane.swarm.validation import validate_criteria_types

router = APIRouter()

@router.post("/v1/swarm/state", response_model=ProofOfWorkResponse)
async def verify_state_machine(request: ProofOfWorkRequest, http_req: Request, api_key_hash: str = Security(verify_access)):
    enforce_public_throttle(http_req)
    workspace_dir = os.environ.get("MEMBRANE_WORKSPACE_DIR")
    if not workspace_dir or not os.path.isdir(workspace_dir):
        workspace_dir = os.getcwd()
    workspace_dir = os.path.abspath(workspace_dir)
    import asyncio
    return await asyncio.to_thread(verify_state_machine_logic, request, workspace_dir)

@router.post("/v1/swarm/plan", response_model=SwarmPlanResponse)
async def generate_swarm_plan(
    request: SwarmPlanRequest,
    background_tasks: BackgroundTasks,
    http_req: Request,
    api_key_hash: str = Security(verify_access)
):
    import server
    import membrane.app
    db_pool = getattr(server, "db_pool", None) or membrane.app.db_pool

    enforce_public_throttle(http_req)
    start_time = time.time()
    
    if not request.chunks:
        raise HTTPException(status_code=400, detail="Chunks array cannot be empty")
        
    if getattr(request, 'extraction_criteria', None) is not None:
        validate_criteria_types(request.extraction_criteria)
        
    validate_invariant_compliance(request.chunks, request.invariant_set_id)
    
    total_character_volume = sum(len(c) for c in request.chunks)
    chunk_count = len(request.chunks)
    avg_chunk_size = total_character_volume / chunk_count if chunk_count > 0 else 0
    
    matched_geometry_id = "geo_pattern_legal_dense_v4"
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT task_id FROM api_logs WHERE endpoint = '/v1/swarm/map' AND chunks_reached_model BETWEEN $1 AND $2 LIMIT 1",
                    max(1, chunk_count - 3), chunk_count + 3
                )
                if row and row["task_id"]:
                    matched_geometry_id = f"geo_pattern_historical_{row['task_id']}"
        except Exception as e:
            print(f"⚠️ Error querying platonia geometry: {e}")
            
    base_input_tokens_per_chunk = int(avg_chunk_size / 4)
    estimated_tokens = (base_input_tokens_per_chunk + 500) * chunk_count
    estimated_cost = (estimated_tokens / 1000000) * 2.00 * MARKUP_MULTIPLIER
    
    trajectory = TrajectoryPrediction(
        estimated_total_tokens=estimated_tokens,
        estimated_retail_cost=round(estimated_cost, 4),
        estimated_latency_seconds=round(2.5 + (chunk_count * 0.1), 2),
        recommended_concurrency=min(getattr(request, 'max_concurrency', 20) or 20, 15),
        risk_score=0.15 if total_character_volume < 1000000 else 0.65
    )
    
    planning_log = {
        "endpoint": "/v1/swarm/plan",
        "tokens": 0,
        "retail_cost": 0.0,
        "wholesale_cost": 0.0,
        "savings": 0.0,
        "raw_input_size": total_character_volume,
        "optimized_output_size": 0,
        "savings_percentage": 0.0,
        "workload_profile": "swarm_plan",
        "swarm_mode": "plan",
        "rejected_at_gate": False,
        "canary_used": False,
        "canary_succeeded": False,
        "chunks_reached_model": chunk_count,
        "estimated_waste_tokens": 0,
        "latency_ms": int((time.time() - start_time) * 1000),
        "died": False,
        "task_id": f"plan_{matched_geometry_id}",
        "concurrency_level": 0
    }
    background_tasks.add_task(charge_and_log_api_batch, api_key_hash, [planning_log])
    
    return SwarmPlanResponse(
        selected_routing_geometry=matched_geometry_id,
        trajectory=trajectory,
        execution_strategy_notes=[
            f"Verified structural alignment with invariant set: {request.invariant_set_id or 'DEFAULT'}.",
            f"Matched data geometry profile to {matched_geometry_id}. Recommending sliding-window queue optimization."
        ]
    )

@router.post("/v1/swarm/map", response_model=SwarmMapResponse)
async def swarm_map(request: SwarmMapRequest, background_tasks: BackgroundTasks, http_req: Request, api_key_hash: str = Security(verify_access)):
    enforce_public_throttle(http_req)
    
    provider_api_key = http_req.headers.get("x-provider-api-key") or http_req.headers.get("X-Provider-API-Key")
    if not provider_api_key:
        provider_api_key = getattr(request, 'provider_api_key', None) or (request.model_extra.get('provider_api_key') if request.model_extra else None)

    provider = http_req.headers.get("x-provider") or http_req.headers.get("X-Provider") or http_req.headers.get("x-provider-name") or http_req.headers.get("X-Provider-Name")
    if not provider:
        provider = getattr(request, 'provider', None) or (request.model_extra.get('provider') if request.model_extra else None)

    request.provider = provider
    request.provider_api_key = provider_api_key

    swarm_mode_header = http_req.headers.get("X-Membrane-Swarm-Mode")
    swarm_mode = SwarmExecutionMode.LEGACY
    if swarm_mode_header:
        try:
            swarm_mode = SwarmExecutionMode(swarm_mode_header.lower())
        except ValueError:
            pass
    else:
        swarm_mode_env = os.getenv("MEMBRANE_SWARM_MODE", "legacy").lower()
        try:
            swarm_mode = SwarmExecutionMode(swarm_mode_env)
        except ValueError:
            pass

    if getattr(request, 'extraction_criteria', None) is not None:
        validate_criteria_types(request.extraction_criteria)

    if not request.chunks:
        if swarm_mode in (SwarmExecutionMode.EARLY_GATE, SwarmExecutionMode.CANARY_PROBE):
            validate_strict_swarm_request(request.chunks, request.extraction_criteria)
        else:
            raise HTTPException(status_code=400, detail="Chunks array cannot be empty")

    validate_invariant_compliance(request.chunks, getattr(request, 'invariant_set_id', None))

    # --- L1 Cache Check for Swarm Map ---
    from membrane.cache import l1_memory_cache
    from copy import deepcopy
    
    criteria_dict = getattr(request, 'extraction_criteria', None) or {}
    req_payload = {
        "scope": api_key_hash,
        "chunks": request.chunks,
        "model": request.model,
        "provider": provider,
        "extraction_criteria": criteria_dict,
        "invariant_set_id": getattr(request, 'invariant_set_id', None)
    }
    req_hash = hashlib.md5(json.dumps(req_payload, sort_keys=True).encode()).hexdigest()
    
    cached = await l1_memory_cache.get(req_hash)
    if cached:
        cached_response = cached["response"]
        resp_copy = deepcopy(cached_response)
        resp_copy.membrane_metadata.status = "SEMANTIC_CACHE"
        resp_copy.membrane_metadata.value_ledger.actual_cost_incurred = 0.0025
        resp_copy.membrane_metadata.value_ledger.net_enterprise_savings = max(
            0.0, 
            resp_copy.membrane_metadata.value_ledger.gross_unoptimized_cost - 0.0025
        )
        resp_copy.membrane_metadata.swarm_mode = swarm_mode.value
        resp_copy.membrane_metadata.prompt_tokens = 0
        resp_copy.membrane_metadata.completion_tokens = 0
        resp_copy.membrane_metadata.total_tokens = 0
        
        # Log the cache hit to the database/api logs
        cache_log = {
            "endpoint": "/v1/swarm/map",
            "tokens": 0,
            "retail_cost": 0.0025,
            "wholesale_cost": 0.0,
            "savings": resp_copy.membrane_metadata.value_ledger.net_enterprise_savings,
            "raw_input_size": sum(len(c) for c in request.chunks),
            "optimized_output_size": sum(len(e.verbatim_text) for e in resp_copy.extractions),
            "savings_percentage": (resp_copy.membrane_metadata.value_ledger.net_enterprise_savings / resp_copy.membrane_metadata.value_ledger.gross_unoptimized_cost * 100) if resp_copy.membrane_metadata.value_ledger.gross_unoptimized_cost > 0 else 100.0,
            "workload_profile": "swarm_map_cache_hit",
            "swarm_mode": swarm_mode.value,
            "rejected_at_gate": False,
            "canary_used": False,
            "canary_succeeded": False,
            "chunks_reached_model": 0,
            "estimated_waste_tokens": 0,
            "latency_ms": 0,
            "died": False,
            "task_id": resp_copy.task_id,
            "concurrency_level": 0
        }
        background_tasks.add_task(charge_and_log_api_batch, api_key_hash, [cache_log])
        return resp_copy

    warnings_list = []
    for chunk in request.chunks:
        if len(chunk) > MAX_SAFE_CHUNK_CHARS:
            print(f"⚠️ Developer Optimization Warning: Chunk length ({len(chunk)} chars) exceeds maximum safe size of {MAX_SAFE_CHUNK_CHARS} characters.")
            break

    validate_model_string(request.model)
    is_truncated = False
 
    is_prod = (
        os.environ.get("RENDER") == "true" or
        os.environ.get("ENVIRONMENT") == "production" or
        os.environ.get("ENV") == "production" or
        os.environ.get("NODE_ENV") == "production"
    )

    if not global_state.license_active and is_prod:
        warnings_list.append("This instance appears to be running in a production environment without a commercial license.")

    if len(request.chunks) > 50:
        chunk_warning = f"Swarm Request contains a high number of chunks ({len(request.chunks)}). This may increase provider latency."
        warnings_list.append(chunk_warning)

    warning_msg = " | ".join(warnings_list) if warnings_list else None
    start_time = time.time()
    task_id = f"ext_matrix_{hashlib.md5(str(time.time()).encode()).hexdigest()[:8]}"

    if swarm_mode in (SwarmExecutionMode.EARLY_GATE, SwarmExecutionMode.CANARY_PROBE):
        try:
            validate_strict_swarm_request(request.chunks, request.extraction_criteria)
        except HTTPException as he:
            from membrane.swarm.execution import log_gate_rejection
            await log_gate_rejection(
                api_key_hash=api_key_hash,
                chunks=request.chunks,
                background_tasks=background_tasks,
                task_id=task_id,
                swarm_mode=swarm_mode.value,
                error_msg=str(he.detail)
            )
            raise he

    response = await execute_swarm_experiments(
        chunks=request.chunks,
        request=request,
        api_key_hash=api_key_hash,
        background_tasks=background_tasks,
        swarm_mode=swarm_mode,
        task_id=task_id,
        start_time=start_time,
        license_active=global_state.license_active,
        is_truncated=is_truncated,
        warning_msg=warning_msg
    )

    # Save to L1 memory cache
    await l1_memory_cache.set(req_hash, {"response": response})

    return response
