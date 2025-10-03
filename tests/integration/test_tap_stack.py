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
from botocore.exceptions import ClientError
import pulumi
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.stack_name = f"TapStack{cls.environment_suffix}"
        cls.project_name = "TapStack"
        cls.aws_region = 'us-west-1'

        # AWS clients
        cls.sqs_client = boto3.client('sqs', region_name=cls.aws_region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.aws_region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.aws_region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.aws_region)
        cls.logs_client = boto3.client('logs', region_name=cls.aws_region)

        # Get actual resource names from environment variables or discover them
        # First try to get from environment variables (set by CI/CD)
        cls.main_queue_name = os.getenv('MAIN_QUEUE_NAME')
        cls.dlq_name = os.getenv('DLQ_NAME') 
        cls.table_name = os.getenv('DYNAMODB_TABLE_NAME')
        cls.lambda_function_name = os.getenv('LAMBDA_FUNCTION_NAME')
        
        # If not in env vars, try to discover queue names by listing and filtering
        if not cls.main_queue_name or not cls.dlq_name:
            try:
                # List all queues and find ones matching our pattern
                queues_response = cls.sqs_client.list_queues(QueueNamePrefix=f'campaign-events')
                queue_urls = queues_response.get('QueueUrls', [])
                
                for queue_url in queue_urls:
                    queue_name = queue_url.split('/')[-1]
                    if f'campaign-events-queue-{cls.environment_suffix}' in queue_name:
                        cls.main_queue_name = queue_name
                    elif f'campaign-events-dlq-{cls.environment_suffix}' in queue_name:
                        cls.dlq_name = queue_name
                        
                print(f"Discovered queue names: main={cls.main_queue_name}, dlq={cls.dlq_name}")
                        
            except Exception as e:
                print(f"Warning: Could not discover queue names: {e}")
        
        # Fallback to constructed names if discovery fails
        if not cls.main_queue_name:
            cls.main_queue_name = f"campaign-events-queue-{cls.environment_suffix}"
        if not cls.dlq_name:
            cls.dlq_name = f"campaign-events-dlq-{cls.environment_suffix}"
        if not cls.table_name:
            cls.table_name = f"campaign-events-log-{cls.environment_suffix}"
        if not cls.lambda_function_name:
            cls.lambda_function_name = f"campaign-event-processor-{cls.environment_suffix}"
        
        print(f"Using resource names: queue={cls.main_queue_name}, dlq={cls.dlq_name}, table={cls.table_name}, lambda={cls.lambda_function_name}")

    def test_sqs_main_queue_exists(self):
        """Test that the main SQS queue exists and is configured correctly."""
        try:
            response = self.sqs_client.get_queue_url(QueueName=self.main_queue_name)
            queue_url = response['QueueUrl']
            self.assertIsNotNone(queue_url)

            # Get queue attributes
            attributes = self.sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )

            # Verify visibility timeout
            self.assertEqual(
                int(attributes['Attributes']['VisibilityTimeout']),
                120,
                "Visibility timeout should be 120 seconds"
            )

            # Verify message retention period
            self.assertEqual(
                int(attributes['Attributes']['MessageRetentionPeriod']),
                1209600,  # 14 days in seconds
                "Message retention should be 14 days"
            )

            # Verify DLQ configuration
            redrive_policy = json.loads(attributes['Attributes'].get('RedrivePolicy', '{}'))
            self.assertIn('deadLetterTargetArn', redrive_policy)
            self.assertEqual(redrive_policy['maxReceiveCount'], 3)

        except ClientError as e:
            self.fail(f"Main SQS queue does not exist or is not accessible: {e}")

    def test_sqs_dlq_exists(self):
        """Test that the Dead Letter Queue exists."""
        try:
            response = self.sqs_client.get_queue_url(QueueName=self.dlq_name)
            self.assertIsNotNone(response['QueueUrl'])

            # Get queue attributes
            attributes = self.sqs_client.get_queue_attributes(
                QueueUrl=response['QueueUrl'],
                AttributeNames=['MessageRetentionPeriod']
            )

            # Verify message retention period
            self.assertEqual(
                int(attributes['Attributes']['MessageRetentionPeriod']),
                1209600,  # 14 days in seconds
                "DLQ message retention should be 14 days"
            )

        except ClientError as e:
            self.fail(f"Dead Letter Queue does not exist or is not accessible: {e}")

    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists and is configured correctly."""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.table_name)
            table = response['Table']

            # Verify table status
            self.assertEqual(table['TableStatus'], 'ACTIVE')

            # Verify billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Verify key schema
            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            self.assertEqual(key_schema.get('event_id'), 'HASH')
            self.assertEqual(key_schema.get('timestamp'), 'RANGE')

            # Verify point-in-time recovery
            pitr_response = self.dynamodb_client.describe_continuous_backups(
                TableName=self.table_name
            )
            self.assertEqual(
                pitr_response['ContinuousBackupsDescription'][
                    'PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
                'ENABLED'
            )

        except ClientError as e:
            self.fail(f"DynamoDB table does not exist or is not accessible: {e}")

    def test_lambda_function_exists(self):
        """Test that the Lambda function exists and is configured correctly."""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            config = response['Configuration']

            # Verify runtime
            self.assertEqual(config['Runtime'], 'python3.9')

            # Verify handler
            self.assertEqual(config['Handler'], 'index.handler')

            # Verify timeout
            self.assertEqual(config['Timeout'], 90)

            # Verify memory size
            self.assertEqual(config['MemorySize'], 256)

            # Verify reserved concurrent executions
            concurrency = self.lambda_client.get_function_concurrency(
                FunctionName=self.lambda_function_name
            )
            if 'ReservedConcurrentExecutions' in concurrency:
                self.assertEqual(concurrency['ReservedConcurrentExecutions'], 10)

            # Verify environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
            self.assertEqual(env_vars['DYNAMODB_TABLE_NAME'], self.table_name)
            self.assertIn('ENVIRONMENT', env_vars)

            # Verify Dead Letter Queue configuration
            dlq_config = config.get('DeadLetterConfig', {})
            self.assertIn('TargetArn', dlq_config)

        except ClientError as e:
            self.fail(f"Lambda function does not exist or is not accessible: {e}")

    def test_lambda_event_source_mapping(self):
        """Test that the Lambda function has SQS event source mapping."""
        try:
            response = self.lambda_client.list_event_source_mappings(
                FunctionName=self.lambda_function_name
            )

            # Find SQS event source mapping
            sqs_mappings = [
                mapping for mapping in response['EventSourceMappings']
                if 'sqs' in mapping.get('EventSourceArn', '').lower()
            ]

            self.assertGreater(len(sqs_mappings), 0, "No SQS event source mapping found")

            # Verify configuration
            mapping = sqs_mappings[0]
            self.assertEqual(mapping['BatchSize'], 10)
            self.assertEqual(mapping.get('MaximumBatchingWindowInSeconds'), 5)
            self.assertEqual(mapping['State'], 'Enabled')

        except ClientError as e:
            self.fail(f"Failed to check event source mappings: {e}")

    def test_cloudwatch_log_group_exists(self):
        """Test that the CloudWatch Log Group exists for Lambda."""
        log_group_name = f"/aws/lambda/{self.lambda_function_name}"
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )

            log_groups = response.get('logGroups', [])
            matching_groups = [
                lg for lg in log_groups
                if lg['logGroupName'] == log_group_name
            ]

            self.assertEqual(len(matching_groups), 1, "Log group not found")

            # Verify retention
            log_group = matching_groups[0]
            self.assertEqual(
                log_group.get('retentionInDays'),
                7,
                "Log retention should be 7 days"
            )

        except ClientError as e:
            self.fail(f"Failed to check CloudWatch log group: {e}")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        expected_alarms = [
            f"campaign-queue-message-age-{self.environment_suffix}",
            f"campaign-dlq-messages-{self.environment_suffix}"
        ]

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=expected_alarms
            )

            found_alarms = {alarm['AlarmName'] for alarm in response['MetricAlarms']}

            for alarm_name in expected_alarms:
                self.assertIn(alarm_name, found_alarms, f"Alarm {alarm_name} not found")

            # Verify queue age alarm configuration
            queue_age_alarm = next(
                (alarm for alarm in response['MetricAlarms']
                 if 'message-age' in alarm['AlarmName']),
                None
            )
            if queue_age_alarm:
                self.assertEqual(queue_age_alarm['MetricName'], 'ApproximateAgeOfOldestMessage')
                self.assertEqual(queue_age_alarm['Threshold'], 300)
                self.assertEqual(queue_age_alarm['ComparisonOperator'], 'GreaterThanThreshold')

            # Verify DLQ alarm configuration
            dlq_alarm = next(
                (alarm for alarm in response['MetricAlarms']
                 if 'dlq-messages' in alarm['AlarmName']),
                None
            )
            if dlq_alarm:
                self.assertEqual(dlq_alarm['MetricName'], 'ApproximateNumberOfMessagesVisible')
                self.assertEqual(dlq_alarm['Threshold'], 1)
                self.assertEqual(dlq_alarm['ComparisonOperator'], 'GreaterThanThreshold')

        except ClientError as e:
            self.fail(f"Failed to check CloudWatch alarms: {e}")

    def test_end_to_end_message_processing(self):
        """Test end-to-end message processing through the system."""
        # Get queue URL
        try:
            response = self.sqs_client.get_queue_url(QueueName=self.main_queue_name)
            queue_url = response['QueueUrl']
        except ClientError:
            self.skipTest(f"Queue {self.main_queue_name} not found, skipping end-to-end test")

        # Send test message
        test_message = {
            'event_id': f'integration-test-{int(time.time())}',
            'campaign_id': 'test-campaign-123',
            'user_id': 'test-user-456',
            'action_type': 'email_open'
        }

        try:
            self.sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(test_message)
            )

            # Wait for processing (Lambda should process within a few seconds)
            time.sleep(10)

            # Check DynamoDB for processed record
            dynamodb_resource = boto3.resource('dynamodb', region_name=self.aws_region)
            table = dynamodb_resource.Table(self.table_name)

            # Query for the test event
            response = table.query(
                KeyConditionExpression='event_id = :event_id',
                ExpressionAttributeValues={
                    ':event_id': test_message['event_id']
                }
            )

            items = response.get('Items', [])
            self.assertGreater(
                len(items), 0,
                f"Test event {test_message['event_id']} was not processed and stored in DynamoDB"
            )

            # Verify the processed record
            if items:
                processed_item = items[0]
                self.assertEqual(processed_item.get('status'), 'SUCCESS')
                self.assertEqual(processed_item.get('campaign_id'), test_message['campaign_id'])
                self.assertEqual(processed_item.get('user_id'), test_message['user_id'])

        except ClientError as e:
            self.fail(f"End-to-end test failed: {e}")

    def test_lambda_iam_permissions(self):
        """Test that Lambda has correct IAM permissions."""
        try:
            # Get Lambda function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = response['Configuration']['Role']

            # Get IAM client
            iam_client = boto3.client('iam', region_name=self.aws_region)

            # Extract role name from ARN
            role_name = role_arn.split('/')[-1]

            # Get attached policies
            response = iam_client.list_attached_role_policies(RoleName=role_name)
            attached_policies = response.get('AttachedPolicies', [])

            # Verify at least one policy is attached
            self.assertGreater(
                len(attached_policies), 0,
                "No policies attached to Lambda execution role"
            )

        except ClientError as e:
            # IAM permissions might be restricted in integration tests
            self.skipTest(f"Cannot verify IAM permissions: {e}")


if __name__ == '__main__':
    unittest.main()
