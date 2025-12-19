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

    @mark.it("creates a DynamoDB table with correct configuration")
    def test_dynamodb_table(self):
        """Test DynamoDB table creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tap-serverless-test-items-table",
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            "StreamSpecification": {"StreamViewType": "NEW_AND_OLD_IMAGES"},
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
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
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "DYNAMODB_TABLE_NAME": Match.object_like({"Ref": Match.any_value()}),
                    "ENVIRONMENT": "test",
                    "PROJECT_NAME": "tap-serverless"
                }
            },
            "MemorySize": 256,
            "Timeout": 30,
            "TracingConfig": {"Mode": "Active"}
        })

    @mark.it("creates an API Gateway REST API with correct configuration")
    def test_api_gateway(self):
        """Test API Gateway creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "tap-serverless-test-api",
            "Description": "REST API for tap-serverless"
        })

        # Validate API Gateway stage
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "dev",
            "TracingEnabled": True
        })

    @mark.it("creates IAM roles for Lambda functions")
    def test_iam_roles(self):
        """Test IAM role creation for Lambda functions"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 3)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"}
                    }
                ])
            }
        })

    @mark.it("creates CloudWatch alarms for Lambda functions")
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarm creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)

        # Validate error alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmDescription": Match.string_like_regexp(".*Lambda error rate exceeds 5%.*"),
            "Threshold": 5,
            "ComparisonOperator": "GreaterThanThreshold"
        })

        # Validate duration alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmDescription": Match.string_like_regexp(".*Lambda duration exceeds 10 seconds.*"),
            "Threshold": 10000,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates an SNS topic for alerts")
    def test_sns_topic(self):
        """Test SNS topic creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "tap-serverless-test-lambda-alerts",
            "DisplayName": "Alerts for tap-serverless Lambda errors"
        })

    @mark.it("creates CloudWatch dashboard")
    def test_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": "tap-serverless-test-monitoring"
        })

    @mark.it("outputs key resource information")
    def test_stack_outputs(self):
        """Test stack output creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiGatewayUrlDev", {
            "Description": "API Gateway URL (Development Stage)"
        })

        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB Table Name"
        })

        template.has_output("LambdaFunctionArn", {
            "Description": "Lambda Function ARN"
        })

        template.has_output("SNSTopicArn", {
            "Description": "SNS Topic ARN for Alerts"
        })

        template.has_output("CloudWatchDashboard", {
            "Description": "CloudWatch Dashboard URL"
        })
