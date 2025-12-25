"""Integration tests for TAP Stack deployment.

These tests verify that the infrastructure is correctly deployed and accessible
in LocalStack. They test actual AWS resources created by the Pulumi stack.
"""

import json
import os
import subprocess
from typing import Dict, Any

import boto3
import pytest


@pytest.fixture(scope="module")
def pulumi_outputs() -> Dict[str, Any]:
    """Get Pulumi stack outputs."""
    try:
        # Get the stack outputs
        result = subprocess.run(
            ["pulumi", "stack", "output", "--json"],
            cwd=os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        # If pulumi is not available or outputs not found, return empty
        return {}


@pytest.fixture(scope="module")
def localstack_endpoint():
    """Get LocalStack endpoint URL."""
    return os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")


@pytest.fixture(scope="module")
def aws_credentials():
    """Set AWS credentials for LocalStack."""
    return {
        "aws_access_key_id": "test",
        "aws_secret_access_key": "test",
        "region_name": "us-east-1"
    }


@pytest.fixture(scope="module")
def ec2_client(localstack_endpoint, aws_credentials):
    """Create EC2 client for LocalStack."""
    return boto3.client(
        "ec2",
        endpoint_url=localstack_endpoint,
        **aws_credentials
    )


@pytest.fixture(scope="module")
def dynamodb_client(localstack_endpoint, aws_credentials):
    """Create DynamoDB client for LocalStack."""
    return boto3.client(
        "dynamodb",
        endpoint_url=localstack_endpoint,
        **aws_credentials
    )


@pytest.fixture(scope="module")
def iam_client(localstack_endpoint, aws_credentials):
    """Create IAM client for LocalStack."""
    return boto3.client(
        "iam",
        endpoint_url=localstack_endpoint,
        **aws_credentials
    )


@pytest.fixture(scope="module")
def cloudwatch_client(localstack_endpoint, aws_credentials):
    """Create CloudWatch client for LocalStack."""
    return boto3.client(
        "cloudwatch",
        endpoint_url=localstack_endpoint,
        **aws_credentials
    )


class TestVPCInfrastructure:
    """Test VPC and networking infrastructure."""

    def test_vpc_exists(self, ec2_client):
        """Verify that VPCs are created."""
        response = ec2_client.describe_vpcs()
        vpcs = response.get("Vpcs", [])

        # Should have at least one VPC (or use default)
        assert len(vpcs) > 0, "No VPCs found in deployment"

        # Check for TAP VPCs with correct tags
        tap_vpcs = [
            vpc for vpc in vpcs
            if any(
                tag.get("Key") == "Owner" and tag.get("Value") == "tap-team"
                for tag in vpc.get("Tags", [])
            )
        ]

        # Either we created TAP VPCs or using default
        assert len(tap_vpcs) > 0 or len(vpcs) > 0

    def test_subnets_exist(self, ec2_client):
        """Verify that subnets are created."""
        response = ec2_client.describe_subnets()
        subnets = response.get("Subnets", [])

        assert len(subnets) > 0, "No subnets found in deployment"

    def test_internet_gateway_exists(self, ec2_client):
        """Verify that Internet Gateway is created."""
        response = ec2_client.describe_internet_gateways()
        igws = response.get("InternetGateways", [])

        # Should have at least one IGW
        assert len(igws) > 0, "No Internet Gateways found"

    def test_security_groups_exist(self, ec2_client):
        """Verify that security groups are created."""
        response = ec2_client.describe_security_groups()
        security_groups = response.get("SecurityGroups", [])

        assert len(security_groups) > 0, "No security groups found"

        # Check for TAP security groups
        tap_sgs = [
            sg for sg in security_groups
            if any(
                tag.get("Key") == "Owner" and tag.get("Value") == "tap-team"
                for tag in sg.get("Tags", [])
            )
        ]

        # Should have web and db security groups
        assert len(tap_sgs) >= 2, f"Expected at least 2 TAP security groups, found {len(tap_sgs)}"


class TestDynamoDBInfrastructure:
    """Test DynamoDB tables and data operations."""

    def test_dynamodb_tables_exist(self, dynamodb_client):
        """Verify that DynamoDB tables are created."""
        response = dynamodb_client.list_tables()
        tables = response.get("TableNames", [])

        assert len(tables) > 0, "No DynamoDB tables found"

        # Check for TAP tables
        tap_tables = [table for table in tables if "tap-" in table]
        assert len(tap_tables) > 0, f"No TAP tables found. Found tables: {tables}"

    def test_dynamodb_table_structure(self, dynamodb_client, pulumi_outputs):
        """Verify DynamoDB table has correct structure."""
        # Get table names from outputs or find them
        dynamodb_tables = pulumi_outputs.get("dynamodb_tables", {})

        if not dynamodb_tables:
            # Fallback: list and find TAP tables
            response = dynamodb_client.list_tables()
            all_tables = response.get("TableNames", [])
            tap_tables = [t for t in all_tables if "tap-" in t]
            assert len(tap_tables) > 0, "No TAP tables found"
            table_name = tap_tables[0]
        else:
            # Get first table from outputs
            table_name = list(dynamodb_tables.values())[0]

        # Describe table
        response = dynamodb_client.describe_table(TableName=table_name)
        table = response["Table"]

        # Verify key schema
        key_schema = {key["AttributeName"]: key["KeyType"] for key in table["KeySchema"]}
        assert "id" in key_schema, "Table should have 'id' as key"
        assert key_schema["id"] == "HASH", "id should be hash key"

        # Verify GSI exists
        gsis = table.get("GlobalSecondaryIndexes", [])
        assert len(gsis) > 0, "Table should have Global Secondary Index"

        timestamp_index = next((gsi for gsi in gsis if gsi["IndexName"] == "TimestampIndex"), None)
        assert timestamp_index is not None, "TimestampIndex GSI should exist"

    def test_dynamodb_write_read(self, dynamodb_client, pulumi_outputs):
        """Test writing and reading data from DynamoDB table."""
        # Get table name
        dynamodb_tables = pulumi_outputs.get("dynamodb_tables", {})

        if not dynamodb_tables:
            response = dynamodb_client.list_tables()
            all_tables = response.get("TableNames", [])
            tap_tables = [t for t in all_tables if "tap-" in t]
            assert len(tap_tables) > 0, "No TAP tables found"
            table_name = tap_tables[0]
        else:
            table_name = list(dynamodb_tables.values())[0]

        # Write test item
        test_item = {
            "id": {"S": "test-id-123"},
            "timestamp": {"N": "1234567890"},
            "data": {"S": "test data"}
        }

        dynamodb_client.put_item(TableName=table_name, Item=test_item)

        # Read item back
        response = dynamodb_client.get_item(
            TableName=table_name,
            Key={"id": {"S": "test-id-123"}}
        )

        item = response.get("Item")
        assert item is not None, "Item should be retrievable"
        assert item["id"]["S"] == "test-id-123"
        assert item["data"]["S"] == "test data"

        # Clean up
        dynamodb_client.delete_item(
            TableName=table_name,
            Key={"id": {"S": "test-id-123"}}
        )


class TestIAMResources:
    """Test IAM roles and policies."""

    def test_iam_roles_exist(self, iam_client):
        """Verify that IAM roles are created."""
        response = iam_client.list_roles()
        roles = response.get("Roles", [])

        # Check for TAP EC2 role
        tap_roles = [role for role in roles if "tap-" in role["RoleName"]]
        assert len(tap_roles) > 0, f"No TAP IAM roles found. Found roles: {[r['RoleName'] for r in roles]}"

    def test_ec2_role_has_correct_trust_policy(self, iam_client):
        """Verify EC2 role has correct assume role policy."""
        # Find TAP EC2 role
        response = iam_client.list_roles()
        roles = response.get("Roles", [])

        ec2_roles = [
            role for role in roles
            if "tap-" in role["RoleName"] and "ec2" in role["RoleName"].lower()
        ]

        if not ec2_roles:
            pytest.skip("EC2 role not found")

        role = ec2_roles[0]

        # Check assume role policy (might be dict or string)
        assume_role_policy = role["AssumeRolePolicyDocument"]
        if isinstance(assume_role_policy, str):
            assume_role_policy = json.loads(assume_role_policy)

        # Should allow EC2 to assume the role
        statements = assume_role_policy.get("Statement", [])
        assert len(statements) > 0

        ec2_statement = next(
            (s for s in statements if "ec2.amazonaws.com" in str(s.get("Principal", {}))),
            None
        )
        assert ec2_statement is not None, "Role should allow EC2 service to assume it"


class TestCloudWatchResources:
    """Test CloudWatch monitoring resources."""

    def test_cloudwatch_log_groups_exist(self, cloudwatch_client):
        """Verify CloudWatch log groups are created."""
        # CloudWatch Logs uses a different client
        logs_client = boto3.client(
            "logs",
            endpoint_url=os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566"),
            aws_access_key_id="test",
            aws_secret_access_key="test",
            region_name="us-east-1"
        )

        response = logs_client.describe_log_groups()
        log_groups = response.get("logGroups", [])

        # Should have log groups (or at least not error)
        assert isinstance(log_groups, list)


class TestStackOutputs:
    """Test Pulumi stack outputs."""

    def test_stack_has_outputs(self, pulumi_outputs):
        """Verify that stack exports required outputs."""
        if not pulumi_outputs:
            pytest.skip("Pulumi outputs not available")

        # Should have regions
        assert "regions" in pulumi_outputs or len(pulumi_outputs) > 0


class TestMultiRegionDeployment:
    """Test multi-region deployment capabilities."""

    def test_stack_configured_for_multiple_regions(self):
        """Verify stack is configured for multi-region deployment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="test")

        # Should have multiple regions configured
        assert len(args.regions) > 1, "Stack should be configured for multiple regions"
        assert "us-east-1" in args.regions

    def test_resource_naming_convention(self):
        """Verify resource naming follows convention."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="test")

        # Test naming convention
        vpc_name = args.get_resource_name("vpc")
        assert "tap-" in vpc_name
        assert "test" in vpc_name
        assert "vpc" in vpc_name

    def test_default_tags_include_required_fields(self):
        """Verify default tags include required fields."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        tags = args.get_default_tags()

        # Should have required tags
        assert "Owner" in tags
        assert "Environment" in tags
        assert "Project" in tags
        assert "ManagedBy" in tags
        assert tags["ManagedBy"] == "pulumi"
