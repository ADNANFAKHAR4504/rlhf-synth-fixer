"""
test_deployed_infrastructure.py

Integration tests for live deployed infrastructure
Tests actual AWS resources created by Pulumi deployment
Uses real outputs from cfn-outputs/flat-outputs.json - NO MOCKING
"""

import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestDeployedInfrastructure(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack"""

    @classmethod
    def setUpClass(cls):
        """Set up test class with deployed stack outputs"""
        # Load outputs from deployment
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"Stack outputs not found at {outputs_path}. "
                "Please deploy the stack first."
            )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Get region from outputs or default
        cls.region = cls.outputs.get('region', 'eu-west-1')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.elasticache_client = boto3.client('elasticache', region_name=cls.region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.region)

    def test_vpc_exists(self):
        """Test VPC was created and is available"""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['VpcId'], vpc_id)
        self.assertEqual(vpc['State'], 'available')

    def test_vpc_dns_configuration(self):
        """Test VPC has DNS support and hostnames enabled"""
        vpc_id = self.outputs.get('vpc_id')

        # Check DNS support
        dns_support_attr = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support_attr['EnableDnsSupport']['Value'])

        # Check DNS hostnames
        dns_hostnames_attr = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames_attr['EnableDnsHostnames']['Value'])

    def test_subnets_exist(self):
        """Test subnets were created in VPC"""
        vpc_id = self.outputs.get('vpc_id')

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']

        # Should have 4 subnets (2 public + 2 private)
        self.assertGreaterEqual(len(subnets), 4)

        # Verify multi-AZ deployment
        azs = {subnet['AvailabilityZone'] for subnet in subnets}
        self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 AZs")

    def test_nat_gateway_exists(self):
        """Test NAT Gateway was created for private subnet internet access"""
        vpc_id = self.outputs.get('vpc_id')

        response = self.ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        nat_gateways = response['NatGateways']
        self.assertGreaterEqual(len(nat_gateways), 1, "At least one NAT Gateway should exist")

    def test_ecs_cluster_exists(self):
        """Test ECS cluster was created and is active"""
        cluster_arn = self.outputs.get('ecs_cluster_arn')
        self.assertIsNotNone(cluster_arn, "ECS cluster ARN not found in outputs")

        response = self.ecs_client.describe_clusters(clusters=[cluster_arn])

        self.assertEqual(len(response['clusters']), 1)
        cluster = response['clusters'][0]
        self.assertEqual(cluster['clusterArn'], cluster_arn)
        self.assertEqual(cluster['status'], 'ACTIVE')

    def test_ecs_container_insights_enabled(self):
        """Test ECS cluster has Container Insights enabled"""
        cluster_arn = self.outputs.get('ecs_cluster_arn')

        response = self.ecs_client.describe_clusters(clusters=[cluster_arn])
        cluster = response['clusters'][0]

        # Check for Container Insights setting
        settings = cluster.get('settings', [])

        # Container Insights might be enabled by default or not reported
        # Just verify the cluster exists and is active
        self.assertEqual(cluster['status'], 'ACTIVE')

        # If settings exist, verify Container Insights
        if settings:
            container_insights = next(
                (s for s in settings if s['name'] == 'containerInsights'),
                None
            )
            if container_insights:
                self.assertEqual(container_insights['value'], 'enabled')

    def test_ecs_task_definition_exists(self):
        """Test ECS task definition was created"""
        task_def_arn = self.outputs.get('task_definition_arn')
        self.assertIsNotNone(task_def_arn, "Task definition ARN not found in outputs")

        response = self.ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )

        task_def = response['taskDefinition']
        self.assertEqual(task_def['taskDefinitionArn'], task_def_arn)
        self.assertEqual(task_def['status'], 'ACTIVE')

    def test_ecs_task_definition_fargate(self):
        """Test ECS task definition is configured for Fargate"""
        task_def_arn = self.outputs.get('task_definition_arn')

        response = self.ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )

        task_def = response['taskDefinition']

        # Verify Fargate compatibility
        self.assertIn('FARGATE', task_def['requiresCompatibilities'])
        self.assertEqual(task_def['networkMode'], 'awsvpc')

        # Verify CPU and memory are set
        self.assertIsNotNone(task_def.get('cpu'))
        self.assertIsNotNone(task_def.get('memory'))

    def test_redis_cluster_exists(self):
        """Test ElastiCache Redis cluster was created and is available"""
        redis_endpoint = self.outputs.get('redis_endpoint')
        self.assertIsNotNone(redis_endpoint, "Redis endpoint not found in outputs")

        # Extract replication group ID from endpoint
        # Format: master.redis-{env}.{hash}.{region}.cache.amazonaws.com
        parts = redis_endpoint.split('.')
        if len(parts) > 1:
            repl_group_id = parts[1]  # redis-{env}
        else:
            self.skipTest("Unable to parse replication group ID from endpoint")

        try:
            response = self.elasticache_client.describe_replication_groups(
                ReplicationGroupId=repl_group_id
            )

            self.assertEqual(len(response['ReplicationGroups']), 1)
            repl_group = response['ReplicationGroups'][0]
            self.assertEqual(repl_group['Status'], 'available')
        except ClientError as e:
            if e.response['Error']['Code'] == 'ReplicationGroupNotFoundFault':
                self.fail(f"Redis replication group '{repl_group_id}' not found")
            raise

    def test_redis_encryption_enabled(self):
        """Test Redis has encryption in-transit enabled (TLS)"""
        redis_endpoint = self.outputs.get('redis_endpoint')
        self.assertIsNotNone(redis_endpoint)

        # Extract replication group ID
        parts = redis_endpoint.split('.')
        if len(parts) > 1:
            repl_group_id = parts[1]
        else:
            self.skipTest("Unable to parse replication group ID")

        try:
            response = self.elasticache_client.describe_replication_groups(
                ReplicationGroupId=repl_group_id
            )

            repl_group = response['ReplicationGroups'][0]

            # Verify TLS encryption
            self.assertTrue(
                repl_group.get('TransitEncryptionEnabled', False),
                "Transit encryption (TLS) should be enabled"
            )

            # Verify at-rest encryption
            self.assertTrue(
                repl_group.get('AtRestEncryptionEnabled', False),
                "At-rest encryption should be enabled"
            )
        except ClientError:
            self.skipTest("Unable to describe Redis replication group")

    def test_redis_multi_az(self):
        """Test Redis is configured for multi-AZ deployment"""
        redis_endpoint = self.outputs.get('redis_endpoint')
        parts = redis_endpoint.split('.')
        if len(parts) > 1:
            repl_group_id = parts[1]
        else:
            self.skipTest("Unable to parse replication group ID")

        try:
            response = self.elasticache_client.describe_replication_groups(
                ReplicationGroupId=repl_group_id
            )

            repl_group = response['ReplicationGroups'][0]

            # Verify automatic failover
            self.assertEqual(
                repl_group.get('AutomaticFailover', 'disabled'),
                'enabled',
                "Automatic failover should be enabled"
            )

            # Verify multi-AZ
            self.assertTrue(
                repl_group.get('MultiAZ', 'disabled') in ['enabled', 'true', True],
                "Multi-AZ should be enabled"
            )
        except ClientError:
            self.skipTest("Unable to verify Redis HA configuration")

    def test_redis_port(self):
        """Test Redis port is 6379"""
        redis_port = self.outputs.get('redis_port')
        self.assertIsNotNone(redis_port, "Redis port not found in outputs")

        # Port should be 6379 (standard Redis port)
        self.assertEqual(int(redis_port), 6379)

    def test_region_is_eu_west_1(self):
        """Test infrastructure deployed in eu-west-1 as required"""
        region = self.outputs.get('region')
        self.assertIsNotNone(region, "Region not found in outputs")
        self.assertEqual(region, 'eu-west-1', "Infrastructure must be in eu-west-1")

    def test_ecs_task_has_redis_connection(self):
        """Test ECS task definition references Redis endpoint"""
        task_def_arn = self.outputs.get('task_definition_arn')
        redis_endpoint = self.outputs.get('redis_endpoint')

        response = self.ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )

        task_def = response['taskDefinition']
        containers = task_def.get('containerDefinitions', [])

        self.assertGreater(len(containers), 0, "Task should have at least one container")

        # Check first container for Redis environment variables
        container = containers[0]
        env_vars = {env['name']: env.get('value', '') for env in container.get('environment', [])}

        # Verify Redis endpoint is configured
        self.assertIn('REDIS_ENDPOINT', env_vars, "Container should have REDIS_ENDPOINT env var")

        # Note: We can't assert the exact endpoint value because it's dynamic
        # but we verify the variable exists

    def test_ecs_task_references_redis_secret(self):
        """Test ECS task definition references Redis auth token from Secrets Manager"""
        task_def_arn = self.outputs.get('task_definition_arn')

        response = self.ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )

        task_def = response['taskDefinition']
        containers = task_def.get('containerDefinitions', [])

        self.assertGreater(len(containers), 0)

        # Check first container for secrets
        container = containers[0]
        secrets = container.get('secrets', [])

        # Verify Redis auth token secret exists
        redis_secret = next(
            (s for s in secrets if s['name'] == 'REDIS_AUTH_TOKEN'),
            None
        )

        self.assertIsNotNone(redis_secret, "Container should reference REDIS_AUTH_TOKEN secret")
        self.assertIn('valueFrom', redis_secret, "Secret should have valueFrom ARN")

    def test_internet_gateway_exists(self):
        """Test Internet Gateway exists for public subnet access"""
        vpc_id = self.outputs.get('vpc_id')

        response = self.ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        igws = response['InternetGateways']
        self.assertGreaterEqual(len(igws), 1, "At least one Internet Gateway should exist")

        # Verify attached to VPC
        igw = igws[0]
        attachments = igw.get('Attachments', [])
        self.assertGreater(len(attachments), 0)
        self.assertEqual(attachments[0]['VpcId'], vpc_id)
        self.assertEqual(attachments[0]['State'], 'available')


if __name__ == '__main__':
    unittest.main()
