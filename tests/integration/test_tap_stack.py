import json
import os
import unittest

import boto3
from pytest import mark

# Load deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration tests"""
        cls.region = flat_outputs.get('Region', 'us-east-1')
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.backup_client = boto3.client('backup', region_name=cls.region)

    @mark.it("validates Aurora cluster exists and is configured correctly")
    def test_aurora_cluster_exists(self):
        # ARRANGE
        cluster_id = flat_outputs.get('AuroraClusterIdentifier')
        self.assertIsNotNone(cluster_id, "Aurora cluster ID should be in outputs")

        # ACT
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        # ASSERT
        self.assertEqual(len(response['DBClusters']), 1)
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertEqual(cluster['EngineVersion'], '15.8')
        self.assertTrue(cluster['StorageEncrypted'])
        self.assertEqual(cluster['BackupRetentionPeriod'], 7)
        self.assertFalse(cluster['DeletionProtection'])
        # Verify Multi-AZ: writer + 1 reader = 2 instances
        self.assertEqual(len(cluster['DBClusterMembers']), 2)

    @mark.it("validates DynamoDB table exists with PITR enabled")
    def test_dynamodb_table_exists(self):
        # ARRANGE
        table_name = flat_outputs.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name should be in outputs")

        # ACT
        response = self.dynamodb_client.describe_table(TableName=table_name)
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=table_name
        )

        # ASSERT
        table = response['Table']
        self.assertEqual(table['TableName'], table_name)
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertEqual(table['TableStatus'], 'ACTIVE')

        # Verify PITR enabled
        pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
        self.assertEqual(pitr_status['PointInTimeRecoveryStatus'], 'ENABLED')

    @mark.it("validates S3 bucket exists with versioning and encryption")
    def test_s3_bucket_exists(self):
        # ARRANGE
        bucket_name = flat_outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3 bucket name should be in outputs")

        # ACT
        versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        public_access_response = self.s3_client.get_public_access_block(Bucket=bucket_name)

        # ASSERT
        self.assertEqual(versioning_response['Status'], 'Enabled')

        # Verify KMS encryption
        encryption_rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
        self.assertEqual(len(encryption_rules), 1)
        self.assertEqual(
            encryption_rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
            'aws:kms'
        )

        # Verify public access blocked
        public_access = public_access_response['PublicAccessBlockConfiguration']
        self.assertTrue(public_access['BlockPublicAcls'])
        self.assertTrue(public_access['BlockPublicPolicy'])
        self.assertTrue(public_access['IgnorePublicAcls'])
        self.assertTrue(public_access['RestrictPublicBuckets'])

    @mark.it("validates Lambda function exists and is configured correctly")
    def test_lambda_function_exists(self):
        # ARRANGE
        function_name = flat_outputs.get('LambdaFunctionName')
        self.assertIsNotNone(function_name, "Lambda function name should be in outputs")

        # ACT
        response = self.lambda_client.get_function(FunctionName=function_name)

        # ASSERT
        config = response['Configuration']
        self.assertEqual(config['FunctionName'], function_name)
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['Timeout'], 60)
        self.assertEqual(config['State'], 'Active')

        # Verify VPC configuration exists
        self.assertIn('VpcConfig', config)
        self.assertIsNotNone(config['VpcConfig'].get('VpcId'))
        self.assertGreater(len(config['VpcConfig']['SubnetIds']), 0)
        self.assertGreater(len(config['VpcConfig']['SecurityGroupIds']), 0)

        # Verify environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        self.assertIn('DB_SECRET_ARN', env_vars)
        self.assertIn('DB_CLUSTER_ARN', env_vars)
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertIn('S3_BUCKET', env_vars)

    @mark.it("validates SNS topic exists")
    def test_sns_topic_exists(self):
        # ARRANGE
        topic_arn = flat_outputs.get('SNSTopicArn')
        self.assertIsNotNone(topic_arn, "SNS topic ARN should be in outputs")

        # ACT
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)

        # ASSERT
        attributes = response['Attributes']
        self.assertEqual(attributes['TopicArn'], topic_arn)
        self.assertEqual(attributes['DisplayName'], 'DR Notifications')

    @mark.it("validates VPC exists with Multi-AZ subnets")
    def test_vpc_exists(self):
        # ARRANGE
        vpc_id = flat_outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")

        # ACT
        vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        subnet_response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        endpoint_response = self.ec2_client.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # ASSERT
        self.assertEqual(len(vpc_response['Vpcs']), 1)

        # Verify Multi-AZ subnets (3 AZs with 3 private + 3 public = 6 subnets)
        subnets = subnet_response['Subnets']
        self.assertGreaterEqual(len(subnets), 4, "Should have at least 4 subnets for Multi-AZ")

        # Verify at least 2 availability zones (Multi-AZ means 2+ AZs)
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2, "Should have at least 2 availability zones")

        # Verify VPC endpoints for S3 and DynamoDB
        endpoints = endpoint_response['VpcEndpoints']
        self.assertEqual(len(endpoints), 2)
        endpoint_services = [ep['ServiceName'] for ep in endpoints]
        self.assertTrue(any('s3' in service for service in endpoint_services))
        self.assertTrue(any('dynamodb' in service for service in endpoint_services))

    @mark.it("validates CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        # ARRANGE
        dashboard_name = flat_outputs.get('CloudWatchDashboardName')
        self.assertIsNotNone(dashboard_name, "Dashboard name should be in outputs")

        # ACT
        response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)

        # ASSERT
        self.assertEqual(response['DashboardName'], dashboard_name)
        self.assertIsNotNone(response['DashboardBody'])

    @mark.it("validates CloudWatch alarms exist for critical metrics")
    def test_cloudwatch_alarms_exist(self):
        # ARRANGE
        env_suffix = flat_outputs.get('EnvironmentSuffix', 'synthl0p2s2y4')

        # ACT
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f"Aurora-High-CPU-{env_suffix}"
        )

        # ASSERT - At least Aurora CPU alarm should exist
        self.assertGreater(len(response['MetricAlarms']), 0)
        alarm = response['MetricAlarms'][0]
        self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')
        self.assertEqual(alarm['Threshold'], 80.0)
        self.assertEqual(alarm['Namespace'], 'AWS/RDS')

    @mark.it("validates AWS Backup plan and vault exist")
    def test_backup_plan_exists(self):
        # ARRANGE
        env_suffix = flat_outputs.get('EnvironmentSuffix', 'synthl0p2s2y4')

        # ACT
        backup_plans = self.backup_client.list_backup_plans()

        # ASSERT - Find backup plan with environment suffix
        plan_names = [plan['BackupPlanName'] for plan in backup_plans['BackupPlansList']]
        matching_plans = [name for name in plan_names if env_suffix in name]
        self.assertGreater(len(matching_plans), 0, "Backup plan should exist")

        # Verify backup vault exists
        backup_vaults = self.backup_client.list_backup_vaults()
        vault_names = [vault['BackupVaultName'] for vault in backup_vaults['BackupVaultList']]
        matching_vaults = [name for name in vault_names if env_suffix in name]
        self.assertGreater(len(matching_vaults), 0, "Backup vault should exist")

    @mark.it("validates all resources use environment suffix")
    def test_resources_use_environment_suffix(self):
        # ARRANGE
        env_suffix = flat_outputs.get('EnvironmentSuffix', 'synthl0p2s2y4')

        # ASSERT - All resource names should include environment suffix
        table_name = flat_outputs.get('DynamoDBTableName')
        self.assertTrue(table_name.endswith(env_suffix))

        bucket_name = flat_outputs.get('S3BucketName')
        self.assertTrue(bucket_name.endswith(env_suffix))

        function_name = flat_outputs.get('LambdaFunctionName')
        self.assertTrue(function_name.endswith(env_suffix))

        dashboard_name = flat_outputs.get('CloudWatchDashboardName')
        self.assertTrue(dashboard_name.endswith(env_suffix))

    @mark.it("validates Lambda can access Aurora, DynamoDB, and S3")
    def test_lambda_has_proper_permissions(self):
        # ARRANGE
        function_name = flat_outputs.get('LambdaFunctionName')
        self.assertIsNotNone(function_name, "Lambda function name should be in outputs")

        # ACT
        response = self.lambda_client.get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']

        # Get role name from ARN
        role_name = role_arn.split('/')[-1]
        iam_client = boto3.client('iam', region_name=self.region)

        # Get attached policies
        policies_response = iam_client.list_attached_role_policies(RoleName=role_name)
        inline_policies_response = iam_client.list_role_policies(RoleName=role_name)

        # ASSERT - Lambda should have VPC execution permissions
        policy_arns = [p['PolicyArn'] for p in policies_response['AttachedPolicies']]
        has_vpc_policy = any('AWSLambdaVPCAccessExecutionRole' in arn for arn in policy_arns)
        self.assertTrue(has_vpc_policy, "Lambda should have VPC execution permissions")

        # Verify inline policies exist for resource access
        self.assertGreater(
            len(inline_policies_response['PolicyNames']),
            0,
            "Lambda should have inline policies for resource access"
        )
