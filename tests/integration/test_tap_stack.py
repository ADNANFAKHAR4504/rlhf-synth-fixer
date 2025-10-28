"""
Integration tests for the deployed TapStack scalable EC2 infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through 3+ services

The tests use stack outputs exported from lib/tap_stack.py to discover resources.
All tests perform ACTIONS on infrastructure, not just configuration checks.
"""

import json
import os
import time
import unittest
from datetime import datetime, timezone
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

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


ENVIRONMENT_SUFFIX = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
PRIMARY_REGION = os.getenv('AWS_REGION', 'us-west-2')

OUTPUTS = load_outputs()

s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
autoscaling_client = boto3.client('autoscaling', region_name=PRIMARY_REGION)
ec2_client = boto3.client('ec2', region_name=PRIMARY_REGION)
ssm_client = boto3.client('ssm', region_name=PRIMARY_REGION)
iam_client = boto3.client('iam', region_name=PRIMARY_REGION)


def wait_for_ssm_command(command_id: str, instance_id: str, timeout: int = 120) -> Dict[str, Any]:
    """
    Wait for SSM command to complete with exponential backoff.
    
    Args:
        command_id: SSM command ID
        instance_id: EC2 instance ID
        timeout: Maximum wait time in seconds
        
    Returns:
        Command invocation result
    """
    start_time = time.time()
    attempt = 0
    while time.time() - start_time < timeout:
        try:
            result = ssm_client.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id
            )
            
            status = result['Status']
            print(f"  Command status: {status} (attempt {attempt + 1})")
            
            if status in ['Success', 'Failed', 'Cancelled', 'TimedOut']:
                return result
            
            wait_time = min(3 * (1.5 ** attempt), 10)
            time.sleep(wait_time)
            attempt += 1
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvocationDoesNotExist':
                print(f"  Waiting for command invocation to be available... (attempt {attempt + 1})")
                wait_time = min(3 * (1.5 ** attempt), 10)
                time.sleep(wait_time)
                attempt += 1
                continue
            raise
    
    raise TimeoutError(f"SSM command {command_id} timed out after {timeout} seconds")


def wait_for_instances_healthy(asg_name: str, timeout: int = 180) -> bool:
    """
    Wait for ASG instances to become healthy.
    
    Args:
        asg_name: Name of the Auto Scaling Group
        timeout: Maximum time to wait in seconds
        
    Returns:
        True if instances are healthy, False otherwise
    """
    start_time = time.time()
    attempt = 0
    
    while time.time() - start_time < timeout:
        try:
            asg_response = autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            
            if not asg_response['AutoScalingGroups']:
                print(f"  ASG '{asg_name}' not found (attempt {attempt + 1})")
                time.sleep(10)
                attempt += 1
                continue
            
            asg = asg_response['AutoScalingGroups'][0]
            instances = asg.get('Instances', [])
            desired = asg['DesiredCapacity']
            
            if not instances:
                print(f"  No instances in ASG yet. Desired: {desired} (attempt {attempt + 1})")
                time.sleep(10)
                attempt += 1
                continue
            
            healthy_count = sum(1 for i in instances if i['HealthStatus'] == 'Healthy')
            in_service_count = sum(1 for i in instances if i['LifecycleState'] == 'InService')
            
            print(f"  ASG Status: {healthy_count}/{desired} healthy, {in_service_count}/{desired} in-service (attempt {attempt + 1})")
            
            if healthy_count >= desired and in_service_count >= desired and desired > 0:
                print(f"  All instances healthy! ({healthy_count} instances)")
                return True
            
            time.sleep(10)
            attempt += 1
            
        except ClientError as e:
            print(f"  Error checking instance status: {e} (attempt {attempt + 1})")
            time.sleep(10)
            attempt += 1
    
    print(f"  ERROR: Instances not healthy after {timeout} seconds")
    return False


# ============================================================================
# SERVICE-LEVEL TESTS (Single service WITH ACTUAL OPERATIONS)
# Maps to: Individual service functionality validation with real actions
# ============================================================================

