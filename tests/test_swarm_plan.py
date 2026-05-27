import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from membrane.swarm import SwarmPlanRequest, SwarmPlanResponse, TrajectoryPrediction
from membrane.swarm.validation import validate_invariant_compliance

class TestSwarmPlan(unittest.IsolatedAsyncioTestCase):
    def test_validate_invariant_compliance_success(self):
        # Under 500k chars should pass
        chunks = ["hello", "world"]
        # Should not raise exception
        validate_invariant_compliance(chunks, "ent_compliance_lock_v1")

        # Non-compliance lock should pass
        validate_invariant_compliance(["a" * 600000], "other_lock")

    def test_validate_invariant_compliance_failure(self):
        # Over 500k chars with ent_compliance_lock_v1 should raise HTTP 422
        chunks = ["a" * 260000, "b" * 260000] # 520k total chars
        with self.assertRaises(HTTPException) as ctx:
            validate_invariant_compliance(chunks, "ent_compliance_lock_v1")
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["error_type"], "invariant_validation_failure")

    @patch("server.db_pool", None)
    async def test_generate_swarm_plan_endpoint(self):
        # Import generate_swarm_plan dynamically
        from server import generate_swarm_plan
        import server
        
        request = SwarmPlanRequest(
            chunks=["chunk 1", "chunk 2"],
            invariant_set_id="ent_compliance_lock_v1"
        )
        
        mock_bg_tasks = MagicMock()
        mock_http_req = MagicMock()
        mock_http_req.headers = {}
        
        # Test when db is offline/None
        response = await generate_swarm_plan(
            request=request,
            background_tasks=mock_bg_tasks,
            http_req=mock_http_req,
            api_key_hash="dummy_hash"
        )
        
        self.assertEqual(response.object, "swarm.plan")
        self.assertEqual(response.invariant_check, "COMPLIANT")
        self.assertEqual(response.selected_routing_geometry, "geo_pattern_legal_dense_v4")
        self.assertEqual(response.trajectory.estimated_total_tokens, 1002) # (2 chunks * (1 + 500))
        self.assertTrue(mock_bg_tasks.add_task.called)

        # Test database lookup when online
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"task_id": "99999"}
        mock_db_pool = MagicMock()
        mock_db_pool.acquire.return_value.__aenter__.return_value = mock_conn
        server.db_pool = mock_db_pool
        
        try:
            response_db = await generate_swarm_plan(
                request=request,
                background_tasks=mock_bg_tasks,
                http_req=mock_http_req,
                api_key_hash="dummy_hash"
            )
            self.assertEqual(response_db.selected_routing_geometry, "geo_pattern_historical_99999")
        finally:
            server.db_pool = None


if __name__ == "__main__":
    unittest.main()
