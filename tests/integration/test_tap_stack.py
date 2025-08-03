"""
Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import time
import uuid
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, Any, Optional


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack."""
        # Stack configuration
        cls.stack_name_prefix = "serverless-s3-lambda"
        cls.region = "us-east-1"
        
        # Test file configuration
        cls.test_file_content = f"Test file created at {time.time()}"
        cls.test_file_key = f"test-integration-{uuid.uuid4().hex}.txt"
        
        # Initialize AWS clients with error handling
        try:
            cls.s3_client = boto3.client('s3', region_name=cls.region)
            cls.lambda_client = boto3.client('lambda', region_name=cls.region)
            cls.iam_client = boto3.client('iam', region_name=cls.region)
            cls.logs_client = boto3.client('logs', region_name=cls.region)
        except NoCredentialsError:
            cls.skipTest(cls, "AWS credentials not available - skipping integration tests")
        except Exception as e:
            cls.skipTest(cls, f"Failed to initialize AWS clients: {str(e)}")
        
        # Discover deployed resources
        cls._discover_deployed_resources()

    @classmethod
    def _discover_deployed_resources(cls):
        """Discover the deployed TapStack resources."""
        cls.bucket_name = None
        cls.lambda_function_name = None
        cls.lambda_role_name = None
        
        try:
            # Find S3 bucket created by the stack
            response = cls.s3_client.list_buckets()
            for bucket in response['Buckets']:
                # Look for bucket with our stack naming pattern
                if cls.stack_name_prefix in bucket['Name']:
                    cls.bucket_name = bucket['Name']
                    break
            
            # Find Lambda function created by the stack
            response = cls.lambda_client.list_functions()
            for function in response['Functions']:
                # Look for function with our stack naming pattern
                if 's3-processor' in function['FunctionName'] or cls.stack_name_prefix in function['FunctionName']:
                    cls.lambda_function_name = function['FunctionName']
                    cls.lambda_function_arn = function['FunctionArn']
                    cls.lambda_role_arn = function['Role']
                    # Extract role name from ARN
                    cls.lambda_role_name = cls.lambda_role_arn.split('/')[-1]
                    break
                    
        except Exception as e:
            cls.skipTest(cls, f"Failed to discover deployed resources: {str(e)}")

    def test_01_aws_credentials_available(self):
        """Test that AWS credentials are properly configured."""
        try:
            # Try to get caller identity
            sts_client = boto3.client('sts', region_name=self.region)
            response = sts_client.get_caller_identity()
            self.assertIn('Account', response)
            self.assertIn('UserId', response)
            print(f"AWS Account: {response.get('Account')}")
        except NoCredentialsError:
            self.fail("AWS credentials not configured")
        except Exception as e:
            self.fail(f"Failed to verify AWS credentials: {str(e)}")

    def test_02_s3_bucket_exists_and_configured(self):
        """Test that the S3 bucket exists and is properly configured."""
        self.assertIsNotNone(self.bucket_name, "S3 bucket not found")
        
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled', 
                           "S3 bucket versioning should be enabled")
            
            # Check encryption is configured
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
                self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
                print(f"S3 bucket {self.bucket_name} is properly configured")
            except ClientError as e:
                if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                    raise
                    
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {str(e)}")

    def test_03_lambda_function_exists_and_configured(self):
        """Test that the Lambda function exists and is properly configured."""
        self.assertIsNotNone(self.lambda_function_name, "Lambda function not found")
        
        try:
            # Get function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            
            function_config = response['Configuration']
            self.assertEqual(function_config['Runtime'], 'python3.9')
            self.assertEqual(function_config['Handler'], 'main.lambda_handler')
            self.assertGreater(function_config['Timeout'], 0)
            self.assertGreater(function_config['MemorySize'], 0)
            
            # Check environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('LOG_LEVEL', env_vars)
            self.assertIn('ENVIRONMENT', env_vars)
            
            print(f"Lambda function {self.lambda_function_name} is properly configured")
            
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {str(e)}")

    def test_04_iam_role_exists_and_has_correct_permissions(self):
        """Test that the IAM role exists and has the correct permissions."""
        self.assertIsNotNone(self.lambda_role_name, "Lambda IAM role not found")
        
        try:
            # Get role details
            role_response = self.iam_client.get_role(RoleName=self.lambda_role_name)
            role = role_response['Role']
            
            # Verify assume role policy allows lambda service
            assume_role_policy = json.loads(role['AssumeRolePolicyDocument'])
            lambda_principals = []
            for statement in assume_role_policy.get('Statement', []):
                if statement.get('Effect') == 'Allow':
                    principal = statement.get('Principal', {})
                    if isinstance(principal, dict) and 'Service' in principal:
                        if isinstance(principal['Service'], list):
                            lambda_principals.extend(principal['Service'])
                        else:
                            lambda_principals.append(principal['Service'])
            
            self.assertIn('lambda.amazonaws.com', lambda_principals,
                         "IAM role should allow lambda.amazonaws.com to assume it")
            
            # Check attached policies
            attached_policies = self.iam_client.list_attached_role_policies(
                RoleName=self.lambda_role_name
            )
            
            # Should have at least one custom policy for S3 access
            self.assertGreater(len(attached_policies['AttachedPolicies']), 0,
                             "IAM role should have attached policies")
            
            print(f"IAM role {self.lambda_role_name} is properly configured")
            
        except ClientError as e:
            self.fail(f"IAM role validation failed: {str(e)}")

    def test_05_s3_bucket_notification_configured(self):
        """Test that S3 bucket notification is configured to trigger Lambda."""
        self.assertIsNotNone(self.bucket_name, "S3 bucket not found")
        self.assertIsNotNone(self.lambda_function_name, "Lambda function not found")
        
        try:
            # Get bucket notification configuration
            response = self.s3_client.get_bucket_notification_configuration(
                Bucket=self.bucket_name
            )
            
            # Check if Lambda configurations exist
            lambda_configs = response.get('LambdaConfigurations', [])
            self.assertGreater(len(lambda_configs), 0,
                             "S3 bucket should have Lambda notification configured")
            
            # Verify the Lambda function ARN is in the configuration
            lambda_arns = [config['LambdaFunctionArn'] for config in lambda_configs]
            self.assertIn(self.lambda_function_arn, lambda_arns,
                         "S3 notification should target the correct Lambda function")
            
            # Check event types
            events = []
            for config in lambda_configs:
                events.extend(config.get('Events', []))
            
            # Should include ObjectCreated events
            object_created_events = [e for e in events if e.startswith('s3:ObjectCreated')]
            self.assertGreater(len(object_created_events), 0,
                             "S3 notification should include ObjectCreated events")
            
            print(f"S3 bucket notification is properly configured")
            
        except ClientError as e:
            self.fail(f"S3 bucket notification validation failed: {str(e)}")

    def test_06_s3_to_lambda_trigger_functionality(self):
        """Test the actual S3-to-Lambda trigger functionality."""
        self.assertIsNotNone(self.bucket_name, "S3 bucket not found")
        self.assertIsNotNone(self.lambda_function_name, "Lambda function not found")
        
        try:
            # Upload a test file to trigger the Lambda function
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=self.test_file_key,
                Body=self.test_file_content,
                ContentType='text/plain'
            )
            
            print(f"Uploaded test file {self.test_file_key} to bucket {self.bucket_name}")
            
            # Wait for Lambda execution (give it some time to process)
            time.sleep(10)
            
            # Check CloudWatch logs for Lambda execution
            log_group_name = f"/aws/lambda/{self.lambda_function_name}"
            
            # Get recent log streams
            try:
                log_streams = self.logs_client.describe_log_streams(
                    logGroupName=log_group_name,
                    orderBy='LastEventTime',
                    descending=True,
                    limit=5
                )
                
                self.assertGreater(len(log_streams['logStreams']), 0,
                                 "Lambda function should have log streams")
                
                # Get recent log events
                latest_stream = log_streams['logStreams'][0]
                log_events = self.logs_client.get_log_events(
                    logGroupName=log_group_name,
                    logStreamName=latest_stream['logStreamName'],
                    startTime=int((time.time() - 300) * 1000),  # Last 5 minutes
                    limit=50
                )
                
                # Look for evidence of S3 event processing
                event_processed = False
                for event in log_events['events']:
                    message = event['message']
                    if (self.test_file_key in message or 
                        'Received S3 event' in message or 
                        'Processing S3 event' in message):
                        event_processed = True
                        print(f"Found evidence of S3 event processing: {message[:200]}...")
                        break
                
                self.assertTrue(event_processed,
                              "Lambda function should have processed the S3 event")
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    self.fail("Lambda function log group not found - function may not have executed")
                else:
                    raise
                    
        except ClientError as e:
            self.fail(f"S3-to-Lambda trigger test failed: {str(e)}")
        
    def test_07_lambda_function_direct_invocation(self):
        """Test direct invocation of the Lambda function with mock S3 event."""
        self.assertIsNotNone(self.lambda_function_name, "Lambda function not found")
        
        # Create a mock S3 event payload
        mock_event = {
            "Records": [
                {
                    "eventVersion": "2.1",
                    "eventSource": "aws:s3",
                    "eventTime": "2023-01-01T12:00:00.000Z",
                    "eventName": "ObjectCreated:Put",
                    "s3": {
                        "s3SchemaVersion": "1.0",
                        "bucket": {
                            "name": self.bucket_name or "test-bucket",
                            "arn": f"arn:aws:s3:::{self.bucket_name or 'test-bucket'}"
                        },
                        "object": {
                            "key": "test-direct-invocation.txt",
                            "size": 1024
                        }
                    }
                }
            ]
        }
        
        try:
            # Invoke the Lambda function synchronously
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(mock_event)
            )
            
            # Check response
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            
            # Verify successful processing
            self.assertEqual(payload.get('statusCode'), 200)
            
            # Parse the body if it's a string
            body = payload.get('body')
            if isinstance(body, str):
                body = json.loads(body)
            
            self.assertIn('message', body)
            self.assertIn('processedRecords', body)
            self.assertEqual(body['processedRecords'], 1)
            
            print(f"Lambda function direct invocation successful: {body['message']}")
            
        except ClientError as e:
            self.fail(f"Lambda function direct invocation failed: {str(e)}")

    @classmethod
    def tearDownClass(cls):
        """Clean up test resources."""
        if hasattr(cls, 's3_client') and cls.bucket_name:
            try:
                # Clean up test file
                cls.s3_client.delete_object(
                    Bucket=cls.bucket_name,
                    Key=cls.test_file_key
                )
                print(f"Cleaned up test file: {cls.test_file_key}")
            except Exception as e:
                print(f"Warning: Could not clean up test file: {str(e)}")


if __name__ == '__main__':
    # Configure test runner with verbose output
    unittest.main(verbosity=2)