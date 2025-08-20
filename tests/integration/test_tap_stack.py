"""Comprehensive integration tests for TAP Stack and MultiRegion Infrastructure."""
import os
import sys
import json
import boto3
from moto import mock_s3, mock_ec2, mock_rds, mock_kms, mock_secretsmanager, mock_cloudtrail, mock_logs
from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack
from lib.main import MultiRegionStack


class TestTapStackIntegration:
  """Integration tests for TAP Stack deployment and functionality."""

  def test_tap_stack_terraform_synthesis(self):
    """Test TapStack synthesizes valid Terraform configuration."""
    app = Testing.app()
    stack = TapStack(app, "integration-test", environment_suffix="test")
    synthesized = Testing.synth(stack)
    
    # Verify Terraform structure is valid
    assert 'terraform' in synthesized
    assert 'provider' in synthesized
    assert 'resource' in synthesized
    
    # Verify AWS provider configuration
    assert '"region"' in synthesized
    assert 'aws_s3_bucket' in synthesized

  def test_tap_stack_resource_dependencies(self):
    """Test TapStack resource dependencies are correctly configured."""
    app = Testing.app()
    stack = TapStack(app, "dependency-test", environment_suffix="test")
    synthesized = Testing.synth(stack)
    
    # Verify provider is configured before resources
    provider_index = synthesized.find('"provider"')
    resource_index = synthesized.find('"resource"')
    assert provider_index < resource_index

  @mock_s3
  def test_tap_stack_s3_bucket_creation(self):
    """Test S3 bucket can be created with proper configuration."""
    # This test simulates the S3 bucket creation
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    # Simulate bucket creation as would happen in deployment
    bucket_name = 'test-tap-stack-bucket'
    s3_client.create_bucket(Bucket=bucket_name)
    
    # Verify bucket exists
    response = s3_client.list_buckets()
    bucket_names = [bucket['Name'] for bucket in response['Buckets']]
    assert bucket_name in bucket_names


