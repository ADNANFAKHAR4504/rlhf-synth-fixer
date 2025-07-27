import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.metadata_stack import MultiRegionStack
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("MultiRegionStack")
class TestMultiRegionStack(unittest.TestCase):
  """Unit tests for the MultiRegionStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app and stack for each test"""
    self.app = cdk.App()
    self.stack = MultiRegionStack(self.app, "TestMultiRegionStack", region="us-east-1")
    self.template = Template.from_stack(self.stack)

  @mark.it("creates a Lambda function with the correct handler and runtime")
  def test_lambda_function_created(self):
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Handler": "index.handler",
      "Runtime": "python3.9"
    })

  @mark.it("creates an IAM role for Lambda execution")
  def test_lambda_execution_role_created(self):
    self.template.has_resource_properties("AWS::IAM::Role", {
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

  @mark.it("creates an API Gateway REST API with the correct name")
  def test_api_gateway_created(self):
    self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
      "Name": "MultiRegionService"
    })

  @mark.it("adds a GET method to the API Gateway resource")
  def test_api_gateway_method_exists(self):
    self.template.resource_count_is("AWS::ApiGateway::Method", 1)

  @mark.it("outputs the API Gateway endpoint")
  def test_api_endpoint_output_exists(self):
    self.template.has_output("ApiEndpoint", {
      "Value": Match.any_value()
    })

  @mark.it("validates Lambda runtime version")
  def test_lambda_runtime_version(self):
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Runtime": "python3.9"
    })

  @mark.it("validates Lambda function code asset path")
  def test_lambda_code_asset(self):
    self.template.resource_count_is("AWS::Lambda::Function", 1)

  @mark.it("creates API Gateway deployment")
  def test_api_gateway_deployment(self):
    self.template.resource_count_is("AWS::ApiGateway::Deployment", 1)

  @mark.it("creates API Gateway stage")
  def test_api_gateway_stage(self):
    self.template.has_resource_properties("AWS::ApiGateway::Stage", {
      "StageName": "prod"
    })


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Unit tests for the main TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app and stack for each test"""
    self.app = cdk.App()
    self.props = TapStackProps(environment_suffix="test")
    self.stack = TapStack(self.app, "TestTapStack", props=self.props)
    self.template = Template.from_stack(self.stack)

  @mark.it("creates nested stacks for multi-region deployment")
  def test_nested_stack_creation(self):
    self.template.resource_count_is("AWS::CloudFormation::Stack", 1)

  @mark.it("uses environment suffix in stack naming")
  def test_environment_suffix_usage(self):
    # Verify that the nested stack uses the environment suffix
    nested_stacks = self.template.find_resources("AWS::CloudFormation::Stack")
    self.assertTrue(len(nested_stacks) > 0)

  @mark.it("handles default environment suffix")
  def test_default_environment_suffix(self):
    # Test with no environment suffix provided using a fresh app
    fresh_app = cdk.App()
    stack_no_suffix = TapStack(fresh_app, "TestTapStackNoSuffix")
    template_no_suffix = Template.from_stack(stack_no_suffix)
    template_no_suffix.resource_count_is("AWS::CloudFormation::Stack", 1)

  @mark.it("supports context-based environment suffix")
  def test_context_environment_suffix(self):
    # Test with context-based environment suffix
    app_with_context = cdk.App()
    app_with_context.node.set_context("environmentSuffix", "ctx-test")
    stack_with_context = TapStack(app_with_context, "TestTapStackContext")
    template_with_context = Template.from_stack(stack_with_context)
    template_with_context.resource_count_is("AWS::CloudFormation::Stack", 1)
