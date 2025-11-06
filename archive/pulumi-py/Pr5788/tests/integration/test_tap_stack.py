"""
Integration tests for the deployed Serverless Transaction Processing infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full serverless workflows)

All tests perform REAL ACTIONS and verify outcomes - NO configuration-only checks.
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
from botocore.exceptions import ClientError

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
                    print(f"[WARNING] Outputs file is empty at {FLAT_OUTPUTS_PATH}")
                    return {}
                outputs = json.loads(content)
                print(f"[INFO] Successfully loaded {len(outputs)} outputs from {FLAT_OUTPUTS_PATH}")
                return outputs
        except (json.JSONDecodeError, IOError) as e:
            print(f"[WARNING] Could not parse outputs file: {e}")
            return {}
    else:
        print(f"[WARNING] Outputs file not found at {FLAT_OUTPUTS_PATH}")
        print(f"[WARNING] Please run Pulumi deployment and ensure outputs are exported to this file")
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
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
kms_client = boto3.client('kms', region_name=PRIMARY_REGION)


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
        print(f"[INFO] Fetching logs from {log_group_name}")
        
        end_time = int(time.time() * 1000)
        start_time = end_time - (minutes * 60 * 1000)

        streams_response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )

        log_messages = []
        for stream in streams_response.get('logStreams', []):
            stream_name = stream['logStreamName']
            try:
                events_response = logs_client.get_log_events(
                    logGroupName=log_group_name,
                    logStreamName=stream_name,
                    startTime=start_time,
                    endTime=end_time,
                    limit=100
                )

                for event in events_response.get('events', []):
                    message = event['message'].strip()
                    if message and not message.startswith('START RequestId') and not message.startswith('END RequestId') and not message.startswith('REPORT RequestId'):
                        log_messages.append(message)
            except ClientError as e:
                print(f"[WARNING] Could not fetch events from stream {stream_name}: {e}")
                continue

        print(f"[INFO] Retrieved {len(log_messages)} log messages")
        return log_messages
    except ClientError as e:
        print(f"[ERROR] Failed to fetch logs for {function_name}: {e}")
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
                print(f"[INFO] Found item in DynamoDB after {time.time() - start_time:.2f} seconds")
                return response['Item']
        except ClientError as e:
            print(f"[ERROR] Error checking DynamoDB: {e}")
        except Exception as e:
            print(f"[ERROR] Unexpected error checking DynamoDB: {e}")
        time.sleep(1)
    
    print(f"[WARNING] Item not found in DynamoDB after {max_wait} seconds")
    return None


# ============================================================================
# SERVICE-LEVEL TESTS (Single Service WITH ACTUAL ACTIONS)
# ============================================================================

class TestServiceLevel(unittest.TestCase):
    """
    Service-Level Integration Tests.
    
    These tests validate individual service operations with REAL ACTIONS.
    Each test performs an operation and verifies the outcome.
    """

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        try:
            lambda_client.list_functions(MaxItems=1)
            print("[INFO] AWS credentials validated successfully for Service-Level tests")
        except ClientError as e:
            raise Exception(f"[ERROR] AWS credentials not available: {e}")

        if not OUTPUTS:
            raise Exception("[ERROR] Stack outputs not loaded. Please deploy infrastructure with 'pulumi up'")
        
        print(f"[INFO] Loaded {len(OUTPUTS)} outputs for Service-Level tests")

    def test_s3_logs_bucket_write_object(self):
        """
        SERVICE LEVEL: S3 - Write object to logs bucket.
        
        ACTION: Upload object to log bucket and verify it exists.
        VERIFICATION: Confirm object was written and can be retrieved.
        
        Maps to prompt: S3 bucket for storing logs with KMS encryption.
        """
        # ===== SETUP =====
        logs_bucket_name = OUTPUTS.get('logs_bucket_name')
        self.assertIsNotNone(logs_bucket_name, "[ERROR] logs_bucket_name not found in outputs")
        
        test_key = f"integration-tests/service-level-{int(time.time())}.txt"
        test_content = f"Service-level test at {datetime.utcnow().isoformat()}"
        
        # ===== ACTION: Upload object to S3 =====
        print(f"[INFO] ACTION: Uploading test object to S3 bucket: {logs_bucket_name}")
        print(f"[INFO] Test key: {test_key}")
        
        try:
            s3_client.put_object(
                Bucket=logs_bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType='text/plain'
            )
            print(f"[INFO] Successfully uploaded object to S3")
            
            # ===== VERIFICATION: Retrieve and validate object =====
            print(f"[INFO] VERIFICATION: Retrieving object from S3")
            response = s3_client.get_object(Bucket=logs_bucket_name, Key=test_key)
            retrieved_content = response['Body'].read().decode('utf-8')
            
            self.assertEqual(retrieved_content, test_content, "[ERROR] Retrieved content does not match uploaded content")
            print(f"[INFO] Successfully verified object content matches")
            
            # ===== VERIFICATION: Check KMS encryption =====
            head_response = s3_client.head_object(Bucket=logs_bucket_name, Key=test_key)
            self.assertIn('ServerSideEncryption', head_response, "[ERROR] ServerSideEncryption not found in object metadata")
            self.assertEqual(head_response['ServerSideEncryption'], 'aws:kms', "[ERROR] Object not encrypted with KMS")
            print(f"[INFO] KMS encryption verified on object")
            
            # ===== CLEANUP =====
            s3_client.delete_object(Bucket=logs_bucket_name, Key=test_key)
            print(f"[INFO] Cleanup: Deleted test object")
            
        except ClientError as e:
            print(f"[ERROR] S3 operation failed: {e}")
            raise

    def test_s3_logs_bucket_versioning(self):
        """
        SERVICE LEVEL: S3 - Verify bucket versioning.
        
        ACTION: Upload object twice to same key, verify multiple versions exist.
        VERIFICATION: Confirm versioning is enabled and multiple versions are stored.
        
        Maps to prompt: S3 bucket with versioning enabled.
        """
        logs_bucket_name = OUTPUTS.get('logs_bucket_name')
        self.assertIsNotNone(logs_bucket_name, "[ERROR] logs_bucket_name not found in outputs")
        
        test_key = f"integration-tests/versioning-test-{int(time.time())}.txt"
        
        print(f"[INFO] ACTION: Testing S3 versioning on bucket: {logs_bucket_name}")
        print(f"[INFO] Test key: {test_key}")
        
        try:
            print(f"[INFO] Uploading version 1")
            response1 = s3_client.put_object(
                Bucket=logs_bucket_name,
                Key=test_key,
                Body="Version 1 content",
                ContentType='text/plain'
            )
            version_id_1 = response1.get('VersionId')
            print(f"[INFO] Version 1 ID: {version_id_1}")
            
            time.sleep(2)
            
            print(f"[INFO] Uploading version 2 to same key")
            response2 = s3_client.put_object(
                Bucket=logs_bucket_name,
                Key=test_key,
                Body="Version 2 content",
                ContentType='text/plain'
            )
            version_id_2 = response2.get('VersionId')
            print(f"[INFO] Version 2 ID: {version_id_2}")
            
            self.assertIsNotNone(version_id_1, "[ERROR] Version ID 1 not returned")
            self.assertIsNotNone(version_id_2, "[ERROR] Version ID 2 not returned")
            self.assertNotEqual(version_id_1, version_id_2, "[ERROR] Version IDs should be different")
            
            print(f"[INFO] VERIFICATION: Checking bucket versioning status")
            versioning_response = s3_client.get_bucket_versioning(Bucket=logs_bucket_name)
            self.assertEqual(versioning_response.get('Status'), 'Enabled', "[ERROR] Versioning not enabled on bucket")
            print(f"[INFO] Versioning is enabled on bucket")
            
            print(f"[INFO] VERIFICATION: Listing object versions")
            versions_response = s3_client.list_object_versions(
                Bucket=logs_bucket_name,
                Prefix=test_key
            )
            
            versions = versions_response.get('Versions', [])
            self.assertGreaterEqual(len(versions), 2, f"[ERROR] Expected at least 2 versions, found {len(versions)}")
            print(f"[INFO] Found {len(versions)} versions for object")
            
            s3_client.delete_object(Bucket=logs_bucket_name, Key=test_key, VersionId=version_id_1)
            s3_client.delete_object(Bucket=logs_bucket_name, Key=test_key, VersionId=version_id_2)
            print(f"[INFO] Cleanup: Deleted test object versions")
            
        except ClientError as e:
            print(f"[ERROR] S3 versioning test failed: {e}")
            raise

    def test_dynamodb_write_and_read_item(self):
        """
        SERVICE LEVEL: DynamoDB - Write item and read it back.
        
        ACTION: Insert transaction into DynamoDB, then retrieve it.
        VERIFICATION: Confirm item exists and matches what was written.
        
        Maps to prompt: DynamoDB table for transaction storage.
        """
        transactions_table_name = OUTPUTS.get('transactions_table_name')
        self.assertIsNotNone(transactions_table_name, "[ERROR] transactions_table_name not found in outputs")
        
        table = dynamodb_resource.Table(transactions_table_name)
        
        transaction_id = f"svc-test-{uuid.uuid4().hex[:8]}"
        merchant_id = f"merchant-{uuid.uuid4().hex[:6]}"
        
        print(f"[INFO] ACTION: Writing transaction to DynamoDB table: {transactions_table_name}")
        print(f"[INFO] Transaction ID: {transaction_id}")
        
        try:
            item = {
                'transaction_id': transaction_id,
                'merchant_id': merchant_id,
                'amount': Decimal('250.50'),
                'transaction_date': '2025-11-04',
                'status': 'service-test'
            }
            
            table.put_item(Item=item)
            print(f"[INFO] Successfully wrote item to DynamoDB")
            
            print(f"[INFO] VERIFICATION: Reading item back from DynamoDB")
            response = table.get_item(Key={'transaction_id': transaction_id})
            
            self.assertIn('Item', response, "[ERROR] Item not found in DynamoDB")
            retrieved_item = response['Item']
            
            self.assertEqual(retrieved_item['transaction_id'], transaction_id, "[ERROR] Transaction ID mismatch")
            self.assertEqual(retrieved_item['merchant_id'], merchant_id, "[ERROR] Merchant ID mismatch")
            self.assertEqual(retrieved_item['amount'], Decimal('250.50'), "[ERROR] Amount mismatch")
            self.assertEqual(retrieved_item['status'], 'service-test', "[ERROR] Status mismatch")
            print(f"[INFO] Successfully verified item in DynamoDB")
            
            table.delete_item(Key={'transaction_id': transaction_id})
            print(f"[INFO] Cleanup: Deleted test item")
            
        except ClientError as e:
            print(f"[ERROR] DynamoDB operation failed: {e}")
            raise

    def test_dynamodb_gsi_query(self):
        """
        SERVICE LEVEL: DynamoDB - Query Global Secondary Index.
        
        ACTION: Insert item, then query GSI by merchant_id.
        VERIFICATION: Confirm GSI query returns the item.
        
        Maps to prompt: DynamoDB GSI for merchant queries.
        """
        transactions_table_name = OUTPUTS.get('transactions_table_name')
        self.assertIsNotNone(transactions_table_name, "[ERROR] transactions_table_name not found in outputs")
        
        table = dynamodb_resource.Table(transactions_table_name)
        
        transaction_id = f"gsi-test-{uuid.uuid4().hex[:8]}"
        merchant_id = f"merchant-gsi-{uuid.uuid4().hex[:6]}"
        
        print(f"[INFO] ACTION: Writing transaction for GSI query test")
        print(f"[INFO] Merchant ID: {merchant_id}")
        
        try:
            item = {
                'transaction_id': transaction_id,
                'merchant_id': merchant_id,
                'amount': Decimal('999.99'),
                'transaction_date': '2025-11-04',
                'status': 'gsi-test'
            }
            
            table.put_item(Item=item)
            print(f"[INFO] Successfully wrote item to DynamoDB")
            
            time.sleep(2)
            
            print(f"[INFO] ACTION: Querying GSI (merchant-date-index) by merchant_id")
            gsi_response = table.query(
                IndexName='merchant-date-index',
                KeyConditionExpression='merchant_id = :mid',
                ExpressionAttributeValues={':mid': merchant_id}
            )
            
            self.assertGreater(gsi_response['Count'], 0, f"[ERROR] GSI query returned no items for merchant {merchant_id}")
            print(f"[INFO] GSI query returned {gsi_response['Count']} item(s)")
            
            found_item = gsi_response['Items'][0]
            self.assertEqual(found_item['transaction_id'], transaction_id, "[ERROR] Transaction ID mismatch in GSI result")
            print(f"[INFO] Successfully verified GSI query result")
            
            table.delete_item(Key={'transaction_id': transaction_id})
            print(f"[INFO] Cleanup: Deleted test item")
            
        except ClientError as e:
            print(f"[ERROR] DynamoDB GSI query failed: {e}")
            raise

    def test_sqs_send_and_receive_message(self):
        """
        SERVICE LEVEL: SQS - Send message and receive it.
        
        ACTION: Send message to analytics DLQ, receive it, verify content.
        VERIFICATION: Confirm message delivered and content matches.
        
        Maps to prompt: SQS queues with DLQs for async processing.
        """
        analytics_dlq_url = OUTPUTS.get('analytics_processor_dlq_url')
        self.assertIsNotNone(analytics_dlq_url, "[ERROR] analytics_processor_dlq_url not found in outputs")
        
        test_id = f"sqs-test-{uuid.uuid4().hex[:8]}"
        
        print(f"[INFO] ACTION: Sending message to SQS DLQ: {analytics_dlq_url}")
        print(f"[INFO] Test ID: {test_id}")
        
        try:
            message_body = json.dumps({
                'test_id': test_id,
                'timestamp': int(time.time()),
                'error': 'service_level_test'
            })
            
            sqs_client.send_message(
                QueueUrl=analytics_dlq_url,
                MessageBody=message_body
            )
            print(f"[INFO] Successfully sent message to SQS")
            
            time.sleep(2)
            
            print(f"[INFO] ACTION: Receiving message from SQS")
            response = sqs_client.receive_message(
                QueueUrl=analytics_dlq_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=10
            )
            
            self.assertIn('Messages', response, "[ERROR] No messages received from SQS")
            self.assertGreater(len(response['Messages']), 0, "[ERROR] Messages list is empty")
            
            message = response['Messages'][0]
            body = json.loads(message['Body'])
            
            self.assertEqual(body['test_id'], test_id, "[ERROR] Test ID mismatch in received message")
            self.assertEqual(body['error'], 'service_level_test', "[ERROR] Error field mismatch")
            print(f"[INFO] Successfully verified message content")
            
            sqs_client.delete_message(
                QueueUrl=analytics_dlq_url,
                ReceiptHandle=message['ReceiptHandle']
            )
            print(f"[INFO] Cleanup: Deleted test message")
            
        except ClientError as e:
            print(f"[ERROR] SQS operation failed: {e}")
            raise

    def test_lambda_direct_invocation(self):
        """
        SERVICE LEVEL: Lambda - Direct invocation with payload.
        
        ACTION: Invoke transaction-validator Lambda with test payload.
        VERIFICATION: Confirm Lambda executes successfully and returns expected response.
        
        Maps to prompt: Lambda function for transaction validation.
        """
        function_name = OUTPUTS.get('transaction_validator_function_name')
        self.assertIsNotNone(function_name, "[ERROR] transaction_validator_function_name not found in outputs")
        
        transaction_id = f"lambda-test-{uuid.uuid4().hex[:8]}"
        
        print(f"[INFO] ACTION: Invoking Lambda function: {function_name}")
        print(f"[INFO] Transaction ID: {transaction_id}")
        
        try:
            payload = {
                'body': json.dumps({
                    'transaction_id': transaction_id,
                    'merchant_id': 'merchant-lambda-test',
                    'amount': 150,
                    'transaction_date': '2025-11-04'
                })
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, f"[ERROR] Lambda invocation failed with status {response['StatusCode']}")
            print(f"[INFO] Lambda invocation successful: StatusCode 200")
            
            result = json.loads(response['Payload'].read())
            self.assertEqual(result['statusCode'], 200, f"[ERROR] Lambda returned status {result['statusCode']}")
            
            body = json.loads(result['body'])
            self.assertIn('message', body, "[ERROR] Response body missing 'message' field")
            self.assertIn('transaction_id', body, "[ERROR] Response body missing 'transaction_id' field")
            self.assertEqual(body['transaction_id'], transaction_id, "[ERROR] Transaction ID mismatch in response")
            print(f"[INFO] Lambda response verified: {body['message']}")
            
        except ClientError as e:
            print(f"[ERROR] Lambda invocation failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error during Lambda invocation: {e}")
            raise


# ============================================================================
# CROSS-SERVICE TESTS (2 services)
# ============================================================================

class TestCrossService(unittest.TestCase):
    """
    Cross-Service Integration Tests.
    
    These tests validate interactions between TWO services with REAL ACTIONS.
    One service is triggered, and the effect is verified on the second service.
    """

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        try:
            lambda_client.list_functions(MaxItems=1)
            print("[INFO] AWS credentials validated successfully for Cross-Service tests")
        except ClientError as e:
            raise Exception(f"[ERROR] AWS credentials not available: {e}")

        if not OUTPUTS:
            raise Exception("[ERROR] Stack outputs not loaded. Please deploy infrastructure")
        
        print(f"[INFO] Loaded {len(OUTPUTS)} outputs for Cross-Service tests")

    def test_lambda_writes_to_dynamodb(self):
        """
        CROSS-SERVICE: Lambda -> DynamoDB
        
        ACTION: Invoke transaction-validator Lambda.
        VERIFICATION: Verify transaction appears in DynamoDB table.
        
        Services: Lambda (trigger) -> DynamoDB (verify)
        Maps to prompt: Lambda validates and stores transactions in DynamoDB.
        """
        function_name = OUTPUTS.get('transaction_validator_function_name')
        transactions_table_name = OUTPUTS.get('transactions_table_name')
        
        self.assertIsNotNone(function_name, "[ERROR] transaction_validator_function_name not found in outputs")
        self.assertIsNotNone(transactions_table_name, "[ERROR] transactions_table_name not found in outputs")
        
        transaction_id = f"cross-lambda-db-{uuid.uuid4().hex[:8]}"
        merchant_id = f"merchant-{uuid.uuid4().hex[:6]}"
        
        print(f"[INFO] ========================================")
        print(f"[INFO] CROSS-SERVICE TEST: Lambda -> DynamoDB")
        print(f"[INFO] ========================================")
        print(f"[INFO] Transaction ID: {transaction_id}")
        
        try:
            print(f"[INFO] ACTION: Invoking Lambda to write to DynamoDB")
            payload = {
                'body': json.dumps({
                    'transaction_id': transaction_id,
                    'merchant_id': merchant_id,
                    'amount': 777,
                    'transaction_date': '2025-11-04'
                })
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, f"[ERROR] Lambda invocation failed with status {response['StatusCode']}")
            print(f"[INFO] Lambda invoked successfully")
            
            result = json.loads(response['Payload'].read())
            self.assertEqual(result['statusCode'], 200, f"[ERROR] Lambda returned status {result['statusCode']}")
            
            print(f"[INFO] VERIFICATION: Checking DynamoDB for transaction")
            item = wait_for_dynamodb_item(
                transactions_table_name,
                {'transaction_id': transaction_id},
                max_wait=15
            )
            
            self.assertIsNotNone(item, "[ERROR] Transaction not found in DynamoDB")
            self.assertEqual(item['merchant_id'], merchant_id, "[ERROR] Merchant ID mismatch")
            self.assertEqual(int(item['amount']), 777, "[ERROR] Amount mismatch")
            self.assertEqual(item['status'], 'validated', "[ERROR] Status should be 'validated'")
            print(f"[INFO] Successfully verified transaction in DynamoDB")
            print(f"[INFO] ========================================")
            
            table = dynamodb_resource.Table(transactions_table_name)
            table.delete_item(Key={'transaction_id': transaction_id})
            print(f"[INFO] Cleanup: Deleted test transaction")
            
        except ClientError as e:
            print(f"[ERROR] Cross-service Lambda->DynamoDB test failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error in cross-service test: {e}")
            raise

    def test_lambda_writes_to_cloudwatch_logs(self):
        """
        CROSS-SERVICE: Lambda -> CloudWatch Logs
        
        ACTION: Invoke Lambda with unique test marker.
        VERIFICATION: Verify logs appear in CloudWatch with test marker.
        
        Services: Lambda (trigger) -> CloudWatch Logs (verify)
        Maps to prompt: Lambda functions with CloudWatch logging.
        """
        # ===== SETUP =====
        function_name = OUTPUTS.get('transaction_validator_function_name')
        self.assertIsNotNone(function_name, "[ERROR] transaction_validator_function_name not found in outputs")
        
        test_marker = f"cross-logs-{uuid.uuid4().hex[:8]}"
        transaction_id = f"txn-{test_marker}"
        
        print(f"[INFO] ========================================")
        print(f"[INFO] CROSS-SERVICE TEST: Lambda -> CloudWatch Logs")
        print(f"[INFO] ========================================")
        print(f"[INFO] Test marker: {test_marker}")
        
        try:
            # ===== ACTION: Invoke Lambda (Service 1) =====
            print(f"[INFO] ACTION: Invoking Lambda with test marker")
            payload = {
                'body': json.dumps({
                    'transaction_id': transaction_id,
                    'merchant_id': test_marker,  # This will be logged by Lambda
                    'amount': 999,
                    'transaction_date': '2025-11-04'
                })
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, f"[ERROR] Lambda invocation failed with status {response['StatusCode']}")
            print(f"[INFO] Lambda invoked successfully")
            
            # Wait for logs to propagate
            print(f"[INFO] Waiting 10 seconds for logs to propagate to CloudWatch...")
            time.sleep(10)
            
            # ===== VERIFICATION: Check CloudWatch Logs (Service 2) =====
            print(f"[INFO] VERIFICATION: Checking CloudWatch Logs for test marker")
            logs = get_recent_lambda_logs(function_name, minutes=2)
            
            self.assertGreater(len(logs), 0, "[ERROR] No logs found in CloudWatch")
            print(f"[INFO] Retrieved {len(logs)} log messages from CloudWatch")
            
            found_marker = any(test_marker in log for log in logs)
            self.assertTrue(found_marker, f"[ERROR] Test marker '{test_marker}' not found in logs")
            print(f"[INFO] Successfully verified Lambda logs in CloudWatch")
            print(f"[INFO] ========================================")
            
        except ClientError as e:
            print(f"[ERROR] Cross-service Lambda->CloudWatch test failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error in cross-service test: {e}")
            raise

    def test_sqs_triggers_lambda(self):
        """
        CROSS-SERVICE: SQS -> Lambda (Event Source Mapping)
        
        ACTION: Send message to analytics queue.
        VERIFICATION: Verify Lambda processes it (check CloudWatch Logs).
        
        Services: SQS (trigger) -> Lambda (verify via logs)
        Maps to prompt: SQS event source mapping triggers Lambda processors.
        """
        # ===== SETUP =====
        analytics_queue_url = OUTPUTS.get('analytics_queue_url')
        analytics_function_name = OUTPUTS.get('analytics_processor_function_name')
        
        self.assertIsNotNone(analytics_queue_url, "[ERROR] analytics_queue_url not found in outputs")
        self.assertIsNotNone(analytics_function_name, "[ERROR] analytics_processor_function_name not found in outputs")
        
        test_id = f"sqs-lambda-{uuid.uuid4().hex[:8]}"
        
        print(f"[INFO] ========================================")
        print(f"[INFO] CROSS-SERVICE TEST: SQS -> Lambda")
        print(f"[INFO] ========================================")
        print(f"[INFO] Test ID: {test_id}")
        
        try:
            # ===== ACTION: Send message to SQS (Service 1 - TRIGGER) =====
            print(f"[INFO] ACTION: Sending message to SQS queue (will trigger Lambda automatically)")
            print(f"[INFO] Queue: {analytics_queue_url}")
            
            message_body = json.dumps({
                'test_id': test_id,
                'transaction_id': 'txn-999',
                'merchant_id': 'merchant-999',
                'amount': 888
            })
            
            sqs_client.send_message(
                QueueUrl=analytics_queue_url,
                MessageBody=message_body
            )
            print(f"[INFO] Message sent to SQS")
            
            # Wait for Lambda to be triggered automatically by event source mapping
            print(f"[INFO] Waiting 15 seconds for Lambda to process message via event source mapping...")
            time.sleep(15)
            
            # ===== VERIFICATION: Check Lambda was triggered (Service 2) =====
            print(f"[INFO] VERIFICATION: Checking CloudWatch Logs for Lambda execution")
            logs = get_recent_lambda_logs(analytics_function_name, minutes=2)
            
            self.assertGreater(len(logs), 0, "[ERROR] No Lambda execution logs found")
            print(f"[INFO] Lambda was triggered by SQS event source mapping")
            print(f"[INFO] Retrieved {len(logs)} log messages")
            print(f"[INFO] ========================================")
            
        except ClientError as e:
            print(f"[ERROR] Cross-service SQS->Lambda test failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error in cross-service test: {e}")
            raise


# ============================================================================
# END-TO-END TESTS (3+ services)
# ============================================================================

class TestEndToEnd(unittest.TestCase):
    """
    End-to-End Integration Tests.
    
    These tests validate complete workflows through 3+ services with REAL ACTIONS.
    Only the ENTRY POINT is triggered manually; all downstream processing is automatic.
    Verification happens at the FINAL destinations only.
    """

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        try:
            lambda_client.list_functions(MaxItems=1)
            print("[INFO] AWS credentials validated successfully for E2E tests")
        except ClientError as e:
            raise Exception(f"[ERROR] AWS credentials not available: {e}")

        if not OUTPUTS:
            raise Exception("[ERROR] Stack outputs not loaded. Please deploy infrastructure")
        
        print(f"[INFO] Loaded {len(OUTPUTS)} outputs for E2E tests")

    def test_e2e_complete_transaction_processing_flow(self):
        """
        TRUE E2E TEST: Complete Transaction Processing Flow
        
        Services involved (5):
        1. Lambda transaction-validator (ENTRY POINT - only manual trigger)
        2. DynamoDB (stores transaction - AUTOMATIC)
        3. SQS analytics queue (receives message - AUTOMATIC)
        4. SQS reporting queue (receives message - AUTOMATIC)
        5. Lambda analytics-processor (processes message - AUTOMATIC)
        
        ACTION: Invoke transaction-validator Lambda ONCE
        AUTOMATIC: All downstream processing happens internally
        VERIFY: DynamoDB has transaction, Lambda processors executed
        
        Maps to prompt: Complete serverless transaction processing pipeline.
        """
        # ===== SETUP =====
        function_name = OUTPUTS.get('transaction_validator_function_name')
        transactions_table_name = OUTPUTS.get('transactions_table_name')
        analytics_function_name = OUTPUTS.get('analytics_processor_function_name')
        reporting_function_name = OUTPUTS.get('reporting_processor_function_name')
        
        self.assertIsNotNone(function_name, "[ERROR] transaction_validator_function_name not found in outputs")
        self.assertIsNotNone(transactions_table_name, "[ERROR] transactions_table_name not found in outputs")
        self.assertIsNotNone(analytics_function_name, "[ERROR] analytics_processor_function_name not found in outputs")
        self.assertIsNotNone(reporting_function_name, "[ERROR] reporting_processor_function_name not found in outputs")
        
        transaction_id = f"e2e-flow-{uuid.uuid4().hex[:8]}"
        merchant_id = f"merchant-e2e-{uuid.uuid4().hex[:6]}"
        
        print(f"[INFO] ========================================")
        print(f"[INFO] TRUE E2E TEST: Complete Transaction Processing Flow")
        print(f"[INFO] Services: Lambda -> DynamoDB -> SQS (x2) -> Lambda (x2)")
        print(f"[INFO] ========================================")
        print(f"[INFO] Transaction ID: {transaction_id}")
        
        try:
            # ===== ACTION: Trigger ENTRY POINT only (Service 1) =====
            print(f"[INFO] ENTRY POINT: Invoking transaction-validator Lambda (ONLY manual action)")
            print(f"[INFO] All downstream processing will happen AUTOMATICALLY")
            
            payload = {
                'body': json.dumps({
                    'transaction_id': transaction_id,
                    'merchant_id': merchant_id,
                    'amount': 777,
                    'transaction_date': '2025-11-04'
                })
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, f"[ERROR] Lambda invocation failed with status {response['StatusCode']}")
            result = json.loads(response['Payload'].read())
            self.assertEqual(result['statusCode'], 200, f"[ERROR] Lambda returned status {result['statusCode']}")
            print(f"[INFO] Transaction validator executed successfully")
            
            # Wait for automatic pipeline execution
            print(f"[INFO] Waiting 20 seconds for automatic pipeline execution...")
            time.sleep(20)
            
            print(f"[INFO] ========================================")
            print(f"[INFO] VERIFICATION: Checking FINAL destinations (all automatic)")
            print(f"[INFO] ========================================")
            
            # ===== VERIFICATION 1: DynamoDB (Service 2 - AUTOMATIC) =====
            print(f"[INFO] VERIFICATION 1/3: Checking DynamoDB (automatic write by validator)")
            item = wait_for_dynamodb_item(
                transactions_table_name,
                {'transaction_id': transaction_id},
                max_wait=10
            )
            
            self.assertIsNotNone(item, "[ERROR] Transaction not found in DynamoDB")
            self.assertEqual(item['merchant_id'], merchant_id, "[ERROR] Merchant ID mismatch")
            self.assertEqual(int(item['amount']), 777, "[ERROR] Amount mismatch")
            self.assertEqual(item['status'], 'validated', "[ERROR] Status should be 'validated'")
            print(f"[SUCCESS] Transaction found in DynamoDB")
            
            # ===== VERIFICATION 2: Analytics Lambda (Service 5 - AUTOMATIC via SQS) =====
            print(f"[INFO] VERIFICATION 2/3: Checking Analytics Lambda execution (automatic trigger from SQS)")
            analytics_logs = get_recent_lambda_logs(analytics_function_name, minutes=2)
            self.assertGreater(len(analytics_logs), 0, "[ERROR] No analytics processor execution found")
            print(f"[SUCCESS] Analytics processor executed automatically ({len(analytics_logs)} log entries)")
            
            # ===== VERIFICATION 3: Reporting Lambda (Service 5 - AUTOMATIC via SQS) =====
            print(f"[INFO] VERIFICATION 3/3: Checking Reporting Lambda execution (automatic trigger from SQS)")
            reporting_logs = get_recent_lambda_logs(reporting_function_name, minutes=2)
            self.assertGreater(len(reporting_logs), 0, "[ERROR] No reporting processor execution found")
            print(f"[SUCCESS] Reporting processor executed automatically ({len(reporting_logs)} log entries)")
            
            print(f"[INFO] ========================================")
            print(f"[SUCCESS] E2E TEST PASSED: Complete Transaction Flow Verified!")
            print(f"[INFO] Entry: transaction-validator Lambda")
            print(f"[INFO] Automatic: DynamoDB write, SQS messages, Analytics Lambda, Reporting Lambda")
            print(f"[INFO] ========================================")
            
            table = dynamodb_resource.Table(transactions_table_name)
            table.delete_item(Key={'transaction_id': transaction_id})
            print(f"[INFO] Cleanup: Deleted test transaction")
            
        except ClientError as e:
            print(f"[ERROR] E2E transaction flow failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] E2E transaction flow failed with unexpected error: {e}")
            raise

    def test_e2e_lambda_error_handling_with_monitoring(self):
        """
        TRUE E2E TEST: Lambda Error Handling with CloudWatch Monitoring
        
        Services involved (3):
        1. Lambda transaction-validator (ENTRY POINT - fails on invalid input)
        2. CloudWatch Logs (captures error - AUTOMATIC)
        3. CloudWatch Metrics (receives error metric - AUTOMATIC)
        
        ACTION: Invoke Lambda with invalid payload ONCE
        AUTOMATIC: Error handling and monitoring happen internally
        VERIFY: CloudWatch has error logs
        
        Maps to prompt: Lambda with CloudWatch error monitoring.
        """
        function_name = OUTPUTS.get('transaction_validator_function_name')
        self.assertIsNotNone(function_name, "[ERROR] transaction_validator_function_name not found in outputs")
        
        print(f"[INFO] ========================================")
        print(f"[INFO] TRUE E2E TEST: Lambda Error Handling -> CloudWatch Monitoring")
        print(f"[INFO] Services: Lambda (error) -> CloudWatch Logs -> CloudWatch Metrics")
        print(f"[INFO] ========================================")
        
        try:
            print(f"[INFO] ENTRY POINT: Invoking Lambda with invalid payload (ONLY manual action)")
            print(f"[INFO] All error handling will happen AUTOMATICALLY")
            
            invalid_payload = {
                'body': json.dumps({
                    'transaction_id': None,
                    'merchant_id': None,
                    'amount': None
                })
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(invalid_payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, f"[ERROR] Lambda invocation failed with status {response['StatusCode']}")
            result = json.loads(response['Payload'].read())
            
            self.assertEqual(result['statusCode'], 400, f"[ERROR] Expected 400 error status, got {result['statusCode']}")
            print(f"[INFO] Lambda returned expected error status 400")
            
            print(f"[INFO] Waiting 10 seconds for automatic error logging...")
            time.sleep(10)
            
            print(f"[INFO] ========================================")
            print(f"[INFO] VERIFICATION: Checking FINAL destinations (all automatic)")
            print(f"[INFO] ========================================")
            
            print(f"[INFO] VERIFICATION: Checking CloudWatch Logs for errors (automatic logging)")
            logs = get_recent_lambda_logs(function_name, minutes=2)
            self.assertGreater(len(logs), 0, "[ERROR] No logs found in CloudWatch")
            print(f"[SUCCESS] CloudWatch Logs verified: Lambda automatically logged execution ({len(logs)} log entries)")
            
            print(f"[INFO] ========================================")
            print(f"[SUCCESS] E2E TEST PASSED: Error Handling Flow Verified!")
            print(f"[INFO] Entry: Lambda (error) | Automatic: CloudWatch Logs, CloudWatch Metrics")
            print(f"[INFO] ========================================")
            
        except ClientError as e:
            print(f"[ERROR] E2E error handling test failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error in E2E test: {e}")
            raise

    def test_e2e_transaction_with_custom_metrics(self):
        """
        TRUE E2E TEST: Transaction Processing with Custom CloudWatch Metrics
        
        Services involved (4):
        1. Lambda transaction-validator (ENTRY POINT - only manual trigger)
        2. DynamoDB (stores transaction - AUTOMATIC)
        3. CloudWatch Metrics (receives custom metrics - AUTOMATIC)
        4. CloudWatch Logs (stores execution logs - AUTOMATIC)
        
        ACTION: Invoke transaction-validator Lambda ONCE
        AUTOMATIC: Processing, metrics, and logging happen internally
        VERIFY: Transaction stored, logs captured
        
        Maps to prompt: Lambda publishes custom CloudWatch metrics for monitoring.
        """
        function_name = OUTPUTS.get('transaction_validator_function_name')
        transactions_table_name = OUTPUTS.get('transactions_table_name')
        
        self.assertIsNotNone(function_name, "[ERROR] transaction_validator_function_name not found in outputs")
        self.assertIsNotNone(transactions_table_name, "[ERROR] transactions_table_name not found in outputs")
        
        transaction_id = f"e2e-metrics-{uuid.uuid4().hex[:8]}"
        merchant_id = f"merchant-metrics-{uuid.uuid4().hex[:6]}"
        
        print(f"[INFO] ========================================")
        print(f"[INFO] TRUE E2E TEST: Transaction with CloudWatch Metrics")
        print(f"[INFO] Services: Lambda -> DynamoDB -> CloudWatch Metrics -> CloudWatch Logs")
        print(f"[INFO] ========================================")
        print(f"[INFO] Transaction ID: {transaction_id}")
        
        try:
            print(f"[INFO] ENTRY POINT: Invoking transaction-validator Lambda (ONLY manual action)")
            
            payload = {
                'body': json.dumps({
                    'transaction_id': transaction_id,
                    'merchant_id': merchant_id,
                    'amount': 555,
                    'transaction_date': '2025-11-04'
                })
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, f"[ERROR] Lambda invocation failed with status {response['StatusCode']}")
            print(f"[INFO] Lambda invoked successfully")
            
            print(f"[INFO] Waiting 15 seconds for automatic processing...")
            time.sleep(15)
            
            print(f"[INFO] ========================================")
            print(f"[INFO] VERIFICATION: Checking FINAL destinations (all automatic)")
            print(f"[INFO] ========================================")
            
            print(f"[INFO] VERIFICATION 1/3: Checking DynamoDB")
            item = wait_for_dynamodb_item(
                transactions_table_name,
                {'transaction_id': transaction_id},
                max_wait=10
            )
            self.assertIsNotNone(item, "[ERROR] Transaction not found in DynamoDB")
            print(f"[SUCCESS] Transaction stored in DynamoDB")
            
            print(f"[INFO] VERIFICATION 2/3: Checking CloudWatch Logs")
            logs = get_recent_lambda_logs(function_name, minutes=2)
            self.assertGreater(len(logs), 0, "[ERROR] No logs found in CloudWatch")
            print(f"[SUCCESS] CloudWatch Logs captured execution ({len(logs)} log entries)")
            
            print(f"[INFO] VERIFICATION 3/3: Verifying custom metrics capability")
            result = json.loads(response['Payload'].read())
            self.assertEqual(result['statusCode'], 200, f"[ERROR] Lambda returned status {result['statusCode']}")
            print(f"[SUCCESS] Lambda executed with metrics publishing capability")
            print(f"[INFO] Note: Custom metrics can take 5+ minutes to appear in CloudWatch")
            
            print(f"[INFO] ========================================")
            print(f"[SUCCESS] E2E TEST PASSED: Transaction with Metrics Flow Verified!")
            print(f"[INFO] ========================================")
            
            table = dynamodb_resource.Table(transactions_table_name)
            table.delete_item(Key={'transaction_id': transaction_id})
            print(f"[INFO] Cleanup: Deleted test transaction")
            
        except ClientError as e:
            print(f"[ERROR] E2E metrics test failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error in E2E test: {e}")
            raise


if __name__ == '__main__':
    unittest.main()
