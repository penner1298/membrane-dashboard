"""
Audit follow-up tests per implementation plan.

These tests verify that strict shape validation on extraction_criteria
is now enforced at the entry points of /v1/swarm/map and /v1/swarm/plan,
returning clean 422 errors even in legacy mode when bad shapes are provided
(e.g. target_signals passed as a string instead of a list of strings).
"""

import unittest
from fastapi.testclient import TestClient
from server import app


class TestAuditFixes(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_swarm_map_rejects_string_target_signals_legacy_mode(self):
        """Passing target_signals as a string (instead of list) must 422."""
        payload = {
            "chunks": ["test chunk one", "test chunk two"],
            "extraction_criteria": {
                "system_persona": "Extract signals",
                "target_signals": "CRITICAL"   # BAD SHAPE: string instead of list
            }
        }
        r = self.client.post("/v1/swarm/map", json=payload)
        self.assertEqual(r.status_code, 422, f"Expected 422, got {r.status_code}: {r.text}")

    def test_swarm_map_rejects_string_target_signals_early_gate(self):
        """Same bad shape must be rejected under early_gate mode."""
        payload = {
            "chunks": ["test chunk"],
            "extraction_criteria": {
                "system_persona": "Extract signals",
                "target_signals": "ERROR"   # BAD SHAPE
            }
        }
        headers = {"X-Membrane-Swarm-Mode": "early_gate"}
        r = self.client.post("/v1/swarm/map", json=payload, headers=headers)
        self.assertEqual(r.status_code, 422, f"Expected 422, got {r.status_code}: {r.text}")

    def test_swarm_plan_rejects_bad_extraction_criteria_shape(self):
        """swarm/plan must also enforce shape validation on extraction_criteria."""
        payload = {
            "chunks": ["chunk A", "chunk B"],
            "extraction_criteria": {
                "system_persona": "test",
                "target_signals": {"not": "a list"}   # BAD SHAPE
            }
        }
        r = self.client.post("/v1/swarm/plan", json=payload)
        self.assertEqual(r.status_code, 422, f"Expected 422, got {r.status_code}: {r.text}")

    def test_swarm_map_accepts_valid_extraction_criteria(self):
        """Sanity check: correct shape still succeeds (returns 200-ish)."""
        payload = {
            "chunks": ["Log line with ERROR"],
            "extraction_criteria": {
                "system_persona": "Find errors",
                "target_signals": ["ERROR"]
            }
        }
        r = self.client.post("/v1/swarm/map", json=payload)
        # May return 200 or other success codes depending on backend keys,
        # but it must NOT be a 422 validation error.
        self.assertNotEqual(r.status_code, 422, f"Valid payload unexpectedly rejected: {r.text}")


if __name__ == "__main__":
    unittest.main()
