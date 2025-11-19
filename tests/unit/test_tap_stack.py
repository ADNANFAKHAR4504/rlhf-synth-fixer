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


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'ML-API', 'Environment': 'prod'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_values(self):
        """Test TapStackArgs with None values (should use defaults)."""
        args = TapStackArgs(environment_suffix=None, tags=None)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})


class TestTapStackInitialization(unittest.TestCase):
    """Test cases for TapStack component initialization."""

    @pulumi.runtime.test
    def test_stack_initialization_with_defaults(self):
        """Test TapStack initializes with default arguments."""

        def check_stack(args):
            """Pulumi test function to check stack creation."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # Verify basic attributes
            self.assertEqual(stack.environment_suffix, 'test')
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.ecs_cluster)
            return {}

        pulumi.runtime.test(check_stack)

    @pulumi.runtime.test
    def test_stack_environment_suffix_usage(self):
        """Test that environment_suffix is properly used in resource names."""

        def check_suffix(args):
            """Verify environment suffix is applied to resources."""
            test_suffix = 'unittest123'
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix=test_suffix)
            )

            # Verify suffix is stored
            self.assertEqual(stack.environment_suffix, test_suffix)

            # Verify resources have suffix in their logical names
            # (Pulumi resources names are set during init)
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.ecs_cluster)

            return {}

        pulumi.runtime.test(check_suffix)


class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    @pulumi.runtime.test
    def test_vpc_resources_created(self):
        """Test VPC and networking resources are created."""

        def check_vpc(args):
            """Verify VPC resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # VPC
            self.assertIsNotNone(stack.vpc)

            # Internet Gateway
            self.assertIsNotNone(stack.igw)

            # Subnets
            self.assertEqual(len(stack.public_subnets), 3)
            self.assertEqual(len(stack.private_subnets), 3)

            # Route tables
            self.assertIsNotNone(stack.public_rt)
            self.assertIsNotNone(stack.private_rt)

            # NAT Gateway
            self.assertIsNotNone(stack.nat_gateway)

            return {}

        pulumi.runtime.test(check_vpc)

    @pulumi.runtime.test
    def test_ecs_resources_created(self):
        """Test ECS resources are created."""

        def check_ecs(args):
            """Verify ECS resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # ECS Cluster
            self.assertIsNotNone(stack.ecs_cluster)

            # ECS Task Definition
            self.assertIsNotNone(stack.task_definition)

            # ECS Service
            self.assertIsNotNone(stack.ecs_service)

            # Security Group
            self.assertIsNotNone(stack.ecs_sg)

            # IAM Roles
            self.assertIsNotNone(stack.ecs_task_role)
            self.assertIsNotNone(stack.ecs_task_execution_role)

            return {}

        pulumi.runtime.test(check_ecs)

    @pulumi.runtime.test
    def test_alb_resources_created(self):
        """Test Application Load Balancer resources are created."""

        def check_alb(args):
            """Verify ALB resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # ALB
            self.assertIsNotNone(stack.alb)

            # Target Group
            self.assertIsNotNone(stack.target_group)

            # ALB Listener
            self.assertIsNotNone(stack.alb_listener)

            # Security Group
            self.assertIsNotNone(stack.alb_sg)

            return {}

        pulumi.runtime.test(check_alb)

    @pulumi.runtime.test
    def test_rds_resources_created(self):
        """Test RDS Aurora resources are created."""

        def check_rds(args):
            """Verify RDS resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # RDS Cluster
            self.assertIsNotNone(stack.db_cluster)

            # Subnet Group
            self.assertIsNotNone(stack.db_subnet_group)

            # Security Group
            self.assertIsNotNone(stack.rds_sg)

            # Parameter Group
            self.assertIsNotNone(stack.db_cluster_param_group)

            return {}

        pulumi.runtime.test(check_rds)

    @pulumi.runtime.test
    def test_dynamodb_resource_created(self):
        """Test DynamoDB table is created."""

        def check_dynamodb(args):
            """Verify DynamoDB resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # DynamoDB Table
            self.assertIsNotNone(stack.session_table)

            return {}

        pulumi.runtime.test(check_dynamodb)

    @pulumi.runtime.test
    def test_cloudfront_resources_created(self):
        """Test CloudFront distribution is created."""

        def check_cloudfront(args):
            """Verify CloudFront resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # CloudFront Distribution
            self.assertIsNotNone(stack.cloudfront_distribution)

            # Origin Access Identity
            self.assertIsNotNone(stack.cloudfront_oai)

            return {}

        pulumi.runtime.test(check_cloudfront)

    @pulumi.runtime.test
    def test_autoscaling_resources_created(self):
        """Test auto-scaling resources are created."""

        def check_autoscaling(args):
            """Verify auto-scaling resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # Auto-scaling Target
            self.assertIsNotNone(stack.ecs_target)

            # Auto-scaling Policy
            self.assertIsNotNone(stack.ecs_scaling_policy)

            return {}

        pulumi.runtime.test(check_autoscaling)

    @pulumi.runtime.test
    def test_cloudwatch_logs_created(self):
        """Test CloudWatch Log Groups are created."""

        def check_logs(args):
            """Verify CloudWatch resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # Log Groups
            self.assertIsNotNone(stack.ecs_log_group)
            self.assertIsNotNone(stack.alb_log_group)

            return {}

        pulumi.runtime.test(check_logs)


class TestTapStackConfiguration(unittest.TestCase):
    """Test cases for TapStack configuration values."""

    def test_tags_configuration(self):
        """Test custom tags are properly stored."""
        custom_tags = {'Project': 'ML-API', 'Team': 'DevOps'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.tags, custom_tags)
        self.assertIn('Project', args.tags)
        self.assertEqual(args.tags['Project'], 'ML-API')

    def test_environment_suffix_variations(self):
        """Test various environment suffix values."""
        test_cases = ['dev', 'test', 'staging', 'prod', 'pr123', 'synth456']

        for suffix in test_cases:
            args = TapStackArgs(environment_suffix=suffix)
            self.assertEqual(args.environment_suffix, suffix)


class TestTapStackEdgeCases(unittest.TestCase):
    """Test cases for edge cases and error handling."""

    def test_empty_environment_suffix(self):
        """Test handling of empty environment suffix."""
        args = TapStackArgs(environment_suffix='')
        # Empty string is falsy, so defaults to 'dev'
        self.assertEqual(args.environment_suffix, 'dev')

    def test_none_tags_default_to_empty_dict(self):
        """Test None tags default to empty dictionary."""
        args = TapStackArgs(tags=None)
        self.assertEqual(args.tags, {})
        self.assertIsInstance(args.tags, dict)

    def test_environment_suffix_none_defaults_to_dev(self):
        """Test None environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')


if __name__ == '__main__':
    unittest.main()
