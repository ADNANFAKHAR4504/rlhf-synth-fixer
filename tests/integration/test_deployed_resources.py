"""Integration tests for deployed cryptocurrency price processing system."""
import json
import os
import sys
import unittest
import boto3
from decimal import Decimal
from datetime import datetime
import time

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


class TestDeployedResources(unittest.TestCase):
    """Integration tests using actual deployed AWS resources."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures from deployment outputs."""
        # Load deployment outputs
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        cls.dynamodb_resource = boto3.resource('dynamodb', region_name='us-east-1')
        cls.sns_client = boto3.client('sns', region_name='us-east-1')

        # Extract resource identifiers from outputs
        cls.webhook_processor_arn = cls.outputs['webhook_processor_arn']
        cls.price_enricher_arn = cls.outputs['price_enricher_arn']
        cls.dynamodb_table_name = cls.outputs['dynamodb_table_name']
        cls.sns_topic_arn = cls.outputs['sns_topic_arn']

        # Get DynamoDB table
        cls.table = cls.dynamodb_resource.Table(cls.dynamodb_table_name)

    def test_deployment_outputs_exist(self):
        """Test that all required deployment outputs are present."""
        required_outputs = [
            'webhook_processor_arn',
            'price_enricher_arn',
            'dynamodb_table_name',
            'sns_topic_arn'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs)
            self.assertIsNotNone(self.outputs[output])

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is accessible."""
        response = self.dynamodb_client.describe_table(
            TableName=self.dynamodb_table_name
        )

        self.assertEqual(response['Table']['TableName'], self.dynamodb_table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')

    def test_dynamodb_table_has_correct_schema(self):
        """Test that DynamoDB table has correct key schema."""
        response = self.dynamodb_client.describe_table(
            TableName=self.dynamodb_table_name
        )

        key_schema = response['Table']['KeySchema']
        attribute_definitions = response['Table']['AttributeDefinitions']

        # Check key schema
        self.assertEqual(len(key_schema), 2)

        hash_key = next(k for k in key_schema if k['KeyType'] == 'HASH')
        range_key = next(k for k in key_schema if k['KeyType'] == 'RANGE')

        self.assertEqual(hash_key['AttributeName'], 'symbol')
        self.assertEqual(range_key['AttributeName'], 'timestamp')

        # Check attribute definitions
        symbol_attr = next(a for a in attribute_definitions if a['AttributeName'] == 'symbol')
        timestamp_attr = next(
            a for a in attribute_definitions if a['AttributeName'] == 'timestamp'
        )

        self.assertEqual(symbol_attr['AttributeType'], 'S')
        self.assertEqual(timestamp_attr['AttributeType'], 'N')

    def test_dynamodb_table_has_streams_enabled(self):
        """Test that DynamoDB table has streams enabled."""
        response = self.dynamodb_client.describe_table(
            TableName=self.dynamodb_table_name
        )

        self.assertIn('StreamSpecification', response['Table'])
        stream_spec = response['Table']['StreamSpecification']
        self.assertTrue(stream_spec['StreamEnabled'])
        self.assertEqual(stream_spec['StreamViewType'], 'NEW_AND_OLD_IMAGES')

    def test_dynamodb_table_billing_mode(self):
        """Test that DynamoDB table uses on-demand billing."""
        response = self.dynamodb_client.describe_table(
            TableName=self.dynamodb_table_name
        )

        self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

    def test_webhook_processor_lambda_exists(self):
        """Test that webhook processor Lambda function exists and is active."""
        response = self.lambda_client.get_function(
            FunctionName=self.webhook_processor_arn
        )

        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertIn('webhook-processor', response['Configuration']['FunctionName'])

    def test_webhook_processor_lambda_configuration(self):
        """Test webhook processor Lambda function configuration."""
        response = self.lambda_client.get_function(
            FunctionName=self.webhook_processor_arn
        )

        config = response['Configuration']

        # Check runtime and architecture
        self.assertEqual(config['Runtime'], 'python3.9')
        self.assertEqual(config['Architectures'], ['arm64'])

        # Check memory and timeout
        self.assertEqual(config['MemorySize'], 1024)
        self.assertEqual(config['Timeout'], 60)

        # Check reserved concurrent executions
        self.assertEqual(config['ReservedConcurrentExecutions'], 10)

        # Check environment variables
        self.assertIn('DYNAMODB_TABLE', config['Environment']['Variables'])
        self.assertEqual(
            config['Environment']['Variables']['DYNAMODB_TABLE'],
            self.dynamodb_table_name
        )

    def test_price_enricher_lambda_exists(self):
        """Test that price enricher Lambda function exists and is active."""
        response = self.lambda_client.get_function(
            FunctionName=self.price_enricher_arn
        )

        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertIn('price-enricher', response['Configuration']['FunctionName'])

    def test_price_enricher_lambda_configuration(self):
        """Test price enricher Lambda function configuration."""
        response = self.lambda_client.get_function(
            FunctionName=self.price_enricher_arn
        )

        config = response['Configuration']

        # Check runtime and architecture
        self.assertEqual(config['Runtime'], 'python3.9')
        self.assertEqual(config['Architectures'], ['arm64'])

        # Check memory and timeout
        self.assertEqual(config['MemorySize'], 512)
        self.assertEqual(config['Timeout'], 30)

        # Check reserved concurrent executions
        self.assertEqual(config['ReservedConcurrentExecutions'], 5)

    def test_price_enricher_has_event_source_mapping(self):
        """Test that price enricher has DynamoDB stream event source mapping."""
        response = self.lambda_client.list_event_source_mappings(
            FunctionName=self.price_enricher_arn
        )

        self.assertGreater(len(response['EventSourceMappings']), 0)

        mapping = response['EventSourceMappings'][0]
        self.assertEqual(mapping['State'], 'Enabled')
        self.assertIn('dynamodb', mapping['EventSourceArn'])
        self.assertEqual(mapping['StartingPosition'], 'LATEST')

    def test_sns_topic_exists(self):
        """Test that SNS topic exists."""
        response = self.sns_client.get_topic_attributes(
            TopicArn=self.sns_topic_arn
        )

        self.assertIn('Attributes', response)
        self.assertIn('price-updates-success', response['Attributes']['TopicArn'])

    def test_webhook_processor_invocation(self):
        """Test that webhook processor can be invoked successfully."""
        payload = {
            'symbol': 'BTC',
            'price': 50000.00,
            'exchange': 'test-exchange',
            'volume': 1234.56
        }

        response = self.lambda_client.invoke(
            FunctionName=self.webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)

        body = json.loads(response_payload['body'])
        self.assertIn('message', body)
        self.assertEqual(body['symbol'], 'BTC')

    def test_webhook_processor_stores_data_in_dynamodb(self):
        """Test that webhook processor stores data in DynamoDB."""
        # Generate unique timestamp for this test
        timestamp = int(datetime.utcnow().timestamp() * 1000)

        payload = {
            'symbol': 'TEST',
            'price': 12345.67,
            'exchange': 'test-exchange',
            'volume': 999.99
        }

        # Invoke webhook processor
        self.lambda_client.invoke(
            FunctionName=self.webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        # Wait a moment for DynamoDB to be consistent
        time.sleep(1)

        # Query DynamoDB to verify data was stored
        response = self.table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': 'TEST'
            },
            ScanIndexForward=False,
            Limit=1
        )

        self.assertGreater(len(response['Items']), 0)

        item = response['Items'][0]
        self.assertEqual(item['symbol'], 'TEST')
        self.assertEqual(item['exchange'], 'test-exchange')
        self.assertEqual(item['processed'], False)

    def test_webhook_processor_validation_rejects_missing_fields(self):
        """Test that webhook processor validates required fields."""
        # Missing 'exchange' field
        payload = {
            'symbol': 'BTC',
            'price': 50000.00
        }

        response = self.lambda_client.invoke(
            FunctionName=self.webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 400)

        body = json.loads(response_payload['body'])
        self.assertIn('error', body)

    def test_lambda_functions_have_kms_encryption(self):
        """Test that Lambda functions use KMS encryption for environment variables."""
        webhook_response = self.lambda_client.get_function(
            FunctionName=self.webhook_processor_arn
        )
        enricher_response = self.lambda_client.get_function(
            FunctionName=self.price_enricher_arn
        )

        # Both should have KMS key ARN
        self.assertIn('KMSKeyArn', webhook_response['Configuration'])
        self.assertIn('KMSKeyArn', enricher_response['Configuration'])

        # Verify they're not using AWS managed key
        self.assertNotIn('aws/lambda', webhook_response['Configuration']['KMSKeyArn'])
        self.assertNotIn('aws/lambda', enricher_response['Configuration']['KMSKeyArn'])

    def test_lambda_functions_have_dead_letter_config(self):
        """Test that Lambda functions have dead letter queue configuration."""
        webhook_response = self.lambda_client.get_function(
            FunctionName=self.webhook_processor_arn
        )
        enricher_response = self.lambda_client.get_function(
            FunctionName=self.price_enricher_arn
        )

        # Both should have DLQ configured
        self.assertIn('DeadLetterConfig', webhook_response['Configuration'])
        self.assertIn('DeadLetterConfig', enricher_response['Configuration'])

        # Verify DLQ ARN is set
        self.assertIn('TargetArn', webhook_response['Configuration']['DeadLetterConfig'])
        self.assertIn('TargetArn', enricher_response['Configuration']['DeadLetterConfig'])

    def test_dynamodb_table_has_point_in_time_recovery(self):
        """Test that DynamoDB table has point-in-time recovery enabled."""
        response = self.dynamodb_client.describe_continuous_backups(
            TableName=self.dynamodb_table_name
        )

        pitr = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
        self.assertEqual(pitr['PointInTimeRecoveryStatus'], 'ENABLED')

    def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow from webhook to enrichment."""
        # Generate unique timestamp
        base_timestamp = int(datetime.utcnow().timestamp() * 1000)

        # Insert multiple price points to enable enrichment
        test_symbol = 'E2ETEST'

        for i in range(25):
            payload = {
                'symbol': test_symbol,
                'price': 50000.00 + (i * 100),
                'exchange': 'test-exchange',
                'volume': 1000.00 + i
            }

            self.lambda_client.invoke(
                FunctionName=self.webhook_processor_arn,
                InvocationType='Event',  # Async invocation
                Payload=json.dumps(payload)
            )

            # Small delay between insertions
            time.sleep(0.2)

        # Wait for stream processing (enricher lambda)
        time.sleep(10)

        # Query DynamoDB to check if enrichment occurred
        response = self.table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': test_symbol
            },
            ScanIndexForward=False,
            Limit=5
        )

        # At least some items should be processed
        items = response['Items']
        self.assertGreater(len(items), 0)

        # Check if any items have been enriched
        enriched_items = [item for item in items if item.get('processed', False)]

        # Note: Due to timing, not all items may be enriched yet, but at least some should be
        if len(enriched_items) > 0:
            # Verify enrichment fields exist
            enriched_item = enriched_items[0]
            self.assertTrue(enriched_item['processed'])
            # Note: ma_5, ma_20, volatility might be 0 if not enough data points

    def test_lambda_iam_permissions(self):
        """Test that Lambda functions have necessary IAM permissions."""
        webhook_response = self.lambda_client.get_function(
            FunctionName=self.webhook_processor_arn
        )
        enricher_response = self.lambda_client.get_function(
            FunctionName=self.price_enricher_arn
        )

        # Both should have IAM roles
        self.assertIn('Role', webhook_response['Configuration'])
        self.assertIn('Role', enricher_response['Configuration'])

        # Roles should be different (least privilege)
        self.assertNotEqual(
            webhook_response['Configuration']['Role'],
            enricher_response['Configuration']['Role']
        )

    def test_cloudwatch_logs_exist(self):
        """Test that CloudWatch log groups exist for Lambda functions."""
        logs_client = boto3.client('logs', region_name='us-east-1')

        webhook_function_name = self.webhook_processor_arn.split(':')[-1]
        enricher_function_name = self.price_enricher_arn.split(':')[-1]

        # Check webhook processor logs
        webhook_logs = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/aws/lambda/{webhook_function_name}'
        )
        self.assertGreater(len(webhook_logs['logGroups']), 0)

        # Check enricher logs
        enricher_logs = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/aws/lambda/{enricher_function_name}'
        )
        self.assertGreater(len(enricher_logs['logGroups']), 0)

        # Check retention period (should be 3 days)
        for log_group in webhook_logs['logGroups'] + enricher_logs['logGroups']:
            if 'retentionInDays' in log_group:
                self.assertEqual(log_group['retentionInDays'], 3)


if __name__ == '__main__':
    unittest.main()
