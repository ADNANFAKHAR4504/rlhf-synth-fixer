import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack


class TestMyCompanyServerlessStack(unittest.TestCase):
  """Unit tests for MyCompanyServerlessStack via TapStack"""

  def setUp(self):
    self.app = cdk.App()
    self.tap_stack = TapStack(self.app, "TestTapStack")
    # 👇 Access the nested stack directly
    self.nested_stack = self.tap_stack.serverless_stack
    self.template = Template.from_stack(self.nested_stack)

  def test_lambda_function_created(self):
    self.template.has_resource_properties("AWS::Lambda::Function", {
        "Handler": "index.handler",
        "Runtime": "python3.11",
        "Environment": {
            "Variables": {
                "LOG_LEVEL": "INFO"
            }
        }
    })

  def test_api_gateway_created(self):
    self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": "mycompany-Service",
        "Description": "This service serves mycompany HTTP POST requests."
    })

  def test_post_method_exists(self):
    self.template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "POST"
    })

  def test_lambda_execution_role_created(self):
    self.template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": Match.object_like({
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                })
            ])
        }),
        # ✅ Fix this line
        "ManagedPolicyArns": Match.any_value()
    })

  def test_api_endpoint_output_exists(self):
    self.template.has_output("ApiEndpoint", {
        "Value": Match.any_value()  # Accepts Fn::Join or any valid value
    })
