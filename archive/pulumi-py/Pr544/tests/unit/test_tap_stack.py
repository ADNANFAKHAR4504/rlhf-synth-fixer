"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from lib.tap_stack import TapStackArgs


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()

    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})
    self.assertEqual(args.lambda_memory_size, 256)
    self.assertEqual(args.lambda_timeout, 30)
    self.assertEqual(args.api_stage_name, "$default")