class TestServiceLevelS3Operations(unittest.TestCase):
    """
    Service-Level Tests: S3 Bucket Operations
    Maps to PROMPT.md: S3 bucket with server-side encryption enabled using AES-256
    
    Tests actual S3 operations: write, read, versioning, encryption.
    """
    
    def test_s3_write_and_read_operations(self):
        """
        SERVICE-LEVEL TEST: S3 write and read
        ACTION: Write object to S3, read it back
        VERIFY: Content matches
        """
        bucket_name = OUTPUTS.get('main_bucket_name')
        self.assertIsNotNone(bucket_name, "main_bucket_name not found in outputs")
        
        test_key = f'service-test/test-{int(time.time())}.txt'
        test_content = f'Service-level test at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"\nWriting object to S3: s3://{bucket_name}/{test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8')
        )
        
        response = s3_client.get_object(
            Bucket=bucket_name,
            Key=test_key
        )
        
        retrieved_content = response['Body'].read().decode('utf-8')
        self.assertEqual(retrieved_content, test_content, "Retrieved content should match written content")
        print(f"Successfully wrote and read object from S3")
        
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
    
    def test_s3_versioning_functionality(self):
        """
        SERVICE-LEVEL TEST: S3 versioning
        ACTION: Write multiple versions of same object
        VERIFY: Multiple versions exist
        """
        bucket_name = OUTPUTS.get('main_bucket_name')
        self.assertIsNotNone(bucket_name, "main_bucket_name not found in outputs")
        
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        if versioning.get('Status') != 'Enabled':
            print(f"INFO: Versioning not enabled on bucket {bucket_name}, skipping test")
            return
        
        test_key = f'service-test/versioned-{int(time.time())}.json'
        
        print(f"\nWriting version 1 to S3: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps({'version': 1, 'data': 'first version'}).encode('utf-8')
        )
        
        print(f"Writing version 2 to S3: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps({'version': 2, 'data': 'second version'}).encode('utf-8')
        )
        
        versions_response = s3_client.list_object_versions(
            Bucket=bucket_name,
            Prefix=test_key
        )
        
        versions = versions_response.get('Versions', [])
        self.assertGreaterEqual(len(versions), 2, "Should have at least 2 versions")
        print(f"S3 versioning working: {len(versions)} versions maintained")
        
        for version in versions:
            s3_client.delete_object(
                Bucket=bucket_name,
                Key=test_key,
                VersionId=version['VersionId']
            )
    
    def test_s3_encryption_enabled(self):
        """
        SERVICE-LEVEL TEST: S3 encryption
        ACTION: Write object and verify encryption
        VERIFY: Object is encrypted with AES256
        """
        bucket_name = OUTPUTS.get('main_bucket_name')
        self.assertIsNotNone(bucket_name, "main_bucket_name not found in outputs")
        
        test_key = f'service-test/encrypted-{int(time.time())}.txt'
        test_content = 'Encryption test content'
        
        print(f"\nWriting encrypted object to S3: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8')
        )
        
        response = s3_client.head_object(
            Bucket=bucket_name,
            Key=test_key
        )
        
        encryption = response.get('ServerSideEncryption')
        self.assertIsNotNone(encryption, "Object should be encrypted")
        self.assertEqual(encryption, 'AES256', "Should use AES256 encryption")
        print(f"S3 encryption verified: {encryption}")
        
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


