"""
Edge case and error handling tests for TapStack.

These tests verify TapStack behavior in unusual or error conditions.
"""

import pytest
from cdktf import Testing

from lib.tap_stack import TapStack


class TestTapStackErrorHandling:
  """Test TapStack error handling and edge cases."""

  def test_stack_with_very_long_construct_id(self, mock_scope):
    """Test stack creation with very long construct ID."""
    # Arrange
    long_id = "a" * 100  # Very long construct ID
    
    # Act & Assert - Should not raise an exception
    stack = TapStack(mock_scope, long_id)
    assert stack is not None

  def test_stack_with_special_characters_in_id(self, mock_scope):
    """Test stack creation with special characters in construct ID."""
    # Arrange
    special_ids = ["test-stack", "test_stack", "test.stack"]
    
    for construct_id in special_ids:
      # Act & Assert
      stack = TapStack(mock_scope, construct_id)
      assert stack is not None

  def test_stack_with_unicode_environment_suffix(self, mock_scope):
    """Test stack with unicode characters in environment suffix."""
    # Act & Assert - Should handle unicode gracefully
    stack = TapStack(mock_scope, "test-stack", environment_suffix="test-üñíçødé")
    assert stack.config["environment_suffix"] == "test-üñíçødé"

  def test_stack_with_empty_strings(self, mock_scope):
    """Test stack with empty string parameters."""
    # Act
    stack = TapStack(
      mock_scope,
      "test-stack",
      environment_suffix="",
      aws_region=""
    )
    
    # Assert
    assert stack.config["environment_suffix"] == ""
    assert stack.config["aws_region"] == ""

  def test_stack_with_none_values(self, mock_scope):
    """Test stack behavior when None is passed for optional parameters."""
    # Act
    stack = TapStack(
      mock_scope,
      "test-stack",
      default_tags=None
    )
    
    # Assert
    assert stack is not None


class TestTapStackResourceValidation:
  """Test TapStack resource validation and configuration."""

  def test_stack_completes_resource_creation(self, mock_scope):
    """Test that all expected resources are created successfully."""
    # Act
    stack = TapStack(mock_scope, "test-stack")

    # Assert - Verify all major resources exist
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'internet_gateway')
    assert hasattr(stack, 'public_subnets')
    assert hasattr(stack, 'private_subnets')
    assert hasattr(stack, 'eip')
    assert hasattr(stack, 'nat_gateway')
    assert hasattr(stack, 'public_route_table')
    assert hasattr(stack, 'private_route_table')
    assert hasattr(stack, 'public_security_group')
    assert hasattr(stack, 'private_security_group')
    assert hasattr(stack, 'amazon_linux_ami')
    assert hasattr(stack, 'public_instance')
    assert hasattr(stack, 'private_instance')

  def test_configuration_property_access(self, mock_scope):
    """Test configuration access through property methods."""
    # Act
    stack = TapStack(mock_scope, "test-stack")

    # Assert - Test all configuration properties
    assert stack.vpc_cidr == "10.0.0.0/16"
    assert stack.aws_region == "us-east-1"
    assert stack.environment_suffix == "dev"
    assert len(stack.public_subnet_cidrs) == 2
    assert len(stack.private_subnet_cidrs) == 2
    assert stack.instance_type == "t3.micro"
    assert stack.allowed_ssh_cidr == "203.0.113.0/24"


