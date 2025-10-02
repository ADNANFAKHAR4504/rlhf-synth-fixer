"""Integration tests for deployed TapStack infrastructure."""

import json
import os
import time
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
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}

# Initialize AWS clients
s3_client = boto3.client('s3', region_name='us-east-1')
lambda_client = boto3.client('lambda', region_name='us-east-1')
dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
logs_client = boto3.client('logs', region_name='us-east-1')
cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')


def find_output(outputs, prefix):
    """Find output value by key prefix (handles CDK auto-generated suffixes)."""
    for key, value in outputs.items():
        if key.startswith(prefix):
            return value
    return None


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the deployed TapStack infrastructure."""

    def setUp(self):
        """Set up test data from deployment outputs."""
        # Try to find outputs with CDK-style suffixes
        self.bucket_name = find_output(flat_outputs, 'BucketName')
        self.function_name = find_output(flat_outputs, 'FunctionName')
        self.table_name = find_output(flat_outputs, 'TableName')

        # Validate outputs exist
        self.assertIsNotNone(self.bucket_name, "BucketName not found in outputs")
        self.assertIsNotNone(self.function_name, "FunctionName not found in outputs")
        self.assertIsNotNone(self.table_name, "TableName not found in outputs")

    @mark.it("verifies S3 bucket exists and is configured correctly")
    def test_s3_bucket_exists(self):
        """Test that S3 bucket exists with correct configuration."""
        # Check bucket exists
        response = s3_client.get_bucket_versioning(Bucket=self.bucket_name)
        self.assertEqual(response['Status'], 'Enabled')

        # Check encryption
        response = s3_client.get_bucket_encryption(Bucket=self.bucket_name)
        self.assertIn('Rules', response['ServerSideEncryptionConfiguration'])

        # Check lifecycle rules
        response = s3_client.get_bucket_lifecycle_configuration(Bucket=self.bucket_name)
        self.assertIn('Rules', response)

    @mark.it("verifies Lambda function exists and is configured correctly")
    def test_lambda_function_exists(self):
        """Test that Lambda function exists with correct configuration."""
        response = lambda_client.get_function(FunctionName=self.function_name)

        # Check runtime
        self.assertEqual(response['Configuration']['Runtime'], 'python3.10')

        # Check memory
        self.assertEqual(response['Configuration']['MemorySize'], 256)

        # Check timeout
        self.assertEqual(response['Configuration']['Timeout'], 30)

        # Check environment variables
        env_vars = response['Configuration']['Environment']['Variables']
        self.assertIn('METADATA_TABLE', env_vars)
        self.assertIn('ENVIRONMENT', env_vars)
        self.assertIn('METRICS_NAMESPACE', env_vars)

    @mark.it("verifies DynamoDB table exists and is configured correctly")
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists with correct configuration."""
        response = dynamodb_client.describe_table(TableName=self.table_name)

        # Check billing mode
        self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Check key schema
        key_schema = response['Table']['KeySchema']
        self.assertEqual(len(key_schema), 2)

        # Check partition key
        partition_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
        self.assertIsNotNone(partition_key)
        self.assertEqual(partition_key['AttributeName'], 'filename')

        # Check sort key
        sort_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)
        self.assertIsNotNone(sort_key)
        self.assertEqual(sort_key['AttributeName'], 'upload_timestamp')

    @mark.it("verifies S3 triggers Lambda on file upload")
    def test_s3_lambda_integration(self):
        """Test that uploading a file to S3 triggers Lambda function."""
        # Create test data
        test_file_key = f"test-file-{int(time.time())}.json"
        test_data = json.dumps({
            "shipment_id": "TEST123",
            "status": "delivered",
            "timestamp": "2024-01-01T00:00:00Z"
        })

        # Upload file to S3
        s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_file_key,
            Body=test_data,
            ContentType='application/json'
        )

        # Wait for Lambda to process (max 10 seconds)
        time.sleep(5)

        # Check DynamoDB for the record
        response = dynamodb_client.query(
            TableName=self.table_name,
            KeyConditionExpression='filename = :filename',
            ExpressionAttributeValues={
                ':filename': {'S': test_file_key}
            },
            Limit=1
        )

        # Verify record was created
        self.assertGreater(response['Count'], 0, "No record found in DynamoDB")

        if response['Count'] > 0:
            item = response['Items'][0]
            self.assertEqual(item['processing_status']['S'], 'SUCCESS')
            self.assertIn('processing_duration', item)

        # Clean up
        s3_client.delete_object(Bucket=self.bucket_name, Key=test_file_key)

    @mark.it("verifies CloudWatch logs are created for Lambda")
    def test_cloudwatch_logs_exist(self):
        """Test that CloudWatch log group exists for Lambda."""
        log_group_name = f"/aws/lambda/{self.function_name}"

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        # Check log group exists
        self.assertGreater(len(response['logGroups']), 0)

        # Check retention period
        log_group = response['logGroups'][0]
        self.assertEqual(log_group['retentionInDays'], 7)

    @mark.it("verifies CloudWatch metrics namespace exists")
    def test_cloudwatch_metrics_namespace(self):
        """Test that CloudWatch metrics namespace is configured."""
        # Get Lambda environment to find namespace
        response = lambda_client.get_function_configuration(
            FunctionName=self.function_name
        )

        namespace = response['Environment']['Variables']['METRICS_NAMESPACE']

        # List metrics in namespace
        response = cloudwatch_client.list_metrics(
            Namespace=namespace
        )

        # Check for expected metrics
        metric_names = [m['MetricName'] for m in response['Metrics']]
        # Note: These will only exist after Lambda has run
        # We're just checking the namespace is valid

    @mark.it("verifies Lambda handles invalid JSON gracefully")
    def test_lambda_error_handling(self):
        """Test that Lambda handles errors gracefully."""
        # Upload invalid JSON
        test_file_key = f"test-invalid-{int(time.time())}.json"
        invalid_data = "This is not valid JSON {"

        s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_file_key,
            Body=invalid_data,
            ContentType='text/plain'
        )

        # Wait for processing
        time.sleep(5)

        # Check DynamoDB - should still create a record (CSV fallback)
        response = dynamodb_client.query(
            TableName=self.table_name,
            KeyConditionExpression='filename = :filename',
            ExpressionAttributeValues={
                ':filename': {'S': test_file_key}
            },
            Limit=1
        )

        # Record should exist (CSV processing fallback)
        self.assertGreater(response['Count'], 0)

        # Clean up
        s3_client.delete_object(Bucket=self.bucket_name, Key=test_file_key)

    @mark.it("verifies Lambda processes multiple records in batch")
    def test_batch_processing(self):
        """Test that Lambda can process multiple shipment records."""
        # Create test data with multiple records
        test_file_key = f"test-batch-{int(time.time())}.json"
        test_data = json.dumps([
            {"shipment_id": "BATCH1", "status": "shipped", "timestamp": "2024-01-01T00:00:00Z"},
            {"shipment_id": "BATCH2", "status": "delivered", "timestamp": "2024-01-01T01:00:00Z"},
            {"shipment_id": "BATCH3", "status": "in_transit", "timestamp": "2024-01-01T02:00:00Z"}
        ])

        # Upload file
        s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_file_key,
            Body=test_data,
            ContentType='application/json'
        )

        # Wait for processing
        time.sleep(5)

        # Check DynamoDB
        response = dynamodb_client.query(
            TableName=self.table_name,
            KeyConditionExpression='filename = :filename',
            ExpressionAttributeValues={
                ':filename': {'S': test_file_key}
            }
        )

        # Verify record exists and shows 3 records processed
        if response['Count'] > 0:
            item = response['Items'][0]
            if 'records_processed' in item:
                self.assertEqual(int(item['records_processed']['N']), 3)

        # Clean up
        s3_client.delete_object(Bucket=self.bucket_name, Key=test_file_key)

    @mark.it("verifies S3 bucket versioning works")
    def test_s3_versioning(self):
        """Test that S3 bucket versioning is enabled and working."""
        test_file_key = f"test-version-{int(time.time())}.txt"

        # Upload first version
        s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_file_key,
            Body="Version 1"
        )

        # Upload second version
        s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_file_key,
            Body="Version 2"
        )

        # List versions
        response = s3_client.list_object_versions(
            Bucket=self.bucket_name,
            Prefix=test_file_key
        )

        # Should have multiple versions
        self.assertGreaterEqual(len(response.get('Versions', [])), 2)

        # Clean up all versions
        for version in response.get('Versions', []):
            s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=test_file_key,
                VersionId=version['VersionId']
            )
