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

    @mark.it("creates a DynamoDB table with correct configuration")
    def test_dynamodb_table(self):
        """Test DynamoDB table creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [
                {"AttributeName": "item_id", "KeyType": "HASH"},
                {"AttributeName": "created_at", "KeyType": "RANGE"}
            ],
        })

    @mark.it("creates a Lambda function with correct configuration")
    def test_lambda_function(self):
        """Test Lambda function creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.lambda_handler",
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "TABLE_NAME": Match.any_value(),
                    "BUCKET_NAME": Match.any_value()
                }
            },
            "MemorySize": 256,
            "Timeout": 30
        })

    @mark.it("creates an API Gateway with correct configuration")
    def test_api_gateway(self):
        """Test API Gateway creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "tap-test-api",
            "Description": "API Gateway for TAP project"
        })

    @mark.it("outputs all required stack information")
    def test_stack_outputs(self):
        """Test stack outputs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL",
            "Value": Match.any_value()
        })
        template.has_output("BucketName", {
            "Description": "S3 bucket name",
            "Value": Match.any_value()
        })
        template.has_output("TableName", {
            "Description": "DynamoDB table name",
            "Value": Match.any_value()
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Lambda function name",
            "Value": Match.any_value()
        })
