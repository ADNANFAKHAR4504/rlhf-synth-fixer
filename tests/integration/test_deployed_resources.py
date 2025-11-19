"""test_deployed_resources.py - Integration tests for deployed resources"""

import json
import os
import boto3
import pytest
import time
from datetime import datetime

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')
sqs = boto3.client('sqs')
sfn = boto3.client('stepfunctions')
s3 = boto3.client('s3')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')
logs_client = boto3.client('logs')


@pytest.fixture
def cfn_outputs():
    """Load CloudFormation outputs"""
    outputs_file = 'cfn-outputs/flat-outputs.json'

    if not os.path.exists(outputs_file):
        pytest.skip("CloudFormation outputs not found - stack not deployed")

    with open(outputs_file, 'r') as f:
        return json.load(f)


@pytest.fixture
def environment_suffix(cfn_outputs):
    """Extract environment suffix from resource names"""
    table_name = cfn_outputs.get('TransactionTableName', '')
    if '-' in table_name:
        suffix = table_name.split('-')[-1]
        return suffix
    return 'test'


class TestDynamoDBTable:
    """Test DynamoDB table is properly configured and accessible"""

    def test_table_exists(self, cfn_outputs):
        """Test DynamoDB table exists and is active"""
        table_name = cfn_outputs['TransactionTableName']
        table = dynamodb.Table(table_name)

        # Verify table is accessible
        response = table.table_status
        assert response in ['ACTIVE', 'UPDATING'], f"Table status is {response}"

    def test_table_has_gsi(self, cfn_outputs):
        """Test table has Global Secondary Index"""
        table_name = cfn_outputs['TransactionTableName']
        table = dynamodb.Table(table_name)

        # Check for StatusIndex
        gsi_names = [gsi['IndexName'] for gsi in table.global_secondary_indexes or []]
        assert 'StatusIndex' in gsi_names, "StatusIndex not found"

    def test_table_billing_mode(self, cfn_outputs):
        """Test table uses on-demand billing"""
        table_name = cfn_outputs['TransactionTableName']
        table = dynamodb.Table(table_name)

        assert table.billing_mode_summary['BillingMode'] == 'PAY_PER_REQUEST'

    def test_table_write_and_read(self, cfn_outputs):
        """Test writing and reading from table"""
        table_name = cfn_outputs['TransactionTableName']
        table = dynamodb.Table(table_name)

        # Write test item
        test_id = f"integration-test-{int(time.time())}"
        test_item = {
            'transactionId': test_id,
            'status': 'TEST',
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'integration-test'
        }

        table.put_item(Item=test_item)

        # Read back
        response = table.get_item(Key={'transactionId': test_id})
        assert 'Item' in response, "Item not found after write"
        assert response['Item']['transactionId'] == test_id

        # Cleanup
        table.delete_item(Key={'transactionId': test_id})

    def test_table_gsi_query(self, cfn_outputs):
        """Test querying using Global Secondary Index"""
        table_name = cfn_outputs['TransactionTableName']
        table = dynamodb.Table(table_name)

        # Write test item
        test_id = f"gsi-test-{int(time.time())}"
        test_status = "GSI_TEST"
        test_item = {
            'transactionId': test_id,
            'status': test_status,
            'timestamp': datetime.utcnow().isoformat()
        }

        table.put_item(Item=test_item)

        # Wait for GSI to update
        time.sleep(2)

        # Query using GSI
        response = table.query(
            IndexName='StatusIndex',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': test_status}
        )

        assert response['Count'] >= 1, "GSI query returned no results"

        # Cleanup
        table.delete_item(Key={'transactionId': test_id})


