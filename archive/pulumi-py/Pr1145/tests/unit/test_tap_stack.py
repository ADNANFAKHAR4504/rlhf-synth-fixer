"""
Unit tests for Task 2 TapStack infrastructure.

Verifies stack initialization, configuration, and resource creation
without deploying actual AWS infrastructure.
"""

import os
import unittest
from unittest.mock import ANY, patch

import pulumi
from pulumi.runtime import Mocks

from lib.tap_stack import TapStack, TapStackArgs


# Dummy resource to mimic Pulumi AWS resources
class DummyResource(pulumi.CustomResource):
  def __init__(self, name="dummy", **kwargs):
    super().__init__("test:DummyResource", name, {}, opts=pulumi.ResourceOptions())
    # Common attributes accessed in tap_stack.py
    self._resource_id = f"{name}_id"
    self.arn = f"arn:aws:test::{name}"
    self.name = f"{name}_name"
    self.bucket = f"{name}-bucket"


# Pulumi mocks
class MyMocks(Mocks):
  def new_resource(self, args):
    return f"{args.name}_id", args.inputs

  def call(self, args):
    return {}, None


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackTask2(unittest.TestCase):

  @patch("lib.tap_stack.aws.ec2.Vpc", return_value=DummyResource("vpc"))
  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=DummyResource("subnet"))
  @patch("lib.tap_stack.aws.iam.Policy", return_value=DummyResource("policy"))
  @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
  @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketown"))
  @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketenc"))
  @patch("lib.tap_stack.aws.s3.BucketLoggingV2", return_value=DummyResource("bucketlog"))
  @patch("lib.tap_stack.aws.kms.Key", return_value=DummyResource("kms"))
  @patch("lib.tap_stack.aws.rds.SubnetGroup", return_value=DummyResource("dbsubnetgroup"))
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=DummyResource("dbsg"))
  @patch("lib.tap_stack.aws.rds.Instance", return_value=DummyResource("db"))
  @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("attachment"))
  def test_stack_initialization_with_defaults(self, *_mocks):
    """Verify stack initializes with default args."""
    args = TapStackArgs()
    TapStack("testStack", args)

    self.assertEqual(args.environment_suffix, "dev")
    self.assertIsInstance(args.tags, dict)

  @patch("lib.tap_stack.aws.ec2.Vpc", return_value=DummyResource("vpc"))
  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=DummyResource("subnet"))
  @patch("lib.tap_stack.aws.iam.Policy", return_value=DummyResource("policy"))
  @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
  @patch("lib.tap_stack.aws.kms.Key", return_value=DummyResource("kms"))
  @patch("lib.tap_stack.aws.rds.SubnetGroup", return_value=DummyResource("dbsubnetgroup"))
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=DummyResource("dbsg"))
  @patch("lib.tap_stack.aws.rds.Instance", return_value=DummyResource("db"))
  @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("attachment"))
  def test_stack_initialization_with_custom_args(self, *_mocks):
    """Verify stack initializes with custom args."""
    tags = {"Project": "UnitTest"}
    args = TapStackArgs(environment_suffix="prod", tags=tags)
    TapStack("customStack", args)

    self.assertEqual(args.environment_suffix, "prod")
    self.assertEqual(args.tags, tags)

  @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("logbucket"))
  @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketown"))
  @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketenc"))
  def test_logging_bucket_configuration(self, mock_bucket_enc, mock_bucket_own, mock_bucket):
    """Verify logging bucket configuration calls are made."""
    args = TapStackArgs()
    TapStack("loggingBucketTest", args)

    mock_bucket.assert_any_call(
        f"logging-bucket-{args.environment_suffix}",
        bucket=f"tap-logging-{args.environment_suffix}-{pulumi.get_stack().lower()}",
        tags=args.tags,
        opts=ANY
    )
    mock_bucket_own.assert_called()
    mock_bucket_enc.assert_called()

  @patch("lib.tap_stack.aws.kms.Key", return_value=DummyResource("kmskey"))
  def test_kms_key_creation(self, mock_kms_key):
    """Verify KMS key is created with rotation enabled."""
    args = TapStackArgs()
    TapStack("kmsTest", args)

    mock_kms_key.assert_any_call(
        f"kms-key-{args.environment_suffix}",
        description="KMS key for encrypting sensitive data",
        deletion_window_in_days=10,
        enable_key_rotation=True,
        opts=ANY
    )


if __name__ == "__main__":
  unittest.main()
