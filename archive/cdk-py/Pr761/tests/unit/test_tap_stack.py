import os
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()
    # Clear any environment variables that might affect tests
    if 'ENVIRONMENT_SUFFIX' in os.environ:
      del os.environ['ENVIRONMENT_SUFFIX']

  @mark.it("creates all required AWS resources")
  def test_creates_all_required_resources(self):
    """Test that all required AWS resources are created"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT - Check resource counts
    template.resource_count_is("AWS::KMS::Key", 1)
    template.resource_count_is("AWS::KMS::Alias", 1)
    template.resource_count_is("AWS::SecretsManager::Secret", 1)
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.resource_count_is("AWS::S3::Bucket", 1)
    # Lambda role + S3 cleanup role
    template.resource_count_is("AWS::IAM::Role", 3)
    template.resource_count_is(
        "AWS::Lambda::Function",
        4)  # API + Health + S3 cleanup
    template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
    template.resource_count_is("Custom::LogRetention", 2)

  @mark.it("creates KMS key with proper configuration")
  def test_creates_kms_key(self):
    """Test KMS key creation and configuration"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for TAP application encryption",
        "EnableKeyRotation": True
    })

  @mark.it("creates DynamoDB table with correct configuration")
  def test_creates_dynamodb_table(self):
    """Test DynamoDB table creation"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}
    })

  @mark.it("creates S3 bucket with security settings")
  def test_creates_s3_bucket_with_security(self):
    """Test S3 bucket creation with security settings"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::S3::Bucket", {
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        },
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [
                {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}
            ]
        },
        "VersioningConfiguration": {"Status": "Enabled"}
    })

  @mark.it("creates Lambda functions with correct configuration")
  def test_creates_lambda_functions(self):
    """Test Lambda function creation"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT API Lambda
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Timeout": 30,
        "FunctionName": "tap-api-function-dev"
    })

    # ASSERT Health Lambda
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Timeout": 10,
        "FunctionName": "tap-health-function-dev"
    })

  @mark.it("creates API Gateway with CORS configuration")
  def test_creates_api_gateway_with_cors(self):
    """Test API Gateway creation with CORS"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::ApiGatewayV2::Api", {
        "Name": "tap-http-api-dev",
        "ProtocolType": "HTTP",
        "CorsConfiguration": {
            "AllowCredentials": False,
            "AllowHeaders": ["Content-Type", "Authorization"],
            "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "AllowOrigins": ["*"],
            "MaxAge": 86400
        }
    })

  @mark.it("creates Secrets Manager secret with encryption")
  def test_creates_secrets_manager_secret(self):
    """Test Secrets Manager secret creation"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Name": "tap-application-secrets-dev",
        "Description": "Application secrets for TAP"
    })

  @mark.it("creates IAM role with least privilege permissions")
  def test_creates_iam_role_with_permissions(self):
    """Test IAM role creation with proper permissions"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT Lambda role exists
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }
            ]
        }
    })

    # ASSERT IAM policies exist with proper permissions
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                {
                    "Effect": "Allow",
                    "Action": "secretsmanager:GetSecretValue",
                    "Resource": Match.any_value()
                }
            ])
        }
    })

  @mark.it("creates CloudWatch log groups with retention")
  def test_creates_log_groups_with_retention(self):
    """Test CloudWatch log group creation"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("Custom::LogRetention", 2)

  @mark.it("creates resources with environment suffix when provided")
  def test_creates_resources_with_env_suffix(self):
    """Test resource creation with custom environment suffix"""
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(
        self.app, "TestStack",
        TapStackProps(environment_suffix=env_suffix),
        env=cdk.Environment(region="us-west-2")
    )
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "TableName": f"tap-data-table-{env_suffix}"
    })
    template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Name": f"tap-application-secrets-{env_suffix}"
    })
    template.has_resource_properties("AWS::Lambda::Function", {
        "FunctionName": f"tap-api-function-{env_suffix}"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    """Test default environment suffix behavior"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "TableName": "tap-data-table-dev"
    })

  @mark.it("uses environment variable for suffix if set")
  def test_uses_environment_variable_for_suffix(self):
    """Test environment variable usage for suffix"""
    # ARRANGE
    os.environ['ENVIRONMENT_SUFFIX'] = 'pr123'
    try:
      stack = TapStack(
          self.app,
          "TestStack",
          env=cdk.Environment(
              region="us-west-2"))
      template = Template.from_stack(stack)

      # ASSERT
      template.has_resource_properties("AWS::DynamoDB::Table", {
          "TableName": "tap-data-table-pr123"
      })
    finally:
      del os.environ['ENVIRONMENT_SUFFIX']

  @mark.it("creates CloudFormation outputs")
  def test_creates_cloudformation_outputs(self):
    """Test CloudFormation outputs creation"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT
    outputs = template.to_json().get('Outputs', {})
    self.assertIn('ApiEndpoint', outputs)
    self.assertIn('S3BucketName', outputs)
    self.assertIn('DynamoDBTableName', outputs)
    self.assertIn('SecretArn', outputs)
    self.assertIn('KMSKeyId', outputs)

  @mark.it("ensures Lambda functions have required environment variables")
  def test_lambda_environment_variables(self):
    """Test Lambda functions have required environment variables"""
    # ARRANGE
    stack = TapStack(
        self.app,
        "TestStack",
        env=cdk.Environment(
            region="us-west-2"))
    template = Template.from_stack(stack)

    # ASSERT API Lambda has environment variables
    template.has_resource_properties("AWS::Lambda::Function", {
        "FunctionName": "tap-api-function-dev",
        "Environment": {
            "Variables": {
                "SECRET_ARN": Match.any_value(),
                "DYNAMODB_TABLE": Match.any_value(),
                "S3_BUCKET": Match.any_value(),
                "KMS_KEY_ID": Match.any_value()
            }
        }
    })

  @mark.it("test TapStackProps initialization")
  def test_tap_stack_props_initialization(self):
    """Test TapStackProps class initialization"""
    # ARRANGE & ACT
    props = TapStackProps(environment_suffix="test")

    # ASSERT
    self.assertEqual(props.environment_suffix, "test")

    # Test without suffix
    props_default = TapStackProps()
    self.assertIsNone(props_default.environment_suffix)
