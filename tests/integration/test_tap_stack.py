#!/usr/bin/env python3
"""
Integration tests for the Image Processing Pipeline infrastructure.

These tests verify end-to-end functionality of the deployed infrastructure,
including service-to-service interactions and resource validation.

Test Coverage:
- Service-to-service tests (5-7): End-to-end image processing pipeline
- Resource validation tests (5-6): Individual AWS resource testing
- Total: 10-13 integration tests

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
from PIL import Image


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
        cls.source_bucket = os.getenv('SOURCE_BUCKET', f'image-uploads-{cls.environment_suffix}-organization-tapstack')
        cls.dest_bucket = os.getenv('DEST_BUCKET', f'processed-images-{cls.environment_suffix}-organization-tapstack')
        cls.lambda_function_name = os.getenv('LAMBDA_FUNCTION', 'img-proc-processor')
        cls.log_group_name = os.getenv('LOG_GROUP', '/aws/lambda/img-proc-processor')
        
        # CloudWatch alarm names from deployment
        cls.alarm_names = [
            'img-proc-error-alarm',
            'img-proc-duration-alarm', 
            'img-proc-invocation-alarm',
            'img-proc-throttle-alarm',
            'img-proc-timeout-alarm'
        ]
        
        # Test image data
        cls.test_image_data = cls._create_test_image()
    
    @classmethod
    def _create_test_image(cls) -> bytes:
        """Create a test image for processing."""
        # Create a simple test image
        img = Image.new('RGB', (1200, 800), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        return img_bytes.getvalue()
    
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
    
    def test_s3_upload_triggers_lambda_processing(self):
        """Test that uploading an image to source bucket triggers Lambda processing."""
        # Upload test image to source bucket
        upload_key = f"{self.test_key_prefix}/uploads/test-image.jpg"
        self.s3_client.put_object(
            Bucket=self.source_bucket,
            Key=upload_key,
            Body=self.test_image_data,
            ContentType='image/jpeg'
        )
        
        # Wait for Lambda processing
        time.sleep(10)
        
        # Check if processed images exist in destination bucket
        response = self.s3_client.list_objects_v2(Bucket=self.dest_bucket, Prefix=self.test_key_prefix)
        self.assertIn('Contents', response, "No processed images found in destination bucket")
        
        # Verify both standard and thumbnail versions exist
        keys = [obj['Key'] for obj in response['Contents']]
        self.assertTrue(any('standard' in key for key in keys), "Standard size image not found")
        self.assertTrue(any('thumb' in key for key in keys), "Thumbnail image not found")
    
    def test_image_processing_creates_correct_sizes(self):
        """Test that Lambda creates images with correct dimensions."""
        # Upload test image
        upload_key = f"{self.test_key_prefix}/uploads/size-test.jpg"
        self.s3_client.put_object(
            Bucket=self.source_bucket,
            Key=upload_key,
            Body=self.test_image_data,
            ContentType='image/jpeg'
        )
        
        # Wait for processing
        time.sleep(10)
        
        # Check standard size (800x600)
        standard_key = f"{self.test_key_prefix}/uploads/size-test_standard.jpg"
        try:
            response = self.s3_client.get_object(Bucket=self.dest_bucket, Key=standard_key)
            img_data = response['Body'].read()
            img = Image.open(BytesIO(img_data))
            self.assertEqual(img.size, (800, 600), f"Standard image size incorrect: {img.size}")
        except ClientError:
            self.fail("Standard size image not found")
        
        # Check thumbnail size (150x150)
        thumb_key = f"{self.test_key_prefix}/uploads/size-test_thumb.jpg"
        try:
            response = self.s3_client.get_object(Bucket=self.dest_bucket, Key=thumb_key)
            img_data = response['Body'].read()
            img = Image.open(BytesIO(img_data))
            self.assertEqual(img.size, (150, 150), f"Thumbnail image size incorrect: {img.size}")
        except ClientError:
            self.fail("Thumbnail image not found")
    
    def test_lambda_processes_multiple_image_formats(self):
        """Test that Lambda processes different image formats correctly."""
        formats = ['jpg', 'jpeg', 'png']
        
        for fmt in formats:
            with self.subTest(format=fmt):
                # Create test image in specific format
                img = Image.new('RGB', (400, 300), color='blue')
                img_bytes = BytesIO()
                img.save(img_bytes, format=fmt.upper())
                
                # Upload image
                upload_key = f"{self.test_key_prefix}/uploads/format-test.{fmt}"
                self.s3_client.put_object(
                    Bucket=self.source_bucket,
                    Key=upload_key,
                    Body=img_bytes.getvalue(),
                    ContentType=f'image/{fmt}'
                )
                
                # Wait for processing
                time.sleep(8)
                
                # Verify processed images exist
                response = self.s3_client.list_objects_v2(Bucket=self.dest_bucket, Prefix=self.test_key_prefix)
                keys = [obj['Key'] for obj in response.get('Contents', [])]
                self.assertTrue(any(f'format-test.{fmt}' in key for key in keys), 
                              f"Processed {fmt} image not found")
    
    def test_lambda_error_handling_with_invalid_image(self):
        """Test Lambda error handling with invalid image data."""
        # Upload invalid image data
        invalid_data = b"This is not an image"
        upload_key = f"{self.test_key_prefix}/uploads/invalid-image.jpg"
        self.s3_client.put_object(
            Bucket=self.source_bucket,
            Key=upload_key,
            Body=invalid_data,
            ContentType='image/jpeg'
        )
        
        # Wait for processing
        time.sleep(10)
        
        # Check CloudWatch logs for error handling
        log_streams = self.cloudwatch_logs_client.describe_log_streams(
            logGroupName=self.log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )
        
        # Verify Lambda attempted to process (logs should exist)
        self.assertGreater(len(log_streams['logStreams']), 0, "No log streams found")
    
    def test_s3_event_notification_configuration(self):
        """Test that S3 event notifications are properly configured."""
        # Get bucket notification configuration
        try:
            response = self.s3_client.get_bucket_notification_configuration(Bucket=self.source_bucket)
            self.assertIn('LambdaConfigurations', response, "Lambda notification not configured")
            
            lambda_configs = response['LambdaConfigurations']
            self.assertGreater(len(lambda_configs), 0, "No Lambda configurations found")
            
            # Verify notification is for our Lambda function
            lambda_arns = [config['LambdaFunctionArn'] for config in lambda_configs]
            self.assertTrue(any(self.lambda_function_name in arn for arn in lambda_arns),
                          "Lambda function not in notification configuration")
        except ClientError as e:
            self.fail(f"Failed to get bucket notification configuration: {e}")
    
    def test_lambda_environment_variables_are_set(self):
        """Test that Lambda function has correct environment variables."""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            env_vars = response['Configuration']['Environment']['Variables']
            
            # Check required environment variables
            self.assertIn('DEST_BUCKET', env_vars, "DEST_BUCKET environment variable not set")
            self.assertIn('SOURCE_BUCKET', env_vars, "SOURCE_BUCKET environment variable not set")
            self.assertIn('IMAGE_SIZES', env_vars, "IMAGE_SIZES environment variable not set")
            self.assertIn('LOG_LEVEL', env_vars, "LOG_LEVEL environment variable not set")
            
            # Verify bucket names match
            self.assertEqual(env_vars['DEST_BUCKET'], self.dest_bucket)
            self.assertEqual(env_vars['SOURCE_BUCKET'], self.source_bucket)
            
        except ClientError as e:
            self.fail(f"Failed to get Lambda function configuration: {e}")
    
    def test_end_to_end_image_processing_pipeline(self):
        """Test complete end-to-end image processing pipeline."""
        # Upload image with specific metadata
        upload_key = f"{self.test_key_prefix}/uploads/e2e-test.jpg"
        self.s3_client.put_object(
            Bucket=self.source_bucket,
            Key=upload_key,
            Body=self.test_image_data,
            ContentType='image/jpeg',
            Metadata={
                'test-id': self.test_key_prefix,
                'original-size': '1200x800'
            }
        )
        
        # Wait for processing
        time.sleep(15)
        
        # Verify all expected outputs exist
        response = self.s3_client.list_objects_v2(Bucket=self.dest_bucket, Prefix=self.test_key_prefix)
        keys = [obj['Key'] for obj in response.get('Contents', [])]
        
        # Check for both processed versions
        standard_found = any('standard' in key for key in keys)
        thumb_found = any('thumb' in key for key in keys)
        
        self.assertTrue(standard_found, "Standard processed image not found")
        self.assertTrue(thumb_found, "Thumbnail processed image not found")
        
        # Verify image quality and dimensions
        for key in keys:
            if 'standard' in key:
                obj = self.s3_client.get_object(Bucket=self.dest_bucket, Key=key)
                img_data = obj['Body'].read()
                img = Image.open(BytesIO(img_data))
                self.assertEqual(img.size, (800, 600), f"Standard image wrong size: {img.size}")
            elif 'thumb' in key:
                obj = self.s3_client.get_object(Bucket=self.dest_bucket, Key=key)
                img_data = obj['Body'].read()
                img = Image.open(BytesIO(img_data))
                self.assertEqual(img.size, (150, 150), f"Thumbnail image wrong size: {img.size}")
    
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
            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'image_processor.handler')
            self.assertEqual(config['MemorySize'], 1024)
            self.assertEqual(config['Timeout'], 60)
            
            # Verify layers are attached
            self.assertGreater(len(config.get('Layers', [])), 0, "No layers attached to Lambda")
            
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
            self.assertEqual(log_group['retentionInDays'], 7)
            
        except ClientError as e:
            self.fail(f"CloudWatch log group not accessible: {e}")
    
    def test_cloudwatch_alarms_are_configured(self):
        """Test that CloudWatch alarms are properly configured."""
        for alarm_name in self.alarm_names:
            with self.subTest(alarm=alarm_name):
                try:
                    response = self.cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
                    self.assertEqual(len(response['MetricAlarms']), 1, f"Alarm {alarm_name} not found")
                    
                    alarm = response['MetricAlarms'][0]
                    self.assertEqual(alarm['AlarmName'], alarm_name)
                    self.assertEqual(alarm['Namespace'], 'AWS/Lambda')
                    
                except ClientError as e:
                    self.fail(f"CloudWatch alarm {alarm_name} not accessible: {e}")
    
    def test_kms_key_exists_and_accessible(self):
        """Test that KMS key exists and is accessible."""
        try:
            # List KMS keys and find our key
            response = self.kms_client.list_keys()
            key_found = False
            
            for key in response['Keys']:
                key_info = self.kms_client.describe_key(KeyId=key['KeyId'])
                if 'img-proc' in key_info['KeyMetadata']['Description']:
                    key_found = True
                    self.assertEqual(key_info['KeyMetadata']['KeyUsage'], 'ENCRYPT_DECRYPT')
                    break
            
            self.assertTrue(key_found, "KMS key for image processing not found")
            
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