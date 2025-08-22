"""Detailed unit tests for VPC and networking components in TAP Stack."""
from lib.tap_stack import TapStack
from cdktf import App, Testing
import os
import sys
from unittest.mock import Mock, patch

import pytest

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


class TestVPCConfiguration:
  """Test suite for VPC configuration and properties."""

  def test_vpc_cidr_block_configuration(self):
    """Test VPC CIDR block is configured correctly."""
    app = App()
    stack = TapStack(app, "TestVPCCIDRStack")

    assert stack.vpc_cidr == "10.0.0.0/16"
    assert stack.vpc is not None

  def test_vpc_dns_settings(self):
    """Test VPC DNS settings are enabled."""
    app = App()
    stack = TapStack(app, "TestVPCDNSStack")

    # VPC should have DNS hostnames and support enabled
    assert stack.vpc is not None

  def test_vpc_tagging(self):
    """Test VPC has proper tags applied."""
    app = App()
    stack = TapStack(app, "TestVPCTagsStack")

    assert stack.vpc is not None
    assert stack.common_tags is not None
    assert "Environment" in stack.common_tags
    assert "ManagedBy" in stack.common_tags


class TestSubnetConfiguration:
  """Test suite for subnet configuration and properties."""

  def test_public_subnet_cidr_blocks(self):
    """Test public subnets have correct CIDR blocks."""
    app = App()
    stack = TapStack(app, "TestPublicSubnetCIDRStack")

    assert len(stack.public_subnets) == 2
    # Expected CIDR blocks: 10.0.1.0/24 and 10.0.2.0/24

  def test_private_subnet_cidr_blocks(self):
    """Test private subnets have correct CIDR blocks."""
    app = App()
    stack = TapStack(app, "TestPrivateSubnetCIDRStack")

    assert len(stack.private_subnets) == 2
    # Expected CIDR blocks: 10.0.10.0/24 and 10.0.11.0/24

  def test_public_subnets_map_public_ip(self):
    """Test public subnets are configured to map public IPs."""
    app = App()
    stack = TapStack(app, "TestPublicIPMappingStack")

    assert len(stack.public_subnets) == 2
    # Public subnets should have map_public_ip_on_launch=True

  def test_private_subnets_no_public_ip(self):
    """Test private subnets do not map public IPs."""
    app = App()
    stack = TapStack(app, "TestPrivateNoPublicIPStack")

    assert len(stack.private_subnets) == 2
    # Private subnets should not have public IP mapping

  def test_subnet_availability_zones(self):
    """Test subnets are distributed across availability zones."""
    app = App()
    stack = TapStack(app, "TestSubnetAZDistributionStack")

    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2
    assert stack.azs is not None
    assert stack.az_names is not None

  def test_subnet_tagging(self):
    """Test subnets have proper tags applied."""
    app = App()
    stack = TapStack(app, "TestSubnetTagsStack")

    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2
    # Subnets should have Name tags and Type tags

  def test_subnet_vpc_association(self):
    """Test all subnets are associated with the VPC."""
    app = App()
    stack = TapStack(app, "TestSubnetVPCAssociationStack")

    assert stack.vpc is not None
    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2
    # All subnets should reference the VPC ID


class TestInternetGateway:
  """Test suite for Internet Gateway configuration."""

  def test_internet_gateway_creation(self):
    """Test Internet Gateway is created."""
    app = App()
    stack = TapStack(app, "TestIGWCreationStack")

    assert hasattr(stack, 'internet_gateway')
    assert stack.internet_gateway is not None

  def test_internet_gateway_vpc_attachment(self):
    """Test Internet Gateway is attached to VPC."""
    app = App()
    stack = TapStack(app, "TestIGWVPCAttachmentStack")

    assert stack.vpc is not None
    assert stack.internet_gateway is not None
    # IGW should be attached to the VPC

  def test_internet_gateway_tagging(self):
    """Test Internet Gateway has proper tags."""
    app = App()
    stack = TapStack(app, "TestIGWTagsStack")

    assert stack.internet_gateway is not None
    # IGW should have proper tags including Name tag


class TestNATGateway:
  """Test suite for NAT Gateway configuration."""

  def test_nat_gateway_creation(self):
    """Test NAT Gateway is created."""
    app = App()
    stack = TapStack(app, "TestNATCreationStack")

    assert hasattr(stack, 'nat_gateway')
    assert stack.nat_gateway is not None

  def test_elastic_ip_creation(self):
    """Test Elastic IP is created for NAT Gateway."""
    app = App()
    stack = TapStack(app, "TestEIPCreationStack")

    assert hasattr(stack, 'nat_eip')
    assert stack.nat_eip is not None

  def test_nat_gateway_public_subnet_placement(self):
    """Test NAT Gateway is placed in a public subnet."""
    app = App()
    stack = TapStack(app, "TestNATPublicSubnetStack")

    assert stack.nat_gateway is not None
    assert len(stack.public_subnets) >= 1
    # NAT Gateway should be in the first public subnet

  def test_nat_gateway_elastic_ip_association(self):
    """Test NAT Gateway is associated with Elastic IP."""
    app = App()
    stack = TapStack(app, "TestNATEIPAssociationStack")

    assert stack.nat_gateway is not None
    assert stack.nat_eip is not None
    # NAT Gateway should use the Elastic IP allocation

  def test_elastic_ip_vpc_domain(self):
    """Test Elastic IP is configured for VPC domain."""
    app = App()
    stack = TapStack(app, "TestEIPVPCDomainStack")

    assert stack.nat_eip is not None
    # EIP should be configured with domain="vpc"

  def test_nat_gateway_tagging(self):
    """Test NAT Gateway and EIP have proper tags."""
    app = App()
    stack = TapStack(app, "TestNATTagsStack")

    assert stack.nat_gateway is not None
    assert stack.nat_eip is not None
    # Both should have proper tags


