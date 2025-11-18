"""Unit tests for TAP Stack."""
import os
import sys
import json
import pytest
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from cdktf import TerraformOutput

from lib.tap_stack import TapStack


def parse_synth(synth_result):
    """Parse the synthesis result from JSON string to dict."""
    if isinstance(synth_result, str):
        return json.loads(synth_result)
    return synth_result


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')

    def test_stack_creates_s3_backend_when_bucket_provided(self):
        """Test S3 backend is created when state bucket is provided."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
        )
        
        # Synthesize the stack to check backend configuration
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        # S3 backend should be configured
        assert "terraform" in synth_dict
        assert "backend" in synth_dict["terraform"]
    
    def test_stack_no_s3_backend_when_bucket_empty(self):
        """Test no S3 backend when state bucket is empty."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            state_bucket="",
            state_bucket_region="us-east-1",
        )
        
        # Synthesize the stack
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        # No backend should be configured
        if "terraform" in synth_dict and "backend" in synth_dict["terraform"]:
            assert synth_dict["terraform"]["backend"] == {}


class TestS3Configuration:
    """Test suite for S3 bucket configuration."""
    
    def test_s3_bucket_created_with_correct_name(self):
        """Test S3 bucket is created with environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test-env",
        )
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        bucket_resource = synth_dict["resource"]["aws_s3_bucket"]["uploads_bucket"]
        assert bucket_resource["bucket"] == "transaction-uploads-test-env"
        assert bucket_resource["force_destroy"] is True
    
    def test_s3_bucket_versioning_enabled(self):
        """Test S3 bucket versioning is enabled."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        versioning = synth_dict["resource"]["aws_s3_bucket_versioning"]["uploads_bucket_versioning"]
        assert versioning["versioning_configuration"]["status"] == "Enabled"
    
    def test_s3_bucket_encryption_configured(self):
        """Test S3 bucket encryption is configured."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        encryption = synth_dict["resource"]["aws_s3_bucket_server_side_encryption_configuration"]["uploads_bucket_encryption"]
        assert encryption["rule"][0]["apply_server_side_encryption_by_default"]["sse_algorithm"] == "AES256"


class TestDynamoDBConfiguration:
    """Test suite for DynamoDB table configuration."""
    
    def test_status_tracking_table_created(self):
        """Test status tracking DynamoDB table is created with correct configuration."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        table = synth_dict["resource"]["aws_dynamodb_table"]["status_tracking_table"]
        
        assert table["name"] == "transaction-status-test"
        assert table["billing_mode"] == "PAY_PER_REQUEST"
        assert table["hash_key"] == "transaction_id"
        assert table["range_key"] == "timestamp"
        assert table["point_in_time_recovery"]["enabled"] is True
        
        # Check global secondary index
        gsi = table["global_secondary_index"][0]
        assert gsi["name"] == "timestamp-status-index"
        assert gsi["hash_key"] == "status"
        assert gsi["range_key"] == "timestamp"
        assert gsi["projection_type"] == "ALL"
    
    def test_transformed_data_table_created(self):
        """Test transformed data DynamoDB table is created with correct configuration."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        table = synth_dict["resource"]["aws_dynamodb_table"]["transformed_data_table"]
        
        assert table["name"] == "transaction-data-test"
        assert table["billing_mode"] == "PAY_PER_REQUEST"
        assert table["hash_key"] == "transaction_id"
        assert table["range_key"] == "processed_timestamp"
        assert table["point_in_time_recovery"]["enabled"] is True
        
        # Check global secondary index
        gsi = table["global_secondary_index"][0]
        assert gsi["name"] == "bank-timestamp-index"
        assert gsi["hash_key"] == "bank_id"
        assert gsi["range_key"] == "processed_timestamp"


class TestLambdaConfiguration:
    """Test suite for Lambda function configuration."""
    
    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_validation_lambda_created(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test validation Lambda function is created with correct configuration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        lambda_fn = synth_dict["resource"]["aws_lambda_function"]["validation_lambda"]
        
        assert lambda_fn["function_name"] == "validation-lambda-test"
        assert lambda_fn["handler"] == "app.lambda_handler"
        assert lambda_fn["runtime"] == "python3.11"
        assert lambda_fn["architectures"] == ["arm64"]
        assert lambda_fn["memory_size"] == 512
        assert lambda_fn["timeout"] == 60
        assert lambda_fn["tracing_config"]["mode"] == "Active"
        
        # Check environment variables
        env_vars = lambda_fn["environment"]["variables"]
        assert env_vars["BUCKET_NAME"] == "${aws_s3_bucket.uploads_bucket.bucket}"
        assert env_vars["ENVIRONMENT"] == "test"
    
    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_transformation_lambda_created(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test transformation Lambda function is created with correct configuration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        lambda_fn = synth_dict["resource"]["aws_lambda_function"]["transformation_lambda"]
        
        assert lambda_fn["function_name"] == "transformation-lambda-test"
        assert lambda_fn["memory_size"] == 512
        assert lambda_fn["timeout"] == 300
        
        # Check environment variables
        env_vars = lambda_fn["environment"]["variables"]
        assert env_vars["STATUS_TABLE"] == "${aws_dynamodb_table.status_tracking_table.name}"
        assert env_vars["DATA_TABLE"] == "${aws_dynamodb_table.transformed_data_table.name}"
    
    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_notification_lambda_created(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test notification Lambda function is created with correct configuration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        lambda_fn = synth_dict["resource"]["aws_lambda_function"]["notification_lambda"]
        
        assert lambda_fn["function_name"] == "notification-lambda-test"
        assert lambda_fn["memory_size"] == 512
        assert lambda_fn["timeout"] == 60
        
        # Check environment variables
        env_vars = lambda_fn["environment"]["variables"]
        assert env_vars["SNS_TOPIC_ARN"] == "${aws_sns_topic.processing_notifications.arn}"


class TestIAMRoleConfiguration:
    """Test suite for IAM roles and policies."""
    
    def test_lambda_roles_created(self):
        """Test IAM roles are created for Lambda functions."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        # Check validation Lambda role
        validation_role = synth_dict["resource"]["aws_iam_role"]["validation_lambda_role"]
        assert validation_role["name"] == "validation-lambda-role-test"
        assert "assume_role_policy" in validation_role
        
        # Check transformation Lambda role
        transformation_role = synth_dict["resource"]["aws_iam_role"]["transformation_lambda_role"]
        assert transformation_role["name"] == "transformation-lambda-role-test"
        
        # Check notification Lambda role
        notification_role = synth_dict["resource"]["aws_iam_role"]["notification_lambda_role"]
        assert notification_role["name"] == "notification-lambda-role-test"
    
    def test_step_functions_role_created(self):
        """Test IAM role is created for Step Functions."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        sfn_role = synth_dict["resource"]["aws_iam_role"]["stepfunctions_role"]
        assert sfn_role["name"] == "stepfunctions-role-test"
        
        # Check inline policy exists
        assert len(sfn_role["inline_policy"]) > 0
        policy = json.loads(sfn_role["inline_policy"][0]["policy"])
        statements = policy["Statement"]
        
        # Check Lambda invoke permissions
        lambda_invoke_stmt = next((s for s in statements if "lambda:InvokeFunction" in s["Action"]), None)
        assert lambda_invoke_stmt is not None


class TestAPIGatewayConfiguration:
    """Test suite for API Gateway configuration."""
    
    def test_api_gateway_created(self):
        """Test API Gateway REST API is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        api = synth_dict["resource"]["aws_api_gateway_rest_api"]["transaction_api"]
        assert api["name"] == "transaction-api-test"
        assert api["description"] == "API for uploading transaction CSV files"
    
    def test_api_gateway_upload_resource(self):
        """Test API Gateway upload resource is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        resource = synth_dict["resource"]["aws_api_gateway_resource"]["upload_resource"]
        assert resource["path_part"] == "upload"
    
    def test_api_gateway_method_configured(self):
        """Test API Gateway POST method is configured."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        method = synth_dict["resource"]["aws_api_gateway_method"]["upload_method"]
        assert method["http_method"] == "POST"
        assert method["authorization"] == "NONE"
        assert method["request_parameters"]["method.request.header.Content-Type"] is True
    
    def test_api_gateway_usage_plan(self):
        """Test API Gateway usage plan is configured."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        usage_plan = synth_dict["resource"]["aws_api_gateway_usage_plan"]["api_usage_plan"]
        assert usage_plan["name"] == "transaction-api-plan-test"
        assert usage_plan["quota_settings"]["limit"] == 1000
        assert usage_plan["quota_settings"]["period"] == "DAY"
        assert usage_plan["throttle_settings"]["burst_limit"] == 100
        assert usage_plan["throttle_settings"]["rate_limit"] == 50


class TestStepFunctionsConfiguration:
    """Test suite for Step Functions configuration."""
    
    def test_step_functions_state_machine_created(self):
        """Test Step Functions state machine is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        sfn = synth_dict["resource"]["aws_sfn_state_machine"]["processing_state_machine"]
        assert sfn["name"] == "transaction-processing-test"
        assert sfn["type"] == "EXPRESS"
        
        # Check logging configuration
        assert sfn["logging_configuration"]["level"] == "ALL"
        assert sfn["logging_configuration"]["include_execution_data"] is True
        
        # Check tracing
        assert sfn["tracing_configuration"]["enabled"] is True
        
        # Check state machine definition
        definition = json.loads(sfn["definition"])
        assert definition["StartAt"] == "TransformData"
        assert "TransformData" in definition["States"]
        assert "SendNotification" in definition["States"]
        assert "HandleError" in definition["States"]
        
        # Check retry configuration
        transform_state = definition["States"]["TransformData"]
        assert transform_state["Retry"][0]["BackoffRate"] == 2.0
        assert transform_state["Retry"][0]["MaxAttempts"] == 3


