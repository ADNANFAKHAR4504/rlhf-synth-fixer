#!/usr/bin/env python3
"""
Integration tests for the IoT Sensor Data Processing infrastructure.

These tests verify the deployed infrastructure outputs and basic resource accessibility.

Environment Variables Used:
- ENVIRONMENT_SUFFIX: For resource naming
- AWS_REGION: For AWS service calls
"""

import json
import os
import subprocess
import unittest

import boto3
from botocore.exceptions import ClientError


class TestIoTSensorDataProcessingIntegration(unittest.TestCase):
    """Integration tests for the IoT Sensor Data Processing infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        cls.outputs = {}
        cls.output_method = None

        try:
            print("🔍 Attempting to get outputs via Pulumi CLI...")
            result = subprocess.run(
                ['pulumi', 'stack', 'output', '--json'],
                capture_output=True,
                text=True,
                check=True,
                cwd='lib'
            )
            cls.outputs = json.loads(result.stdout)
            cls.output_method = "Pulumi CLI"
            print("✅ Successfully loaded outputs via Pulumi CLI")
        except (subprocess.CalledProcessError, json.JSONDecodeError, FileNotFoundError) as e:
            print(f"❌ Pulumi CLI failed: {e}")
            try:
                print("🔍 Attempting to read from CI/CD output files...")
                if os.path.exists('cfn-outputs/flat-outputs.json'):
                    with open('cfn-outputs/flat-outputs.json', 'r') as f:
                        cls.outputs = json.load(f)
                    cls.output_method = "CI/CD flat-outputs.json"
                    print("✅ Successfully loaded outputs from cfn-outputs/flat-outputs.json")
                else:
                    print("⚠️ cfn-outputs/flat-outputs.json not found")
                    cls.outputs = {}
                    cls.output_method = "No outputs available"
            except (FileNotFoundError, json.JSONDecodeError) as e:
                print(f"❌ CI/CD output file failed: {e}")
                cls.outputs = {}
                cls.output_method = "No outputs available"

        print(f"📊 Output method selected: {cls.output_method}")
        print(f"📊 Number of outputs loaded: {len(cls.outputs)}")

        if not cls.outputs:
            raise unittest.SkipTest("No outputs found. Stack may not be deployed.")

        # Extract environment suffix and region
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.aws_region = os.getenv('AWS_REGION', 'ca-central-1')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.aws_region)
        cls.rds_client = boto3.client('rds', region_name=cls.aws_region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.aws_region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.aws_region)

    def test_output_method_used_for_debugging(self):
        """Test to show which output method was used - for debugging purposes."""
        print(f"\nDEBUG: Output method used: {self.output_method}")
        print(f"Number of outputs loaded: {len(self.outputs)}")
        print(f"Environment suffix: {self.environment_suffix}")
        print(f"AWS Region: {self.aws_region}")
        print(f"Outputs: {list(self.outputs.keys())}")

        # This test always passes - it's just for debugging
        self.assertTrue(True, "Output method debugging test")

    def test_stack_outputs_are_present(self):
        """Test that required stack outputs are present."""
        # Based on actual outputs from deployment
        expected_outputs = [
            'vpc_id',
            'aurora_endpoint',
            'aurora_reader_endpoint',
            'api_gateway_url',
            'api_key_id',
            'secrets_manager_secret_arn'
        ]

        for output in expected_outputs:
            self.assertIn(output, self.outputs, f"Required output '{output}' not found in stack outputs")
            self.assertIsNotNone(self.outputs[output], f"Output '{output}' is None")
            self.assertNotEqual(self.outputs[output], '', f"Output '{output}' is empty")

    def test_vpc_id_is_valid(self):
        """Test that VPC ID from outputs is valid and accessible."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(response['Vpcs']), 1, "VPC not found")
            vpc = response['Vpcs'][0]
            self.assertEqual(vpc['VpcId'], vpc_id, "VPC ID mismatch")
        except ClientError as e:
            self.fail(f"Failed to describe VPC: {e}")

    def test_aurora_endpoints_are_valid_format(self):
        """Test that Aurora endpoints from outputs have valid format."""
        aurora_endpoint = self.outputs.get('aurora_endpoint')
        self.assertIsNotNone(aurora_endpoint, "Aurora endpoint not found in outputs")
        self.assertIsInstance(aurora_endpoint, str, "Aurora endpoint is not a string")
        self.assertGreater(len(aurora_endpoint), 0, "Aurora endpoint is empty")
        self.assertIn('.rds.amazonaws.com', aurora_endpoint, "Aurora endpoint does not contain .rds.amazonaws.com")

        aurora_reader_endpoint = self.outputs.get('aurora_reader_endpoint')
        self.assertIsNotNone(aurora_reader_endpoint, "Aurora reader endpoint not found in outputs")
        self.assertIsInstance(aurora_reader_endpoint, str, "Aurora reader endpoint is not a string")
        self.assertGreater(len(aurora_reader_endpoint), 0, "Aurora reader endpoint is empty")
        self.assertIn('.rds.amazonaws.com', aurora_reader_endpoint, "Aurora reader endpoint does not contain .rds.amazonaws.com")

    def test_api_gateway_url_is_valid_format(self):
        """Test that API Gateway URL from outputs has valid format."""
        api_url = self.outputs.get('api_gateway_url')
        self.assertIsNotNone(api_url, "API Gateway URL not found in outputs")
        self.assertIsInstance(api_url, str, "API Gateway URL is not a string")
        self.assertTrue(api_url.startswith('https://'), "API Gateway URL does not start with https://")
        self.assertIn('.execute-api.', api_url, "API Gateway URL does not contain execute-api")
        self.assertIn('.amazonaws.com', api_url, "API Gateway URL does not contain amazonaws.com")

    def test_api_key_id_is_present(self):
        """Test that API key ID is present in outputs."""
        api_key_id = self.outputs.get('api_key_id')
        self.assertIsNotNone(api_key_id, "API key ID not found in outputs")
        self.assertIsInstance(api_key_id, str, "API key ID is not a string")
        self.assertGreater(len(api_key_id), 0, "API key ID is empty")

    def test_secrets_manager_secret_arn_is_valid_format(self):
        """Test that Secrets Manager secret ARN from outputs has valid format."""
        secret_arn = self.outputs.get('secrets_manager_secret_arn')
        self.assertIsNotNone(secret_arn, "Secrets Manager secret ARN not found in outputs")
        self.assertIsInstance(secret_arn, str, "Secret ARN is not a string")
        self.assertTrue(secret_arn.startswith('arn:aws:secretsmanager:'), "Secret ARN does not start with correct prefix")
        self.assertIn(self.aws_region, secret_arn, f"Secret ARN does not contain region {self.aws_region}")

    def test_all_outputs_are_non_empty_strings(self):
        """Test that all outputs are non-empty strings."""
        for key, value in self.outputs.items():
            self.assertIsInstance(value, str, f"Output '{key}' is not a string")
            self.assertGreater(len(value), 0, f"Output '{key}' is empty")

    def test_vpc_id_format_is_valid(self):
        """Test that VPC ID has valid AWS format."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")
        self.assertTrue(vpc_id.startswith('vpc-'), "VPC ID does not start with 'vpc-'")
        self.assertGreaterEqual(len(vpc_id), 12, "VPC ID is too short")

    def test_aurora_endpoints_contain_region(self):
        """Test that Aurora endpoints contain the correct AWS region."""
        aurora_endpoint = self.outputs.get('aurora_endpoint')
        self.assertIsNotNone(aurora_endpoint, "Aurora endpoint not found in outputs")
        self.assertIn(self.aws_region, aurora_endpoint, f"Aurora endpoint does not contain region {self.aws_region}")

        aurora_reader_endpoint = self.outputs.get('aurora_reader_endpoint')
        self.assertIsNotNone(aurora_reader_endpoint, "Aurora reader endpoint not found in outputs")
        self.assertIn(self.aws_region, aurora_reader_endpoint, f"Aurora reader endpoint does not contain region {self.aws_region}")

    def test_api_gateway_url_contains_region(self):
        """Test that API Gateway URL contains the correct AWS region."""
        api_url = self.outputs.get('api_gateway_url')
        self.assertIsNotNone(api_url, "API Gateway URL not found in outputs")
        self.assertIn(self.aws_region, api_url, f"API Gateway URL does not contain region {self.aws_region}")


if __name__ == '__main__':
    unittest.main()
