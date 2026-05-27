import os
import json
import time
import asyncio
import hashlib
from enum import Enum
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from litellm import acompletion

from membrane.config import (
    CANARY_MODEL,
    APEX_MODEL,
    MAX_SAFE_CHUNK_CHARS,
)
from membrane.economics import calc_cost
from membrane.database import charge_and_log_api_batch

# --- CONCURRENCY TRACKING STATE ---
active_swarm_chunks = 0

class SwarmConcurrencyTracker:
    async def __aenter__(self):
        global active_swarm_chunks
        active_swarm_chunks += 1
        return active_swarm_chunks

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        global active_swarm_chunks
        active_swarm_chunks -= 1

class SwarmExecutionMode(str, Enum):
    LEGACY = "legacy"
    EARLY_GATE = "early_gate"
    CANARY_PROBE = "canary"


async def process_swarm_chunk(
    chunk: str,
    chunk_index: int,
    mapped_model: str,
    system_prompt: str,
    target_signals: List[str],
    temperature: float,
    sem: asyncio.Semaphore
) -> Dict[str, Any]:
    global active_swarm_chunks
    async with sem:
        async with SwarmConcurrencyTracker():
            current_concurrency = active_swarm_chunks
            response = None
            try:
                user_content = chunk
                if target_signals:
                    user_content = f"Target Signals to extract: {json.dumps(target_signals)}\n\nText Chunk:\n{chunk}"
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ]
                
                kwargs = {}
                response = await acompletion(
                    model=mapped_model,
                    messages=messages,
                    temperature=temperature,
                    response_format={"type": "json_object"},
                    **kwargs
                )
                
                in_tok = response.usage.prompt_tokens
                out_tok = response.usage.completion_tokens
                actual_cost = calc_cost(mapped_model, in_tok, out_tok, response)
                hypothetical_cost = calc_cost(APEX_MODEL, in_tok, out_tok)
                savings = max(0.0, hypothetical_cost - actual_cost)
                
                content = response.choices[0].message.content
                content_clean = content.strip()
                if content_clean.startswith("```json"):
                    content_clean = content_clean[7:]
                if content_clean.endswith("```"):
                    content_clean = content_clean[:-3]
                content_clean = content_clean.strip()
                
                try:
                    parsed_json = json.loads(content_clean)
                except Exception:
                    parsed_json = content_clean
                
                if isinstance(parsed_json, dict):
                    if "extracted_data" in parsed_json:
                        extracted_val = parsed_json["extracted_data"]
                    else:
                        if len(parsed_json) == 1:
                            extracted_val = list(parsed_json.values())[0]
                        else:
                            extracted_val = parsed_json
                    parsed_json = {"extracted_data": extracted_val}
                elif isinstance(parsed_json, (list, tuple, set)):
                    parsed_json = {"extracted_data": list(parsed_json)}
                else:
                    parsed_json = {"extracted_data": parsed_json}

                verbatim_text = json.dumps(parsed_json)
                matched_signals = []
                
                extracted_val = parsed_json["extracted_data"]
                extracted_val_str = str(extracted_val).lower()
                for sig in target_signals:
                    if sig.lower() in extracted_val_str:
                        matched_signals.append(sig)
                
                if not matched_signals and target_signals:
                    matched_signals = [target_signals[0]]

                return {
                    "index": chunk_index,
                    "verbatim_text": verbatim_text,
                    "matched_signals": matched_signals,
                    "error": None,
                    "tokens": in_tok + out_tok,
                    "actual_cost": actual_cost,
                    "hypothetical_cost": hypothetical_cost,
                    "savings": savings,
                    "concurrency_level": current_concurrency
                }
            except Exception as e:
                print(f"Swarm chunk {chunk_index} failed: {e}")
                tokens = 0
                actual_cost = 0.0
                hypothetical_cost = 0.0
                savings = 0.0
                
                if response is not None and getattr(response, "usage", None) is not None:
                    try:
                        in_tok = response.usage.prompt_tokens
                        out_tok = response.usage.completion_tokens
                        tokens = in_tok + out_tok
                        actual_cost = calc_cost(mapped_model, in_tok, out_tok, response)
                        hypothetical_cost = calc_cost(APEX_MODEL, in_tok, out_tok)
                        savings = max(0.0, hypothetical_cost - actual_cost)
                    except Exception as ex_calc:
                        print(f"⚠️ Error calculating costs for failed chunk: {ex_calc}")
                
                return {
                    "index": chunk_index,
                    "verbatim_text": f"Error: {e}",
                    "matched_signals": [],
                    "error": str(e),
                    "tokens": tokens,
                    "actual_cost": actual_cost,
                    "hypothetical_cost": hypothetical_cost,
                    "savings": savings,
                    "concurrency_level": current_concurrency
                }

