"""
Integration tests for VPC Stack deployment.

These tests verify actual AWS resources after deployment.
Requires AWS credentials and may incur costs.

Run with: pytest tests/integration/ -v -s
"""
import os
import boto3
import pytest
from typing import Dict, List


# Skip integration tests if not explicitly enabled
pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION_TESTS") != "true",
    reason="Integration tests disabled. Set RUN_INTEGRATION_TESTS=true to run."
)


@pytest.fixture(scope="module")
def environment_suffix():
    """Get environment suffix from environment variable."""
    return os.getenv("ENVIRONMENT_SUFFIX", "test")


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment variable."""
    return os.getenv("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client for testing."""
    return boto3.client("ec2", region_name=aws_region)


@pytest.fixture(scope="module")
def logs_client(aws_region):
    """Create CloudWatch Logs client for testing."""
    return boto3.client("logs", region_name=aws_region)


@pytest.fixture(scope="module")
def iam_client(aws_region):
    """Create IAM client for testing."""
    return boto3.client("iam", region_name=aws_region)


@pytest.fixture(scope="module")
def vpc_id(ec2_client, environment_suffix):
    """Get VPC ID from stack outputs or tags."""
    # Find VPC by name tag
    response = ec2_client.describe_vpcs(
        Filters=[
            {"Name": "tag:Name", "Values": [f"*payment-vpc-{environment_suffix}*"]}
        ]
    )

    vpcs = response.get("Vpcs", [])
    if not vpcs:
        pytest.skip(f"VPC not found for environment: {environment_suffix}")

    return vpcs[0]["VpcId"]


class TestVpcDeployment:
    """Test suite for VPC deployment verification."""

    def test_vpc_exists(self, ec2_client, vpc_id):
        """Test that VPC exists and is available."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"

    def test_vpc_cidr_block(self, ec2_client, vpc_id):
        """Test that VPC has correct CIDR block."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"

    def test_vpc_dns_settings(self, ec2_client, vpc_id):
        """Test that VPC has DNS support and hostnames enabled."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response["Vpcs"][0]

        # Check DNS support
        dns_support_response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsSupport"
        )
        assert dns_support_response["EnableDnsSupport"]["Value"] is True

        # Check DNS hostnames
        dns_hostnames_response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsHostnames"
        )
        assert dns_hostnames_response["EnableDnsHostnames"]["Value"] is True

    def test_vpc_tags(self, ec2_client, vpc_id):
        """Test that VPC has required tags."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response["Vpcs"][0]
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

        assert "Environment" in tags
        assert tags["Environment"] == "production"
        assert "Project" in tags
        assert tags["Project"] == "payment-platform"


class TestSubnetDeployment:
    """Test suite for subnet deployment verification."""

    def test_subnet_count(self, ec2_client, vpc_id):
        """Test that exactly 9 subnets are created."""
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        assert len(subnets) == 9, f"Expected 9 subnets, found {len(subnets)}"

    def test_availability_zones(self, ec2_client, vpc_id):
        """Test that subnets span exactly 3 availability zones."""
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        azs = set(subnet["AvailabilityZone"] for subnet in response["Subnets"])

        assert len(azs) == 3, f"Expected 3 AZs, found {len(azs)}: {azs}"
        assert azs == {"us-east-1a", "us-east-1b", "us-east-1c"}

    def test_public_subnets(self, ec2_client, vpc_id):
        """Test that 3 public subnets exist with correct configuration."""
        response = ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "map-public-ip-on-launch", "Values": ["true"]}
            ]
        )

        public_subnets = response["Subnets"]
        assert len(public_subnets) == 3, f"Expected 3 public subnets, found {len(public_subnets)}"

        # Verify CIDR blocks
        cidrs = sorted([subnet["CidrBlock"] for subnet in public_subnets])
        assert cidrs == ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

    def test_private_subnets(self, ec2_client, vpc_id):
        """Test that private subnets exist."""
        response = ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "map-public-ip-on-launch", "Values": ["false"]}
            ]
        )

        private_subnets = response["Subnets"]
        # Should have 6 private subnets (3 app + 3 db)
        assert len(private_subnets) == 6, f"Expected 6 private subnets, found {len(private_subnets)}"

    def test_subnet_cidr_mask(self, ec2_client, vpc_id):
        """Test that all subnets use /24 CIDR mask."""
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        for subnet in response["Subnets"]:
            cidr = subnet["CidrBlock"]
            assert cidr.endswith("/24"), f"Subnet has incorrect CIDR: {cidr}"


