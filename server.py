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

warnings.filterwarnings("ignore")

try:
    import uvicorn
    from fastapi import FastAPI, HTTPException, Security, Query, BackgroundTasks, Request
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from pydantic import BaseModel
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

# --- AGENT-AGNOSTIC MODEL SPECIFICATIONS ---
# We support FLASH_MODEL (or CANARY_MODEL), APEX_MODEL, and EMBED_MODEL (or EMBEDDING_MODEL).
# suggestions:
# - Flash: gemini/gemini-2.5-flash, openai/gpt-4o-mini, anthropic/claude-3-5-haiku, groq/llama3-8b-8192
# - Apex: gemini/gemini-3.5-flash, openai/gpt-4o, anthropic/claude-3-5-sonnet, deepseek/deepseek-chat
# - Embed: gemini/text-embedding-004, openai/text-embedding-3-small, cohere/embed-english-v3.0
FLASH_MODEL = os.environ.get("FLASH_MODEL") or os.environ.get("CANARY_MODEL") or "gemini/gemini-2.5-flash"
APEX_MODEL = os.environ.get("APEX_MODEL") or "gemini/gemini-3.5-flash"
EMBED_MODEL = os.environ.get("EMBED_MODEL") or os.environ.get("EMBEDDING_MODEL") or "gemini/text-embedding-004"
BOUNCER_MODEL = os.environ.get("BOUNCER_MODEL") or FLASH_MODEL

# Maintain variables for backwards compatibility
CANARY_MODEL = FLASH_MODEL
EMBEDDING_MODEL = EMBED_MODEL

# --- POLAR.SH LICENSE STATE & VALIDATION ---
license_state = {
    "validated": False,
    "key": None,
    "error": None
}

async def validate_polar_license(key: str) -> bool:
    if key == "test_license_key":
        print("🎫 Developer license key 'test_license_key' detected. Bypassing Polar.sh check.")
        return True
    
    url = "https://api.polar.sh/v1/customer-portal/license-keys/validate"
    headers = {"Content-Type": "application/json"}
    payload = {"key": key}
    
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers, timeout=5.0) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    status = data.get("status")
                    if status == "active" or data.get("is_valid", True):
                        print("✅ Polar.sh License Key verified successfully.")
                        return True
                    else:
                        print(f"❌ Polar.sh License Key is invalid. Status: {status}")
                        return False
                else:
                    text = await resp.text()
                    print(f"❌ Polar.sh validation failed with HTTP {resp.status}: {text}")
                    return False
    except asyncio.TimeoutError:
        print("⚠️ Polar.sh API validation timed out. Fail-open enabled for production resilience.")
        return True
    except Exception as e:
        print(f"⚠️ Polar.sh validation error ({e}). Fail-open enabled for production resilience.")
        return True

def scrub_pii(text: str) -> str:
    """
    Scrubs common PII patterns (emails, phone numbers, IP addresses) from the prompt.
    """
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    phone_pattern = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
    ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    
    text = re.sub(email_pattern, "[REDACTED_EMAIL]", text)
    text = re.sub(phone_pattern, "[REDACTED_PHONE]", text)
    text = re.sub(ip_pattern, "[REDACTED_IP]", text)
    return text

def validate_model_string(model_name: Optional[str]):
    if not model_name:
        return
    # If the user passes a model, make sure it is reasonably formatted.
    # To support arbitrary overrides (like Ollama, local models, or LiteLLM formats),
    # we allow any string containing a provider prefix (e.g. provider/name) or matching standard formats.
    if "/" not in model_name and not model_name.startswith("gemini-") and model_name != "membrane-engagement-layer":
        # If it doesn't look like a valid model string (like a plain garbage word), raise 400
        if len(model_name) < 3 or not re.match(r'^[a-zA-Z0-9_\-\.\/:]+$', model_name):
            raise HTTPException(status_code=400, detail=f"Unsupported or malformed model string: '{model_name}'.")

# --- CACHING & LOCKS ---
l1_memory_cache = {}
active_requests = {}
active_requests_lock = asyncio.Lock()

MAX_L1_CACHE_SIZE = 10000
L1_CACHE_TTL = 300 # 5 minutes

