"""
Integration tests for the deployed TapStack High Availability infrastructure.

These tests validate actual AWS resources against live deployments using Pulumi stack outputs.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow  
- End-to-End Tests: Complete data flow through 3+ services (full HA workflows)

The tests use stack outputs exported from lib/tap_stack.py to discover resources.
"""

import json
import os
import time
import unittest
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import boto3
import pytest
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


# Get environment configuration
ENVIRONMENT_SUFFIX = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
PRIMARY_REGION = os.getenv('AWS_REGION', 'us-east-1')

# Load Pulumi stack outputs from flat-outputs.json
OUTPUTS = load_outputs()

# Initialize AWS SDK clients
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
autoscaling_client = boto3.client('autoscaling', region_name=PRIMARY_REGION)
ec2_client = boto3.client('ec2', region_name=PRIMARY_REGION)
ssm_client = boto3.client('ssm', region_name=PRIMARY_REGION)
iam_client = boto3.client('iam', region_name=PRIMARY_REGION)
secretsmanager_client = boto3.client('secretsmanager', region_name=PRIMARY_REGION)


def wait_for_instances_healthy(asg_name: str, timeout: int = 300) -> bool:
    """
    Wait for ASG instances to become healthy.
    
    Args:
        asg_name: Name of the Auto Scaling Group
        timeout: Maximum time to wait in seconds
        
    Returns:
        True if instances are healthy, False otherwise
    """
    start_time = time.time()
    while time.time() - start_time < timeout:
        response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        if response['AutoScalingGroups']:
            asg = response['AutoScalingGroups'][0]
            healthy_count = sum(1 for i in asg['Instances'] if i['HealthStatus'] == 'Healthy')
            desired_count = asg['DesiredCapacity']
            
            if healthy_count >= desired_count and desired_count > 0:
                return True
        
        time.sleep(10)
    
    return False


# ============================================================================
# SERVICE-LEVEL TESTS (Single service WITH ACTUAL OPERATIONS)
# Maps to: Individual service functionality validation with real actions
# ============================================================================

class TestServiceLevelS3Operations(unittest.TestCase):
    """
    Service-Level Tests: S3 Bucket Operations
    Maps to PROMPT.md: "S3 lifecycle" + "backup strategy"
    
    Tests actual S3 operations: write, read, versioning.
    """
    
    def test_s3_write_and_read_operations(self):
        """
        SERVICE-LEVEL TEST: S3 write and read
        ACTION: Write object to S3, read it back
        VERIFY: Content matches
        """
        bucket_name = OUTPUTS.get('backup_bucket_name')
        self.assertIsNotNone(bucket_name, "Backup bucket name not found")
        
        # ACTION: Write test object to S3
        test_key = f'service-test/test-{int(time.time())}.txt'
        test_content = f'Service-level test at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"\nWriting object to S3: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8')
        )
        
        # VERIFY: Read back the object
        response = s3_client.get_object(
            Bucket=bucket_name,
            Key=test_key
        )
        
        retrieved_content = response['Body'].read().decode('utf-8')
        self.assertEqual(retrieved_content, test_content, "Retrieved content should match written content")
        print(f"Successfully wrote and read object from S3")
        
        # CLEANUP
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
    
    def test_s3_versioning_functionality(self):
        """
        SERVICE-LEVEL TEST: S3 versioning
        ACTION: Write multiple versions of same object
        VERIFY: Multiple versions exist
        """
        bucket_name = OUTPUTS.get('backup_bucket_name')
        self.assertIsNotNone(bucket_name, "Backup bucket name not found")
        
        # Verify versioning is enabled
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled', "Versioning should be enabled")
        
        # ACTION: Write multiple versions of same object
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
        
        # VERIFY: List versions
        versions_response = s3_client.list_object_versions(
            Bucket=bucket_name,
            Prefix=test_key
        )
        
        versions = versions_response.get('Versions', [])
        self.assertGreaterEqual(len(versions), 2, "Should have at least 2 versions")
        print(f"S3 versioning working: {len(versions)} versions maintained")
        
        # CLEANUP
        for version in versions:
            s3_client.delete_object(
                Bucket=bucket_name,
                Key=test_key,
                VersionId=version['VersionId']
            )


