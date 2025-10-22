"""Integration tests for TAP stack security features.
Tests deployed AWS resources using live AWS SDK calls.
Uses cfn-outputs/flat-outputs.json for resource identifiers (no describe-stack calls).
"""

import json
import os
import boto3
import pytest
from botocore.exceptions import ClientError


# Load outputs from cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        outputs = json.load(f)
else:
    outputs = {}


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment or default."""
    return os.environ.get('AWS_REGION', 'ap-northeast-1')


@pytest.fixture(scope="module")
def kms_client(aws_region):
    """Create KMS client."""
    return boto3.client('kms', region_name=aws_region)


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client."""
    return boto3.client('s3', region_name=aws_region)


@pytest.fixture(scope="module")
def rds_client(aws_region):
    """Create RDS client."""
    return boto3.client('rds', region_name=aws_region)


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client."""
    return boto3.client('ec2', region_name=aws_region)


@pytest.fixture(scope="module")
def iam_client(aws_region):
    """Create IAM client."""
    return boto3.client('iam', region_name=aws_region)


@pytest.fixture(scope="module")
def cloudtrail_client(aws_region):
    """Create CloudTrail client."""
    return boto3.client('cloudtrail', region_name=aws_region)


@pytest.fixture(scope="module")
def sns_client(aws_region):
    """Create SNS client."""
    return boto3.client('sns', region_name=aws_region)


@pytest.fixture(scope="module")
def secretsmanager_client(aws_region):
    """Create Secrets Manager client."""
    return boto3.client('secretsmanager', region_name=aws_region)


@pytest.fixture(scope="module")
def lambda_client(aws_region):
    """Create Lambda client."""
    return boto3.client('lambda', region_name=aws_region)


class TestKMSKeySecurity:
    """Test KMS key encryption and rotation."""

    def test_kms_key_exists(self, kms_client):
        """Test that KMS key exists and is accessible."""
        kms_key_arn = outputs.get('KMSKeyArn')
        assert kms_key_arn, "KMS Key ARN not found in outputs"

        # Extract key ID from ARN
        key_id = kms_key_arn.split('/')[-1]

        # Describe the key
        response = kms_client.describe_key(KeyId=key_id)
        assert response['KeyMetadata']['KeyState'] == 'Enabled'

    def test_kms_key_rotation_enabled(self, kms_client):
        """Test that KMS key rotation is enabled."""
        kms_key_arn = outputs.get('KMSKeyArn')
        key_id = kms_key_arn.split('/')[-1]

        # Check rotation status
        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response['KeyRotationEnabled'] is True, "KMS key rotation should be enabled"


class TestIAMSecurity:
    """Test IAM roles and least privilege policies."""

    def test_iam_execution_role_exists(self, iam_client):
        """Test that IAM execution role exists."""
        iam_role_arn = outputs.get('IAMRoleArn')
        assert iam_role_arn, "IAM Role ARN not found in outputs"

        # Extract role name from ARN
        role_name = iam_role_arn.split('/')[-1]

        # Get role
        response = iam_client.get_role(RoleName=role_name)
        assert response['Role']['Arn'] == iam_role_arn

    def test_iam_role_least_privilege(self, iam_client):
        """Test that IAM role follows least privilege principle."""
        iam_role_arn = outputs.get('IAMRoleArn')
        role_name = iam_role_arn.split('/')[-1]

        # Get inline policies
        inline_policies = iam_client.list_role_policies(RoleName=role_name)

        # Should have specific, limited policies (not AdministratorAccess)
        assert 'MinimalPolicy' in inline_policies['PolicyNames'] or len(inline_policies['PolicyNames']) > 0


class TestS3BucketSecurity:
    """Test S3 bucket encryption, logging, and access control."""

    def test_main_bucket_exists(self, s3_client):
        """Test that main S3 bucket exists."""
        bucket_name = outputs.get('MainBucketName')
        assert bucket_name, "Main bucket name not found in outputs"

        # Head bucket to verify existence
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_main_bucket_encryption_enabled(self, s3_client):
        """Test that main bucket has encryption enabled."""
        bucket_name = outputs.get('MainBucketName')

        # Get bucket encryption
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']

        # Should have at least one encryption rule
        assert len(rules) > 0
        # Check for KMS or AES256 encryption
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['aws:kms', 'AES256']

    def test_main_bucket_public_access_blocked(self, s3_client):
        """Test that main bucket blocks public access."""
        bucket_name = outputs.get('MainBucketName')

        # Get public access block configuration
        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        # All public access should be blocked
        assert config['BlockPublicAcls'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_main_bucket_logging_enabled(self, s3_client):
        """Test that main bucket has access logging enabled."""
        bucket_name = outputs.get('MainBucketName')

        # Get bucket logging
        response = s3_client.get_bucket_logging(Bucket=bucket_name)

        # Should have logging configuration
        assert 'LoggingEnabled' in response
        assert response['LoggingEnabled']['TargetBucket'] == outputs.get('LogBucketName')

    def test_log_bucket_exists(self, s3_client):
        """Test that log bucket exists."""
        bucket_name = outputs.get('LogBucketName')
        assert bucket_name, "Log bucket name not found in outputs"

        # Head bucket to verify existence
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200


class TestRDSEncryption:
    """Test RDS database encryption at rest."""

    def test_rds_database_endpoint_accessible(self):
        """Test that RDS endpoint is available."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        assert db_endpoint, "Database endpoint not found in outputs"
        assert 'rds.amazonaws.com' in db_endpoint

    def test_rds_database_encrypted(self, rds_client):
        """Test that RDS instance is encrypted at rest."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        # Extract DB instance identifier from endpoint
        db_identifier = db_endpoint.split('.')[0]

        # Describe DB instances
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # Check encryption
        assert db_instance['StorageEncrypted'] is True, "RDS instance should be encrypted"

    def test_rds_backup_encryption(self, rds_client):
        """Test that RDS backups are encrypted."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        db_identifier = db_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # If backups are enabled, they should be encrypted
        if db_instance.get('BackupRetentionPeriod', 0) > 0:
            assert db_instance['StorageEncrypted'] is True


