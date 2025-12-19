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
            "SSESpecification": {"SSEEnabled": True},
            "StreamSpecification": {"StreamViewType": "NEW_AND_OLD_IMAGES"},
            "KeySchema": [
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"}
            ],
        })

    @mark.it("creates a Lambda function with correct configuration")
    def test_lambda_function(self):
        """Test Lambda function creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 4)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.main",
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "BUCKET_NAME": Match.any_value(),
                    "TABLE_NAME": Match.any_value(),
                    "ENVIRONMENT": Match.any_value()
                }
            },
            "MemorySize": 512,
            "Timeout": 300,
            "TracingConfig": {"Mode": "Active"}
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
            "Name": "serverless-api-test",
            "Description": "Serverless API Gateway - test"
        })

        # Validate stage configuration
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "test",
        })

    @mark.it("creates CloudWatch alarms for Lambda functions")
    def test_lambda_alarms(self):
        """Test CloudWatch alarms for Lambda functions"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 9)  # 3 functions x 2 alarms (errors + throttles)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 5,
            "EvaluationPeriods": 2,
            "AlarmDescription": Match.string_like_regexp("Lambda .* error rate too high")
        })

    @mark.it("creates CloudWatch alarms for API Gateway")
    def test_api_gateway_alarms(self):
        """Test CloudWatch alarms for API Gateway"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 10,
            "EvaluationPeriods": 2,
            "AlarmDescription": "API Gateway 4xx errors too high"
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
        template.has_output("S3BucketName", {
            "Description": "Private S3 storage bucket name",
            "Value": Match.any_value()
        })
        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB table name",
            "Value": Match.any_value()
        })
        template.has_output("AlarmTopicArn", {
            "Description": "SNS topic for alarms",
            "Value": Match.any_value()
        })
