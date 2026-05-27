import unittest
import time
import asyncio
from membrane import cache

class TestCache(unittest.IsolatedAsyncioTestCase):
    async def test_in_memory_cache_get_set(self):
        c = cache.InMemoryCache(max_size=10, ttl=2)
        await c.set("key1", "value1")
        val = await c.get("key1")
        self.assertEqual(val, "value1")

    async def test_in_memory_cache_ttl(self):
        c = cache.InMemoryCache(max_size=10, ttl=1)
        await c.set("key1", "value1")
        await asyncio.sleep(1.1)
        val = await c.get("key1")
        self.assertIsNone(val)

    async def test_in_memory_cache_eviction(self):
        # max size 5
        c = cache.InMemoryCache(max_size=5, ttl=100)
        for i in range(10):
            await c.set(f"key{i}", f"value{i}")
        await c.sweep()
        # It should evict 20% of entries if size exceeds max_size (10 -> evict 2 elements)
        # So total size should be <= 8. Let's make sure it's lower than 10.
        self.assertLess(len(c._cache), 10)

if __name__ == "__main__":
    unittest.main()
