"""Integration tests for deployed cryptocurrency price processing system."""
import json
import os
import sys
import unittest
import boto3
from pathlib import Path
from decimal import Decimal
from datetime import datetime
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
region = os.getenv('AWS_REGION', 'us-east-1')

# Read outputs from flat-outputs.json
outputs_path = Path(os.getcwd()) / 'cfn-outputs' / 'flat-outputs.json'
outputs_data = json.loads(outputs_path.read_text())

# Get stack outputs - handle nested structure from CDKTF
stack_key = f'TapStack{environment_suffix}'
stack_outputs = outputs_data.get(stack_key, outputs_data)

# Extract resource identifiers from outputs
webhook_processor_arn = stack_outputs['webhook_processor_arn']
price_enricher_arn = stack_outputs['price_enricher_arn']
dynamodb_table_name = stack_outputs['dynamodb_table_name']
sns_topic_arn = stack_outputs['sns_topic_arn']

# Initialize AWS clients with region from environment
lambda_client = boto3.client('lambda', region_name=region)
dynamodb_client = boto3.client('dynamodb', region_name=region)
dynamodb_resource = boto3.resource('dynamodb', region_name=region)
sns_client = boto3.client('sns', region_name=region)
sqs_client = boto3.client('sqs', region_name=region)
kms_client = boto3.client('kms', region_name=region)
logs_client = boto3.client('logs', region_name=region)

# Get DynamoDB table resource
table = dynamodb_resource.Table(dynamodb_table_name)


class TestDeploymentOutputs(unittest.TestCase):
    """Test that all required deployment outputs are present."""

    def test_webhook_processor_arn_exists(self):
        """Test webhook processor ARN output exists."""
        self.assertIsNotNone(webhook_processor_arn)
        self.assertIn('lambda', webhook_processor_arn)

    def test_price_enricher_arn_exists(self):
        """Test price enricher ARN output exists."""
        self.assertIsNotNone(price_enricher_arn)
        self.assertIn('lambda', price_enricher_arn)

    def test_dynamodb_table_name_exists(self):
        """Test DynamoDB table name output exists."""
        self.assertIsNotNone(dynamodb_table_name)
        self.assertIn(environment_suffix, dynamodb_table_name)

    def test_sns_topic_arn_exists(self):
        """Test SNS topic ARN output exists."""
        self.assertIsNotNone(sns_topic_arn)
        self.assertIn('sns', sns_topic_arn)


