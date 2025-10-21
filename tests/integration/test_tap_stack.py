"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import psycopg2


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with deployed outputs."""
        # Load outputs from deployment
        outputs_file = '/Users/mayanksethi/Projects/turing/iac-test-automations/worktree/synth-5962726542/cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_file):
            raise unittest.SkipTest("Deployment outputs not found. Run deployment first.")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.region = 'ca-central-1'
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.elasticache_client = boto3.client('elasticache', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.efs_client = boto3.client('efs', region_name=cls.region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)

    def test_vpc_exists(self):
        """Test VPC is created and accessible."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')

    def test_rds_cluster_exists_and_available(self):
        """Test RDS Aurora cluster is created and available."""
        rds_endpoint = self.outputs.get('rds_cluster_endpoint')
        self.assertIsNotNone(rds_endpoint, "RDS endpoint not found in outputs")

        # Extract cluster ID from endpoint
        cluster_id = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')

    def test_rds_has_writer_and_reader_endpoints(self):
        """Test RDS cluster has separate writer and reader endpoints."""
        writer_endpoint = self.outputs.get('rds_cluster_endpoint')
        reader_endpoint = self.outputs.get('rds_reader_endpoint')

        self.assertIsNotNone(writer_endpoint)
        self.assertIsNotNone(reader_endpoint)
        self.assertNotEqual(writer_endpoint, reader_endpoint)

    def test_elasticache_cluster_available(self):
        """Test ElastiCache Redis cluster is available."""
        redis_endpoint = self.outputs.get('elasticache_configuration_endpoint')
        self.assertIsNotNone(redis_endpoint, "Redis endpoint not found")

        # Get cluster ID from endpoint
        cluster_id = redis_endpoint.split('.')[0]

        response = self.elasticache_client.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )
        cluster = response['ReplicationGroups'][0]
        self.assertEqual(cluster['Status'], 'available')

    def test_efs_filesystem_available(self):
        """Test EFS file system is available."""
        efs_id = self.outputs.get('efs_file_system_id')
        self.assertIsNotNone(efs_id, "EFS ID not found")

        response = self.efs_client.describe_file_systems(FileSystemId=efs_id)
        fs = response['FileSystems'][0]
        self.assertEqual(fs['LifeCycleState'], 'available')

    def test_ecs_cluster_active(self):
        """Test ECS cluster is active."""
        cluster_name = self.outputs.get('ecs_cluster_name')
        self.assertIsNotNone(cluster_name, "ECS cluster name not found")

        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')

    def test_ecs_service_running(self):
        """Test ECS service is running with desired tasks."""
        cluster_name = self.outputs.get('ecs_cluster_name')

        # List services in cluster
        services = self.ecs_client.list_services(cluster=cluster_name)
        self.assertGreater(len(services['serviceArns']), 0)

        # Describe first service
        service_response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[services['serviceArns'][0]]
        )
        service = service_response['services'][0]
        self.assertEqual(service['status'], 'ACTIVE')
        self.assertGreater(service['desiredCount'], 0)

    def test_secrets_manager_secret_exists(self):
        """Test database credentials secret exists."""
        secret_arn = self.outputs.get('db_secret_arn')
        self.assertIsNotNone(secret_arn, "Secret ARN not found")

        response = self.secrets_client.describe_secret(SecretId=secret_arn)
        self.assertIn('RotationEnabled', response)
        self.assertTrue(response.get('RotationEnabled'))

    def test_database_connectivity(self):
        """Test connection to RDS cluster using credentials from Secrets Manager."""
        secret_arn = self.outputs.get('db_secret_arn')
        rds_endpoint = self.outputs.get('rds_cluster_endpoint')

        # Get credentials from Secrets Manager
        secret_value = self.secrets_client.get_secret_value(SecretId=secret_arn)
        creds = json.loads(secret_value['SecretString'])

        try:
            # Attempt connection
            conn = psycopg2.connect(
                host=rds_endpoint,
                port=creds.get('port', 5432),
                user=creds['username'],
                password=creds['password'],
                database='globecart',
                connect_timeout=10
            )

            # Execute a simple query
            with conn.cursor() as cursor:
                cursor.execute('SELECT 1')
                result = cursor.fetchone()
                self.assertEqual(result[0], 1)

            conn.close()
        except psycopg2.Error as e:
            self.fail(f"Database connection failed: {e}")

    def test_alb_is_healthy(self):
        """Test Application Load Balancer is provisioned and healthy."""
        # Get ALB DNS from outputs
        alb_dns = self.outputs.get('alb_dns_name')
        if not alb_dns:
            self.skipTest("ALB DNS not in outputs")

        # Find ALB by DNS name
        response = self.elbv2_client.describe_load_balancers()
        alb = next((lb for lb in response['LoadBalancers']
                   if lb['DNSName'] == alb_dns), None)

        self.assertIsNotNone(alb, "ALB not found")
        self.assertEqual(alb['State']['Code'], 'active')

    def test_multi_az_deployment(self):
        """Test resources are deployed across multiple availability zones."""
        vpc_id = self.outputs.get('vpc_id')

        # Check subnets are in multiple AZs
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])
        self.assertGreaterEqual(len(azs), 2, "Resources not deployed across multiple AZs")


if __name__ == '__main__':
    unittest.main()