class TestNatGatewayDeployment:
    """Test suite for NAT Gateway deployment verification."""

    def test_nat_gateway_count(self, ec2_client, vpc_id):
        """Test that exactly 3 NAT Gateways are deployed."""
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        nat_gateways = [ng for ng in response["NatGateways"] if ng["State"] != "deleted"]
        assert len(nat_gateways) == 3, f"Expected 3 NAT Gateways, found {len(nat_gateways)}"

    def test_nat_gateway_status(self, ec2_client, vpc_id):
        """Test that all NAT Gateways are available."""
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        for nat_gateway in response["NatGateways"]:
            if nat_gateway["State"] != "deleted":
                assert nat_gateway["State"] == "available", \
                    f"NAT Gateway {nat_gateway['NatGatewayId']} state: {nat_gateway['State']}"

    def test_nat_gateway_placement(self, ec2_client, vpc_id):
        """Test that NAT Gateways are in public subnets."""
        # Get public subnet IDs
        public_subnets = ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "map-public-ip-on-launch", "Values": ["true"]}
            ]
        )
        public_subnet_ids = set(s["SubnetId"] for s in public_subnets["Subnets"])

        # Get NAT Gateway placements
        nat_gateways = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        for nat_gateway in nat_gateways["NatGateways"]:
            if nat_gateway["State"] != "deleted":
                assert nat_gateway["SubnetId"] in public_subnet_ids, \
                    f"NAT Gateway not in public subnet: {nat_gateway['NatGatewayId']}"

    def test_elastic_ips(self, ec2_client, vpc_id):
        """Test that NAT Gateways have Elastic IPs assigned."""
        nat_gateways = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        for nat_gateway in nat_gateways["NatGateways"]:
            if nat_gateway["State"] != "deleted":
                addresses = nat_gateway.get("NatGatewayAddresses", [])
                assert len(addresses) > 0, \
                    f"NAT Gateway {nat_gateway['NatGatewayId']} has no Elastic IP"


class TestInternetGateway:
    """Test suite for Internet Gateway deployment verification."""

    def test_internet_gateway_exists(self, ec2_client, vpc_id):
        """Test that Internet Gateway exists and is attached."""
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )

        igws = response["InternetGateways"]
        assert len(igws) == 1, f"Expected 1 IGW, found {len(igws)}"

    def test_internet_gateway_attached(self, ec2_client, vpc_id):
        """Test that Internet Gateway is properly attached to VPC."""
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )

        igw = response["InternetGateways"][0]
        attachments = igw.get("Attachments", [])

        assert len(attachments) == 1
        assert attachments[0]["State"] == "available"
        assert attachments[0]["VpcId"] == vpc_id


