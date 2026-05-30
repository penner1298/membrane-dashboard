import unittest
from unittest.mock import AsyncMock, MagicMock
import hashlib
from fastapi import HTTPException
from membrane import database

class TestDatabase(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Reset global pool reference
        database.db_pool = None
        database.failed_auth_logs.clear()

    def test_hash_api_key(self):
        key = "test_key"
        expected = hashlib.sha256(key.encode()).hexdigest()
        self.assertEqual(database.hash_api_key(key), expected)

    async def test_verify_access_no_pool_defaults_to_local_dev(self):
        # When no credentials are provided, it should default to local_dev_key hash
        hashed = await database.verify_access(None)
        expected_hash = database.hash_api_key("local_dev_key")
        self.assertEqual(hashed, expected_hash)
        self.assertTrue(len(database.failed_auth_logs) > 0)
        self.assertEqual(database.failed_auth_logs[-1]["sanitized_api_key_repr"], "'local_dev_key'")

    async def test_verify_access_with_valid_prefix(self):
        # Test with credentials having sk_live_ prefix
        credentials = MagicMock()
        credentials.credentials = "sk_live_123456789"
        hashed = await database.verify_access(credentials)
        expected_hash = database.hash_api_key("sk_live_123456789")
        self.assertEqual(hashed, expected_hash)

    async def test_verify_access_with_invalid_credentials_defaults_to_local_dev(self):
        # Malformed credential structures should fallback to local_dev_key
        credentials = MagicMock()
        credentials.credentials = "[object Object]"
        hashed = await database.verify_access(credentials)
        expected_hash = database.hash_api_key("local_dev_key")
        self.assertEqual(hashed, expected_hash)

    async def test_verify_access_with_pool_fallback_and_new_tenant(self):
        # Mock database connection and pool to test tenant query and auto-provisioning
        mock_conn = AsyncMock()
        # First query (select tenants) returns None (no tenant)
        # Second query (select deprecated keys) returns None
        # Third query (insert new tenant) completes
        # Fourth query (select tenants again) returns a valid tenant record
        mock_conn.fetchrow.side_effect = [None, None, {"balance": 1000.0, "tenant_id": "local_dev_123"}]
        mock_conn.execute = AsyncMock()
        
        mock_pool = MagicMock()
        
        # Async context manager mock for pool.acquire()
        class AsyncContextManagerMock:
            async def __aenter__(self):
                return mock_conn
            async def __aexit__(self, exc_type, exc, tb):
                pass
                
        mock_pool.acquire.return_return_value = None
        mock_pool.acquire.side_effect = lambda: AsyncContextManagerMock()
        
        database.db_pool = mock_pool
        credentials = MagicMock()
        credentials.credentials = "sk_live_newtenantkey"
        
        hashed = await database.verify_access(credentials)
        self.assertEqual(hashed, database.hash_api_key("sk_live_newtenantkey"))
        
        # Verify database commands were called
        self.assertTrue(mock_conn.fetchrow.called)
        self.assertTrue(mock_conn.execute.called)

    async def test_verify_access_with_gemini_prefix(self):
        credentials = MagicMock()
        credentials.credentials = "AIzaSyCur0iK5vXOK-LnCzIeYLMj1shJBu8xjX4"
        hashed = await database.verify_access(credentials)
        expected_hash = database.hash_api_key("AIzaSyCur0iK5vXOK-LnCzIeYLMj1shJBu8xjX4")
        self.assertEqual(hashed, expected_hash)

    async def test_verify_access_with_openai_prefix(self):
        credentials = MagicMock()
        credentials.credentials = "sk-proj-1234567890abcdef"
        hashed = await database.verify_access(credentials)
        expected_hash = database.hash_api_key("sk-proj-1234567890abcdef")
        self.assertEqual(hashed, expected_hash)

if __name__ == "__main__":
    unittest.main()
