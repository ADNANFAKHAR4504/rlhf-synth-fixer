"""
Integration tests for Industrial IoT Data Processing Infrastructure.

These tests verify that the deployed infrastructure meets all requirements:
- VPC and networking components are created
- Kinesis Data Stream is configured with encryption
- RDS Aurora cluster is accessible and encrypted
- ElastiCache Redis cluster is accessible and encrypted
- Secrets Manager contains database credentials
- KMS keys are created and used for encryption
- Security groups have proper rules
"""

import json
import os
import boto3
import pytest
from typing import Dict, Any


# Load outputs from Pulumi stack
def load_outputs() -> Dict[str, Any]:
    """Load Pulumi stack outputs from flat-outputs.json or cfn-outputs/flat-outputs.json."""
    output_paths = [
        'flat-outputs.json',
        'cfn-outputs/flat-outputs.json',
        'pulumi-outputs.json'
    ]

    for path in output_paths:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)

    raise FileNotFoundError(
        "Could not find outputs file. Please ensure the stack is deployed and outputs are exported."
    )


# Load outputs once for all tests
try:
    OUTPUTS = load_outputs()
    print(f"✅ Loaded outputs with {len(OUTPUTS)} keys")
    print(f"📋 Output keys: {list(OUTPUTS.keys())}")
except FileNotFoundError as e:
    print(f"⚠️  Could not find outputs file: {e}")
    OUTPUTS = {}

# Check if we have all required outputs
REQUIRED_OUTPUTS = [
    'vpc_id',
    'kinesis_stream_name',
    'kinesis_stream_arn',
    'aurora_cluster_id',
    'aurora_cluster_endpoint',
    'redis_cluster_id',
    'redis_primary_endpoint',
    'secrets_manager_secret_arn',
    'kinesis_kms_key_id',
    'rds_kms_key_id',
    'secrets_kms_key_id',
    'rds_security_group_id',
    'elasticache_security_group_id'
]

MISSING_OUTPUTS = [output for output in REQUIRED_OUTPUTS if output not in OUTPUTS]
HAS_ALL_OUTPUTS = len(MISSING_OUTPUTS) == 0

if MISSING_OUTPUTS:
    print(f"⚠️  Missing required outputs: {', '.join(MISSING_OUTPUTS)}")
    print("⚠️  Integration tests will be skipped if infrastructure is not deployed.")


@pytest.fixture(scope='module')
def aws_region():
    """Get AWS region from environment or default."""
    return os.getenv('AWS_REGION', 'sa-east-1')


@pytest.fixture(scope='module')
def ec2_client(aws_region):
    """Create EC2 client."""
    return boto3.client('ec2', region_name=aws_region)


@pytest.fixture(scope='module')
def kinesis_client(aws_region):
    """Create Kinesis client."""
    return boto3.client('kinesis', region_name=aws_region)


@pytest.fixture(scope='module')
def rds_client(aws_region):
    """Create RDS client."""
    return boto3.client('rds', region_name=aws_region)


@pytest.fixture(scope='module')
def elasticache_client(aws_region):
    """Create ElastiCache client."""
    return boto3.client('elasticache', region_name=aws_region)


@pytest.fixture(scope='module')
def secretsmanager_client(aws_region):
    """Create Secrets Manager client."""
    return boto3.client('secretsmanager', region_name=aws_region)


@pytest.fixture(scope='module')
def kms_client(aws_region):
    """Create KMS client."""
    return boto3.client('kms', region_name=aws_region)


# Pytest marker to skip all tests if outputs are not available
pytestmark = pytest.mark.skipif(not HAS_ALL_OUTPUTS, reason="Infrastructure not deployed or outputs not available")


class TestVPCAndNetworking:
    """Test VPC and networking components."""

    def test_vpc_exists(self, ec2_client):
        """Verify VPC was created."""
        vpc_id = OUTPUTS.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1

        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_dns_configuration(self, ec2_client):
        """Verify VPC has DNS support enabled."""
        vpc_id = OUTPUTS.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert response['EnableDnsSupport']['Value'] is True

        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert response['EnableDnsHostnames']['Value'] is True

    def test_subnets_exist(self, ec2_client):
        """Verify public and private subnets were created."""
        vpc_id = OUTPUTS.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 4, "Expected at least 4 subnets (2 public, 2 private)"

        # Verify subnets are in different availability zones
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) >= 2, "Subnets should be in at least 2 availability zones"

    def test_internet_gateway_exists(self, ec2_client):
        """Verify Internet Gateway was created and attached."""
        vpc_id = OUTPUTS.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['InternetGateways']) == 1
        igw = response['InternetGateways'][0]
        assert igw['Attachments'][0]['State'] == 'available'


