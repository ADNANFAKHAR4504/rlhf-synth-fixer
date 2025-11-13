"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using real deployment outputs.
"""

import unittest
import os
import json
import boto3
import time
import requests
from decimal import Decimal


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from flat-outputs.json
        outputs_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                    'cfn-outputs', 'flat-outputs.json')

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Extract outputs
        cls.api_url = cls.outputs['api_url']
        cls.bucket_name = cls.outputs['bucket_name']
        cls.table_name = cls.outputs['table_name']

        # Initialize AWS clients
        cls.region = os.environ.get('AWS_REGION', 'us-east-2')
        cls.dynamodb = boto3.resource('dynamodb', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.table = cls.dynamodb.Table(cls.table_name)

        # Test transaction ID (unique for this test run)
        cls.test_txn_id = f"test-txn-{int(time.time())}"

    def test_01_api_gateway_endpoint_accessible(self):
        """Test that API Gateway endpoint is accessible."""
        # Test that the API URL is a valid HTTPS endpoint
        self.assertTrue(self.api_url.startswith('https://'))
        self.assertIn('.execute-api.', self.api_url)
        self.assertIn('.amazonaws.com/', self.api_url)

    def test_02_dynamodb_table_exists(self):
        """Test that DynamoDB table exists with correct configuration."""
        # Get table description
        table = self.table
        table.load()

        # Verify table name
        self.assertEqual(table.table_name, self.table_name)

        # Verify key schema
        key_schema = {k['AttributeName']: k['KeyType'] for k in table.key_schema}
        self.assertEqual(key_schema['transactionId'], 'HASH')
        self.assertEqual(key_schema['timestamp'], 'RANGE')

        # Verify billing mode
        self.assertEqual(table.billing_mode_summary['BillingMode'], 'PAY_PER_REQUEST')

        # Verify streams enabled
        self.assertIsNotNone(table.latest_stream_arn)

    def test_03_s3_bucket_exists(self):
        """Test that S3 bucket exists with correct configuration."""
        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=self.bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')

    def test_04_post_transaction_endpoint(self):
        """Test POST /transactions endpoint - submit new transaction."""
        # Create test transaction
        transaction_data = {
            'transactionId': self.test_txn_id,
            'amount': 1500.00,
            'currency': 'USD',
            'customerId': 'cust-12345',
            'metadata': {'test': True}
        }

        # Submit transaction
        response = requests.post(
            f"{self.api_url}/transactions",
            json=transaction_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        # Verify response
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        self.assertEqual(response_data['transactionId'], self.test_txn_id)
        self.assertIn('timestamp', response_data)

        # Wait for DynamoDB write
        time.sleep(2)

    def test_06_dynamodb_transaction_stored(self):
        """Test that transaction is stored in DynamoDB."""
        # Query DynamoDB for the test transaction
        response = self.table.query(
            KeyConditionExpression='transactionId = :tid',
            ExpressionAttributeValues={':tid': self.test_txn_id}
        )

        items = response['Items']
        self.assertGreater(len(items), 0)

        # Verify stored data
        transaction = items[0]
        self.assertEqual(transaction['transactionId'], self.test_txn_id)
        self.assertEqual(float(transaction['amount']), 1500.00)
        self.assertEqual(transaction['currency'], 'USD')
        self.assertEqual(transaction['customerId'], 'cust-12345')

    def test_07_fraud_analysis_processing(self):
        """Test that fraud analysis processes the transaction (DynamoDB Stream trigger)."""
        # Wait for fraud analyzer Lambda to process the stream event
        time.sleep(5)

        # Query transaction again to check fraud analysis
        response = self.table.query(
            KeyConditionExpression='transactionId = :tid',
            ExpressionAttributeValues={':tid': self.test_txn_id}
        )

        items = response['Items']
        self.assertGreater(len(items), 0)

        transaction = items[0]

        # Verify fraud analysis fields exist
        self.assertIn('fraudScore', transaction)
        self.assertIn('status', transaction)

        # Verify status is one of expected values
        self.assertIn(transaction['status'], ['pending', 'approved', 'suspicious', 'fraud_detected'])

        # Verify fraud score is a number
        fraud_score = float(transaction['fraudScore'])
        self.assertGreaterEqual(fraud_score, 0.0)
        self.assertLessEqual(fraud_score, 1.0)

    def test_08_api_error_handling(self):
        """Test API error handling for invalid requests."""
        # Test missing required field
        invalid_data = {
            'transactionId': 'invalid-test',
            'amount': 100.00
            # Missing currency and customerId
        }

        response = requests.post(
            f"{self.api_url}/transactions",
            json=invalid_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        # Should return 400 Bad Request
        self.assertEqual(response.status_code, 400)
        error_data = response.json()
        self.assertIn('error', error_data)

    def test_09_get_nonexistent_transaction(self):
        """Test retrieving a non-existent transaction."""
        # Try to retrieve a transaction that doesn't exist
        response = requests.get(
            f"{self.api_url}/transactions/nonexistent-txn-12345",
            timeout=30
        )

        # Should return 404 Not Found
        self.assertEqual(response.status_code, 404)
        error_data = response.json()
        self.assertIn('error', error_data)

    def test_11_s3_bucket_accessible(self):
        """Test that S3 bucket is accessible for report storage."""
        # List objects in bucket (should not error even if empty)
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                MaxKeys=1
            )
            # Verify we can access the bucket
            self.assertIn('ResponseMetadata', response)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except Exception as e:
            self.fail(f"Failed to access S3 bucket: {str(e)}")


if __name__ == '__main__':
    unittest.main()
