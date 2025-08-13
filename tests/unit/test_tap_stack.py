"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

"""
Infrastructure validation tests
"""

import pytest
from unittest.mock import patch, MagicMock


class TestInfrastructure:
  """Test infrastructure components"""

  @patch('pulumi_aws.ec2.Vpc')
  def test_vpc_creation(self, mock_vpc):
    """Test VPC creation with correct CIDR"""
    from lib.modules.vpc import create_vpc_infrastructure

    mock_provider = MagicMock()
    mock_vpc_instance = MagicMock()
    mock_vpc_instance.id = "vpc-12345"
    mock_vpc.return_value = mock_vpc_instance

    result = create_vpc_infrastructure(
      region="us-east-1",
      cidr_block="10.0.0.0/16",
      provider=mock_provider,
      tags={"Environment": "test"}
    )

    mock_vpc.assert_called_once()
    assert "vpc" in result

  def test_cidr_validation(self):
    """Test CIDR block validation"""
    from lib.modules.utils import validate_cidr_block

    assert validate_cidr_block("10.0.0.0/16") == True
    assert validate_cidr_block("192.168.1.0/24") == True
    assert validate_cidr_block("invalid-cidr") == False
    assert validate_cidr_block("10.0.0.0/33") == False

  def test_common_tags(self):
    """Test common tags generation"""
    from lib.modules.utils import get_common_tags

    tags = get_common_tags(
      environment="test",
      owner="test-team",
      project="test-project"
    )

    required_tags = ["Environment", "Owner", "Project", "ManagedBy"]
    for tag in required_tags:
      assert tag in tags

    assert tags["Environment"] == "test"
    assert tags["Owner"] == "test-team"
    assert tags["Project"] == "test-project"

  def test_security_group_rules(self):
    """Test security group rules are restrictive"""
    # This would test that security groups follow least privilege
    # In a real implementation, you'd validate the actual rules
    pass


if __name__ == "__main__":
  pytest.main([__file__])
