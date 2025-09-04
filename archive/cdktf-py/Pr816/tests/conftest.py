"""
Pytest configuration and shared fixtures for CDKTF tests.
"""

import pytest
from typing import Dict, Any
from constructs import Construct
from cdktf import TerraformStack, Testing


@pytest.fixture
def mock_scope() -> Construct:
  """Create a mock construct scope for testing."""
  return Testing.app()


@pytest.fixture
def default_config() -> Dict[str, Any]:
  """Default configuration for TapStack testing."""
  return {
    "environment_suffix": "test",
    "aws_region": "us-east-1",
    "default_tags": {
      "tags": {
        "Environment": "Test",
        "Project": "tap-test",
        "ManagedBy": "CDKTF-Test"
      }
    }
  }


@pytest.fixture
def custom_config() -> Dict[str, Any]:
  """Custom configuration for testing edge cases."""
  return {
    "environment_suffix": "custom",
    "aws_region": "us-west-2",
    "default_tags": {
      "tags": {
        "Environment": "Custom",
        "Project": "tap-custom",
        "Team": "DevOps"
      }
    }
  }


@pytest.fixture
def minimal_config() -> Dict[str, Any]:
  """Minimal configuration for testing defaults."""
  return {}