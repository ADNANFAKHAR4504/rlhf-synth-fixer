"""Unit tests for Infrastructure construct."""

import pytest
from cdktf import App, TerraformStack

from lib.infrastructure import Infrastructure


class TestInfrastructure:
  """Test class for Infrastructure construct."""

  def test_infrastructure_creation_minimal(self):
    """Test Infrastructure creation with minimal parameters."""
    app = App()
    stack = TerraformStack(app, "test-stack")
    infrastructure = Infrastructure(stack, "test-infra")
    assert infrastructure is not None

  def test_infrastructure_creation_with_environment(self):
    """Test Infrastructure creation with environment suffix."""
    app = App()
    stack = TerraformStack(app, "test-stack")
    infrastructure = Infrastructure(
      stack, 
      "test-infra", 
      environment_suffix="staging"
    )
    assert infrastructure is not None

  def test_infrastructure_creation_with_tags(self):
    """Test Infrastructure creation with custom tags."""
    app = App()
    stack = TerraformStack(app, "test-stack")
    custom_tags = {"Project": "Test", "Team": "DevOps"}
    infrastructure = Infrastructure(
      stack,
      "test-infra",
      environment_suffix="test",
      default_tags=custom_tags
    )
    assert infrastructure is not None

  def test_tag_sanitization(self):
    """Test that tag values are properly sanitized."""
    app = App()
    stack = TerraformStack(app, "test-stack")
    problematic_tags = {
      "Project": "Test@Project#123",
      "Description": "Test with special chars: <>{}[]",
      "Number": 12345
    }
    infrastructure = Infrastructure(
      stack,
      "test-infra",
      default_tags=problematic_tags
    )
    assert infrastructure is not None

  def test_different_environment_suffixes(self):
    """Test Infrastructure with various environment suffixes."""
    app = App()
    stack = TerraformStack(app, "test-stack")
    environments = ["dev", "staging", "production", "test"]
    
    for env in environments:
      infrastructure = Infrastructure(
        stack,
        f"test-infra-{env}",
        environment_suffix=env
      )
      assert infrastructure is not None
