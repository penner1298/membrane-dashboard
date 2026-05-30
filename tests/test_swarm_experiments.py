import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import asyncio
from fastapi import HTTPException

from membrane.swarm import SwarmExecutionMode, SwarmMapRequest
from membrane.swarm.validation import validate_strict_swarm_request
from membrane.swarm.execution import (
    SwarmConcurrencyTracker,
    process_swarm_chunk,
    compile_swarm_response,
    execute_swarm_experiments,
)

class TestSwarmExperiments(unittest.IsolatedAsyncioTestCase):
    def test_validation_gate_success(self):
        chunks = ["valid chunk 1", "valid chunk 2"]
        criteria = {
            "system_persona": "helpful assistant",
            "target_signals": ["sig1", "sig2"]
        }
        # Should not raise exception
        validate_strict_swarm_request(chunks, criteria)

    def test_validation_gate_empty_chunks(self):
        chunks = []
        criteria = {"system_persona": "a", "target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "chunks")

    def test_validation_gate_too_many_chunks(self):
        chunks = ["chunk"] * 51
        criteria = {"system_persona": "a", "target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)

    def test_validation_gate_huge_chunk(self):
        chunks = ["a" * 25001]
        criteria = {"system_persona": "a", "target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "Per-chunk size")

    def test_validation_gate_missing_system_persona(self):
        chunks = ["chunk"]
        criteria = {"target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertIn("system_persona", ctx.exception.detail["message"])

    def test_validation_gate_wrong_criteria_shape(self):
        chunks = ["chunk"]
        criteria = {"system_persona": "a", "target_signals": "not_a_list"}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "Criteria shape")

    def test_validation_gate_total_input_ceiling(self):
        chunks = ["a" * 25000] * 41 # 1.025M total chars, <= 50 chunks
        criteria = {"system_persona": "a", "target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "Total estimated input")

    def test_validation_gate_non_list_chunks(self):
        chunks = "not a list"
        criteria = {"system_persona": "a", "target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "chunks")

    def test_validation_gate_non_string_chunk(self):
        chunks = ["valid_string", 12345]
        criteria = {"system_persona": "a", "target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "chunks")

    def test_validation_gate_non_dict_criteria(self):
        chunks = ["chunk"]
        criteria = "not a dictionary"
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "extraction_criteria")

    def test_validation_gate_non_string_persona(self):
        chunks = ["chunk"]
        criteria = {"system_persona": 12345, "target_signals": ["b"]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "extraction_criteria")

    def test_validation_gate_non_string_signal_element(self):
        chunks = ["chunk"]
        criteria = {"system_persona": "a", "target_signals": ["b", 999]}
        with self.assertRaises(HTTPException) as ctx:
            validate_strict_swarm_request(chunks, criteria)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["check"], "Criteria shape")

    async def test_concurrency_tracker(self):
        from membrane.swarm import execution
        initial = execution.active_swarm_chunks
        
        record_list = []
        event1 = asyncio.Event()
        event2 = asyncio.Event()
        
        async def task(ev):
            async with SwarmConcurrencyTracker():
                record_list.append(execution.active_swarm_chunks)
                ev.set()
                await asyncio.sleep(0.05)

        t1 = asyncio.create_task(task(event1))
        t2 = asyncio.create_task(task(event2))
        
        await asyncio.gather(event1.wait(), event2.wait())
        await asyncio.gather(t1, t2)
        
        self.assertIn(initial + 2, record_list)

    @patch("membrane.swarm.execution.process_swarm_chunk")
    async def test_execute_swarm_experiments_canary_success(self, mock_process):
        mock_process.side_effect = [
            # Canary chunk returns success
            {
                "index": 0, "verbatim_text": '{"extracted_data": "ok"}',
                "matched_signals": [], "error": None, "tokens": 10,
                "actual_cost": 0.001, "hypothetical_cost": 0.005, "savings": 0.004, "concurrency_level": 1
            },
            # Chunk 1 returns success
            {
                "index": 1, "verbatim_text": '{"extracted_data": "ok"}',
                "matched_signals": [], "error": None, "tokens": 15,
                "actual_cost": 0.0015, "hypothetical_cost": 0.0075, "savings": 0.006, "concurrency_level": 2
            }
        ]

        request = SwarmMapRequest(
            chunks=["chunk0", "chunk1"],
            extraction_criteria={"system_persona": "a", "target_signals": ["b"]}
        )

        mock_bg = MagicMock()
        
        with patch("membrane.swarm.execution.charge_and_log_api_batch") as mock_charge:
            response = await execute_swarm_experiments(
                chunks=["chunk0", "chunk1"],
                request=request,
                api_key_hash="dummy_hash",
                background_tasks=mock_bg,
                swarm_mode=SwarmExecutionMode.CANARY_PROBE,
                task_id="test_task_canary_success",
                start_time=12345.0,
                license_active=False
            )
            
            self.assertEqual(response.object, "swarm.extraction_matrix")
            self.assertEqual(response.task_id, "test_task_canary_success")
            self.assertEqual(response.membrane_metadata.total_raw_extractions_captured, 2)
            
            # Check compile_swarm_response was invoked
            self.assertTrue(mock_bg.add_task.called)

    @patch("membrane.swarm.execution.process_swarm_chunk")
    async def test_execute_swarm_experiments_canary_failure(self, mock_process):
        mock_process.return_value = {
            "index": 0, "verbatim_text": "Error: model error",
            "matched_signals": [], "error": "model error", "tokens": 5,
            "actual_cost": 0.0005, "hypothetical_cost": 0.0025, "savings": 0.002, "concurrency_level": 1
        }

        request = SwarmMapRequest(
            chunks=["chunk0", "chunk1"],
            extraction_criteria={"system_persona": "a", "target_signals": ["b"]}
        )

        mock_bg = MagicMock()
        
        with self.assertRaises(HTTPException) as ctx:
            await execute_swarm_experiments(
                chunks=["chunk0", "chunk1"],
                request=request,
                api_key_hash="dummy_hash",
                background_tasks=mock_bg,
                swarm_mode=SwarmExecutionMode.CANARY_PROBE,
                task_id="test_task_canary_fail",
                start_time=12345.0,
                license_active=False
            )
            
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertEqual(ctx.exception.detail["error_type"], "canary_sentinel_failure")
        
        # Verify background logging was called for the canary chunk
        self.assertTrue(mock_bg.add_task.called)

if __name__ == "__main__":
    unittest.main()
