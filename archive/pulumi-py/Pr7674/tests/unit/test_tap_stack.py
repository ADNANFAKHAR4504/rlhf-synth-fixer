"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi


def pulumi_mocks(namespace: str):
    """
    Create mocks for Pulumi resources to enable unit testing.
    Returns a mock that simulates Pulumi resource creation.
    """
    def call(args):
        resource_type, name, props, provider, dependencies = args
        if resource_type.endswith(':Bucket'):
            return ['bucket-id', {'id': f'{name}-id', 'bucket': props.get('bucket', name)}]
        elif resource_type.endswith(':Table'):
            return ['table-id', {'id': f'{name}-id', 'name': props.get('name', name)}]
        elif resource_type.endswith(':Queue'):
            return ['queue-id', {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:sqs:us-east-1:123456789012:{props.get("name", name)}',
                'url': f'https://sqs.us-east-1.amazonaws.com/123456789012/{props.get("name", name)}'
            }]
        elif resource_type.endswith(':EventBus'):
            return ['bus-id', {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:events:us-east-1:123456789012:event-bus/{props.get("name", name)}'
            }]
        elif resource_type.endswith(':Role'):
            return ['role-id', {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:iam::123456789012:role/{props.get("name", name)}'
            }]
        elif resource_type.endswith(':Function'):
            return ['function-id', {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:lambda:us-east-1:123456789012:function:{props.get("name", name)}',
                'invoke_arn': f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{props.get("name", name)}/invocations'
            }]
        elif resource_type.endswith(':LogGroup'):
            return ['loggroup-id', {'id': f'{name}-id', 'name': props.get('name', name), 'arn': f'arn:aws:logs:us-east-1:123456789012:log-group:{props.get("name", name)}'}]
        elif resource_type.endswith(':RestApi'):
            return ['api-id', {
                'id': 'test-api-id',
                'name': props.get('name', name),
                'root_resource_id': 'root-id',
                'execution_arn': 'arn:aws:execute-api:us-east-1:123456789012:test-api-id'
            }]
        elif resource_type.endswith(':Resource'):
            return ['resource-id', {'id': 'resource-id', 'path': '/webhook'}]
        elif resource_type.endswith(':Method'):
            return ['method-id', {'id': 'method-id', 'http_method': 'POST'}]
        elif resource_type.endswith(':Stage'):
            return ['stage-id', {'id': 'stage-id', 'stage_name': props.get('stage_name', 'dev')}]
        elif resource_type.endswith(':Deployment'):
            return ['deployment-id', {'id': 'deployment-id'}]
        else:
            return [f'{name}-id', {'id': f'{name}-id'}]

    return call


