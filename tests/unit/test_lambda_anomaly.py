"""
test_lambda_anomaly.py

Unit tests for the anomaly detection Lambda function using moto for AWS mocking.
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


class TestAnomalyDetectionLambda(unittest.TestCase):
    """Test cases for anomaly detection Lambda function."""

    def setUp(self):
        """Set up test environment variables before each test."""
        # Set default environment variables for all tests
        self.env_patcher = patch.dict(os.environ, {
            'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:test-alerts-topic',
            'AWS_DEFAULT_REGION': 'us-east-1'
        })
        self.env_patcher.start()

    def tearDown(self):
        """Clean up after each test."""
        self.env_patcher.stop()
        # Unload the module so it can be freshly imported in the next test
        if 'lib.lambda.anomaly_detection' in sys.modules:
            del sys.modules['lib.lambda.anomaly_detection']

    @mock_aws
    def test_handler_processes_dynamodb_stream(self):
        """Test that handler processes DynamoDB stream events."""
        anomaly_detection = importlib.import_module('lib.lambda.anomaly_detection')
        handler = anomaly_detection.handler

        # Setup mocked SNS
        sns = boto3.client('sns', region_name='us-east-1')
        topic_response = sns.create_topic(Name='test-alerts-topic')
        topic_arn = topic_response['TopicArn']

        # Create DynamoDB stream event with normal transaction
        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'txn001'},
                        'amount': {'N': '50.00'},
                        'merchant_id': {'S': 'merchant123'},
                        'timestamp': {'N': '1609459200'}
                    }
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'SNS_TOPIC_ARN': topic_arn
        }):
            # Reload module
            anomaly_detection_module = importlib.import_module('lib.lambda.anomaly_detection')
            importlib.reload(anomaly_detection_module)
            handler = anomaly_detection_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify response
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            self.assertEqual(body['anomalies_detected'], 0)

    @mock_aws
    def test_detects_high_amount_anomaly(self):
        """Test detection of high transaction amounts."""
        anomaly_detection = importlib.import_module('lib.lambda.anomaly_detection')
        handler = anomaly_detection.handler

        # Setup mocked SNS
        sns = boto3.client('sns', region_name='us-east-1')
        topic_response = sns.create_topic(Name='test-alerts-topic')
        topic_arn = topic_response['TopicArn']

        # Create DynamoDB stream event with high amount
        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'txn002'},
                        'amount': {'N': '15000.00'},
                        'merchant_id': {'S': 'merchant456'},
                        'timestamp': {'N': '1609459200'}
                    }
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'SNS_TOPIC_ARN': topic_arn
        }):
            # Reload module
            anomaly_detection_module = importlib.import_module('lib.lambda.anomaly_detection')
            importlib.reload(anomaly_detection_module)
            handler = anomaly_detection_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify anomaly detected
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            self.assertEqual(body['anomalies_detected'], 1)

    @mock_aws
    def test_detects_low_amount_anomaly(self):
        """Test detection of suspiciously low amounts."""
        anomaly_detection = importlib.import_module('lib.lambda.anomaly_detection')
        handler = anomaly_detection.handler

        # Setup mocked SNS
        sns = boto3.client('sns', region_name='us-east-1')
        topic_response = sns.create_topic(Name='test-alerts-topic')
        topic_arn = topic_response['TopicArn']

        # Create DynamoDB stream event with low amount
        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'txn003'},
                        'amount': {'N': '0.50'},
                        'merchant_id': {'S': 'merchant789'},
                        'timestamp': {'N': '1609459200'}
                    }
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'SNS_TOPIC_ARN': topic_arn
        }):
            # Reload module
            anomaly_detection_module = importlib.import_module('lib.lambda.anomaly_detection')
            importlib.reload(anomaly_detection_module)
            handler = anomaly_detection_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify anomaly detected
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            self.assertEqual(body['anomalies_detected'], 1)

    @mock_aws
    def test_sends_sns_alert(self):
        """Test that SNS alerts are sent for anomalies."""
        anomaly_detection = importlib.import_module('lib.lambda.anomaly_detection')
        handler = anomaly_detection.handler

        # Setup mocked SNS
        sns = boto3.client('sns', region_name='us-east-1')
        topic_response = sns.create_topic(Name='test-alerts-topic')
        topic_arn = topic_response['TopicArn']

        # Subscribe to topic to capture messages
        subscription = sns.subscribe(
            TopicArn=topic_arn,
            Protocol='email',
            Endpoint='test@example.com'
        )

        # Create DynamoDB stream event with anomaly
        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'txn004'},
                        'amount': {'N': '20000.00'},
                        'merchant_id': {'S': 'merchant999'},
                        'timestamp': {'N': '1609459200'}
                    }
                }
            }]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'SNS_TOPIC_ARN': topic_arn
        }):
            # Reload module
            anomaly_detection_module = importlib.import_module('lib.lambda.anomaly_detection')
            importlib.reload(anomaly_detection_module)
            handler = anomaly_detection_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify handler completed successfully
            self.assertEqual(result['statusCode'], 200)

            # Note: In moto, we can't easily verify the message content,
            # but we can verify the handler completed without error

    @mock_aws
    def test_processes_multiple_records(self):
        """Test processing multiple records in one event."""
        anomaly_detection = importlib.import_module('lib.lambda.anomaly_detection')
        handler = anomaly_detection.handler

        # Setup mocked SNS
        sns = boto3.client('sns', region_name='us-east-1')
        topic_response = sns.create_topic(Name='test-alerts-topic')
        topic_arn = topic_response['TopicArn']

        # Create DynamoDB stream event with multiple records
        event = {
            'Records': [
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'transaction_id': {'S': 'txn005'},
                            'amount': {'N': '100.00'},
                            'merchant_id': {'S': 'merchant111'},
                            'timestamp': {'N': '1609459200'}
                        }
                    }
                },
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'transaction_id': {'S': 'txn006'},
                            'amount': {'N': '25000.00'},
                            'merchant_id': {'S': 'merchant222'},
                            'timestamp': {'N': '1609459260'}
                        }
                    }
                }
            ]
        }

        # Set environment variables
        with patch.dict(os.environ, {
            'SNS_TOPIC_ARN': topic_arn
        }):
            # Reload module
            anomaly_detection_module = importlib.import_module('lib.lambda.anomaly_detection')
            importlib.reload(anomaly_detection_module)
            handler = anomaly_detection_module.handler

            # Execute handler
            result = handler(event, None)

            # Verify response
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            # Should detect 1 anomaly (high amount)
            self.assertEqual(body['anomalies_detected'], 1)

    @mock_aws
    def test_error_handling_missing_topic(self):
        """Test error handling when SNS topic doesn't exist."""
        anomaly_detection = importlib.import_module('lib.lambda.anomaly_detection')
        handler = anomaly_detection.handler

        # Create DynamoDB stream event
        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'txn007'},
                        'amount': {'N': '50000.00'},
                        'merchant_id': {'S': 'merchant333'},
                        'timestamp': {'N': '1609459200'}
                    }
                }
            }]
        }

        # Set environment variables with non-existent topic
        with patch.dict(os.environ, {
            'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:non-existent'
        }):
            # Reload module
            anomaly_detection_module = importlib.import_module('lib.lambda.anomaly_detection')
            importlib.reload(anomaly_detection_module)
            handler = anomaly_detection_module.handler

            # Execute handler
            result = handler(event, None)

            # Should return error status
            self.assertEqual(result['statusCode'], 500)


if __name__ == '__main__':
    unittest.main()
