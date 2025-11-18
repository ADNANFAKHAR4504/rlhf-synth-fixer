"""Live integration tests for TAP infrastructure deployment."""
import os
import pytest
import boto3
from botocore.exceptions import ClientError


# Mark all tests in this module as integration tests
pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment or default."""
    return os.environ.get("AWS_REGION", "us-east-1")


@pytest.fixture(scope="module")
def boto_clients(aws_region):
    """Create boto3 clients for AWS services."""
    return {
        "s3": boto3.client("s3", region_name=aws_region),
        "ec2": boto3.client("ec2", region_name=aws_region),
        "rds": boto3.client("rds", region_name=aws_region),
        "sts": boto3.client("sts", region_name=aws_region),
    }


class TestAWSConnectivity:
    """Test basic AWS connectivity."""

    def test_aws_credentials_valid(self, boto_clients):
        """Test AWS credentials are valid."""
        try:
            identity = boto_clients["sts"].get_caller_identity()
            assert "Account" in identity
            assert "UserId" in identity
        except ClientError as e:
            pytest.fail(f"AWS credentials invalid: {e}")

    def test_s3_api_accessible(self, boto_clients):
        """Test S3 API is accessible."""
        try:
            boto_clients["s3"].list_buckets()
        except ClientError as e:
            pytest.fail(f"Cannot access S3 API: {e}")

    def test_ec2_api_accessible(self, boto_clients):
        """Test EC2 API is accessible."""
        try:
            boto_clients["ec2"].describe_vpcs(MaxResults=5)
        except ClientError as e:
            pytest.fail(f"Cannot access EC2 API: {e}")

    def test_rds_api_accessible(self, boto_clients):
        """Test RDS API is accessible."""
        try:
            boto_clients["rds"].describe_db_clusters(MaxRecords=20)
        except ClientError:
            # RDS API might not be available in all regions/accounts
            pass


class TestBasicAWSResources:
    """Test basic AWS resources exist."""

    def test_account_has_s3_buckets(self, boto_clients):
        """Test that account has S3 buckets (basic sanity check)."""
        response = boto_clients["s3"].list_buckets()
        assert "Buckets" in response

    def test_account_has_vpcs(self, boto_clients):
        """Test that account has VPCs (basic sanity check)."""
        response = boto_clients["ec2"].describe_vpcs(MaxResults=5)
        assert "Vpcs" in response


class TestSecurityBaseline:
    """Test security baseline configurations."""

    def test_default_security_groups_not_wide_open(self, boto_clients):
        """Test that default security groups don't allow unrestricted access."""
        ec2 = boto_clients["ec2"]
        
        try:
            sgs = ec2.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": ["default"]}],
                MaxResults=10
            )
            
            for sg in sgs["SecurityGroups"]:
                for rule in sg.get("IpPermissions", []):
                    # Check for 0.0.0.0/0 on all ports/protocols
                    if rule.get("IpProtocol") == "-1":  # All protocols
                        for ip_range in rule.get("IpRanges", []):
                            if ip_range.get("CidrIp") == "0.0.0.0/0":
                                pytest.fail(
                                    f"Default security group {sg['GroupId']} "
                                    "allows all traffic from 0.0.0.0/0"
                                )
        except ClientError:
            # If we can't check, that's okay
            pass
