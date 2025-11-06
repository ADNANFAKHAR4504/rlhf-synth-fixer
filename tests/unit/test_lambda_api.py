"""
test_lambda_api.py

Unit tests for the API handler Lambda function using moto for AWS mocking.
"""

import unittest
import json
import os
import sys
from unittest.mock import patch
from moto import mock_aws
import boto3
from decimal import Decimal
import importlib


class TestApiHandlerLambda(unittest.TestCase):
    """Test cases for API handler Lambda function."""

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
        if 'lib.lambda.api_handler' in sys.modules:
            del sys.modules['lib.lambda.api_handler']

    @mock_aws
    def test_upload_endpoint_generates_presigned_url(self):
        """Test POST /upload generates presigned URL."""
        # Import module (environment variables already set in setUp)
        api_handler = importlib.import_module('lib.lambda.api_handler')
        handler = api_handler.handler

        # Setup mocked S3
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Setup mocked DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
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

        # Create API Gateway event
        event = {
            'path': '/upload',
            'httpMethod': 'POST',
            'headers': {},
            'body': None
        }

        # Reload module to pick up mocked AWS resources
        api_handler_module = importlib.import_module('lib.lambda.api_handler')
        importlib.reload(api_handler_module)
        handler = api_handler_module.handler

        # Execute handler
        result = handler(event, None)

        # Verify response
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertIn('upload_url', body)
        self.assertIn('filename', body)
        self.assertEqual(body['expires_in'], 900)

    @mock_aws
    def test_status_endpoint_returns_transaction(self):
        """Test GET /status/{transaction_id} returns transaction."""
        api_handler_module = importlib.import_module('lib.lambda.api_handler')
        handler = api_handler_module.handler

        # Setup mocked DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
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

        # Insert test transaction
        table.put_item(Item={
            'transaction_id': 'txn123',
            'timestamp': Decimal('1609459200'),
            'amount': Decimal('100.50'),
            'merchant_id': 'merchant456'
        })

        # Setup mocked S3
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Create API Gateway event
        event = {
            'path': '/status/txn123',
            'httpMethod': 'GET',
            'pathParameters': {'transaction_id': 'txn123'},
            'headers': {}
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module
            api_handler_module = importlib.import_module('lib.lambda.api_handler')
            importlib.reload(api_handler_module)
            handler = api_handler_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify response
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            self.assertIn('transaction', body)
            self.assertEqual(body['transaction']['transaction_id'], 'txn123')
            self.assertEqual(body['transaction']['amount'], 100.50)

    @mock_aws
    def test_status_endpoint_transaction_not_found(self):
        """Test GET /status/{transaction_id} when transaction doesn't exist."""
        api_handler_module = importlib.import_module('lib.lambda.api_handler')
        handler = api_handler_module.handler

        # Setup mocked DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
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

        # Setup mocked S3
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Create API Gateway event
        event = {
            'path': '/status/nonexistent',
            'httpMethod': 'GET',
            'pathParameters': {'transaction_id': 'nonexistent'},
            'headers': {}
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module
            api_handler_module = importlib.import_module('lib.lambda.api_handler')
            importlib.reload(api_handler_module)
            handler = api_handler_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify 404 response
            self.assertEqual(result['statusCode'], 404)
            body = json.loads(result['body'])
            self.assertIn('Transaction not found', body['message'])

    @mock_aws
    def test_invalid_endpoint_returns_404(self):
        """Test invalid endpoint returns 404."""
        api_handler_module = importlib.import_module('lib.lambda.api_handler')
        handler = api_handler_module.handler

        # Setup mocked services
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
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

        # Create API Gateway event for invalid path
        event = {
            'path': '/invalid',
            'httpMethod': 'GET',
            'headers': {}
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module
            api_handler_module = importlib.import_module('lib.lambda.api_handler')
            importlib.reload(api_handler_module)
            handler = api_handler_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify 404 response
            self.assertEqual(result['statusCode'], 404)
            body = json.loads(result['body'])
            self.assertIn('Not found', body['message'])

    @mock_aws
    def test_cors_headers_present(self):
        """Test that CORS headers are present in responses."""
        api_handler_module = importlib.import_module('lib.lambda.api_handler')
        handler = api_handler_module.handler

        # Setup mocked S3
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Setup mocked DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
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

        # Create API Gateway event
        event = {
            'path': '/upload',
            'httpMethod': 'POST',
            'headers': {},
            'body': None
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module
            api_handler_module = importlib.import_module('lib.lambda.api_handler')
            importlib.reload(api_handler_module)
            handler = api_handler_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify CORS headers
            self.assertEqual(result['statusCode'], 200)
            self.assertIn('headers', result)
            self.assertIn('Access-Control-Allow-Origin', result['headers'])

    @mock_aws
    def test_decimal_to_float_conversion(self):
        """Test that Decimal values are converted to float for JSON."""
        api_handler_module = importlib.import_module('lib.lambda.api_handler')
        handler = api_handler_module.handler

        # Setup mocked DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
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

        # Insert transaction with Decimal values
        table.put_item(Item={
            'transaction_id': 'txn789',
            'timestamp': Decimal('1609459200'),
            'amount': Decimal('999.99'),
            'merchant_id': 'merchant999'
        })

        # Setup mocked S3
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'test-transaction-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Create API Gateway event
        event = {
            'path': '/status/txn789',
            'httpMethod': 'GET',
            'pathParameters': {'transaction_id': 'txn789'},
            'headers': {}
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'S3_BUCKET': bucket_name,
            'DYNAMODB_TABLE': table_name
        }):
            # Reload module
            api_handler_module = importlib.import_module('lib.lambda.api_handler')
            importlib.reload(api_handler_module)
            handler = api_handler_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify response has float values (not Decimal)
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            # Should be able to JSON serialize (no Decimal error)
            self.assertIsInstance(body['transaction']['amount'], float)


if __name__ == '__main__':
    unittest.main()
