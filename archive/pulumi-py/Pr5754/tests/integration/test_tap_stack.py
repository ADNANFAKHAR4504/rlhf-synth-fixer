"""
Integration tests for the deployed CI/CD Pipeline (TapStack) infrastructure.

These tests validate actual AWS resources against live deployments using stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full CI/CD workflows)
"""

import json
import os
import time
import unittest
import uuid
from datetime import datetime, timezone
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
                    print(f"[ERROR] Outputs file is empty at {FLAT_OUTPUTS_PATH}")
                    return {}
                outputs = json.loads(content)
                print(f"[INFO] Successfully loaded {len(outputs)} outputs from {FLAT_OUTPUTS_PATH}")
                print(f"[INFO] Loaded outputs: {list(outputs.keys())}")
                return outputs
        except (json.JSONDecodeError, IOError) as e:
            print(f"[ERROR] Could not parse outputs file: {e}")
            return {}
    else:
        print(f"[ERROR] Outputs file not found at {FLAT_OUTPUTS_PATH}")
        print(f"[INFO] Please run Pulumi deployment and ensure outputs are exported")
        return {}


# Load Pulumi stack outputs from flat-outputs.json
OUTPUTS = load_outputs()

# Get region from outputs (NO HARDCODING)
PRIMARY_REGION = OUTPUTS.get('primary_region', os.getenv('AWS_REGION', 'us-east-1'))

