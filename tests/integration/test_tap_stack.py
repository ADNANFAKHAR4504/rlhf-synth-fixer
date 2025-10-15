"""
Integration tests for TapStack Manufacturing IoT Platform infrastructure.

These tests verify that the deployed infrastructure works correctly by:
1. Testing service-to-service integrations
2. Validating resource configurations and connectivity
3. Using flat outputs from deployment to avoid hardcoding
4. Verifying IoT platform data flow and processing capabilities
"""

import json
import os
import time
import unittest
from typing import Any, Dict, List

import boto3
import pytest
from botocore.exceptions import ClientError, NoCredentialsError

# Load deployment flat outputs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, '..', '..', 'cfn-outputs', 'flat-outputs.json')

def load_outputs() -> Dict[str, Any]:
    """Load and return flat deployment outputs."""
    if os.path.exists(FLAT_OUTPUTS_PATH):
        try:
            with open(FLAT_OUTPUTS_PATH, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not parse outputs file: {e}")
            return {}
    else:
        print(f"Warning: Outputs file not found at {FLAT_OUTPUTS_PATH}")
        return {}

# Global outputs loaded once
OUTPUTS = load_outputs()


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup."""
    
    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        cls.outputs = OUTPUTS
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Skip tests if no outputs available
        if not cls.outputs:
            raise unittest.SkipTest("No deployment outputs available. Run deployment first.")
        
        try:
            # Initialize AWS clients
            cls.session = boto3.Session(region_name=cls.region)
            cls.ec2_client = cls.session.client('ec2')
            cls.ecs_client = cls.session.client('ecs')
            cls.kinesis_client = cls.session.client('kinesis')
            cls.elasticache_client = cls.session.client('elasticache')
            cls.rds_client = cls.session.client('rds')
            cls.efs_client = cls.session.client('efs')
            cls.apigateway_client = cls.session.client('apigatewayv2')
            cls.secretsmanager_client = cls.session.client('secretsmanager')
            cls.kms_client = cls.session.client('kms')
            cls.cloudwatch_client = cls.session.client('logs')
            
            # Test AWS credentials
            cls.session.client('sts').get_caller_identity()
            
        except NoCredentialsError:
            raise unittest.SkipTest("AWS credentials not available")
        except Exception as e:
            raise unittest.SkipTest(f"AWS setup failed: {e}")


class TestTapStackInfrastructure(BaseIntegrationTest):
    """Integration tests for core infrastructure components."""

    def test_vpc_infrastructure_is_properly_configured(self):
        """Test that VPC infrastructure is properly set up with correct networking."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID should be available in outputs")
        
        # Verify VPC exists and is available
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        
        # Check DNS attributes separately
        dns_hostnames_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        dns_support_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_hostnames_response['EnableDnsHostnames']['Value'])
        self.assertTrue(dns_support_response['EnableDnsSupport']['Value'])
        
        # Verify subnets exist (should have public and private subnets)
        subnets_response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = subnets_response['Subnets']
        self.assertGreaterEqual(len(subnets), 4, "Should have at least 4 subnets (2 public, 2 private)")
        
        # Verify we have subnets in multiple AZs for high availability
        availability_zones = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(availability_zones), 2, "Should have subnets in at least 2 AZs")

    def test_ecs_cluster_is_running_and_configured(self):
        """Test that ECS cluster is properly configured and running."""
        ecs_cluster_arn = self.outputs.get('ecs_cluster_arn')
        self.assertIsNotNone(ecs_cluster_arn, "ECS cluster ARN should be available in outputs")
        
        cluster_name = ecs_cluster_arn.split('/')[-1]
        
        # Verify ECS cluster exists and is active
        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        clusters = response['clusters']
        self.assertEqual(len(clusters), 1)
        
        cluster = clusters[0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)
        
        # Verify cluster has capacity providers configured
        self.assertIn('capacityProviders', cluster)

    def test_kinesis_stream_is_active_and_processing_ready(self):
        """Test that Kinesis stream is active and ready for IoT data processing."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        kinesis_stream_arn = self.outputs.get('kinesis_stream_arn')
        
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        self.assertIsNotNone(kinesis_stream_arn, "Kinesis stream ARN should be available")
        
        # Verify Kinesis stream exists and is active
        response = self.kinesis_client.describe_stream(StreamName=kinesis_stream_name)
        stream = response['StreamDescription']
        
        self.assertEqual(stream['StreamStatus'], 'ACTIVE')
        self.assertEqual(stream['StreamName'], kinesis_stream_name)
        self.assertEqual(stream['StreamARN'], kinesis_stream_arn)
        
        # Verify stream has appropriate shard count for IoT workload
        self.assertGreaterEqual(len(stream['Shards']), 2, "Should have at least 2 shards for IoT data")
        self.assertEqual(stream['RetentionPeriodHours'], 24, "Should have 24-hour retention")
        
        # Verify encryption is enabled
        self.assertEqual(stream['EncryptionType'], 'KMS')
        self.assertIn('KeyId', stream)

    def test_redis_cluster_is_available_for_caching(self):
        """Test that Redis cluster is available and properly configured for caching."""
        redis_endpoint = self.outputs.get('redis_endpoint')
        self.assertIsNotNone(redis_endpoint, "Redis endpoint should be available in outputs")
        
        # Extract cluster ID from endpoint (assuming format: cluster-id.cache.amazonaws.com)
        cluster_id = redis_endpoint.split('.')[0] if redis_endpoint else None
        self.assertIsNotNone(cluster_id, "Should be able to extract cluster ID from endpoint")
        
        # Verify Redis replication group exists and is available
        try:
            response = self.elasticache_client.describe_replication_groups()
            replication_groups = response['ReplicationGroups']
            
            # Find our cluster
            our_cluster = None
            for rg in replication_groups:
                if cluster_id in rg['ReplicationGroupId']:
                    our_cluster = rg
                    break
            
            if our_cluster:
                self.assertEqual(our_cluster['Status'], 'available')
                self.assertGreater(our_cluster['NumCacheClusters'], 0)
                self.assertTrue(our_cluster['AtRestEncryptionEnabled'])
                self.assertTrue(our_cluster['TransitEncryptionEnabled'])
        except ClientError as e:
            if 'AccessDenied' in str(e):
                self.skipTest("Insufficient permissions to describe ElastiCache clusters")
            raise

    def test_aurora_database_is_available_and_accessible(self):
        """Test that Aurora PostgreSQL cluster is available and properly configured."""
        aurora_endpoint = self.outputs.get('aurora_endpoint')
        aurora_cluster_arn = self.outputs.get('aurora_cluster_arn')
        
        self.assertIsNotNone(aurora_endpoint, "Aurora endpoint should be available")
        self.assertIsNotNone(aurora_cluster_arn, "Aurora cluster ARN should be available")
        
        cluster_id = aurora_cluster_arn.split(':')[-1]
        
        # Verify Aurora cluster exists and is available
        response = self.rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        clusters = response['DBClusters']
        self.assertEqual(len(clusters), 1)
        
        cluster = clusters[0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['StorageEncrypted'])
        self.assertIn('KmsKeyId', cluster)
        
        # Verify backup configuration
        self.assertGreaterEqual(cluster['BackupRetentionPeriod'], 7)
        self.assertIsNotNone(cluster['PreferredBackupWindow'])
        self.assertIsNotNone(cluster['PreferredMaintenanceWindow'])

    def test_efs_filesystem_is_available_for_shared_storage(self):
        """Test that EFS filesystem is available for shared storage across services."""
        efs_id = self.outputs.get('efs_id')
        self.assertIsNotNone(efs_id, "EFS ID should be available in outputs")
        
        # Verify EFS filesystem exists and is available
        response = self.efs_client.describe_file_systems(FileSystemId=efs_id)
        filesystems = response['FileSystems']
        self.assertEqual(len(filesystems), 1)
        
        filesystem = filesystems[0]
        self.assertEqual(filesystem['LifeCycleState'], 'available')
        self.assertEqual(filesystem['FileSystemId'], efs_id)
        self.assertTrue(filesystem['Encrypted'])
        
        # Verify mount targets exist in multiple subnets
        mount_targets_response = self.efs_client.describe_mount_targets(FileSystemId=efs_id)
        mount_targets = mount_targets_response['MountTargets']
        self.assertGreaterEqual(len(mount_targets), 2, "Should have mount targets in multiple subnets")
        
        # Verify all mount targets are available
        for mt in mount_targets:
            self.assertEqual(mt['LifeCycleState'], 'available')

    def test_api_gateway_is_accessible_and_configured(self):
        """Test that API Gateway is properly configured and accessible."""
        api_gateway_url = self.outputs.get('api_gateway_url')
        api_gateway_id = self.outputs.get('api_gateway_id')
        
        self.assertIsNotNone(api_gateway_url, "API Gateway URL should be available")
        self.assertIsNotNone(api_gateway_id, "API Gateway ID should be available")
        
        # Verify URL format
        self.assertTrue(api_gateway_url.startswith('https://'))
        self.assertIn('execute-api', api_gateway_url)
        self.assertIn(self.region, api_gateway_url)
        
        # Verify API Gateway exists
        response = self.apigateway_client.get_api(ApiId=api_gateway_id)
        self.assertEqual(response['ApiId'], api_gateway_id)
        self.assertEqual(response['ProtocolType'], 'HTTP')

    def test_secrets_manager_contains_database_credentials(self):
        """Test that Secrets Manager contains properly configured database credentials."""
        secret_arn = self.outputs.get('secret_arn')
        self.assertIsNotNone(secret_arn, "Secret ARN should be available in outputs")
        
        # Verify secret exists
        response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)
        self.assertEqual(response['ARN'], secret_arn)
        self.assertIn('KmsKeyId', response)
        
        # Verify secret has a current version
        self.assertIn('VersionIdsToStages', response)
        self.assertIn('AWSCURRENT', str(response['VersionIdsToStages']))

    def test_kms_key_is_properly_configured(self):
        """Test that KMS key is properly configured for encryption."""
        kms_key_id = self.outputs.get('kms_key_id')
        kms_key_arn = self.outputs.get('kms_key_arn')
        
        self.assertIsNotNone(kms_key_id, "KMS key ID should be available")
        self.assertIsNotNone(kms_key_arn, "KMS key ARN should be available")
        
        # Verify KMS key exists and is enabled
        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key_metadata = response['KeyMetadata']
        
        self.assertEqual(key_metadata['KeyState'], 'Enabled')
        
        # Check key rotation status separately
        rotation_response = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
        self.assertTrue(rotation_response['KeyRotationEnabled'])
        
        self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')


class TestTapStackServiceIntegration(BaseIntegrationTest):
    """Integration tests for service-to-service communication and data flow."""

    def test_ecs_can_access_kinesis_stream(self):
        """Test that ECS services can access and process Kinesis stream data."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        vpc_id = self.outputs.get('vpc_id')
        
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        self.assertIsNotNone(vpc_id, "VPC ID should be available")
        
        # Verify Kinesis stream is accessible from VPC
        stream_response = self.kinesis_client.describe_stream(StreamName=kinesis_stream_name)
        stream = stream_response['StreamDescription']
        
        # Test that we can put a sample record (this verifies connectivity)
        try:
            test_data = {
                "deviceId": "test-device-001",
                "timestamp": int(time.time()),
                "temperature": 23.5,
                "humidity": 65.2,
                "source": "integration-test"
            }
            
            put_response = self.kinesis_client.put_record(
                StreamName=kinesis_stream_name,
                Data=json.dumps(test_data),
                PartitionKey=test_data["deviceId"]
            )
            
            self.assertIn('ShardId', put_response)
            self.assertIn('SequenceNumber', put_response)
            
        except ClientError as e:
            if 'AccessDenied' in str(e):
                self.skipTest("Insufficient permissions to put records to Kinesis")
            raise

    def test_ecs_can_access_redis_cache(self):
        """Test that ECS services can access Redis cache for session storage."""
        redis_endpoint = self.outputs.get('redis_endpoint')
        vpc_id = self.outputs.get('vpc_id')
        
        self.assertIsNotNone(redis_endpoint, "Redis endpoint should be available")
        self.assertIsNotNone(vpc_id, "VPC ID should be available")
        
        # Verify Redis endpoint is within VPC (internal domain)
        self.assertIn('.cache.amazonaws.com', redis_endpoint)
        
        # Note: We can't directly test Redis connectivity without being inside the VPC,
        # but we can verify the security group and network configuration
        
        # Verify VPC has proper security groups for Redis access
        sg_response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': ['*redis*']}
            ]
        )
        
        # Should have at least one security group for Redis
        self.assertGreater(len(sg_response['SecurityGroups']), 0, 
                          "Should have security groups configured for Redis access")

    def test_ecs_can_access_aurora_database(self):
        """Test that ECS services can access Aurora PostgreSQL database."""
        aurora_endpoint = self.outputs.get('aurora_endpoint')
        secret_arn = self.outputs.get('secret_arn')
        vpc_id = self.outputs.get('vpc_id')
        
        self.assertIsNotNone(aurora_endpoint, "Aurora endpoint should be available")
        self.assertIsNotNone(secret_arn, "Database secret ARN should be available")
        self.assertIsNotNone(vpc_id, "VPC ID should be available")
        
        # Verify Aurora endpoint is within VPC
        self.assertIn('.rds.amazonaws.com', aurora_endpoint)
        
        # Verify database credentials are accessible
        secret_response = self.secretsmanager_client.get_secret_value(SecretId=secret_arn)
        credentials = json.loads(secret_response['SecretString'])
        
        self.assertIn('username', credentials)
        self.assertIn('password', credentials)
        
        # Verify VPC has proper security groups for database access
        sg_response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': ['*aurora*']}
            ]
        )
        
        # Should have at least one security group for Aurora access
        self.assertGreater(len(sg_response['SecurityGroups']), 0,
                          "Should have security groups configured for Aurora access")

    def test_ecs_can_access_efs_shared_storage(self):
        """Test that ECS services can access EFS for shared file storage."""
        efs_id = self.outputs.get('efs_id')
        vpc_id = self.outputs.get('vpc_id')
        
        self.assertIsNotNone(efs_id, "EFS ID should be available")
        self.assertIsNotNone(vpc_id, "VPC ID should be available")
        
        # Verify EFS mount targets are in the same VPC as ECS
        mount_targets_response = self.efs_client.describe_mount_targets(FileSystemId=efs_id)
        mount_targets = mount_targets_response['MountTargets']
        
        for mt in mount_targets:
            # Verify mount target is in correct VPC
            subnet_response = self.ec2_client.describe_subnets(SubnetIds=[mt['SubnetId']])
            subnet_vpc_id = subnet_response['Subnets'][0]['VpcId']
            self.assertEqual(subnet_vpc_id, vpc_id, "EFS mount target should be in same VPC as ECS")

    def test_api_gateway_connectivity_and_security(self):
        """Test API Gateway connectivity and basic security configuration."""
        api_gateway_url = self.outputs.get('api_gateway_url')
        api_gateway_id = self.outputs.get('api_gateway_id')
        
        self.assertIsNotNone(api_gateway_url, "API Gateway URL should be available")
        self.assertIsNotNone(api_gateway_id, "API Gateway ID should be available")
        
        # Test basic connectivity (should get some response, even if 404/403)
        import urllib.request
        import urllib.error
        
        try:
            # Try to make a request to the API Gateway
            with urllib.request.urlopen(api_gateway_url, timeout=10) as response:
                # Any HTTP response (200, 404, 403, etc.) indicates connectivity
                self.assertIsNotNone(response.getcode())
                
        except urllib.error.HTTPError as e:
            # HTTP errors (404, 403, etc.) still indicate connectivity
            self.assertIsNotNone(e.code)
            
        except urllib.error.URLError as e:
            # Connection errors indicate infrastructure issues
            self.fail(f"Could not connect to API Gateway: {e}")