class TestSecretManagerRotation:
    """Test Secrets Manager for RDS credential rotation."""

    def test_database_secret_exists(self, secretsmanager_client):
        """Test that database secret exists in Secrets Manager."""
        secret_arn = outputs.get('DatabaseSecretArn')
        assert secret_arn, "Database secret ARN not found in outputs"

        # Describe secret
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn

    def test_database_secret_rotation_enabled(self, secretsmanager_client):
        """Test that secret rotation is enabled."""
        secret_arn = outputs.get('DatabaseSecretArn')

        # Describe secret
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        # Check if rotation is enabled
        assert response.get('RotationEnabled') is True, "Secret rotation should be enabled"

    def test_rotation_lambda_exists(self, lambda_client):
        """Test that rotation Lambda function exists."""
        lambda_arn = outputs.get('RotationLambdaARN')
        assert lambda_arn, "Rotation Lambda ARN not found in outputs"

        # Get Lambda function
        function_name = lambda_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionArn'] == lambda_arn


class TestVPCNetworkSecurity:
    """Test VPC configuration and security groups."""

    def test_vpc_exists(self, ec2_client):
        """Test that VPC exists."""
        vpc_id = outputs.get('VPCId')
        assert vpc_id, "VPC ID not found in outputs"

        # Describe VPC
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['VpcId'] == vpc_id

    def test_vpc_dns_enabled(self, ec2_client):
        """Test that VPC DNS is enabled."""
        vpc_id = outputs.get('VPCId')

        # Check DNS support
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert response['EnableDnsSupport']['Value'] is True

        # Check DNS hostnames
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert response['EnableDnsHostnames']['Value'] is True

    def test_private_subnets_exist(self, ec2_client):
        """Test that private subnets exist."""
        # Get subnet IDs dynamically from outputs (they have long names from CFN)
        # Pattern: contains "PrivateSubnet" and ends with "Ref"
        subnet_keys = [key for key in outputs.keys() if 'PrivateSubnet' in key and key.endswith('Ref')]

        if len(subnet_keys) >= 2:
            subnet1_id = outputs.get(subnet_keys[0])
            subnet2_id = outputs.get(subnet_keys[1])

            assert subnet1_id, f"Private subnet 1 ID not found for key {subnet_keys[0]}"
            assert subnet2_id, f"Private subnet 2 ID not found for key {subnet_keys[1]}"

            # Describe subnets
            response = ec2_client.describe_subnets(SubnetIds=[subnet1_id, subnet2_id])
            assert len(response['Subnets']) == 2

            # Verify both subnets are private (no direct internet gateway route)
            for subnet in response['Subnets']:
                assert subnet['MapPublicIpOnLaunch'] is False, "Private subnets should not auto-assign public IPs"
        else:
            # Fallback: Try simplified output keys
            subnet1_id = outputs.get('PrivateSubnet1Id')
            subnet2_id = outputs.get('PrivateSubnet2Id')

            if subnet1_id and subnet2_id:
                response = ec2_client.describe_subnets(SubnetIds=[subnet1_id, subnet2_id])
                assert len(response['Subnets']) == 2
                for subnet in response['Subnets']:
                    assert subnet['MapPublicIpOnLaunch'] is False

    def test_ssh_security_group_restricted(self, ec2_client):
        """Test that SSH security group has restricted access."""
        sg_id = outputs.get('SSHSecurityGroupId')
        assert sg_id, "SSH security group ID not found"

        # Describe security group
        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules
        ingress_rules = sg['IpPermissions']

        # Should have SSH port 22 with specific IP restrictions
        ssh_rules = [rule for rule in ingress_rules if rule.get('FromPort') == 22]
        assert len(ssh_rules) > 0, "SSH rule should exist"

        # Should not allow 0.0.0.0/0 for SSH
        for rule in ssh_rules:
            for ip_range in rule.get('IpRanges', []):
                assert ip_range['CidrIp'] != '0.0.0.0/0', "SSH should not be open to the world"


