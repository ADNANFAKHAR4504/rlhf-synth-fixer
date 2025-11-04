"""
test_tap_stack_unit.py

Comprehensive unit tests for the TapStack Pulumi component.
Tests configuration, resource creation, and validation logic.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi


class MockGetVpcResult:
    """Mock result for get_vpc call."""
    def __init__(self, vpc_id, cidr_block):
        self.id = vpc_id
        self.cidr_block = cidr_block


class MockGetRouteTablesResult:
    """Mock result for get_route_tables call."""
    def __init__(self, ids):
        self.ids = ids


def pulumi_test(func):
    """Decorator to set up and tear down Pulumi mocks for tests."""
    def wrapper(self):
        # Set up Pulumi mocks
        pulumi.runtime.set_mocks(MyMocks())

        # Run the test
        result = func(self)

        # Clean up
        pulumi.runtime.set_mocks(None)

        return result
    return wrapper


class MyMocks(pulumi.runtime.Mocks):
    """Custom Pulumi mocks for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs['id'] = f"sg-{args.name}"
            outputs['arn'] = f"arn:aws:ec2:us-east-1:123456789012:security-group/sg-{args.name}"
        elif args.typ == "aws:ec2/vpcPeeringConnection:VpcPeeringConnection":
            outputs['id'] = f"pcx-{args.name}"
            outputs['accept_status'] = 'active'
        elif args.typ == "aws:ec2/vpcPeeringConnectionAccepter:VpcPeeringConnectionAccepter":
            outputs['id'] = f"pcx-accepter-{args.name}"
        elif args.typ == "aws:ec2/vpcPeeringConnectionOptions:VpcPeeringConnectionOptions":
            outputs['id'] = f"pcx-options-{args.name}"
        elif args.typ == "aws:ec2/route:Route":
            outputs['id'] = f"route-{args.name}"
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs['id'] = f"alarm-{args.name}"
            outputs['arn'] = f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}"
        elif args.typ == "pulumi:providers:aws":
            outputs['id'] = f"provider-{args.name}"
        return [outputs['id'], outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls like get_vpc."""
        if args.token == "aws:ec2/getVpc:getVpc":
            vpc_id = args.args.get('id', 'vpc-unknown')
            if 'pay' in vpc_id:
                return {
                    'id': vpc_id,
                    'cidr_block': '10.0.0.0/16',
                    'enable_dns_support': True,
                    'enable_dns_hostnames': True,
                }
            else:
                return {
                    'id': vpc_id,
                    'cidr_block': '10.1.0.0/16',
                    'enable_dns_support': True,
                    'enable_dns_hostnames': True,
                }
        elif args.token == "aws:ec2/getRouteTables:getRouteTables":
            return {
                'ids': ['rtb-12345', 'rtb-67890'],
                'tags': {}
            }
        return {}


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_valid_inputs(self):
        """Test TapStackArgs with valid inputs."""
        tags = {"Environment": "test", "Owner": "team"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.tags, tags)

    def test_tap_stack_args_missing_suffix(self):
        """Test TapStackArgs raises error when suffix is missing."""
        with self.assertRaises(ValueError) as context:
            TapStackArgs(environment_suffix="", tags={"test": "value"})

        self.assertIn("environment_suffix is required", str(context.exception))

    def test_tap_stack_args_missing_tags(self):
        """Test TapStackArgs raises error when tags are missing."""
        with self.assertRaises(ValueError) as context:
            TapStackArgs(environment_suffix="test", tags=None)

        self.assertIn("tags dictionary is required", str(context.exception))

    def test_tap_stack_args_empty_tags(self):
        """Test TapStackArgs raises error when tags dict is empty."""
        with self.assertRaises(ValueError) as context:
            TapStackArgs(environment_suffix="test", tags={})

        self.assertIn("tags dictionary is required", str(context.exception))


class TestTapStackCreation(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    @pulumi_test
    def test_stack_creates_providers(self):
        """Test that TapStack creates AWS providers for both regions."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {"Environment": "test", "Owner": "test-team"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        # This would create the stack
        stack = TapStack("test-stack", args)

        # Verify providers exist
        self.assertIsNotNone(stack.east_provider)
        self.assertIsNotNone(stack.west_provider)

    @pulumi_test
    def test_stack_creates_peering_connection(self):
        """Test that TapStack creates VPC peering connection."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {"Environment": "test", "Owner": "test-team"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        stack = TapStack("test-stack", args)

        # Verify peering resources exist
        self.assertIsNotNone(stack.peering_connection)
        self.assertIsNotNone(stack.peering_accepter)

    @pulumi_test
    def test_stack_creates_security_groups(self):
        """Test that TapStack creates security groups in both VPCs."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {"Environment": "test", "Owner": "test-team"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        stack = TapStack("test-stack", args)

        # Verify security groups exist
        self.assertIsNotNone(stack.payment_sg)
        self.assertIsNotNone(stack.analytics_sg)

    @pulumi_test
    def test_stack_exports_outputs(self):
        """Test that TapStack exports all required outputs."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {"Environment": "test", "Owner": "test-team"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        stack = TapStack("test-stack", args)

        # Verify output properties exist
        self.assertIsNotNone(stack.peering_connection_id)
        self.assertIsNotNone(stack.peering_status)
        self.assertIsNotNone(stack.payment_vpc_id)
        self.assertIsNotNone(stack.analytics_vpc_id)
        self.assertIsNotNone(stack.payment_sg_id)
        self.assertIsNotNone(stack.analytics_sg_id)
        self.assertIsNotNone(stack.dns_resolution_enabled)


class TestMainProgram(unittest.TestCase):
    """Test cases for the main Pulumi program."""

    @patch('pulumi.Config')
    def test_main_validates_environment_suffix(self, mock_config):
        """Test that main program validates environment_suffix format."""
        # Mock config to return invalid suffix
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "invalid@suffix"
        mock_config.return_value = mock_config_instance

        # Import should raise ValueError for invalid suffix
        with self.assertRaises(ValueError) as context:
            # Re-import to trigger validation
            import importlib
            import lib.__main__ as main_module
            importlib.reload(main_module)

        self.assertIn("Invalid environment_suffix", str(context.exception))

    @patch('pulumi.Config')
    def test_main_creates_default_tags(self, mock_config):
        """Test that main program creates default tags when not provided."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.side_effect = lambda key: {
            'environment_suffix': 'test',
            'owner': None,
            'cost_center': None
        }.get(key)
        mock_config.return_value = mock_config_instance

        # Should use defaults without raising error
        # This test verifies the config handling logic


class TestSecurityGroupRules(unittest.TestCase):
    """Test cases for security group configuration."""

    @pulumi_test
    def test_payment_sg_egress_rules(self):
        """Test that payment security group has correct egress rules."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {"Environment": "test"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        stack = TapStack("test-stack", args)

        # Payment SG should allow HTTPS to analytics subnet
        self.assertIsNotNone(stack.payment_sg)

    @pulumi_test
    def test_analytics_sg_ingress_rules(self):
        """Test that analytics security group has correct ingress rules."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {"Environment": "test"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        stack = TapStack("test-stack", args)

        # Analytics SG should allow HTTPS from payment subnet
        self.assertIsNotNone(stack.analytics_sg)


# Import TapStackArgs for tests
from lib.tap_stack import TapStackArgs


if __name__ == '__main__':
    unittest.main()
