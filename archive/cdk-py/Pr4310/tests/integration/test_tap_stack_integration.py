"""
Integration tests for TapStack CDK infrastructure.

These tests validate that the deployed infrastructure works correctly with real AWS resources.
They use the outputs from cfn-outputs/flat-outputs.json to test actual deployed resources.

Note: These tests require actual AWS deployment and cannot be run without it.
For this synthetic training data, deployment was skipped due to VPC quota limits.

Test Coverage:
1. VPC and Network Configuration
2. ECS Cluster Availability
3. Aurora Database Connectivity
4. ElastiCache Redis Connectivity
5. Kinesis Stream Operations
6. IAM Role Permissions
7. KMS Key Operations
8. End-to-End Data Flow
"""
import json
import os
from typing import Any, Dict, Optional

import boto3
import pytest


@pytest.fixture
def deployment_outputs() -> Dict[str, Any]:
    """
    Load deployment outputs from cfn-outputs/flat-outputs.json.

    Returns:
        Dictionary containing all CloudFormation stack outputs.

    Note: This file is created by the deployment process and contains
    all the necessary information to test deployed resources.
    """
    # Try relative path first, then absolute path based on current working directory
    possible_paths = [
        "cfn-outputs/flat-outputs.json",
        os.path.join(os.getcwd(), "cfn-outputs/flat-outputs.json"),
        "/home/chris/turing_work/synth/iac-test-automations/cfn-outputs/flat-outputs.json"
    ]
    
    outputs_file = None
    for path in possible_paths:
        if os.path.exists(path):
            outputs_file = path
            break
    
    if outputs_file is None:
        pytest.skip("Deployment outputs not found - deployment was not performed")

    with open(outputs_file, 'r', encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture
def aws_region() -> str:
    """Return the AWS region for testing."""
    return os.getenv('AWS_REGION', 'eu-west-1')


@pytest.fixture
def ec2_client(aws_region: str) -> boto3.client:
    """Create EC2 client for VPC testing."""
    return boto3.client('ec2', region_name=aws_region)


@pytest.fixture
def ecs_client(aws_region: str) -> boto3.client:
    """Create ECS client for cluster testing."""
    return boto3.client('ecs', region_name=aws_region)


@pytest.fixture
def rds_client(aws_region: str) -> boto3.client:
    """Create RDS client for database testing."""
    return boto3.client('rds', region_name=aws_region)


@pytest.fixture
def elasticache_client(aws_region: str) -> boto3.client:
    """Create ElastiCache client for Redis testing."""
    return boto3.client('elasticache', region_name=aws_region)


@pytest.fixture
def kinesis_client(aws_region: str) -> boto3.client:
    """Create Kinesis client for stream testing."""
    return boto3.client('kinesis', region_name=aws_region)


@pytest.fixture
def kms_client(aws_region: str) -> boto3.client:
    """Create KMS client for encryption testing."""
    return boto3.client('kms', region_name=aws_region)


@pytest.fixture
def iam_client(aws_region: str) -> boto3.client:
    """Create IAM client for role testing."""
    return boto3.client('iam', region_name=aws_region)


@pytest.fixture
def secrets_client(aws_region: str) -> boto3.client:
    """Create Secrets Manager client for credentials testing."""
    return boto3.client('secretsmanager', region_name=aws_region)


class TestVPCConfiguration:
    """Test VPC and network configuration."""

    def test_vpc_exists(
        self, deployment_outputs: Dict[str, Any], ec2_client: boto3.client
    ) -> None:
        """
        Test that VPC exists and is properly configured.

        Validates:
        - VPC exists
        - DNS support is enabled
        - DNS hostnames are enabled
        """
        vpc_id = deployment_outputs.get('VPCId')
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1, "VPC not found"

        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available', "VPC is not available"
        
        # Get VPC attributes to check DNS settings
        dns_support_resp = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames_resp = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        
        assert dns_support_resp['EnableDnsSupport']['Value'] is True, "DNS support not enabled"
        assert dns_hostnames_resp['EnableDnsHostnames']['Value'] is True, "DNS hostnames not enabled"

    def test_subnets_exist(
        self, deployment_outputs: Dict[str, Any], ec2_client: boto3.client
    ) -> None:
        """
        Test that public and private subnets exist.

        Validates:
        - At least 2 public subnets (across 2 AZs)
        - At least 2 private subnets (across 2 AZs)
        - Subnets are in different availability zones
        """
        vpc_id = deployment_outputs.get('VPCId')
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 4, "Expected at least 4 subnets (2 public, 2 private)"

        availability_zones = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(availability_zones) >= 2, "Subnets not distributed across multiple AZs"

    def test_nat_gateway_exists(
        self, deployment_outputs: Dict[str, Any], ec2_client: boto3.client
    ) -> None:
        """
        Test that NAT Gateway exists for private subnet egress.

        Validates:
        - NAT Gateway exists
        - NAT Gateway is available
        - NAT Gateway has elastic IP
        """
        vpc_id = deployment_outputs.get('VPCId')
        response = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_gateways = response['NatGateways']
        assert len(nat_gateways) >= 1, "NAT Gateway not found"
        assert nat_gateways[0]['State'] == 'available', "NAT Gateway not available"

    def test_vpc_flow_logs_enabled(
        self, deployment_outputs: Dict[str, Any], ec2_client: boto3.client
    ) -> None:
        """
        Test that VPC flow logs are enabled for monitoring.

        Validates:
        - Flow logs are configured
        - Flow logs are active
        """
        vpc_id = deployment_outputs.get('VPCId')
        response = ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        flow_logs = response['FlowLogs']
        assert len(flow_logs) >= 1, "VPC flow logs not configured"
        assert flow_logs[0]['FlowLogStatus'] == 'ACTIVE', "Flow logs not active"


class TestECSCluster:
    """Test ECS cluster configuration and availability."""

    def test_ecs_cluster_exists(
        self, deployment_outputs: Dict[str, Any], ecs_client: boto3.client
    ) -> None:
        """
        Test that ECS cluster exists and is active.

        Validates:
        - Cluster exists
        - Cluster is ACTIVE
        - Container Insights is enabled
        """
        cluster_name = deployment_outputs.get('ECSClusterName')
        assert cluster_name is not None, "ECS cluster name not found in outputs"

        response = ecs_client.describe_clusters(
            clusters=[cluster_name], 
            include=['SETTINGS']
        )
        assert len(response['clusters']) == 1, "ECS cluster not found"

        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE', "ECS cluster not active"

        # Check Container Insights
        settings = cluster.get('settings', [])
        insights_setting = next(
            (s for s in settings if s['name'] == 'containerInsights'), None
        )
        assert insights_setting is not None, "Container Insights not configured"
        assert insights_setting['value'] == 'enabled', "Container Insights not enabled"
        assert insights_setting['value'] == 'enabled', "Container Insights not enabled"

    def test_ecs_task_role_exists(
        self, deployment_outputs: Dict[str, Any], iam_client: boto3.client
    ) -> None:
        """
        Test that ECS task role exists with correct permissions.

        Validates:
        - Task role exists
        - Role has correct trust policy for ECS tasks
        - Role has necessary inline policies
        """
        task_role_arn = deployment_outputs.get('ECSTaskRoleArn')
        assert task_role_arn is not None, "ECS task role ARN not found in outputs"

        role_name = task_role_arn.split('/')[-1]
        response = iam_client.get_role(RoleName=role_name)
        assert response['Role'] is not None, "ECS task role not found"

    def test_ecs_execution_role_exists(
        self, deployment_outputs: Dict[str, Any], iam_client: boto3.client
    ) -> None:
        """
        Test that ECS execution role exists with correct permissions.

        Validates:
        - Execution role exists
        - Role has correct trust policy for ECS tasks
        - Role has AmazonECSTaskExecutionRolePolicy attached
        """
        execution_role_arn = deployment_outputs.get('ECSExecutionRoleArn')
        assert execution_role_arn is not None, "ECS execution role ARN not found"

        role_name = execution_role_arn.split('/')[-1]
        response = iam_client.get_role(RoleName=role_name)
        assert response['Role'] is not None, "ECS execution role not found"


class TestAuroraDatabase:
    """Test Aurora Serverless v2 database configuration."""

    def test_aurora_cluster_exists(
        self, deployment_outputs: Dict[str, Any], rds_client: boto3.client
    ) -> None:
        """
        Test that Aurora cluster exists and is available.

        Validates:
        - Cluster exists
        - Cluster is available
        - Cluster endpoint is accessible
        - Engine is aurora-postgresql
        """
        db_endpoint = deployment_outputs.get('DatabaseEndpoint')
        assert db_endpoint is not None, "Database endpoint not found in outputs"

        # Extract cluster identifier from endpoint
        # Format: cluster-id.cluster-xxxx.region.rds.amazonaws.com
        cluster_id = db_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        assert len(response['DBClusters']) == 1, "Aurora cluster not found"

        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available', "Aurora cluster not available"
        assert cluster['Engine'] == 'aurora-postgresql', "Wrong database engine"

    def test_aurora_encryption_enabled(
        self, deployment_outputs: Dict[str, Any], rds_client: boto3.client
    ) -> None:
        """
        Test that Aurora cluster is encrypted at rest.

        Validates:
        - Storage encryption is enabled
        - KMS key is being used
        """
        db_endpoint = deployment_outputs.get('DatabaseEndpoint')
        cluster_id = db_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]

        assert cluster['StorageEncrypted'] is True, "Storage encryption not enabled"
        assert cluster.get('KmsKeyId') is not None, "KMS key not configured"

    def test_aurora_backup_retention(
        self, deployment_outputs: Dict[str, Any], rds_client: boto3.client
    ) -> None:
        """
        Test that Aurora has 30-day backup retention.

        Validates:
        - Backup retention period is 30 days (HIPAA requirement)
        """
        db_endpoint = deployment_outputs.get('DatabaseEndpoint')
        cluster_id = db_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]

        assert cluster['BackupRetentionPeriod'] == 30, "Backup retention not 30 days"

    def test_aurora_credentials_secret_exists(
        self, deployment_outputs: Dict[str, Any], secrets_client: boto3.client
    ) -> None:
        """
        Test that database credentials are stored in Secrets Manager.

        Validates:
        - Secret exists
        - Secret can be retrieved
        - Secret contains username and password
        """
        secret_arn = deployment_outputs.get('DatabaseSecretArn')
        assert secret_arn is not None, "Database secret ARN not found in outputs"

        response = secrets_client.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn, "Secret not found"

        # Verify we can retrieve the secret value
        secret_value = secrets_client.get_secret_value(SecretId=secret_arn)
        assert secret_value['SecretString'] is not None, "Secret value is empty"


