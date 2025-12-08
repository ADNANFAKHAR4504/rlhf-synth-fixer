"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with deployed stack outputs."""
        # Load deployment outputs
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_file}. "
                f"Please deploy the stack before running integration tests."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Set up AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.kinesis_client = boto3.client('kinesis', region_name=cls.region)
        cls.elasticache_client = boto3.client('elasticache', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)

    def test_vpc_exists_and_configured(self):
        """Test VPC exists and is properly configured."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])

    def test_kinesis_stream_exists_and_encrypted(self):
        """Test Kinesis Data Stream exists and is KMS encrypted."""
        stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(stream_name, "Kinesis stream name not found in outputs")

        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        self.assertEqual(stream['StreamStatus'], 'ACTIVE')
        self.assertEqual(stream['EncryptionType'], 'KMS')
        self.assertIsNotNone(stream.get('KeyId'))

    def test_rds_instance_exists_in_private_subnet(self):
        """Test RDS PostgreSQL instance exists and is not publicly accessible."""
        rds_endpoint = self.outputs.get('rds_endpoint')
        self.assertIsNotNone(rds_endpoint, "RDS endpoint not found in outputs")

        # Extract DB instance identifier from endpoint
        db_identifier = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        self.assertEqual(len(response['DBInstances']), 1)

        db_instance = response['DBInstances'][0]
        self.assertEqual(db_instance['DBInstanceStatus'], 'available')
        self.assertEqual(db_instance['Engine'], 'postgres')
        self.assertFalse(db_instance['PubliclyAccessible'])
        self.assertTrue(db_instance['StorageEncrypted'])

    def test_elasticache_redis_cluster_with_failover(self):
        """Test ElastiCache Redis cluster has automatic failover enabled."""
        redis_endpoint = self.outputs.get('redis_endpoint')
        self.assertIsNotNone(redis_endpoint, "Redis endpoint not found in outputs")

        # Get replication group ID from environment
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'synthk4l3u2z7')
        replication_group_id = f'fastshop-redis-{env_suffix}'

        response = self.elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        self.assertEqual(len(response['ReplicationGroups']), 1)

        replication_group = response['ReplicationGroups'][0]
        self.assertEqual(replication_group['Status'], 'available')
        self.assertTrue(replication_group['AutomaticFailover'] == 'enabled')
        self.assertTrue(replication_group['MultiAZ'] == 'enabled')
        self.assertTrue(replication_group['AtRestEncryptionEnabled'])
        self.assertTrue(replication_group['TransitEncryptionEnabled'])

    def test_kms_key_exists_and_enabled(self):
        """Test KMS key exists and is enabled for encryption."""
        kms_key_id = self.outputs.get('kms_key_id')
        self.assertIsNotNone(kms_key_id, "KMS key ID not found in outputs")

        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key_metadata = response['KeyMetadata']

        self.assertTrue(key_metadata['Enabled'])
        self.assertEqual(key_metadata['KeyState'], 'Enabled')
        self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')

    def test_all_required_outputs_present(self):
        """Test all required stack outputs are present."""
        required_outputs = [
            'vpc_id',
            'kinesis_stream_name',
            'kinesis_stream_arn',
            'rds_endpoint',
            'rds_arn',
            'redis_endpoint',
            'redis_port',
            'kms_key_id'
        ]

        for output_key in required_outputs:
            self.assertIn(
                output_key,
                self.outputs,
                f"Required output '{output_key}' not found in deployment outputs"
            )
            self.assertIsNotNone(
                self.outputs[output_key],
                f"Output '{output_key}' is None"
            )


if __name__ == '__main__':
    unittest.main()
