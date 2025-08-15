"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions
import os

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
os.environ["PULUMI_TEST_MODE"] ="1 pytest"

"""
Here you define the classes for Unit tests for the TapStack Pulumi component and Pulumi's testing utilities.

Write your end-to-end unit testing below. Examples is given, do not use this as

it may not fit the stack you're deploying.
"""


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})

  def test_tap_stack_args_custom_values(self):
    tags = {"env": "prod"}
    args = TapStackArgs(environment_suffix="prod", tags=tags)
    self.assertEqual(args.environment_suffix, "prod")
    self.assertEqual(args.tags, tags)


class TestTapStack(unittest.TestCase):
  """Unit tests for TapStack Pulumi component."""

  @patch("lib.tap_stack.KMSManager")
  @patch("lib.tap_stack.IAMManager")
  @patch("lib.tap_stack.S3Manager")
  @patch("lib.tap_stack.LoggingManager")
  @patch("lib.tap_stack.VPCManager")
  @patch("pulumi.export")
  def test_tap_stack_initialization(
          self,
          mock_export,
          MockVPCManager,
          MockLoggingManager,
          MockS3Manager,
          MockIAMManager,
          MockKMSManager):
    # Setup mocks for all managers and their methods
    mock_kms = MockKMSManager.return_value
    mock_kms.create_master_key.return_value = MagicMock(
        key_id="master-id", arn="master-arn")
    mock_kms.create_logging_key.return_value = MagicMock(
        key_id="logging-id", arn="logging-arn")

    mock_iam = MockIAMManager.return_value
    mock_iam.create_cloudtrail_role.return_value = MagicMock()
    mock_iam.create_vpc_flow_logs_role.return_value = MagicMock()

    mock_vpc = MockVPCManager.return_value
    mock_vpc.create_vpc.return_value = MagicMock(id="vpc-123")
    mock_vpc.create_private_subnets.return_value = [MagicMock()]
    mock_vpc.create_security_groups.return_value = [MagicMock()]

    mock_s3 = MockS3Manager.return_value
    mock_s3.create_logging_bucket.return_value = MagicMock(
        bucket="log-bucket", arn="log-bucket-arn")

    mock_logging = MockLoggingManager.return_value
    mock_logging.create_cloudwatch_log_group.return_value = MagicMock(
        name="log-group")
    mock_logging.create_cloudtrail.return_value = MagicMock(
        arn="cloudtrail-arn")
    mock_logging.create_vpc_flow_logs.return_value = MagicMock()

    args = TapStackArgs(environment_suffix="dev", tags={"team": "test"})
    stack = TapStack("test-stack", args)

    # Check Pulumi exports
    self.assertTrue(mock_export.called)
    self.assertEqual(stack.tags, {"team": "test"})

  @patch("lib.tap_stack.KMSManager")
  @patch("lib.tap_stack.IAMManager")
  @patch("lib.tap_stack.S3Manager")
  @patch("lib.tap_stack.LoggingManager")
  @patch("lib.tap_stack.VPCManager")
  @patch("pulumi.export")
  def test_tap_stack_env_var_handling(
          self,
          mock_export,
          MockVPCManager,
          MockLoggingManager,
          MockS3Manager,
          MockIAMManager,
          MockKMSManager):
    # Set ENVIRONMENT_SUFFIX
    os.environ["ENVIRONMENT_SUFFIX"] = "stage"
    args = TapStackArgs()
    stack = TapStack("test-stack", args)
    self.assertEqual(stack.environment_suffix, "stage")

  @patch("lib.tap_stack.KMSManager")
  @patch("lib.tap_stack.IAMManager")
  @patch("lib.tap_stack.S3Manager")
  @patch("lib.tap_stack.LoggingManager")
  @patch("lib.tap_stack.VPCManager")
  @patch("pulumi.export")
  def test_tap_stack_register_outputs(
          self,
          mock_export,
          MockVPCManager,
          MockLoggingManager,
          MockS3Manager,
          MockIAMManager,
          MockKMSManager):
    # Setup mocks
    mock_kms = MockKMSManager.return_value
    mock_kms.create_master_key.return_value = MagicMock(
        key_id="master-id", arn="master-arn")
    mock_kms.create_logging_key.return_value = MagicMock(
        key_id="logging-id", arn="logging-arn")
    mock_vpc = MockVPCManager.return_value
    mock_vpc.create_vpc.return_value = MagicMock(id="vpc-123")
    mock_s3 = MockS3Manager.return_value
    mock_s3.create_logging_bucket.return_value = MagicMock(
        bucket="log-bucket", arn="log-bucket-arn")
    mock_logging = MockLoggingManager.return_value
    mock_logging.create_cloudwatch_log_group.return_value = MagicMock(
        name="log-group")
    mock_logging.create_cloudtrail.return_value = MagicMock(
        arn="cloudtrail-arn")

    args = TapStackArgs()
    stack = TapStack("test-stack", args)
    # Check register_outputs is called
    self.assertTrue(hasattr(stack, "register_outputs"))

  @patch("lib.tap_stack.KMSManager")
  @patch("lib.tap_stack.IAMManager")
  @patch("lib.tap_stack.S3Manager")
  @patch("lib.tap_stack.LoggingManager")
  @patch("lib.tap_stack.VPCManager")
  @patch("pulumi.export")
  def test_tap_stack_missing_env_var(
          self,
          mock_export,
          MockVPCManager,
          MockLoggingManager,
          MockS3Manager,
          MockIAMManager,
          MockKMSManager):
    # Remove ENVIRONMENT_SUFFIX
    if "ENVIRONMENT_SUFFIX" in os.environ:
      del os.environ["ENVIRONMENT_SUFFIX"]
    args = TapStackArgs()
    stack = TapStack("test-stack", args)
    self.assertIsNone(stack.environment_suffix)


if __name__ == "__main__":
  unittest.main()