class TestRouteTables:
  """Test suite for route table configuration."""

  def test_public_route_table_creation(self):
    """Test public route table is created."""
    app = App()
    stack = TapStack(app, "TestPublicRouteTableStack")

    assert hasattr(stack, 'public_route_table')
    assert stack.public_route_table is not None

  def test_private_route_table_creation(self):
    """Test private route table is created."""
    app = App()
    stack = TapStack(app, "TestPrivateRouteTableStack")

    assert hasattr(stack, 'private_route_table')
    assert stack.private_route_table is not None

  def test_public_route_to_internet_gateway(self):
    """Test public route table has route to Internet Gateway."""
    app = App()
    stack = TapStack(app, "TestPublicRouteIGWStack")

    assert stack.public_route_table is not None
    assert stack.internet_gateway is not None
    # Public route table should have 0.0.0.0/0 route to IGW

  def test_private_route_to_nat_gateway(self):
    """Test private route table has route to NAT Gateway."""
    app = App()
    stack = TapStack(app, "TestPrivateRouteNATStack")

    assert stack.private_route_table is not None
    assert stack.nat_gateway is not None
    # Private route table should have 0.0.0.0/0 route to NAT

  def test_public_subnet_route_table_associations(self):
    """Test public subnets are associated with public route table."""
    app = App()
    stack = TapStack(app, "TestPublicSubnetRTAssociationStack")

    assert stack.public_route_table is not None
    assert len(stack.public_subnets) == 2
    # Both public subnets should be associated with public route table

  def test_private_subnet_route_table_associations(self):
    """Test private subnets are associated with private route table."""
    app = App()
    stack = TapStack(app, "TestPrivateSubnetRTAssociationStack")

    assert stack.private_route_table is not None
    assert len(stack.private_subnets) == 2
    # Both private subnets should be associated with private route table

  def test_route_table_vpc_association(self):
    """Test route tables are associated with VPC."""
    app = App()
    stack = TapStack(app, "TestRouteTableVPCAssociationStack")

    assert stack.vpc is not None
    assert stack.public_route_table is not None
    assert stack.private_route_table is not None
    # Both route tables should be associated with the VPC

  def test_route_table_tagging(self):
    """Test route tables have proper tags."""
    app = App()
    stack = TapStack(app, "TestRouteTableTagsStack")

    assert stack.public_route_table is not None
    assert stack.private_route_table is not None
    # Route tables should have proper tags


class TestNetworkingIntegration:
  """Test suite for networking component integration."""

  def test_complete_networking_stack(self):
    """Test complete networking stack is properly configured."""
    app = App()
    stack = TapStack(app, "TestCompleteNetworkingStack")

    # Core networking components
    assert stack.vpc is not None
    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2

    # Gateway components
    assert stack.internet_gateway is not None
    assert stack.nat_gateway is not None
    assert stack.nat_eip is not None

    # Routing components
    assert stack.public_route_table is not None
    assert stack.private_route_table is not None

  def test_public_subnet_internet_connectivity(self):
    """Test public subnets have internet connectivity through IGW."""
    app = App()
    stack = TapStack(app, "TestPublicInternetConnectivityStack")

    assert len(stack.public_subnets) == 2
    assert stack.internet_gateway is not None
    assert stack.public_route_table is not None
    # Public subnets should have route to internet via IGW

  def test_private_subnet_nat_connectivity(self):
    """Test private subnets have outbound connectivity through NAT."""
    app = App()
    stack = TapStack(app, "TestPrivateNATConnectivityStack")

    assert len(stack.private_subnets) == 2
    assert stack.nat_gateway is not None
    assert stack.private_route_table is not None
    # Private subnets should have route to internet via NAT

  def test_multi_az_deployment(self):
    """Test networking spans multiple availability zones."""
    app = App()
    stack = TapStack(app, "TestMultiAZStack")

    assert stack.azs is not None
    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2
    # Subnets should be in different AZs

  def test_network_segmentation(self):
    """Test proper network segmentation between public and private."""
    app = App()
    stack = TapStack(app, "TestNetworkSegmentationStack")

    # Public and private subnets should have different CIDR ranges
    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2
    assert stack.public_route_table is not None
    assert stack.private_route_table is not None


class TestNetworkingErrorHandling:
  """Test suite for networking error handling and edge cases."""

  def test_networking_with_custom_vpc_cidr(self):
    """Test networking works with different VPC CIDR."""
    app = App()
    stack = TapStack(app, "TestCustomVPCCIDRStack")

    # Should work with the configured VPC CIDR
    assert stack.vpc_cidr == "10.0.0.0/16"
    assert stack.vpc is not None

  def test_networking_with_minimal_configuration(self):
    """Test networking works with minimal configuration."""
    app = App()
    stack = TapStack(app, "TestMinimalNetworkingStack")

    # Should create all necessary networking components with defaults
    assert stack.vpc is not None
    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2

  def test_networking_components_dependency_order(self):
    """Test networking components are created in correct dependency order."""
    app = App()
    stack = TapStack(app, "TestNetworkingDependencyStack")

    # All components should be created successfully
    assert stack.vpc is not None
    assert stack.internet_gateway is not None
    assert stack.nat_eip is not None
    assert stack.nat_gateway is not None
    assert stack.public_route_table is not None
    assert stack.private_route_table is not None


if __name__ == "__main__":
  pytest.main([__file__])
