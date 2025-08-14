import unittest
from unittest.mock import patch

import pulumi

from lib.components.s3_bucket import S3Bucket
from lib.components.lambda_function import LambdaFunction, LambdaConfig
from lib.components.iam_roles import IAMRoles


class DummyPermission(pulumi.Resource):
  def __init__(self, name):
    super().__init__("custom:resource:DummyPermission", name, None, None)


class TestServerlessComponents(unittest.TestCase):

  @patch("lib.components.iam_roles.aws.iam.Role")
  @patch("lib.components.iam_roles.aws.iam.RolePolicyAttachment")
  def test_iam_role_creation(self, mock_policy_attach, mock_role):
    IAMRoles("test-role", pulumi.Output.from_input("test-role-arn")
             .apply(lambda arn: f"{arn}"))
    self.assertTrue(mock_role.called)
    self.assertTrue(mock_policy_attach.called)

  @patch("lib.components.s3_bucket.aws.s3.Bucket")
  @patch("lib.components.s3_bucket.aws.s3.BucketVersioningV2")
  def test_s3_bucket_creation(self, mock_versioning, mock_bucket):
    S3Bucket("test-bucket")
    self.assertTrue(mock_bucket.called)
    self.assertTrue(mock_versioning.called)

  @patch("lib.components.lambda_function.aws.lambda_.Function")
  def test_lambda_function_creation(self, mock_lambda_func):
    LambdaFunction(
      "test-lambda",
      LambdaConfig(role_arn="arn:aws:iam::123456789012:role/test-role")
    )
    self.assertTrue(mock_lambda_func.called)

  @patch("lib.components.s3_bucket.aws.s3.BucketNotification")
  def test_s3_lambda_trigger_creation(self, mock_notification):
    bucket = S3Bucket("test-bucket")
    dummy_permission = DummyPermission("test-permission")

    bucket.add_lambda_notification(
      lambda_function_arn="arn:aws:lambda:us-east-1:123456789012:function:test-func",
      lambda_permission=dummy_permission
    )
    self.assertTrue(mock_notification.called)

  @patch("lib.components.s3_bucket.aws.s3.BucketNotification")
  @patch("lib.components.s3_bucket.S3Bucket.add_lambda_notification")
  def test_s3_lambda_integration_unit(self, mock_add_notification, mock_bucket_notification):
    bucket = S3Bucket("test-bucket")
    dummy_permission = DummyPermission("test-permission")

    bucket.add_lambda_notification(
      lambda_function_arn="arn:aws:lambda:us-east-1:123456789012:function:test-func",
      lambda_permission=dummy_permission
    )

    mock_add_notification.assert_called_once_with(
      lambda_function_arn="arn:aws:lambda:us-east-1:123456789012:function:test-func",
      lambda_permission=dummy_permission
    )

if __name__ == "__main__":
  unittest.main()
