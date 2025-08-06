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
