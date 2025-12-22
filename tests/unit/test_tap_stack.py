import pytest
import json
import os
from unittest.mock import patch, MagicMock
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

from aws_cdk import App
from lib.metadata_stack import ServerlessStack
from lib.tap_stack import TapStack

# pylint: disable=redefined-outer-name


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
            "AttributeDefinitions": [{"AttributeName": "itemId", "AttributeType": "S"}],
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
                            {
                                "Action": Match.array_with(["logs:CreateLogGroup"]),
                                "Effect": "Allow",
                            }
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


def test_vpc_created(template):
    """Test that VPC is created with correct configuration"""
    template.has_resource_properties(
        "AWS::EC2::VPC", {"EnableDnsHostnames": True, "EnableDnsSupport": True}
    )


def test_security_group_created(template):
    """Test that security group is created for Lambda"""
    template.has_resource_properties(
        "AWS::EC2::SecurityGroup",
        {"GroupDescription": "Security group for Lambda function"},
    )


def test_tap_stack_has_outputs():
    """Test that TapStack exposes outputs from nested ServerlessStack"""
    app = App()
    stack = TapStack(app, "TestTapStackOutputs")
    template = Template.from_stack(stack)

    # Verify that parent stack has outputs
    template.has_output("VpcId", {})
    template.has_output("LambdaFunctionName", {})
    template.has_output("DynamoTableName", {})
    template.has_output("ApiGatewayId", {})
    template.has_output("AlarmName", {})


# Lambda Handler Tests - Use importlib since 'lambda' is a reserved keyword
import importlib


def _get_handler_module():
    """Import the lambda handler module using importlib (lambda is a reserved keyword)"""
    return importlib.import_module("lib.lambda.handler")


class TestLambdaHandler:
    """Tests for the Lambda handler function"""

    @patch.dict(os.environ, {"TABLE_NAME": "test-table"})
    def test_handler_default_response(self):
        """Test handler returns default response for non-item paths"""
        with patch.object(
            importlib.import_module("lib.lambda.handler"), "dynamodb"
        ) as mock_dynamodb:
            handler_module = _get_handler_module()
            importlib.reload(handler_module)

            event = {"httpMethod": "GET", "path": "/"}
            response = handler_module.handler(event, None)

            assert response["statusCode"] == 200
            body = json.loads(response["body"])
            assert body["message"] == "Item Service API"
            assert body["path"] == "/"
            assert body["method"] == "GET"

    @patch.dict(os.environ, {"TABLE_NAME": "test-table"})
    def test_handler_get_items_route(self):
        """Test handler routes to get_items for /item path"""
        handler_module = _get_handler_module()
        importlib.reload(handler_module)

        with patch.object(handler_module, "dynamodb") as mock_dynamodb:
            mock_table = MagicMock()
            mock_table.scan.return_value = {"Items": [{"itemId": "1", "name": "test"}]}
            mock_dynamodb.Table.return_value = mock_table

            event = {"httpMethod": "GET", "path": "/item", "queryStringParameters": None}
            response = handler_module.handler(event, None)

            assert response["statusCode"] == 200
            body = json.loads(response["body"])
            assert "items" in body
            assert body["count"] == 1

    @patch.dict(os.environ, {"TABLE_NAME": "test-table"})
    def test_handler_exception_handling(self):
        """Test handler handles exceptions gracefully"""
        handler_module = _get_handler_module()
        importlib.reload(handler_module)

        with patch.object(handler_module, "dynamodb") as mock_dynamodb:
            mock_dynamodb.Table.side_effect = Exception("Test error")

            event = {"httpMethod": "GET", "path": "/item"}
            response = handler_module.handler(event, None)

            assert response["statusCode"] == 500
            body = json.loads(response["body"])
            assert "error" in body

    @patch.dict(os.environ, {"TABLE_NAME": ""})
    def test_get_items_no_table_name(self):
        """Test get_items returns error when TABLE_NAME not set"""
        handler_module = _get_handler_module()
        importlib.reload(handler_module)

        event = {"httpMethod": "GET", "path": "/item"}
        response = handler_module.get_items(event)

        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert "TABLE_NAME" in body["error"]

    @patch.dict(os.environ, {"TABLE_NAME": "test-table"})
    def test_get_items_with_item_id(self):
        """Test get_items with specific item ID"""
        handler_module = _get_handler_module()
        importlib.reload(handler_module)

        with patch.object(handler_module, "dynamodb") as mock_dynamodb:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {"Item": {"itemId": "123", "name": "test"}}
            mock_dynamodb.Table.return_value = mock_table

            event = {"queryStringParameters": {"itemId": "123"}}
            response = handler_module.get_items(event)

            assert response["statusCode"] == 200
            body = json.loads(response["body"])
            assert body["itemId"] == "123"

    @patch.dict(os.environ, {"TABLE_NAME": "test-table"})
    def test_get_items_item_not_found(self):
        """Test get_items returns 404 when item not found"""
        handler_module = _get_handler_module()
        importlib.reload(handler_module)

        with patch.object(handler_module, "dynamodb") as mock_dynamodb:
            mock_table = MagicMock()
            mock_table.get_item.return_value = {}
            mock_dynamodb.Table.return_value = mock_table

            event = {"queryStringParameters": {"itemId": "nonexistent"}}
            response = handler_module.get_items(event)

            assert response["statusCode"] == 404
            body = json.loads(response["body"])
            assert "not found" in body["error"]

    @patch.dict(os.environ, {"TABLE_NAME": "test-table"})
    def test_get_items_scan_all(self):
        """Test get_items scans all items when no itemId provided"""
        handler_module = _get_handler_module()
        importlib.reload(handler_module)

        with patch.object(handler_module, "dynamodb") as mock_dynamodb:
            mock_table = MagicMock()
            mock_table.scan.return_value = {
                "Items": [
                    {"itemId": "1", "name": "item1"},
                    {"itemId": "2", "name": "item2"},
                ]
            }
            mock_dynamodb.Table.return_value = mock_table

            event = {"queryStringParameters": None}
            response = handler_module.get_items(event)

            assert response["statusCode"] == 200
            body = json.loads(response["body"])
            assert body["count"] == 2
            assert len(body["items"]) == 2

    @patch.dict(os.environ, {"TABLE_NAME": "test-table"})
    def test_get_items_dynamodb_error(self):
        """Test get_items handles DynamoDB ClientError"""
        from botocore.exceptions import ClientError

        handler_module = _get_handler_module()
        importlib.reload(handler_module)

        with patch.object(handler_module, "dynamodb") as mock_dynamodb:
            mock_table = MagicMock()
            mock_table.scan.side_effect = ClientError(
                {"Error": {"Code": "ResourceNotFoundException", "Message": "Table not found"}},
                "Scan"
            )
            mock_dynamodb.Table.return_value = mock_table

            event = {"queryStringParameters": None}
            response = handler_module.get_items(event)

            assert response["statusCode"] == 500
            body = json.loads(response["body"])
            assert "DynamoDB error" in body["error"]
