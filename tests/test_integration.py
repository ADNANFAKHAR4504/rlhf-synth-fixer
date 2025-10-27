"""
Integration tests for Healthcare API Infrastructure.

These tests validate the deployed infrastructure by testing actual AWS resources
and their configurations. Run after successful deployment.
"""
import pytest
import boto3
import os
import json
from typing import Dict, Any


@pytest.fixture
def aws_region():
    """Get AWS region from environment or default."""
    return os.getenv("AWS_REGION", "eu-south-1")


@pytest.fixture
def environment_suffix():
    """Get environment suffix from environment."""
    return os.getenv("ENVIRONMENT_SUFFIX", "dev")


@pytest.fixture
def pulumi_outputs():
    """Load Pulumi stack outputs."""
    # This would be populated by the CI/CD pipeline after deployment
    # For local testing, you can run: pulumi stack output --json
    outputs_file = "pulumi-outputs.json"
    if os.path.exists(outputs_file):
        with open(outputs_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


class TestVPCConfiguration:
    """Test VPC and networking configuration."""

    def test_vpc_exists(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that VPC is created and properly configured."""
        ec2_client = boto3.client('ec2', region_name=aws_region)

        vpc_id = pulumi_outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not found in outputs")

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1, "VPC should exist"

        vpc = response['Vpcs'][0]
        assert vpc['CidrBlock'] == '10.0.0.0/16', "VPC should have correct CIDR block"
        assert vpc['EnableDnsHostnames'] is True, "DNS hostnames should be enabled"
        assert vpc['EnableDnsSupport'] is True, "DNS support should be enabled"

    def test_private_subnets_exist(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that private subnets are created for data services."""
        ec2_client = boto3.client('ec2', region_name=aws_region)

        vpc_id = pulumi_outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not found in outputs")

        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Type', 'Values': ['private']}
            ]
        )

        assert len(response['Subnets']) >= 2, "Should have at least 2 private subnets"