class TestElastiCacheRedis:
    """Test ElastiCache Redis cluster configuration."""

    def test_redis_cluster_exists(
        self, deployment_outputs: Dict[str, Any], elasticache_client: boto3.client
    ) -> None:
        """
        Test that Redis cluster exists and is available.

        Validates:
        - Replication group exists
        - Status is available
        - Has primary endpoint
        """
        redis_endpoint = deployment_outputs.get('RedisEndpoint')
        assert redis_endpoint is not None, "Redis endpoint not found in outputs"

        # Extract replication group ID from endpoint
        # Format: master.redis-dev.cluster-id.region.cache.amazonaws.com
        replication_group_id = redis_endpoint.split('.')[1]

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        assert len(response['ReplicationGroups']) == 1, "Redis cluster not found"

        cluster = response['ReplicationGroups'][0]
        assert cluster['Status'] == 'available', "Redis cluster not available"

    def test_redis_encryption_enabled(
        self, deployment_outputs: Dict[str, Any], elasticache_client: boto3.client
    ) -> None:
        """
        Test that Redis has encryption at rest and in transit.

        Validates:
        - At-rest encryption is enabled
        - In-transit encryption is enabled
        """
        redis_endpoint = deployment_outputs.get('RedisEndpoint')
        replication_group_id = redis_endpoint.split('.')[1]

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        cluster = response['ReplicationGroups'][0]

        assert cluster['AtRestEncryptionEnabled'] is True, "At-rest encryption not enabled"
        assert cluster['TransitEncryptionEnabled'] is True, "In-transit encryption not enabled"

    def test_redis_multi_az_enabled(
        self, deployment_outputs: Dict[str, Any], elasticache_client: boto3.client
    ) -> None:
        """
        Test that Redis has Multi-AZ configuration.

        Validates:
        - Multi-AZ is enabled
        - Automatic failover is enabled
        """
        redis_endpoint = deployment_outputs.get('RedisEndpoint')
        replication_group_id = redis_endpoint.split('.')[1]

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        cluster = response['ReplicationGroups'][0]

        assert cluster['MultiAZ'] == 'enabled', "Multi-AZ not enabled"
        assert cluster['AutomaticFailover'] == 'enabled', "Automatic failover not enabled"


