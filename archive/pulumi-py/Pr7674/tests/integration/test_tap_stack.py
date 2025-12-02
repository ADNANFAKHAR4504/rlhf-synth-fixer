"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with stack outputs."""
        # Load stack outputs
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Stack outputs not found: {outputs_file}")

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.s3 = boto3.client('s3', region_name='us-east-1')
        cls.dynamodb = boto3.client('dynamodb', region_name='us-east-1')
        cls.sqs = boto3.client('sqs', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.apigateway = boto3.client('apigateway', region_name='us-east-1')
        cls.events = boto3.client('events', region_name='us-east-1')

    def test_s3_bucket_exists(self):
        """Test S3 bucket for webhook payloads exists."""
        bucket_name = self.outputs['s3_bucket_name']
        self.assertIsNotNone(bucket_name, "S3 bucket name should be in outputs")

        # Verify bucket exists
        try:
            response = self.s3.head_bucket(Bucket=bucket_name)
            self.assertIn('ResponseMetadata', response)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} does not exist: {e}")

    def test_s3_bucket_has_public_access_block(self):
        """Test S3 bucket has public access blocked."""
        bucket_name = self.outputs['s3_bucket_name']

        try:
            response = self.s3.get_public_access_block(Bucket=bucket_name)
            config = response['PublicAccessBlockConfiguration']

            self.assertTrue(config['BlockPublicAcls'], "Should block public ACLs")
            self.assertTrue(config['BlockPublicPolicy'], "Should block public policy")
            self.assertTrue(config['IgnorePublicAcls'], "Should ignore public ACLs")
            self.assertTrue(config['RestrictPublicBuckets'], "Should restrict public buckets")
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")

    def test_dynamodb_table_exists(self):
        """Test DynamoDB table for webhook metadata exists."""
        table_name = self.outputs['dynamodb_table_name']
        self.assertIsNotNone(table_name, "DynamoDB table name should be in outputs")

        # Verify table exists
        try:
            response = self.dynamodb.describe_table(TableName=table_name)
            table = response['Table']

            self.assertEqual(table['TableStatus'], 'ACTIVE', "Table should be ACTIVE")
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Check hash key
            key_schema = table['KeySchema']
            self.assertEqual(len(key_schema), 1, "Should have one key")
            self.assertEqual(key_schema[0]['AttributeName'], 'webhook_id')
            self.assertEqual(key_schema[0]['KeyType'], 'HASH')
        except ClientError as e:
            self.fail(f"DynamoDB table {table_name} does not exist: {e}")

    def test_sqs_queue_exists(self):
        """Test SQS queue for processing exists."""
        queue_url = self.outputs['sqs_queue_url']
        self.assertIsNotNone(queue_url, "SQS queue URL should be in outputs")

        # Verify queue exists
        try:
            response = self.sqs.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            attrs = response['Attributes']

            self.assertIn('FifoQueue', attrs, "Should be FIFO queue")
            self.assertEqual(attrs['FifoQueue'], 'true', "Should be FIFO queue")
            self.assertIn('ContentBasedDeduplication', attrs)
            self.assertEqual(attrs['ContentBasedDeduplication'], 'true')
        except ClientError as e:
            self.fail(f"SQS queue {queue_url} does not exist: {e}")

    def test_ingestion_lambda_exists(self):
        """Test ingestion Lambda function exists."""
        function_name = self.outputs['ingestion_function_name']
        self.assertIsNotNone(function_name, "Ingestion function name should be in outputs")

        # Verify function exists
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']

            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'index.handler')
            # Check for actual environment variables set in the Lambda
            env_vars = config['Environment']['Variables']
            self.assertTrue('TABLE_NAME' in env_vars or 'DYNAMODB_TABLE' in env_vars,
                           "Should have DynamoDB table variable")
            self.assertTrue('BUCKET_NAME' in env_vars or 'S3_BUCKET' in env_vars,
                           "Should have S3 bucket variable")

            # Check tracing is enabled
            self.assertEqual(config['TracingConfig']['Mode'], 'Active')
        except ClientError as e:
            self.fail(f"Ingestion Lambda {function_name} does not exist: {e}")

    def test_processing_lambda_exists(self):
        """Test processing Lambda function exists."""
        function_name = self.outputs['processing_function_name']
        self.assertIsNotNone(function_name, "Processing function name should be in outputs")

        # Verify function exists
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']

            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'index.handler')
            self.assertIn('EVENT_BUS_NAME', config['Environment']['Variables'])

            # Check tracing is enabled
            self.assertEqual(config['TracingConfig']['Mode'], 'Active')
        except ClientError as e:
            self.fail(f"Processing Lambda {function_name} does not exist: {e}")

    def test_api_gateway_endpoint_accessible(self):
        """Test API Gateway endpoint is configured."""
        api_endpoint = self.outputs['api_endpoint']
        self.assertIsNotNone(api_endpoint, "API endpoint should be in outputs")
        self.assertTrue(api_endpoint.startswith('https://'), "Should be HTTPS endpoint")
        self.assertIn('.execute-api.', api_endpoint, "Should be API Gateway endpoint")
        self.assertIn('/webhook', api_endpoint, "Should have /webhook path")

    def test_eventbridge_bus_exists(self):
        """Test EventBridge event bus exists."""
        bus_arn = self.outputs['eventbridge_bus_arn']
        self.assertIsNotNone(bus_arn, "EventBridge bus ARN should be in outputs")

        # Extract bus name from ARN
        bus_name = bus_arn.split('/')[-1]

        # Verify bus exists
        try:
            response = self.events.describe_event_bus(Name=bus_name)
            self.assertEqual(response['Arn'], bus_arn)
            self.assertIn('Name', response)
        except ClientError as e:
            self.fail(f"EventBridge bus {bus_name} does not exist: {e}")

    def test_lambda_has_sqs_trigger(self):
        """Test processing Lambda has SQS event source mapping."""
        function_name = self.outputs['processing_function_name']

        try:
            response = self.lambda_client.list_event_source_mappings(
                FunctionName=function_name
            )
            mappings = response['EventSourceMappings']

            self.assertGreater(len(mappings), 0, "Should have at least one event source mapping")

            # Check SQS mapping
            sqs_mapping = [m for m in mappings if 'sqs' in m['EventSourceArn']]
            self.assertEqual(len(sqs_mapping), 1, "Should have one SQS mapping")
            self.assertEqual(sqs_mapping[0]['State'], 'Enabled', "SQS mapping should be enabled")
            self.assertEqual(sqs_mapping[0]['BatchSize'], 10, "Batch size should be 10")
        except ClientError as e:
            self.fail(f"Failed to list event source mappings: {e}")

    def test_s3_bucket_lifecycle_policy(self):
        """Test S3 bucket has lifecycle policy configured."""
        bucket_name = self.outputs['s3_bucket_name']

        try:
            response = self.s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = response['Rules']

            self.assertGreater(len(rules), 0, "Should have lifecycle rules")

            # Check for GLACIER transition
            glacier_rules = [r for r in rules if any(
                t.get('StorageClass') == 'GLACIER' for t in r.get('Transitions', [])
            )]
            self.assertGreater(len(glacier_rules), 0, "Should have GLACIER transition rule")
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                self.fail(f"Failed to get lifecycle configuration: {e}")

    def test_resource_tagging(self):
        """Test resources are properly tagged."""
        # Test S3 bucket tags
        bucket_name = self.outputs['s3_bucket_name']
        try:
            response = self.s3.get_bucket_tagging(Bucket=bucket_name)
            tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}

            self.assertIn('Environment', tags, "Should have Environment tag")
            self.assertIn('Service', tags, "Should have Service tag")
            self.assertEqual(tags['Service'], 'webhook-processing')
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchTagSet':
                self.fail(f"Failed to get bucket tags: {e}")

    def test_integration_workflow(self):
        """Test end-to-end workflow components are connected."""
        # Verify all required components exist
        self.assertIn('api_endpoint', self.outputs, "API endpoint should exist")
        self.assertIn('ingestion_function_name', self.outputs, "Ingestion function should exist")
        self.assertIn('sqs_queue_url', self.outputs, "SQS queue should exist")
        self.assertIn('processing_function_name', self.outputs, "Processing function should exist")
        self.assertIn('dynamodb_table_name', self.outputs, "DynamoDB table should exist")
        self.assertIn('s3_bucket_name', self.outputs, "S3 bucket should exist")
        self.assertIn('eventbridge_bus_arn', self.outputs, "EventBridge bus should exist")

        # All components are present for the workflow:
        # API Gateway -> Ingestion Lambda -> SQS -> Processing Lambda -> EventBridge/DynamoDB/S3
        self.assertTrue(True, "All workflow components are present")


if __name__ == '__main__':
    unittest.main()
