import unittest
from fastapi import HTTPException
from membrane import security

class TestSecurity(unittest.TestCase):
    def test_scrub_pii(self):
        # Email scrubbing
        self.assertEqual(
            security.scrub_pii("Contact me at test@example.com"),
            "Contact me at [REDACTED_EMAIL]"
        )
        # Phone scrubbing
        self.assertEqual(
            security.scrub_pii("Call 123-456-7890"),
            "Call [REDACTED_PHONE]"
        )
        # IP scrubbing
        self.assertEqual(
            security.scrub_pii("Server is at 192.168.1.1"),
            "Server is at [REDACTED_IP]"
        )
        # Recursive dict & list scrubbing
        data = {
            "email": "test@example.com",
            "nested": ["Call 123-456-7890", {"ip": "192.168.1.1"}]
        }
        expected = {
            "email": "[REDACTED_EMAIL]",
            "nested": ["Call [REDACTED_PHONE]", {"ip": "[REDACTED_IP]"}]
        }
        self.assertEqual(security.scrub_pii(data), expected)

    def test_get_safe_destination_valid(self):
        # Setup temporary directories for sandboxing verification
        import tempfile
        import shutil
        import os
        
        tmp_dir = tempfile.mkdtemp()
        sandbox_dir = os.path.join(tmp_dir, "sandbox_scratch")
        os.makedirs(sandbox_dir, exist_ok=True)
        
        try:
            dest = security.get_safe_destination("some_file.txt", tmp_dir)
            self.assertEqual(dest, os.path.realpath(os.path.join(sandbox_dir, "some_file.txt")))
        finally:
            shutil.rmtree(tmp_dir)

    def test_get_safe_destination_invalid(self):
        import tempfile
        import shutil
        import os
        
        tmp_dir = tempfile.mkdtemp()
        sandbox_dir = os.path.join(tmp_dir, "sandbox_scratch")
        os.makedirs(sandbox_dir, exist_ok=True)
        
        try:
            # Traversal attempts should raise HTTPException
            with self.assertRaises(HTTPException):
                security.get_safe_destination("../outside.txt", tmp_dir)
        finally:
            shutil.rmtree(tmp_dir)

    def test_validate_model_string_valid(self):
        # Should not raise exception
        security.validate_model_string("gemini/gemini-2.5-flash")
        security.validate_model_string("openai/gpt-4o")
        security.validate_model_string("gemini-1.5-pro")

    def test_validate_model_string_invalid(self):
        # Invalid format should raise HTTPException
        with self.assertRaises(HTTPException):
            security.validate_model_string("bad$model_string")
        with self.assertRaises(HTTPException):
            security.validate_model_string("a")

    def test_sanitize_exception_message(self):
        from server import sanitize_exception_message
        
        # Test non-sensitive message passes through
        self.assertEqual(
            sanitize_exception_message("A regular validation error occurred: field is required"),
            "A regular validation error occurred: field is required"
        )
        
        # Test sensitive message is sanitized
        sensitive_msg = "litellm.InternalServerError: Missing credentials. Please set OPENAI_API_KEY"
        sanitized_msg = sanitize_exception_message(sensitive_msg)
        self.assertIn("Upstream provider authentication or configuration error", sanitized_msg)
        self.assertNotIn("litellm", sanitized_msg.lower())
        self.assertNotIn("openai_api_key", sanitized_msg.lower())

if __name__ == "__main__":
    unittest.main()
