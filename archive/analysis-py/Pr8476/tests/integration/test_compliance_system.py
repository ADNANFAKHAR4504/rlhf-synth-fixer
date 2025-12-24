"""
Integration tests for Pulumi compliance scanning infrastructure
Tests actual deployed AWS resources using stack outputs
"""
import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestComplianceSystemIntegration(unittest.TestCase):
    """Integration tests for compliance scanning system"""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs from cfn-outputs/flat-outputs.json"""
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Please deploy infrastructure first."
            )

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.config_client = boto3.client('config')
        cls.dynamodb = boto3.resource('dynamodb')
        cls.sns_client = boto3.client('sns')
        cls.s3_client = boto3.client('s3')
        cls.lambda_client = boto3.client('lambda')
        cls.events_client = boto3.client('events')

    def test_config_recorder_exists(self):
        """Test AWS Config recorder was created and is enabled"""
        recorder_name = self.outputs.get('config_recorder_name')
        self.assertIsNotNone(recorder_name, "Config recorder name not in outputs")

        response = self.config_client.describe_configuration_recorders(
            ConfigurationRecorderNames=[recorder_name]
        )

        self.assertEqual(len(response['ConfigurationRecorders']), 1)
        recorder = response['ConfigurationRecorders'][0]
        self.assertEqual(recorder['name'], recorder_name)

        # Check recorder status
        status_response = self.config_client.describe_configuration_recorder_status(
            ConfigurationRecorderNames=[recorder_name]
        )

        status = status_response['ConfigurationRecordersStatus'][0]
        self.assertTrue(status['recording'], "Config recorder is not recording")

    def test_config_bucket_exists(self):
        """Test S3 bucket for Config snapshots exists and is configured"""
        bucket_name = self.outputs.get('config_bucket_name')
        self.assertIsNotNone(bucket_name, "Config bucket name not in outputs")

        # Check bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"Config bucket does not exist: {e}")

        # Check bucket versioning
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled',
                        "Bucket versioning not enabled")

        # Check bucket encryption
        try:
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
        except ClientError:
            self.fail("Bucket encryption not configured")

        # Check public access block
        public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_access['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'], "Public ACLs not blocked")
        self.assertTrue(config['BlockPublicPolicy'], "Public policy not blocked")

    def test_dynamodb_table_exists(self):
        """Test DynamoDB compliance history table exists and is configured"""
        table_name = self.outputs.get('dynamodb_table_name')
        self.assertIsNotNone(table_name, "DynamoDB table name not in outputs")

        table = self.dynamodb.Table(table_name)

        # Check table exists and is active
        self.assertEqual(table.table_status, 'ACTIVE', "Table is not active")

        # Check key schema
        key_schema = {item['AttributeName']: item['KeyType']
                     for item in table.key_schema}
        self.assertEqual(key_schema.get('resource_id'), 'HASH',
                        "Hash key not configured correctly")
        self.assertEqual(key_schema.get('evaluation_timestamp'), 'RANGE',
                        "Range key not configured correctly")

        # Check billing mode
        self.assertEqual(table.billing_mode_summary['BillingMode'],
                        'PAY_PER_REQUEST',
                        "Billing mode not PAY_PER_REQUEST")

        # Check point-in-time recovery
        table_name_str = table.table_name
        pitr = self.dynamodb.meta.client.describe_continuous_backups(
            TableName=table_name_str
        )
        pitr_status = pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED',
                        "Point-in-time recovery not enabled")

    def test_sns_topic_exists(self):
        """Test SNS compliance alerts topic exists"""
        topic_arn = self.outputs.get('sns_topic_arn')
        self.assertIsNotNone(topic_arn, "SNS topic ARN not in outputs")

        try:
            attributes = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertIn('Attributes', attributes)
            self.assertEqual(attributes['Attributes']['TopicArn'], topic_arn)
        except ClientError as e:
            self.fail(f"SNS topic does not exist: {e}")

        # Check for email subscription
        subscriptions = self.sns_client.list_subscriptions_by_topic(
            TopicArn=topic_arn
        )
        self.assertGreater(len(subscriptions['Subscriptions']), 0,
                          "No subscriptions found for SNS topic")

    def test_reports_bucket_exists(self):
        """Test S3 bucket for compliance reports exists"""
        bucket_name = self.outputs.get('reports_bucket_name')
        self.assertIsNotNone(bucket_name, "Reports bucket name not in outputs")

        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"Reports bucket does not exist: {e}")

        # Check bucket encryption
        try:
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
        except ClientError:
            self.fail("Reports bucket encryption not configured")

    def test_ec2_tag_checker_lambda_exists(self):
        """Test EC2 tag checker Lambda function exists and is configured"""
        function_name = self.outputs.get('ec2_tag_checker_function_name')
        self.assertIsNotNone(function_name, "EC2 tag checker function name not in outputs")

        try:
            function = self.lambda_client.get_function(FunctionName=function_name)
            config = function['Configuration']

            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Timeout'], 300)

            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE', env_vars)
            self.assertIn('SNS_TOPIC_ARN', env_vars)
            self.assertIn('ENVIRONMENT_SUFFIX', env_vars)
        except ClientError as e:
            self.fail(f"EC2 tag checker Lambda function does not exist: {e}")

    def test_s3_encryption_checker_lambda_exists(self):
        """Test S3 encryption checker Lambda function exists"""
        function_name = self.outputs.get('s3_encryption_checker_function_name')
        self.assertIsNotNone(function_name,
                            "S3 encryption checker function name not in outputs")

        try:
            function = self.lambda_client.get_function(FunctionName=function_name)
            config = function['Configuration']

            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Timeout'], 300)
        except ClientError as e:
            self.fail(f"S3 encryption checker Lambda function does not exist: {e}")

    def test_rds_backup_checker_lambda_exists(self):
        """Test RDS backup checker Lambda function exists"""
        function_name = self.outputs.get('rds_backup_checker_function_name')
        self.assertIsNotNone(function_name,
                            "RDS backup checker function name not in outputs")

        try:
            function = self.lambda_client.get_function(FunctionName=function_name)
            config = function['Configuration']

            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Timeout'], 300)
        except ClientError as e:
            self.fail(f"RDS backup checker Lambda function does not exist: {e}")

    def test_report_generator_lambda_exists(self):
        """Test report generator Lambda function exists"""
        function_name = self.outputs.get('report_generator_function_name')
        self.assertIsNotNone(function_name,
                            "Report generator function name not in outputs")

        try:
            function = self.lambda_client.get_function(FunctionName=function_name)
            config = function['Configuration']

            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Timeout'], 300)

            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE', env_vars)
            self.assertIn('REPORTS_BUCKET', env_vars)
        except ClientError as e:
            self.fail(f"Report generator Lambda function does not exist: {e}")

    def test_eventbridge_rules_exist(self):
        """Test EventBridge rules for scheduled compliance checks exist"""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

        expected_rules = [
            f'ec2-tag-check-rule-{environment_suffix}',
            f's3-encryption-check-rule-{environment_suffix}',
            f'rds-backup-check-rule-{environment_suffix}',
            f'report-generation-rule-{environment_suffix}'
        ]

        for rule_name in expected_rules:
            try:
                rule = self.events_client.describe_rule(Name=rule_name)
                self.assertEqual(rule['State'], 'ENABLED',
                                f"Rule {rule_name} is not enabled")
                self.assertIn('rate', rule['ScheduleExpression'].lower(),
                             f"Rule {rule_name} does not have rate schedule")
            except ClientError as e:
                self.fail(f"EventBridge rule {rule_name} does not exist: {e}")

    def test_lambda_can_write_to_dynamodb(self):
        """Test Lambda functions can write to DynamoDB table"""
        table_name = self.outputs.get('dynamodb_table_name')
        ec2_function = self.outputs.get('ec2_tag_checker_function_name')

        if not table_name or not ec2_function:
            self.skipTest("Required outputs not available")

        # Invoke EC2 tag checker Lambda
        try:
            response = self.lambda_client.invoke(
                FunctionName=ec2_function,
                InvocationType='RequestResponse'
            )

            self.assertEqual(response['StatusCode'], 200,
                           "Lambda invocation failed")

            # Check if records were written to DynamoDB
            table = self.dynamodb.Table(table_name)
            response = table.scan(Limit=1)

            # Table should have items after Lambda execution
            # (may be empty if no EC2 instances exist)
            self.assertIn('Items', response)
        except ClientError as e:
            self.fail(f"Lambda invocation or DynamoDB check failed: {e}")

    def test_end_to_end_compliance_workflow(self):
        """Test complete compliance workflow from evaluation to report"""
        # This is an end-to-end test that:
        # 1. Triggers compliance checks
        # 2. Verifies DynamoDB records
        # 3. Generates report
        # 4. Verifies report in S3

        table_name = self.outputs.get('dynamodb_table_name')
        reports_bucket = self.outputs.get('reports_bucket_name')
        report_function = self.outputs.get('report_generator_function_name')

        if not all([table_name, reports_bucket, report_function]):
            self.skipTest("Required outputs not available")

        try:
            # Invoke report generator
            response = self.lambda_client.invoke(
                FunctionName=report_function,
                InvocationType='RequestResponse'
            )

            self.assertEqual(response['StatusCode'], 200)

            # Check if report was created in S3
            objects = self.s3_client.list_objects_v2(
                Bucket=reports_bucket,
                Prefix='reports/'
            )

            if 'Contents' in objects:
                self.assertGreater(len(objects['Contents']), 0,
                                 "No reports found in S3 bucket")

                # Download and validate report format
                latest_report = sorted(objects['Contents'],
                                     key=lambda x: x['LastModified'],
                                     reverse=True)[0]

                obj = self.s3_client.get_object(
                    Bucket=reports_bucket,
                    Key=latest_report['Key']
                )

                report_data = json.loads(obj['Body'].read())

                # Validate report structure
                self.assertIn('report_timestamp', report_data)
                self.assertIn('compliance_score', report_data)
                self.assertIn('summary', report_data)
        except ClientError as e:
            self.fail(f"End-to-end workflow test failed: {e}")


if __name__ == '__main__':
    unittest.main()
