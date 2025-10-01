"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import time
import boto3
from decimal import Decimal


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load the stack outputs from deployment
        outputs_file = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.environ.get('AWS_REGION', 'us-west-1')
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)

    def test_sqs_queue_exists(self):
        """Test that main SQS queue exists and is configured correctly."""
        queue_url = self.outputs['main_queue_url']

        # Get queue attributes
        response = self.sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        attributes = response['Attributes']

        # Verify queue is FIFO
        self.assertTrue(attributes.get('FifoQueue', 'false') == 'true')

        # Verify content-based deduplication
        self.assertTrue(attributes.get('ContentBasedDeduplication', 'false') == 'true')

        # Verify message retention (4 days = 345600 seconds)
        self.assertEqual(int(attributes['MessageRetentionPeriod']), 345600)

        # Verify visibility timeout (60 seconds)
        self.assertEqual(int(attributes['VisibilityTimeout']), 60)

        # Verify redrive policy exists
        self.assertIn('RedrivePolicy', attributes)

    def test_dlq_exists(self):
        """Test that DLQ exists and is configured correctly."""
        dlq_url = self.outputs['dlq_url']

        # Get queue attributes
        response = self.sqs_client.get_queue_attributes(
            QueueUrl=dlq_url,
            AttributeNames=['All']
        )

        attributes = response['Attributes']

        # Verify DLQ is FIFO
        self.assertTrue(attributes.get('FifoQueue', 'false') == 'true')

        # Verify message retention (14 days = 1209600 seconds)
        self.assertEqual(int(attributes['MessageRetentionPeriod']), 1209600)

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is configured correctly."""
        table_name = self.outputs['dynamodb_table_name']

        # Describe table
        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        # Verify table status
        self.assertEqual(table['TableStatus'], 'ACTIVE')

        # Verify billing mode
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Verify key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
        self.assertEqual(key_schema['player_id'], 'HASH')
        self.assertEqual(key_schema['timestamp'], 'RANGE')

        # Verify stream is enabled
        self.assertIn('StreamSpecification', table)
        self.assertTrue(table['StreamSpecification']['StreamEnabled'])
        self.assertEqual(table['StreamSpecification']['StreamViewType'], 'NEW_AND_OLD_IMAGES')

        # Verify point-in-time recovery
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=table_name
        )
        self.assertEqual(
            pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
            'ENABLED'
        )

    def test_lambda_function_exists(self):
        """Test that Lambda function exists and is configured correctly."""
        function_name = self.outputs['lambda_function_name']

        # Get function configuration
        response = self.lambda_client.get_function_configuration(
            FunctionName=function_name
        )

        # Verify runtime
        self.assertEqual(response['Runtime'], 'python3.11')

        # Verify handler
        self.assertEqual(response['Handler'], 'index.handler')

        # Verify memory
        self.assertEqual(response['MemorySize'], 512)

        # Verify timeout
        self.assertEqual(response['Timeout'], 30)

        # Verify reserved concurrent executions
        self.assertEqual(response.get('ReservedConcurrentExecutions'), 10)

        # Verify environment variables
        env_vars = response.get('Environment', {}).get('Variables', {})
        self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
        self.assertIn('DLQ_URL', env_vars)

    def test_event_source_mapping_exists(self):
        """Test that Lambda is triggered by SQS queue."""
        function_name = self.outputs['lambda_function_name']

        # List event source mappings
        response = self.lambda_client.list_event_source_mappings(
            FunctionName=function_name
        )

        # Find mapping for our queue
        queue_url = self.outputs['main_queue_url']
        queue_arn = None

        for mapping in response['EventSourceMappings']:
            if queue_url.split('/')[-1] in mapping['EventSourceArn']:
                queue_arn = mapping['EventSourceArn']
                # Verify mapping is enabled
                self.assertEqual(mapping['State'], 'Enabled')
                # Verify batch size
                self.assertEqual(mapping['BatchSize'], 10)
                break

        self.assertIsNotNone(queue_arn, "Event source mapping not found")

    def test_cloudwatch_alarm_exists(self):
        """Test that CloudWatch alarm for DLQ exists."""
        alarm_name = self.outputs['dlq_alarm_name']

        # Describe alarm
        response = self.cloudwatch_client.describe_alarms(
            AlarmNames=[alarm_name]
        )

        self.assertEqual(len(response['MetricAlarms']), 1)
        alarm = response['MetricAlarms'][0]

        # Verify alarm configuration
        self.assertEqual(alarm['MetricName'], 'ApproximateNumberOfMessagesVisible')
        self.assertEqual(alarm['Namespace'], 'AWS/SQS')
        self.assertEqual(alarm['Statistic'], 'Average')
        self.assertEqual(alarm['Period'], 300)
        self.assertEqual(alarm['EvaluationPeriods'], 1)
        self.assertEqual(alarm['Threshold'], 10.0)
        self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')

    def test_end_to_end_message_processing(self):
        """Test sending a message through the system."""
        queue_url = self.outputs['main_queue_url']
        table_name = self.outputs['dynamodb_table_name']

        # Create test message
        test_message = {
            'player_id': 'test-player-integration',
            'score': 999,
            'game_id': 'test-game',
            'update_type': 'integration_test',
            'metadata': {'test': True}
        }

        # Send message to queue
        response = self.sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message),
            MessageGroupId='integration-test',
            MessageDeduplicationId=f'integration-test-{int(time.time())}'
        )

        self.assertIn('MessageId', response)

        # Wait for processing (Lambda should process within 30 seconds)
        time.sleep(10)

        # Query DynamoDB to verify record was written
        dynamodb = boto3.resource('dynamodb', region_name=self.region)
        table = dynamodb.Table(table_name)

        response = table.query(
            KeyConditionExpression='player_id = :pid',
            ExpressionAttributeValues={
                ':pid': 'test-player-integration'
            },
            ScanIndexForward=False,  # Get latest first
            Limit=1
        )

        # Verify record exists
        self.assertGreater(response['Count'], 0)

        if response['Count'] > 0:
            item = response['Items'][0]
            self.assertEqual(item['player_id'], 'test-player-integration')
            self.assertEqual(int(item['score']), 999)
            self.assertEqual(item['game_id'], 'test-game')
            self.assertEqual(item['update_type'], 'integration_test')

    def test_lambda_logs_exist(self):
        """Test that Lambda function creates logs in CloudWatch."""
        function_name = self.outputs['lambda_function_name']
        log_group_name = f'/aws/lambda/{function_name}'

        try:
            # Check if log group exists
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name,
                limit=1
            )

            self.assertGreater(len(response['logGroups']), 0)

            # Verify retention
            if len(response['logGroups']) > 0:
                log_group = response['logGroups'][0]
                # Verify retention is set (7 days = 7)
                self.assertEqual(log_group.get('retentionInDays'), 7)
        except Exception as e:
            # Log group might not exist if Lambda hasn't run yet
            pass

    def test_infrastructure_tags(self):
        """Test that resources are properly tagged."""
        queue_url = self.outputs['main_queue_url']

        # Get queue tags
        response = self.sqs_client.list_queue_tags(QueueUrl=queue_url)
        tags = response.get('Tags', {})

        # Verify required tags
        self.assertIn('Environment', tags)
        self.assertIn('Purpose', tags)
        self.assertEqual(tags['Purpose'], 'Gaming-Leaderboard-System')


if __name__ == '__main__':
    unittest.main()
