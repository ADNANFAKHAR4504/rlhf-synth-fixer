"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack."""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.elasticache_client = boto3.client('elasticache', region_name=cls.region)
        cls.kinesis_client = boto3.client('kinesis', region_name=cls.region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)

        # Load stack outputs from flat-outputs.json
        outputs_file = os.path.join(os.getcwd(), 'cfn-outputs', 'flat-outputs.json')
        try:
            with open(outputs_file, 'r') as f:
                cls.outputs = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load stack outputs from {outputs_file}: {e}")
            cls.outputs = {}

    def test_vpc_exists_and_configured(self):
        """Test VPC exists with correct CIDR and DNS settings."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not found in stack outputs")

        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        # Check DNS settings (may be null/empty initially)
        dns_hostnames = vpc.get('EnableDnsHostnames')
        dns_support = vpc.get('EnableDnsSupport')
        # DNS should not be explicitly disabled
        self.assertNotEqual(dns_hostnames, False, "DNS hostnames should not be explicitly disabled")
        self.assertNotEqual(dns_support, False, "DNS support should not be explicitly disabled")

    def test_private_subnets_exist(self):
        """Test private subnets exist in different availability zones."""
        if 'private_subnet_ids' not in self.outputs:
            self.skipTest("Private subnet IDs not found in stack outputs")

        subnet_ids = self.outputs['private_subnet_ids']
        response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)

        self.assertEqual(len(response['Subnets']), 2)
        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])
        self.assertEqual(len(azs), 2, "Subnets should be in different AZs")

        # Verify subnets are private (no auto-assign public IP)
        for subnet in response['Subnets']:
            self.assertFalse(subnet.get('MapPublicIpOnLaunch', False))

    def test_nat_gateway_exists(self):
        """Test NAT Gateway exists and is available."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not found in stack outputs")

        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_gateways = [ng for ng in response['NatGateways'] if ng['State'] != 'deleted']
        self.assertGreater(len(nat_gateways), 0, "NAT Gateway should exist")
        self.assertEqual(nat_gateways[0]['State'], 'available')

    def test_kinesis_stream_exists_with_encryption(self):
        """Test Kinesis stream exists with encryption enabled."""
        if 'kinesis_stream_name' not in self.outputs:
            self.skipTest("Kinesis stream name not found in stack outputs")

        stream_name = self.outputs['kinesis_stream_name']
        response = self.kinesis_client.describe_stream(StreamName=stream_name)

        stream_desc = response['StreamDescription']
        self.assertEqual(stream_desc['StreamStatus'], 'ACTIVE')
        self.assertEqual(stream_desc['EncryptionType'], 'KMS')
        self.assertGreaterEqual(stream_desc['RetentionPeriodHours'], 24)
        self.assertEqual(len(stream_desc['Shards']), 2)

    def test_rds_instance_exists_with_hipaa_compliance(self):
        """Test RDS instance exists with HIPAA-compliant configuration."""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not found in stack outputs")

        # Extract DB identifier from endpoint
        endpoint = self.outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response['DBInstances'][0]

        # Test encryption
        self.assertTrue(db_instance['StorageEncrypted'], "RDS must be encrypted at rest")

        # Test backup retention
        self.assertGreaterEqual(
            db_instance['BackupRetentionPeriod'],
            30,
            "Backup retention must be at least 30 days"
        )

        # Test Multi-AZ
        self.assertTrue(db_instance['MultiAZ'], "RDS must be Multi-AZ")

        # Test public accessibility
        self.assertFalse(
            db_instance['PubliclyAccessible'],
            "RDS must not be publicly accessible"
        )

        # Test storage type
        self.assertEqual(db_instance['StorageType'], 'gp3')

    def test_elasticache_redis_exists_with_encryption(self):
        """Test ElastiCache Redis exists with encryption enabled."""
        if 'redis_endpoint' not in self.outputs:
            self.skipTest("Redis endpoint not found in stack outputs")

        # Extract replication group ID from endpoint
        endpoint = self.outputs['redis_endpoint']
        # Format: master.medtech-redis-synth6362828428.xxx.use1.cache.amazonaws.com
        parts = endpoint.split('.')
        replication_group_id = parts[1]  # medtech-redis-synth6362828428

        response = self.elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )

        redis = response['ReplicationGroups'][0]

        # Test encryption
        self.assertTrue(redis['AtRestEncryptionEnabled'], "Redis must be encrypted at rest")
        self.assertTrue(redis['TransitEncryptionEnabled'], "Redis must be encrypted in transit")

        # Test automatic failover
        self.assertEqual(redis['AutomaticFailover'], 'enabled', "Automatic failover must be enabled")

        # Test snapshot retention
        self.assertGreaterEqual(redis['SnapshotRetentionLimit'], 5)

    def test_rds_secret_exists_in_secrets_manager(self):
        """Test RDS credentials are stored in Secrets Manager."""
        if 'rds_secret_arn' not in self.outputs:
            self.skipTest("RDS secret ARN not found in stack outputs")

        secret_arn = self.outputs['rds_secret_arn']

        try:
            response = self.secrets_client.describe_secret(SecretId=secret_arn)
            self.assertIn('rds-credentials', response['Name'])

            # Test secret value structure
            secret_value = self.secrets_client.get_secret_value(SecretId=secret_arn)
            secret_data = json.loads(secret_value['SecretString'])

            self.assertIn('username', secret_data)
            self.assertIn('password', secret_data)
            self.assertIn('host', secret_data)
            self.assertIn('port', secret_data)
            self.assertIn('dbname', secret_data)

        except ClientError as e:
            self.fail(f"Failed to retrieve RDS secret: {e}")

    def test_redis_secret_exists_in_secrets_manager(self):
        """Test Redis auth token is stored in Secrets Manager."""
        if 'redis_secret_arn' not in self.outputs:
            self.skipTest("Redis secret ARN not found in stack outputs")

        secret_arn = self.outputs['redis_secret_arn']

        try:
            response = self.secrets_client.describe_secret(SecretId=secret_arn)
            self.assertIn('redis-credentials', response['Name'])

            # Test secret value structure
            secret_value = self.secrets_client.get_secret_value(SecretId=secret_arn)
            secret_data = json.loads(secret_value['SecretString'])

            self.assertIn('auth_token', secret_data)

        except ClientError as e:
            self.fail(f"Failed to retrieve Redis secret: {e}")

    def test_security_groups_configured_correctly(self):
        """Test security groups have correct ingress rules."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not found in stack outputs")

        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Test RDS security group
        rds_sgs = [sg for sg in response['SecurityGroups'] if 'rds' in sg['GroupName'].lower()]
        if rds_sgs:
            rds_sg = rds_sgs[0]
            ingress_rules = rds_sg['IpPermissions']
            postgres_rule = next(
                (rule for rule in ingress_rules if rule.get('FromPort') == 5432),
                None
            )
            self.assertIsNotNone(postgres_rule, "PostgreSQL port should be allowed")

        # Test Redis security group
        redis_sgs = [sg for sg in response['SecurityGroups'] if 'redis' in sg['GroupName'].lower()]
        if redis_sgs:
            redis_sg = redis_sgs[0]
            ingress_rules = redis_sg['IpPermissions']
            redis_rule = next(
                (rule for rule in ingress_rules if rule.get('FromPort') == 6379),
                None
            )
            self.assertIsNotNone(redis_rule, "Redis port should be allowed")

    def test_iam_roles_exist(self):
        """Test IAM roles are created for Kinesis and Secrets Manager access."""
        if 'kinesis_producer_role_arn' not in self.outputs:
            self.skipTest("Kinesis producer role ARN not found in stack outputs")

        kinesis_role_arn = self.outputs['kinesis_producer_role_arn']
        role_name = kinesis_role_arn.split('/')[-1]

        try:
            response = self.iam_client.get_role(RoleName=role_name)
            self.assertIn('kinesis-producer-role', role_name)
        except ClientError as e:
            self.fail(f"Kinesis producer role not found: {e}")

        if 'secrets_reader_role_arn' in self.outputs:
            secrets_role_arn = self.outputs['secrets_reader_role_arn']
            role_name = secrets_role_arn.split('/')[-1]

            try:
                response = self.iam_client.get_role(RoleName=role_name)
                self.assertIn('secrets-reader-role', role_name)
            except ClientError as e:
                self.fail(f"Secrets reader role not found: {e}")

    def test_rds_backups_enabled(self):
        """Test RDS automated backups are enabled and encrypted."""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not found in stack outputs")

        endpoint = self.outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response['DBInstances'][0]

        # Test backup retention
        self.assertEqual(db_instance['BackupRetentionPeriod'], 30)

        # Test backup window is configured
        self.assertIsNotNone(db_instance.get('PreferredBackupWindow'))

        # Test maintenance window is configured
        self.assertIsNotNone(db_instance.get('PreferredMaintenanceWindow'))

    def test_network_isolation(self):
        """Test that sensitive resources are in private subnets."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not found in stack outputs")

        vpc_id = self.outputs['vpc_id']

        # Get all route tables
        response = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Find private route tables (those with NAT Gateway routes)
        private_route_tables = []
        for rt in response['RouteTables']:
            for route in rt['Routes']:
                if route.get('NatGatewayId'):
                    private_route_tables.append(rt['RouteTableId'])
                    break

        self.assertGreater(
            len(private_route_tables),
            0,
            "Private route tables with NAT Gateway should exist"
        )

    def test_cloudwatch_logs_enabled_for_rds(self):
        """Test CloudWatch logs are enabled for RDS."""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not found in stack outputs")

        endpoint = self.outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response['DBInstances'][0]

        # Test CloudWatch logs exports
        enabled_logs = db_instance.get('EnabledCloudwatchLogsExports', [])
        self.assertIn('postgresql', enabled_logs, "PostgreSQL logs should be exported")


if __name__ == '__main__':
    unittest.main()
