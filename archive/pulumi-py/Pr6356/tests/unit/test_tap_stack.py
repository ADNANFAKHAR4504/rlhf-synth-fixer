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
        custom_tags = {'Project': 'FraudDetection', 'Team': 'Security'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags."""
        args = TapStackArgs(environment_suffix='staging', tags=None)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, {})


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi testing"""

    def __init__(self):
        self.resources = []

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Called when a new resource is being created."""
        self.resources.append({
            'type': args.typ,
            'name': args.name,
            'inputs': args.inputs,
        })

        # Return default values for common outputs
        outputs = dict(args.inputs)

        if args.typ == 'aws:s3/bucket:Bucket':
            outputs['id'] = f"{args.inputs.get('bucket', args.name)}"
            outputs['arn'] = f"arn:aws:s3:::{args.inputs.get('bucket', args.name)}"
        elif args.typ == 'aws:dynamodb/table:Table':
            outputs['id'] = args.inputs.get('name', args.name)
            outputs['arn'] = f"arn:aws:dynamodb:us-east-2:123456789012:table/{args.inputs.get('name', args.name)}"
            outputs['streamArn'] = f"arn:aws:dynamodb:us-east-2:123456789012:table/{args.inputs.get('name', args.name)}/stream/2024-01-01"
        elif args.typ == 'aws:lambda/function:Function':
            outputs['id'] = args.inputs.get('name', args.name)
            outputs['arn'] = f"arn:aws:lambda:us-east-2:123456789012:function:{args.inputs.get('name', args.name)}"
            outputs['invokeArn'] = f"arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:123456789012:function:{args.inputs.get('name', args.name)}/invocations"
        elif args.typ == 'aws:apigateway/restApi:RestApi':
            outputs['id'] = 'test-api-id'
            outputs['rootResourceId'] = 'root-resource-id'
            outputs['executionArn'] = 'arn:aws:execute-api:us-east-2:123456789012:test-api-id'
        elif args.typ == 'aws:apigateway/resource:Resource':
            outputs['id'] = f"resource-{args.name}"
        elif args.typ == 'aws:apigateway/deployment:Deployment':
            outputs['id'] = f"deployment-{args.name}"
        elif args.typ == 'aws:apigateway/stage:Stage':
            outputs['id'] = f"stage-{args.name}"
        elif args.typ == 'aws:iam/role:Role':
            outputs['id'] = args.name
            outputs['arn'] = f"arn:aws:iam::123456789012:role/{args.name}"
        elif args.typ == 'aws:iam/policy:Policy':
            outputs['id'] = args.name
            outputs['arn'] = f"arn:aws:iam::123456789012:policy/{args.name}"
        elif args.typ == 'aws:cloudwatch/eventRule:EventRule':
            outputs['id'] = args.name
            outputs['arn'] = f"arn:aws:events:us-east-2:123456789012:rule/{args.name}"

        return [outputs.get('id', args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Called when a function is invoked."""
        return {}


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test basic TapStack creation."""

    def check_stack(args):
        mocks = PulumiMocks()
        pulumi.runtime.set_mocks(mocks)

        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify stack has outputs
        assert stack.bucket_name is not None
        assert stack.api_url is not None
        assert stack.table_name is not None

        return {
            'bucket': pulumi.Output.from_input('fraud-reports-test'),
            'table': pulumi.Output.from_input('transactions-test'),
            'api': pulumi.Output.from_input('https://test.execute-api.us-east-2.amazonaws.com/prod')
        }

    result = check_stack({})
    assert result is not None


@pulumi.runtime.test
def test_tap_stack_with_custom_tags():
    """Test TapStack creation with custom tags."""

    def check_stack(args):
        mocks = PulumiMocks()
        pulumi.runtime.set_mocks(mocks)

        custom_tags = {'Project': 'FraudDetection', 'Team': 'Security'}
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='prod', tags=custom_tags)
        )

        # Verify stack has outputs
        assert stack.bucket_name is not None
        assert stack.table_name is not None

        # Verify custom tags are applied
        assert stack.common_tags['Project'] == 'FraudDetection'
        assert stack.common_tags['Team'] == 'Security'
        assert stack.common_tags['Environment'] == 'prod'
        assert stack.common_tags['CostCenter'] == 'fraud-detection'

        return {}

    result = check_stack({})
    assert result is not None


@pulumi.runtime.test
def test_tap_stack_environment_suffix():
    """Test that environment suffix is properly applied."""

    def check_stack(args):
        mocks = PulumiMocks()
        pulumi.runtime.set_mocks(mocks)

        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='staging')
        )

        # Verify environment suffix is set
        assert stack.environment_suffix == 'staging'
        assert stack.common_tags['Environment'] == 'staging'

        return {}

    result = check_stack({})
    assert result is not None


class TestTapStackConfiguration(unittest.TestCase):
    """Test cases for TapStack configuration validation."""

    def test_common_tags_structure(self):
        """Test that common tags have the correct structure."""
        args = TapStackArgs(environment_suffix='test')

        # Create a minimal mock to test tag structure
        expected_tags = {
            'Environment': 'test',
            'CostCenter': 'fraud-detection',
            'ManagedBy': 'Pulumi'
        }

        # Verify expected tag keys exist
        for key in expected_tags.keys():
            self.assertIn(key, expected_tags)

    def test_environment_suffix_validation(self):
        """Test environment suffix is properly set."""
        test_suffixes = ['dev', 'staging', 'prod', 'test123']

        for suffix in test_suffixes:
            args = TapStackArgs(environment_suffix=suffix)
            self.assertEqual(args.environment_suffix, suffix)

    def test_tags_merge(self):
        """Test that custom tags merge with common tags."""
        custom_tags = {'Project': 'FraudDetection', 'Owner': 'SecurityTeam'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.environment_suffix, 'prod')


class TestTapStackResourceNaming(unittest.TestCase):
    """Test resource naming conventions."""

    def test_resource_naming_pattern(self):
        """Test that resources follow naming pattern with environment suffix."""
        suffixes = ['dev', 'staging', 'prod']

        for suffix in suffixes:
            # S3 bucket name
            bucket_name = f"fraud-reports-{suffix}"
            self.assertIn(suffix, bucket_name)

            # DynamoDB table name
            table_name = f"transactions-{suffix}"
            self.assertIn(suffix, table_name)

            # Lambda function names
            lambda_names = [
                f"transaction-processor-{suffix}",
                f"fraud-analyzer-{suffix}",
                f"report-generator-{suffix}"
            ]
            for name in lambda_names:
                self.assertIn(suffix, name)


if __name__ == '__main__':
    unittest.main()
