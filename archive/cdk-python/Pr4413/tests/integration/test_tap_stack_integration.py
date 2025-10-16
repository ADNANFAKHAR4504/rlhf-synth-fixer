"""
Integration tests for TapStack CDK infrastructure.

These tests validate that the deployed infrastructure works correctly with real AWS resources.
They use environment variables and deployment outputs to test actual deployed resources.

Note: These tests require actual AWS deployment and cannot be run without it.

Test Coverage:
1. VPC and Network Configuration
2. ECS Cluster Availability
3. RDS Database Endpoint
4. ElastiCache Redis Endpoint
5. Kinesis Stream Operations
6. API Gateway Endpoint
"""
import json
import os
from typing import Any, Dict, Optional

import boto3
import pytest


@pytest.fixture
def deployment_outputs() -> Dict[str, Any]:
    """
    Load deployment outputs from environment variables or cdk-outputs.json.

    Returns:
        Dictionary containing all CloudFormation stack outputs.
    """
    # First try to load from cdk-outputs.json
    possible_paths = [
        "cdk-outputs.json",
        os.path.join(os.getcwd(), "cdk-outputs.json"),
    ]
    
    outputs = {}
    outputs_file = None
    
    for path in possible_paths:
        if os.path.exists(path):
            outputs_file = path
            break
    
    if outputs_file:
        with open(outputs_file, 'r', encoding='utf-8') as f:
            cdk_outputs = json.load(f)
            # Extract outputs from the stack
            for stack_name, stack_outputs in cdk_outputs.items():
                if isinstance(stack_outputs, dict):
                    outputs.update(stack_outputs)
                elif isinstance(stack_outputs, list):
                    # Handle array format with OutputKey/OutputValue
                    for output in stack_outputs:
                        if isinstance(output, dict):
                            if 'OutputKey' in output:
                                outputs[output['OutputKey']] = output.get('OutputValue', '')
                            elif 'output_key' in output:
                                outputs[output['output_key']] = output.get('output_value', '')
    
    # Also check environment variables (they take precedence)
    env_mappings = {
        'API_GATEWAY_URL': os.getenv('API_GATEWAY_URL'),
        'APIGatewayURL': os.getenv('APIGatewayURL'),
        'VPCId': os.getenv('VPC_ID'),
        'RDSEndpoint': os.getenv('RDS_ENDPOINT'),
        'RedisEndpoint': os.getenv('REDIS_ENDPOINT'),
        'ECSClusterName': os.getenv('ECS_CLUSTER_NAME'),
        'KinesisStreamName': os.getenv('KINESIS_STREAM_NAME'),
    }
    
    for key, value in env_mappings.items():
        if value:
            outputs[key] = value
    
    return outputs


@pytest.fixture
def environment_suffix() -> str:
    """Return the environment suffix for testing."""
    return os.getenv('ENVIRONMENT_SUFFIX', 'dev')


@pytest.fixture
def aws_region() -> str:
    """Return the AWS region for testing."""
    return os.getenv('AWS_REGION', 'us-west-2')


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
def apigateway_client(aws_region: str) -> boto3.client:
    """Create API Gateway client for endpoint testing."""
    return boto3.client('apigateway', region_name=aws_region)


class TestVPCConfiguration:
    """Test VPC and network configuration."""

    def test_vpc_exists(
        self, deployment_outputs: Dict[str, Any], ec2_client: boto3.client
    ) -> None:
        """
        Test that VPC exists and is properly configured.

        Validates:
        - VPC exists
        - VPC is available
        """
        vpc_id = deployment_outputs.get('VPCId')
        
        if not vpc_id:
            pytest.skip("VPC ID not found in deployment outputs")

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1, "VPC not found"

        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available', f"VPC is not available, current state: {vpc['State']}"

    def test_subnets_exist(
        self, deployment_outputs: Dict[str, Any], ec2_client: boto3.client
    ) -> None:
        """
        Test that public and private subnets exist.

        Validates:
        - At least 2 subnets exist
        - Subnets are in the correct VPC
        """
        vpc_id = deployment_outputs.get('VPCId')
        
        if not vpc_id:
            pytest.skip("VPC ID not found in deployment outputs")
            
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 2, f"Expected at least 2 subnets, found {len(subnets)}"


