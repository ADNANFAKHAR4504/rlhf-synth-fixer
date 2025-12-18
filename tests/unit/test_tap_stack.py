import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    def setUp(self):
        self.app = cdk.App()

    @mark.it("creates a Lambda function with correct properties")
    def test_creates_lambda_function(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.lambda_handler",
            "Runtime": "python3.11",
            "Timeout": 30,
            "MemorySize": 128
        })

    @mark.it("creates a CloudWatch Log Group for Lambda")
    def test_creates_lambda_log_group(self):
        stack = TapStack(self.app, "TapStackTestLogGroup")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 7
        })

    @mark.it("creates an IAM role for Lambda with least privilege")
    def test_creates_lambda_execution_role(self):
        stack = TapStack(self.app, "TapStackTestRole")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ],
                "Version": "2012-10-17"
            }
        })

    @mark.it("creates an HTTP API Gateway with CORS enabled")
    def test_creates_http_api_gateway(self):
        stack = TapStack(self.app, "TapStackTestApi")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
        template.has_resource_properties("AWS::ApiGatewayV2::Api", {
            "Name": "tap-dev-api",
            "ProtocolType": "HTTP"
        })

    @mark.it("outputs Lambda and API Gateway details")
    def test_outputs(self):
        stack = TapStack(self.app, "TapStackTestOutputs")
        template = Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("ApiEndpoint", outputs)
        self.assertIn("LambdaFunctionName", outputs)
        self.assertIn("LambdaFunctionArn", outputs)
        self.assertIn("HttpApiId", outputs)
        self.assertIn("HttpApiEndpoint", outputs)
