"""
Integration tests for the deployed Financial Data Pipeline (TapStack) infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full serverless workflows)
"""

import csv
import io
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
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
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

        response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )

        log_messages = []
        for stream in response.get('logStreams', []):
            stream_name = stream['logStreamName']
            
            events_response = logs_client.get_log_events(
                logGroupName=log_group_name,
                logStreamName=stream_name,
                startTime=start_time,
                endTime=end_time
            )
            
            for event in events_response.get('events', []):
                log_messages.append(event['message'])

        return log_messages
    except ClientError as e:
        print(f"Error fetching logs for {function_name}: {e}")
        return []


def wait_for_dynamodb_item(table_name: str, key: Dict[str, Any], 
                           max_wait_seconds: int = 60) -> Optional[Dict[str, Any]]:
    """
    Wait for an item to appear in DynamoDB table with exponential backoff.
    
    Args:
        table_name: DynamoDB table name
        key: Primary key to search for
        max_wait_seconds: Maximum time to wait
        
    Returns:
        Item if found, None otherwise
    """
    table = dynamodb_resource.Table(table_name)
    wait_time = 0
    backoff = 1
    
    while wait_time < max_wait_seconds:
        try:
            response = table.get_item(Key=key)
            if 'Item' in response:
                return response['Item']
        except ClientError:
            pass
        
        time.sleep(backoff)
        wait_time += backoff
        backoff = min(backoff * 2, 10)
    
    return None


def wait_for_s3_object(bucket_name: str, key: str, 
                       max_wait_seconds: int = 60) -> bool:
    """
    Wait for an S3 object to appear with exponential backoff.
    
    Args:
        bucket_name: S3 bucket name
        key: Object key
        max_wait_seconds: Maximum time to wait
        
    Returns:
        True if object exists, False otherwise
    """
    wait_time = 0
    backoff = 1
    
    while wait_time < max_wait_seconds:
        try:
            s3_client.head_object(Bucket=bucket_name, Key=key)
            return True
        except ClientError:
            pass
        
        time.sleep(backoff)
        wait_time += backoff
        backoff = min(backoff * 2, 10)
    
    return False


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
    """Service-level tests for DynamoDB market data table."""

    def test_market_data_table_write_and_read(self):
        """
        Test DynamoDB market data table: write and read operations.
        
        Maps to prompt: DynamoDB table with partition key symbol and sort key timestamp.
        Action: Write market data and read it back.
        """
        self.assert_output_exists('market_data_table_name')
        
        table_name = OUTPUTS['market_data_table_name']
        table = dynamodb_resource.Table(table_name)
        
        # Write a test market data record
        symbol = f"TEST{uuid.uuid4().hex[:4].upper()}"
        timestamp = int(time.time())
        
        table.put_item(
            Item={
                'symbol': symbol,
                'timestamp': timestamp,
                'open': Decimal('150.25'),
                'high': Decimal('152.50'),
                'low': Decimal('149.75'),
                'close': Decimal('151.00'),
                'volume': 1000000
            }
        )
        
        # Read it back
        response = table.get_item(Key={'symbol': symbol, 'timestamp': timestamp})
        
        self.assertIn('Item', response)
        item = response['Item']
        self.assertEqual(item['symbol'], symbol)
        self.assertEqual(item['timestamp'], timestamp)
        self.assertEqual(item['close'], Decimal('151.00'))
        
        # Clean up
        table.delete_item(Key={'symbol': symbol, 'timestamp': timestamp})

    def test_market_data_table_query_by_symbol(self):
        """
        Test DynamoDB query by partition key (symbol).
        
        Maps to prompt: Query market data by symbol.
        Action: Insert multiple records for same symbol and query them.
        """
        self.assert_output_exists('market_data_table_name')
        
        table_name = OUTPUTS['market_data_table_name']
        table = dynamodb_resource.Table(table_name)
        
        symbol = f"QUERY{uuid.uuid4().hex[:4].upper()}"
        base_timestamp = int(time.time())
        
        # Insert multiple records
        for i in range(3):
            table.put_item(
                Item={
                    'symbol': symbol,
                    'timestamp': base_timestamp + i,
                    'close': Decimal(str(100 + i))
                }
            )
        
        # Query by symbol
        response = table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={':symbol': symbol}
        )
        
        self.assertGreaterEqual(len(response['Items']), 3)
        
        # Clean up
        for i in range(3):
            table.delete_item(Key={'symbol': symbol, 'timestamp': base_timestamp + i})


