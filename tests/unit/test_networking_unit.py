"""
Unit tests for NetworkingConstruct
"""
import pytest
from cdktf import Testing, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from lib.imports.networking import NetworkingConstruct


class TestNetworkingConstruct:
    """Test suite for NetworkingConstruct"""

    @pytest.fixture
    def setup_stack(self):
        """Create a test stack with providers"""
        stack = Testing.stub_stack()
        primary_provider = AwsProvider(stack, "aws_primary", region="us-east-1", alias="primary")
        secondary_provider = AwsProvider(stack, "aws_secondary", region="us-west-2", alias="secondary")
        return stack, primary_provider, secondary_provider

    def test_networking_construct_creation(self, setup_stack):
        """Test that networking construct is created successfully"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        assert construct is not None
        assert construct.environment_suffix == "test"

    def test_vpc_creation(self, setup_stack):
        """Test that VPCs are created in both regions"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        # Test that VPCs exist
        assert construct.primary_vpc is not None
        assert construct.secondary_vpc is not None

        # Test VPC properties
        assert construct.primary_vpc.cidr_block == "10.0.0.0/16"
        assert construct.secondary_vpc.cidr_block == "10.1.0.0/16"

    def test_subnet_creation(self, setup_stack):
        """Test that subnets are created correctly"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        # Test primary subnets
        assert len(construct.primary_private_subnets) == 3
        assert construct.primary_private_subnets[0].cidr_block == "10.0.0.0/24"
        assert construct.primary_private_subnets[1].cidr_block == "10.0.1.0/24"
        assert construct.primary_private_subnets[2].cidr_block == "10.0.2.0/24"

        # Test secondary subnets
        assert len(construct.secondary_private_subnets) == 3
        assert construct.secondary_private_subnets[0].cidr_block == "10.1.0.0/24"
        assert construct.secondary_private_subnets[1].cidr_block == "10.1.1.0/24"
        assert construct.secondary_private_subnets[2].cidr_block == "10.1.2.0/24"

    def test_subnet_availability_zones(self, setup_stack):
        """Test that subnets are distributed across AZs"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        # Test primary AZs
        primary_azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        for i, subnet in enumerate(construct.primary_private_subnets):
            assert subnet.availability_zone == primary_azs[i]

        # Test secondary AZs
        secondary_azs = ["us-west-2a", "us-west-2b", "us-west-2c"]
        for i, subnet in enumerate(construct.secondary_private_subnets):
            assert subnet.availability_zone == secondary_azs[i]

    def test_internet_gateways(self, setup_stack):
        """Test that internet gateways are created"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        assert construct.primary_igw is not None
        assert construct.secondary_igw is not None

    def test_vpc_peering(self, setup_stack):
        """Test that VPC peering is configured"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        assert construct.vpc_peering is not None
        assert construct.vpc_peering_accepter is not None
        assert construct.vpc_peering.peer_region == "us-west-2"

    def test_security_groups(self, setup_stack):
        """Test that security groups are created correctly"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        # Test primary security groups
        assert construct.primary_db_sg is not None
        assert construct.primary_lambda_sg is not None

        # Test secondary security groups
        assert construct.secondary_db_sg is not None
        assert construct.secondary_lambda_sg is not None

    def test_security_group_ingress_rules(self, setup_stack):
        """Test security group ingress rules"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        # Test database security group ingress
        primary_db_ingress = construct.primary_db_sg.ingress[0]
        assert primary_db_ingress['from_port'] == 5432
        assert primary_db_ingress['to_port'] == 5432
        assert primary_db_ingress['protocol'] == "tcp"
        assert "10.0.0.0/16" in primary_db_ingress['cidr_blocks']
        assert "10.1.0.0/16" in primary_db_ingress['cidr_blocks']

    def test_property_accessors(self, setup_stack):
        """Test that property accessors return correct values"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        # Test VPC ID properties
        assert construct.primary_vpc_id == construct.primary_vpc.id
        assert construct.secondary_vpc_id == construct.secondary_vpc.id

        # Test subnet ID properties
        assert len(construct.primary_private_subnet_ids) == 3
        assert len(construct.secondary_private_subnet_ids) == 3

        # Test security group ID properties
        assert construct.primary_db_sg_id == construct.primary_db_sg.id
        assert construct.secondary_db_sg_id == construct.secondary_db_sg.id
        assert construct.primary_lambda_sg_id == construct.primary_lambda_sg.id
        assert construct.secondary_lambda_sg_id == construct.secondary_lambda_sg.id

    def test_resource_naming_includes_environment_suffix(self, setup_stack):
        """Test that all resources are named with environment suffix"""
        stack, primary_provider, secondary_provider = setup_stack
        env_suffix = "test-123"

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix=env_suffix,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        # Test VPC tags
        assert f"payment-primary-vpc-{env_suffix}" in construct.primary_vpc.tags['Name']
        assert f"payment-secondary-vpc-{env_suffix}" in construct.secondary_vpc.tags['Name']

        # Test security group names
        assert f"payment-primary-db-sg-{env_suffix}" in construct.primary_db_sg.name
        assert f"payment-secondary-lambda-sg-{env_suffix}" in construct.secondary_lambda_sg.name

    def test_route_tables(self, setup_stack):
        """Test that route tables are created"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        assert construct.primary_route_table is not None
        assert construct.secondary_route_table is not None

    def test_vpc_dns_settings(self, setup_stack):
        """Test that VPC DNS settings are enabled"""
        stack, primary_provider, secondary_provider = setup_stack

        construct = NetworkingConstruct(
            stack,
            "test-networking",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider
        )

        assert construct.primary_vpc.enable_dns_hostnames is True
        assert construct.primary_vpc.enable_dns_support is True
        assert construct.secondary_vpc.enable_dns_hostnames is True
        assert construct.secondary_vpc.enable_dns_support is True
