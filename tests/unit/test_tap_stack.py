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
        if args.token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {
                'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                'zoneIds': ['use1-az1', 'use1-az2', 'use1-az3']
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
            vpc = args[0]
            self.assertEqual(vpc['cidr_block'], '10.0.0.0/16')
            self.assertTrue(vpc['enable_dns_hostnames'])
            self.assertTrue(vpc['enable_dns_support'])
            self.assertIn('Environment', vpc['tags'])
            self.assertIn('Project', vpc['tags'])

        return pulumi.Output.all(
            TapStack('test-stack', TapStackArgs(environment_suffix='test')).vpc
        ).apply(check_vpc)

    @pulumi.runtime.test
    def test_tap_stack_subnets_created(self):
        """Test all subnets are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnets(args):
            public_subnets, private_subnets, isolated_subnets = args
            self.assertEqual(len(public_subnets), 3, "Should have 3 public subnets")
            self.assertEqual(len(private_subnets), 3, "Should have 3 private subnets")
            self.assertEqual(len(isolated_subnets), 3, "Should have 3 isolated subnets")

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        return pulumi.Output.all(
            stack.public_subnets,
            stack.private_subnets,
            stack.isolated_subnets
        ).apply(check_subnets)

    @pulumi.runtime.test
    def test_tap_stack_nat_gateways(self):
        """Test NAT Gateways are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_nat_gateways(args):
            nat_gateways = args[0]
            self.assertEqual(len(nat_gateways), 3, "Should have 3 NAT Gateways")

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        return pulumi.Output.all(stack.nat_gateways).apply(check_nat_gateways)

    @pulumi.runtime.test
    def test_tap_stack_internet_gateway(self):
        """Test Internet Gateway is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_igw(args):
            igw = args[0]
            self.assertIsNotNone(igw)

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        return pulumi.Output.all(stack.igw).apply(check_igw)

    @pulumi.runtime.test
    def test_tap_stack_s3_bucket(self):
        """Test S3 bucket for flow logs is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_bucket(args):
            bucket = args[0]
            self.assertIsNotNone(bucket)
            self.assertTrue(bucket['versioning']['enabled'])
            self.assertTrue(bucket['force_destroy'])
            self.assertEqual(
                bucket['server_side_encryption_configuration']['rule']['apply_server_side_encryption_by_default']['sse_algorithm'],
                'AES256'
            )
            self.assertEqual(len(bucket['lifecycle_rules']), 1)
            self.assertEqual(bucket['lifecycle_rules'][0]['transitions'][0]['days'], 30)
            self.assertEqual(bucket['lifecycle_rules'][0]['transitions'][0]['storage_class'], 'GLACIER')

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        return pulumi.Output.all(stack.flow_logs_bucket).apply(check_bucket)

    @pulumi.runtime.test
    def test_tap_stack_tags(self):
        """Test stack applies correct tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            vpc = args[0]
            tags = vpc['tags']
            self.assertEqual(tags['Environment'], 'production')
            self.assertEqual(tags['Project'], 'trading-platform')
            self.assertEqual(tags['Team'], 'Infrastructure')
            self.assertEqual(tags['CostCenter'], '9999')

        custom_tags = {'Team': 'Infrastructure', 'CostCenter': '9999'}
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='prod', tags=custom_tags))
        return pulumi.Output.all(stack.vpc).apply(check_tags)

    @pulumi.runtime.test
    def test_tap_stack_environment_suffix(self):
        """Test environment suffix is applied to resource names."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_suffix(args):
            vpc = args[0]
            self.assertIn('myenv', vpc['tags']['Name'])

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='myenv'))
        return pulumi.Output.all(stack.vpc).apply(check_suffix)

    @pulumi.runtime.test
    def test_tap_stack_route_tables(self):
        """Test route tables are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_route_tables(args):
            public_rt, private_rts, isolated_rts = args
            self.assertIsNotNone(public_rt)
            self.assertEqual(len(private_rts), 3, "Should have 3 private route tables")
            self.assertEqual(len(isolated_rts), 3, "Should have 3 isolated route tables")

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        return pulumi.Output.all(
            stack.public_route_table,
            stack.private_route_tables,
            stack.isolated_route_tables
        ).apply(check_route_tables)

    @pulumi.runtime.test
    def test_tap_stack_network_acl(self):
        """Test Network ACL is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_nacl(args):
            nacl = args[0]
            self.assertIsNotNone(nacl)

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        return pulumi.Output.all(stack.public_nacl).apply(check_nacl)

    @pulumi.runtime.test
    def test_tap_stack_eips(self):
        """Test Elastic IPs are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_eips(args):
            eips = args[0]
            self.assertEqual(len(eips), 3, "Should have 3 Elastic IPs")
            for eip in eips:
                self.assertEqual(eip['domain'], 'vpc')

        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        return pulumi.Output.all(stack.nat_eips).apply(check_eips)


if __name__ == '__main__':
    unittest.main()
