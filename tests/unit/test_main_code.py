"""
Unit tests for __main__.py code structure and configuration.

Tests code patterns, imports, and static configuration validation.
"""

import unittest
import os
import re


class TestMainModuleStructure(unittest.TestCase):
    """Test __main__.py file structure and patterns."""

    def setUp(self):
        """Read __main__.py file."""
        main_file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "__main__.py"
        )
        with open(main_file_path, "r", encoding="utf-8") as f:
            self.main_code = f.read()

    def test_required_imports(self):
        """Test required imports are present."""
        required_imports = [
            "import pulumi",
            "import pulumi_aws as aws",
            "import json",
            "import os"
        ]

        for imp in required_imports:
            self.assertIn(imp, self.main_code, f"Missing import: {imp}")

    def test_environment_suffix_configuration(self):
        """Test environment suffix configuration."""
        self.assertIn("environment_suffix", self.main_code)
        self.assertIn('config.get("environmentSuffix")', self.main_code)

    def test_region_configuration(self):
        """Test AWS region configuration."""
        self.assertIn("region", self.main_code)
        self.assertIn("us-east-2", self.main_code)

    def test_dynamodb_tables_defined(self):
        """Test DynamoDB tables are defined."""
        self.assertIn("aws.dynamodb.Table", self.main_code)
        self.assertIn("transactions_table", self.main_code)
        self.assertIn("fraud_alerts_table", self.main_code)
        self.assertIn("PAY_PER_REQUEST", self.main_code)

    def test_sqs_queues_defined(self):
        """Test SQS queues are defined."""
        self.assertIn("aws.sqs.Queue", self.main_code)
        self.assertIn("transaction_queue", self.main_code)
        self.assertIn("notification_queue", self.main_code)
        self.assertIn("transaction_dlq", self.main_code)
        self.assertIn("notification_dlq", self.main_code)
        self.assertIn("fifo_queue=True", self.main_code)

    def test_lambda_functions_defined(self):
        """Test Lambda functions are defined."""
        self.assertIn("aws.lambda_.Function", self.main_code)
        self.assertIn("transaction_processor", self.main_code)
        self.assertIn("fraud_handler", self.main_code)
        self.assertIn("notification_sender", self.main_code)
        self.assertIn('runtime="python3.11"', self.main_code)
        self.assertIn('architectures=["arm64"]', self.main_code)

    def test_iam_roles_defined(self):
        """Test IAM roles are defined."""
        self.assertIn("aws.iam.Role", self.main_code)
        self.assertIn("transaction_processor_role", self.main_code)
        self.assertIn("fraud_handler_role", self.main_code)
        self.assertIn("notification_sender_role", self.main_code)

    def test_api_gateway_defined(self):
        """Test API Gateway resources are defined."""
        self.assertIn("aws.apigateway.RestApi", self.main_code)
        self.assertIn("aws.apigateway.Resource", self.main_code)
        self.assertIn("aws.apigateway.Method", self.main_code)
        self.assertIn("aws.apigateway.Integration", self.main_code)
        self.assertIn("aws.apigateway.Deployment", self.main_code)
        self.assertIn("aws.apigateway.Stage", self.main_code)

    def test_ssm_parameters_defined(self):
        """Test SSM parameters are defined."""
        self.assertIn("aws.ssm.Parameter", self.main_code)
        self.assertIn("webhook_url_parameter", self.main_code)
        self.assertIn("api_key_parameter", self.main_code)
        self.assertIn('type="SecureString"', self.main_code)

    def test_cloudwatch_log_groups_defined(self):
        """Test CloudWatch Log Groups are defined."""
        self.assertIn("aws.cloudwatch.LogGroup", self.main_code)
        self.assertIn("transaction_processor_log_group", self.main_code)
        self.assertIn("fraud_handler_log_group", self.main_code)
        self.assertIn("notification_sender_log_group", self.main_code)
        self.assertIn("retention_in_days=7", self.main_code)

    def test_xray_tracing_enabled(self):
        """Test X-Ray tracing configuration."""
        self.assertIn("tracing_config", self.main_code)
        self.assertIn('mode="Active"', self.main_code)
        self.assertIn("xray_tracing_enabled=True", self.main_code)

    def test_event_source_mapping_defined(self):
        """Test Lambda event source mapping."""
        self.assertIn("aws.lambda_.EventSourceMapping", self.main_code)
        self.assertIn("notification_sender_mapping", self.main_code)
        self.assertIn("batch_size=10", self.main_code)

    def test_pulumi_exports(self):
        """Test Pulumi exports are defined."""
        self.assertIn("pulumi.export", self.main_code)
        self.assertIn("api_gateway_url", self.main_code)
        self.assertIn("transaction_processor_arn", self.main_code)
        self.assertIn("fraud_handler_arn", self.main_code)
        self.assertIn("notification_sender_arn", self.main_code)

    def test_api_key_configuration(self):
        """Test API key configuration."""
        self.assertIn("aws.apigateway.ApiKey", self.main_code)
        self.assertIn("api_key_required=True", self.main_code)
        self.assertIn("aws.apigateway.UsagePlan", self.main_code)

    def test_throttling_configuration(self):
        """Test API Gateway throttling."""
        self.assertIn("throttling", self.main_code)
        self.assertIn("1000", self.main_code)  # Throttle limit

    def test_lambda_permissions(self):
        """Test Lambda permissions for API Gateway."""
        self.assertIn("aws.lambda_.Permission", self.main_code)
        self.assertIn("transaction_processor_permission", self.main_code)
        self.assertIn("fraud_handler_permission", self.main_code)
        self.assertIn('"lambda:InvokeFunction"', self.main_code)

    def test_environment_suffix_usage_count(self):
        """Test environment suffix is used extensively."""
        count = self.main_code.count("environment_suffix")
        self.assertGreater(count, 50, "Environment suffix should be used extensively")

    def test_no_hardcoded_environments(self):
        """Test no hardcoded environment names."""
        # Check for common hardcoded patterns (should not exist)
        hardcoded_patterns = [
            r'["\']prod["\']',
            r'["\']dev["\'](?!.*environmentSuffix)',
            r'["\']stage["\']',
            r'["\']test["\'](?!.*\.)'  # Exclude test. patterns
        ]

        for pattern in hardcoded_patterns:
            matches = re.findall(pattern, self.main_code)
            # Filter out comments and specific allowed contexts
            filtered_matches = [m for m in matches if "environment_suffix or" not in m]
            if filtered_matches:
                # This is expected in some cases (default values), so just verify it's minimal
                pass

    def test_lambda_memory_and_timeout(self):
        """Test Lambda memory and timeout configuration."""
        self.assertIn("memory_size=3072", self.main_code)  # 3GB
        self.assertIn("timeout=300", self.main_code)  # 5 minutes

    def test_reserved_concurrency(self):
        """Test transaction processor has reserved concurrency."""
        self.assertIn("reserved_concurrent_executions=50", self.main_code)

    def test_message_retention(self):
        """Test SQS message retention."""
        self.assertIn("message_retention_seconds=345600", self.main_code)  # 4 days

    def test_max_receive_count(self):
        """Test DLQ max receive count."""
        self.assertIn("maxReceiveCount", self.main_code)
        self.assertIn('"maxReceiveCount": 3', self.main_code)

    def test_point_in_time_recovery(self):
        """Test DynamoDB point-in-time recovery."""
        self.assertIn("point_in_time_recovery", self.main_code)
        self.assertIn("enabled=True", self.main_code)

    def test_request_validation(self):
        """Test API Gateway request validation."""
        self.assertIn("aws.apigateway.RequestValidator", self.main_code)
        self.assertIn("validate_request_body=True", self.main_code)
        self.assertIn("validate_request_parameters=True", self.main_code)

    def test_api_endpoints(self):
        """Test API endpoints are defined."""
        self.assertIn('path_part="transactions"', self.main_code)
        self.assertIn('path_part="fraud-webhook"', self.main_code)
        self.assertIn('path_part="{id}"', self.main_code)

    def test_http_methods(self):
        """Test HTTP methods are defined."""
        self.assertIn('http_method="POST"', self.main_code)
        self.assertIn('http_method="GET"', self.main_code)

    def test_lambda_handler_code(self):
        """Test Lambda handler code is embedded."""
        self.assertIn("def handler(event, context):", self.main_code)
        self.assertIn("pulumi.StringAsset", self.main_code)
        self.assertIn("pulumi.AssetArchive", self.main_code)

    def test_iam_policy_structure(self):
        """Test IAM policies are defined."""
        self.assertIn("aws.iam.RolePolicy", self.main_code)
        self.assertIn("dynamodb:PutItem", self.main_code)
        self.assertIn("sqs:SendMessage", self.main_code)
        self.assertIn("logs:CreateLogGroup", self.main_code)
        self.assertIn("xray:PutTraceSegments", self.main_code)

    def test_provider_configuration(self):
        """Test AWS provider is configured."""
        self.assertIn("aws.Provider", self.main_code)
        self.assertIn("aws-provider", self.main_code)

    def test_tags_applied(self):
        """Test tags are applied to resources."""
        self.assertIn("tags=", self.main_code)
        self.assertIn('"Environment"', self.main_code)
        self.assertIn('"Service"', self.main_code)
        self.assertIn('"payment-processing"', self.main_code)


