import os
import re
import json
import hashlib
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Security, Query, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Import security dependencies
from membrane.security import scrub_pii, validate_model_string, sanitize_exception_message
from membrane.database import verify_access, charge_and_log_api, log_to_dlq
from membrane.cache import (
    l1_memory_cache,
    active_requests,
    active_requests_lock,
    check_semantic_cache,
    save_to_semantic_cache,
)
from membrane.telemetry import (
    get_aversive_warnings,
    get_semantic_priming,
    fidelity_check,
    check_semantic_intent,
    mark_shadow_flash_failed,
)
from membrane.config import (
    FLASH_MODEL,
    CANARY_MODEL,
    APEX_MODEL,
    L1_CACHE_FEE,
    L2_CACHE_FEE,
    MARKUP_MULTIPLIER,
)
from membrane.economics import calc_cost

from litellm import acompletion

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    model: Optional[str] = None
    response_format: Optional[Dict[str, Any]] = None
    use_global_cache: bool = False
    temperature: Optional[float] = 0.0
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    provider_api_key: Optional[str] = None
    model_config = {"extra": "allow"}

class ChatResponse(BaseModel):
    receipt_id: str
    answer: str
    route_used: str
    status: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    hypothetical_pro_cost: float
    billed_amount: float
    savings_percent: float

class FeedbackRequest(BaseModel):
    prompt: str
    response_format: Optional[Dict[str, Any]] = None
    failed_output: str
    reason: str
    use_global_cache: bool = False

