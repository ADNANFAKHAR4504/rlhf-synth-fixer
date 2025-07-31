import unittest
from unittest.mock import patch
from pulumi import Output
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):

  def test_default_values(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.aws_region, 'us-east-1')
    self.assertEqual(args.vpc_cidr, '10.0.0.0/16')
    self.assertTrue(args.enable_monitoring)
    self.assertIn('Environment', args.tags)
    self.assertEqual(args.tags['Environment'], 'Dev')

  def test_invalid_environment_suffix_raises(self):
    with self.assertRaises(ValueError):
      TapStackArgs(environment_suffix='invalid-env')

  def test_invalid_vpc_cidr_raises(self):
    with self.assertRaises(ValueError):
      TapStackArgs(vpc_cidr='10.0.0.0/8')

  def test_invalid_region_format_raises(self):
    with self.assertRaises(ValueError):
      TapStackArgs(aws_region='uswest')


class TestTapStackComponent(unittest.TestCase):

  @patch("lib.tap_stack.aws.iam.Role")
  @patch("lib.tap_stack.aws.s3.Bucket")
  @patch("lib.tap_stack.aws.cloudwatch.LogGroup")
  def test_tap_stack_creates_resources(
    self, mock_log_group, mock_bucket, mock_role
  ):
    mock_role.return_value.arn = Output.from_input("mock-role-arn")
    mock_bucket.return_value.bucket = Output.from_input("mock-bucket-name")
    mock_bucket.return_value.arn = Output.from_input("mock-bucket-arn")
    mock_log_group.return_value.name = Output.from_input("mock-log-group-name")
    mock_log_group.return_value.arn = Output.from_input("mock-log-group-arn")

    args = TapStackArgs(environment_suffix="dev")
    stack = TapStack("test-tap-stack", args)

    mock_role.assert_called_once()
    mock_bucket.assert_called_once()
    mock_log_group.assert_called_once()

    stack.service_role_arn.apply(lambda arn: self.assertEqual(arn, "mock-role-arn"))
    stack.artifacts_bucket_name.apply(lambda name: self.assertEqual(name, "mock-bucket-name"))

  @patch("lib.tap_stack.aws.cloudwatch.LogGroup")
  def test_monitoring_skipped_when_disabled(self, mock_log_group):
    args = TapStackArgs(environment_suffix="dev", enable_monitoring=False)
    TapStack("test-no-monitoring", args)
    mock_log_group.assert_not_called()


if __name__ == "__main__":
  unittest.main()
