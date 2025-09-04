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

# Initialize boto3 clients
kms_client = boto3.client('kms')
dynamodb_client = boto3.client('dynamodb')
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')
apigateway_client = boto3.client('apigateway')
sns_client = boto3.client('sns')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def test_kms_key_exists(self):
        """Validate that the KMS key exists and is enabled"""
        kms_key_id = flat_outputs.get("KMSKeyId")
        self.assertIsNotNone(kms_key_id, "KMS Key ID is missing in outputs")

        try:
            response = kms_client.describe_key(KeyId=kms_key_id)
            self.assertTrue(response['KeyMetadata']['Enabled'], "KMS key is not enabled")
        except ClientError as e:
            self.fail(f"KMS key validation failed: {e}")

    def test_dynamodb_table_exists(self):
        """Validate that the DynamoDB table exists and has the correct configuration"""
        table_name = flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDB Table Name is missing in outputs")

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(response['Table']['TableStatus'], 'ACTIVE', "DynamoDB table is not active")
            self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST', "DynamoDB table is not using on-demand capacity")
        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    def test_s3_bucket_exists(self):
        """Validate that the S3 bucket exists and has versioning enabled"""
        bucket_name = flat_outputs.get("S3BucketName")
        self.assertIsNotNone(bucket_name, "S3 Bucket Name is missing in outputs")

        try:
            # Check if the bucket exists
            s3_client.head_bucket(Bucket=bucket_name)

            # Check if versioning is enabled
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(response.get('Status'), 'Enabled', "S3 bucket versioning is not enabled")
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    def test_lambda_function_exists(self):
        """Validate that the Lambda function exists and is configured correctly"""
        function_name = flat_outputs.get("LambdaFunctionName")
        self.assertIsNotNone(function_name, "Lambda Function Name is missing in outputs")

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.11', "Lambda function runtime is incorrect")
            self.assertEqual(response['Configuration']['Handler'], 'index.lambda_handler', "Lambda function handler is incorrect")
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    def test_api_gateway_exists(self):
        """Validate that the API Gateway exists and is accessible"""
        api_gateway_url = flat_outputs.get("APIGatewayURL")
        self.assertIsNotNone(api_gateway_url, "API Gateway URL is missing in outputs")

        try:
            # Make a simple GET request to the health endpoint
            import requests
            response = requests.get(f"{api_gateway_url}health")
            self.assertEqual(response.status_code, 200, "API Gateway health check failed")
            self.assertIn("Hello from TAP Lambda!", response.text, "Unexpected response from API Gateway")
        except Exception as e:
            self.fail(f"API Gateway validation failed: {e}")

    def test_sns_topic_exists(self):
        """Validate that the SNS topic exists"""
        sns_topic_arn = flat_outputs.get("SNSTopicArn")
        self.assertIsNotNone(sns_topic_arn, "SNS Topic ARN is missing in outputs")

        try:
            response = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
            self.assertIn('TopicArn', response['Attributes'], "SNS topic does not exist")
        except ClientError as e:
            self.fail(f"SNS topic validation failed: {e}")
