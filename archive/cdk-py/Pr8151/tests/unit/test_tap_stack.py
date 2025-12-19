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

  @mark.it("creates a DynamoDB table with the correct configuration")
  def test_dynamodb_table_configuration(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "TableName": "user-data-table-testenv",
        "BillingMode": "PAY_PER_REQUEST",
        "SSESpecification": {"SSEEnabled": True},
        "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
        "KeySchema": [
            {"AttributeName": "userId", "KeyType": "HASH"}
        ],
    })

  @mark.it("creates a Lambda function with the correct configuration")
  def test_lambda_function_configuration(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
        "FunctionName": "user-api-handler-testenv",
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Timeout": 10,
        "MemorySize": 256,
        "TracingConfig": {"Mode": "Active"}
    })

  @mark.it("creates an API Gateway with the correct configuration")
  def test_api_gateway_configuration(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": "user-data-api-testenv",
        "EndpointConfiguration": {"Types": ["REGIONAL"]}
    })

    # Validate CORS configuration
    template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "OPTIONS",
        "Integration": {
            "IntegrationResponses": [
                {
                    "ResponseParameters": {
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                }
            ]
        }
    })

  @mark.it("creates CloudFormation outputs for key resources")
  def test_cloudformation_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # ASSERT
    template.has_output("ApiEndpoint", {
        "Description": "API Gateway endpoint URL for user retrieval"
    })
    template.has_output("TableName", {
        "Description": "DynamoDB table name for user data"
    })
    template.has_output("LambdaFunctionName", {
        "Description": "Lambda function name for user API"
    })
    template.has_output("Environment", {
        "Description": "Environment suffix used for resource naming"
    })



if __name__ == "__main__":
    unittest.main()
