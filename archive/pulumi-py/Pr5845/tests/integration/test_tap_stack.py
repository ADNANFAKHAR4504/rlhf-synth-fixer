"""
Integration tests for the deployed Serverless TAP Stack infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full serverless workflows)

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
PRIMARY_REGION = OUTPUTS.get('primary_region', os.getenv('AWS_REGION', 'us-east-1'))

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

        print(f"[INFO] Retrieved {len(log_messages)} log messages")
        return log_messages
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"[WARN] Log group not found: {e}")
            return []
        print(f"[ERROR] Failed to fetch logs: {e}")
        return []
    except Exception as e:
        print(f"[ERROR] Unexpected error fetching logs: {e}")
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
        except Exception as e:
            print(f"[ERROR] Error checking DynamoDB: {e}")
        time.sleep(1)
    
    print(f"[WARN] Item not found in DynamoDB after {max_wait} seconds")
    return None


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup and utilities."""

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        try:
            lambda_client.list_functions(MaxItems=1)
            print("[INFO] AWS credentials validated successfully")
        except (NoCredentialsError, ClientError) as e:
            raise Exception(f"[ERROR] AWS credentials not available: {e}")

        if not OUTPUTS:
            raise Exception("[ERROR] Stack outputs not loaded. Please deploy infrastructure with 'pulumi up'")
        
        print(f"[INFO] Loaded outputs: {list(OUTPUTS.keys())}")

    def assert_output_exists(self, *output_names):
        """
        Assert that required outputs exist.
        
        Args:
            *output_names: Names of required outputs to check
        """
        missing = [name for name in output_names if name not in OUTPUTS]
        if missing:
            print(f"[ERROR] Missing required outputs: {', '.join(missing)}")
            print(f"[ERROR] Available outputs: {list(OUTPUTS.keys())}")
            self.fail(f"Required outputs missing: {', '.join(missing)}")


# ============================================================================
# SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
# ============================================================================

