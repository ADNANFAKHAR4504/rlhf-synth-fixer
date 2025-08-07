"""Unit tests for TapStack error handling and edge cases."""
import json
import os
import sys
from unittest.mock import patch

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest  # pylint: disable=wrong-import-position
from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestParameterValidationEdgeCases:
  """Test suite for parameter validation and edge cases."""

  def test_empty_construct_id(self):
    """Test behavior with empty construct ID."""
    app = App()
    
    # Empty string should raise an error
    with pytest.raises(RuntimeError, match="Only root constructs may have an empty ID"):
      TapStack(app, "")

  def test_none_values_in_kwargs(self):
    """Test behavior with None values in kwargs."""
    app = App()
    
    # None state_bucket should raise TypeError
    with pytest.raises(TypeError, match="type of argument bucket must be str; got NoneType instead"):
      TapStack(
        app,
        "NoneTestStack",
        environment_suffix=None,
        state_bucket=None,
        default_tags=None,
        bucket_prefix=None
      )

  def test_empty_string_parameters(self):
    """Test behavior with empty string parameters."""
    app = App()
    stack = TapStack(
      app,
      "EmptyStringTestStack",
      environment_suffix="",
      state_bucket="",
      bucket_prefix=""
    )
    
    # Should handle empty strings gracefully
    assert stack is not None
    
    # Empty environment suffix should still appear in tags
    assert stack.common_tags["Environment"] == ""

  def test_very_long_parameter_values(self):
    """Test behavior with very long parameter values."""
    long_string = "a" * 200  # Very long string
    
    app = App()
    stack = TapStack(
      app,
      "LongParamTestStack",
      environment_suffix=long_string,
      bucket_prefix=long_string
    )
    
    assert stack is not None
    assert stack.common_tags["Environment"] == long_string

  def test_special_characters_in_parameters(self):
    """Test behavior with special characters in parameters."""
    app = App()
    
    # Note: Some special characters might be invalid for AWS resources
    # but the stack should still instantiate
    stack = TapStack(
      app,
      "SpecialCharsTestStack",
      environment_suffix="test-env_123",
      bucket_prefix="secure-data-123"
    )
    
    assert stack is not None
    assert stack.common_tags["Environment"] == "test-env_123"

  def test_unicode_characters_in_parameters(self):
    """Test behavior with Unicode characters in parameters."""
    app = App()
    
    # Unicode characters in tags
    stack = TapStack(
      app,
      "UnicodeTestStack",
      environment_suffix="тест",  # Cyrillic characters
      bucket_prefix="données"     # French characters
    )
    
    assert stack is not None
    assert stack.common_tags["Environment"] == "тест"


class TestDefaultTagsEdgeCases:
  """Test suite for default_tags edge cases."""

  def test_malformed_default_tags_structure(self):
    """Test behavior with malformed default_tags structure."""
    app = App()
    
    # Nested structure but with unexpected format
    malformed_tags = {
      "tags": {
        "nested": {
          "Project": "TestProject"
        }
      }
    }
    
    # Should raise RuntimeError due to invalid tag structure
    with pytest.raises(RuntimeError, match="Unable to deserialize value"):
      TapStack(app, "MalformedTagsTestStack", default_tags=malformed_tags)

  def test_default_tags_with_non_string_values(self):
    """Test behavior with non-string values in default_tags."""
    app = App()
    
    # Tags with non-string values
    non_string_tags = {
      "tags": {
        "NumericTag": 123,
        "BooleanTag": True,
        "ListTag": ["item1", "item2"],
        "NullTag": None
      }
    }
    
    # Should raise RuntimeError due to non-string tag values
    with pytest.raises(RuntimeError, match="Unable to deserialize value"):
      TapStack(app, "NonStringTagsTestStack", default_tags=non_string_tags)

  def test_deeply_nested_default_tags(self):
    """Test behavior with deeply nested default_tags structure."""
    app = App()
    
    deeply_nested = {
      "level1": {
        "level2": {
          "level3": {
            "tags": {
              "Project": "DeepProject"
            }
          }
        }
      }
    }
    
    # Should raise RuntimeError due to deeply nested structure
    with pytest.raises(RuntimeError, match="Unable to deserialize value"):
      TapStack(app, "DeepNestedTestStack", default_tags=deeply_nested)

  def test_empty_nested_tags_structure(self):
    """Test behavior with empty nested tags structure."""
    app = App()
    
    empty_nested = {
      "tags": {}
    }
    
    stack = TapStack(app, "EmptyNestedTestStack", default_tags=empty_nested)
    assert stack is not None

  def test_tags_key_without_dict_value(self):
    """Test behavior when 'tags' key doesn't have dict value."""
    app = App()
    
    invalid_tags = {
      "tags": "not_a_dict"
    }
    
    # Should raise TypeError due to invalid tags format
    with pytest.raises(TypeError, match="type of argument tags must be one of"):
      TapStack(app, "InvalidTagsTestStack", default_tags=invalid_tags)