def compile_swarm_response(
    results: List[Dict[str, Any]], 
    chunks: List[str], 
    model: str, 
    api_key_hash: str, 
    background_tasks: Any,
    is_truncated: bool = False,
    warning_msg: Optional[str] = None,
    # Experiment parameters:
    task_id: Optional[str] = None,
    swarm_mode: str = "legacy",
    rejected_at_gate: bool = False,
    canary_used: bool = False,
    canary_succeeded: bool = False,
    chunks_reached_model: int = 0,
    estimated_waste_tokens: int = 0,
    latency_ms: int = 0,
    died: bool = False,
    concurrency_level: int = 0
) -> Any:
    # We import models dynamically to avoid circular import issues
    from membrane.swarm import (
        SwarmMapResponse, SwarmMapMetadata, ExtractionEntry, ValueLedger, ArchitecturalGuidance
    )
    results.sort(key=lambda x: x["index"])
    extractions = []
    total_tokens = 0
    total_actual_cost = 0.0
    total_hypothetical_cost = 0.0
    total_savings = 0.0
    failed = 0
    
    # Calculate waste tokens from failed chunks dynamically if not pre-provided
    computed_waste = 0
    for r in results:
        if r["error"]:
            failed += 1
            computed_waste += r["tokens"]
        
        vtext = r["verbatim_text"]
        is_valid_json_obj = False
        try:
            parsed_val = json.loads(vtext)
            if isinstance(parsed_val, dict) and "extracted_data" in parsed_val:
                is_valid_json_obj = True
        except Exception:
            pass

        if not is_valid_json_obj:
            try:
                parsed_val = json.loads(vtext)
                if isinstance(parsed_val, dict):
                    if len(parsed_val) == 1:
                        normalized = {"extracted_data": list(parsed_val.values())[0]}
                    else:
                        normalized = {"extracted_data": parsed_val}
                elif isinstance(parsed_val, (list, tuple, set)):
                    normalized = {"extracted_data": list(parsed_val)}
                else:
                    normalized = {"extracted_data": parsed_val}
            except Exception:
                normalized = {"extracted_data": vtext}
            vtext = json.dumps(normalized)

        extractions.append(
            ExtractionEntry(
                chunk_index=r["index"],
                source_reference=f"Chunk {r['index'] + 1}",
                verbatim_text=vtext,
                matched_signals=r["matched_signals"]
            )
        )
        total_tokens += r["tokens"]
        total_actual_cost += r["actual_cost"]
        total_hypothetical_cost += r["hypothetical_cost"]
        total_savings += r["savings"]

    final_waste = estimated_waste_tokens if estimated_waste_tokens > 0 or failed == 0 else computed_waste
    final_died = died or (failed > 0)
    
    savings_percent = (total_savings / total_hypothetical_cost * 100) if total_hypothetical_cost > 0 else 0.0
    
    billing_logs = []
    for r in results:
        profile = "swarm_map_error" if r["error"] else "swarm_map"
        chunk_died = (r["error"] is not None) or final_died
        chunk_waste = r["tokens"] if r["error"] else 0
        if r["tokens"] > 0 or rejected_at_gate:
            billing_logs.append({
                "endpoint": "/v1/swarm/map",
                "tokens": r["tokens"],
                "retail_cost": r["actual_cost"],
                "wholesale_cost": r["actual_cost"] * 0.5,
                "savings": r["savings"],
                "raw_input_size": len(chunks[r["index"]]) if r["index"] < len(chunks) else 0,
                "optimized_output_size": len(r["verbatim_text"]),
                "savings_percentage": savings_percent if not r["error"] else 0.0,
                "workload_profile": profile,
                # Experiment fields
                "swarm_mode": swarm_mode,
                "rejected_at_gate": rejected_at_gate,
                "canary_used": canary_used,
                "canary_succeeded": canary_succeeded,
                "chunks_reached_model": chunks_reached_model,
                "estimated_waste_tokens": chunk_waste,
                "latency_ms": latency_ms,
                "died": chunk_died,
                "task_id": task_id,
                "concurrency_level": concurrency_level
            })
            
    if billing_logs:
        background_tasks.add_task(charge_and_log_api_batch, api_key_hash, billing_logs)

    if failed == len(chunks):
        raise HTTPException(status_code=500, detail="All swarm chunks failed to compile.")

    resolved_task_id = task_id or f"ext_matrix_{hashlib.md5(str(time.time()).encode()).hexdigest()[:8]}"
    
    return SwarmMapResponse(
        object="swarm.extraction_matrix",
        model="membrane-engagement-layer",
        task_id=resolved_task_id,
        is_truncated=is_truncated,
        warning_msg=warning_msg,
        extractions=extractions,
        membrane_metadata=SwarmMapMetadata(
            status="MAP_COMPLETE_INTERPRETATION_REQUIRED",
            total_raw_extractions_captured=len(chunks) - failed,
            deduplication_scrub_count=0,
            value_ledger=ValueLedger(
                actual_cost_incurred=round(total_actual_cost, 6),
                gross_unoptimized_cost=round(total_hypothetical_cost, 6),
                net_enterprise_savings=round(total_savings, 6)
            ),
            is_truncated=is_truncated,
            warning_msg=warning_msg,
            swarm_mode=swarm_mode,
            canary_used=canary_used,
            canary_succeeded=canary_succeeded,
            chunks_reached_model=chunks_reached_model,
            estimated_waste_tokens=final_waste,
            concurrency_level=concurrency_level
        )
    )

