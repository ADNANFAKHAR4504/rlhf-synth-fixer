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
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with encryption and access controls")
    def test_s3_bucket_creation(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            },
            "VersioningConfiguration": {"Status": "Enabled"},
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates a DynamoDB table with encryption and point-in-time recovery")
    def test_dynamodb_table_creation(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ]
        })

    @mark.it("creates Lambda functions with correct configurations")
    def test_lambda_function_creation(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 4)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "MemorySize": 128,
            "Timeout": 30,
        })

    @mark.it("creates CloudWatch alarms for Lambda and DynamoDB")
    def test_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 1,
            "Threshold": 5,
            "AlarmDescription": "Alert on Lambda function errors"
        })
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "EvaluationPeriods": 1,
            "Threshold": 1,
            "AlarmDescription": "Alert on DynamoDB throttling"
        })

    @mark.it("creates a VPC with S3 and DynamoDB endpoints")
    def test_vpc_creation(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::VPCEndpoint", 2)
        template.has_resource_properties("AWS::EC2::VPCEndpoint", {
            "ServiceName": {"Fn::Join": ["", ["com.amazonaws.", {"Ref": "AWS::Region"}, ".s3"]]},
            "VpcEndpointType": "Gateway"
        })
        template.has_resource_properties("AWS::EC2::VPCEndpoint", {
            "ServiceName": {"Fn::Join": ["", ["com.amazonaws.", {"Ref": "AWS::Region"}, ".dynamodb"]]},
            "VpcEndpointType": "Gateway"
        })

    @mark.it("outputs important resource ARNs")
    def test_stack_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("DataBucketName", {
            "Description": "Name of the data S3 bucket"
        })
        template.has_output("DynamoDBTableName", {
            "Description": "Name of the DynamoDB table"
        })
        template.has_output("ProcessLambdaName", {
            "Description": "Name of the data processor Lambda function"
        })
        template.has_output("AnalyticsLambdaName", {
            "Description": "Name of the analytics Lambda function"
        })
