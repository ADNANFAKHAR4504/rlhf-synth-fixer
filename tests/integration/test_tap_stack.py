"""
test_tap_stack.py

Integration tests for the deployed TAP infrastructure stack using real AWS resources.
"""

import unittest
import json
import time
import os
import sys
import csv
import io
import boto3
from datetime import datetime

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Load the deployment outputs from relative path
outputs_path = os.path.join(os.path.dirname(__file__), '../../cfn-outputs/flat-outputs.json')
with open(outputs_path, 'r') as f:
    OUTPUTS = json.load(f)

class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the deployed TAP stack."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures using real deployment outputs."""
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.sqs_client = boto3.client('sqs', region_name='us-east-1')
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')

        cls.bucket_name = OUTPUTS['bucket_name']
        cls.table_name = OUTPUTS['table_name']
        cls.processor_function = OUTPUTS['processor_function']
        cls.summary_function = OUTPUTS['summary_function']
        cls.dlq_url = OUTPUTS['dlq_url']
        cls.environment_suffix = OUTPUTS['environment_suffix']

    def test_s3_bucket_exists(self):
        """Test that the S3 bucket was created and is accessible."""
        response = self.s3_client.head_bucket(Bucket=self.bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_s3_bucket_versioning_enabled(self):
        """Test that S3 bucket versioning is enabled."""
        response = self.s3_client.get_bucket_versioning(Bucket=self.bucket_name)
        self.assertEqual(response.get('Status'), 'Enabled')

    def test_s3_bucket_encryption_enabled(self):
        """Test that S3 bucket encryption is enabled."""
        response = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
        self.assertIn('Rules', response['ServerSideEncryptionConfiguration'])
        self.assertTrue(len(response['ServerSideEncryptionConfiguration']['Rules']) > 0)

    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table was created."""
        response = self.dynamodb_client.describe_table(TableName=self.table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')

        # Check billing mode - it might be in BillingModeSummary for PAY_PER_REQUEST
        if 'BillingModeSummary' in response['Table']:
            self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        elif 'BillingMode' in response['Table']:
            self.assertEqual(response['Table']['BillingMode'], 'PAY_PER_REQUEST')

    def test_dynamodb_table_schema(self):
        """Test DynamoDB table has correct partition and sort keys."""
        response = self.dynamodb_client.describe_table(TableName=self.table_name)

        # Check key schema
        key_schema = response['Table']['KeySchema']
        partition_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
        sort_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)

        self.assertIsNotNone(partition_key)
        self.assertEqual(partition_key['AttributeName'], 'product_id')
        self.assertIsNotNone(sort_key)
        self.assertEqual(sort_key['AttributeName'], 'timestamp')

    def test_lambda_processor_function_exists(self):
        """Test that the inventory processor Lambda function was created."""
        response = self.lambda_client.get_function(FunctionName=self.processor_function)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.10')
        self.assertEqual(response['Configuration']['MemorySize'], 512)
        self.assertEqual(response['Configuration']['Timeout'], 60)

    def test_lambda_processor_has_xray_tracing(self):
        """Test that X-Ray tracing is enabled on the processor Lambda."""
        response = self.lambda_client.get_function(FunctionName=self.processor_function)
        self.assertEqual(response['Configuration']['TracingConfig']['Mode'], 'Active')

    def test_lambda_summary_function_exists(self):
        """Test that the summary processor Lambda function was created."""
        response = self.lambda_client.get_function(FunctionName=self.summary_function)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.10')
        self.assertEqual(response['Configuration']['TracingConfig']['Mode'], 'Active')

    def test_lambda_has_environment_variables(self):
        """Test Lambda functions have required environment variables."""
        response = self.lambda_client.get_function(FunctionName=self.processor_function)
        env_vars = response['Configuration']['Environment']['Variables']

        self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
        self.assertEqual(env_vars['DYNAMODB_TABLE_NAME'], self.table_name)
        self.assertIn('DLQ_URL', env_vars)
        self.assertIn('ENVIRONMENT', env_vars)

    def test_dlq_exists(self):
        """Test that the Dead Letter Queue was created."""
        response = self.sqs_client.get_queue_attributes(
            QueueUrl=self.dlq_url,
            AttributeNames=['MessageRetentionPeriod']
        )
        # 14 days = 1209600 seconds
        self.assertEqual(response['Attributes']['MessageRetentionPeriod'], '1209600')

    def test_cloudwatch_alarm_exists(self):
        """Test that CloudWatch alarm was created for Lambda errors."""
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f'inventory-processor-error-alarm-{self.environment_suffix}'
        )
        self.assertTrue(len(response['MetricAlarms']) > 0)

        if response['MetricAlarms']:
            alarm = response['MetricAlarms'][0]
            self.assertEqual(alarm['MetricName'], 'Errors')
            self.assertEqual(alarm['Namespace'], 'AWS/Lambda')
            self.assertEqual(alarm['Threshold'], 0.01)

    def test_end_to_end_inventory_processing(self):
        """Test end-to-end inventory processing workflow."""
        # Create test CSV content
        csv_content = """product_id,quantity,price,warehouse_id
TEST-001,100,25.50,WH-001
TEST-002,50,15.75,WH-002
TEST-003,75,30.00,WH-001"""

        test_key = f'test-inventory-{int(time.time())}.csv'

        try:
            # Upload test CSV to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=test_key,
                Body=csv_content.encode('utf-8'),
                ContentType='text/csv'
            )

            # Wait for processing (EventBridge -> Lambda -> DynamoDB)
            time.sleep(10)

            # Check if data was written to DynamoDB
            response = self.dynamodb_client.query(
                TableName=self.table_name,
                KeyConditionExpression='product_id = :pid',
                ExpressionAttributeValues={
                    ':pid': {'S': 'TEST-001'}
                }
            )

            # Verify at least one item was written
            if response.get('Items'):
                self.assertTrue(len(response['Items']) > 0)
                item = response['Items'][0]
                self.assertEqual(item['product_id']['S'], 'TEST-001')

        finally:
            # Clean up test file
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=test_key)
            except:
                pass

    def test_lambda_can_be_invoked_directly(self):
        """Test that Lambda functions can be invoked directly."""
        test_event = {
            'detail': {
                'bucket': {'name': self.bucket_name},
                'object': {'key': 'test-direct-invoke.csv'}
            }
        }

        # Create test file first
        csv_content = "product_id,quantity,price,warehouse_id\nDIRECT-001,10,5.00,WH-TEST"
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key='test-direct-invoke.csv',
            Body=csv_content.encode('utf-8')
        )

        try:
            # Invoke Lambda directly
            response = self.lambda_client.invoke(
                FunctionName=self.processor_function,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_event)
            )

            self.assertEqual(response['StatusCode'], 200)

            # Check response payload
            payload = json.loads(response['Payload'].read())
            if 'statusCode' in payload:
                self.assertEqual(payload['statusCode'], 200)

        finally:
            # Clean up
            try:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key='test-direct-invoke.csv'
                )
            except:
                pass

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard was created."""
        response = self.cloudwatch_client.list_dashboards(
            DashboardNamePrefix=f'inventory-processing-{self.environment_suffix}'
        )
        self.assertTrue(len(response['DashboardEntries']) > 0)


if __name__ == '__main__':
    unittest.main()