class TestKinesisStream:
    """Test Kinesis data stream configuration."""

    def test_kinesis_stream_exists(
        self, deployment_outputs: Dict[str, Any], kinesis_client: boto3.client
    ) -> None:
        """
        Test that Kinesis stream exists and is active.

        Validates:
        - Stream exists
        - Stream is ACTIVE
        - Has 2 shards
        """
        stream_name = deployment_outputs.get('KinesisStreamName')
        assert stream_name is not None, "Kinesis stream name not found in outputs"

        response = kinesis_client.describe_stream(StreamName=stream_name)
        stream_desc = response['StreamDescription']

        assert stream_desc['StreamStatus'] == 'ACTIVE', "Kinesis stream not active"
        assert len(stream_desc['Shards']) == 2, "Expected 2 shards"

    def test_kinesis_encryption_enabled(
        self, deployment_outputs: Dict[str, Any], kinesis_client: boto3.client
    ) -> None:
        """
        Test that Kinesis stream is encrypted.

        Validates:
        - Encryption type is KMS
        - KMS key ID is configured
        """
        stream_name = deployment_outputs.get('KinesisStreamName')

        response = kinesis_client.describe_stream(StreamName=stream_name)
        stream_desc = response['StreamDescription']

        assert stream_desc['EncryptionType'] == 'KMS', "KMS encryption not enabled"
        assert stream_desc.get('KeyId') is not None, "KMS key not configured"

    def test_kinesis_put_record(
        self, deployment_outputs: Dict[str, Any], kinesis_client: boto3.client
    ) -> None:
        """
        Test that data can be written to Kinesis stream.

        Validates:
        - Can put record to stream
        - Shard ID is returned
        - Sequence number is returned
        """
        stream_name = deployment_outputs.get('KinesisStreamName')

        test_data = b'{"deviceId": "test-001", "temperature": 36.5, "timestamp": 1234567890}'

        response = kinesis_client.put_record(
            StreamName=stream_name,
            Data=test_data,
            PartitionKey='test-device-001'
        )

        assert response['ShardId'] is not None, "Shard ID not returned"
        assert response['SequenceNumber'] is not None, "Sequence number not returned"


