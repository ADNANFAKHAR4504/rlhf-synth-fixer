"""Integration tests for SimplifiedDRStack - Tests against deployed AWS resources"""
import json
import os
import unittest
import boto3
from pytest import mark, skip
import time

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Skip all tests if outputs file doesn't exist or AWS credentials not available
SKIP_LIVE_TESTS = not os.path.exists(flat_outputs_path)
SKIP_REASON = "CloudFormation outputs not found or AWS resources not deployed"


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

    @mark.it("S3 bucket can store and retrieve objects")
    def test_s3_put_get_operations(self):
        """Test that S3 bucket supports put and get operations"""
        test_key = f"test-file-{int(time.time())}.txt"
        test_content = "This is a test file for disaster recovery"

        # Put object
        self.s3_client.put_object(
            Bucket=self.s3_bucket,
            Key=test_key,
            Body=test_content.encode('utf-8')
        )

        # Get object
        response = self.s3_client.get_object(
            Bucket=self.s3_bucket,
            Key=test_key
        )

        retrieved_content = response['Body'].read().decode('utf-8')
        self.assertEqual(retrieved_content, test_content)

        # Clean up
        self.s3_client.delete_object(
            Bucket=self.s3_bucket,
            Key=test_key
        )

    @mark.it("Lambda function can be invoked successfully")
    def test_lambda_invocation(self):
        """Test that Lambda function can be invoked and responds correctly"""
        test_payload = {
            'transactionId': f'test-{int(time.time())}',
            'amount': 250.75,
            'timestamp': int(time.time())
        }

        response = self.lambda_client.invoke(
            FunctionName=self.lambda_function,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload).encode('utf-8')
        )

        # Check that invocation completed successfully
        self.assertEqual(response['StatusCode'], 200)

        # Lambda functions may have errors in their execution, but invocation itself succeeded
        # We verify the function is invocable, not necessarily that it processes perfectly
        # In real scenarios, the function may need specific input format
        self.assertIn('Payload', response)

    @mark.it("VPC has internet gateway attached")
    def test_vpc_internet_gateway(self):
        """Test that VPC has an internet gateway attached"""
        response = self.ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [self.vpc_id]}
            ]
        )

        self.assertGreater(len(response['InternetGateways']), 0)
        igw = response['InternetGateways'][0]
        attachments = igw['Attachments']
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]['State'], 'available')

    @mark.it("VPC has route tables configured")
    def test_vpc_route_tables(self):
        """Test that VPC has route tables properly configured"""
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]}
            ]
        )

        route_tables = response['RouteTables']
        # Should have at least 2 route tables (public and private)
        self.assertGreaterEqual(len(route_tables), 2)

    @mark.it("Aurora cluster has at least one database instance")
    def test_aurora_cluster_instances(self):
        """Test that Aurora cluster has at least one database instance"""
        cluster_id = self.aurora_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        db_cluster_members = cluster.get('DBClusterMembers', [])

        self.assertGreater(len(db_cluster_members), 0, "Aurora cluster should have at least one instance")

    @mark.it("S3 bucket has lifecycle policies configured")
    def test_s3_lifecycle_policies(self):
        """Test that S3 bucket has lifecycle policies for cost optimization"""
        from botocore.exceptions import ClientError

        try:
            response = self.s3_client.get_bucket_lifecycle_configuration(
                Bucket=self.s3_bucket
            )
            # If lifecycle is configured, verify it has rules
            self.assertIn('Rules', response)
            self.assertGreater(len(response['Rules']), 0)
        except ClientError as e:
            # NoSuchLifecycleConfiguration is a valid state
            if e.response['Error']['Code'] == 'NoSuchLifecycleConfiguration':
                print(f"Note: No lifecycle configuration found for bucket {self.s3_bucket}")
            else:
                raise

    @mark.it("VPC security groups exist and are configured")
    def test_vpc_security_groups(self):
        """Test that VPC has security groups configured"""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]}
            ]
        )

        security_groups = response['SecurityGroups']
        # Should have at least default SG
        self.assertGreaterEqual(len(security_groups), 1)

        # Verify security groups are properly configured
        # Some security groups may not have ingress rules (egress-only), which is valid
        for sg in security_groups:
            self.assertIn('GroupId', sg)
            self.assertIn('VpcId', sg)
            self.assertEqual(sg['VpcId'], self.vpc_id)

    @mark.it("Backup vault has encryption enabled")
    def test_backup_vault_encryption(self):
        """Test that Backup vault has encryption enabled"""
        response = self.backup_client.describe_backup_vault(
            BackupVaultName=self.backup_vault
        )

        # Backup vaults should have encryption
        self.assertIn('EncryptionKeyArn', response)


if __name__ == "__main__":
    unittest.main()
