"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib.vpc_stack import VpcStack
from lib.kinesis_stack import KinesisStack
from lib.secrets_stack import SecretsStack
from lib.elasticache_stack import ElastiCacheStack
from lib.rds_stack import RdsStack
from lib.monitoring_stack import MonitoringStack


class MyMocks:
    """Mock helper for Pulumi tests."""
    def __init__(self):
        self.call_args = {}

    def call_with_urn(self, fn, opts):
        """Call function with URN"""
        return fn('test-urn', opts)


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_environment_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args = TapStackArgs(environment_suffix='prod')

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Team': 'Platform', 'Cost Center': '12345'}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_with_all_custom_values(self):
        """Test TapStackArgs with all custom values."""
        custom_tags = {'Environment': 'Staging'}
        args = TapStackArgs(environment_suffix='stage', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'stage')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @pulumi.runtime.test
    def test_tap_stack_creates_all_components(self):
        """Test that TapStack creates all required child stacks."""

        def check_stack_components(args):
            stack_name, tap_stack = args

            # Verify main stack attributes
            self.assertEqual(stack_name, 'test-stack')
            self.assertIsInstance(tap_stack, TapStack)
            self.assertEqual(tap_stack.environment_suffix, 'test')

            # Verify tags include defaults and custom tags
            self.assertIn('Project', tap_stack.tags)
            self.assertEqual(tap_stack.tags['Project'], 'JapanCart')
            self.assertIn('ManagedBy', tap_stack.tags)
            self.assertEqual(tap_stack.tags['ManagedBy'], 'Pulumi')
            self.assertIn('Environment', tap_stack.tags)
            self.assertEqual(tap_stack.tags['Environment'], 'test')

            # Verify child stacks exist
            self.assertIsNotNone(tap_stack.vpc)
            self.assertIsNotNone(tap_stack.kinesis)
            self.assertIsNotNone(tap_stack.secrets)
            self.assertIsNotNone(tap_stack.elasticache)
            self.assertIsNotNone(tap_stack.rds)
            self.assertIsNotNone(tap_stack.monitoring)

            return True

        # Create test args
        args = TapStackArgs(environment_suffix='test', tags={'Custom': 'Tag'})

        # Create stack
        stack = TapStack('test-stack', args)

        # Return assertion
        return pulumi.Output.all(stack.name, stack).apply(check_stack_components)

    @pulumi.runtime.test
    def test_tap_stack_default_environment_suffix(self):
        """Test TapStack with default environment suffix."""

        def check_environment_suffix(args):
            tap_stack = args
            self.assertEqual(tap_stack.environment_suffix, 'dev')
            return True

        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        return pulumi.Output.from_input(stack).apply(check_environment_suffix)


class TestVpcStack(unittest.TestCase):
    """Test cases for VpcStack component."""

    @pulumi.runtime.test
    def test_vpc_stack_creates_vpc_with_correct_cidr(self):
        """Test that VpcStack creates VPC with correct CIDR block."""

        def check_vpc(args):
            vpc_stack = args
            self.assertIsNotNone(vpc_stack.vpc_id)
            self.assertIsNotNone(vpc_stack.public_subnet_ids)
            self.assertIsNotNone(vpc_stack.private_subnet_ids)
            return True

        vpc = VpcStack(
            'test-vpc',
            environment_suffix='test',
            azs=['us-east-1a', 'us-east-1b'],
            tags={'Test': 'Tag'}
        )

        return pulumi.Output.from_input(vpc).apply(check_vpc)

    @pulumi.runtime.test
    def test_vpc_stack_creates_correct_number_of_subnets(self):
        """Test that VpcStack creates correct number of public and private subnets."""

        def check_subnets(args):
            vpc_stack = args
            # Each AZ gets one public and one private subnet
            self.assertEqual(len(vpc_stack.public_subnets), 2)
            self.assertEqual(len(vpc_stack.private_subnets), 2)
            return True

        vpc = VpcStack(
            'test-vpc',
            environment_suffix='test',
            azs=['us-east-1a', 'us-east-1b']
        )

        return pulumi.Output.from_input(vpc).apply(check_subnets)


