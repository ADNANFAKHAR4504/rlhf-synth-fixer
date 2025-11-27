"""Unit tests for TapStack CDKTF infrastructure."""
import os
import sys
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackCreation(unittest.TestCase):
    """Test cases for TapStack creation and basic synthesis."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.state_bucket = "test-state-bucket"
        self.state_bucket_region = "us-east-1"
        self.aws_region = "us-east-1"
        self.default_tags = {
            "tags": {
                "Environment": "test",
                "Repository": "test-repo",
                "Author": "test-author",
                "PRNumber": "123",
                "Team": "test-team",
                "CreatedAt": "2025-01-01T00:00:00Z"
            }
        }

    def test_stack_creation(self):
        """Test that stack can be created successfully."""
        stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket=self.state_bucket,
            state_bucket_region=self.state_bucket_region,
            aws_region=self.aws_region,
            default_tags=self.default_tags
        )
        self.assertIsNotNone(stack)

    def test_stack_synthesis(self):
        """Test that stack synthesizes without errors."""
        stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket=self.state_bucket,
            state_bucket_region=self.state_bucket_region,
            aws_region=self.aws_region,
            default_tags=self.default_tags
        )
        synthesized = Testing.synth(stack)
        self.assertIsNotNone(synthesized)

    def test_stack_with_different_environment_suffix(self):
        """Test stack creation with different environment suffix."""
        stack = TapStack(
            self.app,
            "prod-stack",
            environment_suffix="prod123",
            state_bucket=self.state_bucket,
            state_bucket_region=self.state_bucket_region,
            aws_region=self.aws_region,
            default_tags=self.default_tags
        )
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)['resource']
        dynamodb_tables = resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertIn("prod123", table['name'])

    def test_stack_with_different_region(self):
        """Test stack creation with different AWS region."""
        stack = TapStack(
            self.app,
            "eu-stack",
            environment_suffix=self.environment_suffix,
            state_bucket=self.state_bucket,
            state_bucket_region="eu-west-1",
            aws_region="eu-west-1",
            default_tags=self.default_tags
        )
        synthesized = Testing.synth(stack)
        self.assertIsNotNone(synthesized)


class TestDynamoDBTable(unittest.TestCase):
    """Test cases for DynamoDB table configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table is created."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        self.assertTrue(len(dynamodb_tables) > 0, "No DynamoDB table found")

    def test_dynamodb_table_billing_mode(self):
        """Test DynamoDB table uses PAY_PER_REQUEST billing."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertEqual(table['billing_mode'], 'PAY_PER_REQUEST')

    def test_dynamodb_table_hash_key(self):
        """Test DynamoDB table has correct hash key."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertEqual(table['hash_key'], 'symbol')

    def test_dynamodb_table_range_key(self):
        """Test DynamoDB table has correct range key."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertEqual(table['range_key'], 'timestamp')

    def test_dynamodb_table_stream_enabled(self):
        """Test DynamoDB table has streams enabled."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertTrue(table['stream_enabled'])

    def test_dynamodb_table_stream_view_type(self):
        """Test DynamoDB table stream view type."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertEqual(table['stream_view_type'], 'NEW_AND_OLD_IMAGES')

    def test_dynamodb_table_point_in_time_recovery(self):
        """Test DynamoDB table has point-in-time recovery enabled."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        pitr = table.get('point_in_time_recovery', {})
        if isinstance(pitr, list):
            pitr = pitr[0] if pitr else {}
        self.assertTrue(pitr.get('enabled', False))

    def test_dynamodb_table_attributes(self):
        """Test DynamoDB table has correct attributes."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        attributes = table['attribute']
        attr_names = [a['name'] for a in attributes]
        self.assertIn('symbol', attr_names)
        self.assertIn('timestamp', attr_names)

    def test_dynamodb_table_name_contains_suffix(self):
        """Test DynamoDB table name contains environment suffix."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertIn(self.environment_suffix, table['name'])

    def test_dynamodb_table_tags(self):
        """Test DynamoDB table has correct tags."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        table = list(dynamodb_tables.values())[0]
        self.assertIn('Environment', table['tags'])
        self.assertIn('Application', table['tags'])
        self.assertEqual(table['tags']['Application'], 'crypto-price-processing')


class TestLambdaFunctions(unittest.TestCase):
    """Test cases for Lambda function configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_lambda_functions_count(self):
        """Test that two Lambda functions are created."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        self.assertEqual(len(lambda_functions), 2, "Should have 2 Lambda functions")

    def test_webhook_processor_exists(self):
        """Test webhook processor Lambda function exists."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        function_names = [f['function_name'] for f in lambda_functions.values()]
        self.assertIn(f'webhook-processor-{self.environment_suffix}', function_names)

    def test_price_enricher_exists(self):
        """Test price enricher Lambda function exists."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        function_names = [f['function_name'] for f in lambda_functions.values()]
        self.assertIn(f'price-enricher-{self.environment_suffix}', function_names)

    def test_lambda_functions_use_arm64(self):
        """Test Lambda functions use ARM64 architecture."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            self.assertEqual(function['architectures'], ['arm64'])

    def test_lambda_functions_use_python39(self):
        """Test Lambda functions use Python 3.9 runtime."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            self.assertEqual(function['runtime'], 'python3.9')

    def test_webhook_processor_memory(self):
        """Test webhook processor has correct memory."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            if 'webhook-processor' in function['function_name']:
                self.assertEqual(function['memory_size'], 1024)

    def test_webhook_processor_timeout(self):
        """Test webhook processor has correct timeout."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            if 'webhook-processor' in function['function_name']:
                self.assertEqual(function['timeout'], 60)

    def test_webhook_processor_concurrency(self):
        """Test webhook processor has correct reserved concurrency."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            if 'webhook-processor' in function['function_name']:
                self.assertEqual(function['reserved_concurrent_executions'], 10)

    def test_price_enricher_memory(self):
        """Test price enricher has correct memory."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            if 'price-enricher' in function['function_name']:
                self.assertEqual(function['memory_size'], 512)

    def test_price_enricher_timeout(self):
        """Test price enricher has correct timeout."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            if 'price-enricher' in function['function_name']:
                self.assertEqual(function['timeout'], 30)

    def test_price_enricher_concurrency(self):
        """Test price enricher has correct reserved concurrency."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            if 'price-enricher' in function['function_name']:
                self.assertEqual(function['reserved_concurrent_executions'], 5)

    def test_lambda_functions_have_kms_key(self):
        """Test Lambda functions have KMS key configured."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            self.assertIn('kms_key_arn', function)

    def test_lambda_functions_have_dead_letter_config(self):
        """Test Lambda functions have dead letter config."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            self.assertIn('dead_letter_config', function)

    def test_lambda_functions_have_environment_variables(self):
        """Test Lambda functions have environment variables."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            env = function.get('environment', {})
            if isinstance(env, list):
                env = env[0] if env else {}
            self.assertIn('variables', env)
            self.assertIn('DYNAMODB_TABLE', env['variables'])

    def test_lambda_functions_have_tags(self):
        """Test Lambda functions have tags."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        for function in lambda_functions.values():
            self.assertIn('tags', function)
            self.assertIn('Environment', function['tags'])


class TestKMSKey(unittest.TestCase):
    """Test cases for KMS key configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_kms_key_exists(self):
        """Test KMS key is created."""
        kms_keys = self.resources.get('aws_kms_key', {})
        self.assertTrue(len(kms_keys) > 0, "No KMS key found")

    def test_kms_key_rotation_enabled(self):
        """Test KMS key has rotation enabled."""
        kms_keys = self.resources.get('aws_kms_key', {})
        key = list(kms_keys.values())[0]
        self.assertTrue(key['enable_key_rotation'])

    def test_kms_key_deletion_window(self):
        """Test KMS key has correct deletion window."""
        kms_keys = self.resources.get('aws_kms_key', {})
        key = list(kms_keys.values())[0]
        self.assertEqual(key['deletion_window_in_days'], 10)

    def test_kms_alias_exists(self):
        """Test KMS alias is created."""
        kms_aliases = self.resources.get('aws_kms_alias', {})
        self.assertTrue(len(kms_aliases) > 0, "No KMS alias found")

    def test_kms_key_policy_exists(self):
        """Test KMS key has policy configured."""
        kms_keys = self.resources.get('aws_kms_key', {})
        key = list(kms_keys.values())[0]
        self.assertIn('policy', key)


