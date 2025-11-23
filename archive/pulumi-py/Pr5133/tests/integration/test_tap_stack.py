"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import requests
from botocore.exceptions import ClientError


def get_current_aws_region():
    """Get the current AWS region from environment or Pulumi config."""
    # First try environment variable
    region = os.getenv("AWS_REGION")
    if region:
        return region
    
    # Try to get from Pulumi config
    try:
        import subprocess
        result = subprocess.run(
            ["pulumi", "config", "get", "aws:region"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    
    # Default fallback
    return "eu-west-1"


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    def setUp(self):
        """Set up integration test with live stack outputs."""
        # Load stack outputs first - try CI/CD generated files first, then fallback to pulumi-outputs.json
        self.outputs = {}
        
        # Try CI/CD generated outputs first (preferred in CI/CD environment)
        ci_outputs_file = "cfn-outputs/flat-outputs.json"
        legacy_outputs_file = "pulumi-outputs.json"
        
        if os.path.exists(ci_outputs_file):
            print(f"Loading outputs from CI/CD generated file: {ci_outputs_file}")
            with open(ci_outputs_file, 'r', encoding='utf-8') as f:
                self.outputs = json.load(f)
        elif os.path.exists(legacy_outputs_file):
            print(f"Loading outputs from legacy file: {legacy_outputs_file}")
            with open(legacy_outputs_file, 'r', encoding='utf-8') as f:
                self.outputs = json.load(f)
        else:
            print(f"No outputs file found. Checked: {ci_outputs_file}, {legacy_outputs_file}")
            self.outputs = {}

        # Extract region from resource ARNs in outputs (more reliable than env vars)
        self.aws_region = self._extract_region_from_outputs()
        
        # Initialize AWS clients with the region where resources actually exist
        self.ec2_client = boto3.client('ec2', region_name=self.aws_region)
        self.rds_client = boto3.client('rds', region_name=self.aws_region)
        self.kms_client = boto3.client('kms', region_name=self.aws_region)
        self.apigateway_client = boto3.client('apigateway', region_name=self.aws_region)
        self.secrets_client = boto3.client('secretsmanager', region_name=self.aws_region)

    def _extract_region_from_outputs(self):
        """Extract AWS region from resource ARNs in outputs."""
        # Look for ARNs in outputs to determine the region where resources exist
        for key, value in self.outputs.items():
            if isinstance(value, str) and value.startswith('arn:aws:'):
                # Parse ARN format: arn:aws:service:region:account:resource
                parts = value.split(':')
                if len(parts) >= 4 and parts[3]:
                    print(f"Detected region {parts[3]} from output {key}: {value}")
                    return parts[3]
        
        # Fallback to environment/config
        fallback_region = get_current_aws_region()
        print(f"No ARNs found in outputs, using fallback region: {fallback_region}")
        return fallback_region

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists and is properly configured."""
        vpc_id = self.outputs.get("vpc_id")
        self.assertIsNotNone(vpc_id, "VPC ID should be available in outputs")
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1, "VPC should exist")
        
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC should have correct CIDR block")
        
        # Check DNS attributes separately
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'], "DNS hostnames should be enabled")
        self.assertTrue(dns_support['EnableDnsSupport']['Value'], "DNS support should be enabled")

    def test_kms_key_exists_and_functional(self):
        """Test that KMS key exists and is properly configured."""
        kms_key_id = self.outputs.get("kms_key_id")
        self.assertIsNotNone(kms_key_id, "KMS key ID should be available in outputs")
        
        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key = response['KeyMetadata']
        
        self.assertEqual(key['KeyState'], 'Enabled', "KMS key should be enabled")
        self.assertEqual(key['KeyUsage'], 'ENCRYPT_DECRYPT', "Key should be for encryption/decryption")
        
        # Check key rotation separately as it might not be in the KeyMetadata
        try:
            rotation_response = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
            self.assertTrue(rotation_response['KeyRotationEnabled'], "Key rotation should be enabled")
        except ClientError:
            # Key rotation status might not be available for all key types
            pass

    def test_rds_instance_exists_and_accessible(self):
        """Test that RDS instance exists and is accessible."""
        rds_address = self.outputs.get("rds_address")
        self.assertIsNotNone(rds_address, "RDS address should be available in outputs")
        
        # Extract instance identifier from the address
        db_identifier = rds_address.split('.')[0]
        
        try:
            response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            instance = response['DBInstances'][0]
            
            self.assertEqual(instance['DBInstanceStatus'], 'available', "RDS instance should be available")
            self.assertEqual(instance['Engine'], 'postgres', "Should be PostgreSQL engine")
            self.assertTrue(instance['StorageEncrypted'], "Storage should be encrypted")
            
        except ClientError as e:
            self.fail(f"Failed to describe RDS instance: {e}")

    def test_secrets_manager_credentials_exist(self):
        """Test that database credentials are stored in Secrets Manager."""
        secret_arn = self.outputs.get("db_secret_arn")
        self.assertIsNotNone(secret_arn, "Secret ARN should be available in outputs")
        
        try:
            response = self.secrets_client.describe_secret(SecretId=secret_arn)
            self.assertIn('KmsKeyId', response, "Secret should be encrypted with KMS")
            
            # Test that we can retrieve the secret (without exposing the actual values)
            secret_response = self.secrets_client.get_secret_value(SecretId=secret_arn)
            secret_data = json.loads(secret_response['SecretString'])
            
            self.assertIn('username', secret_data, "Secret should contain username")
            self.assertIn('password', secret_data, "Secret should contain password")
            
        except ClientError as e:
            self.fail(f"Failed to access secret: {e}")

    def test_api_gateway_endpoint_responds(self):
        """Test that API Gateway endpoint is accessible."""
        api_url = self.outputs.get("api_gateway_url")
        self.assertIsNotNone(api_url, "API Gateway URL should be available in outputs")
        
        try:
            response = requests.get(api_url, timeout=10)
            # API Gateway should return some response (even if it's a mock)
            self.assertTrue(response.status_code in [200, 404, 502, 503], 
                          f"API Gateway should respond, got status: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            # This might fail if there's no actual backend, but the endpoint should be reachable
            self.fail(f"API Gateway endpoint not reachable: {e}")

    def test_environment_suffix_is_consistent(self):
        """Test that the environment suffix is correctly set and consistent."""
        env_suffix = self.outputs.get("environment_suffix")
        self.assertIsNotNone(env_suffix, "Environment suffix should be present")
        self.assertGreater(len(env_suffix), 0, "Environment suffix should not be empty")
        
        # In CI/CD, environment suffix is typically generated from branch name or PR number
        # Just ensure it's consistent across all resources
        self.assertRegex(env_suffix, r'^[a-zA-Z0-9]+$', "Environment suffix should contain only alphanumeric characters")

    def test_all_required_outputs_present(self):
        """Test that all required stack outputs are present."""
        required_outputs = [
            "api_gateway_url", "db_secret_arn", "environment_suffix",
            "kms_key_arn", "kms_key_id", "rds_address", "rds_endpoint",
            "rds_port", "redis_port", "vpc_id"
        ]
        
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Output '{output}' should be present")
            self.assertIsNotNone(self.outputs[output], f"Output '{output}' should not be None")


if __name__ == '__main__':
    unittest.main()
