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

    @mark.it("creates an S3 bucket with the correct configuration")
    def test_s3_bucket_configuration(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
        })

    @mark.it("creates a DynamoDB table with the correct configuration")
    def test_dynamodb_table_configuration(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
        })

    @mark.it("creates a Lambda function with the correct configuration")
    def test_lambda_function_configuration(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 3)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"image-processor-{env_suffix}",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "MemorySize": 512,
            "Timeout": 30,
            "TracingConfig": {"Mode": "Active"},
        })

    @mark.it("creates an API Gateway with the correct configuration")
    def test_api_gateway_configuration(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Description": "API for serverless image processing"
        })

        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "TracingEnabled": True
        })

    @mark.it("creates IAM roles and policies with least privilege")
    def test_iam_roles_and_policies(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 4)
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


    @mark.it("outputs the correct CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL"
        })
        template.has_output("S3BucketName", {
            "Description": "S3 bucket name for image storage"
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Lambda function name"
        })
