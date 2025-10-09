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
        cls.dynamodb_table_name = cls.outputs.get('DynamoDBTableName', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.alarm_name = cls.outputs.get('CloudWatchAlarmName', '')
        cls.kms_key_arn = cls.outputs.get('KMSKeyArn', '')

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3')
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.kms_client = boto3.client('kms')

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
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')

            # Validate public access block
            public_access_block = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

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

            # Validate encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
            self.assertEqual(table['SSEDescription']['SSEType'], 'KMS')
        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

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
            self.assertEqual(env_vars['TABLE_NAME'], self.dynamodb_table_name)
            self.assertIn('BUCKET_NAME', env_vars)
            self.assertEqual(env_vars['BUCKET_NAME'], self.s3_bucket_name)
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates that the CloudWatch alarm exists")
    def test_cloudwatch_alarm(self):
        """Test that the CloudWatch alarm exists"""
        try:
            # Describe the alarm
            response = self.cloudwatch_client.describe_alarms(AlarmNames=[self.alarm_name])
            alarms = response['MetricAlarms']
            self.assertTrue(len(alarms) > 0, "No alarms found")
            self.assertEqual(alarms[0]['AlarmName'], self.alarm_name)
        except ClientError as e:
            self.fail(f"CloudWatch alarm validation failed: {e}")

    @mark.it("validates that the KMS key exists and is enabled")
    def test_kms_key_configuration(self):
        """Test that the KMS key exists and is enabled"""
        try:
            # Describe the KMS key
            response = self.kms_client.describe_key(KeyId=self.kms_key_arn)
            key_metadata = response['KeyMetadata']

            # Validate key status
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertTrue(key_metadata['Enabled'])
        except ClientError as e:
            self.fail(f"KMS key validation failed: {e}")

    @mark.it("validates the API Gateway endpoint")
    def test_api_gateway_endpoint(self):
        """Test the API Gateway endpoint"""
        import requests
        try:
            api_endpoint = self.api_endpoint+"items"
            print(f"Testing API Gateway endpoint: {api_endpoint}")
            # Send a GET request to the API Gateway endpoint
            response = requests.get(api_endpoint, timeout=10)

            # Validate the response
            self.assertEqual(response.status_code, 200)
            self.assertIn('application/json', response.headers['Content-Type'])
        except requests.RequestException as e:
            self.fail(f"API Gateway endpoint validation failed: {e}")