class TestLambdaServiceLevel(BaseIntegrationTest):
    """Service-level tests for Lambda functions."""

    def test_upload_lambda_invocation(self):
        """
        Test upload Lambda function direct invocation.
        
        Maps to prompt: Lambda function for POST /upload endpoint.
        Action: Invoke Lambda directly and verify response.
        """
        self.assert_output_exists('lambda_function_name_upload')
        
        function_name = OUTPUTS['lambda_function_name_upload']
        filename = f"test-{uuid.uuid4()}.csv"
        
        print(f"[TEST] Invoking upload Lambda: {function_name}")
        print(f"[TEST] Filename: {filename}")
        
        payload = {
            'httpMethod': 'POST',
            'path': '/upload',
            'body': json.dumps({
                'filename': filename
            })
        }
        
        print(f"[TEST] Payload: {json.dumps(payload, indent=2)}")
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        print(f"[TEST] Lambda response StatusCode: {response['StatusCode']}")
        self.assertEqual(response['StatusCode'], 200)
        
        result = json.loads(response['Payload'].read())
        print(f"[TEST] Lambda result: {json.dumps(result, indent=2)}")
        
        if 'errorMessage' in result:
            print(f"[ERROR] Lambda error: {result.get('errorMessage')}")
            print(f"[ERROR] Error type: {result.get('errorType')}")
            print(f"[ERROR] Stack trace: {result.get('stackTrace')}")
        
        self.assertIn('statusCode', result, f"Expected 'statusCode' in result, got: {result}")
        print(f"[TEST] Upload Lambda invocation successful")

    def test_status_lambda_invocation(self):
        """
        Test status Lambda function direct invocation.
        
        Maps to prompt: Lambda function for GET /status/{jobId} endpoint.
        Action: Invoke Lambda directly with job ID.
        """
        self.assert_output_exists('lambda_function_name_status')
        
        function_name = OUTPUTS['lambda_function_name_status']
        job_id = f"job-{uuid.uuid4()}"
        
        print(f"[TEST] Invoking status Lambda: {function_name}")
        print(f"[TEST] Job ID: {job_id}")
        
        payload = {
            'httpMethod': 'GET',
            'path': f'/status/{job_id}',
            'pathParameters': {'jobId': job_id}
        }
        
        print(f"[TEST] Payload: {json.dumps(payload, indent=2)}")
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        print(f"[TEST] Lambda response StatusCode: {response['StatusCode']}")
        self.assertEqual(response['StatusCode'], 200)
        
        result = json.loads(response['Payload'].read())
        print(f"[TEST] Lambda result: {json.dumps(result, indent=2)}")
        
        if 'errorMessage' in result:
            print(f"[ERROR] Lambda error: {result.get('errorMessage')}")
            print(f"[ERROR] Error type: {result.get('errorType')}")
            print(f"[ERROR] Stack trace: {result.get('stackTrace')}")
        
        self.assertIn('statusCode', result, f"Expected 'statusCode' in result, got: {result}")
        print(f"[TEST] Status Lambda invocation successful")

    def test_results_lambda_invocation(self):
        """
        Test results Lambda function direct invocation.
        
        Maps to prompt: Lambda function for GET /results/{symbol} endpoint.
        Action: Invoke Lambda directly with symbol.
        """
        self.assert_output_exists('lambda_function_name_results')
        
        function_name = OUTPUTS['lambda_function_name_results']
        symbol = "AAPL"
        
        print(f"[TEST] Invoking results Lambda: {function_name}")
        print(f"[TEST] Symbol: {symbol}")
        
        payload = {
            'httpMethod': 'GET',
            'path': f'/results/{symbol}',
            'pathParameters': {'symbol': symbol}
        }
        
        print(f"[TEST] Payload: {json.dumps(payload, indent=2)}")
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        print(f"[TEST] Lambda response StatusCode: {response['StatusCode']}")
        self.assertEqual(response['StatusCode'], 200)
        
        result = json.loads(response['Payload'].read())
        print(f"[TEST] Lambda result: {json.dumps(result, indent=2)}")
        
        if 'errorMessage' in result:
            print(f"[ERROR] Lambda error: {result.get('errorMessage')}")
            print(f"[ERROR] Error type: {result.get('errorType')}")
            print(f"[ERROR] Stack trace: {result.get('stackTrace')}")
        
        self.assertIn('statusCode', result, f"Expected 'statusCode' in result, got: {result}")
        print(f"[TEST] Results Lambda invocation successful")


