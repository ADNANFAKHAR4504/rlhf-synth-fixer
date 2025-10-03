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

    @mark.it("creates a DynamoDB table with correct configuration for test environment")
    def test_dynamodb_table(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "serverless-items-test",
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": False},
            "StreamSpecification": {"StreamViewType": "NEW_AND_OLD_IMAGES"},
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 10,
                "WriteCapacityUnits": 10
            }
        })

    @mark.it("creates four Lambda functions with correct environment variables")
    def test_lambda_functions(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - 4 user functions + 1 log retention function
        template.resource_count_is("AWS::Lambda::Function", 5)

        # Validate Lambda function properties
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "TABLE_NAME": Match.object_like({"Ref": Match.any_value()}),
                    "STAGE": "test",
                    "REGION": "us-west-2"
                }
            },
            "MemorySize": 256,
            "Timeout": 15,
            "TracingConfig": {"Mode": "Active"}
        })

    @mark.it("creates an API Gateway REST API with correct configuration")
    def test_api_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "serverless-api-test",
            "Description": "Serverless API for test environment"
        })

        # Validate API Gateway stage
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "test",
            "TracingEnabled": True
        })

    @mark.it("creates IAM roles for Lambda functions")
    def test_iam_roles(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - 4 Lambda roles + 2 additional roles (log group + API Gateway)
        template.resource_count_is("AWS::IAM::Role", 6)

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
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Check for GET permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": ["dynamodb:GetItem", "dynamodb:Query"],
                        "Effect": "Allow",
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

        # Check for POST permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": ["dynamodb:PutItem", "dynamodb:UpdateItem"],
                        "Effect": "Allow",
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

        # Check for DELETE permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": "dynamodb:DeleteItem",
                        "Effect": "Allow",
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

    @mark.it("creates CloudWatch alarms for Lambda functions")
    def test_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - 8 alarms (2 per Lambda function: error + duration)
        template.resource_count_is("AWS::CloudWatch::Alarm", 8)

        # Validate error alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmDescription": Match.string_like_regexp(".*function errors in test"),
            "Threshold": 3,  # test environment config
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda"
        })

        # Validate duration alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmDescription": Match.string_like_regexp(".*function duration in test"),
            "Threshold": 5000,  # test environment config
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "MetricName": "Duration",
            "Namespace": "AWS/Lambda"
        })

    @mark.it("creates API Gateway resources and methods")
    def test_api_gateway_resources(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
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

        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "DELETE"
        })

    @mark.it("creates CloudWatch log groups with correct retention")
    def test_log_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Check log retention (test environment = 14 days)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 7  # ONE_WEEK retention for Lambda functions
        })

    @mark.it("outputs key resource information")
    def test_stack_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL for test environment"
        })

        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB table name for test environment"
        })

        template.has_output("DynamoDBTableArn", {
            "Description": "DynamoDB table ARN for test environment"
        })

        template.has_output("GetLambdaArn", {
            "Description": "Get Lambda function ARN for test environment"
        })

        template.has_output("PostLambdaArn", {
            "Description": "Post Lambda function ARN for test environment"
        })

        template.has_output("DeleteLambdaArn", {
            "Description": "Delete Lambda function ARN for test environment"
        })

        template.has_output("ListLambdaArn", {
            "Description": "List Lambda function ARN for test environment"
        })

        template.has_output("Stage", {
            "Description": "Deployment stage"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Should create table with 'dev' suffix and dev config
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "serverless-items-dev",
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,  # dev environment config
                "WriteCapacityUnits": 5   # dev environment config
            }
        })

        # Check Lambda functions have dev config
        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 128,  # dev environment config
            "Timeout": 10,      # dev environment config
            "Environment": {
                "Variables": {
                    "STAGE": "dev"
                }
            }
        })

    @mark.it("validates different environment configurations")
    def test_environment_configurations(self):
        # ARRANGE - Create stacks for different environments
        dev_stack = TapStack(self.app, "TapStackDev", TapStackProps(environment_suffix="dev"))
        prod_stack = TapStack(self.app, "TapStackProd", TapStackProps(environment_suffix="prod"))

        dev_template = Template.from_stack(dev_stack)
        prod_template = Template.from_stack(prod_stack)

        # ASSERT - Dev configuration
        dev_template.has_resource_properties("AWS::DynamoDB::Table", {
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            },
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": False}
        })

        # ASSERT - Prod configuration
        prod_template.has_resource_properties("AWS::DynamoDB::Table", {
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 20,
                "WriteCapacityUnits": 20
            },
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}
        })

        # Check Lambda configurations
        dev_template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 128,
            "Timeout": 10
        })

        prod_template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 512,
            "Timeout": 30
        })

    @mark.it("validates CloudWatch alarm thresholds for different environments")
    def test_alarm_thresholds_by_environment(self):
        # ARRANGE
        dev_stack = TapStack(self.app, "TapStackDevAlarms", TapStackProps(environment_suffix="dev"))
        test_stack = TapStack(self.app, "TapStackTestAlarms", TapStackProps(environment_suffix="test"))
        prod_stack = TapStack(self.app, "TapStackProdAlarms", TapStackProps(environment_suffix="prod"))

        dev_template = Template.from_stack(dev_stack)
        test_template = Template.from_stack(test_stack)
        prod_template = Template.from_stack(prod_stack)

        # ASSERT - Dev alarm thresholds
        dev_template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Threshold": 5
        })

        # ASSERT - Test alarm thresholds
        test_template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Threshold": 3
        })

        # ASSERT - Prod alarm thresholds
        prod_template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Threshold": 1
        })


if __name__ == "__main__":
    unittest.main()
