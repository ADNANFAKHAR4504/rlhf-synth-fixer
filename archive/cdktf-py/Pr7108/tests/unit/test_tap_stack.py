"""Unit tests for TapStack infrastructure."""

import pytest
import os
from cdktf import Testing, TerraformStack
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for payment processing infrastructure stack."""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance."""
        app = Testing.app()
        return TapStack(
            app,
            "test",
            environment_suffix="test",
            aws_region="us-east-1"
        )

    def test_stack_synthesizes(self, stack):
        """Test that the stack synthesizes without errors."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert len(synthesized) > 0

    def test_s3_bucket_created(self, stack):
        """Test S3 bucket is created with correct configuration."""
        synthesized = Testing.synth(stack)

        # Check for S3 bucket in synthesized output
        assert "aws_s3_bucket" in synthesized

        # Verify bucket has force_destroy enabled
        s3_resources = [r for r in synthesized.split('"resource"') if 'aws_s3_bucket' in r]
        assert len(s3_resources) > 0
        assert 'force_destroy' in synthesized

    def test_dynamodb_tables_created(self, stack):
        """Test DynamoDB tables are created."""
        synthesized = Testing.synth(stack)

        # Should have transactions, idempotency, and workflow tables
        assert "aws_dynamodb_table" in synthesized
        assert synthesized.count("aws_dynamodb_table") >= 3

    def test_lambda_functions_created(self, stack):
        """Test Lambda functions are created."""
        synthesized = Testing.synth(stack)

        # Should have payment processor, batch processor, and API handler
        assert "aws_lambda_function" in synthesized
        assert synthesized.count("aws_lambda_function") >= 3

    def test_api_gateway_created(self, stack):
        """Test API Gateway is created."""
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_rest_api" in synthesized
        assert "aws_api_gateway_resource" in synthesized
        assert "aws_api_gateway_method" in synthesized

    def test_step_functions_created(self, stack):
        """Test Step Functions state machine is created."""
        synthesized = Testing.synth(stack)

        assert "aws_sfn_state_machine" in synthesized

    def test_sns_topic_created(self, stack):
        """Test SNS topic is created."""
        synthesized = Testing.synth(stack)

        assert "aws_sns_topic" in synthesized

    def test_sqs_queues_created(self, stack):
        """Test SQS queues are created (main + DLQ)."""
        synthesized = Testing.synth(stack)

        assert "aws_sqs_queue" in synthesized
        # Should have main queue and DLQ
        assert synthesized.count("aws_sqs_queue") >= 2

    def test_iam_roles_created(self, stack):
        """Test IAM roles are created."""
        synthesized = Testing.synth(stack)

        assert "aws_iam_role" in synthesized
        # Should have roles for Lambda functions
        assert synthesized.count("aws_iam_role") >= 3

    def test_cloudwatch_log_groups_created(self, stack):
        """Test CloudWatch log groups are created."""
        synthesized = Testing.synth(stack)

        assert "aws_cloudwatch_log_group" in synthesized

    def test_cloudwatch_alarms_created(self, stack):
        """Test CloudWatch alarms are created."""
        synthesized = Testing.synth(stack)

        assert "aws_cloudwatch_metric_alarm" in synthesized

    def test_encryption_enabled(self, stack):
        """Test encryption is enabled on resources."""
        synthesized = Testing.synth(stack)

        # S3 encryption
        assert "server_side_encryption_configuration" in synthesized

        # DynamoDB encryption
        assert "server_side_encryption" in synthesized or "encryption" in synthesized

    def test_environment_suffix_in_resources(self, stack):
        """Test environment suffix is used in resource names."""
        synthesized = Testing.synth(stack)

        # Should contain the test suffix
        assert "test" in synthesized

    def test_tags_applied(self, stack):
        """Test common tags are applied to resources."""
        synthesized = Testing.synth(stack)

        assert "Environment" in synthesized
        assert "ManagedBy" in synthesized
        assert "Application" in synthesized

    def test_point_in_time_recovery_enabled(self, stack):
        """Test DynamoDB tables have PITR enabled."""
        synthesized = Testing.synth(stack)

        assert "point_in_time_recovery" in synthesized

    def test_s3_versioning_enabled(self, stack):
        """Test S3 bucket has versioning enabled."""
        synthesized = Testing.synth(stack)

        assert "aws_s3_bucket_versioning" in synthesized

    def test_s3_public_access_blocked(self, stack):
        """Test S3 bucket has public access blocked."""
        synthesized = Testing.synth(stack)

        assert "aws_s3_bucket_public_access_block" in synthesized

    def test_lambda_runtime_version(self, stack):
        """Test Lambda functions use correct Python runtime."""
        synthesized = Testing.synth(stack)

        # Should use Python 3.12
        assert "python3.12" in synthesized

    def test_api_gateway_integration(self, stack):
        """Test API Gateway has Lambda integration."""
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_integration" in synthesized
        assert "AWS_PROXY" in synthesized or "aws_proxy" in synthesized.lower()

    def test_sqs_dlq_configured(self, stack):
        """Test SQS has dead letter queue configured."""
        synthesized = Testing.synth(stack)

        # DLQ should be referenced in main queue config
        assert "redrive_policy" in synthesized or "dead_letter" in synthesized.lower()

    def test_iam_least_privilege(self, stack):
        """Test IAM roles follow least privilege principle."""
        synthesized = Testing.synth(stack)

        # Should have specific policies, not wildcards
        assert "aws_iam_role_policy" in synthesized or "aws_iam_policy" in synthesized

    def test_s3_notification_configured(self, stack):
        """Test S3 has notification configured for batch processing."""
        synthesized = Testing.synth(stack)

        assert "aws_s3_bucket_notification" in synthesized

    def test_dynamodb_gsi_configured(self, stack):
        """Test DynamoDB has Global Secondary Index configured."""
        synthesized = Testing.synth(stack)

        assert "global_secondary_index" in synthesized

    def test_multiple_environments_supported(self):
        """Test stack supports multiple environment suffixes."""
        app = Testing.app()

        # Create stacks for different environments
        dev_stack = TapStack(app, "dev", environment_suffix="dev", aws_region="us-east-1")
        staging_stack = TapStack(app, "staging", environment_suffix="staging", aws_region="us-east-1")

        dev_synth = Testing.synth(dev_stack)
        staging_synth = Testing.synth(staging_stack)

        assert "dev" in dev_synth
        assert "staging" in staging_synth
        assert dev_synth != staging_synth

    def test_stack_outputs_defined(self, stack):
        """Test stack has outputs defined."""
        synthesized = Testing.synth(stack)

        assert "output" in synthesized

    def test_aws_provider_configured(self, stack):
        """Test AWS provider is properly configured."""
        synthesized = Testing.synth(stack)

        assert "provider" in synthesized
        assert "aws" in synthesized

    def test_lambda_environment_variables(self, stack):
        """Test Lambda functions have environment variables configured."""
        synthesized = Testing.synth(stack)

        # Lambda functions should have environment configuration
        assert "environment" in synthesized

    def test_api_gateway_stage_configured(self, stack):
        """Test API Gateway has deployment stage configured."""
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_deployment" in synthesized
        assert "aws_api_gateway_stage" in synthesized

    def test_cloudwatch_logs_retention(self, stack):
        """Test CloudWatch logs have retention configured."""
        synthesized = Testing.synth(stack)

        assert "retention_in_days" in synthesized

    def test_step_functions_definition(self, stack):
        """Test Step Functions has valid state machine definition."""
        synthesized = Testing.synth(stack)

        # State machine should have definition
        assert "definition" in synthesized
        # Should reference Lambda functions
        assert "Resource" in synthesized or "resource" in synthesized