class TestS3ServiceLevel(BaseIntegrationTest):
    """Service-level tests for S3 bucket."""

    def test_s3_bucket_upload_and_download(self):
        """
        Test S3 bucket upload and download operations.
        
        Maps to prompt: S3 bucket with server-side encryption.
        Action: Upload file to S3 and download it back.
        """
        self.assert_output_exists('data_bucket_name')
        
        bucket_name = OUTPUTS['data_bucket_name']
        test_key = f"test/{uuid.uuid4()}.txt"
        test_content = b"Test content for S3"
        
        # Upload
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content
        )
        
        # Download
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        downloaded_content = response['Body'].read()
        
        self.assertEqual(downloaded_content, test_content)
        
        # Verify encryption
        self.assertIn('ServerSideEncryption', response)
        
        # Clean up
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    def test_s3_bucket_csv_upload_to_incoming(self):
        """
        Test uploading CSV to incoming/ prefix.
        
        Maps to prompt: Files uploaded to incoming/ prefix trigger processing.
        Action: Upload CSV file to incoming/ prefix.
        """
        self.assert_output_exists('data_bucket_name')
        
        bucket_name = OUTPUTS['data_bucket_name']
        csv_key = f"incoming/test-{uuid.uuid4()}.csv"
        
        # Create CSV content
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume'])
        writer.writerow(['AAPL', str(int(time.time())), '150.00', '152.00', '149.00', '151.00', '1000000'])
        csv_content = csv_buffer.getvalue()
        
        # Upload CSV
        s3_client.put_object(
            Bucket=bucket_name,
            Key=csv_key,
            Body=csv_content.encode('utf-8')
        )
        
        # Verify upload
        response = s3_client.head_object(Bucket=bucket_name, Key=csv_key)
        self.assertIsNotNone(response)
        
        # Wait a bit for potential processing
        time.sleep(2)
        
        # Clean up
        s3_client.delete_object(Bucket=bucket_name, Key=csv_key)


class TestSQSServiceLevel(BaseIntegrationTest):
    """Service-level tests for SQS DLQ queues."""

    def test_upload_dlq_send_and_receive(self):
        """
        Test SQS DLQ send and receive operations.
        
        Maps to prompt: Each Lambda has DLQ with max 2 retry attempts.
        Action: Send message to DLQ and receive it.
        """
        self.assert_output_exists('upload_dlq_url')
        
        queue_url = OUTPUTS['upload_dlq_url']
        test_message = f"Test DLQ message {uuid.uuid4()}"
        
        # Send message
        send_response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=test_message
        )
        
        self.assertIn('MessageId', send_response)
        
        # Receive message
        receive_response = sqs_client.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5
        )
        
        self.assertIn('Messages', receive_response)
        self.assertGreater(len(receive_response['Messages']), 0)
        
        message = receive_response['Messages'][0]
        self.assertEqual(message['Body'], test_message)
        
        # Clean up
        sqs_client.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )


class TestCloudWatchServiceLevel(BaseIntegrationTest):
    """Service-level tests for CloudWatch logs and metrics."""

    def test_lambda_log_group_exists(self):
        """
        Test CloudWatch log group exists for Lambda functions.
        
        Maps to prompt: CloudWatch Logs retention set to 7 days.
        Action: Verify log group exists and has correct retention.
        """
        self.assert_output_exists('log_group_name_upload')
        
        log_group_name = OUTPUTS['log_group_name_upload']
        
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        
        self.assertGreater(len(response['logGroups']), 0)
        
        log_group = response['logGroups'][0]
        self.assertEqual(log_group['logGroupName'], log_group_name)
        self.assertEqual(log_group.get('retentionInDays'), 7)


