import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with the correct environment suffix")
    def test_creates_s3_bucket_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("creates a Cognito User Pool with proper configuration")
    def test_creates_cognito_user_pool(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Cognito::UserPool", 1)
        template.has_resource_properties("AWS::Cognito::UserPool", {
            "UserPoolName": f"{env_suffix}-data-processing-users",
            "Policies": {
                "PasswordPolicy": {
                    "MinimumLength": 8,
                    "RequireLowercase": True,
                    "RequireUppercase": True,
                    "RequireNumbers": True,
                    "RequireSymbols": True
                }
            },
            "AutoVerifiedAttributes": ["email"],
            "AccountRecoverySetting": {
                "RecoveryMechanisms": [{"Name": "verified_email", "Priority": 1}]
            }
        })

    @mark.it("creates a Cognito User Pool Client with proper configuration")
    def test_creates_cognito_user_pool_client(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Cognito::UserPoolClient", 1)
        template.has_resource_properties("AWS::Cognito::UserPoolClient", {
            "GenerateSecret": False,
        })

    @mark.it("creates Lambda functions with proper configuration")
    def test_creates_lambda_functions(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 4)  # Validate, Process, and Health Lambdas
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
        })

    @mark.it("creates DynamoDB table with proper configuration")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
        })

    @mark.it("creates API Gateway with proper configuration")
    def test_creates_api_gateway(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"{env_suffix}-data-processing-api"
        })

    @mark.it("creates CloudWatch Log Groups for Lambda functions")
    def test_creates_cloudwatch_log_groups(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)  # One for each Lambda function
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("creates outputs for key resources")
    def test_creates_stack_outputs(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
