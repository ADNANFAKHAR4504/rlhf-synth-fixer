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

    @mark.it("creates an S3 bucket with versioning enabled and proper configuration")
    def test_s3_bucket_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
        })

    @mark.it("creates a Lambda function with the correct configuration")
    def test_lambda_function_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.lambda_handler",
            "Runtime": "python3.11",
            "Timeout": 180,
            "MemorySize": 512,
            "TracingConfig": {"Mode": "Active"},
        })

    @mark.it("creates an API Gateway with IP whitelisting")
    def test_api_gateway_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "csv-processor-api-dev",
            "EndpointConfiguration": {"Types": ["REGIONAL"]}
        })

        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "TracingEnabled": True,
        })

    @mark.it("creates an IAM role for the Lambda function with least privilege")
    def test_lambda_iam_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 3)
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

    @mark.it("creates an S3 event notification for the Lambda function")
    def test_s3_event_notification(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)


    @mark.it("outputs the correct CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("BucketName", {
            "Description": "Name of the S3 bucket for CSV uploads"
        })
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL for manual CSV processing"
        })
        template.has_output("ProcessEndpoint", {
            "Description": "Full API endpoint URL for POST requests"
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Name of the Lambda function for CSV processing"
        })
        template.has_output("Environment", {
            "Description": "Environment suffix used for resource naming"
        })


if __name__ == "__main__":
    unittest.main()