class TestSQSQueues(unittest.TestCase):
    """Test cases for SQS dead letter queue configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_sqs_queues_count(self):
        """Test that two SQS queues are created."""
        sqs_queues = self.resources.get('aws_sqs_queue', {})
        self.assertEqual(len(sqs_queues), 2, "Should have 2 SQS queues")

    def test_sqs_queues_message_retention(self):
        """Test SQS queues have correct message retention."""
        sqs_queues = self.resources.get('aws_sqs_queue', {})
        for queue in sqs_queues.values():
            self.assertEqual(queue['message_retention_seconds'], 345600)

    def test_sqs_queues_have_tags(self):
        """Test SQS queues have tags."""
        sqs_queues = self.resources.get('aws_sqs_queue', {})
        for queue in sqs_queues.values():
            self.assertIn('tags', queue)

    def test_sqs_queue_names_contain_suffix(self):
        """Test SQS queue names contain environment suffix."""
        sqs_queues = self.resources.get('aws_sqs_queue', {})
        for queue in sqs_queues.values():
            self.assertIn(self.environment_suffix, queue['name'])


class TestSNSTopic(unittest.TestCase):
    """Test cases for SNS topic configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_sns_topic_exists(self):
        """Test SNS topic is created."""
        sns_topics = self.resources.get('aws_sns_topic', {})
        self.assertTrue(len(sns_topics) > 0, "No SNS topic found")

    def test_sns_topic_name_contains_suffix(self):
        """Test SNS topic name contains environment suffix."""
        sns_topics = self.resources.get('aws_sns_topic', {})
        topic = list(sns_topics.values())[0]
        self.assertIn(self.environment_suffix, topic['name'])

    def test_sns_topic_has_tags(self):
        """Test SNS topic has tags."""
        sns_topics = self.resources.get('aws_sns_topic', {})
        topic = list(sns_topics.values())[0]
        self.assertIn('tags', topic)


