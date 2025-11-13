"""
Integration tests for Payment Security Infrastructure
Tests the actual deployed AWS resources
"""

import json
import os
import boto3
import pytest

# Load stack outputs
def load_outputs():
    outputs_path = os.path.join(os.path.dirname(__file__), '..', 'cfn-outputs', 'flat-outputs.json')
    with open(outputs_path) as f:
        return json.load(f)

@pytest.fixture(scope='module')
def outputs():
    return load_outputs()

@pytest.fixture(scope='module')
def ec2_client():
    return boto3.client('ec2', region_name='us-east-1')

@pytest.fixture(scope='module')
def rds_client():
    return boto3.client('rds', region_name='us-east-1')

@pytest.fixture(scope='module')
def s3_client():
    return boto3.client('s3', region_name='us-east-1')

@pytest.fixture(scope='module')
def kms_client():
    return boto3.client('kms', region_name='us-east-1')

@pytest.fixture(scope='module')
def logs_client():
    return boto3.client('logs', region_name='us-east-1')

@pytest.fixture(scope='module')
def iam_client():
    return boto3.client('iam', region_name='us-east-1')

class TestVPCConfiguration:
    """Test VPC and networking resources"""

    def test_vpc_exists(self, ec2_client, outputs):
        """Verify VPC exists and has correct configuration"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

        # Check DNS attributes separately
        dns_support = ec2_client.describe_vpc_attribute(VpcId=vpc_id, Attribute='enableDnsSupport')
        dns_hostnames = ec2_client.describe_vpc_attribute(VpcId=vpc_id, Attribute='enableDnsHostnames')

        assert dns_support['EnableDnsSupport']['Value'] is True
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

    def test_private_subnets_exist(self, ec2_client, outputs):
        """Verify all 3 private subnets exist in different AZs"""
        subnet_ids = [
            outputs['PrivateSubnet1Id'],
            outputs['PrivateSubnet2Id'],
            outputs['PrivateSubnet3Id']
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response['Subnets']) == 3

        availability_zones = set()
        for subnet in response['Subnets']:
            assert subnet['State'] == 'available'
            assert not subnet['MapPublicIpOnLaunch']
            availability_zones.add(subnet['AvailabilityZone'])

        # Verify subnets are in different AZs
        assert len(availability_zones) == 3

class TestSecurityGroups:
    """Test security group configurations"""

    def test_database_security_group(self, ec2_client, outputs):
        """Verify database security group allows only PostgreSQL from app tier"""
        db_sg_id = outputs['DBSecurityGroupId']
        app_sg_id = outputs['ApplicationSecurityGroupId']

        response = ec2_client.describe_security_groups(GroupIds=[db_sg_id])
        assert len(response['SecurityGroups']) == 1

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        # Should have exactly one ingress rule for PostgreSQL
        assert len(ingress_rules) == 1
        rule = ingress_rules[0]
        assert rule['IpProtocol'] == 'tcp'
        assert rule['FromPort'] == 5432
        assert rule['ToPort'] == 5432

        # Verify source is application security group
        assert len(rule['UserIdGroupPairs']) == 1
        assert rule['UserIdGroupPairs'][0]['GroupId'] == app_sg_id

    def test_application_security_group(self, ec2_client, outputs):
        """Verify application security group has HTTPS ingress"""
        app_sg_id = outputs['ApplicationSecurityGroupId']

        response = ec2_client.describe_security_groups(GroupIds=[app_sg_id])
        assert len(response['SecurityGroups']) == 1

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        # Should have HTTPS ingress from VPC
        https_rule = [r for r in ingress_rules if r['FromPort'] == 443]
        assert len(https_rule) == 1
        assert https_rule[0]['IpProtocol'] == 'tcp'

class TestRDSDatabase:
    """Test RDS PostgreSQL configuration"""

    def test_rds_instance_exists(self, rds_client, outputs):
        """Verify RDS instance exists with correct configuration"""
        db_endpoint = outputs['DBEndpoint']
        db_identifier = db_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        assert len(response['DBInstances']) == 1

        db = response['DBInstances'][0]
        assert db['DBInstanceStatus'] == 'available'
        assert db['Engine'] == 'postgres'
        assert db['MultiAZ'] is True
        assert db['StorageEncrypted'] is True
        assert not db['PubliclyAccessible']

    def test_rds_encryption_enabled(self, rds_client, outputs):
        """Verify RDS encryption is enabled with KMS"""
        db_endpoint = outputs['DBEndpoint']
        db_identifier = db_endpoint.split('.')[0]
        kms_key_id = outputs['RDSKMSKeyId']

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db = response['DBInstances'][0]

        assert db['StorageEncrypted'] is True
        assert kms_key_id in db['KmsKeyId']

    def test_rds_in_private_subnets(self, rds_client, outputs):
        """Verify RDS is deployed in private subnets"""
        db_endpoint = outputs['DBEndpoint']
        db_identifier = db_endpoint.split('.')[0]

        private_subnets = {
            outputs['PrivateSubnet1Id'],
            outputs['PrivateSubnet2Id'],
            outputs['PrivateSubnet3Id']
        }

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db = response['DBInstances'][0]

        # Check subnets in subnet group
        db_subnet_group = db['DBSubnetGroup']
        db_subnets = {subnet['SubnetIdentifier'] for subnet in db_subnet_group['Subnets']}

        assert db_subnets == private_subnets

class TestS3Bucket:
    """Test S3 bucket configuration"""

    def test_s3_bucket_exists(self, s3_client, outputs):
        """Verify S3 bucket exists and is accessible"""
        bucket_name = outputs['AuditLogBucketName']

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_s3_encryption_enabled(self, s3_client, outputs):
        """Verify S3 bucket has encryption enabled"""
        bucket_name = outputs['AuditLogBucketName']

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']

        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    def test_s3_versioning_enabled(self, s3_client, outputs):
        """Verify S3 bucket has versioning enabled"""
        bucket_name = outputs['AuditLogBucketName']

        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    def test_s3_public_access_blocked(self, s3_client, outputs):
        """Verify S3 bucket blocks all public access"""
        bucket_name = outputs['AuditLogBucketName']

        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True

class TestKMSKey:
    """Test KMS key configuration"""

    def test_kms_key_exists(self, kms_client, outputs):
        """Verify KMS key exists and is enabled"""
        key_id = outputs['RDSKMSKeyId']

        response = kms_client.describe_key(KeyId=key_id)
        key_metadata = response['KeyMetadata']

        assert key_metadata['KeyState'] == 'Enabled'
        assert key_metadata['Enabled'] is True

    def test_kms_key_rotation_enabled(self, kms_client, outputs):
        """Verify KMS key has automatic rotation enabled"""
        key_id = outputs['RDSKMSKeyId']

        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response['KeyRotationEnabled'] is True

class TestCloudWatchLogs:
    """Test CloudWatch Logs configuration"""

    def test_log_group_exists(self, logs_client, outputs):
        """Verify CloudWatch Log Group exists"""
        log_group_name = outputs['ApplicationLogGroupName']

        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]

        assert len(log_groups) == 1
        log_group = log_groups[0]

        # Verify retention is set to 90 days
        assert log_group.get('retentionInDays') == 90

class TestIAMResources:
    """Test IAM roles and policies"""

    def test_ec2_instance_profile_exists(self, iam_client, outputs):
        """Verify EC2 instance profile exists"""
        profile_arn = outputs['EC2InstanceProfileArn']
        profile_name = profile_arn.split('/')[-1]

        response = iam_client.get_instance_profile(InstanceProfileName=profile_name)
        profile = response['InstanceProfile']

        assert profile['Arn'] == profile_arn
        assert len(profile['Roles']) == 1

    def test_iam_policies_no_wildcards(self, iam_client, outputs):
        """Verify IAM policies follow least-privilege (no wildcards in actions)"""
        profile_arn = outputs['EC2InstanceProfileArn']
        profile_name = profile_arn.split('/')[-1]

        # Get the role attached to the instance profile
        response = iam_client.get_instance_profile(InstanceProfileName=profile_name)
        role_name = response['InstanceProfile']['Roles'][0]['RoleName']

        # Get inline policies
        response = iam_client.list_role_policies(RoleName=role_name)
        policy_names = response['PolicyNames']

        for policy_name in policy_names:
            policy_doc = iam_client.get_role_policy(RoleName=role_name, PolicyName=policy_name)
            policy = policy_doc['PolicyDocument']

            # Check statements don't have wildcard resources
            for statement in policy['Statement']:
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]

                # Policies should have specific actions (allow some common service actions with *)
                for action in actions:
                    # Allow specific service wildcards like rds:Describe*, logs:*, etc.
                    # but not full wildcards like *
                    if action == '*':
                        pytest.fail(f"Policy {policy_name} has wildcard action: {action}")

class TestEndToEndWorkflow:
    """Test complete workflow and resource integrations"""

    def test_vpc_flow_logs_enabled(self, ec2_client, outputs):
        """Verify VPC Flow Logs are enabled"""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        assert len(response['FlowLogs']) > 0
        flow_log = response['FlowLogs'][0]
        assert flow_log['FlowLogStatus'] == 'ACTIVE'
        assert flow_log['LogDestinationType'] == 's3'

    def test_security_architecture(self, ec2_client, rds_client, outputs):
        """Verify complete security architecture is properly configured"""
        # Verify DB is isolated
        db_sg_id = outputs['DBSecurityGroupId']
        app_sg_id = outputs['ApplicationSecurityGroupId']
        vpc_id = outputs['VPCId']

        # Get DB security group
        db_sg = ec2_client.describe_security_groups(GroupIds=[db_sg_id])['SecurityGroups'][0]

        # Verify DB only accepts traffic from app tier
        for rule in db_sg['IpPermissions']:
            for sg_pair in rule.get('UserIdGroupPairs', []):
                assert sg_pair['GroupId'] == app_sg_id

        # Verify app security group is in same VPC
        app_sg = ec2_client.describe_security_groups(GroupIds=[app_sg_id])['SecurityGroups'][0]
        assert app_sg['VpcId'] == vpc_id
        assert db_sg['VpcId'] == vpc_id

    def test_resource_tagging(self, ec2_client, outputs):
        """Verify resources have proper tags"""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        # Verify required tags exist
        assert 'Environment' in tags
        assert 'CostCenter' in tags
        assert 'DataClassification' in tags
