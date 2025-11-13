
"""Integration tests for TAP Stack VPC infrastructure."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:  # pragma: no cover - boto3 not available locally
    boto3 = None

REQUIRED_OUTPUT_KEYS = [
    "vpc_id",
    "public_subnet_1_id",
    "public_subnet_2_id",
    "private_subnet_1_id",
    "private_subnet_2_id",
    "internet_gateway_id",
    "nat_gateway_id",
    "s3_endpoint_id",
    "dynamodb_endpoint_id",
    "flow_log_id",
    "flow_log_group_name",
    "vpc_cidr",
]

# Read AWS_REGION from environment variable
AWS_REGION = os.getenv("AWS_REGION", "eu-central-2")

# Read ENVIRONMENT_SUFFIX from environment variable
ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Construct stack name: TapStack<ENVIRONMENT_SUFFIX>
STACK_NAME = f"TapStack{ENVIRONMENT_SUFFIX}"


def _has_aws_credentials() -> bool:
    """Return True when AWS credentials appear to be configured."""
    credential_keys = {
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_SESSION_TOKEN",
        "AWS_PROFILE",
        "AWS_DEFAULT_PROFILE",
        "AWS_WEB_IDENTITY_TOKEN_FILE",
    }
    return any(os.getenv(key) for key in credential_keys)


@pytest.fixture(scope="module")
def outputs():
    """Load stack outputs from cfn-outputs/flat-outputs.json.
    
    Handles nested format (stack name as top-level key) and flat format.
    Uses stack name format: TapStack<ENVIRONMENT_SUFFIX>
    """
    outputs_path = Path("cfn-outputs/flat-outputs.json")
    if not outputs_path.exists():
        pytest.skip("Stack outputs not found. Deploy the stack to run integration tests.")

    with outputs_path.open(encoding="utf-8") as handle:
        data = json.load(handle)

    # Handle nested structure: {"TapStack<ENVIRONMENT_SUFFIX>": {"vpc_id": "...", ...}}
    # Check if data is a dict and has our stack name as a key
    if isinstance(data, dict) and STACK_NAME in data:
        # Extract outputs from the stack with our stack name
        stack_outputs = data[STACK_NAME]
        if not isinstance(stack_outputs, dict):
            pytest.skip(f"Stack outputs for {STACK_NAME} are not in expected format.")
    elif isinstance(data, dict) and data:
        first_value = next(iter(data.values()))
        if isinstance(first_value, dict):
            # Extract outputs from the first (or only) stack in the nested structure
            stack_outputs = first_value
        else:
            # Assume flat structure: {"vpc_id": "...", ...}
            stack_outputs = data
    else:
        # Not a dict, use as-is
        stack_outputs = data

    missing = [key for key in REQUIRED_OUTPUT_KEYS if key not in stack_outputs]
    if missing:
        pytest.skip(f"Outputs missing required keys: {', '.join(missing)}")

    return stack_outputs


@pytest.fixture(scope="module")
def ensure_boto3():
    """Skip tests when boto3 or credentials are unavailable."""
    if boto3 is None:
        pytest.skip("boto3 is not installed; skipping live integration checks")
    if not _has_aws_credentials():
        pytest.skip("AWS credentials not configured; skipping live integration checks")
    return True


@pytest.fixture(scope="module")
def ec2_client(ensure_boto3):  # pylint: disable=unused-argument
    return boto3.client("ec2", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def logs_client(ensure_boto3):  # pylint: disable=unused-argument
    return boto3.client("logs", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def iam_client(ensure_boto3):  # pylint: disable=unused-argument
    return boto3.client("iam", region_name=AWS_REGION)


class TestTapStackIntegration:
    """Integration checks against live AWS resources."""

    def test_vpc_exists(self, outputs, ec2_client):
        """Test that VPC exists with correct configuration."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        assert vpc["State"] == "available"
        assert vpc["CidrBlock"] == outputs.get("vpc_cidr", "10.0.0.0/16")

    def test_subnets_exist(self, outputs, ec2_client):
        """Test that all subnets exist with correct configuration."""
        subnet_ids = [
            outputs["public_subnet_1_id"],
            outputs["public_subnet_2_id"],
            outputs["private_subnet_1_id"],
            outputs["private_subnet_2_id"],
        ]
        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response["Subnets"]) == 4
        cidrs = {subnet["CidrBlock"] for subnet in response["Subnets"]}
        assert cidrs == {"10.0.1.0/24", "10.0.2.0/24", "10.0.11.0/24", "10.0.12.0/24"}

    def test_subnet_availability_zones(self, outputs, ec2_client):
        """Test that subnets are distributed across multiple availability zones."""
        subnet_ids = [
            outputs["public_subnet_1_id"],
            outputs["public_subnet_2_id"],
            outputs["private_subnet_1_id"],
            outputs["private_subnet_2_id"],
        ]
        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        azs = {subnet["AvailabilityZone"] for subnet in response["Subnets"]}
        assert len(azs) >= 2, "Subnets should be in at least 2 availability zones"

    def test_public_subnets_auto_assign_ip(self, outputs, ec2_client):
        """Test that public subnets have auto-assign public IP enabled."""
        public_subnet_ids = [
            outputs["public_subnet_1_id"],
            outputs["public_subnet_2_id"],
        ]
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["MapPublicIpOnLaunch"] is True

    def test_private_subnets_no_auto_assign_ip(self, outputs, ec2_client):
        """Test that private subnets do not have auto-assign public IP enabled."""
        private_subnet_ids = [
            outputs["private_subnet_1_id"],
            outputs["private_subnet_2_id"],
        ]
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["MapPublicIpOnLaunch"] is False

    def test_nat_gateway_elastic_ip(self, outputs, ec2_client):
        """Test that NAT Gateway has an associated Elastic IP."""
        nat_gw_id = outputs["nat_gateway_id"]
        response = ec2_client.describe_nat_gateways(NatGatewayIds=[nat_gw_id])
        nat_gw = response["NatGateways"][0]
        assert "NatGatewayAddresses" in nat_gw
        assert len(nat_gw["NatGatewayAddresses"]) > 0
        allocation_id = nat_gw["NatGatewayAddresses"][0].get("AllocationId")
        if allocation_id:
            eip_response = ec2_client.describe_addresses(AllocationIds=[allocation_id])
            assert len(eip_response["Addresses"]) == 1
            eip = eip_response["Addresses"][0]
            assert eip["Domain"] == "vpc"

    def test_route_tables_exist(self, outputs, ec2_client):
        """Test that route tables exist and are properly configured."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_route_tables(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        assert len(response["RouteTables"]) >= 2
        # Should have at least one public and one private route table
        route_tables = response["RouteTables"]
        has_public_route = False
        has_private_route = False
        for rt in route_tables:
            for route in rt.get("Routes", []):
                if route.get("GatewayId") and route.get("GatewayId") == outputs["internet_gateway_id"]:
                    has_public_route = True
                if route.get("NatGatewayId") and route.get("NatGatewayId") == outputs["nat_gateway_id"]:
                    has_private_route = True
        assert has_public_route, "Public route table should route through Internet Gateway"
        assert has_private_route, "Private route table should route through NAT Gateway"

    def test_subnet_route_table_associations(self, outputs, ec2_client):
        """Test that subnets are properly associated with route tables."""
        vpc_id = outputs["vpc_id"]
        subnet_ids = [
            outputs["public_subnet_1_id"],
            outputs["public_subnet_2_id"],
            outputs["private_subnet_1_id"],
            outputs["private_subnet_2_id"],
        ]
        response = ec2_client.describe_route_tables(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        associated_subnet_ids = set()
        for rt in response["RouteTables"]:
            for association in rt.get("Associations", []):
                if association.get("SubnetId"):
                    associated_subnet_ids.add(association["SubnetId"])
        for subnet_id in subnet_ids:
            assert subnet_id in associated_subnet_ids, f"Subnet {subnet_id} should be associated with a route table"

    def test_flow_logs_enabled(self, outputs, ec2_client, logs_client):
        """Test that VPC Flow Logs are enabled and configured correctly."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_flow_logs(Filters=[{"Name": "resource-id", "Values": [vpc_id]}])
        assert response["FlowLogs"], "No VPC flow logs found"

        flow_log = response["FlowLogs"][0]
        assert flow_log["TrafficType"] == "ALL"
        assert flow_log["LogDestinationType"] == "cloud-watch-logs"
        assert flow_log["FlowLogStatus"] == "ACTIVE"

        # Use flow_log_group_name if available, otherwise fall back to flow_log_id
        log_group_name = outputs.get("flow_log_group_name") or outputs.get("flow_log_id")
        try:
            log_groups_response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            assert len(log_groups_response["logGroups"]) > 0
            log_group = log_groups_response["logGroups"][0]
            assert log_group["logGroupName"] == outputs.get("flow_log_group_name", log_group_name)
        except ClientError as exc:  # pragma: no cover - network failure scenario
            pytest.fail(f"Failed to locate CloudWatch log group {log_group_name}: {exc}")

    def test_flow_logs_iam_role(self, outputs, ec2_client, iam_client):
        """Test that Flow Logs IAM role exists and is properly configured."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_flow_logs(Filters=[{"Name": "resource-id", "Values": [vpc_id]}])
        flow_log = response["FlowLogs"][0]
        if "DeliverLogsPermissionArn" in flow_log:
            role_arn = flow_log["DeliverLogsPermissionArn"]
            role_name = role_arn.split("/")[-1]
            try:
                role_response = iam_client.get_role(RoleName=role_name)
                assert role_response["Role"]["RoleName"] == role_name
                assert "vpc-flow-logs" in role_name.lower()
            except ClientError:
                pytest.skip(f"Unable to verify IAM role {role_name} (may require additional permissions)")

    def test_gateway_endpoints_exist(self, outputs, ec2_client):
        """Test that VPC Gateway Endpoints (S3 and DynamoDB) exist."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_vpc_endpoints(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        endpoints = response["VpcEndpoints"]
        assert len(endpoints) >= 2, "Should have at least S3 and DynamoDB endpoints"
        
        services = {endpoint["ServiceName"] for endpoint in endpoints}
        expected_services = {
            f"com.amazonaws.{AWS_REGION}.s3",
            f"com.amazonaws.{AWS_REGION}.dynamodb",
        }
        assert expected_services.issubset(services), f"Missing expected services. Found: {services}, Expected subset: {expected_services}"

    def test_s3_endpoint_configuration(self, outputs, ec2_client):
        """Test that S3 VPC Endpoint is properly configured."""
        vpc_id = outputs["vpc_id"]
        s3_endpoint_id = outputs["s3_endpoint_id"]
        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[s3_endpoint_id])
        assert len(response["VpcEndpoints"]) == 1
        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcId"] == vpc_id
        assert endpoint["VpcEndpointType"] == "Gateway"
        assert endpoint["ServiceName"] == f"com.amazonaws.{AWS_REGION}.s3"
        assert endpoint["State"] == "available"

    def test_dynamodb_endpoint_configuration(self, outputs, ec2_client):
        """Test that DynamoDB VPC Endpoint is properly configured."""
        vpc_id = outputs["vpc_id"]
        dynamodb_endpoint_id = outputs["dynamodb_endpoint_id"]
        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[dynamodb_endpoint_id])
        assert len(response["VpcEndpoints"]) == 1
        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcId"] == vpc_id
        assert endpoint["VpcEndpointType"] == "Gateway"
        assert endpoint["ServiceName"] == f"com.amazonaws.{AWS_REGION}.dynamodb"
        assert endpoint["State"] == "available"

    def test_endpoint_route_tables(self, outputs, ec2_client):
        """Test that VPC Endpoints are associated with route tables."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_vpc_endpoints(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        endpoints = response["VpcEndpoints"]
        for endpoint in endpoints:
            assert len(endpoint.get("RouteTableIds", [])) > 0, f"Endpoint {endpoint['VpcEndpointId']} should be associated with route tables"

    def test_vpc_cidr_block(self, outputs, ec2_client):
        """Test that VPC CIDR block matches expected value."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        if "vpc_cidr" in outputs:
            assert vpc["CidrBlock"] == outputs["vpc_cidr"]

    def test_cloudwatch_log_group_retention(self, outputs, logs_client):
        """Test that CloudWatch Log Group has retention configured."""
        log_group_name = outputs.get("flow_log_group_name")
        if not log_group_name:
            pytest.skip("flow_log_group_name not available in outputs")
        try:
            response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            assert len(response["logGroups"]) > 0
            log_group = response["logGroups"][0]
            # Retention should be configured (7 days as per stack configuration)
            assert "retentionInDays" in log_group, "Log group should have retention configured"
            assert log_group["retentionInDays"] == 7
        except ClientError as exc:
            pytest.skip(f"Unable to verify log group retention: {exc}")

    def test_nat_gateway_in_public_subnet(self, outputs, ec2_client):
        """Test that NAT Gateway is in a public subnet."""
        nat_gw_id = outputs["nat_gateway_id"]
        response = ec2_client.describe_nat_gateways(NatGatewayIds=[nat_gw_id])
        nat_gw = response["NatGateways"][0]
        nat_subnet_id = nat_gw["SubnetId"]
        assert nat_subnet_id in [
            outputs["public_subnet_1_id"],
            outputs["public_subnet_2_id"],
        ], "NAT Gateway should be in a public subnet"

    def test_vpc_tags(self, outputs, ec2_client):
        """Test that VPC has expected tags."""
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        assert "Name" in tags, "VPC should have a Name tag"
        assert ENVIRONMENT_SUFFIX in tags.get("Name", ""), "VPC Name tag should include environment suffix"
