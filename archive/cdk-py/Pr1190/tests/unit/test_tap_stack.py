import unittest
from pytest import mark

import aws_cdk as cdk
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Unit tests for TapStack."""

  def setUp(self):
    """Set up a fresh CDK app for each test."""
    self.app = cdk.App()

  @mark.it("creates a Lambda function with the correct configuration")
  def test_creates_sample_lambda_function(self):
    """Test that sample and monitoring Lambda functions exist with correct properties."""
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    # Assert Lambda functions exist (sample + monitoring)
    template.resource_count_is("AWS::Lambda::Function", 2)

    # Assert properties for the sample Lambda
    template.has_resource_properties("AWS::Lambda::Function", {
      "MemorySize": 512,
      "Runtime": "python3.9",
      "Handler": "index.lambda_handler",
      "Architectures": ["arm64"]
    })

  @mark.it("creates a CloudWatch log group with 7-day retention")
  def test_creates_log_group(self):
    """Test that CloudWatch log group exists with correct retention."""
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Logs::LogGroup", 1)
    template.has_resource_properties("AWS::Logs::LogGroup", {
      "RetentionInDays": 7
    })

  @mark.it("creates an API Gateway REST API with /sample resource")
  def test_creates_api_gateway(self):
    """Test that API Gateway and methods exist."""
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.resource_count_is("AWS::ApiGateway::Method", 2)

  @mark.it("creates SSM parameter for Datadog API key")
  def test_creates_ssm_parameter(self):
    """Test that SSM parameter for Datadog API key exists."""
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::SSM::Parameter", 1)
    template.has_resource_properties("AWS::SSM::Parameter", {
      "Name": "/serverless-platform/datadog/api-key",
      "Type": "String",
      "Tier": "Standard"
    })

  @mark.it("creates EventBridge rule to trigger monitoring Lambda")
  def test_creates_eventbridge_rule(self):
    """Test that EventBridge rule exists to trigger monitoring Lambda."""
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="testenv"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Events::Rule", 1)
    template.has_resource_properties("AWS::Events::Rule", {
      "ScheduleExpression": "rate(1 minute)"
    })