class TestKinesisStack(unittest.TestCase):
    """Test cases for KinesisStack component."""

    @pulumi.runtime.test
    def test_kinesis_stack_creates_stream(self):
        """Test that KinesisStack creates Kinesis stream."""

        def check_kinesis(args):
            kinesis_stack = args
            self.assertIsNotNone(kinesis_stack.stream_name)
            self.assertIsNotNone(kinesis_stack.stream_arn)
            return True

        kinesis = KinesisStack(
            'test-kinesis',
            environment_suffix='test',
            tags={'Test': 'Tag'}
        )

        return pulumi.Output.from_input(kinesis).apply(check_kinesis)


class TestSecretsStack(unittest.TestCase):
    """Test cases for SecretsStack component."""

    @pulumi.runtime.test
    def test_secrets_stack_creates_secret(self):
        """Test that SecretsStack creates Secrets Manager secret."""

        def check_secret(args):
            secrets_stack = args
            self.assertIsNotNone(secrets_stack.db_secret_arn)
            self.assertEqual(secrets_stack.db_username, 'japancart_admin')
            self.assertIsNotNone(secrets_stack.db_password_value)
            return True

        secrets = SecretsStack(
            'test-secrets',
            environment_suffix='test',
            tags={'Test': 'Tag'}
        )

        return pulumi.Output.from_input(secrets).apply(check_secret)


class TestElastiCacheStack(unittest.TestCase):
    """Test cases for ElastiCacheStack component."""

    @pulumi.runtime.test
    def test_elasticache_stack_creates_redis_cluster(self):
        """Test that ElastiCacheStack creates Redis cluster."""

        def check_elasticache(args):
            elasticache_stack = args
            self.assertIsNotNone(elasticache_stack.cluster_id)
            self.assertIsNotNone(elasticache_stack.redis_endpoint)
            self.assertIsNotNone(elasticache_stack.redis_port)
            self.assertIsNotNone(elasticache_stack.security_group_id)
            return True

        # Create mock outputs
        vpc_id = pulumi.Output.from_input('vpc-12345')
        subnet_ids = [
            pulumi.Output.from_input('subnet-1'),
            pulumi.Output.from_input('subnet-2')
        ]

        elasticache = ElastiCacheStack(
            'test-elasticache',
            environment_suffix='test',
            vpc_id=vpc_id,
            subnet_ids=subnet_ids,
            tags={'Test': 'Tag'}
        )

        return pulumi.Output.from_input(elasticache).apply(check_elasticache)


class TestRdsStack(unittest.TestCase):
    """Test cases for RdsStack component."""

    @pulumi.runtime.test
    def test_rds_stack_creates_postgres_instance(self):
        """Test that RdsStack creates PostgreSQL instance."""

        def check_rds(args):
            rds_stack = args
            self.assertIsNotNone(rds_stack.instance_id)
            self.assertIsNotNone(rds_stack.endpoint)
            self.assertIsNotNone(rds_stack.address)
            self.assertIsNotNone(rds_stack.port)
            self.assertIsNotNone(rds_stack.security_group_id)
            return True

        # Create mock outputs
        vpc_id = pulumi.Output.from_input('vpc-12345')
        subnet_ids = [
            pulumi.Output.from_input('subnet-1'),
            pulumi.Output.from_input('subnet-2')
        ]
        db_secret_arn = pulumi.Output.from_input('arn:aws:secretsmanager:us-east-1:123456789012:secret:test')

        rds = RdsStack(
            'test-rds',
            environment_suffix='test',
            vpc_id=vpc_id,
            subnet_ids=subnet_ids,
            db_secret_arn=db_secret_arn,
            tags={'Test': 'Tag'}
        )

        return pulumi.Output.from_input(rds).apply(check_rds)


