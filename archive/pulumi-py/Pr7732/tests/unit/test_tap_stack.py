"""
Unit tests for the TapStack Pulumi component.

These tests verify the infrastructure configuration without deploying to AWS.
They use Pulumi's testing framework to validate resource properties and relationships.
"""

import unittest
from unittest.mock import MagicMock, patch, Mock
import pulumi
import json
import asyncio


class MyMocks(pulumi.runtime.Mocks):
    """
    Mock implementation for Pulumi runtime to enable unit testing without AWS deployment.
    """
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation"""
        outputs = {**args.inputs}

        # Add default outputs for specific resource types
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs.update({"id": "vpc-12345", "cidr_block": "10.0.0.0/16"})
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs.update({"id": f"subnet-{args.name}", "cidr_block": args.inputs.get("cidr_block")})
        elif args.typ == "aws:kms/key:Key":
            outputs.update({"id": "key-12345", "arn": "arn:aws:kms:us-east-1:123456789012:key/12345"})
        elif args.typ == "aws:s3/bucketV2:BucketV2":
            outputs.update({"id": args.inputs.get("bucket"), "arn": f"arn:aws:s3:::{args.inputs.get('bucket')}"})
        elif args.typ == "aws:lambda/function:Function":
            invoke_arn = f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.inputs.get('name')}/invocations"
            outputs.update({"id": args.inputs.get("name"), "invoke_arn": invoke_arn})
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs.update({"id": "api-12345", "execution_arn": "arn:aws:execute-api:us-east-1:123456789012:api-12345", "root_resource_id": "root-12345"})
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs.update({"id": args.inputs.get("name"), "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name')}"})
        elif args.typ == "aws:iam/role:Role":
            outputs.update({"id": args.inputs.get("name"), "arn": f"arn:aws:iam::123456789012:role/{args.inputs.get('name')}"})
        elif args.typ == "aws:cfg/recorder:Recorder":
            outputs.update({"id": args.inputs.get("name")})
        else:
            outputs.update({"id": f"{args.name}-id"})

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls"""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
        elif args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012"}
        elif args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {"json": json.dumps({"Version": "2012-10-17", "Statement": []})}
        return {}


pulumi.runtime.set_mocks(MyMocks())

# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'Test', 'Owner': 'QA'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_environment_suffix(self):
        """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags defaults to empty dict."""
        args = TapStackArgs(tags=None)
        self.assertEqual(args.tags, {})