class TestCloudWatchConfiguration:
    """Test suite for CloudWatch configuration."""
    
    def test_cloudwatch_log_groups_created(self):
        """Test CloudWatch log groups are created for all Lambda functions."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        # Check validation Lambda log group
        validation_logs = synth_dict["resource"]["aws_cloudwatch_log_group"]["validation_lambda_logs"]
        assert validation_logs["name"] == "/aws/lambda/validation-lambda-test"
        assert validation_logs["retention_in_days"] == 7
        
        # Check transformation Lambda log group
        transformation_logs = synth_dict["resource"]["aws_cloudwatch_log_group"]["transformation_lambda_logs"]
        assert transformation_logs["name"] == "/aws/lambda/transformation-lambda-test"
        assert transformation_logs["retention_in_days"] == 7
        
        # Check notification Lambda log group
        notification_logs = synth_dict["resource"]["aws_cloudwatch_log_group"]["notification_lambda_logs"]
        assert notification_logs["name"] == "/aws/lambda/notification-lambda-test"
        
        # Check Step Functions log group
        sfn_logs = synth_dict["resource"]["aws_cloudwatch_log_group"]["stepfunctions_logs"]
        assert sfn_logs["name"] == "/aws/stepfunctions/transaction-processing-test"
        
        # Check API Gateway log group
        api_logs = synth_dict["resource"]["aws_cloudwatch_log_group"]["api_gateway_logs"]
        assert api_logs["name"] == "/aws/apigateway/transaction-api-test"
    
    def test_cloudwatch_alarms_created(self):
        """Test CloudWatch alarms are created for Lambda functions."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        # Check validation Lambda alarm
        validation_alarm = synth_dict["resource"]["aws_cloudwatch_metric_alarm"]["validation_lambda_alarm"]
        assert validation_alarm["alarm_name"] == "validation-lambda-errors-test"
        assert validation_alarm["metric_name"] == "Errors"
        assert validation_alarm["namespace"] == "AWS/Lambda"
        assert validation_alarm["threshold"] == 0.05
        assert validation_alarm["comparison_operator"] == "GreaterThanThreshold"
        
        # Check transformation Lambda alarm
        transformation_alarm = synth_dict["resource"]["aws_cloudwatch_metric_alarm"]["transformation_lambda_alarm"]
        assert transformation_alarm["alarm_name"] == "transformation-lambda-errors-test"
        
        # Check notification Lambda alarm
        notification_alarm = synth_dict["resource"]["aws_cloudwatch_metric_alarm"]["notification_lambda_alarm"]
        assert notification_alarm["alarm_name"] == "notification-lambda-errors-test"


