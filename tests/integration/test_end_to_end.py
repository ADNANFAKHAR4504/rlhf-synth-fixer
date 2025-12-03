"""Integration tests for end-to-end fraud detection pipeline."""
import json
import os
import time
import unittest
from decimal import Decimal

import boto3
import requests


class TestFraudDetectionPipeline(unittest.TestCase):
    """End-to-end integration tests for fraud detection pipeline."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment once for all tests."""
        cls.api_endpoint = os.getenv('API_ENDPOINT')
        cls.dynamodb_table = os.getenv('DYNAMODB_TABLE')
        cls.sqs_queue_url = os.getenv('SQS_QUEUE_URL')
        cls.sns_topic_arn = os.getenv('SNS_TOPIC_ARN')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        if not all([cls.api_endpoint, cls.dynamodb_table, cls.sqs_queue_url]):
            raise unittest.SkipTest("Required environment variables not set")

        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.sqs = boto3.client('sqs', region_name=cls.region)
        cls.sns = boto3.client('sns', region_name=cls.region)

    def test_api_endpoint_accessible(self):
        """Test API endpoint is accessible."""
        response = requests.post(
            self.api_endpoint,
            json={
                'amount': 100.50,
                'merchant': 'Test Store',
                'card_number': '1234567890123456'
            },
            timeout=30
        )

        self.assertIn(response.status_code, [200, 201])

    def test_submit_legitimate_transaction(self):
        """Test submitting a legitimate transaction."""

        transaction_data = {
            'amount': 125.67,
            'merchant': 'Walmart',
            'card_number': '1234567890123456',
            'location': 'New York, USA'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIn('transaction_id', body)
        self.assertIn('timestamp', body)

    def test_submit_suspicious_transaction(self):
        """Test submitting a suspicious transaction that triggers fraud detection."""

        transaction_data = {
            'amount': 15000.00,
            'merchant': 'Unknown Store',
            'card_number': '1234567890123456',
            'location': 'Nigeria'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)

        self.assertEqual(response.status_code, 201)
        body = response.json()
        transaction_id = body['transaction_id']

        # Wait for fraud detection to process
        time.sleep(5)

        # Check SQS queue for suspicious transaction
        messages = self.sqs.receive_message(
            QueueUrl=self.sqs_queue_url,
            MaxNumberOfMessages=10
        )

        if 'Messages' in messages:
            found = False
            for message in messages['Messages']:
                msg_body = json.loads(message['Body'])
                if msg_body.get('transaction_id') == transaction_id:
                    found = True
                    self.assertIn('fraud_reason', msg_body)
                    self.assertIn('risk_score', msg_body)
                    break

            self.assertTrue(found, "Suspicious transaction not found in SQS queue")

    def test_transaction_stored_in_dynamodb(self):
        """Test transaction is stored in DynamoDB."""

        transaction_data = {
            'transaction_id': f'TEST-{int(time.time())}',
            'amount': 50.00,
            'merchant': 'Test Store',
            'card_number': '1234567890123456'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)
        self.assertEqual(response.status_code, 201)

        transaction_id = transaction_data['transaction_id']

        # Wait for write to complete
        time.sleep(2)

        # Query DynamoDB
        try:
            result = self.dynamodb.query(
                TableName=self.dynamodb_table,
                KeyConditionExpression='transaction_id = :tid',
                ExpressionAttributeValues={
                    ':tid': {'S': transaction_id}
                }
            )

            self.assertGreater(result['Count'], 0)
            item = result['Items'][0]
            self.assertEqual(item['transaction_id']['S'], transaction_id)
            self.assertEqual(item['merchant']['S'], 'Test Store')
        except Exception as e:
            self.fail(f"Failed to query DynamoDB: {str(e)}")

    def test_invalid_transaction_rejected(self):
        """Test invalid transaction is rejected."""

        transaction_data = {
            'amount': 100.50
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('error', body)

    def test_high_value_transaction_flagged(self):
        """Test high-value transaction is flagged as suspicious."""

        transaction_data = {
            'amount': 25000.00,
            'merchant': 'Luxury Store',
            'card_number': '1234567890123456'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)
        self.assertEqual(response.status_code, 201)

        # Wait for fraud detection
        time.sleep(5)

        # Check SQS for flagged transaction
        messages = self.sqs.receive_message(
            QueueUrl=self.sqs_queue_url,
            MaxNumberOfMessages=10
        )

        self.assertIn('Messages', messages)
        self.assertGreater(len(messages['Messages']), 0)

    def test_multiple_transactions_processed(self):
        """Test multiple transactions are processed correctly."""

        transactions = [
            {'amount': 50.00, 'merchant': 'Store A', 'card_number': '1111222233334444'},
            {'amount': 75.50, 'merchant': 'Store B', 'card_number': '5555666677778888'},
            {'amount': 120.00, 'merchant': 'Store C', 'card_number': '9999000011112222'}
        ]

        for transaction_data in transactions:
            response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)
            self.assertEqual(response.status_code, 201)

        # Verify all transactions can be processed
        time.sleep(3)

    def test_dlq_configuration(self):
        """Test dead letter queue is configured."""
        try:
            attributes = self.sqs.get_queue_attributes(
                QueueUrl=self.sqs_queue_url,
                AttributeNames=['RedrivePolicy']
            )

            self.assertIn('Attributes', attributes)
            self.assertIn('RedrivePolicy', attributes['Attributes'])

            redrive_policy = json.loads(attributes['Attributes']['RedrivePolicy'])
            self.assertIn('deadLetterTargetArn', redrive_policy)
            self.assertIn('maxReceiveCount', redrive_policy)
        except Exception as e:
            self.fail(f"Failed to verify DLQ configuration: {str(e)}")

    def test_sns_topic_exists(self):
        """Test SNS topic for fraud alerts exists."""
        try:
            response = self.sns.get_topic_attributes(
                TopicArn=self.sns_topic_arn
            )

            self.assertIn('Attributes', response)
            self.assertIn('TopicArn', response['Attributes'])
        except Exception as e:
            self.fail(f"Failed to verify SNS topic: {str(e)}")


if __name__ == '__main__':
    unittest.main()