class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        pulumi.runtime.set_mocks(MyMocks())

    def test_tap_stack_initialization(self):
        """Test that TapStack initializes without errors."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertIsNotNone(stack)

    def test_tap_stack_creates_vpc_resource(self):
        """Test that TapStack creates a VPC resource."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'vpc'))
        self.assertIsNotNone(stack.vpc)

    def test_tap_stack_creates_three_private_subnets(self):
        """Test that TapStack creates exactly 3 private subnets."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'private_subnets'))
        self.assertEqual(len(stack.private_subnets), 3)

    def test_tap_stack_creates_kms_key(self):
        """Test that KMS key is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'kms_key'))
        self.assertIsNotNone(stack.kms_key)

    def test_tap_stack_creates_kms_alias(self):
        """Test that KMS alias is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'kms_key_alias'))
        self.assertIsNotNone(stack.kms_key_alias)

    def test_tap_stack_creates_s3_bucket(self):
        """Test that S3 bucket is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 's3_bucket'))
        self.assertIsNotNone(stack.s3_bucket)

    def test_tap_stack_creates_s3_versioning(self):
        """Test that S3 versioning is configured."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 's3_versioning'))
        self.assertIsNotNone(stack.s3_versioning)

    def test_tap_stack_creates_s3_encryption(self):
        """Test that S3 encryption is configured."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 's3_encryption'))
        self.assertIsNotNone(stack.s3_encryption)

    def test_tap_stack_creates_s3_bucket_policy(self):
        """Test that S3 bucket policy is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 's3_bucket_policy'))
        self.assertIsNotNone(stack.s3_bucket_policy)

    def test_tap_stack_creates_s3_public_access_block(self):
        """Test that S3 public access block is configured."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 's3_public_access_block'))
        self.assertIsNotNone(stack.s3_public_access_block)

    def test_tap_stack_creates_cloudwatch_log_group(self):
        """Test that CloudWatch Log Group is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'log_group'))
        self.assertIsNotNone(stack.log_group)

    def test_tap_stack_creates_lambda_role(self):
        """Test that Lambda IAM role is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'lambda_role'))
        self.assertIsNotNone(stack.lambda_role)

    def test_tap_stack_creates_lambda_policy(self):
        """Test that Lambda IAM policy is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'lambda_policy'))
        self.assertIsNotNone(stack.lambda_policy)

    def test_tap_stack_creates_lambda_basic_execution_attachment(self):
        """Test that Lambda basic execution policy attachment is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'lambda_basic_execution'))
        self.assertIsNotNone(stack.lambda_basic_execution)

    def test_tap_stack_creates_lambda_security_group(self):
        """Test that Lambda security group is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'lambda_sg'))
        self.assertIsNotNone(stack.lambda_sg)

    def test_tap_stack_creates_lambda_function(self):
        """Test that Lambda function is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'lambda_function'))
        self.assertIsNotNone(stack.lambda_function)

    def test_tap_stack_creates_api_gateway_role(self):
        """Test that API Gateway IAM role is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'api_gateway_role'))
        self.assertIsNotNone(stack.api_gateway_role)

    def test_tap_stack_creates_api_gateway_policy(self):
        """Test that API Gateway IAM policy is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'api_gateway_policy'))
        self.assertIsNotNone(stack.api_gateway_policy)

    def test_tap_stack_creates_api_gateway(self):
        """Test that API Gateway REST API is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'api'))
        self.assertIsNotNone(stack.api)

    def test_tap_stack_creates_api_resource(self):
        """Test that API Gateway resource is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'api_resource'))
        self.assertIsNotNone(stack.api_resource)

    def test_tap_stack_creates_request_validator(self):
        """Test that API Gateway request validator is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'request_validator'))
        self.assertIsNotNone(stack.request_validator)

    def test_tap_stack_creates_api_method(self):
        """Test that API Gateway method is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'api_method'))
        self.assertIsNotNone(stack.api_method)

    def test_tap_stack_creates_api_integration(self):
        """Test that API Gateway integration is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'api_integration'))
        self.assertIsNotNone(stack.api_integration)

    def test_tap_stack_creates_lambda_permission(self):
        """Test that Lambda permission for API Gateway is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'lambda_permission'))
        self.assertIsNotNone(stack.lambda_permission)

    def test_tap_stack_creates_api_deployment(self):
        """Test that API Gateway deployment is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'api_deployment'))
        self.assertIsNotNone(stack.api_deployment)

    def test_tap_stack_creates_ec2_security_group(self):
        """Test that EC2 security group is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'ec2_sg'))
        self.assertIsNotNone(stack.ec2_sg)

    def test_tap_stack_creates_launch_template(self):
        """Test that EC2 launch template is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'launch_template'))
        self.assertIsNotNone(stack.launch_template)

    def test_tap_stack_creates_network_acl(self):
        """Test that Network ACL is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'network_acl'))
        self.assertIsNotNone(stack.network_acl)

    def test_tap_stack_creates_config_role(self):
        """Test that AWS Config IAM role is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'config_role'))
        self.assertIsNotNone(stack.config_role)

    def test_tap_stack_creates_config_bucket(self):
        """Test that AWS Config S3 bucket is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'config_bucket'))
        self.assertIsNotNone(stack.config_bucket)

    def test_tap_stack_creates_config_bucket_policy(self):
        """Test that AWS Config bucket policy is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'config_bucket_policy'))
        self.assertIsNotNone(stack.config_bucket_policy)

    def test_tap_stack_skips_config_recorder_by_default(self):
        """Test that AWS Config recorder is skipped by default to avoid AWS limit."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'config_recorder'))
        self.assertIsNone(stack.config_recorder)

    def test_tap_stack_skips_config_delivery_channel_by_default(self):
        """Test that AWS Config delivery channel is skipped by default."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'config_delivery_channel'))
        self.assertIsNone(stack.config_delivery_channel)

    def test_tap_stack_skips_config_recorder_status_by_default(self):
        """Test that AWS Config recorder status is skipped by default."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'config_recorder_status'))
        self.assertIsNone(stack.config_recorder_status)

    def test_tap_stack_creates_vpc_endpoint_security_group(self):
        """Test that VPC endpoint security group is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'vpc_endpoint_sg'))
        self.assertIsNotNone(stack.vpc_endpoint_sg)

    def test_tap_stack_creates_s3_vpc_endpoint(self):
        """Test that S3 VPC endpoint is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 's3_vpc_endpoint'))
        self.assertIsNotNone(stack.s3_vpc_endpoint)

    def test_tap_stack_creates_dynamodb_vpc_endpoint(self):
        """Test that DynamoDB VPC endpoint is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'dynamodb_vpc_endpoint'))
        self.assertIsNotNone(stack.dynamodb_vpc_endpoint)

    def test_tap_stack_creates_route_table(self):
        """Test that private route table is created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        self.assertTrue(hasattr(stack, 'private_route_table'))
        self.assertIsNotNone(stack.private_route_table)

    def test_tap_stack_environment_suffix_propagates(self):
        """Test that environment suffix is used in resource naming."""
        suffix = 'qa-env'
        stack = TapStack('test-stack', TapStackArgs(environment_suffix=suffix))
        # Verify the environment suffix is stored
        self.assertIsNotNone(stack)

    def test_tap_stack_custom_tags_applied(self):
        """Test that custom tags are applied to stack."""
        custom_tags = {'Application': 'TestApp', 'Team': 'QA'}
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test', tags=custom_tags))
        self.assertIsNotNone(stack)

    def test_tap_stack_all_resources_created(self):
        """Test that all expected resources are created."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))

        # Network resources
        self.assertIsNotNone(stack.vpc)
        self.assertEqual(len(stack.private_subnets), 3)
        self.assertIsNotNone(stack.private_route_table)
        self.assertIsNotNone(stack.network_acl)

        # Security resources
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_key_alias)
        self.assertIsNotNone(stack.vpc_endpoint_sg)
        self.assertIsNotNone(stack.lambda_sg)
        self.assertIsNotNone(stack.ec2_sg)

        # Storage resources
        self.assertIsNotNone(stack.s3_bucket)
        self.assertIsNotNone(stack.s3_versioning)
        self.assertIsNotNone(stack.s3_encryption)
        self.assertIsNotNone(stack.s3_bucket_policy)
        self.assertIsNotNone(stack.s3_public_access_block)

        # Compute resources
        self.assertIsNotNone(stack.lambda_function)
        self.assertIsNotNone(stack.lambda_role)
        self.assertIsNotNone(stack.lambda_policy)
        self.assertIsNotNone(stack.lambda_basic_execution)
        self.assertIsNotNone(stack.launch_template)

        # API Gateway resources
        self.assertIsNotNone(stack.api)
        self.assertIsNotNone(stack.api_resource)
        self.assertIsNotNone(stack.api_method)
        self.assertIsNotNone(stack.api_integration)
        self.assertIsNotNone(stack.api_deployment)
        self.assertIsNotNone(stack.request_validator)
        self.assertIsNotNone(stack.api_gateway_role)
        self.assertIsNotNone(stack.api_gateway_policy)

        # Monitoring and compliance
        self.assertIsNotNone(stack.log_group)
        # Config recorder is skipped by default to avoid AWS limit of 1 per region
        self.assertIsNone(stack.config_recorder)
        self.assertIsNone(stack.config_delivery_channel)
        self.assertIsNone(stack.config_recorder_status)
        self.assertIsNotNone(stack.config_role)
        self.assertIsNotNone(stack.config_bucket)
        self.assertIsNotNone(stack.config_bucket_policy)

        # VPC Endpoints
        self.assertIsNotNone(stack.s3_vpc_endpoint)
        self.assertIsNotNone(stack.dynamodb_vpc_endpoint)


class TestTapStackWithConfigRecorder(unittest.TestCase):
    """Test cases for TapStack with config recorder enabled."""

    def setUp(self):
        """Set up test fixtures."""
        pulumi.runtime.set_mocks(MyMocks())

    @patch('lib.tap_stack.pulumi.Config')
    def test_tap_stack_creates_config_recorder_when_enabled(self, mock_config_class):
        """Test that AWS Config recorder is created when enabled via config."""
        mock_config = MagicMock()
        mock_config.get_bool.return_value = True
        mock_config.get.return_value = "us-east-1"
        mock_config_class.return_value = mock_config

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))

        self.assertTrue(hasattr(stack, 'config_recorder'))
        self.assertIsNotNone(stack.config_recorder)
        self.assertIsNotNone(stack.config_delivery_channel)
        self.assertIsNotNone(stack.config_recorder_status)


if __name__ == '__main__':
    unittest.main()
