import json
import os
import boto3
import pytest
import time
from decimal import Decimal


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from deployment"""
    outputs_file = "cfn-outputs/flat-outputs.json"

    if not os.path.exists(outputs_file):
        pytest.skip(f"Stack outputs file not found: {outputs_file}")

    with open(outputs_file, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS service clients"""
    return {
        'dynamodb': boto3.resource('dynamodb', region_name='us-east-1'),
        'lambda': boto3.client('lambda', region_name='us-east-1'),
        'sqs': boto3.client('sqs', region_name='us-east-1'),
        'sns': boto3.client('sns', region_name='us-east-1'),
        'apigateway': boto3.client('apigateway', region_name='us-east-1')
    }


class TestDynamoDBIntegration:
    """Integration tests for DynamoDB table"""

    def test_dynamodb_table_exists(self, stack_outputs, aws_clients):
        """Test that DynamoDB table exists and is accessible"""
        table_name = stack_outputs['DynamoDBTableName']
        table = aws_clients['dynamodb'].Table(table_name)

        # Verify table exists by checking its status
        assert table.table_status in ['ACTIVE', 'UPDATING']

    def test_dynamodb_table_schema(self, stack_outputs, aws_clients):
        """Test DynamoDB table has correct schema"""
        table_name = stack_outputs['DynamoDBTableName']
        table = aws_clients['dynamodb'].Table(table_name)

        # Check key schema
        key_schema = {key['AttributeName']: key['KeyType'] for key in table.key_schema}
        assert 'transaction_id' in key_schema
        assert key_schema['transaction_id'] == 'HASH'
        assert 'timestamp' in key_schema
        assert key_schema['timestamp'] == 'RANGE'

    def test_dynamodb_write_read(self, stack_outputs, aws_clients):
        """Test writing to and reading from DynamoDB"""
        table_name = stack_outputs['DynamoDBTableName']
        table = aws_clients['dynamodb'].Table(table_name)

        # Write test item
        test_item = {
            'transaction_id': 'test-txn-12345',
            'timestamp': '2025-11-17T21:00:00Z',
            'amount': Decimal('100.50'),
            'currency': 'USD',
            'provider': 'test-provider',
            'status': 'test'
        }

        table.put_item(Item=test_item)

        # Read it back
        response = table.get_item(
            Key={
                'transaction_id': 'test-txn-12345',
                'timestamp': '2025-11-17T21:00:00Z'
            }
        )

        assert 'Item' in response
        assert response['Item']['transaction_id'] == 'test-txn-12345'
        assert response['Item']['amount'] == Decimal('100.50')

        # Cleanup
        table.delete_item(
            Key={
                'transaction_id': 'test-txn-12345',
                'timestamp': '2025-11-17T21:00:00Z'
            }
        )


class TestLambdaIntegration:
    """Integration tests for Lambda functions"""

    def test_process_payment_function_exists(self, stack_outputs, aws_clients):
        """Test that process payment Lambda function exists"""
        function_name = stack_outputs['ProcessPaymentFunctionName']
        response = aws_clients['lambda'].get_function(FunctionName=function_name)

        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['Runtime'] == 'python3.11'

    def test_process_accounting_function_exists(self, stack_outputs, aws_clients):
        """Test that process accounting Lambda function exists"""
        function_name = stack_outputs['ProcessAccountingFunctionName']
        response = aws_clients['lambda'].get_function(FunctionName=function_name)

        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['Runtime'] == 'python3.11'

    def test_notify_failures_function_exists(self, stack_outputs, aws_clients):
        """Test that notify failures Lambda function exists"""
        function_name = stack_outputs['NotifyFailuresFunctionName']
        response = aws_clients['lambda'].get_function(FunctionName=function_name)

        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['Runtime'] == 'python3.11'


class TestSQSIntegration:
    """Integration tests for SQS queues"""

    def test_sqs_queue_exists(self, stack_outputs, aws_clients):
        """Test that SQS queue exists and is accessible"""
        queue_url = stack_outputs['SQSQueueUrl']
        response = aws_clients['sqs'].get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['QueueArn', 'VisibilityTimeout']
        )

        assert 'Attributes' in response
        assert 'QueueArn' in response['Attributes']

    def test_sqs_send_receive_message(self, stack_outputs, aws_clients):
        """Test sending and receiving messages from SQS"""
        queue_url = stack_outputs['SQSQueueUrl']

        # Send test message
        test_message = json.dumps({
            'transaction_id': 'test-txn-sqs-001',
            'timestamp': '2025-11-17T21:00:00Z',
            'amount': 50.0,
            'currency': 'USD',
            'provider': 'test'
        })

        send_response = aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody=test_message
        )

        assert 'MessageId' in send_response

        # Receive message
        receive_response = aws_clients['sqs'].receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=2
        )

        # Clean up by deleting the message if received
        if 'Messages' in receive_response:
            for message in receive_response['Messages']:
                aws_clients['sqs'].delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )


