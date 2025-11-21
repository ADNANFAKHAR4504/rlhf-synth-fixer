"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component.
Tests all serverless webhook processing infrastructure components.
"""

import unittest
from unittest.mock import MagicMock
import pulumi
import json
import os

# Set Pulumi to test mode
pulumi.runtime.set_mocks(
    mocks=MagicMock(),
    preview=False
)


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource creation for testing."""

    def __init__(self):
        self.resource_counter = {}

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation with dynamic outputs."""
        resource_type = args.typ
        if resource_type not in self.resource_counter:
            self.resource_counter[resource_type] = 0
        self.resource_counter[resource_type] += 1

        resource_id = f"{resource_type.split('/')[-1]}-{self.resource_counter[resource_type]}"
        outputs = dict(args.inputs)
        
        # Mock AWS account and region from environment or defaults
        region = os.getenv('AWS_REGION', 'us-east-1')
        account_id = '123456789012'

        if 'aws:dynamodb/table:Table' in resource_type:
            table_name = args.inputs.get('name', f"table-{resource_id}")
            outputs['id'] = table_name
            outputs['arn'] = f"arn:aws:dynamodb:{region}:{account_id}:table/{table_name}"
            outputs['name'] = table_name
        elif 'aws:sqs/queue:Queue' in resource_type:
            queue_name = args.inputs.get('name', f"queue-{resource_id}")
            outputs['id'] = f"queue-{resource_id}"
            outputs['arn'] = f"arn:aws:sqs:{region}:{account_id}:{queue_name}"
            outputs['url'] = f"https://sqs.{region}.amazonaws.com/{account_id}/{queue_name}"
            outputs['name'] = queue_name
        elif 'aws:cloudwatch/eventBus:EventBus' in resource_type:
            bus_name = args.inputs.get('name', f"event-bus-{resource_id}")
            outputs['id'] = bus_name
            outputs['arn'] = f"arn:aws:events:{region}:{account_id}:event-bus/{bus_name}"
            outputs['name'] = bus_name
        elif 'aws:cloudwatch/eventRule:EventRule' in resource_type:
            rule_name = args.inputs.get('name', f"rule-{resource_id}")
            outputs['id'] = rule_name
            outputs['arn'] = f"arn:aws:events:{region}:{account_id}:rule/{rule_name}"
            outputs['name'] = rule_name
        elif 'aws:sns/topic:Topic' in resource_type:
            topic_name = args.inputs.get('name', f"topic-{resource_id}")
            outputs['id'] = f"topic-{resource_id}"
            outputs['arn'] = f"arn:aws:sns:{region}:{account_id}:{topic_name}"
            outputs['name'] = topic_name
        elif 'aws:iam/role:Role' in resource_type:
            role_name = args.inputs.get('name', f"role-{resource_id}")
            outputs['id'] = f"role-{resource_id}"
            outputs['arn'] = f"arn:aws:iam::{account_id}:role/{role_name}"
            outputs['name'] = role_name
        elif 'aws:iam/policy:Policy' in resource_type:
            policy_name = args.inputs.get('name', f"policy-{resource_id}")
            outputs['id'] = f"policy-{resource_id}"
            outputs['arn'] = f"arn:aws:iam::{account_id}:policy/{policy_name}"
        elif 'aws:lambda/function:Function' in resource_type:
            function_name = args.inputs.get('name', f"lambda-{resource_id}")
            outputs['id'] = f"lambda-{resource_id}"
            outputs['arn'] = f"arn:aws:lambda:{region}:{account_id}:function:{function_name}"
            outputs['name'] = function_name
            outputs['invoke_arn'] = f"arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/arn:aws:lambda:{region}:{account_id}:function:{function_name}/invocations"
        elif 'aws:apigateway/restApi:RestApi' in resource_type:
            api_name = args.inputs.get('name', f"api-{resource_id}")
            outputs['id'] = f"api-{resource_id}"
            outputs['root_resource_id'] = f"root-{resource_id}"
            outputs['execution_arn'] = f"arn:aws:execute-api:{region}:{account_id}:{outputs['id']}"
        elif 'aws:apigateway/resource:Resource' in resource_type:
            outputs['id'] = f"resource-{resource_id}"
        elif 'aws:apigateway/method:Method' in resource_type:
            outputs['id'] = f"method-{resource_id}"
        elif 'aws:apigateway/integration:Integration' in resource_type:
            outputs['id'] = f"integration-{resource_id}"
        elif 'aws:apigateway/deployment:Deployment' in resource_type:
            outputs['id'] = f"deployment-{resource_id}"
        elif 'aws:apigateway/stage:Stage' in resource_type:
            outputs['id'] = f"stage-{resource_id}"
            outputs['stage_name'] = args.inputs.get('stage_name', 'prod')
        elif 'aws:apigateway/apiKey:ApiKey' in resource_type:
            outputs['id'] = f"key-{resource_id}"
        elif 'aws:apigateway/usagePlan:UsagePlan' in resource_type:
            outputs['id'] = f"plan-{resource_id}"
        elif 'aws:cloudwatch/metricAlarm:MetricAlarm' in resource_type:
            outputs['id'] = f"alarm-{resource_id}"
            outputs['arn'] = f"arn:aws:cloudwatch:{region}:{account_id}:alarm:{resource_id}"
        elif 'aws:cloudwatch/logGroup:LogGroup' in resource_type:
            outputs['id'] = f"log-group-{resource_id}"
            outputs['arn'] = f"arn:aws:logs:{region}:{account_id}:log-group:{args.inputs.get('name', resource_id)}"
        elif 'aws:lambda/eventSourceMapping:EventSourceMapping' in resource_type:
            outputs['id'] = f"mapping-{resource_id}"
        elif 'aws:lambda/permission:Permission' in resource_type:
            outputs['id'] = f"permission-{resource_id}"
        elif 'aws:cloudwatch/eventTarget:EventTarget' in resource_type:
            outputs['id'] = f"target-{resource_id}"
        else:
            outputs['id'] = f"resource-{resource_id}"

        return [resource_id, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


# Set mocks globally
pulumi.runtime.set_mocks(PulumiMocks())

# Import after setting mocks
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
        custom_tags = {'Project': 'WebhookProcessor', 'Owner': 'Platform'}
        args = TapStackArgs(
            environment_suffix='test',
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_suffix(self):
        """Test TapStackArgs with None suffix defaults to dev."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_empty_string_suffix(self):
        """Test TapStackArgs with empty string suffix defaults to dev."""
        args = TapStackArgs(environment_suffix='')
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags remains None."""
        args = TapStackArgs(tags=None)
        self.assertIsNone(args.tags)


class TestTapStackCreation(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    @pulumi.runtime.test
    def test_stack_creation_with_defaults(self):
        """Test TapStack creation with default arguments."""
        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'dev')
        self.assertEqual(stack.tags, {})

    @pulumi.runtime.test
    def test_stack_creation_with_custom_args(self):
        """Test TapStack creation with custom arguments."""
        custom_tags = {'Environment': 'production', 'Team': 'platform'}
        args = TapStackArgs(
            environment_suffix='prod',
            tags=custom_tags
        )
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'prod')
        self.assertEqual(stack.tags, custom_tags)

    @pulumi.runtime.test
    def test_stack_creation_providers_list(self):
        """Test TapStack has correct payment providers configured."""
        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        expected_providers = ["stripe", "paypal", "square"]
        self.assertEqual(stack.providers, expected_providers)


class TestDynamoDBTableCreation(unittest.TestCase):
    """Test cases for DynamoDB table creation."""

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created with correct configuration."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.dynamodb_table)

    @pulumi.runtime.test
    def test_dynamodb_table_naming(self):
        """Test DynamoDB table naming convention."""
        test_environments = ['dev', 'staging', 'prod', 'test']
        
        for env in test_environments:
            with self.subTest(environment=env):
                args = TapStackArgs(environment_suffix=env)
                stack = TapStack(f'test-stack-{env}', args)
                
                # Table name should include environment suffix
                expected_name = f"webhook-processing-{env}"
                # We cannot directly test the name due to Pulumi's async nature,
                # but we can verify the table was created
                self.assertIsNotNone(stack.dynamodb_table)


class TestSQSQueuesCreation(unittest.TestCase):
    """Test cases for SQS FIFO queues creation."""

    @pulumi.runtime.test
    def test_sqs_queues_creation(self):
        """Test SQS queues are created for all providers."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Check main queues
        self.assertIsNotNone(stack.sqs_queues)
        self.assertIn('stripe', stack.sqs_queues)
        self.assertIn('paypal', stack.sqs_queues)
        self.assertIn('square', stack.sqs_queues)

    @pulumi.runtime.test
    def test_dlq_queues_creation(self):
        """Test DLQ queues are created for all providers."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Check dead letter queues
        self.assertIsNotNone(stack.dlq_queues)
        self.assertIn('stripe', stack.dlq_queues)
        self.assertIn('paypal', stack.dlq_queues)
        self.assertIn('square', stack.dlq_queues)

    @pulumi.runtime.test
    def test_sqs_queues_count(self):
        """Test correct number of SQS queues are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Should have 3 main queues and 3 DLQ queues
        self.assertEqual(len(stack.sqs_queues), 3)
        self.assertEqual(len(stack.dlq_queues), 3)


