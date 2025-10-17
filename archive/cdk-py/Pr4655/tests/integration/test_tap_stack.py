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


@mark.describe("TapStack Live Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for deployed TapStack infrastructure"""

    def setUp(self):
        """Set up AWS clients for testing"""
        # Get region from environment or AWS_REGION file
        region = os.environ.get('AWS_REGION', 'ap-northeast-1')
        region_file = os.path.join(base_dir, '..', '..', 'lib', 'AWS_REGION')
        if os.path.exists(region_file):
            with open(region_file, 'r', encoding='utf-8') as f:
                region = f.read().strip()
        
        self.ec2_client = boto3.client('ec2', region_name=region)
        self.ecs_client = boto3.client('ecs', region_name=region)
        self.rds_client = boto3.client('rds', region_name=region)
        self.elasticache_client = boto3.client('elasticache', region_name=region)
        self.efs_client = boto3.client('efs', region_name=region)
        self.apigateway_client = boto3.client('apigateway', region_name=region)

    @mark.it("VPC exists and is available")
    def test_vpc_exists(self):
        """Test VPC is deployed and available"""
        vpc_id = flat_outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPCId should be in outputs")

        vpcs = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(vpcs['Vpcs']), 1)
        self.assertEqual(vpcs['Vpcs'][0]['State'], 'available')

    @mark.it("ECS cluster exists and is active")
    def test_ecs_cluster_exists(self):
        """Test ECS cluster is deployed and active"""
        cluster_name = flat_outputs.get('ECSClusterName')
        self.assertIsNotNone(cluster_name, "ECSClusterName should be in outputs")

        clusters = self.ecs_client.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(clusters['clusters']), 1)
        self.assertEqual(clusters['clusters'][0]['status'], 'ACTIVE')

    @mark.it("RDS instance is available")
    def test_rds_instance_available(self):
        """Test RDS instance is deployed and available"""
        rds_endpoint = flat_outputs.get('RDSEndpoint')
        self.assertIsNotNone(rds_endpoint, "RDSEndpoint should be in outputs")

        # Extract DB instance identifier from endpoint
        db_identifier = rds_endpoint.split('.')[0]

        instances = self.rds_client.describe_db_instances()
        db_instances = [
            db for db in instances['DBInstances']
            if db['DBInstanceIdentifier'] == db_identifier
        ]

        self.assertGreater(len(db_instances), 0, "DB instance should exist")
        self.assertEqual(db_instances[0]['DBInstanceStatus'], 'available')
        self.assertTrue(db_instances[0]['MultiAZ'], "RDS should be Multi-AZ")

    @mark.it("ElastiCache cluster is available with multiple nodes")
    def test_elasticache_cluster_available(self):
        """Test ElastiCache cluster is deployed with 2+ nodes"""
        redis_endpoint = flat_outputs.get('RedisEndpoint')
        self.assertIsNotNone(redis_endpoint, "RedisEndpoint should be in outputs")

        replication_groups = self.elasticache_client.describe_replication_groups()
        rg_list = replication_groups['ReplicationGroups']

        self.assertGreater(len(rg_list), 0, "ElastiCache replication group should exist")

        # Find our replication group
        our_rg = None
        for rg in rg_list:
            if rg['Status'] == 'available':
                our_rg = rg
                break

        self.assertIsNotNone(our_rg, "Active replication group should exist")
        self.assertTrue(our_rg['MultiAZ'], "ElastiCache should be Multi-AZ")
        self.assertGreaterEqual(
            len(our_rg['MemberClusters']), 2, "Should have at least 2 cache nodes"
        )

    @mark.it("EFS file system exists")
    def test_efs_exists(self):
        """Test EFS file system is deployed"""
        efs_id = flat_outputs.get('EFSFileSystemId')
        self.assertIsNotNone(efs_id, "EFSFileSystemId should be in outputs")

        file_systems = self.efs_client.describe_file_systems(FileSystemId=efs_id)
        self.assertEqual(len(file_systems['FileSystems']), 1)
        self.assertEqual(file_systems['FileSystems'][0]['LifeCycleState'], 'available')
        self.assertTrue(file_systems['FileSystems'][0]['Encrypted'], "EFS should be encrypted")

    @mark.it("API Gateway is accessible")
    def test_api_gateway_accessible(self):
        """Test API Gateway endpoint is accessible"""
        api_endpoint = flat_outputs.get('APIEndpoint')
        self.assertIsNotNone(api_endpoint, "APIEndpoint should be in outputs")

        # Extract API ID from URL
        import re
        api_id_match = re.search(r'https://([a-z0-9]+)\.execute-api', api_endpoint)
        self.assertIsNotNone(api_id_match, "Should be able to extract API ID")

        api_id = api_id_match.group(1)
        rest_apis = self.apigateway_client.get_rest_apis()

        matching_apis = [api for api in rest_apis['items'] if api['id'] == api_id]
        self.assertEqual(len(matching_apis), 1, "API should exist")

    @mark.it("API Gateway returns expected response")
    def test_api_gateway_returns_response(self):
        """Test API Gateway endpoint returns expected mock response"""
        api_endpoint = flat_outputs.get('APIEndpoint')
        self.assertIsNotNone(api_endpoint, "APIEndpoint should be in outputs")

        import requests

        # Test the /metadata endpoint
        response = requests.get(f"{api_endpoint}metadata", timeout=10)
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertIn('message', response_data)
        self.assertEqual(response_data['message'], 'Video metadata API')
