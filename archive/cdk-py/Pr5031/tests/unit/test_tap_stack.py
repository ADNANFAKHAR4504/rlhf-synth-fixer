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
    """Unit test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a DynamoDB table with the correct configuration")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"serverless-api-items-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"}
            ],
        })

    @mark.it("creates a Lambda function with the correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"serverless-api-handler-{env_suffix}",
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
            "Timeout": 30,
            "MemorySize": 256,
            "TracingConfig": {"Mode": "Active"},
        })

    @mark.it("creates an API Gateway REST API with the correct configuration")
    def test_creates_api_gateway(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"serverless-rest-api-{env_suffix}",
            "Description": f"Production-grade serverless REST API - {env_suffix}"
        })

    @mark.it("creates IAM role for Lambda with least privilege")
    def test_creates_lambda_iam_role(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
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

    @mark.it("creates CloudWatch log group for Lambda with correct retention")
    def test_creates_cloudwatch_log_group(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/aws-serverless-infra-api-{env_suffix}",
            "RetentionInDays": 7
        })

    @mark.it("creates CloudFormation outputs for key resources")
    def test_creates_cloudformation_outputs(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL"
        })
        template.has_output("TableName", {
            "Description": "DynamoDB table name"
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Lambda function name"
        })
        template.has_output("Environment", {
            "Description": "Environment suffix used for resource naming"
        })