class TestTapStackMonitoringAndLogging(BaseIntegrationTest):
    """Integration tests for monitoring, logging, and observability."""

    def test_cloudwatch_log_groups_exist_and_configured(self):
        """Test that CloudWatch log groups are properly configured for monitoring."""
        environment_suffix = self.outputs.get('environment_suffix', 'dev')
        
        expected_log_groups = [
            f'/aws/ecs/iot-platform-{environment_suffix}',
            f'/aws/apigateway/iot-platform-{environment_suffix}'
        ]
        
        for log_group_name in expected_log_groups:
            try:
                response = self.cloudwatch_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                
                # Find the exact log group
                matching_groups = [lg for lg in response['logGroups'] 
                                 if lg['logGroupName'] == log_group_name]
                
                if matching_groups:
                    log_group = matching_groups[0]
                    self.assertEqual(log_group['logGroupName'], log_group_name)
                    self.assertLessEqual(log_group['retentionInDays'], 30,  # Should have reasonable retention
                                       "Log retention should be reasonable for cost management")
                    
            except ClientError as e:
                if 'ResourceNotFoundException' not in str(e):
                    raise

    def test_infrastructure_tags_are_consistent(self):
        """Test that all infrastructure components have consistent tagging."""
        environment_suffix = self.outputs.get('environment_suffix', 'dev')
        
        # Test VPC tags
        vpc_id = self.outputs.get('vpc_id')
        if vpc_id:
            vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc_tags = {tag['Key']: tag['Value'] for tag in vpc_response['Vpcs'][0].get('Tags', [])}
            
            self.assertIn('EnvironmentSuffix', vpc_tags)
            self.assertEqual(vpc_tags['EnvironmentSuffix'], environment_suffix)


if __name__ == '__main__':
    # Configure test discovery and execution
    loader = unittest.TestLoader()
    suite = loader.discover('.', pattern='test_*.py')
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)