class TestServiceLevel(BaseIntegrationTest):
    """
    Service-Level Integration Tests.
    
    These tests validate individual service operations with REAL ACTIONS.
    Each test performs an operation and verifies the outcome.
    """

    def test_dynamodb_table_write_and_read(self):
        """
        SERVICE LEVEL: DynamoDB - Write an item and read it back.
        
        ACTION: Insert an item into DynamoDB data table, then retrieve it.
        VERIFICATION: Confirm the item exists and matches what was written.
        
        Maps to prompt: DynamoDB table with autoscaling and encryption.
        """
        print("\n" + "="*80)
        print("SERVICE LEVEL TEST: DynamoDB Write and Read")
        print("="*80)
        
        self.assert_output_exists('dynamodb_table_name')
        
        table_name = OUTPUTS['dynamodb_table_name']
        table = dynamodb_resource.Table(table_name)
        
        # Generate unique test data
        test_symbol = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        test_timestamp = Decimal(str(datetime.now(timezone.utc).timestamp()))
        test_data = f"Integration test data - {datetime.now(timezone.utc).isoformat()}"
        
        print(f"[INFO] ACTION: Writing item with symbol={test_symbol} to DynamoDB table {table_name}")
        
        # ACTION: Write item to DynamoDB
        table.put_item(Item={
            'symbol': test_symbol,
            'timestamp': test_timestamp,
            'data': test_data,
            'test_id': f"service-level-{uuid.uuid4().hex[:8]}",
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        
        print(f"[INFO] VERIFICATION: Reading item back from DynamoDB")
        
        # VERIFICATION: Read item back
        response = table.get_item(Key={
            'symbol': test_symbol,
            'timestamp': test_timestamp
        })
        
        self.assertIn('Item', response, "Item not found in DynamoDB")
        item = response['Item']
        self.assertEqual(item['symbol'], test_symbol)
        self.assertEqual(item['data'], test_data)
        
        print(f"[SUCCESS] Item verified in DynamoDB: symbol={test_symbol}")

    def test_lambda_api_handler_direct_invocation(self):
        """
        SERVICE LEVEL: Lambda - Directly invoke api-handler Lambda.
        
        ACTION: Invoke api-handler Lambda function with test payload.
        VERIFICATION: Confirm Lambda executes successfully and returns expected response.
        
        Maps to prompt: Lambda function for API Gateway integration.
        """
        print("\n" + "="*80)
        print("SERVICE LEVEL TEST: Lambda Direct Invocation")
        print("="*80)
        
        self.assert_output_exists('api_handler_function_name')
        
        function_name = OUTPUTS['api_handler_function_name']
        
        test_symbol = f"LAMBDA-{uuid.uuid4().hex[:8].upper()}"
        test_data = f"Direct Lambda test - {datetime.now(timezone.utc).isoformat()}"
        
        payload = {
            'body': json.dumps({
                'symbol': test_symbol,
                'data': test_data
            })
        }
        
        print(f"[INFO] ACTION: Invoking Lambda function {function_name}")
        
        # ACTION: Invoke Lambda
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        print(f"[INFO] VERIFICATION: Checking Lambda response")
        
        # VERIFICATION: Check Lambda response
        self.assertEqual(response['StatusCode'], 200, "Lambda invocation failed")
        
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)
        
        body = json.loads(response_payload['body'])
        self.assertEqual(body['symbol'], test_symbol)
        self.assertIn('request_id', body)
        
        print(f"[SUCCESS] Lambda executed successfully: symbol={test_symbol}, request_id={body['request_id']}")

    def test_s3_data_bucket_write_and_read(self):
        """
        SERVICE LEVEL: S3 - Upload object to data bucket and retrieve it.
        
        ACTION: Upload a test file to S3 data bucket, then download it.
        VERIFICATION: Confirm object exists and content matches.
        
        Maps to prompt: S3 bucket with versioning and encryption.
        """
        print("\n" + "="*80)
        print("SERVICE LEVEL TEST: S3 Write and Read")
        print("="*80)
        
        self.assert_output_exists('data_bucket_name')
        
        bucket_name = OUTPUTS['data_bucket_name']
        
        test_key = f"test-files/integration-test-{uuid.uuid4().hex[:8]}.json"
        test_content = json.dumps({
            'test_id': uuid.uuid4().hex,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'message': 'Integration test content'
        })
        
        print(f"[INFO] ACTION: Uploading object {test_key} to S3 bucket {bucket_name}")
        
        # ACTION: Upload object to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8'),
            ContentType='application/json'
        )
        
        print(f"[INFO] VERIFICATION: Downloading and verifying object")
        
        # VERIFICATION: Download and verify object
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        downloaded_content = response['Body'].read().decode('utf-8')
        
        self.assertEqual(downloaded_content, test_content)
        self.assertEqual(response['ContentType'], 'application/json')
        
        print(f"[SUCCESS] Object verified in S3: {test_key}")
        
        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        print(f"[INFO] Cleaned up test object")

    def test_s3_bucket_versioning_enabled(self):
        """
        SERVICE LEVEL: S3 - Verify bucket versioning by uploading multiple versions.
        
        ACTION: Upload same key twice, verify both versions exist.
        VERIFICATION: Confirm versioning is working and multiple versions are stored.
        
        Maps to prompt: S3 bucket with versioning enabled.
        """
        print("\n" + "="*80)
        print("SERVICE LEVEL TEST: S3 Versioning")
        print("="*80)
        
        self.assert_output_exists('data_bucket_name')
        
        bucket_name = OUTPUTS['data_bucket_name']
        test_key = f"versioning-test/test-{uuid.uuid4().hex[:8]}.txt"
        
        print(f"[INFO] ACTION: Uploading first version to {bucket_name}/{test_key}")
        
        # ACTION: Upload first version
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body='Version 1 content',
            ContentType='text/plain'
        )
        
        time.sleep(1)
        
        print(f"[INFO] ACTION: Uploading second version to same key")
        
        # ACTION: Upload second version
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body='Version 2 content',
            ContentType='text/plain'
        )
        
        print(f"[INFO] VERIFICATION: Listing object versions")
        
        # VERIFICATION: List versions
        versions_response = s3_client.list_object_versions(
            Bucket=bucket_name,
            Prefix=test_key
        )
        
        versions = versions_response.get('Versions', [])
        self.assertGreaterEqual(len(versions), 2, "Expected at least 2 versions")
        
        print(f"[SUCCESS] Versioning verified: {len(versions)} versions found")
        
        # Cleanup all versions
        for version in versions:
            s3_client.delete_object(
                Bucket=bucket_name,
                Key=test_key,
                VersionId=version['VersionId']
            )
        print(f"[INFO] Cleaned up all versions")

    def test_sqs_dlq_send_and_receive_message(self):
        """
        SERVICE LEVEL: SQS - Send message to DLQ and receive it.
        
        ACTION: Send a test message to api-handler DLQ, then receive it.
        VERIFICATION: Confirm message is received and content matches.
        
        Maps to prompt: SQS Dead Letter Queue for Lambda functions.
        """
        print("\n" + "="*80)
        print("SERVICE LEVEL TEST: SQS DLQ Send and Receive")
        print("="*80)
        
        self.assert_output_exists('api_handler_dlq_url')
        
        dlq_url = OUTPUTS['api_handler_dlq_url']
        
        test_message = {
            'test_id': uuid.uuid4().hex,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'message': 'Integration test DLQ message'
        }
        
        print(f"[INFO] ACTION: Sending message to SQS DLQ {dlq_url}")
        
        # ACTION: Send message to SQS
        send_response = sqs_client.send_message(
            QueueUrl=dlq_url,
            MessageBody=json.dumps(test_message)
        )
        
        self.assertIn('MessageId', send_response)
        message_id = send_response['MessageId']
        print(f"[INFO] Sent message with ID {message_id}")
        
        print(f"[INFO] VERIFICATION: Receiving message from DLQ")
        
        # VERIFICATION: Receive message from SQS
        time.sleep(2)  # Brief wait for message availability
        
        receive_response = sqs_client.receive_message(
            QueueUrl=dlq_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=10
        )
        
        self.assertIn('Messages', receive_response, "No messages received from DLQ")
        self.assertGreater(len(receive_response['Messages']), 0)
        
        received_message = json.loads(receive_response['Messages'][0]['Body'])
        self.assertEqual(received_message['test_id'], test_message['test_id'])
        
        print(f"[SUCCESS] Message verified in SQS DLQ: test_id={test_message['test_id']}")
        
        # Cleanup
        sqs_client.delete_message(
            QueueUrl=dlq_url,
            ReceiptHandle=receive_response['Messages'][0]['ReceiptHandle']
        )
        print(f"[INFO] Cleaned up test message")