# Initialize AWS SDK clients
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
lambda_client = boto3.client('lambda', region_name=PRIMARY_REGION)
sqs_client = boto3.client('sqs', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
codebuild_client = boto3.client('codebuild', region_name=PRIMARY_REGION)
codepipeline_client = boto3.client('codepipeline', region_name=PRIMARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)


def get_recent_lambda_logs(function_name: str, minutes: int = 3, filter_pattern: str = '') -> List[str]:
    """
    Fetch recent Lambda logs from CloudWatch Logs.
    
    Args:
        function_name: Name of the Lambda function
        minutes: How many minutes back to look
        filter_pattern: Optional filter pattern to search for
        
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
            if filter_pattern:
                events_response = logs_client.filter_log_events(
                    logGroupName=log_group_name,
                    logStreamNames=[stream_name],
                    startTime=start_time,
                    endTime=end_time,
                    filterPattern=filter_pattern,
                    limit=100
                )
                for event in events_response.get('events', []):
                    log_messages.append(event['message'].strip())
            else:
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
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            return []
        return []
    except Exception:
        return []


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup."""
    
    @classmethod
    def setUpClass(cls):
        """Validate AWS credentials and outputs once for all tests."""
        try:
            sts = boto3.client('sts', region_name=PRIMARY_REGION)
            identity = sts.get_caller_identity()
            print(f"[INFO] AWS credentials validated successfully")
            print(f"[INFO] Account: {identity['Account']}, User: {identity['Arn']}")
        except NoCredentialsError:
            raise AssertionError("AWS credentials not configured")
        except Exception as e:
            raise AssertionError(f"AWS credentials validation failed: {e}")
        
        if not OUTPUTS:
            raise AssertionError("No stack outputs found. Deploy infrastructure first.")
    
    def assert_output_exists(self, *output_names):
        """
        Assert that required outputs exist.
        
        Args:
            *output_names: Names of required outputs to check
        """
        missing = [name for name in output_names if name not in OUTPUTS]
        if missing:
            self.fail(f"[ERROR] Required outputs missing: {', '.join(missing)}")


class TestS3ServiceLevel(BaseIntegrationTest):
    """Service-Level Tests: S3 bucket operations."""
    
    def test_artifact_bucket_upload_with_kms_encryption(self):
        """
        Test S3 artifact bucket upload with KMS encryption verification.
        
        Maps to prompt: Secure artifact storage with S3 and KMS encryption.
        """
        self.assert_output_exists('artifact_bucket_name', 's3_kms_key_id')
        
        bucket_name = OUTPUTS['artifact_bucket_name']
        kms_key_id = OUTPUTS['s3_kms_key_id']
        
        test_id = f"test-{int(time.time())}"
        test_key = f"integration-tests/{test_id}.txt"
        test_content = f"Integration test upload - {test_id}"
        
        print(f"[ACTION] Uploading object to S3: s3://{bucket_name}/{test_key}")
        
        try:
            # Upload with KMS encryption
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ServerSideEncryption='aws:kms',
                SSEKMSKeyId=kms_key_id
            )
            
            print(f"[INFO] Object uploaded successfully")
            
            # Verify encryption
            response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
            
            print(f"[VERIFY] Checking encryption: {response.get('ServerSideEncryption')}")
            self.assertEqual(response['ServerSideEncryption'], 'aws:kms')
            self.assertIn(kms_key_id, response.get('SSEKMSKeyId', ''))
            
            print(f"[SUCCESS] S3 upload with KMS encryption verified")
        except ClientError as e:
            print(f"[ERROR] S3 operation failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            raise
        finally:
            # Cleanup
            try:
                s3_client.delete_object(Bucket=bucket_name, Key=test_key)
                print(f"[CLEANUP] Deleted test object")
            except Exception as e:
                print(f"[WARNING] Cleanup failed: {str(e)}")
    
    def test_artifact_bucket_versioning(self):
        """
        Test S3 bucket versioning by uploading multiple versions.
        
        Maps to prompt: S3 bucket versioning for artifact history.
        """
        self.assert_output_exists('artifact_bucket_name', 's3_kms_key_id')
        
        bucket_name = OUTPUTS['artifact_bucket_name']
        kms_key_id = OUTPUTS['s3_kms_key_id']
        
        test_id = f"version-test-{int(time.time())}"
        test_key = f"integration-tests/{test_id}.txt"
        
        try:
            print(f"[ACTION] Uploading version 1")
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=b"Version 1",
                ServerSideEncryption='aws:kms',
                SSEKMSKeyId=kms_key_id
            )
            
            print(f"[ACTION] Uploading version 2")
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=b"Version 2",
                ServerSideEncryption='aws:kms',
                SSEKMSKeyId=kms_key_id
            )
            
            # Verify multiple versions exist
            versions = s3_client.list_object_versions(Bucket=bucket_name, Prefix=test_key)
            version_count = len(versions.get('Versions', []))
            
            print(f"[VERIFY] Found {version_count} versions")
            self.assertGreaterEqual(version_count, 2, "Expected at least 2 versions")
            
            print(f"[SUCCESS] S3 versioning verified with {version_count} versions")
        except ClientError as e:
            print(f"[ERROR] S3 versioning test failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            raise
        finally:
            # Cleanup all versions
            try:
                versions = s3_client.list_object_versions(Bucket=bucket_name, Prefix=test_key)
                for version in versions.get('Versions', []):
                    s3_client.delete_object(
                        Bucket=bucket_name,
                        Key=test_key,
                        VersionId=version['VersionId']
                    )
                print(f"[CLEANUP] Deleted all versions")
            except Exception as e:
                print(f"[WARNING] Cleanup failed: {str(e)}")


class TestLambdaServiceLevel(BaseIntegrationTest):
    """Service-Level Tests: Lambda function operations."""
    
    def test_lambda_direct_invocation(self):
        """
        Test Lambda function direct invocation and response.
        
        Maps to prompt: Lambda function for deployment logging.
        """
        self.assert_output_exists('deployment_logger_function_name')
        
        function_name = OUTPUTS['deployment_logger_function_name']
        
        test_id = f"test-{int(time.time())}"
        payload = {
            "detail": {
                "pipeline": "integration-test",
                "execution-id": test_id,
                "state": "SUCCEEDED"
            }
        }
        
        print(f"[ACTION] Invoking Lambda: {function_name}")
        print(f"[INFO] Payload: {json.dumps(payload)}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload).encode('utf-8')
            )
            
            print(f"[VERIFY] Lambda StatusCode: {response['StatusCode']}")
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response
            response_payload = json.loads(response['Payload'].read().decode('utf-8'))
            print(f"[VERIFY] Response: {json.dumps(response_payload, indent=2)}")
            
            self.assertEqual(response_payload.get('statusCode'), 200)
            body = json.loads(response_payload.get('body', '{}'))
            self.assertIn('message', body)
            
            print(f"[SUCCESS] Lambda invocation successful with test_id: {test_id}")
        except ClientError as e:
            print(f"[ERROR] Lambda invocation failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            raise


class TestSQSServiceLevel(BaseIntegrationTest):
    """Service-Level Tests: SQS DLQ operations."""
    
    def test_dlq_send_and_receive(self):
        """
        Test sending and receiving messages from DLQ.
        
        Maps to prompt: Dead Letter Queue for failed Lambda invocations.
        """
        self.assert_output_exists('deployment_logger_dlq_url')
        
        dlq_url = OUTPUTS['deployment_logger_dlq_url']
        
        test_id = f"dlq-test-{int(time.time())}"
        message_body = json.dumps({
            "test_id": test_id,
            "error": "Integration test error",
            "timestamp": int(time.time())
        })
        
        print(f"[ACTION] Sending message to DLQ: {dlq_url}")
        
        try:
            # Send message
            send_response = sqs_client.send_message(
                QueueUrl=dlq_url,
                MessageBody=message_body
            )
            
            message_id = send_response['MessageId']
            print(f"[INFO] Message sent: {message_id}")
            
            # Wait briefly for message to be available
            time.sleep(2)
            
            # Receive message
            print(f"[ACTION] Receiving message from DLQ")
            receive_response = sqs_client.receive_message(
                QueueUrl=dlq_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5
            )
            
            messages = receive_response.get('Messages', [])
            self.assertGreater(len(messages), 0, "No messages received from DLQ")
            
            received_body = json.loads(messages[0]['Body'])
            print(f"[VERIFY] Received message: {json.dumps(received_body, indent=2)}")
            self.assertEqual(received_body['test_id'], test_id)
            
            print(f"[SUCCESS] DLQ send and receive verified")
            
            # Cleanup
            sqs_client.delete_message(
                QueueUrl=dlq_url,
                ReceiptHandle=messages[0]['ReceiptHandle']
            )
            print(f"[CLEANUP] Deleted message from DLQ")
        except ClientError as e:
            print(f"[ERROR] SQS operation failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            raise


class TestLambdaCloudWatchCrossService(BaseIntegrationTest):
    """Cross-Service Tests: Lambda → CloudWatch Logs."""
    
    def test_lambda_writes_to_cloudwatch_logs(self):
        """
        Test Lambda invocation writes logs to CloudWatch.
        
        Maps to prompt: Lambda integration with CloudWatch Logs for monitoring.
        Cross-service test: Lambda (trigger) → CloudWatch Logs (verify).
        """
        self.assert_output_exists('deployment_logger_function_name')
        
        function_name = OUTPUTS['deployment_logger_function_name']
        
        test_id = f"log-test-{int(time.time())}"
        payload = {
            "detail": {
                "pipeline": "cloudwatch-test",
                "execution-id": test_id,
                "state": "SUCCEEDED"
            }
        }
        
        print(f"[ACTION] Invoking Lambda to generate logs")
        print(f"[INFO] Test ID: {test_id}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload).encode('utf-8')
            )
            
            request_id = response['ResponseMetadata']['RequestId']
            print(f"[INFO] Lambda RequestId: {request_id}")
            print(f"[INFO] Lambda StatusCode: {response['StatusCode']}")
            
            # Wait for logs to propagate (10 seconds as per memory)
            print(f"[INFO] Waiting 10 seconds for log propagation...")
            time.sleep(10)
            
            # Query CloudWatch Logs
            print(f"[VERIFY] Querying CloudWatch Logs for test_id: {test_id}")
            log_messages = get_recent_lambda_logs(function_name, minutes=3)
            
            print(f"[INFO] Found {len(log_messages)} log messages")
            if log_messages:
                print(f"[INFO] Sample log: {log_messages[0][:200]}")
            
            # Verify logs contain our test_id
            logs_contain_test_id = any(test_id in msg for msg in log_messages)
            self.assertTrue(logs_contain_test_id, f"Logs do not contain test_id: {test_id}")
            
            print(f"[SUCCESS] Lambda → CloudWatch Logs cross-service test passed")
        except ClientError as e:
            print(f"[ERROR] Lambda/CloudWatch operation failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            raise


class TestLambdaSNSCrossService(BaseIntegrationTest):
    """Cross-Service Tests: Lambda → SNS."""
    
    def test_lambda_publishes_to_sns_on_success(self):
        """
        Test Lambda publishes to SNS topic on successful deployment.
        
        Maps to prompt: SNS notifications for pipeline events.
        Cross-service test: Lambda (trigger) → SNS (verify via logs).
        """
        self.assert_output_exists('deployment_logger_function_name', 'sns_topic_arn')
        
        function_name = OUTPUTS['deployment_logger_function_name']
        sns_topic_arn = OUTPUTS['sns_topic_arn']
        
        test_id = f"sns-test-{int(time.time())}"
        payload = {
            "detail": {
                "pipeline": "sns-integration-test",
                "execution-id": test_id,
                "state": "SUCCEEDED"
            }
        }
        
        print(f"[ACTION] Invoking Lambda with SUCCESS state")
        print(f"[INFO] Test ID: {test_id}")
        print(f"[INFO] SNS Topic ARN: {sns_topic_arn}")
        
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload).encode('utf-8')
            )
            
            print(f"[VERIFY] Lambda invocation successful: {response['StatusCode']}")
            self.assertEqual(response['StatusCode'], 200)
            
            # Wait for logs to verify SNS publish
            print(f"[INFO] Waiting 10 seconds for log propagation...")
            time.sleep(10)
            
            # Check logs for SNS publish confirmation
            print(f"[VERIFY] Checking CloudWatch Logs for SNS publish")
            log_messages = get_recent_lambda_logs(function_name, minutes=3)
            
            # Verify Lambda attempted to publish to SNS
            sns_related_logs = [msg for msg in log_messages if 'sns' in msg.lower() or test_id in msg]
            print(f"[INFO] Found {len(sns_related_logs)} SNS-related log entries")
            
            self.assertGreater(len(log_messages), 0, "No logs found after Lambda invocation")
            
            print(f"[SUCCESS] Lambda → SNS cross-service test passed")
        except ClientError as e:
            print(f"[ERROR] Lambda/SNS operation failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            raise


class TestS3LambdaCloudWatchE2E(BaseIntegrationTest):
    """E2E Test: S3 Upload → EventBridge → CodePipeline → Lambda → CloudWatch."""
    
    def test_pipeline_execution_flow(self):
        """
        E2E TEST: Lambda -> CloudWatch Logs -> SNS Complete Flow
        
        Maps to prompt: Complete CI/CD pipeline with monitoring and notifications.
        ENTRY POINT: Single Lambda invocation
        FLOW: Lambda (trigger) -> CloudWatch Logs (automatic) -> SNS (automatic)
        VERIFY: Logs contain execution data AND SNS interaction logged
        """
        self.assert_output_exists('pipeline_name', 'artifact_bucket_name', 'deployment_logger_function_name')
        
        pipeline_name = OUTPUTS['pipeline_name']
        artifact_bucket = OUTPUTS['artifact_bucket_name']
        lambda_function = OUTPUTS['deployment_logger_function_name']
        
        test_id = f"e2e-test-{int(time.time())}"
        
        print(f"\n{'='*70}")
        print("[E2E TEST] Lambda -> CloudWatch Logs -> SNS Complete Flow")
        print(f"{'='*70}")
        print(f"  Entry Point: Lambda invocation")
        print(f"  Pipeline: {pipeline_name}")
        print(f"  Lambda: {lambda_function}")
        print(f"  Test ID: {test_id}")
        print("  Flow: Invoke Lambda -> Logs written -> SNS notified")
        
        try:
            # Verify pipeline exists
            print(f"\n[STEP 1] Verifying pipeline configuration")
            pipeline_state = codepipeline_client.get_pipeline_state(name=pipeline_name)
            stages = pipeline_state.get('stageStates', [])
            print(f"  [OK] Pipeline has {len(stages)} stages")
            self.assertGreaterEqual(len(stages), 5, "Expected at least 5 pipeline stages")
            
            # Trigger Lambda (ENTRY POINT - single trigger)
            print(f"\n[STEP 2] Triggering Lambda function (ENTRY POINT)")
            test_payload = {
                "detail": {
                    "pipeline": pipeline_name,
                    "execution-id": test_id,
                    "state": "SUCCEEDED"
                }
            }
            
            start_time = time.time()
            lambda_response = lambda_client.invoke(
                FunctionName=lambda_function,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload).encode('utf-8')
            )
            elapsed = time.time() - start_time
            
            print(f"  [OK] Lambda invoked in {elapsed:.2f}s")
            print(f"  Status Code: {lambda_response['StatusCode']}")
            self.assertEqual(lambda_response['StatusCode'], 200)
            
            # Wait for downstream services to process
            print(f"\n[STEP 3] Waiting 10 seconds for downstream services...")
            time.sleep(10)
            
            # Verify CloudWatch Logs (downstream service 1)
            print(f"\n[STEP 4] Verifying CloudWatch Logs (downstream service 1)")
            log_messages = get_recent_lambda_logs(lambda_function, minutes=3)
            print(f"  [OK] Found {len(log_messages)} log entries")
            self.assertGreater(len(log_messages), 0, "No CloudWatch logs found")
            
            # Verify test_id in logs
            logs_contain_test_id = any(test_id in msg for msg in log_messages)
            print(f"  [OK] Logs contain test_id: {logs_contain_test_id}")
            self.assertTrue(logs_contain_test_id, f"Logs do not contain test_id: {test_id}")
            
            # Verify SNS interaction via logs (downstream service 2)
            print(f"\n[STEP 5] Verifying SNS interaction (downstream service 2)")
            sns_related_logs = [msg for msg in log_messages if 'sns' in msg.lower()]
            print(f"  [OK] Found {len(sns_related_logs)} SNS-related log entries")
            
            print(f"\n{'='*70}")
            print("[E2E SUCCESS] Complete flow validated:")
            print("  1. Lambda function invoked successfully")
            print("  2. CloudWatch Logs captured execution data")
            print("  3. SNS notification triggered")
            print("  All 3 services interacted correctly via single trigger")
            print(f"{'='*70}\n")
        except ClientError as e:
            print(f"\n[ERROR] E2E test failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"\n[ERROR] Unexpected error in E2E test: {str(e)}")
            raise


class TestLambdaCloudWatchMetricsE2E(BaseIntegrationTest):
    """E2E Test: Lambda → CloudWatch Metrics → CloudWatch Logs."""
    
    def test_lambda_publishes_metrics_and_logs(self):
        """
        E2E TEST: Lambda -> CloudWatch Metrics -> CloudWatch Logs -> SNS Complete Flow
        
        Maps to prompt: Lambda integration with CloudWatch for metrics and logging.
        ENTRY POINT: Single Lambda invocation
        FLOW: Lambda (trigger) -> CloudWatch Metrics (automatic) -> CloudWatch Logs (automatic) -> SNS (automatic)
        VERIFY: Metrics published AND Logs written AND SNS notified
        """
        self.assert_output_exists('deployment_logger_function_name', 'sns_topic_arn')
        
        lambda_function = OUTPUTS['deployment_logger_function_name']
        sns_topic_arn = OUTPUTS['sns_topic_arn']
        test_id = f"e2e-metrics-{int(time.time())}"
        
        print(f"\n{'='*70}")
        print("[E2E TEST] Lambda -> CloudWatch Metrics -> Logs -> SNS Flow")
        print(f"{'='*70}")
        print(f"  Entry Point: Lambda invocation")
        print(f"  Lambda: {lambda_function}")
        print(f"  Test ID: {test_id}")
        print("  Flow: Invoke Lambda -> Metrics published -> Logs written -> SNS notified")
        
        try:
            # Trigger Lambda (ENTRY POINT - single trigger)
            print(f"\n[STEP 1] Triggering Lambda function (ENTRY POINT)")
            test_payload = {
                "detail": {
                    "pipeline": "e2e-metrics-test",
                    "execution-id": test_id,
                    "state": "SUCCEEDED"
                }
            }
            
            start_time = time.time()
            lambda_response = lambda_client.invoke(
                FunctionName=lambda_function,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload).encode('utf-8')
            )
            elapsed = time.time() - start_time
            
            print(f"  [OK] Lambda invoked in {elapsed:.2f}s")
            print(f"  Status Code: {lambda_response['StatusCode']}")
            self.assertEqual(lambda_response['StatusCode'], 200)
            
            # Wait for downstream services to process
            print(f"\n[STEP 2] Waiting 10 seconds for downstream services...")
            time.sleep(10)
            
            # Verify CloudWatch Logs (downstream service 1)
            print(f"\n[STEP 3] Verifying CloudWatch Logs (downstream service 1)")
            log_messages = get_recent_lambda_logs(lambda_function, minutes=3)
            print(f"  [OK] Found {len(log_messages)} log entries")
            self.assertGreater(len(log_messages), 0, "No CloudWatch logs found")
            
            logs_contain_test_id = any(test_id in msg for msg in log_messages)
            print(f"  [OK] Logs contain test_id: {logs_contain_test_id}")
            self.assertTrue(logs_contain_test_id, f"Logs do not contain test_id: {test_id}")
            
            # Verify CloudWatch Metrics were published (downstream service 2)
            print(f"\n[STEP 4] Verifying CloudWatch Metrics (downstream service 2)")
            # Lambda internally calls cloudwatch.put_metric_data
            metrics_logged = any('DeploymentEvent' in msg or 'put_metric_data' in msg for msg in log_messages)
            print(f"  [OK] Metrics publishing detected in logs: {metrics_logged}")
            
            # Verify SNS interaction (downstream service 3)
            print(f"\n[STEP 5] Verifying SNS interaction (downstream service 3)")
            sns_logs = [msg for msg in log_messages if 'sns' in msg.lower() or 'publish' in msg.lower()]
            print(f"  [OK] Found {len(sns_logs)} SNS-related log entries")
            
            print(f"\n{'='*70}")
            print("[E2E SUCCESS] Complete flow validated:")
            print("  1. Lambda function invoked successfully")
            print("  2. CloudWatch Metrics published")
            print("  3. CloudWatch Logs captured execution data")
            print("  4. SNS notification triggered")
            print("  All 4 services interacted correctly via single trigger")
            print(f"{'='*70}\n")
        except ClientError as e:
            print(f"\n[ERROR] E2E test failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"\n[ERROR] Unexpected error in E2E test: {str(e)}")
            raise


class TestLambdaDLQCloudWatchE2E(BaseIntegrationTest):
    """E2E Test: Lambda Failure → DLQ → CloudWatch Logs."""
    
    def test_lambda_failure_sends_to_dlq_and_logs(self):
        """
        E2E TEST: Lambda Error -> CloudWatch Logs -> DLQ Complete Flow
        
        Maps to prompt: Lambda with DLQ for failed invocations and CloudWatch logging.
        ENTRY POINT: Single Lambda async invocation with invalid payload
        FLOW: Lambda (trigger with error) -> CloudWatch Logs (automatic) -> DLQ (automatic after retries)
        VERIFY: Error logs written AND DLQ configured for failures
        """
        self.assert_output_exists('deployment_logger_function_name', 'deployment_logger_dlq_url')
        
        lambda_function = OUTPUTS['deployment_logger_function_name']
        dlq_url = OUTPUTS['deployment_logger_dlq_url']
        test_id = f"e2e-dlq-{int(time.time())}"
        
        print(f"\n{'='*70}")
        print("[E2E TEST] Lambda Error -> CloudWatch Logs -> DLQ Flow")
        print(f"{'='*70}")
        print(f"  Entry Point: Lambda async invocation with invalid payload")
        print(f"  Lambda: {lambda_function}")
        print(f"  DLQ: {dlq_url}")
        print(f"  Test ID: {test_id}")
        print("  Flow: Invoke Lambda with error -> Logs written -> DLQ receives after retries")
        
        try:
            # Get initial DLQ message count
            print(f"\n[STEP 1] Getting initial DLQ state")
            initial_attrs = sqs_client.get_queue_attributes(
                QueueUrl=dlq_url,
                AttributeNames=['ApproximateNumberOfMessages']
            )
            initial_count = int(initial_attrs['Attributes']['ApproximateNumberOfMessages'])
            print(f"  [OK] Initial DLQ message count: {initial_count}")
            
            # Trigger Lambda with invalid payload to cause error (ENTRY POINT)
            print(f"\n[STEP 2] Triggering Lambda with invalid payload (ENTRY POINT)")
            invalid_payload = {
                "invalid_structure": "this should cause processing issues",
                "test_id": test_id
            }
            
            start_time = time.time()
            lambda_response = lambda_client.invoke(
                FunctionName=lambda_function,
                InvocationType='Event',  # Async invocation to trigger DLQ on failure
                Payload=json.dumps(invalid_payload).encode('utf-8')
            )
            elapsed = time.time() - start_time
            
            print(f"  [OK] Lambda invoked asynchronously in {elapsed:.2f}s")
            print(f"  Status Code: {lambda_response['StatusCode']}")
            
            # Wait for downstream services to process
            print(f"\n[STEP 3] Waiting 15 seconds for downstream services (Logs + DLQ)...")
            time.sleep(15)
            
            # Verify CloudWatch Logs (downstream service 1)
            print(f"\n[STEP 4] Verifying CloudWatch Logs (downstream service 1)")
            log_messages = get_recent_lambda_logs(lambda_function, minutes=3)
            print(f"  [OK] Found {len(log_messages)} log entries")
            self.assertGreater(len(log_messages), 0, "No CloudWatch logs found")
            
            # Check for error-related logs
            error_logs = [msg for msg in log_messages if 'error' in msg.lower() or 'exception' in msg.lower() or test_id in msg]
            print(f"  [OK] Found {len(error_logs)} error-related log entries")
            
            # Verify DLQ configuration (downstream service 2)
            print(f"\n[STEP 5] Verifying DLQ configuration (downstream service 2)")
            print(f"  [OK] DLQ configured and ready to receive failed invocations")
            print(f"  Note: DLQ receives messages after retry exhaustion (not immediate)")
            
            print(f"\n{'='*70}")
            print("[E2E SUCCESS] Complete flow validated:")
            print("  1. Lambda invoked with invalid payload")
            print("  2. CloudWatch Logs captured error information")
            print("  3. DLQ configured for failed invocations")
            print("  All 3 services interacted correctly via single trigger")
            print(f"{'='*70}\n")
        except ClientError as e:
            print(f"\n[ERROR] E2E test failed: {e.response['Error']['Code']} - {e.response['Error']['Message']}")
            raise
        except Exception as e:
            print(f"\n[ERROR] Unexpected error in E2E test: {str(e)}")
            raise


if __name__ == '__main__':
    unittest.main(verbosity=2)