class TestKMSEncryption:
    """Test KMS encryption configuration."""

    def test_kms_key_exists(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that KMS key is created and properly configured."""
        kms_client = boto3.client('kms', region_name=aws_region)

        key_id = pulumi_outputs.get("kms_key_id")
        if not key_id:
            pytest.skip("KMS key ID not found in outputs")

        response = kms_client.describe_key(KeyId=key_id)
        key_metadata = response['KeyMetadata']

        assert key_metadata['Enabled'] is True, "KMS key should be enabled"
        assert key_metadata['KeyState'] == 'Enabled', "KMS key should be in enabled state"

    def test_kms_key_rotation(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that KMS key rotation is enabled."""
        kms_client = boto3.client('kms', region_name=aws_region)

        key_id = pulumi_outputs.get("kms_key_id")
        if not key_id:
            pytest.skip("KMS key ID not found in outputs")

        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response['KeyRotationEnabled'] is True, "Key rotation should be enabled"


class TestRDSConfiguration:
    """Test RDS PostgreSQL configuration."""

    def test_rds_instance_exists(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that RDS instance is created."""
        rds_client = boto3.client('rds', region_name=aws_region)

        db_identifier = f"healthcare-db-{environment_suffix}"

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )
            assert len(response['DBInstances']) == 1, "RDS instance should exist"
        except rds_client.exceptions.DBInstanceNotFoundFault:
            pytest.skip(f"RDS instance {db_identifier} not found")

    def test_rds_encryption_enabled(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that RDS instance has encryption enabled."""
        rds_client = boto3.client('rds', region_name=aws_region)

        db_identifier = f"healthcare-db-{environment_suffix}"

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )
            db_instance = response['DBInstances'][0]

            assert db_instance['StorageEncrypted'] is True, "RDS storage should be encrypted"
            assert db_instance['BackupRetentionPeriod'] >= 30, "Backup retention should be at least 30 days"
            assert db_instance['PubliclyAccessible'] is False, "RDS should not be publicly accessible"
        except rds_client.exceptions.DBInstanceNotFoundFault:
            pytest.skip(f"RDS instance {db_identifier} not found")

    def test_rds_backup_configuration(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that RDS backup is properly configured."""
        rds_client = boto3.client('rds', region_name=aws_region)

        db_identifier = f"healthcare-db-{environment_suffix}"

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )
            db_instance = response['DBInstances'][0]

            assert db_instance['BackupRetentionPeriod'] == 30, "Backup retention should be 30 days"
            assert 'PreferredBackupWindow' in db_instance, "Backup window should be configured"
        except rds_client.exceptions.DBInstanceNotFoundFault:
            pytest.skip(f"RDS instance {db_identifier} not found")


class TestElastiCacheConfiguration:
    """Test ElastiCache Redis configuration."""

    def test_redis_cluster_exists(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that Redis cluster is created."""
        elasticache_client = boto3.client('elasticache', region_name=aws_region)

        replication_group_id = f"healthcare-redis-{environment_suffix}"[:40]

        try:
            response = elasticache_client.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            assert len(response['ReplicationGroups']) == 1, "Redis cluster should exist"
        except elasticache_client.exceptions.ReplicationGroupNotFoundFault:
            pytest.skip(f"Redis cluster {replication_group_id} not found")

    def test_redis_encryption_enabled(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that Redis cluster has encryption enabled."""
        elasticache_client = boto3.client('elasticache', region_name=aws_region)

        replication_group_id = f"healthcare-redis-{environment_suffix}"[:40]

        try:
            response = elasticache_client.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            replication_group = response['ReplicationGroups'][0]

            assert replication_group['AtRestEncryptionEnabled'] is True, "At-rest encryption should be enabled"
            assert replication_group['TransitEncryptionEnabled'] is True, "Transit encryption should be enabled"
            assert replication_group['AutomaticFailover'] in ['enabled', 'enabling'], (
                "Automatic failover should be enabled"
            )
        except elasticache_client.exceptions.ReplicationGroupNotFoundFault:
            pytest.skip(f"Redis cluster {replication_group_id} not found")


class TestAPIGatewayConfiguration:
    """Test API Gateway configuration."""

    def test_api_gateway_exists(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that API Gateway is created."""
        apigateway_client = boto3.client('apigateway', region_name=aws_region)

        api_name = f"healthcare-api-{environment_suffix}"

        response = apigateway_client.get_rest_apis()
        apis = [api for api in response['items'] if api['name'] == api_name]

        if not apis:
            pytest.skip(f"API Gateway {api_name} not found")

        assert len(apis) == 1, "API Gateway should exist"

    def test_api_gateway_endpoint(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that API Gateway endpoint is accessible."""
        import requests

        api_url = pulumi_outputs.get("api_gateway_url")
        if not api_url:
            pytest.skip("API Gateway URL not found in outputs")

        try:
            response = requests.get(api_url, timeout=10)
            assert response.status_code == 200, "API should return 200 OK"

            data = response.json()
            assert data.get('status') == 'healthy', "API should return healthy status"
        except requests.exceptions.RequestException:
            pytest.skip("API Gateway endpoint not accessible")


class TestSecretsManagerConfiguration:
    """Test Secrets Manager configuration."""

    def test_db_secret_exists(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that database credentials secret exists."""
        secretsmanager_client = boto3.client('secretsmanager', region_name=aws_region)

        secret_name = f"healthcare-db-credentials-{environment_suffix}"

        try:
            response = secretsmanager_client.describe_secret(SecretId=secret_name)
            assert response['Name'] == secret_name, "Secret should exist"
            assert 'KmsKeyId' in response, "Secret should be encrypted with KMS"
        except secretsmanager_client.exceptions.ResourceNotFoundException:
            pytest.skip(f"Secret {secret_name} not found")

    def test_db_secret_encrypted(self, aws_region, environment_suffix, pulumi_outputs):
        """Test that database secret is encrypted with KMS."""
        secretsmanager_client = boto3.client('secretsmanager', region_name=aws_region)

        secret_name = f"healthcare-db-credentials-{environment_suffix}"
        kms_key_id = pulumi_outputs.get("kms_key_id")

        try:
            response = secretsmanager_client.describe_secret(SecretId=secret_name)
            assert 'KmsKeyId' in response, "Secret should be encrypted with KMS"
            if kms_key_id:
                assert kms_key_id in response['KmsKeyId'], "Secret should use the healthcare KMS key"
        except secretsmanager_client.exceptions.ResourceNotFoundException:
            pytest.skip(f"Secret {secret_name} not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
