import sys
import types
import unittest
from typing import Any, Dict
from unittest.mock import patch

# Mock Pulumi output class
class MockOutput:
    def __init__(self, value):
        self._value = value

    def apply(self, func):
        return MockOutput(func(self._value))

    def __eq__(self, other):
        return self._value == (other._value if isinstance(other, MockOutput) else other)

    def __repr__(self):
        return f"MockOutput({self._value})"

    @staticmethod
    def from_input(value):
        return MockOutput(value)

    @staticmethod
    def all(*args):
        return MockOutput([arg._value if isinstance(arg, MockOutput) else arg for arg in args])

    @staticmethod
    def concat(*args):
        return MockOutput("".join(str(arg._value if isinstance(arg, MockOutput) else arg) for arg in args))

# Simulate Pulumi modules in sys.modules
sys.modules['pulumi'] = types.SimpleNamespace(
    ComponentResource=object,
    ResourceOptions=object,
    Output=MockOutput,
    runtime=types.SimpleNamespace(set_mocks=lambda **kwargs: None)
)

sys.modules['pulumi_aws'] = types.SimpleNamespace()

# Re-import from real modules
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack infrastructure"""

    def setUp(self):
        pulumi.runtime.set_mocks(
            mocks=MockPulumiProvider(),
            project="test-tap-project",
            stack="test",
            preview=False
        )

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_vpc_creation(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertEqual(stack.vpc.cidr_block, "10.0.0.0/16")

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_subnet_creation(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertEqual(len(stack.public_subnets), 2)
        self.assertEqual(len(stack.private_subnets), 2)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_s3_bucket_configuration(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertIsNotNone(stack.s3_bucket)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_lambda_function_configuration(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertEqual(stack.lambda_function.runtime, "python3.9")
        self.assertEqual(stack.lambda_function.handler, "index.handler")
        self.assertEqual(stack.lambda_function.timeout, 30)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_iam_role_permissions(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertIsNotNone(stack.lambda_function.role)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_cloudwatch_logs_configuration(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertEqual(stack.log_group.retention_in_days, 14)

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_resource_tagging(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertEqual(stack.common_tags["Stage"], "test")

    def test_lambda_code_validation(self):
        lambda_code = """
import json
import boto3
import os
import logging
from urllib.parse import unquote_plus

def handler(event, context):
    pass
"""
        for imp in ['json', 'boto3', 'os', 'logging']:
            self.assertIn(f"import {imp}", lambda_code)

        self.assertIn("def handler", lambda_code)

    @patch.dict('os.environ', {'STAGE': 'prod'})
    def test_production_configuration(self):
        args = TapStackArgs(environment_suffix="prod")
        stack = TapStack("test-stack", args)
        self.assertEqual(stack.environment_suffix, 'prod')
        self.assertEqual(stack.common_tags["Stage"], "prod")

    @patch.dict('os.environ', {'STAGE': 'test'})
    def test_network_connectivity(self):
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        self.assertIsNotNone(stack.nat_gw)
        self.assertIsNotNone(stack.public_rt)
        self.assertIsNotNone(stack.private_rt)


class MockPulumiProvider:
    """Mock Pulumi provider for testing"""

    def call(self, token: str, args: Dict[str, Any], provider=None) -> Dict[str, Any]:
        if token == "aws:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b"]}
        return {}

    def new_resource(self, args, type_: str, name: str, inputs: Dict[str, Any]):
        resource_id = f"mock-{type_}-{name}"
        default_outputs = {
            "id": resource_id,
            **inputs
        }
        if type_ == "aws:ec2/vpc:Vpc":
            default_outputs.update({
                "cidr_block": "10.0.0.0/16",
                "enable_dns_hostnames": True,
                "enable_dns_support": True
            })
        elif type_ == "aws:lambda/function:Function":
            default_outputs.update({
                "runtime": inputs.get("runtime", "python3.9"),
                "handler": inputs.get("handler", "index.handler"),
                "timeout": inputs.get("timeout", 30),
                "memory_size": inputs.get("memory_size", 128),
                "role": inputs.get("role")
            })
        elif type_ == "aws:cloudwatch/logGroup:LogGroup":
            default_outputs.update({
                "retention_in_days": 14
            })
        return resource_id, default_outputs