# ============================================================================
# CROSS-SERVICE TESTS (Two Services WITH ACTUAL INTERACTIONS)
# ============================================================================

class TestCrossService(BaseIntegrationTest):
    """
    Cross-Service Integration Tests.
    
    These tests validate interactions between TWO services with REAL ACTIONS.
    One service is triggered, and we verify the effect on the second service.
    """

    def test_lambda_writes_to_dynamodb(self):
        """
        CROSS SERVICE: Lambda -> DynamoDB
        
        ACTION: Invoke api-handler Lambda to process data.
        VERIFICATION: Confirm the data appears in DynamoDB data table.
        
        Services: Lambda (trigger) + DynamoDB (verification)
        Maps to prompt: Lambda function writes to DynamoDB table.
        """
        print("\n" + "="*80)
        print("CROSS SERVICE TEST: Lambda -> DynamoDB")
        print("="*80)
        
        self.assert_output_exists('api_handler_function_name', 'dynamodb_table_name')
        
        function_name = OUTPUTS['api_handler_function_name']
        table_name = OUTPUTS['dynamodb_table_name']
        
        test_symbol = f"CROSS-{uuid.uuid4().hex[:8].upper()}"
        test_data = f"Cross-service test - {datetime.now(timezone.utc).isoformat()}"
        
        payload = {
            'body': json.dumps({
                'symbol': test_symbol,
                'data': test_data
            })
        }
        
        print(f"[INFO] ACTION: Invoking Lambda {function_name} to process data")
        
        # ACTION: Invoke Lambda (Service 1)
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        body = json.loads(response_payload['body'])
        timestamp = Decimal(str(body['timestamp']))
        
        print(f"[INFO] Lambda executed: symbol={test_symbol}, timestamp={timestamp}")
        print(f"[INFO] VERIFICATION: Checking DynamoDB table {table_name}")
        
        # VERIFICATION: Check DynamoDB (Service 2)
        item = wait_for_dynamodb_item(table_name, {
            'symbol': test_symbol,
            'timestamp': timestamp
        }, max_wait=15)
        
        self.assertIsNotNone(item, f"Item with symbol {test_symbol} not found in DynamoDB")
        self.assertEqual(item['symbol'], test_symbol)
        self.assertEqual(item['data'], test_data)
        
        print(f"[SUCCESS] Lambda successfully wrote data to DynamoDB")

    def test_lambda_writes_to_s3(self):
        """
        CROSS SERVICE: Lambda -> S3
        
        ACTION: Invoke api-handler Lambda to process data.
        VERIFICATION: Confirm the data is stored in S3 processed folder.
        
        Services: Lambda (trigger) + S3 (verification)
        Maps to prompt: Lambda function writes processed data to S3.
        """
        print("\n" + "="*80)
        print("CROSS SERVICE TEST: Lambda -> S3")
        print("="*80)
        
        self.assert_output_exists('api_handler_function_name', 'data_bucket_name')
        
        function_name = OUTPUTS['api_handler_function_name']
        bucket_name = OUTPUTS['data_bucket_name']
        
        test_symbol = f"S3CROSS-{uuid.uuid4().hex[:8].upper()}"
        test_data = f"S3 cross-service test - {datetime.now(timezone.utc).isoformat()}"
        
        payload = {
            'body': json.dumps({
                'symbol': test_symbol,
                'data': test_data
            })
        }
        
        print(f"[INFO] ACTION: Invoking Lambda {function_name}")
        
        # ACTION: Invoke Lambda (Service 1)
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        body = json.loads(response_payload['body'])
        request_id = body['request_id']
        
        print(f"[INFO] Lambda executed: request_id={request_id}")
        print(f"[INFO] VERIFICATION: Checking S3 bucket {bucket_name}")
        
        # VERIFICATION: Check S3 (Service 2)
        time.sleep(2)  # Brief wait for S3 write
        
        s3_key = f'processed/{test_symbol}/{request_id}.json'
        
        try:
            s3_response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
            s3_content = json.loads(s3_response['Body'].read().decode('utf-8'))
            
            self.assertEqual(s3_content['symbol'], test_symbol)
            self.assertEqual(s3_content['data'], test_data)
            
            print(f"[SUCCESS] Lambda successfully wrote data to S3: {s3_key}")
            
            # Cleanup
            s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
            
        except ClientError as e:
            self.fail(f"S3 object not found: {s3_key}, error: {e}")

    def test_lambda_execution_logs_to_cloudwatch(self):
        """
        CROSS SERVICE: Lambda -> CloudWatch Logs
        
        ACTION: Invoke api-handler Lambda with test payload.
        VERIFICATION: Confirm execution logs appear in CloudWatch Logs.
        
        Services: Lambda (trigger) + CloudWatch Logs (verification)
        Maps to prompt: Lambda execution logs to CloudWatch.
        """
        print("\n" + "="*80)
        print("CROSS SERVICE TEST: Lambda -> CloudWatch Logs")
        print("="*80)
        
        self.assert_output_exists('api_handler_function_name', 'api_handler_log_group')
        
        function_name = OUTPUTS['api_handler_function_name']
        log_group_name = OUTPUTS['api_handler_log_group']
        
        test_symbol = f"LOGS-{uuid.uuid4().hex[:8].upper()}"
        test_data = f"CloudWatch logs test - {datetime.now(timezone.utc).isoformat()}"
        
        payload = {
            'body': json.dumps({
                'symbol': test_symbol,
                'data': test_data
            })
        }
        
        print(f"[INFO] ACTION: Invoking Lambda {function_name}")
        
        # ACTION: Invoke Lambda (Service 1)
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        body = json.loads(response_payload['body'])
        request_id = body['request_id']
        
        print(f"[INFO] Lambda executed: request_id={request_id}")
        print(f"[INFO] VERIFICATION: Checking CloudWatch Logs {log_group_name}")
        
        # VERIFICATION: Check CloudWatch Logs (Service 2)
        time.sleep(10)  # Wait for logs to propagate
        
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
        
        log_content = ' '.join(logs)
        has_execution_evidence = (test_symbol in log_content or 
                                 request_id in log_content or
                                 'Processing request' in log_content)
        
        self.assertTrue(has_execution_evidence, 
                       f"No execution evidence found in logs for request_id={request_id}")
        
        print(f"[SUCCESS] Lambda execution logged to CloudWatch: {len(logs)} log entries found")

    def test_s3_upload_triggers_lambda_processor(self):
        """
        CROSS SERVICE: S3 -> Lambda
        
        ACTION: Upload a JSON file to S3 uploads folder.
        VERIFICATION: Confirm S3 event triggers s3-processor Lambda (check logs).
        
        Services: S3 (trigger) + Lambda (verification)
        Maps to prompt: S3 event notification triggers Lambda function.
        """
        print("\n" + "="*80)
        print("CROSS SERVICE TEST: S3 -> Lambda")
        print("="*80)
        
        self.assert_output_exists('data_bucket_name', 's3_processor_function_name')
        
        bucket_name = OUTPUTS['data_bucket_name']
        function_name = OUTPUTS['s3_processor_function_name']
        
        test_symbol = f"S3EVENT-{uuid.uuid4().hex[:8].upper()}"
        test_key = f"uploads/test-{uuid.uuid4().hex[:8]}.json"
        
        test_content = json.dumps({
            'symbol': test_symbol,
            'data': f"S3 event test - {datetime.now(timezone.utc).isoformat()}"
        })
        
        print(f"[INFO] ACTION: Uploading object to S3 {bucket_name}/{test_key}")
        
        # ACTION: Upload to S3 (Service 1)
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8'),
            ContentType='application/json'
        )
        
        print(f"[INFO] VERIFICATION: Checking Lambda logs for event processing")
        
        # VERIFICATION: Check Lambda logs (Service 2)
        time.sleep(15)  # Wait for S3 event and Lambda execution
        
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, "No logs found for s3-processor Lambda")
        
        log_content = ' '.join(logs)
        has_s3_event = (test_key in log_content or 
                       test_symbol in log_content or
                       'Processing S3 event' in log_content)
        
        self.assertTrue(has_s3_event, 
                       f"No S3 event processing found in logs for key={test_key}")
        
        print(f"[SUCCESS] S3 upload triggered Lambda processor: {len(logs)} log entries found")
        
        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


