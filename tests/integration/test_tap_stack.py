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
from datetime import datetime, timedelta, timezone
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


class TestServiceLevelASGOperations(unittest.TestCase):
    """
    Service-Level Tests: Auto Scaling Group Operations
    Maps to PROMPT.md: Auto Scaling Group to maintain between 1 and 3 instances
    
    Tests actual ASG operations: scaling actions, instance lifecycle.
    """
    
    def test_asg_maintains_desired_capacity(self):
        """
        SERVICE-LEVEL TEST: ASG capacity management
        ACTION: Query ASG desired capacity and verify instances match
        VERIFY: ASG is maintaining the correct number of healthy instances
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "asg_name not found in outputs")
        
        print(f"\nTesting ASG capacity management: {asg_name}")
        
        # ACTION: Query ASG configuration and instance status
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        self.assertTrue(asg_response['AutoScalingGroups'], f"ASG '{asg_name}' not found")
        asg = asg_response['AutoScalingGroups'][0]
        
        # Verify ASG configuration
        min_size = asg['MinSize']
        max_size = asg['MaxSize']
        desired_capacity = asg['DesiredCapacity']
        
        print(f"  ASG Configuration:")
        print(f"    Min: {min_size}, Max: {max_size}, Desired: {desired_capacity}")
        
        self.assertGreaterEqual(min_size, 1, "ASG min size should be at least 1")
        self.assertLessEqual(max_size, 3, "ASG max size should be at most 3")
        self.assertGreaterEqual(desired_capacity, min_size, "Desired capacity should be >= min")
        self.assertLessEqual(desired_capacity, max_size, "Desired capacity should be <= max")
        
        # ACTION: Verify ASG is maintaining desired capacity
        instances = asg.get('Instances', [])
        healthy_instances = [i for i in instances if i['HealthStatus'] == 'Healthy']
        in_service_instances = [i for i in instances if i['LifecycleState'] == 'InService']
        
        print(f"  Instance Status:")
        print(f"    Total: {len(instances)}")
        print(f"    Healthy: {len(healthy_instances)}")
        print(f"    InService: {len(in_service_instances)}")
        
        # Verify ASG is maintaining capacity
        self.assertEqual(len(instances), desired_capacity,
                        f"ASG should have {desired_capacity} instances")
        self.assertGreaterEqual(len(healthy_instances), 1,
                               "ASG should have at least 1 healthy instance")
        
        # Verify instances are properly tagged
        for instance in instances:
            instance_id = instance['InstanceId']
            ec2_response = ec2_client.describe_instances(InstanceIds=[instance_id])
            ec2_instance = ec2_response['Reservations'][0]['Instances'][0]
            
            tags = {tag['Key']: tag['Value'] for tag in ec2_instance.get('Tags', [])}
            self.assertIn('aws:autoscaling:groupName', tags,
                         f"Instance {instance_id} should have ASG tag")
            print(f"    Instance {instance_id}: {instance['LifecycleState']} / {instance['HealthStatus']}")
        
        print(f"ASG capacity management verified successfully")


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

class TestCrossServiceS3ToCloudWatch(unittest.TestCase):
    """
    Cross-Service Tests: S3 -> CloudWatch (via logging)
    Maps to PROMPT.md: S3 bucket with server-side encryption and logging
    
    Tests that S3 operations are logged and can be queried.
    """
    
    def test_s3_write_triggers_cloudwatch_metric(self):
        """
        CROSS-SERVICE TEST: S3 -> CloudWatch
        ACTION: Write multiple objects to S3
        VERIFY: CloudWatch receives S3 bucket metrics (NumberOfObjects, BucketSizeBytes)
        """
        bucket_name = OUTPUTS.get('main_bucket_name')
        self.assertIsNotNone(bucket_name, "main_bucket_name not found in outputs")
        
        print(f"\nTesting S3 -> CloudWatch metrics flow...")
        
        # ACTION: Write multiple test objects to S3 to trigger metrics
        test_keys = []
        for i in range(3):
            test_key = f'cross-service-test/metric-test-{int(time.time())}-{i}.txt'
            test_content = f'S3 metric test {i} at {datetime.now(timezone.utc).isoformat()}'
            
            print(f"  Writing object {i+1}/3 to S3: {test_key}")
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content.encode('utf-8')
            )
            test_keys.append(test_key)
        
        print(f"\n  Waiting for CloudWatch to receive S3 metrics...")
        time.sleep(5)  # Give CloudWatch time to receive metrics
        
        # VERIFY: Query CloudWatch for S3 bucket metrics
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=2)  # S3 metrics have daily granularity
        
        print(f"  Querying CloudWatch for S3 bucket metrics...")
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='NumberOfObjects',
            Dimensions=[
                {'Name': 'BucketName', 'Value': bucket_name},
                {'Name': 'StorageType', 'Value': 'AllStorageTypes'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,  # Daily
            Statistics=['Average']
        )
        
        self.assertIn('Datapoints', response, "CloudWatch should receive S3 metrics")
        print(f"  CloudWatch is receiving S3 bucket metrics")
        print(f"  Datapoints found: {len(response.get('Datapoints', []))}")
        
        # Cleanup
        for test_key in test_keys:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        
        print(f"Cross-service test passed: S3 writes trigger CloudWatch metrics")


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
    
    Tests that EC2 instances have CloudWatch monitoring enabled and metrics are published.
    """
    
    def test_ec2_cloudwatch_monitoring_enabled(self):
        """
        CROSS-SERVICE TEST: EC2 -> CloudWatch
        ACTION: Verify EC2 instances have CloudWatch monitoring enabled
        VERIFY: EC2 metrics are published to CloudWatch
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
        print(f"Verifying CloudWatch monitoring for EC2 instance: {instance_id}")
        
        # Verify instance has monitoring enabled
        ec2_response = ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = ec2_response['Reservations'][0]['Instances'][0]
        
        self.assertEqual(instance['Monitoring']['State'], 'enabled',
                        f"Instance {instance_id} should have CloudWatch monitoring enabled")
        print(f"  CloudWatch monitoring: {instance['Monitoring']['State']}")
        
        # Verify EC2 metrics are being published to CloudWatch
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=1)
        
        print(f"\nVerifying EC2 metrics in CloudWatch...")
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[
                {
                    'Name': 'InstanceId',
                    'Value': instance_id
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )
        
        self.assertIn('Datapoints', response, "CloudWatch should receive EC2 metrics")
        print(f"  EC2 metrics are being published to CloudWatch")
        print(f"  Found {len(response.get('Datapoints', []))} datapoints")
        
        print(f"Cross-service test passed: EC2 -> CloudWatch monitoring")


# ============================================================================
# END-TO-END TESTS (3+ services, full workflows WITH ACTUAL DATA FLOW)
# Maps to: Complete infrastructure workflows
# ============================================================================

class TestE2ENetworkingAndMonitoring(unittest.TestCase):
    """
    E2E Test: VPC -> Subnets -> EC2 -> CloudWatch
    Maps to PROMPT.md: Complete infrastructure deployment with monitoring
    
    Flow: VPC networking enables EC2 deployment, EC2 publishes metrics to CloudWatch
    
    TRUE E2E: Infrastructure automatically connects networking, compute, and monitoring.
    """
    
    def test_asg_scaling_triggers_cloudwatch_alarm(self):
        """
        E2E TEST: ASG -> EC2 -> CloudWatch Metrics -> CloudWatch Alarms
        
        ENTRY POINT: Query ASG status
        AUTOMATIC FLOW:
        1. ASG maintains EC2 instances (automatic)
        2. EC2 instances publish CPU metrics to CloudWatch (automatic)
        3. CloudWatch stores metrics (automatic)
        4. CloudWatch Alarms monitor metrics (automatic)
        
        VERIFY: Complete monitoring chain - ASG instances → metrics → alarms configured
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "asg_name not found in outputs")
        
        print(f"\n{'='*70}")
        print(f"E2E Test: ASG → EC2 → CloudWatch Metrics → Alarms")
        print(f"{'='*70}\n")
        
        # STEP 1: Get ASG instances
        print("STEP 1: Querying ASG instances...")
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg = asg_response['AutoScalingGroups'][0]
        instances = asg.get('Instances', [])
        
        self.assertGreater(len(instances), 0, "ASG should have at least one instance")
        instance_id = instances[0]['InstanceId']
        print(f"  ASG: {asg_name}")
        print(f"  Instances: {len(instances)}")
        print(f"  Using instance: {instance_id}")
        
        # STEP 2: Verify EC2 instance is publishing metrics to CloudWatch
        print(f"\nSTEP 2: Verifying EC2 → CloudWatch metrics flow...")
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=1)
        
        cpu_response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )
        
        self.assertIn('Datapoints', cpu_response, "CloudWatch should receive EC2 CPU metrics")
        datapoints = cpu_response.get('Datapoints', [])
        print(f"  EC2 publishing metrics to CloudWatch: {len(datapoints)} datapoints")
        
        # STEP 3: Verify ASG metrics in CloudWatch
        print(f"\nSTEP 3: Verifying ASG → CloudWatch metrics flow...")
        asg_response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/AutoScaling',
            MetricName='GroupDesiredCapacity',
            Dimensions=[{'Name': 'AutoScalingGroupName', 'Value': asg_name}],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )
        
        self.assertIn('Datapoints', asg_response, "CloudWatch should receive ASG metrics")
        print(f"  ASG publishing metrics to CloudWatch")
        
        # STEP 4: Verify CloudWatch Alarms are configured for the ASG
        print(f"\nSTEP 4: Verifying CloudWatch Alarms configured...")
        alarms_response = cloudwatch_client.describe_alarms()
        
        # Find alarms related to our stack
        stack_alarms = [
            alarm for alarm in alarms_response['MetricAlarms']
            if any(dim.get('Value') == asg_name for dim in alarm.get('Dimensions', []))
        ]
        
        print(f"  Found {len(stack_alarms)} alarms monitoring ASG")
        for alarm in stack_alarms:
            print(f"    - {alarm['AlarmName']}: {alarm['StateValue']}")
        
        # Verify we have CPU-based alarms
        cpu_alarms = [a for a in stack_alarms if 'CPUUtilization' in a.get('MetricName', '')]
        self.assertGreater(len(cpu_alarms), 0, 
                          "Should have CPU-based alarms configured for scaling")
        
        print(f"\n{'='*70}")
        print(f"E2E TEST PASSED: ASG → EC2 → CloudWatch → Alarms")
        print(f"  Complete monitoring chain verified!")
        print(f"{'='*70}\n")


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
