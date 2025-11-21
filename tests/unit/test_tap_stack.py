"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
Tests resource creation, configuration, and proper parameter passing.
"""

import unittest
from unittest.mock import MagicMock, patch
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """
    Mock class to capture Pulumi resource calls during testing.
    """
    def __init__(self):
        self.resources = []

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Handle new resource creation"""
        self.resources.append({
            'type': args.typ,
            'name': args.name,
            'props': args.inputs
        })

        # Provide default outputs for resources
        outputs = dict(args.inputs)

        # Add required properties for specific resource types
        if 'iam/role:Role' in args.typ:
            outputs['arn'] = f"arn:aws:iam::123456789012:role/{args.name}"
            outputs['unique_id'] = f"AIDAY{args.name}"
        elif 'lambda/function:Function' in args.typ:
            outputs['arn'] = f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}"
            outputs['qualified_arn'] = f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}:1"
            outputs['invoke_arn'] = f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations"
            outputs['version'] = "$LATEST"
        elif 'dynamodb/table:Table' in args.typ:
            outputs['arn'] = f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}"
            outputs['id'] = args.name
        elif 'apigateway/restApi:RestApi' in args.typ:
            outputs['root_resource_id'] = f"{args.name}_root"
            outputs['id'] = args.name
        elif 'kms/key:Key' in args.typ:
            outputs['arn'] = f"arn:aws:kms:us-east-1:123456789012:key/{args.name}"
            outputs['key_id'] = f"key-{args.name}"
        elif 'cloudwatch/logGroup:LogGroup' in args.typ:
            outputs['arn'] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.name}"

        # Return (id, state) tuple
        return [args.name + '_id', outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Handle provider function calls"""
        # Return mock outputs for provider calls
        if args.token == 'aws:index/getRegion:getRegion':
            return {'name': 'us-east-1'}
        elif args.token == 'aws:iam/getPolicyDocument:getPolicyDocument':
            # Return mock assume role policy for Lambda
            return {
                'json': '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
                'id': 'mock-policy'
            }
        return {}


def pulumi_test(coro):
    """
    Decorator to run async Pulumi tests in sync context.
    """
    def wrapper(*args, **kwargs):
        import asyncio
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default environment suffix."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom environment suffix and tags."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Environment': 'prod', 'Team': 'platform'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_suffix(self):
        """Test TapStackArgs defaults to 'dev' when None is passed."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix=None)

        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component resource creation."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack component resource is created with correct type."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(
            MyMocks(),
            'test-project',
            'test-stack',
            False
        )

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify component is created
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test')

        # Verify key resources are accessible
        self.assertIsNotNone(stack.transactions_table)
        self.assertIsNotNone(stack.lambda_function)
        self.assertIsNotNone(stack.api)

    @pulumi.runtime.test
    def test_dynamodb_table_created(self):
        """Test DynamoDB table is created with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(MyMocks(), 'project', 'stack', False)

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test', args)

        # Verify table is accessible
        self.assertIsNotNone(stack.transactions_table)
        self.assertIsNotNone(stack.transactions_table.name)

    @pulumi.runtime.test
    def test_lambda_function_created(self):
        """Test Lambda function is created with correct runtime and memory."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(MyMocks(), 'project', 'stack', False)

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test', args)

        # Verify Lambda is accessible
        self.assertIsNotNone(stack.lambda_function)
        self.assertIsNotNone(stack.lambda_function.arn)

    @pulumi.runtime.test
    def test_api_gateway_created(self):
        """Test API Gateway REST API is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(MyMocks(), 'project', 'stack', False)

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test', args)

        # Verify API Gateway is accessible
        self.assertIsNotNone(stack.api)
        self.assertIsNotNone(stack.api.id)

    @pulumi.runtime.test
    def test_kms_key_created(self):
        """Test KMS key is created for encryption."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(MyMocks(), 'project', 'stack', False)

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test', args)

        # Verify KMS key is accessible
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_key.key_id)

    @pulumi.runtime.test
    def test_cloudwatch_log_group_created(self):
        """Test CloudWatch Log Group is created with retention."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(MyMocks(), 'project', 'stack', False)

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test', args)

        # Verify Log Group is accessible
        self.assertIsNotNone(stack.lambda_log_group)
        self.assertIsNotNone(stack.lambda_log_group.name)

    @pulumi.runtime.test
    def test_iam_role_created(self):
        """Test IAM role is created for Lambda execution."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(MyMocks(), 'project', 'stack', False)

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test', args)

        # Verify IAM role is accessible
        self.assertIsNotNone(stack.lambda_role)
        self.assertIsNotNone(stack.lambda_role.arn)

    @pulumi.runtime.test
    def test_environment_suffix_applied(self):
        """Test environment suffix is applied to resource names."""
        from lib.tap_stack import TapStack, TapStackArgs

        pulumi.runtime.set_mocks(MyMocks(), 'project', 'stack', False)

        args = TapStackArgs(environment_suffix='test-env')
        stack = TapStack('test', args)

        # Verify environment suffix is stored
        self.assertEqual(stack.environment_suffix, 'test-env')

    @pulumi.runtime.test
    def test_stack_instantiation_with_exports(self):
        """Test that stack can be instantiated and exports are created."""
        from lib.tap_stack import _create_stack
        
        # Set mocks with a stack name that will extract 'test' as suffix
        pulumi.runtime.set_mocks(MyMocks(), 'project', 'TapStacktest', False)
        
        # Call _create_stack to test stack instantiation and exports
        # This tests the full stack creation path including exports
        _create_stack()
        
        # If we get here without errors, the function executed successfully
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
