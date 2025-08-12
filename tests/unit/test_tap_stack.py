"""Unit tests for the TapStack Pulumi component."""
import pytest

try:
  import pulumi
  from moto import mock_ec2, mock_elbv2, mock_iam
except ImportError:
  pytest.skip("Pulumi or moto not available", allow_module_level=True)

from lib.tap_stack import (
  get_resource_name, get_short_name, calculate_ipv6_cidr,
  PROJECT_NAME, ENVIRONMENT, DEPLOYMENT_ID, AWS_REGION, INSTANCE_TYPE
)


class TestTapStackUtilities:
  """Test utility functions."""
  
  def test_resource_naming(self):
    """Test resource naming functions."""
    vpc_name = get_resource_name("vpc")
    assert PROJECT_NAME in vpc_name
    assert ENVIRONMENT in vpc_name
    assert DEPLOYMENT_ID in vpc_name
    
    short_name = get_short_name("test", 10)
    assert len(short_name) <= 10

  def test_ipv6_cidr_calculation(self):
    """Test IPv6 CIDR calculation logic."""
    test_cidr = "2600:1f18:1234:5600::/56"
    
    result1 = calculate_ipv6_cidr(test_cidr, 0)
    assert result1 == "2600:1f18:1234:5600::/64"
    
    result2 = calculate_ipv6_cidr(test_cidr, 1)
    assert result2 == "2600:1f18:1234:5601::/64"

  def test_configuration_constants(self):
    """Test configuration values."""
    assert ENVIRONMENT == "dev"
    assert AWS_REGION == "us-east-1"
    assert INSTANCE_TYPE == "t3.micro"
    assert PROJECT_NAME == "dswa-v5"
    assert len(DEPLOYMENT_ID) == 4
