"""
test_dr_deployment.py

Integration tests for DR infrastructure deployment.
Tests use real deployment outputs from cfn-outputs/flat-outputs.json.
"""

import unittest
import json
import os


class TestDRDeployment(unittest.TestCase):
    """Integration tests for deployed DR infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests."""
        outputs_path = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_path}. "
                "Run deployment first."
            )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

    def test_outputs_loaded(self):
        """Test that deployment outputs were loaded successfully."""
        self.assertIsNotNone(self.outputs)
        self.assertIsInstance(self.outputs, dict)
        self.assertGreater(len(self.outputs), 0)

    def test_primary_api_endpoint_exists(self):
        """Test that primary API endpoint is in outputs."""
        self.assertIn('PrimaryAPIEndpoint', self.outputs)
        endpoint = self.outputs['PrimaryAPIEndpoint']
        self.assertTrue(endpoint.startswith('https://'))
        self.assertIn('execute-api', endpoint)
        self.assertIn('us-east-1', endpoint)

    def test_dr_api_endpoint_exists(self):
        """Test that DR API endpoint is in outputs."""
        self.assertIn('DRAPIEndpoint', self.outputs)
        endpoint = self.outputs['DRAPIEndpoint']
        self.assertTrue(endpoint.startswith('https://'))
        self.assertIn('execute-api', endpoint)
        self.assertIn('us-east-2', endpoint)

    def test_route53_zone_configured(self):
        """Test that Route 53 hosted zone is configured."""
        self.assertIn('Route53ZoneId', self.outputs)
        zone_id = self.outputs['Route53ZoneId']
        self.assertIsInstance(zone_id, str)
        self.assertGreater(len(zone_id), 0)

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table name is in outputs."""
        self.assertIn('DynamoDBTableName', self.outputs)
        table_name = self.outputs['DynamoDBTableName']
        self.assertIn('sessions', table_name.lower())
        self.assertIn('synth4xq66w', table_name)

    def test_s3_buckets_configured(self):
        """Test that S3 buckets are configured in both regions."""
        self.assertIn('PrimaryBucketName', self.outputs)
        self.assertIn('DRBucketName', self.outputs)

        primary_bucket = self.outputs['PrimaryBucketName']
        dr_bucket = self.outputs['DRBucketName']

        self.assertIn('primary', primary_bucket)
        self.assertIn('synth4xq66w', primary_bucket)

        self.assertIn('secondary', dr_bucket)
        self.assertIn('synth4xq66w', dr_bucket)

    def test_aurora_endpoints_exist(self):
        """Test that Aurora cluster endpoints are configured."""
        self.assertIn('AuroraPrimaryEndpoint', self.outputs)
        self.assertIn('AuroraDREndpoint', self.outputs)

        primary_endpoint = self.outputs['AuroraPrimaryEndpoint']
        dr_endpoint = self.outputs['AuroraDREndpoint']

        self.assertIn('aurora', primary_endpoint)
        self.assertIn('rds.amazonaws.com', primary_endpoint)

        self.assertIn('aurora', dr_endpoint)
        self.assertIn('rds.amazonaws.com', dr_endpoint)

    def test_environment_suffix_consistency(self):
        """Test that environment suffix is consistent across resources."""
        suffix = 'synth4xq66w'

        # Check that suffix appears in resource names
        resource_names = [
            self.outputs.get('PrimaryBucketName', ''),
            self.outputs.get('DRBucketName', ''),
            self.outputs.get('DynamoDBTableName', '')
        ]

        for resource_name in resource_names:
            if resource_name:  # Skip empty values
                self.assertIn(suffix, resource_name,
                              f"Suffix '{suffix}' not found in {resource_name}")

    def test_multi_region_deployment(self):
        """Test that resources are deployed across multiple regions."""
        primary_endpoint = self.outputs.get('PrimaryAPIEndpoint', '')
        dr_endpoint = self.outputs.get('DRAPIEndpoint', '')

        # Verify different regions
        self.assertIn('us-east-1', primary_endpoint)
        self.assertIn('us-east-2', dr_endpoint)

        # Verify they're different endpoints
        self.assertNotEqual(primary_endpoint, dr_endpoint)


if __name__ == '__main__':
    unittest.main()
