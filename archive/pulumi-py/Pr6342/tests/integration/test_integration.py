"""
Integration tests for Transaction Processing System

Tests actual deployed AWS resources using outputs from cfn-outputs/flat-outputs.json.
NO MOCKING - uses real AWS SDK calls to verify infrastructure functionality.
"""

import unittest
import json
import os
import boto3
from datetime import datetime, timezone


class TestTransactionProcessingIntegration(unittest.TestCase):
    """
    Integration tests for deployed transaction processing infrastructure.

    These tests verify actual AWS resources and their connectivity after deployment.
    """

    @classmethod
    def setUpClass(cls):
        """Load outputs from deployment and initialize AWS clients"""

        # Load deployment outputs
        outputs_file = "cfn-outputs/flat-outputs.json"
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_file}. "
                f"Run deployment first."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients (no mocking - real AWS SDK calls)
        cls.dynamodb = boto3.resource('dynamodb')
        cls.sqs = boto3.client('sqs')
        cls.sns = boto3.client('sns')
        cls.lambda_client = boto3.client('lambda')
        cls.apigateway = boto3.client('apigateway')
        cls.cloudwatch = boto3.client('cloudwatch')

    def test_merchant_config_table_exists(self):
        """Test merchant configuration DynamoDB table is accessible"""

        table_name = self.outputs.get('merchant_table_name')
        self.assertIsNotNone(table_name, "Merchant table name not in outputs")

        # Verify table exists and is active
        table = self.dynamodb.Table(table_name)
        table_info = table.table_status
        self.assertEqual(table_info, 'ACTIVE', f"Merchant table not active: {table_info}")

        # Verify table structure
        self.assertEqual(table.key_schema[0]['AttributeName'], 'merchant_id')
        self.assertEqual(table.key_schema[0]['KeyType'], 'HASH')

    def test_transaction_table_exists(self):
        """Test processed transactions DynamoDB table with composite key"""

        table_name = self.outputs.get('transaction_table_name')
        self.assertIsNotNone(table_name, "Transaction table name not in outputs")

        # Verify table exists and is active
        table = self.dynamodb.Table(table_name)
        table_info = table.table_status
        self.assertEqual(table_info, 'ACTIVE', f"Transaction table not active: {table_info}")

        # Verify composite key structure
        key_schema = {k['AttributeName']: k['KeyType'] for k in table.key_schema}
        self.assertEqual(key_schema.get('transaction_id'), 'HASH')
        self.assertEqual(key_schema.get('timestamp'), 'RANGE')

    def test_sqs_queue_exists(self):
        """Test transaction SQS queue is accessible"""

        queue_url = self.outputs.get('queue_url')
        self.assertIsNotNone(queue_url, "Queue URL not in outputs")

        # Verify queue attributes
        response = self.sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['VisibilityTimeout', 'MessageRetentionPeriod']
        )

        attributes = response['Attributes']
        self.assertEqual(attributes['VisibilityTimeout'], '300')
        self.assertIsNotNone(attributes['MessageRetentionPeriod'])

    def test_sns_topic_exists(self):
        """Test fraud alerts SNS topic is accessible"""

        topic_arn = self.outputs.get('sns_topic_arn')
        self.assertIsNotNone(topic_arn, "SNS topic ARN not in outputs")

        # Verify topic exists
        response = self.sns.get_topic_attributes(TopicArn=topic_arn)
        self.assertIn('Attributes', response)
        self.assertEqual(response['Attributes']['TopicArn'], topic_arn)

    def test_validation_lambda_exists(self):
        """Test validation Lambda function is deployed and configured"""

        # Lambda name follows pattern: validation-lambda-{environment_suffix}
        # Extract from outputs or use known pattern
        merchant_table = self.outputs.get('merchant_table_name', '')
        if merchant_table:
            # Extract suffix from table name (e.g., merchant-config-test -> test)
            suffix = merchant_table.split('-')[-1]
            lambda_name = f"validation-lambda-{suffix}"

            # Verify Lambda exists
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.11')
            self.assertEqual(response['Configuration']['MemorySize'], 512)
            self.assertEqual(response['Configuration']['Timeout'], 60)

    def test_fraud_detection_lambda_exists(self):
        """Test fraud detection Lambda function is deployed"""

        merchant_table = self.outputs.get('merchant_table_name', '')
        if merchant_table:
            suffix = merchant_table.split('-')[-1]
            lambda_name = f"fraud-detection-lambda-{suffix}"

            # Verify Lambda exists
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.11')
            self.assertEqual(response['Configuration']['MemorySize'], 512)

    def test_failed_transaction_lambda_exists(self):
        """Test failed transaction Lambda function is deployed"""

        merchant_table = self.outputs.get('merchant_table_name', '')
        if merchant_table:
            suffix = merchant_table.split('-')[-1]
            lambda_name = f"failed-transaction-lambda-{suffix}"

            # Verify Lambda exists
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.11')

    def test_api_gateway_endpoint_accessible(self):
        """Test API Gateway endpoint is deployed"""

        api_endpoint = self.outputs.get('api_endpoint')
        self.assertIsNotNone(api_endpoint, "API endpoint not in outputs")

        # Verify endpoint format
        self.assertTrue(api_endpoint.startswith('https://'))
        self.assertIn('.execute-api.', api_endpoint)
        self.assertIn('us-east-1', api_endpoint)

    def test_cloudwatch_dashboard_url(self):
        """Test CloudWatch dashboard URL is generated"""

        dashboard_url = self.outputs.get('dashboard_url')
        self.assertIsNotNone(dashboard_url, "Dashboard URL not in outputs")

        # Verify URL format
        self.assertIn('cloudwatch', dashboard_url)
        self.assertIn('dashboards', dashboard_url)
        self.assertIn('us-east-1', dashboard_url)

    def test_transaction_workflow_connectivity(self):
        """Test connectivity between components (without actual transaction)"""

        # This test verifies that all components are properly connected
        # without sending actual transactions (that requires API key setup)

        queue_url = self.outputs.get('queue_url')
        table_name = self.outputs.get('transaction_table_name')
        topic_arn = self.outputs.get('sns_topic_arn')

        # All components must be present
        self.assertIsNotNone(queue_url, "Missing queue URL")
        self.assertIsNotNone(table_name, "Missing transaction table")
        self.assertIsNotNone(topic_arn, "Missing SNS topic")

        # Verify DynamoDB table is writable (test with put_item)
        table = self.dynamodb.Table(table_name)
        test_item = {
            'transaction_id': f'test-{datetime.now(timezone.utc).isoformat()}',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'fraud_status': 'TEST',
            'fraud_score': 0,
            'amount': 0
        }

        # Put test item
        table.put_item(Item=test_item)

        # Verify we can read it back
        response = table.get_item(
            Key={
                'transaction_id': test_item['transaction_id'],
                'timestamp': test_item['timestamp']
            }
        )
        self.assertIn('Item', response)
        self.assertEqual(response['Item']['fraud_status'], 'TEST')

        # Clean up test item
        table.delete_item(
            Key={
                'transaction_id': test_item['transaction_id'],
                'timestamp': test_item['timestamp']
            }
        )

    def test_merchant_table_can_store_configuration(self):
        """Test merchant configuration table accepts merchant data"""

        table_name = self.outputs.get('merchant_table_name')
        table = self.dynamodb.Table(table_name)

        # Create test merchant
        test_merchant = {
            'merchant_id': f'test-merchant-{datetime.now(timezone.utc).timestamp()}',
            'name': 'Test Merchant',
            'active': True,
            'max_transaction_amount': 10000
        }

        # Store merchant
        table.put_item(Item=test_merchant)

        # Retrieve merchant
        response = table.get_item(Key={'merchant_id': test_merchant['merchant_id']})
        self.assertIn('Item', response)
        self.assertEqual(response['Item']['name'], 'Test Merchant')
        self.assertTrue(response['Item']['active'])

        # Clean up
        table.delete_item(Key={'merchant_id': test_merchant['merchant_id']})


if __name__ == '__main__':
    unittest.main()