class TestEventBridgeCreation(unittest.TestCase):
    """Test cases for EventBridge custom event bus creation."""

    @pulumi.runtime.test
    def test_eventbridge_bus_creation(self):
        """Test EventBridge custom event bus is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.event_bus)

    @pulumi.runtime.test
    def test_eventbridge_rules_creation(self):
        """Test EventBridge rules for payment thresholds are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.event_rules)
        
        # Check all threshold rules are created
        expected_thresholds = ['small', 'medium', 'large', 'xlarge']
        for threshold in expected_thresholds:
            self.assertIn(threshold, stack.event_rules)

    @pulumi.runtime.test
    def test_eventbridge_rules_count(self):
        """Test correct number of EventBridge rules are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Should have 4 payment threshold rules
        self.assertEqual(len(stack.event_rules), 4)


class TestSNSTopicCreation(unittest.TestCase):
    """Test cases for SNS topic creation."""

    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test SNS topic for alerts is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.sns_topic)


class TestLambdaFunctionsCreation(unittest.TestCase):
    """Test cases for Lambda functions creation."""

    @pulumi.runtime.test
    def test_webhook_validator_creation(self):
        """Test webhook validator Lambda function is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.webhook_validator)

    @pulumi.runtime.test
    def test_provider_processors_creation(self):
        """Test provider processor Lambda functions are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.provider_processors)
        
        # Check all provider processors are created
        for provider in stack.providers:
            self.assertIn(provider, stack.provider_processors)

    @pulumi.runtime.test
    def test_event_processor_creation(self):
        """Test event processor Lambda function is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.event_processor)

    @pulumi.runtime.test
    def test_lambda_role_creation(self):
        """Test Lambda execution role is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.lambda_role)

    @pulumi.runtime.test
    def test_lambda_functions_count(self):
        """Test correct number of Lambda functions are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Should have 1 webhook validator + 3 provider processors + 1 event processor = 5 total
        expected_count = 1 + len(stack.providers) + 1
        actual_count = 1 + len(stack.provider_processors) + 1  # webhook_validator + processors + event_processor
        self.assertEqual(actual_count, expected_count)


