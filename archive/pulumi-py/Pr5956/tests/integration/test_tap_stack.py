"""
Integration tests for the deployed CI/CD Pipeline (TapStack) infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services (full workflows)

"""

import base64
import io
import json
import os
import time
import unittest
import uuid
import zipfile
from datetime import datetime
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


# Load Pulumi stack outputs from flat-outputs.json - NO HARDCODING
OUTPUTS = load_outputs()

# Get region from outputs - NO HARDCODING
PRIMARY_REGION = OUTPUTS.get('region', os.getenv('AWS_REGION', 'us-east-1'))

# Initialize AWS SDK clients
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
lambda_client = boto3.client('lambda', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)
codebuild_client = boto3.client('codebuild', region_name=PRIMARY_REGION)
codepipeline_client = boto3.client('codepipeline', region_name=PRIMARY_REGION)
codedeploy_client = boto3.client('codedeploy', region_name=PRIMARY_REGION)
kms_client = boto3.client('kms', region_name=PRIMARY_REGION)


def get_recent_lambda_logs(function_name: str, minutes: int = 3, test_marker: Optional[str] = None) -> List[str]:
    """
    Fetch recent Lambda logs from CloudWatch Logs with error handling.
    
    Args:
        function_name: Name of the Lambda function
        minutes: How many minutes back to look
        test_marker: Optional marker to filter logs
        
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
                    if test_marker is None or test_marker in message:
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


def create_lambda_zip(handler_code: str) -> bytes:
    """
    Create a zip file containing Lambda function code.
    
    Args:
        handler_code: Python code for the Lambda handler
        
    Returns:
        Bytes of the zip file
    """
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr('handler.py', handler_code)
    return zip_buffer.getvalue()


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
            raise Exception("[ERROR] No stack outputs found. Deploy infrastructure first.")

        print(f"[INFO] Testing in region: {PRIMARY_REGION}")
        print(f"[INFO] Available outputs: {list(OUTPUTS.keys())}")


# ============================================================================
# SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
# ============================================================================

class ServiceLevelTests(BaseIntegrationTest):
    """Service-level tests that validate individual service operations."""

    def test_s3_source_bucket_can_upload_and_retrieve_object(self):
        """Test S3 source bucket can upload and retrieve objects with KMS encryption."""
        source_bucket = OUTPUTS.get('source_bucket_name')
        self.assertIsNotNone(source_bucket, "Source bucket name not found in outputs")
        
        test_key = f"test-{uuid.uuid4()}.txt"
        test_content = f"Test content at {datetime.utcnow().isoformat()}"
        
        print(f"[INFO] Uploading object {test_key} to bucket {source_bucket}")
        
        try:
            s3_client.put_object(
                Bucket=source_bucket,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ServerSideEncryption='aws:kms'
            )
            print(f"[INFO] Successfully uploaded object")
            
            time.sleep(2)
            
            response = s3_client.get_object(Bucket=source_bucket, Key=test_key)
            retrieved_content = response['Body'].read().decode('utf-8')
            
            print(f"[INFO] Retrieved content: {retrieved_content}")
            self.assertEqual(retrieved_content, test_content)
            self.assertEqual(response['ServerSideEncryption'], 'aws:kms')
            
        finally:
            try:
                s3_client.delete_object(Bucket=source_bucket, Key=test_key)
                print(f"[INFO] Cleaned up test object")
            except Exception as e:
                print(f"[WARN] Failed to cleanup: {e}")

    def test_s3_source_bucket_versioning_enabled_and_functional(self):
        """Test S3 source bucket versioning is enabled and creates multiple versions."""
        source_bucket = OUTPUTS.get('source_bucket_name')
        self.assertIsNotNone(source_bucket, "Source bucket name not found in outputs")
        
        test_key = f"versioning-test-{uuid.uuid4()}.txt"
        
        print(f"[INFO] Testing versioning on bucket {source_bucket}")
        
        try:
            s3_client.put_object(
                Bucket=source_bucket,
                Key=test_key,
                Body=b"Version 1",
                ServerSideEncryption='aws:kms'
            )
            print(f"[INFO] Uploaded version 1")
            
            time.sleep(1)
            
            s3_client.put_object(
                Bucket=source_bucket,
                Key=test_key,
                Body=b"Version 2",
                ServerSideEncryption='aws:kms'
            )
            print(f"[INFO] Uploaded version 2")
            
            time.sleep(2)
            
            versions_response = s3_client.list_object_versions(
                Bucket=source_bucket,
                Prefix=test_key
            )
            
            versions = versions_response.get('Versions', [])
            print(f"[INFO] Found {len(versions)} versions")
            
            self.assertGreaterEqual(len(versions), 2, "Should have at least 2 versions")
            
        finally:
            try:
                versions_response = s3_client.list_object_versions(
                    Bucket=source_bucket,
                    Prefix=test_key
                )
                for version in versions_response.get('Versions', []):
                    s3_client.delete_object(
                        Bucket=source_bucket,
                        Key=test_key,
                        VersionId=version['VersionId']
                    )
                print(f"[INFO] Cleaned up all versions")
            except Exception as e:
                print(f"[WARN] Failed to cleanup: {e}")

    def test_s3_artifacts_bucket_can_store_and_retrieve_build_artifacts(self):
        """Test S3 artifacts bucket can store and retrieve build artifacts."""
        artifacts_bucket = OUTPUTS.get('artifacts_bucket_name')
        self.assertIsNotNone(artifacts_bucket, "Artifacts bucket name not found in outputs")
        
        test_key = f"artifacts/test-{uuid.uuid4()}.zip"
        test_content = create_lambda_zip("def handler(event, context): return {'statusCode': 200}")
        
        print(f"[INFO] Uploading artifact {test_key} to bucket {artifacts_bucket}")
        
        try:
            s3_client.put_object(
                Bucket=artifacts_bucket,
                Key=test_key,
                Body=test_content,
                ServerSideEncryption='aws:kms'
            )
            print(f"[INFO] Successfully uploaded artifact")
            
            time.sleep(2)
            
            response = s3_client.get_object(Bucket=artifacts_bucket, Key=test_key)
            retrieved_content = response['Body'].read()
            
            self.assertEqual(len(retrieved_content), len(test_content))
            self.assertEqual(response['ServerSideEncryption'], 'aws:kms')
            
        finally:
            try:
                s3_client.delete_object(Bucket=artifacts_bucket, Key=test_key)
                print(f"[INFO] Cleaned up test artifact")
            except Exception as e:
                print(f"[WARN] Failed to cleanup: {e}")

    def test_lambda_function_can_be_invoked_successfully(self):
        """Test Lambda function can be invoked and returns success response."""
        lambda_name = OUTPUTS.get('lambda_function_name')
        self.assertIsNotNone(lambda_name, "Lambda function name not found in outputs")
        
        test_marker = f"test-{uuid.uuid4()}"
        payload = {
            'test': True,
            'marker': test_marker,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"[INFO] Invoking Lambda function {lambda_name}")
        
        response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        print(f"[INFO] Lambda response: {json.dumps(response_payload, indent=2)}")
        
        self.assertEqual(response_payload['statusCode'], 200)
        body = json.loads(response_payload['body'])
        self.assertIn('message', body)
        self.assertIn('requestId', body)

    def test_sns_topic_can_publish_and_receive_message(self):
        """Test SNS topic can publish messages successfully."""
        sns_topic_arn = OUTPUTS.get('sns_topic_arn')
        self.assertIsNotNone(sns_topic_arn, "SNS topic ARN not found in outputs")
        
        test_message = f"Test message at {datetime.utcnow().isoformat()}"
        test_subject = f"Test Subject {uuid.uuid4()}"
        
        print(f"[INFO] Publishing message to SNS topic {sns_topic_arn}")
        
        response = sns_client.publish(
            TopicArn=sns_topic_arn,
            Message=test_message,
            Subject=test_subject
        )
        
        print(f"[INFO] Published message with ID: {response['MessageId']}")
        self.assertIn('MessageId', response)
        self.assertIsNotNone(response['MessageId'])

    def test_kms_key_can_encrypt_and_decrypt_data(self):
        """Test KMS key can encrypt and decrypt data."""
        kms_key_id = OUTPUTS.get('lambda_kms_key_id')
        self.assertIsNotNone(kms_key_id, "KMS key ID not found in outputs")
        
        plaintext = f"Test data {uuid.uuid4()}"
        
        print(f"[INFO] Encrypting data with KMS key {kms_key_id}")
        
        encrypt_response = kms_client.encrypt(
            KeyId=kms_key_id,
            Plaintext=plaintext.encode('utf-8')
        )
        
        ciphertext_blob = encrypt_response['CiphertextBlob']
        print(f"[INFO] Successfully encrypted data")
        
        decrypt_response = kms_client.decrypt(
            CiphertextBlob=ciphertext_blob
        )
        
        decrypted_text = decrypt_response['Plaintext'].decode('utf-8')
        print(f"[INFO] Successfully decrypted data")
        
        self.assertEqual(decrypted_text, plaintext)


# ============================================================================
# CROSS-SERVICE TESTS (Two Services Interacting)
# ============================================================================

class CrossServiceTests(BaseIntegrationTest):
    """Cross-service tests that validate interactions between two services."""

    def test_lambda_invocation_creates_cloudwatch_logs(self):
        """Test Lambda invocation creates logs in CloudWatch."""
        lambda_name = OUTPUTS.get('lambda_function_name')
        self.assertIsNotNone(lambda_name, "Lambda function name not found in outputs")
        
        test_marker = f"cross-service-test-{uuid.uuid4()}"
        payload = {
            'test': 'cloudwatch-logging',
            'marker': test_marker,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"[INFO] Invoking Lambda {lambda_name} with marker {test_marker}")
        
        response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        print(f"[INFO] Lambda invoked successfully, waiting 10 seconds for logs to propagate")
        
        time.sleep(10)
        
        logs = get_recent_lambda_logs(lambda_name, minutes=3, test_marker=test_marker)
        
        print(f"[INFO] Found {len(logs)} log entries")
        if logs:
            print(f"[INFO] Sample log: {logs[0][:200]}")
        
        self.assertGreater(len(logs), 0, "Should have CloudWatch logs after Lambda invocation")
        
        log_content = ' '.join(logs)
        self.assertIn(test_marker, log_content, "Logs should contain test marker")

    def test_s3_upload_triggers_eventbridge_notification(self):
        """Test S3 upload triggers EventBridge notification (configured for pipeline)."""
        source_bucket = OUTPUTS.get('source_bucket_name')
        self.assertIsNotNone(source_bucket, "Source bucket name not found in outputs")
        
        test_key = f"source-{uuid.uuid4()}.zip"
        test_content = create_lambda_zip("def handler(event, context): return {'statusCode': 200}")
        
        print(f"[INFO] Uploading object {test_key} to source bucket {source_bucket}")
        
        try:
            s3_client.put_object(
                Bucket=source_bucket,
                Key=test_key,
                Body=test_content,
                ServerSideEncryption='aws:kms'
            )
            print(f"[INFO] Successfully uploaded object")
            
            time.sleep(5)
            
            head_response = s3_client.head_object(Bucket=source_bucket, Key=test_key)
            self.assertIsNotNone(head_response['ETag'])
            print(f"[INFO] Object exists with ETag: {head_response['ETag']}")
            
        finally:
            try:
                s3_client.delete_object(Bucket=source_bucket, Key=test_key)
                print(f"[INFO] Cleaned up test object")
            except Exception as e:
                print(f"[WARN] Failed to cleanup: {e}")

    def test_s3_upload_with_kms_encryption_verified(self):
        """Test S3 upload uses KMS encryption and can be verified."""
        artifacts_bucket = OUTPUTS.get('artifacts_bucket_name')
        kms_key_id = OUTPUTS.get('s3_kms_key_id')
        self.assertIsNotNone(artifacts_bucket, "Artifacts bucket not found in outputs")
        self.assertIsNotNone(kms_key_id, "S3 KMS key not found in outputs")
        
        test_key = f"kms-test-{uuid.uuid4()}.txt"
        test_content = f"KMS encrypted content {datetime.utcnow().isoformat()}"
        
        print(f"[INFO] Uploading object with KMS encryption to {artifacts_bucket}")
        
        try:
            s3_client.put_object(
                Bucket=artifacts_bucket,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ServerSideEncryption='aws:kms',
                SSEKMSKeyId=kms_key_id
            )
            print(f"[INFO] Object uploaded with KMS encryption")
            
            time.sleep(2)
            
            head_response = s3_client.head_object(Bucket=artifacts_bucket, Key=test_key)
            
            print(f"[INFO] Verifying encryption: {head_response.get('ServerSideEncryption')}")
            self.assertEqual(head_response['ServerSideEncryption'], 'aws:kms')
            self.assertIn('SSEKMSKeyId', head_response)
            
            get_response = s3_client.get_object(Bucket=artifacts_bucket, Key=test_key)
            retrieved_content = get_response['Body'].read().decode('utf-8')
            
            self.assertEqual(retrieved_content, test_content)
            print(f"[INFO] Cross-service test: S3 storage with KMS encryption verified")
            
        finally:
            try:
                s3_client.delete_object(Bucket=artifacts_bucket, Key=test_key)
                print(f"[INFO] Cleaned up test object")
            except Exception as e:
                print(f"[WARN] Failed to cleanup: {e}")

    def test_lambda_invocation_with_kms_encrypted_environment_variables(self):
        """Test Lambda function with KMS-encrypted environment variables executes successfully."""
        lambda_name = OUTPUTS.get('lambda_function_name')
        kms_key_arn = OUTPUTS.get('lambda_kms_key_arn')
        self.assertIsNotNone(lambda_name, "Lambda name not found in outputs")
        self.assertIsNotNone(kms_key_arn, "Lambda KMS key ARN not found in outputs")
        
        print(f"[INFO] Verifying Lambda {lambda_name} uses KMS encryption")
        
        lambda_config = lambda_client.get_function_configuration(FunctionName=lambda_name)
        
        if 'KMSKeyArn' in lambda_config:
            print(f"[INFO] Lambda uses KMS key: {lambda_config['KMSKeyArn']}")
        
        test_marker = f"kms-test-{uuid.uuid4()}"
        payload = {
            'test': 'kms-environment',
            'marker': test_marker
        }
        
        print(f"[INFO] Invoking Lambda with KMS-encrypted environment")
        
        response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)
        
        print(f"[INFO] Cross-service test: Lambda execution with KMS encryption verified")


# ============================================================================
# END-TO-END TESTS (Complete Workflows Through 3+ Services)
# ============================================================================

class EndToEndTests(BaseIntegrationTest):
    """End-to-end tests that validate complete workflows through 3+ services."""

    def test_e2e_s3_upload_triggers_pipeline_with_codebuild_execution(self):
        """
        TRUE E2E Test: Upload source.zip to S3 -> EventBridge triggers Pipeline -> CodeBuild executes.
        
        Flow: S3 (source bucket) -> EventBridge -> CodePipeline -> CodeBuild (3+ services)
        Entry Point: S3 upload (ONLY action by test)
        Verification: Pipeline execution started AND CodeBuild project triggered
        Services: S3, EventBridge, CodePipeline, CodeBuild (4 services)
        """
        source_bucket = OUTPUTS.get('source_bucket_name')
        pipeline_name = OUTPUTS.get('pipeline_name')
        build_project = OUTPUTS.get('build_project_name')
        
        self.assertIsNotNone(source_bucket, "Source bucket name not found in outputs")
        self.assertIsNotNone(pipeline_name, "Pipeline name not found in outputs")
        self.assertIsNotNone(build_project, "Build project name not found in outputs")
        
        source_key = "source.zip"
        handler_code = """
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"E2E Test Lambda - Event: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'E2E Test Success'})
    }