async def sweep_l1_cache():
    while True:
        try:
            await asyncio.sleep(L1_CACHE_TTL)
            if len(l1_memory_cache) == 0:
                continue
            
            now = time.time()
            keys_to_del = [k for k, v in l1_memory_cache.items() if now - v["timestamp"] > L1_CACHE_TTL]
            for k in keys_to_del:
                del l1_memory_cache[k]
                
            # Hard limit eviction if still over max size
            if len(l1_memory_cache) > MAX_L1_CACHE_SIZE:
                keys = list(l1_memory_cache.keys())
                for k in keys[:len(keys)//5]:
                    del l1_memory_cache[k]
                    
            # Clean up active_requests lock dictionary to prevent memory leak
            # Only remove if event is set
            async with active_requests_lock:
                keys_to_del_req = [k for k, v in active_requests.items() if v.is_set()]
                for k in keys_to_del_req:
                    del active_requests[k]
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"⚠️ Cache sweep error: {e}")

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
        print("🔌 Connecting to PostgreSQL...")
        try:
            db_pool = await asyncpg.create_pool(db_url)
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

            print("✅ Database connected. Multi-Tenant Ledger initialized.")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
    else:
        print("⚠️ DATABASE_URL not found. DLQ and Caching will be disabled.")

    sweep_task = asyncio.create_task(sweep_l1_cache())

    yield
    
    sweep_task.cancel()
    if db_pool: await db_pool.close()

app = FastAPI(title="Membrane API - Swarm Edition", lifespan=lifespan)
security = HTTPBearer()

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

async def verify_access(credentials: HTTPAuthorizationCredentials = Security(security)):
    api_key = credentials.credentials
    hashed_key = hash_api_key(api_key)

    if not db_pool:
        print("⚠️ Database offline. Bypassing billing/auth check for local demo.")
        return hashed_key

    async with db_pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT balance, tenant_id FROM tenants WHERE api_key_hash = $1", hashed_key)
        if not tenant:
            # Auto-provision a default local developer tenant with a $1,000.00 mock balance
            print(f"🆕 Auto-provisioning tenant for API key hash: {hashed_key[:8]}... with $1000.00 balance.")
            try:
                new_ref_code = f"REF-{hashlib.md5(hashed_key.encode()).hexdigest()[:6].upper()}"
                await conn.execute(
                    "INSERT INTO tenants (api_key_hash, balance, tenant_id, referral_code, has_paid) VALUES ($1, 1000.0000, $2, $3, TRUE) ON CONFLICT (api_key_hash) DO NOTHING",
                    hashed_key, "local_dev", new_ref_code
                )
                tenant = await conn.fetchrow("SELECT balance, tenant_id FROM tenants WHERE api_key_hash = $1", hashed_key)
            except Exception as e:
                print(f"⚠️ Failed to auto-provision tenant: {e}")
                raise HTTPException(status_code=401, detail="Invalid API Key. Tenant not found and auto-provision failed.")
        
        if tenant['balance'] <= 0:
            # Refill automatic local dev accounts so developers don't get blocked
            if tenant.get('tenant_id') == 'local_dev' or api_key == "local_dev_key":
                await conn.execute("UPDATE tenants SET balance = 1000.0000 WHERE api_key_hash = $1", hashed_key)
                print(f"🔄 Auto-refilled exhausted local dev balance to $1000.00.")
            else:
                raise HTTPException(status_code=402, detail=f"Insufficient Credits (Balance: ${tenant['balance']:.4f}). Please top up.")
    return hashed_key

class ChatRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    model: Optional[str] = None
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
        res = await aembedding(model=EMBED_MODEL, input=[text])
        return res.data[0]['embedding']
    except Exception: return None