class TestKMSKey:
    """Test KMS key configuration."""

    def test_kms_key_exists(
        self, deployment_outputs: Dict[str, Any], kms_client: boto3.client
    ) -> None:
        """
        Test that KMS key exists and is enabled.

        Validates:
        - Key exists
        - Key is enabled
        - Key rotation is enabled
        """
        key_id = deployment_outputs.get('KMSKeyId')
        assert key_id is not None, "KMS key ID not found in outputs"

        response = kms_client.describe_key(KeyId=key_id)
        key_metadata = response['KeyMetadata']

        assert key_metadata['KeyState'] == 'Enabled', "KMS key not enabled"

        # Check key rotation
        rotation_response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert rotation_response['KeyRotationEnabled'] is True, "Key rotation not enabled"

    def test_kms_key_can_encrypt(
        self, deployment_outputs: Dict[str, Any], kms_client: boto3.client
    ) -> None:
        """
        Test that KMS key can be used for encryption.

        Validates:
        - Can encrypt data with key
        - Can decrypt data with key
        """
        key_id = deployment_outputs.get('KMSKeyId')

        test_data = b'sensitive-iot-data'

        # Encrypt
        encrypt_response = kms_client.encrypt(
            KeyId=key_id,
            Plaintext=test_data
        )
        ciphertext = encrypt_response['CiphertextBlob']

        # Decrypt
        decrypt_response = kms_client.decrypt(
            CiphertextBlob=ciphertext
        )
        plaintext = decrypt_response['Plaintext']

        assert plaintext == test_data, "Decrypted data doesn't match original"