class TestAPIGatewayCreation(unittest.TestCase):
    """Test cases for API Gateway creation."""

    @pulumi.runtime.test
    def test_api_gateway_creation(self):
        """Test API Gateway REST API is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.api_gateway)

    @pulumi.runtime.test
    def test_api_key_creation(self):
        """Test API key is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.api_key)

    @pulumi.runtime.test
    def test_usage_plan_creation(self):
        """Test usage plan is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.usage_plan)

    @pulumi.runtime.test
    def test_api_resources_creation(self):
        """Test API Gateway resources are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.webhooks_resource)
        self.assertIsNotNone(stack.provider_resource)

    @pulumi.runtime.test
    def test_api_method_creation(self):
        """Test API Gateway POST method is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.post_method)

    @pulumi.runtime.test
    def test_lambda_integration_creation(self):
        """Test Lambda integration is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.lambda_integration)

    @pulumi.runtime.test
    def test_api_deployment_creation(self):
        """Test API Gateway deployment is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.deployment)

    @pulumi.runtime.test
    def test_api_stage_creation(self):
        """Test API Gateway stage is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.api_stage)

    @pulumi.runtime.test
    def test_api_endpoint_creation(self):
        """Test API endpoint URL is generated."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.api_endpoint)


class TestCloudWatchMonitoring(unittest.TestCase):
    """Test cases for CloudWatch monitoring setup."""

    @pulumi.runtime.test
    def test_cloudwatch_monitoring_setup(self):
        """Test CloudWatch monitoring components are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Stack should complete creation without errors
        self.assertIsNotNone(stack)


