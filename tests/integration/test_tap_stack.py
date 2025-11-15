"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed Pulumi TAP stack."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs from cfn-outputs/flat-outputs.json."""
        try:
            # Path to the flat outputs JSON file
            outputs_file = os.path.join('cfn-outputs', 'flat-outputs.json')

            # Check if file exists
            if not os.path.exists(outputs_file):
                cls.outputs = {}
                cls.stack_available = False
                print(f"\n✗ Outputs file not found: {outputs_file}")
                print(f"   Please run: pulumi up to generate outputs")
                return

            # Read the JSON file
            with open(outputs_file, 'r', encoding='utf-8') as f:
                cls.outputs = json.load(f)

            cls.stack_available = True
            print(f"\n✓ Loaded stack outputs from {outputs_file}: {len(cls.outputs)} outputs found")

        except json.JSONDecodeError as e:
            cls.outputs = {}
            cls.stack_available = False
            print(f"\n✗ Failed to parse JSON from outputs file: {e}")
        except Exception as e:
            cls.outputs = {}
            cls.stack_available = False
            print(f"\n✗ Failed to load stack outputs: {e}")

    def test_stack_outputs_exist(self):
        """Test that Pulumi stack has been deployed with outputs."""
        if not self.stack_available:
            self.skipTest("Outputs file not available. Run: pulumi up")

        self.assertGreater(len(self.outputs), 0, "Stack should have outputs")
        print(f"  ✓ Stack has {len(self.outputs)} outputs")

    def test_primary_region_resources(self):
        """Test that primary region resources are deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        primary_outputs = ['primary_vpc_id', 'primary_cluster_endpoint',
                          'primary_api_url', 'primary_bucket_name']

        for output_key in primary_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            self.assertNotEqual(value, '', f"{output_key} should not be empty")

        print(f"  ✓ Primary region resources deployed")
        print(f"    VPC ID: {self.outputs.get('primary_vpc_id', 'N/A')}")
        print(f"    Cluster endpoint: {self.outputs.get('primary_cluster_endpoint', 'N/A')}")
        print(f"    API URL: {self.outputs.get('primary_api_url', 'N/A')}")

    def test_dr_region_resources(self):
        """Test that DR region resources are deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        dr_outputs = ['dr_vpc_id', 'dr_cluster_endpoint',
                     'dr_api_url', 'dr_bucket_name']

        for output_key in dr_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            self.assertNotEqual(value, '', f"{output_key} should not be empty")

        print(f"  ✓ DR region resources deployed")
        print(f"    VPC ID: {self.outputs.get('dr_vpc_id', 'N/A')}")
        print(f"    Cluster endpoint: {self.outputs.get('dr_cluster_endpoint', 'N/A')}")
        print(f"    API URL: {self.outputs.get('dr_api_url', 'N/A')}")

    def test_global_resources(self):
        """Test that global resources are deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        global_outputs = ['route53_zone_id', 'dynamodb_table_name',
                         'sns_topic_primary_arn', 'sns_topic_dr_arn']

        for output_key in global_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")

        print(f"  ✓ Global resources deployed")
        print(f"    Route53 Zone ID: {self.outputs.get('route53_zone_id', 'N/A')}")
        print(f"    DynamoDB Table: {self.outputs.get('dynamodb_table_name', 'N/A')}")

    def test_aurora_global_cluster(self):
        """Test that Aurora global cluster is created."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        self.assertIn('global_cluster_id', self.outputs,
                     "Global cluster ID should be in outputs")
        self.assertIn('primary_cluster_arn', self.outputs,
                     "Primary cluster ARN should be in outputs")
        self.assertIn('dr_cluster_arn', self.outputs,
                     "DR cluster ARN should be in outputs")

        global_cluster_id = self.outputs['global_cluster_id']
        self.assertIsNotNone(global_cluster_id, "Global cluster ID should not be None")

        print(f"  ✓ Aurora global cluster deployed")
        print(f"    Global cluster ID: {global_cluster_id}")

    def test_lambda_functions_deployed(self):
        """Test that Lambda functions are deployed in both regions."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        lambda_outputs = ['primary_lambda_arn', 'dr_lambda_arn',
                         'primary_lambda_name', 'dr_lambda_name']

        for output_key in lambda_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")

            if 'arn' in output_key:
                arn = str(value)
                self.assertTrue(arn.startswith('arn:aws:lambda:'),
                              f"{output_key} should be a valid Lambda ARN")

        print(f"  ✓ Lambda functions deployed in both regions")
        print(f"    Primary: {self.outputs.get('primary_lambda_name', 'N/A')}")
        print(f"    DR: {self.outputs.get('dr_lambda_name', 'N/A')}")

    def test_api_gateways_deployed(self):
        """Test that API Gateways are deployed in both regions."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        api_outputs = ['primary_api_url', 'primary_api_id',
                      'dr_api_url', 'dr_api_id']

        for output_key in api_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")

            if 'url' in output_key:
                url = str(value)
                self.assertTrue(url.startswith('https://'),
                              f"{output_key} should be a valid HTTPS URL")

        print(f"  ✓ API Gateways deployed in both regions")

    def test_s3_buckets_deployed(self):
        """Test that S3 buckets are deployed in both regions."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        bucket_outputs = ['primary_bucket_name', 'primary_bucket_arn',
                         'dr_bucket_name']

        for output_key in bucket_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")

            if 'arn' in output_key:
                arn = str(value)
                self.assertTrue(arn.startswith('arn:aws:s3:::'),
                              f"{output_key} should be a valid S3 ARN")

        print(f"  ✓ S3 buckets deployed")
        print(f"    Primary: {self.outputs.get('primary_bucket_name', 'N/A')}")
        print(f"    DR: {self.outputs.get('dr_bucket_name', 'N/A')}")

    def test_environment_configuration(self):
        """Test that environment configuration is correct."""
        if not self.stack_available:
            self.skipTest("Stack not available")

        config_outputs = ['environment_suffix', 'primary_region', 'dr_region']

        for output_key in config_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")

        # Verify regions
        self.assertEqual(self.outputs.get('primary_region'), 'us-east-1',
                        "Primary region should be us-east-1")
        self.assertEqual(self.outputs.get('dr_region'), 'us-east-2',
                        "DR region should be us-east-2")

        print(f"  ✓ Environment configuration verified")
        print(f"    Environment: {self.outputs.get('environment_suffix', 'N/A')}")
        print(f"    Primary region: {self.outputs.get('primary_region', 'N/A')}")
        print(f"    DR region: {self.outputs.get('dr_region', 'N/A')}")


if __name__ == '__main__':
    # Run with verbose output
    unittest.main(verbosity=2)
