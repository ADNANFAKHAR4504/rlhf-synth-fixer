"""Integration tests for TapStack deployed infrastructure"""
import json
import os
import unittest
import boto3

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and validate outputs exist"""
        cls.outputs = flat_outputs

        # Initialize AWS clients
        region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=region)
        cls.ecs_client = boto3.client('ecs', region_name=region)
        cls.rds_client = boto3.client('rds', region_name=region)
        cls.elasticache_client = boto3.client('elasticache', region_name=region)
        cls.efs_client = boto3.client('efs', region_name=region)
        cls.apigateway_client = boto3.client('apigateway', region_name=region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=region)

    def setUp(self):
        """Validate outputs are present"""
        self.assertTrue(
            len(self.outputs) > 0,
            "Stack outputs not found - deployment may have failed"
        )

    @mark.it("validates VPC exists and is accessible")
    def test_vpc_exists(self):
        """Test that VPC from outputs exists"""
        vpc_id = self.outputs.get('VpcId')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        # Verify VPC exists in AWS
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        self.assertEqual(response['Vpcs'][0]['State'], 'available')

    @mark.it("validates ECS cluster exists and is active")
    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists and is active"""
        cluster_name = self.outputs.get('EcsClusterName')
        self.assertIsNotNone(cluster_name, "ECS Cluster name not found in outputs")

        # Verify ECS cluster exists
        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(response['clusters']), 1)
        self.assertEqual(response['clusters'][0]['status'], 'ACTIVE')

    @mark.it("validates RDS instance exists and is available")
    def test_rds_instance_exists(self):
        """Test that RDS instance exists and is available"""
        rds_endpoint = self.outputs.get('RdsEndpoint')
        self.assertIsNotNone(rds_endpoint, "RDS endpoint not found in outputs")

        # Extract DB instance identifier from endpoint
        # Endpoint format: instance-id.xxxxx.region.rds.amazonaws.com
        db_identifier = rds_endpoint.split('.')[0]

        # Verify RDS instance exists
        response = self.rds_client.describe_db_instances()
        db_instances = [db for db in response['DBInstances'] if db_identifier in db['DBInstanceIdentifier']]
        self.assertGreater(len(db_instances), 0, "RDS instance not found")
        self.assertIn(db_instances[0]['DBInstanceStatus'], ['available', 'backing-up', 'creating'])

    @mark.it("validates RDS instance has Multi-AZ enabled")
    def test_rds_multi_az_enabled(self):
        """Test that RDS instance has Multi-AZ enabled"""
        rds_endpoint = self.outputs.get('RdsEndpoint')
        self.assertIsNotNone(rds_endpoint, "RDS endpoint not found in outputs")

        db_identifier = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances()
        db_instances = [db for db in response['DBInstances'] if db_identifier in db['DBInstanceIdentifier']]
        self.assertGreater(len(db_instances), 0, "RDS instance not found")
        self.assertTrue(db_instances[0]['MultiAZ'], "RDS instance should have Multi-AZ enabled")

    @mark.it("validates ElastiCache Redis cluster exists")
    def test_elasticache_cluster_exists(self):
        """Test that ElastiCache Redis cluster exists"""
        redis_endpoint = self.outputs.get('RedisEndpoint')
        self.assertIsNotNone(redis_endpoint, "Redis endpoint not found in outputs")

        # Verify ElastiCache cluster exists
        response = self.elasticache_client.describe_replication_groups()
        clusters = [rg for rg in response['ReplicationGroups'] if redis_endpoint in rg.get('NodeGroups', [{}])[0].get('PrimaryEndpoint', {}).get('Address', '')]
        self.assertGreater(len(clusters), 0, "ElastiCache cluster not found")

    @mark.it("validates ElastiCache has multiple nodes")
    def test_elasticache_multiple_nodes(self):
        """Test that ElastiCache cluster has 2+ nodes"""
        redis_endpoint = self.outputs.get('RedisEndpoint')
        self.assertIsNotNone(redis_endpoint, "Redis endpoint not found in outputs")

        response = self.elasticache_client.describe_replication_groups()
        clusters = [rg for rg in response['ReplicationGroups'] if redis_endpoint in rg.get('NodeGroups', [{}])[0].get('PrimaryEndpoint', {}).get('Address', '')]
        self.assertGreater(len(clusters), 0, "ElastiCache cluster not found")

        # Check member clusters count
        member_clusters = clusters[0]['MemberClusters']
        self.assertGreaterEqual(len(member_clusters), 2, "ElastiCache should have 2+ nodes")

    @mark.it("validates EFS file system exists")
    def test_efs_file_system_exists(self):
        """Test that EFS file system exists"""
        efs_id = self.outputs.get('EfsFileSystemId')
        self.assertIsNotNone(efs_id, "EFS file system ID not found in outputs")

        # Verify EFS exists
        response = self.efs_client.describe_file_systems(FileSystemId=efs_id)
        self.assertEqual(len(response['FileSystems']), 1)
        self.assertEqual(response['FileSystems'][0]['LifeCycleState'], 'available')

    @mark.it("validates EFS encryption is enabled")
    def test_efs_encryption_enabled(self):
        """Test that EFS encryption is enabled"""
        efs_id = self.outputs.get('EfsFileSystemId')
        self.assertIsNotNone(efs_id, "EFS file system ID not found in outputs")

        response = self.efs_client.describe_file_systems(FileSystemId=efs_id)
        self.assertTrue(response['FileSystems'][0]['Encrypted'], "EFS should be encrypted")

    @mark.it("validates API Gateway exists and is accessible")
    def test_api_gateway_exists(self):
        """Test that API Gateway exists"""
        api_endpoint = self.outputs.get('ApiEndpoint')
        self.assertIsNotNone(api_endpoint, "API endpoint not found in outputs")

        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
        self.assertTrue(api_endpoint.startswith('https://'), "API endpoint should be HTTPS")
        self.assertIn('.execute-api.', api_endpoint, "API endpoint should be API Gateway URL")

    @mark.it("validates Secrets Manager secret exists")
    def test_secrets_manager_secret_exists(self):
        """Test that database secret exists"""
        secret_arn = self.outputs.get('DbSecretArn')
        self.assertIsNotNone(secret_arn, "Database secret ARN not found in outputs")

        # Verify secret exists
        response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)
        self.assertEqual(response['ARN'], secret_arn)

    @mark.it("validates database secret contains required keys")
    def test_database_secret_structure(self):
        """Test that database secret has required keys"""
        secret_arn = self.outputs.get('DbSecretArn')
        self.assertIsNotNone(secret_arn, "Database secret ARN not found in outputs")

        # Get secret value
        response = self.secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret_string = json.loads(response['SecretString'])

        # Verify required keys exist
        self.assertIn('username', secret_string, "Secret should contain username")
        self.assertIn('password', secret_string, "Secret should contain password")

    @mark.it("validates all required outputs are present")
    def test_all_required_outputs_present(self):
        """Test that all required CloudFormation outputs are present"""
        required_outputs = [
            'VpcId',
            'EcsClusterName',
            'RdsEndpoint',
            'RedisEndpoint',
            'EfsFileSystemId',
            'ApiEndpoint',
            'DbSecretArn',
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Required output {output} not found")
            self.assertIsNotNone(self.outputs[output], f"Output {output} should not be None")

    @mark.it("validates security groups exist for all services")
    def test_security_groups_exist(self):
        """Test that security groups exist for ECS, RDS, ElastiCache, and EFS"""
        vpc_id = self.outputs.get('VpcId')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        # Get all security groups in VPC
        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have at least 5 security groups (4 custom + 1 default)
        self.assertGreaterEqual(len(response['SecurityGroups']), 5)


if __name__ == "__main__":
    unittest.main()