@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
    import membrane.app
    db_pool = membrane.app.db_pool
    
    is_general_protocol = (request.model == "membrane-engagement-layer" or not request.model)
    if request.model == "membrane-engagement-layer":
        request.model = os.getenv("MEMBRANE_FLASH_MODEL") or os.getenv("FLASH_MODEL") or os.environ.get("CANARY_MODEL") or "gemini/gemini-2.5-flash"
    validate_model_string(request.model)

    prompt_repr = request.prompt
    if not prompt_repr and request.messages:
        for msg in reversed(request.messages):
            if msg.get("role") == "user":
                prompt_repr = msg.get("content", "")
                break
    if not prompt_repr:
        prompt_repr = ""

    # PII scrubbing
    if request.prompt:
        request.prompt = scrub_pii(request.prompt)
    if prompt_repr:
        prompt_repr = scrub_pii(prompt_repr)
    if request.messages:
        for msg in request.messages:
            if msg.get("content"):
                msg["content"] = scrub_pii(msg["content"])

    # WAF safety bouncer check (fails open with larger character inspection window)
    is_safe, reject_reason = await check_semantic_intent(prompt_repr)
    if not is_safe:
        background_tasks.add_task(log_to_dlq, api_key_hash, prompt_repr, request.response_format, "REJECTED_BY_BOUNCER", reject_reason)
        raise HTTPException(status_code=400, detail=f"Membrane Policy Violation: {reject_reason}")

    # Composite Cache Key
    scope_identifier = "GLOBAL_HIVE" if request.use_global_cache else api_key_hash
    req_payload = {
        "scope": scope_identifier,
        "messages": request.messages or [{"role": "user", "content": request.prompt or ""}],
        "model": request.model,
        "temperature": request.temperature,
        "response_format": request.response_format
    }
    req_hash = hashlib.md5(json.dumps(req_payload, sort_keys=True).encode()).hexdigest()
    
    applied_cache_fee = L1_CACHE_FEE if request.use_global_cache else L2_CACHE_FEE
    cache_status_label = "L1_GLOBAL_CACHE" if request.use_global_cache else "L2_SILO_CACHE"

    # Intercept concurrent request groups to charge 0 fee (serialize using wait events)
    async with active_requests_lock:
        if req_hash in active_requests:
            wait_event = active_requests[req_hash]
        else:
            wait_event = None
            active_requests[req_hash] = asyncio.Event()

    if wait_event:
        await wait_event.wait()
        cached = await l1_memory_cache.get(req_hash)
        if cached:
            return ChatResponse(receipt_id=req_hash, answer=cached["answer"], route_used="L1_MEMORY_CACHE", status="CACHE HIT", prompt_tokens=0, completion_tokens=0, total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=0.0, savings_percent=100.0)

    try:
        cached = await l1_memory_cache.get(req_hash)
        if cached:
            background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
            return ChatResponse(receipt_id=req_hash, answer=cached["answer"], route_used="L1_MEMORY_CACHE", status="CACHE HIT", prompt_tokens=0, completion_tokens=0, total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)

        prompt_vector = None
        
        # --- REMEDIATION: DO NOT hold DB pool connection open during embedding generation! ---
        # check_semantic_cache handles database pool acquisition internally for exact and semantic lookups.
        cached_answer, prompt_vector = await check_semantic_cache(prompt_repr, request.response_format, api_key_hash, request.use_global_cache)
        if cached_answer:
            await l1_memory_cache.set(req_hash, {"answer": cached_answer})
            background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
            return ChatResponse(receipt_id=req_hash, answer=cached_answer, route_used="SEMANTIC_CACHE", status="CACHE HIT", prompt_tokens=0, completion_tokens=0, total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)

        # get_aversive_warnings runs its query using a context-manager connection internally as well
        system_warnings = await get_aversive_warnings(req_hash, api_key_hash, request.use_global_cache)

        # Removed wasteful senescent shadow mode task execution in the background

        system_instruction = get_semantic_priming(prompt_repr, request.response_format)
        system_instruction += system_warnings

        litellm_kwargs = {}
        if request.response_format:
            litellm_kwargs["response_format"] = {"type": "json_object"}
            system_instruction += f"\nYou MUST return raw JSON matching this schema:\n{json.dumps(request.response_format)}"

        if request.messages:
            messages = list(request.messages)
            system_msg_idx = -1
            for idx, msg in enumerate(messages):
                if msg.get("role") == "system":
                    system_msg_idx = idx
                    break
            if system_msg_idx >= 0:
                messages[system_msg_idx] = {
                    "role": "system",
                    "content": messages[system_msg_idx].get("content", "") + "\n\n" + system_instruction
                }
            else:
                messages.insert(0, {"role": "system", "content": system_instruction})
        else:
            messages = [{"role": "user", "content": (request.prompt or "") + "\n" + system_instruction}]

        effective_model = request.model
        if effective_model == "membrane-engagement-layer":
            effective_model = FLASH_MODEL

        canary = effective_model or CANARY_MODEL
        apex = APEX_MODEL
        if effective_model and not is_general_protocol:
            if "flash" in effective_model.lower() or "mini" in effective_model.lower():
                if "gemini" in effective_model.lower():
                    apex = os.getenv("MEMBRANE_APEX_MODEL") or os.getenv("APEX_MODEL") or "gemini/gemini-3.5-flash"
                elif "gpt" in effective_model.lower():
                    apex = "openai/gpt-4o"

        if canary == apex:
            evaluation_queue = [(canary, "SURFACE_ENGAGEMENT", None)]
        else:
            evaluation_queue = [
                (canary, "SURFACE_ENGAGEMENT", None),
                (apex, "DEEP_COGNITION", None),
                (apex, "HEURISTIC_RECOVERY", 0.0)
            ]

        for model, status_label, temp in evaluation_queue:
            ans = ""
            try:
                litellm_kwargs = {}
                if request.response_format:
                    litellm_kwargs["response_format"] = {"type": "json_object"}
                
                if temp is not None:
                    litellm_kwargs["temperature"] = temp
                elif request.temperature is not None:
                    litellm_kwargs["temperature"] = request.temperature
                    
                if request.max_tokens is not None:
                    litellm_kwargs["max_tokens"] = request.max_tokens
                if request.top_p is not None:
                    litellm_kwargs["top_p"] = request.top_p
                if request.provider_api_key:
                    litellm_kwargs["api_key"] = request.provider_api_key

                res = await acompletion(model=model, messages=messages, **litellm_kwargs)
                ans = res.choices[0].message.content
                in_tok, out_tok = res.usage.prompt_tokens, res.usage.completion_tokens

                actual_cost = calc_cost(model, in_tok, out_tok, res)
                hypo_cost = calc_cost(apex, in_tok, out_tok)
                retail_cost = actual_cost
                savings_dollars = max(0.0, hypo_cost - actual_cost)
                savings_percent = (savings_dollars / hypo_cost * 100) if hypo_cost > 0 else 0.0

                background_tasks.add_task(
                    charge_and_log_api,
                    api_key_hash,
                    retail_cost,
                    actual_cost,
                    f"/api/chat ({status_label})",
                    in_tok + out_tok,
                    savings_dollars,
                    in_tok,
                    out_tok,
                    savings_percent,
                    "chat"
                )

                passed, error_msg, clean_ans = fidelity_check(prompt_repr, ans, request.response_format)
                if not passed:
                    raise ValueError(error_msg)

                display_route = "Membrane-Engagement-Layer"

                await l1_memory_cache.set(req_hash, {"answer": clean_ans})
                background_tasks.add_task(save_to_semantic_cache, prompt_repr, request.response_format, clean_ans, api_key_hash, request.use_global_cache, prompt_vector)

                return ChatResponse(
                    receipt_id=req_hash,
                    answer=clean_ans,
                    route_used=display_route,
                    status=status_label,
                    prompt_tokens=in_tok,
                    completion_tokens=out_tok,
                    total_tokens=in_tok+out_tok,
                    hypothetical_pro_cost=round(hypo_cost, 6),
                    billed_amount=round(retail_cost, 6),
                    savings_percent=round(savings_percent, 1)
                )

            except HTTPException:
                raise
            except Exception as e:
                if status_label == "HEURISTIC_RECOVERY" or len(evaluation_queue) == 1:
                    await log_to_dlq(api_key_hash, prompt_repr, request.response_format, ans, str(e))
                    sanitized_msg = sanitize_exception_message(str(e))
                    sanitized_msg = re.sub(r'^[a-zA-Z0-9_\.]+(?:Error|Exception|Failure):\s*', '', sanitized_msg)
                    raise HTTPException(status_code=422, detail={"error_type": "schema_validation_failure", "message": sanitized_msg, "failed_output": ans})
                
                if model == canary:
                    background_tasks.add_task(mark_shadow_flash_failed, req_hash)

                print(f"🦅 Model {model} Failed ({e}). Shifting...")
                
        raise HTTPException(status_code=502, detail="All upstream models failed to process the request.")

    finally:
        async with active_requests_lock:
            if req_hash in active_requests:
                active_requests[req_hash].set()
                del active_requests[req_hash]

