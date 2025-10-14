# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Unit tests for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with the correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": f"tap-bucket-{env_suffix}"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": "tap-bucket-dev"
    })

  @mark.it("Write Unit Tests")
  def test_write_unit_tests(self):
    # ARRANGE
    self.fail(
        "Unit test for TapStack should be implemented here."
    )

  @mark.it("creates a DynamoDB table with the correct properties")
  def test_dynamodb_table(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "TableName": f"users-table-{env_suffix}",
        "BillingMode": "PAY_PER_REQUEST",
        "SSESpecification": {
            "SSEEnabled": True,
            "KMSMasterKeyId": {"Fn::GetAtt": ["DynamoDBEncryptionKey9D1B9B3D", "Arn"]}
        }
    })

  @mark.it("creates a Lambda function with the correct properties")
  def test_lambda_function(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
        "FunctionName": f"tap-handler-{env_suffix}",
        "Handler": "index.lambda_handler",
        "Runtime": "python3.11",
        "Environment": {
            "Variables": {
                "TABLE_NAME": f"users-table-{env_suffix}",
                "ENVIRONMENT": env_suffix,
                "PARAMETER_PREFIX": f"/{env_suffix}/tap-app",
                "AWS_LAMBDA_LOG_LEVEL": "INFO",
                "POWERTOOLS_SERVICE_NAME": "tap-app",
                "POWERTOOLS_METRICS_NAMESPACE": "TapApp"
            }
        },
        "TracingConfig": {"Mode": "Active"}
    })

  @mark.it("creates a CloudWatch Log Group with the correct properties")
  def test_log_group(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Logs::LogGroup", 1)
    template.has_resource_properties("AWS::Logs::LogGroup", {
        "LogGroupName": f"/aws/lambda/tap-handler-{env_suffix}",
        "RetentionInDays": 7
    })

  @mark.it("creates an API Gateway with the correct properties")
  def test_api_gateway(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": f"tap-api-{env_suffix}",
        "Description": f"TAP API Gateway for {env_suffix} environment"
    })

  @mark.it("creates an API Gateway resource for /users")
  def test_api_gateway_users_resource(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::ApiGateway::Resource", {
        "PathPart": "users"
    })

  @mark.it("creates an API Gateway resource for /users/{userId}")
  def test_api_gateway_user_id_resource(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::ApiGateway::Resource", {
        "PathPart": "{userId}"
    })

  @mark.it("creates a KMS encryption key for DynamoDB")
  def test_kms_key(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
        "Description": f"KMS key for DynamoDB table encryption - {env_suffix}",
        "EnableKeyRotation": True
    })

  @mark.it("creates CloudWatch alarms for Lambda and API Gateway")
  def test_cloudwatch_alarms(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::CloudWatch::Alarm", 3)
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "Lambda function errors",
        "Threshold": 1
    })
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "API Gateway 4xx errors",
        "Threshold": 5
    })
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "API Gateway 5xx errors",
        "Threshold": 1
    })

  @mark.it("creates SSM parameters for configuration")
  def test_ssm_parameters(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SSM::Parameter", 3)
    template.has_resource_properties("AWS::SSM::Parameter", {
        "Name": f"/{env_suffix}/tap-app/table-name",
        "Value": f"users-table-{env_suffix}"
    })
    template.has_resource_properties("AWS::SSM::Parameter", {
        "Name": f"/{env_suffix}/tap-app/api-name",
        "Value": f"tap-api-{env_suffix}"
    })
    template.has_resource_properties("AWS::SSM::Parameter", {
        "Name": f"/{env_suffix}/tap-app/lambda-name",
        "Value": f"tap-handler-{env_suffix}"
    })


if __name__ == "__main__":
    unittest.main()
