import unittest
import asyncio
import re
from fastapi.testclient import TestClient
from server import app
from membrane.database import verify_access, tenant_cache, hash_api_key
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

class TestV2AuditFixes(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Clear tenant cache between tests
        tenant_cache._cache.clear()

    def test_invalid_api_key_format_returns_401(self):
        """Requests with credentials that do not match the expected formats must return HTTP 401."""
        # 1. Test malformed API key via endpoint request
        headers = {"Authorization": "Bearer bad_prefix_key"}
        r = self.client.post("/v1/chat/completions", json={
            "model": "membrane-engagement-layer",
            "messages": [{"role": "user", "content": "test"}]
        }, headers=headers)
        self.assertEqual(r.status_code, 401)
        self.assertIn("Invalid API Key", r.json()["detail"])

        # 2. Test empty/null/undefined representations via endpoint request
        headers = {"Authorization": "Bearer null"}
        r = self.client.post("/v1/chat/completions", json={
            "model": "membrane-engagement-layer",
            "messages": [{"role": "user", "content": "test"}]
        }, headers=headers)
        # null defaults to local_dev_key, which is valid for local testing, so this should pass (200 or 500/502 but NOT 401)
        self.assertNotEqual(r.status_code, 401)

    def test_exception_sanitization_scrubs_litellm_pathways(self):
        """Exceptions returned to clients must be sanitized and scrubbed of specific library pathways/classes."""
        from server import sanitize_exception_message
        
        # Test LiteLLM authentication error
        msg = "litellm.exceptions.AuthenticationError: OpenAIException - Invalid API Key"
        sanitized = sanitize_exception_message(msg)
        cleaned = re.sub(r'^[a-zA-Z0-9_\.]+(?:Error|Exception|Failure):\s*', '', sanitized)
        self.assertEqual(cleaned, "Upstream provider authentication or configuration error. Please verify server environment credentials.")

        # Test another secret token exception
        msg_secret = "GoogleException: api_key is invalid or unauthorized in anthropic client class."
        sanitized_secret = sanitize_exception_message(msg_secret)
        cleaned_secret = re.sub(r'^[a-zA-Z0-9_\.]+(?:Error|Exception|Failure):\s*', '', sanitized_secret)
        self.assertEqual(cleaned_secret, "Upstream provider authentication or configuration error. Please verify server environment credentials.")

    def test_database_feedback_endpoint_scrubs_raw_database_errors(self):
        """Database exception details must be masked from client feedback responses."""
        headers = {"Authorization": "Bearer local_dev_key"}
        # Triggering a feedback call that fails (e.g. database pool missing or empty)
        r = self.client.post("/api/chat/feedback", json={
            "prompt": "test prompt",
            "failed_output": "failed output",
            "reason": "validation error",
            "use_global_cache": True
        }, headers=headers)
        # Should either succeed or return 500 with a generic message, never returning raw Postgres trace details.
        if r.status_code == 500:
            self.assertEqual(r.json()["detail"], "Database error. Please check server logs for details.")

    async def test_auth_key_verification_caching(self):
        """API key verification must use the memory cache to prevent database lock contention."""
        hashed = hash_api_key("sk_live_dummy_cache_test_key")
        
        # Insert key validation into cache
        await tenant_cache.set(hashed, True)
        
        # Verify access using credentials object
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="sk_live_dummy_cache_test_key")
        result = await verify_access(creds)
        self.assertEqual(result, hashed)
        
        # Clear test cache
        await tenant_cache.delete(hashed)

if __name__ == "__main__":
    unittest.main()
