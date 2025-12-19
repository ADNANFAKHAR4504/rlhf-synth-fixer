"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
Tests all infrastructure components and their configurations.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os
import pulumi

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))

# Import after mocking is set up
from tap_stack import TapStack, TapStackArgs


class MyMocks(pulumi.runtime.Mocks):
    """Custom mocks for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:rds/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "endpoint": f"{args.name}.cluster-123.us-east-1.rds.amazonaws.com",
                "arn": f"arn:aws:rds:us-east-1:123456789012:cluster:{args.name}",
            }
        elif args.typ == "aws:rds/globalCluster:GlobalCluster":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-global-id",
                "arn": f"arn:aws:rds::123456789012:global-cluster:{args.name}",
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "name": args.name,
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
            }
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "bucket": args.name,
                "arn": f"arn:aws:s3:::{args.name}",
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "name": args.name,
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-api-id",
                "execution_arn": f"arn:aws:execute-api:us-east-1:123456789012:{args.name}",
            }
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-stage-id",
                "stage_name": "prod",
            }
        elif args.typ == "aws:route53/healthCheck:HealthCheck":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-hc-id",
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-topic-id",
                "arn": f"arn:aws:sns:us-east-1:123456789012:{args.name}",
            }
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-alarm-id",
                "arn": f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}",
            }
        elif args.typ == "aws:cloudwatch/compositeAlarm:CompositeAlarm":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-composite-alarm-id",
                "arn": f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}",
            }
        elif args.typ == "aws:synthetics/canary:Canary":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-canary-id",
                "arn": f"arn:aws:synthetics:us-east-1:123456789012:canary:{args.name}",
            }
        else:
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
            }
        return [f"{args.name}-id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:ec2/getVpc:getVpc":
            return {"id": "vpc-12345", "cidr_block": "10.0.0.0/16"}
        elif args.token == "aws:ec2/getSubnets:getSubnets":
            return {"ids": ["subnet-1", "subnet-2", "subnet-3"]}
        elif args.token == "aws:getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012"}
        return {}


pulumi.runtime.set_mocks(MyMocks(), preview=False)


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.primary_region, 'eu-central-1')
        self.assertEqual(args.secondary_region, 'eu-central-2')
        self.assertIsNone(args.domain_name)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Environment': 'test', 'Project': 'DR'}
        args = TapStackArgs(
            environment_suffix='test123',
            tags=custom_tags,
            primary_region='us-west-1',
            secondary_region='us-west-2',
            domain_name='example.com'
        )

        self.assertEqual(args.environment_suffix, 'test123')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.primary_region, 'us-west-1')
        self.assertEqual(args.secondary_region, 'us-west-2')
        self.assertEqual(args.domain_name, 'example.com')


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test TapStack component creation."""

    def check_stack(args):
        stack = TapStack(
            name="test-trading-platform",
            args=TapStackArgs(
                environment_suffix='test',
                tags={'Environment': 'test'},
                primary_region='us-east-1',
                secondary_region='us-east-2'
            )
        )
        return {
            'environment_suffix': stack.environment_suffix,
            'primary_region': stack.primary_region,
            'secondary_region': stack.secondary_region,
        }

    result = pulumi.Output.all().apply(lambda _: check_stack(None))
    return result


@pulumi.runtime.test
def test_tap_stack_has_all_components():
    """Test that TapStack creates all required infrastructure components."""

    def check_components(args):
        stack = TapStack(
            name="test-trading-platform",
            args=TapStackArgs(
                environment_suffix='test',
                tags={'Environment': 'test'}
            )
        )

        # Verify all stacks are created
        assert hasattr(stack, 'sns_stack'), "SNS stack should exist"
        assert hasattr(stack, 'aurora_stack'), "Aurora stack should exist"
        assert hasattr(stack, 'dynamodb_stack'), "DynamoDB stack should exist"
        assert hasattr(stack, 's3_stack'), "S3 stack should exist"
        assert hasattr(stack, 'lambda_stack'), "Lambda stack should exist"
        assert hasattr(stack, 'api_gateway_stack'), "API Gateway stack should exist"
        assert hasattr(stack, 'route53_stack'), "Route53 stack should exist"
        assert hasattr(stack, 'monitoring_stack'), "Monitoring stack should exist"
        assert hasattr(stack, 'synthetics_stack'), "Synthetics stack should exist"
        assert hasattr(stack, 'failover_stack'), "Failover stack should exist"

        return {'status': 'all_components_present'}

    result = pulumi.Output.all().apply(lambda _: check_components(None))
    return result


@pulumi.runtime.test
def test_tap_stack_environment_suffix():
    """Test that environment_suffix is properly propagated."""

    def check_suffix(args):
        suffix = 'testenv123'
        stack = TapStack(
            name="test-trading-platform",
            args=TapStackArgs(
                environment_suffix=suffix,
                tags={'Environment': 'test'}
            )
        )

        assert stack.environment_suffix == suffix
        return {'environment_suffix': stack.environment_suffix}

    result = pulumi.Output.all().apply(lambda _: check_suffix(None))
    return result


@pulumi.runtime.test
def test_tap_stack_tags_propagation():
    """Test that tags are properly propagated."""

    def check_tags(args):
        custom_tags = {
            'Environment': 'production',
            'Team': 'platform',
            'CostCenter': '1234'
        }
        stack = TapStack(
            name="test-trading-platform",
            args=TapStackArgs(
                environment_suffix='prod',
                tags=custom_tags
            )
        )

        assert stack.tags == custom_tags
        return {'tags': stack.tags}

    result = pulumi.Output.all().apply(lambda _: check_tags(None))
    return result


@pulumi.runtime.test
def test_tap_stack_regions():
    """Test that regions are properly configured."""

    def check_regions(args):
        stack = TapStack(
            name="test-trading-platform",
            args=TapStackArgs(
                environment_suffix='test',
                primary_region='eu-west-1',
                secondary_region='eu-central-1',
                tags={'Environment': 'test'}
            )
        )

        assert stack.primary_region == 'eu-west-1'
        assert stack.secondary_region == 'eu-central-1'
        return {
            'primary_region': stack.primary_region,
            'secondary_region': stack.secondary_region
        }

    result = pulumi.Output.all().apply(lambda _: check_regions(None))
    return result


class TestTapStackOutputs(unittest.TestCase):
    """Test TapStack outputs."""

    @pulumi.runtime.test
    def test_stack_has_required_outputs(self):
        """Test that stack exports required outputs."""

        def check_outputs(args):
            stack = TapStack(
                name="test-trading-platform",
                args=TapStackArgs(
                    environment_suffix='test',
                    tags={'Environment': 'test'}
                )
            )

            # Check that key outputs exist
            assert hasattr(stack.api_gateway_stack, 'primary_api_endpoint')
            assert hasattr(stack.api_gateway_stack, 'secondary_api_endpoint')
            assert hasattr(stack.aurora_stack, 'primary_endpoint')
            assert hasattr(stack.dynamodb_stack, 'table_name')

            return {'status': 'outputs_present'}

        result = pulumi.Output.all().apply(lambda _: check_outputs(None))
        return result


if __name__ == '__main__':
    unittest.main()
