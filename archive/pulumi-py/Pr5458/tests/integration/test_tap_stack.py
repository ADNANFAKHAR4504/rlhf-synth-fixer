"""
Integration tests for the deployed Serverless Data Processing Pipeline (TapStack) infrastructure.

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
import requests
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
sfn_client = boto3.client('stepfunctions', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)


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

        return log_messages
    except ClientError:
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
                print(f"Found item in DynamoDB after {time.time() - start_time:.2f} seconds")
                return response['Item']
        except Exception as e:
            print(f"Error checking DynamoDB: {e}")
        time.sleep(1)
    
    print(f"Item not found in DynamoDB after {max_wait} seconds")
    return None


class TestServiceLevel(unittest.TestCase):
    """
    Service-Level Tests: Test individual AWS service operations.
    
    These tests perform actions on a single service and verify the result.
    Mapped to prompt: Individual service functionality validation.
    """

    def test_s3_bucket_upload_and_retrieve(self):
        """
        Service-Level: Upload a file to S3 and verify it can be retrieved.
        
        Action: Upload object to S3
        Verification: Object exists and can be retrieved
        
        Mapped to prompt: S3 bucket for data uploads
        """
        print("\n=== Test: S3 Upload and Retrieve ===")
        bucket_name = OUTPUTS.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        
        test_key = f"test-files/upload-test-{uuid.uuid4()}.txt"
        test_content = f"Test content at {datetime.now(timezone.utc).isoformat()}"
        
        print(f"Uploading object to s3://{bucket_name}/{test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8')
        )
        
        print(f"Retrieving object from S3")
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        retrieved_content = response['Body'].read().decode('utf-8')
        
        self.assertEqual(retrieved_content, test_content, "Retrieved content does not match uploaded content")
        print(f"Successfully uploaded and retrieved object from S3")
        
        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    def test_s3_bucket_versioning(self):
        """
        Service-Level: Test S3 bucket versioning by uploading same file twice.
        
        Action: Upload same key twice
        Verification: Multiple versions exist
        
        Mapped to prompt: S3 versioning enabled
        """
        print("\n=== Test: S3 Bucket Versioning ===")
        bucket_name = OUTPUTS.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        
        test_key = f"test-files/version-test-{uuid.uuid4()}.txt"
        
        print(f"Uploading first version")
        response1 = s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=b"Version 1"
        )
        version1 = response1.get('VersionId')
        
        time.sleep(1)
        
        print(f"Uploading second version")
        response2 = s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=b"Version 2"
        )
        version2 = response2.get('VersionId')
        
        self.assertIsNotNone(version1, "First version ID not returned")
        self.assertIsNotNone(version2, "Second version ID not returned")
        self.assertNotEqual(version1, version2, "Version IDs should be different")
        
        print(f"Successfully verified S3 versioning: v1={version1}, v2={version2}")
        
        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    def test_dynamodb_put_and_query_item(self):
        """
        Service-Level: Insert item into DynamoDB and query it back.
        
        Action: Put item in DynamoDB
        Verification: Item can be retrieved with correct data types (Decimal)
        
        Mapped to prompt: DynamoDB table for storing processed results
        """
        print("\n=== Test: DynamoDB Put and Query ===")
        table_name = OUTPUTS.get('dynamodb_table_name')
        self.assertIsNotNone(table_name, "DynamoDB table name not found in outputs")
        
        table = dynamodb_resource.Table(table_name)
        
        test_symbol = f"TEST{uuid.uuid4().hex[:6].upper()}"
        test_timestamp = Decimal(str(int(time.time())))
        
        print(f"Putting item into DynamoDB: symbol={test_symbol}, timestamp={test_timestamp}")
        table.put_item(
            Item={
                'symbol': test_symbol,
                'timestamp': test_timestamp,
                'price': Decimal('150.25'),
                'volume': Decimal('1000'),
                'processed_at': datetime.now(timezone.utc).isoformat()
            }
        )
        
        print(f"Querying item from DynamoDB")
        response = table.get_item(
            Key={
                'symbol': test_symbol,
                'timestamp': test_timestamp
            }
        )
        
        self.assertIn('Item', response, "Item not found in DynamoDB")
        item = response['Item']
        self.assertEqual(item['symbol'], test_symbol)
        self.assertEqual(item['timestamp'], test_timestamp)
        self.assertIsInstance(item['price'], Decimal, "Price should be Decimal type")
        self.assertIsInstance(item['volume'], Decimal, "Volume should be Decimal type")
        
        print(f"Successfully put and queried item from DynamoDB with correct Decimal types")
        
        # Cleanup
        table.delete_item(Key={'symbol': test_symbol, 'timestamp': test_timestamp})

    def test_lambda_direct_invocation(self):
        """
        Service-Level: Directly invoke a Lambda function and verify response.
        
        Action: Invoke Lambda function
        Verification: Function executes successfully and returns expected response
        
        Mapped to prompt: Lambda functions for data processing
        """
        print("\n=== Test: Lambda Direct Invocation ===")
        function_name = OUTPUTS.get('processing_lambda_name')
        self.assertIsNotNone(function_name, "Processing Lambda name not found in outputs")
        
        test_payload = {
            'test': True,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        print(f"Invoking Lambda function: {function_name}")
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )
        
        self.assertEqual(response['StatusCode'], 200, "Lambda invocation failed")
        
        payload = json.loads(response['Payload'].read())
        print(f"Lambda response: {json.dumps(payload, indent=2)}")
        
        self.assertIn('statusCode', payload, "Response missing statusCode")
        print(f"Successfully invoked Lambda function")


class TestCrossService(unittest.TestCase):
    """
    Cross-Service Tests: Test interactions between two AWS services.
    
    These tests trigger one service and verify the effect on another service.
    Mapped to prompt: Service integrations and data flow between services.
    """

    def test_lambda_writes_to_dynamodb(self):
        """
        Cross-Service: Invoke Lambda and verify it writes to DynamoDB.
        
        Service 1 (Trigger): Lambda function
        Service 2 (Verify): DynamoDB table
        
        Action: Invoke processing Lambda with S3 event payload
        Verification: Data appears in DynamoDB with correct Decimal types
        
        Mapped to prompt: Lambda processes data and stores in DynamoDB
        """
        print("\n=== Test: Lambda Writes to DynamoDB ===")
        function_name = OUTPUTS.get('processing_lambda_name')
        table_name = OUTPUTS.get('dynamodb_table_name')
        bucket_name = OUTPUTS.get('s3_bucket_name')
        self.assertIsNotNone(function_name, "Processing Lambda name not found in outputs")
        self.assertIsNotNone(table_name, "DynamoDB table name not found in outputs")
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        
        test_symbol = f"CROSS{uuid.uuid4().hex[:6].upper()}"
        test_timestamp = int(time.time())
        test_key = f"incoming/cross-test-{uuid.uuid4()}.csv"
        
        csv_content = f"symbol,timestamp,price,volume\n{test_symbol},{test_timestamp},100.50,5000\n"
        
        print(f"Uploading CSV file to S3: s3://{bucket_name}/{test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=csv_content.encode('utf-8')
        )
        
        payload = {
            'Records': [{
                's3': {
                    'bucket': {'name': bucket_name},
                    'object': {'key': test_key}
                }
            }]
        }
        
        print(f"Invoking Lambda to process data for symbol: {test_symbol}")
        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='Event',
            Payload=json.dumps(payload)
        )
        
        print(f"Waiting for item to appear in DynamoDB...")
        item = wait_for_dynamodb_item(
            table_name,
            {'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))},
            max_wait=30
        )
        
        self.assertIsNotNone(item, f"Item not found in DynamoDB after Lambda invocation")
        self.assertEqual(item['symbol'], test_symbol)
        self.assertIsInstance(item['timestamp'], Decimal, "Timestamp should be Decimal")
        
        print(f"Successfully verified Lambda wrote to DynamoDB")
        
        # Cleanup
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            s3_client.delete_object(Bucket=bucket_name, Key=f"processed/{test_key.split('/')[-1]}")
            table = dynamodb_resource.Table(table_name)
            table.delete_item(Key={'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))})
        except Exception:
            pass

    def test_api_gateway_invokes_lambda(self):
        """
        Cross-Service: API Gateway triggers Lambda and returns response.
        
        Service 1 (Trigger): API Gateway
        Service 2 (Verify): Lambda function execution
        
        Action: Send HTTP request to API Gateway endpoint
        Verification: Lambda executes and returns valid response
        
        Mapped to prompt: API Gateway exposes Lambda functionality
        """
        print("\n=== Test: API Gateway Invokes Lambda ===")
        api_endpoint = OUTPUTS.get('api_gateway_endpoint')
        self.assertIsNotNone(api_endpoint, "API Gateway endpoint not found in outputs")
        
        test_symbol = f"API{uuid.uuid4().hex[:6].upper()}"
        
        print(f"Sending GET request to API Gateway: {api_endpoint}/results/{test_symbol}")
        response = requests.get(
            f"{api_endpoint}/results/{test_symbol}",
            timeout=30
        )
        
        self.assertEqual(response.status_code, 200, f"API Gateway returned status {response.status_code}")
        
        data = response.json()
        print(f"API Gateway response: {json.dumps(data, indent=2)}")
        
        self.assertIn('symbol', data, "Response missing symbol field")
        self.assertIn('count', data, "Response missing count field")
        self.assertIn('results', data, "Response missing results field")
        self.assertEqual(data['symbol'], test_symbol, "Symbol mismatch in response")
        print(f"Successfully verified API Gateway invoked Lambda")

    def test_s3_event_triggers_lambda(self):
        """
        Cross-Service: S3 event notification triggers Lambda function.
        
        Service 1 (Trigger): S3 bucket (upload object)
        Service 2 (Verify): Lambda function (check CloudWatch logs)
        
        Action: Upload CSV file to S3 incoming/ folder
        Verification: Lambda function is triggered and logs show processing
        
        Mapped to prompt: Lambda triggered by S3 uploads
        """
        print("\n=== Test: S3 Event Triggers Lambda ===")
        bucket_name = OUTPUTS.get('s3_bucket_name')
        function_name = OUTPUTS.get('processing_lambda_name')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        self.assertIsNotNone(function_name, "Processing Lambda name not found in outputs")
        
        test_key = f"incoming/trigger-test-{uuid.uuid4()}.csv"
        csv_content = "symbol,timestamp,price,volume\nTEST,1234567890,100.50,1000\n"
        
        print(f"Uploading CSV to s3://{bucket_name}/{test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=csv_content.encode('utf-8')
        )
        
        print(f"Waiting for Lambda to process S3 event...")
        time.sleep(10)
        
        logs = get_recent_lambda_logs(function_name, minutes=2)
        
        self.assertTrue(len(logs) > 0, "No Lambda logs found after S3 upload")
        
        log_content = ' '.join(logs)
        self.assertTrue(
            'incoming' in log_content.lower() or 's3' in log_content.lower() or 'process' in log_content.lower(),
            "Lambda logs do not show S3 event processing"
        )
        
        print(f"Successfully verified S3 event triggered Lambda (found {len(logs)} log entries)")
        
        # Cleanup
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        except Exception:
            pass

    def test_step_functions_invokes_lambda(self):
        """
        Cross-Service: Step Functions state machine invokes Lambda.
        
        Service 1 (Trigger): Step Functions state machine
        Service 2 (Verify): Lambda function execution
        
        Action: Start Step Functions execution
        Verification: Execution completes successfully and Lambda was invoked
        
        Mapped to prompt: Step Functions orchestrates Lambda workflows
        """
        print("\n=== Test: Step Functions Invokes Lambda ===")
        state_machine_arn = OUTPUTS.get('state_machine_arn')
        self.assertIsNotNone(state_machine_arn, "State machine ARN not found in outputs")
        
        test_input = {
            'test': True,
            'execution_id': str(uuid.uuid4()),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        print(f"Starting Step Functions execution")
        response = sfn_client.start_execution(
            stateMachineArn=state_machine_arn,
            input=json.dumps(test_input)
        )
        
        execution_arn = response['executionArn']
        print(f"Execution started: {execution_arn}")
        
        print(f"Waiting for execution to complete...")
        max_wait = 60
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            exec_response = sfn_client.describe_execution(executionArn=execution_arn)
            status = exec_response['status']
            
            if status in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
                print(f"Execution completed with status: {status}")
                self.assertEqual(status, 'SUCCEEDED', f"Step Functions execution failed with status: {status}")
                break
            
            time.sleep(2)
        else:
            self.fail("Step Functions execution did not complete within timeout")
        
        print(f"Successfully verified Step Functions invoked Lambda")


class TestEndToEnd(unittest.TestCase):
    """
    End-to-End Tests: Test complete workflows through 3+ services.
    
    These tests trigger only the entry point and verify the entire data flow.
    Mapped to prompt: Complete serverless workflows from upload to storage.
    """

    def test_api_gateway_to_s3_to_dynamodb(self):
        """
        E2E: API Gateway -> Lambda -> S3 -> DynamoDB (4 services).
        
        Entry Point: API Gateway POST /upload
        Flow: API Gateway -> Upload Lambda -> S3 -> Processing Lambda -> DynamoDB
        Verification: File in S3 and data in DynamoDB
        
        Action: POST file upload request to API Gateway
        Verification: 
        - File appears in S3
        - Data is processed and stored in DynamoDB
        
        Mapped to prompt: Complete data upload and processing pipeline
        """
        print("\n=== Test: API Gateway -> S3 -> Lambda -> DynamoDB (E2E) ===")
        api_endpoint = OUTPUTS.get('api_gateway_endpoint')
        bucket_name = OUTPUTS.get('s3_bucket_name')
        table_name = OUTPUTS.get('dynamodb_table_name')
        
        self.assertIsNotNone(api_endpoint, "API Gateway endpoint not found in outputs")
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        self.assertIsNotNone(table_name, "DynamoDB table name not found in outputs")
        
        test_filename = f"e2e-test-{uuid.uuid4()}.csv"
        test_symbol = f"E2E{uuid.uuid4().hex[:6].upper()}"
        test_timestamp = int(time.time())
        
        csv_content = f"symbol,timestamp,price,volume\n{test_symbol},{test_timestamp},125.75,2500\n"
        
        print(f"Sending POST request to API Gateway to upload file: {test_filename}")
        response = requests.post(
            f"{api_endpoint}/upload",
            json={
                'filename': test_filename,
                'data': csv_content
            },
            timeout=30
        )
        
        self.assertEqual(response.status_code, 200, f"API Gateway returned status {response.status_code}")
        print(f"File upload initiated via API Gateway")
        
        print(f"Waiting for file to be uploaded and processed...")
        time.sleep(3)
        
        file_found = False
        file_location = None
        
        try:
            s3_client.head_object(Bucket=bucket_name, Key=f"incoming/{test_filename}")
            file_found = True
            file_location = f"incoming/{test_filename}"
            print(f"File found in S3: {file_location}")
        except ClientError:
            try:
                s3_client.head_object(Bucket=bucket_name, Key=f"processed/{test_filename}")
                file_found = True
                file_location = f"processed/{test_filename}"
                print(f"File already processed and moved to: {file_location}")
            except ClientError:
                pass
        
        self.assertTrue(file_found, "File not found in S3 (checked both incoming/ and processed/)")
        
        print(f"Waiting for data to be processed and stored in DynamoDB...")
        item = wait_for_dynamodb_item(
            table_name,
            {'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))},
            max_wait=45
        )
        
        self.assertIsNotNone(item, "Data not found in DynamoDB after E2E flow")
        self.assertEqual(item['symbol'], test_symbol)
        self.assertIsInstance(item['price'], Decimal, "Price should be Decimal")
        
        print(f"Successfully verified complete E2E flow: API Gateway -> S3 -> Lambda -> DynamoDB")
        
        # Cleanup
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=f"incoming/{test_filename}")
        except Exception:
            pass
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=f"processed/{test_filename}")
        except Exception:
            pass
        try:
            table = dynamodb_resource.Table(table_name)
            table.delete_item(Key={'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))})
        except Exception:
            pass

    def test_s3_upload_triggers_full_pipeline(self):
        """
        E2E: S3 -> Lambda -> DynamoDB -> CloudWatch (4 services).
        
        Entry Point: S3 bucket (upload CSV file)
        Flow: S3 event -> Processing Lambda -> DynamoDB + CloudWatch Logs
        Verification: Data in DynamoDB and logs in CloudWatch
        
        Action: Upload CSV file to S3 incoming/ folder
        Verification:
        - Lambda processes the file
        - Data is stored in DynamoDB with correct Decimal types
        - CloudWatch logs show processing activity
        
        Mapped to prompt: S3 triggers Lambda for async processing with monitoring
        """
        print("\n=== Test: S3 -> Lambda -> DynamoDB -> CloudWatch (E2E) ===")
        bucket_name = OUTPUTS.get('s3_bucket_name')
        table_name = OUTPUTS.get('dynamodb_table_name')
        function_name = OUTPUTS.get('processing_lambda_name')
        
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        self.assertIsNotNone(table_name, "DynamoDB table name not found in outputs")
        self.assertIsNotNone(function_name, "Processing Lambda name not found in outputs")
        
        test_symbol = f"PIPE{uuid.uuid4().hex[:6].upper()}"
        test_timestamp = int(time.time())
        test_key = f"incoming/pipeline-test-{uuid.uuid4()}.csv"
        
        csv_content = f"symbol,timestamp,price,volume\n{test_symbol},{test_timestamp},99.99,3000\n"
        
        print(f"Uploading CSV to S3: s3://{bucket_name}/{test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=csv_content.encode('utf-8')
        )
        
        print(f"Waiting for Lambda to process and write to DynamoDB...")
        item = wait_for_dynamodb_item(
            table_name,
            {'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))},
            max_wait=45
        )
        
        self.assertIsNotNone(item, "Data not found in DynamoDB after S3 upload")
        self.assertEqual(item['symbol'], test_symbol)
        self.assertEqual(item['timestamp'], Decimal(str(test_timestamp)))
        self.assertIsInstance(item['price'], Decimal, "Price should be Decimal")
        self.assertIsInstance(item['volume'], Decimal, "Volume should be Decimal")
        
        print(f"Checking CloudWatch logs for processing activity...")
        logs = get_recent_lambda_logs(function_name, minutes=2)
        
        self.assertTrue(len(logs) > 0, "No CloudWatch logs found after processing")
        
        log_content = ' '.join(logs)
        self.assertTrue(
            test_symbol in log_content or 'process' in log_content.lower(),
            "CloudWatch logs do not show data processing"
        )
        
        print(f"Successfully verified complete E2E pipeline: S3 -> Lambda -> DynamoDB -> CloudWatch")
        print(f"Found {len(logs)} log entries in CloudWatch")
        
        # Cleanup
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            table = dynamodb_resource.Table(table_name)
            table.delete_item(Key={'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))})
        except Exception:
            pass

    def test_step_functions_orchestrates_full_workflow(self):
        """
        E2E: Step Functions -> Lambda -> DynamoDB -> S3 (4 services).
        
        Entry Point: Step Functions state machine
        Flow: Step Functions -> Processing Lambda -> DynamoDB + S3 (processed/)
        Verification: Execution succeeds, data in DynamoDB, file moved in S3
        
        Action: Start Step Functions execution with test data
        Verification:
        - Execution completes successfully
        - Lambda processes data
        - Data appears in DynamoDB
        
        Mapped to prompt: Step Functions orchestrates multi-step workflows
        """
        print("\n=== Test: Step Functions -> Lambda -> DynamoDB -> S3 (E2E) ===")
        state_machine_arn = OUTPUTS.get('state_machine_arn')
        bucket_name = OUTPUTS.get('s3_bucket_name')
        table_name = OUTPUTS.get('dynamodb_table_name')
        
        self.assertIsNotNone(state_machine_arn, "State machine ARN not found in outputs")
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        self.assertIsNotNone(table_name, "DynamoDB table name not found in outputs")
        
        test_symbol = f"SFN{uuid.uuid4().hex[:6].upper()}"
        test_timestamp = int(time.time())
        test_file = f"workflow-test-{uuid.uuid4()}.csv"
        
        csv_content = f"symbol,timestamp,price,volume\n{test_symbol},{test_timestamp},150.00,4000\n"
        
        print(f"Uploading test file to S3 for Step Functions processing")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f"incoming/{test_file}",
            Body=csv_content.encode('utf-8')
        )
        
        execution_input = {
            'bucket': bucket_name,
            'key': f"incoming/{test_file}",
            'execution_id': str(uuid.uuid4())
        }
        
        print(f"Starting Step Functions execution")
        response = sfn_client.start_execution(
            stateMachineArn=state_machine_arn,
            input=json.dumps(execution_input)
        )
        
        execution_arn = response['executionArn']
        print(f"Execution started: {execution_arn}")
        
        print(f"Waiting for execution to complete...")
        max_wait = 60
        start_time = time.time()
        execution_succeeded = False
        
        while time.time() - start_time < max_wait:
            exec_response = sfn_client.describe_execution(executionArn=execution_arn)
            status = exec_response['status']
            
            if status in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
                print(f"Execution completed with status: {status}")
                execution_succeeded = (status == 'SUCCEEDED')
                break
            
            time.sleep(2)
        
        self.assertTrue(execution_succeeded, "Step Functions execution did not succeed")
        
        print(f"Checking if data was processed and stored in DynamoDB...")
        item = wait_for_dynamodb_item(
            table_name,
            {'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))},
            max_wait=30
        )
        
        self.assertIsNotNone(item, "Data not found in DynamoDB after Step Functions workflow")
        self.assertEqual(item['symbol'], test_symbol)
        self.assertIsInstance(item['price'], Decimal, "Price should be Decimal")
        
        print(f"Successfully verified complete Step Functions workflow orchestration")
        
        # Cleanup
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=f"incoming/{test_file}")
            table = dynamodb_resource.Table(table_name)
            table.delete_item(Key={'symbol': test_symbol, 'timestamp': Decimal(str(test_timestamp))})
        except Exception:
            pass


if __name__ == '__main__':
    unittest.main(verbosity=2)
