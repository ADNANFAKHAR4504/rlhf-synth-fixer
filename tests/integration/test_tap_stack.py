"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using stack outputs.
"""

import unittest
import os
import json
import boto3


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    def setUp(self):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from cfn-outputs/flat-outputs.json
        self.outputs_file = 'cfn-outputs/flat-outputs.json'
        
        if os.path.exists(self.outputs_file):
            with open(self.outputs_file, 'r') as f:
                self.stack_outputs = json.load(f)
        else:
            self.skipTest(f"Stack outputs file {self.outputs_file} not found. Deploy stack first.")
        
        # Initialize AWS clients
        self.ec2_client = boto3.client('ec2')
        self.rds_client = boto3.client('rds')
        self.elasticache_client = boto3.client('elasticache')
        self.kinesis_client = boto3.client('kinesis')
        self.efs_client = boto3.client('efs')
        self.ecs_client = boto3.client('ecs')
        self.apigateway_client = boto3.client('apigateway')
        self.elbv2_client = boto3.client('elbv2')
        
    def test_vpc_exists_and_accessible(self):
        """Test VPC exists and has correct configuration."""
        vpc_id = self.stack_outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in stack outputs")
        
        # Verify VPC exists
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response['Vpcs']
        self.assertEqual(len(vpcs), 1, "VPC should exist")
        
        vpc = vpcs[0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['EnableDnsHostnames'], "DNS hostnames should be enabled")
        self.assertTrue(vpc['EnableDnsSupport'], "DNS support should be enabled")
        
    def test_aurora_cluster_accessible(self):
        """Test RDS Aurora cluster is accessible and configured."""
        aurora_endpoint = self.stack_outputs.get('aurora_cluster_endpoint')
        self.assertIsNotNone(aurora_endpoint, "Aurora cluster endpoint not found in stack outputs")
        
        # Extract cluster identifier from endpoint
        cluster_id = aurora_endpoint.split('.')[0]
        
        # Verify Aurora cluster exists
        response = self.rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        clusters = response['DBClusters']
        self.assertEqual(len(clusters), 1, "Aurora cluster should exist")
        
        cluster = clusters[0]
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['StorageEncrypted'], "Storage should be encrypted")
        self.assertEqual(cluster['Status'], 'available', "Cluster should be available")
        
    def test_aurora_reader_endpoint_accessible(self):
        """Test Aurora reader endpoint exists."""
        reader_endpoint = self.stack_outputs.get('aurora_reader_endpoint')
        self.assertIsNotNone(reader_endpoint, "Aurora reader endpoint not found in stack outputs")
        
        # Extract cluster identifier from reader endpoint
        cluster_id = reader_endpoint.split('.')[0]
        
        # Verify cluster has reader endpoint
        response = self.rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        self.assertIsNotNone(cluster.get('ReaderEndpoint'), "Reader endpoint should exist")
        
    def test_redis_cluster_accessible(self):
        """Test ElastiCache Redis cluster is accessible."""
        redis_endpoint = self.stack_outputs.get('redis_endpoint')
        self.assertIsNotNone(redis_endpoint, "Redis endpoint not found in stack outputs")
        
        # Extract replication group ID - it should contain environment suffix
        replication_groups = self.elasticache_client.describe_replication_groups()['ReplicationGroups']
        
        # Find our replication group (should contain environment suffix in name)
        our_group = None
        for group in replication_groups:
            if group['PrimaryEndpoint']['Address'] == redis_endpoint:
                our_group = group
                break
                
        self.assertIsNotNone(our_group, "Redis replication group should exist")
        self.assertTrue(our_group['AtRestEncryptionEnabled'], "At-rest encryption should be enabled")
        self.assertTrue(our_group['TransitEncryptionEnabled'], "Transit encryption should be enabled")
        self.assertEqual(our_group['Status'], 'available', "Redis cluster should be available")
        
    def test_kinesis_stream_operational(self):
        """Test Kinesis stream is operational."""
        stream_name = self.stack_outputs.get('kinesis_stream_name')
        self.assertIsNotNone(stream_name, "Kinesis stream name not found in stack outputs")
        
        # Verify Kinesis stream exists and is active
        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']
        
        self.assertEqual(stream['StreamStatus'], 'ACTIVE', "Kinesis stream should be active")
        self.assertGreaterEqual(stream['Shards'], 2, "Should have at least 2 shards")
        self.assertIsNotNone(stream.get('EncryptionType'), "Stream should be encrypted")
        
    def test_efs_filesystem_mounted(self):
        """Test EFS filesystem exists and is available."""
        efs_id = self.stack_outputs.get('efs_file_system_id')
        self.assertIsNotNone(efs_id, "EFS filesystem ID not found in stack outputs")
        
        # Verify EFS exists
        response = self.efs_client.describe_file_systems(FileSystemId=efs_id)
        filesystems = response['FileSystems']
        self.assertEqual(len(filesystems), 1, "EFS filesystem should exist")
        
        fs = filesystems[0]
        self.assertEqual(fs['LifeCycleState'], 'available', "EFS should be available")
        self.assertTrue(fs['Encrypted'], "EFS should be encrypted")
        
        # Verify mount targets exist
        mount_targets = self.efs_client.describe_mount_targets(FileSystemId=efs_id)['MountTargets']
        self.assertGreaterEqual(len(mount_targets), 2, "Should have mount targets in multiple AZs")
        
    def test_ecs_cluster_running(self):
        """Test ECS cluster exists and is active."""
        cluster_name = self.stack_outputs.get('ecs_cluster_name')
        self.assertIsNotNone(cluster_name, "ECS cluster name not found in stack outputs")
        
        # Verify ECS cluster exists
        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        clusters = response['clusters']
        self.assertEqual(len(clusters), 1, "ECS cluster should exist")
        
        cluster = clusters[0]
        self.assertEqual(cluster['status'], 'ACTIVE', "ECS cluster should be active")
        
    def test_api_gateway_accessible(self):
        """Test API Gateway is accessible and returns valid responses."""
        api_url = self.stack_outputs.get('api_gateway_url')
        self.assertIsNotNone(api_url, "API Gateway URL not found in stack outputs")
        
        # Extract API Gateway ID from URL
        # URL format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        api_id = api_url.split('//')[1].split('.')[0]
        
        # Verify API Gateway exists
        response = self.apigateway_client.get_rest_apis()
        apis = response['items']
        
        our_api = None
        for api in apis:
            if api['id'] == api_id:
                our_api = api
                break
                
        self.assertIsNotNone(our_api, "API Gateway should exist")
        self.assertIn('name', our_api)
        
    def test_load_balancer_healthy(self):
        """Test Application Load Balancer is healthy."""
        alb_dns = self.stack_outputs.get('alb_dns_name')
        self.assertIsNotNone(alb_dns, "ALB DNS name not found in stack outputs")
        
        # Find ALB by DNS name
        response = self.elbv2_client.describe_load_balancers()
        load_balancers = response['LoadBalancers']
        
        our_alb = None
        for lb in load_balancers:
            if lb['DNSName'] == alb_dns:
                our_alb = lb
                break
                
        self.assertIsNotNone(our_alb, "Application Load Balancer should exist")
        self.assertEqual(our_alb['State']['Code'], 'active', "ALB should be active")
        self.assertEqual(our_alb['Scheme'], 'internet-facing', "ALB should be internet-facing")
        
    def test_resource_tagging_compliance(self):
        """Test resources have proper FERPA compliance tags."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if vpc_id:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc_tags = {tag['Key']: tag['Value'] for tag in response['Vpcs'][0].get('Tags', [])}
            
            # Check for required compliance tags
            self.assertIn('Compliance', vpc_tags, "VPC should have Compliance tag")
            self.assertEqual(vpc_tags['Compliance'], 'FERPA', "Should be FERPA compliant")
            self.assertIn('Project', vpc_tags, "VPC should have Project tag")
            self.assertEqual(vpc_tags['Project'], 'StudentRecords', "Should be StudentRecords project")
            
    def test_multi_az_deployment(self):
        """Test resources are deployed across multiple availability zones."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if vpc_id:
            # Check subnets span multiple AZs
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = response['Subnets']
            
            # Get unique AZs
            availability_zones = {subnet['AvailabilityZone'] for subnet in subnets}
            self.assertGreaterEqual(len(availability_zones), 2, "Should deploy across multiple AZs")
            
    def test_encryption_at_rest(self):
        """Test resources have encryption at rest enabled."""
        # Test Aurora encryption
        aurora_endpoint = self.stack_outputs.get('aurora_cluster_endpoint')
        if aurora_endpoint:
            cluster_id = aurora_endpoint.split('.')[0]
            response = self.rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
            cluster = response['DBClusters'][0]
            self.assertTrue(cluster['StorageEncrypted'], "Aurora should be encrypted at rest")
            
        # Test EFS encryption
        efs_id = self.stack_outputs.get('efs_file_system_id')
        if efs_id:
            response = self.efs_client.describe_file_systems(FileSystemId=efs_id)
            fs = response['FileSystems'][0]
            self.assertTrue(fs['Encrypted'], "EFS should be encrypted at rest")
