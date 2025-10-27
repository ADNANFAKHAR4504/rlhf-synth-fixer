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

    @mark.it("creates KMS keys for encryption")
    def test_creates_kms_keys(self):
        # Assert that KMS keys are created
        self.template.resource_count_is("AWS::KMS::Key", 2)
        self.template.has_resource_properties("AWS::KMS::Key", {
            "Description": f"KMS key for S3 bucket encryption - {self.env_suffix}",
            "EnableKeyRotation": True
        })
        self.template.has_resource_properties("AWS::KMS::Key", {
            "Description": f"KMS key for DynamoDB table encryption - {self.env_suffix}",
            "EnableKeyRotation": True
        })

    @mark.it("creates an S3 bucket with encryption and CORS configuration")
    def test_creates_s3_bucket(self):
        # Assert that an S3 bucket is created
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}
                ]
            },
            "CorsConfiguration": {
                "CorsRules": [
                    {
                        "AllowedMethods": ["POST", "PUT"],
                        "AllowedOrigins": ["*"],
                        "AllowedHeaders": ["*"],
                        "MaxAge": 3000
                    }
                ]
            }
        })

    @mark.it("creates a DynamoDB table with encryption and GSI")
    def test_creates_dynamodb_table(self):
        # Assert that a DynamoDB table is created
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"ProductMetadata-{self.env_suffix}",
            "KeySchema": [
                {"AttributeName": "productId", "KeyType": "HASH"},
                {"AttributeName": "productName", "KeyType": "RANGE"}
            ],
            "SSESpecification": {"SSEEnabled": True},
            "BillingMode": "PAY_PER_REQUEST"
        })

    @mark.it("creates an IAM role with permissions for S3, DynamoDB, and KMS")
    def test_creates_iam_role(self):
        # Assert that IAM roles are created
        self.template.resource_count_is("AWS::IAM::Role", 3)
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
        # Assert that Lambda functions are created
        self.template.resource_count_is("AWS::Lambda::Function", 2)
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Timeout": 300,
            "MemorySize": 512,
        })

    @mark.it("creates an API Gateway with a POST method for /upload")
    def test_creates_api_gateway(self):
        # Assert that an API Gateway is created
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"file-upload-api-{self.env_suffix}"
        })
        self.template.resource_count_is("AWS::ApiGateway::Method", 3)
        self.template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST"
        })

    @mark.it("outputs key resources")
    def test_outputs_resources(self):
        # Assert that key resources are output
        self.template.has_output("ApiGatewayUrl", {})
        self.template.has_output("LambdaFunctionArn", {})
        self.template.has_output("S3BucketName", {})
        self.template.has_output("DynamoDBTableName", {})
