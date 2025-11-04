"""Unit tests for TAP Stack VPC infrastructure."""

import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest  # pylint: disable=wrong-import-position

from cdktf import Testing  # pylint: disable=wrong-import-position
from tests.test_constants import REQUIRED_OUTPUTS  # pylint: disable=wrong-import-position
from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestTapStack:  # pylint: disable=too-many-public-methods
    """Test suite for TapStack infrastructure."""

    @pytest.fixture
    def app(self):
        """Create a test CDKTF app."""
        return Testing.app()

    @pytest.fixture
    def stack(self, app):
        """Create a TapStack instance for testing."""
        return TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ca-central-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={
                "tags": {
                    "Environment": "test",
                    "Repository": "test-repo",
                    "Author": "test-author"
                }
            }
        )

    @pytest.fixture
    def synth(self, app, stack):  # pylint: disable=unused-argument
        """Synthesize the stack to JSON."""
        synthesized = Testing.synth(stack)
        return json.loads(synthesized)

    def test_stack_creation(self, stack):
        """Test that stack is created successfully."""
        assert stack is not None
        assert isinstance(stack, TapStack)

    def test_vpc_created(self, synth):
        """Test that VPC is created with correct configuration."""
        resources = synth.get("resource", {})
        vpcs = resources.get("aws_vpc", {})

        assert len(vpcs) == 1
        vpc_config = list(vpcs.values())[0]
        assert vpc_config["cidr_block"] == "10.0.0.0/16"
        assert vpc_config["enable_dns_hostnames"] is True
        assert vpc_config["enable_dns_support"] is True
        assert vpc_config["tags"]["Environment"] == "development"
        assert vpc_config["tags"]["CostCenter"] == "engineering"

    def test_subnets_created(self, synth):
        """Test that all 4 subnets are created with correct CIDR blocks."""
        resources = synth.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        assert len(subnets) == 4

        # Check public subnets
        public_cidrs = []
        private_cidrs = []

        for subnet_config in subnets.values():
            cidr = subnet_config["cidr_block"]
            if "public" in subnet_config["tags"]["Name"]:
                public_cidrs.append(cidr)
            else:
                private_cidrs.append(cidr)

        assert "10.0.1.0/24" in public_cidrs
        assert "10.0.2.0/24" in public_cidrs
        assert "10.0.11.0/24" in private_cidrs
        assert "10.0.12.0/24" in private_cidrs

    def test_availability_zones(self, synth):
        """Test that subnets are deployed to correct AZs."""
        resources = synth.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        azs = [subnet["availability_zone"] for subnet in subnets.values()]

        # Should have subnets in both ca-central-1a and ca-central-1b
        assert "ca-central-1a" in azs
        assert "ca-central-1b" in azs

    def test_internet_gateway_created(self, synth):
        """Test that Internet Gateway is created."""
        resources = synth.get("resource", {})
        igws = resources.get("aws_internet_gateway", {})

        assert len(igws) == 1
        igw_config = list(igws.values())[0]
        assert igw_config["tags"]["Environment"] == "development"
        assert igw_config["tags"]["CostCenter"] == "engineering"

    def test_nat_gateway_created(self, synth):
        """Test that single NAT Gateway is created."""
        resources = synth.get("resource", {})
        nat_gateways = resources.get("aws_nat_gateway", {})

        # Should have exactly 1 NAT Gateway for cost optimization
        assert len(nat_gateways) == 1
        nat_config = list(nat_gateways.values())[0]
        assert nat_config["tags"]["Environment"] == "development"
        assert nat_config["tags"]["CostCenter"] == "engineering"

    def test_elastic_ip_created(self, synth):
        """Test that Elastic IP is created for NAT Gateway."""
        resources = synth.get("resource", {})
        eips = resources.get("aws_eip", {})

        assert len(eips) == 1
        eip_config = list(eips.values())[0]
        assert eip_config["domain"] == "vpc"

    def test_route_tables_created(self, synth):
        """Test that custom route tables are created."""
        resources = synth.get("resource", {})
        route_tables = resources.get("aws_route_table", {})

        # Should have 2 route tables: public and private
        assert len(route_tables) == 2

        public_rt_found = False
        private_rt_found = False

        for rt_config in route_tables.values():
            if "Type" in rt_config["tags"]:
                if rt_config["tags"]["Type"] == "Public":
                    public_rt_found = True
                    # Public route table should have IGW route
                    assert any(
                        route.get("cidr_block") == "0.0.0.0/0"
                        for route in rt_config.get("route", [])
                    )
                elif rt_config["tags"]["Type"] == "Private":
                    private_rt_found = True
                    # Private route table should have NAT Gateway route
                    assert any(
                        route.get("cidr_block") == "0.0.0.0/0"
                        for route in rt_config.get("route", [])
                    )

        assert public_rt_found
        assert private_rt_found

    def test_route_table_associations(self, synth):
        """Test that subnets are associated with correct route tables."""
        resources = synth.get("resource", {})
        associations = resources.get("aws_route_table_association", {})

        # Should have 4 associations (one per subnet)
        assert len(associations) == 4

    def test_vpc_flow_logs_created(self, synth):
        """Test that VPC Flow Logs are configured."""
        resources = synth.get("resource", {})
        flow_logs = resources.get("aws_flow_log", {})

        assert len(flow_logs) == 1
        flow_log_config = list(flow_logs.values())[0]
        assert flow_log_config["traffic_type"] == "ALL"
        assert flow_log_config["log_destination_type"] == "cloud-watch-logs"
        assert flow_log_config["max_aggregation_interval"] == 300  # 5 minutes

    def test_cloudwatch_log_group_created(self, synth):
        """Test that CloudWatch Log Group for Flow Logs is created."""
        resources = synth.get("resource", {})
        log_groups = resources.get("aws_cloudwatch_log_group", {})

        assert len(log_groups) == 1
        log_group_config = list(log_groups.values())[0]
        assert "/aws/vpc/flowlogs" in log_group_config["name"]
        assert log_group_config["retention_in_days"] == 7

    def test_iam_role_for_flow_logs(self, synth):
        """Test that IAM role for Flow Logs is created."""
        resources = synth.get("resource", {})
        iam_roles = resources.get("aws_iam_role", {})

        assert len(iam_roles) == 1
        role_config = list(iam_roles.values())[0]

        # Check assume role policy
        assume_policy = json.loads(role_config["assume_role_policy"])
        expected_service = "vpc-flow-logs.amazonaws.com"
        assert assume_policy["Statement"][0]["Principal"]["Service"] == expected_service

    def test_iam_role_policy_for_flow_logs(self, synth):
        """Test that IAM role policy for Flow Logs is created."""
        resources = synth.get("resource", {})
        role_policies = resources.get("aws_iam_role_policy", {})

        assert len(role_policies) == 1

    def test_vpc_endpoints_created(self, synth):
        """Test that VPC endpoints for S3 and DynamoDB are created."""
        resources = synth.get("resource", {})
        vpc_endpoints = resources.get("aws_vpc_endpoint", {})

        # Should have 2 endpoints: S3 and DynamoDB
        assert len(vpc_endpoints) == 2

        s3_found = False
        dynamodb_found = False

        for endpoint_config in vpc_endpoints.values():
            service_name = endpoint_config["service_name"]

            if ".s3" in service_name:
                s3_found = True
                assert endpoint_config["vpc_endpoint_type"] == "Gateway"
            elif ".dynamodb" in service_name:
                dynamodb_found = True
                assert endpoint_config["vpc_endpoint_type"] == "Gateway"

        assert s3_found
        assert dynamodb_found

    def test_resource_naming_includes_suffix(self, synth):
        """Test that resources include environment suffix in names."""
        resources = synth.get("resource", {})

        # Check VPC
        vpcs = resources.get("aws_vpc", {})
        vpc_config = list(vpcs.values())[0]
        assert "test" in vpc_config["tags"]["Name"]

        # Check subnets
        subnets = resources.get("aws_subnet", {})
        for subnet_config in subnets.values():
            assert "test" in subnet_config["tags"]["Name"]

        # Check NAT Gateway
        nat_gateways = resources.get("aws_nat_gateway", {})
        nat_config = list(nat_gateways.values())[0]
        assert "test" in nat_config["tags"]["Name"]

    def test_tags_consistency(self, synth):
        """Test that all resources have consistent Environment and CostCenter tags."""
        resources = synth.get("resource", {})

        # Resource types that should have tags
        tagged_types = [
            "aws_vpc",
            "aws_subnet",
            "aws_internet_gateway",
            "aws_nat_gateway",
            "aws_eip",
            "aws_route_table",
            "aws_cloudwatch_log_group",
            "aws_iam_role",
            "aws_flow_log",
            "aws_vpc_endpoint"
        ]

        for resource_type in tagged_types:
            if resource_type in resources:
                for resource_config in resources[resource_type].values():
                    tags = resource_config.get("tags", {})
                    assert tags.get("Environment") == "development"
                    assert tags.get("CostCenter") == "engineering"

    def test_outputs_defined(self, synth):
        """Test that all required outputs are defined."""
        outputs = synth.get("output", {})

        required_outputs = REQUIRED_OUTPUTS

        for output_name in required_outputs:
            assert output_name in outputs, f"Missing output: {output_name}"

    def test_public_subnets_map_public_ip(self, synth):
        """Test that public subnets have map_public_ip_on_launch enabled."""
        resources = synth.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        for subnet_config in subnets.values():
            if "Type" in subnet_config["tags"] and subnet_config["tags"]["Type"] == "Public":
                assert subnet_config.get("map_public_ip_on_launch") is True

    def test_private_subnets_no_public_ip(self, synth):
        """Test that private subnets do not have map_public_ip_on_launch enabled."""
        resources = synth.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        for subnet_config in subnets.values():
            if "Type" in subnet_config["tags"] and subnet_config["tags"]["Type"] == "Private":
                assert not subnet_config.get("map_public_ip_on_launch")

    def test_backend_configuration(self, synth):
        """Test that S3 backend is configured correctly."""
        terraform_config = synth.get("terraform", {})
        backend = terraform_config.get("backend", {})

        assert "s3" in backend
        s3_config = backend["s3"]
        assert s3_config["bucket"] == "test-bucket"
        assert s3_config["region"] == "us-east-1"
        assert s3_config["encrypt"] is True

    def test_provider_configuration(self, synth):
        """Test that AWS provider is configured correctly."""
        provider_config = synth.get("provider", {})

        assert "aws" in provider_config
        aws_config = provider_config["aws"][0]
        assert aws_config["region"] == "ca-central-1"