class TestCloudWatchLogGroups(unittest.TestCase):
    """Test cases for CloudWatch log group configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_log_groups_count(self):
        """Test that two CloudWatch log groups are created."""
        log_groups = self.resources.get('aws_cloudwatch_log_group', {})
        self.assertEqual(len(log_groups), 2, "Should have 2 CloudWatch log groups")

    def test_log_groups_retention(self):
        """Test CloudWatch log groups have correct retention."""
        log_groups = self.resources.get('aws_cloudwatch_log_group', {})
        for log_group in log_groups.values():
            self.assertEqual(log_group['retention_in_days'], 3)

    def test_log_groups_have_tags(self):
        """Test CloudWatch log groups have tags."""
        log_groups = self.resources.get('aws_cloudwatch_log_group', {})
        for log_group in log_groups.values():
            self.assertIn('tags', log_group)


class TestIAMRoles(unittest.TestCase):
    """Test cases for IAM role configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=self.environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_iam_roles_count(self):
        """Test that two IAM roles are created."""
        iam_roles = self.resources.get('aws_iam_role', {})
        self.assertEqual(len(iam_roles), 2, "Should have 2 IAM roles")

    def test_iam_roles_have_assume_role_policy(self):
        """Test IAM roles have assume role policy."""
        iam_roles = self.resources.get('aws_iam_role', {})
        for role in iam_roles.values():
            self.assertIn('assume_role_policy', role)

    def test_webhook_processor_role_policies(self):
        """Test webhook processor role has correct inline policies."""
        iam_roles = self.resources.get('aws_iam_role', {})
        for role in iam_roles.values():
            if 'webhook-processor' in role['name']:
                inline_policies = role.get('inline_policy', [])
                policy_names = [p['name'] for p in inline_policies]
                self.assertIn('dynamodb-access', policy_names)
                self.assertIn('kms-access', policy_names)
                self.assertIn('sqs-dlq-access', policy_names)
                self.assertIn('cloudwatch-logs', policy_names)

    def test_price_enricher_role_policies(self):
        """Test price enricher role has correct inline policies."""
        iam_roles = self.resources.get('aws_iam_role', {})
        for role in iam_roles.values():
            if 'price-enricher' in role['name']:
                inline_policies = role.get('inline_policy', [])
                policy_names = [p['name'] for p in inline_policies]
                self.assertIn('dynamodb-access', policy_names)
                self.assertIn('dynamodb-stream-access', policy_names)
                self.assertIn('kms-access', policy_names)
                self.assertIn('sqs-dlq-access', policy_names)
                self.assertIn('cloudwatch-logs', policy_names)
                self.assertIn('sns-publish', policy_names)

    def test_iam_roles_have_tags(self):
        """Test IAM roles have tags."""
        iam_roles = self.resources.get('aws_iam_role', {})
        for role in iam_roles.values():
            self.assertIn('tags', role)


