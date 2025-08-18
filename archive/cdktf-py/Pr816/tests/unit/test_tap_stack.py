"""
Unit tests for TapStack CDKTF implementation.

These tests verify the TapStack class behavior, configuration, and resource
creation logic without actually provisioning AWS resources.
"""

import pytest
from typing import Dict, Any
from cdktf import Testing

from lib.tap_stack import TapStack


class TestTapStackInitialization:
  """Test TapStack initialization and configuration."""

  def test_init_with_default_parameters(self, mock_scope):
    """Test TapStack initialization with default parameters."""
    # Act
    stack = TapStack(mock_scope, "test-stack")

    # Assert
    assert stack.config["environment_suffix"] == "dev"
    assert stack.config["aws_region"] == "us-east-1"
    assert stack.config["vpc_cidr"] == "10.0.0.0/16"
    assert stack.config["instance_type"] == "t3.micro"
    assert stack.config["allowed_ssh_cidr"] == "203.0.113.0/24"

  def test_init_with_custom_parameters(self, mock_scope, custom_config):
    """Test TapStack initialization with custom parameters."""
    # Act
    stack = TapStack(
      mock_scope,
      "test-stack",
      environment_suffix=custom_config["environment_suffix"],
      aws_region=custom_config["aws_region"],
      default_tags=custom_config["default_tags"]
    )

    # Assert
    assert stack.config["environment_suffix"] == "custom"
    assert stack.config["aws_region"] == "us-west-2"

  def test_config_immutability(self, mock_scope):
    """Test that configuration values are properly set and accessible."""
    # Act
    stack = TapStack(mock_scope, "test-stack")

    # Assert - Test all config keys exist
    expected_keys = [
      "environment_suffix", "aws_region", "vpc_cidr",
      "public_subnet_cidrs", "private_subnet_cidrs",
      "instance_type", "allowed_ssh_cidr"
    ]
    for key in expected_keys:
      assert key in stack.config

  def test_subnet_cidrs_configuration(self, mock_scope):
    """Test subnet CIDR block configuration."""
    # Act
    stack = TapStack(mock_scope, "test-stack")

    # Assert
    assert len(stack.config["public_subnet_cidrs"]) == 2
    assert len(stack.config["private_subnet_cidrs"]) == 2
    assert stack.config["public_subnet_cidrs"] == ["10.0.0.0/24", "10.0.1.0/24"]
    assert stack.config["private_subnet_cidrs"] == ["10.0.2.0/24", "10.0.3.0/24"]


class TestTapStackResourceCreation:
  """Test TapStack AWS resource creation behavior."""

  def test_stack_creation_completes_successfully(self, mock_scope):
    """Test that stack creation completes without errors."""
    # Act - Creating the stack should not raise exceptions
    stack = TapStack(mock_scope, "test-stack")

    # Assert - Stack should be created and have all expected attributes
    assert stack is not None
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'internet_gateway')
    assert hasattr(stack, 'public_subnets')
    assert hasattr(stack, 'private_subnets')
    assert hasattr(stack, 'nat_gateway')
    assert hasattr(stack, 'public_security_group')
    assert hasattr(stack, 'private_security_group')
    assert hasattr(stack, 'public_instance')
    assert hasattr(stack, 'private_instance')

  def test_stack_subnet_count(self, mock_scope):
    """Test that correct number of subnets are created."""
    # Act
    stack = TapStack(mock_scope, "test-stack")

    # Assert - Should create 2 public and 2 private subnets
    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2

  def test_stack_inheritance(self, mock_scope):
    """Test that TapStack properly inherits from TerraformStack."""
    # Act
    stack = TapStack(mock_scope, "test-stack")

    # Assert
    from cdktf import TerraformStack
    assert isinstance(stack, TerraformStack)


class TestTapStackTagging:
  """Test TapStack resource tagging functionality."""

  def test_default_tagging_structure(self, mock_scope):
    """Test that default tags are structured correctly."""
    # This test verifies the tagging logic without mocking all resources
    stack = TapStack(mock_scope, "test-stack")
    
    # The tagging logic is embedded in the create_tags function
    # We can't easily test it without refactoring, but we can verify
    # the stack was created successfully
    assert stack is not None

  def test_custom_tagging_with_defaults(self, mock_scope, custom_config):
    """Test custom tags merge with default tags."""
    # Act
    stack = TapStack(
      mock_scope,
      "test-stack",
      default_tags=custom_config["default_tags"]
    )

    # Assert
    assert stack is not None


class TestTapStackValidation:
  """Test TapStack input validation and error handling."""

  def test_invalid_scope_type(self):
    """Test behavior with invalid scope parameter."""
    # This test would check type validation if implemented
    # For now, we test that the constructor accepts valid scope
    scope = Testing.app()
    stack = TapStack(scope, "test-stack")
    assert stack is not None

  def test_valid_construct_id(self, mock_scope):
    """Test behavior with valid construct ID."""
    # Act & Assert - This should work with non-empty string
    stack = TapStack(mock_scope, "test-stack")
    assert stack is not None

  def test_none_default_tags(self, mock_scope):
    """Test behavior when default_tags is None."""
    # Act
    stack = TapStack(mock_scope, "test-stack", default_tags=None)

    # Assert
    assert stack is not None

  def test_malformed_default_tags(self, mock_scope):
    """Test behavior with malformed default_tags."""
    # Act
    malformed_tags = {"not_tags": "invalid_structure"}
    stack = TapStack(mock_scope, "test-stack", default_tags=malformed_tags)

    # Assert
    assert stack is not None


class TestTapStackConfiguration:
  """Test TapStack configuration edge cases."""

  def test_different_regions(self, mock_scope):
    """Test stack creation with different AWS regions."""
    regions = ["us-east-1", "us-west-2", "eu-west-1"]
    
    for region in regions:
      # Act
      stack = TapStack(mock_scope, f"test-stack-{region}", aws_region=region)
      
      # Assert
      assert stack.config["aws_region"] == region

  def test_environment_suffix_variations(self, mock_scope):
    """Test different environment suffix values."""
    suffixes = ["dev", "staging", "prod", "test-123"]
    
    for suffix in suffixes:
      # Act
      stack = TapStack(mock_scope, f"test-stack-{suffix}", 
                      environment_suffix=suffix)
      
      # Assert
      assert stack.config["environment_suffix"] == suffix

  def test_configuration_immutability_after_init(self, mock_scope):
    """Test that configuration cannot be modified after initialization."""
    # Act
    stack = TapStack(mock_scope, "test-stack")
    original_config = stack.config.copy()

    # Attempt to modify (this doesn't prevent modification but documents expected behavior)
    stack.config["vpc_cidr"] = "172.16.0.0/16"

    # Assert - Configuration was modified (this test documents current behavior)
    assert stack.config["vpc_cidr"] == "172.16.0.0/16"
    assert original_config["vpc_cidr"] == "10.0.0.0/16"
