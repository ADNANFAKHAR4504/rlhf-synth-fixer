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


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'FedRAMP', 'Compliance': 'High'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class MyMocks(pulumi.runtime.Mocks):
    """Mock responses for Pulumi resources during testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {
            'id': f"{args.name}-id",
            **args.inputs,
        }

        # Add specific outputs for different resource types
        if args.typ == 'aws:ec2/vpc:Vpc':
            outputs['id'] = f"vpc-{args.name}"
        elif args.typ == 'aws:kinesis/stream:Stream':
            outputs['name'] = args.inputs.get('name', f"{args.name}")
            outputs['arn'] = f"arn:aws:kinesis:ap-southeast-1:123456789012:stream/{args.name}"
        elif args.typ == 'aws:ecs/cluster:Cluster':
            outputs['name'] = args.inputs.get('name', f"{args.name}")
            outputs['arn'] = f"arn:aws:ecs:ap-southeast-1:123456789012:cluster/{args.name}"
        elif args.typ == 'aws:rds/instance:Instance':
            outputs['endpoint'] = f"{args.name}.example.com:5432"
        elif args.typ == 'aws:elasticache/replicationGroup:ReplicationGroup':
            outputs['configuration_endpoint_address'] = f"{args.name}.cache.amazonaws.com"
        elif args.typ == 'aws:efs/fileSystem:FileSystem':
            outputs['arn'] = f"arn:aws:elasticfilesystem:ap-southeast-1:123456789012:file-system/{args.name}"
        elif args.typ == 'aws:apigatewayv2/api:Api':
            outputs['api_endpoint'] = f"https://{args.name}.execute-api.ap-southeast-1.amazonaws.com"
        elif args.typ == 'aws:lb/loadBalancer:LoadBalancer':
            outputs['dns_name'] = f"{args.name}.elb.amazonaws.com"
        elif args.typ == 'aws:kms/key:Key':
            outputs['arn'] = f"arn:aws:kms:ap-southeast-1:123456789012:key/{args.name}"
        elif args.typ == 'aws:cloudtrail/trail:Trail':
            outputs['name'] = args.inputs.get('name', f"{args.name}")

        return [outputs.get('id', f"{args.name}-id"), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test that TapStack creates successfully with mocked AWS resources."""
    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    def check_vpc_id(args):
        vpc_id = args[0]
        assert vpc_id is not None
        assert 'vpc-' in vpc_id or '-id' in vpc_id

    def check_kinesis_stream(args):
        stream_name, stream_arn = args
        assert stream_name is not None
        assert stream_arn is not None
        assert 'fedramp-data-stream' in stream_name
        assert 'kinesis' in stream_arn

    def check_ecs_cluster(args):
        cluster_name, cluster_arn = args
        assert cluster_name is not None
        assert cluster_arn is not None
        assert 'fedramp-cluster' in cluster_name
        assert 'ecs' in cluster_arn

    def check_rds_endpoint(args):
        endpoint = args[0]
        assert endpoint is not None
        assert ':5432' in endpoint or 'example.com' in endpoint

    def check_elasticache_endpoint(args):
        endpoint = args[0]
        assert endpoint is not None
        assert 'cache' in endpoint or '-id' in endpoint

    def check_efs_resources(args):
        efs_id, efs_arn = args
        assert efs_id is not None
        assert efs_arn is not None

    def check_api_endpoint(args):
        endpoint = args[0]
        assert endpoint is not None
        assert 'https://' in endpoint or 'execute-api' in endpoint or '-id' in endpoint

    def check_alb_dns(args):
        dns = args[0]
        assert dns is not None
        assert '.elb.' in dns or '-id' in dns

    def check_kms_key(args):
        key_id = args[0]
        assert key_id is not None

    def check_cloudtrail(args):
        trail_name = args[0]
        assert trail_name is not None
        assert 'fedramp-audit' in trail_name

    return pulumi.Output.all(
        stack.vpc_id,
    ).apply(check_vpc_id).apply(lambda _: pulumi.Output.all(
        stack.kinesis_stream_name,
        stack.kinesis_stream_arn,
    ).apply(check_kinesis_stream)).apply(lambda _: pulumi.Output.all(
        stack.ecs_cluster_name,
        stack.ecs_cluster_arn,
    ).apply(check_ecs_cluster)).apply(lambda _: pulumi.Output.all(
        stack.rds_endpoint,
    ).apply(check_rds_endpoint)).apply(lambda _: pulumi.Output.all(
        stack.elasticache_endpoint,
    ).apply(check_elasticache_endpoint)).apply(lambda _: pulumi.Output.all(
        stack.efs_id,
        stack.efs_arn,
    ).apply(check_efs_resources)).apply(lambda _: pulumi.Output.all(
        stack.api_endpoint,
    ).apply(check_api_endpoint)).apply(lambda _: pulumi.Output.all(
        stack.alb_dns,
    ).apply(check_alb_dns)).apply(lambda _: pulumi.Output.all(
        stack.kms_key_id,
    ).apply(check_kms_key)).apply(lambda _: pulumi.Output.all(
        stack.cloudtrail_name,
    ).apply(check_cloudtrail))


pulumi.runtime.set_mocks(MyMocks())


if __name__ == '__main__':
    unittest.main()
