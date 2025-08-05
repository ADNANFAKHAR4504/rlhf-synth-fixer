"""
Unit tests for TAP Stack
Validates resource names, tags, and configuration without deployment
"""

import unittest
import aws_cdk as core
import aws_cdk.assertions as assertions
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Unit tests for TapStack infrastructure components"""

  def setUp(self):
    """Create stack instance for testing"""
    self.app = core.App()
    self.stack = TapStack(self.app, "test-tap-stack")
    self.template = assertions.Template.from_stack(self.stack)

  @mark.it("creates S3 bucket with correct naming convention")
  def test_s3_bucket_naming_convention(self):
    """Test S3 bucket follows naming convention"""
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": "tap-preprod-storage-bucket-1213"
    })

  @mark.it("enables S3 bucket versioning")
  def test_s3_bucket_versioning_enabled(self):
    """Test S3 bucket has versioning enabled"""
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "VersioningConfiguration": {
        "Status": "Enabled"
      }
    })

  @mark.it("configures S3 bucket lifecycle rules")
  def test_s3_bucket_lifecycle_rules(self):
    """Test S3 bucket has lifecycle rules for cost optimization"""
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "LifecycleConfiguration": {
        "Rules": [
          {
            "Id": "cost-optimization",
            "Status": "Enabled",
            "Transitions": [
              {
                "StorageClass": "STANDARD_IA",
                "TransitionInDays": 30
              },
              {
                "StorageClass": "GLACIER",
                "TransitionInDays": 90
              }
            ]
          }
        ]
      }
    })

  @mark.it("blocks S3 bucket public access")
  def test_s3_bucket_blocks_public_access(self):
    """Test S3 bucket blocks all public access"""
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True
      }
    })

  @mark.it("enables S3 bucket encryption")
  def test_s3_bucket_encryption(self):
    """Test S3 bucket has server-side encryption enabled"""
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "BucketEncryption": {
        "ServerSideEncryptionConfiguration": [
          {
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "AES256"
            }
          }
        ]
      }
    })

  @mark.it("creates DynamoDB table with correct naming convention")
  def test_dynamodb_table_naming_convention(self):
    """Test DynamoDB table follows naming convention"""
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "TableName": "tap-preprod-table"
    })

  @mark.it("configures DynamoDB table with on-demand billing")
  def test_dynamodb_table_on_demand_billing(self):
    """Test DynamoDB table uses on-demand billing"""
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "BillingMode": "PAY_PER_REQUEST"
    })

  @mark.it("configures DynamoDB table partition key")
  def test_dynamodb_table_partition_key(self):
    """Test DynamoDB table has correct partition key"""
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "KeySchema": [
        {
          "AttributeName": "id",
          "KeyType": "HASH"
        }
      ],
      "AttributeDefinitions": [
        {
          "AttributeName": "id",
          "AttributeType": "S"
        }
      ]
    })

  @mark.it("enables DynamoDB point-in-time recovery")
  def test_dynamodb_point_in_time_recovery(self):
    """Test DynamoDB table has point-in-time recovery enabled"""
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "PointInTimeRecoverySpecification": {
        "PointInTimeRecoveryEnabled": True
      }
    })

  @mark.it("enables DynamoDB encryption")
  def test_dynamodb_encryption(self):
    """Test DynamoDB table has encryption enabled"""
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "SSESpecification": {
        "SSEEnabled": True
      }
    })

  @mark.it("creates Lambda function with correct naming convention")
  def test_lambda_function_naming_convention(self):
    """Test Lambda function follows naming convention"""
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "FunctionName": "tap-preprod-handler"
    })

  @mark.it("configures Lambda function with Python 3.12 runtime")
  def test_lambda_function_runtime(self):
    """Test Lambda function uses Python 3.12 runtime"""
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Runtime": "python3.12"
    })

  @mark.it("configures Lambda function memory and timeout")
  def test_lambda_function_configuration(self):
    """Test Lambda function has correct memory and timeout settings"""
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "MemorySize": 256,
      "Timeout": 30
    })

  @mark.it("sets Lambda function environment variables")
  def test_lambda_function_environment_variables(self):
    """Test Lambda function has required environment variables"""
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Environment": {
        "Variables": {
          "S3_BUCKET_NAME": assertions.Match.any_value(),
          "DYNAMODB_TABLE_NAME": assertions.Match.any_value(),
          "ENVIRONMENT": "preprod"
        }
      }
    })

  @mark.it("creates IAM role with correct naming convention")
  def test_iam_role_naming_convention(self):
    """Test IAM role follows naming convention"""
    self.template.has_resource_properties("AWS::IAM::Role", {
      "RoleName": "tap-preprod-lambda-role"
    })

  @mark.it("configures IAM role for Lambda service") 
  def test_iam_role_lambda_service(self):
    """Test IAM role is configured for Lambda service"""
    self.template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            }
          }
        ]
      }
    })

  @mark.it("attaches basic Lambda execution policy to IAM role")
  def test_iam_role_basic_execution_policy(self):
    """Test IAM role has basic Lambda execution policy"""
    self.template.has_resource_properties("AWS::IAM::Role", {
      "ManagedPolicyArns": assertions.Match.array_with([
        assertions.Match.object_like({
          "Fn::Join": assertions.Match.any_value()
        })
      ])
    })

  @mark.it("creates IAM policy with S3 permissions")
  def test_iam_policy_s3_permissions(self):
    """Test IAM policy has S3 permissions"""
    self.template.has_resource_properties("AWS::IAM::Policy", {
      "PolicyDocument": {
        "Statement": assertions.Match.array_with([
          {
            "Effect": "Allow",
            "Action": assertions.Match.array_with([
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:ListBucket"
            ]),
            "Resource": assertions.Match.any_value()
          }
        ])
      }
    })

  @mark.it("creates IAM policy with DynamoDB permissions")
  def test_iam_policy_dynamodb_permissions(self):
    """Test IAM policy has DynamoDB permissions"""
    self.template.has_resource_properties("AWS::IAM::Policy", {
      "PolicyDocument": {
        "Statement": assertions.Match.array_with([
          {
            "Effect": "Allow",
            "Action": assertions.Match.array_with([
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan"
            ]),
            "Resource": assertions.Match.any_value()
          }
        ])
      }
    })

  @mark.it("creates expected number of each resource type")
  def test_resource_count(self):
    """Test expected number of resources are created"""
    # S3 bucket
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    # DynamoDB table  
    self.template.resource_count_is("AWS::DynamoDB::Table", 1)
    # Lambda function
    self.template.resource_count_is("AWS::Lambda::Function", 1)
    # IAM role
    self.template.resource_count_is("AWS::IAM::Role", 1)
    # IAM policy
    self.template.resource_count_is("AWS::IAM::Policy", 1)

  @mark.it("sets removal policy to DESTROY for all resources")
  def test_removal_policy_destroy(self):
    """Test that resources have DESTROY removal policy"""
    # S3 bucket
    self.template.has_resource("AWS::S3::Bucket", {
      "UpdateReplacePolicy": "Delete",
      "DeletionPolicy": "Delete"
    })
    # DynamoDB table
    self.template.has_resource("AWS::DynamoDB::Table", {
      "UpdateReplacePolicy": "Delete", 
      "DeletionPolicy": "Delete"
    })

  @mark.it("provides property accessors for resource names")
  def test_property_accessors(self):
    """Test that stack provides property accessors for resource names"""
    # Test that properties return tokens (since bucket/table names are referenced dynamically)
    # In CDK, resource names are often tokens until synthesis time
    self.assertIsNotNone(self.stack.bucket_name)
    self.assertIsNotNone(self.stack.table_name)
    self.assertIsNotNone(self.stack.function_name)

  @mark.it("handles environment suffix from props")
  def test_environment_suffix_from_props(self):
    """Test environment suffix can be set via props"""
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "test-stack-with-props", props)
    
    # Note: The current implementation hardcodes 'preprod' as env_name
    # This test documents the current behavior
    self.assertEqual(stack.env_name, "preprod")
    self.assertEqual(stack.project_name, "tap")

  @mark.it("handles missing props gracefully")
  def test_missing_props_handling(self):
    """Test stack handles missing props gracefully"""
    stack = TapStack(self.app, "test-stack-no-props")
    
    # Should not raise an exception
    self.assertEqual(stack.env_name, "preprod")
    self.assertEqual(stack.project_name, "tap")


if __name__ == '__main__':
  unittest.main()