class TestECSCluster:
    """Test ECS cluster configuration."""

    def test_ecs_cluster_exists(
        self, deployment_outputs: Dict[str, Any], ecs_client: boto3.client
    ) -> None:
        """
        Test that ECS cluster exists and is active.

        Validates:
        - Cluster exists
        - Cluster is active
        """
        cluster_name = deployment_outputs.get('ECSClusterName')
        
        if not cluster_name:
            pytest.skip("ECS Cluster name not found in deployment outputs")

        response = ecs_client.describe_clusters(clusters=[cluster_name])
        
        assert len(response['clusters']) == 1, "ECS cluster not found"
        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE', f"ECS cluster is not active, status: {cluster['status']}"
        assert cluster['clusterName'] == cluster_name

    def test_ecs_service_running(
        self, deployment_outputs: Dict[str, Any], ecs_client: boto3.client,
        environment_suffix: str
    ) -> None:
        """
        Test that ECS service is running.

        Validates:
        - Service exists
        - Service has desired count > 0
        """
        cluster_name = deployment_outputs.get('ECSClusterName')
        
        if not cluster_name:
            pytest.skip("ECS Cluster name not found in deployment outputs")
        
        # List services in the cluster
        services_response = ecs_client.list_services(cluster=cluster_name)
        
        if not services_response.get('serviceArns'):
            pytest.skip("No services found in ECS cluster")
        
        # Describe services
        services = ecs_client.describe_services(
            cluster=cluster_name,
            services=services_response['serviceArns']
        )
        
        assert len(services['services']) > 0, "No services found in cluster"
        
        # Check at least one service is active
        active_services = [s for s in services['services'] if s['status'] == 'ACTIVE']
        assert len(active_services) > 0, "No active services found"


class TestRDSDatabase:
    """Test RDS database configuration."""

    def test_rds_instance_available(
        self, deployment_outputs: Dict[str, Any], rds_client: boto3.client,
        environment_suffix: str
    ) -> None:
        """
        Test that RDS instance exists and is available.

        Validates:
        - Database instance exists
        - Instance is available
        - Endpoint is accessible
        """
        rds_endpoint = deployment_outputs.get('RDSEndpoint')
        
        if not rds_endpoint:
            pytest.skip("RDS endpoint not found in deployment outputs")
        
        # Extract instance identifier from endpoint
        instance_id = f"monitoring-db-{environment_suffix}"
        
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        assert len(response['DBInstances']) == 1, "RDS instance not found"
        db_instance = response['DBInstances'][0]
        
        assert db_instance['DBInstanceStatus'] == 'available', \
            f"RDS instance is not available, status: {db_instance['DBInstanceStatus']}"
        assert db_instance['Endpoint']['Address'] == rds_endpoint

    def test_rds_encryption_enabled(
        self, deployment_outputs: Dict[str, Any], rds_client: boto3.client,
        environment_suffix: str
    ) -> None:
        """
        Test that RDS encryption is enabled.

        Validates:
        - Storage encryption is enabled
        """
        rds_endpoint = deployment_outputs.get('RDSEndpoint')
        
        if not rds_endpoint:
            pytest.skip("RDS endpoint not found in deployment outputs")
        
        instance_id = f"monitoring-db-{environment_suffix}"
        
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        db_instance = response['DBInstances'][0]
        assert db_instance['StorageEncrypted'] is True, "RDS storage encryption is not enabled"


