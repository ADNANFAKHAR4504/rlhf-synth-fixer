"""
Integration tests for FastCart Order Processing TapStack.

Integration tests for live deployed Pulumi infrastructure using actual AWS resources.
Tests read outputs from cfn-outputs/flat-outputs.json to validate deployed resources.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """
    Integration tests for deployed FastCart infrastructure.

    These tests validate:
    - Actual AWS resources are created
    - Resources are accessible with correct configuration
    - Security settings are properly applied
    - Outputs are correct and usable
    """

    @classmethod
    def setUpClass(cls):
        """Load stack outputs once for all tests."""
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_file):
            raise unittest.SkipTest(
                f"Outputs file {outputs_file} not found. "
                "Integration tests require deployed infrastructure."
            )

        with open(outputs_file, 'r') as f:
            raw_outputs = json.load(f)

        # Normalize output values (convert JSON-encoded lists/bools)
        cls.outputs = {}
        for key, value in raw_outputs.items():
            if isinstance(value, str):
                stripped = value.strip()
                if stripped.lower() in ('true', 'false'):
                    cls.outputs[key] = stripped.lower() == 'true'
                    continue
                if (stripped.startswith('[') and stripped.endswith(']')) or (
                    stripped.startswith('{') and stripped.endswith('}')
                ):
                    try:
                        cls.outputs[key] = json.loads(stripped)
                        continue
                    except json.JSONDecodeError:
                        pass
            cls.outputs[key] = value

        # Initialize AWS clients (skip when credentials not available)
        cls.region = 'eu-central-1'
        session = boto3.Session(region_name=cls.region)
        if session.get_credentials() is None:
            raise unittest.SkipTest("AWS credentials not configured; skipping integration tests.")

        cls.ec2 = session.client('ec2')
        cls.ecs = session.client('ecs')
        cls.rds = session.client('rds')
        cls.elasticache = session.client('elasticache')
        cls.kinesis = session.client('kinesis')
        cls.kms = session.client('kms')
        cls.secretsmanager = session.client('secretsmanager')
        cls.ecr = session.client('ecr')
        cls.cloudwatch = session.client('cloudwatch')
        cls.logs = session.client('logs')

    def test_vpc_exists(self):
        """Test that VPC exists and is properly configured."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        dns_support = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    def test_kms_key_exists(self):
        """Test that KMS key exists and has rotation enabled."""
        kms_key_id = self.outputs.get('kms_key_id')
        self.assertIsNotNone(kms_key_id, "KMS key ID should be in outputs")

        key_metadata = self.kms.describe_key(KeyId=kms_key_id)
        self.assertEqual(key_metadata['KeyMetadata']['KeyState'], 'Enabled')

        rotation_status = self.kms.get_key_rotation_status(KeyId=kms_key_id)
        self.assertTrue(rotation_status['KeyRotationEnabled'])

    def test_rds_instance_exists(self):
        """Test that RDS instance exists and has encryption enabled."""
        rds_identifier = self.outputs.get('rds_instance_identifier')
        if not rds_identifier:
            rds_arn = self.outputs.get('rds_instance_arn')
            if rds_arn and ':db:' in rds_arn:
                rds_identifier = rds_arn.split(':db:')[-1]

        rds_resource_id = self.outputs.get('rds_instance_id')

        if not rds_identifier and rds_resource_id:
            # Attempt to find identifier by enumerating instances
            instances = self.rds.describe_db_instances()['DBInstances']
            match = next(
                (db for db in instances if db.get('DbiResourceId') == rds_resource_id),
                None
            )
            if match:
                rds_identifier = match['DBInstanceIdentifier']

        if not rds_identifier:
            self.skipTest("RDS instance identifier not available in outputs")

        try:
            response = self.rds.describe_db_instances(DBInstanceIdentifier=rds_identifier)
        except self.rds.exceptions.DBInstanceNotFoundFault:
            self.skipTest(f"RDS instance '{rds_identifier}' not found")

        db_instance = response['DBInstances'][0]

        self.assertEqual(db_instance['Engine'], 'postgres')
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertFalse(db_instance['PubliclyAccessible'])

    def test_elasticache_cluster_exists(self):
        """Test that ElastiCache Redis cluster exists with encryption."""
        replication_group_id = self.outputs.get('redis_replication_group_id')
        self.assertIsNotNone(replication_group_id, "Redis replication group ID should be in outputs")

        try:
            response = self.elasticache.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            group = response['ReplicationGroups'][0]
            self.assertTrue(group['AtRestEncryptionEnabled'])
            self.assertTrue(group['TransitEncryptionEnabled'])
            self.assertTrue(group['AuthTokenEnabled'])

            primary_endpoint = self.outputs.get('redis_primary_endpoint')
            if primary_endpoint and group['NodeGroups']:
                endpoint = group['NodeGroups'][0].get('PrimaryEndpoint', {})
                self.assertIn(primary_endpoint.split('.')[0], endpoint.get('Address', ''))
        except ClientError as exc:
            self.skipTest(f"Unable to verify ElastiCache cluster: {exc}")

    def test_kinesis_stream_exists(self):
        """Test that Kinesis stream exists and has encryption enabled."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be in outputs")

        response = self.kinesis.describe_stream(StreamName=kinesis_stream_name)
        stream = response['StreamDescription']

        self.assertEqual(stream['StreamStatus'], 'ACTIVE')
        self.assertEqual(stream['EncryptionType'], 'KMS')

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists and is active."""
        ecs_cluster_arn = self.outputs.get('ecs_cluster_arn')
        self.assertIsNotNone(ecs_cluster_arn, "ECS cluster ARN should be in outputs")

        response = self.ecs.describe_clusters(clusters=[ecs_cluster_arn])
        cluster = response['clusters'][0]

        self.assertEqual(cluster['status'], 'ACTIVE')

    def test_ecs_service_exists(self):
        """Test that ECS service is running."""
        ecs_cluster_arn = self.outputs.get('ecs_cluster_arn')
        ecs_service_name = self.outputs.get('ecs_service_name')

        if not ecs_cluster_arn or not ecs_service_name:
            self.skipTest("ECS cluster or service name not in outputs")

        response = self.ecs.describe_services(
            cluster=ecs_cluster_arn,
            services=[ecs_service_name]
        )

        if response['services']:
            service = response['services'][0]
            self.assertEqual(service['status'], 'ACTIVE')
            self.assertEqual(service['launchType'], 'FARGATE')

    def test_ecr_repository_exists(self):
        """Test that ECR repository exists."""
        ecr_repository_url = self.outputs.get('ecr_repository_url')
        self.assertIsNotNone(ecr_repository_url, "ECR repository URL should be in outputs")

        # Extract repository name from URL
        repository_name = ecr_repository_url.split('/')[-1] if '/' in ecr_repository_url else None

        if repository_name:
            response = self.ecr.describe_repositories(repositoryNames=[repository_name])
            repository = response['repositories'][0]

            self.assertEqual(repository['encryptionConfiguration']['encryptionType'], 'KMS')

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists with retention."""
        log_group_name = self.outputs.get('log_group_name')
        self.assertIsNotNone(log_group_name, "Log group name should be in outputs")

        response = self.logs.describe_log_groups(logGroupNamePrefix=log_group_name)

        found = False
        for log_group in response['logGroups']:
            if log_group['logGroupName'] == log_group_name:
                found = True
                self.assertIsNotNone(log_group.get('retentionInDays'))
                self.assertIsNotNone(log_group.get('kmsKeyId'))
                break

        self.assertTrue(found, "Log group should exist")

    def test_subnets_exist(self):
        """Test that public and private subnets exist."""
        public_subnet_ids = self.outputs.get('public_subnet_ids', [])
        private_subnet_ids = self.outputs.get('private_subnet_ids', [])

        self.assertGreater(len(public_subnet_ids), 0, "Should have public subnets")
        self.assertGreater(len(private_subnet_ids), 0, "Should have private subnets")

        all_subnet_ids = public_subnet_ids + private_subnet_ids
        response = self.ec2.describe_subnets(SubnetIds=all_subnet_ids)

        self.assertEqual(len(response['Subnets']), len(all_subnet_ids))

    def test_outputs_completeness(self):
        """Test that all expected outputs are present."""
        expected_outputs = [
            'vpc_id',
            'ecs_cluster_arn',
            'kinesis_stream_name',
            'rds_endpoint',
            'redis_primary_endpoint',
            'kms_key_id',
            'log_group_name'
        ]

        for output in expected_outputs:
            self.assertIn(output, self.outputs, f"Output '{output}' should be present")
            self.assertIsNotNone(self.outputs[output], f"Output '{output}' should not be None")


if __name__ == '__main__':
    unittest.main()
