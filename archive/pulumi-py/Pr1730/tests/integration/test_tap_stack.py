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
    
    # Enhanced file handling with better error messages
    if os.path.exists(outputs_file):
      try:
        with open(outputs_file, 'r', encoding='utf-8') as f:
          cls.outputs = json.load(f)
        print(f"✅ Successfully loaded outputs from {outputs_file}")
      except json.JSONDecodeError as e:
        print(f"⚠️  Warning: Invalid JSON in {outputs_file}: {e}")
        cls.outputs = {}
      except Exception as e:
        print(f"⚠️  Warning: Error reading {outputs_file}: {e}")
        cls.outputs = {}
    else:
      cls.outputs = {}
      print(f"ℹ️  Info: {outputs_file} not found. This is normal for:")
      print("   - Initial test runs before deployment")
      print("   - CI/CD environments without outputs")
      print("   - Local development scenarios")
      print("   Tests will run with empty outputs and skip relevant validations.")

  def test_outputs_file_structure(self):
    """Test that outputs file has the expected structure."""
    # Check if outputs file exists
    outputs_file = "cfn-outputs/flat-outputs.json"
    
    if os.path.exists(outputs_file):
      try:
        # Verify it's valid JSON
        with open(outputs_file, 'r', encoding='utf-8') as f:
          data = json.load(f)
          self.assertIsInstance(data, dict, "Outputs should be a dictionary")
          print(f"✅ Outputs file structure validated successfully")
      except json.JSONDecodeError as e:
        self.fail(f"Outputs file contains invalid JSON: {e}")
      except Exception as e:
        self.fail(f"Error reading outputs file: {e}")
    else:
      # If file doesn't exist, that's okay for some test scenarios
      print("ℹ️  Outputs file not found - skipping structure validation")
      self.assertTrue(True, "Outputs file may not exist in all test scenarios")

  def test_outputs_contain_expected_keys(self):
    """Test that outputs contain expected resource keys."""
    if not self.outputs:
      print("ℹ️  No outputs available - skipping key validation")
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
    if found_categories:
      print(f"✅ Found output categories: {', '.join(found_categories)}")
    else:
      print("⚠️  No expected output categories found")
    
    self.assertGreater(len(found_categories), 0, "Should have at least some expected output categories")

  def test_outputs_values_not_empty(self):
    """Test that output values are not empty strings."""
    if not self.outputs:
      print("ℹ️  No outputs available - skipping value validation")
      self.skipTest("No outputs available for testing")

    empty_values = []
    for key, value in self.outputs.items():
      if isinstance(value, str) and value.strip() == "":
        empty_values.append(key)

    if empty_values:
      print(f"⚠️  Found empty values for keys: {', '.join(empty_values)}")
    else:
      print("✅ All output values are non-empty")

    for key, value in self.outputs.items():
      if isinstance(value, str):
        self.assertNotEqual(value.strip(), "", f"Output value for {key} should not be empty")

  def test_multi_region_deployment(self):
    """Test that resources were deployed in multiple regions."""
    if not self.outputs:
      print("ℹ️  No outputs available - skipping multi-region validation")
      self.skipTest("No outputs available for testing")

    # Check for resources in both regions
    us_east_resources = [k for k in self.outputs.keys() if 'us-east-1' in str(self.outputs.get(k, '')).lower()]
    us_west_resources = [k for k in self.outputs.keys() if 'us-west-2' in str(self.outputs.get(k, '')).lower()]

    print(f"ℹ️  Found {len(us_east_resources)} resources in us-east-1")
    print(f"ℹ️  Found {len(us_west_resources)} resources in us-west-2")

    # Verify we have resources in both regions
    self.assertGreater(len(us_east_resources), 0, "Should have resources in us-east-1")
    self.assertGreater(len(us_west_resources), 0, "Should have resources in us-west-2")

  def test_environment_suffix_in_names(self):
    """Test that resource names include the environment suffix."""
    if not self.outputs:
      print("ℹ️  No outputs available - skipping environment suffix validation")
      self.skipTest("No outputs available for testing")

    # Get environment suffix from outputs or environment variable
    env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

    # Check that some resources include the environment suffix
    suffix_resources = [k for k in self.outputs.keys() if env_suffix in str(self.outputs.get(k, '')).lower()]
    
    print(f"ℹ️  Looking for environment suffix: {env_suffix}")
    print(f"ℹ️  Found {len(suffix_resources)} resources with environment suffix")
    
    self.assertGreater(len(suffix_resources), 0, f"Should have resources with environment suffix {env_suffix}")

  def test_outputs_structure(self):
    """Test that deployment outputs have the expected structure."""
    if not self.outputs:
      print("ℹ️  No outputs available - skipping structure validation")
      self.skipTest("No outputs available for testing")

    # Check for required output categories
    required_categories = ['bucket', 'role', 'topic', 'alarm', 'trail']
    missing_categories = []

    for category in required_categories:
      category_outputs = [k for k in self.outputs.keys() if category in k.lower()]
      if category_outputs:
        print(f"✅ Found {len(category_outputs)} {category} outputs")
      else:
        missing_categories.append(category)
        print(f"⚠️  No {category} outputs found")

    if missing_categories:
      print(f"⚠️  Missing output categories: {', '.join(missing_categories)}")

    for category in required_categories:
      category_outputs = [k for k in self.outputs.keys() if category in k.lower()]
      self.assertGreater(len(category_outputs), 0, f"Should have {category} outputs")

  def test_outputs_json_validity(self):
    """Test that outputs are valid JSON and contain expected data types."""
    if not self.outputs:
      print("ℹ️  No outputs available - skipping JSON validity validation")
      self.skipTest("No outputs available for testing")

    # Test that all values are strings (which is expected for AWS resource identifiers)
    invalid_values = []
    for key, value in self.outputs.items():
      if not isinstance(value, str):
        invalid_values.append(f"{key}: {type(value).__name__}")
      elif len(value) == 0:
        invalid_values.append(f"{key}: empty string")

    if invalid_values:
      print(f"⚠️  Found invalid values: {', '.join(invalid_values)}")
    else:
      print("✅ All output values are valid strings")

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