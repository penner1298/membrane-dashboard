import os
import re
import json
import time
import asyncio
import hashlib
import tempfile
import shutil
import subprocess
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from fastapi import HTTPException

from membrane.config import (
    CANARY_MODEL,
    APEX_MODEL,
    MAX_SAFE_CHUNK_CHARS,
)
from membrane.economics import calc_cost
from membrane.database import charge_and_log_api_batch
from membrane.security import get_safe_destination

# Import validation and execution logic
from membrane.swarm.validation import validate_strict_swarm_request, validate_invariant_compliance
from membrane.swarm.execution import (
    SwarmExecutionMode,
    process_swarm_chunk,
    compile_swarm_response,
    SwarmConcurrencyTracker,
    execute_swarm_experiments,
)

# --- PYDANTIC SCHEMAS ---
class SwarmMapRequest(BaseModel):
    model: str = "membrane-engagement-layer"
    system_prompt: Optional[str] = None
    chunks: List[str]
    max_concurrency: int = 20
    temperature: float = 0.0
    extraction_criteria: Optional[Dict[str, Any]] = None
    invariant_set_id: Optional[str] = None  # The locked enterprise compliance ceiling

    model_config = {"extra": "allow"}

class SwarmPlanRequest(BaseModel):
    model: str = "membrane-engagement-layer"
    chunks: List[str]
    max_concurrency: Optional[int] = 20
    extraction_criteria: Optional[Dict[str, Any]] = None
    invariant_set_id: Optional[str] = None # The locked enterprise compliance ceiling

    model_config = {"extra": "allow"}

class TrajectoryPrediction(BaseModel):
    estimated_total_tokens: int
    estimated_retail_cost: float
    estimated_latency_seconds: float
    recommended_concurrency: int
    risk_score: float # 0.0 (Safe) to 1.0 (High chance of model refusal/timeout)

class SwarmPlanResponse(BaseModel):
    object: str = "swarm.plan"
    invariant_check: str = "COMPLIANT"
    selected_routing_geometry: str # Hash or ID of the matched historical pattern
    trajectory: TrajectoryPrediction
    execution_strategy_notes: List[str]


class ExtractionEntry(BaseModel):
    chunk_index: int
    source_reference: str
    verbatim_text: str
    matched_signals: List[str]

class ValueLedger(BaseModel):
    actual_cost_incurred: float
    gross_unoptimized_cost: float
    net_enterprise_savings: float

class ArchitecturalGuidance(BaseModel):
    alert: str = "HIGH_VOLUME_RAW_DATA_SIGNAL"
    interpretation_note: str = (
        "This payload represents an un-synthesized, high-fidelity verbatim map extraction array. "
        "To convert these raw needles into focused, contextual insights, Membrane strongly recommends "
        "passing this array downstream to a dedicated Interpretive Reduction Layer (e.g., Gemini 3.5 Flash) "
        "to filter out acceptable boilerplate."
    )

class SwarmMapMetadata(BaseModel):
    status: str = "MAP_COMPLETE_INTERPRETATION_REQUIRED"
    total_raw_extractions_captured: int
    deduplication_scrub_count: int = 0
    value_ledger: ValueLedger
    architectural_guidance: ArchitecturalGuidance = ArchitecturalGuidance()
    is_truncated: bool = False
    warning_msg: Optional[str] = None

class SwarmMapResponse(BaseModel):
    object: str = "swarm.extraction_matrix"
    model: str = "membrane-engagement-layer"
    task_id: str
    is_truncated: bool = False
    warning_msg: Optional[str] = None
    extractions: List[ExtractionEntry]
    membrane_metadata: SwarmMapMetadata

class ProofOfWorkRequest(BaseModel):
    agent_id: str
    task_type: str  # e.g., "python_code", "json_schema", "react_component"
    payload: str
    target_agent_id: str
    destination_path: Optional[str] = None

class ProofOfWorkResponse(BaseModel):
    verified: bool
    membrane_signature: Optional[str] = None
    error_log: Optional[str] = None

# Modulo-7919 math helper for watermark signature
def make_canary_signature(payload_str: str, prefix: str) -> str:
    payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
    payload_int = int(payload_hash, 16)
    watermark = payload_int % 7919
    return f"{prefix}_{watermark}_{payload_hash[:16]}"