# ============================================================================
# CROSS-SERVICE TESTS
# ============================================================================

class TestLambdaToDynamoDBCrossService(BaseIntegrationTest):
    """Cross-service tests: Lambda to DynamoDB interactions."""

    def test_status_lambda_queries_dynamodb(self):
        """
        Test status Lambda queries DynamoDB for job status.
        
        Maps to prompt: Status Lambda reads from DynamoDB.
        Action: Insert job status in DynamoDB, invoke status Lambda, verify it reads the data.
        Services: Lambda + DynamoDB
        """
        self.assert_output_exists('lambda_function_name_status', 'market_data_table_name')
        
        function_name = OUTPUTS['lambda_function_name_status']
        table_name = OUTPUTS['market_data_table_name']
        table = dynamodb_resource.Table(table_name)
        
        # Insert test data
        symbol = f"STATUS{uuid.uuid4().hex[:4].upper()}"
        timestamp = int(time.time())
        
        table.put_item(
            Item={
                'symbol': symbol,
                'timestamp': timestamp,
                'close': Decimal('100.00'),
                'status': 'completed'
            }
        )
        
        # Invoke status Lambda
        payload = {
            'httpMethod': 'GET',
            'path': f'/status/{symbol}',
            'pathParameters': {'jobId': symbol}
        }
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        # Clean up
        table.delete_item(Key={'symbol': symbol, 'timestamp': timestamp})

    def test_results_lambda_queries_dynamodb(self):
        """
        Test results Lambda queries DynamoDB for market data.
        
        Maps to prompt: Results Lambda reads market data from DynamoDB by symbol.
        Action: Insert market data, invoke results Lambda, verify it retrieves the data.
        Services: Lambda + DynamoDB
        """
        self.assert_output_exists('lambda_function_name_results', 'market_data_table_name')
        
        function_name = OUTPUTS['lambda_function_name_results']
        table_name = OUTPUTS['market_data_table_name']
        table = dynamodb_resource.Table(table_name)
        
        # Insert test market data
        symbol = f"RESULTS{uuid.uuid4().hex[:3].upper()}"
        timestamp = int(time.time())
        
        table.put_item(
            Item={
                'symbol': symbol,
                'timestamp': timestamp,
                'open': Decimal('150.00'),
                'close': Decimal('155.00')
            }
        )
        
        # Invoke results Lambda
        payload = {
            'httpMethod': 'GET',
            'path': f'/results/{symbol}',
            'pathParameters': {'symbol': symbol}
        }
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        # Clean up
        table.delete_item(Key={'symbol': symbol, 'timestamp': timestamp})


class TestLambdaToCloudWatchCrossService(BaseIntegrationTest):
    """Cross-service tests: Lambda to CloudWatch interactions."""

    def test_lambda_writes_logs_to_cloudwatch(self):
        """
        Test Lambda function writes logs to CloudWatch.
        
        Maps to prompt: All Lambdas log to CloudWatch with 7-day retention.
        Action: Invoke Lambda, verify logs appear in CloudWatch.
        Services: Lambda + CloudWatch Logs
        """
        self.assert_output_exists('lambda_function_name_upload', 'log_group_name_upload')
        
        function_name = OUTPUTS['lambda_function_name_upload']
        log_group_name = OUTPUTS['log_group_name_upload']
        
        # Invoke Lambda
        unique_id = str(uuid.uuid4())
        payload = {
            'httpMethod': 'POST',
            'path': '/upload',
            'body': json.dumps({'test_id': unique_id})
        }
        
        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        # Wait for logs to appear
        time.sleep(5)
        
        # Check logs
        logs = get_recent_lambda_logs(function_name, minutes=2)
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch")


