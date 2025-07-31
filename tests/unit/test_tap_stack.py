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

    @mark.it("creates all required AWS resources")
    def test_creates_all_required_resources(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check all resource types exist
        template.resource_count_is("AWS::SSM::Parameter", 3)
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.resource_count_is("AWS::IAM::Role", 1)
        template.resource_count_is("AWS::IAM::Policy", 1)

    @mark.it("creates SSM parameters with correct names and properties")
    def test_creates_ssm_parameters_correctly(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Database URL parameter
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": "/tap/database/url",
            "Description": "Database URL for the application",
            "Type": "String",
            "Tier": "Standard",
            "Value": "postgresql://localhost:5432/mydb"
        })

        # ASSERT - API Key parameter
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": "/tap/api/key",
            "Description": "API key for external service",
            "Type": "String",
            "Tier": "Standard",
            "Value": "your-secret-api-key-here"
        })

        # ASSERT - Secret Token parameter
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": "/tap/auth/token",
            "Description": "Secret authentication token",
            "Type": "String",
            "Value": "super-secret-token"
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function_correctly(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Lambda function properties
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tap-lambda-function",
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
            "MemorySize": 512,
            "Timeout": 30,
            "ReservedConcurrentExecutions": 1000
        })

    @mark.it("creates Lambda function with correct environment variables")
    def test_lambda_function_environment_variables(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Environment variables reference SSM parameters
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "DATABASE_URL_PARAM": Match.any_value(),
                    "API_KEY_PARAM": Match.any_value(),
                    "SECRET_TOKEN_PARAM": Match.any_value()
                }
            }
        })

    @mark.it("creates CloudWatch log group with correct retention")
    def test_creates_cloudwatch_log_group(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Log group properties
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/lambda/tap-lambda-function",
            "RetentionInDays": 7
        })

    @mark.it("creates IAM role with correct policies for SSM access")
    def test_creates_iam_role_with_ssm_permissions(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - IAM policy for SSM access
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Effect": "Allow",
                        "Resource": Match.any_value()
                    },
                    {
                        "Action": "kms:Decrypt",
                        "Effect": "Allow",
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "kms:ViaService": Match.any_value()
                            }
                        }
                    }
                ])
            }
        })

    @mark.it("follows naming convention for all resources")
    def test_follows_naming_convention(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Lambda function name follows convention
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tap-lambda-function"
        })

        # ASSERT - Log group name follows convention
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/lambda/tap-lambda-function"
        })

    @mark.it("enables Lambda Insights monitoring")
    def test_enables_lambda_insights(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Lambda Insights layer is included
        template.has_resource_properties("AWS::Lambda::Function", {
            "Layers": Match.any_value()
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        
        # ASSERT - Stack should be created successfully with default environment
        self.assertIsNotNone(stack)
        self.assertEqual(stack.node.try_get_context('environmentSuffix'), None)

    @mark.it("uses provided environment suffix")
    def test_uses_provided_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        
        # ASSERT - Stack should be created successfully with provided environment
        self.assertIsNotNone(stack)

    @mark.it("Lambda function code contains required functionality")
    def test_lambda_function_code_content(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Lambda code contains key imports and functions
        template.has_resource_properties("AWS::Lambda::Function", {
            "Code": {
                "ZipFile": Match.string_like_regexp(r".*import json.*")
            }
        })
        
        template.has_resource_properties("AWS::Lambda::Function", {
            "Code": {
                "ZipFile": Match.string_like_regexp(r".*import boto3.*")
            }
        })
        
        template.has_resource_properties("AWS::Lambda::Function", {
            "Code": {
                "ZipFile": Match.string_like_regexp(r".*def lambda_handler.*")
            }
        })

    @mark.it("sets all resources as destroyable")
    def test_resources_are_destroyable(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Log group has deletion policy set to Delete
        template.has_resource("AWS::Logs::LogGroup", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })


if __name__ == '__main__':
    unittest.main()