class TestTapStackConfigurationValidation:
  """Test TapStack configuration validation."""

  def test_valid_aws_regions(self, mock_scope):
    """Test stack creation with various valid AWS regions."""
    valid_regions = [
      "us-east-1", "us-west-1", "us-west-2", "eu-west-1", 
      "eu-central-1", "ap-southeast-1", "ap-northeast-1"
    ]
    
    for region in valid_regions:
      # Act
      stack = TapStack(mock_scope, f"test-{region}", aws_region=region)
      
      # Assert
      assert stack.config["aws_region"] == region

  def test_environment_suffix_validation(self, mock_scope):
    """Test environment suffix validation."""
    valid_suffixes = ["dev", "test", "staging", "prod", "dev-123", "test_env"]
    
    for suffix in valid_suffixes:
      # Act
      stack = TapStack(mock_scope, f"test-{suffix}", environment_suffix=suffix)
      
      # Assert
      assert stack.config["environment_suffix"] == suffix

  def test_subnet_cidr_validation(self, mock_scope):
    """Test that subnet CIDR blocks are within VPC CIDR."""
    # Act
    stack = TapStack(mock_scope, "test-stack")
    
    # Assert
    vpc_cidr = stack.config["vpc_cidr"]
    public_cidrs = stack.config["public_subnet_cidrs"]
    private_cidrs = stack.config["private_subnet_cidrs"]
    
    # All subnet CIDRs should be within VPC CIDR (10.0.0.0/16)
    all_cidrs = public_cidrs + private_cidrs
    for cidr in all_cidrs:
      # Basic validation - all should start with 10.0
      assert cidr.startswith("10.0."), f"CIDR {cidr} not within VPC range"

  def test_ssh_cidr_configuration(self, mock_scope):
    """Test SSH CIDR configuration."""
    # Act
    stack = TapStack(mock_scope, "test-stack")
    
    # Assert
    assert stack.config["allowed_ssh_cidr"] == "203.0.113.0/24"


class TestTapStackMemoryAndPerformance:
  """Test TapStack memory usage and performance characteristics."""

  def test_multiple_stack_creation(self, mock_scope):
    """Test creating multiple stacks doesn't cause issues."""
    stacks = []
    
    # Act - Create multiple stacks
    for i in range(5):
      stack = TapStack(mock_scope, f"test-stack-{i}")
      stacks.append(stack)
    
    # Assert
    assert len(stacks) == 5
    for stack in stacks:
      assert stack is not None

  def test_stack_config_isolation(self, mock_scope):
    """Test that stack configurations are isolated from each other."""
    # Act
    stack1 = TapStack(mock_scope, "stack1", environment_suffix="env1")
    stack2 = TapStack(mock_scope, "stack2", environment_suffix="env2")
    
    # Assert
    assert stack1.config["environment_suffix"] == "env1"
    assert stack2.config["environment_suffix"] == "env2"
    
    # Modify one stack's config
    stack1.config["environment_suffix"] = "modified"
    
    # Verify the other stack is unaffected
    assert stack2.config["environment_suffix"] == "env2"


class TestTapStackResourceIdGeneration:
  """Test resource ID generation and naming patterns."""

  def test_stack_resource_creation(self, mock_scope):
    """Test that stack creates resources successfully."""
    # Act
    stack = TapStack(mock_scope, "test-stack", environment_suffix="dev")
    
    # Assert - Stack should be created with all resources
    assert stack is not None
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'public_security_group')
    assert hasattr(stack, 'private_security_group')

  def test_environment_suffix_configuration(self, mock_scope):
    """Test environment suffix is properly stored."""
    # Act
    stack = TapStack(mock_scope, "test-stack", environment_suffix="prod")
    
    # Assert
    assert stack.config["environment_suffix"] == "prod"


class TestTapStackDependencyHandling:
  """Test resource dependency handling."""

  def test_stack_dependency_creation(self, mock_scope):
    """Test that stack creates resources with proper dependencies."""
    # Act - Creating the stack should handle all dependencies internally
    stack = TapStack(mock_scope, "test-stack")

    # Assert - All dependent resources should be created
    assert stack is not None
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'internet_gateway')
    assert hasattr(stack, 'nat_gateway')
    assert hasattr(stack, 'eip')

  def test_configuration_consistency(self, mock_scope):
    """Test that configuration values are consistently applied."""
    # Act
    stack = TapStack(mock_scope, "test-stack")
    
    # Assert - Configuration should be accessible through properties
    assert stack.vpc_cidr == "10.0.0.0/16"
    assert stack.instance_type == "t3.micro"
    assert stack.allowed_ssh_cidr == "203.0.113.0/24"
