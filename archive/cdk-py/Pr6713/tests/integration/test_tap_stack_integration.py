"""
Integration tests for Payment Processing Stack
These tests verify the deployed infrastructure using ENVIRONMENT_SUFFIX and AWS_REGION
"""
import os
import boto3
import pytest
import json
from decimal import Decimal


# Get environment configuration
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS service clients"""
    return {
        'dynamodb': boto3.resource('dynamodb', region_name=AWS_REGION),
        'lambda_client': boto3.client('lambda', region_name=AWS_REGION),
        'sqs': boto3.client('sqs', region_name=AWS_REGION),
        'sns': boto3.client('sns', region_name=AWS_REGION),
        'apigateway': boto3.client('apigateway', region_name=AWS_REGION),
        'cloudwatch': boto3.client('cloudwatch', region_name=AWS_REGION)
    }


@pytest.fixture(scope="module")
def resource_names():
    """Get expected resource names based on environment suffix"""
    return {
        'dynamodb_table': f'payment-transactions-{ENVIRONMENT_SUFFIX}',
        'payment_queue': f'payment-processing-queue-{ENVIRONMENT_SUFFIX}',
        'payment_dlq': f'payment-processing-dlq-{ENVIRONMENT_SUFFIX}',
        'sns_topic': f'payment-notifications-{ENVIRONMENT_SUFFIX}',
        'process_payment_function': f'process-payment-{ENVIRONMENT_SUFFIX}',
        'process_accounting_function': f'process-accounting-{ENVIRONMENT_SUFFIX}',
        'notify_failures_function': f'notify-failures-{ENVIRONMENT_SUFFIX}',
        'lambda_layer': f'payment-common-libs-{ENVIRONMENT_SUFFIX}'
    }


class TestDynamoDBTable:
    """Test 1: Verify DynamoDB table exists and is functional"""

    def test_dynamodb_table_exists_and_accessible(self, aws_clients, resource_names):
        """Test that DynamoDB table exists and can perform read/write operations"""
        table_name = resource_names['dynamodb_table']
        table = aws_clients['dynamodb'].Table(table_name)

        # Verify table is active
        assert table.table_status == 'ACTIVE'
        assert table.table_name == table_name

        # Test write operation
        test_item = {
            'transaction_id': f'int-test-{ENVIRONMENT_SUFFIX}-001',
            'timestamp': '2025-11-18T12:30:00Z',
            'amount': Decimal('199.99'),
            'currency': 'USD',
            'provider': 'integration-test',
            'status': 'test'
        }

        table.put_item(Item=test_item)

        # Test read operation
        response = table.get_item(
            Key={
                'transaction_id': f'int-test-{ENVIRONMENT_SUFFIX}-001',
                'timestamp': '2025-11-18T12:30:00Z'
            }
        )

        assert 'Item' in response
        assert response['Item']['amount'] == Decimal('199.99')

        # Cleanup
        table.delete_item(
            Key={
                'transaction_id': f'int-test-{ENVIRONMENT_SUFFIX}-001',
                'timestamp': '2025-11-18T12:30:00Z'
            }
        )


class TestLambdaFunctions:
    """Test 2-3: Verify Lambda functions are deployed and configured correctly"""

    def test_process_payment_lambda_exists(self, aws_clients, resource_names):
        """Test that process payment Lambda function exists with correct configuration"""
        function_name = resource_names['process_payment_function']

        response = aws_clients['lambda_client'].get_function(FunctionName=function_name)

        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['Runtime'] == 'python3.11'
        assert response['Configuration']['State'] == 'Active'
        assert response['Configuration']['MemorySize'] == 512
        assert response['Configuration']['Timeout'] == 30

        # Verify environment variables
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'TABLE_NAME' in env_vars
        assert 'QUEUE_URL' in env_vars

    def test_all_lambda_functions_deployed(self, aws_clients, resource_names):
        """Test that all three Lambda functions are deployed and active"""
        function_names = [
            resource_names['process_payment_function'],
            resource_names['process_accounting_function'],
            resource_names['notify_failures_function']
        ]

        for function_name in function_names:
            response = aws_clients['lambda_client'].get_function(FunctionName=function_name)
            assert response['Configuration']['State'] == 'Active'
            assert response['Configuration']['Runtime'] == 'python3.11'


class TestSQSQueues:
    """Test 4-5: Verify SQS queues are functional"""

    def test_payment_queue_exists_and_send_message(self, aws_clients, resource_names):
        """Test that payment processing queue exists and can send/receive messages"""
        queue_name = resource_names['payment_queue']

        # Get queue URL
        response = aws_clients['sqs'].get_queue_url(QueueName=queue_name)
        queue_url = response['QueueUrl']

        assert queue_name in queue_url

        # Send test message
        test_message = json.dumps({
            'transaction_id': f'int-test-sqs-{ENVIRONMENT_SUFFIX}',
            'timestamp': '2025-11-18T12:30:00Z',
            'amount': 250.50,
            'currency': 'USD'
        })

        send_response = aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody=test_message
        )

        assert 'MessageId' in send_response
        assert len(send_response['MessageId']) > 0

        # Receive and cleanup
        receive_response = aws_clients['sqs'].receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5
        )

        if 'Messages' in receive_response:
            for message in receive_response['Messages']:
                aws_clients['sqs'].delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )

    def test_dlq_exists(self, aws_clients, resource_names):
        """Test that dead letter queue exists"""
        dlq_name = resource_names['payment_dlq']

        response = aws_clients['sqs'].get_queue_url(QueueName=dlq_name)
        queue_url = response['QueueUrl']

        assert dlq_name in queue_url

        # Get queue attributes to verify it's configured as DLQ
        attrs = aws_clients['sqs'].get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['QueueArn', 'MessageRetentionPeriod']
        )

        assert 'Attributes' in attrs
        assert 'QueueArn' in attrs['Attributes']


class TestSNSTopic:
    """Test 6: Verify SNS topic exists"""

    def test_sns_topic_exists(self, aws_clients, resource_names):
        """Test that SNS notification topic exists and is accessible"""
        topic_name = resource_names['sns_topic']

        # List topics and find our topic
        response = aws_clients['sns'].list_topics()

        topic_arns = [topic['TopicArn'] for topic in response['Topics']]
        matching_topics = [arn for arn in topic_arns if topic_name in arn]

        assert len(matching_topics) > 0, f"SNS topic {topic_name} not found"

        # Get topic attributes
        topic_arn = matching_topics[0]
        attrs = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)

        assert 'Attributes' in attrs
        assert attrs['Attributes']['TopicArn'] == topic_arn


class TestAPIGateway:
    """Test 7: Verify API Gateway exists"""

    def test_api_gateway_exists(self, aws_clients):
        """Test that API Gateway REST API exists for payment webhooks"""
        # List REST APIs
        response = aws_clients['apigateway'].get_rest_apis()

        api_names = [api['name'] for api in response['items']]

        # Find payment API
        payment_apis = [name for name in api_names if
                       'payment' in name.lower() and ENVIRONMENT_SUFFIX in name]

        assert len(payment_apis) > 0, f"Payment API not found for environment {ENVIRONMENT_SUFFIX}"


class TestLambdaLayer:
    """Test 8: Verify Lambda layer exists"""

    def test_lambda_layer_exists(self, aws_clients, resource_names):
        """Test that Lambda layer for common libraries exists"""
        layer_name = resource_names['lambda_layer']

        # List layer versions
        response = aws_clients['lambda_client'].list_layer_versions(
            LayerName=layer_name
        )

        assert 'LayerVersions' in response
        assert len(response['LayerVersions']) > 0

        latest_version = response['LayerVersions'][0]
        assert latest_version['LayerVersionArn']
        assert 'python3.11' in latest_version['CompatibleRuntimes']

class TestEndToEndWorkflow:
    """Test 10: End-to-end workflow test"""

    def test_complete_payment_workflow(self, aws_clients, resource_names):
        """Test complete payment processing workflow: DynamoDB write -> SQS message"""
        # Step 1: Write to DynamoDB
        table_name = resource_names['dynamodb_table']
        table = aws_clients['dynamodb'].Table(table_name)

        test_txn_id = f'e2e-test-{ENVIRONMENT_SUFFIX}-final'
        test_item = {
            'transaction_id': test_txn_id,
            'timestamp': '2025-11-18T13:00:00Z',
            'amount': Decimal('500.00'),
            'currency': 'USD',
            'provider': 'e2e-test',
            'status': 'processing'
        }

        table.put_item(Item=test_item)

        # Step 2: Verify write succeeded
        response = table.get_item(
            Key={
                'transaction_id': test_txn_id,
                'timestamp': '2025-11-18T13:00:00Z'
            }
        )

        assert 'Item' in response
        assert response['Item']['status'] == 'processing'

        # Step 3: Send message to SQS queue
        queue_name = resource_names['payment_queue']
        queue_response = aws_clients['sqs'].get_queue_url(QueueName=queue_name)
        queue_url = queue_response['QueueUrl']

        message = json.dumps({
            'transaction_id': test_txn_id,
            'timestamp': '2025-11-18T13:00:00Z',
            'amount': 500.00,
            'currency': 'USD'
        })

        send_response = aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody=message
        )

        assert 'MessageId' in send_response

        # Cleanup: Delete DynamoDB item
        table.delete_item(
            Key={
                'transaction_id': test_txn_id,
                'timestamp': '2025-11-18T13:00:00Z'
            }
        )

        # Cleanup: Receive and delete SQS message
        receive_response = aws_clients['sqs'].receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=3
        )

        if 'Messages' in receive_response:
            for msg in receive_response['Messages']:
                aws_clients['sqs'].delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=msg['ReceiptHandle']
                )
