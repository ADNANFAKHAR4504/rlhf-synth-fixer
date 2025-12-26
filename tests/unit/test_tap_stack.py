"""
Unit tests for TapStack CDKTF infrastructure.
Tests validate the synthesized Terraform JSON configuration.
"""
import json
import os
import pytest
from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackStructure:
    """Test the basic structure of the TapStack."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        # Ensure we're not in LocalStack mode for S3 tests
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)

    def test_stack_synthesizes_successfully(self):
        """Test that the stack synthesizes without errors."""
        assert self.synth is not None
        assert isinstance(self.config, dict)

    def test_has_terraform_provider(self):
        """Test that AWS provider is configured."""
        assert "provider" in self.config
        assert "aws" in self.config["provider"]

    def test_has_resources(self):
        """Test that resources are defined."""
        assert "resource" in self.config

    def test_has_outputs(self):
        """Test that outputs are defined."""
        assert "output" in self.config


class TestVPCResources:
    """Test VPC and networking resources."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def test_vpc_created(self):
        """Test that VPC is created with correct CIDR."""
        assert "aws_vpc" in self.resources
        vpcs = self.resources["aws_vpc"]
        assert len(vpcs) == 1
        vpc = list(vpcs.values())[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_vpc_has_environment_tag(self):
        """Test that VPC has Environment tag."""
        vpc = list(self.resources["aws_vpc"].values())[0]
        assert "tags" in vpc
        assert vpc["tags"]["Environment"] == "Production"

    def test_vpc_has_name_tag(self):
        """Test that VPC has Name tag with environment suffix."""
        vpc = list(self.resources["aws_vpc"].values())[0]
        assert "Name" in vpc["tags"]
        assert "test" in vpc["tags"]["Name"]

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created."""
        assert "aws_internet_gateway" in self.resources
        igws = self.resources["aws_internet_gateway"]
        assert len(igws) == 1
        igw = list(igws.values())[0]
        assert "vpc_id" in igw
        assert igw["tags"]["Environment"] == "Production"


class TestSubnetResources:
    """Test subnet resources."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def test_four_subnets_created(self):
        """Test that 4 subnets are created (2 public, 2 private)."""
        assert "aws_subnet" in self.resources
        subnets = self.resources["aws_subnet"]
        assert len(subnets) == 4

    def test_public_subnets_configuration(self):
        """Test public subnets have correct configuration."""
        subnets = self.resources["aws_subnet"]
        public_subnets = {k: v for k, v in subnets.items() if "public" in k}
        assert len(public_subnets) == 2

        for name, subnet in public_subnets.items():
            assert subnet["map_public_ip_on_launch"] is True
            assert subnet["tags"]["Environment"] == "Production"
            assert "public-subnet" in subnet["tags"]["Name"]

    def test_private_subnets_configuration(self):
        """Test private subnets have correct configuration."""
        subnets = self.resources["aws_subnet"]
        private_subnets = {k: v for k, v in subnets.items() if "private" in k}
        assert len(private_subnets) == 2

        for name, subnet in private_subnets.items():
            # Private subnets should not auto-assign public IPs
            assert subnet.get("map_public_ip_on_launch", False) is False
            assert subnet["tags"]["Environment"] == "Production"
            assert "private-subnet" in subnet["tags"]["Name"]

    def test_subnets_in_different_azs(self):
        """Test subnets are distributed across availability zones."""
        subnets = self.resources["aws_subnet"]
        azs = set()
        for subnet in subnets.values():
            azs.add(subnet["availability_zone"])
        assert len(azs) == 2  # Should be in 2 different AZs

    def test_subnet_cidr_blocks(self):
        """Test subnets have correct CIDR blocks."""
        subnets = self.resources["aws_subnet"]
        cidr_blocks = [s["cidr_block"] for s in subnets.values()]
        
        # Verify expected CIDR blocks
        assert "10.0.1.0/24" in cidr_blocks  # public-subnet-1
        assert "10.0.2.0/24" in cidr_blocks  # public-subnet-2
        assert "10.0.10.0/24" in cidr_blocks  # private-subnet-1
        assert "10.0.11.0/24" in cidr_blocks  # private-subnet-2


class TestNATGatewayResources:
    """Test NAT Gateway resources."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def test_two_nat_gateways_created(self):
        """Test that 2 NAT Gateways are created for HA."""
        assert "aws_nat_gateway" in self.resources
        nat_gws = self.resources["aws_nat_gateway"]
        assert len(nat_gws) == 2

    def test_two_eips_created(self):
        """Test that 2 Elastic IPs are created for NAT Gateways."""
        assert "aws_eip" in self.resources
        eips = self.resources["aws_eip"]
        assert len(eips) == 2

        for eip in eips.values():
            assert eip["domain"] == "vpc"
            assert eip["tags"]["Environment"] == "Production"

    def test_nat_gateways_have_allocation_ids(self):
        """Test NAT Gateways reference EIP allocation IDs."""
        nat_gws = self.resources["aws_nat_gateway"]
        for nat_gw in nat_gws.values():
            assert "allocation_id" in nat_gw
            assert "subnet_id" in nat_gw


class TestRouteTableResources:
    """Test route table resources."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def test_three_route_tables_created(self):
        """Test that 3 route tables are created (1 public, 2 private)."""
        assert "aws_route_table" in self.resources
        route_tables = self.resources["aws_route_table"]
        assert len(route_tables) == 3

    def test_public_route_to_igw(self):
        """Test public route goes to internet gateway."""
        assert "aws_route" in self.resources
        routes = self.resources["aws_route"]
        
        # Find public route
        public_routes = [r for r in routes.values() if "gateway_id" in r]
        assert len(public_routes) == 1
        assert public_routes[0]["destination_cidr_block"] == "0.0.0.0/0"

    def test_private_routes_to_nat(self):
        """Test private routes go to NAT gateways."""
        routes = self.resources["aws_route"]
        
        # Find private routes (to NAT)
        private_routes = [r for r in routes.values() if "nat_gateway_id" in r]
        assert len(private_routes) == 2
        for route in private_routes:
            assert route["destination_cidr_block"] == "0.0.0.0/0"

    def test_route_table_associations(self):
        """Test route table associations are created."""
        assert "aws_route_table_association" in self.resources
        associations = self.resources["aws_route_table_association"]
        # 2 public + 2 private subnet associations
        assert len(associations) == 4


class TestSecurityGroupResources:
    """Test security group resources."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def test_security_group_created(self):
        """Test that security group is created."""
        assert "aws_security_group" in self.resources
        sgs = self.resources["aws_security_group"]
        assert len(sgs) == 1
        sg = list(sgs.values())[0]
        assert "ec2-sg" in sg["name"]
        assert sg["description"] == "Security group for EC2 instances"

    def test_security_group_rules_created(self):
        """Test that security group rules are created."""
        assert "aws_security_group_rule" in self.resources
        rules = self.resources["aws_security_group_rule"]
        assert len(rules) == 2  # SSH ingress + all egress

    def test_ssh_ingress_rule(self):
        """Test SSH ingress rule configuration."""
        rules = self.resources["aws_security_group_rule"]
        ssh_rules = [r for r in rules.values() if r.get("from_port") == 22]
        assert len(ssh_rules) == 1
        
        ssh_rule = ssh_rules[0]
        assert ssh_rule["type"] == "ingress"
        assert ssh_rule["to_port"] == 22
        assert ssh_rule["protocol"] == "tcp"
        # SSH should be restricted to specific CIDR
        assert "203.0.113.0/24" in ssh_rule["cidr_blocks"]

    def test_egress_rule(self):
        """Test egress rule allows all outbound."""
        rules = self.resources["aws_security_group_rule"]
        egress_rules = [r for r in rules.values() if r.get("type") == "egress"]
        assert len(egress_rules) == 1
        
        egress = egress_rules[0]
        assert egress["from_port"] == 0
        assert egress["to_port"] == 0
        assert egress["protocol"] == "-1"
        assert "0.0.0.0/0" in egress["cidr_blocks"]


class TestS3Resources:
    """Test S3 bucket resources (only in non-LocalStack mode)."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures - ensure NOT in LocalStack mode."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def test_s3_bucket_created(self):
        """Test that S3 bucket is created in non-LocalStack mode."""
        assert "aws_s3_bucket" in self.resources
        buckets = self.resources["aws_s3_bucket"]
        assert len(buckets) == 1

    def test_s3_bucket_configuration(self):
        """Test S3 bucket has correct configuration."""
        bucket = list(self.resources["aws_s3_bucket"].values())[0]
        assert "logs-bucket-test" in bucket["bucket"]
        assert bucket["force_destroy"] is True
        assert bucket["tags"]["Environment"] == "Production"


class TestLocalStackMode:
    """Test LocalStack-specific behavior."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures in LocalStack mode."""
        os.environ["AWS_ENDPOINT_URL"] = "http://localhost:4566"
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def teardown_method(self):
        """Clean up environment."""
        os.environ.pop("AWS_ENDPOINT_URL", None)

    def test_s3_bucket_not_created_in_localstack(self):
        """Test that S3 bucket is NOT created in LocalStack mode."""
        # S3 bucket should be skipped due to S3 Control API issues
        assert "aws_s3_bucket" not in self.resources

    def test_provider_has_localstack_config(self):
        """Test that AWS provider has LocalStack configuration."""
        provider = self.config["provider"]["aws"][0]
        assert provider["skip_credentials_validation"] is True
        assert provider["skip_requesting_account_id"] is True
        assert provider["s3_use_path_style"] is True

    def test_vpc_still_created_in_localstack(self):
        """Test that VPC is still created in LocalStack mode."""
        assert "aws_vpc" in self.resources
        assert len(self.resources["aws_vpc"]) == 1


class TestOutputs:
    """Test Terraform outputs."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.outputs = self.config.get("output", {})

    def test_vpc_id_output(self):
        """Test VPC ID output is defined."""
        assert "vpc_id" in self.outputs
        assert "value" in self.outputs["vpc_id"]

    def test_vpc_alternate_output(self):
        """Test VPC alternate name output is defined."""
        assert "VPC" in self.outputs
        assert "value" in self.outputs["VPC"]

    def test_vpc_cidr_output(self):
        """Test VPC CIDR output is defined."""
        assert "VPCCIDR" in self.outputs
        assert self.outputs["VPCCIDR"]["value"] == "10.0.0.0/16"

    def test_public_subnet_ids_output(self):
        """Test public subnet IDs output is defined."""
        assert "public_subnet_ids" in self.outputs
        assert "value" in self.outputs["public_subnet_ids"]

    def test_private_subnet_ids_output(self):
        """Test private subnet IDs output is defined."""
        assert "private_subnet_ids" in self.outputs
        assert "value" in self.outputs["private_subnet_ids"]

    def test_individual_subnet_outputs(self):
        """Test individual subnet outputs are defined."""
        assert "PublicSubnet1" in self.outputs
        assert "PublicSubnet2" in self.outputs
        assert "PrivateSubnet1" in self.outputs
        assert "PrivateSubnet2" in self.outputs

    def test_internet_gateway_output(self):
        """Test Internet Gateway output is defined."""
        assert "InternetGateway" in self.outputs
        assert "value" in self.outputs["InternetGateway"]

    def test_nat_gateway_outputs(self):
        """Test NAT Gateway outputs are defined."""
        assert "NatGateway1" in self.outputs
        assert "NatGateway2" in self.outputs

    def test_route_table_output(self):
        """Test route table output is defined."""
        assert "PublicRouteTable" in self.outputs
        assert "value" in self.outputs["PublicRouteTable"]

    def test_security_group_output(self):
        """Test security group output is defined."""
        assert "SecurityGroup" in self.outputs
        assert "value" in self.outputs["SecurityGroup"]

    def test_environment_suffix_output(self):
        """Test environment suffix output is defined."""
        assert "EnvironmentSuffix" in self.outputs
        assert self.outputs["EnvironmentSuffix"]["value"] == "test"

    def test_region_output(self):
        """Test AWS region output is defined."""
        assert "AWSRegion" in self.outputs
        assert self.outputs["AWSRegion"]["value"] == "us-east-1"

    def test_availability_zone_outputs(self):
        """Test AZ outputs are defined."""
        assert "AvailabilityZone1" in self.outputs
        assert "AvailabilityZone2" in self.outputs
        assert self.outputs["AvailabilityZone1"]["value"] == "us-east-1a"
        assert self.outputs["AvailabilityZone2"]["value"] == "us-east-1b"

    def test_s3_bucket_output(self):
        """Test S3 bucket output is defined (non-LocalStack mode)."""
        assert "s3_logs_bucket_name" in self.outputs
        assert "value" in self.outputs["s3_logs_bucket_name"]


class TestEnvironmentSuffix:
    """Test environment suffix parameter handling."""

    def test_default_environment_suffix(self):
        """Test default environment suffix is 'dev'."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        app = App()
        stack = TapStack(app, "test-stack")
        synth = Testing.synth(stack)
        config = json.loads(synth)
        
        vpc = list(config["resource"]["aws_vpc"].values())[0]
        assert "dev" in vpc["tags"]["Name"]

    def test_custom_environment_suffix(self):
        """Test custom environment suffix is applied."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        app = App()
        stack = TapStack(app, "test-stack", environment_suffix="prod")
        synth = Testing.synth(stack)
        config = json.loads(synth)
        
        vpc = list(config["resource"]["aws_vpc"].values())[0]
        assert "prod" in vpc["tags"]["Name"]


class TestHighAvailability:
    """Test high availability architecture."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        os.environ.pop("AWS_ENDPOINT_URL", None)
        self.app = App()
        self.stack = TapStack(self.app, "test-stack", environment_suffix="test")
        self.synth = Testing.synth(self.stack)
        self.config = json.loads(self.synth)
        self.resources = self.config.get("resource", {})

    def test_multi_az_deployment(self):
        """Test resources are deployed across multiple AZs."""
        subnets = self.resources["aws_subnet"]
        azs = set(s["availability_zone"] for s in subnets.values())
        assert len(azs) == 2

    def test_nat_gateway_per_az(self):
        """Test each AZ has its own NAT Gateway."""
        nat_gws = self.resources["aws_nat_gateway"]
        assert len(nat_gws) == 2

    def test_private_route_table_per_az(self):
        """Test each private subnet has its own route table."""
        route_tables = self.resources["aws_route_table"]
        private_rts = {k: v for k, v in route_tables.items() if "private" in k}
        assert len(private_rts) == 2

