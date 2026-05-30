import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from membrane import telemetry

class TestTelemetry(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        telemetry.db_pool = None

    def test_get_semantic_priming(self):
        narrative_restriction = (
            "\n[SYSTEM DIRECTIVE: You are acting as a strict data extraction proxy. "
            "Do NOT include any conversational preamble, markdown narrative explanation, "
            "notes, disclaimers, or chat feedback. Output ONLY the raw data requested (e.g. JSON array/object or direct plain text list). "
            "Your response MUST start directly with the first character of the requested data payload (e.g. `[` or `{` or list items) "
            "and stop immediately after the data concludes.]\n"
        )
        # schema intent
        self.assertEqual(
            telemetry.get_semantic_priming("test prompt", {"type": "object"}),
            f"[METADATA: Domain=Data_Extraction, Intent=Parsing, Creativity=0]\n{narrative_restriction}"
        )
        # engineering/coding intent
        self.assertEqual(
            telemetry.get_semantic_priming("write python code", None),
            f"[METADATA: Domain=Software_Engineering, Intent=Code_Generation, Creativity=0]\n{narrative_restriction}"
        )
        # general extraction fallback
        self.assertEqual(
            telemetry.get_semantic_priming("hello world", None),
            f"[METADATA: Domain=Data_Extraction, Intent=Extraction, Creativity=0]\n{narrative_restriction}"
        )

    def test_fidelity_check_schema_valid(self):
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"}
            },
            "required": ["name"]
        }
        passed, error, clean_ans = telemetry.fidelity_check(
            "dummy prompt",
            '{"name": "test"}',
            schema
        )
        self.assertTrue(passed)
        self.assertIsNone(error)
        self.assertEqual(clean_ans, '{"name": "test"}')

    def test_fidelity_check_schema_invalid(self):
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"}
            },
            "required": ["name"]
        }
        passed, error, clean_ans = telemetry.fidelity_check(
            "dummy prompt",
            '{"name": 123}', # invalid type
            schema
        )
        self.assertFalse(passed)
        self.assertIn("Schema validation failed", error)

    def test_fidelity_check_refusal(self):
        # Refusal check
        refusals = [
            "I sorry, but I can't help with that",
            "As an AI, I cannot perform this task",
            "This goes against my guidelines"
        ]
        for ref in refusals:
            passed, error, clean_ans = telemetry.fidelity_check(
                "dummy prompt",
                ref,
                None
            )
            self.assertFalse(passed)
            self.assertEqual(error, "Refusal detected")

    @patch("membrane.telemetry.acompletion")
    async def test_check_semantic_intent_safe(self, mock_acompletion):
        # Mock choice response
        mock_choice = MagicMock()
        mock_choice.message.content = "0"
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        mock_acompletion.return_value = mock_res

        is_safe, reason = await telemetry.check_semantic_intent("safe prompt")
        self.assertTrue(is_safe)
        self.assertEqual(reason, "Safe")

    @patch("membrane.telemetry.acompletion")
    async def test_check_semantic_intent_unsafe(self, mock_acompletion):
        mock_choice = MagicMock()
        mock_choice.message.content = "1"
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        mock_acompletion.return_value = mock_res

        is_safe, reason = await telemetry.check_semantic_intent("injection prompt")
        self.assertFalse(is_safe)
        self.assertEqual(reason, "Prompt Injection / Jailbreak Attempt Detected")

    @patch("membrane.telemetry.acompletion")
    async def test_run_senescent_shadow_timeout_fallback(self, mock_acompletion):
        # Simulate a timeout
        mock_acompletion.side_effect = Exception("Timeout")
        
        # Should not raise exception (fails open/safely)
        await telemetry.run_senescent_shadow("test prompt", "receipt_123")
        # No pool so it should complete without errors
        self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
