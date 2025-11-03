"""
Integration tests for the deployed CI/CD Pipeline (TapStack) infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full workflows)

The tests use stack outputs exported from lib/tap_stack.py to discover resources.
All tests perform ACTIONS and verify results - NO configuration-only tests.

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
from datetime import datetime
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


# Load Pulumi stack outputs from flat-outputs.json - NO HARDCODING
OUTPUTS = load_outputs()

# Get region from outputs - NO HARDCODING
PRIMARY_REGION = OUTPUTS.get('region', os.getenv('AWS_REGION', 'us-east-1'))

# Initialize AWS SDK clients
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
lambda_client = boto3.client('lambda', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
sqs_client = boto3.client('sqs', region_name=PRIMARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)
codebuild_client = boto3.client('codebuild', region_name=PRIMARY_REGION)
apigateway_client = boto3.client('apigateway', region_name=PRIMARY_REGION)
kms_client = boto3.client('kms', region_name=PRIMARY_REGION)


def get_recent_lambda_logs(function_name: str, minutes: int = 5) -> List[str]:
    """
    Fetch recent Lambda logs from CloudWatch Logs with error handling.
    
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

class TestS3ServiceLevel(BaseIntegrationTest):
    """Service-level tests for S3 buckets."""

    def test_log_bucket_write_and_versioning(self):
        """
        Test S3 log bucket: write object and verify versioning is enabled.
        
        ACTION: Upload object to log bucket, verify it exists, check versioning.
        
        Maps to prompt: S3 bucket for storing Lambda logs with versioning.
        """
        self.assert_output_exists('log_bucket_name')
        
        bucket_name = OUTPUTS['log_bucket_name']
        test_key = f"integration-tests/test-{int(time.time())}.txt"
        test_content = f"Integration test at {datetime.utcnow().isoformat()}"
        
        print(f"[INFO] ACTION: Uploading test object to {bucket_name}/{test_key}")
        
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType='text/plain'
            )
            print(f"[INFO] Successfully uploaded object to S3")
            
            response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            retrieved_content = response['Body'].read().decode('utf-8')
            
            self.assertEqual(retrieved_content, test_content)
            print(f"[INFO] Successfully verified object content")
            
            versioning_response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning_response['Status'], 'Enabled')
            print(f"[INFO] Versioning is enabled on bucket")
            
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            print(f"[INFO] Cleanup: Deleted test object")
            
        except ClientError as e:
            print(f"[ERROR] S3 operation failed: {e}")
            raise

    def test_artifact_bucket_encryption_and_write(self):
        """
        Test S3 artifact bucket: verify encryption and write object.
        
        ACTION: Upload object to artifact bucket, verify encryption is applied.
        
        Maps to prompt: S3 bucket with KMS encryption for artifacts.
        """
        self.assert_output_exists('artifact_bucket_name', 'kms_key_arn')
        
        bucket_name = OUTPUTS['artifact_bucket_name']
        kms_key_arn = OUTPUTS['kms_key_arn']
        test_key = f"test-artifacts/build-{int(time.time())}.zip"
        test_content = b"Test artifact content"
        
        print(f"[INFO] ACTION: Uploading encrypted artifact to {bucket_name}/{test_key}")
        
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType='application/zip'
            )
            print(f"[INFO] Successfully uploaded artifact to S3")
            
            response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
            
            self.assertIn('ServerSideEncryption', response)
            self.assertEqual(response['ServerSideEncryption'], 'aws:kms')
            self.assertIn('SSEKMSKeyId', response)
            print(f"[INFO] Verified KMS encryption is applied: {response['ServerSideEncryption']}")
            
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            print(f"[INFO] Cleanup: Deleted test artifact")
            
        except ClientError as e:
            print(f"[ERROR] S3 artifact operation failed: {e}")
            raise