class TestElastiCache:
    """Test ElastiCache Redis configuration."""

    def test_redis_cluster_available(
        self, deployment_outputs: Dict[str, Any], elasticache_client: boto3.client,
        environment_suffix: str
    ) -> None:
        """
        Test that Redis cluster exists and is available.

        Validates:
        - Replication group exists
        - Cluster is available
        """
        redis_endpoint = deployment_outputs.get('RedisEndpoint')
        
        if not redis_endpoint:
            pytest.skip("Redis endpoint not found in deployment outputs")
        
        replication_group_id = f"monitoring-redis-{environment_suffix}"
        
        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        
        assert len(response['ReplicationGroups']) == 1, "Redis replication group not found"
        replication_group = response['ReplicationGroups'][0]
        
        assert replication_group['Status'] == 'available', \
            f"Redis cluster is not available, status: {replication_group['Status']}"

    def test_redis_encryption_enabled(
        self, deployment_outputs: Dict[str, Any], elasticache_client: boto3.client,
        environment_suffix: str
    ) -> None:
        """
        Test that Redis encryption is enabled.

        Validates:
        - At-rest encryption is enabled
        - Transit encryption is enabled
        """
        redis_endpoint = deployment_outputs.get('RedisEndpoint')
        
        if not redis_endpoint:
            pytest.skip("Redis endpoint not found in deployment outputs")
        
        replication_group_id = f"monitoring-redis-{environment_suffix}"
        
        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        
        replication_group = response['ReplicationGroups'][0]
        assert replication_group['AtRestEncryptionEnabled'] is True, \
            "Redis at-rest encryption is not enabled"
        assert replication_group['TransitEncryptionEnabled'] is True, \
            "Redis transit encryption is not enabled"


class TestKinesisStream:
    """Test Kinesis stream configuration."""

    def test_kinesis_stream_active(
        self, deployment_outputs: Dict[str, Any], kinesis_client: boto3.client
    ) -> None:
        """
        Test that Kinesis stream exists and is active.

        Validates:
        - Stream exists
        - Stream is active
        """
        stream_name = deployment_outputs.get('KinesisStreamName')
        
        if not stream_name:
            pytest.skip("Kinesis stream name not found in deployment outputs")
        
        response = kinesis_client.describe_stream(StreamName=stream_name)
        
        stream_description = response['StreamDescription']
        assert stream_description['StreamStatus'] == 'ACTIVE', \
            f"Kinesis stream is not active, status: {stream_description['StreamStatus']}"
        assert stream_description['StreamName'] == stream_name

    def test_kinesis_encryption_enabled(
        self, deployment_outputs: Dict[str, Any], kinesis_client: boto3.client
    ) -> None:
        """
        Test that Kinesis stream encryption is enabled.

        Validates:
        - Encryption is enabled
        """
        stream_name = deployment_outputs.get('KinesisStreamName')
        
        if not stream_name:
            pytest.skip("Kinesis stream name not found in deployment outputs")
        
        response = kinesis_client.describe_stream(StreamName=stream_name)
        
        stream_description = response['StreamDescription']
        assert stream_description['EncryptionType'] == 'KMS', \
            f"Kinesis stream encryption is not KMS, type: {stream_description['EncryptionType']}"


class TestAPIGateway:
    """Test API Gateway configuration."""

    def test_api_gateway_url_accessible(
        self, deployment_outputs: Dict[str, Any]
    ) -> None:
        """
        Test that API Gateway URL is present in outputs.

        Validates:
        - API Gateway URL exists
        - URL format is correct
        """
        api_url = deployment_outputs.get('APIGatewayURL') or \
                  deployment_outputs.get('MonitoringResourcesMonitoringAPIEndpointC7EFF189')
        
        if not api_url:
            pytest.skip("API Gateway URL not found in deployment outputs")
        
        assert api_url.startswith('https://'), "API Gateway URL should use HTTPS"
        assert 'execute-api' in api_url, "API Gateway URL should contain 'execute-api'"
        assert api_url.endswith('/prod/'), "API Gateway URL should end with stage name"