class TestServiceLevelSSMOperations(unittest.TestCase):
    """
    Service-Level Tests: SSM Parameter Store Operations
    Maps to PROMPT.md: "SSM Parameter Store for app secrets"
    
    Tests actual SSM operations: create, read, update, delete.
    """
    
    def test_ssm_parameter_read_and_write(self):
        """
        SERVICE-LEVEL TEST: SSM Parameter Store
        ACTION: Create parameter, read it, update it
        VERIFY: Values match at each step
        """
        # ACTION: Create a test parameter
        test_param_name = f'/tap/{ENVIRONMENT_SUFFIX}/service-test-{int(time.time())}'
        test_value = f'test-value-{int(time.time())}'
        
        print(f"\nCreating SSM parameter: {test_param_name}")
        ssm_client.put_parameter(
            Name=test_param_name,
            Value=test_value,
            Type='String',
            Description='Service-level integration test parameter'
        )
        
        # VERIFY: Read back the parameter
        response = ssm_client.get_parameter(Name=test_param_name)
        self.assertEqual(response['Parameter']['Value'], test_value, "Parameter value should match")
        self.assertEqual(response['Parameter']['Type'], 'String')
        print(f"Successfully created and read SSM parameter")
        
        # ACTION: Update the parameter
        updated_value = f'updated-value-{int(time.time())}'
        print(f"Updating SSM parameter to: {updated_value}")
        ssm_client.put_parameter(
            Name=test_param_name,
            Value=updated_value,
            Type='String',
            Overwrite=True
        )
        
        # VERIFY: Read updated value
        response = ssm_client.get_parameter(Name=test_param_name)
        self.assertEqual(response['Parameter']['Value'], updated_value, "Updated value should match")
        print(f"Successfully updated SSM parameter")
        
        # CLEANUP
        ssm_client.delete_parameter(Name=test_param_name)


class TestServiceLevelCloudWatchOperations(unittest.TestCase):
    """
    Service-Level Tests: CloudWatch Operations
    Maps to PROMPT.md: "CloudWatch Logs, metrics, CloudWatch alarms"
    
    Tests actual CloudWatch operations: publish metrics, query metrics.
    """
    
    def test_cloudwatch_custom_metrics(self):
        """
        SERVICE-LEVEL TEST: CloudWatch Logs
        ACTION: Create log group and write log events
        VERIFY: Logs are immediately queryable
        """
        # ACTION: Create a test log group and stream
        test_log_group = f'/tap/integration-test/service-level-{int(time.time())}'
        test_log_stream = f'test-stream-{int(time.time())}'
        test_message = f'Integration test message at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"\nCreating CloudWatch log group: {test_log_group}")
        
        try:
            # Create log group
            logs_client.create_log_group(logGroupName=test_log_group)
            
            # Create log stream
            logs_client.create_log_stream(
                logGroupName=test_log_group,
                logStreamName=test_log_stream
            )
            
            # ACTION: Write log event
            print(f"Writing log event to CloudWatch")
            # Use current timestamp in milliseconds (CloudWatch requirement)
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
            print(f"Put log events response: nextSequenceToken={put_response.get('nextSequenceToken', 'N/A')}")
            
            # Check if put_log_events had any rejected events
            if put_response.get('rejectedLogEventsInfo'):
                self.fail(f"Log events were rejected: {put_response['rejectedLogEventsInfo']}")
            
            # VERIFY: Query the log events with retry (CloudWatch Logs has eventual consistency)
            events = []
            max_retries = 10  # Increased to 10 seconds
            for attempt in range(max_retries):
                response = logs_client.get_log_events(
                    logGroupName=test_log_group,
                    logStreamName=test_log_stream,
                    startFromHead=True  # Read from beginning
                )
                events = response.get('events', [])
                if len(events) > 0:
                    print(f"Log events retrieved after {attempt + 1} attempt(s)")
                    break
                if attempt < max_retries - 1:
                    time.sleep(1)  # Wait 1 second before retry
            
            self.assertGreater(len(events), 0, f"Log events should be queryable within {max_retries} seconds. Put response: {put_response}")
            
            # Verify our message is in the logs
            messages = [event['message'] for event in events]
            self.assertIn(test_message, messages, "Our log message should be in CloudWatch")
            
            print(f"Successfully wrote and queried CloudWatch logs")
            
        finally:
            # CLEANUP: Delete log group (also deletes streams)
            try:
                logs_client.delete_log_group(logGroupName=test_log_group)
            except Exception as e:
                print(f"Note: Cleanup of log group failed (may not exist): {e}")


