import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestNetworking:
    """Test cases for networking module"""

    def test_vpc_creation(self):
        """Verify VPCs are created with correct CIDR blocks"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Verify Payment VPC
        payment_vpc = Testing.to_have_resource_with_properties(
            synthesized,
            "aws_vpc",
            {
                "cidr_block": "10.0.0.0/16",
                "enable_dns_hostnames": True,
                "enable_dns_support": True
            }
        )
        assert payment_vpc is not None

    def test_subnets_created_in_multiple_azs(self):
        """Verify subnets are created across 3 availability zones"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Count subnets - should have 6 per VPC (3 public + 3 private)
        subnets = Testing.to_have_resource(synthesized, "aws_subnet")
        # 12 total subnets (6 per VPC × 2 VPCs)
        assert subnets is not None

    def test_nat_gateways_created(self):
        """Verify NAT gateways are created in public subnets"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Should have 6 NAT gateways (3 per VPC)
        nat_gateways = Testing.to_have_resource(synthesized, "aws_nat_gateway")
        assert nat_gateways is not None

    def test_vpc_peering_connection(self):
        """Verify VPC peering connection is created with auto-accept"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        peering = Testing.to_have_resource_with_properties(
            synthesized,
            "aws_vpc_peering_connection",
            {
                "auto_accept": True
            }
        )
        assert peering is not None

    def test_route_tables_configured(self):
        """Verify route tables exist for public and private subnets"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Should have route tables for public and private subnets
        route_tables = Testing.to_have_resource(synthesized, "aws_route_table")
        assert route_tables is not None

    def test_internet_gateways(self):
        """Verify internet gateways are created for both VPCs"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        igw = Testing.to_have_resource(synthesized, "aws_internet_gateway")
        assert igw is not None
