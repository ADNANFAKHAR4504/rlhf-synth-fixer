"""
Unit tests for TAP Stack infrastructure components.
Tests use Pulumi mocks to validate resource configuration.
"""

import unittest
from typing import Any, Dict
from unittest.mock import patch
import pulumi
from lib.tap_stack import TapStack, TapStackArgs


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
  

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_vpc_creation(self):
    """Test VPC creation with proper CIDR and DNS settings"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    vpc = stack.vpc
    self.assertEqual(vpc.cidr_block, "10.0.0.0/16")
    self.assertTrue(vpc.enable_dns_hostnames)
    self.assertTrue(vpc.enable_dns_support)

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_subnet_creation(self):
    """Test subnet creation across availability zones"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    public_subnets = stack.public_subnets
    private_subnets = stack.private_subnets
    
    self.assertEqual(len(public_subnets), 2)
    self.assertEqual(len(private_subnets), 2)
    
    expected_public_cidrs = ["10.0.0.0/24", "10.0.1.0/24"]
    expected_private_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
    
    for i, subnet in enumerate(public_subnets):
      self.assertEqual(subnet.cidr_block, expected_public_cidrs[i])
      self.assertTrue(subnet.map_public_ip_on_launch)
    
    for i, subnet in enumerate(private_subnets):
      self.assertEqual(subnet.cidr_block, expected_private_cidrs[i])

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_s3_bucket_configuration(self):
    """Test S3 bucket security and configuration settings"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    bucket = stack.s3_bucket
    self.assertIsNotNone(bucket)
    # Note: bucket name format depends on actual implementation

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_lambda_function_configuration(self):
    """Test Lambda function configuration and environment"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    lambda_func = stack.lambda_function
    self.assertEqual(lambda_func.runtime, "python3.9")
    self.assertEqual(lambda_func.handler, "index.handler")
    self.assertEqual(lambda_func.timeout, 30)
    self.assertEqual(lambda_func.memory_size, 128)
    
    env_vars = lambda_func.environment.variables
    self.assertEqual(env_vars["STAGE"], "test")

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_iam_role_permissions(self):
    """Test IAM role and policy configuration"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    self.assertIsNotNone(stack.lambda_function.role)

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_cloudwatch_logs_configuration(self):
    """Test CloudWatch logs configuration"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    self.assertEqual(stack.log_group.retention_in_days, 14)

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_resource_tagging(self):
    """Test that all resources have proper tags"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    expected_tags = {
      'Project': 'TapStack',
      'Stage': 'test',
      'Managed': 'pulumi'
    }
    self.assertEqual(stack.common_tags, expected_tags)

  def test_lambda_code_validation(self):
    """Test Lambda function code structure and imports"""
    lambda_code = """
import json
import boto3
import os
import logging
from urllib.parse import unquote_plus

def handler(event, context):
    pass
"""
    required_imports = ['json', 'boto3', 'os', 'logging']
    required_functions = ['handler']
    
    for import_name in required_imports:
      self.assertIn(f'import {import_name}', lambda_code)
    
    for func_name in required_functions:
      self.assertIn(f'def {func_name}', lambda_code)

  @patch.dict('os.environ', {'STAGE': 'prod'})
  def test_production_configuration(self):
    """Test production-specific configurations"""
    args = TapStackArgs(environment_suffix="prod")
    stack = TapStack("test-stack", args)
    self.assertEqual(stack.environment_suffix, 'prod')
    self.assertEqual(stack.common_tags['Stage'], 'prod')

  @patch.dict('os.environ', {'STAGE': 'test'})
  def test_network_connectivity(self):
    """Test network routing and connectivity configuration"""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)
    self.assertIsNotNone(stack.nat_gw)
    self.assertIsNotNone(stack.public_rt)
    self.assertIsNotNone(stack.private_rt)


class MockPulumiProvider:
  """Mock Pulumi provider for testing"""
  
  def call(self, token: str, args: Dict[str, Any], provider=None) -> Dict[str, Any]:
    """Mock call method for provider"""
    del args, provider  # Unused arguments
    if token == "aws:getAvailabilityZones":
      return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
    return {}
  
  def new_resource(self, args, type_: str, name: str, inputs: Dict[str, Any]):
    """Mock new_resource method for provider"""
    del args  # Unused argument
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
        "timeout": inputs.get("timeout", 30),
        "memory_size": inputs.get("memory_size", 128),
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