class TestDynamoDBTable(unittest.TestCase):
    """Test DynamoDB table configuration and functionality."""

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is active."""
        response = dynamodb_client.describe_table(TableName=dynamodb_table_name)
        self.assertEqual(response['Table']['TableName'], dynamodb_table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')

    def test_dynamodb_table_key_schema(self):
        """Test DynamoDB table has correct key schema."""
        response = dynamodb_client.describe_table(TableName=dynamodb_table_name)
        key_schema = response['Table']['KeySchema']
        self.assertEqual(len(key_schema), 2)
        hash_key = next(k for k in key_schema if k['KeyType'] == 'HASH')
        range_key = next(k for k in key_schema if k['KeyType'] == 'RANGE')
        self.assertEqual(hash_key['AttributeName'], 'symbol')
        self.assertEqual(range_key['AttributeName'], 'timestamp')

    def test_dynamodb_table_attribute_definitions(self):
        """Test DynamoDB table has correct attribute definitions."""
        response = dynamodb_client.describe_table(TableName=dynamodb_table_name)
        attribute_definitions = response['Table']['AttributeDefinitions']
        symbol_attr = next(a for a in attribute_definitions if a['AttributeName'] == 'symbol')
        timestamp_attr = next(a for a in attribute_definitions if a['AttributeName'] == 'timestamp')
        self.assertEqual(symbol_attr['AttributeType'], 'S')
        self.assertEqual(timestamp_attr['AttributeType'], 'N')

    def test_dynamodb_table_streams_enabled(self):
        """Test DynamoDB table has streams enabled."""
        response = dynamodb_client.describe_table(TableName=dynamodb_table_name)
        self.assertIn('StreamSpecification', response['Table'])
        stream_spec = response['Table']['StreamSpecification']
        self.assertTrue(stream_spec['StreamEnabled'])
        self.assertEqual(stream_spec['StreamViewType'], 'NEW_AND_OLD_IMAGES')

    def test_dynamodb_table_billing_mode(self):
        """Test DynamoDB table uses on-demand billing."""
        response = dynamodb_client.describe_table(TableName=dynamodb_table_name)
        self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

    def test_dynamodb_table_point_in_time_recovery(self):
        """Test DynamoDB table has point-in-time recovery enabled."""
        response = dynamodb_client.describe_continuous_backups(TableName=dynamodb_table_name)
        pitr = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
        self.assertEqual(pitr['PointInTimeRecoveryStatus'], 'ENABLED')


class TestWebhookProcessorLambda(unittest.TestCase):
    """Test webhook processor Lambda function configuration and functionality."""

    def test_webhook_processor_exists(self):
        """Test webhook processor Lambda exists and is active."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertIn('webhook-processor', response['Configuration']['FunctionName'])

    def test_webhook_processor_runtime(self):
        """Test webhook processor uses Python 3.9 runtime."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')

    def test_webhook_processor_architecture(self):
        """Test webhook processor uses ARM64 architecture."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertEqual(response['Configuration']['Architectures'], ['arm64'])

    def test_webhook_processor_memory(self):
        """Test webhook processor has correct memory."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertEqual(response['Configuration']['MemorySize'], 1024)

    def test_webhook_processor_timeout(self):
        """Test webhook processor has correct timeout."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertEqual(response['Configuration']['Timeout'], 60)

    def test_webhook_processor_reserved_concurrency(self):
        """Test webhook processor has correct reserved concurrency."""
        response = lambda_client.get_function_concurrency(FunctionName=webhook_processor_arn)
        self.assertEqual(response['ReservedConcurrentExecutions'], 10)

    def test_webhook_processor_environment_variables(self):
        """Test webhook processor has required environment variables."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        env_vars = response['Configuration']['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertEqual(env_vars['DYNAMODB_TABLE'], dynamodb_table_name)

    def test_webhook_processor_kms_encryption(self):
        """Test webhook processor uses customer-managed KMS key."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertIn('KMSKeyArn', response['Configuration'])
        self.assertNotIn('aws/lambda', response['Configuration']['KMSKeyArn'])

    def test_webhook_processor_dead_letter_config(self):
        """Test webhook processor has dead letter queue configured."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertIn('DeadLetterConfig', response['Configuration'])
        self.assertIn('TargetArn', response['Configuration']['DeadLetterConfig'])

    def test_webhook_processor_iam_role(self):
        """Test webhook processor has IAM role configured."""
        response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        self.assertIn('Role', response['Configuration'])
        self.assertIn('webhook-processor', response['Configuration']['Role'])


class TestPriceEnricherLambda(unittest.TestCase):
    """Test price enricher Lambda function configuration and functionality."""

    def test_price_enricher_exists(self):
        """Test price enricher Lambda exists and is active."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertIn('price-enricher', response['Configuration']['FunctionName'])

    def test_price_enricher_runtime(self):
        """Test price enricher uses Python 3.9 runtime."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')

    def test_price_enricher_architecture(self):
        """Test price enricher uses ARM64 architecture."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertEqual(response['Configuration']['Architectures'], ['arm64'])

    def test_price_enricher_memory(self):
        """Test price enricher has correct memory."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertEqual(response['Configuration']['MemorySize'], 512)

    def test_price_enricher_timeout(self):
        """Test price enricher has correct timeout."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertEqual(response['Configuration']['Timeout'], 30)

    def test_price_enricher_reserved_concurrency(self):
        """Test price enricher has correct reserved concurrency."""
        response = lambda_client.get_function_concurrency(FunctionName=price_enricher_arn)
        self.assertEqual(response['ReservedConcurrentExecutions'], 5)

    def test_price_enricher_environment_variables(self):
        """Test price enricher has required environment variables."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        env_vars = response['Configuration']['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertEqual(env_vars['DYNAMODB_TABLE'], dynamodb_table_name)

    def test_price_enricher_kms_encryption(self):
        """Test price enricher uses customer-managed KMS key."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertIn('KMSKeyArn', response['Configuration'])
        self.assertNotIn('aws/lambda', response['Configuration']['KMSKeyArn'])

    def test_price_enricher_dead_letter_config(self):
        """Test price enricher has dead letter queue configured."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertIn('DeadLetterConfig', response['Configuration'])
        self.assertIn('TargetArn', response['Configuration']['DeadLetterConfig'])

    def test_price_enricher_event_source_mapping(self):
        """Test price enricher has DynamoDB stream event source mapping."""
        response = lambda_client.list_event_source_mappings(FunctionName=price_enricher_arn)
        self.assertGreater(len(response['EventSourceMappings']), 0)
        mapping = response['EventSourceMappings'][0]
        self.assertEqual(mapping['State'], 'Enabled')
        self.assertIn('dynamodb', mapping['EventSourceArn'])
        self.assertEqual(mapping['StartingPosition'], 'LATEST')

    def test_price_enricher_iam_role(self):
        """Test price enricher has separate IAM role."""
        response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertIn('Role', response['Configuration'])
        self.assertIn('price-enricher', response['Configuration']['Role'])


class TestSNSTopic(unittest.TestCase):
    """Test SNS topic configuration."""

    def test_sns_topic_exists(self):
        """Test SNS topic exists."""
        response = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
        self.assertIn('Attributes', response)
        self.assertIn('price-updates-success', response['Attributes']['TopicArn'])

    def test_sns_topic_name_contains_suffix(self):
        """Test SNS topic name contains environment suffix."""
        self.assertIn(environment_suffix, sns_topic_arn)


class TestSQSDeadLetterQueues(unittest.TestCase):
    """Test SQS dead letter queue configuration."""

    def test_webhook_processor_dlq_exists(self):
        """Test webhook processor DLQ exists."""
        response = sqs_client.list_queues(QueueNamePrefix=f'webhook-processor-dlq-{environment_suffix}')
        self.assertIn('QueueUrls', response)
        self.assertGreater(len(response['QueueUrls']), 0)

    def test_price_enricher_dlq_exists(self):
        """Test price enricher DLQ exists."""
        response = sqs_client.list_queues(QueueNamePrefix=f'price-enricher-dlq-{environment_suffix}')
        self.assertIn('QueueUrls', response)
        self.assertGreater(len(response['QueueUrls']), 0)


class TestKMSKey(unittest.TestCase):
    """Test KMS key configuration."""

    def test_kms_alias_exists(self):
        """Test KMS alias exists for Lambda environment variables."""
        response = kms_client.list_aliases()
        alias_names = [a['AliasName'] for a in response['Aliases']]
        expected_alias = f'alias/lambda-env-{environment_suffix}'
        self.assertIn(expected_alias, alias_names)


class TestCloudWatchLogGroups(unittest.TestCase):
    """Test CloudWatch log group configuration."""

    def test_webhook_processor_log_group_exists(self):
        """Test webhook processor log group exists."""
        webhook_function_name = webhook_processor_arn.split(':')[-1]
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/aws/lambda/{webhook_function_name}'
        )
        self.assertGreater(len(response['logGroups']), 0)

    def test_price_enricher_log_group_exists(self):
        """Test price enricher log group exists."""
        enricher_function_name = price_enricher_arn.split(':')[-1]
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/aws/lambda/{enricher_function_name}'
        )
        self.assertGreater(len(response['logGroups']), 0)

    def test_log_groups_retention(self):
        """Test log groups have correct retention period."""
        webhook_function_name = webhook_processor_arn.split(':')[-1]
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/aws/lambda/{webhook_function_name}'
        )
        for log_group in response['logGroups']:
            if 'retentionInDays' in log_group:
                self.assertEqual(log_group['retentionInDays'], 3)


class TestLambdaInvocation(unittest.TestCase):
    """Test Lambda function invocation and end-to-end workflow."""

    def test_webhook_processor_invocation_success(self):
        """Test webhook processor can be invoked successfully."""
        payload = {
            'symbol': 'BTC',
            'price': 50000.00,
            'exchange': 'test-exchange',
            'volume': 1234.56
        }
        response = lambda_client.invoke(
            FunctionName=webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        self.assertEqual(response['StatusCode'], 200)
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)
        body = json.loads(response_payload['body'])
        self.assertIn('message', body)
        self.assertEqual(body['symbol'], 'BTC')

    def test_webhook_processor_validation_missing_symbol(self):
        """Test webhook processor validates missing symbol."""
        payload = {
            'price': 50000.00,
            'exchange': 'test-exchange'
        }
        response = lambda_client.invoke(
            FunctionName=webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 400)
        body = json.loads(response_payload['body'])
        self.assertIn('error', body)

    def test_webhook_processor_validation_missing_price(self):
        """Test webhook processor validates missing price."""
        payload = {
            'symbol': 'BTC',
            'exchange': 'test-exchange'
        }
        response = lambda_client.invoke(
            FunctionName=webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 400)

    def test_webhook_processor_validation_missing_exchange(self):
        """Test webhook processor validates missing exchange."""
        payload = {
            'symbol': 'BTC',
            'price': 50000.00
        }
        response = lambda_client.invoke(
            FunctionName=webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 400)

    def test_webhook_processor_stores_data_in_dynamodb(self):
        """Test webhook processor stores data in DynamoDB."""
        test_symbol = f'INTTEST{int(time.time())}'
        payload = {
            'symbol': test_symbol,
            'price': 12345.67,
            'exchange': 'integration-test',
            'volume': 999.99
        }
        lambda_client.invoke(
            FunctionName=webhook_processor_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        time.sleep(2)
        response = table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={':symbol': test_symbol.upper()},
            ScanIndexForward=False,
            Limit=1
        )
        self.assertGreater(len(response['Items']), 0)
        item = response['Items'][0]
        self.assertEqual(item['symbol'], test_symbol.upper())
        self.assertEqual(item['exchange'], 'integration-test')
        self.assertEqual(item['processed'], False)


class TestIAMRoles(unittest.TestCase):
    """Test IAM role configuration."""

    def test_lambda_roles_are_different(self):
        """Test Lambda functions have separate IAM roles."""
        webhook_response = lambda_client.get_function(FunctionName=webhook_processor_arn)
        enricher_response = lambda_client.get_function(FunctionName=price_enricher_arn)
        self.assertNotEqual(
            webhook_response['Configuration']['Role'],
            enricher_response['Configuration']['Role']
        )


class TestEndToEndWorkflow(unittest.TestCase):
    """Test complete end-to-end workflow."""

    def test_end_to_end_price_processing(self):
        """Test complete workflow from webhook to enrichment."""
        test_symbol = f'E2E{int(time.time())}'
        for i in range(5):
            payload = {
                'symbol': test_symbol,
                'price': 50000.00 + (i * 100),
                'exchange': 'e2e-test',
                'volume': 1000.00 + i
            }
            lambda_client.invoke(
                FunctionName=webhook_processor_arn,
                InvocationType='Event',
                Payload=json.dumps(payload)
            )
            time.sleep(0.5)
        time.sleep(5)
        response = table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={':symbol': test_symbol.upper()},
            ScanIndexForward=False,
            Limit=5
        )
        self.assertGreater(len(response['Items']), 0)


if __name__ == '__main__':
    unittest.main()