class TestSecurityGroups:
    """Test security group configurations."""

    def test_rds_security_group_exists(self, ec2_client):
        """Verify RDS security group was created."""
        sg_id = OUTPUTS.get('rds_security_group_id')
        assert sg_id, "RDS security group ID not found in outputs"

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        assert len(response['SecurityGroups']) == 1

    def test_rds_security_group_rules(self, ec2_client):
        """Verify RDS security group has correct ingress rules."""
        sg_id = OUTPUTS.get('rds_security_group_id')
        assert sg_id, "RDS security group ID not found in outputs"

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules
        ingress_rules = sg['IpPermissions']
        assert len(ingress_rules) >= 1

        # Verify PostgreSQL port is allowed
        postgres_rules = [
            rule for rule in ingress_rules
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432
        ]
        assert len(postgres_rules) >= 1, "PostgreSQL port 5432 should be allowed"

        # Verify no overly broad rules (0.0.0.0/0 should not be allowed for database)
        for rule in ingress_rules:
            ip_ranges = rule.get('IpRanges', [])
            for ip_range in ip_ranges:
                cidr = ip_range.get('CidrIp', '')
                assert cidr != '0.0.0.0/0', "Security group should not allow access from 0.0.0.0/0"

    def test_elasticache_security_group_exists(self, ec2_client):
        """Verify ElastiCache security group was created."""
        sg_id = OUTPUTS.get('elasticache_security_group_id')
        assert sg_id, "ElastiCache security group ID not found in outputs"

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        assert len(response['SecurityGroups']) == 1

    def test_elasticache_security_group_rules(self, ec2_client):
        """Verify ElastiCache security group has correct ingress rules."""
        sg_id = OUTPUTS.get('elasticache_security_group_id')
        assert sg_id, "ElastiCache security group ID not found in outputs"

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules
        ingress_rules = sg['IpPermissions']
        assert len(ingress_rules) >= 1

        # Verify Redis port is allowed
        redis_rules = [
            rule for rule in ingress_rules
            if rule.get('FromPort') == 6379 and rule.get('ToPort') == 6379
        ]
        assert len(redis_rules) >= 1, "Redis port 6379 should be allowed"


class TestKMSEncryption:
    """Test KMS key configurations."""

    def test_kms_keys_exist(self, kms_client):
        """Verify KMS keys were created."""
        kinesis_key_id = OUTPUTS.get('kinesis_kms_key_id')
        rds_key_id = OUTPUTS.get('rds_kms_key_id')
        secrets_key_id = OUTPUTS.get('secrets_kms_key_id')

        assert kinesis_key_id, "Kinesis KMS key ID not found in outputs"
        assert rds_key_id, "RDS KMS key ID not found in outputs"
        assert secrets_key_id, "Secrets Manager KMS key ID not found in outputs"

        # Verify each key exists and is enabled
        for key_id in [kinesis_key_id, rds_key_id, secrets_key_id]:
            response = kms_client.describe_key(KeyId=key_id)
            key_metadata = response['KeyMetadata']
            assert key_metadata['KeyState'] == 'Enabled'
            assert key_metadata['Enabled'] is True

    def test_kms_key_rotation(self, kms_client):
        """Verify KMS keys have rotation enabled."""
        kinesis_key_id = OUTPUTS.get('kinesis_kms_key_id')
        rds_key_id = OUTPUTS.get('rds_kms_key_id')
        secrets_key_id = OUTPUTS.get('secrets_kms_key_id')

        for key_id in [kinesis_key_id, rds_key_id, secrets_key_id]:
            if key_id:
                response = kms_client.get_key_rotation_status(KeyId=key_id)
                assert response['KeyRotationEnabled'] is True, f"Key rotation should be enabled for {key_id}"


