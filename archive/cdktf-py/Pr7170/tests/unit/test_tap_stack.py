"""
Unit tests for CDKTF infrastructure stack
"""
import pytest
import json
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStackSynthesis:
    """Test that the stack synthesizes correctly"""

    def test_stack_synthesizes(self):
        """Test basic stack synthesis"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Stack should synthesize without errors
        assert synthesized is not None

    def test_stack_has_resources(self):
        """Test that stack creates expected resources"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Parse the synthesized stack
        manifest = json.loads(synthesized)

        # Should have resources in the stack
        assert "resource" in manifest

        resources = manifest["resource"]

        # Verify all required resource types exist
        assert "aws_lambda_function" in resources
        assert "aws_dynamodb_table" in resources
        assert "aws_sns_topic" in resources
        assert "aws_sqs_queue" in resources
        assert "aws_kms_key" in resources
        assert "aws_iam_role" in resources
        assert "aws_cloudwatch_metric_alarm" in resources
        assert "aws_lambda_event_source_mapping" in resources


class TestLambdaFunction:
    """Test Lambda function configuration"""

    def test_lambda_has_correct_configuration(self):
        """Test Lambda function has required configuration"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lambda_functions = manifest["resource"]["aws_lambda_function"]

        # Find the data processor Lambda
        data_processor = lambda_functions["data_processor"]

        # Verify configuration
        assert data_processor["function_name"] == "data-processor-test"
        assert data_processor["runtime"] == "python3.11"
        assert data_processor["handler"] == "index.handler"
        assert data_processor["memory_size"] == 3072
        assert data_processor["timeout"] == 60
        assert data_processor["architectures"] == ["arm64"]
        assert data_processor["reserved_concurrent_executions"] == 5

    def test_lambda_has_environment_variables(self):
        """Test Lambda has required environment variables"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lambda_functions = manifest["resource"]["aws_lambda_function"]
        data_processor = lambda_functions["data_processor"]

        # Verify environment variables exist
        assert "environment" in data_processor
        # Handle both dict and list structures for environment
        env_config = data_processor["environment"]
        if isinstance(env_config, list):
            env_vars = env_config[0]["variables"] if env_config else {}
        else:
            env_vars = env_config.get("variables", {})

        assert "DYNAMODB_TABLE" in env_vars
        assert "SNS_TOPIC_ARN" in env_vars
        assert "ENVIRONMENT" in env_vars
        assert env_vars["ENVIRONMENT"] == "test"

    def test_lambda_uses_kms_encryption(self):
        """Test Lambda uses KMS for environment variables"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lambda_functions = manifest["resource"]["aws_lambda_function"]
        data_processor = lambda_functions["data_processor"]

        # Should reference KMS key
        assert "kms_key_arn" in data_processor


class TestDynamoDBTable:
    """Test DynamoDB table configuration"""

    def test_dynamodb_has_correct_schema(self):
        """Test DynamoDB table has correct key schema"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        tables = manifest["resource"]["aws_dynamodb_table"]
        market_alerts = tables["market_alerts_table"]

        # Verify table name includes suffix
        assert market_alerts["name"] == "market-alerts-test"

        # Verify billing mode
        assert market_alerts["billing_mode"] == "PAY_PER_REQUEST"

        # Verify keys
        assert market_alerts["hash_key"] == "symbol"
        assert market_alerts["range_key"] == "timestamp"

        # Verify attributes
        attributes = market_alerts["attribute"]
        assert len(attributes) == 2

        attr_names = {attr["name"] for attr in attributes}
        assert "symbol" in attr_names
        assert "timestamp" in attr_names

    def test_dynamodb_has_pitr_enabled(self):
        """Test DynamoDB table has point-in-time recovery enabled"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        tables = manifest["resource"]["aws_dynamodb_table"]
        market_alerts = tables["market_alerts_table"]

        # Verify PITR is enabled
        assert "point_in_time_recovery" in market_alerts
        pitr_config = market_alerts["point_in_time_recovery"]
        # Handle both dict and list structures
        if isinstance(pitr_config, list):
            pitr = pitr_config[0] if pitr_config else {}
        else:
            pitr = pitr_config
        assert pitr.get("enabled") is True


class TestSQSQueue:
    """Test SQS queue configuration"""

    def test_sqs_has_correct_retention(self):
        """Test SQS queue has 14-day retention"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        queues = manifest["resource"]["aws_sqs_queue"]

        # Find the main queue
        market_data_queue = queues["market_data_queue"]

        # Verify configuration
        assert market_data_queue["name"] == "market-data-queue-test"
        assert market_data_queue["message_retention_seconds"] == 1209600  # 14 days
        assert market_data_queue["visibility_timeout_seconds"] == 360  # 6x Lambda timeout

    def test_sqs_has_dead_letter_queue(self):
        """Test SQS queue has DLQ configured"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        queues = manifest["resource"]["aws_sqs_queue"]
        market_data_queue = queues["market_data_queue"]

        # Verify redrive policy exists
        assert "redrive_policy" in market_data_queue

        # Parse redrive policy
        redrive_policy = json.loads(market_data_queue["redrive_policy"])
        assert "deadLetterTargetArn" in redrive_policy
        assert redrive_policy["maxReceiveCount"] == 3


class TestSNSTopic:
    """Test SNS topic configuration"""

    def test_sns_topic_created(self):
        """Test SNS topic is created with correct name"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        topics = manifest["resource"]["aws_sns_topic"]
        trading_alerts = topics["trading_alerts_topic"]

        # Verify name includes suffix
        assert trading_alerts["name"] == "trading-alerts-test"


