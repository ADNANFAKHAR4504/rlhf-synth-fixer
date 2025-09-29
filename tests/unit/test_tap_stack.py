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

    @mark.it("creates an S3 bucket with encryption and block public access")
    def test_s3_bucket(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates DynamoDB tables with correct configurations")
    def test_dynamodb_tables(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 2)

        # Users table
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
            "BillingMode": "PAY_PER_REQUEST"
        })

        # Orders table
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "order_id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
        })

    @mark.it("creates Lambda functions with correct configurations")
    def test_lambda_functions(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 4)

        # Check Lambda runtime and environment variables
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "ENVIRONMENT": "testenv"
                }
            }
        })

    @mark.it("creates an API Gateway with logging enabled")
    def test_api_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                {
                    "DataTraceEnabled": True,
                    "MetricsEnabled": True
                }
            ]
        })

    @mark.it("outputs key resource details")
    def test_stack_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiUrl", {
            "Description": "URL for testenv API Gateway"
        })
        template.has_output("UsersTableName", {
            "Description": "Name of the Users DynamoDB table"
        })
        template.has_output("OrdersTableName", {
            "Description": "Name of the Orders DynamoDB table"
        })
        template.has_output("BucketName", {
            "Description": "Name of the S3 bucket"
        })
        template.has_output("EncryptionKeyArn", {
            "Description": "ARN of the KMS encryption key"
        })
        template.has_output("GetUserLambdaArn", {
            "Description": "ARN of the GetUser Lambda function"
        })
        template.has_output("CreateUserLambdaArn", {
            "Description": "ARN of the CreateUser Lambda function"
        })
        template.has_output("GetOrdersLambdaArn", {
            "Description": "ARN of the GetOrders Lambda function"
        })
        template.has_output("UploadFileLambdaArn", {
            "Description": "ARN of the UploadFile Lambda function"
        })
