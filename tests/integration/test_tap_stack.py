import unittest
from pytest import mark

import aws_cdk as cdk
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack using synthesized CloudFormation template."""

  def setUp(self):
    """Set up a fresh CDK app for each test."""
    self.app = cdk.App()

  @mark.it("creates Lambda functions with correct configuration")
  def test_lambda_functions_exist(self):
    """Test that sample and monitoring Lambda functions exist with correct props."""
    stack = TapStack(self.app, "TapStackIntegrationTest",
                     TapStackProps(environment_suffix="integration"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 2)
    template.has_resource_properties("AWS::Lambda::Function", {
      "MemorySize": 512,
      "Runtime": "python3.9",
      "Handler": "lambda_function.lambda_handler",
      "Architectures": ["arm64"]
    })

  @mark.it("creates API Gateway with /sample resource")
  def test_api_gateway_exists(self):
    """Test that API Gateway REST API and methods exist."""
    stack = TapStack(self.app, "TapStackIntegrationTest",
                     TapStackProps(environment_suffix="integration"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.resource_count_is("AWS::ApiGateway::Method", 2)

  @mark.it("creates CloudWatch LogGroup with 7-day retention")
  def test_log_group_exists(self):
    """Test that CloudWatch LogGroup exists with 7-day retention."""
    stack = TapStack(self.app, "TapStackIntegrationTest",
                     TapStackProps(environment_suffix="integration"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Logs::LogGroup", 1)
    template.has_resource_properties("AWS::Logs::LogGroup", {
      "RetentionInDays": 7
    })

  @mark.it("creates SSM Parameter for Datadog API key")
  def test_ssm_parameter_exists(self):
    """Test that SSM Parameter for Datadog API key exists."""
    stack = TapStack(self.app, "TapStackIntegrationTest",
                     TapStackProps(environment_suffix="integration"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::SSM::Parameter", 1)
    template.has_resource_properties("AWS::SSM::Parameter", {
      "Name": "/serverless-platform/datadog/api-key",
      "Type": "String",
      "Tier": "Standard"
    })

  @mark.it("creates EventBridge rule for monitoring Lambda")
  def test_eventbridge_rule_exists(self):
    """Test that EventBridge rule exists to trigger monitoring Lambda."""
    stack = TapStack(self.app, "TapStackIntegrationTest",
                     TapStackProps(environment_suffix="integration"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Events::Rule", 1)
    template.has_resource_properties("AWS::Events::Rule", {
      "ScheduleExpression": "rate(30 seconds)"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_default_env_suffix(self):
    """Test that environment suffix defaults to 'dev' when not provided."""
    stack = TapStack(self.app, "TapStackIntegrationTestDefault")
    template = Template.from_stack(stack)

    log_groups = [
      r for r in template.to_dict()['Resources'].values()
      if r['Type'] == 'AWS::Logs::LogGroup'
    ]
    self.assertTrue(any(
      "serverless-platform-dev" in lg['Properties']['LogGroupName']
      for lg in log_groups
    ))
