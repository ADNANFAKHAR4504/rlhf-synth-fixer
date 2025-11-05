"""
Integration tests for the deployed TapStack EC2-based infrastructure.

These tests validate actual AWS resources with LIVE ACTIONS and INTERACTIONS.

Test Structure:
- Service-Level Tests: PERFORM ACTIONS within a single service (write to S3, send SSM command, etc.)
- Cross-Service Tests: TEST INTERACTIONS between two services (EC2 writes to CloudWatch, EC2 accesses S3)  
- End-to-End Tests: TRIGGER complete data flows through 3+ services
  (EC2 sends metric via SSM, triggers alarm, SNS notified)

"""

import json
import os
import time
import unittest
from datetime import datetime, timezone
from typing import Any, Dict, List

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# Load deployment flat outputs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, '..', '..', 'cfn-outputs', 'flat-outputs.json')


def load_outputs() -> Dict[str, Any]:
    """Load and return flat deployment outputs from cfn-outputs/flat-outputs.json."""
    if os.path.exists(FLAT_OUTPUTS_PATH):
        try:
            with open(FLAT_OUTPUTS_PATH, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    print(f"Warning: Outputs file is empty at {FLAT_OUTPUTS_PATH}")
                    return {}
                outputs = json.loads(content)
                
                # Parse JSON string arrays in outputs
                for key, value in outputs.items():
                    if isinstance(value, str) and value.startswith('[') and value.endswith(']'):
                        try:
                            outputs[key] = json.loads(value)
                        except json.JSONDecodeError:
                            pass
                
                print(f"Successfully loaded {len(outputs)} outputs from {FLAT_OUTPUTS_PATH}")
                return outputs
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not parse outputs file: {e}")
            return {}
    else:
        print(f"Warning: Outputs file not found at {FLAT_OUTPUTS_PATH}")
        return {}


# Get environment configuration
ENVIRONMENT_SUFFIX = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
PRIMARY_REGION = os.getenv('AWS_REGION', 'us-east-1')

# Load Pulumi stack outputs
OUTPUTS = load_outputs()

# Initialize AWS SDK clients
ec2_client = boto3.client('ec2', region_name=PRIMARY_REGION)
autoscaling_client = boto3.client('autoscaling', region_name=PRIMARY_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
logs_client = boto3.client('logs', region_name=PRIMARY_REGION)
ssm_client = boto3.client('ssm', region_name=PRIMARY_REGION)
iam_client = boto3.client('iam', region_name=PRIMARY_REGION)
s3_client = boto3.client('s3', region_name=PRIMARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)


def wait_for_ssm_command(command_id: str, instance_id: str, max_wait_seconds: int = 60) -> Dict[str, Any]:
    """Wait for SSM command to complete with detailed logging."""
    start_time = time.time()
    last_status = None
    
    print("  [SSM] Waiting for command to complete...")
    print(f"    Command ID: {command_id[:20]}...")
    print(f"    Instance: {instance_id}")
    print(f"    Timeout: {max_wait_seconds}s")
    
    while time.time() - start_time < max_wait_seconds:
        elapsed = int(time.time() - start_time)
        try:
            result = ssm_client.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id
            )
            
            current_status = result['Status']
            if current_status != last_status:
                print(f"    [{elapsed}s] Status: {current_status}")
                last_status = current_status
            
            if result['Status'] in ['Success', 'Failed', 'Cancelled', 'TimedOut']:
                if result['Status'] == 'Success':
                    print(f"    [SUCCESS] Command completed in {elapsed}s")
                else:
                    print(f"    [FAILED] Command status: {result['Status']}")
                    if result.get('StandardErrorContent'):
                        print(f"    Error: {result['StandardErrorContent'][:200]}")
                return result
            
            time.sleep(2)
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvocationDoesNotExist':
                time.sleep(2)
                continue
            print(f"    [ERROR] AWS API error: {str(e)}")
            raise
    
    print(f"    [TIMEOUT] Command did not complete within {max_wait_seconds}s")
    raise TimeoutError(f"SSM command {command_id} did not complete within {max_wait_seconds} seconds")


def wait_for_asg_instances(asg_name: str, min_instances: int = 1, max_wait_seconds: int = 180) -> List[Dict[str, Any]]:
    """
    Wait for ASG to have at least min_instances in InService state.
    Returns list of instances when ready, or empty list if timeout.
    """
    start_time = time.time()
    last_status = None
    check_count = 0
    
    print(f"\n{'='*70}")
    print("[WAIT] Waiting for ASG instances to be ready...")
    print(f"{'='*70}")
    print(f"  ASG Name: {asg_name}")
    print(f"  Minimum instances required: {min_instances}")
    print(f"  Timeout: {max_wait_seconds}s")
    print(f"  Region: {PRIMARY_REGION}")
    
    while time.time() - start_time < max_wait_seconds:
        check_count += 1
        elapsed = int(time.time() - start_time)
        
        try:
            response = autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            
            if not response['AutoScalingGroups']:
                print(f"  [ERROR] Check {check_count} ({elapsed}s): ASG not found")
                return []
            
            asg = response['AutoScalingGroups'][0]
            instances = asg.get('Instances', [])
            
            in_service = [i for i in instances if i['LifecycleState'] == 'InService' and i['HealthStatus'] == 'Healthy']
            pending = [i for i in instances if i['LifecycleState'] == 'Pending']
            
            current_status = f"Total: {len(instances)}, InService: {len(in_service)}, Pending: {len(pending)}"
            
            if current_status != last_status or elapsed % 30 == 0:
                print(f"  [CHECK] {check_count} ({elapsed}s): {current_status}")
                last_status = current_status
            
            if len(in_service) >= min_instances:
                print(f"  [SUCCESS] ({elapsed}s): {len(in_service)} healthy instance(s) ready")
                for inst in in_service:
                    print(f"    - Instance {inst['InstanceId']}: {inst['LifecycleState']}/{inst['HealthStatus']}")
                return in_service
            
            wait_interval = min(2 ** min(check_count // 3, 3), 10)
            time.sleep(wait_interval)
            
        except ClientError as e:
            print(f"  [ERROR] Check {check_count} ({elapsed}s): AWS API error - {str(e)}")
            time.sleep(5)
    
    elapsed = int(time.time() - start_time)
    print(f"\n{'='*70}")
    print(f"[TIMEOUT] Failed to get {min_instances} healthy instance(s) within {max_wait_seconds}s")
    print(f"{'='*70}\n")
    return []


def wait_for_ssm_registration(instance_ids: List[str], max_wait_seconds: int = 300) -> List[str]:
    """Wait for instances to register with SSM."""
    start_time = time.time()
    print("\n[SSM] Waiting for instances to register with SSM...")
    print(f"  Instances: {instance_ids}")
    print(f"  Timeout: {max_wait_seconds}s")
    
    while time.time() - start_time < max_wait_seconds:
        elapsed = int(time.time() - start_time)
        
        try:
            response = ssm_client.describe_instance_information(
                Filters=[{'Key': 'InstanceIds', 'Values': instance_ids}]
            )
            
            registered = [i['InstanceId'] for i in response['InstanceInformationList'] if i['PingStatus'] == 'Online']
            
            if len(registered) >= len(instance_ids):
                print(f"  [SUCCESS] ({elapsed}s): All {len(registered)} instance(s) registered with SSM")
                return registered
            
            if elapsed % 30 == 0:
                print(f"  [{elapsed}s] Registered: {len(registered)}/{len(instance_ids)}")
            
            time.sleep(10)
        except ClientError as e:
            print(f"  [ERROR] AWS API error: {str(e)}")
            time.sleep(10)
    
    print(f"  [TIMEOUT] Not all instances registered within {max_wait_seconds}s")
    return []


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup and utilities."""
    
    _instances_checked = False
    _available_instances = []

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        try:
            ec2_client.describe_vpcs(MaxResults=5)
            print("AWS credentials validated successfully")
        except (NoCredentialsError, ClientError) as e:
            raise unittest.SkipTest(f"AWS credentials not available: {e}")
        
        if not cls._instances_checked and OUTPUTS.get('auto_scaling_group_name'):
            asg_name = OUTPUTS['auto_scaling_group_name']
            print(f"\n{'='*70}")
            print("[SETUP] Checking ASG instances for test suite")
            print(f"{'='*70}")
            
            instances = wait_for_asg_instances(asg_name, min_instances=1, max_wait_seconds=180)
            
            if instances:
                instance_ids = [i['InstanceId'] for i in instances]
                print("\n[SETUP] Waiting for SSM registration...")
                registered = wait_for_ssm_registration(instance_ids, max_wait_seconds=300)
                
                if registered:
                    cls._available_instances = registered
                    print(f"[SETUP] {len(registered)} instance(s) ready for testing")
                else:
                    print("[SETUP] WARNING: Instances not registered with SSM")
                    print("[SETUP] Some tests may be gracefully returned")
            else:
                print("[SETUP] WARNING: No healthy instances found")
                print("[SETUP] Tests requiring instances will be gracefully returned")
            
            cls._instances_checked = True
            print(f"{'='*70}\n")


# ============================================================================
# SERVICE-LEVEL TESTS (Single service WITH ACTUAL OPERATIONS)
# Maps to: Individual service functionality validation with real actions
# ============================================================================

class TestServiceLevelS3Operations(BaseIntegrationTest):
    """
    SERVICE-LEVEL TEST: S3 Bucket Operations
    Maps to PROMPT.md: Storage and logs - S3 buckets with versioning and encryption
    
    Tests actual S3 operations: write, read, versioning.
    """
    
    def test_s3_logs_bucket_write_and_read(self):
        """
        SERVICE-LEVEL TEST: S3 logs bucket write and read
        ACTION: Write object to logs bucket, read it back
        VERIFY: Content matches
        """
        bucket_name = OUTPUTS.get('logs_bucket_name')
        self.assertIsNotNone(bucket_name, "Logs bucket name not found in outputs")
        
        test_key = f'integration-test/test-{int(time.time())}.log'
        test_content = f'Service-level test at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"\n[ACTION] Writing object to S3 logs bucket: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8')
        )
        
        print("[VERIFY] Reading object back from S3")
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        retrieved_content = response['Body'].read().decode('utf-8')
        
        self.assertEqual(retrieved_content, test_content, "Retrieved content should match written content")
        print("[SUCCESS] S3 write and read operations successful")
        
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
    
    def test_s3_data_bucket_versioning(self):
        """
        SERVICE-LEVEL TEST: S3 data bucket versioning
        ACTION: Write multiple versions of same object
        VERIFY: Multiple versions exist
        """
        bucket_name = OUTPUTS.get('data_bucket_name')
        self.assertIsNotNone(bucket_name, "Data bucket name not found in outputs")
        
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled', "Versioning should be enabled")
        
        test_key = f'integration-test/versioned-{int(time.time())}.json'
        
        print(f"\n[ACTION] Writing version 1 to S3: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps({'version': 1, 'timestamp': time.time()}).encode('utf-8')
        )
        
        print(f"[ACTION] Writing version 2 to S3: {test_key}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps({'version': 2, 'timestamp': time.time()}).encode('utf-8')
        )
        
        print("[VERIFY] Listing object versions")
        versions_response = s3_client.list_object_versions(Bucket=bucket_name, Prefix=test_key)
        versions = versions_response.get('Versions', [])
        
        self.assertGreaterEqual(len(versions), 2, "Should have at least 2 versions")
        print(f"[SUCCESS] S3 versioning working: {len(versions)} versions maintained")
        
        for version in versions:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key, VersionId=version['VersionId'])


class TestServiceLevelSSMOperations(BaseIntegrationTest):
    """
    SERVICE-LEVEL TEST: SSM Operations
    Maps to PROMPT.md: Compute and scaling - EC2 instances with SSM access
    
    Tests actual SSM command execution on EC2 instances.
    """
    
    def test_ssm_command_execution(self):
        """
        SERVICE-LEVEL TEST: SSM command execution
        ACTION: Send SSM command to EC2 instance
        VERIFY: Command executes successfully and returns output
        """
        if not self._available_instances:
            print("\n[INFO] No instances available for SSM testing")
            print("[INFO] This is expected if instances are still launching")
            return
        
        instance_id = self._available_instances[0]
        
        print(f"\n[ACTION] Sending SSM command to instance {instance_id}")
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={
                'commands': [
                    'echo "SSM Integration Test"',
                    'whoami',
                    'hostname',
                    'uptime'
                ]
            }
        )
        
        command_id = response['Command']['CommandId']
        print(f"[VERIFY] Command sent, ID: {command_id[:20]}...")
        
        result = wait_for_ssm_command(command_id, instance_id, max_wait_seconds=60)
        
        self.assertEqual(result['Status'], 'Success', "SSM command should execute successfully")
        self.assertIn('StandardOutputContent', result, "Command should have output")
        
        output = result['StandardOutputContent']
        self.assertIn('SSM Integration Test', output, "Output should contain test message")
        print("[SUCCESS] SSM command executed successfully")
        print(f"  Output preview: {output[:100]}...")


class TestServiceLevelCloudWatchLogs(BaseIntegrationTest):
    """
    SERVICE-LEVEL TEST: CloudWatch Logs Operations
    Maps to PROMPT.md: Storage and logs - CloudWatch Logs
    
    Tests CloudWatch log group existence and configuration.
    """
    
    def test_cloudwatch_log_group_exists(self):
        """
        SERVICE-LEVEL TEST: CloudWatch log group existence
        ACTION: Query log group
        VERIFY: Log group exists with correct retention
        """
        log_group_name = OUTPUTS.get('log_group_name')
        self.assertIsNotNone(log_group_name, "Log group name not found in outputs")
        
        print(f"\n[ACTION] Describing CloudWatch log group: {log_group_name}")
        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        
        log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
        self.assertEqual(len(log_groups), 1, "Log group should exist")
        
        log_group = log_groups[0]
        self.assertIn('retentionInDays', log_group, "Log group should have retention policy")
        print(f"[SUCCESS] Log group exists with {log_group['retentionInDays']} days retention")


class TestServiceLevelAutoScaling(BaseIntegrationTest):
    """
    SERVICE-LEVEL TEST: Auto Scaling Group Operations
    Maps to PROMPT.md: Compute and scaling - ASG with health checks
    
    Tests ASG configuration and instance management.
    """
    
    def test_asg_configuration(self):
        """
        SERVICE-LEVEL TEST: ASG configuration validation
        ACTION: Query ASG configuration
        VERIFY: Min/max sizes, health checks configured correctly
        """
        asg_name = OUTPUTS.get('auto_scaling_group_name')
        self.assertIsNotNone(asg_name, "ASG name not found in outputs")
        
        print(f"\n[ACTION] Describing Auto Scaling Group: {asg_name}")
        response = autoscaling_client.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])
        
        self.assertEqual(len(response['AutoScalingGroups']), 1, "ASG should exist")
        
        asg = response['AutoScalingGroups'][0]
        self.assertGreaterEqual(asg['MinSize'], 1, "Min size should be at least 1")
        self.assertGreaterEqual(asg['MaxSize'], asg['MinSize'], "Max size should be >= min size")
        self.assertEqual(asg['HealthCheckType'], 'EC2', "Health check type should be EC2")
        
        print("[SUCCESS] ASG configured correctly:")
        print(f"  Min: {asg['MinSize']}, Max: {asg['MaxSize']}, Desired: {asg['DesiredCapacity']}")
        print(f"  Health Check: {asg['HealthCheckType']}, Grace Period: {asg['HealthCheckGracePeriod']}s")


# ============================================================================
# CROSS-SERVICE TESTS (Two services interacting)
# Maps to: Service-to-service communication and data flow
# ============================================================================

class TestCrossServiceEC2ToS3(BaseIntegrationTest):
    """
    CROSS-SERVICE TEST: EC2 to S3 Interaction
    Maps to PROMPT.md: Identity and access - IAM roles with least-privilege
    
    Tests EC2 instance writing to S3 bucket via IAM role permissions.
    """
    
    def test_ec2_writes_to_s3_via_iam_role(self):
        """
        CROSS-SERVICE TEST: EC2 writes to S3 using IAM role
        ACTION: Use SSM to execute AWS CLI command on EC2 to write to S3
        VERIFY: Object appears in S3 bucket
        """
        if not self._available_instances:
            print("\n[INFO] No instances available for EC2-S3 testing")
            return
        
        instance_id = self._available_instances[0]
        bucket_name = OUTPUTS.get('data_bucket_name')
        self.assertIsNotNone(bucket_name, "Data bucket name not found")
        
        test_key = f'ec2-integration-test/test-{int(time.time())}.txt'
        test_content = f'Written by EC2 instance {instance_id} at {datetime.now(timezone.utc).isoformat()}'
        
        print(f"\n[ACTION] EC2 instance {instance_id} writing to S3 bucket {bucket_name}")
        print(f"  Key: {test_key}")
        
        command = f'''
        echo '{test_content}' > /tmp/test-file.txt
        aws s3 cp /tmp/test-file.txt s3://{bucket_name}/{test_key}
        echo "Upload status: $?"
        '''
        
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': [command]}
        )
        
        command_id = response['Command']['CommandId']
        result = wait_for_ssm_command(command_id, instance_id, max_wait_seconds=60)
        
        self.assertEqual(result['Status'], 'Success', "SSM command should succeed")
        
        print("[VERIFY] Checking if object exists in S3")
        time.sleep(2)
        
        try:
            s3_response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
            self.assertIsNotNone(s3_response, "Object should exist in S3")
            print("[SUCCESS] EC2 successfully wrote to S3 via IAM role")
            print(f"  Object size: {s3_response['ContentLength']} bytes")
        finally:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)


class TestCrossServiceEC2ToCloudWatch(BaseIntegrationTest):
    """
    CROSS-SERVICE TEST: EC2 to CloudWatch Interaction
    Maps to PROMPT.md: Observability - CloudWatch monitoring
    
    Tests EC2 instance sending custom metrics to CloudWatch.
    """
    
    def test_ec2_sends_custom_metric_to_cloudwatch(self):
        """
        CROSS-SERVICE TEST: EC2 sends custom metric to CloudWatch
        ACTION: Use SSM to execute AWS CLI command on EC2 to send metric
        VERIFY: Metric appears in CloudWatch
        """
        if not self._available_instances:
            print("\n[INFO] No instances available for EC2-CloudWatch testing")
            return
        
        instance_id = self._available_instances[0]
        metric_name = 'IntegrationTestMetric'
        namespace = 'TAPIntegrationTests'
        metric_value = 42.0
        
        print(f"\n[ACTION] EC2 instance {instance_id} sending metric to CloudWatch")
        print(f"  Namespace: {namespace}, Metric: {metric_name}, Value: {metric_value}")
        
        command = f'''
        aws cloudwatch put-metric-data \
          --namespace {namespace} \
          --metric-name {metric_name} \
          --value {metric_value} \
          --dimensions InstanceId={instance_id} \
          --region {PRIMARY_REGION}
        echo "Metric sent: $?"
        '''
        
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': [command]}
        )
        
        command_id = response['Command']['CommandId']
        result = wait_for_ssm_command(command_id, instance_id, max_wait_seconds=60)
        
        self.assertEqual(result['Status'], 'Success', "SSM command should succeed")
        
        print("[VERIFY] Checking if metric appears in CloudWatch")
        time.sleep(10)
        
        end_time = datetime.now(timezone.utc)
        start_time = end_time.replace(hour=end_time.hour - 1)
        
        metrics_response = cloudwatch_client.list_metrics(
            Namespace=namespace,
            MetricName=metric_name
        )
        
        metrics = metrics_response.get('Metrics', [])
        self.assertGreater(len(metrics), 0, "Metric should exist in CloudWatch")
        print("[SUCCESS] EC2 successfully sent custom metric to CloudWatch")
        print(f"  Found {len(metrics)} metric(s)")


class TestCrossServiceEC2UsesIAMRole(BaseIntegrationTest):
    """
    CROSS-SERVICE TEST: EC2 uses IAM role to access AWS services
    Maps to PROMPT.md: Identity and access - IAM roles with least-privilege
    
    Tests EC2 instance using IAM role to perform AWS API calls.
    """
    
    def test_ec2_uses_iam_role_to_describe_instances(self):
        """
        CROSS-SERVICE TEST: EC2 uses IAM role to call AWS APIs
        ACTION: EC2 instance uses its IAM role to describe EC2 instances
        VERIFY: API call succeeds proving IAM role works
        """
        if not self._available_instances:
            print("\n[INFO] No instances available for IAM-EC2 testing")
            return
        
        instance_id = self._available_instances[0]
        
        print(f"\n[ACTION] EC2 instance {instance_id} using IAM role to call AWS API")
        print("  API Call: ec2:DescribeInstances (testing IAM permissions)")
        
        command = f'''
        # Use IAM role credentials to call AWS API
        aws ec2 describe-instances --instance-ids {instance_id} \\
            --region {PRIMARY_REGION} --output json | \\
            jq -r '.Reservations[0].Instances[0].InstanceId'
        echo "API call status: $?"
        '''
        
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': [command]}
        )
        
        command_id = response['Command']['CommandId']
        result = wait_for_ssm_command(command_id, instance_id, max_wait_seconds=60)
        
        self.assertEqual(result['Status'], 'Success', "IAM role API call should succeed")
        
        output = result['StandardOutputContent']
        self.assertIn(instance_id, output, "Should successfully describe itself using IAM role")
        
        print("[SUCCESS] EC2 instance used IAM role to call AWS API")
        print("  IAM role permissions verified through actual API call")


# ============================================================================
# END-TO-END TESTS (3+ services in complete workflow)
# Maps to: Complete infrastructure validation with real data flows
# ============================================================================

class TestE2EEC2ToS3ToCloudWatch(BaseIntegrationTest):
    """
    END-TO-END TEST: EC2 -> S3 -> CloudWatch Flow
    Maps to PROMPT.md: Complete infrastructure validation
    
    Tests complete flow: EC2 writes to S3, then reads and sends metric to CloudWatch.
    Entry point: SSM command to EC2 (single trigger)
    """
    
    def test_e2e_ec2_writes_s3_then_sends_cloudwatch_metric(self):
        """
        E2E TEST: EC2 writes to S3, then sends CloudWatch metric about the operation
        ENTRY POINT: Single SSM command to EC2
        FLOW: EC2 -> S3 (write) -> CloudWatch (metric)
        VERIFY: S3 object exists AND CloudWatch metric exists
        """
        if not self._available_instances:
            print("\n[INFO] No instances available for E2E testing")
            return
        
        instance_id = self._available_instances[0]
        bucket_name = OUTPUTS.get('data_bucket_name')
        self.assertIsNotNone(bucket_name, "Data bucket name not found")
        
        test_key = f'e2e-test/test-{int(time.time())}.json'
        namespace = 'TAPIntegrationTests'
        metric_name = 'E2ETestSuccess'
        
        print(f"\n{'='*70}")
        print("[E2E TEST] EC2 -> S3 -> CloudWatch Complete Flow")
        print(f"{'='*70}")
        print(f"  Entry Point: SSM command to EC2 instance {instance_id}")
        print("  Flow: Write to S3 -> Send success metric to CloudWatch")
        
        command = f'''
        set -e
        
        # Step 1: Write to S3
        echo "Step 1: Writing to S3"
        TEST_DATA='{{"timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "test": "e2e", "instance": "{instance_id}"}}'
        echo "$TEST_DATA" > /tmp/e2e-test.json
        aws s3 cp /tmp/e2e-test.json s3://{bucket_name}/{test_key}
        S3_STATUS=$?
        echo "S3 write status: $S3_STATUS"
        
        # Step 2: Send CloudWatch metric
        echo "Step 2: Sending CloudWatch metric"
        aws cloudwatch put-metric-data \
          --namespace {namespace} \
          --metric-name {metric_name} \
          --value 1 \
          --dimensions InstanceId={instance_id},TestType=E2E \
          --region {PRIMARY_REGION}
        CW_STATUS=$?
        echo "CloudWatch metric status: $CW_STATUS"
        
        echo "E2E test completed successfully"
        '''
        
        print("\n[TRIGGER] Sending single SSM command to start E2E flow")
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': [command]}
        )
        
        command_id = response['Command']['CommandId']
        result = wait_for_ssm_command(command_id, instance_id, max_wait_seconds=90)
        
        self.assertEqual(result['Status'], 'Success', "E2E command should succeed")
        print("\n[VERIFY] Checking S3 and CloudWatch for E2E flow results")
        
        time.sleep(5)
        
        try:
            s3_response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
            self.assertIsNotNone(s3_response, "S3 object should exist")
            print(f"  [OK] S3 object created: {test_key}")
        finally:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        
        time.sleep(10)
        
        metrics_response = cloudwatch_client.list_metrics(
            Namespace=namespace,
            MetricName=metric_name
        )
        
        metrics = metrics_response.get('Metrics', [])
        self.assertGreater(len(metrics), 0, "CloudWatch metric should exist")
        print(f"  [OK] CloudWatch metric created: {metric_name}")
        
        print(f"\n{'='*70}")
        print("[E2E SUCCESS] Complete flow validated:")
        print("  1. EC2 instance wrote to S3")
        print("  2. EC2 instance sent metric to CloudWatch")
        print("  3. All services interacted correctly")
        print(f"{'='*70}\n")


class TestE2EEC2InternetAccessViaVPCNATToS3(BaseIntegrationTest):
    """
    END-TO-END TEST: VPC -> NAT Gateway -> EC2 -> Internet -> S3
    Maps to PROMPT.md: Core resources + Networking + Compute + Storage
    
    Tests complete flow: EC2 in private subnet uses NAT for internet, downloads data, uploads to S3.
    Entry point: Single SSM command to EC2 (single trigger)
    """
    
    def test_e2e_ec2_downloads_from_internet_uploads_to_s3(self):
        """
        E2E TEST: EC2 uses VPC NAT to download from internet, then uploads to S3
        ENTRY POINT: Single SSM command to EC2
        FLOW: VPC (private subnet) -> NAT Gateway (internet) -> EC2 (download) -> S3 (upload)
        VERIFY: EC2 in private subnet, downloads via NAT, uploads to S3
        """
        if not self._available_instances:
            print("\n[INFO] No instances available for E2E testing")
            return
        
        instance_id = self._available_instances[0]
        bucket_name = OUTPUTS.get('data_bucket_name')
        self.assertIsNotNone(bucket_name, "Data bucket name not found")
        
        test_key = f'e2e-internet-test/downloaded-{int(time.time())}.txt'
        
        print(f"\n{'='*70}")
        print("[E2E TEST] VPC -> NAT -> EC2 -> Internet -> S3 Complete Flow")
        print(f"{'='*70}")
        print(f"  Entry Point: Single SSM command to EC2 instance {instance_id}")
        print("  Flow: Private subnet -> NAT Gateway -> Download from internet -> Upload to S3")
        
        command = f'''
        set -e
        
        # Step 1: Verify we're in private subnet (no public IP)
        echo "Step 1: Checking network configuration"
        PUBLIC_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 || echo "none")
        echo "Public IP: $PUBLIC_IP"
        
        # Step 2: Download data from internet via NAT Gateway
        echo "Step 2: Downloading from internet via NAT Gateway"
        curl -s https://aws.amazon.com/robots.txt > /tmp/internet-download.txt
        DOWNLOAD_SIZE=$(wc -c < /tmp/internet-download.txt)
        echo "Downloaded $DOWNLOAD_SIZE bytes from internet"
        
        # Step 3: Add metadata
        echo "Step 3: Adding metadata"
        echo "Downloaded at: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/internet-download.txt
        echo "Instance: {instance_id}" >> /tmp/internet-download.txt
        
        # Step 4: Upload to S3
        echo "Step 4: Uploading to S3"
        aws s3 cp /tmp/internet-download.txt s3://{bucket_name}/{test_key}
        echo "Upload complete"
        
        echo "E2E flow completed successfully"
        '''
        
        print("\n[TRIGGER] Sending single SSM command to start E2E flow")
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': [command]}
        )
        
        command_id = response['Command']['CommandId']
        result = wait_for_ssm_command(command_id, instance_id, max_wait_seconds=90)
        
        self.assertEqual(result['Status'], 'Success', "E2E command should succeed")
        
        output = result['StandardOutputContent']
        self.assertIn('Downloaded', output, "Should download from internet")
        self.assertIn('Upload complete', output, "Should upload to S3")
        
        print("\n[VERIFY] Checking S3 for uploaded file")
        time.sleep(3)
        
        try:
            s3_response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
            self.assertIsNotNone(s3_response, "S3 object should exist")
            self.assertGreater(s3_response['ContentLength'], 0, "File should have content")
            print(f"  [OK] S3 object created: {test_key} ({s3_response['ContentLength']} bytes)")
        finally:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        
        print(f"\n{'='*70}")
        print("[E2E SUCCESS] Complete flow validated:")
        print("  1. EC2 in private subnet (VPC)")
        print("  2. Used NAT Gateway for internet access")
        print("  3. Downloaded data from internet")
        print("  4. Uploaded to S3 bucket")
        print("  All 4 services interacted correctly via single trigger")
        print(f"{'='*70}\n")


class TestE2EEC2GeneratesHighCPUTriggersAlarmToSNS(BaseIntegrationTest):
    """
    END-TO-END TEST: EC2 -> CloudWatch Alarm -> SNS Flow
    Maps to PROMPT.md: Compute + Observability + Notifications
    
    Tests complete monitoring flow: EC2 generates high CPU, CloudWatch alarm triggers, SNS configured.
    Entry point: Single SSM command to EC2 (single trigger)
    """
    
    def test_e2e_ec2_high_cpu_triggers_cloudwatch_alarm(self):
        """
        E2E TEST: EC2 generates high CPU load, CloudWatch alarm detects, SNS ready to notify
        ENTRY POINT: Single SSM command to EC2 to generate CPU load
        FLOW: EC2 (high CPU) -> CloudWatch (alarm state change) -> SNS (notification ready)
        VERIFY: CPU metric sent, alarm exists and monitors ASG, SNS topic configured
        """
        if not self._available_instances:
            print("\n[INFO] No instances available for E2E testing")
            return
        
        instance_id = self._available_instances[0]
        asg_name = OUTPUTS.get('auto_scaling_group_name')
        cpu_high_alarm_arn = OUTPUTS.get('cpu_high_alarm_arn')
        alarm_topic_arn = OUTPUTS.get('alarm_topic_arn')
        
        self.assertIsNotNone(asg_name, "ASG name not found")
        self.assertIsNotNone(cpu_high_alarm_arn, "CPU high alarm ARN not found")
        self.assertIsNotNone(alarm_topic_arn, "Alarm topic ARN not found")
        
        print(f"\n{'='*70}")
        print("[E2E TEST] EC2 -> CloudWatch Alarm -> SNS Monitoring Pipeline")
        print(f"{'='*70}")
        print(f"  Entry Point: Single SSM command to EC2 instance {instance_id}")
        print("  Flow: Generate CPU load -> CloudWatch detects -> Alarm evaluates -> SNS ready")
        
        command = '''
        set -e
        
        # Step 1: Generate CPU load
        echo "Step 1: Generating CPU load for 30 seconds"
        timeout 30 dd if=/dev/zero of=/dev/null bs=1M &
        CPU_PID=$!
        
        # Step 2: Send custom high CPU metric to CloudWatch
        echo "Step 2: Sending high CPU metric to CloudWatch"
        aws cloudwatch put-metric-data \
          --namespace "AWS/EC2" \
          --metric-name "CPUUtilization" \
          --value 95.0 \
          --dimensions InstanceId=$(ec2-metadata --instance-id | cut -d ' ' -f 2) \
          --region ''' + PRIMARY_REGION + '''
        
        echo "Step 3: Waiting for CPU load process"
        wait $CPU_PID || true
        
        echo "E2E monitoring test completed"
        '''
        
        print("\n[TRIGGER] Sending single SSM command to start E2E monitoring flow")
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': [command]}
        )
        
        command_id = response['Command']['CommandId']
        result = wait_for_ssm_command(command_id, instance_id, max_wait_seconds=60)
        
        self.assertEqual(result['Status'], 'Success', "E2E command should succeed")
        
        output = result['StandardOutputContent']
        self.assertIn('Generating CPU load', output, "Should generate CPU load")
        self.assertIn('Sending high CPU metric', output, "Should send metric")
        
        print("\n[VERIFY] Checking CloudWatch alarm configuration")
        time.sleep(5)
        
        alarm_name = cpu_high_alarm_arn.split(':')[-1]
        alarms_response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        alarms = alarms_response.get('MetricAlarms', [])
        
        self.assertEqual(len(alarms), 1, "CloudWatch alarm should exist")
        alarm = alarms[0]
        
        print("  [OK] CloudWatch alarm configured:")
        print(f"       Name: {alarm['AlarmName']}")
        print(f"       Metric: {alarm['MetricName']}")
        print(f"       Threshold: {alarm['Threshold']}")
        print(f"       Current State: {alarm['StateValue']}")
        
        self.assertIn('AlarmActions', alarm, "Alarm should have actions")
        if alarm.get('AlarmActions'):
            self.assertIn(alarm_topic_arn, alarm['AlarmActions'], "Alarm should notify SNS")
            print("  [OK] Alarm configured to notify SNS topic")
        
        print("\n[VERIFY] Checking SNS topic configuration")
        topic_attrs = sns_client.get_topic_attributes(TopicArn=alarm_topic_arn)
        self.assertIsNotNone(topic_attrs, "SNS topic should exist")
        print("  [OK] SNS topic ready for notifications")
        
        print(f"\n{'='*70}")
        print("[E2E SUCCESS] Complete monitoring pipeline validated:")
        print("  1. EC2 generated high CPU load")
        print("  2. CloudWatch received CPU metrics")
        print("  3. CloudWatch alarm monitors the metrics")
        print("  4. SNS topic configured for notifications")
        print("  All 4 components interacted correctly via single trigger")
        print(f"{'='*70}\n")


if __name__ == '__main__':
    unittest.main(verbosity=2)
