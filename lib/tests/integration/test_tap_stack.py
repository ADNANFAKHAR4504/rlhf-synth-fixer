"""Integration tests for TAP Stack VPC infrastructure."""

import json
import os

import boto3
import pytest
from botocore.exceptions import ClientError

from tests.test_constants import REQUIRED_OUTPUTS


class TestTapStackIntegration:
    """Integration tests for deployed VPC infrastructure."""

    @pytest.fixture
    def outputs(self):
        """Load stack outputs from cfn-outputs/flat-outputs.json."""
        outputs_path = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_path):
            pytest.skip("Stack outputs not found. Stack may not be deployed.")

        with open(outputs_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @pytest.fixture
    def ec2_client(self):
        """Create EC2 client for ca-central-1."""
        return boto3.client("ec2", region_name="ca-central-1")

    @pytest.fixture
    def logs_client(self):
        """Create CloudWatch Logs client for ca-central-1."""
        return boto3.client("logs", region_name="ca-central-1")

    @pytest.fixture
    def iam_client(self):
        """Create IAM client."""
        return boto3.client("iam", region_name="ca-central-1")

    def test_vpc_exists(self, outputs, ec2_client):
        """Test that VPC exists and has correct configuration."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1

        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        assert vpc["State"] == "available"
        assert vpc["EnableDnsHostnames"] is True
        assert vpc["EnableDnsSupport"] is True

    def test_vpc_tags(self, outputs, ec2_client):
        """Test that VPC has correct tags."""
        vpc_id = outputs.get("vpc_id")

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

        assert tags.get("Environment") == "development"
        assert tags.get("CostCenter") == "engineering"

    def test_subnets_exist(self, outputs, ec2_client):
        """Test that all 4 subnets exist with correct configuration."""
        subnet_ids = [
            outputs.get("public_subnet_1_id"),
            outputs.get("public_subnet_2_id"),
            outputs.get("private_subnet_1_id"),
            outputs.get("private_subnet_2_id"),
        ]

        for subnet_id in subnet_ids:
            assert subnet_id is not None, "Subnet ID not found in outputs"

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response["Subnets"]) == 4

        cidrs = [subnet["CidrBlock"] for subnet in response["Subnets"]]
        assert "10.0.1.0/24" in cidrs
        assert "10.0.2.0/24" in cidrs
        assert "10.0.11.0/24" in cidrs
        assert "10.0.12.0/24" in cidrs

    def test_subnets_in_correct_azs(self, outputs, ec2_client):
        """Test that subnets are in ca-central-1a and ca-central-1b."""
        subnet_ids = [
            outputs.get("public_subnet_1_id"),
            outputs.get("public_subnet_2_id"),
            outputs.get("private_subnet_1_id"),
            outputs.get("private_subnet_2_id"),
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        azs = [subnet["AvailabilityZone"] for subnet in response["Subnets"]]

        assert "ca-central-1a" in azs
        assert "ca-central-1b" in azs

    def test_public_subnets_map_public_ip(self, outputs, ec2_client):
        """Test that public subnets have MapPublicIpOnLaunch enabled."""
        public_subnet_ids = [
            outputs.get("public_subnet_1_id"),
            outputs.get("public_subnet_2_id"),
        ]

        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        for subnet in response["Subnets"]:
            assert subnet["MapPublicIpOnLaunch"] is True

    def test_internet_gateway_exists(self, outputs, ec2_client):
        """Test that Internet Gateway exists and is attached to VPC."""
        igw_id = outputs.get("internet_gateway_id")
        vpc_id = outputs.get("vpc_id")

        assert igw_id is not None, "Internet Gateway ID not found in outputs"

        response = ec2_client.describe_internet_gateways(InternetGatewayIds=[igw_id])
        assert len(response["InternetGateways"]) == 1

        igw = response["InternetGateways"][0]
        attachments = igw.get("Attachments", [])
        assert len(attachments) == 1
        assert attachments[0]["VpcId"] == vpc_id
        assert attachments[0]["State"] == "available"

    def test_nat_gateway_exists(self, outputs, ec2_client):
        """Test that single NAT Gateway exists and is available."""
        nat_gateway_id = outputs.get("nat_gateway_id")
        assert nat_gateway_id is not None, "NAT Gateway ID not found in outputs"

        response = ec2_client.describe_nat_gateways(NatGatewayIds=[nat_gateway_id])
        assert len(response["NatGateways"]) == 1

        nat_gateway = response["NatGateways"][0]
        assert nat_gateway["State"] == "available"

        # Verify it's in the first public subnet
        public_subnet_1_id = outputs.get("public_subnet_1_id")
        assert nat_gateway["SubnetId"] == public_subnet_1_id

    def test_route_tables_exist(self, outputs, ec2_client):
        """Test that custom route tables exist with correct routes."""
        vpc_id = outputs.get("vpc_id")

        response = ec2_client.describe_route_tables(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Should have 3 route tables: main (default) + public + private
        assert len(response["RouteTables"]) >= 2

        igw_id = outputs.get("internet_gateway_id")
        nat_gateway_id = outputs.get("nat_gateway_id")

        public_rt_found = False
        private_rt_found = False

        for rt in response["RouteTables"]:
            routes = rt["Routes"]

            # Check for IGW route (public)
            for route in routes:
                if (route.get("GatewayId") == igw_id and
                        route.get("DestinationCidrBlock") == "0.0.0.0/0"):
                    public_rt_found = True

            # Check for NAT Gateway route (private)
            for route in routes:
                if (route.get("NatGatewayId") == nat_gateway_id and
                        route.get("DestinationCidrBlock") == "0.0.0.0/0"):
                    private_rt_found = True

        assert public_rt_found, "Public route table with IGW route not found"
        assert private_rt_found, "Private route table with NAT Gateway route not found"

    def test_vpc_flow_logs_enabled(self, outputs, ec2_client):
        """Test that VPC Flow Logs are enabled."""
        vpc_id = outputs.get("vpc_id")

        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        assert len(response["FlowLogs"]) > 0

        flow_log = response["FlowLogs"][0]
        assert flow_log["TrafficType"] == "ALL"
        assert flow_log["LogDestinationType"] == "cloud-watch-logs"
        assert flow_log["MaxAggregationInterval"] == 300  # 5 minutes

    def test_cloudwatch_log_group_exists(self, outputs, logs_client):
        """Test that CloudWatch Log Group for Flow Logs exists."""
        log_group_name = outputs.get("flow_log_id")
        assert log_group_name is not None, "Flow Log ID not found in outputs"

        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            assert len(response["logGroups"]) == 1

            log_group = response["logGroups"][0]
            assert log_group["retentionInDays"] == 7
        except ClientError as e:
            pytest.fail(f"CloudWatch Log Group not found: {e}")

    def test_vpc_endpoints_exist(self, outputs, ec2_client):
        """Test that VPC endpoints for S3 and DynamoDB exist."""
        s3_endpoint_id = outputs.get("s3_endpoint_id")
        dynamodb_endpoint_id = outputs.get("dynamodb_endpoint_id")

        assert s3_endpoint_id is not None, "S3 endpoint ID not found in outputs"
        assert dynamodb_endpoint_id is not None, "DynamoDB endpoint ID not found in outputs"

        response = ec2_client.describe_vpc_endpoints(
            VpcEndpointIds=[s3_endpoint_id, dynamodb_endpoint_id]
        )

        assert len(response["VpcEndpoints"]) == 2

        for endpoint in response["VpcEndpoints"]:
            assert endpoint["State"] == "available"
            assert endpoint["VpcEndpointType"] == "Gateway"

            # Check service names
            service_name = endpoint["ServiceName"]
            assert "s3" in service_name or "dynamodb" in service_name

    def test_resource_tags_consistency(self, outputs, ec2_client):
        """Test that all resources have consistent tags."""
        vpc_id = outputs.get("vpc_id")
        subnet_ids = [
            outputs.get("public_subnet_1_id"),
            outputs.get("public_subnet_2_id"),
            outputs.get("private_subnet_1_id"),
            outputs.get("private_subnet_2_id"),
        ]

        # Check VPC tags
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag["Key"]: tag["Value"] for tag in response["Vpcs"][0].get("Tags", [])}
        assert vpc_tags.get("Environment") == "development"
        assert vpc_tags.get("CostCenter") == "engineering"

        # Check subnet tags
        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        for subnet in response["Subnets"]:
            tags = {tag["Key"]: tag["Value"] for tag in subnet.get("Tags", [])}
            assert tags.get("Environment") == "development"
            assert tags.get("CostCenter") == "engineering"

    def test_network_connectivity_setup(self, outputs, ec2_client):
        """Test that network connectivity is properly configured."""
        # vpc_id = outputs.get("vpc_id")  # Not used in this test
        public_subnet_1_id = outputs.get("public_subnet_1_id")
        private_subnet_1_id = outputs.get("private_subnet_1_id")

        # Verify public subnet has route to IGW
        response = ec2_client.describe_route_tables(
            Filters=[
                {"Name": "association.subnet-id", "Values": [public_subnet_1_id]}
            ]
        )

        if len(response["RouteTables"]) > 0:
            routes = response["RouteTables"][0]["Routes"]
            has_igw_route = any(
                route.get("GatewayId", "").startswith("igw-") and
                route.get("DestinationCidrBlock") == "0.0.0.0/0"
                for route in routes
            )
            assert has_igw_route, "Public subnet missing IGW route"

        # Verify private subnet has route to NAT Gateway
        response = ec2_client.describe_route_tables(
            Filters=[
                {"Name": "association.subnet-id", "Values": [private_subnet_1_id]}
            ]
        )

        if len(response["RouteTables"]) > 0:
            routes = response["RouteTables"][0]["Routes"]
            has_nat_route = any(
                route.get("NatGatewayId", "").startswith("nat-") and
                route.get("DestinationCidrBlock") == "0.0.0.0/0"
                for route in routes
            )
            assert has_nat_route, "Private subnet missing NAT Gateway route"

    def test_vpc_cidr_block_output(self, outputs):
        """Test that VPC CIDR block is correctly output."""
        vpc_cidr = outputs.get("vpc_cidr")
        assert vpc_cidr == "10.0.0.0/16"

    def test_all_required_outputs_present(self, outputs):
        """Test that all required outputs are present."""
        required_outputs = REQUIRED_OUTPUTS

        for output in required_outputs:
            assert output in outputs, f"Required output '{output}' not found"
            assert outputs[output] is not None, f"Output '{output}' is None"