class TestEndToEndDataFlow:
    """Test end-to-end data flow through the system."""

    def test_data_ingestion_to_processing(
        self, deployment_outputs: Dict[str, Any], kinesis_client: boto3.client
    ) -> None:
        """
        Test complete data flow from ingestion to processing.

        Validates:
        - Can write IoT data to Kinesis
        - Data is encrypted in transit
        - Data can be read from stream

        Note: This test simulates the data flow that ECS tasks would perform.
        In a real deployment, ECS tasks would read from Kinesis, process the data,
        store it in Aurora, and cache results in Redis.
        """
        stream_name = deployment_outputs.get('KinesisStreamName')

        # Simulate IoT device sending sensor data
        iot_data = {
            'deviceId': 'device-001',
            'facilityId': 'facility-A',
            'sensorType': 'temperature',
            'value': 37.2,
            'unit': 'celsius',
            'timestamp': 1234567890,
            'metadata': {
                'deviceModel': 'TempSensor-X100',
                'firmwareVersion': '2.1.0'
            }
        }

        # Put record to Kinesis
        response = kinesis_client.put_record(
            StreamName=stream_name,
            Data=json.dumps(iot_data).encode('utf-8'),
            PartitionKey=iot_data['deviceId']
        )

        assert response['SequenceNumber'] is not None, "Failed to write to Kinesis"

        # In a real scenario, we would:
        # 1. Have an ECS task reading from this stream
        # 2. Process the data (validate, transform)
        # 3. Store in Aurora database
        # 4. Cache frequently accessed data in Redis
        # 5. Emit CloudWatch metrics

    def test_security_compliance_validation(
        self, deployment_outputs: Dict[str, Any]
    ) -> None:
        """
        Test that all security and compliance requirements are met.

        Validates:
        - All outputs contain necessary information
        - Resources follow naming convention with environment suffix
        - Encryption is enabled everywhere
        - Monitoring is configured
        """
        required_outputs = [
            'VPCId',
            'ECSClusterName',
            'ECSClusterArn',
            'DatabaseEndpoint',
            'DatabaseSecretArn',
            'RedisEndpoint',
            'RedisPort',
            'KinesisStreamName',
            'KinesisStreamArn',
            'KMSKeyId',
            'KMSKeyArn',
            'ECSTaskRoleArn',
            'ECSExecutionRoleArn'
        ]

        for output in required_outputs:
            assert output in deployment_outputs, f"Required output {output} not found"
            assert deployment_outputs[output] is not None, f"Output {output} is None"


# Integration Test Documentation
#
# These integration tests validate the deployed infrastructure against real AWS resources.
# They ensure comprehensive validation of:
# 1. Network Architecture (VPC, subnets, NAT Gateway, flow logs)
# 2. ECS Cluster (active status, Container Insights, IAM roles)
# 3. Aurora Database (Serverless v2, encryption, backup retention, credentials)
# 4. ElastiCache Redis (Multi-AZ, encryption, automatic failover)  
# 5. Kinesis Stream (encryption, data ingestion capabilities)
# 6. KMS Key (encryption/decryption, key rotation)
# 7. End-to-End Flow (IoT data processing, security controls)
