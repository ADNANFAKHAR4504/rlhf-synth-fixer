import unittest
from aws_cdk.assertions import Template
from aws_cdk import App
from lib.tap_stack import TapStack, TapStackProps
from lib.metadata_stack import ServerlessDemoStack


class TestTapStack(unittest.TestCase):

  def setUp(self):
    self.app = App()

  def test_tap_stack_with_default_env_suffix(self):
    """Test that nested stack name defaults to 'dev'"""
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::CloudFormation::Stack", 1)

  def test_tap_stack_with_custom_env_suffix(self):
    """Test that nested stack name includes custom environment suffix"""
    stack = TapStack(self.app, "TapStackTestCustom", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::CloudFormation::Stack", 1)

  def test_nested_stack_includes_lambda(self):
    """Ensure nested stack includes Lambda from ServerlessDemoStack"""
    stack = TapStack(self.app, "TapStackWithLambda", TapStackProps(environment_suffix="ci"))

    nested_stack = stack.node.try_find_child("NestedServerlessDemoStackci")
    self.assertIsNotNone(nested_stack)

    serverless_stack = nested_stack.node.try_find_child("ServerlessDemoStackci")
    self.assertIsNotNone(serverless_stack)

    nested_template = Template.from_stack(serverless_stack)
    nested_template.has_resource_properties("AWS::Lambda::Function", {
      "FunctionName": "serverless_demo_function"
    })


class TestServerlessDemoStack(unittest.TestCase):

  def setUp(self):
    self.app = App()

  def test_lambda_function_created(self):
    """Test Lambda function resource is created correctly"""
    stack = ServerlessDemoStack(self.app, "DemoStack")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
      "Handler": "lambda_handler.handler",
      "Runtime": "python3.8",
      "FunctionName": "serverless_demo_function",
      "Environment": {
        "Variables": {
          "LOG_LEVEL": "INFO"
        }
      },
      "Timeout": 15
    })