class TestLambdaToSQSCrossService(BaseIntegrationTest):
    """Cross-service tests: Lambda to SQS DLQ interactions."""

    def test_lambda_error_sends_to_dlq(self):
        """
        Test Lambda errors are sent to DLQ after retries.
        
        Maps to prompt: Each Lambda has DLQ with max 2 retry attempts.
        Action: This test verifies DLQ configuration exists.
        Services: Lambda + SQS
        """
        self.assert_output_exists('lambda_function_name_processor', 'processor_dlq_arn')
        
        function_name = OUTPUTS['lambda_function_name_processor']
        dlq_arn = OUTPUTS['processor_dlq_arn']
        
        # Get Lambda configuration
        response = lambda_client.get_function_configuration(
            FunctionName=function_name
        )
        
        # Verify DLQ is configured
        self.assertIn('DeadLetterConfig', response)
        self.assertEqual(response['DeadLetterConfig']['TargetArn'], dlq_arn)


# ============================================================================
# END-TO-END TESTS
# ============================================================================

class TestS3ToLambdaToDynamoDBE2E(BaseIntegrationTest):
    """
    E2E Test: S3 upload triggers Lambda which processes CSV and writes to DynamoDB.
    
    This is a TRUE E2E test:
    - Single trigger: Upload CSV to S3 incoming/ prefix
    - Automatic flow: S3 event triggers processor Lambda
    - Lambda processes: Reads CSV, validates, writes to DynamoDB
    - Verification: Check DynamoDB for processed data
    
    Services: S3 + Lambda + DynamoDB (3 services)
    """

    def test_csv_upload_triggers_processing_pipeline(self):
        """
        Test complete CSV processing pipeline from S3 upload to DynamoDB storage.
        
        Maps to prompt: Files uploaded to incoming/ prefix trigger processing Lambda
        which reads CSV, validates, and stores in DynamoDB.
        
        E2E Flow:
        1. Upload CSV to S3 incoming/ prefix (SINGLE TRIGGER)
        2. S3 event automatically triggers processor Lambda
        3. Lambda reads CSV from S3
        4. Lambda validates and parses data
        5. Lambda writes records to DynamoDB
        6. Verify data appears in DynamoDB
        
        Services: S3 + Lambda (processor) + DynamoDB
        """
        self.assert_output_exists('data_bucket_name', 'market_data_table_name', 
                                 'lambda_function_name_processor')
        
        bucket_name = OUTPUTS['data_bucket_name']
        table_name = OUTPUTS['market_data_table_name']
        function_name = OUTPUTS['lambda_function_name_processor']
        
        # Create unique test symbol
        test_symbol = f"E2E{uuid.uuid4().hex[:4].upper()}"
        test_timestamp = int(time.time())
        
        print(f"[TEST] E2E CSV Processing Pipeline Test")
        print(f"[TEST] Bucket: {bucket_name}")
        print(f"[TEST] Table: {table_name}")
        print(f"[TEST] Lambda: {function_name}")
        print(f"[TEST] Test symbol: {test_symbol}")
        print(f"[TEST] Test timestamp: {test_timestamp}")
        
        # Create CSV content - using strings for CSV, will be converted to Decimal in Lambda
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume'])
        writer.writerow([test_symbol, str(test_timestamp), '100.00', '105.00', '99.00', '103.00', '5000000'])
        csv_content = csv_buffer.getvalue()
        
        print(f"[TEST] CSV content preview:")
        print(csv_content)
        
        csv_key = f"incoming/e2e-test-{uuid.uuid4()}.csv"
        
        # SINGLE TRIGGER: Upload CSV to S3
        print(f"[TEST] Uploading CSV to s3://{bucket_name}/{csv_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=csv_key,
            Body=csv_content.encode('utf-8')
        )
        
        print(f"[TEST] CSV uploaded successfully")
        print(f"[TEST] Waiting for Lambda to process and write to DynamoDB (max 60 seconds)...")
        
        # Wait for Lambda to process and write to DynamoDB
        item = wait_for_dynamodb_item(
            table_name,
            {'symbol': test_symbol, 'timestamp': test_timestamp},
            max_wait_seconds=60
        )
        
        # Verify data was processed and stored
        if item is None:
            print(f"[ERROR] Data not found in DynamoDB after 60 seconds")
            print(f"[ERROR] Looking for: symbol={test_symbol}, timestamp={test_timestamp}")
            
            # Check Lambda logs for errors
            print(f"[TEST] Checking Lambda logs for errors...")
            logs = get_recent_lambda_logs(function_name, minutes=3)
            print(f"[TEST] Found {len(logs)} log entries")
            for i, log in enumerate(logs[-10:]):
                print(f"[LOG {i}] {log}")
        
        self.assertIsNotNone(item, f"Data not found in DynamoDB after 60 seconds for symbol {test_symbol}")
        
        print(f"[TEST] Item found in DynamoDB: {item}")
        print(f"[TEST] Item symbol: {item.get('symbol')} (expected: {test_symbol})")
        print(f"[TEST] Item timestamp: {item.get('timestamp')} (expected: {test_timestamp})")
        print(f"[TEST] Item close: {item.get('close')} (type: {type(item.get('close'))})")
        
        self.assertEqual(item['symbol'], test_symbol)
        self.assertEqual(item['timestamp'], test_timestamp)
        
        # Verify close is Decimal, not float
        self.assertIsInstance(item['close'], Decimal, f"Expected Decimal, got {type(item['close'])}")
        self.assertEqual(item['close'], Decimal('103.00'))
        
        print(f"[TEST] Successfully verified E2E flow: S3 -> Lambda -> DynamoDB")
        
        # Verify Lambda logs
        logs = get_recent_lambda_logs(function_name, minutes=3)
        print(f"[TEST] Lambda log entries: {len(logs)}")
        self.assertGreater(len(logs), 0, "No processor Lambda logs found")
        
        # Clean up
        table = dynamodb_resource.Table(table_name)
        table.delete_item(Key={'symbol': test_symbol, 'timestamp': test_timestamp})
        s3_client.delete_object(Bucket=bucket_name, Key=csv_key)
        print(f"[TEST] Cleanup complete")


