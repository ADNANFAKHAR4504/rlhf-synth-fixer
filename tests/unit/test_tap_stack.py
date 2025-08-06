"""Unit tests for the TapStack CDK stack."""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack."""

  def setUp(self):
    """Set up the CDK app context for each test."""
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with the correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    """Test S3 bucket creation with environment suffix."""
    env_suffix = "testenv"
    stack = TapStack(
      self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": f"tap-{env_suffix}-bucket"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    """Test default environment suffix when not provided."""
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": "tap-dev-bucket"
    })

  @mark.it("creates a DynamoDB table with correct partition key")
  def test_creates_dynamodb_table(self):
    """Test DynamoDB table creation with correct key schema."""
    stack = TapStack(
      self.app, "TapStackDynamoTest", TapStackProps(environment_suffix="qa")
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
      "TableName": "tap-qa-table",
      "KeySchema": [{
        "AttributeName": "id",
        "KeyType": "HASH"
      }],
      "AttributeDefinitions": [{
        "AttributeName": "id",
        "AttributeType": "S"
      }],
      "BillingMode": "PAYPERREQUEST"
    })

  @mark.it("creates a Lambda function with correct environment variables")
  def test_creates_lambda_function_with_env(self):
    """Test Lambda function creation with correct environment variables."""
    stack = TapStack(
      self.app, "TapStackLambdaTest", TapStackProps(environment_suffix="stage")
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", Match.object_like({
      "FunctionName": "tap-stage-lambda",
      "Runtime": "python3.11",
      "Handler": "index.handler",
      "Environment": {
        "Variables": {
          "TABLE_NAME": "tap-stage-table",
          "BUCKET_NAME": "tap-stage-bucket"
        }
      }
    }))

  @mark.it("adds S3 event source to Lambda")
  def test_s3_event_source_mapping(self):
    """Test that S3 is set as an event source for the Lambda function."""
    stack = TapStack(self.app, "TapStackS3Event")
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::Lambda::EventSourceMapping", Match.any_value())
    template.has_resource("AWS::Lambda::Permission", Match.object_like({
      "Action": "lambda:InvokeFunction",
      "Principal": "s3.amazonaws.com"
    }))

  @mark.it("grants Lambda permissions to S3 and DynamoDB")
  def test_lambda_has_permissions(self):
    """Test Lambda has IAM roles and permissions for S3 and DynamoDB."""
    stack = TapStack(self.app, "TapStackPermissions")
    template = Template.from_stack(stack)

    iam_roles = template.find_resources("AWS::IAM::Role")
    self.assertTrue(len(iam_roles) >= 1)

    lambda_permissions = template.find_resources("AWS::IAM::Policy")
    self.assertTrue(len(lambda_permissions) >= 1)

  @mark.it("exports output values")
  def test_stack_outputs(self):
    """Test that CloudFormation outputs are defined for resources."""
    stack = TapStack(
      self.app, "TapStackOutputs", TapStackProps(environment_suffix="prod")
    )
    template = Template.from_stack(stack)

    template.has_output("S3BucketName", {
      "Export": {
        "Name": "tap-prod-bucket-name"
      },
      "Value": "tap-prod-bucket"
    })

    template.has_output("DynamoDBTableName", {
      "Export": {
        "Name": "tap-prod-table-name"
      },
      "Value": "tap-prod-table"
    })

    template.has_output("LambdaFunctionName", {
      "Export": {
        "Name": "tap-prod-lambda-name"
      },
      "Value": "tap-prod-lambda"
    })

    template.has_output("LambdaRoleArn", {
      "Export": {
        "Name": "tap-prod-lambda-role-arn"
      }
    })
