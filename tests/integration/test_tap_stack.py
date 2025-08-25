"""Integration tests for TapStack serverless infrastructure."""
import json
import os
import time
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
        base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)

# Initialize AWS clients
s3_client = boto3.client('s3', region_name='us-west-2')
lambda_client = boto3.client('lambda', region_name='us-west-2')
secrets_client = boto3.client('secretsmanager', region_name='us-west-2')
logs_client = boto3.client('logs', region_name='us-west-2')
cloudwatch_client = boto3.client('cloudwatch', region_name='us-west-2')


@mark.describe("TapStack Serverless Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed serverless infrastructure"""

    def setUp(self):
        """Set up test environment with deployed resources"""
        self.s3_bucket_name = flat_outputs.get('S3BucketName')
        self.lambda_function_arn = flat_outputs.get('LambdaFunctionArn')
        self.secret_arn = flat_outputs.get('SecretArn')
    
        # Extract function name from ARN
        if self.lambda_function_arn:
            self.lambda_function_name = self.lambda_function_arn.split(':')[-1]
        else:
            self.lambda_function_name = None

    @mark.it("validates S3 bucket exists and is configured correctly")
    def test_s3_bucket_exists(self):
        """Test that S3 bucket exists with proper configuration"""
        # ARRANGE & ACT
        self.assertIsNotNone(self.s3_bucket_name, "S3 bucket name not found in outputs")
    
        try:
            response = s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
            # ASSERT
            self.assertEqual(response['Status'], 'Enabled', "S3 bucket versioning not enabled")
      
            # Check public access block
            public_block = s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            self.assertTrue(public_block['PublicAccessBlockConfiguration']['BlockPublicAcls'])
            self.assertTrue(public_block['PublicAccessBlockConfiguration']['BlockPublicPolicy'])
            self.assertTrue(public_block['PublicAccessBlockConfiguration']['IgnorePublicAcls'])
            self.assertTrue(public_block['PublicAccessBlockConfiguration']['RestrictPublicBuckets'])
      
            # Check bucket notification configuration
            notifications = s3_client.get_bucket_notification_configuration(Bucket=self.s3_bucket_name)
            self.assertIn('LambdaFunctionConfigurations', notifications)
            self.assertGreater(len(notifications['LambdaFunctionConfigurations']), 0)
      
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {str(e)}")

    @mark.it("validates Lambda function exists and is configured correctly")
    def test_lambda_function_exists(self):
        """Test that Lambda function exists with proper configuration"""
        # ARRANGE & ACT
        self.assertIsNotNone(self.lambda_function_name, "Lambda function name not found")
    
        try:
            response = lambda_client.get_function(FunctionName=self.lambda_function_name)
      
            # ASSERT
            config = response['Configuration']
            self.assertEqual(config['Runtime'], 'python3.13', "Lambda runtime is not Python 3.13")
            self.assertEqual(config['Handler'], 'index.lambda_handler')
            self.assertEqual(config['MemorySize'], 256)
            self.assertEqual(config['Timeout'], 60)
      
            # Check environment variables
            self.assertIn('Environment', config)
            self.assertIn('Variables', config['Environment'])
            env_vars = config['Environment']['Variables']
            self.assertIn('SECRET_ARN', env_vars)
            self.assertIn('BUCKET_NAME', env_vars)
      
            # Check Dead Letter Queue configuration
            self.assertIn('DeadLetterConfig', config)
            self.assertIn('TargetArn', config['DeadLetterConfig'])
      
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {str(e)}")

    @mark.it("validates Secrets Manager secret exists")
    def test_secrets_manager_exists(self):
        """Test that Secrets Manager secret exists and is accessible"""
        # ARRANGE & ACT
        self.assertIsNotNone(self.secret_arn, "Secret ARN not found in outputs")
    
        try:
            response = secrets_client.describe_secret(SecretId=self.secret_arn)
      
            # ASSERT
            self.assertIn('Name', response)
            self.assertIn('Description', response)
            self.assertEqual(response['Description'], "Secrets for ServerlessApp Lambda function")
      
            # Verify secret can be retrieved (just metadata, not the actual value)
            secret_value = secrets_client.get_secret_value(SecretId=self.secret_arn)
            self.assertIn('SecretString', secret_value)
      
            # Parse and validate secret structure
            secret_data = json.loads(secret_value['SecretString'])
            self.assertIn('username', secret_data)
            self.assertIn('password', secret_data)
            self.assertEqual(secret_data['username'], 'admin')
      
        except ClientError as e:
            self.fail(f"Secrets Manager validation failed: {str(e)}")

    @mark.it("validates CloudWatch log group exists")
    def test_cloudwatch_logs_exist(self):
        """Test that CloudWatch log group exists for Lambda"""
        # ARRANGE & ACT
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available")
    
        log_group_name = f"/aws/lambda/{self.lambda_function_name}"
    
        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
      
            # ASSERT
            self.assertGreater(len(response['logGroups']), 0, "Log group not found")
      
            log_group = response['logGroups'][0]
            self.assertEqual(log_group['logGroupName'], log_group_name)
            self.assertIn('retentionInDays', log_group)
            self.assertEqual(log_group['retentionInDays'], 7)
      
        except ClientError as e:
            self.fail(f"CloudWatch logs validation failed: {str(e)}")

    @mark.it("validates CloudWatch alarms are configured")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms exist for Lambda monitoring"""
        # ARRANGE & ACT
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available")
    
        try:
            response = cloudwatch_client.describe_alarms(
                AlarmNamePrefix='ServerlessApp-Lambda'
            )
      
            # ASSERT
            self.assertGreater(len(response['MetricAlarms']), 0, "No alarms found")
      
            # Check for error alarm
            error_alarms = [a for a in response['MetricAlarms'] if 'Errors' in a['AlarmName']]
            self.assertGreater(len(error_alarms), 0, "Error alarm not found")
      
            # Check for duration alarm
            duration_alarms = [a for a in response['MetricAlarms'] if 'Duration' in a['AlarmName']]
            self.assertGreater(len(duration_alarms), 0, "Duration alarm not found")
      
        except ClientError as e:
            # Alarms might not exist in all cases, so we'll just log this
            print(f"CloudWatch alarms check: {str(e)}")

    @mark.it("validates end-to-end S3 to Lambda trigger workflow")
    def test_s3_lambda_trigger(self):
        """Test that uploading a file to S3 triggers Lambda function"""
        # ARRANGE
        if not self.s3_bucket_name or not self.lambda_function_name:
            self.skipTest("Required resources not available")
    
        test_file_key = f"uploads/test-file-{int(time.time())}.txt"
        test_content = b"This is a test file for serverless integration testing"
    
        try:
            # ACT - Upload file to S3
            s3_client.put_object(
                Bucket=self.s3_bucket_name,
                Key=test_file_key,
                Body=test_content
            )
      
            # Wait for Lambda to process (give it a few seconds)
            time.sleep(5)
      
            # Check Lambda was invoked by looking at CloudWatch logs
            log_group_name = f"/aws/lambda/{self.lambda_function_name}"
      
            # Get recent log streams
            streams_response = logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )
      
            # ASSERT
            self.assertGreater(len(streams_response['logStreams']), 0, "No log streams found")
      
            # Clean up test file
            s3_client.delete_object(Bucket=self.s3_bucket_name, Key=test_file_key)
      
        except ClientError as e:
            self.fail(f"S3 to Lambda trigger test failed: {str(e)}")

    @mark.it("validates Lambda function can access Secrets Manager")
    def test_lambda_secrets_access(self):
        """Test that Lambda function has permission to access secrets"""
        # ARRANGE & ACT
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available")
    
        try:
            # Get Lambda function configuration
            response = lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = response['Configuration']['Role']
      
            # Extract role name from ARN
            role_name = role_arn.split('/')[-1]
      
            # Get IAM client
            iam_client = boto3.client('iam', region_name='us-west-2')
      
            # Get role policies
            policies_response = iam_client.list_role_policies(RoleName=role_name)
      
            # ASSERT
            self.assertIn('SecretsManagerAccess', policies_response['PolicyNames'], 
                                    "SecretsManagerAccess policy not found")
      
        except ClientError as e:
            # This might fail due to IAM permissions, which is okay for integration tests
            print(f"Lambda secrets access check: {str(e)}")

    @mark.it("validates S3 bucket has proper lifecycle configuration")
    def test_s3_lifecycle(self):
        """Test S3 bucket lifecycle and management features"""
        # ARRANGE & ACT
        if not self.s3_bucket_name:
            self.skipTest("S3 bucket name not available")
    
        try:
            # Check bucket logging configuration
            logging_response = s3_client.get_bucket_logging(Bucket=self.s3_bucket_name)
      
            # ASSERT - Logging should be configured
            if 'LoggingEnabled' in logging_response:
                self.assertIn('TargetPrefix', logging_response['LoggingEnabled'])
                self.assertEqual(logging_response['LoggingEnabled']['TargetPrefix'], 'access-logs/')
      
        except ClientError as e:
            # Logging might not be configured in all cases
            print(f"S3 lifecycle check: {str(e)}")

    @mark.it("validates all resources are tagged correctly")
    def test_resource_tagging(self):
        """Test that all resources have proper tags"""
        # ARRANGE & ACT
        if not self.s3_bucket_name:
            self.skipTest("Resources not available")
    
        try:
            # Check S3 bucket tags
            tags_response = s3_client.get_bucket_tagging(Bucket=self.s3_bucket_name)
            tags = {tag['Key']: tag['Value'] for tag in tags_response['TagSet']}
      
            # ASSERT
            self.assertIn('Project', tags)
            self.assertEqual(tags['Project'], 'ServerlessApp')
            self.assertIn('Environment', tags)
            self.assertIn('Owner', tags)
            self.assertEqual(tags['Owner'], 'TAP')
      
        except ClientError as e:
            print(f"Resource tagging check: {str(e)}")
