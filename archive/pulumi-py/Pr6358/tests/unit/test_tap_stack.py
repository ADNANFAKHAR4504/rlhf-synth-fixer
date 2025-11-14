"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(pulumi.runtime.Mocks):
    """Custom mock for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {
            **args.inputs,
            'id': f"{args.name}_id",
            'arn': f"arn:aws:{args.typ}:us-east-1:123456789:resource/{args.name}",
        }
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_with_required_values(self):
        """Test TapStackArgs with required values."""
        args = TapStackArgs(
            environment='dev',
            environment_suffix='dev123',
            vpc_cidr='10.0.0.0/16',
            instance_type='t3.micro',
            asg_min_size=1,
            asg_max_size=3,
            asg_desired_capacity=2,
            rds_instance_class='db.t3.micro'
        )
        
        self.assertEqual(args.environment, 'dev')
        self.assertEqual(args.environment_suffix, 'dev123')
        self.assertEqual(args.vpc_cidr, '10.0.0.0/16')
        self.assertEqual(args.instance_type, 't3.micro')
        self.assertEqual(args.asg_min_size, 1)
        self.assertEqual(args.asg_max_size, 3)
        self.assertEqual(args.asg_desired_capacity, 2)
        self.assertEqual(args.rds_instance_class, 'db.t3.micro')
        self.assertFalse(args.rds_multi_az)
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_rds_multi_az(self):
        """Test TapStackArgs with RDS Multi-AZ enabled."""
        args = TapStackArgs(
            environment='prod',
            environment_suffix='prod456',
            vpc_cidr='10.1.0.0/16',
            instance_type='t3.small',
            asg_min_size=2,
            asg_max_size=6,
            asg_desired_capacity=4,
            rds_instance_class='db.t3.small',
            rds_multi_az=True
        )
        
        self.assertTrue(args.rds_multi_az)

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {"Environment": "test", "ManagedBy": "Pulumi", "Team": "DevOps"}
        args = TapStackArgs(
            environment='staging',
            environment_suffix='stg789',
            vpc_cidr='10.2.0.0/16',
            instance_type='t3.medium',
            asg_min_size=1,
            asg_max_size=4,
            asg_desired_capacity=2,
            rds_instance_class='db.t3.small',
            tags=custom_tags
        )
        
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_with_all_values(self):
        """Test TapStackArgs with all custom values."""
        custom_tags = {"Environment": "staging", "Team": "DevOps"}
        args = TapStackArgs(
            environment='staging',
            environment_suffix='stg',
            vpc_cidr='10.3.0.0/16',
            instance_type='t3.large',
            asg_min_size=2,
            asg_max_size=8,
            asg_desired_capacity=5,
            rds_instance_class='db.t3.medium',
            rds_multi_az=True,
            tags=custom_tags
        )
        
        self.assertEqual(args.environment_suffix, 'stg')
        self.assertEqual(args.tags, custom_tags)
        self.assertTrue(args.rds_multi_az)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_instantiation(self):
        """Test that TapStack can be instantiated."""
        args = TapStackArgs(
            environment='test',
            environment_suffix='test123',
            vpc_cidr='10.0.0.0/16',
            instance_type='t3.micro',
            asg_min_size=1,
            asg_max_size=3,
            asg_desired_capacity=2,
            rds_instance_class='db.t3.micro'
        )
        stack = TapStack("test-stack", args=args)
        
        self.assertIsNotNone(stack)
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.alb)
        self.assertIsNotNone(stack.asg)
        self.assertIsNotNone(stack.rds)
        self.assertIsNotNone(stack.s3_bucket)

    @pulumi.runtime.test
    def test_tap_stack_with_minimal_config(self):
        """Test TapStack with minimal configuration."""
        args = TapStackArgs(
            environment='dev',
            environment_suffix='dev456',
            vpc_cidr='10.1.0.0/16',
            instance_type='t3.nano',
            asg_min_size=1,
            asg_max_size=2,
            asg_desired_capacity=1,
            rds_instance_class='db.t3.micro'
        )
        stack = TapStack("minimal-stack", args=args)
        
        self.assertIsNotNone(stack)

    @pulumi.runtime.test
    def test_tap_stack_with_tags(self):
        """Test TapStack with custom tags."""
        custom_tags = {"Project": "TAP", "Environment": "prod", "Team": "Platform"}
        args = TapStackArgs(
            environment='prod',
            environment_suffix='prod789',
            vpc_cidr='10.2.0.0/16',
            instance_type='t3.small',
            asg_min_size=2,
            asg_max_size=6,
            asg_desired_capacity=4,
            rds_instance_class='db.t3.small',
            rds_multi_az=True,
            tags=custom_tags
        )
        stack = TapStack("tagged-stack", args=args)
        
        self.assertIsNotNone(stack)


if __name__ == '__main__':
    unittest.main()