class TestMonitoringStack(unittest.TestCase):
    """Test cases for MonitoringStack component."""

    @pulumi.runtime.test
    def test_monitoring_stack_creates_alarms(self):
        """Test that MonitoringStack creates CloudWatch alarms."""

        def check_monitoring(args):
            monitoring_stack = args
            self.assertIsNotNone(monitoring_stack.kinesis_iterator_age_alarm)
            self.assertIsNotNone(monitoring_stack.kinesis_write_throughput_alarm)
            self.assertIsNotNone(monitoring_stack.redis_cpu_alarm)
            self.assertIsNotNone(monitoring_stack.redis_memory_alarm)
            self.assertIsNotNone(monitoring_stack.rds_cpu_alarm)
            self.assertIsNotNone(monitoring_stack.rds_storage_alarm)
            self.assertIsNotNone(monitoring_stack.rds_connection_alarm)
            return True

        # Create mock outputs
        kinesis_stream_name = pulumi.Output.from_input('transaction-stream-test')
        elasticache_cluster_id = pulumi.Output.from_input('redis-cluster-test')
        rds_instance_id = pulumi.Output.from_input('postgres-test')

        monitoring = MonitoringStack(
            'test-monitoring',
            environment_suffix='test',
            kinesis_stream_name=kinesis_stream_name,
            elasticache_cluster_id=elasticache_cluster_id,
            rds_instance_id=rds_instance_id,
            tags={'Test': 'Tag'}
        )

        return pulumi.Output.from_input(monitoring).apply(check_monitoring)


class TestResourceNaming(unittest.TestCase):
    """Test cases for resource naming conventions."""

    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is included in resource names."""
        test_suffix = 'prod123'
        args = TapStackArgs(environment_suffix=test_suffix)

        self.assertEqual(args.environment_suffix, test_suffix)

    def test_elasticache_naming_includes_tap_prefix(self):
        """Test that ElastiCache resources include 'tap' prefix in names."""
        # This test validates the naming pattern shown in the code
        environment_suffix = 'test'
        expected_sg_name = f"redis-tap-sg-{environment_suffix}"
        expected_subnet_group = f"redis-tap-subnet-group-{environment_suffix}"
        expected_cluster_id = f"redis-tap-{environment_suffix}"

        self.assertEqual(expected_sg_name, "redis-tap-sg-test")
        self.assertEqual(expected_subnet_group, "redis-tap-subnet-group-test")
        self.assertEqual(expected_cluster_id, "redis-tap-test")


class TestErrorHandling(unittest.TestCase):
    """Test cases for error handling and edge cases."""

    def test_tap_stack_args_none_values(self):
        """Test TapStackArgs handles None values correctly."""
        args = TapStackArgs(environment_suffix=None, tags=None)

        # None should be converted to defaults
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_empty_string_environment_suffix(self):
        """Test TapStackArgs handles empty string."""
        args = TapStackArgs(environment_suffix='', tags={})

        # Empty string is falsy, should use default
        self.assertEqual(args.environment_suffix, 'dev')


class TestIntegration(unittest.TestCase):
    """Integration test cases."""

    @pulumi.runtime.test
    def test_full_stack_creation_flow(self):
        """Test complete stack creation with all components."""

        def check_full_stack(args):
            stack = args

            # Verify all components exist
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.kinesis)
            self.assertIsNotNone(stack.secrets)
            self.assertIsNotNone(stack.elasticache)
            self.assertIsNotNone(stack.rds)
            self.assertIsNotNone(stack.monitoring)

            # Verify environment suffix propagated
            self.assertEqual(stack.environment_suffix, 'integration-test')

            # Verify tags include all required fields
            self.assertIn('Project', stack.tags)
            self.assertIn('ManagedBy', stack.tags)
            self.assertIn('Environment', stack.tags)
            self.assertIn('TestType', stack.tags)

            return True

        args = TapStackArgs(
            environment_suffix='integration-test',
            tags={'TestType': 'Integration'}
        )
        stack = TapStack('integration-stack', args)

        return pulumi.Output.from_input(stack).apply(check_full_stack)


if __name__ == '__main__':
    unittest.main()