class TestEventSourceMapping(unittest.TestCase):
    """Test cases for Lambda event source mapping configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_event_source_mapping_exists(self):
        """Test event source mapping is created."""
        event_mappings = self.resources.get('aws_lambda_event_source_mapping', {})
        self.assertTrue(len(event_mappings) > 0, "No event source mapping found")

    def test_event_source_mapping_starting_position(self):
        """Test event source mapping starting position."""
        event_mappings = self.resources.get('aws_lambda_event_source_mapping', {})
        mapping = list(event_mappings.values())[0]
        self.assertEqual(mapping['starting_position'], 'LATEST')

    def test_event_source_mapping_batch_size(self):
        """Test event source mapping batch size."""
        event_mappings = self.resources.get('aws_lambda_event_source_mapping', {})
        mapping = list(event_mappings.values())[0]
        self.assertEqual(mapping['batch_size'], 10)

    def test_event_source_mapping_batching_window(self):
        """Test event source mapping batching window."""
        event_mappings = self.resources.get('aws_lambda_event_source_mapping', {})
        mapping = list(event_mappings.values())[0]
        self.assertEqual(mapping['maximum_batching_window_in_seconds'], 5)

    def test_event_source_mapping_bisect_on_error(self):
        """Test event source mapping bisect on error."""
        event_mappings = self.resources.get('aws_lambda_event_source_mapping', {})
        mapping = list(event_mappings.values())[0]
        self.assertTrue(mapping['bisect_batch_on_function_error'])

    def test_event_source_mapping_retry_attempts(self):
        """Test event source mapping retry attempts."""
        event_mappings = self.resources.get('aws_lambda_event_source_mapping', {})
        mapping = list(event_mappings.values())[0]
        self.assertEqual(mapping['maximum_retry_attempts'], 2)


class TestLambdaDestinationConfig(unittest.TestCase):
    """Test cases for Lambda destination configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.resources = json.loads(self.synthesized)['resource']

    def test_event_invoke_config_exists(self):
        """Test event invoke config is created."""
        invoke_configs = self.resources.get('aws_lambda_function_event_invoke_config', {})
        self.assertTrue(len(invoke_configs) > 0, "No event invoke config found")

    def test_event_invoke_config_max_event_age(self):
        """Test event invoke config maximum event age."""
        invoke_configs = self.resources.get('aws_lambda_function_event_invoke_config', {})
        config = list(invoke_configs.values())[0]
        self.assertEqual(config['maximum_event_age_in_seconds'], 3600)

    def test_event_invoke_config_retry_attempts(self):
        """Test event invoke config retry attempts."""
        invoke_configs = self.resources.get('aws_lambda_function_event_invoke_config', {})
        config = list(invoke_configs.values())[0]
        self.assertEqual(config['maximum_retry_attempts'], 0)

    def test_event_invoke_config_has_destination(self):
        """Test event invoke config has destination config."""
        invoke_configs = self.resources.get('aws_lambda_function_event_invoke_config', {})
        config = list(invoke_configs.values())[0]
        self.assertIn('destination_config', config)