# ============================================================================
# END-TO-END TESTS (3+ Services WITH ACTUAL INTERACTIONS)
# ============================================================================

class TestEndToEnd(BaseIntegrationTest):
    """
    End-to-End Integration Tests.
    
    These tests validate complete workflows through 3+ services with REAL ACTIONS.
    Only the entry point is triggered; all downstream services are invoked automatically.
    """

    def test_api_gateway_lambda_dynamodb_s3_cloudwatch(self):
        """
        E2E: API Gateway -> Lambda -> DynamoDB + S3 + CloudWatch Logs
        
        ENTRY POINT: HTTP POST request to API Gateway /process endpoint.
        FLOW: API Gateway invokes Lambda, Lambda writes to DynamoDB and S3, logs to CloudWatch.
        VERIFICATION: Confirm API returns success, DynamoDB has entry, S3 has file, CloudWatch has logs.
        
        Services: API Gateway (entry) + Lambda + DynamoDB + S3 + CloudWatch Logs (5 services)
        Maps to prompt: Complete serverless API workflow with data persistence and logging.
        """
        print("\n" + "="*80)
        print("END-TO-END TEST: API Gateway -> Lambda -> DynamoDB + S3 + CloudWatch")
        print("="*80)
        
        self.assert_output_exists(
            'api_endpoint_url',
            'dynamodb_table_name',
            'data_bucket_name',
            'api_handler_function_name'
        )
        
        api_endpoint = OUTPUTS['api_endpoint_url']
        table_name = OUTPUTS['dynamodb_table_name']
        bucket_name = OUTPUTS['data_bucket_name']
        function_name = OUTPUTS['api_handler_function_name']
        
        test_symbol = f"E2E-API-{uuid.uuid4().hex[:8].upper()}"
        test_data = f"End-to-end API test - {datetime.now(timezone.utc).isoformat()}"
        
        request_body = {
            'symbol': test_symbol,
            'data': test_data
        }
        
        print(f"[INFO] ENTRY POINT: Sending POST request to API Gateway: {api_endpoint}")
        print(f"[INFO] Creating data with symbol: {test_symbol}")
        
        # ENTRY POINT: HTTP POST to API Gateway
        import requests
        response = requests.post(
            api_endpoint,
            json=request_body,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        # VERIFICATION 1: API Gateway response
        print(f"[INFO] VERIFICATION 1: API Gateway response")
        self.assertEqual(response.status_code, 200, f"API returned status {response.status_code}")
        
        response_data = response.json()
        self.assertEqual(response_data['symbol'], test_symbol)
        self.assertIn('request_id', response_data)
        
        request_id = response_data['request_id']
        timestamp = Decimal(str(response_data['timestamp']))
        
        print(f"[SUCCESS] API Gateway returned success: request_id={request_id}")
        
        # VERIFICATION 2: DynamoDB has the entry
        print(f"[INFO] VERIFICATION 2: DynamoDB table {table_name}")
        
        item = wait_for_dynamodb_item(table_name, {
            'symbol': test_symbol,
            'timestamp': timestamp
        }, max_wait=20)
        
        self.assertIsNotNone(item, f"Item with symbol {test_symbol} not found in DynamoDB")
        self.assertEqual(item['symbol'], test_symbol)
        self.assertEqual(item['data'], test_data)
        self.assertEqual(item['request_id'], request_id)
        
        print(f"[SUCCESS] Data verified in DynamoDB")
        
        # VERIFICATION 3: S3 has the file
        print(f"[INFO] VERIFICATION 3: S3 bucket {bucket_name}")
        
        time.sleep(2)  # Brief wait for S3 write
        
        s3_key = f'processed/{test_symbol}/{request_id}.json'
        
        try:
            s3_response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
            s3_content = json.loads(s3_response['Body'].read().decode('utf-8'))
            
            self.assertEqual(s3_content['symbol'], test_symbol)
            self.assertEqual(s3_content['data'], test_data)
            self.assertEqual(s3_content['request_id'], request_id)
            
            print(f"[SUCCESS] Data verified in S3: {s3_key}")
            
            # Cleanup S3
            s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
            
        except ClientError as e:
            self.fail(f"S3 object not found: {s3_key}, error: {e}")
        
        # VERIFICATION 4: CloudWatch Logs has execution logs
        print(f"[INFO] VERIFICATION 4: CloudWatch Logs")
        
        time.sleep(8)  # Wait for logs to propagate
        
        logs = get_recent_lambda_logs(function_name, minutes=3)
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
        
        log_content = ' '.join(logs)
        has_execution = (request_id in log_content or 
                        test_symbol in log_content or
                        'Processing request' in log_content)
        
        self.assertTrue(has_execution, 
                       f"No execution evidence found in logs for request_id={request_id}")
        
        print(f"[SUCCESS] Execution verified in CloudWatch Logs: {len(logs)} log entries")
        print(f"[SUCCESS] E2E TEST PASSED: Complete workflow verified across 5 services")

    def test_s3_upload_lambda_dynamodb_cloudwatch(self):
        """
        E2E: S3 Upload -> Lambda Processor -> DynamoDB + CloudWatch Logs
        
        ENTRY POINT: Upload JSON file to S3 uploads folder.
        FLOW: S3 event triggers Lambda, Lambda processes file and writes to DynamoDB, logs to CloudWatch.
        VERIFICATION: Confirm DynamoDB has entry with S3 metadata, CloudWatch has processing logs.
        
        Services: S3 (entry) + Lambda + DynamoDB + CloudWatch Logs (4 services)
        Maps to prompt: S3 event-driven data processing workflow.
        """
        print("\n" + "="*80)
        print("END-TO-END TEST: S3 Upload -> Lambda -> DynamoDB + CloudWatch")
        print("="*80)
        
        self.assert_output_exists(
            'data_bucket_name',
            's3_processor_function_name',
            'dynamodb_table_name'
        )
        
        bucket_name = OUTPUTS['data_bucket_name']
        function_name = OUTPUTS['s3_processor_function_name']
        table_name = OUTPUTS['dynamodb_table_name']
        
        test_symbol = f"E2E-S3-{uuid.uuid4().hex[:8].upper()}"
        test_key = f"uploads/e2e-test-{uuid.uuid4().hex[:8]}.json"
        
        test_content = json.dumps({
            'symbol': test_symbol,
            'data': f"E2E S3 event test - {datetime.now(timezone.utc).isoformat()}"
        })
        
        print(f"[INFO] ENTRY POINT: Uploading file to S3 {bucket_name}/{test_key}")
        
        # ENTRY POINT: Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8'),
            ContentType='application/json'
        )
        
        print(f"[INFO] Waiting for S3 event to trigger Lambda processor...")
        
        # VERIFICATION 1: Lambda processes the file (check logs)
        print(f"[INFO] VERIFICATION 1: CloudWatch Logs for Lambda {function_name}")
        
        time.sleep(15)  # Wait for S3 event and Lambda execution
        
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, "No logs found for s3-processor Lambda")
        
        log_content = ' '.join(logs)
        has_processing = (test_key in log_content or 
                         test_symbol in log_content or
                         'Processing S3 event' in log_content or
                         'Processing S3 object' in log_content)
        
        self.assertTrue(has_processing, 
                       f"No S3 processing found in logs for key={test_key}")
        
        print(f"[SUCCESS] Lambda processing verified in CloudWatch: {len(logs)} log entries")
        
        # VERIFICATION 2: DynamoDB has the processed data
        print(f"[INFO] VERIFICATION 2: DynamoDB table {table_name}")
        
        # Query DynamoDB for the symbol (we don't know exact timestamp)
        table = dynamodb_resource.Table(table_name)
        
        max_wait = 20
        start_time = time.time()
        item_found = None
        
        while time.time() - start_time < max_wait:
            try:
                response = table.query(
                    KeyConditionExpression='symbol = :symbol',
                    ExpressionAttributeValues={':symbol': test_symbol},
                    ScanIndexForward=False,
                    Limit=1
                )
                
                if response.get('Items'):
                    item_found = response['Items'][0]
                    break
            except Exception as e:
                print(f"[WARN] Error querying DynamoDB: {e}")
            
            time.sleep(2)
        
        self.assertIsNotNone(item_found, f"Item with symbol {test_symbol} not found in DynamoDB")
        self.assertEqual(item_found['symbol'], test_symbol)
        self.assertEqual(item_found['s3_bucket'], bucket_name)
        self.assertEqual(item_found['s3_key'], test_key)
        
        print(f"[SUCCESS] Data verified in DynamoDB with S3 metadata")
        print(f"[SUCCESS] E2E TEST PASSED: S3 event-driven workflow verified across 4 services")
        
        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


if __name__ == '__main__':
    unittest.main()
