import os
import sys
import unittest
from unittest.mock import Mock, patch, MagicMock, call

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


class MockComponentResource:
  def __init__(self, type_name, name, props=None, opts=None):
    self.type_name = type_name
    self.name = name
    self.props = props
    self.opts = opts

  def register_outputs(self, outputs):
    self.outputs = outputs


class MockOutput:
  """Mock Pulumi Output"""

  def __init__(self, value=None):
    self.value = value

  @staticmethod
  def from_input(value):
    mock = Mock()
    mock.apply = Mock(return_value=value)
    return mock

  @staticmethod
  def all(*args):
    mock_result = Mock()
    mock_result.apply = Mock(return_value=Mock())
    return mock_result

  @staticmethod
  def concat(*args):
    return Mock()


class TestTapStack(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    """Set up class-level mocks"""
    # Mock Pulumi modules
    cls.mock_pulumi = Mock()
    cls.mock_pulumi.ComponentResource = MockComponentResource
    cls.mock_pulumi.ResourceOptions = Mock
    cls.mock_pulumi.Output = MockOutput
    cls.mock_pulumi.AssetArchive = Mock()
    cls.mock_pulumi.StringAsset = Mock()
    cls.mock_pulumi.get_stack = Mock(return_value="test")

    # Mock AWS modules
    cls.mock_aws = Mock()
    cls.mock_aws.get_region.return_value = Mock(name="us-east-1")
    cls.mock_aws.get_availability_zones.return_value = Mock(
        names=["us-east-1a", "us-east-1b"]
    )

    # Apply module patches
    sys.modules["pulumi"] = cls.mock_pulumi
    sys.modules["pulumi_aws"] = cls.mock_aws

  def setUp(self):
    """Set up test environment for each test"""
    # Clear any existing imports to ensure clean state
    modules_to_clear = [m for m in sys.modules.keys() if m.startswith("lib.")]
    for module in modules_to_clear:
      if module in sys.modules:
        del sys.modules[module]

    # Import classes after mocking
    from lib.tap_stack import TapStack, TapStackArgs

    # Store references for use in tests
    self.TapStack = TapStack
    self.TapStackArgs = TapStackArgs

    # Create test arguments
    self.test_args = TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"},
    )

  @patch('lib.tap_stack.MonitoringComponent')
  @patch('lib.tap_stack.ServerlessComponent')
  @patch('lib.tap_stack.DatabaseComponent')
  @patch('lib.tap_stack.StorageComponent')
  @patch('lib.tap_stack.ComputeComponent')
  @patch('lib.tap_stack.IAMComponent')
  def test_tap_stack_initialization(
          self, mock_iam, mock_compute, mock_storage, mock_database, mock_serverless, mock_monitoring):
    """Test that all components are initialized and configured properly"""

    # Mock IAMComponent
    mock_iam_instance = Mock()
    mock_iam_instance.instance_profile.name = 'test-profile'
    mock_iam_instance.lambda_role.arn = 'arn:aws:iam::123456789012:role/test-role'
    mock_iam.return_value = mock_iam_instance

    # Mock ComputeComponent
    mock_compute_instance = Mock()
    mock_compute_instance.vpc.id = 'vpc-123'
    mock_compute_instance.alb.dns_name = 'alb.test.local'
    mock_compute_instance.ec2_instances = ['i-12345678']
    mock_compute.return_value = mock_compute_instance

    # Mock StorageComponent
    mock_storage_instance = Mock()
    mock_storage_instance.bucket.bucket = 'my-test-bucket'
    mock_storage.return_value = mock_storage_instance

    # Mock DatabaseComponent
    mock_database_instance = Mock()
    mock_database_instance.table.name = 'test-table'
    mock_database.return_value = mock_database_instance

    # Mock ServerlessComponent
    mock_serverless_instance = Mock()
    mock_serverless_instance.lambda_function.name = 'test-lambda'
    mock_serverless.return_value = mock_serverless_instance

    # Mock MonitoringComponent
    mock_monitoring_instance = Mock()
    mock_monitoring.return_value = mock_monitoring_instance

    # Create the stack
    stack = self.TapStack('test-stack', self.test_args)

    # Verify each component was called
    mock_iam.assert_called_once()
    mock_compute.assert_called_once()
    mock_storage.assert_called_once()
    mock_database.assert_called_once()
    mock_serverless.assert_called_once()
    mock_monitoring.assert_called_once()

    # Check parameter propagation (example: IAMComponent)
    iam_call_args = mock_iam.call_args[1]
    self.assertEqual(iam_call_args['environment'], 'test')
    self.assertIn('Environment', iam_call_args['tags'])

    # Verify export values are being accessed
    self.assertEqual(stack.compute_component.vpc.id, 'vpc-123')
    self.assertEqual(stack.compute_component.alb.dns_name, 'alb.test.local')
    self.assertEqual(stack.database_component.table.name, 'test-table')
    self.assertEqual(stack.storage_component.bucket.bucket, 'my-test-bucket')
    self.assertEqual(
        stack.serverless_component.lambda_function.name, 'test-lambda')
    self.assertEqual(stack.environment_suffix, 'test')

  def test_tap_stack_args_defaults(self):
    """Ensure TapStackArgs assigns default values correctly"""
    args = self.TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)

  def test_tap_stack_args_custom_values(self):
    """Ensure TapStackArgs assigns custom values correctly"""
    tags = {'Team': 'QA', 'Project': 'TAP'}
    args = self.TapStackArgs(environment_suffix='staging', tags=tags)
    self.assertEqual(args.environment_suffix, 'staging')
    self.assertEqual(args.tags, tags)


if __name__ == '__main__':
  unittest.main(verbosity=2, buffer=True)