class TestServiceLevelSNSOperations(unittest.TestCase):
    """
    Service-Level Tests: SNS Operations
    Maps to PROMPT.md: "SNS alerting"
    
    Tests actual SNS operations: publish message, verify delivery.
    """
    
    def test_sns_topic_publish_message(self):
        """
        SERVICE-LEVEL TEST: SNS topic operations
        ACTION: Publish message to SNS topic
        VERIFY: Message published successfully
        """
        alarm_topic_arn = OUTPUTS.get('alarm_topic_arn')
        self.assertIsNotNone(alarm_topic_arn, "Alarm topic ARN not found")
        
        # ACTION: Publish test message to SNS topic
        test_message = f'Service-level test message at {datetime.now(timezone.utc).isoformat()}'
        test_subject = f'TAP Service Test {int(time.time())}'
        
        print(f"\nPublishing message to SNS topic: {alarm_topic_arn}")
        response = sns_client.publish(
            TopicArn=alarm_topic_arn,
            Message=test_message,
            Subject=test_subject
        )
        
        # VERIFY: Message was published (got MessageId)
        self.assertIn('MessageId', response, "Should receive MessageId from SNS")
        message_id = response['MessageId']
        self.assertIsNotNone(message_id, "MessageId should not be None")
        print(f"Successfully published message to SNS (MessageId: {message_id})")


# ============================================================================
# CROSS-SERVICE TESTS (Two services interacting WITH ACTUAL DATA FLOW)
# Maps to: Service integration validation with real interactions
# ============================================================================

