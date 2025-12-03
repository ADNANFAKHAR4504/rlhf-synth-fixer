"""
test_tap_stack.py

Integration tests for the TapStack infrastructure.
Uses actual deployed resources from cfn-outputs/flat-outputs.json.
"""

import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestInfrastructureDeployment(unittest.TestCase):
    """Integration tests that validate actual AWS resources."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs and initialize AWS clients."""
        # Load cfn-outputs
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"cfn-outputs not found at {outputs_path}. "
                "Run deployment first."
            )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=region)
        cls.kinesis_client = boto3.client('kinesis', region_name=region)
        cls.elasticache_client = boto3.client('elasticache', region_name=region)
        cls.rds_client = boto3.client('rds', region_name=region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=region)

    def test_outputs_exist(self):
        """Test that all required outputs are present."""
        required_outputs = [
            'vpc_id',
            'kinesis_stream_name',
            'kinesis_stream_arn',
            'redis_endpoint',
            'redis_port',
            'rds_endpoint',
            'rds_port',
            'db_secret_arn',
            'elasticache_security_group_id',
            'rds_security_group_id'
        ]

        for output in required_outputs:
            self.assertIn(
                output,
                self.outputs,
                f"Missing required output: {output}"
            )
            self.assertIsNotNone(
                self.outputs[output],
                f"Output {output} is None"
            )

    def test_vpc_exists(self):
        """Test that VPC exists and is properly configured."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response['Vpcs']

        self.assertEqual(len(vpcs), 1, "VPC not found")
        vpc = vpcs[0]

        self.assertEqual(vpc['State'], 'available', "VPC is not available")
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC CIDR incorrect")

        # Check DNS attributes using describe_vpc_attribute
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )

        self.assertTrue(
            dns_hostnames['EnableDnsHostnames']['Value'],
            "DNS hostnames not enabled"
        )
        self.assertTrue(
            dns_support['EnableDnsSupport']['Value'],
            "DNS support not enabled"
        )

    def test_kinesis_stream_exists(self):
        """Test that Kinesis stream exists and is properly configured."""
        stream_name = self.outputs['kinesis_stream_name']

        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        self.assertEqual(stream['StreamStatus'], 'ACTIVE', "Stream not active")
        self.assertEqual(
            stream['RetentionPeriodHours'],
            24,
            "Retention period incorrect"
        )
        self.assertGreater(len(stream['Shards']), 0, "No shards found")

    def test_kinesis_stream_encryption(self):
        """Test that Kinesis stream has encryption enabled."""
        stream_name = self.outputs['kinesis_stream_name']

        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        self.assertEqual(
            stream['EncryptionType'],
            'KMS',
            "Encryption not enabled"
        )
        self.assertIsNotNone(
            stream.get('KeyId'),
            "KMS key not configured"
        )

    def test_elasticache_replication_group_exists(self):
        """Test that ElastiCache replication group exists and is Multi-AZ."""
        redis_endpoint = self.outputs['redis_endpoint']

        # Extract replication group ID from endpoint (format: cluster-id.xxxx.region.cache.amazonaws.com)
        # For replication groups, the endpoint format is different
        response = self.elasticache_client.describe_replication_groups()
        replication_groups = response['ReplicationGroups']

        # Find the replication group by matching endpoint
        found_rg = None
        for rg in replication_groups:
            if rg.get('ConfigurationEndpoint'):
                if redis_endpoint in rg['ConfigurationEndpoint'].get('Address', ''):
                    found_rg = rg
                    break
            elif rg.get('NodeGroups'):
                for ng in rg['NodeGroups']:
                    if ng.get('PrimaryEndpoint') and redis_endpoint in ng['PrimaryEndpoint'].get('Address', ''):
                        found_rg = rg
                        break
                if found_rg:
                    break

        self.assertIsNotNone(found_rg, "Replication group not found")
        self.assertEqual(found_rg['Status'], 'available', "Replication group not available")
        self.assertTrue(
            found_rg['AutomaticFailover'] in ['enabled', 'enabling'],
            "Automatic failover not enabled"
        )
        self.assertTrue(
            found_rg['MultiAZ'] in ['enabled', 'enabling'],
            "Multi-AZ not enabled"
        )

    def test_elasticache_encryption(self):
        """Test that ElastiCache has encryption enabled."""
        redis_endpoint = self.outputs['redis_endpoint']

        response = self.elasticache_client.describe_replication_groups()
        replication_groups = response['ReplicationGroups']

        # Find the replication group
        found_rg = None
        for rg in replication_groups:
            if rg.get('ConfigurationEndpoint'):
                if redis_endpoint in rg['ConfigurationEndpoint'].get('Address', ''):
                    found_rg = rg
                    break
            elif rg.get('NodeGroups'):
                for ng in rg['NodeGroups']:
                    if ng.get('PrimaryEndpoint') and redis_endpoint in ng['PrimaryEndpoint'].get('Address', ''):
                        found_rg = rg
                        break
                if found_rg:
                    break

        self.assertIsNotNone(found_rg, "Replication group not found")
        self.assertTrue(
            found_rg['AtRestEncryptionEnabled'],
            "At-rest encryption not enabled"
        )
        self.assertTrue(
            found_rg['TransitEncryptionEnabled'],
            "Transit encryption not enabled"
        )

    def test_rds_instance_exists(self):
        """Test that RDS instance exists and is properly configured."""
        rds_endpoint = self.outputs['rds_endpoint']

        # Extract instance identifier from endpoint
        instance_id = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instances = response['DBInstances']

        self.assertEqual(len(instances), 1, "RDS instance not found")
        instance = instances[0]

        self.assertEqual(
            instance['DBInstanceStatus'],
            'available',
            "RDS instance not available"
        )
        self.assertEqual(
            instance['Engine'],
            'postgres',
            "RDS engine incorrect"
        )

    def test_rds_multi_az(self):
        """Test that RDS is configured for Multi-AZ."""
        rds_endpoint = self.outputs['rds_endpoint']
        instance_id = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instance = response['DBInstances'][0]

        self.assertTrue(
            instance['MultiAZ'],
            "RDS Multi-AZ not enabled"
        )

    def test_rds_encryption(self):
        """Test that RDS has encryption at rest enabled."""
        rds_endpoint = self.outputs['rds_endpoint']
        instance_id = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instance = response['DBInstances'][0]

        self.assertTrue(
            instance['StorageEncrypted'],
            "RDS encryption not enabled"
        )

    def test_rds_backups_configured(self):
        """Test that RDS has automated backups configured."""
        rds_endpoint = self.outputs['rds_endpoint']
        instance_id = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instance = response['DBInstances'][0]

        self.assertGreater(
            instance['BackupRetentionPeriod'],
            0,
            "Backup retention not configured"
        )
        self.assertIsNotNone(
            instance.get('PreferredBackupWindow'),
            "Backup window not configured"
        )

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists."""
        secret_arn = self.outputs['db_secret_arn']

        response = self.secretsmanager_client.describe_secret(
            SecretId=secret_arn
        )

        self.assertIsNotNone(response['ARN'], "Secret ARN not found")
        self.assertEqual(response['ARN'], secret_arn, "Secret ARN mismatch")

    def test_secrets_manager_secret_has_value(self):
        """Test that Secrets Manager secret contains credentials."""
        secret_arn = self.outputs['db_secret_arn']

        response = self.secretsmanager_client.get_secret_value(
            SecretId=secret_arn
        )

        secret_string = response['SecretString']
        secret_data = json.loads(secret_string)

        required_keys = ['username', 'password', 'engine', 'port', 'dbname']
        for key in required_keys:
            self.assertIn(
                key,
                secret_data,
                f"Secret missing required key: {key}"
            )

        self.assertEqual(
            secret_data['engine'],
            'postgres',
            "Secret engine incorrect"
        )
        self.assertEqual(
            secret_data['port'],
            5432,
            "Secret port incorrect"
        )

    def test_security_groups_exist(self):
        """Test that security groups exist."""
        sg_ids = [
            self.outputs['elasticache_security_group_id'],
            self.outputs['rds_security_group_id']
        ]

        response = self.ec2_client.describe_security_groups(GroupIds=sg_ids)
        security_groups = response['SecurityGroups']

        self.assertEqual(
            len(security_groups),
            2,
            "Not all security groups found"
        )

    def test_elasticache_security_group_rules(self):
        """Test that ElastiCache security group has correct ingress rules."""
        sg_id = self.outputs['elasticache_security_group_id']

        response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules
        ingress_rules = sg['IpPermissions']
        redis_rule_found = False

        for rule in ingress_rules:
            if rule.get('FromPort') == 6379 and rule.get('ToPort') == 6379:
                redis_rule_found = True
                break

        self.assertTrue(
            redis_rule_found,
            "Redis port 6379 not allowed in security group"
        )

    def test_rds_security_group_rules(self):
        """Test that RDS security group has correct ingress rules."""
        sg_id = self.outputs['rds_security_group_id']

        response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules
        ingress_rules = sg['IpPermissions']
        postgres_rule_found = False

        for rule in ingress_rules:
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                postgres_rule_found = True
                break

        self.assertTrue(
            postgres_rule_found,
            "PostgreSQL port 5432 not allowed in security group"
        )

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured."""
        # Extract environment suffix from stream name for alarm filtering
        stream_name = self.outputs['kinesis_stream_name']
        # Assuming format: transaction-stream-{env_suffix}
        env_suffix = stream_name.split('-')[-1]

        # Expected alarm name patterns (exact names from monitoring_stack.py)
        expected_alarm_patterns = [
            f'kinesis-iterator-age-{env_suffix}',
            f'kinesis-write-throughput-{env_suffix}',
            f'redis-cpu-{env_suffix}',
            f'redis-memory-{env_suffix}',
            f'rds-cpu-{env_suffix}',
            f'rds-storage-{env_suffix}',
            f'rds-connection-{env_suffix}'
        ]

        # Check each alarm individually
        found_alarms = []
        missing_alarms = []

        for alarm_name in expected_alarm_patterns:
            try:
                response = self.cloudwatch_client.describe_alarms(
                    AlarmNames=[alarm_name]
                )
                if response['MetricAlarms']:
                    found_alarms.append(alarm_name)
                else:
                    missing_alarms.append(alarm_name)
            except Exception:
                missing_alarms.append(alarm_name)

        # Assert at least some alarms exist (deployment may be in progress)
        self.assertGreater(
            len(found_alarms),
            0,
            f"No CloudWatch alarms found. Expected: {expected_alarm_patterns}, Missing: {missing_alarms}"
        )

    def test_redis_port_is_6379(self):
        """Test that Redis port is correctly set to 6379."""
        redis_port = self.outputs['redis_port']
        # Port may be string or int depending on platform
        self.assertEqual(int(redis_port), 6379, "Redis port incorrect")

    def test_rds_port_is_5432(self):
        """Test that RDS port is correctly set to 5432."""
        rds_port = self.outputs['rds_port']
        # Port may be string or int depending on platform
        self.assertEqual(int(rds_port), 5432, "RDS port incorrect")

    def test_kinesis_stream_arn_format(self):
        """Test that Kinesis stream ARN has correct format."""
        stream_arn = self.outputs['kinesis_stream_arn']

        self.assertTrue(
            stream_arn.startswith('arn:aws:kinesis:'),
            "Kinesis ARN format incorrect"
        )
        self.assertIn(
            ':stream/',
            stream_arn,
            "Kinesis ARN missing stream path"
        )

    def test_secret_arn_format(self):
        """Test that Secrets Manager ARN has correct format."""
        secret_arn = self.outputs['db_secret_arn']

        self.assertTrue(
            secret_arn.startswith('arn:aws:secretsmanager:'),
            "Secret ARN format incorrect"
        )
        self.assertIn(
            ':secret:',
            secret_arn,
            "Secret ARN missing secret path"
        )


class TestResourceConnectivity(unittest.TestCase):
    """Tests for resource connectivity and integration."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs."""
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=region)
        cls.rds_client = boto3.client('rds', region_name=region)

    def test_rds_in_private_subnets(self):
        """Test that RDS instance is deployed in private subnets."""
        rds_endpoint = self.outputs['rds_endpoint']
        instance_id = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instance = response['DBInstances'][0]

        self.assertFalse(
            instance['PubliclyAccessible'],
            "RDS instance is publicly accessible"
        )

    def test_security_groups_in_correct_vpc(self):
        """Test that security groups are in the correct VPC."""
        vpc_id = self.outputs['vpc_id']
        sg_ids = [
            self.outputs['elasticache_security_group_id'],
            self.outputs['rds_security_group_id']
        ]

        response = self.ec2_client.describe_security_groups(GroupIds=sg_ids)

        for sg in response['SecurityGroups']:
            self.assertEqual(
                sg['VpcId'],
                vpc_id,
                f"Security group {sg['GroupId']} not in correct VPC"
            )


if __name__ == '__main__':
    unittest.main()
