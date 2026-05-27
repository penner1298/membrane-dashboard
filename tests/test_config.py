import unittest
from membrane import config

class TestConfig(unittest.TestCase):
    def test_pricing_constants(self):
        self.assertEqual(config.FLASH_INPUT_COST, 0.30)
        self.assertEqual(config.FLASH_OUTPUT_COST, 2.50)
        self.assertEqual(config.PRO_INPUT_COST, 2.00)
        self.assertEqual(config.PRO_OUTPUT_COST, 12.00)
        self.assertEqual(config.MARKUP_MULTIPLIER, 2.0)

    def test_model_names(self):
        self.assertIsNotNone(config.FLASH_MODEL)
        self.assertIsNotNone(config.APEX_MODEL)
        self.assertIsNotNone(config.EMBED_MODEL)

if __name__ == "__main__":
    unittest.main()
