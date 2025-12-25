"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_custom_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Project': 'TestProject', 'Owner': 'TestOwner'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource provider for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new resource creation - return valid outputs."""
        outputs = dict(args.inputs)

        # Add resource-specific mock outputs
        if "vpc" in args.typ.lower():
            outputs.update({"id": f"vpc-{args.name}", "cidr_block": "10.0.0.0/16"})
        elif "subnet" in args.typ.lower():
            outputs.update({"id": f"subnet-{args.name}", "availability_zone": "us-east-1a"})
        elif "bucket" in args.typ.lower():
            bucket_name = args.inputs.get('bucket', args.name)
            outputs.update({
                "id": f"s3-{args.name}",
                "bucket": bucket_name,
                "arn": f"arn:aws:s3:::{bucket_name}"
            })
        elif "lambda" in args.typ.lower() and "function" in args.typ.lower():
            outputs.update({
                "id": f"lambda-{args.name}",
                "name": args.name,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}"
            })
        elif "role" in args.typ.lower():
            outputs.update({
                "id": f"role-{args.name}",
                "name": args.name,
                "arn": f"arn:aws:iam::123456789012:role/{args.name}"
            })
        else:
            outputs.update({"id": f"{args.typ}-{args.name}"})

        return [f"{args.name}_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock invocation calls like get_availability_zones."""
        if "getAvailabilityZones" in args.token:
            return {
                "names": ["us-east-1a", "us-east-1b"],
                "zone_ids": ["use1-az1", "use1-az2"]
            }
        return {}


class TestTapStackCreation(unittest.TestCase):
    """Test cases for TapStack creation."""

    @pulumi.runtime.test
    def test_stack_creation_basic(self):
        """Test basic TapStack instantiation."""
        pulumi.runtime.set_mocks(MyMocks())

        # Create stack
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify basic properties
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertEqual(stack.region, 'us-east-1')

    @pulumi.runtime.test
    def test_stack_with_tags(self):
        """Test TapStack with custom tags."""
        pulumi.runtime.set_mocks(MyMocks())

        tags = {'Environment': 'prod', 'Team': 'DevOps'}
        args = TapStackArgs(environment_suffix='prod', tags=tags)
        stack = TapStack('test-stack-tags', args)

        # Verify tags are merged
        self.assertIn('Project', stack.common_tags)
        self.assertIn('Environment', stack.common_tags)
        self.assertEqual(stack.common_tags['Stage'], 'prod')

    @pulumi.runtime.test
    def test_networking_components(self):
        """Test networking resources are created."""
        pulumi.runtime.set_mocks(MyMocks())

        args = TapStackArgs(environment_suffix='net')
        stack = TapStack('test-net', args)

        # Verify networking components exist
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.public_subnets)
        self.assertIsNotNone(stack.private_subnets)
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.nat_gw)
        self.assertIsNotNone(stack.eip)

    @pulumi.runtime.test
    def test_route_tables_created(self):
        """Test route tables are set up."""
        pulumi.runtime.set_mocks(MyMocks())

        args = TapStackArgs(environment_suffix='rt')
        stack = TapStack('test-rt', args)

        # Verify route tables
        self.assertIsNotNone(stack.public_rt)
        self.assertIsNotNone(stack.private_rt)

    @pulumi.runtime.test
    def test_storage_components(self):
        """Test S3 storage resources."""
        pulumi.runtime.set_mocks(MyMocks())

        args = TapStackArgs(environment_suffix='s3')
        stack = TapStack('test-s3', args)

        # Verify S3 resources
        self.assertIsNotNone(stack.s3_bucket)
        self.assertIsNotNone(stack.bucket_versioning)
        self.assertIsNotNone(stack.bucket_encryption)

    @pulumi.runtime.test
    def test_compute_components(self):
        """Test Lambda compute resources."""
        pulumi.runtime.set_mocks(MyMocks())

        args = TapStackArgs(environment_suffix='lambda')
        stack = TapStack('test-lambda', args)

        # Verify compute resources
        self.assertIsNotNone(stack.lambda_role)
        self.assertIsNotNone(stack.lambda_function)

    @pulumi.runtime.test
    def test_monitoring_components(self):
        """Test CloudWatch monitoring resources."""
        pulumi.runtime.set_mocks(MyMocks())

        args = TapStackArgs(environment_suffix='cw')
        stack = TapStack('test-cw', args)

        # Verify monitoring
        self.assertIsNotNone(stack.log_group)

    @pulumi.runtime.test
    def test_output_properties(self):
        """Test stack output properties."""
        pulumi.runtime.set_mocks(MyMocks())

        args = TapStackArgs(environment_suffix='out')
        stack = TapStack('test-out', args)

        # Test property methods
        self.assertIsNotNone(stack.vpc_id)
        self.assertIsNotNone(stack.public_subnet_ids)
        self.assertIsNotNone(stack.private_subnet_ids)
        self.assertIsNotNone(stack.bucket_name)
        self.assertIsNotNone(stack.lambda_name)

        # Verify list lengths
        self.assertEqual(len(stack.public_subnet_ids), 2)
        self.assertEqual(len(stack.private_subnet_ids), 2)


if __name__ == '__main__':
    unittest.main()
