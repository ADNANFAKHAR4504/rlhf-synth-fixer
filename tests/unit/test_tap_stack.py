import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest

from lib.metadata_stack import ServerlessStack  # adjust the import path if needed


@pytest.fixture
def template():
    app = cdk.App()
    stack = ServerlessStack(app, "TestServerlessStack")
    return Template.from_stack(stack)


def test_dynamodb_table_created(template):
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "BillingMode": "PAY_PER_REQUEST",
        "KeySchema": [
            {
                "AttributeName": "itemId",
                "KeyType": "HASH"
            }
        ],
        "AttributeDefinitions": [
            {
                "AttributeName": "itemId",
                "AttributeType": "S"
            }
        ]
    })


def test_lambda_function_created(template):
    template.has_resource_properties("AWS::Lambda::Function", {
        "Handler": "index.handler",
        "Runtime": "python3.9",
        "Environment": {
            "Variables": {
                "TABLE_NAME": Match.any_value()
            }
        },
        "VpcConfig": Match.object_like({
            "SubnetIds": Match.any_value()
        })
    })


def test_lambda_execution_role_created(template):
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": Match.object_like({
            "Statement": Match.array_with([
                Match.object_like({
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                })
            ])
        })
    })


def test_cloudwatch_alarm_created(template):
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "MetricName": "Errors"
    })


def test_api_gateway_created(template):
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": "Item Service"
    })

def test_lambda_log_policy(template):
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": Match.array_with(["logs:CreateLogGroup"]),
                    "Effect": "Allow"
                })
            ])
        }
    })

def test_api_method_created(template):
    template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "GET"
    })

def test_lambda_api_integration(template):
    template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "GET",
        "Integration": Match.object_like({
            "Type": "AWS_PROXY"
        })
    })

def test_lambda_role_policy_attachment(template):
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": Match.object_like({
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": Match.array_with(["logs:PutLogEvents"]),
                    "Effect": "Allow"
                })
            ])
        })
    })

def test_lambda_env_vars(template):
    template.has_resource_properties("AWS::Lambda::Function", {
        "Environment": {
            "Variables": {
                "TABLE_NAME": Match.any_value()
            }
        }
    })

def test_stack_executes():
    from lib.metadata_stack import ServerlessStack
    app = cdk.App()
    stack = ServerlessStack(app, "IntegrationExecutionStack")
    assert stack is not None

def create_lambda_environment(table_name: str) -> dict:
    return {"TABLE_NAME": table_name}

def test_lambda_env_helper():
    assert create_lambda_environment("my-table") == {"TABLE_NAME": "my-table"}
from aws_cdk import App
from lib.tap_stack import TapStack

def test_tap_stack_executes():
    app = App()
    stack = TapStack(app, "TestTapStack")
    assert stack is not None