class TestFlowLogs:
    """Test suite for VPC Flow Logs verification."""

    def test_flow_log_exists(self, ec2_client, vpc_id):
        """Test that VPC Flow Log is configured."""
        response = ec2_client.describe_flow_logs(
            Filters=[
                {"Name": "resource-id", "Values": [vpc_id]},
                {"Name": "resource-type", "Values": ["VPC"]}
            ]
        )

        flow_logs = response["FlowLogs"]
        assert len(flow_logs) >= 1, "No Flow Logs found for VPC"

    def test_flow_log_active(self, ec2_client, vpc_id):
        """Test that VPC Flow Log is active."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        for flow_log in response["FlowLogs"]:
            assert flow_log["FlowLogStatus"] == "ACTIVE", \
                f"Flow Log {flow_log['FlowLogId']} is not active"

    def test_flow_log_traffic_type(self, ec2_client, vpc_id):
        """Test that Flow Log captures all traffic."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        flow_log = response["FlowLogs"][0]
        assert flow_log["TrafficType"] == "ALL"

    def test_flow_log_aggregation_interval(self, ec2_client, vpc_id):
        """Test that Flow Log has correct aggregation interval."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        flow_log = response["FlowLogs"][0]
        interval = flow_log.get("MaxAggregationInterval")

        # AWS only supports 60 or 600 seconds
        assert interval in [60, 600], f"Invalid aggregation interval: {interval}"
        # Per requirements, should be 60 seconds
        assert interval == 60, f"Expected 60 seconds, got {interval}"

    def test_flow_log_destination(self, ec2_client, logs_client, vpc_id):
        """Test that Flow Log is configured to send to CloudWatch."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        flow_log = response["FlowLogs"][0]
        assert flow_log["LogDestinationType"] == "cloud-watch-logs"

        # Verify log group exists
        log_group_name = flow_log["LogGroupName"]
        log_groups = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        assert len(log_groups["logGroups"]) >= 1


class TestRouteTables:
    """Test suite for route table verification."""

    def test_public_subnet_routing(self, ec2_client, vpc_id):
        """Test that public subnets route to Internet Gateway."""
        # Get Internet Gateway
        igw_response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )
        igw_id = igw_response["InternetGateways"][0]["InternetGatewayId"]

        # Get public subnets
        public_subnets = ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "map-public-ip-on-launch", "Values": ["true"]}
            ]
        )

        # Check routing for each public subnet
        for subnet in public_subnets["Subnets"]:
            # Get route table for subnet
            route_tables = ec2_client.describe_route_tables(
                Filters=[
                    {"Name": "association.subnet-id", "Values": [subnet["SubnetId"]]}
                ]
            )

            if not route_tables["RouteTables"]:
                # Check main route table
                route_tables = ec2_client.describe_route_tables(
                    Filters=[
                        {"Name": "vpc-id", "Values": [vpc_id]},
                        {"Name": "association.main", "Values": ["true"]}
                    ]
                )

            route_table = route_tables["RouteTables"][0]

            # Verify route to IGW exists
            routes = route_table["Routes"]
            igw_route = any(
                route.get("GatewayId") == igw_id and route.get("DestinationCidrBlock") == "0.0.0.0/0"
                for route in routes
            )

            assert igw_route, f"Public subnet {subnet['SubnetId']} missing IGW route"

    def test_private_subnet_routing(self, ec2_client, vpc_id):
        """Test that private app subnets route to NAT Gateway."""
        # Get NAT Gateways
        nat_response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nat_ids = set(ng["NatGatewayId"] for ng in nat_response["NatGateways"] if ng["State"] != "deleted")

        # Get all subnets
        all_subnets = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Get private subnets with NAT (not isolated)
        private_app_subnets = []
        for subnet in all_subnets["Subnets"]:
            if not subnet.get("MapPublicIpOnLaunch", False):
                # Check if it has NAT route (not isolated)
                route_tables = ec2_client.describe_route_tables(
                    Filters=[
                        {"Name": "association.subnet-id", "Values": [subnet["SubnetId"]]}
                    ]
                )

                if route_tables["RouteTables"]:
                    routes = route_tables["RouteTables"][0]["Routes"]
                    has_nat = any(
                        route.get("NatGatewayId") in nat_ids
                        for route in routes
                    )
                    if has_nat:
                        private_app_subnets.append(subnet)

        # Should have 3 private app subnets with NAT routing
        assert len(private_app_subnets) == 3, \
            f"Expected 3 private app subnets with NAT, found {len(private_app_subnets)}"