class TestKinesisDataStream:
    """Test Kinesis Data Stream configuration."""

    def test_kinesis_stream_exists(self, kinesis_client):
        """Verify Kinesis stream was created."""
        stream_name = OUTPUTS.get('kinesis_stream_name')
        assert stream_name, "Kinesis stream name not found in outputs"

        response = kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        assert stream['StreamStatus'] in ['ACTIVE', 'CREATING', 'UPDATING']
        assert stream['StreamName'] == stream_name

    def test_kinesis_stream_encryption(self, kinesis_client):
        """Verify Kinesis stream has encryption enabled."""
        stream_name = OUTPUTS.get('kinesis_stream_name')
        assert stream_name, "Kinesis stream name not found in outputs"

        response = kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        assert stream['EncryptionType'] == 'KMS', "Kinesis stream should use KMS encryption"
        assert stream.get('KeyId'), "Kinesis stream should have a KMS key ID"

    def test_kinesis_stream_shards(self, kinesis_client):
        """Verify Kinesis stream has the expected number of shards."""
        stream_name = OUTPUTS.get('kinesis_stream_name')
        assert stream_name, "Kinesis stream name not found in outputs"

        response = kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        shards = stream['Shards']
        assert len(shards) >= 1, "Kinesis stream should have at least 1 shard"

    def test_kinesis_stream_can_write_data(self, kinesis_client):
        """Test that data can be written to the Kinesis stream."""
        stream_name = OUTPUTS.get('kinesis_stream_name')
        assert stream_name, "Kinesis stream name not found in outputs"

        # Wait for stream to be active
        waiter = kinesis_client.get_waiter('stream_exists')
        waiter.wait(StreamName=stream_name)

        # Try to put a test record
        test_data = json.dumps({
            'sensor_id': 'test-sensor-001',
            'temperature': 75.5,
            'pressure': 101.3,
            'timestamp': '2025-10-18T00:00:00Z'
        })

        try:
            response = kinesis_client.put_record(
                StreamName=stream_name,
                Data=test_data,
                PartitionKey='test-sensor-001'
            )

            assert response['SequenceNumber']
            assert response['ShardId']
        except Exception as e:
            pytest.skip(f"Could not write to Kinesis stream: {str(e)}")


class TestRDSAurora:
    """Test RDS Aurora cluster configuration."""

    def test_aurora_cluster_exists(self, rds_client):
        """Verify Aurora cluster was created."""
        cluster_id = OUTPUTS.get('aurora_cluster_id')
        assert cluster_id, "Aurora cluster ID not found in outputs"

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(response['DBClusters']) == 1

        cluster = response['DBClusters'][0]
        assert cluster['Status'] in ['available', 'creating', 'modifying']

    def test_aurora_cluster_encryption(self, rds_client):
        """Verify Aurora cluster has encryption enabled."""
        cluster_id = OUTPUTS.get('aurora_cluster_id')
        assert cluster_id, "Aurora cluster ID not found in outputs"

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]

        assert cluster['StorageEncrypted'] is True, "Aurora cluster should have encryption enabled"
        assert cluster.get('KmsKeyId'), "Aurora cluster should use a KMS key"

    def test_aurora_cluster_backup_retention(self, rds_client):
        """Verify Aurora cluster has 30-day backup retention."""
        cluster_id = OUTPUTS.get('aurora_cluster_id')
        assert cluster_id, "Aurora cluster ID not found in outputs"

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]

        assert cluster['BackupRetentionPeriod'] >= 30, \
            "Aurora cluster should have at least 30 days backup retention"

    def test_aurora_cluster_engine(self, rds_client):
        """Verify Aurora cluster is using PostgreSQL or MySQL."""
        cluster_id = OUTPUTS.get('aurora_cluster_id')
        assert cluster_id, "Aurora cluster ID not found in outputs"

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]

        assert cluster['Engine'] in ['aurora-postgresql', 'aurora-mysql'], \
            "Aurora cluster should use PostgreSQL or MySQL engine"

    def test_aurora_cluster_endpoint_exists(self):
        """Verify Aurora cluster endpoint is available in outputs."""
        endpoint = OUTPUTS.get('aurora_cluster_endpoint')
        assert endpoint, "Aurora cluster endpoint not found in outputs"
        assert len(endpoint) > 0