async def log_gate_rejection(
    api_key_hash: str,
    chunks: List[str],
    background_tasks: Any,
    task_id: str,
    swarm_mode: str,
    error_msg: str
):
    rejection_log = {
        "endpoint": "/v1/swarm/map",
        "tokens": 0,
        "retail_cost": 0.0,
        "wholesale_cost": 0.0,
        "savings": 0.0,
        "raw_input_size": sum(len(c) for c in chunks),
        "optimized_output_size": 0,
        "savings_percentage": 0.0,
        "workload_profile": "swarm_map_gate_rejection",
        "swarm_mode": swarm_mode,
        "rejected_at_gate": True,
        "canary_used": False,
        "canary_succeeded": False,
        "chunks_reached_model": 0,
        "estimated_waste_tokens": 0,
        "latency_ms": 0,
        "died": True,
        "task_id": task_id,
        "concurrency_level": 0
    }
    background_tasks.add_task(charge_and_log_api_batch, api_key_hash, [rejection_log])

async def log_canary_failure(
    api_key_hash: str,
    chunks: List[str],
    canary_result: Dict[str, Any],
    background_tasks: Any,
    task_id: str,
    swarm_mode: str,
    latency_ms: int
):
    canary_log = {
        "endpoint": "/v1/swarm/map",
        "tokens": canary_result["tokens"],
        "retail_cost": canary_result["actual_cost"],
        "wholesale_cost": canary_result["actual_cost"] * 0.5,
        "savings": canary_result["savings"],
        "raw_input_size": len(chunks[0]),
        "optimized_output_size": len(canary_result["verbatim_text"]),
        "savings_percentage": 0.0,
        "workload_profile": "swarm_map_canary_failure",
        "swarm_mode": swarm_mode,
        "rejected_at_gate": False,
        "canary_used": True,
        "canary_succeeded": False,
        "chunks_reached_model": 1,
        "estimated_waste_tokens": canary_result["tokens"],
        "latency_ms": latency_ms,
        "died": True,
        "task_id": task_id,
        "concurrency_level": canary_result.get("concurrency_level", 0)
    }
    background_tasks.add_task(charge_and_log_api_batch, api_key_hash, [canary_log])