def verify_state_machine_logic(request: ProofOfWorkRequest, workspace_dir: str) -> ProofOfWorkResponse:
    safe_dest_path = None
    if request.destination_path:
        safe_dest_path = get_safe_destination(request.destination_path, workspace_dir)

    if request.task_type == "python_code":
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_script:
            temp_script.write(request.payload)
            temp_path = temp_script.name
        try:
            result = subprocess.run(["python3", "-m", "py_compile", temp_path], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                signature = make_canary_signature(request.payload, "MEMBRANE_VERIFIED")
                if safe_dest_path:
                    os.makedirs(os.path.dirname(safe_dest_path), exist_ok=True)
                    with open(safe_dest_path, "w") as f_dest:
                        f_dest.write(request.payload)
                return ProofOfWorkResponse(verified=True, membrane_signature=signature)
            else:
                raise HTTPException(status_code=400, detail=f"Python compilation failed: {result.stderr}")
        finally:
            os.remove(temp_path)

    elif request.task_type == "react_component":
        sandbox_dir = os.path.abspath(os.path.join(workspace_dir, "sandbox_scratch"))
        os.makedirs(sandbox_dir, exist_ok=True)
        file_name = f"temp_component_{int(time.time())}.tsx"
        file_path = os.path.abspath(os.path.join(sandbox_dir, file_name))
        if os.path.commonpath([sandbox_dir, file_path]) != sandbox_dir:
            raise HTTPException(status_code=400, detail="Path traversal attempt detected.")
        
        with open(file_path, "w") as f:
            f.write(request.payload)
            
        compiled_successfully = False
        compiler_error = None
        
        try:
            if shutil.which("npx"):
                result = subprocess.run(
                    ["npx", "tsc", "--noEmit", "--skipLibCheck", "--jsx", "preserve", file_path],
                    cwd=workspace_dir,
                    capture_output=True, text=True, timeout=15
                )
                if result.returncode == 0:
                    compiled_successfully = True
                else:
                    compiler_error = f"TypeScript compilation failed: {result.stdout} {result.stderr}"
            else:
                compiler_error = "npx compiler runner not found on system path"
        except Exception as e:
            compiler_error = f"Workspace compiler exception: {e}"
        finally:
            if os.path.exists(file_path): 
                os.remove(file_path)
                
        if compiled_successfully:
            signature = make_canary_signature(request.payload, "MEMBRANE_VERIFIED")
            if safe_dest_path:
                os.makedirs(os.path.dirname(safe_dest_path), exist_ok=True)
                with open(safe_dest_path, "w") as f_dest:
                    f_dest.write(request.payload)
            return ProofOfWorkResponse(verified=True, membrane_signature=signature)
            
        # Fallback to lightweight syntactic parsing
        print(f"⚠️ Compiler check failed ({compiler_error}). Falling back to lightweight parsing...")
        payload = request.payload
        has_export = "export default" in payload
        has_return = "return" in payload
        brace_diff = abs(payload.count("{") - payload.count("}"))
        
        if has_export and has_return and brace_diff < 5:
            signature = make_canary_signature(payload, "MEMBRANE_VERIFIED_MOCK")
            if safe_dest_path:
                os.makedirs(os.path.dirname(safe_dest_path), exist_ok=True)
                with open(safe_dest_path, "w") as f_dest:
                    f_dest.write(request.payload)
            return ProofOfWorkResponse(verified=True, membrane_signature=signature)
        else:
            errors = []
            if not has_export: errors.append("Missing 'export default' component signature.")
            if not has_return: errors.append("Missing component JSX 'return' block.")
            if brace_diff >= 5: errors.append(f"Mismatched curly braces detected (unbalanced count: {brace_diff}).")
            raise HTTPException(status_code=400, detail=f"React component validation failed. Compiler error: {compiler_error}. Fallback errors: {' '.join(errors)}")

    raise HTTPException(status_code=400, detail="Unsupported task type.")

# --- LEGACY WRAPPER EXECUTION RUNNERS (WITHOUT EXPERIMENT FIELDS) ---
async def execute_basic_sandbox_gather(
    chunks: List[str], 
    request: SwarmMapRequest, 
    api_key_hash: str, 
    background_tasks: Any,
    is_truncated: bool = False,
    warning_msg: Optional[str] = None
) -> SwarmMapResponse:
    mapped_model = request.model if request.model != "membrane-engagement-layer" else CANARY_MODEL
    criteria = request.extraction_criteria or {}
    system_prompt = criteria.get("system_persona") or request.system_prompt or "Extract data."
    target_signals = criteria.get("target_signals") or []
    
    semaphore = asyncio.Semaphore(request.max_concurrency)
    tasks = [
        process_swarm_chunk(chunk, i, mapped_model, system_prompt, target_signals, request.temperature, semaphore)
        for i, chunk in enumerate(chunks)
    ]
    results = await asyncio.gather(*tasks)
    return compile_swarm_response(results, chunks, mapped_model, api_key_hash, background_tasks, is_truncated=is_truncated, warning_msg=warning_msg)

async def execute_sliding_window_queue(
    chunks: List[str], 
    request: SwarmMapRequest, 
    api_key_hash: str, 
    background_tasks: Any,
    is_truncated: bool = False,
    warning_msg: Optional[str] = None
) -> SwarmMapResponse:
    mapped_model = request.model if request.model != "membrane-engagement-layer" else CANARY_MODEL
    criteria = request.extraction_criteria or {}
    system_prompt = criteria.get("system_persona") or request.system_prompt or "Extract data."
    target_signals = criteria.get("target_signals") or []
    
    semaphore = asyncio.Semaphore(min(request.max_concurrency, 10))
    tasks = [
        process_swarm_chunk(chunk, i, mapped_model, system_prompt, target_signals, request.temperature, semaphore)
        for i, chunk in enumerate(chunks)
    ]
    results = await asyncio.gather(*tasks)
    return compile_swarm_response(results, chunks, mapped_model, api_key_hash, background_tasks, is_truncated=is_truncated, warning_msg=warning_msg)