class TestSQSConfiguration:
    """Test suite for SQS configuration."""
    
    def test_sqs_dead_letter_queue_created(self):
        """Test SQS dead letter queue is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        dlq = synth_dict["resource"]["aws_sqs_queue"]["processing_dlq"]
        assert dlq["name"] == "transaction-processing-dlq-test"
        assert dlq["message_retention_seconds"] == 1209600  # 14 days


class TestSNSConfiguration:
    """Test suite for SNS configuration."""
    
    def test_sns_topic_created(self):
        """Test SNS topic is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        topic = synth_dict["resource"]["aws_sns_topic"]["processing_notifications"]
        assert topic["name"] == "transaction-processing-notifications-test"


class TestEventBridgeConfiguration:
    """Test suite for EventBridge configuration."""
    
    def test_eventbridge_rule_created(self):
        """Test EventBridge rule is created for S3 events."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        rule = synth_dict["resource"]["aws_cloudwatch_event_rule"]["s3_upload_rule"]
        assert rule["name"] == "s3-upload-trigger-test"
        
        # Check event pattern
        pattern = json.loads(rule["event_pattern"])
        assert pattern["source"] == ["aws.s3"]
        assert pattern["detail-type"] == ["Object Created"]
    
    def test_eventbridge_target_configured(self):
        """Test EventBridge target is configured for Step Functions."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        target = synth_dict["resource"]["aws_cloudwatch_event_target"]["s3_event_target"]
        assert target["rule"] == "${aws_cloudwatch_event_rule.s3_upload_rule.name}"
        assert target["arn"] == "${aws_sfn_state_machine.processing_state_machine.arn}"


