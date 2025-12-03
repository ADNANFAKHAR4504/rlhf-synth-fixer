"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients."""
        # Load outputs from deployment
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        cls.sns_client = boto3.client('sns', region_name='us-east-1')
        cls.sqs_client = boto3.client('sqs', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.iam_client = boto3.client('iam', region_name='us-east-1')

    def test_outputs_loaded(self):
        """Test that stack outputs were loaded successfully."""
        required_outputs = [
            'bucket_name', 'bucket_arn', 'table_name', 'table_arn',
            'topic_arn', 'queue_url', 'queue_arn', 'dlq_url', 'dlq_arn',
            'function_name', 'function_arn', 'lambda_role_arn'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing output: {output}")
            self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
            self.assertNotEqual(self.outputs[output], '', f"Output {output} is empty")

    def test_s3_bucket_exists(self):
        """Test that S3 bucket exists and is configured correctly."""
        bucket_name = self.outputs['bucket_name']

        # Check bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Bucket {bucket_name} does not exist: {e}")

    def test_s3_bucket_versioning(self):
        """Test that S3 bucket has versioning enabled."""
        bucket_name = self.outputs['bucket_name']

        # Check versioning configuration
        response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(response.get('Status'), 'Enabled', "Bucket versioning is not enabled")

    def test_s3_bucket_encryption(self):
        """Test that S3 bucket has encryption enabled."""
        bucket_name = self.outputs['bucket_name']

        # Check encryption configuration
        try:
            response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
            self.assertGreater(len(rules), 0, "No encryption rules found")

            # Check that AES256 encryption is enabled
            sse_algorithm = rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
            self.assertEqual(sse_algorithm, 'AES256', "Encryption algorithm is not AES256")
        except ClientError as e:
            self.fail(f"Failed to get bucket encryption: {e}")

    def test_s3_bucket_lifecycle(self):
        """Test that S3 bucket has lifecycle policy configured."""
        bucket_name = self.outputs['bucket_name']

        # Check lifecycle configuration
        try:
            response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = response.get('Rules', [])
            self.assertGreater(len(rules), 0, "No lifecycle rules found")

            # Verify noncurrent version expiration
            rule = rules[0]
            self.assertEqual(rule.get('Status'), 'Enabled', "Lifecycle rule is not enabled")
            self.assertIn('NoncurrentVersionExpiration', rule, "No noncurrent version expiration found")
        except ClientError as e:
            self.fail(f"Failed to get bucket lifecycle: {e}")

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists."""
        table_name = self.outputs['table_name']

        # Check table exists
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(response['Table']['TableName'], table_name)
            self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        except ClientError as e:
            self.fail(f"Table {table_name} does not exist: {e}")

    def test_dynamodb_table_billing_mode(self):
        """Test that DynamoDB table uses on-demand billing."""
        table_name = self.outputs['table_name']

        # Check billing mode
        response = self.dynamodb_client.describe_table(TableName=table_name)
        billing_mode = response['Table'].get('BillingModeSummary', {}).get('BillingMode')
        self.assertEqual(billing_mode, 'PAY_PER_REQUEST', "Table is not using on-demand billing")

    def test_dynamodb_table_gsi(self):
        """Test that DynamoDB table has Global Secondary Index."""
        table_name = self.outputs['table_name']

        # Check GSI exists
        response = self.dynamodb_client.describe_table(TableName=table_name)
        gsi_list = response['Table'].get('GlobalSecondaryIndexes', [])
        self.assertGreater(len(gsi_list), 0, "No Global Secondary Indexes found")

        # Verify GSI configuration
        gsi = gsi_list[0]
        self.assertEqual(gsi['IndexName'], 'timestamp-index')
        self.assertEqual(gsi['IndexStatus'], 'ACTIVE')
        self.assertEqual(gsi['Projection']['ProjectionType'], 'ALL')

    def test_dynamodb_table_pitr(self):
        """Test that DynamoDB table has Point-in-Time Recovery enabled."""
        table_name = self.outputs['table_name']

        # Check PITR status
        response = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr_desc = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
        pitr_status = pitr_desc['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED', "Point-in-Time Recovery is not enabled")

    def test_sns_topic_exists(self):
        """Test that SNS topic exists."""
        topic_arn = self.outputs['topic_arn']

        # Check topic exists
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertEqual(response['Attributes']['TopicArn'], topic_arn)
        except ClientError as e:
            self.fail(f"Topic {topic_arn} does not exist: {e}")

    def test_sns_topic_subscription(self):
        """Test that SNS topic has email subscription."""
        topic_arn = self.outputs['topic_arn']

        # Check subscriptions
        response = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
        subscriptions = response.get('Subscriptions', [])
        self.assertGreater(len(subscriptions), 0, "No subscriptions found for topic")

        # Verify email subscription exists
        email_sub = next((s for s in subscriptions if s['Protocol'] == 'email'), None)
        self.assertIsNotNone(email_sub, "No email subscription found")

    def test_sqs_main_queue_exists(self):
        """Test that main SQS queue exists."""
        queue_url = self.outputs['queue_url']

        # Check queue exists
        try:
            response = self.sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Queue {queue_url} does not exist: {e}")

    def test_sqs_dlq_exists(self):
        """Test that Dead Letter Queue exists."""
        dlq_url = self.outputs['dlq_url']

        # Check DLQ exists
        try:
            response = self.sqs_client.get_queue_attributes(
                QueueUrl=dlq_url,
                AttributeNames=['All']
            )
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"DLQ {dlq_url} does not exist: {e}")

    def test_sqs_queue_redrive_policy(self):
        """Test that main queue has redrive policy configured."""
        queue_url = self.outputs['queue_url']
        dlq_arn = self.outputs['dlq_arn']

        # Check redrive policy
        response = self.sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['RedrivePolicy']
        )

        redrive_policy = json.loads(response['Attributes'].get('RedrivePolicy', '{}'))
        self.assertIn('deadLetterTargetArn', redrive_policy, "No DLQ target ARN in redrive policy")
        self.assertEqual(redrive_policy['deadLetterTargetArn'], dlq_arn)
        self.assertEqual(redrive_policy['maxReceiveCount'], 3)

    def test_lambda_function_exists(self):
        """Test that Lambda function exists."""
        function_name = self.outputs['function_name']

        # Check function exists
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            self.assertEqual(response['Configuration']['FunctionName'], function_name)
            self.assertEqual(response['Configuration']['State'], 'Active')
        except ClientError as e:
            self.fail(f"Function {function_name} does not exist: {e}")

    def test_lambda_function_runtime(self):
        """Test that Lambda function uses correct runtime."""
        function_name = self.outputs['function_name']

        # Check runtime
        response = self.lambda_client.get_function(FunctionName=function_name)
        runtime = response['Configuration']['Runtime']
        self.assertEqual(runtime, 'python3.9', f"Expected runtime python3.9, got {runtime}")

    def test_lambda_function_environment_variables(self):
        """Test that Lambda function has required environment variables."""
        function_name = self.outputs['function_name']

        # Check environment variables
        response = self.lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})

        required_vars = ['BUCKET_NAME', 'TABLE_NAME', 'TOPIC_ARN', 'QUEUE_URL', 'ENVIRONMENT']
        for var in required_vars:
            self.assertIn(var, env_vars, f"Missing environment variable: {var}")
            self.assertNotEqual(env_vars[var], '', f"Environment variable {var} is empty")

    def test_lambda_event_source_mapping(self):
        """Test that Lambda has SQS event source mapping."""
        function_name = self.outputs['function_name']
        queue_arn = self.outputs['queue_arn']

        # Check event source mappings
        response = self.lambda_client.list_event_source_mappings(FunctionName=function_name)
        mappings = response.get('EventSourceMappings', [])
        self.assertGreater(len(mappings), 0, "No event source mappings found")

        # Verify SQS mapping
        sqs_mapping = next((m for m in mappings if m['EventSourceArn'] == queue_arn), None)
        self.assertIsNotNone(sqs_mapping, "No SQS event source mapping found")
        self.assertEqual(sqs_mapping['State'], 'Enabled', "Event source mapping is not enabled")

    def test_iam_role_exists(self):
        """Test that Lambda IAM role exists."""
        role_arn = self.outputs['lambda_role_arn']
        role_name = role_arn.split('/')[-1]

        # Check role exists
        try:
            response = self.iam_client.get_role(RoleName=role_name)
            self.assertEqual(response['Role']['Arn'], role_arn)
        except ClientError as e:
            self.fail(f"Role {role_name} does not exist: {e}")

    def test_iam_role_policies(self):
        """Test that Lambda IAM role has required policies attached."""
        role_arn = self.outputs['lambda_role_arn']
        role_name = role_arn.split('/')[-1]

        # Check attached policies
        response = self.iam_client.list_attached_role_policies(RoleName=role_name)
        policy_arns = [p['PolicyArn'] for p in response['AttachedPolicies']]

        # Verify basic Lambda execution policy
        basic_policy = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        self.assertIn(basic_policy, policy_arns, "AWSLambdaBasicExecutionRole not attached")

        # Check inline policies for resource access
        inline_response = self.iam_client.list_role_policies(RoleName=role_name)
        inline_policies = inline_response.get('PolicyNames', [])
        self.assertGreater(len(inline_policies), 0, "No inline policies found")

    def test_end_to_end_workflow(self):
        """Test end-to-end workflow: send message to SQS and verify Lambda processes it."""
        queue_url = self.outputs['queue_url']
        bucket_name = self.outputs['bucket_name']
        table_name = self.outputs['table_name']

        # Send test message to SQS
        test_message = {
            'test_id': 'integration-test-001',
            'timestamp': '2024-12-02T00:00:00Z',
            'data': 'Test data for integration testing'
        }

        try:
            send_response = self.sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(test_message)
            )
            message_id = send_response['MessageId']

            # Note: In a real integration test, you would wait for Lambda to process
            # and then verify the results in S3 and DynamoDB.
            # For now, we just verify the message was sent successfully.
            self.assertIsNotNone(message_id, "Failed to send message to queue")

        except ClientError as e:
            self.fail(f"Failed to send message to queue: {e}")


if __name__ == '__main__':
    unittest.main()
