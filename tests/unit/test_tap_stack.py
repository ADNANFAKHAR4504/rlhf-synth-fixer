"""Unit tests for FraudDetectionStack."""

import pytest
from cdktf import Testing
from lib.tap_stack import FraudDetectionStack


class TestFraudDetectionStack:
    """Test suite for FraudDetectionStack."""

    def test_stack_synthesis(self):
        """Test that the stack synthesizes without errors."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_kms_key_creation(self):
        """Test that KMS key is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for KMS key resources
        assert "aws_kms_key.fraud-detection-key-test" in synthesized
        assert "aws_kms_alias.fraud-detection-key-alias-test" in synthesized

    def test_dynamodb_table_creation(self):
        """Test that DynamoDB table is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for DynamoDB table
        assert "aws_dynamodb_table.transactions-table-test" in synthesized

    def test_sns_topic_creation(self):
        """Test that SNS topic is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for SNS topic
        assert "aws_sns_topic.fraud-alerts-topic-test" in synthesized

    def test_sqs_queues_creation(self):
        """Test that SQS queues are created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for SQS queues
        assert "aws_sqs_queue.fraud-alerts-queue-test" in synthesized
        assert "aws_sqs_queue.lambda-dlq-test" in synthesized

    def test_lambda_functions_creation(self):
        """Test that Lambda functions are created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for Lambda functions
        assert "aws_lambda_function.transaction-processor-test" in synthesized
        assert "aws_lambda_function.pattern-analyzer-test" in synthesized

    def test_cloudwatch_alarms_creation(self):
        """Test that CloudWatch alarms are created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for CloudWatch alarms
        assert "aws_cloudwatch_metric_alarm.transaction-processor-errors-test" in synthesized
        assert "aws_cloudwatch_metric_alarm.pattern-analyzer-errors-test" in synthesized

    def test_eventbridge_rule_creation(self):
        """Test that EventBridge rule is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for EventBridge rule
        assert "aws_cloudwatch_event_rule.pattern-analysis-schedule-test" in synthesized

    def test_api_gateway_creation(self):
        """Test that API Gateway is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for API Gateway resources
        assert "aws_api_gateway_rest_api.fraud-detection-api-test" in synthesized
        assert "aws_api_gateway_resource.transactions-resource-test" in synthesized
        assert "aws_api_gateway_method.transactions-post-method-test" in synthesized

    def test_iam_roles_creation(self):
        """Test that IAM roles are created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for IAM roles
        assert "aws_iam_role.transaction-processor-role-test" in synthesized
        assert "aws_iam_role.pattern-analyzer-role-test" in synthesized
        assert "aws_iam_role.sns-feedback-role-test" in synthesized

    def test_ssm_parameters_creation(self):
        """Test that SSM parameters are created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for SSM parameters
        assert "aws_ssm_parameter.fraud-threshold-param-test" in synthesized
        assert "aws_ssm_parameter.alert-email-param-test" in synthesized

    def test_cloudwatch_log_groups_creation(self):
        """Test that CloudWatch log groups are created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for log groups
        assert "aws_cloudwatch_log_group.transaction-processor-logs-test" in synthesized
        assert "aws_cloudwatch_log_group.pattern-analyzer-logs-test" in synthesized

    def test_environment_suffix_usage(self):
        """Test that environment_suffix is used in resource names."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="prod"
        )
        synthesized = Testing.synth(stack)

        # Check that 'prod' suffix is used
        assert "fraud-detection-key-prod" in synthesized
        assert "transactions-table-prod" in synthesized

    def test_api_key_creation(self):
        """Test that API key is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for API key and usage plan
        assert "aws_api_gateway_api_key.api-key-test" in synthesized
        assert "aws_api_gateway_usage_plan.usage-plan-test" in synthesized

    def test_outputs_defined(self):
        """Test that all expected outputs are defined."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for outputs
        assert "api_endpoint" in synthesized
        assert "transaction_processor_arn" in synthesized
        assert "dynamodb_table_name" in synthesized

    def test_encryption_enabled(self):
        """Test that encryption is enabled on resources."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # DynamoDB should use KMS encryption
        assert "server_side_encryption" in synthesized

        # SNS should use KMS
        assert "kms_master_key_id" in synthesized

    def test_tags_applied(self):
        """Test that tags are applied to resources."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check that tags exist in the synthesized output
        assert '"Environment": "test"' in synthesized or 'Environment' in synthesized
        assert "FraudDetection" in synthesized

    def test_multiple_environments(self):
        """Test stack creation with different environment suffixes."""
        for env in ["dev", "qa", "prod", "staging"]:
            app = Testing.app()
            stack = FraudDetectionStack(
                app,
                "test-stack",
                environment_suffix=env
            )
            synthesized = Testing.synth(stack)
            assert synthesized is not None
            assert f"transactions-table-{env}" in synthesized
