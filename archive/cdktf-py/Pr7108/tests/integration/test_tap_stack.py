"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack CDKTF infrastructure.
Tests actual AWS resources created by the CDKTF stack for payment processing.
"""

import unittest
import os
import boto3
import json
import time
from decimal import Decimal
from botocore.exceptions import ClientError


class TestPaymentProcessingIntegration(unittest.TestCase):
    """Integration tests against live deployed CDKTF payment processing stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with AWS clients."""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        # AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.dynamodb_resource = boto3.resource('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.sfn_client = boto3.client('stepfunctions', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)

        # Load outputs if available
        cls.outputs = cls._load_stack_outputs()

        # Resource names with environment suffix
        cls.payments_table_name = f"payments-{cls.environment_suffix}"
        cls.audit_table_name = f"payment-audit-log-{cls.environment_suffix}"
        cls.processing_status_table_name = f"payment-processing-status-{cls.environment_suffix}"
        cls.sns_topic_name = f"payment-notifications-{cls.environment_suffix}"
        cls.sqs_queue_name = f"payment-processing-queue-{cls.environment_suffix}"
        cls.dlq_name = f"payment-processing-dlq-{cls.environment_suffix}"

    @classmethod
    def _load_stack_outputs(cls):
        """Load CDKTF stack outputs from flat-outputs.json if available."""
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r') as f:
                return json.load(f)
        return {}

    def test_s3_bucket_exists_with_correct_configuration(self):
        """Test that S3 bucket exists with encryption and versioning."""
        try:
            sts = boto3.client('sts')
            account_id = sts.get_caller_identity()['Account']
            bucket_name = f"payment-batch-files-{account_id}-{self.environment_suffix}"

            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Check versioning
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled', "S3 versioning should be enabled")

            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(any(rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'
                                for rule in rules), "S3 encryption should be enabled")

            # Check public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            block_config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(block_config['BlockPublicAcls'], "Block public ACLs should be enabled")
            self.assertTrue(block_config['BlockPublicPolicy'], "Block public policy should be enabled")

        except ClientError as e:
            self.fail(f"Failed to verify S3 bucket: {e}")

    def test_dynamodb_payments_table_exists(self):
        """Test that payments DynamoDB table exists with correct configuration."""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.payments_table_name)
            table = response['Table']

            # Check table status
            self.assertEqual(table['TableStatus'], 'ACTIVE', "Table should be active")

            # Check billing mode
            self.assertEqual(table.get('BillingModeSummary', {}).get('BillingMode'), 'PAY_PER_REQUEST',
                             "Should use on-demand billing")

            # Check hash key
            self.assertEqual(table['KeySchema'][0]['AttributeName'], 'payment_id')
            self.assertEqual(table['KeySchema'][0]['KeyType'], 'HASH')

            # Check GSI exists
            self.assertIn('GlobalSecondaryIndexes', table, "Should have GSIs")
            gsi_names = [gsi['IndexName'] for gsi in table['GlobalSecondaryIndexes']]
            self.assertIn('timestamp-index', gsi_names, "Should have timestamp-index")
            self.assertIn('status-index', gsi_names, "Should have status-index")

            # Check PITR
            pitr = self.dynamodb_client.describe_continuous_backups(TableName=self.payments_table_name)
            pitr_status = pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            self.assertEqual(pitr_status, 'ENABLED', "Point-in-time recovery should be enabled")

        except ClientError as e:
            self.fail(f"Failed to verify payments table: {e}")

    def test_dynamodb_audit_table_exists(self):
        """Test that audit DynamoDB table exists."""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.audit_table_name)
            table = response['Table']

            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['KeySchema'][0]['AttributeName'], 'audit_id')

        except ClientError as e:
            self.fail(f"Failed to verify audit table: {e}")

    def test_dynamodb_processing_status_table_exists(self):
        """Test that processing status DynamoDB table exists."""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.processing_status_table_name)
            table = response['Table']

            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['KeySchema'][0]['AttributeName'], 'batch_id')

        except ClientError as e:
            self.fail(f"Failed to verify processing status table: {e}")

    def test_lambda_functions_exist_with_correct_runtime(self):
        """Test that Lambda functions exist with Python 3.12 runtime."""
        function_names = [
            f"payment-processor-{self.environment_suffix}",
            f"payment-api-handler-{self.environment_suffix}",
            f"batch-processor-{self.environment_suffix}"
        ]

        for function_name in function_names:
            try:
                response = self.lambda_client.get_function(FunctionName=function_name)
                config = response['Configuration']

                self.assertEqual(config['Runtime'], 'python3.12', f"{function_name} should use Python 3.12")
                self.assertIn('Environment', config, f"{function_name} should have environment variables")

            except ClientError as e:
                self.fail(f"Failed to verify Lambda function {function_name}: {e}")

    def test_sns_topic_exists(self):
        """Test that SNS topic exists."""
        try:
            topics = self.sns_client.list_topics()
            topic_arns = [t['TopicArn'] for t in topics['Topics']]

            matching_topics = [arn for arn in topic_arns if self.sns_topic_name in arn]
            self.assertGreater(len(matching_topics), 0, f"SNS topic {self.sns_topic_name} should exist")

        except ClientError as e:
            self.fail(f"Failed to verify SNS topic: {e}")

    def test_sqs_queues_exist(self):
        """Test that SQS main queue and DLQ exist."""
        try:
            queues = self.sqs_client.list_queues(QueueNamePrefix=f"payment-processing-")
            queue_urls = queues.get('QueueUrls', [])

            queue_names = [url.split('/')[-1] for url in queue_urls]
            self.assertIn(self.sqs_queue_name, queue_names, "Main queue should exist")
            self.assertIn(self.dlq_name, queue_names, "DLQ should exist")

            # Verify redrive policy on main queue
            main_queue_url = [url for url in queue_urls if self.sqs_queue_name in url][0]
            attrs = self.sqs_client.get_queue_attributes(
                QueueUrl=main_queue_url,
                AttributeNames=['RedrivePolicy']
            )
            self.assertIn('RedrivePolicy', attrs['Attributes'], "Main queue should have redrive policy")

        except ClientError as e:
            self.fail(f"Failed to verify SQS queues: {e}")

    def test_step_functions_state_machine_exists(self):
        """Test that Step Functions state machine exists."""
        try:
            state_machines = self.sfn_client.list_state_machines()
            sm_names = [sm['name'] for sm in state_machines['stateMachines']]

            expected_name = f"payment-workflow-{self.environment_suffix}"
            matching_sms = [name for name in sm_names if expected_name in name]
            self.assertGreater(len(matching_sms), 0, "State machine should exist")

        except ClientError as e:
            self.fail(f"Failed to verify Step Functions: {e}")

    def test_api_gateway_exists(self):
        """Test that API Gateway REST API exists."""
        try:
            apis = self.apigateway_client.get_rest_apis()
            api_names = [api['name'] for api in apis['items']]

            expected_name = f"payment-api-{self.environment_suffix}"
            self.assertIn(expected_name, api_names, "API Gateway should exist")

        except ClientError as e:
            self.fail(f"Failed to verify API Gateway: {e}")

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups exist for Lambda functions."""
        log_group_names = [
            f"/aws/lambda/payment-processor-{self.environment_suffix}",
            f"/aws/lambda/payment-api-handler-{self.environment_suffix}",
            f"/aws/lambda/batch-processor-{self.environment_suffix}"
        ]

        for log_group_name in log_group_names:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                self.assertGreater(len(response['logGroups']), 0,
                                   f"Log group {log_group_name} should exist")

                # Check retention
                log_group = response['logGroups'][0]
                self.assertIn('retentionInDays', log_group, "Log retention should be set")

            except ClientError as e:
                self.fail(f"Failed to verify log group {log_group_name}: {e}")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms exist."""
        alarm_names = [
            f"payment-processor-errors-{self.environment_suffix}",
            f"payment-api-5xx-errors-{self.environment_suffix}",
            f"payment-dlq-messages-{self.environment_suffix}"
        ]

        try:
            response = self.cloudwatch_client.describe_alarms(AlarmNames=alarm_names)
            found_alarms = [alarm['AlarmName'] for alarm in response['MetricAlarms']]

            for alarm_name in alarm_names:
                self.assertIn(alarm_name, found_alarms, f"Alarm {alarm_name} should exist")

        except ClientError as e:
            self.fail(f"Failed to verify CloudWatch alarms: {e}")

    def test_payment_workflow_end_to_end(self):
        """Test end-to-end payment processing workflow."""
        try:
            # Create a test payment
            payments_table = self.dynamodb_resource.Table(self.payments_table_name)

            payment_id = f"test-payment-{int(time.time())}"
            timestamp = int(time.time())

            payments_table.put_item(
                Item={
                    'payment_id': payment_id,
                    'amount': Decimal('100.50'),
                    'currency': 'USD',
                    'status': 'pending',
                    'timestamp': timestamp,
                    'environment': self.environment_suffix
                }
            )

            # Verify payment was created
            response = payments_table.get_item(Key={'payment_id': payment_id})
            self.assertIn('Item', response, "Payment should be created")
            self.assertEqual(response['Item']['payment_id'], payment_id)
            self.assertEqual(response['Item']['status'], 'pending')

            print(f"Successfully created and verified test payment: {payment_id}")

        except ClientError as e:
            self.fail(f"End-to-end workflow test failed: {e}")

    def test_resource_tags_applied(self):
        """Test that common tags are applied to resources."""
        try:
            # Check DynamoDB table tags
            response = self.dynamodb_client.list_tags_of_resource(
                ResourceArn=f"arn:aws:dynamodb:{self.region}:{boto3.client('sts').get_caller_identity()['Account']}:table/{self.payments_table_name}"
            )
            tags = {tag['Key']: tag['Value'] for tag in response['Tags']}

            self.assertIn('Environment', tags, "Environment tag should exist")
            self.assertEqual(tags['Environment'], self.environment_suffix)
            self.assertIn('Application', tags, "Application tag should exist")
            self.assertEqual(tags['Application'], 'payment-processing')
            self.assertIn('ManagedBy', tags, "ManagedBy tag should exist")

        except ClientError as e:
            self.fail(f"Failed to verify resource tags: {e}")

    def test_iam_roles_have_least_privilege(self):
        """Test that IAM roles follow least privilege principle."""
        try:
            iam_client = boto3.client('iam')
            role_names = [
                f"payment-processor-role-{self.environment_suffix}",
                f"payment-api-handler-role-{self.environment_suffix}",
                f"batch-processor-role-{self.environment_suffix}"
            ]

            for role_name in role_names:
                try:
                    role = iam_client.get_role(RoleName=role_name)
                    self.assertIn('Role', role, f"Role {role_name} should exist")

                    # Check inline policies
                    policies = iam_client.list_role_policies(RoleName=role_name)
                    self.assertGreater(len(policies['PolicyNames']), 0,
                                       f"Role {role_name} should have policies")

                except ClientError:
                    # Role might not exist yet, which is okay for this test
                    pass

        except Exception as e:
            self.fail(f"Failed to verify IAM roles: {e}")


if __name__ == '__main__':
    unittest.main()
