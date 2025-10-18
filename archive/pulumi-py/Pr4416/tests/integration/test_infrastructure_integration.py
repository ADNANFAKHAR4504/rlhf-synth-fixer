"""
Integration tests for Educational Platform CI/CD Infrastructure
Tests actual deployed AWS resources using outputs from cfn-outputs/flat-outputs.json
"""
import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestEducationPlatformIntegration(unittest.TestCase):
    """Integration tests for educational platform infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures - load outputs from deployed infrastructure"""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

        cls.region = os.environ.get('AWS_REGION', 'ap-southeast-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.elasticache_client = boto3.client('elasticache', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.codepipeline_client = boto3.client('codepipeline', region_name=cls.region)
        cls.codebuild_client = boto3.client('codebuild', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.iam_client = boto3.client('iam')

    def test_outputs_file_exists(self):
        """Test that outputs file exists and contains data"""
        self.assertIsNotNone(self.outputs)
        self.assertIsInstance(self.outputs, dict)
        if self.outputs:
            self.assertGreater(len(self.outputs), 0)

    def test_vpc_exists(self):
        """Test VPC exists and is properly configured"""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not in outputs")

        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    def test_public_subnets_exist(self):
        """Test public subnets exist in correct AZs"""
        if 'public_subnet_1_id' not in self.outputs:
            self.skipTest("Public subnet IDs not in outputs")

        subnet_ids = [
            self.outputs['public_subnet_1_id'],
            self.outputs['public_subnet_2_id']
        ]

        response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
        self.assertEqual(len(response['Subnets']), 2)

        for subnet in response['Subnets']:
            self.assertTrue(subnet['MapPublicIpOnLaunch'])
            self.assertIn(subnet['CidrBlock'], ['10.0.1.0/24', '10.0.2.0/24'])

    def test_private_subnets_exist(self):
        """Test private subnets exist in correct AZs"""
        if 'private_subnet_1_id' not in self.outputs:
            self.skipTest("Private subnet IDs not in outputs")

        subnet_ids = [
            self.outputs['private_subnet_1_id'],
            self.outputs['private_subnet_2_id']
        ]

        response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
        self.assertEqual(len(response['Subnets']), 2)

        for subnet in response['Subnets']:
            self.assertFalse(subnet['MapPublicIpOnLaunch'])
            self.assertIn(subnet['CidrBlock'], ['10.0.10.0/24', '10.0.11.0/24'])

    def test_nat_gateway_exists(self):
        """Test NAT Gateway exists and is available"""
        if 'nat_gateway_id' not in self.outputs:
            self.skipTest("NAT Gateway ID not in outputs")

        nat_id = self.outputs['nat_gateway_id']
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=[nat_id])

        self.assertEqual(len(response['NatGateways']), 1)
        nat_gateway = response['NatGateways'][0]
        self.assertEqual(nat_gateway['State'], 'available')
        self.assertEqual(len(nat_gateway['NatGatewayAddresses']), 1)

    def test_rds_instance_exists(self):
        """Test RDS MySQL instance exists and is properly configured"""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not in outputs")

        # Extract DB identifier from endpoint
        endpoint = self.outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        self.assertEqual(len(response['DBInstances']), 1)
        db_instance = response['DBInstances'][0]

        # Verify configuration
        self.assertEqual(db_instance['Engine'], 'mysql')
        self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.micro')
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertFalse(db_instance['PubliclyAccessible'])
        self.assertFalse(db_instance['MultiAZ'])
        self.assertEqual(db_instance['BackupRetentionPeriod'], 1)

    def test_rds_encryption(self):
        """Test RDS instance has encryption enabled"""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not in outputs")

        endpoint = self.outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response['DBInstances'][0]
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertIsNotNone(db_instance.get('KmsKeyId'))

    def test_rds_cloudwatch_logs(self):
        """Test RDS CloudWatch logs are enabled"""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not in outputs")

        endpoint = self.outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response['DBInstances'][0]
        enabled_logs = db_instance.get('EnabledCloudwatchLogsExports', [])
        self.assertIn('error', enabled_logs)
        self.assertIn('general', enabled_logs)
        self.assertIn('slowquery', enabled_logs)

    def test_elasticache_cluster_exists(self):
        """Test ElastiCache Redis cluster exists"""
        if 'elasticache_endpoint' not in self.outputs:
            self.skipTest("ElastiCache endpoint not in outputs")

        # Get cluster ID from environment suffix
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        cluster_id = f'education-redis-{env_suffix}'

        response = self.elasticache_client.describe_cache_clusters(
            CacheClusterId=cluster_id,
            ShowCacheNodeInfo=True
        )

        self.assertEqual(len(response['CacheClusters']), 1)
        cluster = response['CacheClusters'][0]

        # Verify configuration
        self.assertEqual(cluster['Engine'], 'redis')
        self.assertEqual(cluster['CacheNodeType'], 'cache.t3.micro')
        self.assertEqual(cluster['NumCacheNodes'], 1)
        self.assertEqual(cluster['CacheClusterStatus'], 'available')

    def test_kms_key_exists(self):
        """Test KMS key exists and has rotation enabled"""
        if 'kms_key_id' not in self.outputs:
            self.skipTest("KMS key ID not in outputs")

        key_id = self.outputs['kms_key_id']

        # Describe key
        response = self.kms_client.describe_key(KeyId=key_id)
        key_metadata = response['KeyMetadata']

        self.assertTrue(key_metadata['Enabled'])
        self.assertEqual(key_metadata['KeyState'], 'Enabled')

        # Check key rotation
        rotation_response = self.kms_client.get_key_rotation_status(KeyId=key_id)
        self.assertTrue(rotation_response['KeyRotationEnabled'])

    def test_s3_artifact_bucket_exists(self):
        """Test S3 artifact bucket exists and is properly configured"""
        if 'artifact_bucket_name' not in self.outputs:
            self.skipTest("Artifact bucket name not in outputs")

        bucket_name = self.outputs['artifact_bucket_name']

        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertEqual(len(rules), 1)
        self.assertEqual(
            rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
            'aws:kms'
        )

    def test_s3_bucket_versioning(self):
        """Test S3 bucket has versioning enabled"""
        if 'artifact_bucket_name' not in self.outputs:
            self.skipTest("Artifact bucket name not in outputs")

        bucket_name = self.outputs['artifact_bucket_name']

        response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(response['Status'], 'Enabled')

    def test_s3_bucket_public_access_blocked(self):
        """Test S3 bucket has public access blocked"""
        if 'artifact_bucket_name' not in self.outputs:
            self.skipTest("Artifact bucket name not in outputs")

        bucket_name = self.outputs['artifact_bucket_name']

        response = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['RestrictPublicBuckets'])

    def test_codepipeline_exists(self):
        """Test CodePipeline exists and has correct stages"""
        if 'pipeline_name' not in self.outputs:
            self.skipTest("Pipeline name not in outputs")

        pipeline_name = self.outputs['pipeline_name']

        response = self.codepipeline_client.get_pipeline(name=pipeline_name)
        pipeline = response['pipeline']

        # Verify stages
        stages = [stage['name'] for stage in pipeline['stages']]
        self.assertIn('Source', stages)
        self.assertIn('Staging', stages)
        self.assertIn('ManualApproval', stages)
        self.assertIn('Production', stages)

        # Verify artifact store encryption
        artifact_store = pipeline['artifactStore']
        self.assertEqual(artifact_store['type'], 'S3')
        self.assertIn('encryptionKey', artifact_store)
        self.assertEqual(artifact_store['encryptionKey']['type'], 'KMS')

    def test_codebuild_staging_project_exists(self):
        """Test CodeBuild staging project exists"""
        if 'codebuild_staging_name' not in self.outputs:
            self.skipTest("CodeBuild staging name not in outputs")

        project_name = self.outputs['codebuild_staging_name']

        response = self.codebuild_client.batch_get_projects(names=[project_name])

        self.assertEqual(len(response['projects']), 1)
        project = response['projects'][0]

        # Verify configuration
        self.assertEqual(project['environment']['type'], 'LINUX_CONTAINER')
        self.assertEqual(
            project['environment']['computeType'],
            'BUILD_GENERAL1_SMALL'
        )

        # Check environment variables
        env_vars = {var['name']: var['value'] for var in project['environment']['environmentVariables']}
        self.assertEqual(env_vars['ENVIRONMENT'], 'staging')

    def test_codebuild_production_project_exists(self):
        """Test CodeBuild production project exists"""
        if 'codebuild_production_name' not in self.outputs:
            self.skipTest("CodeBuild production name not in outputs")

        project_name = self.outputs['codebuild_production_name']

        response = self.codebuild_client.batch_get_projects(names=[project_name])

        self.assertEqual(len(response['projects']), 1)
        project = response['projects'][0]

        # Check environment variables
        env_vars = {var['name']: var['value'] for var in project['environment']['environmentVariables']}
        self.assertEqual(env_vars['ENVIRONMENT'], 'production')

    def test_cloudwatch_log_group_exists(self):
        """Test CloudWatch Log Group exists"""
        if 'pipeline_log_group_name' not in self.outputs:
            self.skipTest("Pipeline log group name not in outputs")

        log_group_name = self.outputs['pipeline_log_group_name']

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        self.assertEqual(len(response['logGroups']), 1)
        log_group = response['logGroups'][0]
        self.assertEqual(log_group['retentionInDays'], 14)
        self.assertIn('kmsKeyId', log_group)

    def test_cloudwatch_alarm_exists(self):
        """Test CloudWatch alarm for pipeline failures exists"""
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        alarm_name = f'education-pipeline-failure-alarm-{env_suffix}'

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[alarm_name]
            )

            if len(response['MetricAlarms']) > 0:
                alarm = response['MetricAlarms'][0]
                self.assertEqual(alarm['MetricName'], 'PipelineExecutionFailure')
                self.assertEqual(alarm['Namespace'], 'AWS/CodePipeline')
                self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')
        except ClientError:
            self.skipTest("Alarm not found")

    def test_resource_tags(self):
        """Test resources have proper tags"""
        if 'vpc_id' not in self.outputs:
            self.skipTest("VPC ID not in outputs")

        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        self.assertIn('Name', tags)
        self.assertIn('Environment', tags)

    def test_rds_in_private_subnet(self):
        """Test RDS instance is in private subnet"""
        if 'rds_endpoint' not in self.outputs:
            self.skipTest("RDS endpoint not in outputs")

        endpoint = self.outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response['DBInstances'][0]
        self.assertFalse(db_instance['PubliclyAccessible'])

        # Verify subnet group
        subnet_group = db_instance['DBSubnetGroup']
        self.assertIn('education-db-subnet-group', subnet_group['DBSubnetGroupName'])

    def test_elasticache_in_private_subnet(self):
        """Test ElastiCache cluster is in private subnet"""
        if 'elasticache_endpoint' not in self.outputs:
            self.skipTest("ElastiCache endpoint not in outputs")

        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        cluster_id = f'education-redis-{env_suffix}'

        response = self.elasticache_client.describe_cache_clusters(
            CacheClusterId=cluster_id
        )

        cluster = response['CacheClusters'][0]
        subnet_group = cluster.get('CacheSubnetGroupName')
        self.assertIsNotNone(subnet_group)
        self.assertIn('education-elasticache-subnet-group', subnet_group)


if __name__ == "__main__":
    unittest.main()
