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

  @mark.it("creates all required AWS resources")
  def test_creates_all_aws_resources(self):
    # Check that all required AWS resources are created
    self.template.resource_count_is("AWS::DynamoDB::Table", 1)
    # CDK may create additional Lambda functions for internal purposes (e.g., custom resources)
    lambda_functions = self.template.find_resources("AWS::Lambda::Function")
    assert len(lambda_functions) >= 1, "At least one Lambda function should be created"
    self.template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
    self.template.resource_count_is("AWS::KMS::Key", 2)  # One for S3, one for DynamoDB
    # Lambda errors, throttles, API latency  
    self.template.resource_count_is("AWS::CloudWatch::Alarm", 3)

  @mark.it("creates DynamoDB table with correct configuration")
  def test_dynamodb_table_configuration(self):
    # Check DynamoDB table exists with correct configuration
    self.template.has_resource("AWS::DynamoDB::Table", {
      "Properties": {
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp", 
            "AttributeType": "S"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          }
        ],
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
        "SSESpecification": {
          "KMSMasterKeyId": Match.any_value(),
          "SSEEnabled": True
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": "production"
          }
        ]
      }
    })

  @mark.it("creates Lambda function with correct configuration")
  def test_lambda_function_configuration(self):
    # Check Lambda function exists with correct configuration
    self.template.has_resource("AWS::Lambda::Function", {
      "Properties": {
        "Runtime": "python3.8",
        "Handler": "backend_handler.handler",
        "MemorySize": 128,
        "Timeout": 30,
        "Environment": {
          "Variables": {
            "TABLE_NAME": Match.any_value(),
            "LOG_LEVEL": "INFO"
          }
        }
      }
    })

  @mark.it("creates API Gateway with CORS configuration")
  def test_api_gateway_configuration(self):
    # Check API Gateway exists with CORS configuration
    self.template.has_resource("AWS::ApiGatewayV2::Api", {
      "Properties": {
        "CorsConfiguration": {
          "AllowHeaders": ["Content-Type", "Authorization"],
          "AllowMethods": ["GET", "POST", "OPTIONS"],
          "AllowOrigins": ["*"],
          "MaxAge": 3600
        },
        "ProtocolType": "HTTP"
      }
    })

  @mark.it("creates S3 bucket with correct configuration")
  def test_s3_bucket_configuration(self):
    # Check S3 bucket exists with versioning and encryption (private bucket for CloudFront)
    self.template.has_resource("AWS::S3::Bucket", {
      "Properties": {
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "KMSMasterKeyID": Match.any_value(),
                "SSEAlgorithm": "aws:kms"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": True,
          "BlockPublicPolicy": True,
          "IgnorePublicAcls": True,
          "RestrictPublicBuckets": True
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": "production"
          }
        ]
      }
    })
  @mark.it("creates CloudFront distribution with correct configuration")
  def test_cloudfront_distribution_configuration(self):
    # Check CloudFront distribution exists with correct configuration
    self.template.has_resource("AWS::CloudFront::Distribution", {
      "Properties": {
        "DistributionConfig": {
          "DefaultRootObject": "index.html",
          "Enabled": True,
          "PriceClass": "PriceClass_100",
          "Origins": [
            {
              "DomainName": Match.any_value(),
              "S3OriginConfig": {
                "OriginAccessIdentity": Match.any_value()
              }
            }
          ],
          "DefaultCacheBehavior": {
            "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
            "CachedMethods": ["GET", "HEAD", "OPTIONS"],
            "Compress": True,
            "ViewerProtocolPolicy": "redirect-to-https",
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000
          },
          "CustomErrorResponses": [
            {
              "ErrorCode": 404,
              "ResponseCode": 200,
              "ResponsePagePath": "/error.html"
            },
            {
              "ErrorCode": 403,
              "ResponseCode": 200,
              "ResponsePagePath": "/error.html"
            }
          ]
        }
      }
    })

  @mark.it("creates CloudWatch alarms for monitoring")
  def test_cloudwatch_alarms_configuration(self):
    # Check that all required CloudWatch alarms are created
    alarms = self.template.find_resources("AWS::CloudWatch::Alarm")
    assert len(alarms) == 3, f"Expected 3 CloudWatch alarms, found {len(alarms)}"
    
    # Check that alarm types are correct (we can't easily match exact properties due to references)
    alarm_descriptions = []
    for alarm_config in alarms.values():
      properties = alarm_config.get("Properties", {})
      description = properties.get("AlarmDescription", "")
      alarm_descriptions.append(description)
    
    expected_descriptions = [
      "Alarm for Lambda function errors",
      "Alarm for Lambda function throttling", 
      "Alarm for high API Gateway latency"
    ]
    
    for expected_desc in expected_descriptions:
      assert expected_desc in alarm_descriptions, f"Missing alarm: {expected_desc}"

  @mark.it("creates KMS keys for encryption")
  def test_kms_keys_configuration(self):
    # Check that KMS keys are created for S3 and DynamoDB
    kms_keys = self.template.find_resources("AWS::KMS::Key")
    assert len(kms_keys) == 2, f"Expected 2 KMS keys, found {len(kms_keys)}"
    
    # All KMS keys should have key rotation enabled
    for key_config in kms_keys.values():
      properties = key_config.get("Properties", {})
      assert properties.get("EnableKeyRotation") is True, "KMS key should have rotation enabled"

  @mark.it("validates stack outputs are properly configured")
  def test_stack_outputs(self):
    # Check that all required outputs exist and have proper structure
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
      
      # Each output should have a description
      output_config = outputs[output_name]
      assert "Description" in output_config, f"Output {output_name} missing description"

  @mark.it("validates stack properties and environment suffix")
  def test_stack_environment_configuration(self):
    # Create a stack with specific environment suffix
    app = cdk.App()
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(app, "TestStackWithSuffix", props=props)
    template = Template.from_stack(stack)
    
    # Verify that the stack was created successfully with the environment suffix
    outputs = template.find_outputs("*")
    assert len(outputs) == 8, "All outputs should be present regardless of environment suffix"

  @mark.it("ensures no over-engineered resources are present")
  def test_no_over_engineered_resources(self):
    # Verify that over-engineered resources are NOT in the template
    self.template.resource_count_is("AWS::WAFv2::WebACL", 0)
    self.template.resource_count_is("AWS::SecretsManager::Secret", 0) 
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 0)
    self.template.resource_count_is("AWS::Lambda::LayerVersion", 0)
    self.template.resource_count_is("AWS::CloudFormation::Stack", 0)  # No nested stacks
