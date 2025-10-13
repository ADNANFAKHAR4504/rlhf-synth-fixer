"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import time
import uuid
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with environment configuration."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.project_name = os.getenv('PULUMI_PROJECT', 'TapStack')
        
        # Stack name follows the pattern TapStack${ENVIRONMENT_SUFFIX} in deployment scripts
        cls.stack_name = os.getenv('PULUMI_STACK', f'TapStack{cls.environment_suffix}')
        
        # Resource name prefix - matches how Pulumi creates resources: {project_name}-{stack_name}
        cls.resource_prefix = f"{cls.project_name}-{cls.stack_name}"

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        cls.apigatewayv2_client = boto3.client('apigatewayv2', region_name=cls.region)
        
        # Get account ID for resource naming
        sts_client = boto3.client('sts', region_name=cls.region)
        cls.account_id = sts_client.get_caller_identity()['Account']

    def test_s3_raw_bucket_exists(self):
        """Test that raw transactions S3 bucket exists and is configured correctly."""
        # Construct bucket name from the actual deployed naming convention
        bucket_name = f"financial-raw-transactions-{self.environment_suffix}-{self.stack_name.lower()}"
        
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
            self.fail(f"S3 raw bucket test failed: {e}")

    def test_s3_processed_bucket_exists(self):
        """Test that processed transactions S3 bucket exists."""
        bucket_name = f"financial-processed-transactions-{self.environment_suffix}-{self.stack_name.lower()}"
        
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Processed S3 bucket test failed: {e}")

    def test_dynamodb_metadata_table_exists(self):
        """Test that transaction metadata DynamoDB table exists."""
        table_name = f"transaction-metadata-{self.environment_suffix}"
        
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
        table_name = f"etl-audit-log-{self.environment_suffix}"
        
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            self.assertEqual(table['TableStatus'], 'ACTIVE')
        except ClientError as e:
            self.fail(f"DynamoDB audit table test failed: {e}")

    def test_sqs_error_queue_exists(self):
        """Test that error queue exists."""
        queue_name = f"etl-pipeline-errors-{self.environment_suffix}"
        
        try:
            response = self.sqs_client.get_queue_url(QueueName=queue_name)
            queue_url = response['QueueUrl']
            
            attributes = self.sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            self.assertIsNotNone(attributes.get('Attributes'))
        except ClientError as e:
            self.fail(f"SQS error queue test failed: {e}")

    def test_sqs_dlq_exists(self):
        """Test that DLQ exists."""
        queue_name = f"etl-pipeline-dlq-{self.environment_suffix}"
        
        try:
            response = self.sqs_client.get_queue_url(QueueName=queue_name)
            queue_url = response['QueueUrl']
            
            attributes = self.sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            self.assertIsNotNone(attributes.get('Attributes'))
        except ClientError as e:
            self.fail(f"SQS DLQ test failed: {e}")

    def test_sns_alert_topic_exists(self):
        """Test that SNS alert topic exists."""
        topic_name = f"etl-pipeline-alerts-{self.environment_suffix}"
        topic_arn = f"arn:aws:sns:{self.region}:{self.account_id}:{topic_name}"
        
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertIsNotNone(response.get('Attributes'))
        except ClientError as e:
            self.fail(f"SNS topic test failed: {e}")

    def test_event_bus_exists(self):
        """Test that EventBridge event bus exists."""
        event_bus_name = f"etl-event-bus-{self.environment_suffix}"
        
        try:
            response = self.events_client.describe_event_bus(Name=event_bus_name)
            self.assertIsNotNone(response.get('Arn'))
        except ClientError as e:
            self.fail(f"EventBridge event bus test failed: {e}")

    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist and are configured correctly."""
        lambda_functions = [
            f"financial-etl-ingestion-{self.environment_suffix}",
            f"financial-etl-validation-{self.environment_suffix}",
            f"financial-etl-transformation-{self.environment_suffix}",
            f"financial-etl-enrichment-{self.environment_suffix}",
            f"financial-etl-error-handler-{self.environment_suffix}"
        ]
        
        for func_name in lambda_functions:
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
        """Test that API Gateway HTTP API exists."""
        try:
            response = self.apigatewayv2_client.get_apis()
            apis = response.get('Items', [])
            
            # Find our API by looking for the resource prefix in the name
            matching_apis = [api for api in apis if self.resource_prefix in api.get('Name', '')]
            
            if len(matching_apis) == 0:
                self.fail(f"No API Gateway found with resource prefix {self.resource_prefix}")
            
            api = matching_apis[0]
            
            # Verify protocol type
            self.assertEqual(api['ProtocolType'], 'HTTP')
            
            # Verify API endpoint exists
            self.assertIsNotNone(api.get('ApiEndpoint'))
            
        except ClientError as e:
            self.fail(f"API Gateway test failed: {e}")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response.get('MetricAlarms', [])]
            
            # Check for alarms with our resource prefix or environment suffix
            matching_alarms = [name for name in alarm_names 
                             if self.resource_prefix in name or self.environment_suffix in name]
            
            # We should have multiple alarms (DLQ, errors, etc.)
            self.assertGreater(len(matching_alarms), 0, 
                f"No CloudWatch alarms found for {self.resource_prefix}")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms check failed: {e}")

    def test_iam_roles_exist(self):
        """Test that IAM roles for Lambda functions exist."""
        try:
            # List all roles and find matching ones
            paginator = self.iam_client.get_paginator('list_roles')
            all_roles = []
            
            for page in paginator.paginate():
                all_roles.extend(page['Roles'])
            
            role_names = [role['RoleName'] for role in all_roles]
            
            # Look for roles containing our resource prefix or environment
            matching_roles = [name for name in role_names 
                            if self.resource_prefix in name or f"etl-{self.environment_suffix}" in name]
            
            self.assertGreater(len(matching_roles), 0, 
                f"No IAM roles found for {self.resource_prefix}")

        except ClientError as e:
            self.fail(f"IAM roles check failed: {e}")

if __name__ == '__main__':
    # Skip integration tests if not in integration test environment
    if os.getenv('CI') != '1':
        print("Skipping integration tests. Set CI=1 to run.")
        import sys
        sys.exit(0)

    unittest.main()
