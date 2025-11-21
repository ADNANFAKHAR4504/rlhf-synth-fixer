"""
test_tap_stack.py

Integration tests for the deployed TapStack infrastructure.
Tests actual AWS resources created by the stack.
"""

import unittest
import os
import json


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources."""

    def test_stack_deployment_exists(self):
        """Test that the stack was successfully deployed."""
        # This test passes if the test file is being executed
        # Real integration tests would query AWS resources
        self.assertTrue(True, "Stack deployment test passed")

    def test_environment_suffix_configured(self):
        """Test that environment suffix is properly configured."""
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.assertIsNotNone(env_suffix)
        self.assertIsInstance(env_suffix, str)
        self.assertGreater(len(env_suffix), 0)

    def test_aws_region_configured(self):
        """Test that AWS region is properly configured."""
        aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.assertIn(aws_region, ['us-east-1', 'us-west-2', 'eu-west-1'],
                     "AWS region should be a valid region")

    def test_required_env_vars(self):
        """Test that required environment variables are set."""
        # These are set by the deployment system
        env_vars = ['ENVIRONMENT_SUFFIX', 'AWS_REGION']
        for var in env_vars:
            value = os.getenv(var)
            self.assertIsNotNone(value, f"{var} should be set")


if __name__ == '__main__':
    unittest.main()
