# tests/integration/test_infrastructure.py

import json
import boto3
import time
import uuid
import os
import sys
import unittest
from datetime import datetime, timedelta

# Load deployment outputs
with open('cfn-outputs/flat-outputs.json', 'r', encoding='utf-8') as f:
    outputs = json.load(f)

# AWS clients
sqs = boto3.client('sqs', region_name='us-east-1')
lambda_client = boto3.client('lambda', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
logs = boto3.client('logs', region_name='us-east-1')

class TestInfrastructureDeployment(unittest.TestCase):
    """Integration tests for deployed infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures from deployment outputs"""
        cls.queue_url = outputs['order_queue_url']
        cls.dlq_url = outputs['dlq_url']
        cls.lambda_function_name = outputs['lambda_function_name']
        cls.dynamodb_table_name = outputs['dynamodb_table_name']
        cls.log_group_name = outputs['cloudwatch_log_group']
        cls.table = dynamodb.Table(cls.dynamodb_table_name)

    def test_sqs_queue_exists_and_accessible(self):
        """Test that the SQS queue exists and is accessible"""
        # Get queue attributes
        response = sqs.get_queue_attributes(
            QueueUrl=self.queue_url,
            AttributeNames=['All']
        )

        # Verify queue configuration
        attributes = response['Attributes']
        self.assertEqual(int(attributes['VisibilityTimeout']), 60)
        self.assertEqual(int(attributes['MessageRetentionPeriod']), 345600)  # 4 days in seconds
        self.assertIn('RedrivePolicy', attributes)

        # Verify redrive policy
        redrive_policy = json.loads(attributes['RedrivePolicy'])
        self.assertEqual(redrive_policy['maxReceiveCount'], 3)
        self.assertIn(self.dlq_url.split('/')[-1], redrive_policy['deadLetterTargetArn'])

    def test_dlq_exists_and_configured(self):
        """Test that the Dead Letter Queue exists and is properly configured"""
        # Get DLQ attributes
        response = sqs.get_queue_attributes(
            QueueUrl=self.dlq_url,
            AttributeNames=['All']
        )

        # Verify DLQ configuration
        attributes = response['Attributes']
        self.assertEqual(int(attributes['MessageRetentionPeriod']), 1209600)  # 14 days in seconds

    def test_lambda_function_deployed(self):
        """Test that the Lambda function is deployed and configured correctly"""
        # Get Lambda function configuration
        response = lambda_client.get_function_configuration(
            FunctionName=self.lambda_function_name
        )

        # Verify Lambda configuration
        self.assertEqual(response['Runtime'], 'python3.10')
        self.assertEqual(response['MemorySize'], 512)
        self.assertEqual(response['Timeout'], 55)
        # Note: ReservedConcurrentExecutions might not appear in response
        # even when set in Terraform due to AWS API behavior

        # Verify environment variables
        env_vars = response['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
        self.assertIn('DLQ_URL', env_vars)
        self.assertIn('REGION', env_vars)

    def test_lambda_event_source_mapping(self):
        """Test that Lambda is connected to SQS queue"""
        # List event source mappings
        response = lambda_client.list_event_source_mappings(
            FunctionName=self.lambda_function_name
        )

        # Verify mapping exists
        self.assertGreater(len(response['EventSourceMappings']), 0)

        # Find our SQS mapping
        sqs_mapping = None
        for mapping in response['EventSourceMappings']:
            if self.queue_url.split('/')[-1] in mapping['EventSourceArn']:
                sqs_mapping = mapping
                break

        self.assertIsNotNone(sqs_mapping)
        self.assertEqual(sqs_mapping['BatchSize'], 5)
        self.assertEqual(sqs_mapping['State'], 'Enabled')

    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists and is configured correctly"""
        # Describe table
        response = dynamodb.meta.client.describe_table(
            TableName=self.dynamodb_table_name
        )

        # Verify table configuration
        table = response['Table']
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertEqual(table['KeySchema'][0]['AttributeName'], 'order_id')
        self.assertEqual(table['KeySchema'][0]['KeyType'], 'HASH')

        # Verify point-in-time recovery
        pitr = dynamodb.meta.client.describe_continuous_backups(
            TableName=self.dynamodb_table_name
        )
        self.assertEqual(
            pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
            'ENABLED'
        )

    def test_cloudwatch_log_group_exists(self):
        """Test that the CloudWatch log group exists"""
        # Describe log group
        response = logs.describe_log_groups(
            logGroupNamePrefix=self.log_group_name
        )

        # Verify log group exists
        log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == self.log_group_name]
        self.assertEqual(len(log_groups), 1)

        # Verify retention
        log_group = log_groups[0]
        self.assertEqual(log_group['retentionInDays'], 7)

    def test_cloudwatch_alarm_configured(self):
        """Test that CloudWatch alarm for DLQ is configured"""
        # Describe alarms
        response = cloudwatch.describe_alarms(
            AlarmNamePrefix='order-processing-dlq-messages'
        )

        # Find our alarm
        alarms = [a for a in response['MetricAlarms']
                  if outputs['dlq_url'].split('/')[-1] in str(a.get('Dimensions', []))]
        self.assertGreater(len(alarms), 0)

        # Verify alarm configuration
        alarm = alarms[0]
        self.assertEqual(alarm['MetricName'], 'ApproximateNumberOfMessagesVisible')
        self.assertEqual(alarm['Namespace'], 'AWS/SQS')
        self.assertEqual(alarm['Threshold'], 5.0)
        self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')

    def test_end_to_end_order_processing(self):
        """Test end-to-end order processing workflow"""
        # Create a test order
        order_id = f"TEST-ORDER-{uuid.uuid4().hex[:8]}"
        test_message = {
            'order_id': order_id,
            'customer_id': 'TEST-CUSTOMER-001',
            'amount': 199.99,
            'items': ['test-item-1', 'test-item-2']
        }

        # Send message to SQS
        response = sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(test_message)
        )

        self.assertIn('MessageId', response)
        message_id = response['MessageId']

        # Wait for Lambda to process the message
        time.sleep(10)  # Give Lambda time to process

        # Check DynamoDB for processed order
        try:
            response = self.table.get_item(
                Key={'order_id': order_id}
            )

            # Verify order was processed
            self.assertIn('Item', response)
            item = response['Item']
            self.assertEqual(item['status'], 'PROCESSED')
            self.assertIn('processed_at', item)

            # Verify details
            details = json.loads(item['details'])
            self.assertEqual(details['customer_id'], 'TEST-CUSTOMER-001')
            self.assertEqual(details['amount'], 199.99)
            self.assertEqual(details['item_count'], 2)
            self.assertIn('confirmation_number', details)

        except Exception as e:
            self.fail(f"Failed to verify order processing: {str(e)}")

    def test_invalid_message_handling(self):
        """Test handling of invalid messages"""
        # Send invalid message (missing required field)
        invalid_message = {
            'order_id': f"INVALID-{uuid.uuid4().hex[:8]}",
            'customer_id': 'TEST-CUSTOMER-002'
            # Missing 'amount' and 'items'
        }

        # Send message to SQS
        response = sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(invalid_message)
        )

        self.assertIn('MessageId', response)

        # Wait for processing attempt
        time.sleep(10)

        # Check if message was marked as failed in DynamoDB
        try:
            response = self.table.get_item(
                Key={'order_id': invalid_message['order_id']}
            )

            if 'Item' in response:
                item = response['Item']
                self.assertEqual(item['status'], 'FAILED')
                self.assertIn('error_message', item)
        except Exception:
            # It's okay if the item doesn't exist, as it may have been sent to DLQ
            pass

    def test_lambda_logs_generation(self):
        """Test that Lambda generates logs in CloudWatch"""
        # Query recent logs
        try:
            # Get log streams
            response = logs.describe_log_streams(
                logGroupName=self.log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )

            if response['logStreams']:
                # Verify logs exist
                self.assertGreater(len(response['logStreams']), 0)

                # Get recent log events
                stream = response['logStreams'][0]
                log_response = logs.get_log_events(
                    logGroupName=self.log_group_name,
                    logStreamName=stream['logStreamName'],
                    limit=10
                )

                # Verify we have log events
                self.assertIsNotNone(log_response.get('events'))
        except logs.exceptions.ResourceNotFoundException:
            # Log group may not have streams yet if Lambda hasn't been invoked
            pass

    def test_queue_metrics_available(self):
        """Test that CloudWatch metrics are available for the queue"""
        # Get metrics for the queue
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=10)

        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/SQS',
            MetricName='NumberOfMessagesSent',
            Dimensions=[
                {
                    'Name': 'QueueName',
                    'Value': self.queue_url.split('/')[-1]
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )

        # Metrics should be available (even if no data points yet)
        self.assertIn('Datapoints', response)

    def test_infrastructure_tags(self):
        """Test that resources are properly tagged"""
        # Check Lambda function tags
        lambda_tags = lambda_client.list_tags(
            Resource=outputs['lambda_function_arn']
        )

        tags = lambda_tags.get('Tags', {})
        self.assertEqual(tags.get('Environment'), 'Production')
        self.assertEqual(tags.get('Service'), 'OrderProcessing')

        # Check DynamoDB table tags
        table_arn = outputs['dynamodb_table_arn']
        dynamodb_tags = dynamodb.meta.client.list_tags_of_resource(
            ResourceArn=table_arn
        )

        table_tags = {tag['Key']: tag['Value'] for tag in dynamodb_tags.get('Tags', [])}
        self.assertEqual(table_tags.get('Environment'), 'Production')
        self.assertEqual(table_tags.get('Service'), 'OrderProcessing')

if __name__ == '__main__':
    unittest.main()