@router.post("/api/chat/feedback")
async def report_failure(request: FeedbackRequest, api_key_hash: str = Security(verify_access)):
    import membrane.app
    db_pool = membrane.app.db_pool
    
    scope_identifier = "GLOBAL_HIVE" if request.use_global_cache else api_key_hash
    req_hash = hashlib.md5((scope_identifier + request.prompt + str(request.response_format)).encode()).hexdigest()
    await l1_memory_cache.delete(req_hash)
    if not db_pool:
        return {"status": "L1 Cache Purged. Database unavailable."}
    try:
        async with db_pool.acquire() as conn:
            if request.use_global_cache:
                await conn.execute("DELETE FROM semantic_cache WHERE prompt_text = $1 AND is_global = TRUE", request.prompt)
            else:
                await conn.execute("DELETE FROM semantic_cache WHERE prompt_text = $1 AND api_key_hash = $2 AND is_global = FALSE", request.prompt, api_key_hash)
            await conn.execute("INSERT INTO aversive_memory (prompt_hash, bad_output, reason, api_key_hash, is_global) VALUES ($1, $2, $3, $4, $5)", req_hash, request.failed_output, request.reason, api_key_hash, request.use_global_cache)
        return {"status": "Cache purged and aversive memory inoculated. Retry your prompt.", "receipt_id": req_hash}
    except Exception as e:
        print(f"🚨 feedback database exception: {e}")
        raise HTTPException(status_code=500, detail="Database error. Please check server logs for details.")

