"""Pytest configuration and fixtures for CDKTF tests."""
import pytest
import os
import json
import boto3
from typing import Dict, Any, Optional


@pytest.fixture(scope="session")
def aws_region():
  """Get AWS region from environment or default."""
  return os.environ.get("AWS_REGION", "us-east-1")


@pytest.fixture(scope="session") 
def aws_credentials():
  """Check if AWS credentials are available."""
  try:
    # Try to get caller identity to verify credentials work
    sts = boto3.client("sts")
    sts.get_caller_identity()
    return True
  except Exception:
    return False


@pytest.fixture(scope="session")
def stack_outputs() -> Optional[Dict[str, Any]]:
  """Load stack outputs from various possible locations."""
  # Try multiple possible output locations
  possible_locations = [
      "/home/runner/work/iac-test-automations/iac-test-automations/cfn-outputs/flat-outputs.json",
      "./cfn-outputs/flat-outputs.json",
      "cfn-outputs/flat-outputs.json"
  ]
  
  for location in possible_locations:
    if os.path.exists(location):
      try:
        with open(location, 'r') as f:
          return json.load(f)
      except (json.JSONDecodeError, IOError):
        continue
  
  # Try environment variables as fallback
  outputs = {}
  env_mappings = {
      "API_GATEWAY_URL": "api_gateway_url",
      "LAMBDA_FUNCTION_NAME": "lambda_function_name", 
      "SECRETS_MANAGER_SECRET_NAME": "secrets_manager_secret_name",
      "API_ACCESS_ROLE_ARN": "api_access_role_arn",
      "LAMBDA_LOG_GROUP_NAME": "lambda_log_group_name"
  }
  
  for env_var, output_key in env_mappings.items():
    if env_var in os.environ:
      outputs[output_key] = os.environ[env_var]
  
  return outputs if outputs else None


@pytest.fixture(scope="session")
def skip_if_no_aws_creds(aws_credentials):
  """Skip test if no AWS credentials available."""
  if not aws_credentials:
    pytest.skip("AWS credentials not available")


@pytest.fixture(scope="session")
def skip_if_no_stack_outputs(stack_outputs):
  """Skip test if no stack outputs available."""
  if not stack_outputs:
    pytest.skip("Stack outputs not available - infrastructure not deployed")
