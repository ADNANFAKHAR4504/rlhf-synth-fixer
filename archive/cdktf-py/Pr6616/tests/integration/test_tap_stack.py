"""Integration tests for TapStack."""
import json
from unittest.mock import patch, MagicMock
from cdktf import App, Testing
import pytest

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_terraform_configuration_synthesis(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test that stack instantiates properly."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify basic structure
        assert stack is not None
        
        # Synthesize the stack
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Verify outputs exist
        assert "output" in synth_dict
        assert len(synth_dict["output"]) >= 10

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_full_pipeline_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test complete pipeline integration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(
            app,
            "PipelineTestStack",
            environment_suffix="pipeline-test",
            aws_region="eu-west-1",
            state_bucket="test-state-bucket",
            state_bucket_region="eu-west-1",
            default_tags={
                "tags": {
                    "Project": "Integration-Test",
                    "Owner": "CI"
                }
            }
        )
        
        # Synthesize and parse
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Verify all major components are created
        resources = synth_dict["resource"]
        
        # S3
        assert "aws_s3_bucket" in resources
        assert "uploads_bucket" in resources["aws_s3_bucket"]
        
        # DynamoDB
        assert "aws_dynamodb_table" in resources
        assert "status_tracking_table" in resources["aws_dynamodb_table"]
        assert "transformed_data_table" in resources["aws_dynamodb_table"]
        
        # Lambda
        assert "aws_lambda_function" in resources
        assert "validation_lambda" in resources["aws_lambda_function"]
        assert "transformation_lambda" in resources["aws_lambda_function"]
        assert "notification_lambda" in resources["aws_lambda_function"]
        
        # Step Functions
        assert "aws_sfn_state_machine" in resources
        assert "processing_state_machine" in resources["aws_sfn_state_machine"]
        
        # API Gateway
        assert "aws_api_gateway_rest_api" in resources
        assert "transaction_api" in resources["aws_api_gateway_rest_api"]
        
        # SNS
        assert "aws_sns_topic" in resources
        assert "processing_notifications" in resources["aws_sns_topic"]
        
        # SQS
        assert "aws_sqs_queue" in resources
        assert "processing_dlq" in resources["aws_sqs_queue"]
        
        # CloudWatch
        assert "aws_cloudwatch_log_group" in resources
        assert "aws_cloudwatch_metric_alarm" in resources

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_lambda_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test Lambda functions are properly integrated."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "LambdaTestStack", environment_suffix="lambda-test")
        
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Check Lambda functions have correct dependencies
        validation_lambda = synth_dict["resource"]["aws_lambda_function"]["validation_lambda"]
        assert "depends_on" in validation_lambda
        assert "aws_cloudwatch_log_group.validation_lambda_logs" in validation_lambda["depends_on"]
        
        # Check environment variables reference other resources
        assert validation_lambda["environment"]["variables"]["BUCKET_NAME"] == "${aws_s3_bucket.uploads_bucket.bucket}"
        
        transformation_lambda = synth_dict["resource"]["aws_lambda_function"]["transformation_lambda"]
        assert transformation_lambda["environment"]["variables"]["STATUS_TABLE"] == "${aws_dynamodb_table.status_tracking_table.name}"
        assert transformation_lambda["environment"]["variables"]["DATA_TABLE"] == "${aws_dynamodb_table.transformed_data_table.name}"

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_step_functions_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test Step Functions state machine integration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "SFNTestStack", environment_suffix="sfn-test")
        
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Check Step Functions definition references Lambda functions
        sfn = synth_dict["resource"]["aws_sfn_state_machine"]["processing_state_machine"]
        definition = json.loads(sfn["definition"])
        
        # Verify state machine structure
        assert "States" in definition
        assert "TransformData" in definition["States"]
        assert "SendNotification" in definition["States"]
        assert "HandleError" in definition["States"]
        
        # Check Lambda ARN references
        assert "${aws_lambda_function.transformation_lambda.arn}" in sfn["definition"]
        assert "${aws_lambda_function.notification_lambda.arn}" in sfn["definition"]
        
        # Check DLQ reference
        assert "${aws_sqs_queue.processing_dlq.url}" in sfn["definition"]

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_api_gateway_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test API Gateway integration with Lambda."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "APITestStack", environment_suffix="api-test")
        
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Check API Gateway method integration
        integration = synth_dict["resource"]["aws_api_gateway_integration"]["upload_integration"]
        assert integration["type"] == "AWS_PROXY"
        assert integration["uri"] == "${aws_lambda_function.validation_lambda.invoke_arn}"
        
        # Check Lambda permission
        permission = synth_dict["resource"]["aws_lambda_permission"]["api_lambda_permission"]
        assert permission["principal"] == "apigateway.amazonaws.com"
        assert permission["function_name"] == "${aws_lambda_function.validation_lambda.function_name}"
        assert permission["source_arn"] == "${aws_api_gateway_rest_api.transaction_api.execution_arn}/*/*"

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_iam_role_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test IAM roles have correct permissions."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "IAMTestStack", environment_suffix="iam-test")
        
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Check transformation Lambda role has DynamoDB permissions
        transformation_role = synth_dict["resource"]["aws_iam_role"]["transformation_lambda_role"]
        policy = json.loads(transformation_role["inline_policy"][0]["policy"])
        
        dynamodb_statement = next((s for s in policy["Statement"] if "dynamodb:PutItem" in s.get("Action", [])), None)
        assert dynamodb_statement is not None
        assert "${aws_dynamodb_table.status_tracking_table.arn}" in dynamodb_statement["Resource"]
        assert "${aws_dynamodb_table.transformed_data_table.arn}" in dynamodb_statement["Resource"]
        
        # Check notification Lambda role has SNS permissions
        notification_role = synth_dict["resource"]["aws_iam_role"]["notification_lambda_role"]
        policy = json.loads(notification_role["inline_policy"][0]["policy"])
        
        sns_statement = next((s for s in policy["Statement"] if "sns:Publish" in s.get("Action", [])), None)
        assert sns_statement is not None
        assert sns_statement["Resource"] == "${aws_sns_topic.processing_notifications.arn}"

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_cloudwatch_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test CloudWatch integration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "CWTestStack", environment_suffix="cw-test")
        
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Check CloudWatch alarms reference Lambda functions
        validation_alarm = synth_dict["resource"]["aws_cloudwatch_metric_alarm"]["validation_lambda_alarm"]
        assert validation_alarm["dimensions"]["FunctionName"] == "${aws_lambda_function.validation_lambda.function_name}"
        
        # Check Step Functions logging configuration
        sfn = synth_dict["resource"]["aws_sfn_state_machine"]["processing_state_machine"]
        assert sfn["logging_configuration"]["log_destination"] == "${aws_cloudwatch_log_group.stepfunctions_logs.arn}:*"

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_eventbridge_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test EventBridge integration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "EBTestStack", environment_suffix="eb-test")
        
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        # Check EventBridge rule pattern references S3 bucket
        rule = synth_dict["resource"]["aws_cloudwatch_event_rule"]["s3_upload_rule"]
        pattern = json.loads(rule["event_pattern"])
        assert pattern["detail"]["bucket"]["name"][0] == "${aws_s3_bucket.uploads_bucket.bucket}"
        
        # Check EventBridge target references Step Functions
        target = synth_dict["resource"]["aws_cloudwatch_event_target"]["s3_event_target"]
        assert target["arn"] == "${aws_sfn_state_machine.processing_state_machine.arn}"
        assert target["role_arn"] == "${aws_iam_role.stepfunctions_role.arn}"

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_terraform_backend_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test Terraform backend configuration."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        
        # Test with backend
        stack_with_backend = TapStack(
            app,
            "BackendTestStack",
            environment_suffix="backend-test",
            state_bucket="test-state-bucket",
            state_bucket_region="us-west-2"
        )
        
        synth = Testing.synth(stack_with_backend)
        synth_dict = json.loads(synth)
        
        assert "terraform" in synth_dict
        assert "backend" in synth_dict["terraform"]
        assert synth_dict["terraform"]["backend"]["s3"]["bucket"] == "test-state-bucket"
        assert synth_dict["terraform"]["backend"]["s3"]["key"] == "backend-test/BackendTestStack.tfstate"
        assert synth_dict["terraform"]["backend"]["s3"]["region"] == "us-west-2"
        assert synth_dict["terraform"]["backend"]["s3"]["encrypt"] is True
        
        # Test without backend
        app2 = App()
        stack_without_backend = TapStack(
            app2,
            "NoBackendTestStack",
            environment_suffix="no-backend-test",
            state_bucket=""
        )
        
        synth2 = Testing.synth(stack_without_backend)
        synth_dict2 = json.loads(synth2)
        
        # Backend should not be present when bucket is empty
        if "backend" in synth_dict2.get("terraform", {}):
            assert synth_dict2["terraform"]["backend"] == {}

    @patch('shutil.make_archive')
    @patch('subprocess.run')
    @patch('tempfile.TemporaryDirectory')
    def test_output_integration(self, mock_tempdir, mock_subprocess, mock_make_archive):
        """Test all outputs are properly configured."""
        # Mock the packaging operations
        mock_tempdir.return_value.__enter__.return_value = "/tmp/test"
        mock_subprocess.return_value = MagicMock(returncode=0)
        mock_make_archive.return_value = None
        
        app = App()
        stack = TapStack(app, "OutputTestStack", environment_suffix="output-test")
        
        synth = Testing.synth(stack)
        synth_dict = json.loads(synth)
        
        outputs = synth_dict["output"]
        
        # Verify all required outputs exist
        required_outputs = [
            "api_endpoint_url",
            "api_key_id",
            "step_functions_arn",
            "validation_lambda_arn",
            "transformation_lambda_arn",
            "notification_lambda_arn",
            "uploads_bucket_name",
            "status_table_name",
            "data_table_name",
            "sns_topic_arn",
            "dlq_url"
        ]
        
        for output_name in required_outputs:
            assert output_name in outputs
            assert "value" in outputs[output_name]
            assert "description" in outputs[output_name]
        
        # Verify output values reference correct resources
        assert outputs["api_endpoint_url"]["value"].endswith("/upload")
        assert "${aws_api_gateway_rest_api.transaction_api.id}" in outputs["api_endpoint_url"]["value"]
        assert outputs["uploads_bucket_name"]["value"] == "${aws_s3_bucket.uploads_bucket.bucket}"
        assert outputs["step_functions_arn"]["value"] == "${aws_sfn_state_machine.processing_state_machine.arn}"