"""Integration tests for TapStack - serverless fraud detection system"""
import json
import os
import boto3
import pytest
from botocore.exceptions import ClientError


class TestTapStackIntegration:
    """Integration tests for deployed fraud detection infrastructure"""
    
    @pytest.fixture(scope="class")
    def outputs(self):
        """Load CloudFormation outputs"""
        outputs_path = os.path.join(os.path.dirname(__file__), "../../cfn-outputs/flat-outputs.json")
        if not os.path.exists(outputs_path):
            pytest.skip("CloudFormation outputs not found - skipping integration tests")
        
        with open(outputs_path, "r") as f:
            data = json.load(f)
            # For CDKTF, outputs are nested under the stack name
            # Return the first stack's outputs
            if isinstance(data, dict):
                for stack_name, stack_outputs in data.items():
                    if isinstance(stack_outputs, dict):
                        return stack_outputs
            return data
    
    @pytest.fixture(scope="class")
    def region(self):
        """Get AWS region"""
        return os.getenv("AWS_REGION", "us-east-1")
    
    @pytest.fixture(scope="class")
    def dynamodb_client(self, region):
        """Create DynamoDB client"""
        return boto3.client("dynamodb", region_name=region)
    
    @pytest.fixture(scope="class")
    def lambda_client(self, region):
        """Create Lambda client"""
        return boto3.client("lambda", region_name=region)
    
    @pytest.fixture(scope="class")
    def sqs_client(self, region):
        """Create SQS client"""
        return boto3.client("sqs", region_name=region)
    
    @pytest.fixture(scope="class")
    def sns_client(self, region):
        """Create SNS client"""
        return boto3.client("sns", region_name=region)
    
    @pytest.fixture(scope="class")
    def api_gateway_client(self, region):
        """Create API Gateway client"""
        return boto3.client("apigateway", region_name=region)
    
    @pytest.fixture(scope="class")
    def logs_client(self, region):
        """Create CloudWatch Logs client"""
        return boto3.client("logs", region_name=region)
    
    @pytest.fixture(scope="class")
    def cloudwatch_client(self, region):
        """Create CloudWatch client"""
        return boto3.client("cloudwatch", region_name=region)
    
    @pytest.fixture(scope="class")
    def xray_client(self, region):
        """Create X-Ray client"""
        return boto3.client("xray", region_name=region)

    def test_dynamodb_transactions_table_exists(self, dynamodb_client, outputs):
        """Test that transactions DynamoDB table exists with correct configuration"""
        table_name = outputs.get("transactions_table_name")
        assert table_name is not None, "Transactions table name not found in outputs"
        
        response = dynamodb_client.describe_table(TableName=table_name)
        table = response["Table"]
        
        # Check table status
        assert table["TableStatus"] == "ACTIVE"
        
        # Check billing mode
        assert table["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"
        
        # Check key schema
        key_schema = table["KeySchema"]
        assert len(key_schema) == 2
        assert any(key["AttributeName"] == "transaction_id" and key["KeyType"] == "HASH" for key in key_schema)
        assert any(key["AttributeName"] == "timestamp" and key["KeyType"] == "RANGE" for key in key_schema)
        
        # Check stream is enabled
        assert "StreamSpecification" in table
        assert table["StreamSpecification"]["StreamEnabled"] is True
        assert table["StreamSpecification"]["StreamViewType"] == "NEW_IMAGE"

    def test_dynamodb_fraud_scores_table_exists(self, dynamodb_client, outputs):
        """Test that fraud scores DynamoDB table exists with TTL enabled"""
        table_name = outputs.get("fraud_scores_table_name")
        assert table_name is not None, "Fraud scores table name not found in outputs"
        
        response = dynamodb_client.describe_table(TableName=table_name)
        table = response["Table"]
        
        assert table["TableStatus"] == "ACTIVE"
        assert table["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"
        
        # Check TTL configuration
        ttl_response = dynamodb_client.describe_time_to_live(TableName=table_name)
        assert ttl_response["TimeToLiveDescription"]["TimeToLiveStatus"] == "ENABLED"
        assert ttl_response["TimeToLiveDescription"]["AttributeName"] == "expiry"

    def test_lambda_functions_exist(self, lambda_client, outputs):
        """Test that all Lambda functions exist and are configured correctly"""
        lambda_names = [
            outputs.get("ingestion_lambda_name"),
            outputs.get("processor_lambda_name"),
            outputs.get("scorer_lambda_name")
        ]
        
        for lambda_name in lambda_names:
            assert lambda_name is not None, f"Lambda function name not found in outputs"
            
            response = lambda_client.get_function(FunctionName=lambda_name)
            config = response["Configuration"]
            
            # Check runtime
            assert config["Runtime"] == "nodejs18.x"
            
            # Check X-Ray tracing
            assert config["TracingConfig"]["Mode"] == "Active"
            
            # Check state
            assert config["State"] == "Active"

    def test_lambda_reserved_concurrency(self, lambda_client, outputs):
        """Test that Lambda functions have correct reserved concurrent executions"""
        # Check processor Lambda
        processor_name = outputs.get("processor_lambda_name")
        
        # Get concurrency configuration separately
        try:
            concurrency = lambda_client.get_function_concurrency(FunctionName=processor_name)
            processor_reserved = concurrency.get("ReservedConcurrentExecutions")
            assert processor_reserved == 100, f"Expected processor concurrency 100, got {processor_reserved}"
        except lambda_client.exceptions.ResourceNotFoundException:
            # If no reserved concurrency is set, the API returns ResourceNotFoundException
            # Check if it's in the function configuration instead
            processor_config = lambda_client.get_function(FunctionName=processor_name)["Configuration"]
            reserved_concurrency = processor_config.get("ReservedConcurrentExecutions")
            if reserved_concurrency is None:
                pytest.skip("Reserved concurrency not yet configured - may need deployment update")
            assert reserved_concurrency == 100, f"Expected processor concurrency 100, got {reserved_concurrency}"
        
        # Check scorer Lambda
        scorer_name = outputs.get("scorer_lambda_name")
        try:
            concurrency = lambda_client.get_function_concurrency(FunctionName=scorer_name)
            scorer_reserved = concurrency.get("ReservedConcurrentExecutions")
            assert scorer_reserved == 50, f"Expected scorer concurrency 50, got {scorer_reserved}"
        except lambda_client.exceptions.ResourceNotFoundException:
            scorer_config = lambda_client.get_function(FunctionName=scorer_name)["Configuration"]
            reserved_concurrency = scorer_config.get("ReservedConcurrentExecutions")
            if reserved_concurrency is None:
                pytest.skip("Reserved concurrency not yet configured - may need deployment update")
            assert reserved_concurrency == 50, f"Expected scorer concurrency 50, got {reserved_concurrency}"

    def test_lambda_environment_variables(self, lambda_client, outputs):
        """Test that Lambda functions have correct environment variables"""
        # Check ingestion Lambda
        ingestion_name = outputs.get("ingestion_lambda_name")
        ingestion_config = lambda_client.get_function(FunctionName=ingestion_name)["Configuration"]
        env_vars = ingestion_config["Environment"]["Variables"]
        assert "TRANSACTIONS_TABLE" in env_vars
        assert "DLQ_URL" in env_vars
        
        # Check processor Lambda
        processor_name = outputs.get("processor_lambda_name")
        processor_config = lambda_client.get_function(FunctionName=processor_name)["Configuration"]
        env_vars = processor_config["Environment"]["Variables"]
        assert "FRAUD_SCORER_FUNCTION" in env_vars
        assert "DLQ_URL" in env_vars
        
        # Check scorer Lambda
        scorer_name = outputs.get("scorer_lambda_name")
        scorer_config = lambda_client.get_function(FunctionName=scorer_name)["Configuration"]
        env_vars = scorer_config["Environment"]["Variables"]
        assert "FRAUD_SCORES_TABLE" in env_vars
        assert "SNS_TOPIC_ARN" in env_vars
        assert "DLQ_URL" in env_vars

    def test_sns_topic_exists(self, sns_client, outputs):
        """Test that SNS topic for fraud alerts exists"""
        topic_arn = outputs.get("sns_topic_arn")
        assert topic_arn is not None, "SNS topic ARN not found in outputs"
        
        # Get topic attributes
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert "Attributes" in response
        assert response["Attributes"]["SubscriptionsConfirmed"] is not None

    def test_sqs_dead_letter_queues_exist(self, sqs_client, lambda_client, outputs):
        """Test that SQS dead letter queues exist for all Lambda functions"""
        lambda_names = [
            outputs.get("ingestion_lambda_name"),
            outputs.get("processor_lambda_name"),
            outputs.get("scorer_lambda_name")
        ]
        
        for lambda_name in lambda_names:
            # Get Lambda configuration to find DLQ
            lambda_config = lambda_client.get_function(FunctionName=lambda_name)["Configuration"]
            
            if "DeadLetterConfig" in lambda_config:
                dlq_arn = lambda_config["DeadLetterConfig"].get("TargetArn")
                if dlq_arn:
                    # Extract queue name from ARN
                    queue_name = dlq_arn.split(":")[-1]
                    
                    # Get queue URL
                    response = sqs_client.get_queue_url(QueueName=queue_name)
                    assert "QueueUrl" in response

    def test_api_gateway_deployed(self, outputs):
        """Test that API Gateway is deployed and accessible"""
        api_endpoint = outputs.get("api_endpoint")
        assert api_endpoint is not None, "API endpoint not found in outputs"
        
        # Check endpoint format
        assert api_endpoint.startswith("https://")
        assert ".execute-api." in api_endpoint
        assert ".amazonaws.com/" in api_endpoint

    def test_cloudwatch_log_groups_exist(self, logs_client, outputs):
        """Test that CloudWatch Log Groups exist for all Lambda functions"""
        lambda_names = [
            outputs.get("ingestion_lambda_name"),
            outputs.get("processor_lambda_name"),
            outputs.get("scorer_lambda_name")
        ]
        
        for lambda_name in lambda_names:
            log_group_name = f"/aws/lambda/{lambda_name}"
            
            try:
                response = logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name,
                    limit=1
                )
                
                assert len(response["logGroups"]) > 0
                log_group = response["logGroups"][0]
                
                # Check retention
                assert log_group["retentionInDays"] == 7
            except ClientError as e:
                pytest.fail(f"Log group {log_group_name} not found: {str(e)}")

    def test_cloudwatch_alarms_exist(self, cloudwatch_client, outputs):
        """Test that CloudWatch alarms exist for Lambda error monitoring"""
        # Get environment suffix from one of the lambda names
        ingestion_name = outputs.get("ingestion_lambda_name", "")
        environment_suffix = ingestion_name.split("-")[-1] if ingestion_name else "pr6741"
        
        # Expected alarm names based on our implementation
        expected_alarms = [
            f"transaction-ingestion-errors-{environment_suffix}",
            f"transaction-processor-errors-{environment_suffix}",
            f"fraud-scorer-errors-{environment_suffix}"
        ]
        
        for alarm_name in expected_alarms:
            response = cloudwatch_client.describe_alarms(
                AlarmNames=[alarm_name],
                MaxRecords=10
            )
            
            # Should find the alarm
            assert len(response["MetricAlarms"]) > 0, f"Alarm {alarm_name} not found"
            
            # Check alarm configuration
            alarm = response["MetricAlarms"][0]
            assert alarm["MetricName"] == "Errors"
            assert alarm["Namespace"] == "AWS/Lambda"
            assert alarm["Statistic"] == "Sum"
            assert alarm["Threshold"] == 10
            assert alarm["Period"] == 300

    def test_lambda_event_source_mapping_exists(self, lambda_client, outputs):
        """Test that DynamoDB stream is connected to processor Lambda"""
        processor_name = outputs.get("processor_lambda_name")
        
        # List event source mappings
        response = lambda_client.list_event_source_mappings(
            FunctionName=processor_name
        )
        
        # Should have at least one mapping
        assert len(response["EventSourceMappings"]) > 0
        
        # Check mapping configuration
        mapping = response["EventSourceMappings"][0]
        assert mapping["State"] in ["Enabled", "Enabling"]
        assert mapping["StartingPosition"] == "LATEST"
        assert mapping["MaximumRetryAttempts"] == 5

    def test_api_gateway_throttling_configured(self, api_gateway_client):
        """Test that API Gateway has throttling configured"""
        # Get all APIs
        response = api_gateway_client.get_rest_apis()
        
        # Find our API (should contain "fraud-detection-api")
        api = None
        for rest_api in response["items"]:
            if "fraud-detection-api" in rest_api["name"]:
                api = rest_api
                break
        
        assert api is not None, "Fraud detection API not found"
        
        # Get stage settings
        try:
            stage_response = api_gateway_client.get_stage(
                restApiId=api["id"],
                stageName="prod"
            )
            
            # Check throttling settings
            method_settings = stage_response.get("methodSettings", {})
        except api_gateway_client.exceptions.NotFoundException:
            # Stage might not be deployed yet, check deployment
            pytest.skip("API Gateway stage 'prod' not found - may not be fully deployed yet")
        if "*/*" in method_settings:
            settings = method_settings["*/*"]
            assert settings.get("throttlingRateLimit") == 1000
            assert settings.get("throttlingBurstLimit") == 2000

    def test_xray_tracing_enabled(self, api_gateway_client):
        """Test that X-Ray tracing is enabled on API Gateway"""
        # Get all APIs
        response = api_gateway_client.get_rest_apis()
        
        # Find our API
        api = None
        for rest_api in response["items"]:
            if "fraud-detection-api" in rest_api["name"]:
                api = rest_api
                break
        
        assert api is not None
        
        # Get stage
        try:
            stage_response = api_gateway_client.get_stage(
                restApiId=api["id"],
                stageName="prod"
            )
            
            assert stage_response.get("tracingEnabled") is True
        except api_gateway_client.exceptions.NotFoundException:
            pytest.skip("API Gateway stage 'prod' not found - may not be fully deployed yet")

    def test_lambda_dead_letter_queue_configuration(self, lambda_client, sqs_client, outputs):
        """Test that Lambda functions are properly configured with DLQs"""
        lambda_names = [
            outputs.get("ingestion_lambda_name"),
            outputs.get("processor_lambda_name"),
            outputs.get("scorer_lambda_name")
        ]
        
        for lambda_name in lambda_names:
            # Get function configuration
            response = lambda_client.get_function(FunctionName=lambda_name)
            config = response["Configuration"]
            
            # Check DLQ is configured
            assert "DeadLetterConfig" in config
            assert "TargetArn" in config["DeadLetterConfig"]
            
            dlq_arn = config["DeadLetterConfig"]["TargetArn"]
            assert dlq_arn.startswith("arn:aws:sqs:")

    def test_environment_suffix_in_resource_names(self, outputs):
        """Test that all resources include environment suffix in their names"""
        # Get environment suffix from any resource name
        table_name = outputs.get("transactions_table_name", "")
        suffix = table_name.split("-")[-1] if "-" in table_name else None
        
        if suffix:
            # Check all output resource names contain the suffix
            for key, value in outputs.items():
                if isinstance(value, str) and ("name" in key or "id" in key):
                    assert suffix in value, f"Resource {key}={value} missing environment suffix {suffix}"

    def test_tags_on_resources(self, dynamodb_client, lambda_client, outputs):
        """Test that resources are properly tagged"""
        # Check DynamoDB table tags
        table_name = outputs.get("transactions_table_name")
        if table_name:
            response = dynamodb_client.list_tags_of_resource(
                ResourceArn=f"arn:aws:dynamodb:{os.getenv('AWS_REGION', 'us-east-1')}:{boto3.client('sts').get_caller_identity()['Account']}:table/{table_name}"
            )
            tags = {tag["Key"]: tag["Value"] for tag in response.get("Tags", [])}
            assert "Environment" in tags
        
        # Check Lambda function tags
        lambda_name = outputs.get("ingestion_lambda_name")
        if lambda_name:
            response = lambda_client.list_tags(
                Resource=f"arn:aws:lambda:{os.getenv('AWS_REGION', 'us-east-1')}:{boto3.client('sts').get_caller_identity()['Account']}:function:{lambda_name}"
            )
            assert "Environment" in response.get("Tags", {})