class TestStackOutputs(unittest.TestCase):
    """Test cases for stack outputs."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        self.synthesized = Testing.synth(self.stack)
        self.outputs = json.loads(self.synthesized).get('output', {})

    def test_webhook_processor_arn_output(self):
        """Test webhook processor ARN output exists."""
        self.assertIn('webhook_processor_arn', self.outputs)

    def test_price_enricher_arn_output(self):
        """Test price enricher ARN output exists."""
        self.assertIn('price_enricher_arn', self.outputs)

    def test_dynamodb_table_name_output(self):
        """Test DynamoDB table name output exists."""
        self.assertIn('dynamodb_table_name', self.outputs)

    def test_sns_topic_arn_output(self):
        """Test SNS topic ARN output exists."""
        self.assertIn('sns_topic_arn', self.outputs)


class TestCreateLambdaRoleMethods(unittest.TestCase):
    """Test cases for _create_lambda_role and _create_enricher_lambda_role methods."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}
        self.stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )

    def test_create_lambda_role_returns_role(self):
        """Test _create_lambda_role returns IAM role."""
        # Use test account ID constant for unit tests
        test_account_id = "123456789012"
        test_region = "us-east-1"
        role = self.stack._create_lambda_role(
            "test-role",
            "test",
            "test-function",
            f"arn:aws:dynamodb:{test_region}:{test_account_id}:table/test",
            f"arn:aws:kms:{test_region}:{test_account_id}:key/test",
            f"arn:aws:sqs:{test_region}:{test_account_id}:test-dlq",
            test_region,
            test_account_id
        )
        self.assertIsNotNone(role)

    def test_create_enricher_lambda_role_returns_role(self):
        """Test _create_enricher_lambda_role returns IAM role."""
        # Use test account ID constant for unit tests
        test_account_id = "123456789012"
        test_region = "us-east-1"
        role = self.stack._create_enricher_lambda_role(
            "test-enricher-role",
            "test",
            "test-enricher-function",
            f"arn:aws:dynamodb:{test_region}:{test_account_id}:table/test",
            f"arn:aws:dynamodb:{test_region}:{test_account_id}:table/test/stream/test",
            f"arn:aws:kms:{test_region}:{test_account_id}:key/test",
            f"arn:aws:sqs:{test_region}:{test_account_id}:test-dlq",
            test_region,
            test_account_id,
            f"arn:aws:sns:{test_region}:{test_account_id}:test-topic"
        )
        self.assertIsNotNone(role)

    def test_create_enricher_lambda_role_without_sns(self):
        """Test _create_enricher_lambda_role without SNS ARN."""
        # Use test account ID constant for unit tests
        test_account_id = "123456789012"
        test_region = "us-east-1"
        role = self.stack._create_enricher_lambda_role(
            "test-enricher-role-no-sns",
            "test",
            "test-enricher-function",
            f"arn:aws:dynamodb:{test_region}:{test_account_id}:table/test",
            f"arn:aws:dynamodb:{test_region}:{test_account_id}:table/test/stream/test",
            f"arn:aws:kms:{test_region}:{test_account_id}:key/test",
            f"arn:aws:sqs:{test_region}:{test_account_id}:test-dlq",
            test_region,
            test_account_id,
            None
        )
        self.assertIsNotNone(role)


if __name__ == '__main__':
    unittest.main()
