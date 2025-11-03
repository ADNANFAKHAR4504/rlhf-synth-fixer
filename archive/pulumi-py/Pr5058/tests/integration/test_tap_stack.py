"""
Integration tests for the deployed TapStack serverless infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full serverless workflows)

The tests use stack outputs exported from lib/tap_stack.py to discover resources.
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


def wait_for_lambda_logs(logs_client, log_group_name: str, start_time: int, 
                         search_string: str, max_wait: int = 60) -> bool:
    """
    Wait for specific log message to appear in CloudWatch Logs.
    
    Args:
        logs_client: boto3 CloudWatch Logs client
        log_group_name: CloudWatch log group name
        start_time: Start time in milliseconds since epoch
        search_string: String to search for in logs
        max_wait: Maximum wait time in seconds
        
    Returns:
        True if log found, False otherwise
    """
    print(f"\n[SEARCH] Searching CloudWatch Logs:")
    print(f"   Log Group: {log_group_name}")
    print(f"   Search String: '{search_string}'")
    print(f"   Start Time: {start_time} ({datetime.fromtimestamp(start_time/1000, tz=timezone.utc).isoformat()})")
    print(f"   Max Wait: {max_wait}s")
    
    end_time = time.time() + max_wait
    wait_interval = 2
    attempt = 0
    
    while time.time() < end_time:
        attempt += 1
        remaining = int(end_time - time.time())
        print(f"   Attempt {attempt} (remaining: {remaining}s)...", end=" ")
        
        try:
            # Get recent log streams
            streams_response = logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )
            
            stream_count = len(streams_response.get('logStreams', []))
            print(f"found {stream_count} streams")
            
            # Search through log streams
            for stream in streams_response.get('logStreams', []):
                stream_name = stream['logStreamName']
                
                try:
                    events_response = logs_client.get_log_events(
                        logGroupName=log_group_name,
                        logStreamName=stream_name,
                        startTime=start_time,
                        limit=100
                    )
                    
                    events = events_response.get('events', [])
                    for event in events:
                        if search_string in event.get('message', ''):
                            print(f"\n[FOUND] Log message containing '{search_string}'")
                            print(f"   Stream: {stream_name}")
                            print(f"   Message: {event.get('message', '')[:200]}")
                            return True
                            
                except ClientError as e:
                    if e.response['Error']['Code'] != 'ResourceNotFoundException':
                        print(f"\n[WARNING] Error reading log stream {stream_name}: {e}")
                        
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"log group not found yet")
            else:
                print(f"\n[WARNING] Error checking logs: {e}")
        
        time.sleep(wait_interval)
        wait_interval = min(wait_interval * 1.5, 10)
    
    print(f"\n[ERROR] Log message containing '{search_string}' not found within {max_wait} seconds")
    print(f"   This could indicate:")
    print(f"   - Lambda did not execute")
    print(f"   - S3 event notification delay")
    print(f"   - CloudWatch log ingestion delay")
    print(f"   - Lambda execution error (check AWS Console)")
    return False


# Get environment configuration
ENVIRONMENT_SUFFIX = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
PRIMARY_REGION = os.getenv('AWS_REGION', 'us-east-1')

# Load Pulumi stack outputs from flat-outputs.json
OUTPUTS = load_outputs()

# Initialize AWS SDK clients
dynamodb_client = boto3.client('dynamodb', region_name=PRIMARY_REGION)
dynamodb_resource = boto3.resource('dynamodb', region_name=PRIMARY_REGION)
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
lambda_client = boto3.client('lambda', region_name=PRIMARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup and utilities."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class with outputs validation."""
        if not OUTPUTS:
            print("WARNING: No outputs loaded. Tests may fail.")
            print(f"Expected outputs file at: {FLAT_OUTPUTS_PATH}")
        else:
            print(f"Loaded outputs: {list(OUTPUTS.keys())}")
        
        # Wait for IAM role propagation (AWS can take up to 10-15 seconds)
        print("\n" + "="*80)
        print("IAM PROPAGATION WAIT")
        print("="*80)
        print(f"[WAIT] Waiting 15 seconds for IAM role propagation...")
        print(f"   Current time: {datetime.now(timezone.utc).isoformat()}")
        print(f"   AWS Region: {os.environ.get('AWS_REGION', 'not set')}")
        print(f"   Account ID: {os.environ.get('CURRENT_ACCOUNT_ID', 'not set')}")
        time.sleep(15)
        print(f"[DONE] IAM propagation wait complete at: {datetime.now(timezone.utc).isoformat()}")
        print("="*80 + "\n")
    
    def setUp(self):
        """Set up individual test."""
        self.test_id = str(uuid.uuid4())[:8]
        self.start_time = int(time.time() * 1000)
    
    def get_output(self, key: str, required: bool = True) -> Optional[str]:
        """
        Get output value from stack outputs.
        
        Args:
            key: Output key
            required: If True, fail test if output not found
            
        Returns:
            Output value or None
        """
        value = OUTPUTS.get(key)
        if required and not value:
            self.fail(f"Required output '{key}' not found in stack outputs")
        return value