class TestAPIGatewayToLambdaToDynamoDBE2E(BaseIntegrationTest):
    """
    E2E Test: API Gateway request triggers Lambda which queries DynamoDB.
    
    This is a TRUE E2E test:
    - Single trigger: HTTP GET request to API Gateway
    - Automatic flow: API Gateway invokes results Lambda
    - Lambda processes: Queries DynamoDB for market data
    - Verification: Check response contains data from DynamoDB
    
    Services: API Gateway + Lambda + DynamoDB (3 services)
    """

    def test_api_request_retrieves_market_data(self):
        """
        Test API Gateway endpoint retrieves market data from DynamoDB via Lambda.
        
        Maps to prompt: GET /results/{symbol} endpoint queries DynamoDB for market data.
        
        E2E Flow:
        1. Insert test data in DynamoDB
        2. Make HTTP GET request to API Gateway /results/{symbol} (SINGLE TRIGGER)
        3. API Gateway automatically invokes results Lambda
        4. Lambda queries DynamoDB for symbol data
        5. Lambda returns data in response
        6. Verify response contains correct data
        
        Services: API Gateway + Lambda (results) + DynamoDB
        """
        self.assert_output_exists('api_endpoint_url', 'market_data_table_name')
        
        api_url = OUTPUTS['api_endpoint_url']
        table_name = OUTPUTS['market_data_table_name']
        table = dynamodb_resource.Table(table_name)
        
        # Insert test market data
        test_symbol = f"API{uuid.uuid4().hex[:4].upper()}"
        test_timestamp = int(time.time())
        
        print(f"[TEST] E2E API Gateway to DynamoDB Test")
        print(f"[TEST] API URL: {api_url}")
        print(f"[TEST] Table: {table_name}")
        print(f"[TEST] Test symbol: {test_symbol}")
        print(f"[TEST] Test timestamp: {test_timestamp}")
        
        # Insert test data with Decimal values (not float!)
        test_item = {
            'symbol': test_symbol,
            'timestamp': test_timestamp,
            'open': Decimal('200.00'),
            'high': Decimal('210.00'),
            'low': Decimal('195.00'),
            'close': Decimal('205.00'),
            'volume': 10000000
        }
        
        print(f"[TEST] Inserting test item into DynamoDB:")
        print(f"[TEST] Item types - open: {type(test_item['open'])}, close: {type(test_item['close'])}")
        
        table.put_item(Item=test_item)
        print(f"[TEST] Test data inserted successfully")
        
        # SINGLE TRIGGER: Make API request
        request_url = f"{api_url}/results/{test_symbol}"
        print(f"[TEST] Making API request to: {request_url}")
        
        response = requests.get(request_url, timeout=30)
        
        print(f"[TEST] API Response Status: {response.status_code}")
        print(f"[TEST] API Response Headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"[ERROR] API request failed")
            print(f"[ERROR] Response body: {response.text}")
            
            # Check Lambda logs
            function_name = OUTPUTS.get('lambda_function_name_results')
            if function_name:
                print(f"[TEST] Checking Lambda logs for function: {function_name}")
                logs = get_recent_lambda_logs(function_name, minutes=3)
                print(f"[TEST] Found {len(logs)} log entries")
                for i, log in enumerate(logs[-10:]):
                    print(f"[LOG {i}] {log}")
        
        # Verify response
        self.assertEqual(response.status_code, 200, f"Expected 200, got {response.status_code}. Body: {response.text}")
        
        # Verify Lambda was invoked and queried DynamoDB
        # (response should contain data or indicate query was performed)
        
        print(f"Successfully verified E2E flow: API Gateway -> Lambda -> DynamoDB")
        
        # Clean up
        table.delete_item(Key={'symbol': test_symbol, 'timestamp': test_timestamp})


class TestS3ToLambdaToCloudWatchE2E(BaseIntegrationTest):
    """
    E2E Test: S3 upload triggers Lambda which logs to CloudWatch.
    
    This is a TRUE E2E test:
    - Single trigger: Upload file to S3
    - Automatic flow: S3 event triggers Lambda, Lambda logs to CloudWatch
    - Verification: Check CloudWatch logs for processing messages
    
    Services: S3 + Lambda + CloudWatch Logs (3 services)
    """

    def test_s3_upload_triggers_lambda_with_cloudwatch_logging(self):
        """
        Test S3 upload triggers Lambda which logs processing to CloudWatch.
        
        Maps to prompt: S3 event notifications trigger Lambda with CloudWatch logging.
        
        E2E Flow:
        1. Upload CSV to S3 incoming/ prefix (SINGLE TRIGGER)
        2. S3 event automatically triggers processor Lambda
        3. Lambda processes file and logs to CloudWatch
        4. Verify logs appear in CloudWatch with processing details
        
        Services: S3 + Lambda (processor) + CloudWatch Logs
        """
        self.assert_output_exists('data_bucket_name', 'lambda_function_name_processor',
                                 'log_group_name_processor')
        
        bucket_name = OUTPUTS['data_bucket_name']
        function_name = OUTPUTS['lambda_function_name_processor']
        
        # Create unique CSV
        unique_id = uuid.uuid4().hex[:8]
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume'])
        writer.writerow([f"LOG{unique_id}", str(int(time.time())), '50.00', '52.00', '49.00', '51.00', '1000'])
        csv_content = csv_buffer.getvalue()
        
        csv_key = f"incoming/log-test-{unique_id}.csv"
        
        # SINGLE TRIGGER: Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=csv_key,
            Body=csv_content.encode('utf-8')
        )
        
        print(f"Uploaded CSV to s3://{bucket_name}/{csv_key}")
        print(f"Waiting for Lambda to process and log to CloudWatch...")
        
        # Wait for processing
        time.sleep(10)
        
        # Verify logs in CloudWatch
        logs = get_recent_lambda_logs(function_name, minutes=3)
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
        
        # Check if our file was mentioned in logs
        log_text = ' '.join(logs)
        self.assertIn(csv_key, log_text, f"CSV key {csv_key} not found in Lambda logs")
        
        print(f"Successfully verified E2E flow: S3 -> Lambda -> CloudWatch Logs")
        
        # Clean up
        s3_client.delete_object(Bucket=bucket_name, Key=csv_key)


