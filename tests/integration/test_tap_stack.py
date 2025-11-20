"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
Uses real AWS resources without mocking.
"""

import unittest
import os
import json
import boto3
import time
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from deployment
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Stack outputs not found at {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('logs', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)

    def test_01_kms_key_exists_and_configured(self):
        """Test KMS key exists and is properly configured."""
        kms_key_id = self.outputs['kms_key_id']

        # Describe KMS key
        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key_metadata = response['KeyMetadata']

        # Verify key properties
        self.assertTrue(key_metadata['Enabled'], "KMS key should be enabled")
        self.assertEqual(key_metadata['KeyState'], 'Enabled')

        # Verify key rotation is enabled
        rotation = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
        self.assertTrue(rotation['KeyRotationEnabled'], "Key rotation should be enabled")

    def test_02_dynamodb_table_exists_and_configured(self):
        """Test DynamoDB table exists with correct configuration."""
        table_name = self.outputs['dynamodb_table_name']

        # Describe table
        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        # Verify table properties
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Verify keys
        key_schema = {k['AttributeName']: k['KeyType'] for k in table['KeySchema']}
        self.assertEqual(key_schema['transaction_id'], 'HASH')
        self.assertEqual(key_schema['timestamp'], 'RANGE')

        # Verify PITR is enabled
        pitr = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr_desc = pitr['ContinuousBackupsDescription']
        pitr_status = pitr_desc['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED', "Point-in-time recovery should be enabled")

        # Verify encryption
        self.assertIn('SSEDescription', table)
        self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
        self.assertEqual(table['SSEDescription']['SSEType'], 'KMS')

    def test_03_sns_topic_exists_and_configured(self):
        """Test SNS topic exists with correct configuration."""
        topic_arn = self.outputs['sns_topic_arn']

        # Get topic attributes
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        attributes = response['Attributes']

        # Verify KMS encryption
        self.assertIn('KmsMasterKeyId', attributes)
        self.assertIsNotNone(attributes['KmsMasterKeyId'])

    def test_04_sqs_queue_exists_and_configured(self):
        """Test SQS dead letter queue exists with correct configuration."""
        queue_url = self.outputs['dlq_url']

        # Get queue attributes
        response = self.sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )
        attributes = response['Attributes']

        # Verify KMS encryption
        self.assertIn('KmsMasterKeyId', attributes)
        self.assertIsNotNone(attributes['KmsMasterKeyId'])

        # Verify message retention (14 days = 1209600 seconds)
        self.assertEqual(attributes['MessageRetentionPeriod'], '1209600')

    def test_05_lambda_function_exists_and_configured(self):
        """Test Lambda function exists with correct configuration."""
        function_name = self.outputs['lambda_function_name']

        # Get function configuration
        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Verify function properties
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['MemorySize'], 1024)
        self.assertEqual(config['Timeout'], 60)
        self.assertEqual(config['Architectures'], ['arm64'])

        # Verify tracing
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')

        # Verify environment variables
        env_vars = config['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertIn('SNS_TOPIC_ARN', env_vars)
        self.assertIn('ENVIRONMENT_SUFFIX', env_vars)

        # Verify dead letter config
        self.assertIn('DeadLetterConfig', config)
        self.assertIn('TargetArn', config['DeadLetterConfig'])

    def test_06_cloudwatch_log_group_exists(self):
        """Test CloudWatch log group exists with correct retention."""
        function_name = self.outputs['lambda_function_name']
        log_group_name = f'/aws/lambda/{function_name}'

        # Describe log group
        response = self.cloudwatch_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = response['logGroups']
        self.assertEqual(len(log_groups), 1, "Expected exactly one log group")

        log_group = log_groups[0]
        self.assertEqual(log_group['retentionInDays'], 30)

    def test_07_lambda_can_write_to_dynamodb(self):
        """Test Lambda function can write to DynamoDB table."""
        function_name = self.outputs['lambda_function_name']
        table_name = self.outputs['dynamodb_table_name']

        # Invoke Lambda with test payload
        test_payload = {
            'transaction_id': f'test-txn-{int(time.time())}',
            'provider': 'stripe',
            'amount': 100.00,
            'currency': 'USD',
            'status': 'completed',
            'customer_id': 'cust_test123',
            'payment_method': 'card',
            'metadata': {'test': True}
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        # Verify successful invocation
        self.assertEqual(response['StatusCode'], 200)

        # Parse response
        response_payload = json.loads(response['Payload'].read().decode('utf-8'))

        # Check for function error
        if 'FunctionError' in response:
            self.fail(f"Lambda execution failed with error: {response_payload}")

        self.assertEqual(response_payload.get('statusCode'), 200,
                        f"Expected statusCode 200, got: {response_payload}")

        body = json.loads(response_payload['body'])
        self.assertEqual(body['message'], 'Webhook processed successfully')

        # Verify item was written to DynamoDB
        transaction_id = test_payload['transaction_id']
        time.sleep(2)  # Wait for eventual consistency

        # Query DynamoDB
        dynamo_response = self.dynamodb_client.query(
            TableName=table_name,
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={
                ':tid': {'S': transaction_id}
            }
        )

        items = dynamo_response['Items']
        self.assertGreater(len(items), 0, "Transaction should be stored in DynamoDB")

        # Verify data
        item = items[0]
        self.assertEqual(item['transaction_id']['S'], transaction_id)
        self.assertEqual(item['provider']['S'], 'stripe')
        self.assertEqual(item['currency']['S'], 'USD')

    def test_08_lambda_publishes_to_sns(self):
        """Test Lambda function publishes events to SNS topic."""
        function_name = self.outputs['lambda_function_name']
        sns_topic_arn = self.outputs['sns_topic_arn']

        # Create a test SQS queue to subscribe to SNS
        test_queue_name = f'test-queue-{int(time.time())}'
        queue_response = self.sqs_client.create_queue(QueueName=test_queue_name)
        test_queue_url = queue_response['QueueUrl']

        try:
            # Get queue ARN
            queue_attrs = self.sqs_client.get_queue_attributes(
                QueueUrl=test_queue_url,
                AttributeNames=['QueueArn']
            )
            test_queue_arn = queue_attrs['Attributes']['QueueArn']

            # Set queue policy to allow SNS to send messages
            policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "sns.amazonaws.com"},
                    "Action": "sqs:SendMessage",
                    "Resource": test_queue_arn,
                    "Condition": {
                        "ArnEquals": {"aws:SourceArn": sns_topic_arn}
                    }
                }]
            }
            self.sqs_client.set_queue_attributes(
                QueueUrl=test_queue_url,
                Attributes={'Policy': json.dumps(policy)}
            )

            # Subscribe test queue to SNS topic
            sub_response = self.sns_client.subscribe(
                TopicArn=sns_topic_arn,
                Protocol='sqs',
                Endpoint=test_queue_arn
            )
            subscription_arn = sub_response['SubscriptionArn']

            # Wait for subscription to be confirmed
            time.sleep(2)

            # Invoke Lambda
            test_payload = {
                'transaction_id': f'test-sns-{int(time.time())}',
                'provider': 'paypal',
                'amount': 50.00,
                'currency': 'EUR',
                'status': 'completed'
            }

            self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload)
            )

            # Wait for message to propagate
            time.sleep(3)

            # Check if message was received in test queue
            messages = self.sqs_client.receive_message(
                QueueUrl=test_queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5
            )

            self.assertIn('Messages', messages, "SNS message should be received in test queue")
            self.assertGreater(len(messages['Messages']), 0)

            # Cleanup subscription
            self.sns_client.unsubscribe(SubscriptionArn=subscription_arn)

        finally:
            # Cleanup test queue
            self.sqs_client.delete_queue(QueueUrl=test_queue_url)

    def test_09_lambda_retry_configuration(self):
        """Test Lambda retry configuration is correct."""
        function_name = self.outputs['lambda_function_name']

        # Get function event invoke config
        response = self.lambda_client.get_function_event_invoke_config(
            FunctionName=function_name
        )

        # Verify retry attempts (should be 2, not 5 due to AWS limits)
        self.assertEqual(response['MaximumRetryAttempts'], 2)

        # Verify max event age (1 hour = 3600 seconds)
        self.assertEqual(response['MaximumEventAgeInSeconds'], 3600)

    def test_10_resource_tagging(self):
        """Test resources are properly tagged."""
        # Check Lambda tags
        function_arn = self.outputs['lambda_function_arn']
        lambda_tags = self.lambda_client.list_tags(Resource=function_arn)

        self.assertIn('Tags', lambda_tags)
        tags = lambda_tags['Tags']
        self.assertIn('Environment', tags)
        self.assertIn('CostCenter', tags)
        self.assertIn('Owner', tags)

        # Verify environment suffix in tags
        environment_suffix = self.outputs['environment_suffix']
        self.assertEqual(tags['Environment'], environment_suffix)


if __name__ == '__main__':
    unittest.main()
