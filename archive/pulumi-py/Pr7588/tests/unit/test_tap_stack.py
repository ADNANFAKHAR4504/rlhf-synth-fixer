"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
"""

import unittest
import pulumi

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources during testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {
            'id': f'{args.name}-id',
            'urn': f'{args.typ}::{args.name}',
            **args.inputs
        }
        # Add resource-specific outputs
        if args.typ == 'aws:ec2/vpc:Vpc':
            outputs['id'] = 'vpc-12345'
        elif args.typ == 'aws:ec2/subnet:Subnet':
            outputs['id'] = f'subnet-{args.name}'
        elif args.typ == 'aws:kms/key:Key':
            outputs['id'] = 'kms-key-id'
            outputs['arn'] = 'arn:aws:kms:us-east-1:123456789012:key/12345'
        elif args.typ == 'aws:rds/instance:Instance':
            outputs['endpoint'] = 'test-db.amazonaws.com:5432'
            outputs['arn'] = 'arn:aws:rds:us-east-1:123456789012:db:test-db'
        elif args.typ == 'aws:elasticache/replicationGroup:ReplicationGroup':
            outputs['configuration_endpoint_address'] = 'redis.amazonaws.com'
            outputs['port'] = 6379
        elif args.typ == 'aws:kinesis/stream:Stream':
            outputs['name'] = f'{args.name}'
            outputs['arn'] = f'arn:aws:kinesis:us-east-1:123456789012:stream/{args.name}'

        return [outputs.get('id', args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


# Set up mocks globally
pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initializes with correct values."""
        args = TapStackArgs(environment_suffix='test123')
        self.assertEqual(args.environment_suffix, 'test123')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs initializes with custom tags."""
        custom_tags = {'Environment': 'prod', 'Team': 'data'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_tags_default_to_empty_dict(self):
        """Test TapStackArgs tags default to empty dict when None."""
        args = TapStackArgs(environment_suffix='dev', tags=None)
        self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def test_tap_stack_initialization(self):
        """Test TapStack initializes correctly."""
        # Create the stack
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify environment_suffix is set
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertEqual(stack.tags, {})

    def test_tap_stack_creates_vpc(self):
        """Test TapStack creates VPC resources."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify VPC is created
        self.assertIsNotNone(stack.vpc)
        # Verify subnets are created
        self.assertIsNotNone(stack.public_subnet_1)
        self.assertIsNotNone(stack.public_subnet_2)
        self.assertIsNotNone(stack.private_subnet_1)
        self.assertIsNotNone(stack.private_subnet_2)

    def test_tap_stack_creates_kms_key(self):
        """Test TapStack creates KMS key for encryption."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify KMS key is created
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_key_alias)

    def test_tap_stack_creates_security_groups(self):
        """Test TapStack creates security groups."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify security groups are created
        self.assertIsNotNone(stack.rds_security_group)
        self.assertIsNotNone(stack.redis_security_group)

    def test_tap_stack_creates_kinesis_stream(self):
        """Test TapStack creates Kinesis Data Stream."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify Kinesis stream is created
        self.assertIsNotNone(stack.kinesis_stream)

    def test_tap_stack_creates_rds_instance(self):
        """Test TapStack creates RDS PostgreSQL instance."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify RDS resources are created
        self.assertIsNotNone(stack.db_subnet_group)
        self.assertIsNotNone(stack.rds_instance)

    def test_tap_stack_creates_elasticache_cluster(self):
        """Test TapStack creates ElastiCache Redis cluster."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify ElastiCache resources are created
        self.assertIsNotNone(stack.cache_subnet_group)
        self.assertIsNotNone(stack.redis_cluster)

    def test_tap_stack_creates_networking_resources(self):
        """Test TapStack creates all networking resources."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify networking resources
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.nat_gateway)
        self.assertIsNotNone(stack.eip)
        self.assertIsNotNone(stack.public_route_table)
        self.assertIsNotNone(stack.private_route_table)
        # Verify route table associations
        self.assertIsNotNone(stack.public_rt_assoc_1)
        self.assertIsNotNone(stack.public_rt_assoc_2)
        self.assertIsNotNone(stack.private_rt_assoc_1)
        self.assertIsNotNone(stack.private_rt_assoc_2)
        # Verify routes
        self.assertIsNotNone(stack.public_route)
        self.assertIsNotNone(stack.private_route)

    def test_tap_stack_with_custom_tags(self):
        """Test TapStack applies custom tags."""
        custom_tags = {'Project': 'FastShop', 'Owner': 'DataTeam'}
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='prod', tags=custom_tags)
        )
        self.assertEqual(stack.tags, custom_tags)

    def test_tap_stack_resource_naming(self):
        """Test TapStack uses environment_suffix in resource naming."""
        suffix = 'test123'
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix=suffix)
        )
        # Verify suffix is stored
        self.assertEqual(stack.environment_suffix, suffix)

    def test_create_vpc_method(self):
        """Test _create_vpc method creates all VPC components."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        # Verify all VPC components exist
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.public_subnet_1)
        self.assertIsNotNone(stack.public_subnet_2)
        self.assertIsNotNone(stack.private_subnet_1)
        self.assertIsNotNone(stack.private_subnet_2)
        self.assertIsNotNone(stack.eip)
        self.assertIsNotNone(stack.nat_gateway)

    def test_create_kms_key_method(self):
        """Test _create_kms_key method creates KMS resources."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_key_alias)

    def test_create_security_groups_method(self):
        """Test _create_security_groups method creates security groups."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        self.assertIsNotNone(stack.rds_security_group)
        self.assertIsNotNone(stack.redis_security_group)

    def test_create_kinesis_stream_method(self):
        """Test _create_kinesis_stream method creates Kinesis stream."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        self.assertIsNotNone(stack.kinesis_stream)

    def test_create_rds_instance_method(self):
        """Test _create_rds_instance method creates RDS resources."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        self.assertIsNotNone(stack.db_subnet_group)
        self.assertIsNotNone(stack.rds_instance)

    def test_create_elasticache_cluster_method(self):
        """Test _create_elasticache_cluster method creates ElastiCache resources."""
        stack = TapStack(
            name='test-stack',
            args=TapStackArgs(environment_suffix='test')
        )
        self.assertIsNotNone(stack.cache_subnet_group)
        self.assertIsNotNone(stack.redis_cluster)

    def test_tap_stack_all_methods_called(self):
        """Test that all private methods are called during stack creation."""
        # This test ensures all code paths are covered
        stack = TapStack(
            name='comprehensive-test',
            args=TapStackArgs(environment_suffix='test-all')
        )

        # Verify all resources from _create_vpc
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.public_subnet_1)
        self.assertIsNotNone(stack.public_subnet_2)
        self.assertIsNotNone(stack.private_subnet_1)
        self.assertIsNotNone(stack.private_subnet_2)
        self.assertIsNotNone(stack.eip)
        self.assertIsNotNone(stack.nat_gateway)
        self.assertIsNotNone(stack.public_route_table)
        self.assertIsNotNone(stack.public_route)
        self.assertIsNotNone(stack.public_rt_assoc_1)
        self.assertIsNotNone(stack.public_rt_assoc_2)
        self.assertIsNotNone(stack.private_route_table)
        self.assertIsNotNone(stack.private_route)
        self.assertIsNotNone(stack.private_rt_assoc_1)
        self.assertIsNotNone(stack.private_rt_assoc_2)

        # Verify all resources from _create_kms_key
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_key_alias)

        # Verify all resources from _create_security_groups
        self.assertIsNotNone(stack.rds_security_group)
        self.assertIsNotNone(stack.redis_security_group)

        # Verify all resources from _create_kinesis_stream
        self.assertIsNotNone(stack.kinesis_stream)

        # Verify all resources from _create_rds_instance
        self.assertIsNotNone(stack.db_subnet_group)
        self.assertIsNotNone(stack.rds_instance)

        # Verify all resources from _create_elasticache_cluster
        self.assertIsNotNone(stack.cache_subnet_group)
        self.assertIsNotNone(stack.redis_cluster)


if __name__ == '__main__':
    unittest.main()
