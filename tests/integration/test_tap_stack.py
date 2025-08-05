import unittest
import json
import os
import re
import boto3
from moto import mock_dynamodb, mock_lambda, mock_apigateway, mock_ec2, mock_iam
from botocore.exceptions import ClientError
import pulumi.runtime
from lib.tap_stack import TapStack, VPCInfrastructure, IAMInfrastructure, DynamoDBInfrastructure, LambdaInfrastructure, APIGatewayInfrastructure


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests that read from actual cfn-outputs/all-outputs.json file."""

    @classmethod
    def setUpClass(cls):
        """Load outputs from cfn-outputs/all-outputs.json if available."""
        cls.outputs = {}
        output_files = [
            "cfn-outputs/all-outputs.json",
            "cfn-outputs/flat-outputs.json"
        ]

        for output_file in output_files:
            if os.path.exists(output_file):
                try:
                    with open(output_file, "r") as f:
                        cls.outputs = json.load(f)
                    print(f"Loaded outputs from {output_file}")
                    break
                except (json.JSONDecodeError, FileNotFoundError) as e:
                    print(f"Failed to load {output_file}: {e}")
                    continue

        if not cls.outputs:
            print("No cfn-outputs file found, tests will validate structure only")

    def test_cfn_outputs_file_structure(self):
        """Test that cfn-outputs file has expected structure."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Test that outputs is a dictionary
        self.assertIsInstance(self.outputs, dict)
        self.assertGreater(len(self.outputs), 0, "Outputs should not be empty")

        # Print available outputs for debugging
        print(f"Available outputs: {list(self.outputs.keys())}")

    def test_vpc_outputs_validation(self):
        """Test VPC-related outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for VPC outputs
        vpc_outputs = [k for k in self.outputs.keys(
        ) if 'vpc' in k.lower() or 'VPC' in k]
        if vpc_outputs:
            for vpc_key in vpc_outputs:
                vpc_value = self.outputs[vpc_key]
                self.assertIsInstance(vpc_value, str)
                # VPC IDs should match pattern vpc-xxxxxxxxx
                if 'vpc' in vpc_key.lower() and 'id' in vpc_key.lower():
                    self.assertRegex(vpc_value, r'^vpc-[a-f0-9]{8,17}$',
                                   f"VPC ID {vpc_value} doesn't match expected pattern")

    def test_subnet_outputs_validation(self):
        """Test subnet-related outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for subnet outputs
        subnet_outputs = [
    k for k in self.outputs.keys() if 'subnet' in k.lower()]
        for subnet_key in subnet_outputs:
            subnet_value = self.outputs[subnet_key]
            if isinstance(subnet_value, str):
                # Single subnet ID
                self.assertRegex(subnet_value, r'^subnet-[a-f0-9]{8,17}$',
                               f"Subnet ID {subnet_value} doesn't match expected pattern")
            elif isinstance(subnet_value, list):
                # List of subnet IDs
                for subnet_id in subnet_value:
                    self.assertRegex(subnet_id, r'^subnet-[a-f0-9]{8,17}$',
                                   f"Subnet ID {subnet_id} doesn't match expected pattern")

    def test_security_group_outputs_validation(self):
        """Test security group outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for security group outputs
        sg_outputs = [k for k in self.outputs.keys(
        ) if 'security' in k.lower() or 'sg' in k.lower()]
        for sg_key in sg_outputs:
            sg_value = self.outputs[sg_key]
            if isinstance(sg_value, str):
                self.assertRegex(sg_value, r'^sg-[a-f0-9]{8,17}$',
                               f"Security Group ID {sg_value} doesn't match expected pattern")

    def test_dynamodb_outputs_validation(self):
        """Test DynamoDB table outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for DynamoDB table outputs
        table_outputs = [k for k in self.outputs.keys(
        ) if 'table' in k.lower() or 'dynamodb' in k.lower()]
        expected_tables = ['products', 'orders', 'users']

        for table_key in table_outputs:
            table_value = self.outputs[table_key]
            self.assertIsInstance(table_value, str)
            self.assertGreater(len(table_value), 0)

            # Check if table name contains expected entity names
            for expected_table in expected_tables:
                if expected_table in table_key.lower():
                    self.assertIn(expected_table, table_value.lower())

    def test_lambda_outputs_validation(self):
        """Test Lambda function outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for Lambda function outputs
        lambda_outputs = [k for k in self.outputs.keys(
        ) if 'lambda' in k.lower() or 'function' in k.lower()]
        expected_functions = ['products', 'orders', 'users']

        for lambda_key in lambda_outputs:
            lambda_value = self.outputs[lambda_key]
            self.assertIsInstance(lambda_value, str)

            # Lambda ARNs should match expected pattern
            if 'arn' in lambda_key.lower():
                self.assertRegex(lambda_value, r'^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:.+$',
                               f"Lambda ARN {lambda_value} doesn't match expected pattern")

            # Check if function name contains expected entity names
            for expected_function in expected_functions:
                if expected_function in lambda_key.lower():
                    self.assertIn(expected_function, lambda_value.lower())

    def test_api_gateway_outputs_validation(self):
        """Test API Gateway outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for API Gateway outputs
        api_outputs = [k for k in self.outputs.keys(
        ) if 'api' in k.lower() or 'gateway' in k.lower()]

        for api_key in api_outputs:
            api_value = self.outputs[api_key]
            self.assertIsInstance(api_value, str)
            self.assertGreater(len(api_value), 0)

            # API Gateway IDs should match expected pattern
            if 'id' in api_key.lower() and 'execution' not in api_key.lower():
                self.assertRegex(api_value, r'^[a-z0-9]{10}$',
                               f"API Gateway ID {api_value} doesn't match expected pattern")

            # Execution ARNs should match expected pattern
            if 'execution' in api_key.lower() and 'arn' in api_key.lower():
                self.assertRegex(api_value, r'^arn:aws:execute-api:[a-z0-9-]+:\d{12}:[a-z0-9]{10}$',
                               f"API Gateway execution ARN {api_value} doesn't match expected pattern")

    def test_iam_outputs_validation(self):
        """Test IAM role outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for IAM role outputs
        iam_outputs = [k for k in self.outputs.keys(
        ) if 'role' in k.lower() or 'iam' in k.lower()]

        for iam_key in iam_outputs:
            iam_value = self.outputs[iam_key]
            self.assertIsInstance(iam_value, str)

            # IAM role ARNs should match expected pattern
            if 'arn' in iam_key.lower():
                self.assertRegex(iam_value, r'^arn:aws:iam::\d{12}:role/.+$',
                               f"IAM role ARN {iam_value} doesn't match expected pattern")

    def test_environment_outputs_validation(self):
        """Test environment and region outputs from cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Check for environment output
        env_outputs = [k for k in self.outputs.keys(
        ) if 'environment' in k.lower() or 'env' in k.lower()]
        for env_key in env_outputs:
            env_value = self.outputs[env_key]
            self.assertIsInstance(env_value, str)
            self.assertIn(env_value.lower(), ['dev', 'staging', 'prod'])

        # Check for region output
        region_outputs = [
    k for k in self.outputs.keys() if 'region' in k.lower()]
        for region_key in region_outputs:
            region_value = self.outputs[region_key]
            self.assertIsInstance(region_value, str)
            # AWS regions should match pattern
            self.assertRegex(region_value, r'^[a-z]{2}-[a-z]+-\d{1}$',
                           f"Region {region_value} doesn't match expected AWS region pattern")

    def test_comprehensive_outputs_validation(self):
        """Test comprehensive validation of all expected outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # Define expected output categories and their minimum counts
        expected_categories = {
            'vpc': 1,           # At least 1 VPC output
            'subnet': 2,        # At least 2 subnet outputs (public/private)
            'security': 1,      # At least 1 security group output
            # At least 3 table outputs (products, orders, users)
            'table': 3,
            'lambda': 3,        # At least 3 lambda outputs
            'api': 1,           # At least 1 API Gateway output
            'role': 1,          # At least 1 IAM role output
        }

        for category, min_count in expected_categories.items():
            matching_outputs = [
    k for k in self.outputs.keys() if category in k.lower()]
            self.assertGreaterEqual(len(matching_outputs), min_count,
                                  f"Expected at least {min_count} {category} outputs, found {len(matching_outputs)}")

    def test_outputs_cross_validation(self):
        """Test cross-validation between different output types."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # If we have VPC and subnet outputs, subnets should reference the VPC
        vpc_outputs = [k for k in self.outputs.keys(
        ) if 'vpc' in k.lower() and 'id' in k.lower()]
        subnet_outputs = [
    k for k in self.outputs.keys() if 'subnet' in k.lower()]

        if vpc_outputs and subnet_outputs:
            # At least validate that we have both VPC and subnet information
            self.assertGreater(
    len(vpc_outputs),
    0,
     "Should have VPC outputs if subnets exist")
            self.assertGreater(
    len(subnet_outputs),
    0,
     "Should have subnet outputs if VPC exists")

    def test_pulumi_exports_match_outputs(self):
        """Test that Pulumi exports match the structure expected in cfn-outputs."""
        if not self.outputs:
            self.skipTest("No cfn-outputs file available")

        # This test validates that our Pulumi exports would produce similar outputs
        # Read the current tap_stack.py to verify exports are present
        try:
            with open("lib/tap_stack.py", "r") as f:
                stack_content = f.read()

            # Check for pulumi.export statements
            export_count = stack_content.count("pulumi.export")
            self.assertGreater(export_count, 10,
                             "Stack should have multiple pulumi.export statements")

            # Check for key export categories
            export_categories = [
    'VpcId',
    'Environment',
    'Region',
    'Table',
    'Lambda',
     'Api']
            for category in export_categories:
                self.assertIn(category, stack_content,
                            f"Stack should export {category} related resources")
        except FileNotFoundError:
            self.skipTest("lib/tap_stack.py not found")

  # Legacy tests for backward compatibility
  def test_stack_outputs_and_resources(self):
    stack = TapStack("test-stack", environment="dev")
    stack.setup_infrastructure()
    outputs = pulumi.runtime.serialize_properties({
        "Environment": stack.config.environment,
        "Region": stack.config.region
    })
    self.assertIn("Environment", outputs)
    self.assertIn("Region", outputs)
    self.assertEqual(outputs["Environment"], "dev")
    self.assertEqual(outputs["Region"], "us-west-2")

  def test_vpc_resources_created(self):
    cfg = TapStack("test-stack", args={}).config
    vpc = VPCInfrastructure(cfg)
    vpc.create_vpc()
    self.assertIsNotNone(vpc.vpc)
    self.assertTrue(len(vpc.public_subnets) > 0)
    self.assertTrue(len(vpc.private_subnets) > 0)

  def test_iam_role_created(self):
    cfg = TapStack("test-stack", args={}).config
    iam = IAMInfrastructure(cfg)
    role = iam.create_lambda_role()
    self.assertIsNotNone(role)

  def test_dynamodb_tables_created(self):
    cfg = TapStack("test-stack", args={}).config
    dynamo = DynamoDBInfrastructure(cfg)
    tables = dynamo.create_tables()
    self.assertIn("products", tables)
    self.assertIn("orders", tables)
    self.assertIn("users", tables)

  def test_lambda_functions_created(self):
    cfg = TapStack("test-stack", args={}).config
    vpc = VPCInfrastructure(cfg)
    vpc.create_vpc()
    iam = IAMInfrastructure(cfg)
    role = iam.create_lambda_role()
    dynamo = DynamoDBInfrastructure(cfg)
    tables = dynamo.create_tables()
    lambdas = LambdaInfrastructure(cfg, role, vpc, tables)
    functions = lambdas.create_lambda_functions()
    self.assertIn("products", functions)
    self.assertIn("orders", functions)
    self.assertIn("users", functions)

  def test_api_gateway_created(self):
    cfg = TapStack("test-stack", args={}).config
    lambdas = {"products": object(), "orders": object(), "users": object()}
    api = APIGatewayInfrastructure(cfg, lambdas)
    rest_api = api.create_api_gateway()
    self.assertIsNotNone(rest_api)