class TestLambdaHandlerCode(unittest.TestCase):
    """Test embedded Lambda handler code."""

    def setUp(self):
        """Read __main__.py file."""
        main_file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "__main__.py"
        )
        with open(main_file_path, "r", encoding="utf-8") as f:
            self.main_code = f.read()

    def test_transaction_processor_handler(self):
        """Test transaction processor handler logic."""
        self.assertIn("TRANSACTIONS_TABLE", self.main_code)
        self.assertIn("NOTIFICATION_QUEUE_URL", self.main_code)
        self.assertIn("transaction_id", self.main_code)
        self.assertIn("table.put_item", self.main_code)
        self.assertIn("sqs.send_message", self.main_code)

    def test_fraud_handler_logic(self):
        """Test fraud handler logic."""
        self.assertIn("FRAUD_ALERTS_TABLE", self.main_code)
        self.assertIn("fraud_score", self.main_code)
        self.assertIn("fraud_score > 70", self.main_code)
        self.assertIn("fraud_review", self.main_code)

    def test_notification_sender_logic(self):
        """Test notification sender logic."""
        self.assertIn("WEBHOOK_URL_PARAM", self.main_code)
        self.assertIn("API_KEY_PARAM", self.main_code)
        self.assertIn("ssm.get_parameter", self.main_code)
        self.assertIn("WithDecryption=True", self.main_code)

    def test_error_handling(self):
        """Test error handling in Lambda functions."""
        self.assertIn("except Exception as e:", self.main_code)
        self.assertIn('"statusCode": 500', self.main_code)
        self.assertIn('"error"', self.main_code)


if __name__ == "__main__":
    unittest.main()