class PulumiMocks(pulumi.runtime.Mocks):
    """Mocks for Pulumi runtime."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        resource_type = args.typ
        name = args.name
        props = args.inputs

        if resource_type.endswith(':Bucket'):
            return [name, {'id': f'{name}-id', 'bucket': props.get('bucket', name)}]
        elif resource_type.endswith(':Table'):
            return [name, {'id': f'{name}-id', 'name': props.get('name', name)}]
        elif resource_type.endswith(':Queue'):
            return [name, {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:sqs:us-east-1:123456789012:{props.get("name", name)}',
                'url': f'https://sqs.us-east-1.amazonaws.com/123456789012/{props.get("name", name)}'
            }]
        elif resource_type.endswith(':EventBus'):
            return [name, {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:events:us-east-1:123456789012:event-bus/{props.get("name", name)}'
            }]
        elif resource_type.endswith(':Role'):
            return [name, {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:iam::123456789012:role/{props.get("name", name)}'
            }]
        elif resource_type.endswith(':Function'):
            return [name, {
                'id': f'{name}-id',
                'name': props.get('name', name),
                'arn': f'arn:aws:lambda:us-east-1:123456789012:function:{props.get("name", name)}',
                'invoke_arn': f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{props.get("name", name)}/invocations'
            }]
        elif resource_type.endswith(':LogGroup'):
            return [name, {'id': f'{name}-id', 'name': props.get('name', name), 'arn': f'arn:aws:logs:us-east-1:123456789012:log-group:{props.get("name", name)}'}]
        elif resource_type.endswith(':RestApi'):
            return [name, {
                'id': 'test-api-id',
                'name': props.get('name', name),
                'root_resource_id': 'root-id',
                'execution_arn': 'arn:aws:execute-api:us-east-1:123456789012:test-api-id'
            }]
        elif resource_type.endswith(':Resource'):
            return [name, {'id': 'resource-id', 'path': '/webhook'}]
        elif resource_type.endswith(':Method'):
            return [name, {'id': 'method-id', 'http_method': 'POST'}]
        elif resource_type.endswith(':Stage'):
            return [name, {'id': 'stage-id', 'stage_name': props.get('stage_name', 'dev')}]
        elif resource_type.endswith(':Deployment'):
            return [name, {'id': 'deployment-id'}]
        else:
            return [name, {'id': f'{name}-id'}]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider function calls."""
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args = TapStackArgs(environment_suffix='prod')

        self.assertEqual(args.environment_suffix, 'prod')

    def test_tap_stack_args_custom_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Project': 'webhook', 'Owner': 'team'}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_all_params(self):
        """Test TapStackArgs with all parameters."""
        custom_tags = {'Project': 'webhook'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test TapStack component resource creation."""
    def check_stack(args):
        stack = args[0]
        assert stack is not None, "Stack should be created"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_stack)


@pulumi.runtime.test
def test_tap_stack_environment_suffix():
    """Test TapStack uses correct environment suffix."""
    def check_suffix(args):
        stack = args[0]
        assert stack.environment_suffix == 'qa', "Environment suffix should be 'qa'"
        return True

    args = TapStackArgs(environment_suffix='qa')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_suffix)


@pulumi.runtime.test
def test_tap_stack_tags():
    """Test TapStack applies custom tags."""
    def check_tags(args):
        stack = args[0]
        assert 'TestTag' in stack.tags, "Custom tags should be applied"
        assert stack.tags['TestTag'] == 'TestValue'
        return True

    custom_tags = {'TestTag': 'TestValue'}
    args = TapStackArgs(environment_suffix='dev', tags=custom_tags)
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_tags)


@pulumi.runtime.test
def test_tap_stack_has_payload_bucket():
    """Test TapStack creates S3 bucket for payloads."""
    def check_bucket(args):
        stack = args[0]
        assert hasattr(stack, 'payload_bucket'), "Stack should have payload_bucket attribute"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_bucket)


@pulumi.runtime.test
def test_tap_stack_has_dynamodb_table():
    """Test TapStack creates DynamoDB table."""
    def check_table(args):
        stack = args[0]
        assert hasattr(stack, 'webhook_table'), "Stack should have webhook_table attribute"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_table)


@pulumi.runtime.test
def test_tap_stack_has_sqs_queues():
    """Test TapStack creates SQS queues."""
    def check_queues(args):
        stack = args[0]
        assert hasattr(stack, 'processing_queue'), "Stack should have processing_queue"
        assert hasattr(stack, 'dead_letter_queue'), "Stack should have dead_letter_queue"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_queues)


@pulumi.runtime.test
def test_tap_stack_has_lambda_functions():
    """Test TapStack creates Lambda functions."""
    def check_functions(args):
        stack = args[0]
        assert hasattr(stack, 'ingestion_function'), "Stack should have ingestion_function"
        assert hasattr(stack, 'processing_function'), "Stack should have processing_function"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_functions)


@pulumi.runtime.test
def test_tap_stack_has_api_gateway():
    """Test TapStack creates API Gateway."""
    def check_api(args):
        stack = args[0]
        assert hasattr(stack, 'api'), "Stack should have API Gateway"
        assert hasattr(stack, 'webhook_resource'), "Stack should have webhook resource"
        assert hasattr(stack, 'webhook_method'), "Stack should have webhook method"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_api)


@pulumi.runtime.test
def test_tap_stack_has_eventbridge():
    """Test TapStack creates EventBridge event bus."""
    def check_eventbridge(args):
        stack = args[0]
        assert hasattr(stack, 'event_bus'), "Stack should have EventBridge event bus"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_eventbridge)


@pulumi.runtime.test
def test_tap_stack_has_iam_roles():
    """Test TapStack creates IAM roles for Lambda functions."""
    def check_roles(args):
        stack = args[0]
        assert hasattr(stack, 'ingestion_role'), "Stack should have ingestion IAM role"
        assert hasattr(stack, 'processing_role'), "Stack should have processing IAM role"
        return True

    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)
    return pulumi.Output.all(stack).apply(check_roles)


if __name__ == '__main__':
    unittest.main()
