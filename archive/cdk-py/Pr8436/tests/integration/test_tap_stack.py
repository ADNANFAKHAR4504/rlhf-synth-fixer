"""
Integration tests for TapStack against LocalStack.
"""
import os
import boto3
import pytest


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS clients configured for LocalStack."""
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")

    return {
        "s3": boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "ec2": boto3.client(
            "ec2",
            endpoint_url=endpoint_url,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "elbv2": boto3.client(
            "elbv2",
            endpoint_url=endpoint_url,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "autoscaling": boto3.client(
            "autoscaling",
            endpoint_url=endpoint_url,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "iam": boto3.client(
            "iam",
            endpoint_url=endpoint_url,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
    }


def test_s3_bucket_exists(aws_clients):
    """Test that S3 bucket is created and accessible."""
    s3_client = aws_clients["s3"]

    # List all buckets
    response = s3_client.list_buckets()
    buckets = response.get("Buckets", [])

    # Verify at least one bucket exists
    assert len(buckets) > 0, "No S3 buckets found"

    # Check for bucket with expected naming pattern
    bucket_names = [bucket["Name"] for bucket in buckets]
    assert any(
        "applogsbucket" in name.lower() for name in bucket_names
    ), "Expected log bucket not found"


def test_vpc_exists(aws_clients):
    """Test that VPC is created."""
    ec2_client = aws_clients["ec2"]

    # Describe VPCs
    response = ec2_client.describe_vpcs()
    vpcs = response.get("Vpcs", [])

    # Verify at least one VPC exists (including default VPC)
    assert len(vpcs) > 0, "No VPCs found"


def test_security_group_exists(aws_clients):
    """Test that security group is created."""
    ec2_client = aws_clients["ec2"]

    # Describe security groups
    response = ec2_client.describe_security_groups()
    security_groups = response.get("SecurityGroups", [])

    # Verify at least one security group exists
    assert len(security_groups) > 0, "No security groups found"


def test_iam_role_exists(aws_clients):
    """Test that IAM role is created."""
    iam_client = aws_clients["iam"]

    # List IAM roles
    response = iam_client.list_roles()
    roles = response.get("Roles", [])

    # Check for role with expected naming pattern
    role_names = [role["RoleName"] for role in roles]
    assert any(
        "ec2role" in name.lower() for name in role_names
    ), "Expected EC2 role not found"