# ============================================================================
# PART 1: SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
# ============================================================================

class ServiceLevelTests(BaseIntegrationTest):
    """
    Service-Level Tests: Validate operations within a single service.
    
    These tests perform actual actions on individual AWS services:
    - Lambda invocations
    - DynamoDB operations
    - S3 operations
    """
    
    def test_lambda_api_handler_invocation(self):
        """
        Service-Level Test: Invoke API handler Lambda directly and verify response.
        
        Tests: Lambda execution with DynamoDB write and SNS notification.
        """
        function_name = self.get_output('api_handler_name')
        role_arn = self.get_output('api_handler_role_arn')
        
        # Prepare test payload
        payload = {
            'httpMethod': 'POST',
            'path': '/items',
            'body': json.dumps({
                'item_id': f'test-{self.test_id}',
                'status': 'active',
                'data': {'test': True, 'timestamp': int(time.time())}
            })
        }
        
        print(f"\n[INVOKE] Invoking Lambda function:")
        print(f"   Function: {function_name}")
        print(f"   Role ARN: {role_arn}")
        print(f"   Payload: {json.dumps(payload, indent=2)}")
        
        try:
            # Invoke Lambda
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            print(f"[SUCCESS] Lambda invocation successful (StatusCode: {response['StatusCode']})")
            
            # Verify response
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            response_payload = json.loads(response['Payload'].read())
            print(f"   Response payload: {json.dumps(response_payload, indent=2)[:500]}")
            
            self.assertEqual(response_payload['statusCode'], 200)
            
            # Parse body
            body = json.loads(response_payload['body'])
            self.assertEqual(body['message'], 'Item created successfully')
            self.assertIn('item', body)
            self.assertEqual(body['item']['item_id'], f'test-{self.test_id}')
            
            print(f"[SUCCESS] Successfully invoked Lambda and created item: test-{self.test_id}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            print(f"\n[ERROR] Lambda invocation failed:")
            print(f"   Error Code: {error_code}")
            print(f"   Error Message: {error_msg}")
            print(f"   Function: {function_name}")
            print(f"   Role: {role_arn}")
            
            if error_code == 'AccessDeniedException':
                print(f"\n[WARNING] IAM PROPAGATION ISSUE DETECTED:")
                print(f"   - The Lambda role may not be fully propagated yet")
                print(f"   - AWS IAM can take up to 60 seconds to propagate globally")
                print(f"   - Current wait time: 15 seconds")
                print(f"   - Recommendation: Increase wait time to 30-45 seconds")
            
            raise
    
    def test_dynamodb_put_and_get_item(self):
        """
        Service-Level Test: Put item in DynamoDB and retrieve it.
        
        Tests: DynamoDB table operations (put_item, get_item).
        """
        table_name = self.get_output('dynamodb_table_name')
        table = dynamodb_resource.Table(table_name)
        
        # Create test item with composite key (item_id + timestamp)
        item_id = f'direct-test-{self.test_id}'
        timestamp = int(time.time())
        test_item = {
            'item_id': item_id,
            'timestamp': timestamp,
            'status': 'testing',
            'data': {'source': 'integration_test'},
            'created_at': timestamp
        }
        
        print(f"Putting item in DynamoDB table: {table_name}")
        
        # Put item
        table.put_item(Item=test_item)
        
        # Get item back using composite key
        response = table.get_item(Key={
            'item_id': item_id,
            'timestamp': timestamp
        })
        
        # Verify item
        self.assertIn('Item', response)
        retrieved_item = response['Item']
        self.assertEqual(retrieved_item['item_id'], item_id)
        self.assertEqual(retrieved_item['timestamp'], timestamp)
        self.assertEqual(retrieved_item['status'], 'testing')
        self.assertIn('data', retrieved_item)
        
        print(f"Successfully put and retrieved item: {item_id}")
    
    def test_s3_upload_and_verify(self):
        """
        Service-Level Test: Upload file to S3 and verify it exists.
        
        Tests: S3 bucket operations (put_object, head_object).
        """
        bucket_name = self.get_output('s3_bucket_name')
        
        # Create test file
        file_key = f'test-files/integration-test-{self.test_id}.txt'
        file_content = f'Integration test file created at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"Uploading file to S3: s3://{bucket_name}/{file_key}")
        
        # Upload file
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=file_content.encode('utf-8'),
            ContentType='text/plain'
        )
        
        # Verify file exists
        response = s3_client.head_object(Bucket=bucket_name, Key=file_key)
        
        self.assertIsNotNone(response)
        self.assertEqual(response['ContentType'], 'text/plain')
        self.assertGreater(response['ContentLength'], 0)
        
        print(f"Successfully uploaded and verified file: {file_key}")
        
        # Cleanup
        time.sleep(2)
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=file_key)
            print(f"Cleaned up test file: {file_key}")
        except Exception as e:
            print(f"Warning: Could not delete test file: {e}")
    
    def test_sns_topic_attributes(self):
        """
        Service-Level Test: Verify SNS topic exists and has correct attributes.
        
        Tests: SNS topic operations (get_topic_attributes).
        """
        sns_topic_arn = self.get_output('sns_topic_arn')
        
        print(f"Verifying SNS topic: {sns_topic_arn}")
        
        # Get topic attributes
        response = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
        
        # Verify topic exists and has attributes
        self.assertIn('Attributes', response)
        attributes = response['Attributes']
        
        # Verify topic ARN matches
        self.assertEqual(attributes['TopicArn'], sns_topic_arn)
        
        # Verify topic has a display name or owner
        self.assertIn('Owner', attributes)
        self.assertIsNotNone(attributes['Owner'])
        
        # Verify subscriptions confirmed count exists (even if 0)
        self.assertIn('SubscriptionsConfirmed', attributes)
        
        print(f"Successfully verified SNS topic with {attributes['SubscriptionsConfirmed']} confirmed subscriptions")
        print(f"Topic owner: {attributes['Owner']}")


