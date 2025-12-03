"""
Integration tests for deployed infrastructure resources.

These tests verify that the actual AWS resources are deployed correctly
and are operational by loading outputs from cfn-outputs/flat-outputs.json
and performing live AWS resource checks.
"""

import json
import os
import unittest
from pathlib import Path

import boto3
from botocore.exceptions import ClientError


class TestDeployedResources(unittest.TestCase):
    """Test deployed AWS resources using deployment outputs."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures - load deployment outputs and initialize AWS clients."""
        # Load outputs from flat-outputs.json
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_path.exists():
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_path}. "
                "Please deploy the infrastructure first."
            )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Parse JSON strings in outputs
        if 'public_subnet_ids' in cls.outputs and isinstance(cls.outputs['public_subnet_ids'], str):
            cls.outputs['public_subnet_ids'] = json.loads(cls.outputs['public_subnet_ids'])
        if 'private_subnet_ids' in cls.outputs and isinstance(cls.outputs['private_subnet_ids'], str):
            cls.outputs['private_subnet_ids'] = json.loads(cls.outputs['private_subnet_ids'])

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2')
        cls.kinesis_client = boto3.client('kinesis')
        cls.elasticache_client = boto3.client('elasticache')
        cls.rds_client = boto3.client('rds')
        cls.secrets_client = boto3.client('secretsmanager')
        cls.cloudwatch_client = boto3.client('cloudwatch')

    def test_outputs_file_exists(self):
        """Test that deployment outputs file exists and is valid."""
        self.assertIsNotNone(self.outputs, "Outputs should be loaded")
        self.assertGreater(len(self.outputs), 0, "Outputs should not be empty")

        # Verify required outputs exist
        required_outputs = [
            'vpc_id',
            'kinesis_stream_name',
            'rds_endpoint',
            'rds_secret_arn',
            'public_subnet_ids',
            'private_subnet_ids',
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Output '{output}' should exist")


    def test_subnets_multi_az_configuration(self):
        """Test that subnets are properly configured across multiple AZs."""
        vpc_id = self.outputs['vpc_id']
        public_subnet_ids = self.outputs['public_subnet_ids']
        private_subnet_ids = self.outputs['private_subnet_ids']

        # Verify we have 2 public and 2 private subnets
        self.assertEqual(len(public_subnet_ids), 2, "Should have 2 public subnets")
        self.assertEqual(len(private_subnet_ids), 2, "Should have 2 private subnets")

        # Check public subnets
        public_response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        public_subnets = public_response['Subnets']

        self.assertEqual(len(public_subnets), 2, "Both public subnets should exist")

        for subnet in public_subnets:
            self.assertEqual(subnet['VpcId'], vpc_id, "Subnet should be in correct VPC")
            self.assertTrue(
                subnet['MapPublicIpOnLaunch'],
                f"Public subnet {subnet['SubnetId']} should auto-assign public IPs"
            )
            self.assertEqual(subnet['State'], 'available', "Subnet should be available")

        # Verify public subnets are in different AZs
        public_azs = {s['AvailabilityZone'] for s in public_subnets}
        self.assertEqual(
            len(public_azs), 2,
            "Public subnets should be in 2 different availability zones"
        )

        # Check private subnets
        private_response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        private_subnets = private_response['Subnets']

        self.assertEqual(len(private_subnets), 2, "Both private subnets should exist")

        for subnet in private_subnets:
            self.assertEqual(subnet['VpcId'], vpc_id, "Subnet should be in correct VPC")
            self.assertFalse(
                subnet['MapPublicIpOnLaunch'],
                f"Private subnet {subnet['SubnetId']} should not auto-assign public IPs"
            )
            self.assertEqual(subnet['State'], 'available', "Subnet should be available")

        # Verify private subnets are in different AZs
        private_azs = {s['AvailabilityZone'] for s in private_subnets}
        self.assertEqual(
            len(private_azs), 2,
            "Private subnets should be in 2 different availability zones"
        )

        # Verify CIDR blocks are correct
        expected_public_cidrs = {'10.0.0.0/24', '10.0.1.0/24'}
        expected_private_cidrs = {'10.0.10.0/24', '10.0.11.0/24'}

        actual_public_cidrs = {s['CidrBlock'] for s in public_subnets}
        actual_private_cidrs = {s['CidrBlock'] for s in private_subnets}

        self.assertEqual(
            actual_public_cidrs, expected_public_cidrs,
            "Public subnets should have correct CIDR blocks"
        )
        self.assertEqual(
            actual_private_cidrs, expected_private_cidrs,
            "Private subnets should have correct CIDR blocks"
        )

    def test_internet_gateway_and_route_tables(self):
        """Test that Internet Gateway and route tables are properly configured."""
        vpc_id = self.outputs['vpc_id']

        # Check Internet Gateway exists
        igw_response = self.ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        self.assertEqual(
            len(igw_response['InternetGateways']), 1,
            "Should have exactly 1 Internet Gateway"
        )
        igw = igw_response['InternetGateways'][0]
        self.assertEqual(
            igw['Attachments'][0]['State'], 'available',
            "Internet Gateway should be attached"
        )

        # Check route tables
        rt_response = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        route_tables = rt_response['RouteTables']

        # Should have main + public + private = at least 3 route tables
        self.assertGreaterEqual(
            len(route_tables), 2,
            "Should have at least 2 route tables (public and private)"
        )

        # Find public route table (has route to IGW)
        public_rt = None
        for rt in route_tables:
            for route in rt['Routes']:
                if route.get('GatewayId', '').startswith('igw-'):
                    public_rt = rt
                    break
            if public_rt:
                break

        self.assertIsNotNone(public_rt, "Should have a public route table with IGW route")

    def test_kinesis_stream_active_and_configured(self):
        """Test that Kinesis stream is active and properly configured."""
        stream_name = self.outputs['kinesis_stream_name']

        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        self.assertEqual(
            stream['StreamStatus'], 'ACTIVE',
            "Kinesis stream should be active"
        )
        self.assertEqual(
            len(stream['Shards']), 2,
            "Should have exactly 2 shards for parallel processing"
        )
        self.assertEqual(
            stream['RetentionPeriodHours'], 24,
            "Retention period should be 24 hours"
        )
        self.assertTrue(
            stream['EnhancedMonitoring'][0]['ShardLevelMetrics'],
            "Shard-level metrics should be enabled"
        )

    def test_kinesis_stream_write_capability(self):
        """Test that Kinesis stream can accept records."""
        stream_name = self.outputs['kinesis_stream_name']

        test_data = json.dumps({
            "test": "integration-test-data",
            "timestamp": "2025-12-03T00:00:00Z",
            "event_type": "test_event"
        })

        response = self.kinesis_client.put_record(
            StreamName=stream_name,
            Data=test_data.encode('utf-8'),
            PartitionKey="integration-test-key"
        )

        self.assertIn('SequenceNumber', response, "Should receive sequence number")
        self.assertIn('ShardId', response, "Should receive shard ID")
        self.assertEqual(
            response['ResponseMetadata']['HTTPStatusCode'], 200,
            "Put record should succeed"
        )

    def test_elasticache_redis_multi_az(self):
        """Test that ElastiCache Redis is configured with Multi-AZ."""
        vpc_id = self.outputs['vpc_id']
        redis_sg_id = self.outputs.get('redis_security_group_id')

        # Get all replication groups
        response = self.elasticache_client.describe_replication_groups()
        replication_groups = response['ReplicationGroups']

        # Find replication group in our VPC
        redis_rg = None
        for rg in replication_groups:
            # Check if any cache cluster is in our security group
            if redis_sg_id:
                for cluster_id in rg.get('MemberClusters', []):
                    cluster_response = self.elasticache_client.describe_cache_clusters(
                        CacheClusterId=cluster_id
                    )
                    cluster = cluster_response['CacheClusters'][0]
                    cluster_sg_ids = [sg['SecurityGroupId'] for sg in cluster.get('SecurityGroups', [])]

                    if redis_sg_id in cluster_sg_ids:
                        redis_rg = rg
                        break

                if redis_rg:
                    break

        self.assertIsNotNone(redis_rg, "Redis replication group should exist")
        self.assertEqual(
            redis_rg['Status'], 'available',
            "Redis replication group should be available"
        )
        self.assertEqual(
            len(redis_rg['MemberClusters']), 2,
            "Should have 2 cache clusters for Multi-AZ"
        )
        self.assertEqual(
            redis_rg['MultiAZ'], 'enabled',
            "Multi-AZ should be enabled"
        )
        self.assertEqual(
            redis_rg['AutomaticFailover'], 'enabled',
            "Automatic failover should be enabled"
        )

        # Verify encryption
        self.assertTrue(
            redis_rg.get('AtRestEncryptionEnabled', False),
            "At-rest encryption should be enabled"
        )
        self.assertTrue(
            redis_rg.get('TransitEncryptionEnabled', False),
            "Transit encryption should be enabled"
        )

    def test_rds_instance_multi_az(self):
        """Test that RDS instance is configured with Multi-AZ."""
        rds_address = self.outputs['rds_address']
        db_instance_id = rds_address.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_id
        )

        self.assertEqual(
            len(response['DBInstances']), 1,
            "RDS instance should exist"
        )

        db = response['DBInstances'][0]

        self.assertEqual(
            db['DBInstanceStatus'], 'available',
            "RDS instance should be available"
        )
        self.assertEqual(
            db['Engine'], 'postgres',
            "Engine should be PostgreSQL"
        )
        self.assertEqual(
            db['EngineVersion'], '15.15',
            "Engine version should be 15.15"
        )
        self.assertTrue(
            db['MultiAZ'],
            "Multi-AZ deployment should be enabled"
        )
        self.assertTrue(
            db['StorageEncrypted'],
            "Storage encryption should be enabled"
        )
        self.assertEqual(
            db['DBInstanceClass'], 'db.t3.micro',
            "Instance class should be db.t3.micro"
        )
        self.assertEqual(
            db['AllocatedStorage'], 20,
            "Allocated storage should be 20 GB"
        )
        self.assertEqual(
            db['BackupRetentionPeriod'], 7,
            "Backup retention should be 7 days"
        )
        self.assertFalse(
            db['PubliclyAccessible'],
            "RDS should not be publicly accessible"
        )

    def test_rds_subnet_group(self):
        """Test that RDS is deployed in private subnets."""
        rds_address = self.outputs['rds_address']
        db_instance_id = rds_address.split('.')[0]
        private_subnet_ids = set(self.outputs['private_subnet_ids'])

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_id
        )

        db = response['DBInstances'][0]
        db_subnet_group = db['DBSubnetGroup']

        # Get subnet IDs from DB subnet group
        db_subnets = {subnet['SubnetIdentifier'] for subnet in db_subnet_group['Subnets']}

        self.assertEqual(
            db_subnets, private_subnet_ids,
            "RDS should be deployed in private subnets"
        )

        # Verify subnets are in different AZs
        db_azs = {subnet['SubnetAvailabilityZone']['Name'] for subnet in db_subnet_group['Subnets']}
        self.assertEqual(
            len(db_azs), 2,
            "DB subnet group should span 2 availability zones"
        )

    def test_secrets_manager_secret(self):
        """Test that database credentials are stored in Secrets Manager."""
        secret_arn = self.outputs['rds_secret_arn']

        # Describe secret
        response = self.secrets_client.describe_secret(SecretId=secret_arn)

        self.assertEqual(
            response['ARN'], secret_arn,
            "Secret ARN should match"
        )
        self.assertIn('Name', response, "Secret should have a name")

        # Get secret value
        secret_value_response = self.secrets_client.get_secret_value(SecretId=secret_arn)

        self.assertIn(
            'SecretString', secret_value_response,
            "Secret should have string value"
        )

        secret_data = json.loads(secret_value_response['SecretString'])

        # Verify required fields
        required_fields = ['username', 'password', 'engine', 'port', 'dbname']
        for field in required_fields:
            self.assertIn(
                field, secret_data,
                f"Secret should contain '{field}' field"
            )

        # Verify values match deployment
        self.assertEqual(
            str(secret_data['port']), self.outputs['rds_port'],
            "Secret port should match RDS port"
        )
        self.assertEqual(
            secret_data['dbname'], self.outputs['rds_db_name'],
            "Secret database name should match RDS database name"
        )

    def test_security_groups_configuration(self):
        """Test that security groups are properly configured."""
        vpc_id = self.outputs['vpc_id']
        redis_sg_id = self.outputs['redis_security_group_id']
        rds_sg_id = self.outputs['rds_security_group_id']

        # Test Redis security group
        redis_sg_response = self.ec2_client.describe_security_groups(
            GroupIds=[redis_sg_id]
        )
        redis_sg = redis_sg_response['SecurityGroups'][0]

        self.assertEqual(redis_sg['VpcId'], vpc_id, "Redis SG should be in correct VPC")

        # Check Redis ingress rules (port 6379)
        redis_ingress = redis_sg['IpPermissions']
        port_6379_rule = next(
            (rule for rule in redis_ingress if rule.get('FromPort') == 6379),
            None
        )
        self.assertIsNotNone(
            port_6379_rule,
            "Redis SG should allow port 6379"
        )

        # Check Redis allows traffic from VPC CIDR
        has_vpc_cidr = any(
            '10.0.0.0/16' in ip_range['CidrIp']
            for ip_range in port_6379_rule.get('IpRanges', [])
        )
        self.assertTrue(
            has_vpc_cidr,
            "Redis SG should allow traffic from VPC CIDR (10.0.0.0/16)"
        )

        # Test RDS security group
        rds_sg_response = self.ec2_client.describe_security_groups(
            GroupIds=[rds_sg_id]
        )
        rds_sg = rds_sg_response['SecurityGroups'][0]

        self.assertEqual(rds_sg['VpcId'], vpc_id, "RDS SG should be in correct VPC")

        # Check RDS ingress rules (port 5432)
        rds_ingress = rds_sg['IpPermissions']
        port_5432_rule = next(
            (rule for rule in rds_ingress if rule.get('FromPort') == 5432),
            None
        )
        self.assertIsNotNone(
            port_5432_rule,
            "RDS SG should allow port 5432"
        )

        # Check RDS allows traffic from VPC CIDR
        has_vpc_cidr = any(
            '10.0.0.0/16' in ip_range['CidrIp']
            for ip_range in port_5432_rule.get('IpRanges', [])
        )
        self.assertTrue(
            has_vpc_cidr,
            "RDS SG should allow traffic from VPC CIDR (10.0.0.0/16)"
        )

        # Verify both have egress rules
        self.assertGreater(
            len(redis_sg['IpPermissionsEgress']), 0,
            "Redis SG should have egress rules"
        )
        self.assertGreater(
            len(rds_sg['IpPermissionsEgress']), 0,
            "RDS SG should have egress rules"
        )

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created and configured."""
        rds_alarm_arn = self.outputs['rds_cpu_alarm_arn']
        redis_alarm_arn = self.outputs['redis_cpu_alarm_arn']
        kinesis_alarm_arn = self.outputs['kinesis_records_alarm_arn']

        alarm_arns = [rds_alarm_arn, redis_alarm_arn, kinesis_alarm_arn]
        alarm_names = [arn.split(':')[-1] for arn in alarm_arns]

        response = self.cloudwatch_client.describe_alarms(AlarmNames=alarm_names)
        alarms = response['MetricAlarms']

        self.assertEqual(
            len(alarms), 3,
            "Should have exactly 3 CloudWatch alarms"
        )

        # Check RDS CPU alarm
        rds_alarm = next(
            (a for a in alarms if 'rds' in a['AlarmName'].lower() and 'cpu' in a['AlarmName'].lower()),
            None
        )
        self.assertIsNotNone(rds_alarm, "RDS CPU alarm should exist")
        self.assertEqual(rds_alarm['MetricName'], 'CPUUtilization', "Should monitor CPU")
        self.assertEqual(rds_alarm['Namespace'], 'AWS/RDS', "Should be in RDS namespace")
        self.assertEqual(rds_alarm['Threshold'], 80.0, "Threshold should be 80%")
        self.assertEqual(rds_alarm['EvaluationPeriods'], 2, "Should evaluate 2 periods")

        # Check Redis CPU alarm
        redis_alarm = next(
            (a for a in alarms if 'redis' in a['AlarmName'].lower() and 'cpu' in a['AlarmName'].lower()),
            None
        )
        self.assertIsNotNone(redis_alarm, "Redis CPU alarm should exist")
        self.assertEqual(redis_alarm['MetricName'], 'CPUUtilization', "Should monitor CPU")
        self.assertEqual(redis_alarm['Namespace'], 'AWS/ElastiCache', "Should be in ElastiCache namespace")
        self.assertEqual(redis_alarm['Threshold'], 75.0, "Threshold should be 75%")
        self.assertEqual(redis_alarm['EvaluationPeriods'], 2, "Should evaluate 2 periods")

        # Check Kinesis records alarm
        kinesis_alarm = next(
            (a for a in alarms if 'kinesis' in a['AlarmName'].lower()),
            None
        )
        self.assertIsNotNone(kinesis_alarm, "Kinesis records alarm should exist")
        self.assertEqual(kinesis_alarm['MetricName'], 'IncomingRecords', "Should monitor incoming records")
        self.assertEqual(kinesis_alarm['Namespace'], 'AWS/Kinesis', "Should be in Kinesis namespace")
        self.assertEqual(kinesis_alarm['Threshold'], 1.0, "Threshold should be 1")
        self.assertEqual(kinesis_alarm['EvaluationPeriods'], 3, "Should evaluate 3 periods")
        self.assertEqual(
            kinesis_alarm['ComparisonOperator'], 'LessThanThreshold',
            "Should alert when less than threshold"
        )


if __name__ == "__main__":
    unittest.main()
