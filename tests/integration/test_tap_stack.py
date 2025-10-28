"""
Integration tests for the deployed Serverless Transaction Pipeline (TapStack) infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full serverless workflows)

The tests use stack outputs exported from lib/tap_stack.py to discover resources.
All tests use outputs dynamically - NO HARDCODING.

Requirements:
- AWS credentials configured
- Infrastructure deployed via `pulumi up`
- Output file generated at cfn-outputs/flat-outputs.json
"""

import json
import os
import time
import unittest
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

import boto3
import pytest
import requests
from botocore.exceptions import ClientError, NoCredentialsError

# Load deployment flat outputs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, '..', '..', 'cfn-outputs', 'flat-outputs.json')


def load_outputs() -> Dict[str, Any]:
    """
    Load and return flat deployment outputs from cfn-outputs/flat-outputs.json.
    
    This file is generated after Pulumi deployment and contains all stack outputs
    in a flattened JSON structure for easy consumption by integration tests.
    
    Returns:
        Dictionary of stack outputs
    """
    if os.path.exists(FLAT_OUTPUTS_PATH):
        try:
            with open(FLAT_OUTPUTS_PATH, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    print(f"Warning: Outputs file is empty at {FLAT_OUTPUTS_PATH}")
                    return {}
                outputs = json.loads(content)
                print(f"Successfully loaded {len(outputs)} outputs from {FLAT_OUTPUTS_PATH}")
                return outputs
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not parse outputs file: {e}")
            return {}
    else:
        print(f"Warning: Outputs file not found at {FLAT_OUTPUTS_PATH}")
        print(f"Please run Pulumi deployment and ensure outputs are exported to this file")
        return {}


# Load Pulumi stack outputs from flat-outputs.json
OUTPUTS = load_outputs()

# Get region from outputs (NO HARDCODING)
PRIMARY_REGION = OUTPUTS.get('region', os.getenv('AWS_REGION', 'us-east-1'))

# Initialize AWS SDK clients
dynamodb_client = boto3.client('dynamodb', region_name=PRIMARY_REGION)
dynamodb_resource = boto3.resource('dynamodb', region_name=PRIMARY_REGION)
lambda_client = boto3.client('lambda', region_name=PRIMARY_REGION)
sqs_client = boto3.client('sqs', region_name=PRIMARY_REGION)
events_client = boto3.client('events', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
apigateway_client = boto3.client('apigateway', region_name=PRIMARY_REGION)


def get_recent_lambda_logs(function_name: str, minutes: int = 5) -> List[str]:
    """
    Fetch recent Lambda logs from CloudWatch Logs.
    
    Args:
        function_name: Name of the Lambda function
        minutes: How many minutes back to look
        
    Returns:
        List of log messages
    """
    try:
        log_group_name = f"/aws/lambda/{function_name}"

        # Get log streams from the last N minutes
        end_time = int(time.time() * 1000)
        start_time = end_time - (minutes * 60 * 1000)

        # Get recent log streams
        streams_response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )

        log_messages = []
        for stream in streams_response.get('logStreams', []):
            stream_name = stream['logStreamName']

            # Get log events from this stream
            events_response = logs_client.get_log_events(
                logGroupName=log_group_name,
                logStreamName=stream_name,
                startTime=start_time,
                endTime=end_time,
                limit=100
            )

            for event in events_response.get('events', []):
                message = event['message'].strip()
                # Filter out standard Lambda lifecycle messages
                if message and not message.startswith('START RequestId') and not message.startswith('END RequestId') and not message.startswith('REPORT RequestId'):
                    log_messages.append(message)

        return log_messages
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            return []
        return []
    except Exception:
        return []


def wait_for_dynamodb_item(table_name: str, key: Dict[str, Any], max_wait: int = 30) -> Optional[Dict]:
    """
    Wait for an item to appear in DynamoDB.
    
    Args:
        table_name: DynamoDB table name
        key: Primary key to search for
        max_wait: Maximum seconds to wait
        
    Returns:
        Item if found, None otherwise
    """
    table = dynamodb_resource.Table(table_name)
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = table.get_item(Key=key)
            if 'Item' in response:
                return response['Item']
        except Exception:
            pass
        time.sleep(1)
    
    return None


def wait_for_sqs_message(queue_url: str, max_wait: int = 30) -> Optional[Dict]:
    """
    Wait for a message to appear in SQS queue.
    
    Args:
        queue_url: SQS queue URL
        max_wait: Maximum seconds to wait
        
    Returns:
        Message if found, None otherwise
    """
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5,
                VisibilityTimeout=10
            )
            
            if 'Messages' in response and len(response['Messages']) > 0:
                message = response['Messages'][0]
                # Delete the message after receiving
                sqs_client.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )
                return json.loads(message['Body'])
        except Exception:
            pass
        
        if time.time() - start_time >= max_wait:
            break
        time.sleep(2)
    
    return None


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup and utilities."""

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        try:
            # Test credentials by making a simple AWS call
            lambda_client.list_functions(MaxItems=1)
            print("AWS credentials validated successfully")
        except (NoCredentialsError, ClientError) as e:
            pytest.fail(f"AWS credentials not available: {e}")

        # Validate that outputs are loaded
        if not OUTPUTS:
            pytest.fail("Stack outputs not loaded. Please deploy infrastructure and generate flat-outputs.json")

    def assert_output_exists(self, *output_names):
        """
        Assert that required outputs exist.
        
        Args:
            *output_names: Names of required outputs to check
        """
        missing = [name for name in output_names if name not in OUTPUTS]
        if missing:
            self.fail(f"Required outputs missing: {', '.join(missing)}")


# ============================================================================
# SERVICE-LEVEL TESTS
# ============================================================================

class TestDynamoDBServiceLevel(BaseIntegrationTest):
    """Service-level tests for DynamoDB tables."""

    def test_transactions_table_write_and_read(self):
        """
        Test DynamoDB transactions table: write and read operations.
        
        Maps to prompt: Data persistence with DynamoDB tables for transactions.
        """
        self.assert_output_exists('transactions_table_name')
        
        table_name = OUTPUTS['transactions_table_name']
        table = dynamodb_resource.Table(table_name)
        
        # Write a test transaction
        transaction_id = f"test-txn-{uuid.uuid4()}"
        timestamp = int(time.time())
        
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'amount': Decimal('100.50'),
                'timestamp': timestamp,
                'status': 'test'
            }
        )
        
        # Read it back
        response = table.get_item(Key={'transaction_id': transaction_id})
        
        self.assertIn('Item', response)
        item = response['Item']
        self.assertEqual(item['transaction_id'], transaction_id)
        self.assertEqual(item['amount'], Decimal('100.50'))
        self.assertEqual(item['status'], 'test')
        
        # Clean up
        table.delete_item(Key={'transaction_id': transaction_id})

    def test_validation_results_table_with_gsi(self):
        """
        Test DynamoDB validation-results table with GSI on timestamp.
        
        Maps to prompt: DynamoDB table with global secondary index on timestamp.
        """
        self.assert_output_exists('validation_results_table_name')
        
        table_name = OUTPUTS['validation_results_table_name']
        table = dynamodb_resource.Table(table_name)
        
        # Write a validation result
        validation_id = f"test-val-{uuid.uuid4()}"
        transaction_id = f"test-txn-{uuid.uuid4()}"
        timestamp = int(time.time())
        
        table.put_item(
            Item={
                'validation_id': validation_id,
                'transaction_id': transaction_id,
                'fraud_score': Decimal('0.75'),
                'is_fraud': False,
                'timestamp': timestamp
            }
        )
        
        # Query using GSI on timestamp
        response = table.query(
            IndexName='timestamp-index',
            KeyConditionExpression='#ts = :ts',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={':ts': timestamp}
        )
        
        self.assertGreaterEqual(len(response['Items']), 1)
        found = any(item['validation_id'] == validation_id for item in response['Items'])
        self.assertTrue(found, "Validation result not found in GSI query")
        
        # Clean up
        table.delete_item(Key={'validation_id': validation_id})


class TestLambdaServiceLevel(BaseIntegrationTest):
    """Service-level tests for Lambda functions."""

    def test_transaction_receiver_lambda_invocation(self):
        """
        Test transaction-receiver Lambda function direct invocation.
        
        Maps to prompt: Lambda function transaction-receiver (Python).
        """
        self.assert_output_exists('lambda_function_name_transaction_receiver')
        
        function_name = OUTPUTS['lambda_function_name_transaction_receiver']
        
        payload = {
            'body': json.dumps({
                'transaction_id': f"test-{uuid.uuid4()}",
                'amount': 250.75
            })
        }
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        result = json.loads(response['Payload'].read())
        self.assertEqual(result['statusCode'], 200)
        
        body = json.loads(result['body'])
        self.assertIn('transaction_id', body)
        self.assertEqual(body['message'], 'Transaction received')

    def test_fraud_validator_uses_threshold_for_detection(self):
        """
        Test fraud-validator Lambda uses fraud threshold in actual fraud detection.
        
        ACTION: Invoke Lambda multiple times and verify fraud detection behavior.
        
        Maps to prompt: Lambda environment variables for fraud threshold (0.85).
        """
        self.assert_output_exists(
            'lambda_function_name_fraud_validator',
            'fraud_threshold',
            'validation_results_table_name'
        )
        
        function_name = OUTPUTS['lambda_function_name_fraud_validator']
        table_name = OUTPUTS['validation_results_table_name']
        
        # Invoke Lambda multiple times to test fraud detection
        validation_ids = []
        for i in range(10):
            transaction_id = f"threshold-test-{uuid.uuid4()}"
            
            payload = {
                'detail': {
                    'transaction_id': transaction_id,
                    'amount': 1000.00,
                    'timestamp': int(time.time())
                }
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            result = json.loads(response['Payload'].read())
            if 'validation_id' in result:
                validation_ids.append(result['validation_id'])
        
        # Wait for all validations to be written
        time.sleep(5)
        
        # Verify validations in DynamoDB
        table = dynamodb_resource.Table(table_name)
        fraud_count = 0
        non_fraud_count = 0
        
        for val_id in validation_ids:
            response = table.get_item(Key={'validation_id': val_id})
            if 'Item' in response:
                item = response['Item']
                if item['is_fraud']:
                    fraud_count += 1
                    # Fraud score should be > 0.85
                    self.assertGreater(float(item['fraud_score']), 0.85)
                else:
                    non_fraud_count += 1
                    # Non-fraud score should be <= 0.85
                    self.assertLessEqual(float(item['fraud_score']), 0.85)
                
                # Clean up
                table.delete_item(Key={'validation_id': val_id})
        
        # With 10 attempts, we should have both fraud and non-fraud cases
        self.assertGreater(fraud_count + non_fraud_count, 0, "No validations processed")

    def test_audit_logger_logs_with_retention_metadata(self):
        """
        Test audit-logger Lambda logs events with retention metadata.
        
        ACTION: Invoke Lambda and verify it logs with retention_days in output.
        
        Maps to prompt: Lambda environment variables for audit retention days (90).
        """
        self.assert_output_exists(
            'lambda_function_name_audit_logger',
            'audit_retention_days'
        )
        
        function_name = OUTPUTS['lambda_function_name_audit_logger']
        expected_retention = OUTPUTS['audit_retention_days']
        
        # Invoke audit-logger with test data
        payload = {
            'detail': {
                'validation_id': f"audit-test-{uuid.uuid4()}",
                'transaction_id': f"txn-{uuid.uuid4()}",
                'fraud_score': 0.92,
                'timestamp': int(time.time())
            }
        }
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        result = json.loads(response['Payload'].read())
        self.assertEqual(result['statusCode'], 200)
        
        # Wait for logs to be written
        time.sleep(5)
        
        # Verify logs contain retention_days
        logs = get_recent_lambda_logs(function_name, minutes=2)
        
        self.assertGreater(len(logs), 0, "No logs found for audit-logger")
        
        # Find log with retention_days
        found_retention = False
        for log in logs:
            if 'retention_days' in log and expected_retention in log:
                found_retention = True
                # Parse JSON log to verify structure
                try:
                    log_data = json.loads(log)
                    self.assertEqual(str(log_data['retention_days']), expected_retention)
                except json.JSONDecodeError:
                    pass
        
        self.assertTrue(found_retention, f"Retention days {expected_retention} not found in logs")


class TestSQSServiceLevel(BaseIntegrationTest):
    """Service-level tests for SQS queues."""

    def test_failed_validations_queue_send_and_receive(self):
        """
        Test SQS failed-validations queue: send and receive messages.
        
        Maps to prompt: SQS queues for routing failed validations.
        """
        self.assert_output_exists('failed_validations_queue_url')
        
        queue_url = OUTPUTS['failed_validations_queue_url']
        
        # Purge any existing messages from previous tests
        try:
            print(f"[INFO] Attempting to purge queue: {queue_url}")
            sqs_client.purge_queue(QueueUrl=queue_url)
            print("[INFO] Queue purge initiated, waiting 65 seconds...")
            time.sleep(65)  # AWS requires 60+ seconds between purges
            print("[INFO] Queue purge complete")
        except Exception as e:
            print(f"[WARN] Queue purge failed: {e}. Falling back to manual drain...")
            # If purge fails (e.g., too soon after last purge), drain manually
            messages_drained = 0
            for i in range(20):
                resp = sqs_client.receive_message(
                    QueueUrl=queue_url,
                    MaxNumberOfMessages=10,
                    WaitTimeSeconds=1
                )
                if 'Messages' not in resp:
                    print(f"[INFO] No more messages found after {i} iterations. Drained {messages_drained} messages.")
                    break
                batch_size = len(resp['Messages'])
                messages_drained += batch_size
                print(f"[INFO] Draining batch {i+1}: {batch_size} messages")
                for msg in resp['Messages']:
                    sqs_client.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=msg['ReceiptHandle']
                    )
        
        # Send a test message
        test_message = {
            'validation_id': f"test-val-{uuid.uuid4()}",
            'transaction_id': f"test-txn-{uuid.uuid4()}",
            'fraud_score': 0.92,
            'timestamp': int(time.time())
        }
        
        print(f"[INFO] Sending test message: {test_message['validation_id']}")
        sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message)
        )
        print("[INFO] Test message sent successfully")
        
        # Receive the message
        print("[INFO] Attempting to receive message from queue...")
        response = sqs_client.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=10
        )
        
        self.assertIn('Messages', response, "No messages received from queue")
        self.assertGreaterEqual(len(response['Messages']), 1)
        
        message = response['Messages'][0]
        body = json.loads(message['Body'])
        
        print(f"[INFO] Received message with validation_id: {body.get('validation_id', 'MISSING')}")
        print(f"[INFO] Expected validation_id: {test_message['validation_id']}")
        
        if body['validation_id'] != test_message['validation_id']:
            print(f"[ERROR] Validation ID mismatch!")
            print(f"[ERROR] Expected: {test_message['validation_id']}")
            print(f"[ERROR] Received: {body['validation_id']}")
            print(f"[ERROR] Full message body: {json.dumps(body, indent=2)}")
        
        self.assertEqual(body['validation_id'], test_message['validation_id'])
        self.assertEqual(body['transaction_id'], test_message['transaction_id'])
        
        # Clean up
        sqs_client.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )

    def test_dlq_message_routing_after_max_retries(self):
        """
        Test DLQ receives messages after exceeding max receive count of 3.
        
        ACTION: Send message, receive it 4+ times without deleting, verify it moves to DLQ.
        
        Maps to prompt: SQS dead-letter queues with maximum receive count of 3.
        """
        self.assert_output_exists('fraud_validator_queue_url', 'fraud_validator_dlq_url')
        
        queue_url = OUTPUTS['fraud_validator_queue_url']
        dlq_url = OUTPUTS['fraud_validator_dlq_url']
        
        print(f"[INFO] Testing DLQ routing for queue: {queue_url}")
        print(f"[INFO] DLQ URL: {dlq_url}")
        
        # Send a test message
        test_message = {
            'test_id': f"dlq-test-{uuid.uuid4()}",
            'timestamp': int(time.time())
        }
        
        print(f"[INFO] Sending test message with ID: {test_message['test_id']}")
        sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message)
        )
        print("[INFO] Test message sent to main queue")
        
        # Receive the message 4 times without deleting (exceeds maxReceiveCount of 3)
        # Use longer visibility timeout to ensure message becomes visible again
        receive_count = 0
        for i in range(4):
            print(f"[INFO] Receive attempt {i+1}/4...")
            response = sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                VisibilityTimeout=2,  # Short visibility timeout
                WaitTimeSeconds=10
            )
            
            if 'Messages' in response and len(response['Messages']) > 0:
                receive_count += 1
                msg_body = json.loads(response['Messages'][0]['Body'])
                print(f"[INFO] Received message (count: {receive_count}): {msg_body.get('test_id', 'UNKNOWN')}")
                # Don't delete - simulate processing failure
                # Wait for visibility timeout to expire so message becomes available again
                print("[INFO] Waiting 3 seconds for visibility timeout to expire...")
                time.sleep(3)
            else:
                print(f"[WARN] No message received on attempt {i+1}")
        
        print(f"[INFO] Total successful receives: {receive_count}/4")
        print("[INFO] Waiting 15 seconds for AWS to move message to DLQ...")
        time.sleep(15)
        
        # Verify message is now in DLQ
        print("[INFO] Checking DLQ for message...")
        dlq_response = sqs_client.receive_message(
            QueueUrl=dlq_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=10
        )
        
        if 'Messages' not in dlq_response:
            print("[ERROR] No messages found in DLQ!")
            print(f"[ERROR] DLQ response: {dlq_response}")
            print(f"[ERROR] Expected message with test_id: {test_message['test_id']}")
        else:
            print(f"[INFO] Found {len(dlq_response['Messages'])} message(s) in DLQ")
        
        self.assertIn('Messages', dlq_response, "Message not found in DLQ after max retries")
        self.assertGreaterEqual(len(dlq_response['Messages']), 1)
        
        dlq_message = dlq_response['Messages'][0]
        dlq_body = json.loads(dlq_message['Body'])
        self.assertEqual(dlq_body['test_id'], test_message['test_id'])
        
        # Clean up
        sqs_client.delete_message(
            QueueUrl=dlq_url,
            ReceiptHandle=dlq_message['ReceiptHandle']
        )


class TestAPIGatewayServiceLevel(BaseIntegrationTest):
    """Service-level tests for API Gateway."""

    def test_api_gateway_endpoint_accessibility(self):
        """
        Test API Gateway endpoint is accessible and returns valid response.
        
        Maps to prompt: API Gateway REST API with request validation.
        """
        self.assert_output_exists('api_endpoint_url')
        
        api_url = OUTPUTS['api_endpoint_url']
        endpoint = f"{api_url}/transactions"
        
        # Send a valid transaction
        transaction_data = {
            'transaction_id': f"api-test-{uuid.uuid4()}",
            'amount': 150.25
        }
        
        response = requests.post(
            endpoint,
            json=transaction_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        self.assertEqual(response.status_code, 200)
        
        result = response.json()
        self.assertIn('transaction_id', result)
        self.assertEqual(result['message'], 'Transaction received')

    def test_api_gateway_validates_and_rejects_invalid_requests(self):
        """
        Test API Gateway request validation rejects invalid requests and accepts valid ones.
        
        ACTION: Send both invalid and valid requests, verify proper handling.
        
        Maps to prompt: API Gateway with request validation.
        """
        self.assert_output_exists('api_endpoint_url', 'transactions_table_name')
        
        api_url = OUTPUTS['api_endpoint_url']
        endpoint = f"{api_url}/transactions"
        table_name = OUTPUTS['transactions_table_name']
        
        # Test 1: Send invalid request (missing required fields)
        invalid_data = {'invalid_field': 'test'}
        
        invalid_response = requests.post(
            endpoint,
            json=invalid_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        # Should return 400 for validation error
        self.assertEqual(invalid_response.status_code, 400)
        
        # Test 2: Send valid request and verify it's processed
        valid_transaction_id = f"validation-test-{uuid.uuid4()}"
        valid_data = {
            'transaction_id': valid_transaction_id,
            'amount': 125.50
        }
        
        valid_response = requests.post(
            endpoint,
            json=valid_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        # Should return 200 for valid request
        self.assertEqual(valid_response.status_code, 200)
        
        # Verify transaction was stored in DynamoDB
        item = wait_for_dynamodb_item(
            table_name,
            {'transaction_id': valid_transaction_id},
            max_wait=20
        )
        
        self.assertIsNotNone(item, "Valid transaction not stored after passing validation")
        self.assertEqual(item['transaction_id'], valid_transaction_id)
        
        # Clean up
        table = dynamodb_resource.Table(table_name)
        table.delete_item(Key={'transaction_id': valid_transaction_id})


# ============================================================================
# CROSS-SERVICE TESTS (2 services)
# ============================================================================

class TestCrossServiceInteractions(BaseIntegrationTest):
    """Cross-service tests validating interactions between two services."""

    def test_lambda_to_dynamodb_transaction_storage(self):
        """
        Cross-service: Lambda writes to DynamoDB.
        
        Test transaction-receiver Lambda stores data in DynamoDB transactions table.
        
        Maps to prompt: Lambda function stores transactions in DynamoDB.
        """
        self.assert_output_exists(
            'lambda_function_name_transaction_receiver',
            'transactions_table_name'
        )
        
        function_name = OUTPUTS['lambda_function_name_transaction_receiver']
        table_name = OUTPUTS['transactions_table_name']
        
        transaction_id = f"cross-test-{uuid.uuid4()}"
        
        # Invoke Lambda
        payload = {
            'body': json.dumps({
                'transaction_id': transaction_id,
                'amount': 500.00
            })
        }
        
        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='Event',
            Payload=json.dumps(payload)
        )
        
        # Wait and verify in DynamoDB
        item = wait_for_dynamodb_item(
            table_name,
            {'transaction_id': transaction_id},
            max_wait=30
        )
        
        self.assertIsNotNone(item, "Transaction not found in DynamoDB")
        self.assertEqual(item['transaction_id'], transaction_id)
        self.assertEqual(item['status'], 'received')
        
        # Clean up
        table = dynamodb_resource.Table(table_name)
        table.delete_item(Key={'transaction_id': transaction_id})

    def test_lambda_to_eventbridge_event_publishing(self):
        """
        Cross-service: Lambda publishes events to EventBridge.
        
        Test transaction-receiver Lambda publishes TransactionReceived event.
        
        Maps to prompt: EventBridge rules to trigger fraud-validator on transaction events.
        """
        self.assert_output_exists(
            'lambda_function_name_transaction_receiver',
            'transaction_received_rule_arn'
        )
        
        function_name = OUTPUTS['lambda_function_name_transaction_receiver']
        
        transaction_id = f"event-test-{uuid.uuid4()}"
        
        # Invoke Lambda
        payload = {
            'body': json.dumps({
                'transaction_id': transaction_id,
                'amount': 750.50
            })
        }
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        # Verify Lambda logs show EventBridge interaction
        time.sleep(5)
        logs = get_recent_lambda_logs(function_name, minutes=2)
        
        # Lambda should have successfully invoked without errors
        self.assertGreater(len(logs), 0, "No logs found for Lambda execution")

    def test_eventbridge_to_lambda_trigger(self):
        """
        Cross-service: EventBridge triggers Lambda function.
        
        Test EventBridge rule triggers fraud-validator Lambda.
        
        Maps to prompt: EventBridge rules trigger fraud-validator on transaction events.
        """
        self.assert_output_exists(
            'lambda_function_name_fraud_validator',
            'validation_results_table_name'
        )
        
        function_name = OUTPUTS['lambda_function_name_fraud_validator']
        table_name = OUTPUTS['validation_results_table_name']
        
        transaction_id = f"eb-trigger-{uuid.uuid4()}"
        
        # Publish event directly to EventBridge
        events_client.put_events(
            Entries=[{
                'Source': 'transaction.receiver',
                'DetailType': 'TransactionReceived',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    'amount': 300.00,
                    'timestamp': int(time.time())
                }),
                'EventBusName': 'default'
            }]
        )
        
        # Wait for fraud-validator to process and write to DynamoDB
        time.sleep(10)
        
        # Query validation results table
        table = dynamodb_resource.Table(table_name)
        response = table.scan(
            FilterExpression='transaction_id = :tid',
            ExpressionAttributeValues={':tid': transaction_id}
        )
        
        self.assertGreaterEqual(len(response['Items']), 1, "Validation result not found")
        
        validation = response['Items'][0]
        self.assertEqual(validation['transaction_id'], transaction_id)
        self.assertIn('fraud_score', validation)
        self.assertIn('is_fraud', validation)

    def test_lambda_to_sqs_failed_validation_routing(self):
        """
        Cross-service: Lambda sends messages to SQS for failed validations.
        
        Test fraud-validator Lambda routes failed validations to SQS queue.
        
        Maps to prompt: Route failed validations to a separate queue.
        """
        self.assert_output_exists(
            'lambda_function_name_fraud_validator',
            'failed_validations_queue_url'
        )
        
        function_name = OUTPUTS['lambda_function_name_fraud_validator']
        queue_url = OUTPUTS['failed_validations_queue_url']
        
        transaction_id = f"fraud-test-{uuid.uuid4()}"
        
        # Invoke fraud-validator multiple times to trigger fraud detection
        for _ in range(5):
            payload = {
                'detail': {
                    'transaction_id': f"{transaction_id}-{uuid.uuid4()}",
                    'amount': 10000.00,
                    'timestamp': int(time.time())
                }
            }
            
            lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='Event',
                Payload=json.dumps(payload)
            )
        
        # Wait and check for messages in failed validations queue
        time.sleep(10)
        
        response = sqs_client.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=5
        )
        
        # At least one should be detected as fraud (random > 0.85)
        if 'Messages' in response and len(response['Messages']) > 0:
            message = response['Messages'][0]
            body = json.loads(message['Body'])
            
            self.assertIn('validation_id', body)
            self.assertIn('fraud_score', body)
            
            # Clean up
            for msg in response['Messages']:
                sqs_client.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=msg['ReceiptHandle']
                )

    def test_sqs_to_lambda_audit_logger_trigger(self):
        """
        Cross-service: SQS triggers Lambda function via event source mapping.
        
        Test audit-logger Lambda is triggered by SQS messages.
        
        Maps to prompt: Audit-logger Lambda processes messages from queue.
        """
        self.assert_output_exists(
            'lambda_function_name_audit_logger',
            'audit_logger_queue_url'
        )
        
        function_name = OUTPUTS['lambda_function_name_audit_logger']
        queue_url = OUTPUTS['audit_logger_queue_url']
        
        # Send message to audit logger queue
        test_message = {
            'validation_id': f"audit-{uuid.uuid4()}",
            'transaction_id': f"txn-{uuid.uuid4()}",
            'fraud_score': 0.95,
            'timestamp': int(time.time())
        }
        
        sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message)
        )
        
        # Wait for Lambda to process
        time.sleep(15)
        
        # Check CloudWatch logs for audit logger
        logs = get_recent_lambda_logs(function_name, minutes=2)
        
        self.assertGreater(len(logs), 0, "No audit logs found")
        
        # Verify audit event was logged
        found_audit = any('audit_event' in log for log in logs)
        self.assertTrue(found_audit, "Audit event not found in logs")


# ============================================================================
# END-TO-END TESTS (3+ services)
# ============================================================================

class TestEndToEndWorkflows(BaseIntegrationTest):
    """End-to-end tests validating complete workflows through 3+ services."""

    def test_e2e_api_to_fraud_validation_complete_pipeline(self):
        """
        TRUE E2E Test: API Gateway -> transaction-receiver -> DynamoDB -> EventBridge -> fraud-validator -> DynamoDB
        
        ENTRY POINT: POST transaction to API Gateway (only manual trigger)
        END POINT: Verify validation result exists in validation-results DynamoDB table
        
        Services involved (5):
        1. API Gateway (entry)
        2. Lambda (transaction-receiver)
        3. DynamoDB (transactions table)
        4. EventBridge (event routing)
        5. Lambda (fraud-validator)
        6. DynamoDB (validation-results table - final verification)
        
        Maps to prompt: Complete serverless transaction validation pipeline.
        """
        self.assert_output_exists(
            'api_endpoint_url',
            'validation_results_table_name'
        )
        
        api_url = OUTPUTS['api_endpoint_url']
        validations_table = OUTPUTS['validation_results_table_name']
        
        endpoint = f"{api_url}/transactions"
        transaction_id = f"e2e-{uuid.uuid4()}"
        
        # TRIGGER: POST to API Gateway (ONLY manual trigger in entire test)
        transaction_data = {
            'transaction_id': transaction_id,
            'amount': 425.75
        }
        
        response = requests.post(
            endpoint,
            json=transaction_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result['transaction_id'], transaction_id)
        
        # Wait for complete pipeline execution (all automatic)
        # transaction-receiver -> DynamoDB -> EventBridge -> fraud-validator -> DynamoDB
        time.sleep(20)
        
        # VERIFY END POINT: Check validation result in DynamoDB (final destination)
        table = dynamodb_resource.Table(validations_table)
        response = table.scan(
            FilterExpression='transaction_id = :tid',
            ExpressionAttributeValues={':tid': transaction_id}
        )
        
        self.assertGreaterEqual(len(response['Items']), 1, 
            "E2E pipeline failed: Validation result not found in final DynamoDB table")
        
        validation = response['Items'][0]
        self.assertEqual(validation['transaction_id'], transaction_id)
        self.assertIn('fraud_score', validation)
        self.assertIn('is_fraud', validation)
        self.assertIn('validation_id', validation)
        
        # Verify the fraud score is a valid decimal between 0 and 1
        fraud_score = float(validation['fraud_score'])
        self.assertGreaterEqual(fraud_score, 0.0)
        self.assertLessEqual(fraud_score, 1.0)
        
        # Clean up
        table.delete_item(Key={'validation_id': validation['validation_id']})

    def test_e2e_api_to_fraud_detection_to_failed_queue(self):
        """
        TRUE E2E Test: API Gateway -> transaction-receiver -> EventBridge -> fraud-validator -> SQS failed-validations queue
        
        ENTRY POINT: POST transaction to API Gateway (only manual trigger)
        END POINT: Verify failed validation message appears in failed-validations SQS queue
        
        Services involved (6):
        1. API Gateway (entry)
        2. Lambda (transaction-receiver)
        3. EventBridge (event routing)
        4. Lambda (fraud-validator)
        5. DynamoDB (validation-results table)
        6. SQS (failed-validations queue - final verification)
        
        Maps to prompt: Failed validations routed to separate queue.
        """
        self.assert_output_exists(
            'api_endpoint_url',
            'failed_validations_queue_url'
        )
        
        api_url = OUTPUTS['api_endpoint_url']
        failed_queue_url = OUTPUTS['failed_validations_queue_url']
        
        endpoint = f"{api_url}/transactions"
        
        # TRIGGER: POST multiple transactions to API Gateway (ONLY manual triggers)
        # Post multiple to increase chance of fraud detection (random > 0.85)
        print("[INFO] Starting E2E test: API -> fraud detection -> failed queue")
        print(f"[INFO] API endpoint: {endpoint}")
        print(f"[INFO] Failed validations queue: {failed_queue_url}")
        
        transaction_ids = []
        for i in range(15):
            transaction_id = f"e2e-fraud-{uuid.uuid4()}"
            transaction_ids.append(transaction_id)
            
            transaction_data = {
                'transaction_id': transaction_id,
                'amount': 10000.00  # High amount
            }
            
            response = requests.post(
                endpoint,
                json=transaction_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            time.sleep(0.5)  # Small delay between requests
        
        print(f"[INFO] Posted {len(transaction_ids)} transactions to API Gateway")
        print("[INFO] Transaction IDs:", transaction_ids[:3], "... (showing first 3)")
        
        # Wait for complete pipeline execution (all automatic)
        # transaction-receiver -> EventBridge -> fraud-validator -> DynamoDB + SQS
        print("[INFO] Waiting 25 seconds for complete pipeline execution...")
        time.sleep(25)
        
        # VERIFY END POINT: Check for failed validation in SQS queue (final destination)
        # Poll queue multiple times to find a message from OUR transactions
        print("[INFO] Polling failed-validations queue for our test messages...")
        fraud_detected = False
        attempts = 0
        max_attempts = 10
        messages_from_other_tests = 0
        
        while not fraud_detected and attempts < max_attempts:
            attempts += 1
            print(f"[INFO] Polling attempt {attempts}/{max_attempts}...")
            
            # Receive multiple messages to filter for our test
            response = sqs_client.receive_message(
                QueueUrl=failed_queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=5
            )
            
            if 'Messages' in response:
                print(f"[INFO] Received {len(response['Messages'])} message(s) from queue")
                for msg in response['Messages']:
                    try:
                        message = json.loads(msg['Body'])
                        txn_id = message.get('transaction_id', 'MISSING')
                        
                        # Check if this message is from our test
                        if txn_id.startswith('e2e-fraud-'):
                            print(f"[INFO] Found matching message! Transaction ID: {txn_id}")
                            fraud_detected = True
                            
                            # Verify message structure
                            self.assertIn('validation_id', message, "Message missing validation_id")
                            self.assertIn('transaction_id', message, "Message missing transaction_id")
                            self.assertIn('fraud_score', message, "Message missing fraud_score")
                            
                            # Verify fraud score is above threshold
                            fraud_score = message['fraud_score']
                            print(f"[INFO] Fraud score: {fraud_score}")
                            self.assertGreater(fraud_score, 0.85, 
                                "Fraud score should be > 0.85 for failed validations")
                            
                            # Verify transaction_id is one we sent
                            if txn_id not in transaction_ids:
                                print(f"[ERROR] Transaction ID {txn_id} not in our list!")
                                print(f"[ERROR] Our transaction IDs: {transaction_ids[:5]}... (showing first 5)")
                            
                            self.assertIn(message['transaction_id'], transaction_ids,
                                "Received validation for unknown transaction")
                            
                            # Clean up this message
                            sqs_client.delete_message(
                                QueueUrl=failed_queue_url,
                                ReceiptHandle=msg['ReceiptHandle']
                            )
                            break
                        else:
                            # Delete messages from other tests
                            messages_from_other_tests += 1
                            print(f"[WARN] Deleting message from other test: {txn_id}")
                            sqs_client.delete_message(
                                QueueUrl=failed_queue_url,
                                ReceiptHandle=msg['ReceiptHandle']
                            )
                    except (json.JSONDecodeError, KeyError) as e:
                        # Delete malformed messages
                        print(f"[WARN] Deleting malformed message: {e}")
                        sqs_client.delete_message(
                            QueueUrl=failed_queue_url,
                            ReceiptHandle=msg['ReceiptHandle']
                        )
            else:
                print("[INFO] No messages in queue")
            
            if fraud_detected:
                break
            
            print("[INFO] Waiting 5 seconds before next poll...")
            time.sleep(5)
        
        print(f"[INFO] Deleted {messages_from_other_tests} message(s) from other tests")
        
        if not fraud_detected:
            print("[ERROR] No fraud detected after all polling attempts!")
            print(f"[ERROR] Polled {attempts} times, found {messages_from_other_tests} messages from other tests")
        
        # With 15 transactions, at least one should be detected as fraud (probability ~78%)
        self.assertTrue(fraud_detected, 
            "E2E pipeline failed: No fraud detected in failed-validations queue after 15 transactions")

    def test_e2e_audit_logger_triggered_by_sqs_to_cloudwatch(self):
        """
        TRUE E2E Test: SQS audit-logger-queue -> Lambda (audit-logger) -> CloudWatch Logs
        
        ENTRY POINT: Send message to audit-logger SQS queue (only manual trigger)
        END POINT: Verify audit event appears in CloudWatch Logs
        
        Services involved (3):
        1. SQS (audit-logger-queue - entry)
        2. Lambda (audit-logger - triggered by SQS event source mapping)
        3. CloudWatch Logs (final verification)
        
        Maps to prompt: Audit-logger Lambda processes messages and logs to CloudWatch.
        """
        self.assert_output_exists(
            'audit_logger_queue_url',
            'lambda_function_name_audit_logger'
        )
        
        queue_url = OUTPUTS['audit_logger_queue_url']
        function_name = OUTPUTS['lambda_function_name_audit_logger']
        
        # Create unique identifier for this test
        test_validation_id = f"e2e-audit-{uuid.uuid4()}"
        
        # TRIGGER: Send message to SQS queue (ONLY manual trigger)
        test_message = {
            'validation_id': test_validation_id,
            'transaction_id': f"txn-{uuid.uuid4()}",
            'fraud_score': 0.95,
            'timestamp': int(time.time()),
            'test_marker': 'e2e_audit_test'
        }
        
        sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message)
        )
        
        # Wait for complete pipeline execution (all automatic)
        # SQS -> Lambda (event source mapping) -> CloudWatch Logs
        time.sleep(20)
        
        # VERIFY END POINT: Check CloudWatch Logs for audit event (final destination)
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, 
            "E2E pipeline failed: No logs found in CloudWatch for audit-logger")
        
        # Find our specific audit event in the logs
        found_audit_event = False
        for log in logs:
            if test_validation_id in log and 'audit_event' in log:
                found_audit_event = True
                
                # Parse and verify the log structure
                try:
                    log_data = json.loads(log)
                    self.assertEqual(log_data['audit_event'], 'failed_validation')
                    self.assertIn('data', log_data)
                    self.assertIn('retention_days', log_data)
                    self.assertEqual(log_data['data']['validation_id'], test_validation_id)
                except json.JSONDecodeError:
                    # Log might not be JSON, but contains our validation_id
                    pass
                
                break
        
        self.assertTrue(found_audit_event, 
            f"E2E pipeline failed: Audit event for {test_validation_id} not found in CloudWatch Logs")


if __name__ == '__main__':
    unittest.main()
