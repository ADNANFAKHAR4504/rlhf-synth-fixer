import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load the CloudFormation outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resource information from outputs"""
        cls.outputs = flat_outputs

        # Extract resource information from outputs
        cls.api_endpoint = cls.outputs.get('ApiEndpoint', '')
        cls.dynamodb_table_name = cls.outputs.get('TableName', '')
        cls.dlq_url = cls.outputs.get('DLQUrl', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.api_gateway_id = cls.outputs.get('ApiGatewayId', '')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.sqs_client = boto3.client('sqs')
        cls.lambda_client = boto3.client('lambda')
        cls.apigateway_client = boto3.client('apigateway')

    @mark.it("validates that the DynamoDB table exists and has correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that the DynamoDB table exists and has correct configuration"""
        try:
            # Describe the table
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']

            # Validate table name and status
            self.assertEqual(table['TableName'], self.dynamodb_table_name)
            self.assertEqual(table['TableStatus'], 'ACTIVE')

            # Validate billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Validate stream configuration
            self.assertEqual(table['StreamSpecification']['StreamViewType'], 'NEW_AND_OLD_IMAGES')
        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    @mark.it("validates that the SQS Dead Letter Queue exists and has correct configuration")
    def test_sqs_dlq_configuration(self):
        """Test that the SQS Dead Letter Queue exists and has correct configuration"""
        try:
            # Get the queue attributes
            response = self.sqs_client.get_queue_attributes(QueueUrl=self.dlq_url, AttributeNames=['All'])
            attributes = response.get('Attributes', {})

            # Validate retention period and visibility timeout
            self.assertEqual(int(attributes.get('MessageRetentionPeriod', 0)), 1209600)  # 14 days in seconds
            self.assertEqual(int(attributes.get('VisibilityTimeout', 0)), 300)  # 5 minutes in seconds
        except ClientError as e:
            self.fail(f"SQS Dead Letter Queue validation failed: {e}")

    @mark.it("validates that the Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that the Lambda function exists and has correct configuration"""
        try:
            # Get the Lambda function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            config = response['Configuration']

            # Validate function name and runtime
            self.assertEqual(config['FunctionName'], self.lambda_function_name)
            self.assertEqual(config['Runtime'], 'python3.9')

            # Validate environment variables
            env_vars = config['Environment']['Variables']
            self.assertIn('TABLE_NAME', env_vars)
            self.assertIn('DLQ_URL', env_vars)
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates the API Gateway endpoint")
    def test_api_gateway_endpoint(self):
        """Test the API Gateway endpoint"""
        import requests
        try:
            # Send a POST request to the API Gateway endpoint
            response = requests.post(self.api_endpoint, json={"test": "data"}, timeout=10)

            # Validate the response
            self.assertEqual(response.status_code, 200)
            self.assertIn('application/json', response.headers['Content-Type'])
        except requests.RequestException as e:
            self.fail(f"API Gateway endpoint validation failed: {e}")
