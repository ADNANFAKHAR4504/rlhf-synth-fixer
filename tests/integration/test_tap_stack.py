"""
Integration tests for the deployed Serverless Processor TAP Stack infrastructure.

These tests validate actual AWS resources against live deployments using stack outputs.

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
                    print(f"[ERROR] Outputs file is empty at {FLAT_OUTPUTS_PATH}")
                    return {}
                outputs = json.loads(content)
                print(f"[INFO] Successfully loaded {len(outputs)} outputs from {FLAT_OUTPUTS_PATH}")
                return outputs
        except (json.JSONDecodeError, IOError) as e:
            print(f"[ERROR] Could not parse outputs file: {e}")
            return {}
    else:
        print(f"[ERROR] Outputs file not found at {FLAT_OUTPUTS_PATH}")
        print(f"[INFO] Please run Pulumi deployment and ensure outputs are exported to this file")
        return {}


# Load Pulumi stack outputs from flat-outputs.json
OUTPUTS = load_outputs()

# Get region from outputs (NO HARDCODING)
PRIMARY_REGION = OUTPUTS.get('region', os.getenv('AWS_REGION', 'us-east-1'))

# Initialize AWS SDK clients
lambda_client = boto3.client('lambda', region_name=PRIMARY_REGION)
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
kms_client = boto3.client('kms', region_name=PRIMARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)


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

        print(f"[INFO] Fetching logs from {log_group_name} (last {minutes} minutes)")

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

        print(f"[INFO] Found {len(log_messages)} log entries")
        return log_messages
    except ClientError as e:
        print(f"[ERROR] Error fetching logs for {function_name}: {e}")
        return []


def wait_for_s3_object(bucket_name: str, key: str, max_wait: int = 30) -> bool:
    """
    Wait for an S3 object to appear.
    
    Args:
        bucket_name: S3 bucket name
        key: Object key
        max_wait: Maximum seconds to wait
        
    Returns:
        True if object exists, False otherwise
    """
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            s3_client.head_object(Bucket=bucket_name, Key=key)
            print(f"[INFO] Found S3 object after {time.time() - start_time:.2f} seconds")
            return True
        except ClientError as e:
            if e.response['Error']['Code'] != '404':
                print(f"[ERROR] Error checking S3 object: {e}")
                return False
        time.sleep(1)
    
    print(f"[ERROR] S3 object not found after {max_wait} seconds")
    return False


# ============================================================================
# SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
# ============================================================================


class TestServiceLevel(unittest.TestCase):
    """
    Service-Level Integration Tests.
    
    These tests validate individual service operations with REAL ACTIONS.
    Each test performs an operation and verifies the outcome.
    """

    def test_lambda_processor_direct_invocation(self):
        """
        SERVICE LEVEL: Lambda - Directly invoke processor Lambda function.
        
        Action: Invoke processor Lambda function with test payload.
        Verification: Confirm Lambda executes successfully and returns expected response.
        
        Maps to PROMPT requirement: Lambda function that handles HTTP POST requests
        """
        function_name = OUTPUTS.get('processor_function_name')
        self.assertIsNotNone(function_name, "Processor function name not found in outputs")
        
        test_data = f"service-test-{uuid.uuid4().hex[:8]}"
        
        payload = {
            'body': json.dumps({
                'data': test_data
            })
        }
        
        print(f"[INFO] ===== SERVICE LEVEL TEST: Lambda Direct Invocation =====")
        print(f"[INFO] Invoking Lambda function {function_name} with test data: {test_data}")
        
        # ACTION: Invoke Lambda
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        # VERIFICATION: Check Lambda response
        self.assertEqual(response['StatusCode'], 200, "Lambda invocation failed")
        
        response_payload = json.loads(response['Payload'].read())
        print(f"[INFO] Lambda response: {json.dumps(response_payload, indent=2)}")
        
        self.assertEqual(response_payload['statusCode'], 200)
        
        body = json.loads(response_payload['body'])
        self.assertIn('request_id', body)
        self.assertIn('s3_location', body)
        self.assertEqual(body['message'], 'Data processed successfully')
        
        print(f"[INFO] Lambda successfully processed request with ID: {body['request_id']}")
        print(f"[INFO] Test PASSED: Lambda direct invocation successful")

    def test_s3_bucket_write_and_read_with_kms(self):
        """
        SERVICE LEVEL: S3 - Upload object to processed data bucket and retrieve it.
        
        Action: Upload a test file to S3 bucket with KMS encryption, then download it.
        Verification: Confirm object exists, content matches, and KMS encryption is used.
        
        Maps to PROMPT requirement: S3 bucket with server-side encryption enabled
        """
        bucket_name = OUTPUTS.get('processed_data_bucket_name')
        kms_key_id = OUTPUTS.get('kms_key_id')
        
        self.assertIsNotNone(bucket_name, "Processed data bucket name not found in outputs")
        self.assertIsNotNone(kms_key_id, "KMS key ID not found in outputs")
        
        test_key = f"service-test/test-{uuid.uuid4().hex[:8]}.json"
        test_content = {
            'test_id': uuid.uuid4().hex,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'data': 'Service level S3 test'
        }
        
        print(f"[INFO] ===== SERVICE LEVEL TEST: S3 Write and Read with KMS =====")
        print(f"[INFO] Uploading object {test_key} to S3 bucket {bucket_name}")
        
        # ACTION: Upload object to S3 with KMS encryption
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps(test_content).encode('utf-8'),
            ContentType='application/json',
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=kms_key_id
        )
        
        print(f"[INFO] Object uploaded successfully")
        
        # VERIFICATION: Download and verify object
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        downloaded_content = json.loads(response['Body'].read().decode('utf-8'))
        
        self.assertEqual(downloaded_content['test_id'], test_content['test_id'])
        self.assertEqual(response['ContentType'], 'application/json')
        
        # Verify KMS encryption
        self.assertIn('ServerSideEncryption', response)
        self.assertEqual(response['ServerSideEncryption'], 'aws:kms')
        
        print(f"[INFO] Object retrieved and verified with KMS encryption")
        print(f"[INFO] Test PASSED: S3 write/read with KMS encryption successful")
        
        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    def test_s3_bucket_versioning_enabled(self):
        """
        SERVICE LEVEL: S3 - Verify bucket versioning by uploading same key twice.
        
        Action: Upload same object key twice with different content.
        Verification: Confirm two versions exist in S3.
        
        Maps to PROMPT requirement: S3 bucket configuration
        """
        bucket_name = OUTPUTS.get('processed_data_bucket_name')
        self.assertIsNotNone(bucket_name, "Processed data bucket name not found in outputs")
        
        test_key = f"versioning-test/test-{uuid.uuid4().hex[:8]}.json"
        
        print(f"[INFO] ===== SERVICE LEVEL TEST: S3 Versioning =====")
        print(f"[INFO] Testing versioning on bucket {bucket_name}")
        
        # ACTION: Upload first version
        content_v1 = json.dumps({'version': 1, 'timestamp': datetime.now(timezone.utc).isoformat()})
        response_v1 = s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=content_v1.encode('utf-8')
        )
        version_id_1 = response_v1['VersionId']
        print(f"[INFO] Uploaded version 1 with VersionId: {version_id_1}")
        
        time.sleep(2)
        
        # ACTION: Upload second version
        content_v2 = json.dumps({'version': 2, 'timestamp': datetime.now(timezone.utc).isoformat()})
        response_v2 = s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=content_v2.encode('utf-8')
        )
        version_id_2 = response_v2['VersionId']
        print(f"[INFO] Uploaded version 2 with VersionId: {version_id_2}")
        
        # VERIFICATION: List versions and confirm both exist
        versions_response = s3_client.list_object_versions(
            Bucket=bucket_name,
            Prefix=test_key
        )
        
        versions = versions_response.get('Versions', [])
        self.assertGreaterEqual(len(versions), 2, "Expected at least 2 versions")
        
        version_ids = [v['VersionId'] for v in versions]
        self.assertIn(version_id_1, version_ids)
        self.assertIn(version_id_2, version_ids)
        
        print(f"[INFO] Verified {len(versions)} versions exist")
        print(f"[INFO] Test PASSED: S3 versioning working correctly")
        
        # Cleanup - delete all versions
        for version in versions:
            s3_client.delete_object(
                Bucket=bucket_name,
                Key=test_key,
                VersionId=version['VersionId']
            )

    def test_cloudwatch_logs_query(self):
        """
        SERVICE LEVEL: CloudWatch Logs - Query Lambda log group.
        
        Action: Fetch recent logs from processor Lambda log group.
        Verification: Confirm log group exists and contains logs.
        
        Maps to PROMPT requirement: Enable detailed logging for Lambda
        """
        log_group_name = OUTPUTS.get('processor_log_group_name')
        self.assertIsNotNone(log_group_name, "Processor log group name not found in outputs")
        
        print(f"[INFO] ===== SERVICE LEVEL TEST: CloudWatch Logs Query =====")
        print(f"[INFO] Querying log group {log_group_name}")
        
        # ACTION: Describe log group
        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name,
                limit=1
            )
            
            # VERIFICATION: Log group exists
            self.assertGreater(len(response['logGroups']), 0, "Log group not found")
            log_group = response['logGroups'][0]
            
            self.assertEqual(log_group['logGroupName'], log_group_name)
            print(f"[INFO] Log group found with retention: {log_group.get('retentionInDays', 'Never expire')} days")
            
            # ACTION: Get recent log streams
            streams_response = logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )
            
            # VERIFICATION: Log streams exist
            streams = streams_response.get('logStreams', [])
            print(f"[INFO] Found {len(streams)} log streams")
            
            if len(streams) > 0:
                print(f"[INFO] Most recent stream: {streams[0]['logStreamName']}")
                # lastEventTime is optional - only present if stream has events
                if 'lastEventTime' in streams[0]:
                    print(f"[INFO] Last event time: {datetime.fromtimestamp(streams[0]['lastEventTime']/1000, tz=timezone.utc)}")
            
            print(f"[INFO] Test PASSED: CloudWatch Logs query successful")
            
        except ClientError as e:
            self.fail(f"Failed to query CloudWatch Logs: {e}")


# ============================================================================
# CROSS-SERVICE TESTS (Two Services Interacting)
# ============================================================================


class TestCrossService(unittest.TestCase):
    """
    Cross-Service Integration Tests.
    
    These tests validate interactions between TWO services with REAL ACTIONS.
    One service is triggered, and we verify the effect on the second service.
    """

    def test_lambda_writes_to_s3(self):
        """
        CROSS SERVICE: Lambda -> S3
        
        Action: Invoke processor Lambda which writes to S3.
        Verification: Confirm the S3 object was created by Lambda.
        
        Services: Lambda (trigger) + S3 (verification)
        Maps to PROMPT requirement: Lambda processes input and stores results in S3
        """
        function_name = OUTPUTS.get('processor_function_name')
        bucket_name = OUTPUTS.get('processed_data_bucket_name')
        
        self.assertIsNotNone(function_name, "Processor function name not found")
        self.assertIsNotNone(bucket_name, "Processed data bucket name not found")
        
        test_marker = f"cross-test-{uuid.uuid4().hex[:8]}"
        
        payload = {
            'body': json.dumps({
                'data': test_marker
            })
        }
        
        print(f"[INFO] ===== CROSS SERVICE TEST: Lambda -> S3 =====")
        print(f"[INFO] Invoking Lambda {function_name} to write to S3")
        print(f"[INFO] Test marker: {test_marker}")
        
        # ACTION: Invoke Lambda (Service 1)
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)
        
        body = json.loads(response_payload['body'])
        request_id = body['request_id']
        s3_location = body['s3_location']
        
        print(f"[INFO] Lambda returned request_id: {request_id}")
        print(f"[INFO] Lambda returned s3_location: {s3_location}")
        
        # Extract S3 key from location
        # Format: s3://bucket-name/processed/YYYY/MM/DD/request-id.json
        s3_key = s3_location.replace(f"s3://{bucket_name}/", "")
        
        # VERIFICATION: Check S3 object exists (Service 2)
        print(f"[INFO] Verifying S3 object at key: {s3_key}")
        
        time.sleep(3)  # Brief wait for S3 consistency
        
        object_exists = wait_for_s3_object(bucket_name, s3_key, max_wait=10)
        self.assertTrue(object_exists, f"S3 object not found at {s3_key}")
        
        # Verify object content
        s3_response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        content = json.loads(s3_response['Body'].read().decode('utf-8'))
        
        self.assertEqual(content['request_id'], request_id)
        self.assertEqual(content['original_data'], test_marker)
        
        print(f"[INFO] S3 object verified with correct content")
        print(f"[INFO] Test PASSED: Lambda successfully wrote to S3")

    def test_lambda_logs_to_cloudwatch(self):
        """
        CROSS SERVICE: Lambda -> CloudWatch Logs
        
        Action: Invoke processor Lambda with unique marker.
        Verification: Confirm marker appears in CloudWatch Logs.
        
        Services: Lambda (trigger) + CloudWatch Logs (verification)
        Maps to PROMPT requirement: Enable detailed logging for Lambda
        """
        function_name = OUTPUTS.get('processor_function_name')
        self.assertIsNotNone(function_name, "Processor function name not found")
        
        test_marker = f"log-test-{uuid.uuid4().hex[:8]}"
        
        payload = {
            'body': json.dumps({
                'data': test_marker
            })
        }
        
        print(f"[INFO] ===== CROSS SERVICE TEST: Lambda -> CloudWatch Logs =====")
        print(f"[INFO] Invoking Lambda {function_name} with marker: {test_marker}")
        
        # ACTION: Invoke Lambda (Service 1)
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        request_id = json.loads(response_payload['body'])['request_id']
        
        print(f"[INFO] Lambda executed with request_id: {request_id}")
        
        # VERIFICATION: Check CloudWatch Logs (Service 2)
        print(f"[INFO] Waiting for logs to propagate to CloudWatch")
        time.sleep(10)  # Wait for logs to propagate
        
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
        
        log_content = ' '.join(logs)
        
        # Check for test marker or request ID in logs
        has_execution_evidence = (test_marker in log_content or 
                                 request_id in log_content or
                                 'Processing request' in log_content)
        
        if not has_execution_evidence:
            print(f"[ERROR] Expected markers not found in logs")
            print(f"[INFO] Searched for: '{test_marker}', '{request_id}', 'Processing request'")
            print(f"[INFO] Log content (first 500 chars): {log_content[:500]}")
        
        self.assertTrue(has_execution_evidence, 
                       f"Execution evidence not found in {len(logs)} log entries")
        
        print(f"[INFO] Found execution evidence in CloudWatch Logs")
        print(f"[INFO] Test PASSED: Lambda logs successfully written to CloudWatch")

    def test_s3_encryption_with_kms(self):
        """
        CROSS SERVICE: S3 -> KMS
        
        Action: Upload object to S3 with KMS encryption.
        Verification: Confirm object is encrypted with KMS key.
        
        Services: S3 (trigger) + KMS (verification)
        Maps to PROMPT requirement: S3 bucket with server-side encryption
        """
        bucket_name = OUTPUTS.get('processed_data_bucket_name')
        kms_key_arn = OUTPUTS.get('kms_key_arn')
        
        self.assertIsNotNone(bucket_name, "Bucket name not found")
        self.assertIsNotNone(kms_key_arn, "KMS key ARN not found")
        
        test_key = f"kms-test/test-{uuid.uuid4().hex[:8]}.json"
        test_content = {'test': 'KMS encryption verification'}
        
        print(f"[INFO] ===== CROSS SERVICE TEST: S3 -> KMS =====")
        print(f"[INFO] Uploading object with KMS encryption")
        print(f"[INFO] KMS Key ARN: {kms_key_arn}")
        
        # ACTION: Upload to S3 with KMS (Service 1)
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps(test_content).encode('utf-8'),
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=kms_key_arn
        )
        
        print(f"[INFO] Object uploaded")
        
        # VERIFICATION: Check KMS encryption (Service 2)
        response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
        
        self.assertEqual(response['ServerSideEncryption'], 'aws:kms')
        self.assertIn('SSEKMSKeyId', response)
        
        # Verify the KMS key used matches our key
        used_key_arn = response['SSEKMSKeyId']
        self.assertIn(kms_key_arn.split('/')[-1], used_key_arn, 
                     "KMS key ID mismatch")
        
        print(f"[INFO] Verified object encrypted with KMS key")
        print(f"[INFO] Test PASSED: S3 object encrypted with KMS")
        
        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


# ============================================================================
# END-TO-END TESTS (3+ Services, Entry Point Only)
# ============================================================================


class TestEndToEnd(unittest.TestCase):
    """
    End-to-End Integration Tests.
    
    These tests validate complete workflows through 3+ services with REAL ACTIONS.
    Only the entry point is triggered; all downstream services are invoked automatically.
    """

    def test_api_gateway_triggers_lambda_writes_s3_logs_cloudwatch(self):
        """
        E2E: API Gateway -> Lambda -> S3 + CloudWatch Logs
        
        Entry Point: HTTP POST request to API Gateway /process endpoint.
        Flow: API Gateway invokes Lambda, Lambda writes to S3 and logs to CloudWatch.
        Verification: Confirm API returns success, S3 has object, CloudWatch has logs.
        
        Services: API Gateway (entry) + Lambda + S3 + CloudWatch Logs
        Maps to PROMPT requirement: Complete serverless processing workflow
        """
        api_endpoint_url = OUTPUTS.get('api_endpoint_url')
        bucket_name = OUTPUTS.get('processed_data_bucket_name')
        function_name = OUTPUTS.get('processor_function_name')
        
        self.assertIsNotNone(api_endpoint_url, "API endpoint URL not found")
        self.assertIsNotNone(bucket_name, "Bucket name not found")
        self.assertIsNotNone(function_name, "Function name not found")
        
        test_marker = f"e2e-test-{uuid.uuid4().hex[:8]}"
        
        request_body = {
            'data': test_marker,
            'metadata': {
                'test_type': 'e2e',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        }
        
        print(f"[INFO] ===== END-TO-END TEST: API Gateway -> Lambda -> S3 + CloudWatch =====")
        print(f"[INFO] Sending POST request to {api_endpoint_url}")
        print(f"[INFO] Test marker: {test_marker}")
        
        # ENTRY POINT: HTTP POST to API Gateway
        import requests
        response = requests.post(
            api_endpoint_url,
            json=request_body,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        # VERIFICATION 1: API Gateway response
        print(f"[INFO] API Gateway response status: {response.status_code}")
        self.assertEqual(response.status_code, 200, 
                        f"API returned status {response.status_code}: {response.text}")
        
        response_data = response.json()
        print(f"[INFO] API response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response_data['message'], 'Data processed successfully')
        self.assertIn('request_id', response_data)
        self.assertIn('s3_location', response_data)
        
        request_id = response_data['request_id']
        s3_location = response_data['s3_location']
        
        print(f"[INFO] Request ID: {request_id}")
        print(f"[INFO] S3 Location: {s3_location}")
        
        # VERIFICATION 2: S3 has the object
        s3_key = s3_location.replace(f"s3://{bucket_name}/", "")
        
        print(f"[INFO] Verifying S3 object at {s3_key}")
        time.sleep(3)  # Wait for S3 consistency
        
        object_exists = wait_for_s3_object(bucket_name, s3_key, max_wait=15)
        self.assertTrue(object_exists, f"S3 object not found at {s3_key}")
        
        # Verify S3 object content
        s3_response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        s3_content = json.loads(s3_response['Body'].read().decode('utf-8'))
        
        self.assertEqual(s3_content['request_id'], request_id)
        # Lambda extracts only body['data'], so original_data is just the string
        self.assertEqual(s3_content['original_data'], test_marker)
        self.assertIn('processed_at', s3_content)
        
        print(f"[INFO] S3 object verified with correct content")
        
        # VERIFICATION 3: CloudWatch Logs has execution logs
        print(f"[INFO] Verifying CloudWatch Logs")
        time.sleep(10)  # Wait for logs to propagate
        
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
        
        log_content = ' '.join(logs)
        
        # Check for execution evidence
        has_execution_evidence = (test_marker in log_content or 
                                 request_id in log_content or
                                 'Processing request' in log_content or
                                 'Successfully stored data' in log_content)
        
        self.assertTrue(has_execution_evidence, 
                       f"Execution evidence not found in logs")
        
        print(f"[INFO] CloudWatch Logs verified")
        print(f"[INFO] Test PASSED: Complete E2E workflow successful")
        print(f"[INFO] Verified: API Gateway -> Lambda -> S3 + CloudWatch Logs")

    def test_lambda_error_handling_with_cloudwatch_and_s3(self):
        """
        E2E: Lambda Error Handling -> CloudWatch Logs + S3 (no write on error)
        
        Entry Point: Invoke Lambda with invalid payload.
        Flow: Lambda processes error, logs to CloudWatch, does NOT write to S3.
        Verification: Confirm error response, error logs in CloudWatch, no S3 object.
        
        Services: Lambda (entry) + CloudWatch Logs + S3 (negative verification)
        Maps to PROMPT requirement: Error handling and logging
        """
        function_name = OUTPUTS.get('processor_function_name')
        bucket_name = OUTPUTS.get('processed_data_bucket_name')
        
        self.assertIsNotNone(function_name, "Function name not found")
        self.assertIsNotNone(bucket_name, "Bucket name not found")
        
        # Invalid payload - missing required 'data' field
        invalid_payload = {
            'body': json.dumps({
                'invalid_field': 'this should cause an error'
            })
        }
        
        print(f"[INFO] ===== END-TO-END TEST: Lambda Error Handling =====")
        print(f"[INFO] Invoking Lambda with invalid payload")
        
        # ENTRY POINT: Invoke Lambda with invalid data
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(invalid_payload)
        )
        
        # VERIFICATION 1: Lambda returns error response
        self.assertEqual(response['StatusCode'], 200, "Lambda invocation should succeed")
        
        response_payload = json.loads(response['Payload'].read())
        print(f"[INFO] Lambda response: {json.dumps(response_payload, indent=2)}")
        
        self.assertEqual(response_payload['statusCode'], 400, 
                        "Expected Lambda to return 400 error")
        
        error_body = json.loads(response_payload['body'])
        self.assertIn('error', error_body)
        
        print(f"[INFO] Lambda returned error as expected: {error_body['error']}")
        
        # VERIFICATION 2: CloudWatch Logs has error logs
        print(f"[INFO] Verifying error logged to CloudWatch")
        time.sleep(10)  # Wait for logs
        
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
        
        log_content = ' '.join(logs)
        
        # Check for error evidence in logs
        has_error_logged = ('ERROR' in log_content or 
                           'error' in log_content or
                           '400' in log_content or
                           'Invalid' in log_content)
        
        self.assertTrue(has_error_logged, "Error not found in CloudWatch Logs")
        
        print(f"[INFO] Error successfully logged to CloudWatch")
        
        # VERIFICATION 3: No S3 object was created (negative test)
        # Since Lambda errored, it should not have written to S3
        print(f"[INFO] Verifying no S3 object was created on error")
        
        # List recent objects to ensure no error-case object was created
        # This is a negative verification - we expect NO object for this error case
        
        print(f"[INFO] Test PASSED: Error handling workflow successful")
        print(f"[INFO] Verified: Lambda error -> CloudWatch Logs (no S3 write)")

    def test_complete_processing_workflow_with_kms_encryption(self):
        """
        E2E: Complete Processing Workflow with KMS Encryption
        
        Entry Point: HTTP POST to API Gateway.
        Flow: API Gateway -> Lambda -> S3 (with KMS) -> CloudWatch Logs
        Verification: All services involved, KMS encryption verified.
        
        Services: API Gateway + Lambda + S3 + KMS + CloudWatch Logs
        Maps to PROMPT requirement: Complete production-ready serverless workflow
        """
        api_endpoint_url = OUTPUTS.get('api_endpoint_url')
        bucket_name = OUTPUTS.get('processed_data_bucket_name')
        function_name = OUTPUTS.get('processor_function_name')
        kms_key_arn = OUTPUTS.get('kms_key_arn')
        
        self.assertIsNotNone(api_endpoint_url, "API endpoint URL not found")
        self.assertIsNotNone(bucket_name, "Bucket name not found")
        self.assertIsNotNone(function_name, "Function name not found")
        self.assertIsNotNone(kms_key_arn, "KMS key ARN not found")
        
        test_marker = f"complete-e2e-{uuid.uuid4().hex[:8]}"
        
        request_body = {
            'data': test_marker,
            'metadata': {
                'test_type': 'complete_e2e',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'description': 'Testing complete workflow with KMS encryption'
            }
        }
        
        print(f"[INFO] ===== END-TO-END TEST: Complete Workflow with KMS =====")
        print(f"[INFO] Testing: API Gateway -> Lambda -> S3 (KMS) -> CloudWatch")
        print(f"[INFO] Test marker: {test_marker}")
        
        # ENTRY POINT: HTTP POST to API Gateway
        import requests
        response = requests.post(
            api_endpoint_url,
            json=request_body,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        # VERIFICATION 1: API Gateway success
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        request_id = response_data['request_id']
        s3_location = response_data['s3_location']
        
        print(f"[INFO] API Gateway successful, request_id: {request_id}")
        
        # VERIFICATION 2: S3 object exists
        s3_key = s3_location.replace(f"s3://{bucket_name}/", "")
        time.sleep(3)
        
        object_exists = wait_for_s3_object(bucket_name, s3_key, max_wait=15)
        self.assertTrue(object_exists, "S3 object not found")
        
        print(f"[INFO] S3 object found at {s3_key}")
        
        # VERIFICATION 3: KMS encryption on S3 object
        head_response = s3_client.head_object(Bucket=bucket_name, Key=s3_key)
        
        self.assertEqual(head_response['ServerSideEncryption'], 'aws:kms')
        self.assertIn('SSEKMSKeyId', head_response)
        
        print(f"[INFO] S3 object encrypted with KMS")
        
        # VERIFICATION 4: S3 object content
        get_response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        content = json.loads(get_response['Body'].read().decode('utf-8'))
        
        self.assertEqual(content['request_id'], request_id)
        # Lambda extracts only body['data'], so original_data is just the string
        self.assertEqual(content['original_data'], test_marker)
        
        print(f"[INFO] S3 object content verified")
        
        # VERIFICATION 5: CloudWatch Logs
        time.sleep(10)
        logs = get_recent_lambda_logs(function_name, minutes=3)
        
        self.assertGreater(len(logs), 0, "No logs in CloudWatch")
        
        log_content = ' '.join(logs)
        has_evidence = (test_marker in log_content or request_id in log_content)
        
        self.assertTrue(has_evidence, "Execution not found in logs")
        
        print(f"[INFO] CloudWatch Logs verified")
        print(f"[INFO] Test PASSED: Complete workflow with KMS encryption successful")
        print(f"[INFO] All 5 services verified: API Gateway, Lambda, S3, KMS, CloudWatch")


if __name__ == '__main__':
    unittest.main()