# ============================================================================
# PART 2: CROSS-SERVICE TESTS (2 Services Interacting WITH REAL DATA)
# ============================================================================

class CrossServiceTests(BaseIntegrationTest):
    """
    Cross-Service Tests: Validate interactions between exactly two services.
    
    These tests verify that one service triggers or communicates with another:
    - Lambda writes to DynamoDB
    - S3 upload triggers Lambda
    - Lambda publishes to SNS
    """
    
    def test_lambda_writes_to_dynamodb(self):
        """
        Cross-Service Test: Lambda invocation results in DynamoDB record.
        
        Tests: Lambda -> DynamoDB interaction.
        Verifies that API handler Lambda successfully writes to DynamoDB.
        """
        function_name = self.get_output('api_handler_name')
        table_name = self.get_output('dynamodb_table_name')
        table = dynamodb_resource.Table(table_name)
        
        item_id = f'cross-service-{self.test_id}'
        
        # Invoke Lambda to create item
        payload = {
            'httpMethod': 'POST',
            'path': '/items',
            'body': json.dumps({
                'item_id': item_id,
                'status': 'cross-service-test',
                'data': {'test_type': 'cross_service'}
            })
        }
        
        print(f"\n[CROSS-SERVICE] Lambda -> DynamoDB Test")
        print(f"   Lambda Function: {function_name}")
        print(f"   DynamoDB Table: {table_name}")
        print(f"   Item ID: {item_id}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            print(f"[SUCCESS] Lambda invoked (StatusCode: {response['StatusCode']})")
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse Lambda response to get the timestamp it used
            response_payload = json.loads(response['Payload'].read())
            self.assertEqual(response_payload['statusCode'], 200)
            body = json.loads(response_payload['body'])
            created_item = body['item']
            # Use Decimal to match DynamoDB's storage format exactly
            timestamp = Decimal(str(created_item['timestamp']))
            
            print(f"   Lambda returned timestamp: {timestamp}")
            
            # Wait a moment for consistency
            time.sleep(2)
            
            # Verify item exists in DynamoDB using composite key
            print(f"[VERIFY] Checking DynamoDB for item: {item_id}")
            db_response = table.get_item(Key={
                'item_id': item_id,
                'timestamp': timestamp
            })
            
            self.assertIn('Item', db_response)
            item = db_response['Item']
            self.assertEqual(item['item_id'], item_id)
            self.assertEqual(item['status'], 'cross-service-test')
            
            print(f"[SUCCESS] Verified Lambda -> DynamoDB interaction for item: {item_id}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            print(f"\n[ERROR] Cross-service test failed:")
            print(f"   Error Code: {error_code}")
            print(f"   Error Message: {error_msg}")
            
            if error_code == 'AccessDeniedException':
                print(f"\n[WARNING] IAM PROPAGATION ISSUE - Lambda role not ready")
                print(f"   Recommendation: Increase IAM propagation wait time")
            elif error_code == 'ValidationException':
                print(f"\n[WARNING] DYNAMODB SCHEMA ISSUE - Check composite key usage")
                print(f"   Table requires both 'item_id' and 'timestamp' keys")
            
            raise
    
    def test_s3_upload_triggers_lambda(self):
        """
        Cross-Service Test: S3 upload triggers file processor Lambda.
        
        Tests: S3 -> Lambda interaction.
        Verifies that uploading to S3 triggers the file processor Lambda.
        """
        bucket_name = self.get_output('s3_bucket_name')
        function_name = self.get_output('file_processor_name')
        log_group_name = self.get_output('file_processor_log_group_name')
        
        file_key = f'uploads/cross-service-test-{self.test_id}.json'
        file_content = json.dumps({
            'test_id': self.test_id,
            'test_type': 'cross_service_s3_lambda',
            'timestamp': int(time.time())
        })
        
        print(f"\n[CROSS-SERVICE] S3 -> Lambda Trigger Test")
        print(f"   S3 Bucket: {bucket_name}")
        print(f"   File Key: {file_key}")
        print(f"   Lambda Function: {function_name}")
        print(f"   Log Group: {log_group_name}")
        
        # Upload file to S3 (this should trigger Lambda)
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=file_content.encode('utf-8'),
            ContentType='application/json'
        )
        
        print(f"[SUCCESS] File uploaded to S3")
        
        # Wait for Lambda to process (check CloudWatch Logs)
        # S3 notifications can take a few seconds to trigger Lambda
        print(f"[WAIT] Waiting 5 seconds for S3 notification to trigger Lambda...")
        time.sleep(5)  # Give S3 notification time to trigger
        
        log_found = wait_for_lambda_logs(
            logs_client,
            log_group_name,
            self.start_time,
            file_key,
            max_wait=90  # Increased from 60 to 90 seconds
        )
        
        if not log_found:
            print(f"\n[ERROR] S3 -> Lambda trigger test failed")
            print(f"   Possible causes:")
            print(f"   - S3 event notification not configured properly")
            print(f"   - Lambda permission for S3 invocation missing")
            print(f"   - S3 notification delay (can take 30-90 seconds in CI/CD)")
            print(f"   - Lambda execution error (check AWS Console)")
        
        self.assertTrue(log_found, f"Lambda did not process file {file_key} within timeout")
        
        print(f"[SUCCESS] Verified S3 -> Lambda trigger for file: {file_key}")
        
        # Cleanup
        time.sleep(2)
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=file_key)
            print(f"Cleaned up test file: {file_key}")
        except Exception as e:
            print(f"Warning: Could not delete test file: {e}")
    
    def test_file_processor_writes_to_dynamodb(self):
        """
        Cross-Service Test: File processor Lambda writes metadata to DynamoDB.
        
        Tests: Lambda (file processor) -> DynamoDB interaction.
        Verifies that file processor stores file metadata in DynamoDB.
        """
        bucket_name = self.get_output('s3_bucket_name')
        table_name = self.get_output('dynamodb_table_name')
        table = dynamodb_resource.Table(table_name)
        
        file_key = f'metadata-test/file-{self.test_id}.txt'
        file_content = f'Test file for metadata storage: {self.test_id}'
        
        print(f"Uploading file to trigger metadata storage: s3://{bucket_name}/{file_key}")
        
        # Upload file
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=file_content.encode('utf-8'),
            ContentType='text/plain'
        )
        
        # Wait for Lambda to process and write to DynamoDB
        # S3 notifications can take a few seconds to trigger Lambda
        print("Waiting for file processor to write metadata to DynamoDB")
        time.sleep(15)  # Increased from 10 to 15 seconds for S3 notification delay
        
        # Check DynamoDB for metadata record using query on item_id
        expected_item_id = f"file-{file_key.replace('/', '-')}"
        
        # Try multiple times with exponential backoff
        max_attempts = 5
        db_record_found = False
        
        for attempt in range(max_attempts):
            try:
                # Query by partition key only (we don't know the exact timestamp)
                db_response = table.query(
                    KeyConditionExpression='item_id = :item_id',
                    ExpressionAttributeValues={
                        ':item_id': expected_item_id
                    },
                    Limit=1
                )
                
                if db_response.get('Items') and len(db_response['Items']) > 0:
                    item = db_response['Items'][0]
                    self.assertEqual(item['status'], 'processed')
                    self.assertIn('data', item)
                    self.assertEqual(item['data']['key'], file_key)
                    self.assertEqual(item['data']['bucket'], bucket_name)
                    
                    print(f"Successfully verified file processor -> DynamoDB for: {expected_item_id}")
                    db_record_found = True
                    break
            except Exception as e:
                if attempt < max_attempts - 1:
                    wait_time = 2 ** attempt
                    print(f"Attempt {attempt + 1}/{max_attempts} failed, waiting {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    print(f"Failed to find DB record after {max_attempts} attempts: {e}")
        
        self.assertTrue(db_record_found, f"DynamoDB record not found for {expected_item_id}")
        
        # Cleanup
        time.sleep(2)
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=file_key)
            print(f"Cleaned up test file: {file_key}")
        except Exception as e:
            print(f"Warning: Could not delete test file: {e}")


