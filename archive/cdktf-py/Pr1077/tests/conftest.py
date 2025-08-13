"""Pytest configuration and fixtures for CDKTF tests."""
import os
import sys
import pytest
from cdktf import App

# Adjust path to import modules correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture
def app():
  """Create a CDKTF App instance for testing."""
  return App()


@pytest.fixture
def default_stack_props():
  """Default properties for stack testing."""
  return {
    "environment_suffix": "test",
    "aws_region": "us-east-1",
    "default_tags": {
      "tags": {
        "Environment": "Production",
        "Project": "TAP",
        "Owner": "DevOps"
      }
    }
  }


@pytest.fixture
def mock_env_vars():
  """Mock environment variables for testing."""
  return {
    "AWS_DEFAULT_REGION": "us-east-1",
    "ENVIRONMENT_SUFFIX": "test",
    "TERRAFORM_STATE_BUCKET": "test-state-bucket",
    "TERRAFORM_STATE_BUCKET_REGION": "us-east-1",
    "REPOSITORY": "iac-test-automations",
    "COMMIT_AUTHOR": "test-author"
  }
