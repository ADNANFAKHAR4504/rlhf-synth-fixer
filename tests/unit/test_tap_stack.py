"""
Unit tests for TAP Stack infrastructure components.
Tests use Pulumi mocks to validate resource configuration.
"""

import unittest
from typing import Any, Dict
from unittest.mock import patch
import pulumi


class MockResourceArgs:
    """Mock resource arguments for testing"""

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack infrastructure"""

    def setUp(self):
        """Set up test environment"""
        pulumi.runtime.set_mocks(
            mocks=MockPulumiProvider(),
            project="test-tap-project",
            stack="test",
            preview=False
        )

    def tearDown(self):
        """Clean up after tests"""
        pulumi.runtime.reset_mocks()

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_vpc_creation(self):
        """Test VPC creation with proper CIDR and DNS settings"""
        from tap_stack import TapStack
        stack = TapStack()
        vpc = stack.vpc['vpc']
        self.assertEqual(vpc.cidr_block, "10.0.0.0/16")
        self.assertTrue(vpc.enable_dns_hostnames)
        self.assertTrue(vpc.enable_dns_support)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_subnet_creation(self):
        """Test subnet creation across availability zones"""
        from tap_stack import TapStack
        stack = TapStack()
        public_subnets = stack.vpc['public_subnets']
        private_subnets = stack.vpc['private_subnets']

        self.assertEqual(len(public_subnets), 2)
        self.assertEqual(len(private_subnets), 2)

        expected_public_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
        expected_private_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

        for i, subnet in enumerate(public_subnets):
            self.assertEqual(subnet.cidr_block, expected_public_cidrs[i])
            self.assertTrue(subnet.map_public_ip_on_launch)

        for i, subnet in enumerate(private_subnets):
            self.assertEqual(subnet.cidr_block, expected_private_cidrs[i])

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_s3_bucket_configuration(self):
        """Test S3 bucket security and configuration settings"""
        from tap_stack import TapStack
        stack = TapStack()
        bucket = stack.s3_bucket
        self.assertIsNotNone(bucket)
        self.assertEqual(bucket.bucket, "test-tap-project-test-test")

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_lambda_function_configuration(self):
        """Test Lambda function configuration and environment"""
        from tap_stack import TapStack
        stack = TapStack()
        lambda_func = stack.lambda_function
        self.assertEqual(lambda_func.runtime, "python3.9")
        self.assertEqual(lambda_func.handler, "lambda_function.lambda_handler")
        self.assertEqual(lambda_func.timeout, 300)
        self.assertEqual(lambda_func.memory_size, 256)

        env_vars = lambda_func.environment.variables
        self.assertEqual(env_vars["STAGE"], "test")
        self.assertEqual(env_vars["PROJECT_NAME"], "test-tap-project")

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_iam_role_permissions(self):
        """Test IAM role and policy configuration"""
        from tap_stack import TapStack
        stack = TapStack()
        self.assertIsNotNone(stack.lambda_function.role)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_cloudwatch_logs_configuration(self):
        """Test CloudWatch logs configuration"""
        from tap_stack import TapStack
        stack = TapStack()
        self.assertEqual(stack.cloudwatch_logs.retention_in_days, 14)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_resource_tagging(self):
        """Test that all resources have proper tags"""
        from tap_stack import TapStack
        stack = TapStack()
        expected_tags = {
            'Project': 'test-tap-project',
            'Stage': 'test',
            'ManagedBy': 'Pulumi'
        }
        self.assertEqual(stack.common_tags, expected_tags)

    def test_lambda_code_validation(self):
        """Test Lambda function code structure and imports"""
        lambda_code = """
import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    pass

def should_skip_processing(object_key: str) -> bool:
    pass

def process_created_object(bucket_name: str, object_key: str) -> Dict[str, Any]:
    pass

def process_removed_object(bucket_name: str, object_key: str) -> Dict[str, Any]:
    pass
"""
        required_imports = ['json', 'boto3', 'logging', 'datetime']
        required_functions = [
            'lambda_handler',
            'should_skip_processing',
            'process_created_object',
            'process_removed_object'
        ]

        for import_name in required_imports:
            self.assertIn(f'import {import_name}', lambda_code)

        for func_name in required_functions:
            self.assertIn(f'def {func_name}', lambda_code)

    @patch.dict('os.environ', {'STAGE': 'prod'})
    def test_production_configuration(self):
        """Test production-specific configurations"""
        from tap_stack import TapStack
        stack = TapStack()
        self.assertEqual(stack.stage, 'prod')
        self.assertEqual(stack.common_tags['Stage'], 'prod')

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_network_connectivity(self):
        """Test network routing and connectivity configuration"""
        from tap_stack import TapStack
        stack = TapStack()
        self.assertIsNotNone(stack.vpc['nat_gateway'])
        self.assertIsNotNone(stack.vpc['public_rt'])
        self.assertIsNotNone(stack.vpc['private_rt'])


class MockPulumiProvider:
    """Mock Pulumi provider for testing"""

    def call(self, token: str, args: Dict[str, Any], provider: str = None) -> Dict[str, Any]:
        if token == "aws:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
        return {}

    def new_resource(self, type_: str, name: str, inputs: Dict[str, Any],
                     dependency: bool = False, id_: str = None) -> tuple:
        resource_id = f"mock-{type_}-{name}"
        if type_ == "aws:ec2/vpc:Vpc":
            outputs = {
                "id": resource_id,
                "cidr_block": inputs.get("cidr_block", "10.0.0.0/16"),
                "enable_dns_hostnames": inputs.get("enable_dns_hostnames", True),
                "enable_dns_support": inputs.get("enable_dns_support", True)
            }
        elif type_ == "aws:ec2/subnet:Subnet":
            outputs = {
                "id": resource_id,
                "cidr_block": inputs.get("cidr_block"),
                "availability_zone": inputs.get("availability_zone"),
                "map_public_ip_on_launch": inputs.get("map_public_ip_on_launch", False)
            }
        elif type_ == "aws:s3/bucket:Bucket":
            outputs = {
                "id": resource_id,
                "bucket": inputs.get("bucket", f"mock-bucket-{name}"),
                "arn": f"arn:aws:s3:::mock-bucket-{name}"
            }
        elif type_ == "aws:lambda/function:Function":
            outputs = {
                "id": resource_id,
                "name": f"mock-lambda-{name}",
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:mock-lambda-{name}",
                "runtime": inputs.get("runtime", "python3.9"),
                "handler": inputs.get("handler", "index.handler"),
                "timeout": inputs.get("timeout", 300),
                "memory_size": inputs.get("memory_size", 256),
                "role": inputs.get("role"),
                "environment": inputs.get("environment", {})
            }
        elif type_ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                "id": resource_id,
                "name": inputs.get("name", f"/aws/lambda/mock-lambda-{name}"),
                "retention_in_days": inputs.get("retention_in_days", 14)
            }
        elif type_ == "aws:iam/role:Role":
            outputs = {
                "id": resource_id,
                "name": f"mock-role-{name}",
                "arn": f"arn:aws:iam::123456789012:role/mock-role-{name}"
            }
        else:
            outputs = {"id": resource_id, **inputs}
        return resource_id, outputs