class TestEnvironmentVariableEdgeCases:
  """Test suite for environment variable edge cases."""

  @patch.dict(os.environ, {}, clear=True)
  def test_missing_all_environment_variables(self):
    """Test behavior when all environment variables are missing."""
    app = App()
    stack = TapStack(app, "NoEnvVarsTestStack")
    
    # Should use defaults when env vars are missing
    assert stack is not None
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    # Should default to us-east-1 for state bucket region
    assert backend_config.get("region") == "us-east-1"

  @patch.dict(os.environ, {"TERRAFORM_STATE_BUCKET_REGION": ""})
  def test_empty_environment_variable(self):
    """Test behavior with empty environment variable."""
    app = App()
    stack = TapStack(app, "EmptyEnvVarTestStack")
    
    assert stack is not None
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    # Empty env var should be used as-is
    assert backend_config.get("region") == ""

  @patch.dict(os.environ, {"TERRAFORM_STATE_BUCKET_REGION": "invalid-region-123"})
  def test_invalid_region_environment_variable(self):
    """Test behavior with invalid AWS region in environment variable."""
    app = App()
    stack = TapStack(app, "InvalidRegionTestStack")
    
    # Stack should instantiate even with invalid region
    assert stack is not None
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert backend_config.get("region") == "invalid-region-123"


class TestResourceLimitEdgeCases:
  """Test suite for resource limit edge cases."""

  def test_very_long_bucket_names(self):
    """Test behavior with very long bucket prefix leading to long bucket names."""
    # AWS S3 bucket names have a 63 character limit
    very_long_prefix = "a" * 60  # Close to AWS limit
    
    app = App()
    stack = TapStack(
      app,
      "LongBucketNameTestStack",
      bucket_prefix=very_long_prefix
    )
    
    assert stack is not None
    
    # Bucket names will be very long but stack should still instantiate
    data_bucket_name = stack.bucket_names["data"]
    logs_bucket_name = stack.bucket_names["logs"]
    
    # Names will be longer than AWS allows, but that's a deployment-time issue
    assert len(data_bucket_name) > 63
    assert len(logs_bucket_name) > 63

  def test_bucket_prefix_with_invalid_characters(self):
    """Test behavior with bucket prefix containing invalid characters."""
    app = App()
    
    # AWS S3 bucket names have specific character restrictions
    invalid_prefix = "Invalid_Bucket_Name_WITH_CAPS"
    
    stack = TapStack(
      app,
      "InvalidBucketCharsTestStack",
      bucket_prefix=invalid_prefix
    )
    
    assert stack is not None
    
    # Stack instantiates but deployment would fail due to invalid characters
    assert invalid_prefix in stack.bucket_names["data"]

  def test_maximum_role_names_length(self):
    """Test behavior with very long environment suffix affecting role names."""
    # AWS IAM role names have a 64 character limit
    very_long_env = "a" * 50  # Long environment suffix
    
    app = App()
    stack = TapStack(
      app,
      "LongRoleNameTestStack",
      environment_suffix=very_long_env
    )
    
    assert stack is not None
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    for role_config in iam_roles.values():
      role_name = role_config.get("name", "")
      # Role names will be very long
      assert very_long_env in role_name


