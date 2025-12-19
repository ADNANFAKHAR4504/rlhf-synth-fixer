import json
import os
import unittest
import requests
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load the flat-outputs.json file
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Initialize boto3 clients
dynamodb_client = boto3.client('dynamodb')
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')
sqs_client = boto3.client('sqs')


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up test environment"""
        self.flat_outputs = flat_outputs

    @mark.it("validates DynamoDB table exists and is accessible")
    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists and has correct configuration"""
        table_name = self.flat_outputs.get('TableName')
        self.assertIsNotNone(table_name, "TableName is missing in flat-outputs.json")

        try:
            # Describe the table to verify it exists
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Verify table status
            self.assertEqual(table['TableStatus'], 'ACTIVE', "DynamoDB table is not active")
            
            # Verify billing mode
            self.assertEqual(
                table['BillingModeSummary']['BillingMode'], 
                'PAY_PER_REQUEST', 
                "DynamoDB table billing mode is incorrect"
            )
            
            # Verify key schema
            key_schema = table['KeySchema']
            partition_key = next((key for key in key_schema if key['KeyType'] == 'HASH'), None)
            self.assertIsNotNone(partition_key, "Partition key not found")
            self.assertEqual(partition_key['AttributeName'], 'id', "Partition key is not 'id'")
            
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {e}")

    @mark.it("validates S3 bucket exists and has correct configuration")
    def test_s3_bucket_exists(self):
        """Test that the S3 bucket exists and has correct configuration"""
        bucket_name = self.flat_outputs.get('BucketName')
        self.assertIsNotNone(bucket_name, "BucketName is missing in flat-outputs.json")

        try:
            # Check if bucket exists
            s3_client.head_bucket(Bucket=bucket_name)
            
            # Check versioning configuration
            versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(
                versioning.get('Status', 'Disabled'), 
                'Enabled', 
                "S3 bucket versioning is not enabled"
            )
            
            # Check public access block
            public_access_block = s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "BlockPublicAcls is not enabled")
            self.assertTrue(config['BlockPublicPolicy'], "BlockPublicPolicy is not enabled")
            self.assertTrue(config['IgnorePublicAcls'], "IgnorePublicAcls is not enabled")
            self.assertTrue(config['RestrictPublicBuckets'], "RestrictPublicBuckets is not enabled")
            
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {e}")

    @mark.it("validates Lambda function exists and has correct configuration")
    def test_lambda_function_exists(self):
        """Test that the Lambda function exists and has correct configuration"""
        function_name = self.flat_outputs.get('LambdaFunctionName')
        self.assertIsNotNone(function_name, "LambdaFunctionName is missing in flat-outputs.json")

        try:
            # Get function configuration
            response = lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # Verify runtime
            self.assertEqual(config['Runtime'], 'python3.9', "Lambda runtime is incorrect")
            
            # Verify timeout
            self.assertEqual(config['Timeout'], 30, "Lambda timeout is incorrect")
            
            # Verify environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('TABLE_NAME', env_vars, "TABLE_NAME environment variable is missing")
            self.assertIn('BUCKET_NAME', env_vars, "BUCKET_NAME environment variable is missing")
            
            # Verify dead letter queue configuration
            dlq_config = config.get('DeadLetterConfig')
            self.assertIsNotNone(dlq_config, "Dead letter queue configuration is missing")
            
        except ClientError as e:
            self.fail(f"Failed to validate Lambda function: {e}")

    @mark.it("validates SQS dead letter queue exists")
    def test_sqs_dead_letter_queue_exists(self):
        """Test that the SQS dead letter queue exists"""
        queue_name = self.flat_outputs.get('DeadLetterQueueName')
        queue_arn = self.flat_outputs.get('DeadLetterQueueArn')
        
        self.assertIsNotNone(queue_name, "DeadLetterQueueName is missing in flat-outputs.json")
        self.assertIsNotNone(queue_arn, "DeadLetterQueueArn is missing in flat-outputs.json")

        try:
            # Extract queue URL from ARN
            queue_url = f"https://sqs.{queue_arn.split(':')[3]}.amazonaws.com/{queue_arn.split(':')[4]}/{queue_name}"
            
            # Get queue attributes
            response = sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['MessageRetentionPeriod']
            )
            
            # Verify retention period (14 days = 1209600 seconds)
            retention_period = int(response['Attributes']['MessageRetentionPeriod'])
            self.assertEqual(retention_period, 1209600, "SQS retention period is incorrect")
            
        except ClientError as e:
            self.fail(f"Failed to validate SQS dead letter queue: {e}")

    @mark.it("validates data persistence in DynamoDB")
    def test_dynamodb_data_operations(self):
        """Test direct DynamoDB operations"""
        table_name = self.flat_outputs.get('TableName')
        self.assertIsNotNone(table_name, "TableName is missing in flat-outputs.json")

        try:
            # Put a test item
            test_item = {
                'id': {'S': 'integration-test-item'},
                'data': {'S': 'Test data for integration'},
                'timestamp': {'S': '2024-01-01T00:00:00.000Z'}
            }
            
            dynamodb_client.put_item(TableName=table_name, Item=test_item)
            
            # Get the item back
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={'id': {'S': 'integration-test-item'}}
            )
            
            self.assertIn('Item', response, "Item not found in DynamoDB")
            retrieved_item = response['Item']
            self.assertEqual(
                retrieved_item['id']['S'], 
                'integration-test-item', 
                "Retrieved item ID doesn't match"
            )
            
            # Clean up - delete the test item
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={'id': {'S': 'integration-test-item'}}
            )
            
        except ClientError as e:
            self.fail(f"DynamoDB operations test failed: {e}")

    @mark.it("validates S3 bucket operations")
    def test_s3_bucket_operations(self):
        """Test S3 bucket operations"""
        bucket_name = self.flat_outputs.get('BucketName')
        self.assertIsNotNone(bucket_name, "BucketName is missing in flat-outputs.json")

        try:
            # Put a test object
            test_key = 'integration-test-file.txt'
            test_content = b'This is a test file for integration testing'
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType='text/plain'
            )
            
            # Get the object back
            response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            retrieved_content = response['Body'].read()
            
            self.assertEqual(
                retrieved_content, 
                test_content, 
                "Retrieved S3 object content doesn't match"
            )
            
            # Clean up - delete the test object
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            
        except ClientError as e:
            self.fail(f"S3 operations test failed: {e}")