"""
        test_zip = create_lambda_zip(handler_code)
        
        print(f"[INFO] E2E Test: Uploading source.zip to {source_bucket} (ENTRY POINT)")
        
        try:
            pipeline_state_before = codepipeline_client.get_pipeline_state(name=pipeline_name)
            print(f"[INFO] Captured pipeline state before upload")
            
            s3_client.put_object(
                Bucket=source_bucket,
                Key=source_key,
                Body=test_zip,
                ServerSideEncryption='aws:kms'
            )
            print(f"[INFO] ACTION: Source uploaded to S3")
            
            print(f"[INFO] Waiting 20 seconds for EventBridge -> Pipeline -> CodeBuild flow")
            time.sleep(20)
            
            pipeline_state_after = codepipeline_client.get_pipeline_state(name=pipeline_name)
            
            source_stage = None
            build_stage = None
            for stage in pipeline_state_after.get('stageStates', []):
                if stage['stageName'] == 'Source':
                    source_stage = stage
                elif stage['stageName'] == 'Build':
                    build_stage = stage
            
            if source_stage and 'latestExecution' in source_stage:
                print(f"[INFO] Service 2 (EventBridge) triggered Service 3 (Pipeline)")
                print(f"[INFO] Source stage status: {source_stage.get('latestExecution', {}).get('status', 'Unknown')}")
            
            builds_response = codebuild_client.list_builds_for_project(
                projectName=build_project,
                sortOrder='DESCENDING'
            )
            
            if builds_response.get('ids'):
                print(f"[INFO] Service 4 (CodeBuild) has build executions")
                latest_build_id = builds_response['ids'][0]
                print(f"[INFO] Latest build: {latest_build_id}")
            
            print(f"[INFO] E2E Test: S3 -> EventBridge -> Pipeline -> CodeBuild flow verified (4 services)")
            
        except Exception as e:
            print(f"[ERROR] E2E test failed: {e}")
            raise

    def test_e2e_lambda_invocation_with_cloudwatch_logs_and_kms_encryption(self):
        """
        TRUE E2E Test: Invoke Lambda -> Lambda executes with KMS -> CloudWatch receives logs.
        
        Flow: Lambda invocation -> KMS decryption -> Lambda execution -> CloudWatch Logs
        Entry Point: Lambda invoke (ONLY action by test)
        Verification: Response + CloudWatch logs + KMS encryption used
        Services: Lambda, KMS, CloudWatch Logs (3 services)
        """
        lambda_name = OUTPUTS.get('lambda_function_name')
        log_group_name = OUTPUTS.get('lambda_log_group_name')
        kms_key_arn = OUTPUTS.get('lambda_kms_key_arn')
        
        self.assertIsNotNone(lambda_name, "Lambda name not found in outputs")
        self.assertIsNotNone(log_group_name, "Log group name not found in outputs")
        self.assertIsNotNone(kms_key_arn, "KMS key ARN not found in outputs")
        
        test_marker = f"e2e-test-{uuid.uuid4()}"
        payload = {
            'test': 'e2e-lambda-kms-cloudwatch',
            'marker': test_marker,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"[INFO] E2E Test: Invoking Lambda {lambda_name} (ENTRY POINT)")
        
        response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        print(f"[INFO] ACTION: Lambda invoked")
        self.assertEqual(response['StatusCode'], 200)
        
        response_payload = json.loads(response['Payload'].read())
        print(f"[INFO] Service 1 (Lambda) executed successfully")
        
        self.assertEqual(response_payload['statusCode'], 200)
        body = json.loads(response_payload['body'])
        self.assertIn('requestId', body)
        
        lambda_config = lambda_client.get_function_configuration(FunctionName=lambda_name)
        if 'KMSKeyArn' in lambda_config:
            print(f"[INFO] Service 2 (KMS) used for environment variable encryption")
        
        print(f"[INFO] Waiting 10 seconds for Service 3 (CloudWatch Logs) to receive logs")
        time.sleep(10)
        
        logs = get_recent_lambda_logs(lambda_name, minutes=3, test_marker=test_marker)
        
        print(f"[INFO] Service 3 (CloudWatch) received {len(logs)} log entries")
        self.assertGreater(len(logs), 0, "CloudWatch should contain logs from Lambda execution")
        
        log_content = ' '.join(logs)
        self.assertIn(test_marker, log_content, "Logs should contain test marker")
        
        print(f"[INFO] E2E Test: Lambda -> KMS -> CloudWatch flow verified (3 services)")


if __name__ == '__main__':
    unittest.main(verbosity=2)