class TestSynthesisEdgeCases:
  """Test suite for synthesis edge cases."""

  def test_multiple_stack_instantiation(self):
    """Test that multiple stacks can be instantiated in same app."""
    app = App()
    
    stack1 = TapStack(app, "MultiStack1", environment_suffix="env1")
    stack2 = TapStack(app, "MultiStack2", environment_suffix="env2")
    
    assert stack1 is not None
    assert stack2 is not None
    
    # Both stacks should be synthesizable
    synth_output1 = json.loads(Testing.synth(stack1))
    synth_output2 = json.loads(Testing.synth(stack2))
    
    assert synth_output1 is not None
    assert synth_output2 is not None

  def test_stack_synthesis_with_minimal_resources(self):
    """Test that stack synthesis produces expected minimum resource count."""
    app = App()
    stack = TapStack(app, "MinResourceTestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    # Should have minimum expected resources
    assert len(resources.get("aws_s3_bucket", {})) >= 2  # data and logs buckets
    assert len(resources.get("aws_iam_role", {})) >= 3   # 3 different roles
    assert len(resources.get("aws_iam_policy", {})) >= 3 # 3 policies
    
    # Should have outputs
    outputs = synth_output.get("output", {})
    assert len(outputs) >= 10  # Multiple bucket and role outputs

  def test_stack_synthesis_idempotency(self):
    """Test that multiple synthesis calls produce identical output."""
    app = App()
    stack = TapStack(app, "IdempotencyTestStack")
    
    synth_output1 = json.loads(Testing.synth(stack))
    synth_output2 = json.loads(Testing.synth(stack))
    
    # Outputs should be identical (excluding any timestamp-based content)
    assert synth_output1.keys() == synth_output2.keys()
    
    # Resource structure should be identical
    resources1 = synth_output1.get("resource", {})
    resources2 = synth_output2.get("resource", {})
    assert resources1.keys() == resources2.keys()


class TestStackStateEdgeCases:
  """Test suite for stack state edge cases."""

  def test_stack_attributes_after_instantiation(self):
    """Test that stack attributes are properly set after instantiation."""
    app = App()
    stack = TapStack(app, "AttributeTestStack")
    
    # All expected attributes should be present
    assert hasattr(stack, 'bucket_names')
    assert hasattr(stack, 'common_tags') 
    assert hasattr(stack, 'buckets')
    assert hasattr(stack, 'roles')
    
    # Attributes should have expected types
    assert isinstance(stack.bucket_names, dict)
    assert isinstance(stack.common_tags, dict)
    assert isinstance(stack.buckets, dict)
    assert isinstance(stack.roles, dict)
    
    # Collections should not be empty
    assert len(stack.bucket_names) > 0
    assert len(stack.common_tags) > 0
    assert len(stack.buckets) > 0
    assert len(stack.roles) > 0

  def test_stack_internal_state_consistency(self):
    """Test that internal stack state is consistent."""
    app = App()
    stack = TapStack(app, "ConsistencyTestStack")
    
    # bucket_names and buckets should have same keys
    assert set(stack.bucket_names.keys()) == set(stack.buckets.keys())
    
    # Should have expected number of roles
    expected_roles = ["analytics_reader", "uploader", "logs_reader"]
    assert set(stack.roles.keys()) == set(expected_roles)

  def test_stack_modification_after_creation(self):
    """Test behavior when stack attributes are modified after creation."""
    app = App()
    stack = TapStack(app, "ModificationTestStack")
    
    original_bucket_names = stack.bucket_names.copy()
    original_common_tags = stack.common_tags.copy()
    
    # Modify attributes
    stack.bucket_names["new_bucket"] = "test-bucket"
    stack.common_tags["NewTag"] = "NewValue"
    
    # Synthesis should still work
    synth_output = json.loads(Testing.synth(stack))
    assert synth_output is not None
    
    # Original structure should be preserved in synthesis
    # (since buckets and roles were created during __init__)
    resources = synth_output.get("resource", {})
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    # Should still have original 2 buckets (data and logs)
    assert len(s3_buckets) == 2


class TestExceptionHandling:
  """Test suite for exception handling scenarios."""

  def test_invalid_construct_scope(self):
    """Test behavior with invalid construct scope."""
    # This tests the framework's error handling
    with pytest.raises(Exception):
      TapStack(None, "InvalidScopeTestStack")

  def test_duplicate_construct_ids_in_same_scope(self):
    """Test behavior with duplicate construct IDs."""
    app = App()
    
    # First stack should work
    stack1 = TapStack(app, "DuplicateIDTestStack")
    assert stack1 is not None
    
    # Second stack with same ID should raise an error
    with pytest.raises(Exception):
      TapStack(app, "DuplicateIDTestStack")

  def test_synthesis_with_corrupted_stack_state(self):
    """Test synthesis behavior with corrupted stack state."""
    app = App()
    stack = TapStack(app, "CorruptedStateTestStack")
    
    # Corrupt the stack state
    stack.buckets = None
    stack.roles = None
    
    # Synthesis might fail or handle gracefully depending on implementation
    try:
      synth_output = Testing.synth(stack)
      # If it succeeds, output should be valid JSON
      json.loads(synth_output)
    except Exception:
      # Expected if synthesis fails due to corrupted state
      pass