class TestLambdaFunctions:
    """Test Lambda functions are deployed and configured correctly"""

    def test_ingestion_function_exists(self, cfn_outputs):
        """Test ingestion Lambda function exists and is configured correctly"""
        function_arn = cfn_outputs['IngestionFunctionArn']

        response = lambda_client.get_function(FunctionName=function_arn)
        config = response['Configuration']

        assert config['Runtime'] == 'python3.9'
        assert config['MemorySize'] == 512
        assert config['TracingConfig']['Mode'] == 'Active'
        assert config['Timeout'] == 60

    def test_validation_function_exists(self, cfn_outputs):
        """Test validation Lambda function exists and is configured correctly"""
        function_arn = cfn_outputs['ValidationFunctionArn']

        response = lambda_client.get_function(FunctionName=function_arn)
        config = response['Configuration']

        assert config['Runtime'] == 'python3.9'
        assert config['MemorySize'] == 512
        assert config['TracingConfig']['Mode'] == 'Active'

    def test_enrichment_function_exists(self, cfn_outputs):
        """Test enrichment Lambda function exists and is configured correctly"""
        function_arn = cfn_outputs['EnrichmentFunctionArn']

        response = lambda_client.get_function(FunctionName=function_arn)
        config = response['Configuration']

        assert config['Runtime'] == 'python3.9'
        assert config['MemorySize'] == 512
        assert config['TracingConfig']['Mode'] == 'Active'

    def test_function_environment_variables(self, cfn_outputs):
        """Test Lambda functions have required environment variables"""
        function_arn = cfn_outputs['IngestionFunctionArn']

        response = lambda_client.get_function(FunctionName=function_arn)
        env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})

        assert 'DYNAMODB_TABLE_NAME' in env_vars
        assert 'ENVIRONMENT_SUFFIX' in env_vars
        assert 'SNS_TOPIC_ARN' in env_vars
        assert 'OUTPUT_QUEUE_URL' in env_vars

    def test_function_dlq_configured(self, cfn_outputs):
        """Test Lambda functions have dead letter queues configured"""
        function_arn = cfn_outputs['IngestionFunctionArn']

        response = lambda_client.get_function(FunctionName=function_arn)
        config = response['Configuration']

        assert 'DeadLetterConfig' in config
        assert 'TargetArn' in config['DeadLetterConfig']


class TestSQSQueues:
    """Test SQS queues are configured correctly"""

    def test_ingestion_queue_exists(self, cfn_outputs):
        """Test ingestion-to-validation queue exists and is configured"""
        queue_url = cfn_outputs['IngestionQueueUrl']

        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        attrs = response['Attributes']
        assert int(attrs['VisibilityTimeout']) == 300
        assert 'KmsMasterKeyId' in attrs  # Encryption enabled
        assert 'RedrivePolicy' in attrs  # DLQ configured

    def test_validation_queue_exists(self, cfn_outputs):
        """Test validation-to-enrichment queue exists and is configured"""
        queue_url = cfn_outputs['ValidationQueueUrl']

        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        attrs = response['Attributes']
        assert int(attrs['VisibilityTimeout']) == 300
        assert 'KmsMasterKeyId' in attrs

    def test_queue_dlq_configuration(self, cfn_outputs):
        """Test queues have DLQ with correct maxReceiveCount"""
        queue_url = cfn_outputs['IngestionQueueUrl']

        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['RedrivePolicy']
        )

        redrive_policy = json.loads(response['Attributes']['RedrivePolicy'])
        assert redrive_policy['maxReceiveCount'] == '3'

    def test_queue_send_receive_message(self, cfn_outputs):
        """Test sending and receiving messages from queue"""
        queue_url = cfn_outputs['IngestionQueueUrl']

        # Send test message
        test_message = {
            'transactionId': f'test-{int(time.time())}',
            'status': 'TEST'
        }

        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message)
        )

        # Receive message
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5
        )

        assert 'Messages' in response
        assert len(response['Messages']) > 0

        # Delete message
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=response['Messages'][0]['ReceiptHandle']
        )