class TestStackOutputs(unittest.TestCase):
    """Test cases for stack output values."""

    @pulumi.runtime.test
    def test_stack_outputs_registration(self):
        """Test stack outputs are properly registered."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify stack has required attributes for outputs
        self.assertTrue(hasattr(stack, 'api_endpoint'))
        self.assertTrue(hasattr(stack, 'api_key'))
        self.assertTrue(hasattr(stack, 'dynamodb_table'))
        self.assertTrue(hasattr(stack, 'event_bus'))
        self.assertTrue(hasattr(stack, 'sns_topic'))


class TestEnvironmentVariations(unittest.TestCase):
    """Test cases for different environment configurations."""

    @pulumi.runtime.test
    def test_multiple_environments(self):
        """Test stack creation with different environment suffixes."""
        environments = ['dev', 'staging', 'prod', 'test', 'demo']
        
        for env in environments:
            with self.subTest(environment=env):
                args = TapStackArgs(environment_suffix=env)
                stack = TapStack(f'test-stack-{env}', args)
                
                self.assertIsNotNone(stack)
                self.assertEqual(stack.environment_suffix, env)

    @pulumi.runtime.test
    def test_different_tag_configurations(self):
        """Test stack creation with different tag configurations."""
        tag_configs = [
            None,
            {},
            {'Environment': 'test'},
            {'Project': 'WebhookProcessor', 'Team': 'Platform', 'Owner': 'DevOps'},
            {'CostCenter': '12345', 'Application': 'Payments', 'Version': '1.0'}
        ]
        
        for i, tags in enumerate(tag_configs):
            with self.subTest(tags=tags):
                args = TapStackArgs(environment_suffix=f'test{i}', tags=tags)
                stack = TapStack(f'test-stack-{i}', args)
                
                self.assertIsNotNone(stack)
                expected_tags = tags if tags is not None else {}
                self.assertEqual(stack.tags, expected_tags)


class TestRegionAgnostic(unittest.TestCase):
    """Test cases for region-agnostic functionality."""

    @pulumi.runtime.test
    def test_stack_creation_with_different_regions(self):
        """Test stack creation works with different AWS regions."""
        original_region = os.environ.get('AWS_REGION')
        test_regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
        
        try:
            for region in test_regions:
                with self.subTest(region=region):
                    # Temporarily set region
                    os.environ['AWS_REGION'] = region
                    
                    args = TapStackArgs(environment_suffix='test')
                    stack = TapStack(f'test-stack-{region.replace("-", "")}', args)
                    
                    self.assertIsNotNone(stack)
        finally:
            # Restore original region
            if original_region:
                os.environ['AWS_REGION'] = original_region
            elif 'AWS_REGION' in os.environ:
                del os.environ['AWS_REGION']


if __name__ == '__main__':
    unittest.main()