class TestKMSKey:
    """Test KMS key configuration"""

    def test_kms_key_configuration(self):
        """Test KMS key has correct configuration"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        keys = manifest["resource"]["aws_kms_key"]
        lambda_kms = keys["lambda_kms_key"]

        # Verify configuration
        assert lambda_kms["deletion_window_in_days"] == 7
        assert lambda_kms["enable_key_rotation"] is True

    def test_kms_alias_created(self):
        """Test KMS alias is created"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        aliases = manifest["resource"]["aws_kms_alias"]
        lambda_alias = aliases["lambda_kms_alias"]

        # Verify alias name includes suffix
        assert lambda_alias["name"] == "alias/lambda-test"


class TestIAMRole:
    """Test IAM role and permissions"""

    def test_iam_role_created(self):
        """Test IAM role is created for Lambda"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        roles = manifest["resource"]["aws_iam_role"]
        lambda_role = roles["lambda_role"]

        # Verify role name includes suffix
        assert lambda_role["name"] == "data-processor-role-test"

    def test_iam_role_has_trust_policy(self):
        """Test IAM role has correct trust policy"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        roles = manifest["resource"]["aws_iam_role"]
        lambda_role = roles["lambda_role"]

        # Parse assume role policy
        assume_policy = json.loads(lambda_role["assume_role_policy"])

        # Verify Lambda service can assume role
        assert assume_policy["Version"] == "2012-10-17"
        assert len(assume_policy["Statement"]) == 1

        statement = assume_policy["Statement"][0]
        assert statement["Effect"] == "Allow"
        assert statement["Action"] == "sts:AssumeRole"
        assert statement["Principal"]["Service"] == "lambda.amazonaws.com"

    def test_iam_role_has_inline_policy(self):
        """Test IAM role has inline policy with required permissions"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        roles = manifest["resource"]["aws_iam_role"]
        lambda_role = roles["lambda_role"]

        # Verify inline policy exists
        assert "inline_policy" in lambda_role
        inline_policies = lambda_role["inline_policy"]
        assert len(inline_policies) > 0

        policy = inline_policies[0]
        assert policy["name"] == "lambda-permissions"

        # Parse policy document
        policy_doc = json.loads(policy["policy"])

        # Verify required actions are present
        actions = []
        for statement in policy_doc["Statement"]:
            actions.extend(statement["Action"])

        # Check SQS permissions
        assert "sqs:ReceiveMessage" in actions
        assert "sqs:DeleteMessage" in actions

        # Check DynamoDB permissions
        assert "dynamodb:PutItem" in actions

        # Check SNS permissions
        assert "sns:Publish" in actions

        # Check KMS permissions
        assert "kms:Decrypt" in actions


class TestCloudWatchAlarm:
    """Test CloudWatch alarm configuration"""

    def test_cloudwatch_alarm_created(self):
        """Test CloudWatch alarm is created with correct configuration"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        alarms = manifest["resource"]["aws_cloudwatch_metric_alarm"]
        error_alarm = alarms["lambda_error_alarm"]

        # Verify alarm configuration
        assert error_alarm["alarm_name"] == "data-processor-errors-test"
        assert error_alarm["comparison_operator"] == "GreaterThanThreshold"
        assert error_alarm["metric_name"] == "Errors"
        assert error_alarm["namespace"] == "AWS/Lambda"
        assert error_alarm["period"] == 300  # 5 minutes
        assert error_alarm["statistic"] == "Average"
        assert error_alarm["threshold"] == 0.01  # 1%


