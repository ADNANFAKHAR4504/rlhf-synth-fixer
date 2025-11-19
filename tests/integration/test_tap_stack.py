"""
Integration tests for TapStack multi-region disaster recovery infrastructure.
Tests use real AWS resources deployed in both regions.
"""
import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark


# Load stack outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        STACK_OUTPUTS = json.load(f)
else:
    STACK_OUTPUTS = {}
    print("WARNING: No stack outputs found. Integration tests may fail.")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed multi-region DR infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for testing"""
        cls.outputs = STACK_OUTPUTS

        # Initialize AWS clients for both regions
        cls.ec2_primary = boto3.client('ec2', region_name='us-east-1')
        cls.ec2_secondary = boto3.client('ec2', region_name='us-east-2')

        cls.rds_primary = boto3.client('rds', region_name='us-east-1')
        cls.rds_secondary = boto3.client('rds', region_name='us-east-2')

        cls.dynamodb_primary = boto3.client('dynamodb', region_name='us-east-1')
        cls.dynamodb_secondary = boto3.client('dynamodb', region_name='us-east-2')

        cls.s3 = boto3.client('s3')

        cls.lambda_primary = boto3.client('lambda', region_name='us-east-1')
        cls.lambda_secondary = boto3.client('lambda', region_name='us-east-2')

        cls.apigw_primary = boto3.client('apigateway', region_name='us-east-1')
        cls.apigw_secondary = boto3.client('apigateway', region_name='us-east-2')

        cls.sfn_primary = boto3.client('stepfunctions', region_name='us-east-1')

    @mark.it("verifies primary VPC exists and is accessible")
    def test_primary_vpc_exists(self):
        """Test that primary VPC exists and is properly configured"""
        vpc_id = self.outputs.get('PrimaryVPCId')
        self.assertIsNotNone(vpc_id, "Primary VPC ID should be in outputs")

        # Verify VPC exists
        response = self.ec2_primary.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    @mark.it("verifies secondary VPC exists and is accessible")
    def test_secondary_vpc_exists(self):
        """Test that secondary VPC exists and is properly configured"""
        vpc_id = self.outputs.get('SecondaryVPCId')
        self.assertIsNotNone(vpc_id, "Secondary VPC ID should be in outputs")

        # Verify VPC exists
        response = self.ec2_secondary.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')

    @mark.it("verifies primary Aurora cluster is available")
    def test_primary_aurora_cluster_available(self):
        """Test that primary Aurora cluster is available and accessible"""
        endpoint = self.outputs.get('PrimaryAuroraClusterEndpoint')
        self.assertIsNotNone(endpoint, "Primary Aurora endpoint should be in outputs")

        # Extract cluster identifier from endpoint
        cluster_id = endpoint.split('.')[0]

        # Verify cluster exists and is available
        response = self.rds_primary.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        self.assertEqual(len(response['DBClusters']), 1)
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['StorageEncrypted'])

    @mark.it("verifies secondary Aurora cluster is available")
    def test_secondary_aurora_cluster_available(self):
        """Test that secondary Aurora cluster is available"""
        endpoint = self.outputs.get('SecondaryAuroraClusterEndpoint')
        self.assertIsNotNone(endpoint, "Secondary Aurora endpoint should be in outputs")

        # Extract cluster identifier from endpoint
        cluster_id = endpoint.split('.')[0]

        # Verify cluster exists and is available
        response = self.rds_secondary.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        self.assertEqual(len(response['DBClusters']), 1)
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Status'], 'available')

    @mark.it("verifies DynamoDB Global Table exists and is replicated")
    def test_dynamodb_global_table_replicated(self):
        """Test that DynamoDB Global Table exists and is replicated across regions"""
        table_name = self.outputs.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name should be in outputs")

        # Check table exists in primary region
        response_primary = self.dynamodb_primary.describe_table(TableName=table_name)
        table_primary = response_primary['Table']

        self.assertEqual(table_primary['TableStatus'], 'ACTIVE')
        self.assertEqual(table_primary['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertIsNotNone(table_primary.get('StreamSpecification'))

        # Check table exists in secondary region
        response_secondary = self.dynamodb_secondary.describe_table(TableName=table_name)
        table_secondary = response_secondary['Table']

        self.assertEqual(table_secondary['TableStatus'], 'ACTIVE')

        # Verify both tables have the same name (Global Table)
        self.assertEqual(table_primary['TableName'], table_secondary['TableName'])

    @mark.it("verifies DynamoDB table supports CRUD operations in primary region")
    def test_dynamodb_crud_operations_primary(self):
        """Test basic CRUD operations on DynamoDB table in primary region"""
        table_name = self.outputs.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name should be in outputs")

        # Create a test item
        test_item = {
            'sessionId': {'S': 'test-session-001'},
            'timestamp': {'N': '1234567890'},
            'userId': {'S': 'test-user-001'},
            'status': {'S': 'active'}
        }

        # Put item
        self.dynamodb_primary.put_item(
            TableName=table_name,
            Item=test_item
        )

        # Get item
        response = self.dynamodb_primary.get_item(
            TableName=table_name,
            Key={
                'sessionId': {'S': 'test-session-001'},
                'timestamp': {'N': '1234567890'}
            }
        )

        self.assertIn('Item', response)
        self.assertEqual(response['Item']['userId']['S'], 'test-user-001')

        # Delete item (cleanup)
        self.dynamodb_primary.delete_item(
            TableName=table_name,
            Key={
                'sessionId': {'S': 'test-session-001'},
                'timestamp': {'N': '1234567890'}
            }
        )

    @mark.it("verifies S3 buckets exist in both regions")
    def test_s3_buckets_exist(self):
        """Test that S3 buckets exist in both regions"""
        primary_bucket = self.outputs.get('PrimaryS3BucketName')
        secondary_bucket = self.outputs.get('SecondaryS3BucketName')

        self.assertIsNotNone(primary_bucket, "Primary S3 bucket name should be in outputs")
        self.assertIsNotNone(secondary_bucket, "Secondary S3 bucket name should be in outputs")

        # Verify primary bucket
        try:
            response_primary = self.s3.head_bucket(Bucket=primary_bucket)
            self.assertIsNotNone(response_primary)
        except ClientError as e:
            self.fail(f"Primary S3 bucket {primary_bucket} does not exist: {e}")

        # Verify secondary bucket
        try:
            response_secondary = self.s3.head_bucket(Bucket=secondary_bucket)
            self.assertIsNotNone(response_secondary)
        except ClientError as e:
            self.fail(f"Secondary S3 bucket {secondary_bucket} does not exist: {e}")

    @mark.it("verifies S3 bucket versioning is enabled")
    def test_s3_bucket_versioning_enabled(self):
        """Test that S3 buckets have versioning enabled"""
        primary_bucket = self.outputs.get('PrimaryS3BucketName')
        self.assertIsNotNone(primary_bucket)

        # Check versioning configuration
        response = self.s3.get_bucket_versioning(Bucket=primary_bucket)
        self.assertEqual(response.get('Status'), 'Enabled')

    @mark.it("verifies S3 bucket supports object operations")
    def test_s3_object_operations(self):
        """Test basic object operations on primary S3 bucket"""
        primary_bucket = self.outputs.get('PrimaryS3BucketName')
        self.assertIsNotNone(primary_bucket)

        test_key = 'integration-test/test-object.txt'
        test_content = b'Integration test content'

        # Put object
        self.s3.put_object(
            Bucket=primary_bucket,
            Key=test_key,
            Body=test_content
        )

        # Get object
        response = self.s3.get_object(
            Bucket=primary_bucket,
            Key=test_key
        )
        retrieved_content = response['Body'].read()
        self.assertEqual(retrieved_content, test_content)

        # Delete object (cleanup)
        self.s3.delete_object(
            Bucket=primary_bucket,
            Key=test_key
        )

    @mark.it("verifies Lambda functions exist in primary region")
    def test_lambda_functions_exist_primary(self):
        """Test that Lambda functions are deployed in primary region"""
        # List all functions with environment suffix in name
        response = self.lambda_primary.list_functions()

        functions = response.get('Functions', [])
        # Filter functions that match our naming pattern
        our_functions = [f for f in functions if 'test' in f['FunctionName'].lower() or
                        'payment' in f['FunctionName'].lower() or
                        'failover' in f['FunctionName'].lower()]

        self.assertGreater(len(our_functions), 0, "Should have Lambda functions deployed")

        # Verify at least one function has correct runtime
        runtimes = [f['Runtime'] for f in our_functions]
        self.assertIn('python3.11', runtimes)

    @mark.it("verifies Lambda functions exist in secondary region")
    def test_lambda_functions_exist_secondary(self):
        """Test that Lambda functions are deployed in secondary region"""
        response = self.lambda_secondary.list_functions()

        functions = response.get('Functions', [])
        our_functions = [f for f in functions if 'test' in f['FunctionName'].lower() or
                        'payment' in f['FunctionName'].lower()]

        self.assertGreater(len(our_functions), 0, "Should have Lambda functions deployed in secondary")

    @mark.it("verifies API Gateway endpoints are accessible")
    def test_api_gateway_endpoints_accessible(self):
        """Test that API Gateway endpoints are deployed and accessible"""
        primary_endpoint = self.outputs.get('PrimaryAPIEndpoint')
        secondary_endpoint = self.outputs.get('SecondaryAPIEndpoint')

        self.assertIsNotNone(primary_endpoint, "Primary API endpoint should be in outputs")
        self.assertIsNotNone(secondary_endpoint, "Secondary API endpoint should be in outputs")

        # Verify endpoints are valid URLs
        self.assertTrue(primary_endpoint.startswith('https://'))
        self.assertTrue(secondary_endpoint.startswith('https://'))

        # Extract API IDs from endpoints
        primary_api_id = primary_endpoint.split('//')[1].split('.')[0]
        secondary_api_id = secondary_endpoint.split('//')[1].split('.')[0]

        # Verify APIs exist
        try:
            api_primary = self.apigw_primary.get_rest_api(restApiId=primary_api_id)
            self.assertIsNotNone(api_primary)
        except ClientError as e:
            self.fail(f"Primary API Gateway not found: {e}")

        try:
            api_secondary = self.apigw_secondary.get_rest_api(restApiId=secondary_api_id)
            self.assertIsNotNone(api_secondary)
        except ClientError as e:
            self.fail(f"Secondary API Gateway not found: {e}")

    @mark.it("verifies Step Functions state machine exists in primary region only")
    def test_step_functions_failover_exists(self):
        """Test that failover state machine exists only in primary region"""
        state_machine_arn = self.outputs.get('FailoverStateMachineArn')
        self.assertIsNotNone(state_machine_arn, "Failover state machine ARN should be in outputs")

        # Verify state machine exists
        response = self.sfn_primary.describe_state_machine(
            stateMachineArn=state_machine_arn
        )

        self.assertEqual(response['status'], 'ACTIVE')
        self.assertIn('payment-failover', response['name'])

    @mark.it("verifies multi-region DR setup is complete")
    def test_multi_region_dr_setup_complete(self):
        """Test that all components of multi-region DR are properly configured"""
        # Verify all required outputs are present
        required_outputs = [
            'PrimaryAPIEndpoint',
            'PrimaryVPCId',
            'PrimaryAuroraClusterEndpoint',
            'PrimaryS3BucketName',
            'SecondaryAPIEndpoint',
            'SecondaryVPCId',
            'SecondaryAuroraClusterEndpoint',
            'SecondaryS3BucketName',
            'DynamoDBTableName',
            'FailoverStateMachineArn'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
            self.assertIsNotNone(self.outputs[output], f"Output {output} should not be None")

    @mark.it("verifies Aurora clusters are in different regions")
    def test_aurora_clusters_in_different_regions(self):
        """Test that Aurora clusters are deployed in different regions"""
        primary_endpoint = self.outputs.get('PrimaryAuroraClusterEndpoint')
        secondary_endpoint = self.outputs.get('SecondaryAuroraClusterEndpoint')

        self.assertIsNotNone(primary_endpoint)
        self.assertIsNotNone(secondary_endpoint)

        # Verify regions in endpoints
        self.assertIn('us-east-1', primary_endpoint)
        self.assertIn('us-east-2', secondary_endpoint)

    @mark.it("verifies infrastructure tags are properly applied")
    def test_infrastructure_tags(self):
        """Test that DR role tags are applied to infrastructure"""
        primary_vpc_id = self.outputs.get('PrimaryVPCId')
        self.assertIsNotNone(primary_vpc_id)

        # Get VPC tags
        response = self.ec2_primary.describe_vpcs(VpcIds=[primary_vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        # Verify DR-Role tag exists
        self.assertIn('DR-Role', tags)
        self.assertEqual(tags['DR-Role'], 'primary')


if __name__ == '__main__':
    unittest.main()
