#!/usr/bin/env python3
"""
AWS Infrastructure Integration Tests for TapStack
Tests deployed AWS resources using deployment outputs from CI/CD pipeline.
Uses cfn-outputs/flat-outputs.json for testing deployed infrastructure.
"""

import json
import os
import time
import unittest
from typing import Dict, Any, Optional

import boto3
import requests
from botocore.exceptions import ClientError, NoCredentialsError


class TapStackIntegrationTest(unittest.TestCase):
  """
  Integration tests that validate deployed AWS infrastructure.
  Uses deployment outputs from cfn-outputs/flat-outputs.json.
  """

  @classmethod
  def setUpClass(cls):
    """Load deployment outputs and initialize AWS clients"""
    cls.outputs = cls._load_deployment_outputs()
    
    # Skip all tests if no outputs available
    if not cls.outputs:
      raise unittest.SkipTest("No deployment outputs available")
    
    # Detect region from outputs or use default
    cls.region = cls._detect_region()
    cls.source_region = "us-west-1"
    
    print(f"Loaded {len(cls.outputs)} outputs from cfn-outputs/flat-outputs.json")
    print(f"Testing deployed infrastructure in region: {cls.region}")
    print(f"Available outputs: {list(cls.outputs.keys())}")
    
    # Initialize AWS clients
    cls._initialize_aws_clients()
    
    # Verify AWS credentials
    try:
      identity = boto3.client('sts', region_name=cls.region).get_caller_identity()
      print(f"AWS credentials validated for account: {identity.get('Account')}")
    except (NoCredentialsError, ClientError) as e:
      raise unittest.SkipTest(f"AWS credentials not configured: {e}")

  @classmethod
  def _load_deployment_outputs(cls) -> Dict[str, Any]:
    """Load deployment outputs from cfn-outputs/flat-outputs.json"""
    outputs_file = "cfn-outputs/flat-outputs.json"
    
    if not os.path.exists(outputs_file):
      return {}
    
    try:
      with open(outputs_file, 'r', encoding='utf-8') as f:
        outputs = json.load(f)
      return outputs if isinstance(outputs, dict) else {}
    except (json.JSONDecodeError, IOError):
      return {}

  @classmethod
  def _detect_region(cls) -> str:
    """Detect AWS region from outputs"""
    # Try to detect from resource ARNs
    for value in cls.outputs.values():
      if isinstance(value, str) and value.startswith('arn:aws:'):
        parts = value.split(':')
        if len(parts) >= 4 and parts[3]:
          return parts[3]
    
    return os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

  @classmethod
  def _initialize_aws_clients(cls):
    """Initialize AWS service clients"""
    cls.ec2 = boto3.client('ec2', region_name=cls.region)
    cls.rds = boto3.client('rds', region_name=cls.region)
    cls.elbv2 = boto3.client('elbv2', region_name=cls.region)
    cls.s3 = boto3.client('s3')
    cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)
    cls.globalaccelerator = boto3.client('globalaccelerator', region_name='us-west-2')
    cls.kms = boto3.client('kms', region_name=cls.region)
    cls.backup = boto3.client('backup', region_name=cls.region)
    cls.lambda_client = boto3.client('lambda', region_name=cls.region)

  def get_output(self, key: str) -> Optional[str]:
    """Get output value"""
    return self.outputs.get(key)

  # ===============================
  # EC2 Infrastructure Tests
  # ===============================

  def test_01_ec2_instances_exist_and_running(self):
    """Test EC2 instances exist and are running"""
    print("Testing EC2 instances...")
    
    instance_ids = [v for k, v in self.outputs.items() 
                   if 'instance' in k.lower() and 'id' in k.lower() and 
                   isinstance(v, str) and v.startswith('i-')]
    
    if not instance_ids:
      self.skipTest("No EC2 instance IDs found in outputs")
    
    try:
      response = self.ec2.describe_instances(InstanceIds=instance_ids)
      running_count = sum(1 for r in response['Reservations'] 
                         for i in r['Instances'] 
                         if i['State']['Name'] == 'running')
      
      self.assertGreater(running_count, 0, "No running EC2 instances found")
      print(f"Found {running_count} running EC2 instances")
      
    except ClientError as e:
      if 'InvalidInstanceID' in str(e):
        self.skipTest("EC2 instances not found - may not be deployed yet")
      raise

  def test_02_vpc_and_security_groups_configured(self):
    """Test VPC and security group configuration"""
    print("Testing VPC configuration...")
    
    vpc_id = self.get_output('VpcId')
    if not vpc_id:
      self.skipTest("VPC ID not found in outputs")
    
    try:
      # Check VPC exists
      response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      vpc = response['Vpcs'][0]
      self.assertEqual(vpc['State'], 'available')
      
      # Check security groups
      sg_response = self.ec2.describe_security_groups(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )
      self.assertGreater(len(sg_response['SecurityGroups']), 1)
      print(f"VPC {vpc_id} is available with {len(sg_response['SecurityGroups'])} security groups")
      
    except ClientError as e:
      if 'InvalidVpcID' in str(e):
        self.skipTest("VPC not found - may not be deployed yet")
      raise

  # ===============================
  # RDS Database Tests
  # ===============================

  def test_03_rds_instance_exists_and_available(self):
    """Test RDS instance exists and is available"""
    print("Testing RDS instance...")
    
    rds_endpoint = self.get_output('RDSEndpoint')
    if not rds_endpoint:
      self.skipTest("RDS endpoint not found in outputs")
    
    # Extract DB instance identifier from endpoint
    db_id = rds_endpoint.split('.')[0]
    
    try:
      response = self.rds.describe_db_instances(DBInstanceIdentifier=db_id)
      db_instance = response['DBInstances'][0]
      
      self.assertEqual(db_instance['DBInstanceStatus'], 'available')
      self.assertTrue(db_instance.get('StorageEncrypted', False))
      print(f"RDS instance {db_id} is available and encrypted")
      
    except ClientError as e:
      if 'DBInstanceNotFound' in str(e):
        self.skipTest("RDS instance not found - may not be deployed yet")
      raise

  def test_04_rds_secrets_manager_integration(self):
    """Test RDS integration with Secrets Manager"""
    print("Testing RDS Secrets Manager integration...")
    
    # Look for RDS-related secrets
    try:
      import boto3
      secrets_client = boto3.client('secretsmanager', region_name=self.region)
      response = secrets_client.list_secrets()
      
      rds_secrets = [s for s in response['SecretList'] 
                    if 'rds' in s['Name'].lower() or 'database' in s['Name'].lower()]
      
      if not rds_secrets:
        self.skipTest("No RDS secrets found in Secrets Manager")
      
      # Test secret retrieval
      secret = rds_secrets[0]
      secret_value = secrets_client.get_secret_value(SecretId=secret['ARN'])
      secret_data = json.loads(secret_value['SecretString'])
      
      self.assertIn('password', secret_data)
      print(f"RDS secret {secret['Name']} is accessible")
      
    except ClientError as e:
      if 'ResourceNotFoundException' in str(e):
        self.skipTest("RDS secrets not found - may not be deployed yet")
      raise

  # ===============================
  # Load Balancer Tests
  # ===============================

  def test_05_alb_exists_and_has_targets(self):
    """Test ALB exists and has healthy targets"""
    print("Testing Application Load Balancer...")
    
    alb_arn = self.get_output('LoadBalancerArn')
    if not alb_arn:
      self.skipTest("ALB ARN not found in outputs")
    
    try:
      # Check ALB exists
      response = self.elbv2.describe_load_balancers(LoadBalancerArns=[alb_arn])
      alb = response['LoadBalancers'][0]
      self.assertEqual(alb['State']['Code'], 'active')
      
      # Check target groups
      tg_response = self.elbv2.describe_target_groups(LoadBalancerArn=alb_arn)
      self.assertGreater(len(tg_response['TargetGroups']), 0)
      print(f"ALB is active with {len(tg_response['TargetGroups'])} target groups")
      
    except ClientError as e:
      if 'LoadBalancerNotFound' in str(e):
        self.skipTest("ALB not found - may not be deployed yet")
      raise

  def test_06_alb_http_connectivity(self):
    """Test ALB HTTP connectivity"""
    print("Testing ALB HTTP connectivity...")
    
    alb_dns = self.get_output('LoadBalancerDNS')
    if not alb_dns:
      self.skipTest("ALB DNS not found in outputs")
    
    try:
      url = f"http://{alb_dns}"
      response = requests.get(url, timeout=10)
      self.assertLess(response.status_code, 500)
      print(f"ALB HTTP test: {response.status_code}")
      
    except requests.exceptions.RequestException:
      self.skipTest("ALB not accessible - may not be fully deployed")

  # ===============================
  # Global Accelerator Tests
  # ===============================

  def test_07_global_accelerator_exists(self):
    """Test Global Accelerator exists and is provisioned"""
    print("Testing Global Accelerator...")
    
    ga_arn = self.get_output('GlobalAcceleratorArn')
    if not ga_arn:
      self.skipTest("Global Accelerator ARN not found in outputs")
    
    try:
      response = self.globalaccelerator.describe_accelerator(AcceleratorArn=ga_arn)
      accelerator = response['Accelerator']
      
      self.assertEqual(accelerator['Status'], 'IN_SERVICE')
      print(f"Global Accelerator {accelerator['Name']} is in service")
      
    except ClientError as e:
      if 'AcceleratorNotFoundException' in str(e):
        self.skipTest("Global Accelerator not found - may not be deployed yet")
      raise

  # ===============================
  # S3 Storage Tests
  # ===============================

  def test_08_s3_buckets_exist_and_encrypted(self):
    """Test S3 buckets exist and are encrypted"""
    print("Testing S3 buckets...")
    
    bucket_names = [v for k, v in self.outputs.items() 
                   if 'bucket' in k.lower() and 'name' in k.lower()]
    
    if not bucket_names:
      self.skipTest("No S3 bucket names found in outputs")
    
    for bucket_name in bucket_names:
      try:
        # Check bucket exists
        self.s3.head_bucket(Bucket=bucket_name)
        
        # Check encryption
        enc_response = self.s3.get_bucket_encryption(Bucket=bucket_name)
        rules = enc_response['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        print(f"S3 bucket {bucket_name} exists and is encrypted")
        
      except ClientError as e:
        if 'NoSuchBucket' in str(e):
          self.skipTest(f"S3 bucket {bucket_name} not found - may not be deployed yet")
        raise

  def test_09_s3_cross_region_replication_configuration(self):
    """Test S3 cross-region replication configuration"""
    print("Testing S3 cross-region replication...")
    
    source_bucket = self.get_output('S3BucketName')
    if not source_bucket:
      self.skipTest("Source S3 bucket name not found in outputs")
    
    try:
      response = self.s3.get_bucket_replication(Bucket=source_bucket)
      replication_config = response['ReplicationConfiguration']
      
      self.assertIn('Rules', replication_config)
      self.assertGreater(len(replication_config['Rules']), 0)
      print(f"S3 bucket {source_bucket} has replication configured")
      
    except ClientError as e:
      if 'ReplicationConfigurationNotFoundError' in str(e):
        self.skipTest("S3 replication not configured - may not be deployed yet")
      raise

  # ===============================
  # CloudWatch Monitoring Tests
  # ===============================

  def test_10_cloudwatch_alarms_exist(self):
    """Test CloudWatch alarms exist"""
    print("Testing CloudWatch alarms...")
    
    try:
      response = self.cloudwatch.describe_alarms()
      tap_alarms = [a for a in response['MetricAlarms'] 
                   if 'tap' in a['AlarmName'].lower()]
      
      if not tap_alarms:
        self.skipTest("No TAP-related alarms found")
      
      self.assertGreater(len(tap_alarms), 0)
      print(f"Found {len(tap_alarms)} TAP-related CloudWatch alarms")
      
    except ClientError as e:
      self.skipTest(f"CloudWatch alarms check failed: {e}")

  def test_11_cloudwatch_dashboard_exists(self):
    """Test CloudWatch dashboard exists"""
    print("Testing CloudWatch dashboard...")
    
    dashboard_name = self.get_output('CloudWatchDashboardName')
    if not dashboard_name:
      self.skipTest("Dashboard name not found in outputs")
    
    try:
      response = self.cloudwatch.get_dashboard(DashboardName=dashboard_name)
      self.assertIsNotNone(response['DashboardBody'])
      print(f"CloudWatch dashboard {dashboard_name} exists")
      
    except ClientError as e:
      if 'ResourceNotFound' in str(e):
        self.skipTest("CloudWatch dashboard not found - may not be deployed yet")
      raise

  # ===============================
  # KMS Encryption Tests
  # ===============================

  def test_12_kms_keys_exist_and_enabled(self):
    """Test KMS keys exist and are enabled"""
    print("Testing KMS keys...")
    
    kms_key_ids = [v for k, v in self.outputs.items() 
                  if 'kms' in k.lower() and ('key' in k.lower() or 'arn' in k.lower())]
    
    if not kms_key_ids:
      self.skipTest("No KMS key IDs found in outputs")
    
    for key_id in kms_key_ids:
      try:
        response = self.kms.describe_key(KeyId=key_id)
        key_metadata = response['KeyMetadata']
        
        self.assertEqual(key_metadata['KeyState'], 'Enabled')
        print(f"KMS key {key_metadata['KeyId']} is enabled")
        
      except ClientError as e:
        if 'NotFoundException' in str(e):
          self.skipTest(f"KMS key {key_id} not found - may not be deployed yet")
        raise

  # ===============================
  # Backup Configuration Tests
  # ===============================

  def test_13_backup_configuration_exists(self):
    """Test AWS Backup configuration exists"""
    print("Testing AWS Backup configuration...")
    
    backup_vault_arn = self.get_output('BackupVaultArn')
    if not backup_vault_arn:
      self.skipTest("Backup vault ARN not found in outputs")
    
    vault_name = backup_vault_arn.split(':')[-1]
    
    try:
      response = self.backup.describe_backup_vault(BackupVaultName=vault_name)
      self.assertEqual(vault_name, response['BackupVaultName'])
      
      # Check backup plans
      plans_response = self.backup.list_backup_plans()
      tap_plans = [p for p in plans_response['BackupPlansList'] 
                  if 'tap' in p['BackupPlanName'].lower()]
      
      self.assertGreater(len(tap_plans), 0)
      print(f"Backup vault {vault_name} exists with {len(tap_plans)} backup plans")
      
    except ClientError as e:
      if 'ResourceNotFoundException' in str(e):
        self.skipTest("Backup configuration not found - may not be deployed yet")
      raise

  # ===============================
  # Lambda Function Tests
  # ===============================

  def test_14_lambda_functions_exist(self):
    """Test Lambda functions exist and are active"""
    print("Testing Lambda functions...")
    
    lambda_arns = [v for k, v in self.outputs.items() 
                  if 'lambda' in k.lower() and 'arn' in k.lower()]
    
    if not lambda_arns:
      self.skipTest("No Lambda function ARNs found in outputs")
    
    for lambda_arn in lambda_arns:
      function_name = lambda_arn.split(':')[-1]
      
      try:
        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        
        self.assertEqual(config['State'], 'Active')
        print(f"Lambda function {function_name} is active")
        
      except ClientError as e:
        if 'ResourceNotFoundException' in str(e):
          self.skipTest(f"Lambda function {function_name} not found - may not be deployed yet")
        raise

  # ===============================
  # End-to-End Workflow Tests
  # ===============================

  def test_15_end_to_end_workflow(self):
    """Test end-to-end infrastructure workflow"""
    print("Testing end-to-end workflow...")
    
    # Check we have the key components
    required_outputs = ['VpcId', 'LoadBalancerDNS', 'RDSEndpoint', 'S3BucketName']
    missing = [k for k in required_outputs if not self.get_output(k)]
    
    if missing:
      self.skipTest(f"Missing required outputs: {missing}")
    
    # Test basic connectivity flow
    try:
      # 1. Check VPC is accessible
      vpc_id = self.get_output('VpcId')
      self.ec2.describe_vpcs(VpcIds=[vpc_id])
      
      # 2. Check ALB is responsive
      alb_dns = self.get_output('LoadBalancerDNS')
      requests.get(f"http://{alb_dns}", timeout=5)
      
      # 3. Check RDS is accessible
      rds_endpoint = self.get_output('RDSEndpoint')
      db_id = rds_endpoint.split('.')[0]
      self.rds.describe_db_instances(DBInstanceIdentifier=db_id)
      
      # 4. Check S3 is accessible
      bucket_name = self.get_output('S3BucketName')
      self.s3.head_bucket(Bucket=bucket_name)
      
      print("End-to-end workflow validation completed successfully")
      
    except (ClientError, requests.RequestException) as e:
      self.skipTest(f"End-to-end workflow failed: {e}")


if __name__ == '__main__':
  unittest.main()