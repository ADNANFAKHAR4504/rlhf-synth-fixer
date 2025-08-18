"""
Pytest configuration and shared fixtures for TAP infrastructure tests.
"""
import pytest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack

# Define a mock environment for consistent testing
MOCK_ENV = cdk.Environment(account="123456789012", region="us-east-1")

@pytest.fixture(scope="module")
def app():
  """Provides a CDK App instance for testing."""
  return cdk.App()

@pytest.fixture(scope="module")
def tap_stack(app):
  """
  Provides an instance of TapStack for testing.
  The environment_suffix is set to "dev" to match the likely stack configuration.
  """
  return TapStack(
    app, 
    "tap-infrastructure-dev",
    environment_suffix="dev",
    aws_region="us-east-1",
    state_bucket_region="us-east-1",
    state_bucket="iac-rlhf-tf-states",
    default_tags={
      'Environment': 'dev',
      'ManagedBy': 'terraform',
      'Project': 'tap-infrastructure'
    }
  )

@pytest.fixture(scope="module")
def template(tap_stack):
  """
  Provides the CloudFormation template synthesized from the stack.
  `skip_cyclical_dependencies_check` is used to prevent issues with complex stacks.
  """
  template = Template.from_stack(tap_stack, skip_cyclical_dependencies_check=True)
  return template