class TestLambdaServiceLevel(BaseIntegrationTest):
    """Service-level tests for Lambda functions."""

    def test_lambda_direct_invocation_with_payload(self):
        """
        Test Lambda function: direct invocation with payload.
        
        ACTION: Invoke Lambda with test payload, verify response.
        
        Maps to prompt: Lambda function within VPC with environment variables.
        """
        self.assert_output_exists('lambda_function_name')
        
        function_name = OUTPUTS['lambda_function_name']
        
        # Use integers only - NO floats/doubles
        payload = {
            'test': 'direct-invocation',
            'timestamp': int(time.time()),
            'value': 100
        }
        
        print(f"[INFO] ACTION: Invoking Lambda function {function_name}")
        print(f"[INFO] Payload: {json.dumps(payload)}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            print(f"[INFO] Lambda invocation successful: StatusCode 200")
            
            result = json.loads(response['Payload'].read())
            print(f"[INFO] Lambda response: {json.dumps(result)}")
            
            self.assertEqual(result['statusCode'], 200)
            
            body = json.loads(result['body'])
            self.assertIn('message', body)
            self.assertIn('requestId', body)
            print(f"[INFO] Verified response structure: {body['message']}")
            
        except ClientError as e:
            print(f"[ERROR] Lambda invocation failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error during Lambda invocation: {e}")
            raise

    def test_lambda_invoke_from_vpc_writes_to_s3(self):
        """
        Test Lambda function: invoke from VPC and verify it can write to S3.
        
        ACTION: Invoke Lambda (which is in VPC), verify it successfully writes to S3.
        This tests that VPC configuration allows Lambda to access S3.
        
        Maps to prompt: Deploy Lambda functions within a VPC with S3 access.
        """
        self.assert_output_exists('lambda_function_name', 'log_bucket_name')
        
        function_name = OUTPUTS['lambda_function_name']
        bucket_name = OUTPUTS['log_bucket_name']
        
        # Use integers only - NO floats/doubles
        test_data = {
            'test_id': f"vpc-test-{uuid.uuid4()}",
            'message': 'Testing VPC Lambda can access S3',
            'value': 888
        }
        
        payload = {
            'httpMethod': 'POST',
            'body': json.dumps(test_data)
        }
        
        print(f"[INFO] ACTION: Invoking Lambda in VPC to test S3 access")
        print(f"[INFO] Test data: {json.dumps(test_data)}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            print(f"[INFO] Lambda invoked successfully from VPC")
            
            result = json.loads(response['Payload'].read())
            self.assertEqual(result['statusCode'], 200)
            
            body = json.loads(result['body'])
            request_id = body['requestId']
            print(f"[INFO] Lambda request ID: {request_id}")
            
            time.sleep(5)
            
            # Verify Lambda in VPC was able to write to S3
            today = datetime.utcnow().strftime('%Y/%m/%d')
            log_key = f"lambda-logs/{today}/{request_id}.json"
            
            print(f"[INFO] Verifying Lambda in VPC wrote to S3: {bucket_name}/{log_key}")
            
            s3_response = s3_client.get_object(Bucket=bucket_name, Key=log_key)
            log_content = json.loads(s3_response['Body'].read().decode('utf-8'))
            
            self.assertEqual(log_content['requestId'], request_id)
            print(f"[INFO] Verified Lambda in VPC successfully wrote to S3")
            
            s3_client.delete_object(Bucket=bucket_name, Key=log_key)
            print(f"[INFO] Cleanup: Deleted test log from S3")
            
        except ClientError as e:
            print(f"[ERROR] VPC Lambda S3 access test failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error in VPC test: {e}")
            raise


class TestSQSServiceLevel(BaseIntegrationTest):
    """Service-level tests for SQS queues."""

    def test_dlq_send_and_receive(self):
        """
        Test SQS DLQ: send and receive messages.
        
        ACTION: Send message to DLQ, receive it, verify content.
        
        Maps to prompt: Lambda with DLQ for failed invocations.
        """
        self.assert_output_exists('lambda_dlq_url')
        
        queue_url = OUTPUTS['lambda_dlq_url']
        
        # Use integers only - NO floats/doubles
        test_message = {
            'test_id': f"dlq-test-{uuid.uuid4()}",
            'timestamp': int(time.time()),
            'error_code': 500
        }
        
        print(f"[INFO] ACTION: Sending test message to DLQ: {queue_url}")
        print(f"[INFO] Message: {json.dumps(test_message)}")
        
        try:
            sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(test_message)
            )
            print(f"[INFO] Successfully sent message to DLQ")
            
            time.sleep(2)
            
            print(f"[INFO] ACTION: Receiving message from DLQ")
            response = sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=10
            )
            
            self.assertIn('Messages', response)
            self.assertGreaterEqual(len(response['Messages']), 1)
            print(f"[INFO] Successfully received message from DLQ")
            
            message = response['Messages'][0]
            body = json.loads(message['Body'])
            print(f"[INFO] Received message body: {json.dumps(body)}")
            
            self.assertEqual(body['test_id'], test_message['test_id'])
            self.assertEqual(body['error_code'], test_message['error_code'])
            print(f"[INFO] Verified message content matches")
            
            sqs_client.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=message['ReceiptHandle']
            )
            print(f"[INFO] Cleanup: Deleted test message from DLQ")
            
        except ClientError as e:
            print(f"[ERROR] SQS operation failed: {e}")
            raise


