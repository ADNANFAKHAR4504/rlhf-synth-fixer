"""
test_tap_stack_integration.py

Integration tests for live deployed TAP Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using real deployment outputs.
"""

import unittest
import os
import json
import boto3
from datetime import datetime


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs and initialize AWS clients."""
        # Load outputs from deployment
        outputs_path = os.path.join(os.path.dirname(__file__), '../../cfn-outputs/flat-outputs.json')
        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Get region from environment or default
        cls.region = os.getenv('AWS_REGION', 'us-east-2')

        # Initialize AWS clients
        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.s3 = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)
        cls.apigateway = boto3.client('apigateway', region_name=cls.region)

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and has correct configuration."""
        table_name = self.outputs['dynamodb_table_name']

        # Describe table
        response = self.dynamodb.describe_table(TableName=table_name)
        table = response['Table']

        # Verify table exists
        self.assertEqual(table['TableName'], table_name)
        self.assertEqual(table['TableStatus'], 'ACTIVE')

        # Verify key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
        self.assertIn('transaction_id', key_schema)
        self.assertIn('timestamp', key_schema)

        # Verify stream is enabled
        self.assertIn('LatestStreamArn', table)
        self.assertTrue(table['LatestStreamArn'])

    def test_s3_bucket_exists(self):
        """Test that S3 audit bucket exists and has correct configuration."""
        bucket_name = self.outputs['s3_bucket_name']

        # Verify bucket exists
        response = self.s3.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify versioning is enabled
        versioning = self.s3.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

        # Verify encryption
        encryption = self.s3.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])

        # Verify public access block
        public_access = self.s3.get_public_access_block(Bucket=bucket_name)
        config = public_access['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist and are correctly configured."""
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'synth101000802')

        # Test webhook processor
        webhook_function = self.lambda_client.get_function(
            FunctionName=f'webhook-processor-{env_suffix}'
        )
        self.assertEqual(webhook_function['Configuration']['Runtime'], 'python3.9')
        self.assertIn('TABLE_NAME', webhook_function['Configuration']['Environment']['Variables'])

        # Test analytics processor
        analytics_function = self.lambda_client.get_function(
            FunctionName=f'analytics-processor-{env_suffix}'
        )
        self.assertEqual(analytics_function['Configuration']['Runtime'], 'python3.9')

        # Test archival function
        archival_function = self.lambda_client.get_function(
            FunctionName=f'archival-function-{env_suffix}'
        )
        self.assertEqual(archival_function['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(archival_function['Configuration']['Timeout'], 300)

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'synth101000802')

        alarm_names = [
            f'webhook-error-alarm-{env_suffix}',
            f'analytics-error-alarm-{env_suffix}',
            f'archival-error-alarm-{env_suffix}'
        ]

        # Verify alarms exist
        response = self.cloudwatch.describe_alarms(AlarmNames=alarm_names)
        self.assertEqual(len(response['MetricAlarms']), 3)

        for alarm in response['MetricAlarms']:
            self.assertEqual(alarm['Namespace'], 'AWS/Lambda')
            self.assertEqual(alarm['MetricName'], 'Errors')

    def test_api_key_exists(self):
        """Test that API key exists."""
        api_key_id = self.outputs['api_key_id']

        # Get API key
        response = self.apigateway.get_api_key(apiKey=api_key_id, includeValue=False)

        self.assertEqual(response['id'], api_key_id)
        self.assertTrue(response['enabled'])

    def test_end_to_end_data_flow(self):
        """Test complete data flow: write to DynamoDB, verify stream trigger potential."""
        table_name = self.outputs['dynamodb_table_name']

        # Write a test item to DynamoDB
        timestamp = int(datetime.utcnow().timestamp())
        test_transaction_id = f'test-{timestamp}'

        self.dynamodb.put_item(
            TableName=table_name,
            Item={
                'transaction_id': {'S': test_transaction_id},
                'timestamp': {'N': str(timestamp)},
                'amount': {'N': '100'},
                'status': {'S': 'test'}
            }
        )

        # Verify item was written
        response = self.dynamodb.get_item(
            TableName=table_name,
            Key={
                'transaction_id': {'S': test_transaction_id},
                'timestamp': {'N': str(timestamp)}
            }
        )

        self.assertIn('Item', response)
        self.assertEqual(response['Item']['transaction_id']['S'], test_transaction_id)
        self.assertEqual(response['Item']['status']['S'], 'test')

        # Clean up test item
        self.dynamodb.delete_item(
            TableName=table_name,
            Key={
                'transaction_id': {'S': test_transaction_id},
                'timestamp': {'N': str(timestamp)}
            }
        )