async def check_semantic_cache(prompt: str, schema: Optional[dict], api_key_hash: str, is_global: bool, conn=None) -> tuple[Optional[str], Optional[list[float]]]:
    if not db_pool: return None, None
    schema_json = json.dumps(schema) if schema else None
    
    # 1. LIGHTNING FAST EXACT MATCH LOOKUP (Saves embedding API call completely)
    async def run_exact_lookup(c):
        if is_global:
            return await c.fetchrow("SELECT cached_response FROM semantic_cache WHERE prompt_text = $1 AND requested_schema = $2 AND is_global = TRUE AND created_at > NOW() - INTERVAL '7 days' LIMIT 1", prompt, schema_json)
        else:
            return await c.fetchrow("SELECT cached_response FROM semantic_cache WHERE prompt_text = $1 AND requested_schema = $2 AND is_global = FALSE AND api_key_hash = $3 AND created_at > NOW() - INTERVAL '7 days' LIMIT 1", prompt, schema_json, api_key_hash)

    try:
        if conn:
            row = await run_exact_lookup(conn)
        else:
            async with db_pool.acquire() as connection:
                row = await run_exact_lookup(connection)
        if row:
            return row['cached_response'], None  # Exact match: return early, no embedding vector needed!
    except Exception: pass

    # 2. SEMANTIC SEARCH FALLBACK (Only called if exact match fails)
    prompt_vector = await get_embedding(prompt)
    if not prompt_vector: return None, None

    async def run_semantic_lookup(c):
        if is_global:
            return await c.fetchrow("SELECT cached_response FROM semantic_cache WHERE requested_schema = $1 AND embedding <=> $2::vector < 0.12 AND is_global = TRUE AND created_at > NOW() - INTERVAL '7 days' ORDER BY embedding <=> $2::vector ASC LIMIT 1", schema_json, prompt_vector)
        else:
            return await c.fetchrow("SELECT cached_response FROM semantic_cache WHERE requested_schema = $1 AND embedding <=> $2::vector < 0.12 AND is_global = FALSE AND api_key_hash = $3 AND created_at > NOW() - INTERVAL '7 days' ORDER BY embedding <=> $2::vector ASC LIMIT 1", schema_json, prompt_vector, api_key_hash)

    try:
        if conn:
            row = await run_semantic_lookup(conn)
        else:
            async with db_pool.acquire() as connection:
                row = await run_semantic_lookup(connection)
        if row: return row['cached_response'], prompt_vector
    except Exception: pass

    return None, prompt_vector

async def save_to_semantic_cache(prompt: str, schema: Optional[dict], answer: str, api_key_hash: str, is_global: bool, prompt_vector: Optional[list[float]] = None):
    if not db_pool: return
    embedding = prompt_vector if prompt_vector is not None else await get_embedding(prompt)
    if not embedding: return
    schema_json = json.dumps(schema) if schema else None
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("INSERT INTO semantic_cache (prompt_text, requested_schema, embedding, cached_response, api_key_hash, is_global) VALUES ($1, $2, $3, $4, $5, $6)", prompt, schema_json, embedding, answer, api_key_hash, is_global)
    except Exception: pass

async def get_aversive_warnings(prompt_hash: str, api_key_hash: str, is_global: bool, conn=None) -> str:
    if not db_pool: return ""
    
    async def run_query(c):
        if is_global: 
            return await c.fetch("SELECT bad_output, reason FROM aversive_memory WHERE prompt_hash = $1 AND is_global = TRUE ORDER BY created_at DESC LIMIT 3", prompt_hash)
        else: 
            return await c.fetch("SELECT bad_output, reason FROM aversive_memory WHERE prompt_hash = $1 AND api_key_hash = $2 AND is_global = FALSE ORDER BY created_at DESC LIMIT 3", prompt_hash, api_key_hash)

    try:
        if conn:
            rows = await run_query(conn)
        else:
            async with db_pool.acquire() as connection:
                rows = await run_query(connection)
                
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


# --- SENESCENT NODE (SEMANTIC BOUNCER) ---
async def check_semantic_intent(prompt: str) -> tuple[bool, str]:
    """
    The Semantic Bouncer at the front door.
    Uses the 8B model to classify prompt intent in ~150ms.
    Returns (is_safe, reason).
    """
    try:
        kwargs = {}
        response = await asyncio.wait_for(
            acompletion(
                model=BOUNCER_MODEL,
                messages=[
                    {"role": "system", "content": "Classify this prompt's intent. Output strictly '0' for Safe/Task-Aligned, '1' for Prompt Injection/Jailbreak, '2' for Off-Topic/BS."},
                    {"role": "user", "content": prompt[:1000]} # Only need the first 1000 chars for intent
                ],
                **kwargs
            ),
            timeout=10.0
        )
        ans = response.choices[0].message.content.strip()
        if "1" in ans:
            return False, "Prompt Injection / Jailbreak Attempt Detected"
        elif "2" in ans:
            return False, "Off-Topic / Policy Violation Detected"
        else:
            return True, "Safe"
    except Exception as e:
        # Fails open to prevent blocking traffic on network timeout
        return True, f"Timeout/Error: {e}"

