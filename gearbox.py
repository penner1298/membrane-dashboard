import os
import re
import json
import hashlib
import warnings
import uvicorn
import asyncio
import time
import random
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Security, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

warnings.filterwarnings("ignore")

try:
    from litellm import acompletion, completion_cost, aembedding
    import litellm
    import jsonschema
    import asyncpg
    litellm.set_verbose = True
except ImportError:
    raise ImportError("❌ Missing dependencies. Run: pip install fastapi uvicorn litellm pydantic jsonschema asyncpg")

# --- PRICING & ECONOMICS ---
FLASH_INPUT_COST = 0.30
FLASH_OUTPUT_COST = 2.50
PRO_INPUT_COST = 2.00
PRO_OUTPUT_COST = 12.00

MARKUP_MULTIPLIER = 2.0 # You charge 2x the raw API cost
L1_CACHE_FEE = 0.0001 # Subsidized micro-transaction for Global Hive Mind
L2_CACHE_FEE = 0.0025 # Discounted rate for Private Silo Database Read

CANARY_MODEL = "gemini/gemini-2.5-flash"
APEX_MODEL = "gemini/gemini-3.1-pro-preview"
EMBEDDING_MODEL = "gemini/text-embedding-004"

# --- CACHING & LOCKS ---
l1_memory_cache = {}
active_requests = {}