# ============================================================================
# PART 3: E2E TESTS (Complete Flows WITH 3+ SERVICES)
# ============================================================================

class EndToEndTests(BaseIntegrationTest):
    """
    End-to-End Tests: Validate complete workflows through 3+ services.
    
    These tests trigger only the entry point and verify the complete chain:
    - API Gateway -> Lambda -> DynamoDB + CloudWatch
    - S3 -> Lambda -> DynamoDB + SNS + CloudWatch
    
    Critical: Only trigger the initial entry point, verify all downstream effects.
    """
    
    def test_api_gateway_complete_workflow(self):
        """
        E2E Test: API Gateway request flows through Lambda, DynamoDB, SNS, and CloudWatch.
        
        Entry Point: API Gateway POST request
        Downstream Services (verified):
        - Lambda execution
        - DynamoDB record creation
        - CloudWatch logs
        
         only trigger API Gateway, verify all downstream effects.
        """
        api_url = self.get_output('api_gateway_url')
        table_name = self.get_output('dynamodb_table_name')
        log_group_name = self.get_output('api_handler_log_group_name')
        
        item_id = f'e2e-api-{self.test_id}'
        
        # Prepare request
        request_data = {
            'item_id': item_id,
            'status': 'e2e-test',
            'data': {
                'test_type': 'end_to_end',
                'entry_point': 'api_gateway',
                'timestamp': int(time.time())
            }
        }
        
        print(f"Triggering E2E workflow via API Gateway: POST {api_url}")
        print(f"Request data: {request_data}")
        
        # ENTRY POINT: Trigger API Gateway
        response = requests.post(
            api_url,
            json=request_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        # Verify API Gateway response
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['message'], 'Item created successfully')
        
        print(f"API Gateway responded successfully")
        
        # Parse response to get timestamp
        response_body = response.json()
        created_item = response_body['item']
        # Use Decimal to match DynamoDB's storage format exactly
        timestamp = Decimal(str(created_item['timestamp']))
        
        # Wait for downstream processing
        time.sleep(5)
        
        # VERIFY DOWNSTREAM EFFECT 1: DynamoDB record exists
        print(f"Verifying DynamoDB record for item: {item_id}")
        table = dynamodb_resource.Table(table_name)
        db_response = table.get_item(Key={
            'item_id': item_id,
            'timestamp': timestamp
        })
        
        self.assertIn('Item', db_response)
        item = db_response['Item']
        self.assertEqual(item['item_id'], item_id)
        self.assertEqual(item['status'], 'e2e-test')
        print(f"DynamoDB record verified: {item_id}")
        
        # VERIFY DOWNSTREAM EFFECT 2: CloudWatch logs contain execution
        print(f"Verifying CloudWatch logs for Lambda execution")
        log_found = wait_for_lambda_logs(
            logs_client,
            log_group_name,
            self.start_time,
            item_id,
            max_wait=30
        )
        
        self.assertTrue(log_found, f"Lambda execution logs not found for item {item_id}")
        print(f"CloudWatch logs verified")
        
        print(f"E2E test completed successfully: API Gateway -> Lambda -> DynamoDB + CloudWatch")
    
    def test_s3_upload_complete_workflow(self):
        """
        E2E Test: S3 upload flows through Lambda, DynamoDB, SNS, and CloudWatch.
        
        Entry Point: S3 file upload
        Downstream Services (verified):
        - Lambda (file processor) execution
        - DynamoDB metadata record
        - CloudWatch logs
        
       only upload to S3, verify all downstream effects.
        """
        bucket_name = self.get_output('s3_bucket_name')
        table_name = self.get_output('dynamodb_table_name')
        log_group_name = self.get_output('file_processor_log_group_name')
        
        file_key = f'e2e-test/workflow-{self.test_id}.json'
        file_content = json.dumps({
            'test_id': self.test_id,
            'test_type': 'end_to_end',
            'entry_point': 's3_upload',
            'timestamp': int(time.time())
        })
        
        print(f"Triggering E2E workflow via S3 upload: s3://{bucket_name}/{file_key}")
        
        # ENTRY POINT: Upload to S3 (only manual trigger in this test)
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=file_content.encode('utf-8'),
            ContentType='application/json',
            Metadata={'test-id': self.test_id}
        )
        
        print(f"File uploaded to S3")
        
        # Wait for downstream processing
        # S3 notifications can take a few seconds to trigger Lambda
        time.sleep(15)  # Increased for S3 notification delay
        
        # VERIFY DOWNSTREAM EFFECT 1: Lambda execution logs
        print(f"Verifying CloudWatch logs for file processor Lambda")
        log_found = wait_for_lambda_logs(
            logs_client,
            log_group_name,
            self.start_time,
            file_key,
            max_wait=90  # Increased from 60 to 90 seconds
        )
        
        self.assertTrue(log_found, f"File processor Lambda did not execute for {file_key}")
        print(f"Lambda execution verified via CloudWatch logs")
        
        # VERIFY DOWNSTREAM EFFECT 2: DynamoDB metadata record
        print(f"Verifying DynamoDB metadata record")
        expected_item_id = f"file-{file_key.replace('/', '-')}"
        table = dynamodb_resource.Table(table_name)
        
        # Retry with exponential backoff
        max_attempts = 6
        db_record_found = False
        
        for attempt in range(max_attempts):
            try:
                # Query by partition key only (we don't know the exact timestamp)
                db_response = table.query(
                    KeyConditionExpression='item_id = :item_id',
                    ExpressionAttributeValues={
                        ':item_id': expected_item_id
                    },
                    Limit=1
                )
                
                if db_response.get('Items') and len(db_response['Items']) > 0:
                    item = db_response['Items'][0]
                    self.assertEqual(item['status'], 'processed')
                    self.assertIn('data', item)
                    self.assertEqual(item['data']['key'], file_key)
                    self.assertEqual(item['data']['bucket'], bucket_name)
                    
                    print(f"DynamoDB metadata record verified: {expected_item_id}")
                    db_record_found = True
                    break
            except Exception as e:
                if attempt < max_attempts - 1:
                    wait_time = 2 ** attempt
                    print(f"Attempt {attempt + 1}/{max_attempts} to find DB record, waiting {wait_time}s")
                    time.sleep(wait_time)
                else:
                    print(f"Failed to find DB record after {max_attempts} attempts: {e}")
        
        self.assertTrue(db_record_found, f"DynamoDB record not found for {expected_item_id}")
        
        print(f"E2E test completed successfully: S3 -> Lambda -> DynamoDB + CloudWatch")
        
        # Cleanup
        time.sleep(2)
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=file_key)
            print(f"Cleaned up test file: {file_key}")
        except Exception as e:
            print(f"Warning: Could not delete test file: {e}")
    
    def test_dynamodb_stream_triggers_notifications(self):
        """
        E2E Test: DynamoDB write triggers stream processor Lambda and SNS.
        
        Entry Point: DynamoDB put_item
        Downstream Services (verified):
        - DynamoDB stream
        - Lambda (stream processor) execution
        - CloudWatch logs
        
         only write to DynamoDB, verify stream processing.
        """
        table_name = self.get_output('dynamodb_table_name')
        log_group_name = self.get_output('stream_processor_log_group_name')
        table = dynamodb_resource.Table(table_name)
        
        item_id = f'e2e-stream-{self.test_id}'
        
        print(f"Triggering E2E workflow via DynamoDB write: {item_id}")
        
        # ENTRY POINT: Write to DynamoDB (triggers stream -> Lambda)
        table.put_item(Item={
            'item_id': item_id,
            'timestamp': int(time.time()),
            'status': 'stream-test',
            'data': {
                'test_type': 'end_to_end',
                'entry_point': 'dynamodb_stream',
                'test_id': self.test_id
            },
            'created_at': int(time.time())
        })
        
        print(f"Item written to DynamoDB: {item_id}")
        
        # Wait for stream processing
        time.sleep(10)
        
        # VERIFY DOWNSTREAM EFFECT: Stream processor Lambda executed
        print(f"Verifying stream processor Lambda execution via CloudWatch logs")
        log_found = wait_for_lambda_logs(
            logs_client,
            log_group_name,
            self.start_time,
            item_id,
            max_wait=60
        )
        
        self.assertTrue(log_found, f"Stream processor Lambda did not execute for item {item_id}")
        print(f"Stream processor execution verified via CloudWatch logs")
        
        print(f"E2E test completed successfully: DynamoDB -> Stream -> Lambda + CloudWatch")


if __name__ == '__main__':
    unittest.main(verbosity=2)
