"""Unit tests for TAP Stack."""
import os
import sys
import json
from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


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
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None

    def test_dynamodb_tables_created(self):
        """Test that DynamoDB tables are created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDB",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for DynamoDB tables
        dynamodb_tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        assert len(dynamodb_tables) == 2  # raw-sensor-data and processed-data

        # Verify raw sensor table
        raw_table = next((t for t in dynamodb_tables if "raw-sensor-data" in t["name"]), None)
        assert raw_table is not None
        assert raw_table["billing_mode"] == "PAY_PER_REQUEST"
        assert raw_table["hash_key"] == "device_id"
        assert raw_table["range_key"] == "timestamp"
        assert raw_table["point_in_time_recovery"]["enabled"] is True

        # Verify processed data table
        processed_table = next((t for t in dynamodb_tables if "processed-data" in t["name"]), None)
        assert processed_table is not None
        assert processed_table["billing_mode"] == "PAY_PER_REQUEST"
        assert processed_table["hash_key"] == "device_id"
        assert processed_table["range_key"] == "event_date"
        assert processed_table["point_in_time_recovery"]["enabled"] is True

    def test_lambda_functions_created(self):
        """Test that Lambda functions are created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestLambda",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for Lambda functions
        lambda_functions = resources.get("resource", {}).get("aws_lambda_function", {})
        assert len(lambda_functions) == 3  # ingestion, processor, query

        # Verify all functions have Python 3.11 runtime
        for func in lambda_functions.values():
            assert func["runtime"] == "python3.11"
            assert func["reserved_concurrent_executions"] == 100
            assert func["tracing_config"]["mode"] == "Active"
            assert "dead_letter_config" in func

    def test_sqs_queues_created(self):
        """Test that SQS queues are created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestSQS",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for SQS queues
        sqs_queues = resources.get("resource", {}).get("aws_sqs_queue", {})
        assert len(sqs_queues) == 2  # ingestion queue and DLQ

        # Verify DLQ exists
        dlq = next((q for q in sqs_queues.values() if "dlq" in q["name"]), None)
        assert dlq is not None
        assert dlq["message_retention_seconds"] == 1209600  # 14 days

        # Verify ingestion queue has DLQ configured
        ing_queue = next((q for q in sqs_queues.values() if "ingestion-queue" in q["name"]), None)
        assert ing_queue is not None
        assert "redrive_policy" in ing_queue

    def test_sns_topic_created(self):
        """Test that SNS topic is created for alerts."""
        app = App()
        stack = TapStack(
            app,
            "TestSNS",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for SNS topic
        sns_topics = resources.get("resource", {}).get("aws_sns_topic", {})
        assert len(sns_topics) == 1

        alert_topic = list(sns_topics.values())[0]
        assert "iot-alerts" in alert_topic["name"]
        assert alert_topic["display_name"] == "IoT Processing Alerts"

    def test_api_gateway_created(self):
        """Test that API Gateway is created with correct endpoints."""
        app = App()
        stack = TapStack(
            app,
            "TestAPIGateway",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for API Gateway
        api_gateways = resources.get("resource", {}).get("aws_api_gateway_rest_api", {})
        assert len(api_gateways) == 1

        # Check for API Gateway resources (endpoints)
        api_resources = resources.get("resource", {}).get("aws_api_gateway_resource", {})
        assert len(api_resources) == 3  # /ingest, /process, /query

        # Check for API Gateway methods
        api_methods = resources.get("resource", {}).get("aws_api_gateway_method", {})
        assert len(api_methods) == 3

        # Verify all methods use AWS_IAM authorization
        for method in api_methods.values():
            assert method["authorization"] == "AWS_IAM"

    def test_cloudwatch_log_groups_created(self):
        """Test that CloudWatch log groups are created for Lambda functions."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudWatch",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for CloudWatch log groups
        log_groups = resources.get("resource", {}).get("aws_cloudwatch_log_group", {})
        assert len(log_groups) == 3  # One for each Lambda function

        # Verify retention is set to 30 days
        for log_group in log_groups.values():
            assert log_group["retention_in_days"] == 30

    def test_cloudwatch_alarms_created(self):
        """Test that CloudWatch alarms are created for monitoring."""
        app = App()
        stack = TapStack(
            app,
            "TestAlarms",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for CloudWatch alarms
        alarms = resources.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
        # Should have alarms for: 3 Lambda errors, 3 Lambda throttles, 2 DynamoDB throttles
        assert len(alarms) == 8

    def test_ssm_parameters_created(self):
        """Test that SSM parameters are created for configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestSSM",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for SSM parameters
        ssm_params = resources.get("resource", {}).get("aws_ssm_parameter", {})
        assert len(ssm_params) == 2  # api-key and config

        # Verify API key parameter is SecureString
        api_key_param = next((p for p in ssm_params.values() if "api-key" in p["name"]), None)
        assert api_key_param is not None
        assert api_key_param["type"] == "SecureString"

        # Verify config parameter is String
        config_param = next((p for p in ssm_params.values() if "config" in p["name"]), None)
        assert config_param is not None
        assert config_param["type"] == "String"

    def test_lambda_layer_created(self):
        """Test that Lambda layer is created for shared dependencies."""
        app = App()
        stack = TapStack(
            app,
            "TestLayer",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for Lambda layer
        layers = resources.get("resource", {}).get("aws_lambda_layer_version", {})
        assert len(layers) == 1

        layer = list(layers.values())[0]
        assert "python3.11" in layer["compatible_runtimes"]
        assert "iot-shared-dependencies" in layer["layer_name"]

    def test_iam_roles_created(self):
        """Test that IAM roles are created with correct policies."""
        app = App()
        stack = TapStack(
            app,
            "TestIAM",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for IAM roles
        iam_roles = resources.get("resource", {}).get("aws_iam_role", {})
        assert len(iam_roles) == 3  # ingestion, processor, query

        # Verify all roles have Lambda assume role policy
        for role in iam_roles.values():
            policy = json.loads(role["assume_role_policy"])
            assert policy["Statement"][0]["Principal"]["Service"] == "lambda.amazonaws.com"
            assert policy["Statement"][0]["Action"] == "sts:AssumeRole"

    def test_api_gateway_throttling_configured(self):
        """Test that API Gateway throttling is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestThrottling",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for API Gateway method settings
        method_settings = resources.get("resource", {}).get("aws_api_gateway_method_settings", {})
        assert len(method_settings) == 1

        settings = list(method_settings.values())[0]
        assert settings["settings"]["throttling_burst_limit"] == 1000
        assert settings["settings"]["throttling_rate_limit"] == 1000
        assert settings["settings"]["metrics_enabled"] is True

    def test_environment_suffix_applied_to_resources(self):
        """Test that environment_suffix is applied to all resource names."""
        app = App()
        test_suffix = "testenv123"
        stack = TapStack(
            app,
            "TestSuffix",
            environment_suffix=test_suffix
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check DynamoDB table names
        dynamodb_tables = resources.get("resource", {}).get("aws_dynamodb_table", {})
        for table in dynamodb_tables.values():
            assert test_suffix in table["name"]

        # Check Lambda function names
        lambda_functions = resources.get("resource", {}).get("aws_lambda_function", {})
        for func in lambda_functions.values():
            assert test_suffix in func["function_name"]

        # Check SQS queue names
        sqs_queues = resources.get("resource", {}).get("aws_sqs_queue", {})
        for queue in sqs_queues.values():
            assert test_suffix in queue["name"]

    def test_xray_tracing_enabled(self):
        """Test that X-Ray tracing is enabled on Lambda and API Gateway."""
        app = App()
        stack = TapStack(
            app,
            "TestXRay",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check Lambda functions have X-Ray tracing
        lambda_functions = resources.get("resource", {}).get("aws_lambda_function", {})
        for func in lambda_functions.values():
            assert func["tracing_config"]["mode"] == "Active"

        # Check API Gateway stage has X-Ray tracing
        api_stages = resources.get("resource", {}).get("aws_api_gateway_stage", {})
        for stage in api_stages.values():
            assert stage["xray_tracing_enabled"] is True

    def test_outputs_generated(self):
        """Test that stack outputs are generated correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputs",
            environment_suffix="test"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check for outputs
        outputs = resources.get("output", {})
        assert len(outputs) >= 5  # Should have multiple outputs

        # Verify specific outputs exist
        assert "ApiEndpoint" in outputs
        assert "RawSensorTableName" in outputs
        assert "ProcessedDataTableName" in outputs
        assert "IngestionQueueUrl" in outputs
        assert "AlertTopicArn" in outputs


# add more test suites and cases as needed
