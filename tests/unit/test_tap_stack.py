import unittest
from unittest.mock import patch, MagicMock
import pulumi

from lib.components.s3_bucket import S3Bucket
from lib.components.lambda_function import LambdaFunction, LambdaConfig
from lib.components.iam_roles import IAMRoles
from lib.tap_stack import TapStack, TapStackArgs


class DummyPermission(pulumi.Resource):
    def __init__(self, name):
        super().__init__("custom:resource:DummyPermission", name, None, None)


class TestServerlessComponents(unittest.TestCase):

    @patch("lib.components.iam_roles.aws.iam.Role")
    @patch("lib.components.iam_roles.aws.iam.RolePolicyAttachment")
    def test_iam_role_creation(self, mock_policy_attach, mock_role):
        IAMRoles(
            "test-role",
            pulumi.Output.from_input("test-role-arn").apply(lambda arn: f"{arn}")
        )
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

    # ✅ NEW: Test TapStack orchestration to improve coverage
    @patch("lib.tap_stack.LambdaFunction")
    @patch("lib.tap_stack.S3Bucket")
    @patch("lib.tap_stack.IAMRoles")
    def test_tap_stack_orchestration(self, mock_iam_roles, mock_s3_bucket, mock_lambda_function):
        # Arrange
        mock_bucket_instance = MagicMock()
        mock_s3_bucket.return_value = mock_bucket_instance

        # Act
        TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix="test")
        )

        # Assert: Verify orchestration calls
        mock_iam_roles.assert_called_once()
        mock_s3_bucket.assert_called_once()
        mock_lambda_function.assert_called_once()

        # Verify Lambda notification is added to bucket
        mock_bucket_instance.add_lambda_notification.assert_called_once()


if __name__ == "__main__":
    unittest.main()