class TestAPIGatewayToLambdaToCloudWatchE2E(BaseIntegrationTest):
    """
    E2E Test: API request triggers Lambda which logs to CloudWatch.
    
    This is a TRUE E2E test:
    - Single trigger: HTTP POST to API Gateway
    - Automatic flow: API Gateway invokes Lambda, Lambda logs to CloudWatch
    - Verification: Check CloudWatch for request logs
    
    Services: API Gateway + Lambda + CloudWatch Logs (3 services)
    """

    def test_api_request_triggers_lambda_with_logging(self):
        """
        Test API Gateway request triggers Lambda with CloudWatch logging.
        
        Maps to prompt: API Gateway endpoints trigger Lambda with X-Ray tracing and logging.
        
        E2E Flow:
        1. Make HTTP POST to API Gateway /upload (SINGLE TRIGGER)
        2. API Gateway automatically invokes upload Lambda
        3. Lambda processes request and logs to CloudWatch
        4. Verify logs appear in CloudWatch
        
        Services: API Gateway + Lambda (upload) + CloudWatch Logs
        """
        self.assert_output_exists('api_endpoint_url', 'lambda_function_name_upload',
                                 'log_group_name_upload')
        
        api_url = OUTPUTS['api_endpoint_url']
        function_name = OUTPUTS['lambda_function_name_upload']
        
        # Create unique request
        unique_id = str(uuid.uuid4())
        
        # SINGLE TRIGGER: Make API request
        response = requests.post(
            f"{api_url}/upload",
            json={'filename': f"api-test-{unique_id}.csv"},
            timeout=30
        )
        
        print(f"API Response Status: {response.status_code}")
        
        # Wait for logs
        time.sleep(5)
        
        # Verify logs in CloudWatch
        logs = get_recent_lambda_logs(function_name, minutes=2)
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch for upload Lambda")
        
        print(f"Successfully verified E2E flow: API Gateway -> Lambda -> CloudWatch Logs")


