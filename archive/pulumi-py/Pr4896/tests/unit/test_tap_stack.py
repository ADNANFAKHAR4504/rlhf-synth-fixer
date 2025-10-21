"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, mock_open
import pulumi

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
        custom_tags = {'Environment': 'test', 'Project': 'IoT'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)


class TestTapStackCreation(unittest.TestCase):
    """Test cases for TapStack instantiation."""

    @pulumi.runtime.test
    def test_tap_stack_instantiation(self):
        """Test that TapStack can be instantiated with proper arguments."""
        mocks = Mocks()
        pulumi.runtime.set_mocks(mocks)

        args = TapStackArgs(environment_suffix='test', tags={'Project': 'IoT'})
        stack = TapStack('test-stack', args)

        # Verify stack attributes
        assert stack.environment_suffix == 'test'
        assert stack.tags == {'Project': 'IoT'}

    @pulumi.runtime.test
    def test_tap_stack_with_default_args(self):
        """Test that TapStack uses default environment_suffix when not provided."""
        mocks = Mocks()
        pulumi.runtime.set_mocks(mocks)

        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        assert stack.environment_suffix == 'dev'


class Mocks(pulumi.runtime.Mocks):
    """Mock Pulumi runtime for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create a mock resource."""
        outputs = args.inputs

        # Add default outputs based on resource type
        if args.typ == 'aws:ec2/vpc:Vpc':
            outputs = {
                **args.inputs,
                'id': 'vpc-12345',
                'arn': 'arn:aws:ec2:ca-central-1:123456789012:vpc/vpc-12345',
                'owner_id': '123456789012',
                'cidr_block': args.inputs.get('cidrBlock', '10.0.0.0/16'),
                'enable_dns_hostnames': args.inputs.get('enableDnsHostnames', True),
                'enable_dns_support': args.inputs.get('enableDnsSupport', True),
                'tags': args.inputs.get('tags', {}),
            }
        elif args.typ == 'aws:apigateway/restApi:RestApi':
            outputs = {
                **args.inputs,
                'id': 'api-12345',
                'root_resource_id': 'root-12345',
                'name': args.inputs.get('name', ''),
                'description': args.inputs.get('description', ''),
            }
        elif args.typ == 'aws:elasticache/replicationGroup:ReplicationGroup':
            outputs = {
                **args.inputs,
                'id': 'redis-12345',
                'configuration_endpoint_address': 'redis-endpoint.cache.amazonaws.com',
            }
        elif args.typ == 'aws:rds/cluster:Cluster':
            outputs = {
                **args.inputs,
                'id': 'cluster-12345',
                'endpoint': 'cluster-endpoint.rds.amazonaws.com',
                'reader_endpoint': 'cluster-reader-endpoint.rds.amazonaws.com',
            }
        elif args.typ == 'aws:secretsmanager/secret:Secret':
            outputs = {
                **args.inputs,
                'id': 'secret-12345',
                'arn': 'arn:aws:secretsmanager:ca-central-1:123456789012:secret:secret-12345',
            }

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock Pulumi function calls."""
        if args.token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {
                'names': ['ca-central-1a', 'ca-central-1b', 'ca-central-1c'],
            }
        elif args.token == 'aws:index/getCallerIdentity:getCallerIdentity':
            return {
                'account_id': '123456789012',
            }

        return {}


if __name__ == '__main__':
    unittest.main()
