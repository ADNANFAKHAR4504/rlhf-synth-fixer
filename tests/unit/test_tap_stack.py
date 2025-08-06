"""Unit tests for TapStack CDK infrastructure."""
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

    @mark.it("creates an S3 bucket with the correct environment suffix")
    def test_creates_s3_bucket_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Check that bucket has versioning enabled and encryption
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        })

    @mark.it("creates Lambda function with correct environment suffix")
    def test_creates_lambda_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have 1 main Lambda function (+ auto-delete Lambda = 2 total)
        template.resource_count_is("AWS::Lambda::Function", 2)
        # Check our main Lambda function specifically
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"tap-processor-{env_suffix.lower()}"
        })

    @mark.it("creates API Gateway with correct environment suffix")
    def test_creates_api_gateway_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"TAP Serverless API ({env_suffix})"
        })

    @mark.it("creates CloudWatch log group with correct naming")
    def test_creates_log_group_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/tap-processor-{env_suffix.lower()}"
        })

    @mark.it("applies correct tags to resources")
    def test_applies_correct_tags(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Check that resources have tags (CDK adds many automatic tags)
        # S3 bucket should have tags including our custom ones
        template.has_resource_properties("AWS::S3::Bucket", {
            "Tags": Match.array_with([
                {"Key": "Project", "Value": "TAP"}
            ])
        })

    @mark.it("creates IAM role with S3 permissions")
    def test_creates_iam_role_with_s3_permissions(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Will have 3 roles: Lambda role, API Gateway role, and auto-delete role
        template.resource_count_is("AWS::IAM::Role", 3)
        
        # Check our main Lambda role has correct assume role policy
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ])
            }
        })

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"TAP-Serverless-Monitoring-{env_suffix}"
        })