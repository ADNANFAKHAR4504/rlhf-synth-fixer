import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates KMS key for Lambda environment encryption")
  def test_creates_kms_key_for_lambda_encryption(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for encrypting Lambda environment variables",
        "EnableKeyRotation": True,
        "KeyPolicy": {
            "Statement": Match.any_value()
        }
    })

  @mark.it("creates Lambda function with encrypted environment variables")
  def test_creates_lambda_with_encrypted_env_vars(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.8",
        "Handler": "lambda_function.handler",
        "Environment": {
            "Variables": {
                "SECRET_KEY": "my-secret-value"
            }
        },
        "KmsKeyArn": Match.any_value()
    })


@mark.describe("TapStack Infrastructure")
class TestTapStackInfrastructure(unittest.TestCase):
  """Test cases for the TapStack infrastructure components"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates KMS key for Lambda environment encryption")
  def test_creates_kms_key_for_lambda_encryption(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for encrypting Lambda environment variables",
        "EnableKeyRotation": True,
        "KeyPolicy": {
            "Statement": Match.any_value()
        }
    })

  @mark.it("creates Lambda function with encrypted environment variables")
  def test_creates_lambda_with_encrypted_env_vars(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.8",
        "Handler": "lambda_function.handler",
        "Environment": {
            "Variables": {
                "SECRET_KEY": "my-secret-value"
            }
        },
        "KmsKeyArn": Match.any_value()
    })

  @mark.it("creates IAM role for Lambda function")
  def test_creates_lambda_iam_role(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::IAM::Role", 1)
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }
    })

  @mark.it("applies correct tags to all resources")
  def test_applies_correct_tags(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Check that resources have the required tags
    template.has_resource_properties("AWS::KMS::Key", {
        "Tags": Match.array_with([
            {"Key": "Environment", "Value": "Production"},
            {"Key": "Team", "Value": "DevOps"}
        ])
    })

    template.has_resource_properties("AWS::Lambda::Function", {
        "Tags": Match.array_with([
            {"Key": "Environment", "Value": "Production"},
            {"Key": "Team", "Value": "DevOps"}
        ])
    })

  @mark.it("verifies KMS key has correct description")
  def test_kms_key_description(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for encrypting Lambda environment variables"
    })

  @mark.it("verifies Lambda function timeout configuration")
  def test_lambda_timeout_configuration(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::Lambda::Function", {
        "Timeout": 10
    })

  @mark.it("verifies Lambda function has IAM logging permissions")
  def test_lambda_iam_logging_permissions(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Check that IAM policy allows CloudWatch logging
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([{
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream", 
                    "logs:PutLogEvents"
                ],
                "Effect": "Allow",
                "Resource": "arn:aws:logs:*:*:*"
            }])
        }
    })

  @mark.it("verifies Lambda function uses correct asset path")
  def test_lambda_asset_path(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Check that Lambda uses the correct code asset
    template.has_resource_properties("AWS::Lambda::Function", {
        "Code": {
            "S3Bucket": Match.any_value(),
            "S3Key": Match.any_value()
        }
    })