class TestSNSIntegration:
    """Integration tests for SNS topic"""

    def test_sns_topic_exists(self, stack_outputs, aws_clients):
        """Test that SNS topic exists and is accessible"""
        topic_arn = stack_outputs['SNSTopicArn']
        response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)

        assert 'Attributes' in response
        assert response['Attributes']['TopicArn'] == topic_arn


class TestAPIGatewayIntegration:
    """Integration tests for API Gateway"""

    def test_api_gateway_exists(self, stack_outputs, aws_clients):
        """Test that API Gateway exists and is accessible"""
        api_id = stack_outputs['ApiGatewayId']
        response = aws_clients['apigateway'].get_rest_api(restApiId=api_id)

        assert response['id'] == api_id
        assert 'name' in response

    def test_api_gateway_url_accessible(self, stack_outputs):
        """Test that API Gateway URL is properly formatted"""
        api_url = stack_outputs['ApiGatewayUrl']

        assert api_url.startswith('https://')
        assert 'execute-api' in api_url
        assert 'us-east-1.amazonaws.com' in api_url
        assert api_url.endswith('/prod/')


class TestEndToEndWorkflow:
    """End-to-end integration tests for the complete payment processing workflow"""

    def test_payment_workflow_integration(self, stack_outputs, aws_clients):
        """Test complete payment processing workflow"""
        table_name = stack_outputs['DynamoDBTableName']
        queue_url = stack_outputs['SQSQueueUrl']

        # Simulate payment processing
        test_transaction_id = f'e2e-test-{int(time.time())}'
        test_timestamp = '2025-11-17T21:30:00Z'

        # Step 1: Write to DynamoDB (simulating process_payment function)
        table = aws_clients['dynamodb'].Table(table_name)
        table.put_item(Item={
            'transaction_id': test_transaction_id,
            'timestamp': test_timestamp,
            'amount': Decimal('250.75'),
            'currency': 'USD',
            'provider': 'e2e-test-provider',
            'status': 'received'
        })

        # Step 2: Verify data in DynamoDB
        response = table.get_item(
            Key={
                'transaction_id': test_transaction_id,
                'timestamp': test_timestamp
            }
        )
        assert 'Item' in response
        assert response['Item']['status'] == 'received'

        # Step 3: Send message to SQS (simulating process_payment to accounting queue)
        sqs_message = json.dumps({
            'transaction_id': test_transaction_id,
            'timestamp': test_timestamp,
            'amount': 250.75,
            'currency': 'USD',
            'provider': 'e2e-test-provider'
        })

        aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody=sqs_message
        )

        # Step 4: Verify message can be received from SQS
        receive_response = aws_clients['sqs'].receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=3
        )

        if 'Messages' in receive_response:
            message = receive_response['Messages'][0]
            message_body = json.loads(message['Body'])
            assert message_body['transaction_id'] == test_transaction_id

            # Cleanup: Delete message
            aws_clients['sqs'].delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=message['ReceiptHandle']
            )

        # Cleanup: Delete DynamoDB item
        table.delete_item(
            Key={
                'transaction_id': test_transaction_id,
                'timestamp': test_timestamp
            }
        )


class TestResourceNaming:
    """Integration tests to verify resource naming conventions"""

    def test_all_resources_have_environment_suffix(self, stack_outputs):
        """Test that all resource names include environment suffix"""
        # Extract expected suffix from one of the resources
        table_name = stack_outputs['DynamoDBTableName']
        suffix = table_name.split('-')[-1]

        # Verify all named resources include the suffix
        named_outputs = {
            'DynamoDBTableName': stack_outputs['DynamoDBTableName'],
            'ProcessPaymentFunctionName': stack_outputs['ProcessPaymentFunctionName'],
            'ProcessAccountingFunctionName': stack_outputs['ProcessAccountingFunctionName'],
            'NotifyFailuresFunctionName': stack_outputs['NotifyFailuresFunctionName']
        }

        for resource_name, resource_value in named_outputs.items():
            assert suffix in resource_value, \
                f"Resource {resource_name} ({resource_value}) missing environment suffix {suffix}"