class TestOutputs:
    """Test suite for Terraform outputs."""
    
    def test_all_outputs_defined(self):
        """Test all required outputs are defined."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        outputs = synth_dict.get("output", {})
        
        expected_outputs = [
            "api_endpoint_url",
            "api_key_id",
            "step_functions_arn",
            "status_table_name",
            "data_table_name",
            "uploads_bucket_name",
            "sns_topic_arn",
            "dlq_url",
            "validation_lambda_arn",
            "transformation_lambda_arn",
            "notification_lambda_arn"
        ]
        
        for output_name in expected_outputs:
            assert output_name in outputs, f"Output '{output_name}' is missing"
            assert "value" in outputs[output_name], f"Output '{output_name}' has no value"
            assert "description" in outputs[output_name], f"Output '{output_name}' has no description"


class TestTagging:
    """Test suite for resource tagging."""
    
    def test_default_tags_applied(self):
        """Test default tags are applied via provider configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            default_tags={
                "tags": {
                    "Environment": "test",
                    "Application": "transaction-processing",
                    "CostCenter": "finance"
                }
            }
        )
        
        synth = Testing.synth(stack)
        synth_dict = parse_synth(synth)
        
        # Check provider configuration
        provider = synth_dict["provider"]["aws"][0]
        assert provider["default_tags"][0]["tags"]["Environment"] == "test"
        assert provider["default_tags"][0]["tags"]["Application"] == "transaction-processing-pipeline"
        assert provider["default_tags"][0]["tags"]["CostCenter"] == "financial-analytics"
