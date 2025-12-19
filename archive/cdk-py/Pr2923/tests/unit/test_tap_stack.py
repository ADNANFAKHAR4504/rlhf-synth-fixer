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

    @mark.it("creates a VPC with public and private subnets")
    def test_creates_vpc(self):
        # Assert that a VPC is created
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
        self.template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True
        })

    @mark.it("creates a DynamoDB table with auto-scaling")
    def test_creates_dynamodb_table(self):
        # Assert that a DynamoDB table is created
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"TapTable-{self.env_suffix}",
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"}
            ],
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
        })

    @mark.it("creates an S3 bucket with encryption and versioning")
    def test_creates_s3_bucket(self):
        # Assert that an S3 bucket is created
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
                ]
            }
        })

    @mark.it("creates an IAM role with least privilege permissions")
    def test_creates_iam_role(self):
        # Assert that an IAM role is created
        self.template.resource_count_is("AWS::IAM::Role", 4)
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
        self.template.resource_count_is("AWS::Lambda::Function", 3)
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Timeout": 30,
            "MemorySize": 512,
        })

    @mark.it("creates an API Gateway with usage plans")
    def test_creates_api_gateway(self):
        # Assert that an API Gateway is created
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "Tap API"
        })
        self.template.resource_count_is("AWS::ApiGateway::Method", 2)  # GET and POST methods

    @mark.it("creates CloudWatch alarms for Lambda errors and duration")
    def test_creates_cloudwatch_alarms(self):
        # Assert that CloudWatch alarms are created
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 2)
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 1,
            "EvaluationPeriods": 2
        })

    @mark.it("outputs key resources")
    def test_outputs_resources(self):
        # Assert that key resources are output
        self.template.has_output("ApiGatewayUrl", {})
        self.template.has_output("DynamoDBTableName", {})
        self.template.has_output("S3BucketName", {})
        self.template.has_output("LambdaFunctionName", {})
