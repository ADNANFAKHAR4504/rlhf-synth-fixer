"""
Integration tests for deployed Pulumi infrastructure
"""
import unittest
import json
import boto3
import os
import time
from datetime import datetime


class TestInfrastructureIntegration(unittest.TestCase):
    """Integration tests using real AWS resources"""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs"""
        outputs_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'cfn-outputs', 'flat-outputs.json')
        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Check if this is the correct infrastructure (CloudWatch logging vs other projects)
        required_keys = ['logGroupName', 'archiveBucketName', 'kmsKeyId', 'lambdaFunctionName']
        cls.is_cloudwatch_infrastructure = all(key in cls.outputs for key in required_keys)

        # Extract environment suffix from Lambda function name or environment variable
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX')
        if not cls.environment_suffix and 'lambdaFunctionName' in cls.outputs:
            # Extract suffix from lambda function name (e.g., "cloudwatch-log-exporter-pr3283" -> "pr3283")
            lambda_name = cls.outputs['lambdaFunctionName']
            cls.environment_suffix = lambda_name.split('-')[-1]

        # Set up AWS clients
        cls.region = 'us-east-1'
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.scheduler_client = boto3.client('scheduler', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)

    def test_log_group_exists(self):
        """Test CloudWatch Log Group exists"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        log_group_name = self.outputs['logGroupName']

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name,
            limit=1
        )

        self.assertEqual(len(response['logGroups']), 1)
        self.assertEqual(response['logGroups'][0]['logGroupName'], log_group_name)

    def test_log_group_encryption(self):
        """Test Log Group is encrypted with KMS"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        log_group_name = self.outputs['logGroupName']
        kms_key_id = self.outputs['kmsKeyId']

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name,
            limit=1
        )

        log_group = response['logGroups'][0]
        self.assertIn('kmsKeyId', log_group)
        # KMS key ARN contains the key ID
        self.assertIn(kms_key_id, log_group['kmsKeyId'])

    def test_log_group_retention(self):
        """Test Log Group retention is set to 90 days"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        log_group_name = self.outputs['logGroupName']

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name,
            limit=1
        )

        log_group = response['logGroups'][0]
        self.assertEqual(log_group.get('retentionInDays'), 90)

    def test_s3_bucket_exists(self):
        """Test S3 bucket exists"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        bucket_name = self.outputs['archiveBucketName']

        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_s3_bucket_encryption(self):
        """Test S3 bucket has encryption"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        bucket_name = self.outputs['archiveBucketName']

        response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)

        self.assertIn('Rules', response['ServerSideEncryptionConfiguration'])
        rule = response['ServerSideEncryptionConfiguration']['Rules'][0]
        self.assertEqual(rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')

    def test_s3_bucket_versioning(self):
        """Test S3 bucket has versioning enabled"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        bucket_name = self.outputs['archiveBucketName']

        response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(response.get('Status'), 'Enabled')

    def test_s3_bucket_lifecycle(self):
        """Test S3 bucket lifecycle configuration"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        bucket_name = self.outputs['archiveBucketName']

        response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)

        self.assertIn('Rules', response)
        self.assertGreater(len(response['Rules']), 0)

        # Check for GLACIER transition
        rule = response['Rules'][0]
        self.assertEqual(rule['Status'], 'Enabled')
        self.assertIn('Transitions', rule)

    def test_kms_key_exists(self):
        """Test KMS key exists and is enabled"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        kms_key_id = self.outputs['kmsKeyId']

        response = self.kms_client.describe_key(KeyId=kms_key_id)

        self.assertEqual(response['KeyMetadata']['KeyState'], 'Enabled')
        self.assertTrue(response['KeyMetadata']['Enabled'])

    def test_kms_key_rotation(self):
        """Test KMS key rotation is enabled"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        kms_key_id = self.outputs['kmsKeyId']

        response = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
        self.assertTrue(response['KeyRotationEnabled'])

    def test_lambda_function_exists(self):
        """Test Lambda function exists"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        function_name = self.outputs['lambdaFunctionName']

        response = self.lambda_client.get_function(FunctionName=function_name)

        self.assertEqual(response['Configuration']['FunctionName'], function_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(response['Configuration']['Handler'], 'index.handler')

    def test_lambda_function_configuration(self):
        """Test Lambda function configuration"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        function_name = self.outputs['lambdaFunctionName']

        response = self.lambda_client.get_function_configuration(FunctionName=function_name)

        # Check timeout
        self.assertEqual(response['Timeout'], 300)

        # Check memory
        self.assertEqual(response['MemorySize'], 256)

        # Check environment variables
        self.assertIn('Environment', response)
        self.assertIn('Variables', response['Environment'])
        env_vars = response['Environment']['Variables']
        self.assertIn('LOG_GROUP_NAME', env_vars)
        self.assertIn('S3_BUCKET_NAME', env_vars)

    def test_eventbridge_scheduler_exists(self):
        """Test EventBridge Scheduler exists"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        scheduler_name = self.outputs['schedulerName']

        response = self.scheduler_client.get_schedule(
            Name=scheduler_name,
            GroupName='default'
        )

        self.assertEqual(response['Name'], scheduler_name)
        self.assertEqual(response['ScheduleExpression'], 'rate(1 day)')

    def test_scheduler_target_configuration(self):
        """Test Scheduler target is configured correctly"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        scheduler_name = self.outputs['schedulerName']
        lambda_arn = self.outputs['lambdaFunctionArn']

        response = self.scheduler_client.get_schedule(
            Name=scheduler_name,
            GroupName='default'
        )

        self.assertEqual(response['Target']['Arn'], lambda_arn)
        self.assertIn('RoleArn', response['Target'])
        self.assertIn('RetryPolicy', response['Target'])

    def test_cloudwatch_metric_filter_exists(self):
        """Test CloudWatch metric filter exists"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        log_group_name = self.outputs['logGroupName']

        response = self.logs_client.describe_metric_filters(
            logGroupName=log_group_name
        )

        self.assertGreater(len(response['metricFilters']), 0)

        # Find our error filter
        error_filter = None
        for filter in response['metricFilters']:
            if 'error-count-filter' in filter['filterName']:
                error_filter = filter
                break

        self.assertIsNotNone(error_filter)
        self.assertEqual(error_filter['filterPattern'], '[ERROR]')

    def test_cloudwatch_alarm_exists(self):
        """Test CloudWatch alarm exists"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix='high-error-rate-alarm'
        )

        self.assertGreater(len(response['MetricAlarms']), 0)

        alarm = response['MetricAlarms'][0]
        self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')
        self.assertEqual(alarm['Threshold'], 100.0)
        self.assertEqual(alarm['EvaluationPeriods'], 2)

    def test_eventbridge_log_group_exists(self):
        """Test EventBridge log group exists"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        eventbridge_log_group = self.outputs['eventBridgeLogGroup']

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=eventbridge_log_group,
            limit=1
        )

        self.assertEqual(len(response['logGroups']), 1)
        self.assertEqual(response['logGroups'][0]['logGroupName'], eventbridge_log_group)

    def test_write_log_entry(self):
        """Test writing a log entry to the log group"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        log_group_name = self.outputs['logGroupName']

        # Create log stream
        stream_name = f"test-stream-{int(time.time())}"
        self.logs_client.create_log_stream(
            logGroupName=log_group_name,
            logStreamName=stream_name
        )

        # Put log event
        response = self.logs_client.put_log_events(
            logGroupName=log_group_name,
            logStreamName=stream_name,
            logEvents=[
                {
                    'message': 'Test log message from integration test',
                    'timestamp': int(time.time() * 1000)
                }
            ]
        )

        self.assertIn('nextSequenceToken', response)

    def test_lambda_invocation(self):
        """Test Lambda function can be invoked"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        function_name = self.outputs['lambdaFunctionName']

        # Note: This will attempt to export logs, which might fail if there are no logs
        # We're just testing that the function can be invoked
        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='DryRun'  # Dry run to avoid actual export
        )

        self.assertEqual(response['StatusCode'], 204)  # DryRun returns 204

    def test_resource_tags(self):
        """Test that resources have proper tags"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        # Test S3 bucket tags
        bucket_name = self.outputs['archiveBucketName']
        response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)

        tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}
        self.assertIn('EnvironmentSuffix', tags)

        # Test Lambda tags
        function_arn = self.outputs['lambdaFunctionArn']
        response = self.lambda_client.list_tags(Resource=function_arn)

        self.assertIn('EnvironmentSuffix', response['Tags'])

    def test_iam_roles_exist(self):
        """Test that IAM roles were created"""
        if not self.is_cloudwatch_infrastructure:
            self.skipTest("CloudWatch infrastructure not deployed - outputs file contains different project")
        iam_client = boto3.client('iam', region_name=self.region)

        # Check for lambda role using dynamic environment suffix
        role_name = f'log-export-lambda-role-{self.environment_suffix}'
        try:
            response = iam_client.get_role(RoleName=role_name)
            policy_doc = response['Role']['AssumeRolePolicyDocument']
            # Check that lambda.amazonaws.com is in the policy
            self.assertTrue(
                any(
                    stmt.get('Principal', {}).get('Service') == 'lambda.amazonaws.com'
                    for stmt in policy_doc.get('Statement', [])
                ),
                "lambda.amazonaws.com not found in assume role policy"
            )
        except iam_client.exceptions.NoSuchEntityException:
            self.fail(f"Lambda IAM role not found: {role_name}")


if __name__ == "__main__":
    unittest.main()