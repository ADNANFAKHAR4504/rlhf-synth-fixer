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

  @mark.it("creates KMS keys for S3 and DynamoDB")
  def test_kms_keys_creation(self):
    self.template.resource_count_is("AWS::KMS::Key", 2)
    self.template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for S3 bucket encryption",
        "EnableKeyRotation": True
    })
    self.template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for DynamoDB table encryption",
        "EnableKeyRotation": True
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
        ],
        "Tags": [
            {
                "Key": "environment",
                "Value": "production"
            }
        ]
    })

  @mark.it("creates S3 bucket with static website hosting and KMS encryption")
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
        "WebsiteConfiguration": {
            "IndexDocument": "index.html",
            "ErrorDocument": "error.html"
        },
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        },
        "Tags": [
            {
                "Key": "environment",
                "Value": "production"
            }
        ]
    })

  @mark.it("creates Lambda function with Python 3.8 runtime")
  def test_lambda_function_creation(self):
    # Expected Lambda functions:
    # 1. The backend handler Lambda
    # 2. AWS CDK Custom Resource provider framework Lambda (for log retention)
    self.template.resource_count_is("AWS::Lambda::Function", 2)

    # Find the backend Lambda function
    lambda_functions = self.template.find_resources("AWS::Lambda::Function")
    found_backend = False

    for _, lambda_resource in lambda_functions.items():
      props = lambda_resource.get("Properties", {})
      runtime = props.get("Runtime")
      env_vars = props.get("Environment", {}).get("Variables", {})
      
      if runtime == "python3.8" and "TABLE_NAME" in env_vars:
        found_backend = True
        # Verify timeout is 30 seconds
        assert props.get("Timeout") == 30
        # Verify memory size is 128MB
        assert props.get("MemorySize") == 128
        # Verify required environment variables
        assert "TABLE_NAME" in env_vars
        assert "LOG_LEVEL" in env_vars
        break

    assert found_backend, (
        "Backend Lambda with Python 3.8 runtime and "
        "required environment variables not found"
    )

  @mark.it("creates proper Lambda IAM permissions")
  def test_lambda_permissions(self):
    # The Lambda functions should have IAM role and policies
    iam_policies = self.template.find_resources("AWS::IAM::Policy")

    # Check that we have at least some IAM policies
    assert len(iam_policies) > 0, "No IAM policies found"

    # Find policies that grant DynamoDB and logs access
    policy_checks = self._check_iam_policies(iam_policies)

    assert policy_checks['dynamodb'], "No DynamoDB access policy found"
    assert policy_checks['logs'], "No CloudWatch Logs access policy found"
    
  def _check_iam_policies(self, iam_policies):
    """Helper method to check IAM policies and reduce nesting complexity"""
    found_policies = {'dynamodb': False, 'logs': False}
    
    for _, policy in iam_policies.items():
      policy_doc = policy.get("Properties", {}).get("PolicyDocument", {})
      statements = policy_doc.get("Statement", [])

      if isinstance(statements, list):
        self._check_policy_statements(statements, found_policies)
        
    return found_policies
        
  def _check_policy_statements(self, statements, found_policies):
    """Helper method to check policy statements"""
    for statement in statements:
      if isinstance(statement, dict):
        self._check_statement_actions(statement, found_policies)
        
  def _check_statement_actions(self, statement, found_policies):
    """Helper method to check statement actions"""
    action = statement.get("Action", [])
    
    actions_to_check = [action] if isinstance(action, str) else action
    
    for act in actions_to_check:
      if isinstance(act, str):
        if "dynamodb:" in act:
          found_policies['dynamodb'] = True
        if "logs:" in act:
          found_policies['logs'] = True

  @mark.it("creates API Gateway HTTP API with CORS")
  def test_api_gateway_creation(self):
    # HTTP API (API Gateway V2)
    self.template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
    self.template.has_resource_properties("AWS::ApiGatewayV2::Api", {
        "ProtocolType": "HTTP",
        "CorsConfiguration": Match.object_like({
            "AllowOrigins": ["*"],
            "AllowMethods": Match.array_with(["GET", "POST", "OPTIONS"]),
            "AllowHeaders": Match.array_with(["Content-Type", "Authorization"])
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

  @mark.it("creates CloudWatch alarms")
  def test_cloudwatch_alarms_creation(self):
    # Should have 3 alarms: Lambda errors, Lambda throttles, API Gateway latency
    self.template.resource_count_is("AWS::CloudWatch::Alarm", 3)
    
    # Check for Lambda error alarm
    self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "Alarm for Lambda function errors",
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Threshold": 1
    })
    
    # Check for Lambda throttle alarm
    self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "Alarm for Lambda function throttling",
        "ComparisonOperator": "GreaterThanOrEqualToThreshold", 
        "Threshold": 1
    })
    
    # Check for API Gateway latency alarm
    self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "Alarm for high API Gateway latency",
        "ComparisonOperator": "GreaterThanThreshold",
        "Threshold": 5000
    })

  @mark.it("creates CloudFormation outputs")
  def test_cloudformation_outputs(self):
    # Check that required outputs are present
    outputs = self.template.find_outputs("*")
    
    required_outputs = [
        "ApiEndpoint",
        "WebsiteURL",
        "CloudFrontDistributionId",
        "CloudFrontDistributionDomain",
        "FrontendBucketName",
        "VisitsTableName",
        "LambdaFunctionName",
        "StackName"
    ]
    
    for output_name in required_outputs:
      assert output_name in outputs, f"Required output {output_name} not found"

  @mark.it("creates CloudFront distribution with Origin Access Identity")
  def test_cloudfront_distribution_creation(self):
    # Verify CloudFront distribution is created
    self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
    self.template.has_resource_properties("AWS::CloudFront::Distribution", {
        "DistributionConfig": Match.object_like({
            "Enabled": True,
            "DefaultRootObject": "index.html",
            "PriceClass": "PriceClass_100",
            "CustomErrorResponses": Match.array_with([
                Match.object_like({
                    "ErrorCode": 404,
                    "ResponseCode": 200,
                    "ResponsePagePath": "/error.html"
                }),
                Match.object_like({
                    "ErrorCode": 403, 
                    "ResponseCode": 200,
                    "ResponsePagePath": "/error.html"
                })
            ]),
            "Origins": Match.array_with([
                Match.object_like({
                    "S3OriginConfig": Match.object_like({
                        "OriginAccessIdentity": Match.any_value()
                    })
                })
            ])
        })
    })

    # Verify Origin Access Identity is created
    self.template.resource_count_is("AWS::CloudFront::CloudFrontOriginAccessIdentity", 1)
    self.template.has_resource_properties("AWS::CloudFront::CloudFrontOriginAccessIdentity", {
        "CloudFrontOriginAccessIdentityConfig": Match.object_like({
            "Comment": Match.any_value()
        })
    })

  @mark.it("does not create over-engineered resources")
  def test_no_over_engineered_resources(self):
    # Verify that over-engineered resources are NOT created
    # Note: CloudFront is now a required component for secure S3 hosting
    self.template.resource_count_is("AWS::WAFv2::WebACL", 0)
    self.template.resource_count_is("AWS::SecretsManager::Secret", 0)
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 0)
    self.template.resource_count_is("AWS::Lambda::LayerVersion", 0)
