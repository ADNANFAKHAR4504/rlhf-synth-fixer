import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates Lambda functions for HTTP request handling")
  def test_creates_lambda_functions(self):
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 2)

    template.has_resource_properties("AWS::Lambda::Function", {
      "Runtime": "python3.9",
      "Handler": "index.lambda_handler",
      "MemorySize": 128,
      "Timeout": 30,
      "Description": "Simple Hello World Lambda function"
    })

    template.has_resource_properties("AWS::Lambda::Function", {
      "Runtime": "python3.9",
      "Handler": "index.lambda_handler",
      "MemorySize": 128,
      "Timeout": 30,
      "Description": "User info Lambda function"
    })

  @mark.it("creates HTTP API Gateway with proper configuration")
  def test_creates_http_api_gateway(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                      TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
    template.has_resource_properties("AWS::ApiGatewayV2::Api", {
      "Name": f"tap-{env_suffix}-serverless-api",
      "ProtocolType": "HTTP",
      "Description": "Serverless API for TAP application",
      "CorsConfiguration": {
        "AllowOrigins": ["*"],
        "AllowMethods": ["GET", "POST", "OPTIONS"],
        "AllowHeaders": ["Content-Type", "Authorization"]
      }
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::ApiGatewayV2::Api", {
      "Name": "tap-dev-serverless-api"
    })

  @mark.it("creates proper API Gateway routes and integrations")
  def test_creates_api_routes_and_integrations(self):
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::ApiGatewayV2::Integration", 2)
    template.resource_count_is("AWS::ApiGatewayV2::Route", 4)

    expected_routes = [
      "GET /hello",
      "POST /hello",
      "GET /user",
      "GET /user/{userId}"
    ]

    for route_key in expected_routes:
      template.has_resource_properties("AWS::ApiGatewayV2::Route", {
        "RouteKey": route_key,
        "AuthorizationType": "NONE"
      })

  @mark.it("creates proper IAM roles for Lambda functions")
  def test_creates_lambda_iam_roles(self):
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::IAM::Role", 2)
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"}
        }],
        "Version": "2012-10-17"
      }
    })

  @mark.it("creates Lambda permissions for API Gateway invocation")
  def test_creates_lambda_permissions(self):
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Permission", 4)
    template.has_resource_properties("AWS::Lambda::Permission", {
      "Action": "lambda:InvokeFunction",
      "Principal": "apigateway.amazonaws.com"
    })

  @mark.it("creates CloudFormation outputs for API endpoints")
  def test_creates_cfn_outputs(self):
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    outputs = template.find_outputs("*")
    output_keys = list(outputs.keys())

    self.assertIn("ApiUrl", output_keys)
    self.assertIn("HelloEndpoint", output_keys)
    self.assertIn("UserEndpoint", output_keys)
    self.assertEqual(outputs["ApiUrl"]["Export"]["Name"], "TapApiUrl")

  @mark.it("configures Lambda functions with Free Tier optimized settings")
  def test_lambda_free_tier_optimization(self):
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    lambda_functions = template.find_resources("AWS::Lambda::Function")

    for function_key, function_props in lambda_functions.items():
      if "LogRetention" not in function_key:
        properties = function_props["Properties"]
        self.assertEqual(properties["MemorySize"], 128)
        self.assertEqual(properties["Timeout"], 30)
        self.assertEqual(properties["Runtime"], "python3.9")

  @mark.it("configures log retention for cost optimization")
  def test_log_retention_configuration(self):
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # Now using explicit LogGroups instead of Custom::LogRetention for LocalStack compatibility
    template.resource_count_is("AWS::Logs::LogGroup", 2)
    template.has_resource_properties("AWS::Logs::LogGroup", {
      "RetentionInDays": 7
    })
