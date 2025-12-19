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
        cls.s3_bucket_name = cls.outputs.get('S3BucketName', '')
        cls.secret_arn = cls.outputs.get('SecretArn', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.sns_topic_arn = cls.outputs.get('SNSTopicArn', '')

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3')
        cls.secrets_manager_client = boto3.client('secretsmanager')
        cls.lambda_client = boto3.client('lambda')
        cls.sns_client = boto3.client('sns')

    @mark.it("validates that the S3 bucket exists and is private")
    def test_s3_bucket_configuration(self):
        """Test that the S3 bucket exists and is private"""
        try:
            # Check if the bucket exists
            response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Validate bucket encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0, "No encryption rules found")
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')

            # Validate public access block
            public_access_block = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates that the Secrets Manager secret exists")
    def test_secrets_manager_secret(self):
        """Test that the Secrets Manager secret exists"""
        try:
            # Describe the secret
            response = self.secrets_manager_client.describe_secret(SecretId=self.secret_arn)
            self.assertEqual(response['ARN'], self.secret_arn)
        except ClientError as e:
            self.fail(f"Secrets Manager validation failed: {e}")

    @mark.it("validates that the SNS topic exists")
    def test_sns_topic(self):
        """Test that the SNS topic exists"""
        try:
            # Get the topic attributes
            response = self.sns_client.get_topic_attributes(TopicArn=self.sns_topic_arn)
            self.assertEqual(response['Attributes']['TopicArn'], self.sns_topic_arn)
        except ClientError as e:
            self.fail(f"SNS topic validation failed: {e}")

    @mark.it("validates that the Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that the Lambda function exists and has correct configuration"""
        try:
            # Get the Lambda function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            config = response['Configuration']

            # Validate function name and runtime
            self.assertEqual(config['FunctionName'], self.lambda_function_name)
            self.assertEqual(config['Runtime'], 'python3.8')

            # Validate environment variables
            env_vars = config['Environment']['Variables']
            self.assertIn('BUCKET_NAME', env_vars)
            self.assertIn('SECRET_ARN', env_vars)
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates the API Gateway endpoint")
    def test_api_gateway_endpoint(self):
        """Test the API Gateway endpoint"""
        import requests
        try:
            # Send a GET request to the API Gateway endpoint
            response = requests.get(f"{self.api_endpoint}/api/example", timeout=10)

            # Validate the response
            self.assertEqual(response.status_code, 200)
        except requests.RequestException as e:
            self.fail(f"API Gateway endpoint validation failed: {e}")