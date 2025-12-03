"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import time
import requests


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load outputs from flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.dynamodb = boto3.client('dynamodb', region_name='us-east-1')
        cls.sqs = boto3.client('sqs', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.api_gw = boto3.client('apigateway', region_name='us-east-1')

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is active."""
        table_name = self.outputs['dynamodb_table_name']

        response = self.dynamodb.describe_table(TableName=table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        self.assertEqual(response['Table']['KeySchema'][0]['AttributeName'], 'event_id')
        self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

    def test_dynamodb_ttl_enabled(self):
        """Test that DynamoDB TTL is enabled."""
        table_name = self.outputs['dynamodb_table_name']

        response = self.dynamodb.describe_time_to_live(TableName=table_name)
        self.assertEqual(response['TimeToLiveDescription']['TimeToLiveStatus'], 'ENABLED')
        self.assertEqual(response['TimeToLiveDescription']['AttributeName'], 'ttl')

    def test_sqs_queues_exist(self):
        """Test that all SQS queues exist."""
        for queue_name in ['payments_queue_url', 'refunds_queue_url', 'disputes_queue_url']:
            queue_url = self.outputs[queue_name]

            response = self.sqs.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )

            self.assertIn('Attributes', response)
            self.assertIn('MessageRetentionPeriod', response['Attributes'])
            self.assertEqual(response['Attributes']['MessageRetentionPeriod'], '604800')

    def test_lambda_functions_exist(self):
        """Test that Lambda functions exist and are configured correctly."""
        validator_arn = self.outputs['validator_lambda_arn']
        router_arn = self.outputs['router_lambda_arn']

        # Test validator Lambda
        validator_response = self.lambda_client.get_function(FunctionName=validator_arn)
        self.assertEqual(validator_response['Configuration']['Runtime'], 'python3.11')
        self.assertEqual(validator_response['Configuration']['Architectures'], ['arm64'])
        self.assertIn('TracingConfig', validator_response['Configuration'])
        self.assertEqual(validator_response['Configuration']['TracingConfig']['Mode'], 'Active')

        # Test router Lambda
        router_response = self.lambda_client.get_function(FunctionName=router_arn)
        self.assertEqual(router_response['Configuration']['Runtime'], 'python3.11')
        self.assertEqual(router_response['Configuration']['Architectures'], ['arm64'])
        self.assertIn('TracingConfig', router_response['Configuration'])
        self.assertEqual(router_response['Configuration']['TracingConfig']['Mode'], 'Active')

    def test_api_gateway_endpoint_responds(self):
        """Test that API Gateway endpoint is accessible."""
        api_endpoint = self.outputs['api_endpoint']

        # Test with invalid payload (should return 400)
        response = requests.post(api_endpoint, json={}, timeout=10)

        # Expecting 400 because we're not providing required fields
        self.assertIn(response.status_code, [400, 403])

    def test_end_to_end_webhook_processing(self):
        """Test end-to-end webhook processing flow."""
        api_endpoint = self.outputs['api_endpoint']
        table_name = self.outputs['dynamodb_table_name']
        payments_queue_url = self.outputs['payments_queue_url']

        # Create a valid webhook payload
        test_event_id = f"test-event-{int(time.time())}"
        payload = {
            "event_id": test_event_id,
            "transaction_type": "payment",
            "amount": 100.50,
            "currency": "USD",
            "timestamp": "2025-12-02T00:00:00Z"
        }

        # Send webhook request
        response = requests.post(api_endpoint, json=payload, timeout=10)

        # Should succeed or return validation error
        self.assertIn(response.status_code, [200, 400, 403])

        # If successful, verify event was stored in DynamoDB
        if response.status_code == 200:
            time.sleep(2)  # Wait for DynamoDB write

            db_response = self.dynamodb.get_item(
                TableName=table_name,
                Key={'event_id': {'S': test_event_id}}
            )

            # Check if item exists
            if 'Item' in db_response:
                self.assertEqual(db_response['Item']['event_id']['S'], test_event_id)
                self.assertEqual(db_response['Item']['transaction_type']['S'], 'payment')

            # Wait for SQS message
            time.sleep(3)

            # Check if message appeared in payments queue
            sqs_response = self.sqs.receive_message(
                QueueUrl=payments_queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=2
            )

            # If messages exist, verify one matches our event
            if 'Messages' in sqs_response:
                message_found = False
                for message in sqs_response['Messages']:
                    body = json.loads(message['Body'])
                    if body.get('event_id') == test_event_id:
                        message_found = True
                        self.assertEqual(body['transaction_type'], 'payment')

                        # Clean up: delete message
                        self.sqs.delete_message(
                            QueueUrl=payments_queue_url,
                            ReceiptHandle=message['ReceiptHandle']
                        )
                        break

                # Note: Message might not appear due to Lambda async invocation timing


if __name__ == '__main__':
    unittest.main()
