"""Unit tests for CryptoPriceProcessingStack."""
import os
import sys
import json
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from cdktf import App, Testing
from main import CryptoPriceProcessingStack


class TestCryptoPriceProcessingStack(unittest.TestCase):
    """Test cases for the CDKTF stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"

    def test_stack_creation(self):
        """Test that stack can be created successfully."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        self.assertIsNotNone(stack)

    def test_stack_synthesis(self):
        """Test that stack synthesizes without errors."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)
        self.assertIsNotNone(synthesized)

    def test_stack_has_dynamodb_table(self):
        """Test that stack includes DynamoDB table with correct configuration."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        # Find DynamoDB table in synthesized output
        resources = json.loads(synthesized)['resource']
        dynamodb_tables = resources.get('aws_dynamodb_table', {})

        self.assertTrue(len(dynamodb_tables) > 0, "No DynamoDB table found")

        # Check table configuration
        table = list(dynamodb_tables.values())[0]
        self.assertEqual(table['billing_mode'], 'PAY_PER_REQUEST')
        self.assertEqual(table['hash_key'], 'symbol')
        self.assertEqual(table['range_key'], 'timestamp')
        self.assertTrue(table['stream_enabled'])
        self.assertEqual(table['stream_view_type'], 'NEW_AND_OLD_IMAGES')

    def test_stack_has_lambda_functions(self):
        """Test that stack includes both Lambda functions."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        lambda_functions = resources.get('aws_lambda_function', {})

        self.assertEqual(len(lambda_functions), 2, "Should have 2 Lambda functions")

        # Check for webhook processor and price enricher
        function_names = [f['function_name'] for f in lambda_functions.values()]
        self.assertIn(f'webhook-processor-{self.environment_suffix}', function_names)
        self.assertIn(f'price-enricher-{self.environment_suffix}', function_names)

    def test_lambda_functions_use_arm64(self):
        """Test that Lambda functions use ARM64 architecture."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        lambda_functions = resources.get('aws_lambda_function', {})

        for function in lambda_functions.values():
            self.assertEqual(function['architectures'], ['arm64'])

    def test_lambda_functions_have_correct_memory_and_timeout(self):
        """Test Lambda functions have correct memory and timeout settings."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        lambda_functions = resources.get('aws_lambda_function', {})

        for function in lambda_functions.values():
            if 'webhook-processor' in function['function_name']:
                self.assertEqual(function['memory_size'], 1024)
                self.assertEqual(function['timeout'], 60)
                self.assertEqual(function['reserved_concurrent_executions'], 10)
            elif 'price-enricher' in function['function_name']:
                self.assertEqual(function['memory_size'], 512)
                self.assertEqual(function['timeout'], 30)
                self.assertEqual(function['reserved_concurrent_executions'], 5)

    def test_stack_has_kms_key(self):
        """Test that stack includes KMS key for Lambda encryption."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        kms_keys = resources.get('aws_kms_key', {})

        self.assertTrue(len(kms_keys) > 0, "No KMS key found")

        key = list(kms_keys.values())[0]
        self.assertTrue(key['enable_key_rotation'])
        self.assertEqual(key['deletion_window_in_days'], 10)

    def test_stack_has_sqs_dead_letter_queues(self):
        """Test that stack includes SQS dead letter queues."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        sqs_queues = resources.get('aws_sqs_queue', {})

        self.assertEqual(len(sqs_queues), 2, "Should have 2 SQS queues")

        for queue in sqs_queues.values():
            self.assertEqual(queue['message_retention_seconds'], 345600)  # 4 days

    def test_stack_has_sns_topic(self):
        """Test that stack includes SNS topic for success notifications."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        sns_topics = resources.get('aws_sns_topic', {})

        self.assertTrue(len(sns_topics) > 0, "No SNS topic found")

    def test_stack_has_cloudwatch_log_groups(self):
        """Test that stack includes CloudWatch log groups with correct retention."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        log_groups = resources.get('aws_cloudwatch_log_group', {})

        self.assertEqual(len(log_groups), 2, "Should have 2 CloudWatch log groups")

        for log_group in log_groups.values():
            self.assertEqual(log_group['retention_in_days'], 3)

    def test_stack_has_iam_roles(self):
        """Test that stack includes IAM roles for Lambda functions."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        iam_roles = resources.get('aws_iam_role', {})

        self.assertEqual(len(iam_roles), 2, "Should have 2 IAM roles")

    def test_iam_roles_have_least_privilege_policies(self):
        """Test that IAM roles have proper inline policies."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        iam_roles = resources.get('aws_iam_role', {})

        for role in iam_roles.values():
            inline_policies = role.get('inline_policy', [])
            self.assertTrue(len(inline_policies) >= 4, "Should have at least 4 inline policies")

            policy_names = [p['name'] for p in inline_policies]
            self.assertIn('dynamodb-access', policy_names)
            self.assertIn('kms-access', policy_names)
            self.assertIn('sqs-dlq-access', policy_names)
            self.assertIn('cloudwatch-logs', policy_names)

    def test_stack_has_event_source_mapping(self):
        """Test that stack includes Lambda event source mapping for DynamoDB streams."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        event_mappings = resources.get('aws_lambda_event_source_mapping', {})

        self.assertTrue(len(event_mappings) > 0, "No event source mapping found")

        mapping = list(event_mappings.values())[0]
        self.assertEqual(mapping['starting_position'], 'LATEST')
        self.assertEqual(mapping['batch_size'], 10)
        self.assertEqual(mapping['maximum_batching_window_in_seconds'], 5)
        self.assertTrue(mapping['bisect_batch_on_function_error'])
        self.assertEqual(mapping['maximum_retry_attempts'], 2)

    def test_stack_has_lambda_destination_config(self):
        """Test that stack includes Lambda destination configuration."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        invoke_configs = resources.get('aws_lambda_function_event_invoke_config', {})

        self.assertTrue(len(invoke_configs) > 0, "No event invoke config found")

        config = list(invoke_configs.values())[0]
        self.assertEqual(config['maximum_event_age_in_seconds'], 3600)
        self.assertEqual(config['maximum_retry_attempts'], 0)
        self.assertIsNotNone(config.get('destination_config'))

    def test_stack_outputs_all_required_values(self):
        """Test that stack outputs all required values."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        outputs = json.loads(synthesized).get('output', {})

        self.assertIn('webhook_processor_arn', outputs)
        self.assertIn('price_enricher_arn', outputs)
        self.assertIn('dynamodb_table_name', outputs)
        self.assertIn('sns_topic_arn', outputs)

    def test_resources_include_environment_suffix(self):
        """Test that all resources include environment suffix in their names."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']

        # Check DynamoDB table
        dynamodb_tables = resources.get('aws_dynamodb_table', {})
        for table in dynamodb_tables.values():
            self.assertIn(self.environment_suffix, table['name'])

        # Check Lambda functions
        lambda_functions = resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            self.assertIn(self.environment_suffix, function['function_name'])

        # Check SQS queues
        sqs_queues = resources.get('aws_sqs_queue', {})
        for queue in sqs_queues.values():
            self.assertIn(self.environment_suffix, queue['name'])

        # Check SNS topics
        sns_topics = resources.get('aws_sns_topic', {})
        for topic in sns_topics.values():
            self.assertIn(self.environment_suffix, topic['name'])

    def test_resources_have_proper_tags(self):
        """Test that resources have proper tags."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']

        # Check DynamoDB table tags
        dynamodb_tables = resources.get('aws_dynamodb_table', {})
        for table in dynamodb_tables.values():
            self.assertIn('Environment', table['tags'])
            self.assertIn('Application', table['tags'])
            self.assertEqual(table['tags']['Application'], 'crypto-price-processing')

    def test_create_lambda_role_returns_iam_role(self):
        """Test _create_lambda_role method returns IAM role."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )

        role = stack._create_lambda_role(
            "test-role",
            "test",
            "test-function",
            "arn:aws:dynamodb:us-east-1:123456789012:table/test",
            "arn:aws:kms:us-east-1:123456789012:key/test",
            "arn:aws:sqs:us-east-1:123456789012:test-dlq"
        )

        self.assertIsNotNone(role)

    def test_create_enricher_lambda_role_returns_iam_role(self):
        """Test _create_enricher_lambda_role method returns IAM role."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )

        role = stack._create_enricher_lambda_role(
            "test-enricher-role",
            "test",
            "test-enricher-function",
            "arn:aws:dynamodb:us-east-1:123456789012:table/test",
            "arn:aws:dynamodb:us-east-1:123456789012:table/test/stream/test",
            "arn:aws:kms:us-east-1:123456789012:key/test",
            "arn:aws:sqs:us-east-1:123456789012:test-dlq",
            "arn:aws:sns:us-east-1:123456789012:test-topic"
        )

        self.assertIsNotNone(role)

    def test_enricher_role_has_sns_publish_permission(self):
        """Test that enricher role includes SNS publish permission when SNS ARN provided."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        iam_roles = resources.get('aws_iam_role', {})

        # Find enricher role
        enricher_role = None
        for role in iam_roles.values():
            if 'price-enricher' in role['name']:
                enricher_role = role
                break

        self.assertIsNotNone(enricher_role, "Enricher role not found")

        # Check for SNS publish policy
        inline_policies = enricher_role.get('inline_policy', [])
        policy_names = [p['name'] for p in inline_policies]
        self.assertIn('sns-publish', policy_names)

    def test_point_in_time_recovery_enabled(self):
        """Test that DynamoDB table has point-in-time recovery enabled."""
        stack = CryptoPriceProcessingStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix
        )
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)['resource']
        dynamodb_tables = resources.get('aws_dynamodb_table', {})

        table = list(dynamodb_tables.values())[0]
        pitr = table.get('point_in_time_recovery', [{}])[0]
        self.assertTrue(pitr.get('enabled', False))


if __name__ == '__main__':
    unittest.main()