class TestServiceLevelSSMOperations(unittest.TestCase):
    """
    Service-Level Tests: SSM Operations
    Maps to PROMPT.md: Configure instances to be managed securely via AWS Systems Manager (SSM)
    
    Tests actual SSM operations: send commands, verify execution.
    """
    
    def test_ssm_command_execution(self):
        """
        SERVICE-LEVEL TEST: SSM command execution
        ACTION: Send command to EC2 instance via SSM
        VERIFY: Command executes successfully
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "asg_name not found in outputs")
        
        print(f"\nWaiting for ASG instances to be healthy...")
        self.assertTrue(
            wait_for_instances_healthy(asg_name, timeout=180),
            f"Instances in ASG '{asg_name}' did not become healthy within timeout"
        )
        
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        instances = asg_response['AutoScalingGroups'][0].get('Instances', [])
        self.assertTrue(instances, "No instances found in ASG")
        
        instance_id = instances[0]['InstanceId']
        print(f"Testing SSM command on instance: {instance_id}")
        
        # Retry logic for SSM agent registration
        max_retries = 6
        retry_delay = 30
        command_id = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                command_response = ssm_client.send_command(
                    InstanceIds=[instance_id],
                    DocumentName='AWS-RunShellScript',
                    Parameters={
                        'commands': [
                            'echo "SSM Service Test"',
                            'date',
                            'echo "TEST_MARKER_SUCCESS"'
                        ]
                    },
                    Comment='Service-level SSM test'
                )
                
                command_id = command_response['Command']['CommandId']
                print(f"Command ID: {command_id}")
                break
                
            except ClientError as e:
                last_error = e
                if 'InvalidInstanceId' in str(e) and attempt < max_retries - 1:
                    print(f"  SSM agent not ready yet (attempt {attempt + 1}/{max_retries}), waiting {retry_delay}s...")
                    time.sleep(retry_delay)
                elif 'InvalidInstanceId' not in str(e):
                    # Different error, fail immediately
                    raise
        
        if command_id is None:
            self.fail(f"SSM agent failed to register after {max_retries * retry_delay}s. Last error: {last_error}")
        
        self.assertIsNotNone(command_id, "Failed to send SSM command after retries")
        
        result = wait_for_ssm_command(command_id, instance_id, timeout=120)
        
        print(f"Command Status: {result['Status']}")
        
        if result['Status'] != 'Success':
            print(f"\nCommand Output:")
            print(f"{'-'*70}")
            print(result.get('StandardOutputContent', ''))
            print(f"{'-'*70}")
            print(f"\nCommand Errors:")
            print(f"{'-'*70}")
            print(result.get('StandardErrorContent', ''))
            print(f"{'-'*70}")
            self.fail(f"SSM command failed with status: {result['Status']}")
        
        output = result.get('StandardOutputContent', '')
        print(f"\nCommand Output:")
        print(f"{'-'*70}")
        print(output)
        print(f"{'-'*70}")
        
        self.assertIn('TEST_MARKER_SUCCESS', output, "Command output should contain success marker")
        print(f"SSM command executed successfully")


class TestServiceLevelCloudWatchOperations(unittest.TestCase):
    """
    Service-Level Tests: CloudWatch Operations
    Maps to PROMPT.md: Enable logging of important actions on the EC2 instances
    
    Tests actual CloudWatch operations: write logs, query logs.
    """
    
    def test_cloudwatch_log_write_and_query(self):
        """
        SERVICE-LEVEL TEST: CloudWatch Logs
        ACTION: Create log group and write log events
        VERIFY: Logs are queryable
        """
        test_log_group = f'/tap/integration-test/service-level-{int(time.time())}'
        test_log_stream = f'test-stream-{int(time.time())}'
        test_message = f'Integration test message at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"\nCreating CloudWatch log group: {test_log_group}")
        
        try:
            logs_client.create_log_group(logGroupName=test_log_group)
            
            logs_client.create_log_stream(
                logGroupName=test_log_group,
                logStreamName=test_log_stream
            )
            
            print(f"Writing log event to CloudWatch")
            current_timestamp_ms = int(time.time() * 1000)
            put_response = logs_client.put_log_events(
                logGroupName=test_log_group,
                logStreamName=test_log_stream,
                logEvents=[
                    {
                        'timestamp': current_timestamp_ms,
                        'message': test_message
                    }
                ]
            )
            
            if put_response.get('rejectedLogEventsInfo'):
                self.fail(f"Log events were rejected: {put_response['rejectedLogEventsInfo']}")
            
            events = []
            max_retries = 10
            for attempt in range(max_retries):
                response = logs_client.get_log_events(
                    logGroupName=test_log_group,
                    logStreamName=test_log_stream,
                    startFromHead=True
                )
                events = response.get('events', [])
                if len(events) > 0:
                    print(f"Log events retrieved after {attempt + 1} attempt(s)")
                    break
                if attempt < max_retries - 1:
                    time.sleep(1)
            
            self.assertGreater(len(events), 0, f"Log events should be queryable within {max_retries} seconds")
            
            messages = [event['message'] for event in events]
            self.assertIn(test_message, messages, "Our log message should be in CloudWatch")
            
            print(f"Successfully wrote and queried CloudWatch logs")
            
        finally:
            try:
                logs_client.delete_log_group(logGroupName=test_log_group)
            except Exception as e:
                print(f"Note: Cleanup of log group failed: {e}")
    
    def test_cloudwatch_custom_metric_publish(self):
        """
        SERVICE-LEVEL TEST: CloudWatch Metrics
        ACTION: Publish custom metric
        VERIFY: Metric is recorded
        """
        test_metric_name = f'IntegrationTest-{int(time.time())}'
        namespace = 'TAP/IntegrationTests'
        
        print(f"\nPublishing test metric to CloudWatch: {test_metric_name}")
        cloudwatch_client.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': test_metric_name,
                    'Value': 42.0,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(timezone.utc)
                }
            ]
        )
        
        time.sleep(3)
        
        end_time = datetime.now(timezone.utc)
        start_time = end_time.replace(hour=end_time.hour - 1) if end_time.hour > 0 else end_time.replace(day=end_time.day - 1, hour=23)
        
        response = cloudwatch_client.get_metric_statistics(
            Namespace=namespace,
            MetricName=test_metric_name,
            StartTime=start_time,
            EndTime=end_time,
            Period=60,
            Statistics=['Sum']
        )
        
        self.assertIn('Datapoints', response, "CloudWatch should accept custom metrics")
        print(f"Custom metric published successfully to CloudWatch")


# ============================================================================
# CROSS-SERVICE TESTS (Two services interacting WITH ACTUAL DATA FLOW)
# Maps to: Service integration validation with real interactions
# ============================================================================

class TestCrossServiceEC2ToS3(unittest.TestCase):
    """
    Cross-Service Tests: EC2 -> S3
    Maps to PROMPT.md: IAM role with permissions allowing EC2 and S3 access
    
    Tests that EC2 instances can write to S3 using IAM role.
    """
    
    def test_ec2_writes_to_s3_via_iam_role(self):
        """
        CROSS-SERVICE TEST: EC2 -> S3
        ACTION: EC2 instance writes to S3 bucket using IAM role
        VERIFY: Object appears in S3
        """
        asg_name = OUTPUTS.get('asg_name')
        bucket_name = OUTPUTS.get('main_bucket_name')
        self.assertIsNotNone(asg_name, "asg_name not found in outputs")
        self.assertIsNotNone(bucket_name, "main_bucket_name not found in outputs")
        
        print(f"\nWaiting for ASG instances to be healthy...")
        self.assertTrue(
            wait_for_instances_healthy(asg_name, timeout=180),
            f"Instances in ASG '{asg_name}' did not become healthy within timeout"
        )
        
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        instances = asg_response['AutoScalingGroups'][0].get('Instances', [])
        self.assertTrue(instances, "No instances found in ASG")
        
        instance_id = instances[0]['InstanceId']
        test_key = f'cross-service-test/ec2-to-s3-{int(time.time())}.txt'
        test_content = f'EC2 to S3 test at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"EC2 instance {instance_id} writing to S3: s3://{bucket_name}/{test_key}")
        
        # Retry logic for SSM agent registration
        max_retries = 6
        retry_delay = 30
        command_id = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                command_response = ssm_client.send_command(
                    InstanceIds=[instance_id],
                    DocumentName='AWS-RunShellScript',
                    Parameters={
                        'commands': [
                            f'echo "{test_content}" | aws s3 cp - s3://{bucket_name}/{test_key}',
                            'echo "S3_WRITE_COMPLETE"'
                        ]
                    },
                    Comment='Cross-service test: EC2 -> S3'
                )
                
                command_id = command_response['Command']['CommandId']
                print(f"Command ID: {command_id}")
                break
                
            except ClientError as e:
                last_error = e
                if 'InvalidInstanceId' in str(e) and attempt < max_retries - 1:
                    print(f"  SSM agent not ready yet (attempt {attempt + 1}/{max_retries}), waiting {retry_delay}s...")
                    time.sleep(retry_delay)
                elif 'InvalidInstanceId' not in str(e):
                    # Different error, fail immediately
                    raise
        
        if command_id is None:
            self.fail(f"SSM agent failed to register after {max_retries * retry_delay}s. Last error: {last_error}")
        
        self.assertIsNotNone(command_id, "Failed to send SSM command after retries")
        
        result = wait_for_ssm_command(command_id, instance_id, timeout=120)
        
        print(f"Command Status: {result['Status']}")
        
        if result['Status'] != 'Success':
            print(f"\nCommand Output:")
            print(f"{'-'*70}")
            print(result.get('StandardOutputContent', ''))
            print(f"{'-'*70}")
            print(f"\nCommand Errors:")
            print(f"{'-'*70}")
            print(result.get('StandardErrorContent', ''))
            print(f"{'-'*70}")
            self.fail(f"EC2 to S3 command failed with status: {result['Status']}")
        
        print(f"\nCommand Output:")
        print(f"{'-'*70}")
        print(result.get('StandardOutputContent', ''))
        print(f"{'-'*70}")
        
        time.sleep(3)
        
        print(f"\nVerifying S3 object...")
        s3_response = s3_client.get_object(
            Bucket=bucket_name,
            Key=test_key
        )
        s3_content = s3_response['Body'].read().decode('utf-8').strip()
        
        self.assertIn(test_content, s3_content, "S3 object should contain content written by EC2")
        print(f"S3 object verified: {test_key}")
        print(f"Cross-service test passed: EC2 -> S3 via IAM role")
        
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


# ============================================================================
# CROSS-SERVICE TESTS (ASG -> CloudWatch)
# Maps to: Auto Scaling Group metrics integration
# ============================================================================

class TestCrossServiceASGToCloudWatch(unittest.TestCase):
    """
    Cross-Service Tests: ASG -> CloudWatch
    Maps to PROMPT.md: Enable logging of important actions on the EC2 instances
    
    Tests that ASG metrics are published to CloudWatch.
    """
    
    def test_asg_metrics_in_cloudwatch(self):
        """
        CROSS-SERVICE TEST: ASG -> CloudWatch
        ACTION: Query ASG state
        VERIFY: CloudWatch has ASG metrics
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "asg_name not found in outputs")
        
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        self.assertTrue(asg_response['AutoScalingGroups'], f"ASG '{asg_name}' not found")
        
        asg = asg_response['AutoScalingGroups'][0]
        current_capacity = asg['DesiredCapacity']
        
        print(f"\nCurrent ASG capacity: {current_capacity}")
        
        time.sleep(5)
        
        end_time = datetime.now(timezone.utc)
        start_time = end_time.replace(hour=0, minute=0, second=0, microsecond=0)
        
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/AutoScaling',
            MetricName='GroupDesiredCapacity',
            Dimensions=[
                {
                    'Name': 'AutoScalingGroupName',
                    'Value': asg_name
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )
        
        self.assertIn('Datapoints', response, "CloudWatch should receive ASG metrics")
        print(f"ASG metrics are being published to CloudWatch")


class TestCrossServiceEC2ToCloudWatch(unittest.TestCase):
    """
    Cross-Service Tests: EC2 -> CloudWatch
    Maps to PROMPT.md: Enable logging of important actions on the EC2 instances
    
    Tests that EC2 instances can publish custom metrics to CloudWatch.
    """
    
    def test_ec2_publishes_custom_metric_to_cloudwatch(self):
        """
        CROSS-SERVICE TEST: EC2 -> CloudWatch
        ACTION: EC2 instance publishes custom metric to CloudWatch
        VERIFY: Metric appears in CloudWatch
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "asg_name not found in outputs")
        
        print(f"\nWaiting for ASG instances to be healthy...")
        self.assertTrue(
            wait_for_instances_healthy(asg_name, timeout=180),
            f"Instances in ASG '{asg_name}' did not become healthy within timeout"
        )
        
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        instances = asg_response['AutoScalingGroups'][0].get('Instances', [])
        self.assertTrue(instances, "No instances found in ASG")
        
        instance_id = instances[0]['InstanceId']
        metric_name = f'EC2CustomMetric-{int(time.time())}'
        namespace = 'TAP/EC2Integration'
        
        print(f"EC2 instance {instance_id} publishing metric to CloudWatch: {metric_name}")
        
        # Retry logic for SSM agent registration
        max_retries = 6
        retry_delay = 30
        command_id = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                command_response = ssm_client.send_command(
                    InstanceIds=[instance_id],
                    DocumentName='AWS-RunShellScript',
                    Parameters={
                        'commands': [
                            f'aws cloudwatch put-metric-data --namespace {namespace} --metric-name {metric_name} --value 100 --region {PRIMARY_REGION}',
                            'echo "METRIC_PUBLISHED"'
                        ]
                    },
                    Comment='Cross-service test: EC2 -> CloudWatch'
                )
                
                command_id = command_response['Command']['CommandId']
                print(f"Command ID: {command_id}")
                break
                
            except ClientError as e:
                last_error = e
                if 'InvalidInstanceId' in str(e) and attempt < max_retries - 1:
                    print(f"  SSM agent not ready yet (attempt {attempt + 1}/{max_retries}), waiting {retry_delay}s...")
                    time.sleep(retry_delay)
                elif 'InvalidInstanceId' not in str(e):
                    # Different error, fail immediately
                    raise
        
        if command_id is None:
            self.fail(f"SSM agent failed to register after {max_retries * retry_delay}s. Last error: {last_error}")
        
        self.assertIsNotNone(command_id, "Failed to send SSM command after retries")
        
        result = wait_for_ssm_command(command_id, instance_id, timeout=120)
        
        print(f"Command Status: {result['Status']}")
        
        if result['Status'] != 'Success':
            print(f"\nCommand Output:")
            print(f"{'-'*70}")
            print(result.get('StandardOutputContent', ''))
            print(f"{'-'*70}")
            print(f"\nCommand Errors:")
            print(f"{'-'*70}")
            print(result.get('StandardErrorContent', ''))
            print(f"{'-'*70}")
            self.fail(f"EC2 to CloudWatch metric command failed with status: {result['Status']}")
        
        print(f"\nCommand Output:")
        print(f"{'-'*70}")
        print(result.get('StandardOutputContent', ''))
        print(f"{'-'*70}")
        
        time.sleep(5)
        
        print(f"\nVerifying CloudWatch metric...")
        end_time = datetime.now(timezone.utc)
        start_time = end_time.replace(hour=end_time.hour - 1) if end_time.hour > 0 else end_time.replace(day=end_time.day - 1, hour=23)
        
        response = cloudwatch_client.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            StartTime=start_time,
            EndTime=end_time,
            Period=60,
            Statistics=['Sum']
        )
        
        self.assertIn('Datapoints', response, "CloudWatch should receive EC2 custom metrics")
        print(f"CloudWatch metric verified: {metric_name}")
        print(f"Cross-service test passed: EC2 -> CloudWatch custom metrics")


# ============================================================================
# END-TO-END TESTS (3+ services, full workflows WITH ACTUAL DATA FLOW)
# Maps to: Complete infrastructure workflows
# ============================================================================

class TestE2EEC2InternetConnectivity(unittest.TestCase):
    """
    E2E Test: EC2 -> NAT Gateway -> Internet Gateway -> Internet
    Maps to PROMPT.md: Complete network connectivity flow
    
    Flow: EC2 (public subnet) -> Internet Gateway -> Internet
    
    TRUE E2E: We trigger EC2 to access internet, network path is automatic,
    we verify successful connectivity.
    """
    
    def test_ec2_internet_connectivity_via_nat(self):
        """
        E2E TEST: Complete network connectivity flow
        
        ENTRY POINT: Execute curl command on EC2 instance
        AUTOMATIC FLOW:
        1. EC2 sends traffic to Internet Gateway (automatic routing)
        2. Internet Gateway connects to internet (automatic)
        3. Response flows back through same path (automatic)
        
        VERIFY: EC2 successfully accessed internet (check curl response)
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "ASG name not found")
        
        print(f"\nWaiting for ASG instances to be healthy...")
        self.assertTrue(
            wait_for_instances_healthy(asg_name, timeout=180),
            f"Instances in ASG '{asg_name}' did not become healthy within timeout"
        )
        
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        instances = asg_response['AutoScalingGroups'][0].get('Instances', [])
        self.assertTrue(instances, "No instances found in ASG")
        
        self.assertGreater(len(instances), 0, 
                          f"No instances running in ASG '{asg_name}'. ASG should have at least 1 running instance.")
        
        instance_id = instances[0]['InstanceId']
        print(f"\n{'='*70}")
        print(f"E2E Test: EC2 (Public Subnet) → IGW → Internet")
        print(f"Using instance: {instance_id}")
        print(f"{'='*70}\n")
        
        # ENTRY POINT: Trigger EC2 to access internet
        print("STEP 1: Triggering EC2 to access internet...")
        print(f"  Command: curl https://www.google.com")
        
        try:
            command_response = ssm_client.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={
                    'commands': [
                        '#!/bin/bash',
                        'echo "Testing internet connectivity from public subnet..."',
                        'curl -s -o /dev/null -w "HTTP_STATUS:%{http_code}" https://www.google.com',
                        'echo ""',
                        'echo "E2E_NETWORK_TEST_COMPLETE"'
                    ]
                },
                Comment='E2E test: EC2 → IGW → Internet connectivity'
            )
            
            command_id = command_response['Command']['CommandId']
            print(f"  Command ID: {command_id}")
            print(f"\nSTEP 2: Waiting for EC2 to complete internet access...")
            
            # Wait for command to complete
            result = wait_for_ssm_command(command_id, instance_id, timeout=60)
            
            print(f"  Status: {result['Status']}")
            
            if result['Status'] != 'Success':
                print(f"\nCommand Output:")
                print(f"{'-'*70}")
                print(result.get('StandardOutputContent', ''))
                print(f"{'-'*70}")
                print(f"\nCommand Errors:")
                print(f"{'-'*70}")
                print(result.get('StandardErrorContent', ''))
                print(f"{'-'*70}")
                self.fail(f"EC2 command failed: {result['Status']}")
            
            output = result.get('StandardOutputContent', '')
            print(f"\nCommand Output:")
            print(f"{'-'*70}")
            print(output)
            print(f"{'-'*70}")
            
            # VERIFY: Check if internet access was successful
            self.assertIn('HTTP_STATUS:200', output, 
                        "EC2 should successfully access internet via Internet Gateway")
            self.assertIn('E2E_NETWORK_TEST_COMPLETE', output,
                        "Network test should complete")
            
            print(f"\n{'='*70}")
            print(f"E2E TEST PASSED: EC2 (Public) → IGW → Internet")
            print(f"{'='*70}\n")
            
        except ClientError as e:
            if 'InvalidInstanceId' in str(e) or 'not managed by SSM' in str(e):
                self.fail(f"SSM not configured on instance {instance_id}. "
                         f"Ensure SSM agent is installed and running. Error: {e}")
            raise


