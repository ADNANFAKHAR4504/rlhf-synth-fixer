# import os
# import sys
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

    @mark.it("creates a DynamoDB table with correct configuration")
    def test_dynamodb_table(self):
        """Test DynamoDB table creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tap-serverless-dev-items-table",
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
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - 1 user function + 1 log retention function
        template.resource_count_is("AWS::Lambda::Function", 2)

        # Validate Lambda function properties
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "DYNAMODB_TABLE_NAME": Match.object_like({"Ref": Match.any_value()}),
                    "ENVIRONMENT": "dev",
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
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "tap-serverless-dev-api",
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
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - Lambda role + log group role
        template.resource_count_is("AWS::IAM::Role", 2)

        # Validate Lambda execution role
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

    @mark.it("creates IAM policies with specific DynamoDB permissions")
    def test_iam_policies(self):
        """Test IAM policy creation with DynamoDB permissions"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - Check for DynamoDB permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Effect": "Allow",
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

    @mark.it("creates CloudWatch alarms for Lambda functions")
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarm creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - Error, duration, and concurrent execution alarms
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

    @mark.it("creates API Gateway resources and methods")
    def test_api_gateway_resources(self):
        """Test API Gateway resource and method creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - Check for /items resource
        template.has_resource_properties("AWS::ApiGateway::Resource", {
            "PathPart": "items"
        })

        # Check for /{id} resource
        template.has_resource_properties("AWS::ApiGateway::Resource", {
            "PathPart": "{id}"
        })

        # Check for HTTP methods
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "GET"
        })

        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST"
        })

    @mark.it("creates CloudWatch log groups with correct retention")
    def test_log_groups(self):
        """Test CloudWatch log group creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - Check log retention (TWO_WEEKS = 14 days)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 14
        })

    @mark.it("creates SNS topic for alerts")
    def test_sns_topic(self):
        """Test SNS topic creation for alerts"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "tap-serverless-dev-lambda-alerts",
            "DisplayName": "Alerts for tap-serverless Lambda errors"
        })

    @mark.it("creates CloudWatch dashboard")
    def test_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": "tap-serverless-dev-monitoring"
        })

    @mark.it("outputs key resource information")
    def test_stack_outputs(self):
        """Test stack output creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
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

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix behavior"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Should create table with 'dev' suffix
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tap-serverless-dev-items-table",
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
        })

        # Check Lambda functions have dev config
        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 256,
            "Timeout": 30,
            "Environment": {
                "Variables": {
                    "ENVIRONMENT": "dev"
                }
            }
        })

    @mark.it("applies correct tags to resources")
    def test_resource_tags(self):
        """Test that resources have correct tags applied"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - Check that DynamoDB table has tags
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "Tags": Match.array_with([
                {"Key": "Project", "Value": "tap-serverless"},
                {"Key": "Environment", "Value": "dev"},
                {"Key": "Owner", "Value": "devops-team"}
            ])
        })


if __name__ == "__main__":
    unittest.main()
