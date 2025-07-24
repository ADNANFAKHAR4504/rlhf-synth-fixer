"""Unit tests for TapStack"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Unit Tests")
class TestTapStack(unittest.TestCase):
  """Unit tests for TapStack class"""

  def setUp(self):
    """Set up test prerequisites"""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    self.template = Template.from_stack(stack)

  @mark.it("creates TapStackProps correctly")
  def test_tap_stack_props(self):
    # Test with default values
    props = TapStackProps()
    assert props.environment_suffix is None

    # Test with environment suffix provided
    props = TapStackProps(environment_suffix="test")
    assert props.environment_suffix == "test"

    # Test with other CDK stack properties
    props = TapStackProps(environment_suffix="prod",
                          description="Test description")
    assert props.environment_suffix == "prod"
    assert props.description == "Test description"

  @mark.it("creates KMS keys")
  def test_kms_keys_creation(self):
    self.template.resource_count_is("AWS::KMS::Key", 3)
    self.template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for S3 bucket encryption",
        "EnableKeyRotation": True
    })
    self.template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for DynamoDB table encryption",
        "EnableKeyRotation": True
    })
    # Secret encryption key
    self.template.has_resource_properties("AWS::KMS::Key", {
        "EnableKeyRotation": True
    })

  @mark.it("creates Secrets Manager secret")
  def test_secrets_manager_creation(self):
    self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
    self.template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Description": "Secret for API backend",
    })

  @mark.it("creates DynamoDB table with encryption and GSI")
  def test_dynamodb_table_creation(self):
    self.template.resource_count_is("AWS::DynamoDB::Table", 1)
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
        "BillingMode": "PAY_PER_REQUEST",
        "KeySchema": [
            {
                "AttributeName": "id",
                "KeyType": "HASH"
            }
        ],
        "PointInTimeRecoverySpecification": {
            "PointInTimeRecoveryEnabled": True
        },
        "SSESpecification": {
            "KMSMasterKeyId": Match.any_value(),
            "SSEEnabled": True,
            "SSEType": "KMS"
        },
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "timestamp-index",
                "KeySchema": [
                    {
                        "AttributeName": "timestamp",
                        "KeyType": "HASH"
                    }
                ],
                "Projection": {
                    "ProjectionType": "ALL"
                }
            }
        ]
    })

  @mark.it("creates S3 bucket with enhanced security")
  def test_s3_bucket_creation(self):
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    self.template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {"Status": "Enabled"},
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [{
                "ServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "aws:kms"
                }
            }]
        },
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        }
    })

  @mark.it("creates S3 bucket policy")
  def test_s3_bucket_policy_creation(self):
    self.template.resource_count_is("AWS::S3::BucketPolicy", 1)
    self.template.has_resource_properties("AWS::S3::BucketPolicy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": "s3:GetObject",
                    "Effect": "Allow",
                    "Principal": Match.any_value(),
                    "Resource": Match.any_value()
                })
            ])
        }
    })

  @mark.it("creates CloudFront distribution")
  def test_cloudfront_distribution_creation(self):
    self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
    self.template.has_resource_properties("AWS::CloudFront::Distribution", {
        "DistributionConfig": {
            "Enabled": True,
            "DefaultCacheBehavior": Match.any_value(),
            "Origins": Match.any_value()
        }
    })

  @mark.it("creates Lambda layer")
  def test_lambda_layer_creation(self):
    self.template.resource_count_is("AWS::Lambda::LayerVersion", 1)

  @mark.it("creates Lambda functions")
  def test_lambda_function_creation(self):
    # Expected 2 Lambda functions:
    # 1. The backend handler Lambda
    # 2. AWS CDK Custom Resource provider framework Lambda (for log retention)
    self.template.resource_count_is("AWS::Lambda::Function", 2)

    # Backend Lambda should have environment variables
    lambda_functions = self.template.find_resources("AWS::Lambda::Function")
    found_backend = False

    for _, lambda_resource in lambda_functions.items():
      env_vars = lambda_resource.get("Properties", {}).get(
          "Environment", {}).get("Variables", {})
      if "TABLE_NAME" in env_vars and "API_SECRET_ARN" in env_vars:
        found_backend = True

    assert found_backend, "Backend Lambda with required environment variables not found"

  @mark.it("creates proper Lambda IAM permissions")
  def test_lambda_permissions(self):
    # The Lambda functions should have IAM role and policies
    iam_policies = self.template.find_resources("AWS::IAM::Policy")

    # Check that we have at least some IAM policies
    assert len(iam_policies) > 0, "No IAM policies found"

    # Find policies that grant DynamoDB or S3 access
    found_access_policy = False
    for _, policy in iam_policies.items():
      policy_doc = policy.get("Properties", {}).get("PolicyDocument", {})
      statements = policy_doc.get("Statement", [])

      if not isinstance(statements, list):
        continue

      for statement in statements:
        if not isinstance(statement, dict):
          continue

        action = statement.get("Action", [])
        # Check if it's a single string action or a list
        if isinstance(action, str) and ("dynamodb:" in action or "s3:" in action):
          found_access_policy = True
          break
        if isinstance(action, list):
          for act in action:
            if isinstance(act, str) and ("dynamodb:" in act or "s3:" in act):
              found_access_policy = True
              break

          if found_access_policy:
            break

      if found_access_policy:
        break

    assert found_access_policy, "No DynamoDB or S3 access policy found"

  @mark.it("creates API Gateway")
  def test_api_gateway_creation(self):
    # HTTP API (API Gateway V2)
    self.template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
    self.template.has_resource_properties("AWS::ApiGatewayV2::Api", {
        "ProtocolType": "HTTP",
        "CorsConfiguration": Match.object_like({
            "AllowOrigins": ["*"]
        })
    })

    # API Stage
    self.template.resource_count_is("AWS::ApiGatewayV2::Stage", 1)

    # API Routes & Integrations
    self.template.has_resource(
        "AWS::ApiGatewayV2::Integration",
        Match.any_value()
    )
    self.template.has_resource(
        "AWS::ApiGatewayV2::Route",
        Match.any_value()
    )

  @mark.it("creates WAF Web ACL")
  def test_waf_creation(self):
    self.template.resource_count_is("AWS::WAFv2::WebACL", 1)
    self.template.has_resource_properties("AWS::WAFv2::WebACL", {
        "DefaultAction": {
            "Allow": {}
        },
        "Rules": Match.array_with([
            Match.object_like({
                "Name": "RateLimit",
                "Action": {
                    "Block": {}
                }
            })
        ])
    })

  @mark.it("creates CloudWatch alarms and dashboard")
  def test_cloudwatch_alarms_creation(self):
    # Alarms - check if we have at least one CloudWatch alarm
    alarm_count = len(self.template.find_resources("AWS::CloudWatch::Alarm"))
    assert alarm_count > 0, f"Expected at least one CloudWatch alarm, found {alarm_count}"

    # Dashboard
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    # For Log groups, we'll just check if the Lambda function has logging configured
    lambda_functions = self.template.find_resources("AWS::Lambda::Function")

    # Check if any Lambda has logging configuration
    has_logging = False
    for lambda_id, lambda_resource in lambda_functions.items():
      props = lambda_resource.get("Properties", {})
      if props.get("LoggingConfig") or "LogRetention" in lambda_id:
        has_logging = True
        break

    assert has_logging, "No Lambda functions with logging configuration found"
