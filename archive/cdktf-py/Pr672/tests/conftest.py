"""Pytest configuration and fixtures for CDKTF tests."""
import os
import json
import pytest
import boto3
from cdktf import App
from botocore.exceptions import NoCredentialsError

from lib.tap_stack import TapStack


@pytest.fixture(scope="session")
def aws_region():
  """Get AWS region from environment or default."""
  return os.getenv('AWS_REGION', 'us-west-2')


@pytest.fixture(scope="session")
def environment_suffix():
  """Get environment suffix from environment or default."""
  return os.getenv('ENVIRONMENT_SUFFIX', 'test')


@pytest.fixture(scope="session")
def aws_credentials():
  """Verify AWS credentials are available."""
  try:
    sts = boto3.client('sts')
    sts.get_caller_identity()
    return True
  except NoCredentialsError:
    pytest.skip("AWS credentials not configured")
  except Exception as e:
    pytest.skip(f"AWS credential check failed: {str(e)}")


@pytest.fixture
def cdktf_app():
  """Create a fresh CDKTF App instance for testing."""
  return App()


@pytest.fixture
def test_stack(cdktf_app, environment_suffix, aws_region):
  """Create a test TapStack instance."""
  return TapStack(
    cdktf_app,
    f"test-stack-{environment_suffix}",
    environment_suffix=environment_suffix,
    aws_region=aws_region,
    default_tags={
      "Environment": environment_suffix,
      "Owner": "test-automation",
      "Project": "TAP Test Infrastructure"
    }
  )


@pytest.fixture(scope="session")
def aws_clients(aws_region):
  """Create AWS client instances for testing."""
  return {
    'ec2': boto3.client('ec2', region_name=aws_region),
    's3': boto3.client('s3', region_name=aws_region),
    'rds': boto3.client('rds', region_name=aws_region),
    'iam': boto3.client('iam', region_name=aws_region),
    'secretsmanager': boto3.client('secretsmanager', region_name=aws_region),
    'cloudtrail': boto3.client('cloudtrail', region_name=aws_region),
    'logs': boto3.client('logs', region_name=aws_region),
    'sts': boto3.client('sts', region_name=aws_region)
  }


@pytest.fixture(scope="session")
def stack_outputs(environment_suffix):
  """Load stack outputs from various possible sources."""
  outputs = {}
  
  # Try to load from environment variables
  vpc_id = os.getenv('VPC_ID')
  if vpc_id:
    outputs['vpc_id'] = vpc_id
  
  # Try to load from JSON files
  possible_files = [
    'terraform.tfstate',
    'outputs.json',
    'cfn-outputs/flat-outputs.json'
  ]
  
  for file_path in possible_files:
    if os.path.exists(file_path):
      try:
        with open(file_path, 'r') as f:
          data = json.load(f)
          # Extract outputs based on file structure
          if 'outputs' in data:
            outputs.update(data['outputs'])
          elif environment_suffix in data:
            outputs.update(data[environment_suffix])
          else:
            outputs.update(data)
        break
      except (json.JSONDecodeError, KeyError):
        continue
  
  return outputs


def pytest_configure(config):
  """Configure pytest with custom markers."""
  config.addinivalue_line("markers", "unit: mark test as unit test")
  config.addinivalue_line("markers", "integration: mark test as integration test requiring AWS")
  config.addinivalue_line("markers", "slow: mark test as slow-running")
  config.addinivalue_line("markers", "e2e: mark test as end-to-end test")


def pytest_collection_modifyitems(config, items):
  """Automatically mark tests based on their location."""
  for item in items:
    # Mark tests in integration directory as integration tests
    if "integration" in str(item.fspath):
      item.add_marker(pytest.mark.integration)
      item.add_marker(pytest.mark.slow)
    
    # Mark tests in unit directory as unit tests
    elif "unit" in str(item.fspath):
      item.add_marker(pytest.mark.unit)


def pytest_runtest_setup(item):
  """Setup for individual test runs."""
  # Skip integration tests if AWS credentials are not available
  if item.get_closest_marker("integration"):
    try:
      boto3.client('sts').get_caller_identity()
    except Exception:
      pytest.skip("AWS credentials required for integration tests")
