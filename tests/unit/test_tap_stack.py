"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

# Import the classes we're testing
from lib.tap_stack import TapStackArgs


class TestTapStackArgs:
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()
    
    assert args.environment_suffix == 'dev'
    assert args.tags == {}
    assert args.region == 'us-west-2'

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {"Owner": "TestTeam", "Project": "TAP"}
    args = TapStackArgs(
      environment_suffix="prod",
      tags=custom_tags,
      region="us-east-1"
    )
    
    assert args.environment_suffix == "prod"
    assert args.tags == custom_tags
    assert args.region == "us-east-1"

  def test_tap_stack_args_partial_values(self):
    """Test TapStackArgs with some custom values."""
    args = TapStackArgs(environment_suffix="staging")
    
    assert args.environment_suffix == "staging"
    assert args.tags == {}
    assert args.region == "us-west-2"
