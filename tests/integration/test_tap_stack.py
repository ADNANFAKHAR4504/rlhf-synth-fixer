"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.

NOTE: These tests require actual Pulumi stack deployment to AWS.
"""

import unittest
import os
import boto3
import json
import time
import uuid
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
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
        # This results in: TapStack-TapStackpr3987 for PR #3987
        cls.resource_prefix = f"{cls.project_name}-{cls.stack_name}"

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.apigatewayv2_client = boto3.client('apigatewayv2', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        
        # Get account ID for resource naming
        sts_client = boto3.client('sts', region_name=cls.region)
        cls.account_id = sts_client.get_caller_identity()['Account']

    def test_s3_image_bucket_exists(self):
        """Test that S3 bucket for images exists and is configured correctly."""
        bucket_name = f"{self.resource_prefix}-images"

        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Verify versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')

            # Verify public access block configuration
            public_access_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])

            # Verify encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0)
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')

        except ClientError as e:
            self.fail(f"S3 bucket not accessible: {e}")

    def test_dynamodb_results_table_exists(self):
        """Test that DynamoDB results table exists and is configured correctly."""
        table_name = f"{self.resource_prefix}-results"

        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            self.assertEqual(table['TableName'], table_name)
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Verify hash key
            key_schema = {k['AttributeName']: k['KeyType'] for k in table['KeySchema']}
            self.assertEqual(key_schema.get('image_id'), 'HASH')
            
            # Verify GSI exists
            gsi_names = [gsi['IndexName'] for gsi in table.get('GlobalSecondaryIndexes', [])]
            self.assertIn('status-created-index', gsi_names)
            
            # Verify point-in-time recovery
            pitr = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
            pitr_status = pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            self.assertEqual(pitr_status, 'ENABLED')

        except ClientError as e:
            self.fail(f"DynamoDB results table not accessible: {e}")

    def test_sqs_queues_exist(self):
        """Test that all SQS queues exist and are configured correctly."""
        queue_names = [
            f"{self.resource_prefix}-dlq",
            f"{self.resource_prefix}-preprocessing",
            f"{self.resource_prefix}-inference"
        ]

        for queue_name in queue_names:
            try:
                # Get queue URL
                response = self.sqs_client.get_queue_url(QueueName=queue_name)
                queue_url = response['QueueUrl']
                
                # Get queue attributes
                attributes = self.sqs_client.get_queue_attributes(
                    QueueUrl=queue_url,
                    AttributeNames=['All']
                )['Attributes']
                
                self.assertIsNotNone(attributes.get('MessageRetentionPeriod'))
                
                # Check redrive policy for non-DLQ queues
                if 'dlq' not in queue_name:
                    self.assertIn('RedrivePolicy', attributes)
                    redrive_policy = json.loads(attributes['RedrivePolicy'])
                    self.assertEqual(redrive_policy['maxReceiveCount'], 3)
                    
            except ClientError as e:
                self.fail(f"SQS queue {queue_name} not accessible: {e}")

    def test_lambda_functions_exist(self):
        """Test that all Lambda functions are deployed and configured correctly."""
        function_names = [
            f"{self.resource_prefix}-preprocessing",
            f"{self.resource_prefix}-inference",
            f"{self.resource_prefix}-api-handler"
        ]

        for function_name in function_names:
            try:
                response = self.lambda_client.get_function(FunctionName=function_name)
                config = response['Configuration']
                
                self.assertEqual(config['FunctionName'], function_name)
                self.assertEqual(config['Runtime'], 'python3.11')
                self.assertIsNotNone(config['Role'])
                
                # Verify environment variables
                env_vars = config.get('Environment', {}).get('Variables', {})
                self.assertIsNotNone(env_vars)
                
                # Verify X-Ray tracing
                self.assertEqual(config['TracingConfig']['Mode'], 'Active')
                
                # Verify timeout and memory
                self.assertGreater(config['Timeout'], 0)
                self.assertGreater(config['MemorySize'], 0)
                
            except ClientError as e:
                self.fail(f"Lambda function {function_name} not accessible: {e}")

    def test_lambda_layer_exists(self):
        """Test that Lambda layer for model exists."""
        layer_name = f"{self.resource_prefix}-model"

        try:
            response = self.lambda_client.list_layer_versions(LayerName=layer_name)
            layer_versions = response.get('LayerVersions', [])
            
            self.assertGreater(len(layer_versions), 0, f"Lambda layer {layer_name} has no versions")
            
            latest_version = layer_versions[0]
            self.assertIn('python3.', str(latest_version.get('CompatibleRuntimes', [])))
            
        except ClientError as e:
            self.fail(f"Lambda layer {layer_name} not accessible: {e}")

    def test_api_gateway_exists(self):
        """Test that API Gateway HTTP API exists."""
        try:
            response = self.apigatewayv2_client.get_apis()
            apis = response.get('Items', [])
            
            # Find our API
            matching_apis = [api for api in apis if self.resource_prefix in api['Name']]
            self.assertGreater(len(matching_apis), 0, f"API Gateway for {self.resource_prefix} not found")
            
            api = matching_apis[0]
            api_id = api['ApiId']
            
            # Verify protocol type
            self.assertEqual(api['ProtocolType'], 'HTTP')
            
            # Verify CORS configuration
            self.assertIn('CorsConfiguration', api)
            cors = api['CorsConfiguration']
            self.assertIn('*', cors.get('AllowOrigins', []))
            
            # Get routes
            routes = self.apigatewayv2_client.get_routes(ApiId=api_id)
            route_keys = [r['RouteKey'] for r in routes.get('Items', [])]
            
            # Verify expected routes exist
            self.assertIn('POST /images', route_keys)
            self.assertIn('GET /images/{id}', route_keys)
            
        except ClientError as e:
            self.fail(f"API Gateway not accessible: {e}")

    def test_lambda_event_source_mappings(self):
        """Test that Lambda functions have correct event source mappings."""
        mappings_to_check = [
            {
                'function': f"{self.resource_prefix}-preprocessing",
                'queue': f"{self.resource_prefix}-preprocessing"
            },
            {
                'function': f"{self.resource_prefix}-inference",
                'queue': f"{self.resource_prefix}-inference"
            }
        ]

        for mapping in mappings_to_check:
            try:
                function_name = mapping['function']
                response = self.lambda_client.list_event_source_mappings(
                    FunctionName=function_name
                )
                
                event_sources = response.get('EventSourceMappings', [])
                self.assertGreater(len(event_sources), 0, 
                    f"No event source mappings found for {function_name}")
                
                # Verify event source is SQS
                for event_source in event_sources:
                    self.assertIn('sqs', event_source['EventSourceArn'])
                    self.assertEqual(event_source['State'], 'Enabled')
                    
            except ClientError as e:
                self.fail(f"Event source mapping check failed: {e}")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response.get('MetricAlarms', [])]
            
            # Check for alarms with our resource prefix
            matching_alarms = [name for name in alarm_names if self.resource_prefix in name]
            
            # We should have multiple alarms (DLQ, errors, throttles, queue age)
            self.assertGreater(len(matching_alarms), 0, 
                f"No CloudWatch alarms found for {self.resource_prefix}")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms check failed: {e}")

    def test_s3_bucket_notification_configuration(self):
        """Test that S3 bucket has notification configuration for SQS."""
        bucket_name = f"{self.resource_prefix}-images"

        try:
            response = self.s3_client.get_bucket_notification_configuration(Bucket=bucket_name)
            
            # Should have queue configurations
            queue_configs = response.get('QueueConfigurations', [])
            self.assertGreater(len(queue_configs), 0, 
                "S3 bucket should have SQS notification configured")
            
            # Verify configuration
            for config in queue_configs:
                self.assertIn('s3:ObjectCreated:', str(config.get('Events', [])))
                self.assertIn('uploads/', str(config.get('Filter', {}).get('Key', {}).get('FilterRules', [])))
                
        except ClientError as e:
            self.fail(f"S3 bucket notification configuration check failed: {e}")

    def test_dynamodb_write_and_read(self):
        """Test DynamoDB table functionality by writing and reading data."""
        table_name = f"{self.resource_prefix}-results"
        dynamodb = boto3.resource('dynamodb', region_name=self.region)

        try:
            table = dynamodb.Table(table_name)

            # Write test record
            test_image_id = f"test-image-{uuid.uuid4()}"
            test_timestamp = int(time.time())
            
            table.put_item(
                Item={
                    'image_id': test_image_id,
                    'status': 'test',
                    'created_at': test_timestamp,
                    'test_field': 'integration_test'
                }
            )

            # Read test record
            response = table.get_item(Key={'image_id': test_image_id})
            self.assertIn('Item', response)
            self.assertEqual(response['Item']['image_id'], test_image_id)
            self.assertEqual(response['Item']['status'], 'test')
            self.assertEqual(response['Item']['test_field'], 'integration_test')

            # Query using GSI
            response = table.query(
                IndexName='status-created-index',
                KeyConditionExpression='#status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'test'},
                Limit=10
            )
            self.assertIn('Items', response)
            self.assertGreater(len(response['Items']), 0)

            # Clean up
            table.delete_item(Key={'image_id': test_image_id})

        except Exception as e:
            self.fail(f"DynamoDB functionality test failed: {e}")

    def test_s3_upload_functionality(self):
        """Test S3 bucket upload functionality."""
        bucket_name = f"{self.resource_prefix}-images"
        test_key = f"test/integration-test-{uuid.uuid4()}.txt"
        test_content = b"Integration test content"

        try:
            # Upload test object
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content
            )

            # Verify object exists
            response = self.s3_client.head_object(Bucket=bucket_name, Key=test_key)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Verify encryption
            self.assertIn('ServerSideEncryption', response)

            # Download and verify content
            response = self.s3_client.get_object(Bucket=bucket_name, Key=test_key)
            downloaded_content = response['Body'].read()
            self.assertEqual(downloaded_content, test_content)

            # Clean up
            self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)

        except Exception as e:
            self.fail(f"S3 upload functionality test failed: {e}")

    def test_sqs_message_functionality(self):
        """Test SQS queue message functionality."""
        queue_name = f"{self.resource_prefix}-preprocessing"

        try:
            # Get queue URL
            response = self.sqs_client.get_queue_url(QueueName=queue_name)
            queue_url = response['QueueUrl']

            # Send test message
            test_message = {
                'test': True,
                'image_id': f"test-{uuid.uuid4()}",
                'timestamp': int(time.time())
            }
            
            self.sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(test_message)
            )

            # Receive message
            response = self.sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5
            )

            self.assertIn('Messages', response)
            messages = response.get('Messages', [])
            
            if len(messages) > 0:
                message = messages[0]
                body = json.loads(message['Body'])
                self.assertTrue(body.get('test'))

                # Delete message to clean up
                self.sqs_client.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )

        except Exception as e:
            self.fail(f"SQS message functionality test failed: {e}")

    def test_iam_roles_exist(self):
        """Test that IAM roles for Lambda functions exist."""
        role_names_partial = [
            f"{self.resource_prefix}-preprocessing-role",
            f"{self.resource_prefix}-inference-role",
            f"{self.resource_prefix}-api-role"
        ]

        try:
            # List all roles and find matching ones
            paginator = self.iam_client.get_paginator('list_roles')
            all_roles = []
            
            for page in paginator.paginate():
                all_roles.extend(page['Roles'])
            
            role_names = [role['RoleName'] for role in all_roles]
            
            for role_name_partial in role_names_partial:
                matching_roles = [name for name in role_names if role_name_partial in name]
                self.assertGreater(len(matching_roles), 0, 
                    f"IAM role matching {role_name_partial} not found")

        except ClientError as e:
            self.fail(f"IAM roles check failed: {e}")


if __name__ == '__main__':
    # Skip integration tests if not in integration test environment
    if os.getenv('CI') != '1':
        print("Skipping integration tests. Set CI=1 to run.")
        import sys
        sys.exit(0)

    unittest.main()
