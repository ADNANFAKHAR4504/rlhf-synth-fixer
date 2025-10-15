# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with correct configuration")
    def test_s3_bucket(self):
        """Test S3 bucket creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
        })

    @mark.it("creates a Secrets Manager secret with correct configuration")
    def test_secrets_manager(self):
        """Test Secrets Manager secret creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Description": "API credentials and sensitive configuration"
        })

    @mark.it("creates an SNS topic with correct configuration")
    def test_sns_topic(self):
        """Test SNS topic creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "Lambda Function Failure Notifications"
        })

    @mark.it("creates a Lambda function with correct configuration")
    def test_lambda_function(self):
        """Test Lambda function creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.8",
            "Environment": {
                "Variables": {
                    "BUCKET_NAME": Match.any_value(),
                    "SECRET_ARN": Match.any_value()
                }
            },
            "MemorySize": 256,
            "Timeout": 30,
            "TracingConfig": {"Mode": "Active"}
        })

    @mark.it("creates an API Gateway with correct configuration")
    def test_api_gateway(self):
        """Test API Gateway creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
        template.has_resource_properties("AWS::ApiGatewayV2::Api", {
            "Name": "tap-test-api",
            "ProtocolType": "HTTP"
        })

    @mark.it("outputs all required stack information")
    def test_stack_outputs(self):
        """Test stack outputs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "HTTP API endpoint URL",
            "Value": Match.any_value()
        })
        template.has_output("ApiGatewayId", {
            "Description": "API Gateway ID",
            "Value": Match.any_value()
        })
        template.has_output("S3BucketName", {
            "Description": "S3 bucket name",
            "Value": Match.any_value()
        })
        template.has_output("S3BucketArn", {
            "Description": "S3 bucket ARN",
            "Value": Match.any_value()
        })
        template.has_output("SecretArn", {
            "Description": "Secrets Manager secret ARN",
            "Value": Match.any_value()
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Lambda function name",
            "Value": Match.any_value()
        })
        template.has_output("LambdaFunctionArn", {
            "Description": "Lambda function ARN",
            "Value": Match.any_value()
        })
        template.has_output("SNSTopicArn", {
            "Description": "SNS topic ARN",
            "Value": Match.any_value()
        })
        template.has_output("SNSTopicName", {
            "Description": "SNS topic name",
            "Value": Match.any_value()
        })