import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import os
import tempfile
import shutil
from fastapi import HTTPException
from membrane import swarm

class TestSwarm(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.tmp_dir, "sandbox_scratch"), exist_ok=True)

    def tearDown(self):
        shutil.rmtree(self.tmp_dir)

    def test_make_canary_signature(self):
        sig = swarm.make_canary_signature("test payload", "TESTPREFIX")
        self.assertTrue(sig.startswith("TESTPREFIX_"))
        parts = sig.split("_")
        self.assertEqual(len(parts), 3)
        # Verify watermark is modulo-7919
        self.assertTrue(parts[1].isdigit())
        self.assertLess(int(parts[1]), 7919)

    def test_verify_state_machine_logic_python_success(self):
        request = swarm.ProofOfWorkRequest(
            agent_id="agent_1",
            task_type="python_code",
            payload="print('hello')",
            target_agent_id="agent_2",
            destination_path="valid_script.py"
        )
        res = swarm.verify_state_machine_logic(request, self.tmp_dir)
        self.assertTrue(res.verified)
        self.assertIsNotNone(res.membrane_signature)
        self.assertIn("MEMBRANE_VERIFIED", res.membrane_signature)
        
        # Verify the destination file was written inside the sandbox
        dest_file = os.path.join(self.tmp_dir, "sandbox_scratch", "valid_script.py")
        self.assertTrue(os.path.exists(dest_file))
        with open(dest_file, "r") as f:
            self.assertEqual(f.read(), "print('hello')")

    def test_verify_state_machine_logic_python_success_without_target_agent_id(self):
        request = swarm.ProofOfWorkRequest(
            agent_id="agent_1",
            task_type="python_code",
            payload="print('hello')",
            destination_path="valid_script_no_target.py"
        )
        res = swarm.verify_state_machine_logic(request, self.tmp_dir)
        self.assertTrue(res.verified)
        self.assertIsNotNone(res.membrane_signature)
        self.assertIn("MEMBRANE_VERIFIED", res.membrane_signature)

        dest_file = os.path.join(self.tmp_dir, "sandbox_scratch", "valid_script_no_target.py")
        self.assertTrue(os.path.exists(dest_file))
        with open(dest_file, "r") as f:
            self.assertEqual(f.read(), "print('hello')")

    def test_verify_state_machine_logic_python_syntax_error(self):
        request = swarm.ProofOfWorkRequest(
            agent_id="agent_1",
            task_type="python_code",
            payload="print('hello'", # Syntax error (missing parenthesis)
            target_agent_id="agent_2"
        )
        with self.assertRaises(HTTPException) as ctx:
            swarm.verify_state_machine_logic(request, self.tmp_dir)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Python compilation failed", ctx.exception.detail)

    def test_verify_state_machine_logic_react_fallback_success(self):
        # We test the syntactic parser fallback pathway for React components
        request = swarm.ProofOfWorkRequest(
            agent_id="agent_1",
            task_type="react_component",
            payload="""
            export default function Component() {
                return (<div>Hello World</div>);
            }
            """,
            target_agent_id="agent_2",
            destination_path="component.tsx"
        )
        # Mock shutil.which to return None so it doesn't search for "npx"
        with patch("shutil.which", return_value=None):
            res = swarm.verify_state_machine_logic(request, self.tmp_dir)
            self.assertTrue(res.verified)
            self.assertIn("MEMBRANE_VERIFIED_MOCK", res.membrane_signature)
            
            dest_file = os.path.join(self.tmp_dir, "sandbox_scratch", "component.tsx")
            self.assertTrue(os.path.exists(dest_file))

    def test_verify_state_machine_logic_react_fallback_failure(self):
        request = swarm.ProofOfWorkRequest(
            agent_id="agent_1",
            task_type="react_component",
            payload="""
            function Component() {
                return (<div>Hello World</div>);
            }
            """, # Missing "export default"
            target_agent_id="agent_2"
        )
        with patch("shutil.which", return_value=None):
            with self.assertRaises(HTTPException) as ctx:
                swarm.verify_state_machine_logic(request, self.tmp_dir)
            self.assertEqual(ctx.exception.status_code, 400)
            self.assertIn("React component validation failed", ctx.exception.detail)

    def test_compile_swarm_response(self):
        results = [
            {
                "index": 0,
                "verbatim_text": '{"extracted_data": "value1"}',
                "matched_signals": ["sig1"],
                "error": None,
                "tokens": 100,
                "actual_cost": 0.002,
                "hypothetical_cost": 0.010,
                "savings": 0.008
            },
            {
                "index": 1,
                "verbatim_text": '{"extracted_data": "value2"}',
                "matched_signals": ["sig2"],
                "error": None,
                "tokens": 150,
                "actual_cost": 0.003,
                "hypothetical_cost": 0.015,
                "savings": 0.012
            }
        ]
        
        mock_bg_tasks = MagicMock()
        response = swarm.compile_swarm_response(
            results,
            ["chunk1", "chunk2"],
            "test_model",
            "dummy_api_key_hash",
            mock_bg_tasks
        )
        
        self.assertEqual(response.object, "swarm.extraction_matrix")
        self.assertEqual(len(response.extractions), 2)
        self.assertEqual(response.extractions[0].verbatim_text, '{"extracted_data": "value1"}')
        self.assertEqual(response.membrane_metadata.total_raw_extractions_captured, 2)
        self.assertEqual(response.membrane_metadata.value_ledger.actual_cost_incurred, 0.005)
        self.assertEqual(response.membrane_metadata.value_ledger.gross_unoptimized_cost, 0.025)
        self.assertEqual(response.membrane_metadata.value_ledger.net_enterprise_savings, 0.020)
        self.assertTrue(mock_bg_tasks.add_task.called)

    def test_verify_state_machine_logic_python_forbidden_import(self):
        request = swarm.ProofOfWorkRequest(
            agent_id="agent_1",
            task_type="python_code",
            payload="import os\nprint('hello')",
            target_agent_id="agent_2"
        )
        with self.assertRaises(HTTPException) as ctx:
            swarm.verify_state_machine_logic(request, self.tmp_dir)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Forbidden import or function call", ctx.exception.detail)

    def test_verify_state_machine_logic_python_forbidden_call(self):
        request = swarm.ProofOfWorkRequest(
            agent_id="agent_1",
            task_type="python_code",
            payload="eval('1 + 1')",
            target_agent_id="agent_2"
        )
        with self.assertRaises(HTTPException) as ctx:
            swarm.verify_state_machine_logic(request, self.tmp_dir)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Forbidden import or function call", ctx.exception.detail)

if __name__ == "__main__":
    unittest.main()
