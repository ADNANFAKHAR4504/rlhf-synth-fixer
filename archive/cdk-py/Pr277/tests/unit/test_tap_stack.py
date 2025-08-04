import pytest
from aws_cdk import App
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture(scope="module")
def template():
  app = App()
  stack = TapStack(
      app,
      "TestTapStack",
      props=TapStackProps(
          environment_suffix="test"))
  return Template.from_stack(stack.api_stack)


def test_lambda_function_created(template):
  template.has_resource_properties("AWS::Lambda::Function", {
      "FunctionName": "StatusHandler-test",
      "Runtime": "python3.9",
      "Handler": "handler.main",
      "MemorySize": 512,
      "Timeout": 10,
      "Environment": {
          "Variables": {
              "LOG_LEVEL": "INFO"
          }
      }
  })


def test_iam_policy_attached_to_lambda(template):
  template.has_resource_properties("AWS::IAM::Policy", {
      "PolicyDocument": {
          "Statement": [
              {
                  "Action": [
                      "logs:CreateLogGroup",
                      "logs:CreateLogStream",
                      "logs:PutLogEvents"
                  ],
                  "Effect": "Allow"
              }
          ]
      }
  })


def test_api_gateway_created(template):
  template.has_resource_properties("AWS::ApiGateway::RestApi", {
      "Name": "ProductionService-test",
      "Description": "Production-ready API Gateway"
  })


def test_api_gateway_method_exists(template):
  template.has_resource_properties("AWS::ApiGateway::Method", {
      "HttpMethod": "GET",
      "AuthorizationType": "NONE"
  })


def test_api_gateway_stage_config(template):
  template.has_resource_properties("AWS::ApiGateway::Stage", {
      "StageName": "prod",
      "MethodSettings": [{
          "LoggingLevel": "INFO",
          "DataTraceEnabled": True
      }]
  })


def test_stack_outputs_exist(template):
  template.has_output("LambdaFunctionName", {
      "Description": "Lambda function name"
  })

  template.has_output("ApiEndpoint", {
      "Description": "API Gateway base URL"
  })

  template.has_output("Environment", {
      "Value": "Production"
  })