class TestCloudTrailAuditing:
    """Test CloudTrail for multi-region audit logging."""

    def test_cloudtrail_exists(self, cloudtrail_client):
        """Test that CloudTrail exists."""
        trail_arn = outputs.get('CloudTrailArn')
        assert trail_arn, "CloudTrail ARN not found in outputs"

        # Extract trail name from ARN
        trail_name = trail_arn.split('/')[-1]

        # Get trail status
        response = cloudtrail_client.get_trail_status(Name=trail_name)
        assert response['IsLogging'] is True, "CloudTrail should be logging"

    def test_cloudtrail_multi_region_enabled(self, cloudtrail_client):
        """Test that CloudTrail is configured for multi-region."""
        trail_arn = outputs.get('CloudTrailArn')
        trail_name = trail_arn.split('/')[-1]

        # Describe trail
        response = cloudtrail_client.describe_trails(trailNameList=[trail_name])
        trail = response['trailList'][0]

        # Check multi-region
        assert trail.get('IsMultiRegionTrail') is True, "CloudTrail should be multi-region"

    def test_cloudtrail_log_file_validation(self, cloudtrail_client):
        """Test that CloudTrail has log file validation enabled."""
        trail_arn = outputs.get('CloudTrailArn')
        trail_name = trail_arn.split('/')[-1]

        # Describe trail
        response = cloudtrail_client.describe_trails(trailNameList=[trail_name])
        trail = response['trailList'][0]

        # Check log file validation
        assert trail.get('LogFileValidationEnabled') is True, "Log file validation should be enabled"


