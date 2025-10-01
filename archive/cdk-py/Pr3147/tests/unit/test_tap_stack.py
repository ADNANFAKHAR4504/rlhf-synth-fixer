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

  @mark.it("creates an S3 bucket with encryption and access controls")
  def test_s3_bucket_creation(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [
                {
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "aws:kms"
                    }
                }
            ]
        },
        "VersioningConfiguration": {"Status": "Enabled"},
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        }
    })

  @mark.it("creates a Lambda function with correct configurations")
  def test_lambda_function_creation(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 2)
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.9",
        "MemorySize": 128,
        "Timeout": 15,
        "TracingConfig": {"Mode": "Active"},
    })

  @mark.it("creates an API Gateway HTTP API with a GET route")
  def test_api_gateway_creation(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
    template.has_resource_properties("AWS::ApiGatewayV2::Api", {
        "Name": "ProdServerlessAPI-testenv",
        "ProtocolType": "HTTP"
    })

    template.resource_count_is("AWS::ApiGatewayV2::Route", 1)
    template.has_resource_properties("AWS::ApiGatewayV2::Route", {
        "RouteKey": "GET /"
    })

  @mark.it("creates an IAM role for Lambda with least privilege")
  def test_iam_role_creation(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::IAM::Role", 2)
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }
            ],
            "Version": "2012-10-17"
        }
    })

  @mark.it("creates CloudWatch alarms for Lambda errors, throttles, and duration")
  def test_cloudwatch_alarms_creation(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::CloudWatch::Alarm", 3)
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "Alert when Lambda function encounters errors",
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold"
    })
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "Alert when Lambda function is throttled",
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold"
    })
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "AlarmDescription": "Alert when Lambda function execution is slow",
        "Threshold": 10000,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold"
    })

  @mark.it("outputs key resource information")
  def test_stack_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_output("ApiEndpoint", {
        "Description": "API Gateway endpoint URL"
    })
    template.has_output("LogsBucketName", {
        "Description": "S3 bucket name for logs"
    })
    template.has_output("LambdaFunctionName", {
        "Description": "Lambda function name"
    })
    template.has_output("AlarmTopicArn", {
        "Description": "SNS topic ARN for alarms"
    })
