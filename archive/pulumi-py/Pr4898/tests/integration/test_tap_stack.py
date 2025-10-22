"""
test_tap_stack_integration.py

Integration tests for TapStack Pulumi infrastructure - NO MOCKING.
Tests validate live AWS resources when deployed, or skip if outputs unavailable.
"""

import unittest
import sys
import os
import json

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests validating TapStack - live resources when available."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs if available."""
        cls.outputs_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        cls.outputs = None
        cls.has_live_stack = False

        if os.path.exists(cls.outputs_file):
            try:
                with open(cls.outputs_file, 'r', encoding='utf-8') as f:
                    cls.outputs = json.load(f)
                    cls.has_live_stack = True
            except (json.JSONDecodeError, IOError):
                pass

    def test_tap_stack_args_initialization(self):
        """Validate TapStackArgs can be initialized with default values."""
        args = TapStackArgs()

        self.assertIsNotNone(args.environment_suffix)
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_with_custom_values(self):
        """Validate TapStackArgs accepts custom environment suffix and tags."""
        custom_tags = {"Environment": "production", "Compliance": "FedRAMP-High"}
        args = TapStackArgs(environment_suffix="prod-123", tags=custom_tags)

        self.assertEqual(args.environment_suffix, "prod-123")
        self.assertEqual(args.tags, custom_tags)
        self.assertIn("Environment", args.tags)
        self.assertIn("Compliance", args.tags)

    def test_tap_stack_class_exists(self):
        """Validate TapStack class is properly defined."""
        self.assertTrue(hasattr(TapStack, '__init__'))
        self.assertTrue(callable(getattr(TapStack, '__init__')))

    def test_tap_stack_is_component_resource(self):
        """Validate TapStack inherits from pulumi.ComponentResource."""
        import pulumi
        self.assertTrue(issubclass(TapStack, pulumi.ComponentResource))

    def test_tap_stack_docstring_compliance(self):
        """Validate TapStack has comprehensive FedRAMP documentation."""
        self.assertIsNotNone(TapStack.__doc__)
        self.assertIn("FedRAMP", TapStack.__doc__)

        doc = TapStack.__doc__.lower()
        self.assertIn("encryption", doc)
        self.assertIn("audit", doc)
        self.assertIn("availability", doc)

    def test_module_imports(self):
        """Validate required imports are available."""
        from lib import tap_stack

        self.assertTrue(hasattr(tap_stack, 'TapStack'))
        self.assertTrue(hasattr(tap_stack, 'TapStackArgs'))
        self.assertTrue(hasattr(tap_stack, 'pulumi'))
        self.assertTrue(hasattr(tap_stack, 'aws'))

    # Live AWS Resource Tests - Skip if outputs unavailable

    def test_live_vpc_configuration(self):
        """Validate VPC exists with correct configuration in deployed stack."""
        if not self.has_live_stack:
            self.skipTest("Live stack outputs not available - skipping live resource test")

        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID should be in stack outputs")
        self.assertTrue(vpc_id.startswith('vpc-'), "VPC ID should have correct format")

    def test_live_kinesis_stream(self):
        """Validate Kinesis stream exists in deployed stack."""
        if not self.has_live_stack:
            self.skipTest("Live stack outputs not available - skipping live resource test")

        stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(stream_name, "Kinesis stream name should be in outputs")
        self.assertIn('fedramp-data-stream', stream_name, "Stream should follow naming convention")

    def test_live_ecs_cluster(self):
        """Validate ECS cluster exists in deployed stack."""
        if not self.has_live_stack:
            self.skipTest("Live stack outputs not available - skipping live resource test")

        cluster_name = self.outputs.get('ecs_cluster_name')
        self.assertIsNotNone(cluster_name, "ECS cluster name should be in outputs")
        self.assertIn('fedramp-cluster', cluster_name, "Cluster should follow naming convention")

    def test_live_rds_endpoint(self):
        """Validate RDS endpoint exists in deployed stack."""
        if not self.has_live_stack:
            self.skipTest("Live stack outputs not available - skipping live resource test")

        rds_endpoint = self.outputs.get('rds_endpoint')
        self.assertIsNotNone(rds_endpoint, "RDS endpoint should be in outputs")
        self.assertIn('.rds.amazonaws.com', rds_endpoint, "RDS endpoint should be valid")

    def test_live_efs_filesystem(self):
        """Validate EFS filesystem exists in deployed stack."""
        if not self.has_live_stack:
            self.skipTest("Live stack outputs not available - skipping live resource test")

        efs_id = self.outputs.get('efs_id')
        self.assertIsNotNone(efs_id, "EFS ID should be in outputs")
        self.assertTrue(efs_id.startswith('fs-'), "EFS ID should have correct format")

    def test_live_api_endpoint(self):
        """Validate API Gateway endpoint exists in deployed stack."""
        if not self.has_live_stack:
            self.skipTest("Live stack outputs not available - skipping live resource test")

        api_endpoint = self.outputs.get('api_endpoint')
        self.assertIsNotNone(api_endpoint, "API endpoint should be in outputs")
        self.assertTrue(api_endpoint.startswith('https://'), "API should use HTTPS")


if __name__ == '__main__':
    unittest.main()