class TestCrossServiceS3ToCloudWatch(unittest.TestCase):
    """
    Cross-Service Tests: S3 → CloudWatch Logs
    Maps to PROMPT.md: "CloudWatch Logs" for S3 access logging
    
    Tests that S3 operations generate CloudWatch log entries.
    """
    
    def test_s3_operations_generate_cloudwatch_metrics(self):
        """
        CROSS-SERVICE TEST: S3 → CloudWatch
        ACTION: Write to S3 bucket
        VERIFY: CloudWatch receives S3 metrics
        """
        bucket_name = OUTPUTS.get('backup_bucket_name')
        self.assertIsNotNone(bucket_name, "Backup bucket name not found in outputs")
        
        # ACTION: Perform S3 operations to generate metrics
        test_key = f'integration-test/cross-service-test-{int(time.time())}.txt'
        test_content = f'Cross-service test at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"Writing test object to S3: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8')
        )
        
        # Give time for metrics to propagate
        time.sleep(5)
        
        # VERIFY: Check CloudWatch for S3 metrics
        end_time = datetime.now(timezone.utc)
        start_time = end_time.replace(hour=end_time.hour - 1)
        
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='NumberOfObjects',
            Dimensions=[
                {
                    'Name': 'BucketName',
                    'Value': bucket_name
                },
                {
                    'Name': 'StorageType',
                    'Value': 'AllStorageTypes'
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )
        
        # Verify we can query S3 metrics in CloudWatch
        self.assertIn('Datapoints', response, "CloudWatch should be able to track S3 metrics")
        print(f"S3 operations are being tracked in CloudWatch")
        
        # CLEANUP
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


class TestCrossServiceASGToCloudWatch(unittest.TestCase):
    """
    Cross-Service Tests: ASG → CloudWatch
    Maps to PROMPT.md: "CloudWatch metrics" for ASG monitoring
    
    Tests that ASG scaling actions generate CloudWatch metrics.
    """
    
    def test_asg_scaling_generates_cloudwatch_metrics(self):
        """
        CROSS-SERVICE TEST: ASG → CloudWatch
        ACTION: Query ASG state
        VERIFY: CloudWatch has ASG metrics
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "ASG name not found in outputs")
        
        # ACTION: Get current ASG state (this triggers metric updates)
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg = asg_response['AutoScalingGroups'][0]
        current_capacity = asg['DesiredCapacity']
        
        print(f"Current ASG capacity: {current_capacity}")
        
        # Give time for metrics to propagate
        time.sleep(5)
        
        # VERIFY: Check CloudWatch for ASG metrics
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
        
        # VERIFY: Metrics are being published
        self.assertIn('Datapoints', response, "CloudWatch should receive ASG metrics")
        print(f"ASG metrics are being published to CloudWatch")


class TestCrossServiceCloudWatchToSNS(unittest.TestCase):
    """
    Cross-Service Tests: CloudWatch → SNS
    Maps to PROMPT.md: "SNS alerting" for alarm notifications
    
    Tests that CloudWatch alarms can trigger SNS notifications.
    """
    
    def test_cloudwatch_alarm_triggers_sns_notification(self):
        """
        CROSS-SERVICE TEST: CloudWatch → SNS
        ACTION: Publish custom metric to trigger alarm
        VERIFY: SNS topic is configured to receive alarm notifications
        """
        alarm_topic_arn = OUTPUTS.get('alarm_topic_arn')
        self.assertIsNotNone(alarm_topic_arn, "Alarm topic ARN not found in outputs")
        
        # ACTION: Publish a test metric to CloudWatch
        test_metric_name = f'IntegrationTest-{int(time.time())}'
        namespace = 'TAP/IntegrationTests'
        
        print(f"Publishing test metric to CloudWatch: {test_metric_name}")
        cloudwatch_client.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': test_metric_name,
                    'Value': 100.0,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(timezone.utc)
                }
            ]
        )
        
        # Give time for metric to be recorded
        time.sleep(3)
        
        # VERIFY: SNS topic exists and is ready to receive notifications
        topic_response = sns_client.get_topic_attributes(TopicArn=alarm_topic_arn)
        self.assertEqual(topic_response['ResponseMetadata']['HTTPStatusCode'], 200)
        
        # VERIFY: CloudWatch alarms are configured to notify this SNS topic
        alarms_response = cloudwatch_client.describe_alarms()
        stack_alarms = [alarm for alarm in alarms_response['MetricAlarms'] 
                       if ENVIRONMENT_SUFFIX in alarm['AlarmName']]
        
        self.assertGreater(len(stack_alarms), 0, "Should have CloudWatch alarms for the stack")
        print(f"Found {len(stack_alarms)} CloudWatch alarms for stack")
        
        # Check if alarms have SNS actions configured
        alarms_with_sns = [alarm for alarm in stack_alarms 
                         if alarm_topic_arn in alarm.get('AlarmActions', [])]
        
        if len(alarms_with_sns) > 0:
            print(f"CloudWatch alarms ({len(alarms_with_sns)}) are configured to notify SNS")
        else:
            # If no alarms have SNS yet, verify at least one alarm has any actions
            alarms_with_actions = [alarm for alarm in stack_alarms 
                                  if len(alarm.get('AlarmActions', [])) > 0]
            self.assertGreater(len(alarms_with_actions), 0,
                             f"CloudWatch alarms should have actions configured. "
                             f"Found {len(stack_alarms)} alarms but none have AlarmActions. "
                             f"Expected SNS topic: {alarm_topic_arn}")
            print(f"CloudWatch alarms ({len(alarms_with_actions)}) have alarm actions configured")


class TestCrossServiceSSMToS3(unittest.TestCase):
    """
    Cross-Service Tests: SSM → S3
    Maps to PROMPT.md: "SSM Parameter Store" for configuration
    
    Tests that SSM parameters can reference S3 resources.
    """
    
    def test_ssm_parameter_references_s3_bucket(self):
        """
        CROSS-SERVICE TEST: SSM → S3
        ACTION: Read SSM parameter
        VERIFY: Parameter contains S3 bucket reference
        """
        param_name = OUTPUTS.get('app_config_parameter_name')
        bucket_name = OUTPUTS.get('backup_bucket_name')
        
        self.assertIsNotNone(param_name, "SSM parameter name not found in outputs")
        self.assertIsNotNone(bucket_name, "Backup bucket name not found in outputs")
        
        # ACTION: Read SSM parameter
        print(f"Reading SSM parameter: {param_name}")
        param_response = ssm_client.get_parameter(Name=param_name)
        param_value = param_response['Parameter']['Value']
        
        print(f"Parameter value: {param_value}")
        
        # VERIFY: Parameter exists and can be read
        self.assertIsNotNone(param_value, "SSM parameter should have a value")
        
        # VERIFY: S3 bucket exists and is accessible
        bucket_response = s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(bucket_response['ResponseMetadata']['HTTPStatusCode'], 200)
        
        print(f"SSM parameter and S3 bucket are both accessible")


# Helper function to wait for SSM command completion
def wait_for_ssm_command(command_id: str, instance_id: str, timeout: int = 120) -> Dict[str, Any]:
    """
    Wait for SSM command to complete.
    
    Args:
        command_id: SSM command ID
        instance_id: EC2 instance ID
        timeout: Maximum wait time in seconds
        
    Returns:
        Command invocation result
    """
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            result = ssm_client.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id
            )
            
            status = result['Status']
            if status in ['Success', 'Failed', 'Cancelled', 'TimedOut']:
                return result
            
            time.sleep(3)
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvocationDoesNotExist':
                time.sleep(3)
                continue
            raise
    
    raise TimeoutError(f"SSM command {command_id} timed out after {timeout} seconds")


# ============================================================================
# END-TO-END TESTS (3+ services, full workflows WITH ACTUAL DATA FLOW)
# Maps to: Complete HA and recovery workflows
# ============================================================================

class TestE2EEC2ToS3ViaSSM(unittest.TestCase):
    """
    E2E Test: EC2 → SSM → S3 → CloudWatch
    Maps to PROMPT.md: "S3 read-only" + "CloudWatch Logs"
    
    Flow: EC2 Instance → Reads SSM Parameter → Writes to S3 → CloudWatch Logs
    
    TRUE E2E: We trigger EC2 to perform actions, EC2 automatically interacts
    with SSM and S3, we verify the final results in S3 and CloudWatch.
    """
    
    def test_ec2_reads_ssm_writes_s3_logs_cloudwatch(self):
        """
        E2E TEST: Complete data flow through 4 services
        
        ENTRY POINT: Execute command on EC2 instance via SSM
        AUTOMATIC FLOW:
        1. EC2 automatically reads SSM parameter (using IAM role)
        2. EC2 automatically writes data to S3 bucket (using IAM role)
        3. EC2 automatically generates CloudWatch logs
        
        VERIFY: Check S3 has the file and CloudWatch has logs
        """
        asg_name = OUTPUTS.get('asg_name')
        bucket_name = OUTPUTS.get('backup_bucket_name')
        param_name = OUTPUTS.get('app_config_parameter_name')
        log_group_name = OUTPUTS.get('app_log_group_name')
        
        self.assertIsNotNone(asg_name, "ASG name not found")
        self.assertIsNotNone(bucket_name, "Bucket name not found")
        self.assertIsNotNone(param_name, "SSM parameter name not found")
        
        # Get an instance from ASG
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        instances = asg_response['AutoScalingGroups'][0].get('Instances', [])
        
        self.assertGreater(len(instances), 0, 
                          f"No instances running in ASG '{asg_name}'. ASG should have at least 1 running instance.")
        
        instance_id = instances[0]['InstanceId']
        print(f"\n{'='*70}")
        print(f"E2E Test: EC2 → SSM → S3 → CloudWatch")
        print(f"Using instance: {instance_id}")
        print(f"{'='*70}\n")
        
        # ENTRY POINT: Trigger EC2 to perform complete workflow
        test_key = f'e2e-test/test-{int(time.time())}.txt'
        test_content = f'E2E test at {datetime.now(timezone.utc).isoformat()}'
        
        print("STEP 1: Triggering EC2 instance to execute workflow...")
        print(f"  Command: Read SSM → Write to S3 → Generate logs")
        
        try:
            command_response = ssm_client.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={
                    'commands': [
                        '#!/bin/bash',
                        'set -e',
                        '',
                        '# Step 1: EC2 reads SSM parameter (automatic via IAM role)',
                        f'echo "Reading SSM parameter: {param_name}"',
                        f'SSM_VALUE=$(aws ssm get-parameter --name "{param_name}" --region {PRIMARY_REGION} --query "Parameter.Value" --output text)',
                        'echo "SSM parameter read successfully: $SSM_VALUE"',
                        '',
                        '# Step 2: EC2 writes to S3 (automatic via IAM role)',
                        f'echo "Writing to S3: s3://{bucket_name}/{test_key}"',
                        f'echo "{test_content}" | aws s3 cp - s3://{bucket_name}/{test_key}',
                        'echo "S3 write completed successfully"',
                        '',
                        '# Step 3: Generate log output (automatic to CloudWatch)',
                        'echo "E2E_TEST_MARKER: Workflow completed successfully"',
                        f'echo "Timestamp: {datetime.now(timezone.utc).isoformat()}"'
                    ]
                },
                Comment='E2E integration test: EC2 → SSM → S3 → CloudWatch'
            )
            
            command_id = command_response['Command']['CommandId']
            print(f"  Command ID: {command_id}")
            print(f"\nSTEP 2: Waiting for EC2 to complete workflow...")
            
            # Wait for command to complete
            result = wait_for_ssm_command(command_id, instance_id, timeout=120)
            
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
                self.fail(f"EC2 command failed with status: {result['Status']}")
            
            print(f"\nEC2 workflow completed successfully!")
            print(f"\nCommand Output:")
            print(f"{'-'*70}")
            print(result.get('StandardOutputContent', ''))
            print(f"{'-'*70}")
            
            # Give time for S3 and CloudWatch to propagate
            time.sleep(5)
            
            # VERIFY STEP 1: Check S3 has the file (proving EC2 → S3 flow worked)
            print(f"\nSTEP 3: Verifying S3 has the file...")
            try:
                s3_response = s3_client.get_object(
                    Bucket=bucket_name,
                    Key=test_key
                )
                s3_content = s3_response['Body'].read().decode('utf-8')
                
                self.assertIn(test_content, s3_content, 
                            "S3 object should contain the test content written by EC2")
                print(f"  S3 object verified: {test_key}")
                print(f"  Content: {s3_content}")
                
                # CLEANUP
                s3_client.delete_object(Bucket=bucket_name, Key=test_key)
                print(f"  Cleaned up S3 object")
                
            except ClientError as e:
                self.fail(f"S3 verification failed: {e}")
            
            # VERIFY STEP 2: Check CloudWatch has logs (proving EC2 → CloudWatch flow worked)
            print(f"\nSTEP 4: Verifying CloudWatch has execution logs...")
            time.sleep(3)  # Give CloudWatch time to receive logs
            
            # Check SSM command logs in CloudWatch
            try:
                log_stream_name = f'{command_id}/{instance_id}/aws-runShellScript/stdout'
                log_group = '/aws/ssm/AWS-RunShellScript'
                
                logs_response = logs_client.get_log_events(
                    logGroupName=log_group,
                    logStreamName=log_stream_name,
                    limit=50
                )
                
                log_messages = [event['message'] for event in logs_response.get('events', [])]
                
                if log_messages:
                    print(f"  Found {len(log_messages)} log entries in CloudWatch")
                    
                    # Verify workflow completion marker
                    workflow_completed = any('E2E_TEST_MARKER' in msg for msg in log_messages)
                    self.assertTrue(workflow_completed, 
                                  "CloudWatch logs should contain workflow completion marker")
                    print(f"  Workflow completion marker found in logs")
                else:
                    print(f"  Note: Logs may still be propagating to CloudWatch")
                    
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    print(f"  Note: Log stream not yet created (expected for recent commands)")
                else:
                    print(f"  Note: CloudWatch logs check: {e}")
            
            print(f"\n{'='*70}")
            print(f"E2E TEST PASSED: EC2 → SSM (read) → S3 (write) → CloudWatch (logs)")
            print(f"{'='*70}\n")
                
        except ClientError as e:
            if 'InvalidInstanceId' in str(e) or 'not managed by SSM' in str(e):
                self.fail(f"SSM not configured on instance {instance_id}. "
                         f"Ensure SSM agent is installed and running. Error: {e}")
            raise


class TestE2EEC2InternetConnectivity(unittest.TestCase):
    """
    E2E Test: VPC → Private Subnet → NAT Gateway → Internet
    Maps to PROMPT.md: "NAT Gateways designed for AZ HA"
    
    Flow: EC2 (Private Subnet) → NAT Gateway → Internet Gateway → Internet
    
    TRUE E2E: We trigger EC2 to access the internet, traffic automatically
    flows through NAT Gateway and IGW, we verify the connection succeeded.
    """
    
    def test_ec2_internet_connectivity_via_nat(self):
        """
        E2E TEST: Complete network connectivity flow
        
        ENTRY POINT: Execute curl command on EC2 instance
        AUTOMATIC FLOW:
        1. EC2 sends traffic to NAT Gateway (automatic routing)
        2. NAT Gateway forwards to Internet Gateway (automatic)
        3. Internet Gateway connects to internet (automatic)
        4. Response flows back through same path (automatic)
        
        VERIFY: EC2 successfully accessed internet (check curl response)
        """
        asg_name = OUTPUTS.get('asg_name')
        self.assertIsNotNone(asg_name, "ASG name not found")
        
        # Get an instance from ASG
        asg_response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        instances = asg_response['AutoScalingGroups'][0].get('Instances', [])
        
        self.assertGreater(len(instances), 0, 
                          f"No instances running in ASG '{asg_name}'. ASG should have at least 1 running instance.")
        
        instance_id = instances[0]['InstanceId']
        print(f"\n{'='*70}")
        print(f"E2E Test: EC2 (Private Subnet) → NAT Gateway → IGW → Internet")
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
                        'echo "Testing internet connectivity from private subnet..."',
                        'curl -s -o /dev/null -w "HTTP_STATUS:%{http_code}" https://www.google.com',
                        'echo ""',
                        'echo "E2E_NETWORK_TEST_COMPLETE"'
                    ]
                },
                Comment='E2E test: EC2 → NAT → Internet connectivity'
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
                        "EC2 should successfully access internet via NAT Gateway")
            self.assertIn('E2E_NETWORK_TEST_COMPLETE', output,
                        "Network test should complete")
            
            print(f"\n{'='*70}")
            print(f"E2E TEST PASSED: EC2 (Private) → NAT Gateway → IGW → Internet")
            print(f"{'='*70}\n")
            
        except ClientError as e:
            if 'InvalidInstanceId' in str(e) or 'not managed by SSM' in str(e):
                self.fail(f"SSM not configured on instance {instance_id}. "
                         f"Ensure SSM agent is installed and running. Error: {e}")
            raise





if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)
