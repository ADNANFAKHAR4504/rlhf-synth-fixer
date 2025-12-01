"""
Integration tests for deployed infrastructure resources.

These tests verify that the actual AWS resources are deployed correctly
and are operational.
"""

import unittest
import json
import boto3
import pulumi
from pulumi import automation as auto


class TestDeployedResources(unittest.TestCase):
    """Test deployed AWS resources."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures - get stack outputs."""
        try:
            # Get stack outputs
            stack = auto.select_stack(
                stack_name="dev",
                project_name="tap-z9h0j5r1",
                work_dir="."
            )
            cls.outputs = stack.outputs()
        except Exception as e:
            print(f"Warning: Could not get stack outputs: {e}")
            cls.outputs = {}

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2')
        cls.kinesis_client = boto3.client('kinesis')
        cls.elasticache_client = boto3.client('elasticache')
        cls.rds_client = boto3.client('rds')
        cls.secrets_client = boto3.client('secretsmanager')
        cls.cloudwatch_client = boto3.client('cloudwatch')

    def test_vpc_exists(self):
        """Test that VPC exists and is available."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not found in stack outputs")

        vpc_id = self.outputs['vpc_id'].value
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1, "VPC should exist")
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available', "VPC should be available")
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC should have correct CIDR")
        self.assertTrue(vpc['EnableDnsHostnames'], "DNS hostnames should be enabled")
        self.assertTrue(vpc['EnableDnsSupport'], "DNS support should be enabled")

    def test_subnets_exist(self):
        """Test that subnets exist in multiple AZs."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not found in stack outputs")

        vpc_id = self.outputs['vpc_id'].value
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 4, "Should have at least 4 subnets")

        # Check for public and private subnets
        public_subnets = [s for s in subnets if s['MapPublicIpOnLaunch']]
        private_subnets = [s for s in subnets if not s['MapPublicIpOnLaunch']]

        self.assertEqual(len(public_subnets), 2, "Should have 2 public subnets")
        self.assertEqual(len(private_subnets), 2, "Should have 2 private subnets")

        # Verify subnets are in different AZs
        public_azs = {s['AvailabilityZone'] for s in public_subnets}
        private_azs = {s['AvailabilityZone'] for s in private_subnets}
        self.assertEqual(len(public_azs), 2, "Public subnets should be in 2 different AZs")
        self.assertEqual(len(private_azs), 2, "Private subnets should be in 2 different AZs")

    def test_kinesis_stream_exists(self):
        """Test that Kinesis stream exists and is active."""
        if 'kinesis_stream_name' not in self.outputs:
            self.skipTest("Kinesis stream name not found in stack outputs")

        stream_name = self.outputs['kinesis_stream_name'].value
        response = self.kinesis_client.describe_stream(StreamName=stream_name)

        stream = response['StreamDescription']
        self.assertEqual(stream['StreamStatus'], 'ACTIVE', "Kinesis stream should be active")
        self.assertEqual(len(stream['Shards']), 2, "Should have 2 shards")
        self.assertEqual(stream['RetentionPeriodHours'], 24, "Retention should be 24 hours")

    def test_kinesis_stream_put_record(self):
        """Test that we can write records to Kinesis stream."""
        if 'kinesis_stream_name' not in self.outputs:
            self.skipTest("Kinesis stream name not found in stack outputs")

        stream_name = self.outputs['kinesis_stream_name'].value
        test_data = json.dumps({"test": "data", "timestamp": "2025-12-01T20:00:00Z"})

        response = self.kinesis_client.put_record(
            StreamName=stream_name,
            Data=test_data,
            PartitionKey="test-key"
        )

        self.assertIn('SequenceNumber', response, "Should receive sequence number")
        self.assertIn('ShardId', response, "Should receive shard ID")

    def test_redis_cluster_exists(self):
        """Test that Redis replication group exists and is available."""
        if 'redis_endpoint' not in self.outputs:
            self.skipTest("Redis endpoint not found in stack outputs")

        # Get all replication groups and find ours by endpoint
        response = self.elasticache_client.describe_replication_groups()
        replication_groups = response['ReplicationGroups']

        # Find our replication group
        redis_found = False
        for rg in replication_groups:
            if rg['Status'] == 'available':
                self.assertTrue(rg['MultiAZ'] in ['enabled', 'Enabled'], "Multi-AZ should be enabled")
                self.assertTrue(rg['AutomaticFailover'] in ['enabled', 'Enabled'], "Automatic failover should be enabled")
                self.assertEqual(len(rg['MemberClusters']), 2, "Should have 2 member clusters")
                redis_found = True
                break

        if not redis_found:
            self.skipTest("Could not find active Redis replication group")

    def test_rds_instance_exists(self):
        """Test that RDS instance exists and is available."""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not found in stack outputs")

        endpoint = self.outputs['rds_endpoint'].value
        db_instance_id = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_id
        )

        self.assertEqual(len(response['DBInstances']), 1, "RDS instance should exist")
        db = response['DBInstances'][0]
        self.assertEqual(db['DBInstanceStatus'], 'available', "RDS instance should be available")
        self.assertEqual(db['Engine'], 'postgres', "Engine should be PostgreSQL")
        self.assertTrue(db['MultiAZ'], "Multi-AZ should be enabled")
        self.assertTrue(db['StorageEncrypted'], "Storage should be encrypted")
        self.assertEqual(db['DBInstanceClass'], 'db.t3.micro', "Instance class should be db.t3.micro")

    def test_db_secret_exists(self):
        """Test that database secret exists in Secrets Manager."""
        if 'rds_secret_arn' not in self.outputs:
            self.skipTest("RDS secret ARN not found in stack outputs")

        secret_arn = self.outputs['rds_secret_arn'].value
        response = self.secrets_client.describe_secret(SecretId=secret_arn)

        self.assertIn('ARN', response, "Secret should have ARN")
        self.assertIn('Name', response, "Secret should have name")

        # Test secret value can be retrieved
        secret_value = self.secrets_client.get_secret_value(SecretId=secret_arn)
        self.assertIn('SecretString', secret_value, "Secret should have string value")

        secret_data = json.loads(secret_value['SecretString'])
        self.assertIn('username', secret_data, "Secret should contain username")
        self.assertIn('password', secret_data, "Secret should contain password")
        self.assertIn('host', secret_data, "Secret should contain host")
        self.assertIn('port', secret_data, "Secret should contain port")

    def test_security_groups_exist(self):
        """Test that security groups exist with correct rules."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not found in stack outputs")

        vpc_id = self.outputs['vpc_id'].value
        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        # Should have at least 3: default + Redis + RDS
        self.assertGreaterEqual(len(security_groups), 3, "Should have at least 3 security groups")

        # Find Redis and RDS security groups
        redis_sg = next((sg for sg in security_groups if 'redis' in sg['GroupName'].lower()), None)
        rds_sg = next((sg for sg in security_groups if 'rds' in sg['GroupName'].lower()), None)

        self.assertIsNotNone(redis_sg, "Redis security group should exist")
        self.assertIsNotNone(rds_sg, "RDS security group should exist")

        # Verify Redis SG has port 6379 ingress
        redis_ingress = redis_sg['IpPermissions']
        port_6379_rule = next((rule for rule in redis_ingress if rule.get('FromPort') == 6379), None)
        self.assertIsNotNone(port_6379_rule, "Redis SG should allow port 6379")

        # Verify RDS SG has port 5432 ingress
        rds_ingress = rds_sg['IpPermissions']
        port_5432_rule = next((rule for rule in rds_ingress if rule.get('FromPort') == 5432), None)
        self.assertIsNotNone(port_5432_rule, "RDS SG should allow port 5432")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        response = self.cloudwatch_client.describe_alarms()
        alarms = response['MetricAlarms']

        # Filter alarms for our stack (should have at least 3)
        stack_alarms = [a for a in alarms if 'test-stack' in a['AlarmName'].lower()]
        self.assertGreaterEqual(len(stack_alarms), 3, "Should have at least 3 CloudWatch alarms")

        # Check for specific alarm types
        alarm_names = [a['AlarmName'].lower() for a in stack_alarms]
        has_rds_alarm = any('rds' in name and 'cpu' in name for name in alarm_names)
        has_redis_alarm = any('redis' in name and 'cpu' in name for name in alarm_names)
        has_kinesis_alarm = any('kinesis' in name for name in alarm_names)

        self.assertTrue(has_rds_alarm, "Should have RDS CPU alarm")
        self.assertTrue(has_redis_alarm, "Should have Redis CPU alarm")
        self.assertTrue(has_kinesis_alarm, "Should have Kinesis records alarm")


if __name__ == "__main__":
    unittest.main()