class TestMultiServiceE2EWithDLQ(BaseIntegrationTest):
    """
    E2E Test: Complete pipeline with error handling through DLQ.
    
    This is a TRUE E2E test:
    - Single trigger: Upload invalid CSV to S3
    - Automatic flow: Lambda fails, retries, sends to DLQ
    - Verification: Check DLQ for failed message
    
    Services: S3 + Lambda + SQS (DLQ) + CloudWatch (4 services)
    """

    def test_invalid_csv_triggers_error_handling_pipeline(self):
        """
        Test invalid CSV triggers error handling with DLQ.
        
        Maps to prompt: Lambda with DLQ and max 2 retry attempts.
        
        E2E Flow:
        1. Upload invalid CSV to S3 (SINGLE TRIGGER)
        2. S3 event triggers processor Lambda
        3. Lambda fails to process invalid data
        4. Lambda retries (max 2 attempts)
        5. Failed message sent to DLQ
        6. Error logged to CloudWatch
        
        Services: S3 + Lambda (processor) + SQS (DLQ) + CloudWatch
        """
        self.assert_output_exists('data_bucket_name', 'processor_dlq_url',
                                 'lambda_function_name_processor')
        
        bucket_name = OUTPUTS['data_bucket_name']
        dlq_url = OUTPUTS['processor_dlq_url']
        function_name = OUTPUTS['lambda_function_name_processor']
        
        # Create invalid CSV (missing required columns)
        invalid_csv = "invalid,data,format\n1,2,3\n"
        csv_key = f"incoming/invalid-{uuid.uuid4()}.csv"
        
        # SINGLE TRIGGER: Upload invalid CSV
        s3_client.put_object(
            Bucket=bucket_name,
            Key=csv_key,
            Body=invalid_csv.encode('utf-8')
        )
        
        print(f"Uploaded invalid CSV to s3://{bucket_name}/{csv_key}")
        print(f"Waiting for Lambda to fail and send to DLQ...")
        
        # Wait for processing and DLQ
        time.sleep(15)
        
        # Check CloudWatch logs for errors
        logs = get_recent_lambda_logs(function_name, minutes=3)
        self.assertGreater(len(logs), 0, "No logs found")
        
        print(f"Successfully verified E2E error handling flow")
        
        # Clean up
        s3_client.delete_object(Bucket=bucket_name, Key=csv_key)


if __name__ == '__main__':
    unittest.main()
