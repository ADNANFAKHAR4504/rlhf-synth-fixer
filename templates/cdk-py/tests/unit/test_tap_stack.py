"""
Unit tests for the TapStack class.

This module contains unittest-based tests for verifying the AWS CDK stack
resources and properties are correctly defined in the TapStack.
"""
import os
import unittest
from unittest import mock

import aws_cdk as cdk
from aws_cdk.assertions import Template
from tap.tap_stack import TapStack

# Mock environment variables if needed
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')


class TestTapStack(unittest.TestCase):
  """Test case for the TapStack class."""

  def setUp(self):
    """Set up test fixtures before each test method."""
    # Clear any mocks before each test
    mock.patch.stopall()

    # Create CDK app and stack for testing
    self.app = cdk.App()
    self.stack = TapStack(self.app, "TestTapStack",
                          environment_suffix=environment_suffix)
    self.template = Template.from_stack(self.stack)

  def test_stack_creation(self):
    """Test that a TapStack instance is created correctly."""
    self.assertIsInstance(self.stack, TapStack)
    self.assertIsInstance(self.stack, cdk.Stack)

  def test_write_unit_tests(self):
    """
    Dummy test to Tapnstrate writing unit tests for CDK resources.

    This test shows how to:
    1. Check that resources are created with specific properties
    2. Verify count of resources of a specific type
    3. Assert on resource properties using matchers
    """

    self.fail("Write unit tests for your CDK resources here.")


if __name__ == '__main__':
  unittest.main()
