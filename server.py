import os
import re
import json
import hashlib
import warnings
import asyncio
import time
import random
import subprocess
import tempfile
import shutil
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv
load_dotenv()

warnings.filterwarnings("ignore")

try:
    import uvicorn
    from fastapi import FastAPI, HTTPException, Security, Query, BackgroundTasks, Request
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from fastapi.responses import StreamingResponse
    from pydantic import BaseModel
    from litellm import acompletion, completion_cost, aembedding
    import litellm
    import jsonschema
    import asyncpg
    litellm.set_verbose = True
except ImportError:
    raise ImportError("❌ Missing dependencies. Run: pip install fastapi uvicorn litellm pydantic jsonschema asyncpg")

# --- MEMBRANE PACKAGED INFRASTRUCTURE ---
from membrane.config import *
from membrane.economics import calculate_token_savings, calc_cost
from membrane.licensing import license_state, validate_polar_license, global_state
from membrane.database import verify_access, charge_and_log_api, charge_and_log_api_batch, log_to_dlq


from membrane.security import get_safe_destination, scrub_pii, validate_model_string, enforce_public_throttle

# --- CACHING & LOCKS ---
from membrane.cache import (
    BaseCache,
    InMemoryCache,
    l1_memory_cache,
    active_requests,
    active_requests_lock,
    sweep_l1_cache,
    get_embedding,
    check_semantic_cache,
    save_to_semantic_cache,
)

