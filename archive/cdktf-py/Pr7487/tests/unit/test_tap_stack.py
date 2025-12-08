"""Unit tests for Cryptocurrency Price Processing System TAP Stack."""
import os
import sys
import json

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TapStack structure and resources."""

    def setup_method(self):
        """Setup test environment before each test."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'

    def test_tap_stack_instantiates_successfully(self):
        """Test that TapStack instantiates without errors."""
        app = App()
        stack = TapStack(app, "TestStack")
        assert stack is not None

    def test_synthesized_stack_has_required_resources(self):
        """Test that synthesized stack contains all required resources."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Verify stack synthesizes successfully
        assert synthesized is not None
        assert len(synthesized) > 0

    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table is configured correctly."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)

        # Parse JSON string
        synthesized = json.loads(synthesized_str)

        # Find DynamoDB table in synthesized resources
        resources = synthesized['resource']
        assert 'aws_dynamodb_table' in resources

        dynamodb_tables = resources['aws_dynamodb_table']
        table = list(dynamodb_tables.values())[0]

        assert table['billing_mode'] == 'PAY_PER_REQUEST'
        assert table['hash_key'] == 'symbol'
        assert table['range_key'] == 'timestamp'
        assert table['stream_enabled'] is True
        assert table['stream_view_type'] == 'NEW_AND_OLD_IMAGES'
        # point_in_time_recovery is a dict, not a list
        assert table['point_in_time_recovery']['enabled'] is True

    def test_lambda_functions_configuration(self):
        """Test Lambda functions are configured correctly."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        assert 'aws_lambda_function' in resources

        lambda_functions = resources['aws_lambda_function']

        # Should have 2 Lambda functions
        assert len(lambda_functions) == 2

        # Check webhook processor
        webhook_lambda = None
        enricher_lambda = None

        for func_name, func_config in lambda_functions.items():
            if 'webhook-processor' in func_name:
                webhook_lambda = func_config
            elif 'price-enricher' in func_name:
                enricher_lambda = func_config

        # Verify webhook processor configuration
        assert webhook_lambda is not None
        assert webhook_lambda['runtime'] == 'python3.11'
        assert webhook_lambda['memory_size'] == 1024
        assert webhook_lambda['timeout'] == 60
        assert 'arm64' in webhook_lambda['architectures']

        # Verify enricher configuration
        assert enricher_lambda is not None
        assert enricher_lambda['runtime'] == 'python3.11'
        assert enricher_lambda['memory_size'] == 512
        assert enricher_lambda['timeout'] == 60
        assert 'arm64' in enricher_lambda['architectures']

    def test_kms_key_configuration(self):
        """Test KMS key is configured correctly."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        assert 'aws_kms_key' in resources

        kms_keys = resources['aws_kms_key']
        kms_key = list(kms_keys.values())[0]

        assert kms_key['enable_key_rotation'] is True
        assert kms_key['deletion_window_in_days'] == 10

    def test_sqs_queues_configuration(self):
        """Test SQS dead letter queues are configured correctly."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        assert 'aws_sqs_queue' in resources

        sqs_queues = resources['aws_sqs_queue']

        # Should have 2 DLQs
        assert len(sqs_queues) == 2

        for queue_config in sqs_queues.values():
            assert queue_config['message_retention_seconds'] == 345600  # 4 days

    def test_sns_topic_configuration(self):
        """Test SNS topic for success notifications exists."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        assert 'aws_sns_topic' in resources

    def test_iam_roles_configuration(self):
        """Test IAM roles are configured correctly."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        assert 'aws_iam_role' in resources

        iam_roles = resources['aws_iam_role']

        # Should have 2 IAM roles
        assert len(iam_roles) == 2

    def test_cloudwatch_log_groups_configuration(self):
        """Test CloudWatch log groups are configured correctly."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        assert 'aws_cloudwatch_log_group' in resources

        log_groups = resources['aws_cloudwatch_log_group']

        # Should have 2 log groups
        assert len(log_groups) == 2

        for log_group in log_groups.values():
            assert log_group['retention_in_days'] == 3

    def test_lambda_event_source_mapping_configuration(self):
        """Test DynamoDB stream event source mapping is configured."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        assert 'aws_lambda_event_source_mapping' in resources

        event_mappings = resources['aws_lambda_event_source_mapping']
        mapping = list(event_mappings.values())[0]

        assert mapping['starting_position'] == 'LATEST'
        assert mapping['batch_size'] == 10
        assert mapping['maximum_retry_attempts'] == 3
        assert mapping['bisect_batch_on_function_error'] is True

    def test_stack_outputs(self):
        """Test stack outputs are defined."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        outputs = synthesized['output']

        # Verify required outputs
        assert 'webhook_processor_arn' in outputs
        assert 'price_enricher_arn' in outputs
        assert 'dynamodb_table_name' in outputs
        assert 'sns_topic_arn' in outputs
        assert 'kms_key_id' in outputs

    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is used in resource names."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'prod'
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        # Check DynamoDB table name
        resources = synthesized['resource']
        dynamodb_table = list(resources['aws_dynamodb_table'].values())[0]
        assert 'prod' in dynamodb_table['name']

        # Check Lambda function names
        lambda_functions = resources['aws_lambda_function']
        for func_config in lambda_functions.values():
            assert 'prod' in func_config['function_name']

    def test_lambda_kms_encryption_configured(self):
        """Test Lambda functions use KMS encryption."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        lambda_functions = resources['aws_lambda_function']

        for func_config in lambda_functions.values():
            assert 'kms_key_arn' in func_config

    def test_lambda_dead_letter_config(self):
        """Test Lambda functions have dead letter queues configured."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']
        lambda_functions = resources['aws_lambda_function']

        for func_config in lambda_functions.values():
            assert 'dead_letter_config' in func_config

    def test_tags_applied_to_resources(self):
        """Test that tags are applied to resources."""
        app = App()
        stack = TapStack(app, "TestStack")
        synthesized_str = Testing.synth(stack)
        synthesized = json.loads(synthesized_str)

        resources = synthesized['resource']

        # Check DynamoDB table tags
        dynamodb_table = list(resources['aws_dynamodb_table'].values())[0]
        assert 'tags' in dynamodb_table
        assert dynamodb_table['tags']['Application'] == 'crypto-price-processor'