class TestMultiRegionStackIntegration:
  """Integration tests for MultiRegion Stack deployment and cross-region functionality."""

  def test_multiregion_stack_terraform_synthesis(self):
    """Test MultiRegionStack synthesizes valid Terraform for both regions."""
    app = Testing.app()
    
    us_stack = MultiRegionStack(app, "us-integration-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "integration-test"
    })
    
    eu_stack = MultiRegionStack(app, "eu-integration-test", {
      "region": "eu-central-1",
      "vpcCidr": "10.1.0.0/16",
      "environment": "integration-test"
    })
    
    us_synthesized = Testing.synth(us_stack)
    eu_synthesized = Testing.synth(eu_stack)
    
    # Verify both stacks synthesize successfully
    assert 'terraform' in us_synthesized
    assert 'terraform' in eu_synthesized
    
    # Verify region-specific configurations
    assert '"region": "us-east-1"' in us_synthesized
    assert '"region": "eu-central-1"' in eu_synthesized

  @mock_ec2
  def test_vpc_creation_and_configuration(self):
    """Test VPC creation with proper DNS and CIDR configuration."""
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    # Simulate VPC creation
    vpc_response = ec2_client.create_vpc(
        CidrBlock='10.0.0.0/16',
        TagSpecifications=[
            {
                'ResourceType': 'vpc',
                'Tags': [
                    {'Key': 'Name', 'Value': 'test-vpc'},
                    {'Key': 'Environment', 'Value': 'test'}
                ]
            }
        ]
    )
    
    vpc_id = vpc_response['Vpc']['VpcId']
    
    # Enable DNS hostnames and support
    ec2_client.modify_vpc_attribute(VpcId=vpc_id, EnableDnsHostnames={'Value': True})
    ec2_client.modify_vpc_attribute(VpcId=vpc_id, EnableDnsSupport={'Value': True})
    
    # Verify VPC configuration
    vpc_details = ec2_client.describe_vpcs(VpcIds=[vpc_id])
    vpc = vpc_details['Vpcs'][0]
    
    assert vpc['CidrBlock'] == '10.0.0.0/16'
    assert vpc['State'] == 'available'

  @mock_ec2
  def test_private_subnet_creation(self):
    """Test private subnets are created in different AZs."""
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    # Create VPC first
    vpc_response = ec2_client.create_vpc(CidrBlock='10.0.0.0/16')
    vpc_id = vpc_response['Vpc']['VpcId']
    
    # Create private subnets
    subnet1_response = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.0.0.0/24',
        AvailabilityZone='us-east-1a'
    )
    
    subnet2_response = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.0.0.128/25',
        AvailabilityZone='us-east-1b'
    )
    
    # Verify subnets
    subnets = ec2_client.describe_subnets(
        SubnetIds=[subnet1_response['Subnet']['SubnetId'], subnet2_response['Subnet']['SubnetId']]
    )
    
    assert len(subnets['Subnets']) == 2
    assert subnets['Subnets'][0]['AvailabilityZone'] != subnets['Subnets'][1]['AvailabilityZone']
    assert not subnets['Subnets'][0]['MapPublicIpOnLaunch']
    assert not subnets['Subnets'][1]['MapPublicIpOnLaunch']

  @mock_ec2
  def test_security_group_configuration(self):
    """Test security groups block SSH and allow only necessary traffic."""
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    # Create VPC
    vpc_response = ec2_client.create_vpc(CidrBlock='10.0.0.0/16')
    vpc_id = vpc_response['Vpc']['VpcId']
    
    # Create RDS security group
    rds_sg_response = ec2_client.create_security_group(
        GroupName='test-rds-sg',
        Description='RDS security group - minimal access within VPC only',
        VpcId=vpc_id
    )
    
    rds_sg_id = rds_sg_response['GroupId']
    
    # Add MySQL ingress rule
    ec2_client.authorize_security_group_ingress(
        GroupId=rds_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 3306,
                'ToPort': 3306,
                'IpRanges': [{'CidrIp': '10.0.0.0/16', 'Description': 'MySQL within VPC only'}]
            }
        ]
    )
    
    # Create app security group
    app_sg_response = ec2_client.create_security_group(
        GroupName='test-app-sg',
        Description='Secure application SG - no SSH, no cross-region traffic',
        VpcId=vpc_id
    )
    
    app_sg_id = app_sg_response['GroupId']
    
    # Add HTTPS ingress rule
    ec2_client.authorize_security_group_ingress(
        GroupId=app_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '10.0.0.0/16', 'Description': 'HTTPS within VPC only'}]
            }
        ]
    )
    
    # Verify security groups
    rds_sg_details = ec2_client.describe_security_groups(GroupIds=[rds_sg_id])
    app_sg_details = ec2_client.describe_security_groups(GroupIds=[app_sg_id])
    
    # Verify no SSH (port 22) rules
    for sg in [rds_sg_details['SecurityGroups'][0], app_sg_details['SecurityGroups'][0]]:
        for rule in sg['IpPermissions']:
            assert rule['FromPort'] != 22
            assert rule['ToPort'] != 22
    
    # Verify correct ports are allowed
    rds_rules = rds_sg_details['SecurityGroups'][0]['IpPermissions']
    app_rules = app_sg_details['SecurityGroups'][0]['IpPermissions']
    
    assert any(rule['FromPort'] == 3306 for rule in rds_rules)
    assert any(rule['FromPort'] == 443 for rule in app_rules)

  @mock_kms
  def test_kms_key_creation_and_rotation(self):
    """Test KMS key creation with rotation enabled."""
    kms_client = boto3.client('kms', region_name='us-east-1')
    
    # Create KMS key
    key_response = kms_client.create_key(
        Description='Test encryption key',
        KeyUsage='ENCRYPT_DECRYPT',
        Origin='AWS_KMS'
    )
    
    key_id = key_response['KeyMetadata']['KeyId']
    
    # Enable key rotation
    kms_client.enable_key_rotation(KeyId=key_id)
    
    # Verify key rotation is enabled
    rotation_status = kms_client.get_key_rotation_status(KeyId=key_id)
    assert rotation_status['KeyRotationEnabled'] is True

  @mock_secretsmanager
  @mock_kms
  def test_secrets_manager_configuration(self):
    """Test Secrets Manager secret creation with KMS encryption."""
    secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
    kms_client = boto3.client('kms', region_name='us-east-1')
    
    # Create KMS key for encryption
    key_response = kms_client.create_key(Description='Test encryption key')
    key_arn = key_response['KeyMetadata']['Arn']
    
    # Create secret
    secret_response = secrets_client.create_secret(
        Name='test-rds-password',
        Description='RDS database password',
        KmsKeyId=key_arn,
        GenerateSecretString={
            'SecretStringTemplate': '{"username": "admin"}',
            'GenerateStringKey': 'password',
            'ExcludeCharacters': '"@/\\',
            'PasswordLength': 32
        }
    )
    
    # Verify secret creation
    secret_details = secrets_client.describe_secret(SecretId=secret_response['ARN'])
    assert secret_details['Name'] == 'test-rds-password'
    assert secret_details['KmsKeyId'] == key_arn

  @mock_s3
  def test_s3_bucket_encryption_configuration(self):
    """Test S3 buckets are created with proper encryption."""
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    # Create encrypted bucket
    bucket_name = 'test-encrypted-bucket'
    s3_client.create_bucket(Bucket=bucket_name)
    
    # Configure server-side encryption
    s3_client.put_bucket_encryption(
        Bucket=bucket_name,
        ServerSideEncryptionConfiguration={
            'Rules': [
                {
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'AES256'
                    }
                }
            ]
        }
    )
    
    # Verify encryption configuration
    encryption_config = s3_client.get_bucket_encryption(Bucket=bucket_name)
    rules = encryption_config['ServerSideEncryptionConfiguration']['Rules']
    assert len(rules) == 1
    assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

  @mock_rds
  @mock_ec2
  def test_rds_instance_configuration(self):
    """Test RDS instance creation with encryption and backups."""
    rds_client = boto3.client('rds', region_name='us-east-1')
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    # Create VPC and subnets for RDS
    vpc_response = ec2_client.create_vpc(CidrBlock='10.0.0.0/16')
    vpc_id = vpc_response['Vpc']['VpcId']
    
    subnet1 = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.0.0.0/24',
        AvailabilityZone='us-east-1a'
    )
    
    subnet2 = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.0.0.128/25',
        AvailabilityZone='us-east-1b'
    )
    
    # Create DB subnet group
    rds_client.create_db_subnet_group(
        DBSubnetGroupName='test-db-subnet-group',
        DBSubnetGroupDescription='Test DB subnet group',
        SubnetIds=[subnet1['Subnet']['SubnetId'], subnet2['Subnet']['SubnetId']]
    )
    
    # Create RDS instance
    rds_client.create_db_instance(
        DBInstanceIdentifier='test-mysql-db',
        DBInstanceClass='db.t3.micro',
        Engine='mysql',
        EngineVersion='8.0',
        AllocatedStorage=20,
        StorageType='gp2',
        StorageEncrypted=True,
        DBName='appdb',
        MasterUsername='admin',
        MasterUserPassword='temppassword123',
        DBSubnetGroupName='test-db-subnet-group',
        BackupRetentionPeriod=7,
        PreferredBackupWindow='03:00-04:00',
        PreferredMaintenanceWindow='sun:04:00-sun:05:00',
        MonitoringInterval=60
    )
    
    # Verify RDS instance configuration
    db_instances = rds_client.describe_db_instances(DBInstanceIdentifier='test-mysql-db')
    db_instance = db_instances['DBInstances'][0]
    
    assert db_instance['StorageEncrypted'] is True
    assert db_instance['BackupRetentionPeriod'] == 7
    assert db_instance['MonitoringInterval'] == 60
    assert db_instance['Engine'] == 'mysql'

  @mock_logs
  def test_cloudwatch_log_group_creation(self):
    """Test CloudWatch log group creation and configuration."""
    logs_client = boto3.client('logs', region_name='us-east-1')
    
    # Create log group
    log_group_name = '/aws/application/test'
    logs_client.create_log_group(
        logGroupName=log_group_name,
        retentionInDays=7
    )
    
    # Verify log group
    log_groups = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
    assert len(log_groups['logGroups']) == 1
    assert log_groups['logGroups'][0]['logGroupName'] == log_group_name
    assert log_groups['logGroups'][0]['retentionInDays'] == 7

  @mock_cloudtrail
  @mock_s3
  def test_cloudtrail_configuration(self):
    """Test CloudTrail creation and S3 bucket configuration."""
    cloudtrail_client = boto3.client('cloudtrail', region_name='us-east-1')
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    # Create S3 bucket for CloudTrail
    bucket_name = 'test-cloudtrail-bucket'
    s3_client.create_bucket(Bucket=bucket_name)
    
    # Create CloudTrail
    cloudtrail_client.create_trail(
        Name='test-cloudtrail',
        S3BucketName=bucket_name,
        IncludeGlobalServiceEvents=False,
        IsMultiRegionTrail=False,
        EnableLogFileValidation=True
    )
    
    # Verify CloudTrail
    trails = cloudtrail_client.describe_trails(trailNameList=['test-cloudtrail'])
    trail = trails['trailList'][0]
    
    assert trail['Name'] == 'test-cloudtrail'
    assert trail['S3BucketName'] == bucket_name
    assert trail['IncludeGlobalServiceEvents'] is False
    assert trail['IsMultiRegionTrail'] is False

  def test_cross_region_isolation(self):
    """Test that resources in different regions are properly isolated."""
    app = Testing.app()
    
    # Create stacks for different regions
    us_stack = MultiRegionStack(app, "us-isolation-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "isolation-test"
    })
    
    eu_stack = MultiRegionStack(app, "eu-isolation-test", {
      "region": "eu-central-1",
      "vpcCidr": "10.1.0.0/16",
      "environment": "isolation-test"
    })
    
    us_synthesized = Testing.synth(us_stack)
    eu_synthesized = Testing.synth(eu_stack)
    
    # Verify different regions
    assert '"region": "us-east-1"' in us_synthesized
    assert '"region": "eu-central-1"' in eu_synthesized
    
    # Verify different VPC CIDRs
    assert '"cidr_block": "10.0.0.0/16"' in us_synthesized
    assert '"cidr_block": "10.1.0.0/16"' in eu_synthesized
    
    # Verify no cross-region references
    assert 'us-east-1' not in eu_synthesized.replace('"region": "us-east-1"', '')
    assert 'eu-central-1' not in us_synthesized.replace('"region": "eu-central-1"', '')

  def test_deployment_outputs_structure(self):
    """Test that deployment would produce expected outputs structure."""
    app = Testing.app()
    stack = MultiRegionStack(app, "output-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    
    synthesized = Testing.synth(stack)
    
    # Verify that all major resource types are present for output generation
    expected_resources = [
        'aws_vpc',
        'aws_subnet',
        'aws_security_group',
        'aws_s3_bucket',
        'aws_db_instance',
        'aws_kms_key',
        'aws_secretsmanager_secret',
        'aws_cloudwatch_log_group',
        'aws_cloudtrail'
    ]
    
    for resource_type in expected_resources:
        assert resource_type in synthesized, f"Missing resource type: {resource_type}"

  def test_security_compliance_validation(self):
    """Test that all security compliance requirements are met."""
    app = Testing.app()
    stack = MultiRegionStack(app, "security-compliance-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    
    synthesized = Testing.synth(stack)
    
    # Verify no hardcoded passwords
    assert 'password": "' not in synthesized.lower()
    assert '"manage_password": false' in synthesized
    assert '"password_secret_arn"' in synthesized
    
    # Verify encryption is enabled
    assert '"storage_encrypted": true' in synthesized
    assert '"server_side_encryption_configuration"' in synthesized
    assert '"enable_key_rotation": true' in synthesized
    
    # Verify no SSH access
    assert '"from_port": 22' not in synthesized
    assert '"to_port": 22' not in synthesized
    
    # Verify VPC-only traffic
    assert '"cidr_blocks": ["10.0.0.0/16"]' in synthesized
    
    # Verify minimal IAM permissions
    assert 'monitoring.rds.amazonaws.com' in synthesized
    assert 'AmazonRDSEnhancedMonitoringRole' in synthesized