async def execute_swarm_experiments(
    chunks: List[str],
    request: Any,
    api_key_hash: str,
    background_tasks: Any,
    swarm_mode: SwarmExecutionMode,
    task_id: str,
    start_time: float,
    license_active: bool = False,
    is_truncated: bool = False,
    warning_msg: Optional[str] = None
) -> Any:
    from membrane.swarm.validation import validate_criteria_types
    validate_criteria_types(request.extraction_criteria)
    mapped_model = request.model if request.model != "membrane-engagement-layer" else CANARY_MODEL
    criteria = request.extraction_criteria or {}
    system_prompt = criteria.get("system_persona") or request.system_prompt or "Extract data."
    target_signals = criteria.get("target_signals") or []
    
    concurrency_limit = min(request.max_concurrency, 10) if not license_active else request.max_concurrency
    semaphore = asyncio.Semaphore(concurrency_limit)
    
    if swarm_mode == SwarmExecutionMode.CANARY_PROBE:
        canary_res = await process_swarm_chunk(
            chunks[0], 0, mapped_model, system_prompt, target_signals, request.temperature, semaphore
        )
        
        if canary_res["error"] is not None:
            latency_ms = int((time.time() - start_time) * 1000)
            await log_canary_failure(
                api_key_hash=api_key_hash,
                chunks=chunks,
                canary_result=canary_res,
                background_tasks=background_tasks,
                task_id=task_id,
                swarm_mode=swarm_mode.value,
                latency_ms=latency_ms
            )
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "canary_sentinel_failure",
                    "message": f"Canary sentinel probe failed on chunk 0: {canary_res['error']}. Swarm execution aborted. Only chunk 0 was run, preventing the remaining {len(chunks) - 1} chunks from executing. Estimated waste: {canary_res['tokens']} tokens. Saved approximately {int(canary_res['tokens'] * (len(chunks) - 1))} potential waste tokens."
                }
            )
        
        if len(chunks) > 1:
            tasks = [
                process_swarm_chunk(chunk, i, mapped_model, system_prompt, target_signals, request.temperature, semaphore)
                for i, chunk in enumerate(chunks[1:], start=1)
            ]
            other_results = await asyncio.gather(*tasks)
            results = [canary_res] + list(other_results)
        else:
            results = [canary_res]
            
        peak_concurrency = max([r.get("concurrency_level", 0) for r in results]) if results else 0
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Check if any subsequent chunks failed
        failed_count = sum(1 for r in results if r["error"] is not None)
        died = failed_count > 0
        estimated_waste = sum(r["tokens"] for r in results if r["error"] is not None)
        
        return compile_swarm_response(
            results,
            chunks,
            mapped_model,
            api_key_hash,
            background_tasks,
            is_truncated=is_truncated,
            warning_msg=warning_msg,
            task_id=task_id,
            swarm_mode=swarm_mode.value,
            rejected_at_gate=False,
            canary_used=True,
            canary_succeeded=True,
            chunks_reached_model=len(chunks),
            estimated_waste_tokens=estimated_waste,
            latency_ms=latency_ms,
            died=died,
            concurrency_level=peak_concurrency
        )
        
    else:
        # Legacy or EARLY_GATE Mode execution
        tasks = [
            process_swarm_chunk(chunk, i, mapped_model, system_prompt, target_signals, request.temperature, semaphore)
            for i, chunk in enumerate(chunks)
        ]
        results = await asyncio.gather(*tasks)
        
        peak_concurrency = max([r.get("concurrency_level", 0) for r in results]) if results else 0
        latency_ms = int((time.time() - start_time) * 1000)
        
        failed_count = sum(1 for r in results if r["error"] is not None)
        died = failed_count > 0
        estimated_waste = sum(r["tokens"] for r in results if r["error"] is not None)
        
        return compile_swarm_response(
            results,
            chunks,
            mapped_model,
            api_key_hash,
            background_tasks,
            is_truncated=is_truncated,
            warning_msg=warning_msg,
            task_id=task_id,
            swarm_mode=swarm_mode.value,
            rejected_at_gate=False,
            canary_used=False,
            canary_succeeded=False,
            chunks_reached_model=len(chunks),
            estimated_waste_tokens=estimated_waste,
            latency_ms=latency_ms,
            died=died,
            concurrency_level=peak_concurrency
        )