async def stream_openai_response(res, model_name, context_status):
    content = res.answer
    words = re.split(r'(\s+)', content)
    completion_id = f"chatcmpl-{res.receipt_id}"
    created_time = int(asyncio.get_event_loop().time())
    
    first_chunk = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": created_time,
        "model": model_name,
        "choices": [{
            "index": 0,
            "delta": {
                "role": "assistant",
                "content": ""
            },
            "finish_reason": None
        }],
        "membrane_metadata": {
            "billed_amount": res.billed_amount,
            "savings_percent": res.savings_percent,
            "status": res.status,
            "context_status": context_status
        }
    }
    yield f"data: {json.dumps(first_chunk)}\n\n"
    
    for word in words:
        if not word:
            continue
        chunk_data = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created_time,
            "model": model_name,
            "choices": [{
                "index": 0,
                "delta": {
                    "content": word
                },
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(chunk_data)}\n\n"
        await asyncio.sleep(0.005)
        
    final_chunk = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": created_time,
        "model": model_name,
        "choices": [{
            "index": 0,
            "delta": {},
            "finish_reason": "stop"
        }]
    }
    yield f"data: {json.dumps(final_chunk)}\n\n"
    yield "data: [DONE]\n\n"

# --- REMEDIATION: Pydantic schemas for completions endpoint to support OpenAPI documentation ---
class ChatMessage(BaseModel):
    role: str
    content: str
    name: Optional[str] = None

class OpenAICompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.0
    max_tokens: Optional[int] = None
    max_completion_tokens: Optional[int] = None
    top_p: Optional[float] = None
    stream: Optional[bool] = False
    response_format: Optional[Dict[str, Any]] = None

@router.post("/v1/chat/completions")
async def openai_compatible_endpoint(
    body: OpenAICompletionRequest, 
    request: Request, 
    background_tasks: BackgroundTasks, 
    api_key_hash: str = Security(verify_access)
):
    from membrane.security import enforce_public_throttle
    enforce_public_throttle(request)
    
    messages = [m.model_dump() for m in body.messages]
    model_override = body.model
    response_format = body.response_format
    
    temperature = body.temperature
    max_tokens = body.max_tokens or body.max_completion_tokens
    top_p = body.top_p
    stream = body.stream

    # X-Membrane-Preserve-Context: true header check
    preserve_context = request.headers.get("X-Membrane-Preserve-Context", "").lower() == "true"
    context_purged = False

    if not preserve_context and len(messages) > 2:
        # Strip middle conversational blocks, keeping only the first system message and the immediate last user message
        first_system = None
        for msg in messages:
            if msg.get("role") == "system":
                first_system = msg
                break
        
        last_user = None
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user = msg
                break
        
        new_messages = []
        if first_system:
            new_messages.append(first_system)
        if last_user:
            new_messages.append(last_user)
        
        messages = new_messages
        context_purged = True

    provider_api_key = request.headers.get("x-provider-api-key") or request.headers.get("X-Provider-API-Key")
    internal_req = ChatRequest(
        prompt=None,
        messages=messages,
        model=model_override,
        response_format=response_format,
        use_global_cache=False,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
        provider_api_key=provider_api_key
    )

    res = await chat_endpoint(internal_req, background_tasks, api_key_hash)
    context_status = "PURGED_BY_DESIGN" if context_purged else "PRESERVED"

    if stream:
        return StreamingResponse(
            stream_openai_response(res, "membrane-engagement-layer", context_status),
            media_type="text/event-stream"
        )

    return {
        "id": f"chatcmpl-{res.receipt_id}",
        "object": "chat.completion",
        "created": int(asyncio.get_event_loop().time()),
        "model": "membrane-engagement-layer", 
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": res.answer
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": res.prompt_tokens,
            "completion_tokens": res.completion_tokens,
            "total_tokens": res.total_tokens
        },
        "membrane_metadata": {
            "billed_amount": res.billed_amount,
            "savings_percent": res.savings_percent,
            "status": res.status,
            "context_status": context_status
        }
    }
