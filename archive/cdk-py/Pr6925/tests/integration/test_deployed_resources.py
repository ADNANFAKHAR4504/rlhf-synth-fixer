"""test_deployed_resources.py - Live integration tests for deployed AWS resources

These tests validate the actual deployed AWS infrastructure by making live API calls.

Requirements:
1. AWS credentials must be configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or AWS profile)
2. Stack must be deployed with outputs in cfn-outputs/flat-outputs.json
3. Appropriate IAM permissions to describe/test the deployed resources

Note: These tests will FAIL if AWS credentials are not configured.
This is expected behavior - integration tests are meant to run in CI/CD
with proper AWS credentials after infrastructure deployment.
"""

import json
import os
import boto3
import pytest
import time
from datetime import datetime, timezone

# Get AWS region from metadata.json
metadata_file = 'metadata.json'
AWS_REGION = 'us-east-1'  # Default region

if os.path.exists(metadata_file):
    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
        AWS_REGION = metadata.get('region', 'us-east-1')

# Initialize AWS clients with region
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
lambda_client = boto3.client('lambda', region_name=AWS_REGION)
sqs = boto3.client('sqs', region_name=AWS_REGION)
s3 = boto3.client('s3', region_name=AWS_REGION)
sns = boto3.client('sns', region_name=AWS_REGION)


@pytest.fixture(scope='session')
def cfn_outputs():
    """Load CloudFormation outputs"""
    outputs_file = 'cfn-outputs/flat-outputs.json'

    if not os.path.exists(outputs_file):
        pytest.skip("CloudFormation outputs not found - stack not deployed")

    with open(outputs_file, 'r', encoding='utf-8') as f:
        return json.load(f)


class TestCoreInfrastructure:
    """Test core infrastructure components are deployed and accessible"""

    def test_dynamodb_table_exists_and_accessible(self, cfn_outputs):
        """Test DynamoDB table exists, is active, and can perform read/write operations"""
        table_name = cfn_outputs['TransactionTableName']
        table = dynamodb.Table(table_name)

        # Verify table is active
        assert table.table_status in ['ACTIVE', 'UPDATING']

        # Verify GSI exists
        gsi_names = [gsi['IndexName'] for gsi in table.global_secondary_indexes or []]
        assert 'StatusIndex' in gsi_names

        # Test write and read
        test_id = f"integration-test-{int(time.time())}"
        test_item = {
            'transactionId': test_id,
            'status': 'TEST',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

        table.put_item(Item=test_item)
        response = table.get_item(Key={'transactionId': test_id})
        assert 'Item' in response
        assert response['Item']['transactionId'] == test_id

        # Cleanup
        table.delete_item(Key={'transactionId': test_id})

    def test_lambda_functions_deployed_and_configured(self, cfn_outputs):
        """Test all three Lambda functions are deployed with correct configuration"""
        functions = [
            ('IngestionFunctionArn', cfn_outputs['IngestionFunctionArn']),
            ('ValidationFunctionArn', cfn_outputs['ValidationFunctionArn']),
            ('EnrichmentFunctionArn', cfn_outputs['EnrichmentFunctionArn'])
        ]

        for name, arn in functions:
            response = lambda_client.get_function(FunctionName=arn)
            config = response['Configuration']

            # Verify runtime and configuration
            assert config['Runtime'] == 'python3.9', f"{name} has incorrect runtime"
            assert config['MemorySize'] == 512, f"{name} has incorrect memory"
            assert config['Timeout'] == 60, f"{name} has incorrect timeout"
            assert config['TracingConfig']['Mode'] == 'Active', f"{name} X-Ray not enabled"

            # Verify environment variables for ingestion function
            if 'Ingestion' in name:
                env_vars = config.get('Environment', {}).get('Variables', {})
                required_vars = ['DYNAMODB_TABLE_NAME', 'ENVIRONMENT_SUFFIX',
                                'SNS_TOPIC_ARN', 'OUTPUT_QUEUE_URL']
                for var in required_vars:
                    assert var in env_vars, f"Missing env var {var} in {name}"


class TestMessagingInfrastructure:
    """Test SQS queues and SNS topics"""

    def test_sqs_queues_configured(self, cfn_outputs):
        """Test SQS queues are properly configured with encryption and DLQ"""
        queues = [
            cfn_outputs['IngestionQueueUrl'],
            cfn_outputs['ValidationQueueUrl']
        ]

        for queue_url in queues:
            response = sqs.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            attrs = response['Attributes']

            # Verify configuration
            assert int(attrs['VisibilityTimeout']) == 300
            assert 'KmsMasterKeyId' in attrs  # Encryption enabled
            assert 'RedrivePolicy' in attrs  # DLQ configured

            # Verify DLQ maxReceiveCount
            redrive_policy = json.loads(attrs['RedrivePolicy'])
            assert redrive_policy['maxReceiveCount'] == 3

    def test_sqs_message_flow(self, cfn_outputs):
        """Test sending and receiving messages through SQS queue"""
        queue_url = cfn_outputs['IngestionQueueUrl']

        # Send message
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

        # Cleanup
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=response['Messages'][0]['ReceiptHandle']
        )

    def test_sns_topic_exists(self, cfn_outputs):
        """Test SNS failure notification topic exists"""
        topic_arn = cfn_outputs['FailureTopicArn']

        response = sns.get_topic_attributes(TopicArn=topic_arn)
        assert 'Attributes' in response
        assert len(response['Attributes']['DisplayName']) > 0


class TestAPIGateway:
    """Test API Gateway endpoint"""

    def test_api_endpoint_format(self, cfn_outputs):
        """Test API endpoint is properly configured"""
        api_endpoint = cfn_outputs['ApiEndpoint']

        # Verify endpoint format
        assert api_endpoint.startswith('https://'), "API must use HTTPS"
        assert 'execute-api' in api_endpoint, "Must be API Gateway endpoint"
        assert AWS_REGION in api_endpoint, "Must be in correct region"
        assert 'amazonaws.com' in api_endpoint, "Must be AWS domain"


class TestEndToEndFlow:
    """Test end-to-end workflows"""

    def test_lambda_invocation_end_to_end(self, cfn_outputs):
        """Test invoking Lambda function with transaction payload"""
        function_arn = cfn_outputs['IngestionFunctionArn']

        test_payload = {
            'transactionId': f'e2e-test-{int(time.time())}',
            'source': 'api',
            'data': {
                'amount': 100.00,
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

    def test_s3_upload_and_cleanup(self, cfn_outputs):
        """Test S3 upload and cleanup operations"""
        bucket_name = cfn_outputs['TransactionBucketName']

        # Upload test file
        test_key = f'test/integration-{int(time.time())}.json'
        test_content = json.dumps({'test': 'data', 'timestamp': time.time()})

        s3.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content
        )

        # Verify upload
        response = s3.get_object(Bucket=bucket_name, Key=test_key)
        content = response['Body'].read().decode('utf-8')
        assert content == test_content

        # Cleanup
        s3.delete_object(Bucket=bucket_name, Key=test_key)
