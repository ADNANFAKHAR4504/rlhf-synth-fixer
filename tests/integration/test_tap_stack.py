"""
test_tap_stack_integration.py

Integration tests for TapStack Pulumi infrastructure.
Simple tests that verify basic functionality without requiring actual AWS resources.
"""

import os
import unittest
import sys
from pathlib import Path

# Add the project root to Python path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from lib.tap_stack import TapStackArgs, TapStack


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack infrastructure."""

    def setUp(self):
        """Set up integration test fixtures."""
        self.test_args = TapStackArgs(
            environment_suffix='test',
            region='us-west-1',
            tags={'Environment': 'test', 'Purpose': 'integration-testing'}
        )

    def test_tap_stack_args_integration(self):
        """Test TapStackArgs integration with proper configuration."""
        # Test that TapStackArgs can be instantiated with expected values
        args = TapStackArgs(
            environment_suffix='integration',
            region='us-east-1',
            tags={'Test': 'Integration'}
        )
        
        # Verify the configuration is correctly set
        self.assertEqual(args.environment_suffix, 'integration')
        self.assertEqual(args.region, 'us-east-1')
        self.assertEqual(args.tags['Test'], 'Integration')
        # Note: When custom tags are provided, they replace defaults entirely
        self.assertIsInstance(args.tags, dict)

    def test_tap_stack_args_defaults_integration(self):
        """Test TapStackArgs with default values in integration context."""
        args = TapStackArgs()
        
        # Verify defaults are applied correctly
        self.assertEqual(args.environment_suffix, 'production')
        self.assertEqual(args.region, 'us-west-1')
        self.assertIn('Project', args.tags)
        self.assertIn('Environment', args.tags)
        self.assertIn('ManagedBy', args.tags)
        self.assertIn('SecurityLevel', args.tags)

    def test_environment_variable_integration(self):
        """Test integration with environment variables if present."""
        # Test that our stack can handle environment variable configuration
        original_env = os.environ.get('AWS_REGION')
        
        try:
            # Set a test environment variable
            os.environ['AWS_REGION'] = 'us-west-2'
            
            # Create args and verify it doesn't break with env vars present
            args = TapStackArgs(region='us-east-1')  # Explicit region should override
            self.assertEqual(args.region, 'us-east-1')
            
        finally:
            # Clean up environment
            if original_env:
                os.environ['AWS_REGION'] = original_env
            elif 'AWS_REGION' in os.environ:
                del os.environ['AWS_REGION']

    def test_tag_merging_integration(self):
        """Test tag merging behavior in integration context."""
        custom_tags = {
            'Environment': 'integration',
            'Team': 'Security',
            'CostCenter': '12345'
        }
        
        args = TapStackArgs(
            environment_suffix='integration',
            tags=custom_tags
        )
        
        # Verify custom tags are preserved
        self.assertEqual(args.tags['Environment'], 'integration')
        self.assertEqual(args.tags['Team'], 'Security')
        self.assertEqual(args.tags['CostCenter'], '12345')

    def test_region_validation_integration(self):
        """Test region validation in integration context."""
        valid_regions = ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1']
        
        for region in valid_regions:
            args = TapStackArgs(region=region)
            self.assertEqual(args.region, region)

    def test_stack_configuration_compatibility(self):
        """Test that TapStack configuration is compatible with expected usage patterns."""
        # Test different environment configurations
        environments = ['development', 'staging', 'production']
        
        for env in environments:
            args = TapStackArgs(environment_suffix=env)
            self.assertEqual(args.environment_suffix, env)
            self.assertEqual(args.tags['Environment'], env)
            
            # Verify tags structure is consistent
            self.assertIsInstance(args.tags, dict)
            self.assertTrue(len(args.tags) >= 4)  # Should have at least 4 default tags


if __name__ == '__main__':
    unittest.main()
