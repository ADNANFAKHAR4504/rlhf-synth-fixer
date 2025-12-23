import importlib.util
import json
import os
import sys
import unittest

import aws_cdk as cdk
import pytest
from aws_cdk import App
from aws_cdk.assertions import Match, Template

from lib.metadata_stack import ServerlessStack
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def template():
    app = cdk.App()
    stack = ServerlessStack(app, "TestServerlessStack")
    return Template.from_stack(stack)


def test_dynamodb_table_created(template):
    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [{"AttributeName": "itemId", "KeyType": "HASH"}],
            "AttributeDefinitions": [
                {"AttributeName": "itemId", "AttributeType": "S"}
            ],
        },
    )


def test_lambda_function_created(template):
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {
            "Handler": "handler.handler",
            "Runtime": "python3.9",
            "Environment": {"Variables": {"TABLE_NAME": Match.any_value()}},
            "VpcConfig": Match.object_like({"SubnetIds": Match.any_value()}),
        },
    )


def test_lambda_execution_role_created(template):
    template.has_resource_properties(
        "AWS::IAM::Role",
        {
            "AssumeRolePolicyDocument": Match.object_like(
                {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {"Principal": {"Service": "lambda.amazonaws.com"}}
                            )
                        ]
                    )
                }
            )
        },
    )


def test_cloudwatch_alarm_created(template):
    template.has_resource_properties(
        "AWS::CloudWatch::Alarm",
        {"EvaluationPeriods": 1, "Threshold": 1, "MetricName": "Errors"},
    )


def test_api_gateway_created(template):
    template.has_resource_properties(
        "AWS::ApiGateway::RestApi", {"Name": "Item Service"}
    )


def test_lambda_log_policy(template):
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": {
                "Statement": Match.array_with(
                    [
                        Match.object_like(
                            {"Action": Match.array_with(["logs:CreateLogGroup"]), "Effect": "Allow"}
                        )
                    ]
                )
            }
        },
    )


def test_api_method_created(template):
    template.has_resource_properties("AWS::ApiGateway::Method", {"HttpMethod": "GET"})


def test_lambda_api_integration(template):
    template.has_resource_properties(
        "AWS::ApiGateway::Method",
        {"HttpMethod": "GET", "Integration": Match.object_like({"Type": "AWS_PROXY"})},
    )


def test_lambda_role_policy_attachment(template):
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": Match.object_like(
                {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": Match.array_with(["logs:PutLogEvents"]),
                                    "Effect": "Allow",
                                }
                            )
                        ]
                    )
                }
            )
        },
    )


def test_lambda_env_vars(template):
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {"Environment": {"Variables": {"TABLE_NAME": Match.any_value()}}},
    )


def test_stack_executes():
    app = cdk.App()
    stack = ServerlessStack(app, "IntegrationExecutionStack")
    assert stack is not None


def create_lambda_environment(table_name: str) -> dict:
    return {"TABLE_NAME": table_name}


def test_lambda_env_helper():
    assert create_lambda_environment("my-table") == {"TABLE_NAME": "my-table"}


def test_tap_stack_executes():
    app = App()
    stack = TapStack(app, "TestTapStack")
    assert stack is not None


def test_tap_stack_with_props():
    """Test TapStack with custom props"""
    app = App()
    props = TapStackProps(environment_suffix="prod")
    stack = TapStack(app, "TestTapStackWithProps", props=props)
    assert stack is not None
    assert stack.environment_suffix == "prod"


def test_tap_stack_props_creation():
    """Test TapStackProps initialization"""
    props = TapStackProps(environment_suffix="staging")
    assert props.environment_suffix == "staging"


def test_tap_stack_props_none_suffix():
    """Test TapStackProps with None environment suffix"""
    props = TapStackProps()
    assert props.environment_suffix is None


def test_vpc_created(template):
    template.resource_count_is("AWS::EC2::VPC", 1)


def test_security_group_created(template):
    template.has_resource_properties(
        "AWS::EC2::SecurityGroup",
        {"GroupDescription": "Security group for Lambda function"},
    )


def test_vpc_has_subnets(template):
    template.resource_count_is("AWS::EC2::Subnet", 2)


class TestLambdaHandler(unittest.TestCase):
    """Test cases for the Lambda handler function"""

    @classmethod
    def setUpClass(cls):
        """Load the Lambda handler module dynamically"""
        handler_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "lib", "lambda", "handler.py"
        )
        spec = importlib.util.spec_from_file_location("handler", handler_path)
        cls.handler_module = importlib.util.module_from_spec(spec)
        sys.modules["handler"] = cls.handler_module
        spec.loader.exec_module(cls.handler_module)

    def test_handler_missing_table_name(self):
        """Test handler returns error when TABLE_NAME is not set"""
        # Clear TABLE_NAME if set
        if "TABLE_NAME" in os.environ:
            del os.environ["TABLE_NAME"]

        class MockContext:
            aws_request_id = "test-123"

        result = self.handler_module.handler({}, MockContext())
        self.assertEqual(result["statusCode"], 500)
        self.assertIn("Configuration error", result["body"])

    def test_handler_has_cors_headers(self):
        """Test that handler response includes CORS headers"""
        os.environ["TABLE_NAME"] = "test-table"

        class MockContext:
            aws_request_id = "test-123"

        # This will fail at DynamoDB call but we can check the error response headers
        result = self.handler_module.handler({}, MockContext())
        self.assertIn("Access-Control-Allow-Origin", result["headers"])

    def test_handler_returns_500_on_dynamodb_error(self):
        """Test handler returns 500 and proper error on DynamoDB error"""
        os.environ["TABLE_NAME"] = "nonexistent-table"

        class MockContext:
            aws_request_id = "test-error-123"

        result = self.handler_module.handler({}, MockContext())
        self.assertEqual(result["statusCode"], 500)
        self.assertIn("Access-Control-Allow-Origin", result["headers"])

    def test_handler_error_response_format(self):
        """Test that error responses have correct JSON format"""
        if "TABLE_NAME" in os.environ:
            del os.environ["TABLE_NAME"]

        class MockContext:
            aws_request_id = "test-format-123"

        result = self.handler_module.handler({}, MockContext())
        body = json.loads(result["body"])
        self.assertIn("error", body)
        self.assertIn("message", body)


if __name__ == "__main__":
    unittest.main()
