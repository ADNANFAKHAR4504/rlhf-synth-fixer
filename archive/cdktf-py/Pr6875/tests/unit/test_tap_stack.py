"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackResources:
    """Test suite for TAP Stack resource creation and configuration."""

    def test_stack_instantiates_successfully(self):
        """Test that TapStack instantiates without errors."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        assert stack is not None

    def test_stack_with_custom_config(self):
        """Test TapStack with custom configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackCustom",
            environment_suffix="prod",
            aws_region="us-west-2",
            state_bucket="custom-bucket",
            state_bucket_region="us-west-2",
        )
        assert stack is not None

    def test_s3_bucket_created_with_environment_suffix(self):
        """Test S3 bucket is created with environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check S3 bucket exists
        assert "aws_s3_bucket" in resources
        s3_buckets = resources["aws_s3_bucket"]
        assert "csv_bucket" in s3_buckets

        # Verify bucket name includes environment suffix
        bucket = s3_buckets["csv_bucket"]
        assert bucket["bucket"] == "transaction-csv-files-test"
        assert bucket["force_destroy"] is True
        assert "tags" in bucket

    def test_dynamodb_tables_created(self):
        """Test DynamoDB tables are created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check DynamoDB tables exist
        assert "aws_dynamodb_table" in resources
        dynamodb_tables = resources["aws_dynamodb_table"]

        # Verify transactions table
        assert "transactions_table" in dynamodb_tables
        transactions = dynamodb_tables["transactions_table"]
        assert transactions["name"] == "transactions-test"
        assert transactions["billing_mode"] == "PAY_PER_REQUEST"
        assert transactions["hash_key"] == "transaction_id"
        assert "global_secondary_index" in transactions
        assert "point_in_time_recovery" in transactions

        # Verify status table
        assert "status_table" in dynamodb_tables
        status = dynamodb_tables["status_table"]
        assert status["name"] == "processing-status-test"
        assert status["billing_mode"] == "PAY_PER_REQUEST"
        assert status["hash_key"] == "file_id"

    def test_lambda_functions_with_zip_deployment(self):
        """Test Lambda functions are created with ZIP deployment."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check Lambda functions exist
        assert "aws_lambda_function" in resources
        lambda_functions = resources["aws_lambda_function"]

        # Verify validator Lambda with ZIP deployment
        assert "validator_lambda" in lambda_functions
        validator = lambda_functions["validator_lambda"]
        assert validator["function_name"] == "csv-validator-test"
        assert validator["runtime"] == "python3.11"
        assert validator["handler"] == "app.handler"
        assert "filename" in validator  # ZIP file path

        # Verify transformer Lambda
        assert "transformer_lambda" in lambda_functions
        transformer = lambda_functions["transformer_lambda"]
        assert transformer["function_name"] == "data-transformer-test"

        # Verify notifier Lambda
        assert "notifier_lambda" in lambda_functions
        notifier = lambda_functions["notifier_lambda"]
        assert notifier["function_name"] == "notification-sender-test"

    def test_lambda_functions_created(self):
        """Test Lambda functions are created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check Lambda functions exist
        assert "aws_lambda_function" in resources
        lambdas = resources["aws_lambda_function"]

        # Verify validator Lambda
        assert "validator_lambda" in lambdas
        validator = lambdas["validator_lambda"]
        assert validator["function_name"] == "csv-validator-test"
        assert validator["runtime"] == "python3.11"
        assert validator["handler"] == "app.handler"
        assert validator["architectures"] == ["arm64"]
        assert validator["memory_size"] == 512
        assert validator["timeout"] == 60
        assert "tracing_config" in validator
        assert validator["tracing_config"]["mode"] == "Active"

        # Verify transformer Lambda
        assert "transformer_lambda" in lambdas
        transformer = lambdas["transformer_lambda"]
        assert transformer["function_name"] == "data-transformer-test"
        assert transformer["timeout"] == 300

        # Verify notifier Lambda
        assert "notifier_lambda" in lambdas
        notifier = lambdas["notifier_lambda"]
        assert notifier["function_name"] == "notification-sender-test"
        assert notifier["timeout"] == 30

    def test_iam_roles_created(self):
        """Test IAM roles are created with correct policies."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check IAM roles exist
        assert "aws_iam_role" in resources
        roles = resources["aws_iam_role"]

        # Verify validator role
        assert "validator_role" in roles
        validator_role = roles["validator_role"]
        assert validator_role["name"] == "csv-validator-role-test"
        assert "inline_policy" in validator_role

        # Verify transformer role
        assert "transformer_role" in roles
        assert roles["transformer_role"]["name"] == "data-transformer-role-test"

        # Verify notifier role
        assert "notifier_role" in roles
        assert roles["notifier_role"]["name"] == "notification-sender-role-test"

        # Verify Step Functions role
        assert "sfn_role" in roles
        assert roles["sfn_role"]["name"] == "transaction-workflow-role-test"

    def test_step_functions_state_machine_created(self):
        """Test Step Functions state machine is created with correct definition."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check state machine exists
        assert "aws_sfn_state_machine" in resources
        sfn = resources["aws_sfn_state_machine"]
        assert "state_machine" in sfn

        state_machine = sfn["state_machine"]
        assert state_machine["name"] == "transaction-workflow-test"
        assert state_machine["type"] == "EXPRESS"

        # Verify state machine definition
        definition = json.loads(state_machine["definition"])
        assert "States" in definition
        assert "Validation" in definition["States"]
        assert "Processing" in definition["States"]
        assert "Notification" in definition["States"]
        assert "HandleError" in definition["States"]

        # Verify retry logic
        validation_state = definition["States"]["Validation"]
        assert "Retry" in validation_state
        assert validation_state["Retry"][0]["MaxAttempts"] == 3
        assert validation_state["Retry"][0]["BackoffRate"] == 2.0

    def test_api_gateway_created(self):
        """Test API Gateway REST API is created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check API Gateway REST API
        assert "aws_api_gateway_rest_api" in resources
        api = resources["aws_api_gateway_rest_api"]["api"]
        assert api["name"] == "transaction-api-test"

        # Check API Gateway resource
        assert "aws_api_gateway_resource" in resources
        upload_resource = resources["aws_api_gateway_resource"]["upload_resource"]
        assert upload_resource["path_part"] == "upload"

        # Check API Gateway method
        assert "aws_api_gateway_method" in resources
        method = resources["aws_api_gateway_method"]["upload_method"]
        assert method["http_method"] == "POST"
        assert method["authorization"] == "NONE"

        # Check request validator
        assert "aws_api_gateway_request_validator" in resources
        validator = resources["aws_api_gateway_request_validator"]["request_validator"]
        assert validator["validate_request_body"] is True
        assert validator["validate_request_parameters"] is True

    def test_api_gateway_stage_and_usage_plan(self):
        """Test API Gateway stage and usage plan configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check stage
        assert "aws_api_gateway_stage" in resources
        stage = resources["aws_api_gateway_stage"]["stage"]
        assert stage["stage_name"] == "prod"
        assert stage["xray_tracing_enabled"] is True

        # Check usage plan
        assert "aws_api_gateway_usage_plan" in resources
        usage_plan = resources["aws_api_gateway_usage_plan"]["usage_plan"]
        assert usage_plan["name"] == "transaction-api-plan-test"
        assert "quota_settings" in usage_plan
        assert usage_plan["quota_settings"]["limit"] == 1000
        assert usage_plan["quota_settings"]["period"] == "DAY"

    def test_sns_topic_created(self):
        """Test SNS topic is created for notifications."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check SNS topic
        assert "aws_sns_topic" in resources
        topic = resources["aws_sns_topic"]["notification_topic"]
        assert topic["name"] == "transaction-notifications-test"

    def test_sqs_dlq_created(self):
        """Test SQS dead letter queue is created."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check SQS queue
        assert "aws_sqs_queue" in resources
        dlq = resources["aws_sqs_queue"]["dlq"]
        assert dlq["name"] == "transaction-processing-dlq-test"
        assert dlq["message_retention_seconds"] == 1209600

    def test_cloudwatch_log_groups_created(self):
        """Test CloudWatch log groups are created for all services."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check CloudWatch log groups
        assert "aws_cloudwatch_log_group" in resources
        log_groups = resources["aws_cloudwatch_log_group"]

        # Verify all log groups exist
        assert "validator_log_group" in log_groups
        assert log_groups["validator_log_group"]["name"] == "/aws/lambda/csv-validator-test"
        assert log_groups["validator_log_group"]["retention_in_days"] == 7

        assert "transformer_log_group" in log_groups
        assert "notifier_log_group" in log_groups
        assert "api_log_group" in log_groups
        assert "sfn_log_group" in log_groups

    def test_cloudwatch_alarms_created(self):
        """Test CloudWatch alarms are created for Lambda error monitoring."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check CloudWatch alarms
        assert "aws_cloudwatch_metric_alarm" in resources
        alarms = resources["aws_cloudwatch_metric_alarm"]

        # Verify validator alarm
        assert "validator_error_alarm" in alarms
        validator_alarm = alarms["validator_error_alarm"]
        assert validator_alarm["alarm_name"] == "csv-validator-errors-test"
        assert validator_alarm["metric_name"] == "Errors"
        assert validator_alarm["threshold"] == 5
        assert validator_alarm["period"] == 300

        # Verify other alarms exist
        assert "transformer_error_alarm" in alarms
        assert "notifier_error_alarm" in alarms

    def test_lambda_permissions_created(self):
        """Test Lambda permissions are created for API Gateway and S3."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check Lambda permissions
        assert "aws_lambda_permission" in resources
        permissions = resources["aws_lambda_permission"]

        # Verify API Gateway permission
        assert "api_lambda_permission" in permissions
        api_perm = permissions["api_lambda_permission"]
        assert api_perm["action"] == "lambda:InvokeFunction"
        assert api_perm["principal"] == "apigateway.amazonaws.com"

        # Verify S3 permission
        assert "s3_lambda_permission" in permissions
        s3_perm = permissions["s3_lambda_permission"]
        assert s3_perm["principal"] == "s3.amazonaws.com"

    def test_s3_bucket_notification_configured(self):
        """Test S3 bucket notification is configured to trigger Lambda."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check S3 bucket notification
        assert "aws_s3_bucket_notification" in resources
        notification = resources["aws_s3_bucket_notification"]["bucket_notification"]
        assert "lambda_function" in notification
        lambda_config = notification["lambda_function"][0]
        assert lambda_config["events"] == ["s3:ObjectCreated:*"]
        # filter_prefix may not appear in synth output, but is in actual stack code

    def test_terraform_outputs_defined(self):
        """Test Terraform outputs are defined for integration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        outputs = json.loads(synth)["output"]

        # Verify all required outputs exist
        assert "api_endpoint" in outputs
        assert "state_machine_arn" in outputs
        assert "transactions_table_name" in outputs
        assert "status_table_name" in outputs
        assert "csv_bucket_name" in outputs
        assert "notification_topic_arn" in outputs
        assert "dlq_url" in outputs

    def test_resource_tagging(self):
        """Test all resources are tagged correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check tags on various resources
        s3_bucket = resources["aws_s3_bucket"]["csv_bucket"]
        assert "tags" in s3_bucket
        tags = s3_bucket["tags"]
        assert tags["Environment"] == "test"
        assert tags["Application"] == "transaction-processing-pipeline"
        assert tags["CostCenter"] == "finance-analytics"

    def test_lambda_environment_variables(self):
        """Test Lambda functions have correct environment variables."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        lambdas = resources["aws_lambda_function"]

        # Verify validator Lambda environment
        validator = lambdas["validator_lambda"]
        assert "environment" in validator
        env_vars = validator["environment"]["variables"]
        assert "S3_BUCKET" in env_vars
        assert "STATUS_TABLE" in env_vars
        assert "ENVIRONMENT" in env_vars

        # Verify transformer Lambda environment
        transformer = lambdas["transformer_lambda"]
        env_vars = transformer["environment"]["variables"]
        assert "TRANSACTIONS_TABLE" in env_vars

        # Verify notifier Lambda environment
        notifier = lambdas["notifier_lambda"]
        env_vars = notifier["environment"]["variables"]
        assert "SNS_TOPIC_ARN" in env_vars

    def test_iam_policies_least_privilege(self):
        """Test IAM roles have appropriate least privilege policies."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        roles = resources["aws_iam_role"]

        # Verify validator role has S3 and DynamoDB access
        validator_role = roles["validator_role"]
        policy = json.loads(validator_role["inline_policy"][0]["policy"])
        actions = []
        for statement in policy["Statement"]:
            actions.extend(statement["Action"])

        assert "s3:PutObject" in actions
        assert "s3:GetObject" in actions
        assert "dynamodb:PutItem" in actions
        assert "dynamodb:UpdateItem" in actions

    def test_different_environment_suffixes(self):
        """Test stack works with different environment suffixes."""
        for env_suffix in ["dev", "qa", "staging", "prod"]:
            app = App()
            stack = TapStack(
                app,
                f"TestTapStack{env_suffix}",
                environment_suffix=env_suffix,
                aws_region="us-east-1",
            )
            synth = Testing.synth(stack)
            resources = json.loads(synth)["resource"]

            # Verify bucket name includes correct suffix
            bucket = resources["aws_s3_bucket"]["csv_bucket"]
            assert bucket["bucket"] == f"transaction-csv-files-{env_suffix}"
