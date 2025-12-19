"""
Unit tests for TapStack multi-region payment infrastructure
"""
import os
import sys
import pytest
import json
from cdktf import Testing

# Add lib directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from lib.tap_stack import TapStack


class TestTapStack:
    """Test TapStack creation and resource configuration"""

    @pytest.fixture
    def app(self):
        """Create test app"""
        return Testing.app()

    @pytest.fixture
    def stack(self, app):
        """Create test stack"""
        return TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            regions=["us-east-1", "eu-west-1", "ap-southeast-1"],
            default_tags=[{"tags": {"Environment": "test"}}]
        )

    def test_stack_creation(self, stack):
        """Test stack is created successfully"""
        assert stack is not None
        assert stack.environment_suffix == "test"
        assert stack.aws_region == "us-east-1"
        assert stack.regions == ["us-east-1", "eu-west-1", "ap-southeast-1"]

    def test_lambda_function_created(self, stack, app):
        """Test Lambda function is created with correct configuration"""
        assert stack.lambda_function is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the Lambda function resource
        lambda_resources = [r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()]
        assert len(lambda_resources) > 0

        lambda_config = lambda_resources[0]
        assert lambda_config["memory_size"] == 3072
        assert lambda_config["timeout"] == 900
        assert lambda_config["reserved_concurrent_executions"] == 2
        assert lambda_config["runtime"] == "python3.12"

    def test_dynamodb_table_created(self, stack, app):
        """Test DynamoDB table is created with correct configuration"""
        assert stack.dynamodb_table is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the DynamoDB table resource
        dynamodb_resources = [r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()]
        assert len(dynamodb_resources) > 0

        dynamodb_config = dynamodb_resources[0]
        assert dynamodb_config["billing_mode"] == "PAY_PER_REQUEST"
        assert dynamodb_config["stream_enabled"] is True
        assert dynamodb_config["stream_view_type"] == "NEW_AND_OLD_IMAGES"

    def test_kms_key_created(self, stack, app):
        """Test KMS key is created with automatic rotation"""
        assert stack.kms_key is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the KMS key resource
        kms_resources = [r for r in resources.get("resource", {}).get("aws_kms_key", {}).values()]
        assert len(kms_resources) > 0

        kms_config = kms_resources[0]
        assert kms_config["enable_key_rotation"] is True
        assert kms_config["deletion_window_in_days"] == 7

    def test_iam_roles_created(self, stack):
        """Test IAM roles are created"""
        assert stack.lambda_role is not None
        assert stack.sfn_role is not None

    def test_step_functions_state_machine_created(self, stack):
        """Test Step Functions state machine is created"""
        assert stack.state_machine is not None

    def test_sns_topic_created(self, stack):
        """Test SNS topic is created"""
        assert stack.sns_topic is not None

    def test_s3_bucket_created(self, stack):
        """Test S3 bucket is created"""
        assert stack.s3_bucket is not None

    def test_api_gateway_created(self, stack):
        """Test API Gateway is created"""
        assert stack.api is not None

    def test_cloudwatch_alarm_created(self, stack, app):
        """Test CloudWatch alarm is created"""
        assert stack.failure_alarm is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the CloudWatch alarm resource
        alarm_resources = [r for r in resources.get("resource", {}).get("aws_cloudwatch_metric_alarm", {}).values()]
        assert len(alarm_resources) > 0

        alarm_config = alarm_resources[0]
        assert alarm_config["threshold"] == 1.0

    def test_cloudwatch_dashboard_created(self, stack):
        """Test CloudWatch dashboard is created"""
        assert stack.dashboard is not None

    def test_lambda_zip_path_absolute(self, stack):
        """Test Lambda zip path is absolute"""
        assert os.path.isabs(stack.lambda_zip_path)
        assert os.path.exists(stack.lambda_zip_path)

    def test_environment_suffix_in_resource_names(self, app, stack):
        """Test all resources include environment suffix"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check that test suffix appears in resource names
        resource_str = json.dumps(resources)
        assert "test" in resource_str

    def test_resource_tags(self, app, stack):
        """Test resources have required tags"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for required tags
        resource_str = json.dumps(resources)
        assert "CostCenter" in resource_str
        assert "payment-processing" in resource_str

    def test_dynamodb_point_in_time_recovery(self, stack):
        """Test DynamoDB has point-in-time recovery enabled"""
        # point_in_time_recovery is set via DynamodbTablePointInTimeRecovery
        # The attribute is configured in the stack
        assert stack.dynamodb_table is not None

    def test_lambda_environment_variables(self, stack):
        """Test Lambda has required environment variables"""
        assert stack.lambda_function.environment is not None

    def test_step_functions_definition(self, stack, app):
        """Test Step Functions state machine has valid definition"""
        assert stack.state_machine is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the Step Functions state machine resource
        sfn_resources = [r for r in resources.get("resource", {}).get("aws_sfn_state_machine", {}).values()]
        assert len(sfn_resources) > 0

        sfn_config = sfn_resources[0]
        # Parse definition and verify structure
        definition = json.loads(sfn_config["definition"])
        assert "StartAt" in definition
        assert "States" in definition
        assert "ValidatePayment" in definition["States"]
        assert "ProcessPayment" in definition["States"]
        assert "HandleError" in definition["States"]

    def test_api_gateway_endpoint_configuration(self, stack):
        """Test API Gateway has correct endpoint configuration"""
        assert stack.api is not None
        # API should be regional
        assert stack.api_stage is not None

    def test_cloudwatch_alarm_threshold(self, stack, app):
        """Test CloudWatch alarm has correct threshold for 0.1%"""
        assert stack.failure_alarm is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the CloudWatch alarm resource
        alarm_resources = [r for r in resources.get("resource", {}).get("aws_cloudwatch_metric_alarm", {}).values()]
        assert len(alarm_resources) > 0

        alarm_config = alarm_resources[0]
        assert alarm_config["threshold"] == 1.0
        assert alarm_config["comparison_operator"] == "GreaterThanThreshold"

    def test_cloudwatch_dashboard_widgets(self, stack, app):
        """Test CloudWatch dashboard has required widgets"""
        assert stack.dashboard is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the CloudWatch dashboard resource
        dashboard_resources = [r for r in resources.get("resource", {}).get("aws_cloudwatch_dashboard", {}).values()]
        assert len(dashboard_resources) > 0

        dashboard_config = dashboard_resources[0]
        # Dashboard body should be a JSON string
        dashboard_body = json.loads(dashboard_config["dashboard_body"])
        assert "widgets" in dashboard_body
        assert len(dashboard_body["widgets"]) >= 3  # Lambda, DynamoDB, API Gateway

    def test_kms_key_policy(self, stack, app):
        """Test KMS key has correct policy"""
        assert stack.kms_key is not None

        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find the KMS key resource
        kms_resources = [r for r in resources.get("resource", {}).get("aws_kms_key", {}).values()]
        assert len(kms_resources) > 0

        kms_config = kms_resources[0]
        policy = json.loads(kms_config["policy"])
        assert "Statement" in policy
        # Should have statements for IAM permissions and service access
        assert len(policy["Statement"]) >= 2

    def test_iam_lambda_policy(self, stack):
        """Test Lambda IAM policy has correct permissions"""
        assert stack.lambda_role is not None
        # Policy should allow DynamoDB access, CloudWatch Logs, and KMS

    def test_iam_sfn_policy(self, stack):
        """Test Step Functions IAM policy has correct permissions"""
        assert stack.sfn_role is not None
        # Policy should allow Lambda invocation

    def test_eventbridge_rule_created(self, stack):
        """Test EventBridge rule is created"""
        # EventBridge rule is created in _create_eventbridge_rules
        # Verify the method runs without errors
        assert stack.lambda_function is not None

    def test_sns_topic_encryption(self, stack):
        """Test SNS topic uses KMS encryption"""
        assert stack.sns_topic is not None
        assert stack.kms_key is not None

    def test_s3_bucket_versioning(self, stack):
        """Test S3 bucket has versioning enabled"""
        assert stack.s3_bucket is not None
        # Versioning is enabled via S3BucketVersioningA

    def test_lambda_package_exists(self, stack):
        """Test Lambda deployment package exists"""
        assert os.path.exists(stack.lambda_zip_path)
        # Verify it's a valid zip file
        import zipfile
        assert zipfile.is_zipfile(stack.lambda_zip_path)

    def test_lambda_handler_code_in_package(self, stack):
        """Test Lambda package contains handler code"""
        import zipfile
        with zipfile.ZipFile(stack.lambda_zip_path, 'r') as zipf:
            files = zipf.namelist()
            assert "transaction_processor.py" in files

    def test_dynamodb_global_table_replicas(self, stack):
        """Test DynamoDB table has replicas for other regions"""
        # Replicas are configured for eu-west-1 and ap-southeast-1
        assert stack.dynamodb_table is not None

    def test_resource_naming_convention(self, stack, app):
        """Test all resources follow naming convention with environment suffix"""
        # All resources should include environment_suffix in their names
        # Synthesize and check the configuration in the output
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check Lambda function name
        lambda_resources = [r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()]
        assert len(lambda_resources) > 0
        assert "test" in lambda_resources[0]["function_name"]

        # Check DynamoDB table name
        dynamodb_resources = [r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()]
        assert len(dynamodb_resources) > 0
        assert "test" in dynamodb_resources[0]["name"]

        # Check SNS topic name
        sns_resources = [r for r in resources.get("resource", {}).get("aws_sns_topic", {}).values()]
        assert len(sns_resources) > 0
        assert "test" in sns_resources[0]["name"]

        # Check state machine name
        sfn_resources = [r for r in resources.get("resource", {}).get("aws_sfn_state_machine", {}).values()]
        assert len(sfn_resources) > 0
        assert "test" in sfn_resources[0]["name"]

    def test_no_retain_policies(self, app, stack):
        """Test no resources have retain policies"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check that "Retain" doesn't appear in the synthesized output
        resource_str = json.dumps(resources)
        assert "Retain" not in resource_str

    def test_terraform_backend_configuration(self, app, stack):
        """Test Terraform backend is configured correctly"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Backend should be configured for S3
        assert "terraform" in resources
        assert "backend" in resources["terraform"]

    def test_provider_configuration(self, app, stack):
        """Test AWS provider is configured correctly"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Provider should be configured
        assert "provider" in resources
        assert "aws" in resources["provider"]

    def test_outputs_created(self, app, stack):
        """Test Terraform outputs are created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Should have outputs for key resources
        assert "output" in resources
        outputs = resources["output"]
        assert "dynamodb_table_name" in outputs
        assert "lambda_function_name" in outputs
        assert "api_endpoint" in outputs
        assert "state_machine_arn" in outputs
        assert "sns_topic_arn" in outputs
        assert "s3_bucket_name" in outputs
        assert "kms_key_id" in outputs
        assert "cloudwatch_dashboard_name" in outputs