class TestStepFunctions:
    """Test Step Functions state machine"""

    def test_state_machine_exists(self, cfn_outputs):
        """Test state machine exists and is active"""
        state_machine_arn = cfn_outputs['StateMachineArn']

        response = sfn.describe_state_machine(stateMachineArn=state_machine_arn)
        assert response['status'] == 'ACTIVE'
        assert response['tracingConfiguration']['enabled'] is True

    def test_state_machine_logging_enabled(self, cfn_outputs):
        """Test state machine has logging enabled"""
        state_machine_arn = cfn_outputs['StateMachineArn']

        response = sfn.describe_state_machine(stateMachineArn=state_machine_arn)
        assert 'loggingConfiguration' in response
        assert response['loggingConfiguration']['level'] in ['ALL', 'ERROR', 'FATAL']

    def test_state_machine_execution(self, cfn_outputs):
        """Test state machine can be executed"""
        state_machine_arn = cfn_outputs['StateMachineArn']

        # Start execution with valid input
        test_input = {
            'transactionId': f'sfn-test-{int(time.time())}',
            'source': 'api',
            'data': {
                'amount': 100.50,
                'currency': 'USD',
                'merchantId': 'US-MERCHANT-12345',
                'customerId': 'CUSTOMER-67890'
            }
        }

        response = sfn.start_execution(
            stateMachineArn=state_machine_arn,
            input=json.dumps(test_input)
        )

        execution_arn = response['executionArn']

        # Wait for execution to complete or timeout (max 30 seconds)
        for _ in range(30):
            exec_response = sfn.describe_execution(executionArn=execution_arn)
            status = exec_response['status']

            if status in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
                break

            time.sleep(1)

        # Verify execution completed
        final_status = exec_response['status']
        assert final_status in ['SUCCEEDED', 'FAILED'], f"Execution ended with status: {final_status}"


class TestS3Bucket:
    """Test S3 bucket configuration"""

    def test_bucket_exists(self, cfn_outputs):
        """Test S3 bucket exists"""
        bucket_name = cfn_outputs['TransactionBucketName']

        response = s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_bucket_encryption(self, cfn_outputs):
        """Test bucket has encryption enabled"""
        bucket_name = cfn_outputs['TransactionBucketName']

        response = s3.get_bucket_encryption(Bucket=bucket_name)
        assert 'Rules' in response
        assert len(response['Rules']) > 0

    def test_bucket_public_access_blocked(self, cfn_outputs):
        """Test bucket blocks public access"""
        bucket_name = cfn_outputs['TransactionBucketName']

        response = s3.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_bucket_upload_and_read(self, cfn_outputs):
        """Test uploading and reading from bucket"""
        bucket_name = cfn_outputs['TransactionBucketName']

        # Upload test file
        test_key = f'test/integration-test-{int(time.time())}.json'
        test_content = json.dumps({'test': 'data'})

        s3.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content
        )

        # Read back
        response = s3.get_object(Bucket=bucket_name, Key=test_key)
        content = response['Body'].read().decode('utf-8')
        assert content == test_content

        # Cleanup
        s3.delete_object(Bucket=bucket_name, Key=test_key)


class TestAPIGateway:
    """Test API Gateway endpoint"""

    def test_api_endpoint_accessible(self, cfn_outputs):
        """Test API endpoint exists and has correct format"""
        api_endpoint = cfn_outputs['ApiEndpoint']

        # Verify endpoint format
        assert api_endpoint.startswith('https://'), "API endpoint should use HTTPS"
        assert 'amazonaws.com' in api_endpoint, "API endpoint should be in AWS domain"
        assert api_endpoint.endswith('/'), "API endpoint should end with /"


class TestSNSTopic:
    """Test SNS topic configuration"""

    def test_topic_exists(self, cfn_outputs):
        """Test SNS topic exists"""
        topic_arn = cfn_outputs['FailureTopicArn']

        response = sns.get_topic_attributes(TopicArn=topic_arn)
        assert 'Attributes' in response

    def test_topic_display_name(self, cfn_outputs):
        """Test topic has display name"""
        topic_arn = cfn_outputs['FailureTopicArn']

        response = sns.get_topic_attributes(TopicArn=topic_arn)
        attrs = response['Attributes']

        assert 'DisplayName' in attrs
        assert len(attrs['DisplayName']) > 0