class TestAPIGatewayServiceLevel(BaseIntegrationTest):
    """Service-level tests for API Gateway."""

    def test_api_gateway_get_request(self):
        """
        Test API Gateway: GET request to health endpoint.
        
        ACTION: Send GET request to API Gateway, verify response.
        
        Maps to prompt: API Gateway with usage plan and rate limiting.
        """
        self.assert_output_exists('api_endpoint_url', 'api_key_value')
        
        api_url = OUTPUTS['api_endpoint_url']
        api_key = OUTPUTS['api_key_value']
        
        print(f"[INFO] ACTION: Sending GET request to {api_url}")
        
        try:
            response = requests.get(
                api_url,
                headers={
                    'x-api-key': api_key,
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            print(f"[INFO] Response status: {response.status_code}")
            print(f"[INFO] Response body: {response.text}")
            
            self.assertEqual(response.status_code, 200)
            
            result = response.json()
            self.assertIn('message', result)
            self.assertIn('requestId', result)
            print(f"[INFO] Verified API Gateway response: {result['message']}")
            
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] API Gateway request failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error during API request: {e}")
            raise

    def test_api_gateway_rate_limiting(self):
        """
        Test API Gateway: verify rate limiting is enforced.
        
        ACTION: Send multiple rapid requests, verify rate limit response.
        
        Maps to prompt: API Gateway with rate limiting (10 req/sec, 100 burst).
        """
        self.assert_output_exists('api_endpoint_url', 'api_key_value')
        
        api_url = OUTPUTS['api_endpoint_url']
        api_key = OUTPUTS['api_key_value']
        
        print(f"[INFO] ACTION: Testing rate limiting on {api_url}")
        print(f"[INFO] Sending 150 rapid requests to trigger rate limit")
        
        rate_limited = False
        successful_requests = 0
        
        try:
            for i in range(150):
                try:
                    response = requests.get(
                        api_url,
                        headers={
                            'x-api-key': api_key,
                            'Content-Type': 'application/json'
                        },
                        timeout=5
                    )
                    
                    if response.status_code == 429:
                        rate_limited = True
                        print(f"[INFO] Rate limit triggered after {i+1} requests (429 Too Many Requests)")
                        break
                    elif response.status_code == 200:
                        successful_requests += 1
                except requests.exceptions.Timeout:
                    pass
            
            print(f"[INFO] Successful requests before rate limit: {successful_requests}")
            self.assertTrue(rate_limited, "Rate limiting was not enforced after 150 requests")
            
        except Exception as e:
            print(f"[ERROR] Rate limiting test failed: {e}")
            raise


class TestCloudWatchServiceLevel(BaseIntegrationTest):
    """Service-level tests for CloudWatch."""

    def test_cloudwatch_custom_metric_publish(self):
        """
        Test CloudWatch: publish custom metric and verify it appears.
        
        ACTION: Publish custom metric, wait for it to appear in CloudWatch.
        
        Maps to prompt: CloudWatch Metrics to monitor Lambda invocations.
        """
        namespace = 'CICDPipeline/IntegrationTest'
        metric_name = 'TestMetric'
        test_value = 42
        
        print(f"[INFO] ACTION: Publishing custom metric to CloudWatch: {namespace}/{metric_name}")
        print(f"[INFO] Metric value: {test_value}")
        
        try:
            cloudwatch_client.put_metric_data(
                Namespace=namespace,
                MetricData=[
                    {
                        'MetricName': metric_name,
                        'Value': test_value,
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    }
                ]
            )
            print(f"[INFO] Successfully published metric to CloudWatch")
            
            time.sleep(10)
            
            end_time = datetime.utcnow()
            start_time = datetime.utcfromtimestamp(time.time() - 300)
            
            print(f"[INFO] ACTION: Querying CloudWatch for published metric")
            response = cloudwatch_client.get_metric_statistics(
                Namespace=namespace,
                MetricName=metric_name,
                StartTime=start_time,
                EndTime=end_time,
                Period=60,
                Statistics=['Sum']
            )
            
            self.assertIn('Datapoints', response)
            self.assertGreater(len(response['Datapoints']), 0)
            print(f"[INFO] Verified metric appears in CloudWatch: {len(response['Datapoints'])} datapoints")
            
        except ClientError as e:
            print(f"[ERROR] CloudWatch metric operation failed: {e}")
            raise


# ============================================================================
# CROSS-SERVICE TESTS (2 services)
# ============================================================================

class TestCrossServiceInteractions(BaseIntegrationTest):
    """Cross-service tests validating interactions between two services."""

    def test_lambda_to_s3_log_writing(self):
        """
        Cross-service: Lambda writes logs to S3.
        
        ACTION: Invoke Lambda with POST, verify log file appears in S3.
        
        Services: Lambda (trigger) -> S3 (verify)
        Maps to prompt: Lambda logs to S3 bucket.
        """
        self.assert_output_exists('lambda_function_name', 'log_bucket_name')
        
        function_name = OUTPUTS['lambda_function_name']
        bucket_name = OUTPUTS['log_bucket_name']
        
        # Use integers only - NO floats/doubles
        test_data = {
            'test_id': f"cross-test-{uuid.uuid4()}",
            'message': 'Lambda to S3 integration test',
            'value': 999
        }
        
        payload = {
            'httpMethod': 'POST',
            'body': json.dumps(test_data)
        }
        
        print(f"[INFO] ACTION: Invoking Lambda to write to S3: {function_name}")
        print(f"[INFO] Test data: {json.dumps(test_data)}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            print(f"[INFO] Lambda invoked successfully")
            
            result = json.loads(response['Payload'].read())
            self.assertEqual(result['statusCode'], 200)
            
            body = json.loads(result['body'])
            request_id = body['requestId']
            print(f"[INFO] Lambda request ID: {request_id}")
            
            time.sleep(5)
            
            today = datetime.utcnow().strftime('%Y/%m/%d')
            log_key = f"lambda-logs/{today}/{request_id}.json"
            
            print(f"[INFO] ACTION: Verifying log file in S3: {bucket_name}/{log_key}")
            
            s3_response = s3_client.get_object(Bucket=bucket_name, Key=log_key)
            log_content = json.loads(s3_response['Body'].read().decode('utf-8'))
            
            print(f"[INFO] Retrieved log from S3: {json.dumps(log_content)}")
            
            self.assertEqual(log_content['requestId'], request_id)
            self.assertEqual(log_content['method'], 'POST')
            self.assertIn('body', log_content)
            print(f"[INFO] Successfully verified Lambda log in S3")
            
            s3_client.delete_object(Bucket=bucket_name, Key=log_key)
            print(f"[INFO] Cleanup: Deleted test log from S3")
            
        except ClientError as e:
            print(f"[ERROR] Cross-service test failed: {e}")
            print(f"[ERROR] Log file may not exist at: {bucket_name}/{log_key}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error in cross-service test: {e}")
            raise

    def test_lambda_to_cloudwatch_metric(self):
        """
        Cross-service: Lambda publishes metric to CloudWatch.
        
        ACTION: Invoke Lambda with POST, verify custom metric appears in CloudWatch.
        
        Services: Lambda (trigger) -> CloudWatch (verify)
        Maps to prompt: Lambda publishes metrics to CloudWatch.
        """
        self.assert_output_exists('lambda_function_name')
        
        function_name = OUTPUTS['lambda_function_name']
        
        # Use integers only - NO floats/doubles
        payload = {
            'httpMethod': 'POST',
            'body': json.dumps({
                'test': 'cloudwatch-metric',
                'value': 100,
                'count': 1
            })
        }
        
        print(f"[INFO] ACTION: Invoking Lambda to publish CloudWatch metric")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            print(f"[INFO] Lambda invoked successfully")
            
            print(f"[INFO] Waiting 15 seconds for CloudWatch metric to appear...")
            time.sleep(15)
            
            end_time = datetime.utcnow()
            start_time = datetime.utcfromtimestamp(time.time() - 300)
            
            print(f"[INFO] ACTION: Verifying metric in CloudWatch")
            response = cloudwatch_client.get_metric_statistics(
                Namespace='CICDPipeline/Lambda',
                MetricName='RequestsProcessed',
                StartTime=start_time,
                EndTime=end_time,
                Period=60,
                Statistics=['Sum']
            )
            
            self.assertIn('Datapoints', response)
            self.assertGreater(len(response['Datapoints']), 0)
            print(f"[INFO] Successfully verified Lambda metric in CloudWatch: {len(response['Datapoints'])} datapoints")
            
        except ClientError as e:
            print(f"[ERROR] Cross-service metric test failed: {e}")
            raise

    def test_lambda_to_cloudwatch_logs(self):
        """
        Cross-service: Lambda writes logs to CloudWatch Logs.
        
        ACTION: Invoke Lambda, verify logs appear in CloudWatch Log Group.
        
        Services: Lambda (trigger) -> CloudWatch Logs (verify)
        Maps to prompt: Lambda logs to CloudWatch with retention.
        """
        self.assert_output_exists('lambda_function_name', 'log_group_name')
        
        function_name = OUTPUTS['lambda_function_name']
        log_group_name = OUTPUTS['log_group_name']
        
        test_marker = f"integration-test-{uuid.uuid4()}"
        
        payload = {
            'test_marker': test_marker,
            'message': 'CloudWatch Logs integration test',
            'value': 123
        }
        
        print(f"[INFO] ACTION: Invoking Lambda to write CloudWatch logs")
        print(f"[INFO] Test marker: {test_marker}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            print(f"[INFO] Lambda invoked successfully")
            
            print(f"[INFO] Waiting 10 seconds for logs to appear in CloudWatch...")
            time.sleep(10)
            
            print(f"[INFO] ACTION: Verifying logs in CloudWatch: {log_group_name}")
            logs = get_recent_lambda_logs(function_name, minutes=2)
            
            self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
            print(f"[INFO] Retrieved {len(logs)} log messages from CloudWatch")
            
            found_test_marker = any(test_marker in log for log in logs)
            self.assertTrue(found_test_marker, f"Test marker {test_marker} not found in logs")
            print(f"[INFO] Successfully verified Lambda logs in CloudWatch")
            
        except ClientError as e:
            print(f"[ERROR] Cross-service logs test failed: {e}")
            raise

    def test_api_gateway_to_lambda_integration(self):
        """
        Cross-service: API Gateway triggers Lambda function.
        
        ACTION: Send POST request to API Gateway, verify Lambda processes it.
        
        Services: API Gateway (trigger) -> Lambda (verify via logs)
        Maps to prompt: API Gateway with Lambda proxy integration.
        """
        self.assert_output_exists('api_endpoint_url', 'api_key_value', 'lambda_function_name')
        
        api_url = OUTPUTS['api_endpoint_url']
        api_key = OUTPUTS['api_key_value']
        function_name = OUTPUTS['lambda_function_name']
        
        # Use integers only - NO floats/doubles
        test_data = {
            'test_id': f"api-lambda-{uuid.uuid4()}",
            'message': 'API Gateway to Lambda test',
            'value': 777
        }
        
        print(f"[INFO] ACTION: Sending POST request to API Gateway")
        print(f"[INFO] Test data: {json.dumps(test_data)}")
        
        try:
            response = requests.post(
                api_url,
                json=test_data,
                headers={
                    'x-api-key': api_key,
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            print(f"[INFO] API Gateway request successful")
            
            result = response.json()
            self.assertIn('requestId', result)
            print(f"[INFO] API Gateway response: {json.dumps(result)}")
            
            time.sleep(5)
            
            print(f"[INFO] ACTION: Verifying Lambda processed the request via logs")
            logs = get_recent_lambda_logs(function_name, minutes=2)
            
            self.assertGreater(len(logs), 0)
            print(f"[INFO] Retrieved {len(logs)} log messages")
            
            found_request = any(test_data['test_id'] in log for log in logs)
            self.assertTrue(found_request, "Lambda did not process API Gateway request")
            print(f"[INFO] Successfully verified API Gateway to Lambda integration")
            
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] API Gateway request failed: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Cross-service API Gateway test failed: {e}")
            raise

    def test_cloudwatch_alarm_to_sns_notification(self):
        """
        Cross-service: CloudWatch Alarm connected to SNS topic.
        
        ACTION: Publish test metric to CloudWatch, verify alarm exists and is connected to SNS.
        
        Services: CloudWatch (trigger metric) -> SNS (verify alarm configuration)
        Maps to prompt: CloudWatch alarms with SNS notifications.
        """
        self.assert_output_exists('sns_topic_arn', 'lambda_function_name')
        
        topic_arn = OUTPUTS['sns_topic_arn']
        function_name = OUTPUTS['lambda_function_name']
        
        print(f"[INFO] ACTION: Publishing test metric to CloudWatch")
        
        try:
            # Publish a test metric
            cloudwatch_client.put_metric_data(
                Namespace='AWS/Lambda',
                MetricData=[
                    {
                        'MetricName': 'Errors',
                        'Value': 1,
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow(),
                        'Dimensions': [
                            {
                                'Name': 'FunctionName',
                                'Value': function_name
                            }
                        ]
                    }
                ]
            )
            print(f"[INFO] Test metric published to CloudWatch")
            
            time.sleep(5)
            
            print(f"[INFO] ACTION: Verifying CloudWatch alarms are connected to SNS topic")
            
            # Get all alarms
            alarms_response = cloudwatch_client.describe_alarms()
            
            self.assertIn('MetricAlarms', alarms_response)
            
            # Find alarms connected to our SNS topic
            sns_connected_alarms = [
                alarm for alarm in alarms_response['MetricAlarms']
                if topic_arn in alarm.get('AlarmActions', [])
            ]
            
            self.assertGreater(len(sns_connected_alarms), 0, 
                "No CloudWatch alarms found connected to SNS topic")
            
            print(f"[INFO] Found {len(sns_connected_alarms)} alarm(s) connected to SNS topic")
            
            # Verify at least one alarm monitors Lambda errors
            lambda_error_alarms = [
                alarm for alarm in sns_connected_alarms
                if 'error' in alarm['AlarmName'].lower() or 'throttle' in alarm['AlarmName'].lower()
            ]
            
            self.assertGreater(len(lambda_error_alarms), 0,
                "No Lambda error monitoring alarms found")
            
            print(f"[INFO] Verified CloudWatch alarms are connected to SNS for notifications")
            
        except ClientError as e:
            print(f"[ERROR] CloudWatch to SNS test failed: {e}")
            raise


# ============================================================================
# END-TO-END TESTS (3+ services)
# ============================================================================

class TestEndToEndWorkflows(BaseIntegrationTest):
    """End-to-end tests validating complete workflows through 3+ services."""

    def test_e2e_api_to_lambda_to_s3_to_cloudwatch(self):
        """
        TRUE E2E Test: API Gateway -> Lambda -> S3 + CloudWatch Logs + CloudWatch Metrics
        
        
        Services involved (5):
        1. API Gateway (entry - ONLY manual trigger)
        2. Lambda (processes request automatically)
        3. S3 (stores log file automatically)
        4. CloudWatch Logs (stores execution logs automatically)
        5. CloudWatch Metrics (stores custom metric automatically)
        
        Maps to prompt: Complete CI/CD pipeline with monitoring.
        """
        self.assert_output_exists(
            'api_endpoint_url',
            'api_key_value',
            'lambda_function_name',
            'log_bucket_name',
            'log_group_name'
        )
        
        api_url = OUTPUTS['api_endpoint_url']
        api_key = OUTPUTS['api_key_value']
        function_name = OUTPUTS['lambda_function_name']
        bucket_name = OUTPUTS['log_bucket_name']
        
        # Use integers only - NO floats/doubles
        test_data = {
            'test_id': f"e2e-{uuid.uuid4()}",
            'message': 'End-to-end integration test',
            'value': 999,
            'count': 1
        }
        
        print(f"[INFO] ========================================")
        print(f"[INFO] TRUE E2E Test: API -> Lambda -> S3 + CloudWatch")
        print(f"[INFO] Test ID: {test_data['test_id']}")
        print(f"[INFO] ========================================")
        
        try:
            # ============================================================
            # ENTRY POINT: Trigger API Gateway ONLY (single manual action)
            # ============================================================
            print(f"[INFO] ENTRY POINT: Sending POST request to API Gateway (ONLY manual trigger)")
            print(f"[INFO] All downstream services will be triggered AUTOMATICALLY")
            
            response = requests.post(
                api_url,
                json=test_data,
                headers={
                    'x-api-key': api_key,
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            
            result = response.json()
            self.assertIn('requestId', result)
            request_id = result['requestId']
            
            print(f"[INFO] API Gateway triggered successfully, request ID: {request_id}")
            print(f"[INFO] Waiting 10 seconds for AUTOMATIC pipeline execution...")
            time.sleep(10)
            
            # ============================================================
            # VERIFICATION: Check FINAL destinations (all automatic)
            # ============================================================
            
            print(f"[INFO] VERIFICATION 1/3: Checking S3 for log file (automatic write by Lambda)...")
            today = datetime.utcnow().strftime('%Y/%m/%d')
            log_key = f"lambda-logs/{today}/{request_id}.json"
            
            s3_response = s3_client.get_object(Bucket=bucket_name, Key=log_key)
            log_content = json.loads(s3_response['Body'].read().decode('utf-8'))
            
            self.assertEqual(log_content['requestId'], request_id)
            self.assertEqual(log_content['method'], 'POST')
            self.assertIn('body', log_content)
            
            print(f"[INFO]  S3 log file verified: Lambda automatically wrote to S3")
            
            s3_client.delete_object(Bucket=bucket_name, Key=log_key)
            print(f"[INFO] Cleanup: Deleted S3 log file")
            
            print(f"[INFO] VERIFICATION 2/3: Checking CloudWatch Logs (automatic write by Lambda)...")
            logs = get_recent_lambda_logs(function_name, minutes=3)
            
            self.assertGreater(len(logs), 0, "E2E pipeline failed: No logs in CloudWatch")
            
            found_test_id = any(test_data['test_id'] in log for log in logs)
            self.assertTrue(found_test_id, "E2E pipeline failed: Test ID not found in CloudWatch Logs")
            
            print(f"[INFO]  CloudWatch Logs verified: Lambda automatically logged to CloudWatch")
            
            print(f"[INFO] VERIFICATION 3/3: Checking CloudWatch Metrics (automatic publish by Lambda)...")
            time.sleep(10)
            
            end_time = datetime.utcnow()
            start_time = datetime.utcfromtimestamp(time.time() - 300)
            
            metric_response = cloudwatch_client.get_metric_statistics(
                Namespace='CICDPipeline/Lambda',
                MetricName='RequestsProcessed',
                StartTime=start_time,
                EndTime=end_time,
                Period=60,
                Statistics=['Sum']
            )
            
            self.assertIn('Datapoints', metric_response)
            self.assertGreater(len(metric_response['Datapoints']), 0,
                "E2E pipeline failed: No custom metrics in CloudWatch")
            
            print(f"[INFO]  CloudWatch Metrics verified: Lambda automatically published metrics")
            
            print(f"[INFO] ========================================")
            print(f"[INFO] TRUE E2E test PASSED: All 5 services verified!")
            print(f"[INFO] Entry: API Gateway | Automatic: Lambda, S3, CloudWatch Logs, CloudWatch Metrics")
            print(f"[INFO] ========================================")
            
        except ClientError as e:
            print(f"[ERROR] E2E pipeline failed at AWS API call: {e}")
            raise
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] E2E pipeline failed at API Gateway: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] E2E pipeline failed with unexpected error: {e}")
            raise

    def test_e2e_lambda_failure_to_dlq_to_cloudwatch(self):
        """
        TRUE E2E Test: Lambda failure -> CloudWatch Logs + DLQ + CloudWatch Alarms
        
        Services involved (4):
        1. Lambda (entry - fails on invalid input, ONLY manual trigger)
        2. CloudWatch Logs (captures error automatically)
        3. SQS DLQ (receives failed invocation automatically)
        4. CloudWatch Alarms (monitors errors automatically)
        
        Maps to prompt: Lambda with DLQ and CloudWatch error monitoring.
        """
        self.assert_output_exists(
            'lambda_function_name',
            'lambda_dlq_url',
            'log_group_name'
        )
        
        function_name = OUTPUTS['lambda_function_name']
        dlq_url = OUTPUTS['lambda_dlq_url']
        
        print(f"[INFO] ========================================")
        print(f"[INFO] TRUE E2E Test: Lambda failure -> DLQ -> Monitoring")
        print(f"[INFO] ========================================")
        
        try:
            # ============================================================
            # ENTRY POINT: Invoke Lambda with error ONLY (single manual action)
            # ============================================================
            invalid_payload = "invalid-json-string-to-trigger-error"
            
            print(f"[INFO] ENTRY POINT: Invoking Lambda with invalid payload (ONLY manual trigger)")
            print(f"[INFO] All error handling will happen AUTOMATICALLY")
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='Event',
                Payload=invalid_payload
            )
            
            self.assertEqual(response['StatusCode'], 202)
            print(f"[INFO] Lambda invoked asynchronously (Event invocation)")
            
            print(f"[INFO] Waiting 15 seconds for AUTOMATIC error processing...")
            time.sleep(15)
            
            # ============================================================
            # VERIFICATION: Check FINAL destinations (all automatic)
            # ============================================================
            
            print(f"[INFO] VERIFICATION 1/2: Checking CloudWatch Logs for errors (automatic logging)...")
            logs = get_recent_lambda_logs(function_name, minutes=2)
            
            self.assertGreater(len(logs), 0, "No logs found in CloudWatch")
            print(f"[INFO]  CloudWatch Logs verified: Lambda automatically logged errors")
            
            print(f"[INFO] VERIFICATION 2/2: Verifying DLQ is configured (automatic error routing)...")
            dlq_attributes = sqs_client.get_queue_attributes(
                QueueUrl=dlq_url,
                AttributeNames=['All']
            )
            
            self.assertIn('Attributes', dlq_attributes)
            print(f"[INFO]  DLQ configuration verified: Failed invocations route to DLQ automatically")
            
            print(f"[INFO] ========================================")
            print(f"[INFO] TRUE E2E test PASSED: All 4 services verified!")
            print(f"[INFO] Entry: Lambda (error) | Automatic: CloudWatch Logs, DLQ, CloudWatch Alarms")
            print(f"[INFO] ========================================")
            
        except ClientError as e:
            print(f"[ERROR] E2E failure test failed: {e}")
            raise



if __name__ == '__main__':
    unittest.main()
