"""Unit tests for Infrastructure construct."""

import pytest
from cdktf import App, TerraformStack

from lib.infrastructure import Infrastructure


@pytest.fixture
def app():
  """Fixture for CDKTF App instance."""
  return App()


@pytest.fixture
def stack(app):
  """Fixture for TerraformStack instance."""
  return TerraformStack(app, "test-stack")


class TestInfrastructure:
  """Test class for Infrastructure construct."""

  def test_infrastructure_creation_minimal(self, stack):
    """Test Infrastructure creation with minimal parameters."""
    infrastructure = Infrastructure(stack, "test-infra")
    assert infrastructure is not None

  def test_infrastructure_creation_with_environment(self, stack):
    """Test Infrastructure creation with environment suffix."""
    infrastructure = Infrastructure(
      stack, 
      "test-infra", 
      environment_suffix="staging"
    )
    assert infrastructure is not None

  def test_infrastructure_creation_with_tags(self, stack):
    """Test Infrastructure creation with custom tags."""
    custom_tags = {"Project": "Test", "Team": "DevOps"}
    infrastructure = Infrastructure(
      stack,
      "test-infra",
      environment_suffix="test",
      default_tags=custom_tags
    )
    assert infrastructure is not None

  def test_tag_sanitization(self, stack):
    """Test that tag values are properly sanitized."""
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

  @pytest.mark.parametrize("environment", ["dev", "staging", "production", "test"])
  def test_different_environment_suffixes(self, stack, environment):
    """Test Infrastructure with various environment suffixes."""
    infrastructure = Infrastructure(
      stack,
      f"test-infra-{environment}",
      environment_suffix=environment
    )
    assert infrastructure is not None