# --- DATABASE SETUP ---
db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    
    # Flexible boot assertion for required environment variables
    detected_keys = [k for k in ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GROQ_API_KEY", "DEEPSEEK_API_KEY"] if os.environ.get(k)]
    if not detected_keys:
        print("⚠️ Warning: No common AI provider API keys (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY) detected in environment. "
              "Ensure you set the appropriate key for your chosen models, or are using a local offline provider (like Ollama).")
        
    # Boot-time Polar.sh license check
    license_key = os.environ.get("MEMBRANE_LICENSE_KEY")
    if not license_key:
        license_key = "test_license_key"
        print("ℹ️ MEMBRANE_LICENSE_KEY not set. Defaulting to 'test_license_key' for friction-free local contributor testing.")
    
    print(f"🔍 Validating Membrane License Key: {license_key[:4]}...")
    is_valid = await validate_polar_license(license_key)
    license_state["validated"] = is_valid
    license_state["key"] = license_key
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        DATABASE_SSL_STR = os.environ.get("DATABASE_SSL", "false")
        DATABASE_SSL = DATABASE_SSL_STR.lower() == "true"
        print(f"🔌 Connecting to PostgreSQL (SSL={DATABASE_SSL})...")
        try:
            db_pool = await asyncpg.create_pool(db_url, ssl=DATABASE_SSL, min_size=10, max_size=100)
            import membrane.cache
            membrane.cache.db_pool = db_pool
            import membrane.database
            membrane.database.db_pool = db_pool
            import membrane.telemetry
            membrane.telemetry.db_pool = db_pool
            async with db_pool.acquire() as conn:
                try:
                    await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                except Exception as e:
                    print(f"⚠️ Warning: Could not create pgvector extension: {e}")

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS tenants (
                    id SERIAL PRIMARY KEY,
                    api_key_hash VARCHAR(255) UNIQUE NOT NULL,
                    balance NUMERIC(10, 4) DEFAULT 0.0000,
                    tenant_id VARCHAR(255) UNIQUE,
                    referral_code VARCHAR(50) UNIQUE,
                    has_redeemed_ref BOOLEAN DEFAULT FALSE,
                    has_paid BOOLEAN DEFAULT FALSE,
                    total_saved NUMERIC(10, 4) DEFAULT 0.0000,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """)

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS deprecated_keys (
                    api_key_hash VARCHAR(255) PRIMARY KEY,
                    tenant_id VARCHAR(255),
                    balance NUMERIC(10, 4) DEFAULT 0.0000,
                    deprecated_at TIMESTAMPTZ DEFAULT NOW()
                );
                """)
                # Automated TTL pruning for expired deprecated keys
                await conn.execute("DELETE FROM deprecated_keys WHERE deprecated_at < NOW() - INTERVAL '5 minutes';")

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS api_logs (
                    id SERIAL PRIMARY KEY,
                    tenant_id VARCHAR(255),
                    endpoint VARCHAR(255) NOT NULL,
                    tokens INTEGER NOT NULL,
                    cost DECIMAL(10, 4) NOT NULL,
                    wholesale_cost DECIMAL(10, 6) DEFAULT 0.0,
                    savings DECIMAL(10, 4) DEFAULT 0.0,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """)

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS dlq_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMPTZ DEFAULT NOW(),
                    api_key_hash VARCHAR(255) NOT NULL,
                    inbound_prompt TEXT NOT NULL,
                    requested_schema JSONB,
                    failed_output TEXT,
                    error_message TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_dlq_api_key ON dlq_logs(api_key_hash);
                """)

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS semantic_cache (
                    id SERIAL PRIMARY KEY,
                    prompt_text TEXT NOT NULL,
                    requested_schema JSONB,
                    embedding VECTOR(768),
                    cached_response TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    api_key_hash VARCHAR(255) DEFAULT 'legacy',
                    is_global BOOLEAN DEFAULT FALSE
                );
                CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding
                ON semantic_cache USING hnsw (embedding vector_cosine_ops);
                """)

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS aversive_memory (
                    id SERIAL PRIMARY KEY,
                    prompt_hash VARCHAR(255) NOT NULL,
                    bad_output TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    api_key_hash VARCHAR(255) DEFAULT 'legacy',
                    is_global BOOLEAN DEFAULT FALSE
                );
                CREATE INDEX IF NOT EXISTS idx_aversive_hash ON aversive_memory(prompt_hash);
                """)

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS shadow_telemetry (
                    id SERIAL PRIMARY KEY,
                    receipt_id VARCHAR(255) UNIQUE,
                    ttfb FLOAT,
                    died BOOLEAN,
                    flash_failed BOOLEAN DEFAULT FALSE,
                    prompt_hash VARCHAR(255),
                    prompt_embedding VECTOR(768),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_telemetry_receipt ON shadow_telemetry(receipt_id);
                CREATE INDEX IF NOT EXISTS idx_telemetry_embedding
                ON shadow_telemetry USING hnsw (prompt_embedding vector_cosine_ops);
                """)

                # Next.js migrated DDL Alter commands
                await conn.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;")
                await conn.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) UNIQUE;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 4) DEFAULT 0.0;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS wholesale_cost DECIMAL(10, 6) DEFAULT 0.0;")

                # Map-Reduce Telemetry Tracking columns
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS raw_input_size INTEGER DEFAULT 0;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS optimized_output_size INTEGER DEFAULT 0;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS savings_percentage DECIMAL(10, 4) DEFAULT 0.0;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS workload_profile VARCHAR(255);")

                # Swarm experiment columns
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS swarm_mode VARCHAR(50) DEFAULT 'legacy';")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS rejected_at_gate BOOLEAN DEFAULT FALSE;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS canary_used BOOLEAN DEFAULT FALSE;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS canary_succeeded BOOLEAN DEFAULT FALSE;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS chunks_reached_model INTEGER DEFAULT 0;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS estimated_waste_tokens INTEGER DEFAULT 0;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS died BOOLEAN DEFAULT FALSE;")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS task_id VARCHAR(255);")
                await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS concurrency_level INTEGER DEFAULT 0;")

                # Benchmarking Telemetry lookup table
                await conn.execute("""
                CREATE TABLE IF NOT EXISTS benchmarks (
                    id SERIAL PRIMARY KEY,
                    dataset_size INTEGER DEFAULT 0,
                    aggregate_precision DECIMAL(10, 4) DEFAULT 0.0,
                    aggregate_faithfulness DECIMAL(10, 4) DEFAULT 0.0,
                    average_latency_sec DECIMAL(10, 4) DEFAULT 0.0,
                    total_tokens INTEGER DEFAULT 0,
                    retail_cost DECIMAL(10, 4) DEFAULT 0.0,
                    wholesale_cost DECIMAL(10, 6) DEFAULT 0.0,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """)

                # Seed mock benchmarks if empty
                count = await conn.fetchval("SELECT COUNT(*) FROM benchmarks;")
                if count == 0:
                    await conn.execute("""
                    INSERT INTO benchmarks (dataset_size, aggregate_precision, aggregate_faithfulness, average_latency_sec, total_tokens, retail_cost, wholesale_cost) VALUES
                    (250, 0.965, 0.942, 2.14, 1420500, 120.4500, 60.2250),
                    (500, 0.982, 0.958, 1.89, 2841000, 241.9000, 120.9500),
                    (100, 0.941, 0.912, 3.42, 580000, 48.2000, 24.1000);
                    """)

            print("✅ Database connected. Multi-Tenant Ledger initialized and all schema migrations completed.")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
    else:
        print("⚠️ DATABASE_URL not found. DLQ and Caching will be disabled.")

    sweep_task = asyncio.create_task(sweep_l1_cache())

    yield
    
    sweep_task.cancel()
    if db_pool: await db_pool.close()

app = FastAPI(title="Membrane API - Swarm Edition", lifespan=lifespan)

from fastapi.responses import JSONResponse

def sanitize_exception_message(message: str) -> str:
    if not message:
        return message
    sensitive_keywords = [
        "litellm", "openai", "gemini", "anthropic", "cohere", "missing credentials",
        "api_key", "api-key", "apikey", "openai_api_key", "google_api_key", "secret",
        "token", "credentials", "auth", "authentication", "authorization"
    ]
    message_lower = message.lower()
    if any(kw in message_lower for kw in sensitive_keywords):
        return "Upstream provider authentication or configuration error. Please verify server environment credentials."
    return message

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        if "message" in detail:
            detail["message"] = sanitize_exception_message(str(detail["message"]))
    elif isinstance(detail, str):
        detail = sanitize_exception_message(detail)
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={"detail": detail}
    )

from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

def make_serializable_errors(errors: list) -> list:
    cleaned = []
    for err in errors:
        c_err = {}
        for k, v in err.items():
            if k == "ctx" and isinstance(v, dict):
                c_err["ctx"] = {ck: (str(cv) if isinstance(cv, Exception) else cv) for ck, cv in v.items()}
            else:
                c_err[k] = v
        cleaned.append(c_err)
    return cleaned

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": make_serializable_errors(exc.errors())}
    )

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": make_serializable_errors(exc.errors())}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    exc_name = type(exc).__name__
    exc_msg = str(exc)
    if "AuthenticationError" in exc_name or "APIConnectionError" in exc_name or \
       any(kw in exc_msg.lower() for kw in ["missing credentials", "api_key", "openai_api_key", "litellm", "auth"]):
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized: Upstream credentials are unconfigured or invalid."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please check server logs for details."}
    )


from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def handle_head_requests(request: Request, call_next):
    if request.method == "HEAD":
        response = await call_next(request)
        if response.status_code == 405:
            from fastapi import Response
            new_headers = dict(response.headers)
            new_headers.pop("allow", None)
            new_headers["Access-Control-Allow-Origin"] = "*"
            new_headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
            new_headers["Access-Control-Allow-Headers"] = "*"
            return Response(status_code=200, headers=new_headers)
        return response
    return await call_next(request)

from typing import Optional

from membrane.database import verify_access
import membrane.database

@app.get("/api/debug/auth_logs")
async def get_debug_auth_logs():
    return membrane.database.failed_auth_logs

class ChatRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    model: Optional[str] = None
    response_format: Optional[Dict[str, Any]] = None
    use_global_cache: bool = False
    temperature: Optional[float] = 0.0
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
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

class DLQLogResponse(BaseModel):
    timestamp: str
    inbound_prompt: str
    requested_schema: Optional[Dict[str, Any]]
    failed_output: str
    error_message: str



from membrane.telemetry import (
    get_aversive_warnings,
    get_semantic_priming,
    fidelity_check,
    check_semantic_intent,
    run_senescent_shadow,
    mark_shadow_flash_failed,
)



# --- API ENDPOINTS ---
@app.get("/")
async def health_check(): return {"status": "Membrane Swarm API is Live.", "db_connected": db_pool is not None}

@app.get("/llms.txt")
async def get_local_llms_txt():
    from fastapi.responses import PlainTextResponse
    dashboard_llms = os.path.join("membrane-dashboard", "public", "llms.txt")
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

@app.get("/api/swarm-ledger")
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

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
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

    # PII scrubbing - run aggressively on all profiles (QA-15)
    if request.prompt:
        request.prompt = scrub_pii(request.prompt)
    if prompt_repr:
        prompt_repr = scrub_pii(prompt_repr)
    if request.messages:
        for msg in request.messages:
            if msg.get("content"):
                msg["content"] = scrub_pii(msg["content"])

    # WAF Serial safety bouncer (QA-02)
    is_safe, reject_reason = await check_semantic_intent(prompt_repr)
    if not is_safe:
        background_tasks.add_task(log_to_dlq, api_key_hash, prompt_repr, request.response_format, "REJECTED_BY_BOUNCER", reject_reason)
        raise HTTPException(status_code=400, detail=f"Membrane Policy Violation: {reject_reason}")

    # Build the Composite Cache Key Architecture (QA-04 / QA-13)
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

    async with active_requests_lock:
        if req_hash in active_requests:
            wait_event = active_requests[req_hash]
        else:
            wait_event = None
            active_requests[req_hash] = asyncio.Event()

    # Intercept parallel concurrent threads to charge 0.0 fee (QA-08)
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
        
        if db_pool:
            async with db_pool.acquire() as conn:
                cached_answer, prompt_vector = await check_semantic_cache(prompt_repr, request.response_format, api_key_hash, request.use_global_cache, conn=conn)
                if cached_answer:
                    await l1_memory_cache.set(req_hash, {"answer": cached_answer})
                    background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
                    return ChatResponse(receipt_id=req_hash, answer=cached_answer, route_used="SEMANTIC_CACHE", status="CACHE HIT", prompt_tokens=0, completion_tokens=0, total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)

                system_warnings = await get_aversive_warnings(req_hash, api_key_hash, request.use_global_cache, conn=conn)
        else:
            cached_answer, prompt_vector = await check_semantic_cache(prompt_repr, request.response_format, api_key_hash, request.use_global_cache)
            if cached_answer:
                await l1_memory_cache.set(req_hash, {"answer": cached_answer})
                background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
                return ChatResponse(receipt_id=req_hash, answer=cached_answer, route_used="SEMANTIC_CACHE", status="CACHE HIT", prompt_tokens=0, completion_tokens=0, total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)
            system_warnings = ""

        # --- PHASE 1: SENESCENT NODE SHADOW MODE ---
        background_tasks.add_task(run_senescent_shadow, prompt_repr, req_hash, prompt_vector)

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

        # Determine Canary and Apex models dynamically
        effective_model = request.model
        if effective_model == "membrane-engagement-layer":
            effective_model = FLASH_MODEL

        # Set canary & apex dynamically to support cascade fallback on standard client integrations
        canary = effective_model or CANARY_MODEL
        apex = APEX_MODEL
        if effective_model and not is_general_protocol:
            if "flash" in effective_model.lower() or "mini" in effective_model.lower():
                if "gemini" in effective_model.lower():
                    apex = os.getenv("MEMBRANE_APEX_MODEL") or os.getenv("APEX_MODEL") or "gemini/gemini-2.5-pro"
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

                res = await acompletion(model=model, messages=messages, **litellm_kwargs)
                ans = res.choices[0].message.content
                in_tok, out_tok = res.usage.prompt_tokens, res.usage.completion_tokens

                # Secure Token Ledgers: Calculate pricing immediately after upstream call (QA-19)
                actual_cost = calc_cost(model, in_tok, out_tok, res)
                hypo_cost = calc_cost(apex, in_tok, out_tok)

                # Base savings math uses calculate_token_savings (QA-06 / QA-07)
                savings_data = calculate_token_savings(model, in_tok + out_tok, in_tok)
                retail_cost = actual_cost
                savings_dollars = savings_data["net_enterprise_savings"]
                savings_percent = (savings_dollars / hypo_cost * 100) if hypo_cost > 0 else 0.0

                # Charge immediately and log in background so deductions register on schema errors
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

                # Fidelity validation bouncer
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

@app.post("/api/chat/feedback")
async def report_failure(request: FeedbackRequest, api_key_hash: str = Security(verify_access)):
    scope_identifier = "GLOBAL_HIVE" if request.use_global_cache else api_key_hash
    req_hash = hashlib.md5((scope_identifier + request.prompt + str(request.response_format)).encode()).hexdigest()
    await l1_memory_cache.delete(req_hash)
    if not db_pool: return {"status": "L1 Cache Purged. Database unavailable."}
    try:
        async with db_pool.acquire() as conn:
            if request.use_global_cache: await conn.execute("DELETE FROM semantic_cache WHERE prompt_text = $1 AND is_global = TRUE", request.prompt)
            else: await conn.execute("DELETE FROM semantic_cache WHERE prompt_text = $1 AND api_key_hash = $2 AND is_global = FALSE", request.prompt, api_key_hash)
            await conn.execute("INSERT INTO aversive_memory (prompt_hash, bad_output, reason, api_key_hash, is_global) VALUES ($1, $2, $3, $4, $5)", req_hash, request.failed_output, request.reason, api_key_hash, request.use_global_cache)
        return {"status": "Cache purged and aversive memory inoculated. Retry your prompt.", "receipt_id": req_hash}
    except Exception as e:
        print(f"🚨 feedback database exception: {e}")
        raise HTTPException(status_code=500, detail="Database error. Please check server logs for details.")

@app.get("/api/logs/dlq", response_model=List[DLQLogResponse])
async def fetch_dlq_logs(limit: int = Query(50, le=100), offset: int = Query(0), api_key_hash: str = Security(verify_access)):
    if not db_pool:
        return [
            DLQLogResponse(
                timestamp="2026-05-21T10:00:00Z",
                inbound_prompt="Generate a response for agent coordination",
                requested_schema={"type": "object", "properties": {"agent_id": {"type": "string"}}},
                failed_output='{"agent_id": 123}',
                error_message="Validation Error: 123 is not of type 'string'"
            ),
            DLQLogResponse(
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
            return [DLQLogResponse(timestamp=str(r['timestamp']), inbound_prompt=r['inbound_prompt'], requested_schema=json.loads(r['requested_schema']) if r['requested_schema'] else None, failed_output=r['failed_output'], error_message=r['error_message']) for r in rows]
    except Exception:
        return []

@app.get("/api/user/balance")
async def get_balance(api_key_hash: str = Security(verify_access)):
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

@app.get("/api/license/status")
async def get_license_status():
    return {
        "validated": license_state["validated"],
        "key_configured": license_state["key"] is not None,
        "key_preview": f"{license_state['key'][:4]}..." if license_state["key"] else None,
        "error": license_state["error"]
    }

@app.get("/v1/models")
async def openai_compatible_models():
    """
    Returns a list of models to satisfy OpenAI SDK validation checks.
    """
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

from membrane.swarm import (
    SwarmMapRequest,
    ExtractionEntry,
    ValueLedger,
    ArchitecturalGuidance,
    SwarmMapMetadata,
    SwarmMapResponse,
    ProofOfWorkRequest,
    ProofOfWorkResponse,
    verify_state_machine_logic,
    execute_basic_sandbox_gather,
    execute_sliding_window_queue,
    SwarmExecutionMode,
    validate_strict_swarm_request,
    execute_swarm_experiments,
    SwarmPlanRequest,
    TrajectoryPrediction,
    SwarmPlanResponse,
    validate_invariant_compliance,
)

# Explicit strict shape validation per audit plan (guarantees 422 on bad extraction_criteria shapes)
from membrane.swarm.validation import validate_criteria_types

@app.post("/v1/swarm/state", response_model=ProofOfWorkResponse)
async def verify_state_machine(request: ProofOfWorkRequest, http_req: Request, api_key_hash: str = Security(verify_access)):
    enforce_public_throttle(http_req)
    workspace_dir = os.environ.get("MEMBRANE_WORKSPACE_DIR")
    if not workspace_dir or not os.path.isdir(workspace_dir):
        workspace_dir = os.getcwd()
    workspace_dir = os.path.abspath(workspace_dir)
    return verify_state_machine_logic(request, workspace_dir)

@app.post("/v1/swarm/plan", response_model=SwarmPlanResponse)
async def generate_swarm_plan(
    request: SwarmPlanRequest,
    background_tasks: BackgroundTasks,
    http_req: Request,
    api_key_hash: str = Security(verify_access)
):
    enforce_public_throttle(http_req)
    start_time = time.time()
    
    if not request.chunks:
        raise HTTPException(status_code=400, detail="Chunks array cannot be empty")
        
    # Strict shape validation on extraction_criteria (per audit plan)
    # Guarantees clean 422 for bad shapes (e.g. target_signals as string instead of list)
    if getattr(request, 'extraction_criteria', None) is not None:
        validate_criteria_types(request.extraction_criteria)
        
    # PHASE 1: 4D LAYER - Invariant Compliance Validation
    validate_invariant_compliance(request.chunks, request.invariant_set_id)
    
    total_character_volume = sum(len(c) for c in request.chunks)
    chunk_count = len(request.chunks)
    avg_chunk_size = total_character_volume / chunk_count if chunk_count > 0 else 0
    
    # PHASE 2: 2D LAYER - Platonia Geometry Vector Lookup
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
            
    # PHASE 3: 3D LAYER - Trajectory Prediction
    base_input_tokens_per_chunk = int(avg_chunk_size / 4)
    estimated_tokens = (base_input_tokens_per_chunk + 500) * chunk_count
    estimated_cost = (estimated_tokens / 1000000) * 2.00 * MARKUP_MULTIPLIER
    
    trajectory = TrajectoryPrediction(
        estimated_total_tokens=estimated_tokens,
        estimated_retail_cost=round(estimated_cost, 4),
        estimated_latency_seconds=round(2.5 + (chunk_count * 0.1), 2),
        recommended_concurrency=min(getattr(request, 'max_concurrency', 20) or 20, 15),
        risk_score=0.15 if total_character_volume < 200000 else 0.65
    )
    
    # Log the planning request for full transaction trackability
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

@app.post("/v1/swarm/map", response_model=SwarmMapResponse)
async def swarm_map(request: SwarmMapRequest, background_tasks: BackgroundTasks, http_req: Request, api_key_hash: str = Security(verify_access)):
    enforce_public_throttle(http_req)
    """
    Membrane Native Swarm: Parallel Map-Reduce for bulk data extraction.
    Accepts an array of text chunks, processes them concurrently, and merges the JSON output.
    """
    # Detect Swarm Mode
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

    # Strict shape validation on extraction_criteria at entry point (per audit plan)
    # Guarantees clean 422 for bad shapes even in legacy mode
    if getattr(request, 'extraction_criteria', None) is not None:
        validate_criteria_types(request.extraction_criteria)

    if not request.chunks:
        if swarm_mode in (SwarmExecutionMode.EARLY_GATE, SwarmExecutionMode.CANARY_PROBE):
            validate_strict_swarm_request(request.chunks, request.extraction_criteria)
        else:
            raise HTTPException(status_code=400, detail="Chunks array cannot be empty")

    # PHASE 1: 4D LAYER - Invariant Compliance Validation
    validate_invariant_compliance(request.chunks, getattr(request, 'invariant_set_id', None))


    warnings_list = []

    # QA-27: Local Environment 8k Context Guardrail
    for chunk in request.chunks:
        if len(chunk) > MAX_SAFE_CHUNK_CHARS:
            print(f"⚠️ Developer Optimization Warning: Chunk length ({len(chunk)} chars) exceeds maximum safe size of {MAX_SAFE_CHUNK_CHARS} characters. This may degrade accuracy or exceed the local 8k context guardrail.")
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
        warnings_list.append("This instance appears to be running in a production environment without a commercial license. Membrane is free for local development. A $29/month commercial license is available for production use.")

    if len(request.chunks) > 50:
        chunk_warning = f"Swarm Request contains a high number of chunks ({len(request.chunks)}). This may increase provider latency and risk hitting API rate limits."
        print(f"⚠️ Developer Warning: {chunk_warning}")
        warnings_list.append(chunk_warning)

    warning_msg = " | ".join(warnings_list) if warnings_list else None

    start_time = time.time()
    task_id = f"ext_matrix_{hashlib.md5(str(time.time()).encode()).hexdigest()[:8]}"

    # Run Early Gate Validation if enabled
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

    # Execute Swarm using unified executor
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

    return response

async def stream_openai_response(res, model_name, context_status):
    content = res.answer
    import re
    import json
    # Split by whitespace, preserving the whitespaces
    words = re.split(r'(\s+)', content)
    completion_id = f"chatcmpl-{res.receipt_id}"
    created_time = int(time.time())
    
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

@app.post("/v1/chat/completions")
async def openai_compatible_endpoint(request: Request, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
    enforce_public_throttle(request)
    body = await request.json()
    messages = body.get("messages", [])
    model_override = body.get("model")
    response_format = body.get("response_format")
    
    # Extract standard OpenAI parameters
    temperature = body.get("temperature", 0.0)
    max_tokens = body.get("max_tokens") or body.get("max_completion_tokens")
    top_p = body.get("top_p")
    stream = body.get("stream", False)

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

    internal_req = ChatRequest(
        prompt=None,
        messages=messages,
        model=model_override,
        response_format=response_format,
        use_global_cache=False,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p
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
        "created": int(time.time()),
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)