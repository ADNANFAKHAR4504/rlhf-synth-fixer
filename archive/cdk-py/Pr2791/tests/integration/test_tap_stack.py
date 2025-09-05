import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load CloudFormation outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    raise FileNotFoundError(f"flat-outputs.json not found at {flat_outputs_path}")


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the deployed TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and stack outputs for all tests"""
        cls.region = 'us-west-2'

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)

        # Extract outputs from flat-outputs.json
        cls.bucket_name = flat_outputs.get('BucketName')
        cls.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        cls.lambda_function_arn = flat_outputs.get('LambdaFunctionArn')
        cls.sns_topic_arn = flat_outputs.get('SNSTopicArn')
        cls.dlq_url = flat_outputs.get('DLQUrl')
        cls.environment_suffix = flat_outputs.get('EnvironmentSuffix', 'dev')

        # Validate required outputs exist
        required_outputs = [cls.bucket_name, cls.lambda_function_name, cls.sns_topic_arn, cls.dlq_url]
        if not all(required_outputs):
            raise ValueError(f"Missing required CloudFormation outputs: {flat_outputs}")

    @mark.it("validates S3 bucket exists and has correct configuration")
    def test_s3_bucket_configuration(self):
        """Test that the S3 bucket is properly configured"""
        # Check bucket exists
        try:
            bucket_response = self.s3_client.head_bucket(Bucket=self.bucket_name)
            self.assertIsNotNone(bucket_response)
        except ClientError as e:
            self.fail(f"S3 bucket {self.bucket_name} does not exist: {e}")

        # Check versioning is enabled
        versioning_response = self.s3_client.get_bucket_versioning(Bucket=self.bucket_name)
        self.assertEqual(versioning_response.get('Status'), 'Enabled', "S3 bucket versioning should be enabled")

        # Check encryption is configured
        try:
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
            rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0, "S3 bucket should have encryption rules")
            self.assertIn('SSEAlgorithm', str(rules), "S3 bucket should have encryption algorithm")
        except ClientError as e:
            if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                self.fail(f"Unexpected error checking S3 encryption: {e}")

    @mark.it("validates Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that the Lambda function is properly configured"""
        try:
            # Get Lambda function configuration
            function_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            function_config = function_response['Configuration']

            # Assert basic configuration
            self.assertEqual(function_config['Runtime'], 'python3.9', "Lambda should use Python 3.9 runtime")
            self.assertEqual(function_config['Timeout'], 30, "Lambda timeout should be 30 seconds")
            self.assertEqual(function_config['MemorySize'], 512, "Lambda memory should be 512 MB")

            # Check environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('BUCKET_NAME', env_vars, "Lambda should have BUCKET_NAME env var")
            self.assertIn('SNS_TOPIC_ARN', env_vars, "Lambda should have SNS_TOPIC_ARN env var")
            self.assertEqual(env_vars['BUCKET_NAME'], self.bucket_name)
            self.assertEqual(env_vars['SNS_TOPIC_ARN'], self.sns_topic_arn)
        except ClientError as e:
            self.fail(f"Lambda function {self.lambda_function_name} not found or error: {e}")

    @mark.it("validates SNS topic exists and is accessible")
    def test_sns_topic_configuration(self):
        """Test that the SNS topic is properly configured"""
        try:
            topic_attributes = self.sns_client.get_topic_attributes(TopicArn=self.sns_topic_arn)
            self.assertIn('TopicArn', topic_attributes['Attributes'], "SNS topic should have a valid ARN")
        except ClientError as e:
            self.fail(f"SNS topic {self.sns_topic_arn} not found or error: {e}")

    @mark.it("validates SQS Dead Letter Queue exists and is accessible")
    def test_sqs_dlq_configuration(self):
        """Test that the SQS Dead Letter Queue is properly configured"""
        try:
            queue_attributes = self.sqs_client.get_queue_attributes(
                QueueUrl=self.dlq_url,
                AttributeNames=['All']
            )
            self.assertIn('QueueArn', queue_attributes['Attributes'], "SQS DLQ should have a valid ARN")
            self.assertEqual(
                int(queue_attributes['Attributes']['MessageRetentionPeriod']),
                1209600,  # 14 days in seconds
                "SQS DLQ should have a retention period of 14 days"
            )
        except ClientError as e:
            self.fail(f"SQS DLQ {self.dlq_url} not found or error: {e}")
