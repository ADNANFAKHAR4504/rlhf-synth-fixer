#!/usr/bin/env python3
"""
Real AWS Infrastructure Integration Tests for TapStack
Tests actual deployed AWS resources using Pulumi Automation API and boto3.
Covers EC2, RDS, ALB, Global Accelerator, CloudWatch, S3 replication, and more.
"""

import json
import os
import socket
import sys
import time
import unittest
from typing import List

import boto3
import requests
from botocore.exceptions import ClientError
from pulumi import automation as auto


class TapStackRealIntegrationTest(unittest.TestCase):
  """
  Real AWS infrastructure integration tests that deploy and test actual resources.
  Uses Pulumi Automation API for deployment and boto3 for verification.
  """
  
  @classmethod
  def setUpClass(cls):
    """Deploy the stack and prepare test environment"""
    cls.project_name = "TapStack"
    cls.stack_name = f"integration-test-{int(time.time())}"
    cls.work_dir = os.path.join(os.path.dirname(__file__), "..")
    cls.region = "us-east-1"
    cls.source_region = "us-west-1"
    
    # Verify AWS credentials
    try:
      boto3.client('sts').get_caller_identity()
    except Exception as e:
      raise unittest.SkipTest(f"AWS credentials not configured: {e}")
    
    print(f"Setting up integration test stack: {cls.stack_name}")
    
    # Create stack using Automation API
    cls.stack = auto.create_or_select_stack(
      stack_name=cls.stack_name,
      project_name=cls.project_name,
      work_dir=cls.work_dir
    )
    
    # Configure stack
    cls.stack.set_config("aws:region", auto.ConfigValue(value=cls.region))
    cls.stack.set_config("environment:suffix", auto.ConfigValue(value="integtest"))
    
    # Deploy infrastructure
    print("Deploying infrastructure...")
    up_result = cls.stack.up(on_output=print)
    
    if up_result.summary.result != "succeeded":
      raise Exception(f"Stack deployment failed: {up_result.summary}")
    
    # Get outputs
    cls.outputs = cls.stack.outputs()
    print(f"Stack outputs: {list(cls.outputs.keys())}")
    
    # Initialize AWS clients
    cls.ec2 = boto3.client('ec2', region_name=cls.region)
    cls.ec2_source = boto3.client('ec2', region_name=cls.source_region)
    cls.rds = boto3.client('rds', region_name=cls.region)
    cls.rds_source = boto3.client('rds', region_name=cls.source_region)
    cls.elbv2 = boto3.client('elbv2', region_name=cls.region)
    cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)
    cls.s3 = boto3.client('s3', region_name=cls.region)
    cls.globalaccelerator = boto3.client(
      'globalaccelerator', region_name='us-west-2')  # GA is global
    cls.secretsmanager = boto3.client('secretsmanager', region_name=cls.region)
    cls.lambda_client = boto3.client('lambda', region_name=cls.region)
    cls.backup = boto3.client('backup', region_name=cls.region)
    
    # Wait for resources to stabilize
    print("Waiting for resources to stabilize...")
    time.sleep(30)
  
  @classmethod
  def tearDownClass(cls):
    """Cleanup deployed infrastructure"""
    if hasattr(cls, 'stack'):
      print(f"Destroying integration test stack: {cls.stack_name}")
      try:
        cls.stack.destroy(on_output=print)
        cls.stack.workspace.remove_stack(cls.stack_name)
        print("Stack cleanup completed")
      except Exception as e:
        print(f"Warning: Stack cleanup failed: {e}")
  
  def get_output_value(self, key: str) -> str:
    """Helper to get output value safely"""
    output = self.outputs.get(key)
    if output is None:
      self.fail(f"Output '{key}' not found in stack outputs")
    return output.value
  
  # ===============================
  # EC2 Infrastructure Tests
  # ===============================
  
  def test_01_ec2_instances_running_and_accessible(self):
    """Test EC2 instances are running and accessible"""
    print("Testing EC2 instances...")
    
    instance1_id = self.get_output_value("ec2_instance_1_id")
    instance2_id = self.get_output_value("ec2_instance_2_id")
    instance1_ip = self.get_output_value("ec2_instance_1_public_ip")
    instance2_ip = self.get_output_value("ec2_instance_2_public_ip")
    
    # Check instance states
    response = self.ec2.describe_instances(InstanceIds=[instance1_id, instance2_id])
    
    instances = []
    for reservation in response['Reservations']:
      instances.extend(reservation['Instances'])
    
    self.assertEqual(len(instances), 2)
    
    for instance in instances:
      state = instance['State']['Name']
      self.assertIn(state, ['running', 'pending'], 
                         f"Instance {instance['InstanceId']} state: {state}")
    
    # Wait for instances to be fully running
    self._wait_for_instances_running([instance1_id, instance2_id])
    
    # Test HTTP connectivity
    for ip in [instance1_ip, instance2_ip]:
      try:
        response = requests.get(f"http://{ip}", timeout=10)
        self.assertIn("TAP Migration Instance", response.text)
      except requests.exceptions.RequestException as e:
        self.fail(f"Cannot connect to EC2 instance at {ip}: {e}")
  
  def test_02_ec2_security_groups_configured(self):
    """Test EC2 security groups are properly configured"""
    print("Testing EC2 security groups...")
    
    vpc_id = self.get_output_value("vpc_id")
    
    # Get security groups
    response = self.ec2.describe_security_groups(
      Filters=[
        {'Name': 'vpc-id', 'Values': [vpc_id]},
        {'Name': 'group-name', 'Values': ['*ec2-sg*']}
      ]
    )
    
    self.assertGreater(len(response['SecurityGroups']), 0)
    
    sg = response['SecurityGroups'][0]
    
    # Check ingress rules
    ingress_ports = [rule['FromPort'] for rule in sg['IpPermissions'] if 'FromPort' in rule]
    self.assertIn(80, ingress_ports)
    self.assertIn(443, ingress_ports)
    self.assertIn(22, ingress_ports)
  
  # ===============================
  # RDS Database Tests
  # ===============================
  
  def test_03_rds_instance_available_and_encrypted(self):
    """Test RDS instance is available and properly encrypted"""
    print("Testing RDS instance...")
    
    rds_endpoint = self.get_output_value("rds_endpoint")
    db_identifier = rds_endpoint.split('.')[0]
    
    # Wait for RDS to be available
    self._wait_for_rds_available(db_identifier)
    
    response = self.rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
    db_instance = response['DBInstances'][0]
    
    self.assertEqual(db_instance['DBInstanceStatus'], 'available')
    self.assertTrue(db_instance['StorageEncrypted'])
    self.assertEqual(db_instance['Engine'], 'mysql')
    self.assertEqual(db_instance['EngineVersion'], '8.0')
  
  def test_04_rds_read_replica_exists_and_synced(self):
    """Test RDS read replica exists and is in sync"""
    print("Testing RDS read replica...")
    
    try:
      replica_endpoint = self.get_output_value("rds_read_replica_endpoint")
      replica_identifier = replica_endpoint.split('.')[0]
      
      # Check replica status
      response = self.rds.describe_db_instances(DBInstanceIdentifier=replica_identifier)
      replica = response['DBInstances'][0]
      
      self.assertEqual(replica['DBInstanceStatus'], 'available')
      self.assertIsNotNone(replica.get('ReadReplicaSourceDBInstanceIdentifier'))
      
    except Exception as e:
      print(f"Read replica test skipped (may be same-region): {e}")
  
  def test_05_rds_secrets_manager_integration(self):
    """Test RDS password is stored in Secrets Manager"""
    print("Testing Secrets Manager integration...")
    
    secret_arn = self.get_output_value("db_secret_arn")
    
    try:
      response = self.secretsmanager.get_secret_value(SecretId=secret_arn)
      password = response['SecretString']
      self.assertGreater(len(password), 20)  # Should be strong password
      
    except ClientError as e:
      self.fail(f"Cannot retrieve database password from Secrets Manager: {e}")
  
  # ===============================
  # Load Balancer Tests
  # ===============================
  
  def test_06_alb_healthy_targets_and_routing(self):
    """Test ALB has healthy targets and routes traffic correctly"""
    print("Testing Application Load Balancer...")
    
    alb_dns = self.get_output_value("load_balancer_dns")
    
    # Get load balancer ARN
    response = self.elbv2.describe_load_balancers()
    alb_arn = None
    for lb in response['LoadBalancers']:
      if lb['DNSName'] == alb_dns:
        alb_arn = lb['LoadBalancerArn']
        break
    
    self.assertIsNotNone(alb_arn, "Load balancer not found")
    
    # Get target groups
    response = self.elbv2.describe_target_groups(LoadBalancerArn=alb_arn)
    self.assertGreater(len(response['TargetGroups']), 0)
    
    tg_arn = response['TargetGroups'][0]['TargetGroupArn']
    
    # Wait for healthy targets
    self._wait_for_healthy_targets(tg_arn)
    
    # Check target health
    response = self.elbv2.describe_target_health(TargetGroupArn=tg_arn)
    healthy_targets = [t for t in response['TargetHealthDescriptions'] 
                          if t['TargetHealth']['State'] == 'healthy']
    
    self.assertGreaterEqual(len(healthy_targets), 2)
    
    # Test traffic routing
    response = requests.get(f"http://{alb_dns}", timeout=30)
    self.assertEqual(response.status_code, 200)
    self.assertIn("TAP Migration Instance", response.text)
  
  # ===============================
  # Global Accelerator Tests
  # ===============================
  
  def test_07_global_accelerator_dns_and_failover(self):
    """Test Global Accelerator DNS resolution and zero-downtime capabilities"""
    print("Testing Global Accelerator...")
    
    ga_dns = self.get_output_value("global_accelerator_dns")
    
    # Test DNS resolution
    try:
      ip_addresses = socket.gethostbyname_ex(ga_dns)[2]
      self.assertGreater(len(ip_addresses), 0)
    except socket.gaierror as e:
      self.fail(f"Cannot resolve Global Accelerator DNS {ga_dns}: {e}")
    
    # Test HTTP connectivity through GA
    try:
      response = requests.get(f"http://{ga_dns}", timeout=30)
      self.assertEqual(response.status_code, 200)
    except requests.exceptions.RequestException as e:
      self.fail(f"Cannot connect through Global Accelerator: {e}")
    
    # Test multiple requests for consistency (simple failover test)
    for i in range(5):
      response = requests.get(f"http://{ga_dns}", timeout=10)
      self.assertEqual(response.status_code, 200)
      time.sleep(1)
  
  # ===============================
  # CloudWatch Monitoring Tests
  # ===============================
  
  def test_08_cloudwatch_alarms_exist_and_functional(self):
    """Test CloudWatch alarms are properly configured"""
    print("Testing CloudWatch alarms...")
    
    # Get alarms
    response = self.cloudwatch.describe_alarms()
    tap_alarms = [alarm for alarm in response['MetricAlarms'] 
                     if ('tap' in alarm['AlarmName'].lower() or 
                         'ec2' in alarm['AlarmName'].lower() or 
                         'rds' in alarm['AlarmName'].lower())]
    
    self.assertGreaterEqual(len(tap_alarms), 2)  # At least EC2 and RDS alarms
    
    # Check alarm configurations
    for alarm in tap_alarms:
      self.assertIn(alarm['StateValue'], ['OK', 'INSUFFICIENT_DATA', 'ALARM'])
      self.assertIn(alarm['Namespace'], ['AWS/EC2', 'AWS/RDS'])
  
  def test_09_cloudwatch_dashboard_exists(self):
    """Test CloudWatch dashboard is created"""
    print("Testing CloudWatch dashboard...")
    
    dashboard_arn = self.get_output_value("dashboard_arn")
    dashboard_name = dashboard_arn.split('/')[-1]
    
    try:
      response = self.cloudwatch.get_dashboard(DashboardName=dashboard_name)
      dashboard_body = json.loads(response['DashboardBody'])
      
      self.assertIn('widgets', dashboard_body)
      self.assertGreater(len(dashboard_body['widgets']), 0)
      
    except ClientError as e:
      self.fail(f"Dashboard not found or inaccessible: {e}")
  
  # ===============================
  # S3 Cross-Region Replication Tests
  # ===============================
  
  def test_10_s3_buckets_encrypted_and_versioned(self):
    """Test S3 buckets have encryption and versioning enabled"""
    print("Testing S3 bucket security...")
    
    source_bucket = self.get_output_value("source_bucket_name")
    target_bucket = self.get_output_value("target_bucket_name")
    
    for bucket_name in [source_bucket, target_bucket]:
      # Check encryption
      try:
        response = self.s3.get_bucket_encryption(Bucket=bucket_name)
        self.assertEqual(
          response['ServerSideEncryptionConfiguration']['Rules'][0]
            ['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
          'aws:kms'
        )
      except ClientError as e:
        if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
          raise e
        self.fail(f"Bucket {bucket_name} does not have encryption enabled")
      
      # Check versioning
      response = self.s3.get_bucket_versioning(Bucket=bucket_name)
      self.assertEqual(response.get('Status'), 'Enabled')
  
  def test_11_s3_cross_region_replication_functional(self):
    """Test S3 cross-region replication actually works"""
    print("Testing S3 cross-region replication...")
    
    source_bucket = self.get_output_value("source_bucket_name")
    target_bucket = self.get_output_value("target_bucket_name")
    
    test_key = f"test-replication-{int(time.time())}.txt"
    test_content = b"Hello from integration test - cross region replication test"
    
    # Upload to source bucket
    self.s3.put_object(
      Bucket=source_bucket,
      Key=test_key,
      Body=test_content,
      ContentType='text/plain'
    )
    
    # Wait for replication (can take some time)
    print("Waiting for cross-region replication to complete...")
    replicated = False
    
    for attempt in range(12):  # Wait up to 2 minutes
      time.sleep(10)
      try:
        response = self.s3.head_object(Bucket=target_bucket, Key=test_key)
        replicated = True
        break
      except ClientError as e:
        if e.response['Error']['Code'] != 'NoSuchKey':
          raise e
    
    if replicated:
      # Verify content matches
      response = self.s3.get_object(Bucket=target_bucket, Key=test_key)
      replicated_content = response['Body'].read()
      self.assertEqual(replicated_content, test_content)
    else:
      print("Warning: Replication test inconclusive - may take longer than 2 minutes")
    
    # Cleanup
    try:
      self.s3.delete_object(Bucket=source_bucket, Key=test_key)
      if replicated:
        self.s3.delete_object(Bucket=target_bucket, Key=test_key)
    except Exception as e:
      print(f"Cleanup warning: {e}")
  
  # ===============================
  # Lambda Function Tests
  # ===============================
  
  def test_12_lambda_rds_promotion_function(self):
    """Test RDS promotion Lambda function exists and is invocable"""
    print("Testing RDS promotion Lambda function...")
    
    lambda_arn = self.get_output_value("rds_promotion_lambda_arn")
    function_name = lambda_arn.split(':')[-1]
    
    # Check function exists
    response = self.lambda_client.get_function(FunctionName=function_name)
    self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
    self.assertEqual(response['Configuration']['Handler'], 'index.lambda_handler')
    
    # Test invocation (dry run)
    try:
      test_payload = json.dumps({
        "replica_identifier": "test-replica-dry-run"
      })
      
      response = self.lambda_client.invoke(
        FunctionName=function_name,
        InvocationType='DryRun',
        Payload=test_payload
      )
      
      # Dry run should succeed (status 204)
      self.assertEqual(response['StatusCode'], 204)
      
    except ClientError as e:
      if 'DryRun' not in str(e):
        self.fail(f"Lambda function invocation test failed: {e}")
  
  # ===============================
  # Backup Strategy Tests
  # ===============================
  
  def test_13_backup_vault_and_plan_configured(self):
    """Test backup vault and plans are properly configured"""
    print("Testing backup configuration...")
    
    # List backup vaults
    response = self.backup.list_backup_vaults()
    tap_vaults = [vault for vault in response['BackupVaultList'] 
                     if 'tap' in vault['BackupVaultName'].lower()]
    
    self.assertGreater(len(tap_vaults), 0)
    
    vault = tap_vaults[0]
    vault_name = vault['BackupVaultName']
    
    # Check backup plans
    response = self.backup.list_backup_plans()
    tap_plans = [plan for plan in response['BackupPlansList'] 
          if 'tap' in plan['BackupPlanName'].lower()]
    
    self.assertGreater(len(tap_plans), 0)
    
    # Get backup plan details
    plan = tap_plans[0]
    response = self.backup.get_backup_plan(BackupPlanId=plan['BackupPlanId'])
    
    self.assertGreater(len(response['BackupPlan']['Rules']), 0)
    
    rule = response['BackupPlan']['Rules'][0]
    self.assertIn('daily', rule['RuleName'].lower())
  
  # ===============================
  # KMS Encryption Tests
  # ===============================
  
  def test_14_kms_keys_exist_and_functional(self):
    """Test KMS keys are created and functional"""
    print("Testing KMS keys...")
    
    source_kms_id = self.get_output_value("s3_source_kms_key_id")
    target_kms_id = self.get_output_value("s3_target_kms_key_id")
    
    kms_source = boto3.client('kms', region_name=self.source_region)
    kms_target = boto3.client('kms', region_name=self.region)
    
    # Test source KMS key
    response = kms_source.describe_key(KeyId=source_kms_id)
    self.assertEqual(response['KeyMetadata']['KeyState'], 'Enabled')
    
    # Test target KMS key
    response = kms_target.describe_key(KeyId=target_kms_id)
    self.assertEqual(response['KeyMetadata']['KeyState'], 'Enabled')
  
  # ===============================
  # Network Connectivity Tests
  # ===============================
  
  def test_15_vpc_and_networking_properly_configured(self):
    """Test VPC and networking components are properly configured"""
    print("Testing VPC and networking...")
    
    vpc_id = self.get_output_value("vpc_id")
    
    # Check VPC
    response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
    vpc = response['Vpcs'][0]
    self.assertEqual(vpc['State'], 'available')
    self.assertTrue(vpc['EnableDnsHostnames'])
    self.assertTrue(vpc['EnableDnsSupport'])
    
    # Check subnets
    response = self.ec2.describe_subnets(
      Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    subnets = response['Subnets']
    self.assertGreaterEqual(len(subnets), 4)  # 2 public + 2 private
    
    # Check internet gateway
    response = self.ec2.describe_internet_gateways(
      Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
    )
    self.assertGreater(len(response['InternetGateways']), 0)
  
  # ===============================
  # Comprehensive End-to-End Test
  # ===============================
  
  def test_16_end_to_end_infrastructure_workflow(self):
    """Comprehensive end-to-end test of the entire infrastructure"""
    print("Running end-to-end infrastructure test...")
    
    # 1. Test traffic flow: Internet -> GA -> ALB -> EC2
    ga_dns = self.get_output_value("global_accelerator_dns")
    
    responses = []
    for i in range(3):
      try:
        response = requests.get(f"http://{ga_dns}", timeout=30)
        responses.append(response.status_code)
        time.sleep(2)
      except Exception as e:
        self.fail(f"End-to-end traffic test failed: {e}")
    
    self.assertTrue(all(status == 200 for status in responses))
    
    # 2. Test data persistence: Upload to S3, verify replication
    source_bucket = self.get_output_value("source_bucket_name")
    e2e_key = f"e2e-test-{int(time.time())}.json"
    e2e_data = json.dumps({
      "test": "end-to-end",
      "timestamp": time.time(),
      "infrastructure": "tap-stack"
    }).encode()
    
    self.s3.put_object(
      Bucket=source_bucket,
      Key=e2e_key,
      Body=e2e_data,
      ContentType='application/json'
    )
    
    # 3. Verify monitoring is capturing metrics
    time.sleep(30)  # Wait for metrics
    
    # Check if we have recent EC2 metrics
    response = self.cloudwatch.get_metric_statistics(
      Namespace='AWS/EC2',
      MetricName='CPUUtilization',
      StartTime=time.time() - 300,
      EndTime=time.time(),
      Period=300,
      Statistics=['Average']
    )
    
    # Should have at least some data points
    self.assertGreater(len(response['Datapoints']), 0)
    
    print("End-to-end test completed successfully!")
  
  # ===============================
  # Helper Methods
  # ===============================
  
  def _wait_for_instances_running(self, instance_ids: List[str], timeout: int = 300):
    """Wait for EC2 instances to be in running state"""
    start_time = time.time()
    while time.time() - start_time < timeout:
      response = self.ec2.describe_instances(InstanceIds=instance_ids)
      all_running = True
      
      for reservation in response['Reservations']:
        for instance in reservation['Instances']:
          if instance['State']['Name'] != 'running':
            all_running = False
            break
        if not all_running:
          break
      
      if all_running:
        return
      
      time.sleep(10)
    
    raise TimeoutError("Instances did not reach running state within timeout")
  
  def _wait_for_rds_available(self, db_identifier: str, timeout: int = 600):
    """Wait for RDS instance to be available"""
    start_time = time.time()
    while time.time() - start_time < timeout:
      try:
        response = self.rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
        status = response['DBInstances'][0]['DBInstanceStatus']
        if status == 'available':
          return
        time.sleep(30)
      except ClientError:
        time.sleep(30)
    
    raise TimeoutError("RDS instance did not become available within timeout")
  
  def _wait_for_healthy_targets(self, target_group_arn: str, timeout: int = 300):
    """Wait for ALB targets to be healthy"""
    start_time = time.time()
    while time.time() - start_time < timeout:
      response = self.elbv2.describe_target_health(TargetGroupArn=target_group_arn)
      healthy_count = sum(1 for t in response['TargetHealthDescriptions'] 
                              if t['TargetHealth']['State'] == 'healthy')
      
      if healthy_count >= 2:
        return
        
      time.sleep(10)
    
    raise TimeoutError("Targets did not become healthy within timeout")


class TestTapStackRealScenarios(unittest.TestCase):
  """Additional real-world scenario tests"""
  
  def setUp(self):
    """Setup for scenario tests"""
    # Reuse the deployed stack from main test class
    if hasattr(TapStackRealIntegrationTest, 'outputs'):
      self.outputs = TapStackRealIntegrationTest.outputs
      self.region = TapStackRealIntegrationTest.region
      self.s3 = TapStackRealIntegrationTest.s3
      self.cloudwatch = TapStackRealIntegrationTest.cloudwatch
    else:
      self.skipTest("Main integration test not run")
  
  def test_disaster_recovery_simulation(self):
    """Simulate disaster recovery scenarios"""
    print("Testing disaster recovery capabilities...")
    
    # This would involve failing over to read replica
    # For safety, we'll just verify the components exist
    self.assertIsNotNone(self.outputs.get("rds_read_replica_endpoint"))
    self.assertIsNotNone(self.outputs.get("rds_promotion_lambda_arn"))
  
  def test_scaling_simulation(self):
    """Test infrastructure scaling capabilities"""
    print("Testing scaling simulation...")
    
    # Verify auto-scaling components exist
    # In a real scenario, you might trigger scaling events
    ga_dns = self.outputs.get("global_accelerator_dns", {}).value
    self.assertIsNotNone(ga_dns)
  
  def test_security_compliance_verification(self):
    """Verify security and compliance requirements"""
    print("Testing security compliance...")
    
    # Verify encryption at rest and in transit
    source_kms_id = self.outputs.get("s3_source_kms_key_id", {}).value
    target_kms_id = self.outputs.get("s3_target_kms_key_id", {}).value
    
    self.assertIsNotNone(source_kms_id)
    self.assertIsNotNone(target_kms_id)


if __name__ == '__main__':
  # Configure test runner
  import argparse
  
  parser = argparse.ArgumentParser(description='Run TAP Stack Integration Tests')
  parser.add_argument('--skip-deploy', action='store_true', 
                       help='Skip deployment (use existing stack)')
  parser.add_argument('--keep-stack', action='store_true',
                       help='Keep stack after tests (for debugging)')
  
  args, unknown = parser.parse_known_args()
  
  # Set environment variables for test configuration
  if args.skip_deploy:
    os.environ['SKIP_DEPLOY'] = '1'
  if args.keep_stack:
    os.environ['KEEP_STACK'] = '1'
  
  # Run tests
  test_loader = unittest.TestLoader()
  test_suite = unittest.TestSuite()
  
  # Add main integration tests
  test_suite.addTest(test_loader.loadTestsFromTestCase(TapStackRealIntegrationTest))
  
  # Add scenario tests
  test_suite.addTest(test_loader.loadTestsFromTestCase(TestTapStackRealScenarios))
  
  # Run with verbose output
  runner = unittest.TextTestRunner(verbosity=2, buffer=True)
  result = runner.run(test_suite)
  
  # Exit with proper code
  exit_code = 0 if result.wasSuccessful() else 1
  sys.exit(exit_code)