class TestEventSourceMapping:
    """Test Lambda event source mapping"""

    def test_event_source_mapping_created(self):
        """Test event source mapping connects SQS to Lambda"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        mappings = manifest["resource"]["aws_lambda_event_source_mapping"]
        sqs_trigger = mappings["sqs_trigger"]

        # Verify configuration
        assert sqs_trigger["batch_size"] == 25
        assert sqs_trigger["enabled"] is True


class TestStackOutputs:
    """Test stack outputs"""

    def test_stack_has_outputs(self):
        """Test stack defines required outputs"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Verify outputs exist
        assert "output" in manifest
        outputs = manifest["output"]

        # Check required outputs
        assert "sqs_queue_url" in outputs
        assert "sns_topic_arn" in outputs
        assert "dynamodb_table_name" in outputs
        assert "lambda_function_name" in outputs

    def test_output_descriptions(self):
        """Test outputs have descriptions"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        outputs = manifest["output"]

        # Verify descriptions exist
        assert "description" in outputs["sqs_queue_url"]
        assert "description" in outputs["sns_topic_arn"]
        assert "description" in outputs["dynamodb_table_name"]
        assert "description" in outputs["lambda_function_name"]


class TestResourceNaming:
    """Test that all resources include environmentSuffix"""

    def test_all_resources_use_environment_suffix(self):
        """Test that all resource names include the environment suffix"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="prod")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Lambda function
        lambda_fn = manifest["resource"]["aws_lambda_function"]["data_processor"]
        assert lambda_fn["function_name"] == "data-processor-prod"

        # DynamoDB table
        table = manifest["resource"]["aws_dynamodb_table"]["market_alerts_table"]
        assert table["name"] == "market-alerts-prod"

        # SQS queue
        queue = manifest["resource"]["aws_sqs_queue"]["market_data_queue"]
        assert queue["name"] == "market-data-queue-prod"

        # SNS topic
        topic = manifest["resource"]["aws_sns_topic"]["trading_alerts_topic"]
        assert topic["name"] == "trading-alerts-prod"

        # IAM role
        role = manifest["resource"]["aws_iam_role"]["lambda_role"]
        assert role["name"] == "data-processor-role-prod"

        # CloudWatch alarm
        alarm = manifest["resource"]["aws_cloudwatch_metric_alarm"]["lambda_error_alarm"]
        assert alarm["alarm_name"] == "data-processor-errors-prod"


class TestResourceTags:
    """Test that all resources have required tags"""

    def test_resources_have_required_tags(self):
        """Test that resources include Environment, Team, and CostCenter tags"""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check Lambda function tags
        lambda_fn = manifest["resource"]["aws_lambda_function"]["data_processor"]
        assert lambda_fn["tags"]["Environment"] == "test"
        assert lambda_fn["tags"]["Team"] == "trading"
        assert lambda_fn["tags"]["CostCenter"] == "trading-platform"

        # Check DynamoDB table tags
        table = manifest["resource"]["aws_dynamodb_table"]["market_alerts_table"]
        assert table["tags"]["Environment"] == "test"
        assert table["tags"]["Team"] == "trading"
        assert table["tags"]["CostCenter"] == "trading-platform"

        # Check SQS queue tags
        queue = manifest["resource"]["aws_sqs_queue"]["market_data_queue"]
        assert queue["tags"]["Environment"] == "test"
        assert queue["tags"]["Team"] == "trading"
        assert queue["tags"]["CostCenter"] == "trading-platform"
