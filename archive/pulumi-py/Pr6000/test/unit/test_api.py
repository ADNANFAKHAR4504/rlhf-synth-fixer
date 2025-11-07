"""
Unit tests for API Gateway configuration.
"""

import unittest
from lib.config import get_environment_config


class TestApiGatewayConfiguration(unittest.TestCase):
    """Test API Gateway configuration logic."""

    def test_api_custom_domain_dev(self):
        """Test custom domain is disabled for dev."""
        config = get_environment_config('dev')
        self.assertFalse(config.enable_custom_domain)

    def test_api_custom_domain_prod(self):
        """Test custom domain is enabled for prod."""
        config = get_environment_config('prod123')
        self.assertTrue(config.enable_custom_domain)


if __name__ == '__main__':
    unittest.main()
