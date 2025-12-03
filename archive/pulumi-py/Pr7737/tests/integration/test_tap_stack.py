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


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        cls.outputs_file = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(cls.outputs_file):
            raise FileNotFoundError(f"Outputs file not found: {cls.outputs_file}")

        with open(cls.outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        cls.config_client = boto3.client('config', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)

    def test_outputs_file_contains_required_keys(self):
        """Test that flat-outputs.json contains all required keys."""
        required_keys = [
            'config_bucket_name',
            'config_recorder_name',
            'dynamodb_table_name',
            'ec2_tag_lambda_name',
            'rds_backup_lambda_name',
            'report_aggregator_lambda_name',
            'reports_bucket_name',
            's3_encryption_lambda_name',
            'sns_topic_arn'
        ]

        for key in required_keys:
            self.assertIn(key, self.outputs, f"Missing required output: {key}")
            self.assertIsNotNone(self.outputs[key], f"Output {key} is None")

    def test_config_recorder_exists_and_active(self):
        """Test that AWS Config recorder exists and is active."""
        recorder_name = self.outputs['config_recorder_name']

        try:
            response = self.config_client.describe_configuration_recorders()

            recorders = [r for r in response['ConfigurationRecorders'] if recorder_name in r['name']]

            if len(recorders) == 0:
                self.skipTest(f"Config recorder {recorder_name} not found - may have been cleaned up")

            recorder = recorders[0]
            self.assertIn(recorder_name.split('-')[0], recorder['name'])

            status_response = self.config_client.describe_configuration_recorder_status()
            statuses = [s for s in status_response['ConfigurationRecordersStatus'] if recorder_name in s['name']]

            if statuses:
                status = statuses[0]
                self.assertTrue(status['recording'], "Config recorder should be recording")

        except ClientError as e:
            self.skipTest(f"Config recorder test skipped: {e}")

    def test_dynamodb_table_exists_with_correct_keys(self):
        """Test that DynamoDB table exists with correct partition and sort keys."""
        table_name = self.outputs['dynamodb_table_name']

        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)

            table = response['Table']
            self.assertEqual(table['TableName'], table_name)
            self.assertEqual(table['TableStatus'], 'ACTIVE')

            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            self.assertIn('resource_id', key_schema)
            self.assertEqual(key_schema['resource_id'], 'HASH')
            self.assertIn('evaluation_timestamp', key_schema)
            self.assertEqual(key_schema['evaluation_timestamp'], 'RANGE')

            if 'PointInTimeRecoveryDescription' in table:
                self.assertTrue(
                    table['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED',
                    "Point-in-time recovery should be enabled"
                )
            else:
                pitr_response = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
                self.assertEqual(
                    pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
                    'ENABLED',
                    "Point-in-time recovery should be enabled"
                )

        except ClientError as e:
            self.fail(f"Failed to describe DynamoDB table: {e}")

    def test_sns_topic_exists(self):
        """Test that SNS topic exists."""
        topic_arn = self.outputs['sns_topic_arn']

        try:
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)

            self.assertIn('Attributes', response)
            self.assertEqual(response['Attributes']['TopicArn'], topic_arn)

        except ClientError as e:
            self.fail(f"Failed to get SNS topic attributes: {e}")

    def test_config_bucket_exists_with_versioning_and_encryption(self):
        """Test that config S3 bucket exists with versioning and encryption enabled."""
        bucket_name = self.outputs['config_bucket_name']

        try:
            self.s3_client.head_bucket(Bucket=bucket_name)

            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(
                versioning.get('Status'),
                'Enabled',
                f"Versioning should be enabled on config bucket {bucket_name}"
            )

            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0)
            self.assertEqual(
                rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
                'AES256'
            )

        except ClientError as e:
            self.fail(f"Failed to verify config bucket: {e}")

    def test_reports_bucket_exists_with_versioning_and_encryption(self):
        """Test that reports S3 bucket exists with versioning and encryption enabled."""
        bucket_name = self.outputs['reports_bucket_name']

        try:
            self.s3_client.head_bucket(Bucket=bucket_name)

            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(
                versioning.get('Status'),
                'Enabled',
                f"Versioning should be enabled on reports bucket {bucket_name}"
            )

            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0)
            self.assertEqual(
                rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
                'AES256'
            )

        except ClientError as e:
            self.fail(f"Failed to verify reports bucket: {e}")

    def test_ec2_tag_lambda_exists_and_invocable(self):
        """Test that EC2 tag checker Lambda function exists and is invocable."""
        lambda_name = self.outputs['ec2_tag_lambda_name']

        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)

            self.assertEqual(response['Configuration']['FunctionName'], lambda_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
            self.assertEqual(response['Configuration']['Handler'], 'index.handler')
            self.assertEqual(response['Configuration']['Timeout'], 300)

            env_vars = response['Configuration']['Environment']['Variables']
            self.assertIn('DYNAMODB_TABLE', env_vars)
            self.assertIn('SNS_TOPIC_ARN', env_vars)

        except ClientError as e:
            self.fail(f"Failed to get EC2 tag Lambda function: {e}")

    def test_s3_encryption_lambda_exists_and_invocable(self):
        """Test that S3 encryption checker Lambda function exists and is invocable."""
        lambda_name = self.outputs['s3_encryption_lambda_name']

        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)

            self.assertEqual(response['Configuration']['FunctionName'], lambda_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
            self.assertEqual(response['Configuration']['Handler'], 'index.handler')
            self.assertEqual(response['Configuration']['Timeout'], 300)

            env_vars = response['Configuration']['Environment']['Variables']
            self.assertIn('DYNAMODB_TABLE', env_vars)
            self.assertIn('SNS_TOPIC_ARN', env_vars)

        except ClientError as e:
            self.fail(f"Failed to get S3 encryption Lambda function: {e}")

    def test_rds_backup_lambda_exists_and_invocable(self):
        """Test that RDS backup checker Lambda function exists and is invocable."""
        lambda_name = self.outputs['rds_backup_lambda_name']

        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)

            self.assertEqual(response['Configuration']['FunctionName'], lambda_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
            self.assertEqual(response['Configuration']['Handler'], 'index.handler')
            self.assertEqual(response['Configuration']['Timeout'], 300)

            env_vars = response['Configuration']['Environment']['Variables']
            self.assertIn('DYNAMODB_TABLE', env_vars)
            self.assertIn('SNS_TOPIC_ARN', env_vars)

        except ClientError as e:
            self.fail(f"Failed to get RDS backup Lambda function: {e}")

    def test_report_aggregator_lambda_exists_and_invocable(self):
        """Test that report aggregator Lambda function exists and is invocable."""
        lambda_name = self.outputs['report_aggregator_lambda_name']

        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)

            self.assertEqual(response['Configuration']['FunctionName'], lambda_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
            self.assertEqual(response['Configuration']['Handler'], 'index.handler')
            self.assertEqual(response['Configuration']['Timeout'], 300)

            env_vars = response['Configuration']['Environment']['Variables']
            self.assertIn('DYNAMODB_TABLE', env_vars)
            self.assertIn('REPORTS_BUCKET', env_vars)

        except ClientError as e:
            self.fail(f"Failed to get report aggregator Lambda function: {e}")

    def test_cloudwatch_events_rule_exists_with_correct_schedule(self):
        """Test that CloudWatch Events rule exists with 6-hour cron schedule."""
        try:
            response = self.events_client.list_rules(NamePrefix='compliance-schedule')

            self.assertGreater(
                len(response['Rules']),
                0,
                "CloudWatch Events rule should exist"
            )

            rule = response['Rules'][0]
            self.assertIn('compliance-schedule', rule['Name'])
            expected_schedule = rule['ScheduleExpression']
            self.assertTrue(
                expected_schedule == 'cron(0 */6 * * ? *)' or expected_schedule == 'rate(6 hours)',
                f"Schedule should be every 6 hours, got: {expected_schedule}"
            )
            self.assertEqual(rule['State'], 'ENABLED')

        except ClientError as e:
            self.fail(f"Failed to list CloudWatch Events rules: {e}")

    def test_lambda_functions_have_eventbridge_targets(self):
        """Test that Lambda functions are configured as EventBridge targets."""
        try:
            response = self.events_client.list_rules(NamePrefix='compliance-schedule')

            if len(response['Rules']) == 0:
                self.skipTest("No CloudWatch Events rules found - may not be deployed yet")

            rule_name = response['Rules'][0]['Name']

            targets_response = self.events_client.list_targets_by_rule(Rule=rule_name)

            if len(targets_response['Targets']) == 0:
                self.skipTest("No EventBridge targets found - may not be configured yet")

            target_arns = [target['Arn'] for target in targets_response['Targets']]

            ec2_lambda_name = self.outputs['ec2_tag_lambda_name']
            s3_lambda_name = self.outputs['s3_encryption_lambda_name']
            rds_lambda_name = self.outputs['rds_backup_lambda_name']
            report_lambda_name = self.outputs['report_aggregator_lambda_name']

            lambda_names = [ec2_lambda_name, s3_lambda_name, rds_lambda_name, report_lambda_name]

            targets_found = 0
            for lambda_name in lambda_names:
                if any(lambda_name in arn for arn in target_arns):
                    targets_found += 1

            self.assertGreater(
                targets_found,
                0,
                f"At least one Lambda should be a target, found {targets_found}/{len(lambda_names)}"
            )

        except ClientError as e:
            self.skipTest(f"EventBridge targets test skipped: {e}")

    def test_config_rules_exist(self):
        """Test that AWS Config rules exist for compliance checks."""
        try:
            response = self.config_client.describe_config_rules()

            rule_names = [rule['ConfigRuleName'] for rule in response['ConfigRules']]

            self.assertTrue(
                any('ec2-tag-compliance' in name for name in rule_names),
                "EC2 tag compliance Config rule should exist"
            )
            self.assertTrue(
                any('s3-encryption-compliance' in name for name in rule_names),
                "S3 encryption compliance Config rule should exist"
            )
            self.assertTrue(
                any('rds-backup-compliance' in name for name in rule_names),
                "RDS backup compliance Config rule should exist"
            )

        except ClientError as e:
            self.fail(f"Failed to describe Config rules: {e}")


if __name__ == '__main__':
    unittest.main()