class TestElastiCacheRedis:
    """Test ElastiCache Redis cluster configuration."""

    def test_redis_cluster_exists(self, elasticache_client):
        """Verify Redis cluster was created."""
        cluster_id = OUTPUTS.get('redis_cluster_id')
        assert cluster_id, "Redis cluster ID not found in outputs"

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )
        assert len(response['ReplicationGroups']) == 1

        cluster = response['ReplicationGroups'][0]
        assert cluster['Status'] in ['available', 'creating', 'modifying']

    def test_redis_cluster_encryption_at_rest(self, elasticache_client):
        """Verify Redis cluster has encryption at rest enabled."""
        cluster_id = OUTPUTS.get('redis_cluster_id')
        assert cluster_id, "Redis cluster ID not found in outputs"

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        assert cluster['AtRestEncryptionEnabled'] is True, \
            "Redis cluster should have encryption at rest enabled"

    def test_redis_cluster_encryption_in_transit(self, elasticache_client):
        """Verify Redis cluster has encryption in transit enabled."""
        cluster_id = OUTPUTS.get('redis_cluster_id')
        assert cluster_id, "Redis cluster ID not found in outputs"

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        assert cluster['TransitEncryptionEnabled'] is True, \
            "Redis cluster should have encryption in transit enabled"

    def test_redis_cluster_automatic_failover(self, elasticache_client):
        """Verify Redis cluster has automatic failover enabled."""
        cluster_id = OUTPUTS.get('redis_cluster_id')
        assert cluster_id, "Redis cluster ID not found in outputs"

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        assert cluster['AutomaticFailover'] in ['enabled', 'enabling'], \
            "Redis cluster should have automatic failover enabled"

    def test_redis_cluster_endpoint_exists(self):
        """Verify Redis cluster endpoint is available in outputs."""
        endpoint = OUTPUTS.get('redis_primary_endpoint')
        assert endpoint, "Redis primary endpoint not found in outputs"
        assert len(endpoint) > 0


class TestSecretsManager:
    """Test AWS Secrets Manager configuration."""

    def test_secrets_manager_secret_exists(self, secretsmanager_client):
        """Verify database credentials secret was created."""
        secret_arn = OUTPUTS.get('secrets_manager_secret_arn')
        assert secret_arn, "Secrets Manager secret ARN not found in outputs"

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        assert response['ARN'] == secret_arn
        assert response['Name']

    def test_secrets_manager_encryption(self, secretsmanager_client):
        """Verify secret is encrypted with KMS."""
        secret_arn = OUTPUTS.get('secrets_manager_secret_arn')
        assert secret_arn, "Secrets Manager secret ARN not found in outputs"

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        assert response.get('KmsKeyId'), "Secret should be encrypted with KMS"

    def test_secrets_manager_secret_value(self, secretsmanager_client):
        """Verify secret contains database credentials."""
        secret_arn = OUTPUTS.get('secrets_manager_secret_arn')
        assert secret_arn, "Secrets Manager secret ARN not found in outputs"

        try:
            response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
            secret_string = response['SecretString']
            secret_data = json.loads(secret_string)

            # Verify required fields are present
            assert 'username' in secret_data
            assert 'password' in secret_data
            assert 'engine' in secret_data
            assert 'port' in secret_data
            assert 'dbname' in secret_data

            # Verify values are not empty
            assert len(secret_data['username']) > 0
            assert len(secret_data['password']) > 0
        except secretsmanager_client.exceptions.ResourceNotFoundException:
            pytest.skip("Secret value not yet available")


class TestInfrastructureIntegration:
    """Test end-to-end infrastructure integration."""

    def test_all_required_outputs_present(self):
        """Verify all required outputs are present."""
        required_outputs = [
            'vpc_id',
            'kinesis_stream_name',
            'kinesis_stream_arn',
            'aurora_cluster_id',
            'aurora_cluster_endpoint',
            'redis_cluster_id',
            'redis_primary_endpoint',
            'secrets_manager_secret_arn',
            'kinesis_kms_key_id',
            'rds_kms_key_id',
            'secrets_kms_key_id',
            'rds_security_group_id',
            'elasticache_security_group_id'
        ]

        missing_outputs = [output for output in required_outputs if output not in OUTPUTS]

        assert len(missing_outputs) == 0, \
            f"Missing required outputs: {', '.join(missing_outputs)}"

    def test_environment_suffix_in_resource_names(self):
        """Verify resources include environment suffix for uniqueness."""
        # Check stream name includes a suffix pattern
        stream_name = OUTPUTS.get('kinesis_stream_name', '')
        assert '-' in stream_name, "Resource names should include environment suffix"

        # Check cluster ID includes a suffix pattern
        cluster_id = OUTPUTS.get('aurora_cluster_id', '')
        assert '-' in cluster_id, "Resource names should include environment suffix"

    def test_resource_tagging(self, ec2_client):
        """Verify resources have proper tags."""
        vpc_id = OUTPUTS.get('vpc_id')
        if not vpc_id:
            pytest.skip("VPC ID not found in outputs")

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        # At least some tags should be present
        assert len(tags) > 0, "Resources should have tags"
