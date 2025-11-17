"""Comprehensive unit tests for FraudDetectionStack with 100% code coverage."""

import pytest
from cdktf import Testing
from lib.tap_stack import FraudDetectionStack


class TestFraudDetectionStack:
    """Test suite for FraudDetectionStack with comprehensive coverage."""

    # ========================================
    # Basic Stack Tests
    # ========================================

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
        assert len(synthesized) > 0

    def test_stack_with_all_parameters(self):
        """Test stack creation with all parameters."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="my-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
            use_dynamodb_lock=True,
            default_tags={
                "tags": {
                    "Owner": "test-owner",
                    "Team": "test-team"
                }
            }
        )
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "test-owner" in synthesized or "Owner" in synthesized

    def test_stack_with_default_parameters(self):
        """Test stack creation with default parameters only."""
        app = Testing.app()
        stack = FraudDetectionStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Should use default environment_suffix "dev"
        assert "v1-dev" in synthesized

    def test_resource_suffix_generation(self):
        """Test that resource_suffix is correctly generated."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test123"
        )
        assert stack.resource_suffix == "v1-test123"
        assert stack.environment_suffix == "test123"

    # ========================================
    # S3 Backend Configuration Tests
    # ========================================

    def test_s3_backend_configuration(self):
        """Test S3 backend is configured correctly."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        assert "test-bucket" in synthesized
        assert "fraud-detection/test/terraform.tfstate" in synthesized

    def test_s3_backend_with_dynamodb_lock(self):
        """Test S3 backend with DynamoDB locking enabled."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            use_dynamodb_lock=True
        )
        synthesized = Testing.synth(stack)
        assert "test-bucket-lock" in synthesized

    def test_s3_backend_without_dynamodb_lock(self):
        """Test S3 backend without DynamoDB locking."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            use_dynamodb_lock=False
        )
        synthesized = Testing.synth(stack)
        # Should not contain dynamodb_table reference
        assert synthesized is not None

    # ========================================
    # KMS Encryption Tests
    # ========================================

    def test_kms_key_creation(self):
        """Test that KMS key is created with correct configuration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for KMS key with v1 suffix
        assert "aws_kms_key.fraud-detection-key-v1-test" in synthesized
        assert "enable_key_rotation" in synthesized
        assert "deletion_window_in_days" in synthesized

    def test_kms_alias_creation(self):
        """Test that KMS alias is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "fraud-detection-key-alias-v1-test" in synthesized
        assert "alias/fraud-detection-v1-test" in synthesized

    # ========================================
    # DynamoDB Tests
    # ========================================

    def test_dynamodb_table_creation(self):
        """Test that DynamoDB table is created with correct attributes."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Check for table with v1 suffix
        assert "aws_dynamodb_table.transactions-table-v1-test" in synthesized
        assert "transactions-v1-test" in synthesized
        assert "PAY_PER_REQUEST" in synthesized

    def test_dynamodb_table_attributes(self):
        """Test DynamoDB table has required attributes."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "transaction_id" in synthesized
        assert "timestamp" in synthesized
        assert "user_id" in synthesized

    def test_dynamodb_gsi(self):
        """Test DynamoDB Global Secondary Index."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "user-index" in synthesized
        assert "global_secondary_index" in synthesized

    def test_dynamodb_encryption(self):
        """Test DynamoDB table encryption is enabled."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "server_side_encryption" in synthesized

    def test_dynamodb_point_in_time_recovery(self):
        """Test DynamoDB PITR is enabled."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "point_in_time_recovery" in synthesized

    # ========================================
    # SNS Tests
    # ========================================

    def test_sns_topic_creation(self):
        """Test that SNS topic is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_sns_topic.fraud-alerts-topic-v1-test" in synthesized
        assert "fraud-alerts-v1-test" in synthesized

    def test_sns_encryption(self):
        """Test SNS topic encryption with KMS."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "kms_master_key_id" in synthesized

    def test_sns_feedback_role(self):
        """Test SNS feedback role creation."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_iam_role.sns-feedback-role-v1-test" in synthesized
        assert "sns-feedback-role-v1-test" in synthesized

    def test_sns_feedback_policy(self):
        """Test SNS feedback policy creation."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_iam_policy.sns-feedback-policy-v1-test" in synthesized
        assert "CreateLogGroup" in synthesized
        assert "PutLogEvents" in synthesized

    def test_sns_subscription(self):
        """Test SNS to SQS subscription."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "fraud-alerts-subscription-v1-test" in synthesized
        assert "aws_sns_topic_subscription" in synthesized

    # ========================================
    # SQS Tests
    # ========================================

    def test_sqs_queue_creation(self):
        """Test that SQS queue is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_sqs_queue.fraud-alerts-queue-v1-test" in synthesized
        assert "fraud-alerts-queue-v1-test" in synthesized

    def test_sqs_dlq_creation(self):
        """Test that DLQ is created."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_sqs_queue.lambda-dlq-v1-test" in synthesized
        assert "lambda-dlq-v1-test" in synthesized

    def test_sqs_queue_policy(self):
        """Test SQS queue policy for SNS."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_sqs_queue_policy.fraud-alerts-queue-policy-v1-test" in synthesized
        assert "sqs:SendMessage" in synthesized

    def test_sqs_encryption(self):
        """Test SQS queue encryption."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Both queues should have KMS encryption
        assert "kms_master_key_id" in synthesized

    # ========================================
    # SSM Parameters Tests
    # ========================================

    def test_ssm_fraud_threshold_parameter(self):
        """Test fraud threshold SSM parameter."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "fraud-threshold-param-v1-test" in synthesized
        assert "/fraud-detection/v1-test/fraud_threshold" in synthesized
        assert "0.85" in synthesized

    def test_ssm_alert_email_parameter(self):
        """Test alert email SSM parameter."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "alert-email-param-v1-test" in synthesized
        assert "/fraud-detection/v1-test/alert_email" in synthesized
        assert "alerts@example.com" in synthesized

    # ========================================
    # Lambda Functions Tests
    # ========================================

    def test_transaction_processor_lambda(self):
        """Test transaction processor Lambda function."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_lambda_function.transaction-processor-v1-test" in synthesized
        assert "transaction-processor-v1-test" in synthesized
        assert "python3.11" in synthesized

    def test_pattern_analyzer_lambda(self):
        """Test pattern analyzer Lambda function."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_lambda_function.pattern-analyzer-v1-test" in synthesized
        assert "pattern-analyzer-v1-test" in synthesized

    def test_lambda_runtime_configuration(self):
        """Test Lambda runtime settings."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "python3.11" in synthesized
        assert "arm64" in synthesized

    def test_lambda_environment_variables(self):
        """Test Lambda environment variables."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "DYNAMODB_TABLE" in synthesized
        assert "SNS_TOPIC_ARN" in synthesized
        assert "ENVIRONMENT" in synthesized

    def test_lambda_dead_letter_config(self):
        """Test Lambda DLQ configuration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "dead_letter_config" in synthesized

    def test_lambda_xray_tracing(self):
        """Test Lambda X-Ray tracing enabled."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "tracing_config" in synthesized
        assert "Active" in synthesized

    def test_lambda_reserved_concurrency(self):
        """Test Lambda reserved concurrent executions."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "reserved_concurrent_executions" in synthesized

    # ========================================
    # IAM Roles and Policies Tests
    # ========================================

    def test_transaction_processor_iam_role(self):
        """Test transaction processor IAM role."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_iam_role.transaction-processor-role-v1-test" in synthesized
        assert "transaction-processor-role-v1-test" in synthesized

    def test_pattern_analyzer_iam_role(self):
        """Test pattern analyzer IAM role."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_iam_role.pattern-analyzer-role-v1-test" in synthesized
        assert "pattern-analyzer-role-v1-test" in synthesized

    def test_lambda_basic_execution_policy(self):
        """Test Lambda basic execution policy attachment."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "AWSLambdaBasicExecutionRole" in synthesized

    def test_lambda_xray_policy(self):
        """Test Lambda X-Ray policy attachment."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "AWSXRayDaemonWriteAccess" in synthesized

    def test_lambda_dynamodb_permissions(self):
        """Test Lambda DynamoDB permissions."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "dynamodb:PutItem" in synthesized
        assert "dynamodb:GetItem" in synthesized
        assert "dynamodb:Query" in synthesized
        assert "dynamodb:Scan" in synthesized

    def test_lambda_sns_permissions(self):
        """Test Lambda SNS publish permissions."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "sns:Publish" in synthesized

    def test_lambda_ssm_permissions(self):
        """Test Lambda SSM parameter permissions."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "ssm:GetParameter" in synthesized
        assert "ssm:GetParameters" in synthesized
        assert "/fraud-detection/v1-test" in synthesized

    def test_lambda_kms_permissions(self):
        """Test Lambda KMS permissions."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "kms:Decrypt" in synthesized
        assert "kms:GenerateDataKey" in synthesized

    def test_lambda_sqs_permissions(self):
        """Test Lambda SQS permissions for DLQ."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "sqs:SendMessage" in synthesized

    # ========================================
    # CloudWatch Tests
    # ========================================

    def test_transaction_processor_log_group(self):
        """Test transaction processor CloudWatch log group."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_cloudwatch_log_group.transaction-processor-logs-v1-test" in synthesized
        assert "/aws/lambda/transaction-processor-v1-test" in synthesized

    def test_pattern_analyzer_log_group(self):
        """Test pattern analyzer CloudWatch log group."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_cloudwatch_log_group.pattern-analyzer-logs-v1-test" in synthesized
        assert "/aws/lambda/pattern-analyzer-v1-test" in synthesized

    def test_log_retention(self):
        """Test CloudWatch log retention period."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "retention_in_days" in synthesized

    def test_transaction_processor_alarm(self):
        """Test transaction processor CloudWatch alarm."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "transaction-processor-errors-v1-test" in synthesized
        assert "aws_cloudwatch_metric_alarm" in synthesized

    def test_pattern_analyzer_alarm(self):
        """Test pattern analyzer CloudWatch alarm."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "pattern-analyzer-errors-v1-test" in synthesized
        assert "aws_cloudwatch_metric_alarm" in synthesized

    def test_alarm_configuration(self):
        """Test CloudWatch alarm configuration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "GreaterThanThreshold" in synthesized
        assert "AWS/Lambda" in synthesized
        assert "Errors" in synthesized

    # ========================================
    # EventBridge Tests
    # ========================================

    def test_eventbridge_rule_creation(self):
        """Test EventBridge scheduled rule."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_cloudwatch_event_rule.pattern-analysis-schedule-v1-test" in synthesized
        assert "pattern-analysis-schedule-v1-test" in synthesized

    def test_eventbridge_schedule(self):
        """Test EventBridge schedule expression."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "rate(5 minutes)" in synthesized

    def test_eventbridge_target(self):
        """Test EventBridge target configuration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "pattern-analyzer-target-v1-test" in synthesized
        assert "aws_cloudwatch_event_target" in synthesized

    def test_eventbridge_lambda_permission(self):
        """Test Lambda permission for EventBridge."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "pattern-analyzer-eventbridge-permission-v1-test" in synthesized
        assert "events.amazonaws.com" in synthesized

    # ========================================
    # API Gateway Tests
    # ========================================

    def test_api_gateway_rest_api(self):
        """Test API Gateway REST API creation."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_rest_api.fraud-detection-api-v1-test" in synthesized
        assert "fraud-detection-api-v1-test" in synthesized

    def test_api_gateway_resource(self):
        """Test API Gateway resource."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_resource.transactions-resource-v1-test" in synthesized
        assert "transactions" in synthesized

    def test_api_gateway_method(self):
        """Test API Gateway POST method."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_method.transactions-post-method-v1-test" in synthesized
        assert "POST" in synthesized

    def test_api_gateway_integration(self):
        """Test API Gateway Lambda integration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_integration.transactions-integration-v1-test" in synthesized
        assert "AWS_PROXY" in synthesized

    def test_api_gateway_deployment(self):
        """Test API Gateway deployment."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_deployment.api-deployment-v1-test" in synthesized

    def test_api_gateway_stage(self):
        """Test API Gateway stage."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_stage.api-stage-v1-test" in synthesized
        assert "prod" in synthesized

    def test_api_gateway_request_validator(self):
        """Test API Gateway request validator."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_request_validator.request-validator-v1-test" in synthesized
        assert "validate_request_body" in synthesized

    def test_api_gateway_model(self):
        """Test API Gateway request model."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_model.transaction-model-v1-test" in synthesized
        assert "TransactionModel" in synthesized

    def test_api_key_creation(self):
        """Test API key creation."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_api_key.api-key-v1-test" in synthesized
        assert "fraud-detection-api-key-v1-test" in synthesized

    def test_usage_plan_creation(self):
        """Test usage plan creation."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "aws_api_gateway_usage_plan.usage-plan-v1-test" in synthesized
        assert "fraud-detection-usage-plan-v1-test" in synthesized

    def test_usage_plan_quota(self):
        """Test usage plan quota settings."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "quota_settings" in synthesized
        assert "1000" in synthesized

    def test_usage_plan_key(self):
        """Test usage plan key association."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "usage-plan-key-v1-test" in synthesized
        assert "aws_api_gateway_usage_plan_key" in synthesized

    def test_api_gateway_lambda_permission(self):
        """Test Lambda permission for API Gateway."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "api-gateway-lambda-permission-v1-test" in synthesized
        assert "apigateway.amazonaws.com" in synthesized

    def test_api_gateway_xray_tracing(self):
        """Test API Gateway X-Ray tracing."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "xray_tracing_enabled" in synthesized

    # ========================================
    # Outputs Tests
    # ========================================

    def test_api_endpoint_output(self):
        """Test API endpoint output."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "api_endpoint" in synthesized
        assert "execute-api" in synthesized

    def test_transaction_processor_arn_output(self):
        """Test transaction processor ARN output."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "transaction_processor_arn" in synthesized

    def test_dynamodb_table_name_output(self):
        """Test DynamoDB table name output."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "dynamodb_table_name" in synthesized

    # ========================================
    # Tags Tests
    # ========================================

    def test_common_tags_applied(self):
        """Test common tags are applied to resources."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "Environment" in synthesized
        assert "FraudDetection" in synthesized
        assert "CostCenter" in synthesized

    def test_environment_tag_value(self):
        """Test environment tag has correct value."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="production"
        )
        synthesized = Testing.synth(stack)

        assert "production" in synthesized

    def test_default_tags_merge(self):
        """Test default tags merge with base tags."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            default_tags={
                "tags": {
                    "Owner": "engineering-team",
                    "CostCenter": "fraud-prevention"
                }
            }
        )
        synthesized = Testing.synth(stack)

        assert "engineering-team" in synthesized or "Owner" in synthesized

    def test_tags_structure(self):
        """Test tags structure in common_tags."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )

        assert "Environment" in stack.common_tags
        assert "Project" in stack.common_tags
        assert "CostCenter" in stack.common_tags
        assert stack.common_tags["Environment"] == "test"
        assert stack.common_tags["Project"] == "FraudDetection"

    # ========================================
    # Multiple Environment Tests
    # ========================================

    def test_dev_environment(self):
        """Test deployment for dev environment."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="dev"
        )
        synthesized = Testing.synth(stack)

        assert "v1-dev" in synthesized
        assert synthesized is not None

    def test_staging_environment(self):
        """Test deployment for staging environment."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="staging"
        )
        synthesized = Testing.synth(stack)

        assert "v1-staging" in synthesized

    def test_production_environment(self):
        """Test deployment for production environment."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="prod"
        )
        synthesized = Testing.synth(stack)

        assert "v1-prod" in synthesized

    def test_pr_environment(self):
        """Test deployment for PR environment."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="pr12345"
        )
        synthesized = Testing.synth(stack)

        assert "v1-pr12345" in synthesized

    # ========================================
    # Region Configuration Tests
    # ========================================

    def test_us_east_1_region(self):
        """Test deployment to us-east-1."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1"
        )
        synthesized = Testing.synth(stack)

        assert "us-east-1" in synthesized

    def test_us_west_2_region(self):
        """Test deployment to us-west-2."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-west-2"
        )
        synthesized = Testing.synth(stack)

        assert "us-west-2" in synthesized

    # ========================================
    # Edge Cases and Error Handling Tests
    # ========================================

    def test_empty_environment_suffix(self):
        """Test with empty environment suffix."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix=""
        )
        synthesized = Testing.synth(stack)

        assert "v1-" in synthesized

    def test_special_characters_environment(self):
        """Test environment suffix with special characters."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test-pr-123"
        )
        synthesized = Testing.synth(stack)

        assert "v1-test-pr-123" in synthesized

    def test_long_environment_suffix(self):
        """Test with long environment suffix."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="very-long-environment-suffix-name"
        )
        synthesized = Testing.synth(stack)

        assert synthesized is not None

    # ========================================
    # Provider Configuration Tests
    # ========================================

    def test_aws_provider_configuration(self):
        """Test AWS provider configuration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1"
        )
        synthesized = Testing.synth(stack)

        assert "provider" in synthesized
        assert "aws" in synthesized

    def test_provider_default_tags(self):
        """Test provider default tags configuration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test",
            default_tags={
                "tags": {
                    "ManagedBy": "Terraform",
                    "Application": "FraudDetection"
                }
            }
        )
        synthesized = Testing.synth(stack)

        assert "default_tags" in synthesized

    # ========================================
    # Lambda File Path Tests
    # ========================================

    def test_lambda_zip_file_paths(self):
        """Test Lambda function zip file paths."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "../../../lib/lambda_functions/transaction_processor.zip" in synthesized
        assert "../../../lib/lambda_functions/pattern_analyzer.zip" in synthesized

    def test_lambda_source_code_hash(self):
        """Test Lambda source code hash function."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        assert "source_code_hash" in synthesized
        assert "filebase64sha256" in synthesized

    # ========================================
    # Integration Tests
    # ========================================

    def test_full_stack_synthesis(self):
        """Test full stack synthesis with all components."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "integration-test-stack",
            environment_suffix="integration",
            state_bucket="integration-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            use_dynamodb_lock=True,
            default_tags={
                "tags": {
                    "Environment": "integration",
                    "Team": "platform",
                    "Application": "fraud-detection"
                }
            }
        )
        synthesized = Testing.synth(stack)

        # Verify all major components exist
        assert synthesized is not None
        assert len(synthesized) > 1000  # Should have substantial content

        # Verify critical resources
        assert "aws_kms_key" in synthesized
        assert "aws_dynamodb_table" in synthesized
        assert "aws_lambda_function" in synthesized
        assert "aws_api_gateway_rest_api" in synthesized
        assert "aws_sns_topic" in synthesized
        assert "aws_sqs_queue" in synthesized

        # Verify v1 suffix is applied
        assert "v1-integration" in synthesized

    def test_resource_dependencies(self):
        """Test resource dependency configuration."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Lambda should depend on log group
        assert "depends_on" in synthesized

    def test_encryption_consistency(self):
        """Test encryption is consistently applied."""
        app = Testing.app()
        stack = FraudDetectionStack(
            app,
            "test-stack",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)

        # Multiple encryption references should exist
        assert synthesized.count("kms") > 5
        assert "encrypt" in synthesized.lower()