# --- DATABASE SETUP ---
db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        print("🔌 Connecting to PostgreSQL...")
        try:
            db_pool = await asyncpg.create_pool(db_url)
            async with db_pool.acquire() as conn:
                await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS tenants (
                    id SERIAL PRIMARY KEY,
                    api_key_hash VARCHAR(255) UNIQUE NOT NULL,
                    balance NUMERIC(10, 4) DEFAULT 0.0000,
                    clerk_user_id VARCHAR(255) UNIQUE,
                    referral_code VARCHAR(50) UNIQUE,
                    has_redeemed_ref BOOLEAN DEFAULT FALSE,
                    has_paid BOOLEAN DEFAULT FALSE,
                    total_saved NUMERIC(10, 4) DEFAULT 0.0000,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """)

                await conn.execute("""
                CREATE TABLE IF NOT EXISTS api_logs (
                    id SERIAL PRIMARY KEY,
                    clerk_user_id VARCHAR(255) NOT NULL,
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

                # --- PHASE 1: COGNITIVE TELEMETRY (SHADOW MODE) ---
                # This table stores the results of the 8B Senescent Node timeout test
                # cross-referenced against the actual success/failure of the Canary model.
                await conn.execute("""
                CREATE TABLE IF NOT EXISTS shadow_telemetry (
                    id SERIAL PRIMARY KEY,
                    receipt_id VARCHAR(255),
                    ttfb FLOAT,
                    died BOOLEAN,
                    flash_failed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                """)

            print("✅ Database connected. Multi-Tenant Ledger initialized.")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
    else:
        print("⚠️ DATABASE_URL not found. DLQ and Caching will be disabled.")

    yield
    if db_pool: await db_pool.close()

app = FastAPI(title="Membrane API - Swarm Edition", lifespan=lifespan)
security = HTTPBearer()

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

async def verify_access(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not db_pool: raise HTTPException(status_code=503, detail="Database Offline. Billing unavailable.")

    api_key = credentials.credentials
    hashed_key = hash_api_key(api_key)

    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT balance FROM tenants WHERE api_key_hash = $1", hashed_key)
        if not tenant: raise HTTPException(status_code=401, detail="Invalid API Key. Tenant not found.")
        if tenant['balance'] <= 0: raise HTTPException(status_code=402, detail=f"Insufficient Credits (Balance: ${tenant['balance']:.4f}). Please top up.")
    return hashed_key

class ChatRequest(BaseModel):
    prompt: str
    response_format: Optional[Dict[str, Any]] = None
    use_global_cache: bool = False

class ChatResponse(BaseModel):
    receipt_id: str
    answer: str
    route_used: str
    status: str
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

def calc_cost(model_name, in_tokens, out_tokens, response_object=None):
    cost = 0.0
    try:
        if response_object: calculated = completion_cost(completion_response=response_object)
        else: calculated = completion_cost(model=model_name, prompt_tokens=in_tokens, completion_tokens=out_tokens)
        if calculated and calculated > 0: return float(calculated)
    except Exception: pass
    if "flash" in model_name.lower(): return (in_tokens / 1000000) * FLASH_INPUT_COST + (out_tokens / 1000000) * FLASH_OUTPUT_COST
    else: return (in_tokens / 1000000) * PRO_INPUT_COST + (out_tokens / 1000000) * PRO_OUTPUT_COST

async def get_embedding(text: str) -> Optional[list[float]]:
    try:
        res = await aembedding(model=EMBEDDING_MODEL, input=[text], api_key=os.environ.get("GEMINI_API_KEY"))
        return res.data[0]['embedding']
    except Exception: return None

async def check_semantic_cache(prompt: str, schema: Optional[dict], api_key_hash: str, is_global: bool) -> Optional[str]:
    if not db_pool: return None
    if random.random() < 0.10: return None
    prompt_vector = await get_embedding(prompt)
    if not prompt_vector: return None
    schema_json = json.dumps(schema) if schema else None
    try:
        async with db_pool.acquire() as conn:
            if is_global:
                row = await conn.fetchrow("SELECT cached_response FROM semantic_cache WHERE requested_schema = $1 AND embedding <=> $2::vector < 0.12 AND is_global = TRUE AND created_at > NOW() - INTERVAL '7 days' ORDER BY embedding <=> $2::vector ASC LIMIT 1", schema_json, prompt_vector)
            else:
                row = await conn.fetchrow("SELECT cached_response FROM semantic_cache WHERE requested_schema = $1 AND embedding <=> $2::vector < 0.12 AND is_global = FALSE AND api_key_hash = $3 AND created_at > NOW() - INTERVAL '7 days' ORDER BY embedding <=> $2::vector ASC LIMIT 1", schema_json, prompt_vector, api_key_hash)
            if row: return row['cached_response']
    except Exception: pass
    return None

async def save_to_semantic_cache(prompt: str, schema: Optional[dict], answer: str, api_key_hash: str, is_global: bool):
    if not db_pool: return
    prompt_vector = await get_embedding(prompt)
    if not prompt_vector: return
    schema_json = json.dumps(schema) if schema else None
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("INSERT INTO semantic_cache (prompt_text, requested_schema, embedding, cached_response, api_key_hash, is_global) VALUES ($1, $2, $3, $4, $5, $6)", prompt, schema_json, prompt_vector, answer, api_key_hash, is_global)
    except Exception: pass

async def get_aversive_warnings(prompt_hash: str, api_key_hash: str, is_global: bool) -> str:
    if not db_pool: return ""
    try:
        async with db_pool.acquire() as conn:
            if is_global: rows = await conn.fetch("SELECT bad_output, reason FROM aversive_memory WHERE prompt_hash = $1 AND is_global = TRUE ORDER BY created_at DESC LIMIT 3", prompt_hash)
            else: rows = await conn.fetch("SELECT bad_output, reason FROM aversive_memory WHERE prompt_hash = $1 AND api_key_hash = $2 AND is_global = FALSE ORDER BY created_at DESC LIMIT 3", prompt_hash, api_key_hash)
            if not rows: return ""
            warning = "\n\n[SYSTEM WARNING: You have attempted this prompt before and FAILED. Do NOT repeat these mistakes.]"
            for i, r in enumerate(rows): warning += f"\nFailure {i+1}:\n- Bad Output: {r['bad_output']}\n- Rejection Reason: {r['reason']}"
            return warning + "\n[END WARNING]\n"
    except Exception: return ""

def get_semantic_priming(prompt: str, schema: Optional[dict]) -> str:
    if schema: return "[METADATA: Domain=Data_Extraction, Intent=Parsing, Creativity=0]\n"
    if any(k in prompt.lower() for k in ["python", "code", "script"]): return "[METADATA: Domain=Software_Engineering, Intent=Code_Generation, Creativity=0]\n"
    return "[METADATA: Domain=General_Reasoning, Intent=Conversation, Creativity=7]\n"

def fidelity_check(prompt: str, answer: str, schema: Optional[dict] = None):
    if schema:
        try:
            clean_output = answer.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            jsonschema.validate(instance=json.loads(clean_output), schema=schema)
            return True, None, clean_output
        except Exception as e: return False, f"Schema violation: {str(e)}", answer

    ans_lower, prompt_lower = str(answer).lower(), str(prompt).lower()

    if any(re.search(p, ans_lower) for p in [r"i can\'?t (do|help)", r"i am (unable|sorry)", r"as an ai", r"against my guidelines"]): return False, "Refusal detected", answer

    needs_code = any(k in prompt_lower for k in ["python", "script", "code"])
    forbids_backticks = any(k in prompt_lower for k in ["do not use markdown", "no markdown", "no backticks", "raw text"])

    if needs_code and not forbids_backticks and '```' not in ans_lower:
        return False, "Expected code blocks", answer

    if forbids_backticks and '```' in ans_lower:
        return False, "Backticks detected when forbidden", answer

    if len(ans_lower) < 15 and len(prompt_lower) > 50:
        return False, "Output suspiciously short", answer

    return True, None, answer


# --- SENESCENT NODE (SHADOW MODE IMPLEMENTATION) ---
async def run_senescent_shadow(prompt: str, receipt_id: str):
    """
    Phase 1 Cognitive Telemetry Probe.
    Fires the prompt at a hyper-fast 8B model with a brutal timeout guillotine.
    If it hits the timeout, we assume the prompt has High Cognitive Density (it 'died').
    This runs entirely in the background and does not affect the live user request.
    """
    if not db_pool: return
    start_time = time.time()
    died = False
    ttfb = 0.0
    
    try:
        # The Guillotine: 0.25s (250ms) limit for initial Shadow Mode calibration.
        # We will adjust this threshold down once we have statistical data.
        response = await asyncio.wait_for(
            acompletion(
                model="gemini/gemini-1.5-flash-8b",
                messages=[
                    {"role": "system", "content": "Reply '1' if complex logic/coding, '0' if simple extraction."},
                    {"role": "user", "content": prompt}
                ],
                stream=True, # We stream so we can measure Time-To-First-Token accurately
                api_key=os.environ.get("GEMINI_API_KEY")
            ),
            timeout=0.25
        )
        async for chunk in response:
            # The node survived. Record the TTFB and kill the stream.
            ttfb = time.time() - start_time
            break 
            
    except (asyncio.TimeoutError, Exception):
        # The node choked on the complexity and hit the guillotine limit.
        died = True
        ttfb = time.time() - start_time

    # Silently log the telemetry outcome to the database.
    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO shadow_telemetry (receipt_id, ttfb, died) VALUES ($1, $2, $3)",
                receipt_id, ttfb, died
            )
    except Exception as e:
        print(f"Shadow Telemetry DB Error: {e}")

async def mark_shadow_flash_failed(receipt_id: str):
    """
    Updates the shadow_telemetry table when the Canary model fails the fidelity check.
    This provides the 'Ground Truth' for our calibration matrix.
    """
    if not db_pool: return
    try:
        async with db_pool.acquire() as conn:
            # We use an UPDATE because run_senescent_shadow might have already INSERTed the row, 
            # or it might still be running. We use UPSERT logic just in case.
            await conn.execute("""
                INSERT INTO shadow_telemetry (receipt_id, flash_failed) 
                VALUES ($1, TRUE) 
                ON CONFLICT (id) DO NOTHING; -- Fallback, though we usually update
                
                UPDATE shadow_telemetry SET flash_failed = TRUE WHERE receipt_id = $1;
            """, receipt_id)
    except Exception: pass


# 3. 🚀 THE TOLL BOOTH: Async Ledger Deduction & Logging
async def charge_and_log_api(api_key_hash: str, retail_cost: float, wholesale_cost: float, endpoint: str, tokens: int, savings: float = 0.0):
    if not db_pool or retail_cost <= 0: return
    try:
        async with db_pool.acquire() as conn:
            tenant = await conn.fetchrow("SELECT clerk_user_id FROM tenants WHERE api_key_hash = $1", api_key_hash)
            clerk_user_id = tenant['clerk_user_id'] if tenant and tenant['clerk_user_id'] else "unknown_system_user"

            async with conn.transaction():
                await conn.execute(
                    "UPDATE tenants SET balance = balance - $1, total_saved = COALESCE(total_saved, 0) + $2 WHERE api_key_hash = $3",
                    retail_cost, savings, api_key_hash
                )

                await conn.execute(
                    "INSERT INTO api_logs (clerk_user_id, endpoint, tokens, cost, wholesale_cost, savings) VALUES ($1, $2, $3, $4, $5, $6)",
                    clerk_user_id, endpoint, tokens, retail_cost, wholesale_cost, savings
                )
    except Exception as e:
        print(f"🚨 Failed to charge and log for {api_key_hash}: {e}")

async def log_to_dlq(api_key_hash: str, prompt: str, schema: Optional[dict], failed_output: str, error_msg: str):
    if not db_pool: return
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("INSERT INTO dlq_logs (api_key_hash, inbound_prompt, requested_schema, failed_output, error_message) VALUES ($1, $2, $3, $4, $5)", api_key_hash, prompt, json.dumps(schema) if schema else None, failed_output, error_msg)
    except Exception as e: print(f"🚨 DLQ Save Failed: {e}")

# --- API ENDPOINTS ---
@app.get("/")
async def health_check(): return {"status": "Membrane Swarm API is Live.", "db_connected": db_pool is not None}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
    scope_identifier = "GLOBAL_HIVE" if request.use_global_cache else api_key_hash
    req_hash = hashlib.md5((scope_identifier + request.prompt + str(request.response_format)).encode()).hexdigest()
    
    # --- PHASE 1: SENESCENT NODE SHADOW MODE ---
    # Fire the cognitive density probe asynchronously. 
    # This measures prompt difficulty in the background without blocking the live request.
    background_tasks.add_task(run_senescent_shadow, request.prompt, req_hash)

    # 3-Tier Dynamic Pricing Enforcement for Cache
    applied_cache_fee = L1_CACHE_FEE if request.use_global_cache else L2_CACHE_FEE
    cache_status_label = "L1_GLOBAL_CACHE" if request.use_global_cache else "L2_SILO_CACHE"

    if req_hash in active_requests:
        await active_requests[req_hash].wait()
        if req_hash in l1_memory_cache and time.time() - l1_memory_cache[req_hash]["timestamp"] < 60:
            background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
            return ChatResponse(receipt_id=req_hash, answer=l1_memory_cache[req_hash]["answer"], route_used="L1_MEMORY_CACHE", status="CACHE HIT", total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)

    active_requests[req_hash] = asyncio.Event()

    try:
        if req_hash in l1_memory_cache:
            if time.time() - l1_memory_cache[req_hash]["timestamp"] < 60:
                background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
                return ChatResponse(receipt_id=req_hash, answer=l1_memory_cache[req_hash]["answer"], route_used="L1_MEMORY_CACHE", status="CACHE HIT", total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)
            else: del l1_memory_cache[req_hash]

        cached_answer = await check_semantic_cache(request.prompt, request.response_format, api_key_hash, request.use_global_cache)
        if cached_answer:
            l1_memory_cache[req_hash] = {"answer": cached_answer, "timestamp": time.time()}
            background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
            return ChatResponse(receipt_id=req_hash, answer=cached_answer, route_used="SEMANTIC_CACHE", status="CACHE HIT", total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)

        system_instruction = get_semantic_priming(request.prompt, request.response_format)
        system_instruction += await get_aversive_warnings(req_hash, api_key_hash, request.use_global_cache)

        litellm_kwargs = {}
        if request.response_format:
            litellm_kwargs["response_format"] = {"type": "json_object"}
            system_instruction += f"\nYou MUST return raw JSON matching this schema:\n{json.dumps(request.response_format)}"

        messages = [{"role": "user", "content": request.prompt + "\n" + system_instruction}]

        for model, status_label, temp in [(CANARY_MODEL, "SURFACE_ENGAGEMENT", None), (APEX_MODEL, "DEEP_COGNITION", None), (APEX_MODEL, "HEURISTIC_RECOVERY", 0.0)]:
            try:
                if temp is not None: litellm_kwargs["temperature"] = temp
                res = await acompletion(model=model, messages=messages, api_key=os.environ.get("GEMINI_API_KEY"), **litellm_kwargs)
                ans = res.choices[0].message.content
                in_tok, out_tok = res.usage.prompt_tokens, res.usage.completion_tokens

                passed, error_msg, clean_ans = fidelity_check(request.prompt, ans, request.response_format)
                if not passed: raise ValueError(error_msg)

                actual_cost = calc_cost(model, in_tok, out_tok, res)
                hypo_cost = calc_cost(APEX_MODEL, in_tok, out_tok)

                dynamic_markup = random.uniform(1.7, 2.3)
                retail_cost = min(actual_cost * dynamic_markup, hypo_cost)
                
                # Base floor price protects margins against zero-cost hits, using the active cache tier fee as a floor
                retail_cost = max(retail_cost, applied_cache_fee)

                savings_dollars = max(0, hypo_cost - retail_cost)
                savings = max(0, ((hypo_cost - retail_cost) / hypo_cost) * 100) if hypo_cost > 0 else 0

                display_route = "Membrane-Engagement-Layer"

                l1_memory_cache[req_hash] = {"answer": clean_ans, "timestamp": time.time()}
                background_tasks.add_task(save_to_semantic_cache, request.prompt, request.response_format, clean_ans, api_key_hash, request.use_global_cache)

                background_tasks.add_task(charge_and_log_api, api_key_hash, retail_cost, actual_cost, f"/api/chat ({status_label})", in_tok + out_tok, savings_dollars)

                return ChatResponse(
                    receipt_id=req_hash,
                    answer=clean_ans,
                    route_used=display_route,
                    status=status_label,
                    total_tokens=in_tok+out_tok,
                    hypothetical_pro_cost=round(hypo_cost, 6),
                    billed_amount=round(retail_cost, 6),
                    savings_percent=round(savings, 1)
                )

            except Exception as e:
                if status_label == "HEURISTIC_RECOVERY":
                    await log_to_dlq(api_key_hash, request.prompt, request.response_format, ans, str(e))
                    raise HTTPException(status_code=422, detail={"error_type": "schema_validation_failure", "message": str(e), "failed_output": ans})
                
                # --- SHADOW MODE GROUND TRUTH LOGGING ---
                # If the Canary model fails the fidelity check, we log it. 
                # This proves whether the Senescent Node was right to 'die'.
                if model == CANARY_MODEL:
                    background_tasks.add_task(mark_shadow_flash_failed, req_hash)

                print(f"🦅 Model {model} Failed ({e}). Shifting...")
                
        raise HTTPException(status_code=502, detail="All upstream models failed to process the request.")

    finally:
        if req_hash in active_requests:
            active_requests[req_hash].set()
            del active_requests[req_hash]

@app.post("/api/chat/feedback")
async def report_failure(request: FeedbackRequest, api_key_hash: str = Security(verify_access)):
    scope_identifier = "GLOBAL_HIVE" if request.use_global_cache else api_key_hash
    req_hash = hashlib.md5((scope_identifier + request.prompt + str(request.response_format)).encode()).hexdigest()
    if req_hash in l1_memory_cache: del l1_memory_cache[req_hash]
    if not db_pool: return {"status": "L1 Cache Purged. Database unavailable."}
    try:
        async with db_pool.acquire() as conn:
            if request.use_global_cache: await conn.execute("DELETE FROM semantic_cache WHERE prompt_text = $1 AND is_global = TRUE", request.prompt)
            else: await conn.execute("DELETE FROM semantic_cache WHERE prompt_text = $1 AND api_key_hash = $2 AND is_global = FALSE", request.prompt, api_key_hash)
            await conn.execute("INSERT INTO aversive_memory (prompt_hash, bad_output, reason, api_key_hash, is_global) VALUES ($1, $2, $3, $4, $5)", req_hash, request.failed_output, request.reason, api_key_hash, request.use_global_cache)
        return {"status": "Cache purged and aversive memory inoculated. Retry your prompt.", "receipt_id": req_hash}
    except Exception as e: raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/logs/dlq", response_model=List[DLQLogResponse])
async def fetch_dlq_logs(limit: int = Query(50, le=100), offset: int = Query(0), api_key_hash: str = Security(verify_access)):
    if not db_pool: raise HTTPException(status_code=503, detail="Database logging is not configured.")
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT timestamp, inbound_prompt, requested_schema, failed_output, error_message FROM dlq_logs WHERE api_key_hash = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3", api_key_hash, limit, offset)
            return [DLQLogResponse(timestamp=str(r['timestamp']), inbound_prompt=r['inbound_prompt'], requested_schema=json.loads(r['requested_schema']) if r['requested_schema'] else None, failed_output=r['failed_output'], error_message=r['error_message']) for r in rows]
    except Exception as e: raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/user/balance")
async def get_balance(api_key_hash: str = Security(verify_access)):
    if not db_pool: raise HTTPException(status_code=503, detail="Database Offline.")
    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT balance FROM tenants WHERE api_key_hash = $1", api_key_hash)
        return {"balance": float(tenant['balance'])}

from fastapi import Request

@app.get("/v1/models")
async def openai_compatible_models():
    """
    Returns a mock list of models to satisfy OpenAI SDK validation checks.
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
                "id": "gemini-3.1-pro",
                "object": "model",
                "created": 1714000000,
                "owned_by": "membrane"
            }
        ]
    }

class SwarmMapRequest(BaseModel):
    model: str = "membrane-engagement-layer"
    system_prompt: str
    chunks: List[str]
    max_concurrency: int = 20
    temperature: float = 0.0

class SwarmMapResponse(BaseModel):
    merged_results: List[Any]
    total_chunks_processed: int
    failed_chunks: int

@app.post("/v1/swarm/map", response_model=SwarmMapResponse)
async def swarm_map(request: SwarmMapRequest, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
    """
    Membrane Native Swarm: Parallel Map-Reduce for bulk data extraction.
    Accepts an array of text chunks, processes them concurrently, and merges the JSON output.
    """
    if not request.chunks:
        raise HTTPException(status_code=400, detail="Chunks array cannot be empty")

    if len(request.chunks) > 50:
        raise HTTPException(status_code=400, detail="Max 50 chunks per request")

    # Force route to Flash for speed/cost on small chunks
    mapped_model = CANARY_MODEL

    async def process_chunk(chunk: str, chunk_index: int, sem: asyncio.Semaphore):
        async with sem:
            try:
                messages = [
                    {"role": "system", "content": request.system_prompt},
                    {"role": "user", "content": chunk}
                ]
                
                response = await acompletion(
                    model=mapped_model,
                    messages=messages,
                    temperature=request.temperature,
                    response_format={"type": "json_object"},
                    api_key=os.environ.get("GEMINI_API_KEY")
                )
                
                # Calculate cost and trigger background billing
                in_tok = response.usage.prompt_tokens
                out_tok = response.usage.completion_tokens
                actual_cost = calc_cost(mapped_model, in_tok, out_tok, response)
                retail_cost = actual_cost * MARKUP_MULTIPLIER # 2x markup for swarm processing

                background_tasks.add_task(
                    charge_and_log_api,
                    api_key_hash,
                    retail_cost,
                    actual_cost,
                    "/v1/swarm/map",
                    in_tok + out_tok,
                    0.0 # Swarm doesn't track hypothetical savings right now
                )

                content = response.choices[0].message.content
                # Strip markdown code blocks if present
                if content.startswith("```json"): content = content[7:-3]
                elif content.startswith("```"): content = content[3:-3]
                
                parsed_json = json.loads(content)
                return {"index": chunk_index, "data": parsed_json, "error": None}
            except Exception as e:
                print(f"Swarm chunk {chunk_index} failed: {e}")
                return {"index": chunk_index, "data": None, "error": str(e)}

    # Limit concurrency to avoid triggering underlying provider rate limits instantly
    semaphore = asyncio.Semaphore(request.max_concurrency)
    
    tasks = [process_chunk(chunk, i, semaphore) for i, chunk in enumerate(request.chunks)]
    results = await asyncio.gather(*tasks)
    
    merged_output = []
    failed = 0
    
    # Re-order results based on original index to maintain structural integrity
    results.sort(key=lambda x: x["index"])
    
    for res in results:
        if res["error"]:
            failed += 1
            continue
        
        data = res["data"]
        # Intelligently merge: If the JSON returned an array as the root key (e.g. {"clauses": [...]})
        # Extract the items and flatten them into our merged output list.
        if isinstance(data, dict):
            # Find the first key that is a list (e.g., 'clauses', 'entities')
            list_keys = [k for k, v in data.items() if isinstance(v, list)]
            if list_keys:
                # Merge the contents of the primary list
                primary_key = list_keys[0]
                merged_output.extend(data[primary_key])
            else:
                merged_output.append(data)
        elif isinstance(data, list):
            merged_output.extend(data)

    return SwarmMapResponse(
        merged_results=merged_output,
        total_chunks_processed=len(request.chunks),
        failed_chunks=failed
    )

@app.post("/v1/chat/completions")
async def openai_compatible_endpoint(request: Request, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
    body = await request.json()
    messages = body.get("messages", [])

    system_instructions = ""
    last_user_prompt = ""

    # 1. Extract the Agent DNA (System Rules/TACTICS.md)
    for msg in messages:
        if msg.get("role") == "system":
            system_instructions += msg.get("content", "") + "\n\n"

    # 2. Extract ONLY the immediate task (Zero-Shot Isolation)
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user_prompt = msg.get("content", "")
            break

    # 3. Fuse them into the single payload sent to Membrane's core
    prompt = system_instructions + last_user_prompt

    response_format = body.get("response_format")

    # 4. Translate it into a Membrane request
    internal_req = ChatRequest(
        prompt=prompt,
        response_format=response_format,
        use_global_cache=False # FIXED: Defaults to False for absolute L2 Silo privacy!
    )

    res = await chat_endpoint(internal_req, background_tasks, api_key_hash)

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
            "prompt_tokens": res.total_tokens // 2,
            "completion_tokens": res.total_tokens // 2,
            "total_tokens": res.total_tokens
        },
        "membrane_metadata": {
            "billed_amount": res.billed_amount,
            "savings_percent": res.savings_percent,
            "status": res.status
        }
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
