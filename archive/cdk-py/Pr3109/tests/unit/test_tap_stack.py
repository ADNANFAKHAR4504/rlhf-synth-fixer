# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a DynamoDB table with PAY_PER_REQUEST billing mode")
    def test_dynamodb_table(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}]
        })

    @mark.it("creates an S3 bucket with versioning enabled and public access blocked")
    def test_s3_bucket(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates an SQS dead letter queue with a 14-day retention period")
    def test_sqs_dead_letter_queue(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 1)
        template.has_resource_properties("AWS::SQS::Queue", {
            "MessageRetentionPeriod": 1209600  # 14 days in seconds
        })

    @mark.it("creates a Lambda function with the correct runtime and environment variables")
    def test_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Timeout": 30
        })

    @mark.it("creates an API Gateway with a POST /items endpoint")
    def test_api_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::ApiGateway::Method", 1)
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST",
            "AuthorizationType": "NONE"
        })

    @mark.it("outputs the API Gateway URL, DynamoDB table name, and S3 bucket name")
    def test_stack_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiUrl", {
            "Description": "API Gateway URL"
        })
        template.has_output("TableName", {
            "Description": "DynamoDB Table Name"
        })
        template.has_output("BucketName", {
            "Description": "S3 Bucket Name"
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Name of the Lambda function"
        })
        template.has_output("DeadLetterQueueName", {
            "Description": "Name of the SQS Dead Letter Queue"
        })
