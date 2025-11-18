"""Comprehensive unit tests for Fraud Detection Stack."""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TapStack with comprehensive coverage."""

    # ========================================
    # Basic Stack Tests
    # ========================================

    def test_stack_synthesis_with_minimal_parameters(self):
        """Test that the stack synthesizes without errors with minimal parameters."""
        app = Testing.app()
        stack = TapStack(
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
        stack = TapStack(
            app,
            "test-stack-full",
            environment_suffix="prod",
            state_bucket="my-state-bucket-12345",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
            default_tags={
                "tags": {
                    "Owner": "fraud-detection-team",
                    "CostCenter": "fintech-ops"
                }
            }
        )
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "fraud-detection-team" in synthesized
        assert "us-west-2" in synthesized

    def test_stack_with_default_parameters(self):
        """Test stack creation with default parameters."""
        app = Testing.app()
        stack = TapStack(app, "test-stack-default")
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "fraud-dev" in synthesized

    def test_resource_suffix_generation(self):
        """Test that resource_suffix is correctly generated."""
        app = Testing.app()
        test_env = "staging123"
        stack = TapStack(
            app,
            "test-stack-suffix",
            environment_suffix=test_env
        )
        expected_suffix = f"fraud-{test_env}"
        assert stack.resource_suffix == expected_suffix
        assert stack.environment_suffix == test_env

    def test_aws_region_configuration(self):
        """Test AWS region configuration."""
        app = Testing.app()
        test_region = "eu-west-1"
        stack = TapStack(
            app,
            "test-stack-region",
            environment_suffix="test",
            aws_region=test_region
        )
        synthesized = Testing.synth(stack)
        assert test_region in synthesized
        assert stack.aws_region == test_region

    # ========================================
    # S3 Backend Configuration Tests
    # ========================================

    def test_s3_backend_configuration(self):
        """Test S3 backend is configured correctly."""
        app = Testing.app()
        test_bucket = "fraud-detection-state-bucket-xyz"
        test_env = "production"
        stack = TapStack(
            app,
            "test-stack-backend",
            environment_suffix=test_env,
            state_bucket=test_bucket,
            state_bucket_region="eu-central-1"
        )
        synthesized = Testing.synth(stack)
        assert test_bucket in synthesized
        assert f"fraud-detection/{test_env}/terraform.tfstate" in synthesized
        assert "eu-central-1" in synthesized

    def test_s3_backend_encryption_enabled(self):
        """Test S3 backend encryption is enabled."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-encrypt",
            environment_suffix="secure",
            state_bucket="secure-state-bucket"
        )
        synthesized = Testing.synth(stack)
        assert '"encrypt": true' in synthesized

    # ========================================
    # Tags Configuration Tests
    # ========================================

    def test_common_tags_generation(self):
        """Test that common tags are correctly generated."""
        app = Testing.app()
        test_env = "qa"
        stack = TapStack(
            app,
            "test-stack-tags",
            environment_suffix=test_env
        )
        expected_tags = {
            "Environment": test_env,
            "Project": "FraudDetection",
            "Architecture": "Serverless",
            "ManagedBy": "CDKTF"
        }
        for key, value in expected_tags.items():
            assert key in str(stack.common_tags)
            assert stack.common_tags[key] == value

    def test_custom_tags_integration(self):
        """Test that custom tags are integrated with base tags."""
        app = Testing.app()
        custom_tags = {
            "tags": {
                "Team": "security-team",
                "Application": "fraud-detector"
            }
        }
        stack = TapStack(
            app,
            "test-stack-custom-tags",
            environment_suffix="test",
            default_tags=custom_tags
        )
        assert "Team" in str(stack.common_tags)
        assert "Application" in str(stack.common_tags)
        assert "Project" in str(stack.common_tags)

    # ========================================
    # KMS Encryption Tests
    # ========================================

    def test_kms_key_creation(self):
        """Test that KMS key is created with correct configuration."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-kms",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_key_id = f"fraud-detection-key-fraud-{test_env}"
        assert expected_key_id in synthesized
        assert "enable_key_rotation" in synthesized
        assert "deletion_window_in_days" in synthesized

    def test_kms_alias_creation(self):
        """Test that KMS alias is created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-kms-alias",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_alias_name = f"fraud-detection-key-alias-fraud-{test_env}"
        expected_alias_value = f"alias/fraud-detection-fraud-{test_env}"
        assert expected_alias_name in synthesized
        assert expected_alias_value in synthesized

    # ========================================
    # DynamoDB Tests
    # ========================================

    def test_dynamodb_table_creation(self):
        """Test that DynamoDB table is created with correct attributes."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-dynamodb",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_table_name = f"transactions-fraud-{test_env}"
        assert expected_table_name in synthesized
        assert "transaction_id" in synthesized
        assert "timestamp" in synthesized
        assert "point_in_time_recovery" in synthesized

    def test_dynamodb_billing_mode(self):
        """Test DynamoDB billing mode configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-dynamodb-billing",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "PAY_PER_REQUEST" in synthesized

    # ========================================
    # Lambda Functions Tests
    # ========================================

    def test_lambda_functions_creation(self):
        """Test that all Lambda functions are created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-lambda",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_functions = [
            f"transaction-validator-fraud-{test_env}",
            f"fraud-analyzer-fraud-{test_env}",
            f"notification-sender-fraud-{test_env}"
        ]
        for function_name in expected_functions:
            assert function_name in synthesized

    def test_lambda_runtime_configuration(self):
        """Test Lambda runtime and architecture configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-lambda-runtime",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "python3.11" in synthesized
        assert "arm64" in synthesized

    def test_lambda_reserved_concurrency(self):
        """Test Lambda reserved concurrency configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-lambda-concurrency",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "reserved_concurrent_executions" in synthesized
        assert "50" in synthesized

    def test_lambda_environment_variables(self):
        """Test Lambda environment variables configuration."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-lambda-env",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_env_vars = [
            "DYNAMODB_TABLE",
            "SNS_TOPIC_ARN",
            "MODEL_ENDPOINT_PARAM",
            "NOTIFICATION_TEMPLATE_PARAM"
        ]
        for env_var in expected_env_vars:
            assert env_var in synthesized

    # ========================================
    # API Gateway Tests
    # ========================================

    def test_api_gateway_creation(self):
        """Test that API Gateway is created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-api",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_api_name = f"fraud-detection-api-fraud-{test_env}"
        assert expected_api_name in synthesized
        assert "aws_api_gateway_rest_api" in synthesized

    def test_api_gateway_resource_and_method(self):
        """Test API Gateway resource and method configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-api-resource",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "transaction" in synthesized
        assert "POST" in synthesized

    def test_api_gateway_throttling(self):
        """Test API Gateway throttling configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-api-throttle",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "1000" in synthesized

    def test_api_gateway_x_ray_tracing(self):
        """Test API Gateway X-Ray tracing configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-api-xray",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "tracing_config" in synthesized
        assert "Active" in synthesized

    # ========================================
    # Step Functions Tests
    # ========================================

    def test_step_functions_creation(self):
        """Test that Step Functions state machine is created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-step-functions",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_sm_name = f"fraud-detection-fraud-{test_env}"
        assert expected_sm_name in synthesized
        assert "aws_sfn_state_machine" in synthesized

    # ========================================
    # SNS Tests
    # ========================================

    def test_sns_topic_creation(self):
        """Test that SNS topic is created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-sns",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_topic_name = f"fraud-alerts-fraud-{test_env}"
        assert expected_topic_name in synthesized
        assert "aws_sns_topic" in synthesized

    def test_sns_encryption(self):
        """Test SNS topic encryption configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-sns-encryption",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "kms_master_key_id" in synthesized

    # ========================================
    # EventBridge Tests
    # ========================================

    def test_eventbridge_rule_creation(self):
        """Test that EventBridge rule is created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-eventbridge",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_rule_name = f"high-value-transaction-rule-fraud-{test_env}"
        assert expected_rule_name in synthesized
        assert "aws_cloudwatch_event_rule" in synthesized

    def test_eventbridge_rule_pattern(self):
        """Test EventBridge rule event pattern."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-eventbridge-pattern",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "5000" in synthesized

    # ========================================
    # CloudWatch Logs Tests
    # ========================================

    def test_cloudwatch_log_groups_creation(self):
        """Test that CloudWatch log groups are created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-logs",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_log_groups = [
            f"/aws/lambda/transaction-validator-fraud-{test_env}",
            f"/aws/lambda/fraud-analyzer-fraud-{test_env}",
            f"/aws/lambda/notification-sender-fraud-{test_env}",
            f"/aws/stepfunctions/fraud-detection-fraud-{test_env}"
        ]
        for log_group in expected_log_groups:
            assert log_group in synthesized

    def test_cloudwatch_log_retention(self):
        """Test CloudWatch log retention configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-log-retention",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "retention_in_days" in synthesized
        assert "7" in synthesized

    # ========================================
    # Parameter Store Tests
    # ========================================

    def test_parameter_store_configuration(self):
        """Test Parameter Store parameters creation."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-params",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_params = [
            f"/fraud-detection/{test_env}/ml-model-endpoint",
            f"/fraud-detection/{test_env}/notification-template"
        ]
        for param in expected_params:
            assert param in synthesized

    def test_parameter_store_encryption(self):
        """Test Parameter Store SecureString encryption."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-params-encryption",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "SecureString" in synthesized

    # ========================================
    # IAM Roles and Policies Tests
    # ========================================

    def test_iam_roles_creation(self):
        """Test that IAM roles are created for all services."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-iam",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_roles = [
            f"lambda-execution-role-fraud-{test_env}",
            f"stepfunctions-role-fraud-{test_env}"
        ]
        for role in expected_roles:
            assert role in synthesized

    def test_iam_assume_role_policies(self):
        """Test IAM assume role policies."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-iam-assume",
            environment_suffix="test"
        )
        synthesized = Testing.synth(stack)
        assert "lambda.amazonaws.com" in synthesized
        assert "states.amazonaws.com" in synthesized
        assert "apigateway.amazonaws.com" in synthesized

    # ========================================
    # Outputs Tests
    # ========================================

    def test_terraform_outputs(self):
        """Test that Terraform outputs are created."""
        app = Testing.app()
        test_env = "test"
        stack = TapStack(
            app,
            "test-stack-outputs",
            environment_suffix=test_env
        )
        synthesized = Testing.synth(stack)

        expected_outputs = [
            "api_endpoint",
            "dynamodb_table_name",
            "sns_topic_arn",
            "step_functions_arn"
        ]
        for output in expected_outputs:
            assert output in synthesized

    # ========================================
    # Lambda ZIP Path Tests
    # ========================================

    def test_lambda_zip_paths_calculation(self):
        """Test that Lambda ZIP file paths are correctly calculated."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-zip-paths",
            environment_suffix="test"
        )
        
        assert hasattr(stack, "transaction_validator_zip")
        assert hasattr(stack, "fraud_analyzer_zip")
        assert hasattr(stack, "notification_sender_zip")
        
        assert "transaction_validator.zip" in stack.transaction_validator_zip
        assert "fraud_analyzer.zip" in stack.fraud_analyzer_zip
        assert "notification_sender.zip" in stack.notification_sender_zip

    # ========================================
    # Multi-Region Tests
    # ========================================

    def test_different_regions_configuration(self):
        """Test stack deployment in different AWS regions."""
        regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
        
        for region in regions:
            app = Testing.app()
            stack = TapStack(
                app,
                f"test-stack-{region.replace('-', '')}",
                environment_suffix="multi",
                aws_region=region
            )
            synthesized = Testing.synth(stack)
            assert region in synthesized
            assert "fraud-multi" in synthesized

    # ========================================
    # Environment Suffix Validation Tests
    # ========================================

    def test_environment_suffix_variations(self):
        """Test different environment suffix configurations."""
        environments = ["dev", "staging", "prod", "test123", "qa-env"]
        
        for env in environments:
            app = Testing.app()
            stack = TapStack(
                app,
                f"test-stack-{env}",
                environment_suffix=env
            )
            synthesized = Testing.synth(stack)
            expected_suffix = f"fraud-{env}"
            assert expected_suffix in synthesized
            assert stack.resource_suffix == expected_suffix

    # ========================================
    # Error Handling Tests
    # ========================================

    def test_stack_with_invalid_environment_suffix(self):
        """Test stack behavior with various environment suffix values."""
        app = Testing.app()
        # CDKTF should handle various string values gracefully
        stack = TapStack(
            app,
            "test-stack-edge-case",
            environment_suffix=""
        )
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "fraud-" in synthesized

    def test_stack_without_optional_parameters(self):
        """Test stack creation without optional parameters."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack-minimal"
            # Only providing required app and id, using all defaults
        )
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "fraud-dev" in synthesized
        assert "us-east-1" in synthesized
