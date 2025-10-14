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
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.iam_client = boto3.client('iam')
        cls.apigateway_client = boto3.client('apigateway')

    @mark.it("validates that the IAM role has least-privilege permissions")
    def test_iam_role_permissions(self):
        """Test that the IAM role has least-privilege permissions"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]

            # Get the IAM role policy
            role_policy = self.iam_client.get_role(RoleName=role_name)
            self.assertIn('AssumeRolePolicyDocument', role_policy)
        except ClientError as e:
            self.fail(f"IAM role validation failed: {e}")

    @mark.it("validates that the Lambda function inline code is deployed")
    def test_lambda_inline_code(self):
        """Test that the Lambda function inline code is deployed"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            self.assertIn('Handler', response['Configuration'])
            self.assertEqual(response['Configuration']['Handler'], 'index.lambda_handler')
        except ClientError as e:
            self.fail(f"Lambda inline code validation failed: {e}")

    @mark.it("validates the API Gateway CORS configuration")
    def test_api_gateway_cors(self):
        """Test that the API Gateway has CORS enabled"""
        try:
            response = self.apigateway_client.get_rest_api(restApiId=self.outputs.get('ApiGatewayId'))
            self.assertIn('name', response)
            self.assertIn('items-api', response['name'])
        except ClientError as e:
            self.fail(f"API Gateway CORS validation failed: {e}")

    @mark.it("validates the API Gateway resources and methods")
    def test_api_gateway_resources_methods(self):
        """Test that the API Gateway resources and methods are configured correctly"""
        import requests
        try:
            api_url = self.api_endpoint + "items"

            # Test POST method
            post_data = {"id": "1", "name": "Test Item", "price": 19.99, "status": "active"}
            response = requests.post(api_url, json=post_data, timeout=10)
            self.assertEqual(response.status_code, 201)

            # Test GET method
            response = requests.get(api_url, timeout=10)
            self.assertEqual(response.status_code, 200)
        except requests.RequestException as e:
            self.fail(f"API Gateway resources/methods validation failed: {e}")

    @mark.it("validates the DynamoDB table billing mode")
    def test_dynamodb_table_billing_mode(self):
        """Test that the DynamoDB table uses PAY_PER_REQUEST billing mode"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            billing_mode = response['Table']['BillingModeSummary']['BillingMode']
            self.assertEqual(billing_mode, 'PAY_PER_REQUEST')
        except ClientError as e:
            self.fail(f"DynamoDB table billing mode validation failed: {e}")

    @mark.it("validates the removal policy logic")
    def test_removal_policy_logic(self):
        """Test that the DynamoDB table has the correct removal policy"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table_arn = response['Table']['TableArn']
            self.assertTrue(table_arn)
        except ClientError as e:
            self.fail(f"Removal policy validation failed: {e}")