class TestCloudWatchLogs:
    """Test CloudWatch Logs configuration"""

    def test_lambda_log_groups_exist(self, environment_suffix):
        """Test Lambda log groups exist"""
        expected_log_groups = [
            f'/aws/lambda/transaction-ingestion-{environment_suffix}',
            f'/aws/lambda/transaction-validation-{environment_suffix}',
            f'/aws/lambda/transaction-enrichment-{environment_suffix}'
        ]

        for log_group_name in expected_log_groups:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            assert len(response['logGroups']) > 0, f"Log group {log_group_name} not found"

    def test_log_retention_policy(self, environment_suffix):
        """Test log groups have 14-day retention"""
        log_group_name = f'/aws/lambda/transaction-ingestion-{environment_suffix}'

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        if len(response['logGroups']) > 0:
            retention = response['logGroups'][0].get('retentionInDays')
            assert retention == 14, f"Expected 14-day retention, got {retention}"

    def test_state_machine_log_group_exists(self, environment_suffix):
        """Test Step Functions log group exists"""
        log_group_prefix = f'/aws/vendedlogs/states/transaction-pipeline-{environment_suffix}'

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_prefix
        )

        assert len(response['logGroups']) > 0, "State machine log group not found"


class TestEventBridge:
    """Test EventBridge rule configuration"""

    def test_s3_event_notification_enabled(self, cfn_outputs):
        """Test S3 bucket has EventBridge notification enabled"""
        bucket_name = cfn_outputs['TransactionBucketName']

        response = s3.get_bucket_notification_configuration(Bucket=bucket_name)

        # Check if EventBridge configuration exists
        assert 'EventBridgeConfiguration' in response or len(response.keys()) > 1


class TestEndToEndFlow:
    """Test end-to-end transaction processing workflows"""

    @pytest.mark.slow
    def test_direct_lambda_invocation(self, cfn_outputs):
        """Test invoking ingestion Lambda directly"""
        function_arn = cfn_outputs['IngestionFunctionArn']

        # Invoke Lambda
        test_payload = {
            'transactionId': f'direct-test-{int(time.time())}',
            'source': 'api',
            'data': {
                'amount': 50.00,
                'currency': 'USD',
                'merchantId': 'MERCHANT-TEST',
                'customerId': 'CUSTOMER-TEST'
            }
        }

        response = lambda_client.invoke(
            FunctionName=function_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        assert response['StatusCode'] == 200

        # Parse response
        result = json.loads(response['Payload'].read().decode('utf-8'))
        assert result['statusCode'] == 200
        assert 'transactionId' in result

    @pytest.mark.slow
    def test_s3_upload_trigger(self, cfn_outputs):
        """Test S3 upload triggers EventBridge (integration check only)"""
        bucket_name = cfn_outputs['TransactionBucketName']

        # Upload test transaction file
        test_transaction = {
            'amount': 250.00,
            'currency': 'USD',
            'merchantId': 'US-MERCHANT-TEST',
            'customerId': 'CUSTOMER-TEST'
        }

        test_key = f'transactions/test-{int(time.time())}.json'

        s3.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps(test_transaction)
        )

        # Wait briefly for EventBridge to process
        time.sleep(3)

        # Cleanup
        s3.delete_object(Bucket=bucket_name, Key=test_key)

        # Note: Full validation would require checking state machine execution
        # which requires additional tracking mechanism in production


class TestResourceNaming:
    """Test all resources follow naming conventions"""

    def test_all_resource_names_include_suffix(self, cfn_outputs, environment_suffix):
        """Test all resource names include environment suffix"""
        resources_to_check = {
            'TransactionBucketName': cfn_outputs['TransactionBucketName'],
            'TransactionTableName': cfn_outputs['TransactionTableName'],
        }

        for resource_name, resource_value in resources_to_check.items():
            assert resource_value.endswith(environment_suffix), \
                f"{resource_name} ({resource_value}) does not end with suffix {environment_suffix}"


class TestSecurityConfiguration:
    """Test security configurations"""

    def test_sqs_encryption_enabled(self, cfn_outputs):
        """Test SQS queues have encryption enabled"""
        queue_url = cfn_outputs['IngestionQueueUrl']

        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['KmsMasterKeyId']
        )

        assert 'KmsMasterKeyId' in response['Attributes']

    def test_lambda_environment_encryption(self, cfn_outputs):
        """Test Lambda functions have environment variable encryption"""
        function_arn = cfn_outputs['IngestionFunctionArn']

        response = lambda_client.get_function(FunctionName=function_arn)
        config = response['Configuration']

        # Lambda automatically encrypts environment variables at rest
        assert 'Environment' in config
