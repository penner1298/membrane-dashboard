import time
import json
import asyncio
import os
import math
from typing import Any, Dict, List, Optional, Tuple
from litellm import aembedding
from membrane.config import (
    EMBED_MODEL,
    MAX_L1_CACHE_SIZE,
    L1_CACHE_TTL,
)

# Global database pool reference, set dynamically at lifespan startup
db_pool: Optional[Any] = None

class BaseCache:
    async def get(self, key: str) -> Optional[Any]:
        raise NotImplementedError

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        raise NotImplementedError

    async def delete(self, key: str) -> None:
        raise NotImplementedError

    async def sweep(self) -> None:
        raise NotImplementedError

class InMemoryCache(BaseCache):
    def __init__(self, max_size: int = 10000, ttl: int = 300):
        self._cache = {}
        self.max_size = max_size
        self.ttl = ttl
        self.file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sandbox_scratch", "local_l1_cache.json")
        self._load_from_file()

    def _load_from_file(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r") as f:
                    self._cache = json.load(f)
            except Exception:
                pass

    def _save_to_file(self):
        try:
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            with open(self.file_path, "w") as f:
                json.dump(self._cache, f, indent=2)
        except Exception:
            pass

    async def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        item = self._cache[key]
        if time.time() - item["timestamp"] > self.ttl:
            del self._cache[key]
            self._save_to_file()
            return None
        return item["value"]

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        self._cache[key] = {
            "value": value,
            "timestamp": time.time()
        }
        if len(self._cache) > self.max_size:
            await self.sweep()
            if len(self._cache) > self.max_size:
                # Evict oldest entries
                keys_sorted = sorted(self._cache.keys(), key=lambda k: self._cache[k]["timestamp"])
                evict_count = max(1, len(keys_sorted) // 5)
                for k in keys_sorted[:evict_count]:
                    del self._cache[k]
        self._save_to_file()

    async def delete(self, key: str) -> None:
        if key in self._cache:
            del self._cache[key]
            self._save_to_file()

    async def sweep(self) -> None:
        if len(self._cache) == 0:
            return
        now = time.time()
        keys_to_del = [k for k, v in self._cache.items() if now - v["timestamp"] > self.ttl]
        for k in keys_to_del:
            del self._cache[k]
            
        # Hard limit eviction if still over max size
        if len(self._cache) > self.max_size:
            keys = list(self._cache.keys())
            for k in keys[:len(keys)//5]:
                del self._cache[k]
        self._save_to_file()

l1_memory_cache = InMemoryCache(max_size=MAX_L1_CACHE_SIZE, ttl=L1_CACHE_TTL)
active_requests: Dict[str, asyncio.Event] = {}
active_requests_lock = asyncio.Lock()

SEMANTIC_CACHE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "sandbox_scratch",
    "local_semantic_cache.json"
)

def load_local_semantic_cache() -> List[Dict[str, Any]]:
    if os.path.exists(SEMANTIC_CACHE_FILE):
        try:
            with open(SEMANTIC_CACHE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_local_semantic_cache(data: List[Dict[str, Any]]):
    try:
        os.makedirs(os.path.dirname(SEMANTIC_CACHE_FILE), exist_ok=True)
        with open(SEMANTIC_CACHE_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass

local_semantic_cache_db = load_local_semantic_cache()

async def sweep_l1_cache():
    from membrane.database import tenant_cache
    while True:
        try:
            await asyncio.sleep(L1_CACHE_TTL)
            await l1_memory_cache.sweep()
            try:
                await tenant_cache.sweep()
            except Exception as e:
                print(f"⚠️ Tenant cache sweep error: {e}")
                    
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

async def get_embedding(text: str) -> Optional[List[float]]:
    try:
        res = await aembedding(model=EMBED_MODEL, input=[text])
        return res.data[0]['embedding']
    except Exception:
        # Fall back to deterministic mock embedding to keep L2 semantic caching operational offline/depleted
        dimensions = 768
        vec = []
        for i in range(dimensions):
            # Deterministic pseudo-random number based on text and index
            import hashlib
            seed_str = f"{text}_{i}"
            h_val = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
            val = (h_val % 10000) / 10000.0 - 0.5  # between -0.5 and 0.5
            vec.append(val)
        # Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec


async def check_semantic_cache(
    prompt: str,
    schema: Optional[dict],
    api_key_hash: str,
    is_global: bool,
    conn: Optional[Any] = None
) -> Tuple[Optional[str], Optional[List[float]]]:
    schema_json = json.dumps(schema) if schema else None

    # --- Persistent Sandbox Cache Fallback if DB is Offline ---
    if not db_pool and not conn:
        print(f"🎫 Developer Cache Active: Checking local persistent L1/L2 semantic cache (is_global={is_global}).")
        
        # 1. Exact match lookup (L1)
        for entry in local_semantic_cache_db:
            # Check expiration (7 days TTL)
            if time.time() - entry.get("timestamp", 0) > 7 * 86400:
                continue
            if entry.get("prompt_text") == prompt and entry.get("requested_schema") == schema_json:
                if entry.get("is_global") == is_global or (not is_global and entry.get("api_key_hash") == api_key_hash):
                    print("🎯 L1 Exact Cache Match Hit! Skipping embedding generation.")
                    return entry["cached_response"], None

        # 2. Semantic vector matching (L2)
        prompt_vector = await get_embedding(prompt)
        if not prompt_vector:
            return None, None

        best_match = None
        min_distance = 1.0  # Cosine distance limit

        for entry in local_semantic_cache_db:
            if time.time() - entry.get("timestamp", 0) > 7 * 86400:
                continue
            if entry.get("requested_schema") == schema_json:
                if entry.get("is_global") == is_global or (not is_global and entry.get("api_key_hash") == api_key_hash):
                    v2 = entry.get("embedding")
                    if v2 and len(v2) == len(prompt_vector):
                        dot_product = sum(a * b for a, b in zip(prompt_vector, v2))
                        mag1 = math.sqrt(sum(a * a for a in prompt_vector))
                        mag2 = math.sqrt(sum(b * b for b in v2))
                        if mag1 and mag2:
                            similarity = dot_product / (mag1 * mag2)
                            distance = 1.0 - similarity
                            if distance < 0.12 and distance < min_distance:
                                min_distance = distance
                                best_match = entry["cached_response"]
        
        if best_match:
            print(f"🎯 L2 Semantic Cache Hit! (Cosine Distance: {min_distance:.4f})")
        return best_match, prompt_vector

    # --- Standard Postgres Logic ---
    schema_json = json.dumps(schema) if schema else None
    
    # 1. LIGHTNING FAST EXACT MATCH LOOKUP (Saves embedding API call completely)
    async def run_exact_lookup(c):
        if is_global:
            return await c.fetchrow(
                "SELECT cached_response FROM semantic_cache WHERE prompt_text = $1 AND requested_schema = $2 AND is_global = TRUE AND created_at > NOW() - INTERVAL '7 days' LIMIT 1",
                prompt, schema_json
            )
        else:
            return await c.fetchrow(
                "SELECT cached_response FROM semantic_cache WHERE prompt_text = $1 AND requested_schema = $2 AND is_global = FALSE AND api_key_hash = $3 AND created_at > NOW() - INTERVAL '7 days' LIMIT 1",
                prompt, schema_json, api_key_hash
            )

    try:
        if conn:
            row = await run_exact_lookup(conn)
        else:
            async with db_pool.acquire() as connection:
                row = await run_exact_lookup(connection)
        if row:
            return row['cached_response'], None  # Exact match: return early, no embedding vector needed!
    except Exception:
        pass

    # 2. SEMANTIC SEARCH FALLBACK (Only called if exact match fails)
    prompt_vector = await get_embedding(prompt)
    if not prompt_vector:
        return None, None

    async def run_semantic_lookup(c):
        if is_global:
            return await c.fetchrow(
                "SELECT cached_response FROM semantic_cache WHERE requested_schema = $1 AND embedding <=> $2::vector < 0.12 AND is_global = TRUE AND created_at > NOW() - INTERVAL '7 days' ORDER BY embedding <=> $2::vector ASC LIMIT 1",
                schema_json, prompt_vector
            )
        else:
            return await c.fetchrow(
                "SELECT cached_response FROM semantic_cache WHERE requested_schema = $1 AND embedding <=> $2::vector < 0.12 AND is_global = FALSE AND api_key_hash = $3 AND created_at > NOW() - INTERVAL '7 days' ORDER BY embedding <=> $2::vector ASC LIMIT 1",
                schema_json, prompt_vector, api_key_hash
            )

    try:
        if db_pool:
            async with db_pool.acquire() as connection:
                row = await run_semantic_lookup(connection)
        elif conn:
            row = await run_semantic_lookup(conn)
        else:
            row = None
        if row:
            return row['cached_response'], prompt_vector
    except Exception:
        pass

    return None, prompt_vector

async def save_to_semantic_cache(
    prompt: str,
    schema: Optional[dict],
    answer: str,
    api_key_hash: str,
    is_global: bool,
    prompt_vector: Optional[List[float]] = None
):
    schema_json = json.dumps(schema) if schema else None
    embedding = prompt_vector if prompt_vector is not None else await get_embedding(prompt)
    if not embedding:
        return

    if not db_pool:
        # Save to local persistent cache
        global local_semantic_cache_db
        if len(local_semantic_cache_db) >= 1000:
            local_semantic_cache_db.pop(0)
        
        # Remove any existing entry for the exact prompt and schema to prevent duplication
        local_semantic_cache_db = [
            e for e in local_semantic_cache_db 
            if not (e.get("prompt_text") == prompt and e.get("requested_schema") == schema_json)
        ]
        
        local_semantic_cache_db.append({
            "prompt_text": prompt,
            "requested_schema": schema_json,
            "embedding": embedding,
            "cached_response": answer,
            "api_key_hash": api_key_hash,
            "is_global": is_global,
            "timestamp": time.time()
        })
        save_local_semantic_cache(local_semantic_cache_db)
        print(f"💾 Saved entry to local persistent semantic cache (is_global={is_global}).")
        return

    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO semantic_cache (prompt_text, requested_schema, embedding, cached_response, api_key_hash, is_global) VALUES ($1, $2, $3, $4, $5, $6)",
                prompt, schema_json, embedding, answer, api_key_hash, is_global
            )
    except Exception:
        pass

