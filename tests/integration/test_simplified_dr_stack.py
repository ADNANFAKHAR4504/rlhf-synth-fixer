"""Integration tests for SimplifiedDRStack - Tests against deployed AWS resources"""
import json
import os
import unittest
import boto3
from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        outputs_data = json.load(f)
        # Convert from CloudFormation output format to simple dict
        flat_outputs = {item['OutputKey']: item['OutputValue'] for item in outputs_data}
else:
    flat_outputs = {}


@mark.describe("SimplifiedDRStack Integration Tests")
class TestSimplifiedDRStackIntegration(unittest.TestCase):
    """Integration tests for deployed SimplifiedDRStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration testing"""
        cls.vpc_id = flat_outputs.get('VPCId')
        cls.aurora_endpoint = flat_outputs.get('AuroraClusterEndpoint')
        cls.dynamodb_table = flat_outputs.get('DynamoDBTableName')
        cls.lambda_function = flat_outputs.get('LambdaFunctionName')
        cls.s3_bucket = flat_outputs.get('S3BucketName')
        cls.backup_vault = flat_outputs.get('BackupVaultName')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.rds_client = boto3.client('rds', region_name='us-east-1')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.backup_client = boto3.client('backup', region_name='us-east-1')

    @mark.it("VPC exists and is available")
    def test_vpc_exists_and_available(self):
        """Test that VPC exists and is in available state"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    @mark.it("VPC has correct subnet configuration")
    def test_vpc_subnets(self):
        """Test that VPC has 6 subnets (2 AZs × 3 types)"""
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        subnets = response['Subnets']
        self.assertEqual(len(subnets), 6)  # 2 AZs × 3 subnet types

    @mark.it("Aurora cluster exists and is available")
    def test_aurora_cluster_available(self):
        """Test that Aurora cluster exists and is in available state"""
        # Extract cluster identifier from endpoint
        cluster_id = self.aurora_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        self.assertEqual(len(response['DBClusters']), 1)
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['StorageEncrypted'])

    @mark.it("Aurora has correct master username")
    def test_aurora_master_username(self):
        """Test that Aurora uses correct master username"""
        cluster_id = self.aurora_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['MasterUsername'], 'dbadmin')

    @mark.it("DynamoDB table exists and is active")
    def test_dynamodb_table_active(self):
        """Test that DynamoDB table exists and is in active state"""
        response = self.dynamodb_client.describe_table(
            TableName=self.dynamodb_table
        )

        table = response['Table']
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

    @mark.it("DynamoDB table has correct key schema")
    def test_dynamodb_key_schema(self):
        """Test that DynamoDB table has correct partition and sort keys"""
        response = self.dynamodb_client.describe_table(
            TableName=self.dynamodb_table
        )

        table = response['Table']
        key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}

        self.assertEqual(key_schema['transactionId'], 'HASH')
        self.assertEqual(key_schema['timestamp'], 'RANGE')

    @mark.it("DynamoDB has point-in-time recovery enabled")
    def test_dynamodb_pitr_enabled(self):
        """Test that DynamoDB table has point-in-time recovery enabled"""
        response = self.dynamodb_client.describe_continuous_backups(
            TableName=self.dynamodb_table
        )

        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')

    @mark.it("Lambda function exists and is active")
    def test_lambda_function_active(self):
        """Test that Lambda function exists and is configured correctly"""
        response = self.lambda_client.get_function(
            FunctionName=self.lambda_function
        )

        config = response['Configuration']
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['Timeout'], 30)
        self.assertIn('TABLE_NAME', config['Environment']['Variables'])

    @mark.it("Lambda function is in VPC")
    def test_lambda_in_vpc(self):
        """Test that Lambda function is deployed in VPC"""
        response = self.lambda_client.get_function(
            FunctionName=self.lambda_function
        )

        config = response['Configuration']
        self.assertIsNotNone(config.get('VpcConfig'))
        self.assertEqual(config['VpcConfig']['VpcId'], self.vpc_id)

    @mark.it("S3 bucket exists and is accessible")
    def test_s3_bucket_exists(self):
        """Test that S3 bucket exists"""
        response = self.s3_client.head_bucket(Bucket=self.s3_bucket)

        # If bucket doesn't exist, head_bucket raises exception
        self.assertIsNotNone(response)

    @mark.it("S3 bucket has versioning enabled")
    def test_s3_versioning_enabled(self):
        """Test that S3 bucket has versioning enabled"""
        response = self.s3_client.get_bucket_versioning(
            Bucket=self.s3_bucket
        )

        self.assertEqual(response['Status'], 'Enabled')

    @mark.it("S3 bucket has encryption configured")
    def test_s3_encryption(self):
        """Test that S3 bucket has encryption configured"""
        response = self.s3_client.get_bucket_encryption(
            Bucket=self.s3_bucket
        )

        rules = response['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        self.assertIn('ApplyServerSideEncryptionByDefault', rules[0])

    @mark.it("Backup vault exists")
    def test_backup_vault_exists(self):
        """Test that Backup vault exists"""
        response = self.backup_client.describe_backup_vault(
            BackupVaultName=self.backup_vault
        )

        self.assertEqual(response['BackupVaultName'], self.backup_vault)
        self.assertIsNotNone(response['BackupVaultArn'])

    @mark.it("Backup plan exists and is configured correctly")
    def test_backup_plan_configuration(self):
        """Test that Backup plan exists with correct configuration"""
        # List backup plans to find ours
        response = self.backup_client.list_backup_plans()

        backup_plans = response['BackupPlansList']
        our_plan = next(
            (plan for plan in backup_plans if 'dr-backup-plan' in plan['BackupPlanName']),
            None
        )

        self.assertIsNotNone(our_plan)

    @mark.it("Aurora cluster has backup retention configured")
    def test_aurora_backup_retention(self):
        """Test that Aurora cluster has backup retention configured"""
        cluster_id = self.aurora_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        # Backup retention should be configured (default is 1 day)
        self.assertGreaterEqual(cluster['BackupRetentionPeriod'], 1)

    @mark.it("All outputs are present")
    def test_all_outputs_present(self):
        """Test that all expected CloudFormation outputs are present"""
        required_outputs = [
            'VPCId',
            'AuroraClusterEndpoint',
            'DynamoDBTableName',
            'LambdaFunctionName',
            'S3BucketName',
            'BackupVaultName'
        ]

        for output in required_outputs:
            self.assertIn(output, flat_outputs)
            self.assertIsNotNone(flat_outputs[output])
            self.assertNotEqual(flat_outputs[output], '')


if __name__ == "__main__":
    unittest.main()
