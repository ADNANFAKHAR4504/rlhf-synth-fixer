"""
test_tap_stack_integration.py

Integration tests for live deployed BrazilCart CI/CD Pipeline infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import boto3
import json
from pulumi import automation as auto


class TestBrazilCartInfrastructureIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        cls.stack_name = os.getenv('PULUMI_STACK', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.elasticache_client = boto3.client('elasticache', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.codecommit_client = boto3.client('codecommit', region_name=cls.region)
        cls.codebuild_client = boto3.client('codebuild', region_name=cls.region)
        cls.codepipeline_client = boto3.client('codepipeline', region_name=cls.region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)

        # Get stack outputs
        try:
            stack = auto.select_stack(
                stack_name=cls.stack_name,
                work_dir=os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            )
            cls.outputs = stack.outputs()
        except Exception as e:
            print(f"Warning: Could not load stack outputs: {e}")
            cls.outputs = {}

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists with correct CIDR block."""
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Project', 'Values': ['BrazilCart']},
                {'Name': 'tag:Environment', 'Values': [self.stack_name]}
            ]
        )
        self.assertGreater(len(vpcs['Vpcs']), 0, "VPC not found")
        vpc = vpcs['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])

    def test_subnets_exist_multi_az(self):
        """Test that subnets exist across multiple AZs."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not in outputs")

        vpc_id = self.outputs['vpc_id'].value
        subnets = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        self.assertGreaterEqual(len(subnets['Subnets']), 6, "Should have at least 6 subnets")

        # Check for multiple AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets['Subnets'])
        self.assertGreaterEqual(len(azs), 3, "Subnets should span at least 3 AZs")

    def test_rds_instance_exists_and_encrypted(self):
        """Test that RDS instance exists with encryption and Multi-AZ."""
        db_instances = self.rds_client.describe_db_instances()

        brazilcart_dbs = [
            db for db in db_instances['DBInstances']
            if f'brazilcart-db-{self.stack_name}' in db['DBInstanceIdentifier']
        ]

        self.assertGreater(len(brazilcart_dbs), 0, "RDS instance not found")
        db = brazilcart_dbs[0]

        self.assertTrue(db['StorageEncrypted'], "RDS storage should be encrypted")
        self.assertTrue(db['MultiAZ'], "RDS should be Multi-AZ")
        self.assertEqual(db['Engine'], 'postgres')
        self.assertEqual(db['DBName'], 'brazilcart_production')

    def test_rds_secret_exists_in_secrets_manager(self):
        """Test that RDS password is stored in Secrets Manager."""
        secrets = self.secretsmanager_client.list_secrets()

        rds_secrets = [
            s for s in secrets['SecretList']
            if f'brazilcart-db-password-{self.stack_name}' in s['Name']
        ]

        self.assertGreater(len(rds_secrets), 0, "RDS secret not found")
        secret = rds_secrets[0]
        self.assertIn('KmsKeyId', secret, "Secret should be KMS encrypted")

    def test_elasticache_cluster_exists_with_encryption(self):
        """Test that ElastiCache cluster exists with encryption."""
        replication_groups = self.elasticache_client.describe_replication_groups()

        redis_clusters = [
            rg for rg in replication_groups['ReplicationGroups']
            if f'brazilcart-redis-{self.stack_name}' in rg['ReplicationGroupId']
        ]

        self.assertGreater(len(redis_clusters), 0, "ElastiCache cluster not found")
        cluster = redis_clusters[0]

        self.assertTrue(cluster['AtRestEncryptionEnabled'], "Should have encryption at rest")
        self.assertTrue(cluster['TransitEncryptionEnabled'], "Should have encryption in transit")
        self.assertTrue(cluster['MultiAZ'] == 'enabled', "Should be Multi-AZ")
        self.assertTrue(cluster['AuthTokenEnabled'], "Should have auth token enabled")

    def test_s3_bucket_exists_with_encryption(self):
        """Test that S3 artifacts bucket exists with encryption."""
        if 'artifact_bucket' not in self.outputs:
            self.skipTest("Artifact bucket not in outputs")

        bucket_name = self.outputs['artifact_bucket'].value

        # Check bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except Exception as e:
            self.fail(f"Bucket {bucket_name} does not exist: {e}")

        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0, "Should have encryption rules")
        self.assertEqual(
            rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
            'aws:kms'
        )

        # Check versioning
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning['Status'], 'Enabled')

    def test_codecommit_repository_exists(self):
        """Test that CodeCommit repository exists."""
        repos = self.codecommit_client.list_repositories()

        brazilcart_repos = [
            r for r in repos['repositories']
            if f'brazilcart-app-{self.stack_name}' in r['repositoryName']
        ]

        self.assertGreater(len(brazilcart_repos), 0, "CodeCommit repository not found")

    def test_codebuild_project_exists(self):
        """Test that CodeBuild project exists."""
        projects = self.codebuild_client.list_projects()

        brazilcart_projects = [
            p for p in projects['projects']
            if f'brazilcart-build-{self.stack_name}' in p
        ]

        self.assertGreater(len(brazilcart_projects), 0, "CodeBuild project not found")

        # Get project details
        project_detail = self.codebuild_client.batch_get_projects(
            names=brazilcart_projects
        )

        if len(project_detail['projects']) > 0:
            project = project_detail['projects'][0]
            self.assertEqual(project['environment']['type'], 'LINUX_CONTAINER')
            self.assertTrue(project['environment']['privilegedMode'])

    def test_codepipeline_exists(self):
        """Test that CodePipeline exists with correct stages."""
        if 'codepipeline_name' not in self.outputs:
            self.skipTest("CodePipeline name not in outputs")

        pipeline_name = self.outputs['codepipeline_name'].value

        pipeline = self.codepipeline_client.get_pipeline(name=pipeline_name)

        stages = pipeline['pipeline']['stages']
        stage_names = [s['name'] for s in stages]

        self.assertIn('Source', stage_names, "Should have Source stage")
        self.assertIn('Build', stage_names, "Should have Build stage")
        self.assertIn('Deploy', stage_names, "Should have Deploy stage")

        # Check artifact store encryption
        artifact_store = pipeline['pipeline']['artifactStore']
        self.assertIn('encryptionKey', artifact_store)
        self.assertEqual(artifact_store['encryptionKey']['type'], 'KMS')

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms exist for monitoring."""
        alarms = self.cloudwatch_client.describe_alarms()

        brazilcart_alarms = [
            a for a in alarms['MetricAlarms']
            if 'brazilcart' in a['AlarmName'].lower() and self.stack_name in a['AlarmName']
        ]

        self.assertGreaterEqual(len(brazilcart_alarms), 2, "Should have at least 2 alarms")

        alarm_names = [a['AlarmName'] for a in brazilcart_alarms]
        has_rds_alarm = any('rds' in name.lower() for name in alarm_names)
        has_redis_alarm = any('redis' in name.lower() for name in alarm_names)

        self.assertTrue(has_rds_alarm, "Should have RDS alarm")
        self.assertTrue(has_redis_alarm, "Should have Redis alarm")

    def test_kms_key_exists_with_rotation(self):
        """Test that KMS key exists with rotation enabled."""
        keys = self.kms_client.list_keys()

        for key in keys['Keys']:
            try:
                aliases = self.kms_client.list_aliases(KeyId=key['KeyId'])
                for alias in aliases['Aliases']:
                    if f'brazilcart-{self.stack_name}' in alias.get('AliasName', ''):
                        # Check rotation status
                        rotation_status = self.kms_client.get_key_rotation_status(
                            KeyId=key['KeyId']
                        )
                        self.assertTrue(
                            rotation_status['KeyRotationEnabled'],
                            "KMS key should have rotation enabled"
                        )
                        return
            except Exception:
                continue

        # If we get here, we didn't find the key
        self.skipTest("KMS key not found or not accessible")

    def test_security_groups_configured_correctly(self):
        """Test that security groups exist with correct rules."""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not in outputs")

        vpc_id = self.outputs['vpc_id'].value
        security_groups = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Project', 'Values': ['BrazilCart']}
            ]
        )

        self.assertGreaterEqual(
            len(security_groups['SecurityGroups']), 2,
            "Should have at least 2 security groups (RDS and ElastiCache)"
        )

        # Check for RDS security group (port 5432)
        rds_sgs = [
            sg for sg in security_groups['SecurityGroups']
            if any(rule.get('FromPort') == 5432 for rule in sg.get('IpPermissions', []))
        ]
        self.assertGreater(len(rds_sgs), 0, "RDS security group not found")

        # Check for ElastiCache security group (port 6379)
        redis_sgs = [
            sg for sg in security_groups['SecurityGroups']
            if any(rule.get('FromPort') == 6379 for rule in sg.get('IpPermissions', []))
        ]
        self.assertGreater(len(redis_sgs), 0, "ElastiCache security group not found")

    def test_stack_outputs_are_valid(self):
        """Test that stack outputs contain expected values."""
        expected_outputs = [
            'vpc_id',
            'rds_endpoint',
            'rds_secret_arn',
            'redis_endpoint',
            'redis_secret_arn',
            'codecommit_clone_url_http',
            'codepipeline_name',
            'artifact_bucket'
        ]

        for output_key in expected_outputs:
            self.assertIn(
                output_key, self.outputs,
                f"Output '{output_key}' should be present"
            )
            output_value = self.outputs[output_key].value
            self.assertIsNotNone(output_value, f"Output '{output_key}' should not be None")
            self.assertNotEqual(output_value, '', f"Output '{output_key}' should not be empty")


if __name__ == '__main__':
    unittest.main()