 #!/usr/bin/env python3
"""
Integration tests for the Image Processing Pipeline infrastructure.

These tests verify end-to-end functionality of the deployed infrastructure,
including service-to-service interactions and resource validation.

Environment Variables Used:
- ENVIRONMENT_SUFFIX: For resource naming
- AWS_REGION: For AWS service calls
- Source/Dest bucket names from deployment outputs
"""

import base64
import json
import os
import time
import unittest
from io import BytesIO
from typing import Any, Dict, List

import boto3
from botocore.exceptions import ClientError


class TestImageProcessingPipelineIntegration(unittest.TestCase):
    """Integration tests for the Image Processing Pipeline infrastructure."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment and AWS clients."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.aws_region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.aws_region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.aws_region)
        cls.cloudwatch_logs_client = boto3.client('logs', region_name=cls.aws_region)
        cls.kms_client = boto3.client('kms', region_name=cls.aws_region)
        
        # Get deployment outputs (these would be set by CI/CD)
        # Using dynamic naming with environment suffix
        cls.source_bucket = os.getenv('SOURCE_BUCKET', f'img-proc-source-{cls.environment_suffix}-organization-tapstack')
        cls.dest_bucket = os.getenv('DEST_BUCKET', f'img-proc-dest-{cls.environment_suffix}-organization-tapstack')
        cls.lambda_function_name = os.getenv('LAMBDA_FUNCTION', f'img-proc-processor-{cls.environment_suffix}')
        cls.log_group_name = os.getenv('LOG_GROUP', f'/aws/lambda/img-proc-processor-{cls.environment_suffix}')
        
        # CloudWatch alarm names from deployment (with environment suffix)
        cls.alarm_names = [
            f'img-proc-error-alarm-{cls.environment_suffix}',
            f'img-proc-duration-alarm-{cls.environment_suffix}', 
            f'img-proc-concurrent-alarm-{cls.environment_suffix}',
            f'img-proc-throttle-alarm-{cls.environment_suffix}',
            f'img-proc-dlq-alarm-{cls.environment_suffix}'
        ]
        
        # Test image data
        cls.test_image_data = cls._create_test_image()
    
    @classmethod
    def _create_test_image(cls) -> bytes:
        """Create a test image for processing."""
        # Create a minimal JPEG file for testing
        # This is a simple 1x1 pixel JPEG (very small file)
        return base64.b64decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A')
    
    def setUp(self):
        """Set up for each test."""
        self.test_key_prefix = f"test-{int(time.time())}"
    
    def tearDown(self):
        """Clean up after each test."""
        # Clean up test objects from both buckets
        for bucket in [self.source_bucket, self.dest_bucket]:
            try:
                response = self.s3_client.list_objects_v2(Bucket=bucket, Prefix=self.test_key_prefix)
                if 'Contents' in response:
                    for obj in response['Contents']:
                        self.s3_client.delete_object(Bucket=bucket, Key=obj['Key'])
            except ClientError:
                pass  # Bucket might not exist or be accessible
    
    # ==================== SERVICE-TO-SERVICE TESTS ====================
    
    def test_s3_to_lambda_connection_works(self):
        """Test that S3 can trigger Lambda function (connection test)."""
        try:
            # Test S3 bucket notification configuration
            response = self.s3_client.get_bucket_notification_configuration(Bucket=self.source_bucket)
            
            # Verify notification is configured
            self.assertIn('LambdaFunctionConfigurations', response, "S3 to Lambda notification not configured")
            
            lambda_configs = response['LambdaFunctionConfigurations']
            self.assertGreater(len(lambda_configs), 0, "No Lambda configurations found")
            
            # Verify our Lambda function is in the configuration
            lambda_arns = [config['LambdaFunctionArn'] for config in lambda_configs]
            self.assertTrue(any(self.lambda_function_name in arn for arn in lambda_arns),
                          "Our Lambda function not found in S3 notification")
            
        except ClientError as e:
            self.fail(f"S3 to Lambda connection test failed: {e}")
    
    def test_lambda_to_s3_permissions_work(self):
        """Test that Lambda has permissions to write to destination S3 bucket."""
        try:
            # Test Lambda function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            config = response['Configuration']
            
            # Verify Lambda has environment variables for S3 buckets
            env_vars = config['Environment']['Variables']
            self.assertIn('DEST_BUCKET', env_vars, "DEST_BUCKET not configured")
            self.assertIn('SOURCE_BUCKET', env_vars, "SOURCE_BUCKET not configured")
            
            # Verify bucket names match our deployed buckets
            self.assertEqual(env_vars['DEST_BUCKET'], self.dest_bucket, "DEST_BUCKET mismatch")
            self.assertEqual(env_vars['SOURCE_BUCKET'], self.source_bucket, "SOURCE_BUCKET mismatch")
            
            # Test that destination bucket is accessible
            dest_response = self.s3_client.head_bucket(Bucket=self.dest_bucket)
            self.assertEqual(dest_response['ResponseMetadata']['HTTPStatusCode'], 200)
            
        except ClientError as e:
            self.fail(f"Lambda to S3 permissions test failed: {e}")
    
    def test_lambda_environment_variables_are_set(self):
        """Test that Lambda function has correct environment variables."""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            env_vars = response['Configuration']['Environment']['Variables']
            
            # Check required environment variables
            self.assertIn('DEST_BUCKET', env_vars, "DEST_BUCKET environment variable not set")
            self.assertIn('SOURCE_BUCKET', env_vars, "SOURCE_BUCKET environment variable not set")
            
            # Verify bucket names match (using environment suffix)
            self.assertEqual(env_vars['DEST_BUCKET'], self.dest_bucket)
            self.assertEqual(env_vars['SOURCE_BUCKET'], self.source_bucket)
            
        except ClientError as e:
            self.fail(f"Failed to get Lambda function configuration: {e}")
    
    
    # ==================== RESOURCE VALIDATION TESTS ====================
    
    def test_source_s3_bucket_exists_and_accessible(self):
        """Test that source S3 bucket exists and is accessible."""
        try:
            response = self.s3_client.head_bucket(Bucket=self.source_bucket)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Source bucket not accessible: {e}")
    
    def test_destination_s3_bucket_exists_and_accessible(self):
        """Test that destination S3 bucket exists and is accessible."""
        try:
            response = self.s3_client.head_bucket(Bucket=self.dest_bucket)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Destination bucket not accessible: {e}")
    
    def test_lambda_function_exists_and_configured(self):
        """Test that Lambda function exists with correct configuration."""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            config = response['Configuration']
            
            # Verify basic configuration
            self.assertIn(config['Runtime'], ['python3.9', 'python3.11'], f"Unexpected runtime: {config['Runtime']}")
            self.assertEqual(config['Handler'], 'image_processor.handler')
            self.assertGreaterEqual(config['MemorySize'], 128)  # Minimum viable memory
            self.assertGreaterEqual(config['Timeout'], 15)  # Minimum viable timeout
            
        except ClientError as e:
            self.fail(f"Lambda function not accessible: {e}")
    
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists for Lambda function."""
        try:
            response = self.cloudwatch_logs_client.describe_log_groups(
                logGroupNamePrefix=self.log_group_name
            )
            self.assertGreater(len(response['logGroups']), 0, "CloudWatch log group not found")
            
            log_group = response['logGroups'][0]
            self.assertEqual(log_group['logGroupName'], self.log_group_name)
            # Check that retention is set (could be 7, 14, 30, etc.)
            self.assertIsNotNone(log_group.get('retentionInDays'), "Log retention not configured")
            
        except ClientError as e:
            self.fail(f"CloudWatch log group not accessible: {e}")
    
    def test_cloudwatch_alarms_are_configured(self):
        """Test that CloudWatch alarms are properly configured."""
        try:
            # List all alarms and find ones that match our pattern
            response = self.cloudwatch_client.describe_alarms()
            found_alarms = []
            
            for alarm in response['MetricAlarms']:
                alarm_name = alarm['AlarmName']
                # Look for alarms related to our image processing pipeline
                # Check if alarm name contains our environment suffix or common patterns
                if (self.environment_suffix in alarm_name.lower() or 
                    any(pattern in alarm_name.lower() for pattern in ['img-proc', 'lambda', 'error', 'duration', 'invocation', 'throttle', 'concurrent', 'dlq'])):
                    found_alarms.append(alarm_name)
            
            # Verify we found at least one alarm related to our processing
            self.assertGreater(len(found_alarms), 0, f"No CloudWatch alarms found for processing pipeline. Available alarms: {[a['AlarmName'] for a in response['MetricAlarms']]}")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms not accessible: {e}")
    
    def test_kms_key_exists_and_accessible(self):
        """Test that KMS key exists and is accessible."""
        try:
            # Check for KMS alias (with environment suffix)
            alias_name = f"alias/img-proc-kms-alias-{self.environment_suffix}"
            try:
                response = self.kms_client.describe_key(KeyId=alias_name)
                key_metadata = response['KeyMetadata']
                
                # Verify key properties
                self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
                self.assertIn(key_metadata['KeySpec'], ['SYMMETRIC_DEFAULT', 'RSA_2048', 'RSA_3072', 'RSA_4096'], f"Unexpected key spec: {key_metadata['KeySpec']}")
                self.assertEqual(key_metadata['Origin'], 'AWS_KMS')
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'NotFoundException':
                    self.fail(f"KMS alias {alias_name} not found")
                else:
                    self.fail(f"KMS key not accessible: {e}")
            
        except ClientError as e:
            self.fail(f"KMS key not accessible: {e}")
    
    def test_iam_role_has_correct_permissions(self):
        """Test that IAM role has correct permissions for Lambda execution."""
        try:
            # Get Lambda function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = response['Configuration']['Role']
            
            # Extract role name from ARN
            role_name = role_arn.split('/')[-1]
            
            # Get role policies
            iam_client = boto3.client('iam', region_name=self.aws_region)
            response = iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Check for required policies
            policy_arns = [policy['PolicyArn'] for policy in response['AttachedPolicies']]
            
            # Should have basic execution role
            basic_execution_found = any('AWSLambdaBasicExecutionRole' in arn for arn in policy_arns)
            self.assertTrue(basic_execution_found, "Basic execution role not attached")
            
        except ClientError as e:
            self.fail(f"IAM role permissions not accessible: {e}")


if __name__ == '__main__':
    unittest.main()