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
        self.env_suffix = "testenv"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates a DynamoDB table with the correct properties")
    def test_creates_dynamodb_table(self):
        # Assert that a DynamoDB table is created
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"serverless-data-table-{self.env_suffix}",
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"}
            ],
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates an IAM role with least privilege permissions")
    def test_creates_iam_role(self):
        # Assert that an IAM role is created
        self.template.resource_count_is("AWS::IAM::Role", 2)
        self.template.has_resource_properties("AWS::IAM::Role", {
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

    @mark.it("creates a Lambda function with the correct environment variables")
    def test_creates_lambda_function(self):
        # Assert that a Lambda function is created
        self.template.resource_count_is("AWS::Lambda::Function", 1)
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"serverless-infra-data-process-{self.env_suffix}",
            "Runtime": "python3.9",
            "Timeout": 30,
            "MemorySize": 256,
            "Environment": {
                "Variables": {
                    "ENVIRONMENT": self.env_suffix
                }
            }
        })

    @mark.it("creates an API Gateway with CORS support")
    def test_creates_api_gateway(self):
        # Assert that an API Gateway is created
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"serverless-data-api-{self.env_suffix}"
        })
        self.template.resource_count_is("AWS::ApiGateway::Method", 4)  # GET and POST methods

    @mark.it("creates a CloudWatch log group for the Lambda function")
    def test_creates_log_group(self):
        # Assert that a CloudWatch log group is created
        self.template.resource_count_is("AWS::Logs::LogGroup", 1)
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/serverless-data-processor-{self.env_suffix}",
            "RetentionInDays": 14
        })

    @mark.it("outputs key resources")
    def test_outputs_resources(self):
        # Assert that key resources are output
        self.template.has_output("LambdaFunctionArn", {})
        self.template.has_output("ApiGatewayUrl", {})
        self.template.has_output("DynamoDBTableName", {})
        self.template.has_output("LogGroupName", {})
        self.template.has_output("IamRoleName", {})
        self.template.has_output("EnvironmentSuffix", {})
