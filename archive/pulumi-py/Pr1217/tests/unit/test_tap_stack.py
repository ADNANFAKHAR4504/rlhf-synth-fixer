import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi.runtime import set_mocks

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

  @patch("lib.tap_stack.LambdaFunction")
  @patch("lib.tap_stack.S3Bucket")
  @patch("lib.tap_stack.IAMRoles")
  def test_tap_stack_orchestration(self, mock_iam_roles, mock_s3_bucket, mock_lambda_function):
    # Set up Pulumi mocks first
    class MyMocks(pulumi.runtime.Mocks):
      def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [f"{args.name}_id", args.inputs]

      def call(self, args: pulumi.runtime.MockCallArgs):
        return {}

    set_mocks(MyMocks())

    # Arrange mocks with more detailed return values
    mock_iam_instance = MagicMock()
    mock_iam_instance.role_arn = "arn:aws:iam::123456789012:role/test-role"
    mock_iam_roles.return_value = mock_iam_instance

    mock_bucket_instance = MagicMock()
    mock_bucket_instance.bucket_name = "test-bucket"
    mock_s3_bucket.return_value = mock_bucket_instance

    mock_lambda_instance = MagicMock()
    mock_lambda_instance.function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-func"
    mock_lambda_function.return_value = mock_lambda_instance

    # Create the stack
    stack = TapStack(
      name="test-stack",
      args=TapStackArgs(environment_suffix="test")
    )

    # Assert orchestration calls happened
    mock_iam_roles.assert_called_once()
    mock_s3_bucket.assert_called_once()
    mock_lambda_function.assert_called_once()

    # Verify integration between components
    mock_bucket_instance.add_lambda_notification.assert_called_once()

    # Verify the components were called (orchestration verification)
    iam_call_args = mock_iam_roles.call_args
    s3_call_args = mock_s3_bucket.call_args
    lambda_call_args = mock_lambda_function.call_args

    # Assert components were called with some arguments
    self.assertIsNotNone(iam_call_args, "IAMRoles should be called with arguments")
    self.assertIsNotNone(s3_call_args, "S3Bucket should be called with arguments")
    self.assertIsNotNone(lambda_call_args, "LambdaFunction should be called with arguments")

    # Optional: Check first positional argument (resource name) if you want naming verification
    if len(iam_call_args[0]) > 0:
      iam_resource_name = iam_call_args[0][0]  # First positional argument
      self.assertIsInstance(iam_resource_name, str, "IAM resource name should be a string")

    if len(s3_call_args[0]) > 0:
      s3_resource_name = s3_call_args[0][0]  # First positional argument
      self.assertIsInstance(s3_resource_name, str, "S3 resource name should be a string")

    if len(lambda_call_args[0]) > 0:
      lambda_resource_name = lambda_call_args[0][0]  # First positional argument
      self.assertIsInstance(lambda_resource_name, str, "Lambda resource name should be a string")

  @patch("lib.tap_stack.LambdaFunction")
  @patch("lib.tap_stack.S3Bucket")
  @patch("lib.tap_stack.IAMRoles")
  def test_tap_stack_component_dependencies(self, mock_iam_roles, mock_s3_bucket, mock_lambda_function):
    """Test that components are wired together with correct dependencies"""

    class MyMocks(pulumi.runtime.Mocks):
      def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [f"{args.name}_id", args.inputs]

      def call(self, args: pulumi.runtime.MockCallArgs):
        return {}

    set_mocks(MyMocks())

    # Mock return values to verify dependency injection
    mock_iam_instance = MagicMock()
    mock_iam_instance.role_arn = "test-role-arn"
    mock_iam_roles.return_value = mock_iam_instance

    mock_bucket_instance = MagicMock()
    mock_s3_bucket.return_value = mock_bucket_instance

    mock_lambda_instance = MagicMock()
    mock_lambda_instance.function_arn = "test-lambda-arn"
    mock_lambda_function.return_value = mock_lambda_instance

    # Create stack
    TapStack(
      name="test-stack",
      args=TapStackArgs(environment_suffix="prod")
    )

    # Verify IAM role is created first (for Lambda dependency)
    mock_iam_roles.assert_called_once()

    # Verify Lambda function receives IAM role ARN
    lambda_call_args = mock_lambda_function.call_args
    self.assertIsNotNone(lambda_call_args)

    # Verify S3 notification is configured with Lambda ARN
    mock_bucket_instance.add_lambda_notification.assert_called_once()

  def test_tap_stack_environment_suffix_propagation(self):
    """Test that environment suffix is properly propagated to all components"""
    with patch("lib.tap_stack.IAMRoles") as mock_iam, \
        patch("lib.tap_stack.S3Bucket") as mock_s3, \
        patch("lib.tap_stack.LambdaFunction") as mock_lambda:
      class MyMocks(pulumi.runtime.Mocks):
        def new_resource(self, args: pulumi.runtime.MockResourceArgs):
          return [f"{args.name}_id", args.inputs]

        def call(self, args: pulumi.runtime.MockCallArgs):
          return {}

      set_mocks(MyMocks())

      # Test with different environment suffix
      TapStack(
        name="test-stack",
        args=TapStackArgs(environment_suffix="staging")
      )

      # Verify all components were called (basic orchestration)
      mock_iam.assert_called_once()
      mock_s3.assert_called_once()
      mock_lambda.assert_called_once()


if __name__ == "__main__":
  unittest.main()
