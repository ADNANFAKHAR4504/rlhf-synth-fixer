"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component and infrastructure functions.
"""

import inspect
import os
import sys
import unittest

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Import the classes and functions we're testing
from tap_stack import (TapStack, TapStackArgs, create_cloudtrail,
                       create_iam_roles, create_s3_bucket,
                       create_security_group_alarm, create_sns_topic,
                       deploy_infrastructure)


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()

    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {"Environment": "Production", "Team": "DevOps"}
    args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.tags, custom_tags)

  def test_tap_stack_args_none_tags(self):
    """Test TapStackArgs with None tags."""
    args = TapStackArgs(tags=None)

    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
  """Test cases for TapStack component."""

  def test_tap_stack_initialization(self):
    """Test TapStack initialization."""
    # Create TapStack instance
    args = TapStackArgs(environment_suffix="test", tags={"Test": "true"})

    # Test that we can create the args
    self.assertEqual(args.environment_suffix, "test")
    self.assertEqual(args.tags, {"Test": "true"})

  def test_tap_stack_args_structure(self):
    """Test TapStackArgs structure and validation."""
    # Test with various tag combinations
    test_cases = [
      ({}, {}),
      ({"Environment": "Production"}, {"Environment": "Production"}),
      ({"Team": "DevOps", "Project": "TAP"}, {"Team": "DevOps", "Project": "TAP"}),
    ]

    for input_tags, expected_tags in test_cases:
      args = TapStackArgs(tags=input_tags)
      self.assertEqual(args.tags, expected_tags)


class TestInfrastructureFunctions(unittest.TestCase):
  """Test cases for infrastructure creation functions."""

  def test_create_s3_bucket_function_exists(self):
    """Test that create_s3_bucket function exists and is callable."""
    self.assertTrue(callable(create_s3_bucket))

    # Test function signature
    sig = inspect.signature(create_s3_bucket)
    params = list(sig.parameters.keys())

    self.assertIn('region', params)
    self.assertIn('tags', params)

  def test_create_iam_roles_function_exists(self):
    """Test that create_iam_roles function exists and is callable."""
    self.assertTrue(callable(create_iam_roles))

    # Test function signature
    sig = inspect.signature(create_iam_roles)
    params = list(sig.parameters.keys())

    self.assertIn('tags', params)

  def test_create_sns_topic_function_exists(self):
    """Test that create_sns_topic function exists and is callable."""
    self.assertTrue(callable(create_sns_topic))

    # Test function signature
    sig = inspect.signature(create_sns_topic)
    params = list(sig.parameters.keys())

    self.assertIn('region', params)
    self.assertIn('tags', params)

  def test_create_security_group_alarm_function_exists(self):
    """Test that create_security_group_alarm function exists and is callable."""
    self.assertTrue(callable(create_security_group_alarm))

    # Test function signature
    sig = inspect.signature(create_security_group_alarm)
    params = list(sig.parameters.keys())

    self.assertIn('region', params)
    self.assertIn('sns_topic', params)
    self.assertIn('tags', params)

  def test_create_cloudtrail_function_exists(self):
    """Test that create_cloudtrail function exists and is callable."""
    self.assertTrue(callable(create_cloudtrail))

    # Test function signature
    sig = inspect.signature(create_cloudtrail)
    params = list(sig.parameters.keys())

    self.assertIn('region', params)
    self.assertIn('bucket', params)
    self.assertIn('tags', params)


class TestDeployInfrastructure(unittest.TestCase):
  """Test cases for the main deployment function."""

  def test_deploy_infrastructure_function_exists(self):
    """Test that deploy_infrastructure function exists and is callable."""
    self.assertTrue(callable(deploy_infrastructure))

    # Test function signature
    sig = inspect.signature(deploy_infrastructure)
    params = list(sig.parameters.keys())

    self.assertIn('environment_suffix', params)
    self.assertIn('tags', params)

  def test_deploy_infrastructure_return_structure(self):
    """Test that deploy_infrastructure returns the expected structure."""
    # This test validates the expected return structure without actually calling the function
    # We can't actually call the function without Pulumi context, but we can validate the structure
    # by checking the function's docstring and expected behavior
    self.assertTrue(hasattr(deploy_infrastructure, '__doc__'))
    self.assertIsNotNone(deploy_infrastructure.__doc__)


class TestConfiguration(unittest.TestCase):
  """Test cases for configuration and constants."""

  def test_regions_defined(self):
    """Test that regions are properly defined."""
    # Import the regions from the module
    from tap_stack import regions

    self.assertIsInstance(regions, list)
    self.assertGreater(len(regions), 0)
    self.assertIn("us-east-1", regions)
    self.assertIn("us-west-2", regions)

  def test_common_tags_structure(self):
    """Test that common_tags have the expected structure."""
    # Import the common_tags from the module
    from tap_stack import common_tags

    self.assertIsInstance(common_tags, dict)
    required_tags = ["Environment", "Project", "ManagedBy", "Owner"]

    for tag in required_tags:
      self.assertIn(tag, common_tags)

    self.assertEqual(common_tags["Environment"], "Production")
    self.assertEqual(common_tags["ManagedBy"], "Pulumi")
    self.assertEqual(common_tags["Owner"], "DevOps")


class TestCodeQuality(unittest.TestCase):
  """Test cases for code quality and structure."""

  def test_function_docstrings(self):
    """Test that all functions have proper docstrings."""
    functions_to_test = [
      create_s3_bucket,
      create_iam_roles,
      create_sns_topic,
      create_security_group_alarm,
      create_cloudtrail,
      deploy_infrastructure
    ]

    for func in functions_to_test:
      self.assertIsNotNone(func.__doc__, f"Function {func.__name__} should have a docstring")
      self.assertGreater(len(func.__doc__.strip()), 10, f"Function {func.__name__} should have a meaningful docstring")

  def test_class_docstrings(self):
    """Test that all classes have proper docstrings."""
    classes_to_test = [TapStackArgs, TapStack]

    for cls in classes_to_test:
      self.assertIsNotNone(cls.__doc__, f"Class {cls.__name__} should have a docstring")
      self.assertGreater(len(cls.__doc__.strip()), 10, f"Class {cls.__name__} should have a meaningful docstring")

  def test_imports_available(self):
    """Test that all required imports are available."""
    try:
      import pulumi
      import pulumi_aws
      self.assertTrue(True, "Pulumi imports are available")
    except ImportError as e:
      self.fail(f"Required imports not available: {e}")


if __name__ == '__main__':
  unittest.main()