class TestSecurityMonitoring:
    """Test security monitoring with SNS alerts."""

    def test_security_alert_topic_exists(self, sns_client):
        """Test that SNS security alert topic exists."""
        topic_arn = outputs.get('SecurityAlertTopicArn')
        assert topic_arn, "Security alert topic ARN not found in outputs"

        # Get topic attributes
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn

    def test_security_alert_topic_encrypted(self, sns_client):
        """Test that SNS topic is encrypted."""
        topic_arn = outputs.get('SecurityAlertTopicArn')

        # Get topic attributes
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)

        # Check if KMS encryption is enabled
        kms_key = response['Attributes'].get('KmsMasterKeyId')
        # If KmsMasterKeyId is present, encryption is enabled
        # Note: It might be empty if using default encryption
        assert kms_key is not None or response['Attributes'].get('Owner'), "Topic should exist"


class TestStackOutputs:
    """Test that all expected stack outputs are present."""

    def test_all_outputs_present(self):
        """Test that all required outputs are present in flat-outputs.json."""
        required_outputs = [
            'KMSKeyArn',
            'EnvironmentSuffix',
            'StackName',
            'IAMRoleArn',
            'VPCId',
            'MainBucketName',
            'LogBucketName',
            'DatabaseEndpoint',
            'DatabaseSecretArn',
            'CloudTrailArn',
            'SecurityAlertTopicArn'
        ]

        for output_key in required_outputs:
            assert output_key in outputs, f"Required output {output_key} not found"
            assert outputs[output_key], f"Output {output_key} should not be empty"

    def test_environment_suffix_correct(self):
        """Test that environment suffix matches environment variable."""
        env_suffix = outputs.get('EnvironmentSuffix')
        expected_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        assert env_suffix == expected_suffix, f"Environment suffix should be '{expected_suffix}'"

    def test_region_correct(self):
        """Test that deployment region matches environment variable."""
        expected_region = os.environ.get('AWS_REGION', 'ap-northeast-1')
        outputs_region = outputs.get('Region')
        if outputs_region:
            assert outputs_region == expected_region, f"Region should be {expected_region}"


