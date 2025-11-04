
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
]

AWS_REGION = "ca-central-1"


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
    """Load stack outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = Path("cfn-outputs/flat-outputs.json")
    if not outputs_path.exists():
        pytest.skip("Stack outputs not found. Deploy the stack to run integration tests.")

    with outputs_path.open(encoding="utf-8") as handle:
        data = json.load(handle)

    missing = [key for key in REQUIRED_OUTPUT_KEYS if key not in data]
    if missing:
        pytest.skip(f"Outputs missing required keys: {', '.join(missing)}")

    return data


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


class TestTapStackIntegration:
    """Integration checks against live AWS resources."""

    def test_vpc_exists(self, outputs, ec2_client):
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        assert vpc["State"] == "available"

    def test_subnets_exist(self, outputs, ec2_client):
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

    def test_flow_logs_enabled(self, outputs, ec2_client, logs_client):
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_flow_logs(Filters=[{"Name": "resource-id", "Values": [vpc_id]}])
        assert response["FlowLogs"], "No VPC flow logs found"

        flow_log = response["FlowLogs"][0]
        assert flow_log["TrafficType"] == "ALL"
        assert flow_log["LogDestinationType"] == "cloud-watch-logs"

        log_group_name = outputs["flow_log_id"]
        try:
            logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        except ClientError as exc:  # pragma: no cover - network failure scenario
            pytest.fail(f"Failed to locate CloudWatch log group {log_group_name}: {exc}")

    def test_gateway_endpoints_exist(self, outputs, ec2_client):
        vpc_id = outputs["vpc_id"]
        response = ec2_client.describe_vpc_endpoints(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        services = {endpoint["ServiceName"] for endpoint in response["VpcEndpoints"]}
        expected_services = {
            f"com.amazonaws.{AWS_REGION}.s3",
            f"com.amazonaws.{AWS_REGION}.dynamodb",
        }
        assert expected_services.issubset(services)
