"""
Unit tests for A2 TapStack infrastructure (Lambda + DynamoDB + API Gateway).

Tests stack initialization, configuration, and resource creation
without deploying actual AWS infrastructure.
"""

# tests/unit/test_tap_stack.py

import unittest
from unittest.mock import MagicMock, patch

import pulumi
from pulumi.runtime import Mocks, set_mocks, MockResourceArgs, MockCallArgs
from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(Mocks):
  def new_resource(self, args: MockResourceArgs) -> tuple[str, dict]:
    """
    Create a new mocked resource.

    Args:
        args (MockResourceArgs): Contains type, name, inputs, provider, and ID.

    Returns:
        tuple: (mock_resource_id, state_dict)
    """
    return f"{args.name}_id", args.inputs

  def call(self, args: MockCallArgs) -> tuple[dict, list[tuple[str, str]] | None]:
    """
    Simulate a Pulumi function call.

    Args:
        args (MockCallArgs): Contains token, arguments, and provider.

    Returns:
        tuple: (outputs_dict, property_dependencies)
    """
    return {}, None


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackCreation(unittest.TestCase):

  @patch("lib.tap_stack.lambda_.Function")
  @patch("lib.tap_stack.iam.Role")
  @patch("lib.tap_stack.iam.RolePolicyAttachment")
  @patch("lib.tap_stack.apigatewayv2.Api")
  @patch("lib.tap_stack.apigatewayv2.Integration")
  @patch("lib.tap_stack.apigatewayv2.Route")
  @patch("lib.tap_stack.apigatewayv2.Stage")
  @patch("lib.tap_stack.lambda_.Permission")
  @patch("lib.tap_stack.sns.Topic")
  @patch("lib.tap_stack.cloudwatch.MetricAlarm")
  def test_stack_initialization_with_defaults(
      self,
      mock_metric_alarm,
      mock_sns_topic,
      mock_lambda_permission,
      mock_apigw_stage,
      mock_apigw_route,
      mock_apigw_integration,
      mock_apigw_api,
      mock_iam_role_policy_attachment,
      mock_iam_role,
      mock_lambda_function,
  ):
    """
    Verify that stack initializes correctly with default args.
    """
    args = TapStackArgs()
    stack = TapStack("testStack", args)

    self.assertEqual(stack.environment_suffix, "dev")
    self.assertIsInstance(stack.tags, dict)

    # Ensure AWS resources are attempted to be created
    mock_iam_role.assert_called()
    mock_lambda_function.assert_called()
    mock_apigw_api.assert_called()
    mock_sns_topic.assert_called()
    mock_metric_alarm.assert_called()

  @patch("lib.tap_stack.lambda_.Function")
  @patch("lib.tap_stack.iam.Role")
  @patch("lib.tap_stack.apigatewayv2.Api")
  @patch("lib.tap_stack.sns.Topic")
  def test_stack_initialization_with_custom_args(
      self,
      mock_sns_topic,
      mock_apigw_api,
      mock_iam_role,
      mock_lambda_function,
  ):
    """
    Verify that stack initializes correctly with custom args.
    """
    tags = {"Project": "UnitTest"}
    args = TapStackArgs(environment_suffix="prod", tags=tags)
    stack = TapStack("customStack", args)

    self.assertEqual(stack.environment_suffix, "prod")
    self.assertEqual(stack.tags, tags)

    mock_iam_role.assert_called()
    mock_lambda_function.assert_called()
    mock_apigw_api.assert_called()
    mock_sns_topic.assert_called()

  @patch("lib.tap_stack.lambda_.Function")
  def test_lambda_function_configuration(self, mock_lambda_function):
    """
    Verify Lambda function configuration includes runtime and handler.
    """
    mock_lambda_function.return_value = MagicMock()

    args = TapStackArgs()
    TapStack("lambdaConfigTest", args)

    called_args, called_kwargs = mock_lambda_function.call_args
    self.assertIn("python3.9", called_kwargs.get("runtime"))
    self.assertIn("handler", called_kwargs.get("handler"))

  @patch("lib.tap_stack.sns.Topic")
  def test_sns_topic_creation(self, mock_sns_topic):
    """
    Verify SNS topic is created with correct tags.
    """
    tags = {"Service": "Alerting"}
    args = TapStackArgs(tags=tags)
    TapStack("snsTest", args)

    called_args, called_kwargs = mock_sns_topic.call_args
    self.assertEqual(called_kwargs.get("tags"), tags)


if __name__ == "__main__":
  unittest.main()
