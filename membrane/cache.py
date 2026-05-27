import time
import json
import asyncio
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

    async def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        item = self._cache[key]
        if time.time() - item["timestamp"] > self.ttl:
            del self._cache[key]
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


    async def delete(self, key: str) -> None:
        if key in self._cache:
            del self._cache[key]

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

l1_memory_cache = InMemoryCache(max_size=MAX_L1_CACHE_SIZE, ttl=L1_CACHE_TTL)
active_requests: Dict[str, asyncio.Event] = {}
active_requests_lock = asyncio.Lock()

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
        return None

async def check_semantic_cache(
    prompt: str,
    schema: Optional[dict],
    api_key_hash: str,
    is_global: bool,
    conn: Optional[Any] = None
) -> Tuple[Optional[str], Optional[List[float]]]:
    if not db_pool and not conn:
        return None, None
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
    if not db_pool:
        return
    embedding = prompt_vector if prompt_vector is not None else await get_embedding(prompt)
    if not embedding:
        return
    schema_json = json.dumps(schema) if schema else None
    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO semantic_cache (prompt_text, requested_schema, embedding, cached_response, api_key_hash, is_global) VALUES ($1, $2, $3, $4, $5, $6)",
                prompt, schema_json, embedding, answer, api_key_hash, is_global
            )
    except Exception:
        pass
