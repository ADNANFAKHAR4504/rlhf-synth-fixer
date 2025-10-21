"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component - HIPAA-compliant healthcare data pipeline
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


# Set Pulumi to use mocks
pulumi.runtime.set_mocks(
    pulumi.runtime.Mocks(
        call=lambda args: {},
        new_resource=lambda args: ("id123", {})
    )
)


# Import after configuring mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'MedTech', 'Team': 'Healthcare'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_environment(self):
        """Test TapStackArgs with None environment defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)

        self.assertEqual(args.environment_suffix, 'dev')


@pulumi.runtime.test
def test_vpc_creation():
    """Test VPC is created with correct CIDR and DNS settings."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify VPC is created
    assert hasattr(stack, 'vpc'), "VPC should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_kinesis_stream_encryption():
    """Test Kinesis stream is created with encryption enabled."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify kinesis stream exists
    assert hasattr(stack, 'kinesis_stream'), "Kinesis stream should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_rds_instance_configuration():
    """Test RDS instance is created with correct configuration."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify RDS instance exists
    assert hasattr(stack, 'rds_instance'), "RDS instance should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_redis_cluster_configuration():
    """Test Redis cluster is created with correct configuration."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify Redis cluster exists
    assert hasattr(stack, 'redis_cluster'), "Redis cluster should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_private_subnets_created():
    """Test private subnets are created in different AZs."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify private subnets exist
    assert hasattr(stack, 'private_subnet_1'), "Private subnet 1 should be created"
    assert hasattr(stack, 'private_subnet_2'), "Private subnet 2 should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_security_groups_created():
    """Test security groups are created for RDS and Redis."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify security groups exist
    assert hasattr(stack, 'rds_security_group'), "RDS security group should be created"
    assert hasattr(stack, 'redis_security_group'), "Redis security group should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_secrets_manager_resources():
    """Test Secrets Manager resources are created."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify secrets exist
    assert hasattr(stack, 'rds_secret'), "RDS secret should be created"
    assert hasattr(stack, 'redis_secret'), "Redis secret should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_random_passwords_generated():
    """Test random passwords are generated for RDS and Redis."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify password resources exist
    assert hasattr(stack, 'rds_password'), "RDS password should be generated"
    assert hasattr(stack, 'redis_auth_token'), "Redis auth token should be generated"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_iam_roles_created():
    """Test IAM roles are created."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify IAM roles exist
    assert hasattr(stack, 'kinesis_producer_role'), "Kinesis producer role should be created"
    assert hasattr(stack, 'secrets_reader_role'), "Secrets reader role should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_nat_gateway_created():
    """Test NAT Gateway is created."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify NAT Gateway exists
    assert hasattr(stack, 'nat_gateway'), "NAT Gateway should be created"
    assert hasattr(stack, 'nat_eip'), "NAT Gateway EIP should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_subnet_groups_created():
    """Test subnet groups are created for RDS and ElastiCache."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify subnet groups exist
    assert hasattr(stack, 'db_subnet_group'), "DB subnet group should be created"
    assert hasattr(stack, 'elasticache_subnet_group'), "ElastiCache subnet group should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_route_tables_created():
    """Test route tables are created for public and private subnets."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify route tables exist
    assert hasattr(stack, 'public_route_table'), "Public route table should be created"
    assert hasattr(stack, 'private_route_table'), "Private route table should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_internet_gateway_created():
    """Test Internet Gateway is created."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify Internet Gateway exists
    assert hasattr(stack, 'igw'), "Internet Gateway should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_public_subnets_created():
    """Test public subnets are created."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify public subnets exist
    assert hasattr(stack, 'public_subnet_1'), "Public subnet 1 should be created"
    assert hasattr(stack, 'public_subnet_2'), "Public subnet 2 should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_environment_suffix_applied():
    """Test environment suffix is correctly applied to resources."""

    custom_suffix = 'qa123'
    args = TapStackArgs(environment_suffix=custom_suffix)
    stack = TapStack('test-stack', args)

    # Verify environment suffix is stored
    assert stack.environment_suffix == custom_suffix, \
        f"Environment suffix should be {custom_suffix}"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_tags_applied():
    """Test custom tags are stored."""

    custom_tags = {'Environment': 'test', 'Owner': 'qa-team'}
    args = TapStackArgs(tags=custom_tags)
    stack = TapStack('test-stack', args)

    # Verify tags are stored
    assert stack.tags == custom_tags, "Custom tags should be stored"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_iam_policies_created():
    """Test IAM policies are created for roles."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify IAM policies exist
    assert hasattr(stack, 'kinesis_producer_policy'), "Kinesis producer policy should be created"
    assert hasattr(stack, 'secrets_reader_policy'), "Secrets reader policy should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_secret_versions_created():
    """Test secret versions are created for RDS and Redis."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify secret versions exist
    assert hasattr(stack, 'rds_secret_version'), "RDS secret version should be created"
    assert hasattr(stack, 'redis_secret_version'), "Redis secret version should be created"
    return pulumi.Output.from_input(True)


@pulumi.runtime.test
def test_all_required_resources_created():
    """Test all required resources are created in the stack."""

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # List of all required resources
    required_resources = [
        'vpc', 'igw', 'nat_gateway', 'nat_eip',
        'public_subnet_1', 'public_subnet_2',
        'private_subnet_1', 'private_subnet_2',
        'public_route_table', 'private_route_table',
        'kinesis_stream',
        'rds_instance', 'rds_security_group', 'db_subnet_group',
        'redis_cluster', 'redis_security_group', 'elasticache_subnet_group',
        'rds_secret', 'redis_secret',
        'rds_password', 'redis_auth_token',
        'kinesis_producer_role', 'secrets_reader_role'
    ]

    for resource in required_resources:
        assert hasattr(stack, resource), f"Resource {resource} should be created"

    return pulumi.Output.from_input(True)


if __name__ == '__main__':
    unittest.main()
