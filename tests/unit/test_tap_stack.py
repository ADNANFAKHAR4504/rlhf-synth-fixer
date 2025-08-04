"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs



class TestTapStackArgs:
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()
    assert args.environment_suffix == 'dev'
    assert args.tags is None
