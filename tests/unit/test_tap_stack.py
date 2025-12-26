"""
Unit tests for A2 TapStack infrastructure (Lambda + DynamoDB + API Gateway).

Tests stack initialization, configuration, and resource creation
without deploying actual AWS infrastructure.
"""

import unittest
from unittest.mock import MagicMock, patch

import pulumi
from pulumi.runtime import MockCallArgs, MockResourceArgs, Mocks, set_mocks

from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(Mocks):
  def new_resource(self, args: MockResourceArgs) -> tuple[str, dict]:
    """
    Create a new mocked resource.
    """
    return f"{args.name}_id", args.inputs

  def call(self, args: MockCallArgs) -> tuple[dict, list[tuple[str, str]] | None]:
    """
    Simulate a Pulumi function call.
    """
    return {}, None


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackCreation(unittest.TestCase):

  @patch("lib.tap_stack.aws_lambda.Function")
  @patch("lib.tap_stack.iam.Role")
  @patch("lib.tap_stack.iam.RolePolicyAttachment")
  @patch("lib.tap_stack.apigateway.RestApi")
  @patch("lib.tap_stack.apigateway.Resource")
  @patch("lib.tap_stack.apigateway.Deployment")
  @patch("lib.tap_stack.aws_lambda.Permission")
  @patch("lib.tap_stack.sns.Topic")
  @patch("lib.tap_stack.cloudwatch.MetricAlarm")
  def test_stack_initialization_with_defaults(
      self,
      mock_metric_alarm,
      mock_sns_topic,
      mock_lambda_permission,
      mock_apigw_deployment,
      mock_apigw_resource,
      mock_apigw_restapi,
      mock_iam_role_policy_attachment,
      mock_iam_role,
      mock_lambda_function,
  ):
    """
    Verify that stack initializes correctly with default args.
    """
    args = TapStackArgs()
    TapStack("testStack", args)

    self.assertEqual(args.environment_suffix, "dev")
    self.assertIsInstance(args.tags, dict)

    # Ensure AWS resources are attempted to be created
    mock_iam_role.assert_called()
    mock_lambda_function.assert_called()
    mock_apigw_restapi.assert_called()
    mock_sns_topic.assert_called()
    mock_metric_alarm.assert_called()

  @patch("lib.tap_stack.aws_lambda.Function")
  @patch("lib.tap_stack.iam.Role")
  @patch("lib.tap_stack.apigateway.RestApi")
  @patch("lib.tap_stack.sns.Topic")
  def test_stack_initialization_with_custom_args(
      self,
      mock_sns_topic,
      mock_apigw_restapi,
      mock_iam_role,
      mock_lambda_function,
  ):
    """
    Verify that stack initializes correctly with custom args.
    """
    tags = {"Project": "UnitTest"}
    args = TapStackArgs(environment_suffix="prod", tags=tags)
    TapStack("customStack", args)

    # Expect merged tags with COMMON_TAGS preserved
    expected_tags = {"Project": "UnitTest", "Owner": "LLM-Eval"}
    self.assertEqual(args.tags, expected_tags)

    mock_iam_role.assert_called()
    mock_lambda_function.assert_called()
    mock_apigw_restapi.assert_called()
    mock_sns_topic.assert_called()

  @patch("lib.tap_stack.aws_lambda.Function")
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
    expected_tags = {"Service": "Alerting",
                     "Project": "IaC-Nova-Test", "Owner": "LLM-Eval"}
    self.assertEqual(called_kwargs.get("tags"), expected_tags)


if __name__ == "__main__":
  unittest.main()
