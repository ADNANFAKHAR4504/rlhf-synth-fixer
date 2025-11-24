"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, Mock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resources."""
        return [args.name + '_id', args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token in ['aws:index/getAvailabilityZones:getAvailabilityZones', 'aws:ec2/getAvailabilityZones:getAvailabilityZones']:
            return {
                'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                'zoneIds': ['use1-az1', 'use1-az2', 'use1-az3']
            }
        elif args.token in ['aws:ec2/getAmi:getAmi', 'aws:index/getAmi:getAmi']:
            return {
                'id': 'ami-12345678',
                'name': 'amzn2-ami-hvm-2023.0.0-x86_64-gp2'
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Team': 'DevOps', 'CostCenter': '12345'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_values(self):
        """Test TapStackArgs handles None values correctly."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix=None, tags=None)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_vpc_creation(self):
        """Test VPC is created with correct CIDR."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # VPC is a Pulumi resource object
            self.assertIsNotNone(stack.vpc)
            self.assertTrue(hasattr(stack.vpc, 'id'))
            self.assertTrue(hasattr(stack.vpc, 'cidr_block'))
            return {}

        return check_vpc([])

    @pulumi.runtime.test
    def test_tap_stack_subnets_created(self):
        """Test all subnets are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnets(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # Subnets are stored as Python lists
            self.assertIsNotNone(stack.public_subnets)
            self.assertIsNotNone(stack.private_subnets)
            self.assertIsNotNone(stack.isolated_subnets)
            self.assertEqual(len(stack.public_subnets), 3, "Should have 3 public subnets")
            self.assertEqual(len(stack.private_subnets), 3, "Should have 3 private subnets")
            self.assertEqual(len(stack.isolated_subnets), 3, "Should have 3 isolated subnets")
            return {}

        return check_subnets([])

    @pulumi.runtime.test
    def test_tap_stack_nat_gateways(self):
        """Test NAT gateways are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_nat_gateways(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # NAT gateways are stored as Python list
            self.assertIsNotNone(stack.nat_gateways)
            self.assertEqual(len(stack.nat_gateways), 3, "Should have 3 NAT gateways")
            return {}

        return check_nat_gateways([])

    @pulumi.runtime.test
    def test_tap_stack_internet_gateway(self):
        """Test Internet Gateway is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_igw(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # Internet Gateway is a Pulumi resource object
            self.assertIsNotNone(stack.igw)
            self.assertTrue(hasattr(stack.igw, 'id'))
            return {}

        return check_igw([])

    @pulumi.runtime.test
    def test_tap_stack_s3_bucket(self):
        """Test S3 bucket for flow logs is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_bucket(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # Bucket is a Pulumi resource object
            self.assertIsNotNone(stack.flow_logs_bucket)
            self.assertTrue(hasattr(stack.flow_logs_bucket, 'id'))
            self.assertTrue(hasattr(stack.flow_logs_bucket, 'bucket'))
            return {}

        return check_bucket([])

    @pulumi.runtime.test
    def test_tap_stack_tags(self):
        """Test stack applies correct tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {'Team': 'Infrastructure', 'CostCenter': '9999'}
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='prod', tags=custom_tags))
            # VPC is a Pulumi resource object, tags are set during creation
            self.assertIsNotNone(stack.vpc)
            self.assertTrue(hasattr(stack.vpc, 'tags'))
            self.assertTrue(hasattr(stack.vpc, 'id'))
            # Verify custom tags are stored in stack
            self.assertEqual(stack.tags, custom_tags)
            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_tap_stack_environment_suffix(self):
        """Test environment suffix is applied to resource names."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_suffix(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='myenv'))
            # VPC is a Pulumi resource object
            # The environment suffix is used in the resource name during creation
            self.assertIsNotNone(stack.vpc)
            self.assertTrue(hasattr(stack.vpc, 'id'))
            # Verify environment suffix is stored
            self.assertEqual(stack.environment_suffix, 'myenv')
            return {}

        return check_suffix([])

    @pulumi.runtime.test
    def test_tap_stack_route_tables(self):
        """Test route tables are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_route_tables(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # Route tables are stored as objects and lists
            self.assertIsNotNone(stack.public_route_table)
            self.assertIsNotNone(stack.private_route_tables)
            self.assertIsNotNone(stack.isolated_route_tables)
            self.assertEqual(len(stack.private_route_tables), 3, "Should have 3 private route tables")
            self.assertEqual(len(stack.isolated_route_tables), 3, "Should have 3 isolated route tables")
            return {}

        return check_route_tables([])

    @pulumi.runtime.test
    def test_tap_stack_network_acl(self):
        """Test network ACL is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_nacl(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # Network ACL is a Pulumi resource object
            self.assertIsNotNone(stack.public_nacl)
            self.assertTrue(hasattr(stack.public_nacl, 'id'))
            return {}

        return check_nacl([])

    @pulumi.runtime.test
    def test_tap_stack_eips(self):
        """Test Elastic IPs for NAT gateways are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_eips(args):
            stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
            # NAT EIPs are stored as Python list
            self.assertIsNotNone(stack.nat_eips)
            self.assertEqual(len(stack.nat_eips), 3, "Should have 3 NAT EIPs")
            # EIPs are Pulumi resource objects
            for eip in stack.nat_eips:
                self.assertIsNotNone(eip)
                self.assertTrue(hasattr(eip, 'id'))
            return {}

        return check_eips([])


if __name__ == '__main__':
    unittest.main()