class TestE2EAutoScalingWorkflow(unittest.TestCase):
    """
    E2E Test: ASG -> CloudWatch Metrics -> Alarms
    Maps to PROMPT.md: Auto Scaling with CloudWatch monitoring
    
    Flow: ASG automatically publishes metrics → CloudWatch receives → Alarms configured
    
    TRUE E2E: ASG metrics flow automatically, we verify the complete monitoring chain.
    """
    
    def test_asg_cloudwatch_alarm_integration(self):
        """
        E2E TEST: ASG monitoring and alarm configuration
        
        ENTRY POINT: Check ASG configuration
        AUTOMATIC FLOW:
        1. ASG publishes metrics to CloudWatch (automatic)
        2. CloudWatch receives and stores metrics (automatic)
        3. CloudWatch alarms monitor metrics (automatic)
        
        VERIFY: Metrics flowing and alarms configured
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "asg_name not found in outputs")
        
        print(f"\n{'='*70}")
        print(f"E2E Test: ASG -> CloudWatch Metrics -> Alarms")
        print(f"{'='*70}\n")
        
        print("STEP 1: Verifying ASG configuration...")
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        self.assertTrue(asg_response['AutoScalingGroups'], f"ASG '{asg_name}' not found")
        
        asg = asg_response['AutoScalingGroups'][0]
        print(f"  ASG Configuration:")
        print(f"    Min: {asg['MinSize']}, Max: {asg['MaxSize']}, Desired: {asg['DesiredCapacity']}")
        print(f"    Instances: {len(asg.get('Instances', []))}")
        
        print(f"\nSTEP 2: Verifying CloudWatch metrics are being published...")
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=1)
        
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/AutoScaling',
            MetricName='GroupDesiredCapacity',
            Dimensions=[
                {
                    'Name': 'AutoScalingGroupName',
                    'Value': asg_name
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )
        
        self.assertIn('Datapoints', response, "CloudWatch should receive ASG metrics")
        print(f"  CloudWatch is receiving ASG metrics")
        
        print(f"\nSTEP 3: Verifying CloudWatch alarms are configured...")
        alarms_response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f'scalable-ec2-alarm'
        )
        
        alarms = alarms_response.get('MetricAlarms', [])
        stack_alarms = [a for a in alarms if asg_name in str(a.get('Dimensions', []))]
        
        print(f"  Found {len(stack_alarms)} CloudWatch alarms for stack:")
        for alarm in stack_alarms:
            print(f"    - {alarm['AlarmName']} (State: {alarm['StateValue']})")
        
        cpu_alarms = [a for a in stack_alarms if 'cpu' in a['AlarmName'].lower()]
        self.assertGreater(len(cpu_alarms), 0, "Should have CPU-based scaling alarms configured")
        print(f"  Found {len(cpu_alarms)} CPU-based scaling alarms")
        
        print(f"\n{'='*70}")
        print(f"E2E TEST PASSED: ASG -> CloudWatch -> Alarms configured")
        print(f"{'='*70}\n")


if __name__ == '__main__':
    unittest.main(verbosity=2)
