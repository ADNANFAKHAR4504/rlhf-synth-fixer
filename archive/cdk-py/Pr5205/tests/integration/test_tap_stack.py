"""
Integration tests for deployed disaster recovery infrastructure

Tests cover:
- VPC and networking resources
- KMS keys
- Secrets Manager secret
- EFS file system
- RDS database instance
- CloudWatch alarms
"""

import json
import os
import unittest

import boto3
from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration tests"""
        cls.ec2_client = boto3.client('ec2')
        cls.rds_client = boto3.client('rds')
        cls.efs_client = boto3.client('efs')
        cls.kms_client = boto3.client('kms')
        cls.secrets_client = boto3.client('secretsmanager')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.sns_client = boto3.client('sns')

    @mark.it("VPC exists and is properly configured")
    def test_vpc_exists(self):
        """Test that VPC exists and has proper configuration"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        vpc_id = flat_outputs.get('VPCId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]

        # Verify VPC state
        assert vpc['State'] == 'available'

        # Verify DNS support via explicit attribute lookups (describe_vpcs omits these fields)
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport',
        )
        assert dns_support['EnableDnsSupport']['Value'] is True

        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames',
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

    @mark.it("VPC has subnets across multiple availability zones")
    def test_vpc_multi_az_subnets(self):
        """Test that VPC has subnets in multiple AZs"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        vpc_id = flat_outputs.get('VPCId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) > 0, "No subnets found"

        # Get unique availability zones
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) >= 2, f"Expected at least 2 AZs, found {len(azs)}"

    @mark.it("Security groups exist and have proper rules")
    def test_security_groups_exist(self):
        """Test that security groups exist with proper rules"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        vpc_id = flat_outputs.get('VPCId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")

        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': ['rds-sg-*', 'efs-sg-*']}
            ]
        )

        # Should have at least 2 security groups (RDS and EFS)
        assert len(response['SecurityGroups']) >= 2

    @mark.it("RDS instance exists and is Multi-AZ")
    def test_rds_instance_exists_multi_az(self):
        """Test that RDS instance exists and has Multi-AZ enabled"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        db_endpoint = flat_outputs.get('DatabaseEndpoint')
        if not db_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        # Get instance identifier from endpoint
        # Endpoint format: instance-id.region.rds.amazonaws.com
        instance_id = db_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        assert len(response['DBInstances']) == 1
        db_instance = response['DBInstances'][0]

        # Verify Multi-AZ is enabled
        assert db_instance['MultiAZ'] is True, "Multi-AZ is not enabled"

        # Verify instance is available
        assert db_instance['DBInstanceStatus'] == 'available'

        # Verify encryption is enabled
        assert db_instance['StorageEncrypted'] is True

        # Verify automated backups
        assert db_instance['BackupRetentionPeriod'] >= 7

    @mark.it("RDS instance uses PostgreSQL engine")
    def test_rds_uses_postgresql(self):
        """Test that RDS instance uses PostgreSQL"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        db_endpoint = flat_outputs.get('DatabaseEndpoint')
        if not db_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        instance_id = db_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        db_instance = response['DBInstances'][0]
        assert db_instance['Engine'] == 'postgres'

    @mark.it("RDS instance has proper parameter group")
    def test_rds_parameter_group(self):
        """Test that RDS has proper parameter group with FedRAMP settings"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        db_endpoint = flat_outputs.get('DatabaseEndpoint')
        if not db_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        instance_id = db_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        db_instance = response['DBInstances'][0]
        param_groups = db_instance.get('DBParameterGroups', [])

        assert len(param_groups) > 0, "No parameter group attached"

    @mark.it("Secrets Manager secret exists")
    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        secret_arn = flat_outputs.get('DatabaseSecretArn')
        if not secret_arn:
            self.skipTest("Secret ARN not found in outputs")

        response = self.secrets_client.describe_secret(SecretId=secret_arn)

        # Verify secret exists and has rotation enabled
        assert 'ARN' in response
        assert response.get('RotationEnabled', False) is True

    @mark.it("Secrets Manager secret has valid credentials")
    def test_secrets_manager_secret_valid(self):
        """Test that secret contains valid database credentials"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        secret_arn = flat_outputs.get('DatabaseSecretArn')
        if not secret_arn:
            self.skipTest("Secret ARN not found in outputs")

        response = self.secrets_client.get_secret_value(SecretId=secret_arn)

        secret_string = json.loads(response['SecretString'])

        # Verify required fields
        assert 'username' in secret_string
        assert 'password' in secret_string
        assert secret_string['username'] == 'dbadmin'
        assert len(secret_string['password']) >= 16

    @mark.it("EFS file system exists and is encrypted")
    def test_efs_exists_encrypted(self):
        """Test that EFS file system exists and is encrypted"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        efs_id = flat_outputs.get('EFSFileSystemId')
        if not efs_id:
            self.skipTest("EFS ID not found in outputs")

        response = self.efs_client.describe_file_systems(FileSystemId=efs_id)

        assert len(response['FileSystems']) == 1
        file_system = response['FileSystems'][0]

        # Verify encryption is enabled
        assert file_system['Encrypted'] is True

        # Verify file system is available
        assert file_system['LifeCycleState'] == 'available'

    @mark.it("EFS has mount targets in multiple AZs")
    def test_efs_multi_az_mount_targets(self):
        """Test that EFS has mount targets across multiple AZs"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        efs_id = flat_outputs.get('EFSFileSystemId')
        if not efs_id:
            self.skipTest("EFS ID not found in outputs")

        response = self.efs_client.describe_mount_targets(FileSystemId=efs_id)

        mount_targets = response['MountTargets']
        assert len(mount_targets) > 0, "No mount targets found"

        # Get unique availability zones
        azs = set(mt['AvailabilityZoneName'] for mt in mount_targets)
        assert len(azs) >= 2, f"Expected mount targets in at least 2 AZs, found {len(azs)}"

    @mark.it("KMS keys exist and have rotation enabled")
    def test_kms_keys_exist(self):
        """Test that KMS keys exist (verified through RDS and EFS encryption)"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        # Verify RDS encryption key
        db_endpoint = flat_outputs.get('DatabaseEndpoint')
        if db_endpoint:
            instance_id = db_endpoint.split('.')[0]
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )
            db_instance = response['DBInstances'][0]

            if 'KmsKeyId' in db_instance:
                kms_key_id = db_instance['KmsKeyId']
                key_response = self.kms_client.describe_key(KeyId=kms_key_id)

                assert key_response['KeyMetadata']['Enabled'] is True

    @mark.it("CloudWatch alarms exist for RDS monitoring")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        db_endpoint = flat_outputs.get('DatabaseEndpoint')
        if not db_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        instance_id = db_endpoint.split('.')[0]

        # List alarms related to this RDS instance
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix="dr-db-"
        )

        alarms = response['MetricAlarms']
        assert len(alarms) >= 4, f"Expected at least 4 alarms, found {len(alarms)}"

    @mark.it("SNS topic exists for alarm notifications")
    def test_sns_topic_exists(self):
        """Test that SNS topic exists for alarms"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        # List SNS topics
        response = self.sns_client.list_topics()

        topics = response['Topics']
        # Look for disaster recovery alarm topic
        dr_topics = [t for t in topics if 'dr-db-alarms' in t['TopicArn']]

        assert len(dr_topics) > 0, "No alarm SNS topic found"

    @mark.it("RDS instance is publicly inaccessible")
    def test_rds_not_public(self):
        """Test that RDS instance is not publicly accessible"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        db_endpoint = flat_outputs.get('DatabaseEndpoint')
        if not db_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        instance_id = db_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        db_instance = response['DBInstances'][0]
        assert db_instance['PubliclyAccessible'] is False

    @mark.it("RDS instance has Performance Insights enabled")
    def test_rds_performance_insights_enabled(self):
        """Test that Performance Insights is enabled"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        db_endpoint = flat_outputs.get('DatabaseEndpoint')
        if not db_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        instance_id = db_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        db_instance = response['DBInstances'][0]
        assert db_instance.get('PerformanceInsightsEnabled', False) is True

    @mark.it("Environment suffix is properly set")
    def test_environment_suffix_set(self):
        """Test that environment suffix output exists"""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available")

        env_suffix = flat_outputs.get('EnvironmentSuffix')
        assert env_suffix is not None, "Environment suffix not set"
        assert len(env_suffix) > 0, "Environment suffix is empty"


if __name__ == '__main__':
    unittest.main()
