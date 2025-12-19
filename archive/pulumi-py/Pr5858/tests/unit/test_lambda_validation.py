"""
test_lambda_validation.py

Unit tests for the validation Lambda function using moto for AWS mocking.
"""

import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock
from moto import mock_aws
import boto3
import importlib


class TestValidationLambda(unittest.TestCase):
    """Test cases for validation Lambda function."""

    def setUp(self):
        """Set up test environment variables before each test."""
        # Set default environment variables for all tests
        self.env_patcher = patch.dict(os.environ, {
            'S3_BUCKET': 'test-transaction-bucket',
            'DYNAMODB_TABLE': 'test-transactions-table',
            'AWS_DEFAULT_REGION': 'us-east-1'
        })
        self.env_patcher.start()

    def tearDown(self):
        """Clean up after each test."""
        self.env_patcher.stop()
        # Unload the module so it can be freshly imported in the next test
        if 'lib.lambda.validation' in sys.modules:
            del sys.modules['lib.lambda.validation']

    @mock_aws
    def test_handler_processes_s3_event(self):
        """Test that handler processes S3 event correctly."""
        # Import after mocking
        validation_module = importlib.import_module('lib.lambda.validation')
        handler = validation_module.handler

        # Setup mocked AWS services
        s3 = boto3.client('s3', region_name='us-east-1')
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

        # Create S3 bucket
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Create DynamoDB table
        table_name = 'test-transactions-table'
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'transaction_id', 'KeyType': 'HASH'},
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'transaction_id', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # Upload test CSV file
        csv_content = """transaction_id,amount,merchant_id,card_number,timestamp
txn001,100.50,merchant123,4111111111111111,1609459200
txn002,250.75,merchant456,5500000000000004,1609459260"""

        s3.put_object(
            Bucket=bucket_name,
            Key='uploads/test.csv',
            Body=csv_content
        )

        # Create S3 event
        event = {
            'Records': [{
                's3': {
                    'bucket': {'name': bucket_name},
                    'object': {'key': 'uploads/test.csv'}
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module to pick up new environment variables
            validation_module = importlib.import_module('lib.lambda.validation')
            importlib.reload(validation_module)
            handler = validation_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify response
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            self.assertEqual(body['processed'], 2)
            self.assertEqual(body['errors'], 0)

            # Verify items in DynamoDB
            response = table.scan()
            self.assertEqual(len(response['Items']), 2)

    @mock_aws
    def test_handler_validates_csv_structure(self):
        """Test that handler validates CSV structure."""
        validation_module = importlib.import_module('lib.lambda.validation')
        handler = validation_module.handler

        # Setup mocked AWS services
        s3 = boto3.client('s3', region_name='us-east-1')
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

        # Create S3 bucket
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Create DynamoDB table
        table_name = 'test-transactions-table'
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'transaction_id', 'KeyType': 'HASH'},
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'transaction_id', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # Upload invalid CSV (missing required fields)
        csv_content = """transaction_id,amount
txn001,100.50"""

        s3.put_object(
            Bucket=bucket_name,
            Key='uploads/invalid.csv',
            Body=csv_content
        )

        # Create S3 event
        event = {
            'Records': [{
                's3': {
                    'bucket': {'name': bucket_name},
                    'object': {'key': 'uploads/invalid.csv'}
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module
            validation_module = importlib.import_module('lib.lambda.validation')
            importlib.reload(validation_module)
            handler = validation_module.handler

            # Execute handler
            result = handler(event, None)

            # Should handle gracefully (not crash)
            self.assertEqual(result['statusCode'], 200)

    @mock_aws
    def test_card_number_masking(self):
        """Test that card numbers are properly masked."""
        validation_module = importlib.import_module('lib.lambda.validation')
        handler = validation_module.handler

        # Setup mocked AWS services
        s3 = boto3.client('s3', region_name='us-east-1')
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

        # Create S3 bucket
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Create DynamoDB table
        table_name = 'test-transactions-table'
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'transaction_id', 'KeyType': 'HASH'},
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'transaction_id', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # Upload CSV with card number
        csv_content = """transaction_id,amount,merchant_id,card_number,timestamp
txn003,100.00,merchant789,4111111111111111,1609459200"""

        s3.put_object(
            Bucket=bucket_name,
            Key='uploads/cards.csv',
            Body=csv_content
        )

        # Create S3 event
        event = {
            'Records': [{
                's3': {
                    'bucket': {'name': bucket_name},
                    'object': {'key': 'uploads/cards.csv'}
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module
            validation_module = importlib.import_module('lib.lambda.validation')
            importlib.reload(validation_module)
            handler = validation_module.handler

            # Execute handler
            handler(event, None)

            # Verify card number is masked in DynamoDB
            response = table.scan()
            items = response['Items']
            self.assertEqual(len(items), 1)

            # Card number should be masked (last 4 digits only)
            card_number = items[0].get('card_number', items[0].get('card_last_four', ''))
            self.assertTrue(len(card_number) <= 4 or '****' in card_number or 'XXXX' in card_number)

    @mock_aws
    def test_error_handling_missing_bucket(self):
        """Test error handling when S3 bucket doesn't exist."""
        validation_module = importlib.import_module('lib.lambda.validation')
        handler = validation_module.handler

        # Create S3 event for non-existent bucket
        event = {
            'Records': [{
                's3': {
                    'bucket': {'name': 'non-existent-bucket'},
                    'object': {'key': 'uploads/test.csv'}
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': 'non-existent-bucket',
            'DYNAMODB_TABLE': 'test-table'
        }):
            # Reload module
            validation_module = importlib.import_module('lib.lambda.validation')
            importlib.reload(validation_module)
            handler = validation_module.handler

            # Execute handler
            result = handler(event, None)

            # Should return error status
            self.assertEqual(result['statusCode'], 500)
            body = json.loads(result['body'])
            self.assertIn('error', body)


if __name__ == '__main__':
    unittest.main()
