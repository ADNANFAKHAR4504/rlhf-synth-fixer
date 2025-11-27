import json
import os
import unittest

import boto3
from pytest import mark

# Load deployment outputs
outputs_path = os.path.join(os.getcwd(), 'cfn-outputs', 'flat-outputs.json')

with open(outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)


def get_environment_suffix():
    """Extract environment suffix from resource names in outputs"""
    table_name = flat_outputs.get('DynamoDBTableName', '')
    # DynamoDB table name format: dr-table-{suffix}
    if table_name.startswith('dr-table-'):
        return table_name.replace('dr-table-', '')
    # Fallback to environment variable
    return os.environ.get('ENVIRONMENT_SUFFIX', 'dev')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration tests"""
        cls.region = flat_outputs.get('Region', os.environ.get('AWS_REGION', 'us-east-1'))
        cls.env_suffix = get_environment_suffix()
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.backup_client = boto3.client('backup', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)

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

    @mark.it("validates Aurora has KMS encryption")
    def test_aurora_kms_encryption(self):
        # ARRANGE
        cluster_id = flat_outputs.get('AuroraClusterIdentifier')
        kms_key_arn = flat_outputs.get('AuroraKmsKeyArn')
        self.assertIsNotNone(cluster_id, "Aurora cluster ID should be in outputs")
        self.assertIsNotNone(kms_key_arn, "Aurora KMS key ARN should be in outputs")

        # ACT
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        # ASSERT
        cluster = response['DBClusters'][0]
        self.assertTrue(cluster['StorageEncrypted'])
        self.assertEqual(cluster['KmsKeyId'], kms_key_arn)

    @mark.it("validates Aurora cluster endpoints")
    def test_aurora_cluster_endpoints(self):
        # ARRANGE
        cluster_endpoint = flat_outputs.get('AuroraClusterEndpoint')
        reader_endpoint = flat_outputs.get('AuroraClusterReaderEndpoint')
        self.assertIsNotNone(cluster_endpoint, "Aurora cluster endpoint should be in outputs")
        self.assertIsNotNone(reader_endpoint, "Aurora reader endpoint should be in outputs")

        # ACT
        cluster_id = flat_outputs.get('AuroraClusterIdentifier')
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        # ASSERT
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Endpoint'], cluster_endpoint)
        self.assertEqual(cluster['ReaderEndpoint'], reader_endpoint)

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

    @mark.it("validates DynamoDB table ARN matches output")
    def test_dynamodb_table_arn(self):
        # ARRANGE
        table_name = flat_outputs.get('DynamoDBTableName')
        table_arn = flat_outputs.get('DynamoDBTableArn')
        self.assertIsNotNone(table_arn, "DynamoDB table ARN should be in outputs")

        # ACT
        response = self.dynamodb_client.describe_table(TableName=table_name)

        # ASSERT
        self.assertEqual(response['Table']['TableArn'], table_arn)

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

    @mark.it("validates S3 bucket KMS key")
    def test_s3_bucket_kms_key(self):
        # ARRANGE
        bucket_name = flat_outputs.get('S3BucketName')
        kms_key_arn = flat_outputs.get('S3KmsKeyArn')
        self.assertIsNotNone(kms_key_arn, "S3 KMS key ARN should be in outputs")

        # ACT
        encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)

        # ASSERT
        encryption_rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
        kms_master_key = encryption_rules[0]['ApplyServerSideEncryptionByDefault']['KMSMasterKeyID']
        self.assertEqual(kms_master_key, kms_key_arn)

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

    @mark.it("validates Lambda function ARN matches output")
    def test_lambda_function_arn(self):
        # ARRANGE
        function_name = flat_outputs.get('LambdaFunctionName')
        function_arn = flat_outputs.get('LambdaFunctionArn')
        self.assertIsNotNone(function_arn, "Lambda function ARN should be in outputs")

        # ACT
        response = self.lambda_client.get_function(FunctionName=function_name)

        # ASSERT
        self.assertEqual(response['Configuration']['FunctionArn'], function_arn)

    @mark.it("validates Lambda is in VPC with correct configuration")
    def test_lambda_vpc_configuration(self):
        # ARRANGE
        function_name = flat_outputs.get('LambdaFunctionName')
        vpc_id = flat_outputs.get('VpcId')
        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")

        # ACT
        response = self.lambda_client.get_function(FunctionName=function_name)
        vpc_config = response['Configuration']['VpcConfig']

        # ASSERT
        self.assertEqual(vpc_config['VpcId'], vpc_id)
        # Verify Lambda is in private subnets (at least 2 for Multi-AZ)
        self.assertGreaterEqual(len(vpc_config['SubnetIds']), 2)
        self.assertGreater(len(vpc_config['SecurityGroupIds']), 0)

    @mark.it("validates SNS topic exists")
    def test_sns_topic_exists(self):
        # ARRANGE
        topic_arn = flat_outputs.get('SnsTopicArn')
        self.assertIsNotNone(topic_arn, "SNS topic ARN should be in outputs")

        # ACT
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)

        # ASSERT
        attributes = response['Attributes']
        self.assertEqual(attributes['TopicArn'], topic_arn)
        self.assertEqual(attributes['DisplayName'], 'DR Notifications')

    @mark.it("validates SNS topic name matches output")
    def test_sns_topic_name(self):
        # ARRANGE
        topic_arn = flat_outputs.get('SnsTopicArn')
        topic_name = flat_outputs.get('SnsTopicName')
        self.assertIsNotNone(topic_name, "SNS topic name should be in outputs")

        # ASSERT
        # Topic ARN format: arn:aws:sns:region:account:topic-name
        self.assertTrue(topic_arn.endswith(topic_name))

    @mark.it("validates VPC exists with Multi-AZ subnets")
    def test_vpc_exists(self):
        # ARRANGE
        vpc_id = flat_outputs.get('VpcId')
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

        # Verify Multi-AZ subnets (2 AZs with 2 private + 2 public = 4 subnets)
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

    @mark.it("validates VPC CIDR matches output")
    def test_vpc_cidr(self):
        # ARRANGE
        vpc_id = flat_outputs.get('VpcId')
        vpc_cidr = flat_outputs.get('VpcCidr')
        self.assertIsNotNone(vpc_cidr, "VPC CIDR should be in outputs")

        # ACT
        vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        # ASSERT
        self.assertEqual(vpc_response['Vpcs'][0]['CidrBlock'], vpc_cidr)

    @mark.it("validates CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        # ARRANGE
        dashboard_name = f"DR-Dashboard-{self.env_suffix}"

        # ACT
        response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)

        # ASSERT
        self.assertEqual(response['DashboardName'], dashboard_name)
        self.assertIsNotNone(response['DashboardBody'])

    @mark.it("validates CloudWatch alarms exist for critical metrics")
    def test_cloudwatch_alarms_exist(self):
        # ARRANGE/ACT
        aurora_alarm_response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f"Aurora-High-CPU-{self.env_suffix}"
        )
        dynamodb_alarm_response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f"DynamoDB-Throttled-Requests-{self.env_suffix}"
        )
        lambda_alarm_response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f"Lambda-Errors-{self.env_suffix}"
        )

        # ASSERT - Aurora CPU alarm
        self.assertGreater(len(aurora_alarm_response['MetricAlarms']), 0)
        aurora_alarm = aurora_alarm_response['MetricAlarms'][0]
        self.assertEqual(aurora_alarm['ComparisonOperator'], 'GreaterThanThreshold')
        self.assertEqual(aurora_alarm['Threshold'], 80.0)
        self.assertEqual(aurora_alarm['Namespace'], 'AWS/RDS')

        # ASSERT - DynamoDB throttle alarm
        self.assertGreater(len(dynamodb_alarm_response['MetricAlarms']), 0)
        dynamodb_alarm = dynamodb_alarm_response['MetricAlarms'][0]
        self.assertEqual(dynamodb_alarm['Namespace'], 'AWS/DynamoDB')

        # ASSERT - Lambda errors alarm
        self.assertGreater(len(lambda_alarm_response['MetricAlarms']), 0)
        lambda_alarm = lambda_alarm_response['MetricAlarms'][0]
        self.assertEqual(lambda_alarm['Namespace'], 'AWS/Lambda')

    @mark.it("validates AWS Backup plan and vault exist")
    def test_backup_plan_exists(self):
        # ACT
        backup_plans = self.backup_client.list_backup_plans()

        # ASSERT - Find backup plan with environment suffix
        plan_names = [plan['BackupPlanName'] for plan in backup_plans['BackupPlansList']]
        matching_plans = [name for name in plan_names if self.env_suffix in name]
        self.assertGreater(len(matching_plans), 0, "Backup plan should exist")

        # Verify backup vault exists
        backup_vaults = self.backup_client.list_backup_vaults()
        vault_names = [vault['BackupVaultName'] for vault in backup_vaults['BackupVaultList']]
        matching_vaults = [name for name in vault_names if self.env_suffix in name]
        self.assertGreater(len(matching_vaults), 0, "Backup vault should exist")

    @mark.it("validates all resources use environment suffix")
    def test_resources_use_environment_suffix(self):
        # ASSERT - All resource names should include environment suffix
        table_name = flat_outputs.get('DynamoDBTableName')
        self.assertTrue(table_name.endswith(self.env_suffix))

        bucket_name = flat_outputs.get('S3BucketName')
        self.assertTrue(bucket_name.endswith(self.env_suffix))

        function_name = flat_outputs.get('LambdaFunctionName')
        self.assertTrue(function_name.endswith(self.env_suffix))

        topic_name = flat_outputs.get('SnsTopicName')
        self.assertTrue(topic_name.endswith(self.env_suffix))

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

        # Get attached policies
        policies_response = self.iam_client.list_attached_role_policies(RoleName=role_name)
        inline_policies_response = self.iam_client.list_role_policies(RoleName=role_name)

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

    @mark.it("validates Aurora secret exists in Secrets Manager")
    def test_aurora_secret_exists(self):
        # ARRANGE
        secret_arn = flat_outputs.get('AuroraSecretArn')
        self.assertIsNotNone(secret_arn, "Aurora secret ARN should be in outputs")

        # ACT
        secrets_client = boto3.client('secretsmanager', region_name=self.region)
        response = secrets_client.describe_secret(SecretId=secret_arn)

        # ASSERT
        self.assertEqual(response['ARN'], secret_arn)
        self.assertFalse(response.get('DeletedDate', False), "Secret should not be deleted")

    @mark.it("validates KMS keys have rotation enabled")
    def test_kms_key_rotation(self):
        # ARRANGE
        aurora_kms_key = flat_outputs.get('AuroraKmsKeyArn')
        s3_kms_key = flat_outputs.get('S3KmsKeyArn')
        kms_client = boto3.client('kms', region_name=self.region)

        # ACT & ASSERT - Aurora KMS key
        aurora_key_id = aurora_kms_key.split('/')[-1]
        aurora_rotation = kms_client.get_key_rotation_status(KeyId=aurora_key_id)
        self.assertTrue(aurora_rotation['KeyRotationEnabled'], "Aurora KMS key should have rotation enabled")

        # ACT & ASSERT - S3 KMS key
        s3_key_id = s3_kms_key.split('/')[-1]
        s3_rotation = kms_client.get_key_rotation_status(KeyId=s3_key_id)
        self.assertTrue(s3_rotation['KeyRotationEnabled'], "S3 KMS key should have rotation enabled")

    @mark.it("validates security groups allow proper traffic")
    def test_security_groups(self):
        # ARRANGE
        vpc_id = flat_outputs.get('VpcId')

        # ACT
        sg_response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # ASSERT - Should have at least Aurora SG and Lambda SG (plus default)
        security_groups = sg_response['SecurityGroups']
        non_default_sgs = [sg for sg in security_groups if sg['GroupName'] != 'default']
        self.assertGreaterEqual(len(non_default_sgs), 2, "Should have Aurora and Lambda security groups")

        # Find Aurora security group
        aurora_sg = next(
            (sg for sg in security_groups if 'aurora' in sg.get('GroupName', '').lower() or
             'aurora' in sg.get('Description', '').lower()),
            None
        )
        self.assertIsNotNone(aurora_sg, "Aurora security group should exist")

        # Verify Aurora SG has PostgreSQL port ingress rule
        ingress_rules = aurora_sg['IpPermissions']
        has_postgres_rule = any(
            rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432
            for rule in ingress_rules
        )
        self.assertTrue(has_postgres_rule, "Aurora SG should allow PostgreSQL port 5432")
