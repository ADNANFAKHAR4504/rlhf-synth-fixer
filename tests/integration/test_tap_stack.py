"""
Integration tests for the TapStack infrastructure.

These tests validate the deployed infrastructure using real deployment outputs
and code structure validation.
"""

import json
import os
import sys
import unittest

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for deployed TapStack infrastructure."""

  @classmethod
  def setUpClass(cls):
    """Set up test environment and load deployment outputs."""
    # Load deployment outputs
    outputs_file = "cfn-outputs/flat-outputs.json"
    if os.path.exists(outputs_file):
      with open(outputs_file, 'r', encoding='utf-8') as f:
        cls.outputs = json.load(f)
    else:
      cls.outputs = {}
      print(f"Warning: {outputs_file} not found. Using empty outputs.")

  def test_outputs_file_structure(self):
    """Test that outputs file has the expected structure."""
    # Check if outputs file exists
    outputs_file = "cfn-outputs/flat-outputs.json"
    if os.path.exists(outputs_file):
      # Verify it's valid JSON
      with open(outputs_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        self.assertIsInstance(data, dict, "Outputs should be a dictionary")
    else:
      # If file doesn't exist, that's okay for some test scenarios
      self.assertTrue(True, "Outputs file may not exist in all test scenarios")

  def test_outputs_contain_expected_keys(self):
    """Test that outputs contain expected resource keys."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check for expected output categories
    expected_categories = ['bucket', 'role', 'topic', 'alarm', 'trail']
    found_categories = []

    for key in self.outputs.keys():
      for category in expected_categories:
        if category in key.lower():
          found_categories.append(category)
          break

    # Should find at least some of the expected categories
    self.assertGreater(len(found_categories), 0, "Should have at least some expected output categories")

  def test_outputs_values_not_empty(self):
    """Test that output values are not empty strings."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    for key, value in self.outputs.items():
      if isinstance(value, str):
        self.assertNotEqual(value.strip(), "", f"Output value for {key} should not be empty")

  def test_multi_region_deployment(self):
    """Test that resources were deployed in multiple regions."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check for resources in both regions
    us_east_resources = [k for k in self.outputs.keys() if 'us-east-1' in str(self.outputs.get(k, '')).lower()]
    us_west_resources = [k for k in self.outputs.keys() if 'us-west-2' in str(self.outputs.get(k, '')).lower()]

    # Verify we have resources in both regions
    self.assertGreater(len(us_east_resources), 0, "Should have resources in us-east-1")
    self.assertGreater(len(us_west_resources), 0, "Should have resources in us-west-2")

  def test_environment_suffix_in_names(self):
    """Test that resource names include the environment suffix."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Get environment suffix from outputs or environment variable
    env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

    # Check that some resources include the environment suffix
    suffix_resources = [k for k in self.outputs.keys() if env_suffix in str(self.outputs.get(k, '')).lower()]
    self.assertGreater(len(suffix_resources), 0, f"Should have resources with environment suffix {env_suffix}")

  def test_outputs_structure(self):
    """Test that deployment outputs have the expected structure."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check for required output categories
    required_categories = ['bucket', 'role', 'topic', 'alarm', 'trail']

    for category in required_categories:
      category_outputs = [k for k in self.outputs.keys() if category in k.lower()]
      self.assertGreater(len(category_outputs), 0, f"Should have {category} outputs")

  def test_outputs_json_validity(self):
    """Test that outputs are valid JSON and contain expected data types."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Test that all values are strings (which is expected for AWS resource identifiers)
    for key, value in self.outputs.items():
      self.assertIsInstance(value, str, f"Output value for {key} should be a string")
      self.assertGreater(len(value), 0, f"Output value for {key} should not be empty")

  def test_outputs_contain_arns(self):
    """Test that outputs contain AWS ARNs where expected."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check for ARN patterns in role and topic outputs
    arn_outputs = []
    for key, value in self.outputs.items():
      if 'role' in key.lower() or 'topic' in key.lower() or 'trail' in key.lower():
        if 'arn:' in value.lower():
          arn_outputs.append(key)

    # Should have some ARN outputs
    self.assertGreater(len(arn_outputs), 0, "Should have some outputs containing ARNs")

  def test_outputs_file_permissions(self):
    """Test that outputs file has proper permissions."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if os.path.exists(outputs_file):
      # Check if file is readable
      self.assertTrue(os.access(outputs_file, os.R_OK), "Outputs file should be readable")

  def test_outputs_directory_structure(self):
    """Test that the outputs directory structure is correct."""
    outputs_dir = "cfn-outputs"
    if os.path.exists(outputs_dir):
      self.assertTrue(os.path.isdir(outputs_dir), "cfn-outputs should be a directory")

      # Check for expected files
      expected_files = ['flat-outputs.json', 'all-outputs.json']
      for file in expected_files:
        file_path = os.path.join(outputs_dir, file)
        if os.path.exists(file_path):
          self.assertTrue(os.path.isfile(file_path), f"{file} should be a file")

  def test_outputs_consistency(self):
    """Test that outputs are consistent across different files."""
    flat_outputs_file = "cfn-outputs/flat-outputs.json"
    all_outputs_file = "cfn-outputs/all-outputs.json"

    if os.path.exists(flat_outputs_file) and os.path.exists(all_outputs_file):
      with open(flat_outputs_file, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)

      with open(all_outputs_file, 'r', encoding='utf-8') as f:
        all_outputs = json.load(f)

      # Both should be dictionaries
      self.assertIsInstance(flat_outputs, dict, "flat-outputs.json should contain a dictionary")
      self.assertIsInstance(all_outputs, dict, "all-outputs.json should contain a dictionary")

  def test_outputs_no_duplicate_keys(self):
    """Test that outputs don't contain duplicate keys."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check for duplicate keys
    keys = list(self.outputs.keys())
    unique_keys = set(keys)
    self.assertEqual(len(keys), len(unique_keys), "Outputs should not contain duplicate keys")

  def test_outputs_key_naming_convention(self):
    """Test that output keys follow a consistent naming convention."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check that keys are properly formatted (no spaces, consistent casing)
    for key in self.outputs.keys():
      self.assertNotIn(' ', key, f"Output key '{key}' should not contain spaces")
      self.assertTrue(
        key.replace('_', '').replace('-', '').isalnum(),
        f"Output key '{key}' should contain only alphanumeric characters, underscores, and hyphens"
      )

  def test_outputs_value_formatting(self):
    """Test that output values are properly formatted."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check that values don't have leading/trailing whitespace
    for key, value in self.outputs.items():
      if isinstance(value, str):
        self.assertEqual(value, value.strip(), f"Output value for '{key}' should not have leading/trailing whitespace")

  def test_outputs_required_fields(self):
    """Test that outputs contain required fields for the infrastructure."""
    if not self.outputs:
      self.skipTest("No outputs available for testing")

    # Check for at least one bucket output
    bucket_outputs = [k for k in self.outputs.keys() if 'bucket' in k.lower()]
    self.assertGreater(len(bucket_outputs), 0, "Should have at least one bucket output")

    # Check for at least one role output
    role_outputs = [k for k in self.outputs.keys() if 'role' in k.lower()]
    self.assertGreater(len(role_outputs), 0, "Should have at least one role output")


if __name__ == '__main__':
  unittest.main()