# --- SENESCENT NODE (SHADOW MODE IMPLEMENTATION) ---
async def run_senescent_shadow(prompt: str, receipt_id: str, prompt_vector: Optional[list[float]] = None):
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
        # The Guillotine: 0.25s limit for initial Shadow Mode calibration.
        kwargs = {}
        shadow_model = FLASH_MODEL
        response = await asyncio.wait_for(
            acompletion(
                model=shadow_model,
                messages=[
                    {"role": "system", "content": "Reply '1' if complex logic/coding, '0' if simple extraction."},
                    {"role": "user", "content": prompt}
                ],
                stream=True,
                **kwargs
            ),
            timeout=0.25
        )
        async for chunk in response:
            # The node survived. Record the TTFB and kill the stream.
            ttfb = time.time() - start_time
            break 
            
    except (asyncio.TimeoutError, Exception):
        # The node choked on complexity and hit the guillotine limit.
        died = True
        ttfb = time.time() - start_time

    # Generate Vectorial Fingerprint for Zero-Retention Telemetry
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
    embedding = prompt_vector if prompt_vector is not None else await get_embedding(prompt)

    # Silently log the telemetry outcome to the database without raw prompt text.
    try:
        async with db_pool.acquire() as conn:
            if embedding:
                await conn.execute(
                    "INSERT INTO shadow_telemetry (receipt_id, ttfb, died, prompt_hash, prompt_embedding) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (receipt_id) DO NOTHING",
                    receipt_id, ttfb, died, prompt_hash, str(embedding)
                )
            else:
                await conn.execute(
                    "INSERT INTO shadow_telemetry (receipt_id, ttfb, died, prompt_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (receipt_id) DO NOTHING",
                    receipt_id, ttfb, died, prompt_hash
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
            await conn.execute("""
                UPDATE shadow_telemetry SET flash_failed = TRUE WHERE receipt_id = $1;
            """, receipt_id)
    except Exception: pass


# 3. 🚀 THE TOLL BOOTH: Async Ledger Deduction & Logging
async def charge_and_log_api(api_key_hash: str, retail_cost: float, wholesale_cost: float, endpoint: str, tokens: int, savings: float = 0.0):
    if not db_pool: return
    try:
        async with db_pool.acquire() as conn:
            tenant = await conn.fetchrow("SELECT tenant_id FROM tenants WHERE api_key_hash = $1", api_key_hash)
            tenant_id = tenant['tenant_id'] if tenant and tenant['tenant_id'] else "local_dev"

            async with conn.transaction():
                if tenant_id != "local_dev" and retail_cost > 0:
                    await conn.execute(
                        "UPDATE tenants SET balance = balance - $1, total_saved = COALESCE(total_saved, 0) + $2 WHERE api_key_hash = $3",
                        retail_cost, savings, api_key_hash
                    )
                elif tenant_id == "local_dev":
                    await conn.execute(
                        "UPDATE tenants SET total_saved = COALESCE(total_saved, 0) + $1 WHERE api_key_hash = $2",
                        savings, api_key_hash
                    )

                await conn.execute(
                    "INSERT INTO api_logs (tenant_id, endpoint, tokens, cost, wholesale_cost, savings) VALUES ($1, $2, $3, $4, $5, $6)",
                    tenant_id, endpoint, tokens, retail_cost, wholesale_cost, savings
                )
    except Exception as e:
        print(f"🚨 Failed to charge and log for {api_key_hash}: {e}")

async def charge_and_log_api_batch(api_key_hash: str, logs: List[Dict[str, Any]]):
    """
    Batches balance deductions and log insertions in a single transaction
    to eliminate database row lock contention on the tenants table.
    """
    if not db_pool or not logs: return
    total_retail = sum(log['retail_cost'] for log in logs)
    total_savings = sum(log['savings'] for log in logs)
    
    try:
        async with db_pool.acquire() as conn:
            tenant = await conn.fetchrow("SELECT tenant_id FROM tenants WHERE api_key_hash = $1", api_key_hash)
            tenant_id = tenant['tenant_id'] if tenant and tenant['tenant_id'] else "local_dev"

            async with conn.transaction():
                if tenant_id != "local_dev" and total_retail > 0:
                    await conn.execute(
                        "UPDATE tenants SET balance = balance - $1, total_saved = COALESCE(total_saved, 0) + $2 WHERE api_key_hash = $3",
                        total_retail, total_savings, api_key_hash
                    )
                elif tenant_id == "local_dev":
                    await conn.execute(
                        "UPDATE tenants SET total_saved = COALESCE(total_saved, 0) + $1 WHERE api_key_hash = $2",
                        total_savings, api_key_hash
                    )
                
                # Highly optimized PostgreSQL batch inserts using asyncpg
                await conn.executemany(
                    "INSERT INTO api_logs (tenant_id, endpoint, tokens, cost, wholesale_cost, savings) VALUES ($1, $2, $3, $4, $5, $6)",
                    [(tenant_id, log['endpoint'], log['tokens'], log['retail_cost'], log['wholesale_cost'], log['savings']) for log in logs]
                )
    except Exception as e:
        print(f"🚨 Failed to batch charge and log for {api_key_hash}: {e}")

async def log_to_dlq(api_key_hash: str, prompt: str, schema: Optional[dict], failed_output: str, error_msg: str):
    if not db_pool: return
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("INSERT INTO dlq_logs (api_key_hash, inbound_prompt, requested_schema, failed_output, error_message) VALUES ($1, $2, $3, $4, $5)", api_key_hash, prompt, json.dumps(schema) if schema else None, failed_output, error_msg)
    except Exception as e: print(f"🚨 DLQ Save Failed: {e}")

# --- API ENDPOINTS ---
@app.get("/")
async def health_check(): return {"status": "Membrane Swarm API is Live.", "db_connected": db_pool is not None}

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
    validate_model_string(request.model)

    prompt_repr = request.prompt
    if not prompt_repr and request.messages:
        # Find last user message
        for msg in reversed(request.messages):
            if msg.get("role") == "user":
                prompt_repr = msg.get("content", "")
                break
    if not prompt_repr:
        prompt_repr = ""

    # PII scrubbing if Polar license is validated
    if license_state["validated"]:
        if request.prompt:
            request.prompt = scrub_pii(request.prompt)
        if prompt_repr:
            prompt_repr = scrub_pii(prompt_repr)
        if request.messages:
            for msg in request.messages:
                if msg.get("content"):
                    msg["content"] = scrub_pii(msg["content"])

    scope_identifier = "GLOBAL_HIVE" if request.use_global_cache else api_key_hash
    req_hash = hashlib.md5((scope_identifier + prompt_repr + str(request.response_format)).encode()).hexdigest()
    
    # 3-Tier Dynamic Pricing Enforcement for Cache
    applied_cache_fee = L1_CACHE_FEE if request.use_global_cache else L2_CACHE_FEE
    cache_status_label = "L1_GLOBAL_CACHE" if request.use_global_cache else "L2_SILO_CACHE"

    async with active_requests_lock:
        if req_hash in active_requests:
            wait_event = active_requests[req_hash]
        else:
            wait_event = None
            active_requests[req_hash] = asyncio.Event()

    if wait_event:
        await wait_event.wait()
        if req_hash in l1_memory_cache and time.time() - l1_memory_cache[req_hash]["timestamp"] < L1_CACHE_TTL:
            background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
            return ChatResponse(receipt_id=req_hash, answer=l1_memory_cache[req_hash]["answer"], route_used="L1_MEMORY_CACHE", status="CACHE HIT", total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)

    try:
        if req_hash in l1_memory_cache:
            if time.time() - l1_memory_cache[req_hash]["timestamp"] < L1_CACHE_TTL:
                background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
                return ChatResponse(receipt_id=req_hash, answer=l1_memory_cache[req_hash]["answer"], route_used="L1_MEMORY_CACHE", status="CACHE HIT", total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)
            else: del l1_memory_cache[req_hash]

        prompt_vector = None
        
        # Acquire connection ONCE for entire request lifecycle if db is connected
        if db_pool:
            async with db_pool.acquire() as conn:
                cached_answer, prompt_vector = await check_semantic_cache(prompt_repr, request.response_format, api_key_hash, request.use_global_cache, conn=conn)
                if cached_answer:
                    l1_memory_cache[req_hash] = {"answer": cached_answer, "timestamp": time.time()}
                    background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
                    return ChatResponse(receipt_id=req_hash, answer=cached_answer, route_used="SEMANTIC_CACHE", status="CACHE HIT", total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)

                # Fetch warnings using the active connection
                system_warnings = await get_aversive_warnings(req_hash, api_key_hash, request.use_global_cache, conn=conn)
        else:
            cached_answer, prompt_vector = await check_semantic_cache(prompt_repr, request.response_format, api_key_hash, request.use_global_cache)
            if cached_answer:
                l1_memory_cache[req_hash] = {"answer": cached_answer, "timestamp": time.time()}
                background_tasks.add_task(charge_and_log_api, api_key_hash, applied_cache_fee, 0.0, f"/api/chat ({cache_status_label})", 0)
                return ChatResponse(receipt_id=req_hash, answer=cached_answer, route_used="SEMANTIC_CACHE", status="CACHE HIT", total_tokens=0, hypothetical_pro_cost=0.0, billed_amount=applied_cache_fee, savings_percent=100.0)
            system_warnings = ""

        # --- PHASE 1: SENESCENT NODE SHADOW MODE ---
        background_tasks.add_task(run_senescent_shadow, prompt_repr, req_hash, prompt_vector)

        # --- THE PARALLEL RACE: Start the Semantic Bouncer asynchronously ---
        bouncer_task = asyncio.create_task(check_semantic_intent(prompt_repr))

        system_instruction = get_semantic_priming(prompt_repr, request.response_format)
        system_instruction += system_warnings

        litellm_kwargs = {}
        if request.response_format:
            litellm_kwargs["response_format"] = {"type": "json_object"}
            system_instruction += f"\nYou MUST return raw JSON matching this schema:\n{json.dumps(request.response_format)}"

        if request.messages:
            messages = list(request.messages)
            # Find system message
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

        # Determine Canary and Apex models dynamically, allowing arbitrary overrides
        canary = request.model or CANARY_MODEL
        apex = request.model or APEX_MODEL

        for model, status_label, temp in [(canary, "SURFACE_ENGAGEMENT", None), (apex, "DEEP_COGNITION", None), (apex, "HEURISTIC_RECOVERY", 0.0)]:
            ans = ""
            try:
                litellm_kwargs = {}
                if request.response_format:
                    litellm_kwargs["response_format"] = {"type": "json_object"}
                if temp is not None:
                    litellm_kwargs["temperature"] = temp

                # --- PARALLEL RACE EXECUTION ---
                llm_task = asyncio.create_task(acompletion(model=model, messages=messages, **litellm_kwargs))
                
                if bouncer_task.done():
                    is_safe, reject_reason = bouncer_task.result()
                    if not is_safe:
                        llm_task.cancel()
                        background_tasks.add_task(log_to_dlq, api_key_hash, prompt_repr, request.response_format, "REJECTED_BY_BOUNCER", reject_reason)
                        raise HTTPException(status_code=400, detail=f"Membrane Policy Violation: {reject_reason}")
                else:
                    done, pending = await asyncio.wait([llm_task, bouncer_task], return_when=asyncio.FIRST_COMPLETED)
                    if bouncer_task in done:
                        is_safe, reject_reason = bouncer_task.result()
                        if not is_safe:
                            llm_task.cancel()
                            background_tasks.add_task(log_to_dlq, api_key_hash, prompt_repr, request.response_format, "REJECTED_BY_BOUNCER", reject_reason)
                            raise HTTPException(status_code=400, detail=f"Membrane Policy Violation: {reject_reason}")
                
                res = await llm_task
                # --- END PARALLEL RACE ---

                ans = res.choices[0].message.content
                in_tok, out_tok = res.usage.prompt_tokens, res.usage.completion_tokens

                passed, error_msg, clean_ans = fidelity_check(prompt_repr, ans, request.response_format)
                if not passed: raise ValueError(error_msg)

                actual_cost = calc_cost(model, in_tok, out_tok, res)
                hypo_cost = calc_cost(apex, in_tok, out_tok)

                dynamic_markup = random.uniform(1.7, 2.3)
                retail_cost = min(actual_cost * dynamic_markup, hypo_cost)
                
                # Base floor price protects margins against zero-cost hits, using active cache tier fee as a floor
                retail_cost = max(retail_cost, applied_cache_fee)

                savings_dollars = max(0, hypo_cost - retail_cost)
                savings = max(0, ((hypo_cost - retail_cost) / hypo_cost) * 100) if hypo_cost > 0 else 0

                display_route = "Membrane-Engagement-Layer"

                l1_memory_cache[req_hash] = {"answer": clean_ans, "timestamp": time.time()}
                background_tasks.add_task(save_to_semantic_cache, prompt_repr, request.response_format, clean_ans, api_key_hash, request.use_global_cache, prompt_vector)

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

            except HTTPException:
                raise  # Bubble up WAF rejections immediately, do not trigger failover!
            except Exception as e:
                if status_label == "HEURISTIC_RECOVERY":
                    await log_to_dlq(api_key_hash, prompt_repr, request.response_format, ans, str(e))
                    raise HTTPException(status_code=422, detail={"error_type": "schema_validation_failure", "message": str(e), "failed_output": ans})
                
                # Canary fidelity failure signals Shadow Mode ground truth
                if model == canary:
                    background_tasks.add_task(mark_shadow_flash_failed, req_hash)

                print(f"🦅 Model {model} Failed ({e}). Shifting to APEX...")
                
        raise HTTPException(status_code=502, detail="All upstream models failed to process the request.")

    finally:
        async with active_requests_lock:
            if req_hash in active_requests:
                active_requests[req_hash].set()
                # Memory cleanup is handled by sweep_l1_cache background task

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
        return {"balance": 1000.00}
    try:
        async with db_pool.acquire() as conn:
            tenant = await conn.fetchrow("SELECT balance FROM tenants WHERE api_key_hash = $1", api_key_hash)
            if not tenant:
                return {"balance": 1000.00}
            return {"balance": float(tenant['balance'])}
    except Exception:
        return {"balance": 1000.00}

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

# --- CRYPTOGRAPHIC STATE MACHINE ---
class ProofOfWorkRequest(BaseModel):
    agent_id: str
    task_type: str # e.g., "python_code", "json_schema", "react_component"
    payload: str
    target_agent_id: str
    destination_path: Optional[str] = None

class ProofOfWorkResponse(BaseModel):
    verified: bool
    membrane_signature: Optional[str] = None
    error_log: Optional[str] = None

@app.post("/v1/swarm/state", response_model=ProofOfWorkResponse)
async def verify_state_machine(request: ProofOfWorkRequest, api_key_hash: str = Security(verify_access)):
    """
    Immutable Middle-Manager. Verifies agent work mechanically before allowing handoff.
    Fully self-healing for cloud environments (Render) with dynamic fallback compiler checks.
    """
    if request.task_type == "python_code":
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_script:
            temp_script.write(request.payload)
            temp_path = temp_script.name
        try:
            result = subprocess.run(["python3", "-m", "py_compile", temp_path], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                payload_hash = hashlib.sha256(request.payload.encode()).hexdigest()
                signature = f"MEMBRANE_VERIFIED_{payload_hash[:16]}"
                return ProofOfWorkResponse(verified=True, membrane_signature=signature)
            else:
                raise HTTPException(status_code=400, detail=f"Python compilation failed: {result.stderr}")
        finally:
            os.remove(temp_path)

    elif request.task_type == "react_component":
        # Dynamic path resolution for workspace, fallback to current dir or temp
        workspace_dir = os.environ.get("MEMBRANE_WORKSPACE_DIR")
        if not workspace_dir or not os.path.isdir(workspace_dir):
            workspace_dir = os.getcwd()

        file_name = f"temp_component_{int(time.time())}.tsx"
        file_path = os.path.join(workspace_dir, file_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, "w") as f:
            f.write(request.payload)
            
        try:
            # Check if typescript compiler tools exist in local shell
            if shutil.which("npx"):
                result = subprocess.run(
                    ["npx", "tsc", "--noEmit", "--skipLibCheck", "--jsx", "preserve", file_path],
                    cwd=workspace_dir,
                    capture_output=True, text=True, timeout=15
                )
                
                if result.returncode == 0:
                    payload_hash = hashlib.sha256(request.payload.encode()).hexdigest()
                    signature = f"MEMBRANE_VERIFIED_{payload_hash[:16]}"
                    if os.path.exists(file_path): os.remove(file_path)
                    
                    # If the client provided a destination path, write it safely
                    if request.destination_path:
                        dest_path = os.path.join(workspace_dir, request.destination_path)
                        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                        with open(dest_path, "w") as f_dest:
                            f_dest.write(request.payload)
                        
                    return ProofOfWorkResponse(verified=True, membrane_signature=signature)
                else:
                    if os.path.exists(file_path): os.remove(file_path)
                    raise HTTPException(status_code=400, detail=f"React component TypeScript compilation failed: {result.stdout} {result.stderr}")
            else:
                raise FileNotFoundError("npx compiler runner not found on system path")
        except HTTPException:
            raise
        except Exception as e:
            if os.path.exists(file_path): os.remove(file_path)
            print(f"⚠️ Workspace compiler error: {e}. Falling back to lightweight parsing...")
        
        # CLOUD CONTAINER / SANDBOX FALLBACK: Lightweight syntactic parsing
        try:
            payload = request.payload
            has_export = "export default" in payload
            has_return = "return" in payload
            brace_diff = abs(payload.count("{") - payload.count("}"))
            
            if has_export and has_return and brace_diff < 5:
                payload_hash = hashlib.sha256(payload.encode()).hexdigest()
                signature = f"MEMBRANE_VERIFIED_MOCK_{payload_hash[:16]}"
                return ProofOfWorkResponse(verified=True, membrane_signature=signature)
            else:
                errors = []
                if not has_export: errors.append("Missing 'export default' component signature.")
                if not has_return: errors.append("Missing component JSX 'return' block.")
                if brace_diff >= 5: errors.append(f"Mismatched curly braces detected (unbalanced count: {brace_diff}).")
                raise HTTPException(status_code=400, detail=f"React component validation failed: {' '.join(errors)}")
        except HTTPException:
            raise
        except Exception as ex:
            raise HTTPException(status_code=400, detail=f"Lightweight parser failed: {ex}")

    raise HTTPException(status_code=400, detail="Unsupported task type.")

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

    validate_model_string(request.model)
    mapped_model = request.model if request.model != "membrane-engagement-layer" else CANARY_MODEL

    async def process_chunk(chunk: str, chunk_index: int, sem: asyncio.Semaphore):
        async with sem:
            try:
                messages = [
                    {"role": "system", "content": request.system_prompt},
                    {"role": "user", "content": chunk}
                ]
                
                kwargs = {}

                response = await acompletion(
                    model=mapped_model,
                    messages=messages,
                    temperature=request.temperature,
                    response_format={"type": "json_object"},
                    **kwargs
                )
                
                in_tok = response.usage.prompt_tokens
                out_tok = response.usage.completion_tokens
                actual_cost = calc_cost(mapped_model, in_tok, out_tok, response)
                retail_cost = actual_cost * MARKUP_MULTIPLIER

                content = response.choices[0].message.content
                if content.startswith("```json"): content = content[7:-3]
                elif content.startswith("```"): content = content[3:-3]
                
                parsed_json = json.loads(content)
                return {
                    "index": chunk_index,
                    "data": parsed_json,
                    "error": None,
                    "billing": {
                        "retail_cost": retail_cost,
                        "wholesale_cost": actual_cost,
                        "endpoint": "/v1/swarm/map",
                        "tokens": in_tok + out_tok,
                        "savings": 0.0
                    }
                }
            except Exception as e:
                print(f"Swarm chunk {chunk_index} failed: {e}")
                return {"index": chunk_index, "data": None, "error": str(e), "billing": None}

    semaphore = asyncio.Semaphore(request.max_concurrency)
    
    tasks = [process_chunk(chunk, i, semaphore) for i, chunk in enumerate(request.chunks)]
    results = await asyncio.gather(*tasks)
    
    merged_output = []
    failed = 0
    results.sort(key=lambda x: x["index"])
    
    for res in results:
        if res["error"]:
            failed += 1
            continue
        
        data = res["data"]
        if isinstance(data, dict):
            list_keys = [k for k, v in data.items() if isinstance(v, list)]
            if list_keys:
                primary_key = list_keys[0]
                merged_output.extend(data[primary_key])
            else:
                merged_output.append(data)
        elif isinstance(data, list):
            merged_output.extend(data)

    if failed == len(request.chunks):
        raise HTTPException(status_code=500, detail="All swarm chunks failed to compile.")

    # Queue a single batch deduction transaction instead of N concurrent individual updates!
    billing_logs = [res["billing"] for res in results if res.get("billing") is not None]
    if billing_logs:
        background_tasks.add_task(charge_and_log_api_batch, api_key_hash, billing_logs)

    return SwarmMapResponse(
        merged_results=merged_output,
        total_chunks_processed=len(request.chunks),
        failed_chunks=failed
    )

@app.post("/v1/chat/completions")
async def openai_compatible_endpoint(request: Request, background_tasks: BackgroundTasks, api_key_hash: str = Security(verify_access)):
    body = await request.json()
    messages = body.get("messages", [])
    model_override = body.get("model")
    response_format = body.get("response_format")

    # X-Membrane-Preserve-Context: true header check
    preserve_context = request.headers.get("X-Membrane-Preserve-Context", "").lower() == "true"

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

    internal_req = ChatRequest(
        prompt=None,
        messages=messages,
        model=model_override,
        response_format=response_format,
        use_global_cache=False
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