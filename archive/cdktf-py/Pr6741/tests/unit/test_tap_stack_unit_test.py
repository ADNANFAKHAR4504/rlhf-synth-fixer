"""Unit tests for TapStack - serverless fraud detection system"""
import json
import os
import pytest
from unittest.mock import patch, MagicMock, mock_open
from cdktf import Testing, App
from lib.tap_stack import TapStack


class TestTapStackUnitTest:
    """Unit tests for TapStack infrastructure"""

    @pytest.fixture
    def stack(self):
        """Create a TapStack instance for testing"""
        # Mock the Lambda ZIP file reading
        with patch('builtins.open', mock_open(read_data=b'fake zip content')):
            app = Testing.app()
            stack = TapStack(
                app,
                "test-stack",
                region="us-east-1",
                environment_suffix="test"
            )
            return stack

    @pytest.fixture
    def synth_stack(self):
        """Create and synthesize a TapStack instance"""
        # Mock the Lambda ZIP file reading
        with patch('builtins.open', mock_open(read_data=b'fake zip content')):
            app = Testing.app()
            stack = TapStack(
                app,
                "test-stack",
                region="us-east-1",
                environment_suffix="test"
            )
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_stack_initialization(self, stack):
        """Test that stack initializes correctly with region and environment suffix"""
        assert stack.region == "us-east-1"
        assert stack.environment_suffix == "test"

    def test_dynamodb_tables_created(self, synth_stack):
        """Test that both DynamoDB tables are created"""
        resources = synth_stack["resource"]["aws_dynamodb_table"]

        # Check transactions table
        assert "transactions-table" in resources
        transactions_table = resources["transactions-table"]
        assert transactions_table["name"] == "transactions-test"
        assert transactions_table["billing_mode"] == "PAY_PER_REQUEST"
        assert transactions_table["hash_key"] == "transaction_id"
        assert transactions_table["range_key"] == "timestamp"
        assert transactions_table["stream_enabled"] is True
        assert transactions_table["stream_view_type"] == "NEW_IMAGE"

        # Check fraud scores table
        assert "fraud-scores-table" in resources
        fraud_scores_table = resources["fraud-scores-table"]
        assert fraud_scores_table["name"] == "fraud_scores-test"
        assert fraud_scores_table["billing_mode"] == "PAY_PER_REQUEST"
        assert fraud_scores_table["hash_key"] == "transaction_id"
        assert fraud_scores_table["ttl"]["enabled"] is True
        assert fraud_scores_table["ttl"]["attribute_name"] == "expiry"

    def test_sqs_queues_created(self, synth_stack):
        """Test that all three SQS DLQs are created"""
        resources = synth_stack["resource"]["aws_sqs_queue"]

        # Check all three DLQs exist
        assert "transaction-ingestion-dlq" in resources
        assert "transaction-processor-dlq" in resources
        assert "fraud-scorer-dlq" in resources

        # Verify DLQ configuration
        ingestion_dlq = resources["transaction-ingestion-dlq"]
        assert ingestion_dlq["name"] == "transaction-ingestion-dlq-test"
        assert ingestion_dlq["message_retention_seconds"] == 1209600

    def test_sns_topic_created(self, synth_stack):
        """Test that SNS topic for fraud alerts is created"""
        resources = synth_stack["resource"]["aws_sns_topic"]

        assert "fraud-alerts-topic" in resources
        topic = resources["fraud-alerts-topic"]
        assert topic["name"] == "fraud-alerts-test"

    def test_iam_roles_created(self, synth_stack):
        """Test that all three IAM roles are created with correct permissions"""
        resources = synth_stack["resource"]["aws_iam_role"]

        # Check all three roles exist
        assert "ingestion-lambda-role" in resources
        assert "processor-lambda-role" in resources
        assert "scorer-lambda-role" in resources

        # Verify ingestion role
        ingestion_role = resources["ingestion-lambda-role"]
        assert ingestion_role["name"] == "transaction-ingestion-role-test"
        assert "inline_policy" in ingestion_role
        policy = json.loads(ingestion_role["inline_policy"][0]["policy"])
        assert len(policy["Statement"]) == 4  # DynamoDB, Logs, X-Ray, SQS

        # Verify processor role
        processor_role = resources["processor-lambda-role"]
        assert processor_role["name"] == "transaction-processor-role-test"

        # Verify scorer role
        scorer_role = resources["scorer-lambda-role"]
        assert scorer_role["name"] == "fraud-scorer-role-test"

    def test_lambda_functions_created(self, synth_stack):
        """Test that all three Lambda functions are created"""
        resources = synth_stack["resource"]["aws_lambda_function"]

        # Check all three Lambda functions exist
        assert "transaction-ingestion" in resources
        assert "transaction-processor" in resources
        assert "fraud-scorer" in resources

        # Verify ingestion Lambda
        ingestion = resources["transaction-ingestion"]
        assert ingestion["function_name"] == "transaction-ingestion-test"
        assert ingestion["runtime"] == "nodejs18.x"
        assert ingestion["memory_size"] == 256
        assert ingestion["timeout"] == 30
        assert ingestion["tracing_config"]["mode"] == "Active"

        # Verify processor Lambda
        processor = resources["transaction-processor"]
        assert processor["function_name"] == "transaction-processor-test"
        assert processor["runtime"] == "nodejs18.x"
        assert processor["memory_size"] == 512
        assert processor["timeout"] == 60

        # Verify scorer Lambda
        scorer = resources["fraud-scorer"]
        assert scorer["function_name"] == "fraud-scorer-test"
        assert scorer["runtime"] == "nodejs18.x"
        assert scorer["memory_size"] == 1024
        assert scorer["timeout"] == 120

    def test_lambda_environment_variables(self, synth_stack):
        """Test that Lambda functions have correct environment variables"""
        resources = synth_stack["resource"]["aws_lambda_function"]

        # Check ingestion Lambda env vars
        ingestion = resources["transaction-ingestion"]
        assert "environment" in ingestion
        env_vars = ingestion["environment"]["variables"]
        assert "TRANSACTIONS_TABLE" in env_vars
        assert "DLQ_URL" in env_vars

        # Check processor Lambda env vars
        processor = resources["transaction-processor"]
        env_vars = processor["environment"]["variables"]
        assert "FRAUD_SCORER_FUNCTION" in env_vars
        assert "DLQ_URL" in env_vars

        # Check scorer Lambda env vars
        scorer = resources["fraud-scorer"]
        env_vars = scorer["environment"]["variables"]
        assert "FRAUD_SCORES_TABLE" in env_vars
        assert "SNS_TOPIC_ARN" in env_vars
        assert "DLQ_URL" in env_vars

    def test_lambda_event_source_mapping(self, synth_stack):
        """Test that DynamoDB stream trigger is configured"""
        resources = synth_stack["resource"]["aws_lambda_event_source_mapping"]

        assert "transactions-stream-trigger" in resources
        mapping = resources["transactions-stream-trigger"]
        assert mapping["starting_position"] == "LATEST"
        assert mapping["maximum_retry_attempts"] == 5
        assert mapping["batch_size"] == 100

    def test_api_gateway_created(self, synth_stack):
        """Test that API Gateway is created"""
        resources = synth_stack["resource"]["aws_api_gateway_rest_api"]

        assert "fraud-detection-api" in resources
        api = resources["fraud-detection-api"]
        assert api["name"] == "fraud-detection-api-test"
        assert api["description"] == "API for fraud detection system"

    def test_api_gateway_resource_and_method(self, synth_stack):
        """Test that API Gateway resource and method are configured"""
        # Check resource
        resources = synth_stack["resource"]["aws_api_gateway_resource"]
        assert "transactions-resource" in resources
        resource = resources["transactions-resource"]
        assert resource["path_part"] == "transactions"

        # Check method
        methods = synth_stack["resource"]["aws_api_gateway_method"]
        assert "transactions-post-method" in methods
        method = methods["transactions-post-method"]
        assert method["http_method"] == "POST"
        assert method["authorization"] == "NONE"

    def test_api_gateway_integration(self, synth_stack):
        """Test that API Gateway integration is configured"""
        resources = synth_stack["resource"]["aws_api_gateway_integration"]

        assert "transactions-integration" in resources
        integration = resources["transactions-integration"]
        assert integration["type"] == "AWS_PROXY"
        assert integration["integration_http_method"] == "POST"

    def test_api_gateway_deployment(self, synth_stack):
        """Test that API Gateway deployment and stage are configured"""
        # Check deployment
        deployments = synth_stack["resource"]["aws_api_gateway_deployment"]
        assert "api-deployment" in deployments

        # Check stage
        stages = synth_stack["resource"]["aws_api_gateway_stage"]
        assert "api-stage" in stages
        stage = stages["api-stage"]
        assert stage["stage_name"] == "prod"
        assert stage["xray_tracing_enabled"] is True

    def test_api_gateway_throttling(self, synth_stack):
        """Test that API Gateway throttling is configured"""
        resources = synth_stack["resource"]["aws_api_gateway_method_settings"]

        assert "api-method-settings" in resources
        settings = resources["api-method-settings"]
        assert settings["method_path"] == "*/*"
        assert settings["settings"]["throttling_rate_limit"] == 1000
        assert settings["settings"]["throttling_burst_limit"] == 2000

    def test_lambda_permission_for_api_gateway(self, synth_stack):
        """Test that Lambda permission for API Gateway is configured"""
        resources = synth_stack["resource"]["aws_lambda_permission"]

        assert "api-lambda-permission" in resources
        permission = resources["api-lambda-permission"]
        assert permission["statement_id"] == "AllowAPIGatewayInvoke"
        assert permission["action"] == "lambda:InvokeFunction"
        assert permission["principal"] == "apigateway.amazonaws.com"

    def test_cloudwatch_alarms_created(self, synth_stack):
        """Test that CloudWatch alarms are created for both Lambda functions"""
        resources = synth_stack["resource"]["aws_cloudwatch_metric_alarm"]

        # Check processor alarm
        assert "processor-error-alarm" in resources
        processor_alarm = resources["processor-error-alarm"]
        assert processor_alarm["alarm_name"] == "transaction-processor-errors-test"
        assert processor_alarm["comparison_operator"] == "GreaterThanThreshold"
        assert processor_alarm["metric_name"] == "Errors"
        assert processor_alarm["namespace"] == "AWS/Lambda"
        assert processor_alarm["statistic"] == "Sum"
        assert processor_alarm["threshold"] == 10
        assert processor_alarm["treat_missing_data"] == "notBreaching"

        # Check scorer alarm
        assert "scorer-error-alarm" in resources
        scorer_alarm = resources["scorer-error-alarm"]
        assert scorer_alarm["alarm_name"] == "fraud-scorer-errors-test"

    def test_stack_outputs(self, synth_stack):
        """Test that stack outputs are configured"""
        outputs = synth_stack["output"]

        assert "api_endpoint" in outputs
        assert "transactions_table_name" in outputs
        assert "fraud_scores_table_name" in outputs
        assert "sns_topic_arn" in outputs
        assert "ingestion_lambda_name" in outputs
        assert "processor_lambda_name" in outputs
        assert "scorer_lambda_name" in outputs

    def test_environment_suffix_in_resource_names(self, synth_stack):
        """Test that environment suffix is included in all resource names"""
        # DynamoDB tables
        dynamodb = synth_stack["resource"]["aws_dynamodb_table"]
        assert "test" in dynamodb["transactions-table"]["name"]
        assert "test" in dynamodb["fraud-scores-table"]["name"]

        # SQS queues
        sqs = synth_stack["resource"]["aws_sqs_queue"]
        assert "test" in sqs["transaction-ingestion-dlq"]["name"]
        assert "test" in sqs["transaction-processor-dlq"]["name"]
        assert "test" in sqs["fraud-scorer-dlq"]["name"]

        # SNS topic
        sns = synth_stack["resource"]["aws_sns_topic"]
        assert "test" in sns["fraud-alerts-topic"]["name"]

        # IAM roles
        iam = synth_stack["resource"]["aws_iam_role"]
        assert "test" in iam["ingestion-lambda-role"]["name"]
        assert "test" in iam["processor-lambda-role"]["name"]
        assert "test" in iam["scorer-lambda-role"]["name"]

        # Lambda functions
        lambdas = synth_stack["resource"]["aws_lambda_function"]
        assert "test" in lambdas["transaction-ingestion"]["function_name"]
        assert "test" in lambdas["transaction-processor"]["function_name"]
        assert "test" in lambdas["fraud-scorer"]["function_name"]

    def test_tags_include_environment(self, synth_stack):
        """Test that resources are tagged with environment suffix"""
        # Check DynamoDB table tags
        dynamodb = synth_stack["resource"]["aws_dynamodb_table"]
        assert dynamodb["transactions-table"]["tags"]["Environment"] == "test"

        # Check SNS topic tags
        sns = synth_stack["resource"]["aws_sns_topic"]
        assert sns["fraud-alerts-topic"]["tags"]["Environment"] == "test"

        # Check Lambda tags
        lambdas = synth_stack["resource"]["aws_lambda_function"]
        assert lambdas["transaction-ingestion"]["tags"]["Environment"] == "test"

    def test_x_ray_tracing_enabled(self, synth_stack):
        """Test that X-Ray tracing is enabled on all Lambda functions"""
        lambdas = synth_stack["resource"]["aws_lambda_function"]

        # Check all Lambda functions have X-Ray enabled
        assert lambdas["transaction-ingestion"]["tracing_config"]["mode"] == "Active"
        assert lambdas["transaction-processor"]["tracing_config"]["mode"] == "Active"
        assert lambdas["fraud-scorer"]["tracing_config"]["mode"] == "Active"

        # Check API Gateway stage has X-Ray enabled
        stage = synth_stack["resource"]["aws_api_gateway_stage"]["api-stage"]
        assert stage["xray_tracing_enabled"] is True

    def test_dead_letter_config_on_lambdas(self, synth_stack):
        """Test that Lambda functions have dead letter config"""
        lambdas = synth_stack["resource"]["aws_lambda_function"]

        # Check ingestion Lambda DLQ
        assert "dead_letter_config" in lambdas["transaction-ingestion"]

        # Check processor Lambda DLQ
        assert "dead_letter_config" in lambdas["transaction-processor"]

        # Check scorer Lambda DLQ
        assert "dead_letter_config" in lambdas["fraud-scorer"]

    def test_iam_role_assume_policy(self, synth_stack):
        """Test that IAM roles have correct assume role policy"""
        iam_roles = synth_stack["resource"]["aws_iam_role"]

        for role_key in ["ingestion-lambda-role", "processor-lambda-role", "scorer-lambda-role"]:
            role = iam_roles[role_key]
            policy = json.loads(role["assume_role_policy"])
            assert policy["Version"] == "2012-10-17"
            assert len(policy["Statement"]) == 1
            assert policy["Statement"][0]["Action"] == "sts:AssumeRole"
            assert policy["Statement"][0]["Principal"]["Service"] == "lambda.amazonaws.com"
            assert policy["Statement"][0]["Effect"] == "Allow"

    def test_ingestion_role_dynamodb_permissions(self, synth_stack):
        """Test that ingestion Lambda role has DynamoDB PutItem permission"""
        role = synth_stack["resource"]["aws_iam_role"]["ingestion-lambda-role"]
        policy = json.loads(role["inline_policy"][0]["policy"])

        # Find DynamoDB statement
        dynamodb_stmt = None
        for stmt in policy["Statement"]:
            if "dynamodb:PutItem" in stmt["Action"]:
                dynamodb_stmt = stmt
                break

        assert dynamodb_stmt is not None
        assert dynamodb_stmt["Effect"] == "Allow"
        assert "dynamodb:PutItem" in dynamodb_stmt["Action"]

    def test_processor_role_stream_permissions(self, synth_stack):
        """Test that processor Lambda role has DynamoDB stream permissions"""
        role = synth_stack["resource"]["aws_iam_role"]["processor-lambda-role"]
        policy = json.loads(role["inline_policy"][0]["policy"])

        # Find DynamoDB stream statement
        stream_stmt = None
        for stmt in policy["Statement"]:
            if "dynamodb:GetRecords" in stmt["Action"]:
                stream_stmt = stmt
                break

        assert stream_stmt is not None
        assert stream_stmt["Effect"] == "Allow"
        assert "dynamodb:GetRecords" in stream_stmt["Action"]
        assert "dynamodb:GetShardIterator" in stream_stmt["Action"]
        assert "dynamodb:DescribeStream" in stream_stmt["Action"]
        assert "dynamodb:ListStreams" in stream_stmt["Action"]

    def test_scorer_role_permissions(self, synth_stack):
        """Test that scorer Lambda role has correct permissions"""
        role = synth_stack["resource"]["aws_iam_role"]["scorer-lambda-role"]
        policy = json.loads(role["inline_policy"][0]["policy"])

        # Check for DynamoDB permissions
        has_dynamodb = False
        has_sns = False
        has_sqs = False

        for stmt in policy["Statement"]:
            if "dynamodb:PutItem" in stmt["Action"]:
                has_dynamodb = True
                assert "dynamodb:GetItem" in stmt["Action"]
                assert "dynamodb:Query" in stmt["Action"]
            if "sns:Publish" in stmt["Action"]:
                has_sns = True
            if "sqs:SendMessage" in stmt["Action"]:
                has_sqs = True

        assert has_dynamodb, "Scorer role missing DynamoDB permissions"
        assert has_sns, "Scorer role missing SNS permissions"
        assert has_sqs, "Scorer role missing SQS permissions"

    def test_all_roles_have_xray_permissions(self, synth_stack):
        """Test that all Lambda roles have X-Ray permissions"""
        iam_roles = synth_stack["resource"]["aws_iam_role"]

        for role_key in ["ingestion-lambda-role", "processor-lambda-role", "scorer-lambda-role"]:
            role = iam_roles[role_key]
            policy = json.loads(role["inline_policy"][0]["policy"])

            # Find X-Ray statement
            has_xray = False
            for stmt in policy["Statement"]:
                if "xray:PutTraceSegments" in stmt["Action"]:
                    has_xray = True
                    assert "xray:PutTelemetryRecords" in stmt["Action"]
                    break

            assert has_xray, f"{role_key} missing X-Ray permissions"

    def test_all_roles_have_cloudwatch_logs_permissions(self, synth_stack):
        """Test that all Lambda roles have CloudWatch Logs permissions"""
        iam_roles = synth_stack["resource"]["aws_iam_role"]

        for role_key in ["ingestion-lambda-role", "processor-lambda-role", "scorer-lambda-role"]:
            role = iam_roles[role_key]
            policy = json.loads(role["inline_policy"][0]["policy"])

            # Find CloudWatch Logs statement
            has_logs = False
            for stmt in policy["Statement"]:
                if "logs:CreateLogGroup" in stmt["Action"]:
                    has_logs = True
                    assert "logs:CreateLogStream" in stmt["Action"]
                    assert "logs:PutLogEvents" in stmt["Action"]
                    break

            assert has_logs, f"{role_key} missing CloudWatch Logs permissions"

    def test_s3_backend_configuration(self):
        """Test that S3 backend is configured when environment variable is set"""
        with patch.dict(os.environ, {
            'TERRAFORM_STATE_BUCKET': 'test-bucket',
            'TERRAFORM_STATE_BUCKET_KEY': 'test'
        }):
            with patch('builtins.open', mock_open(read_data=b'fake zip content')):
                app = Testing.app()
                stack = TapStack(
                    app,
                    "test-stack",
                    region="us-east-1",
                    environment_suffix="test"
                )
                synth = Testing.synth(stack)
                synth_dict = json.loads(synth)
                
                # Check that terraform backend is configured
                assert "terraform" in synth_dict
                assert "backend" in synth_dict["terraform"]
                assert "s3" in synth_dict["terraform"]["backend"]
                
                s3_backend = synth_dict["terraform"]["backend"]["s3"]
                assert s3_backend["bucket"] == "test-bucket"
                assert s3_backend["key"] == "test/test-stack.tfstate"
                assert s3_backend["region"] == "us-east-1"
                assert s3_backend["encrypt"] is True

    def test_s3_backend_not_configured_without_env(self):
        """Test that S3 backend is not configured when environment variable is not set"""
        with patch.dict(os.environ, {'TERRAFORM_STATE_BUCKET': ''}, clear=False):
            with patch('builtins.open', mock_open(read_data=b'fake zip content')):
                app = Testing.app()
                stack = TapStack(
                    app,
                    "test-stack",
                    region="us-east-1",
                    environment_suffix="test"
                )
                synth = Testing.synth(stack)
                synth_dict = json.loads(synth)
                
                # Check that backend is not configured when empty string
                if "terraform" in synth_dict and "backend" in synth_dict["terraform"]:
                    # With empty string, backend should not be configured
                    assert "s3" not in synth_dict["terraform"]["backend"] or synth_dict["terraform"]["backend"] == {}

    def test_cloudwatch_log_groups_created(self, synth_stack):
        """Test that CloudWatch Log Groups are created for all Lambda functions"""
        resources = synth_stack["resource"]["aws_cloudwatch_log_group"]
        
        # Check all three log groups exist
        assert "transaction-ingestion-log-group" in resources
        assert "transaction-processor-log-group" in resources
        assert "fraud-scorer-log-group" in resources
        
        # Check ingestion log group
        ingestion_log = resources["transaction-ingestion-log-group"]
        assert ingestion_log["name"] == "/aws/lambda/transaction-ingestion-test"
        assert ingestion_log["retention_in_days"] == 7
        assert ingestion_log["tags"]["Environment"] == "test"
        
        # Check processor log group
        processor_log = resources["transaction-processor-log-group"]
        assert processor_log["name"] == "/aws/lambda/transaction-processor-test"
        assert processor_log["retention_in_days"] == 7
        
        # Check scorer log group
        scorer_log = resources["fraud-scorer-log-group"]
        assert scorer_log["name"] == "/aws/lambda/fraud-scorer-test"
        assert scorer_log["retention_in_days"] == 7

    def test_lambda_reserved_concurrent_executions(self, synth_stack):
        """Test that Lambda functions have reserved concurrent executions configured"""
        lambdas = synth_stack["resource"]["aws_lambda_function"]
        
        # Check transaction processor has 100 reserved
        processor = lambdas["transaction-processor"]
        assert processor["reserved_concurrent_executions"] == 100
        
        # Check fraud scorer has 50 reserved
        scorer = lambdas["fraud-scorer"]
        assert scorer["reserved_concurrent_executions"] == 50
        
        # Ingestion Lambda should not have reserved concurrency
        ingestion = lambdas["transaction-ingestion"]
        assert "reserved_concurrent_executions" not in ingestion

    def test_lambda_source_code_hash(self, synth_stack):
        """Test that Lambda functions have source_code_hash configured"""
        lambdas = synth_stack["resource"]["aws_lambda_function"]
        
        # Check all Lambda functions have source_code_hash
        assert "source_code_hash" in lambdas["transaction-ingestion"]
        assert "source_code_hash" in lambdas["transaction-processor"]
        assert "source_code_hash" in lambdas["fraud-scorer"]

    def test_lambda_depends_on_log_groups(self, synth_stack):
        """Test that Lambda functions depend on their log groups"""
        lambdas = synth_stack["resource"]["aws_lambda_function"]
        
        # Check all Lambda functions have depends_on
        assert "depends_on" in lambdas["transaction-ingestion"]
        assert "depends_on" in lambdas["transaction-processor"]
        assert "depends_on" in lambdas["fraud-scorer"]

    def test_cloudwatch_alarms_updated_metrics(self, synth_stack):
        """Test that CloudWatch alarms use Sum statistic and correct threshold"""
        alarms = synth_stack["resource"]["aws_cloudwatch_metric_alarm"]
        
        # Check all alarms use Sum statistic
        for alarm_key in ["processor-error-alarm", "scorer-error-alarm", "ingestion-error-alarm"]:
            assert alarm_key in alarms
            alarm = alarms[alarm_key]
            assert alarm["statistic"] == "Sum"
            assert alarm["threshold"] == 10
            assert alarm["period"] == 300

    def test_ingestion_alarm_created(self, synth_stack):
        """Test that ingestion Lambda has error alarm"""
        alarms = synth_stack["resource"]["aws_cloudwatch_metric_alarm"]
        
        assert "ingestion-error-alarm" in alarms
        alarm = alarms["ingestion-error-alarm"]
        assert alarm["alarm_name"] == "transaction-ingestion-errors-test"
        assert alarm["metric_name"] == "Errors"
        assert alarm["namespace"] == "AWS/Lambda"

    def test_api_gateway_output_url_format(self, synth_stack):
        """Test that API Gateway output URL is correctly formatted"""
        outputs = synth_stack["output"]
        
        assert "api_endpoint" in outputs
        api_url = outputs["api_endpoint"]["value"]
        assert "https://" in api_url
        assert ".execute-api." in api_url
        assert ".amazonaws.com/prod" in api_url

    def test_state_locking_enabled(self):
        """Test that S3 state locking is enabled via default encrypt option"""
        with patch.dict(os.environ, {'TERRAFORM_STATE_BUCKET': 'test-bucket'}):
            with patch('builtins.open', mock_open(read_data=b'fake zip content')):
                app = Testing.app()
                stack = TapStack(
                    app,
                    "test-stack",
                    region="us-east-1",
                    environment_suffix="test"
                )
                synth = Testing.synth(stack)
                synth_dict = json.loads(synth)
                
                # Check that encryption is enabled (which provides locking)
                assert synth_dict["terraform"]["backend"]["s3"]["encrypt"] is True

    def test_all_lambda_functions_have_dlq_arn(self, synth_stack):
        """Test that all Lambda functions have DLQ configured with correct ARN format"""
        lambdas = synth_stack["resource"]["aws_lambda_function"]
        
        for lambda_key in ["transaction-ingestion", "transaction-processor", "fraud-scorer"]:
            lambda_fn = lambdas[lambda_key]
            assert "dead_letter_config" in lambda_fn
            assert "target_arn" in lambda_fn["dead_letter_config"]
            # ARN should reference the corresponding DLQ
            assert "${aws_sqs_queue." in lambda_fn["dead_letter_config"]["target_arn"]

    def test_dynamodb_attributes_defined(self, synth_stack):
        """Test that DynamoDB tables have correct attribute definitions"""
        tables = synth_stack["resource"]["aws_dynamodb_table"]
        
        # Check transactions table attributes
        trans_attrs = tables["transactions-table"]["attribute"]
        assert len(trans_attrs) == 2
        assert any(attr["name"] == "transaction_id" and attr["type"] == "S" for attr in trans_attrs)
        assert any(attr["name"] == "timestamp" and attr["type"] == "N" for attr in trans_attrs)
        
        # Check fraud scores table attributes
        fraud_attrs = tables["fraud-scores-table"]["attribute"]
        assert len(fraud_attrs) == 1
        assert fraud_attrs[0]["name"] == "transaction_id"
        assert fraud_attrs[0]["type"] == "S"
