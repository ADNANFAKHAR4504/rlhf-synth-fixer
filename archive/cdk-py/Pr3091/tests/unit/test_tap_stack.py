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

    @mark.it("creates a VPC with the correct configuration")
    def test_creates_vpc(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsSupport": True,
            "EnableDnsHostnames": True,
        })

    @mark.it("creates an S3 bucket with versioning and encryption")
    def test_creates_s3_bucket(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
                ]
            },
        })

    @mark.it("creates a DynamoDB table with a primary key and GSI")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
            "BillingMode": "PAY_PER_REQUEST",
        })
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "emailIndex",
                    "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
                }
            ]
        })

    @mark.it("creates two Lambda functions with the correct configuration")
    def test_creates_lambda_functions(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Timeout": 30,
            "TracingConfig": {"Mode": "Active"},
        })

    @mark.it("creates an API Gateway with two endpoints")
    def test_creates_api_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::ApiGateway::Method", 5)  # POST /users and GET /users/{userId}
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST",
        })
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "GET",
        })

    @mark.it("creates CloudWatch alarms for Lambda error rates")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 1,
            "EvaluationPeriods": 1,
        })

    @mark.it("outputs key resource details")
    def test_outputs_key_resources(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL",
        })
        template.has_output("ProcessUserEndpoint", {
            "Description": "Process User API endpoint",
        })
        template.has_output("GetUserEndpoint", {
            "Description": "Get User API endpoint",
        })
        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB table name",
        })
        template.has_output("LogsBucketName", {
            "Description": "S3 bucket for logs",
        })
        template.has_output("SNSTopicArn", {
            "Description": "SNS topic for alarms",
        })
