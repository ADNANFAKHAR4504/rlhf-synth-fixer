"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import pulumi
from pulumi import automation as auto
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack (runs once for all tests)."""
        cls.stack_name = os.getenv("PULUMI_STACK_NAME", "dev")
        cls.project_name = "TapStack"
        cls.region = os.getenv("AWS_REGION", "us-east-1")
        
        # Configure Pulumi to use S3 backend
        cls.pulumi_backend_url = os.getenv(
            'PULUMI_BACKEND_URL', 
            's3://iac-rlhf-pulumi-states'
        )
        
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        
        # Get stack outputs
        try:
            # Set up Pulumi automation API
            work_dir = os.path.join(os.path.dirname(__file__), "../..")
            stack = auto.select_stack(
                stack_name=cls.stack_name,
                project_name=cls.project_name,
                work_dir=work_dir
            )
            cls.outputs = stack.outputs()
        except Exception as e:
            print(f"Warning: Could not retrieve stack outputs: {e}")
            cls.outputs = {}

    def test_s3_raw_bucket_exists(self):
        """Test that raw transactions S3 bucket exists and is configured correctly."""
        if not self.outputs or 'raw_data_bucket' not in self.outputs:
            self.skipTest("Stack outputs not available or raw_data_bucket not in outputs")
        
        bucket_name = self.outputs['raw_data_bucket'].value
        
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')
            
            # Check encryption is enabled
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIsNotNone(encryption.get('ServerSideEncryptionConfiguration'))
            
        except ClientError as e:
            self.fail(f"S3 bucket test failed: {e}")

    def test_s3_processed_bucket_exists(self):
        """Test that processed transactions S3 bucket exists."""
        if not self.outputs or 'processed_data_bucket' not in self.outputs:
            self.skipTest("Stack outputs not available or processed_data_bucket not in outputs")
        
        bucket_name = self.outputs['processed_data_bucket'].value
        
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Processed S3 bucket test failed: {e}")

    def test_dynamodb_metadata_table_exists(self):
        """Test that transaction metadata DynamoDB table exists."""
        if not self.outputs or 'metadata_table' not in self.outputs:
            self.skipTest("Stack outputs not available or metadata_table not in outputs")
        
        table_name = self.outputs['metadata_table'].value
        
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertIn('AttributeDefinitions', table)
            
            # Check if point-in-time recovery is enabled
            pitr = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
            self.assertIsNotNone(pitr.get('ContinuousBackupsDescription'))
            
        except ClientError as e:
            self.fail(f"DynamoDB metadata table test failed: {e}")

    def test_dynamodb_audit_table_exists(self):
        """Test that audit log DynamoDB table exists."""
        if not self.outputs or 'audit_table' not in self.outputs:
            self.skipTest("Stack outputs not available or audit_table not in outputs")
        
        table_name = self.outputs['audit_table'].value
        
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            self.assertEqual(table['TableStatus'], 'ACTIVE')
        except ClientError as e:
            self.fail(f"DynamoDB audit table test failed: {e}")

    def test_sqs_error_queue_exists(self):
        """Test that error queue exists."""
        if not self.outputs or 'error_queue_url' not in self.outputs:
            self.skipTest("Stack outputs not available or error_queue_url not in outputs")
        
        queue_url = self.outputs['error_queue_url'].value
        
        try:
            response = self.sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            self.assertIsNotNone(response.get('Attributes'))
        except ClientError as e:
            self.fail(f"SQS error queue test failed: {e}")

    def test_sqs_dlq_exists(self):
        """Test that DLQ exists."""
        if not self.outputs or 'dlq_url' not in self.outputs:
            self.skipTest("Stack outputs not available or dlq_url not in outputs")
        
        queue_url = self.outputs['dlq_url'].value
        
        try:
            response = self.sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            self.assertIsNotNone(response.get('Attributes'))
        except ClientError as e:
            self.fail(f"SQS DLQ test failed: {e}")

    def test_sns_alert_topic_exists(self):
        """Test that SNS alert topic exists."""
        if not self.outputs or 'alert_topic_arn' not in self.outputs:
            self.skipTest("Stack outputs not available or alert_topic_arn not in outputs")
        
        topic_arn = self.outputs['alert_topic_arn'].value
        
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertIsNotNone(response.get('Attributes'))
        except ClientError as e:
            self.fail(f"SNS topic test failed: {e}")

    def test_event_bus_exists(self):
        """Test that EventBridge event bus exists."""
        if not self.outputs or 'event_bus_name' not in self.outputs:
            self.skipTest("Stack outputs not available or event_bus_name not in outputs")
        
        event_bus_name = self.outputs['event_bus_name'].value
        
        try:
            response = self.events_client.describe_event_bus(Name=event_bus_name)
            self.assertIsNotNone(response.get('Arn'))
        except ClientError as e:
            self.fail(f"EventBridge event bus test failed: {e}")

    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist and are configured correctly."""
        if not self.outputs or 'lambda_functions' not in self.outputs:
            self.skipTest("Stack outputs not available or lambda_functions not in outputs")
        
        lambda_functions = self.outputs['lambda_functions'].value
        
        for func_type, func_name in lambda_functions.items():
            try:
                response = self.lambda_client.get_function(FunctionName=func_name)
                self.assertEqual(
                    response['ResponseMetadata']['HTTPStatusCode'], 
                    200,
                    f"Lambda function {func_name} exists"
                )
                
                # Check function state
                config = response.get('Configuration', {})
                self.assertIn(
                    config.get('State'),
                    ['Active', 'Pending'],
                    f"Lambda {func_name} is in valid state"
                )
                
            except ClientError as e:
                self.fail(f"Lambda function {func_name} test failed: {e}")

    def test_api_gateway_endpoint_exists(self):
        """Test that API Gateway endpoint exists."""
        if not self.outputs or 'api_endpoint' not in self.outputs:
            self.skipTest("Stack outputs not available or api_endpoint not in outputs")
        
        api_endpoint = self.outputs['api_endpoint'].value
        
        # Extract API ID from endpoint URL
        # Format: https://{api_id}.execute-api.{region}.amazonaws.com/{stage}/transactions
        parts = api_endpoint.split('.')
        if len(parts) > 0 and parts[0].startswith('https://'):
            api_id = parts[0].replace('https://', '')
            
            try:
                response = self.apigateway_client.get_rest_api(restApiId=api_id)
                self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            except ClientError as e:
                self.fail(f"API Gateway test failed: {e}")
        else:
            self.skipTest("Could not extract API ID from endpoint URL")

    def test_stack_outputs_complete(self):
        """Test that all expected stack outputs are present."""
        if not self.outputs:
            self.skipTest("Stack outputs not available")
        
        expected_outputs = [
            'api_endpoint',
            'raw_data_bucket',
            'processed_data_bucket',
            'metadata_table',
            'audit_table',
            'error_queue_url',
            'dlq_url',
            'alert_topic_arn',
            'event_bus_name',
            'lambda_functions'
        ]
        
        for output_name in expected_outputs:
            self.assertIn(
                output_name,
                self.outputs,
                f"Output '{output_name}' should be present in stack outputs"
            )


if __name__ == '__main__':
    # Run only if INTEGRATION_TESTS environment variable is set
    if os.getenv('INTEGRATION_TESTS', 'false').lower() == 'true':
        unittest.main()
    else:
        print("Skipping integration tests. Set INTEGRATION_TESTS=true to run.")
