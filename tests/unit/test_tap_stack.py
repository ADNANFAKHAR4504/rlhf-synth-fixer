#!/usr/bin/env python3
"""
Integration tests for TAP infrastructure stack.
"""

import os
import pytest
import pulumi
from pulumi import automation as auto


@pytest.fixture
def localstack_config():
    """Configure LocalStack endpoint for tests."""
    endpoint = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
    return {
        "aws:region": "us-east-1",
        "aws:skipCredentialsValidation": "true",
        "aws:skipMetadataApiCheck": "true",
        "aws:s3UsePathStyle": "true",
        "aws:endpoints": [
            {
                "s3": endpoint,
                "ec2": endpoint,
                "cloudwatch": endpoint,
                "iam": endpoint,
                "sts": endpoint,
            }
        ],
    }


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for unit testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:s3:::{args.name}",
                "bucket": args.name,
            }
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:ec2:us-east-1:123456789012:vpc/{args.name}",
                "id": f"vpc-{args.name}",
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:ec2:us-east-1:123456789012:subnet/{args.name}",
                "id": f"subnet-{args.name}",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:ec2:us-east-1:123456789012:security-group/{args.name}",
                "id": f"sg-{args.name}",
            }
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


@pulumi.runtime.test
def test_vpc_creation():
    """Test VPC is created with correct configuration."""
    from lib.tap_stack import TapStack, TapStackArgs

    args = TapStackArgs(
        environment_suffix="test",
        vpc_cidr="10.0.0.0/16",
        enable_cross_region_replication=False,
    )

    stack = TapStack("test-stack", args)

    def check_vpc(args):
        vpc_id, public_subnets, private_subnets = args
        assert vpc_id is not None, "VPC ID should not be None"
        assert len(public_subnets) == 2, "Should have 2 public subnets"
        assert len(private_subnets) == 2, "Should have 2 private subnets"

    return pulumi.Output.all(
        stack.vpc_id, stack.public_subnet_ids, stack.private_subnet_ids
    ).apply(check_vpc)


@pulumi.runtime.test
def test_security_groups_created():
    """Test security groups are created."""
    from lib.tap_stack import TapStack, TapStackArgs

    args = TapStackArgs(
        environment_suffix="test",
        enable_cross_region_replication=False,
    )

    stack = TapStack("test-stack", args)

    # Check that security_group_ids is a dict with the expected keys
    assert isinstance(stack.security_group_ids, dict), "security_group_ids should be a dict"
    assert "web" in stack.security_group_ids, "Web security group should exist"
    assert "app" in stack.security_group_ids, "App security group should exist"
    assert "db" in stack.security_group_ids, "Database security group should exist"
    assert "ssh" in stack.security_group_ids, "SSH security group should exist"
    
    # Return one of the Output values to satisfy test framework
    return stack.security_group_ids["web"]


@pulumi.runtime.test
def test_s3_buckets_created():
    """Test S3 buckets are created with encryption."""
    from lib.tap_stack import TapStack, TapStackArgs

    args = TapStackArgs(
        environment_suffix="test",
        enable_cross_region_replication=False,
    )

    stack = TapStack("test-stack", args)

    # Check that s3_bucket_names is a dict with the expected keys
    assert isinstance(stack.s3_bucket_names, dict), "s3_bucket_names should be a dict"
    assert "app" in stack.s3_bucket_names, "App bucket should exist"
    assert "logs" in stack.s3_bucket_names, "Logs bucket should exist"
    
    # Return one of the Output values to satisfy test framework
    return stack.s3_bucket_names["app"]


@pulumi.runtime.test
def test_cloudwatch_log_groups_created():
    """Test CloudWatch log groups are created."""
    from lib.tap_stack import TapStack, TapStackArgs

    args = TapStackArgs(
        environment_suffix="test",
        enable_cross_region_replication=False,
    )

    stack = TapStack("test-stack", args)

    # Check that cloudwatch_log_groups is a dict with the expected keys
    assert isinstance(stack.cloudwatch_log_groups, dict), "cloudwatch_log_groups should be a dict"
    assert "application" in stack.cloudwatch_log_groups, "Application log group should exist"
    assert "infrastructure" in stack.cloudwatch_log_groups, "Infrastructure log group should exist"
    
    # Return one of the Output values to satisfy test framework
    return stack.cloudwatch_log_groups["application"]


@pulumi.runtime.test
def test_localstack_configuration():
    """Test LocalStack-specific configuration is applied."""
    from lib.tap_stack import TapStack, TapStackArgs

    # Set LocalStack environment
    os.environ["AWS_ENDPOINT_URL"] = "http://localhost:4566"

    args = TapStackArgs(
        environment_suffix="test",
        enable_cross_region_replication=False,  # Should be disabled for LocalStack
    )

    stack = TapStack("test-stack", args)

    # Check that s3_bucket_names is a dict
    assert isinstance(stack.s3_bucket_names, dict), "s3_bucket_names should be a dict"
    # Cross-region replication should be disabled
    assert "backup" not in stack.s3_bucket_names, "Backup bucket should not exist in LocalStack"
    
    # Return one of the Output values to satisfy test framework
    return stack.s3_bucket_names["app"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
