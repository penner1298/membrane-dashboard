import unittest
from unittest.mock import MagicMock
from membrane import economics

class TestEconomics(unittest.TestCase):
    def test_calculate_token_savings_flash(self):
        # Using flash rates: input 0.075, output 0.30 per 1M
        # raw_tokens=1,000,000, optimized_tokens=500,000
        # actual = (500000 / 1M) * 0.075 = 0.0375
        # hypothetical = (1M / 1M) * 0.075 = 0.075
        # net_savings = 0.075 - 0.0375 = 0.0375
        res = economics.calculate_token_savings("gemini/gemini-2.5-flash", 1000000, 500000)
        self.assertAlmostEqual(res["actual_cost_incurred"], 0.0375)
        self.assertAlmostEqual(res["gross_unoptimized_cost"], 0.075)
        self.assertAlmostEqual(res["net_enterprise_savings"], 0.0375)

    def test_calculate_token_savings_pro(self):
        # Using pro rates (non-flash model): input 1.25, output 5.00 per 1M
        # raw_tokens=1M, optimized_tokens=500k
        # actual = 0.625, hypothetical = 1.25, net = 0.625
        res = economics.calculate_token_savings("gemini/gemini-2.5-pro", 1000000, 500000)
        self.assertAlmostEqual(res["actual_cost_incurred"], 0.625)
        self.assertAlmostEqual(res["gross_unoptimized_cost"], 1.25)
        self.assertAlmostEqual(res["net_enterprise_savings"], 0.625)

    def test_calc_cost_local_model(self):
        # Local models should cost 0.0
        self.assertEqual(economics.calc_cost("ollama/llama3", 1000, 1000), 0.0)
        self.assertEqual(economics.calc_cost("local/something", 500, 500), 0.0)

    def test_calc_cost_fallback_flash(self):
        # Flash model fallback cost calculation:
        # in_tokens = 1,000,000 -> 1.0 * 0.075 = 0.075
        # out_tokens = 1,000,000 -> 1.0 * 0.30 = 0.30
        # Total = 0.375
        cost = economics.calc_cost("gemini/gemini-2.5-flash", 1000000, 1000000)
        self.assertAlmostEqual(cost, 0.375)

    def test_calc_cost_fallback_pro(self):
        # Pro model (non-flash) fallback cost calculation:
        # in_tokens = 1,000,000 -> 1.0 * 1.25 = 1.25
        # out_tokens = 1,000,000 -> 1.0 * 5.00 = 5.00
        # Total = 6.25
        cost = economics.calc_cost("gemini/gemini-2.5-pro", 1000000, 1000000)
        self.assertAlmostEqual(cost, 6.25)

if __name__ == "__main__":
    unittest.main()
