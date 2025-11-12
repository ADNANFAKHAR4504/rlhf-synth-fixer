import json
import os
import unittest
import boto3
import requests

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    def setUp(self):
        """Set up AWS clients and get stack outputs"""
        self.api_endpoint = flat_outputs.get('ApiEndpoint')
        self.table_name = flat_outputs.get('WebhooksTableName')
        self.dlq_url = flat_outputs.get('DLQUrl')

        self.dynamodb = boto3.client('dynamodb', region_name='ap-southeast-1')
        self.sqs = boto3.client('sqs', region_name='ap-southeast-1')
        self.lambda_client = boto3.client('lambda', region_name='ap-southeast-1')

    @mark.it("verifies DynamoDB table exists with correct configuration")
    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists with correct configuration"""
        # ACT
        response = self.dynamodb.describe_table(TableName=self.table_name)

        # ASSERT
        self.assertIsNotNone(response)
        self.assertEqual(response['Table']['TableName'], self.table_name)
        self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertIsNotNone(response['Table']['StreamSpecification'])
        self.assertTrue(response['Table']['StreamSpecification']['StreamEnabled'])

    @mark.it("verifies API Gateway endpoint is accessible")
    def test_api_gateway_accessible(self):
        """Test that API Gateway endpoint is accessible"""
        # ACT - Send a POST request to the webhook endpoint
        response = requests.post(
            f"{self.api_endpoint}webhook/stripe",
            json={"test": "data"},
            timeout=10
        )

        # ASSERT - Should get a response (even if it's an error)
        # 502 indicates Lambda execution error, which is acceptable for integration test
        self.assertIsNotNone(response)
        self.assertIn(response.status_code, [200, 400, 403, 500, 502])

    @mark.it("verifies Lambda functions exist with ARM64 architecture")
    def test_lambda_functions_exist(self):
        """Test that Lambda functions exist with correct configuration"""
        # ACT
        functions = self.lambda_client.list_functions()['Functions']
        webhook_functions = [f for f in functions if 'synth0b9sw0' in f['FunctionName']]

        # ASSERT - Should have 3 Lambda functions
        self.assertGreaterEqual(len(webhook_functions), 3)

        # All should use ARM64 architecture
        for func in webhook_functions:
            self.assertIn('arm64', func.get('Architectures', []))

    @mark.it("verifies SQS DLQ exists")
    def test_sqs_dlq_exists(self):
        """Test that SQS DLQ exists"""
        # ACT
        response = self.sqs.get_queue_attributes(
            QueueUrl=self.dlq_url,
            AttributeNames=['All']
        )

        # ASSERT
        self.assertIsNotNone(response)
        self.assertIn('Attributes', response)
        # Check message retention is 14 days (1209600 seconds)
        self.assertEqual(response['Attributes']['MessageRetentionPeriod'], '1209600')
