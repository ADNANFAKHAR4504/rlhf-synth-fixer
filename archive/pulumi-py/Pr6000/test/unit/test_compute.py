"""
Unit tests for compute configuration.
"""

import unittest
from lib.config import get_environment_config, get_default_egress_rules


class TestComputeConfiguration(unittest.TestCase):
    """Test compute configuration logic."""

    def test_lambda_concurrency_dev(self):
        """Test reserved concurrency is None for dev."""
        config = get_environment_config('dev')
        self.assertIsNone(config.lambda_reserved_concurrency)

    def test_lambda_concurrency_prod(self):
        """Test reserved concurrency is set for prod."""
        config = get_environment_config('prod456')
        self.assertEqual(config.lambda_reserved_concurrency, 100)

    def test_default_egress_rules(self):
        """Test default egress rules configuration."""
        rules = get_default_egress_rules()
        self.assertEqual(len(rules), 1)
        self.assertEqual(rules[0].protocol, '-1')
        self.assertEqual(rules[0].from_port, 0)
        self.assertEqual(rules[0].to_port, 0)


if __name__ == '__main__':
    unittest.main()