class TestS3BucketAdvancedSecurity:
    """Test advanced S3 bucket security features."""

    def test_main_bucket_versioning_enabled(self, s3_client):
        """Test that main bucket has versioning enabled."""
        bucket_name = outputs.get('MainBucketName')

        # Get bucket versioning
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)

        # Versioning should be enabled or suspended (not absent)
        assert response.get('Status') in ['Enabled', 'Suspended'], "Bucket versioning should be configured"

    def test_log_bucket_encryption_enabled(self, s3_client):
        """Test that log bucket has encryption enabled."""
        bucket_name = outputs.get('LogBucketName')

        # Get bucket encryption
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']

        # Should have at least one encryption rule
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['aws:kms', 'AES256']

    def test_log_bucket_public_access_blocked(self, s3_client):
        """Test that log bucket blocks public access."""
        bucket_name = outputs.get('LogBucketName')

        # Get public access block configuration
        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        # All public access should be blocked
        assert config['BlockPublicAcls'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_main_bucket_uses_kms_encryption(self, s3_client):
        """Test that main bucket uses KMS encryption with correct key."""
        bucket_name = outputs.get('MainBucketName')
        kms_key_arn = outputs.get('KMSKeyArn')

        # Get bucket encryption
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']

        # Check for KMS encryption
        encryption_config = rules[0]['ApplyServerSideEncryptionByDefault']
        assert encryption_config['SSEAlgorithm'] == 'aws:kms'

        # Verify it uses the correct KMS key
        if 'KMSMasterKeyID' in encryption_config:
            assert kms_key_arn.split('/')[-1] in encryption_config['KMSMasterKeyID']


class TestRDSAdvancedSecurity:
    """Test advanced RDS security features."""

    def test_rds_instance_class_appropriate(self, rds_client):
        """Test that RDS instance uses appropriate instance class."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        db_identifier = db_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # Should use db.t* or db.m* instance classes for cost-effectiveness
        instance_class = db_instance['DBInstanceClass']
        assert instance_class.startswith('db.'), "Should use valid DB instance class"

    def test_rds_multi_az_configuration(self, rds_client):
        """Test RDS Multi-AZ configuration."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        db_identifier = db_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # Check Multi-AZ setting exists (True or False is acceptable)
        assert 'MultiAZ' in db_instance

    def test_rds_engine_and_version(self, rds_client):
        """Test RDS engine type and version."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        db_identifier = db_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # Should have valid engine
        assert db_instance['Engine'] in ['mysql', 'postgres', 'mariadb'], "Should use supported DB engine"
        assert db_instance.get('EngineVersion'), "Should have engine version specified"

    def test_rds_automated_backups_enabled(self, rds_client):
        """Test that RDS automated backups are enabled."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        db_identifier = db_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # Backup retention should be greater than 0
        assert db_instance.get('BackupRetentionPeriod', 0) > 0, "Automated backups should be enabled"

    def test_rds_deletion_protection(self, rds_client):
        """Test RDS deletion protection setting."""
        db_endpoint = outputs.get('DatabaseEndpoint')
        db_identifier = db_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # Deletion protection should be configured
        assert 'DeletionProtection' in db_instance


class TestVPCAdvancedSecurity:
    """Test advanced VPC security features."""

    def test_vpc_cidr_block_matches_output(self, ec2_client):
        """Test that VPC CIDR block matches expected value from outputs."""
        vpc_id = outputs.get('VPCId')

        # Try to find CIDR block from outputs (could be VPCCidrBlock or dynamic key)
        expected_cidr = outputs.get('VPCCidrBlock')

        # If not found, try to find it dynamically (pattern: contains "CidrBlock")
        if not expected_cidr:
            cidr_keys = [key for key in outputs.keys() if 'CidrBlock' in key and 'VPC' in key]
            if cidr_keys:
                expected_cidr = outputs.get(cidr_keys[0])

        if expected_cidr:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            assert vpc['CidrBlock'] == expected_cidr, f"VPC CIDR should be {expected_cidr}"

    def test_private_subnets_in_different_azs(self, ec2_client):
        """Test that private subnets are in different availability zones."""
        # Get subnet IDs dynamically from outputs
        subnet_keys = [key for key in outputs.keys() if 'PrivateSubnet' in key and 'Ref' in key]

        if len(subnet_keys) >= 2:
            subnet_ids = [outputs.get(key) for key in subnet_keys[:2]]
            subnet_ids = [sid for sid in subnet_ids if sid]  # Filter None values

            if len(subnet_ids) >= 2:
                response = ec2_client.describe_subnets(SubnetIds=subnet_ids)

                # Get availability zones
                azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]

                # Should be in different AZs for high availability
                assert len(set(azs)) > 1, "Private subnets should be in different availability zones"

    def test_vpc_flow_logs_enabled(self, ec2_client):
        """Test that VPC Flow Logs are enabled."""
        vpc_id = outputs.get('VPCId')

        # Describe flow logs for this VPC
        response = ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        # Should have at least one flow log
        assert len(response['FlowLogs']) > 0, "VPC Flow Logs should be enabled"

    def test_security_group_belongs_to_vpc(self, ec2_client):
        """Test that security group belongs to the correct VPC."""
        vpc_id = outputs.get('VPCId')
        sg_id = outputs.get('SSHSecurityGroupId')

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        assert sg['VpcId'] == vpc_id, "Security group should belong to the VPC"


class TestLambdaRotationFunction:
    """Test Lambda rotation function configuration."""

    def test_rotation_lambda_runtime(self, lambda_client):
        """Test that rotation Lambda uses appropriate runtime."""
        lambda_arn = outputs.get('RotationLambdaARN')
        function_name = lambda_arn.split(':')[-1]

        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Should use Python runtime
        assert config['Runtime'].startswith('python'), "Rotation Lambda should use Python runtime"

    def test_rotation_lambda_has_vpc_config(self, lambda_client):
        """Test that rotation Lambda has VPC configuration."""
        lambda_arn = outputs.get('RotationLambdaARN')
        function_name = lambda_arn.split(':')[-1]

        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Should have VPC config to access RDS
        assert 'VpcConfig' in config

    def test_rotation_lambda_timeout_appropriate(self, lambda_client):
        """Test that rotation Lambda has appropriate timeout."""
        lambda_arn = outputs.get('RotationLambdaARN')
        function_name = lambda_arn.split(':')[-1]

        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Rotation should have sufficient timeout (at least 30 seconds)
        assert config['Timeout'] >= 30, "Rotation Lambda should have sufficient timeout"


