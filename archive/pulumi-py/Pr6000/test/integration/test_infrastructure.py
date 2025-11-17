"""
Integration tests for deployed infrastructure.

These tests validate the actual deployed resources using outputs from deployment.
"""

import unittest
import json
import os


class TestDeployedInfrastructure(unittest.TestCase):
    """Integration tests for deployed AWS resources."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs."""
        outputs_path = 'cfn-outputs/flat-outputs.json'

        if os.path.exists(outputs_path):
            with open(outputs_path, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

    def test_outputs_exist(self):
        """Test that required outputs are present."""
        required_outputs = [
            'vpc_id',
            'db_endpoint',
            'db_secret_arn',
            's3_bucket_name',
            'dynamodb_table_name',
            'lambda_function_arn',
            'api_endpoint'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing output: {output}")

    def test_vpc_id_format(self):
        """Test VPC ID has correct format."""
        if 'vpc_id' in self.outputs:
            vpc_id = self.outputs['vpc_id']
            self.assertTrue(vpc_id.startswith('vpc-'), "VPC ID should start with 'vpc-'")

    def test_api_endpoint_format(self):
        """Test API endpoint has correct format."""
        if 'api_endpoint' in self.outputs:
            api_endpoint = self.outputs['api_endpoint']
            self.assertTrue(api_endpoint.startswith('https://'), "API endpoint should be HTTPS")
            self.assertIn('execute-api', api_endpoint, "Should be API Gateway endpoint")
            self.assertIn('us-east-1', api_endpoint, "Should be in us-east-1 region")


if __name__ == '__main__':
    unittest.main()
