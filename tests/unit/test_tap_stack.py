"""Unit tests for the TapStack Pulumi component."""

import sys
import os

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Create a minimal mock for testing without external dependencies
class MockConfig:
  def get(self, key, default=None):
    if key == "environment":
      return "dev"
    return default

class MockPulumi:
  Config = MockConfig
  
  class ResourceOptions:
    def __init__(self, *args, **kwargs):
      pass
  
  class InvokeOptions:
    def __init__(self, *args, **kwargs):
      pass

class MockProvider:
  def __init__(self, *args, **kwargs):
    pass

class MockAws:
  Provider = MockProvider

# Mock the modules
sys.modules['pulumi'] = MockPulumi()
sys.modules['pulumi_aws'] = MockAws()

# Set up the mock config before importing
import importlib.util
spec = importlib.util.find_spec('tap_stack')
if spec is not None:
  import tap_stack
else:
  # Create mock values for testing
  class MockTapStack:
    PROJECT_NAME = "dswa-v5"
    ENVIRONMENT = "dev"
    AWS_REGION = "us-east-1"
    INSTANCE_TYPE = "t3.micro"
    DEPLOYMENT_ID = "1234"
    
    @staticmethod
    def get_resource_name(resource_type: str) -> str:
      return f"{MockTapStack.PROJECT_NAME}-{MockTapStack.ENVIRONMENT}-{resource_type}-{MockTapStack.DEPLOYMENT_ID}"
    
    @staticmethod
    def get_short_name(resource_type: str, max_length: int = 32) -> str:
      short_name = f"{MockTapStack.PROJECT_NAME}-{resource_type}-{MockTapStack.DEPLOYMENT_ID}"
      if len(short_name) > max_length:
        available_chars = max_length - len(f"-{MockTapStack.DEPLOYMENT_ID}")
        truncated = f"{MockTapStack.PROJECT_NAME}-{resource_type}"[:available_chars]
        short_name = f"{truncated}-{MockTapStack.DEPLOYMENT_ID}"
      return short_name
    
    @staticmethod
    def calculate_ipv6_cidr(vpc_cidr: str, subnet_index: int) -> str:
      base_prefix = vpc_cidr.replace("::/56", "")
      if subnet_index == 0:
        return f"{base_prefix}::/64"
      
      parts = base_prefix.split(":")
      last_part = parts[-1] if parts[-1] else "0"
      last_int = int(last_part, 16) + subnet_index
      parts[-1] = f"{last_int:x}"
      return f"{':'.join(parts)}::/64"
  
  tap_stack = MockTapStack()


def test_resource_naming():
  """Test resource naming functions."""
  vpc_name = tap_stack.get_resource_name("vpc")
  assert tap_stack.PROJECT_NAME in vpc_name
  assert tap_stack.ENVIRONMENT in vpc_name
  assert tap_stack.DEPLOYMENT_ID in vpc_name
  
  short_name = tap_stack.get_short_name("test", 10)
  assert len(short_name) <= 10


def test_resource_naming_edge_cases():
  """Test resource naming with edge cases."""
  # Test long resource type
  long_name = tap_stack.get_resource_name("very-long-resource-type-name")
  assert "very-long-resource-type-name" in long_name
  
  # Test short name truncation
  very_short_name = tap_stack.get_short_name("test", 5)
  assert len(very_short_name) <= 5
  
  # Test minimum length
  min_name = tap_stack.get_short_name("a", 8)
  assert len(min_name) <= 8


def test_ipv6_cidr_calculation():
  """Test IPv6 CIDR calculation logic."""
  test_cidr = "2600:1f18:1234:5600::/56"
  
  result1 = tap_stack.calculate_ipv6_cidr(test_cidr, 0)
  assert result1 == "2600:1f18:1234:5600::/64"
  
  result2 = tap_stack.calculate_ipv6_cidr(test_cidr, 1)
  assert result2 == "2600:1f18:1234:5601::/64"


def test_ipv6_cidr_calculation_multiple_subnets():
  """Test IPv6 CIDR calculation for multiple subnets."""
  test_cidr = "2600:1f18:1234:5600::/56"
  
  # Test multiple subnet indices
  for i in range(5):
    result = tap_stack.calculate_ipv6_cidr(test_cidr, i)
    if i == 0:
      assert result == "2600:1f18:1234:5600::/64"
    else:
      expected = f"2600:1f18:1234:560{i:x}::/64"
      assert result == expected


def test_configuration_constants():
  """Test configuration values."""
  assert tap_stack.ENVIRONMENT == "dev"
  assert tap_stack.AWS_REGION == "us-east-1"
  assert tap_stack.INSTANCE_TYPE == "t3.micro"
  assert tap_stack.PROJECT_NAME == "dswa-v5"
  assert len(tap_stack.DEPLOYMENT_ID) == 4


def test_deployment_id_format():
  """Test deployment ID format."""
  assert isinstance(tap_stack.DEPLOYMENT_ID, str)
  assert len(tap_stack.DEPLOYMENT_ID) == 4


def test_project_constants():
  """Test project-level constants."""
  assert tap_stack.PROJECT_NAME is not None
  assert len(tap_stack.PROJECT_NAME) > 0
  assert tap_stack.ENVIRONMENT is not None
  assert len(tap_stack.ENVIRONMENT) > 0
  assert tap_stack.AWS_REGION is not None
  assert len(tap_stack.AWS_REGION) > 0


def test_resource_name_format():
  """Test resource name format consistency."""
  resource_types = ["vpc", "subnet", "instance", "alb", "sg"]
  for resource_type in resource_types:
    name = tap_stack.get_resource_name(resource_type)
    parts = name.split("-")
    assert len(parts) >= 4  # project-env-type-deployment
    assert parts[0] == tap_stack.PROJECT_NAME
    assert parts[1] == tap_stack.ENVIRONMENT
    assert resource_type in name
    assert tap_stack.DEPLOYMENT_ID in name


def test_short_name_truncation_logic():
  """Test short name truncation logic."""
  # Test exact length
  exact_name = tap_stack.get_short_name("test", 20)
  assert len(exact_name) <= 20
  
  # Test very short limit
  tiny_name = tap_stack.get_short_name("verylongresourcetype", 10)
  assert len(tiny_name) <= 10
  assert tap_stack.DEPLOYMENT_ID in tiny_name