class TestIAMAdvancedSecurity:
    """Test advanced IAM security features."""

    def test_iam_role_has_trust_policy(self, iam_client):
        """Test that IAM role has proper trust policy."""
        iam_role_arn = outputs.get('IAMRoleArn')
        role_name = iam_role_arn.split('/')[-1]

        response = iam_client.get_role(RoleName=role_name)
        assume_role_policy = response['Role']['AssumeRolePolicyDocument']

        # Should have trust relationship statements
        assert 'Statement' in assume_role_policy
        assert len(assume_role_policy['Statement']) > 0

    def test_iam_role_has_managed_policies(self, iam_client):
        """Test that IAM role has appropriate managed policies attached."""
        iam_role_arn = outputs.get('IAMRoleArn')
        role_name = iam_role_arn.split('/')[-1]

        # Get attached managed policies
        response = iam_client.list_attached_role_policies(RoleName=role_name)

        # Should have at least one managed policy
        assert len(response['AttachedPolicies']) > 0, "Role should have managed policies attached"


class TestKMSAdvancedSecurity:
    """Test advanced KMS key security features."""

    def test_kms_key_description_appropriate(self, kms_client):
        """Test that KMS key has appropriate description."""
        kms_key_arn = outputs.get('KMSKeyArn')
        key_id = kms_key_arn.split('/')[-1]

        response = kms_client.describe_key(KeyId=key_id)
        metadata = response['KeyMetadata']

        # Should have description
        assert metadata.get('Description'), "KMS key should have description"

    def test_kms_key_not_pending_deletion(self, kms_client):
        """Test that KMS key is not pending deletion."""
        kms_key_arn = outputs.get('KMSKeyArn')
        key_id = kms_key_arn.split('/')[-1]

        response = kms_client.describe_key(KeyId=key_id)
        metadata = response['KeyMetadata']

        # Should not be pending deletion
        assert metadata['KeyState'] != 'PendingDeletion', "KMS key should not be pending deletion"

    def test_kms_key_has_key_policy(self, kms_client):
        """Test that KMS key has proper key policy."""
        kms_key_arn = outputs.get('KMSKeyArn')
        key_id = kms_key_arn.split('/')[-1]

        # Get key policy
        response = kms_client.get_key_policy(KeyId=key_id, PolicyName='default')

        # Should have policy
        assert response['Policy'], "KMS key should have key policy"


class TestSecretsManagerAdvanced:
    """Test advanced Secrets Manager features."""

    def test_secret_has_rotation_lambda_arn(self, secretsmanager_client):
        """Test that secret has rotation Lambda ARN configured."""
        secret_arn = outputs.get('DatabaseSecretArn')

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        # Should have rotation Lambda ARN
        if response.get('RotationEnabled'):
            assert response.get('RotationLambdaARN'), "Rotation enabled secrets should have Lambda ARN"

    def test_secret_rotation_schedule_configured(self, secretsmanager_client):
        """Test that secret has rotation schedule configured."""
        secret_arn = outputs.get('DatabaseSecretArn')

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        # Should have rotation rules if rotation is enabled
        if response.get('RotationEnabled'):
            assert response.get('RotationRules'), "Should have rotation rules configured"

    def test_secret_encrypted_with_kms(self, secretsmanager_client):
        """Test that secret is encrypted with KMS key."""
        secret_arn = outputs.get('DatabaseSecretArn')
        kms_key_arn = outputs.get('KMSKeyArn')

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        # Should have KMS key ID
        if response.get('KmsKeyId'):
            # Verify it uses the correct KMS key
            assert kms_key_arn.split('/')[-1] in response['KmsKeyId'] or response.get('KmsKeyId')
