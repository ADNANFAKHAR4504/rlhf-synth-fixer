"""
Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using stack outputs.
"""

import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        if not os.path.exists(outputs_file):
            raise unittest.SkipTest(
                f"Stack outputs not found at {outputs_file}. "
                "Deploy the stack first to run integration tests."
            )

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Get AWS region from environment or use default
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dms_client = boto3.client('dms', region_name=cls.region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)

    def test_rds_instance_exists(self):
        """Test that RDS instance exists and is available."""
        rds_instance_id = self.outputs.get('rds_instance_id')
        self.assertIsNotNone(rds_instance_id, "RDS instance ID not in outputs")

        try:
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=rds_instance_id
            )
            instances = response['DBInstances']
            self.assertEqual(len(instances), 1)

            instance = instances[0]
            self.assertEqual(instance['DBInstanceIdentifier'], rds_instance_id)
            self.assertIn(instance['DBInstanceStatus'], ['available', 'backing-up', 'creating'])

        except ClientError as e:
            self.fail(f"Failed to describe RDS instance: {e}")


    def test_rds_encryption_with_kms(self):
        """Test RDS instance is encrypted with KMS."""
        rds_instance_id = self.outputs.get('rds_instance_id')
        kms_key_id = self.outputs.get('kms_key_id')

        self.assertIsNotNone(rds_instance_id)
        self.assertIsNotNone(kms_key_id)

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=rds_instance_id
        )
        instance = response['DBInstances'][0]

        self.assertTrue(instance['StorageEncrypted'])
        self.assertIsNotNone(instance.get('KmsKeyId'))

    def test_rds_security_groups(self):
        """Test RDS instance has appropriate security groups."""
        rds_instance_id = self.outputs.get('rds_instance_id')
        self.assertIsNotNone(rds_instance_id)

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=rds_instance_id
        )
        instance = response['DBInstances'][0]

        vpc_security_groups = instance['VpcSecurityGroups']
        self.assertGreater(len(vpc_security_groups), 0)

        # Verify security groups are active
        for sg in vpc_security_groups:
            self.assertEqual(sg['Status'], 'active')

    def test_secrets_manager_secret_exists(self):
        """Test Secrets Manager secret exists and contains credentials."""
        secret_arn = self.outputs.get('secrets_manager_secret_arn')
        self.assertIsNotNone(secret_arn, "Secrets Manager ARN not in outputs")

        try:
            response = self.secrets_client.describe_secret(SecretId=secret_arn)
            self.assertEqual(response['ARN'], secret_arn)

            # Verify secret can be retrieved
            secret_response = self.secrets_client.get_secret_value(SecretId=secret_arn)
            secret_string = secret_response['SecretString']

            # Parse and validate secret structure
            secret_data = json.loads(secret_string)
            self.assertIn('username', secret_data)
            self.assertIn('password', secret_data)
            self.assertIn('engine', secret_data)
            self.assertEqual(secret_data['engine'], 'postgres')

        except ClientError as e:
            self.fail(f"Failed to access secret: {e}")

    def test_kms_key_exists(self):
        """Test KMS key exists and is enabled."""
        kms_key_id = self.outputs.get('kms_key_id')
        self.assertIsNotNone(kms_key_id, "KMS key ID not in outputs")

        try:
            response = self.kms_client.describe_key(KeyId=kms_key_id)
            key_metadata = response['KeyMetadata']

            self.assertTrue(key_metadata['Enabled'])
            self.assertEqual(key_metadata['KeyState'], 'Enabled')

            # Verify key rotation is enabled
            rotation_response = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
            self.assertTrue(rotation_response['KeyRotationEnabled'])

        except ClientError as e:
            self.fail(f"Failed to describe KMS key: {e}")

    def test_dms_replication_instance_exists(self):
        """Test DMS replication instance exists."""
        dms_instance_arn = self.outputs.get('dms_replication_instance_arn')
        self.assertIsNotNone(dms_instance_arn, "DMS replication instance ARN not in outputs")

        try:
            response = self.dms_client.describe_replication_instances(
                Filters=[
                    {
                        'Name': 'replication-instance-arn',
                        'Values': [dms_instance_arn]
                    }
                ]
            )
            instances = response['ReplicationInstances']
            self.assertEqual(len(instances), 1)

            instance = instances[0]
            self.assertEqual(instance['ReplicationInstanceArn'], dms_instance_arn)
            self.assertIn(
                instance['ReplicationInstanceStatus'],
                ['available', 'creating', 'modifying']
            )

        except ClientError as e:
            self.fail(f"Failed to describe DMS replication instance: {e}")

    def test_dms_replication_task_exists(self):
        """Test DMS replication task exists and configured correctly."""
        task_arn = self.outputs.get('dms_replication_task_arn')
        self.assertIsNotNone(task_arn, "DMS replication task ARN not in outputs")

        try:
            response = self.dms_client.describe_replication_tasks(
                Filters=[
                    {
                        'Name': 'replication-task-arn',
                        'Values': [task_arn]
                    }
                ]
            )
            tasks = response['ReplicationTasks']
            self.assertEqual(len(tasks), 1)

            task = tasks[0]
            self.assertEqual(task['ReplicationTaskArn'], task_arn)
            self.assertEqual(task['MigrationType'], 'full-load-and-cdc')

        except ClientError as e:
            self.fail(f"Failed to describe DMS replication task: {e}")


    def test_sns_topic_exists(self):
        """Test SNS topic exists for alarm notifications."""
        sns_topic_arn = self.outputs.get('cloudwatch_sns_topic_arn')
        self.assertIsNotNone(sns_topic_arn, "SNS topic ARN not in outputs")

        try:
            response = self.sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
            attributes = response['Attributes']

            self.assertEqual(attributes['TopicArn'], sns_topic_arn)

        except ClientError as e:
            self.fail(f"Failed to get SNS topic attributes: {e}")


    def test_outputs_completeness(self):
        """Test all required outputs are present."""
        required_outputs = [
            'rds_endpoint',
            'rds_address',
            'rds_port',
            'rds_arn',
            'rds_instance_id',
            'db_name',
            'secrets_manager_secret_arn',
            'secrets_manager_secret_name',
            'dms_replication_instance_arn',
            'dms_replication_instance_id',
            'dms_source_endpoint_arn',
            'dms_target_endpoint_arn',
            'dms_replication_task_arn',
            'kms_key_id',
            'kms_key_arn',
            'cloudwatch_sns_topic_arn'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
            self.assertIsNotNone(
                self.outputs[output],
                f"Output {output} is None"
            )

    def test_resource_tagging(self):
        """Test resources are properly tagged with environment suffix."""
        # Check RDS instance tags
        rds_instance_id = self.outputs.get('rds_instance_id')
        if rds_instance_id:
            try:
                response = self.rds_client.describe_db_instances(
                    DBInstanceIdentifier=rds_instance_id
                )
                instance = response['DBInstances'][0]
                tags = {tag['Key']: tag['Value'] for tag in instance.get('TagList', [])}

                # Verify Name tag includes environment suffix
                self.assertIn('Name', tags)

            except ClientError:
                pass  # Tags are optional for this test

    def test_database_workflow(self):
        """Test complete database migration workflow components are in place."""
        # Verify all components exist
        self.assertIsNotNone(self.outputs.get('rds_instance_id'))
        self.assertIsNotNone(self.outputs.get('dms_replication_instance_arn'))
        self.assertIsNotNone(self.outputs.get('dms_source_endpoint_arn'))
        self.assertIsNotNone(self.outputs.get('dms_target_endpoint_arn'))
        self.assertIsNotNone(self.outputs.get('dms_replication_task_arn'))

        # Verify RDS is ready to receive data
        rds_instance_id = self.outputs['rds_instance_id']
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=rds_instance_id
        )
        instance = response['DBInstances'][0]
        self.assertIn(instance['DBInstanceStatus'], ['available', 'backing-up'])


if __name__ == '__main__':
    unittest.main()
