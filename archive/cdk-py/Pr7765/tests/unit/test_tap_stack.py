"""Unit tests for TapStack CDK stack."""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("Secure Data Processing Pipeline - Unit Tests")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.env_suffix = "test"

    def _create_stack(self, stack_id="TapStackTest"):
        """Helper to create a stack for testing."""
        return TapStack(
            self.app,
            stack_id,
            TapStackProps(environment_suffix=self.env_suffix),
        )

    @mark.it("creates a customer-managed KMS key with rotation enabled")
    def test_creates_kms_key_with_rotation(self):
        """Test KMS key creation with rotation."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
                "Description": "Customer-managed KMS key for data pipeline encryption",
            },
        )

    @mark.it("creates KMS key alias with environment suffix")
    def test_creates_kms_key_alias(self):
        """Test KMS key alias creation."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::KMS::Alias",
            {"AliasName": f"alias/data-pipeline-key-{self.env_suffix}"},
        )

    @mark.it("creates isolated VPC with no NAT gateways")
    def test_creates_isolated_vpc(self):
        """Test VPC creation with isolated subnets."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {"EnableDnsHostnames": True, "EnableDnsSupport": True},
        )
        template.resource_count_is("AWS::EC2::NatGateway", 0)

    @mark.it("creates VPC endpoints for S3, DynamoDB, Secrets Manager, and Logs")
    def test_creates_vpc_endpoints(self):
        """Test VPC endpoint creation."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::VPCEndpoint", 4)

    @mark.it("creates S3 buckets with KMS encryption")
    def test_creates_s3_buckets_with_encryption(self):
        """Test S3 bucket encryption configuration."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::S3::Bucket", 3)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": Match.object_like(
                    {
                        "ServerSideEncryptionConfiguration": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "ServerSideEncryptionByDefault": {
                                            "SSEAlgorithm": "aws:kms"
                                        }
                                    }
                                )
                            ]
                        )
                    }
                )
            },
        )

    @mark.it("creates S3 buckets with versioning enabled")
    def test_creates_s3_buckets_with_versioning(self):
        """Test S3 bucket versioning configuration."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"VersioningConfiguration": {"Status": "Enabled"}},
        )

    @mark.it("creates S3 buckets with public access blocked")
    def test_creates_s3_buckets_with_public_access_blocked(self):
        """Test S3 bucket public access configuration."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                }
            },
        )

    @mark.it("creates bucket policy to deny unencrypted uploads")
    def test_creates_bucket_policy_deny_unencrypted(self):
        """Test S3 bucket policy for denying unencrypted uploads."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Action": "s3:PutObject",
                                        "Effect": "Deny",
                                        "Sid": "DenyUnencryptedObjectUploads",
                                    }
                                )
                            ]
                        )
                    }
                )
            },
        )

    @mark.it("creates Lambda function with 512MB memory and 5-minute timeout")
    def test_creates_lambda_function(self):
        """Test Lambda function creation."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Note: 2 Lambda functions exist (data processor + S3 auto-delete custom resource)
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {"MemorySize": 512, "Timeout": 300, "Runtime": "python3.12"},
        )

    @mark.it("creates Lambda function in VPC")
    def test_creates_lambda_in_vpc(self):
        """Test Lambda VPC configuration."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "VpcConfig": Match.object_like(
                    {
                        "SubnetIds": Match.any_value(),
                        "SecurityGroupIds": Match.any_value(),
                    }
                )
            },
        )

    @mark.it("creates DynamoDB table with point-in-time recovery")
    def test_creates_dynamodb_table_with_pitr(self):
        """Test DynamoDB table PITR configuration."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}},
        )

    @mark.it("creates DynamoDB table with KMS encryption")
    def test_creates_dynamodb_table_with_encryption(self):
        """Test DynamoDB table encryption."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "SSESpecification": Match.object_like(
                    {"SSEEnabled": True, "SSEType": "KMS"}
                )
            },
        )

    @mark.it("creates Secrets Manager secret with KMS encryption")
    def test_creates_secrets_manager_secret(self):
        """Test Secrets Manager secret creation."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "Description": "API certificates for mutual TLS authentication",
                "KmsKeyId": Match.any_value(),
            },
        )

    @mark.it("creates CloudWatch log groups with 90-day retention")
    def test_creates_log_groups_with_retention(self):
        """Test CloudWatch log group retention (90 days = THREE_MONTHS)."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Logs::LogGroup", {"RetentionInDays": 90}
        )

    @mark.it("creates CloudWatch log groups with KMS encryption")
    def test_creates_log_groups_with_encryption(self):
        """Test CloudWatch log group encryption."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Logs::LogGroup", {"KmsKeyId": Match.any_value()}
        )

    @mark.it("creates API Gateway REST API with regional endpoint")
    def test_creates_api_gateway(self):
        """Test API Gateway creation."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {"EndpointConfiguration": {"Types": ["REGIONAL"]}},
        )

    @mark.it("creates API Gateway method with IAM authorization")
    def test_creates_api_gateway_with_iam_auth(self):
        """Test API Gateway IAM authorization."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::ApiGateway::Method",
            {"HttpMethod": "POST", "AuthorizationType": "AWS_IAM"},
        )

    @mark.it("creates API Gateway usage plan with throttling")
    def test_creates_api_gateway_usage_plan(self):
        """Test API Gateway usage plan."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::ApiGateway::UsagePlan",
            {"Throttle": Match.object_like({"RateLimit": 100, "BurstLimit": 200})},
        )

    @mark.it("outputs KMS key ARN")
    def test_outputs_kms_key_arn(self):
        """Test KMS key ARN output."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_output(
            "KMSKeyARN", {"Description": "ARN of the customer-managed KMS key"}
        )

    @mark.it("outputs API Gateway endpoint")
    def test_outputs_api_gateway_endpoint(self):
        """Test API Gateway endpoint output."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_output(
            "APIGatewayEndpoint", {"Description": "API Gateway endpoint URL"}
        )

    @mark.it("outputs VPC endpoint IDs")
    def test_outputs_vpc_endpoint_ids(self):
        """Test VPC endpoint ID outputs."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_output("S3VPCEndpointID", {})
        template.has_output("DynamoDBVPCEndpointID", {})
        template.has_output("SecretsManagerVPCEndpointID", {})

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix."""
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::DynamoDB::Table", {"TableName": "data-pipeline-metadata-dev"}
        )

    @mark.it("uses custom environment suffix when provided")
    def test_uses_custom_env_suffix(self):
        """Test custom environment suffix."""
        self.env_suffix = "staging"
        stack = TapStack(
            self.app,
            "TapStackStaging",
            TapStackProps(environment_suffix=self.env_suffix),
        )
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::DynamoDB::Table", {"TableName": "data-pipeline-metadata-staging"}
        )

    @mark.it("sets DESTROY removal policy on all resources")
    def test_sets_destroy_removal_policy(self):
        """Test that resources have DESTROY removal policy."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource(
            "AWS::KMS::Key",
            {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"},
        )
        template.has_resource(
            "AWS::S3::Bucket",
            {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"},
        )
        template.has_resource(
            "AWS::Logs::LogGroup",
            {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"},
        )
        template.has_resource(
            "AWS::DynamoDB::Table",
            {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"},
        )

    @mark.it("creates Lambda role with VPC access policy")
    def test_creates_lambda_role_with_vpc_access(self):
        """Test Lambda role VPC access policy."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "ManagedPolicyArns": Match.array_with(
                    [
                        "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
                    ]
                )
            },
        )

    @mark.it("creates security groups for VPC endpoints and Lambda")
    def test_creates_security_groups(self):
        """Test security group creation."""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {"GroupDescription": "Security group for VPC endpoints"},
        )
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {"GroupDescription": "Security group for data processing Lambda"},
        )

