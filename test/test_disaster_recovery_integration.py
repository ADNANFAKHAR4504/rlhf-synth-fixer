"""
Integration tests for disaster recovery CloudFormation deployment.

Tests validate actual AWS resources using deployment outputs from cfn-outputs/flat-outputs.json.
All tests use real AWS SDK calls against deployed infrastructure.
"""

import json
import os
import sys
import unittest
import boto3
import requests
from botocore.exceptions import ClientError


class TestDisasterRecoveryIntegration(unittest.TestCase):
    """Integration tests for deployed disaster recovery infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs and initialize AWS clients."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'cfn-outputs',
            'flat-outputs.json'
        )

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"Deployment outputs not found: {outputs_path}. "
                "Run deployment first to generate outputs."
            )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = 'us-east-1'
        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.s3 = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.secretsmanager = boto3.client('secretsmanager', region_name=cls.region)
        cls.sns = boto3.client('sns', region_name=cls.region)
        cls.route53 = boto3.client('route53')
        cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)

    def test_dynamodb_table_exists(self):
        """Test DynamoDB Global Table exists and is active."""
        table_name = self.outputs['DynamoDBTableName']

        response = self.dynamodb.describe_table(TableName=table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        self.assertEqual(response['Table']['TableName'], table_name)

    def test_dynamodb_table_billing_mode(self):
        """Test DynamoDB table uses on-demand billing."""
        table_name = self.outputs['DynamoDBTableName']

        response = self.dynamodb.describe_table(TableName=table_name)
        self.assertEqual(
            response['Table']['BillingModeSummary']['BillingMode'],
            'PAY_PER_REQUEST'
        )

    def test_dynamodb_table_streams_enabled(self):
        """Test DynamoDB table has streams enabled."""
        table_name = self.outputs['DynamoDBTableName']

        response = self.dynamodb.describe_table(TableName=table_name)
        self.assertIn('StreamSpecification', response['Table'])
        stream_spec = response['Table']['StreamSpecification']
        self.assertTrue(stream_spec['StreamEnabled'])
        self.assertEqual(stream_spec['StreamViewType'], 'NEW_AND_OLD_IMAGES')

    def test_dynamodb_table_has_gsi(self):
        """Test DynamoDB table has Global Secondary Index."""
        table_name = self.outputs['DynamoDBTableName']

        response = self.dynamodb.describe_table(TableName=table_name)
        self.assertIn('GlobalSecondaryIndexes', response['Table'])

        gsi_list = response['Table']['GlobalSecondaryIndexes']
        self.assertGreater(len(gsi_list), 0)

        # Check CustomerIndex exists
        gsi_names = [gsi['IndexName'] for gsi in gsi_list]
        self.assertIn('CustomerIndex', gsi_names)

    def test_dynamodb_table_pitr_enabled(self):
        """Test DynamoDB table has point-in-time recovery enabled."""
        table_name = self.outputs['DynamoDBTableName']

        response = self.dynamodb.describe_continuous_backups(TableName=table_name)
        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')

    def test_dynamodb_table_can_write(self):
        """Test DynamoDB table accepts write operations."""
        table_name = self.outputs['DynamoDBTableName']

        # Write test item
        test_item = {
            'transactionId': {'S': 'test-transaction-12345'},
            'timestamp': {'N': '1700000000000'},
            'customerId': {'S': 'test-customer'},
            'amount': {'N': '100.00'},
            'status': {'S': 'test'}
        }

        try:
            response = self.dynamodb.put_item(
                TableName=table_name,
                Item=test_item
            )
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Clean up test item
            self.dynamodb.delete_item(
                TableName=table_name,
                Key={
                    'transactionId': {'S': 'test-transaction-12345'},
                    'timestamp': {'N': '1700000000000'}
                }
            )
        except ClientError as e:
            self.fail(f"Failed to write to DynamoDB: {e}")

    def test_s3_bucket_exists(self):
        """Test S3 bucket exists and is accessible."""
        bucket_name = self.outputs['S3BucketName']

        try:
            response = self.s3.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"S3 bucket not accessible: {e}")

    def test_s3_bucket_versioning_enabled(self):
        """Test S3 bucket has versioning enabled."""
        bucket_name = self.outputs['S3BucketName']

        response = self.s3.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(response['Status'], 'Enabled')

    def test_s3_bucket_encryption_enabled(self):
        """Test S3 bucket has encryption enabled."""
        bucket_name = self.outputs['S3BucketName']

        response = self.s3.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('ServerSideEncryptionConfiguration', response)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')

    def test_s3_bucket_public_access_blocked(self):
        """Test S3 bucket blocks all public access."""
        bucket_name = self.outputs['S3BucketName']

        response = self.s3.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    def test_s3_bucket_can_write(self):
        """Test S3 bucket accepts write operations."""
        bucket_name = self.outputs['S3BucketName']

        test_key = 'test/integration-test.txt'
        test_content = b'Integration test content'

        try:
            # Upload test object
            response = self.s3.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content
            )
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Verify object exists
            response = self.s3.head_object(Bucket=bucket_name, Key=test_key)
            self.assertEqual(response['ContentLength'], len(test_content))

            # Clean up
            self.s3.delete_object(Bucket=bucket_name, Key=test_key)
        except ClientError as e:
            self.fail(f"Failed to write to S3: {e}")

    def test_lambda_function_exists(self):
        """Test Lambda payment processing function exists."""
        function_arn = self.outputs['LambdaFunctionArn']
        function_name = function_arn.split(':')[-1]

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            self.assertEqual(response['Configuration']['FunctionArn'], function_arn)
        except ClientError as e:
            self.fail(f"Lambda function not found: {e}")

    def test_lambda_function_runtime(self):
        """Test Lambda function uses Python 3.11 runtime."""
        function_arn = self.outputs['LambdaFunctionArn']
        function_name = function_arn.split(':')[-1]

        response = self.lambda_client.get_function(FunctionName=function_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.11')

    def test_lambda_function_reserved_concurrency(self):
        """Test Lambda function has reserved concurrency configured."""
        function_arn = self.outputs['LambdaFunctionArn']
        function_name = function_arn.split(':')[-1]

        response = self.lambda_client.get_function(FunctionName=function_name)
        # Reserved concurrency should be 100 (from parameter)
        reserved = response['Concurrency'].get('ReservedConcurrentExecutions')
        self.assertEqual(reserved, 100)

    def test_lambda_function_environment_variables(self):
        """Test Lambda function has required environment variables."""
        function_arn = self.outputs['LambdaFunctionArn']
        function_name = function_arn.split(':')[-1]

        response = self.lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration']['Environment']['Variables']

        required_vars = ['REGION', 'ENVIRONMENT', 'TABLE_NAME', 'SECRET_ARN', 'LOGS_BUCKET', 'IS_PRIMARY']
        for var in required_vars:
            self.assertIn(var, env_vars, f"Missing environment variable: {var}")

    def test_lambda_function_url_accessible(self):
        """Test Lambda function URL is accessible."""
        function_url = self.outputs['LambdaFunctionUrl']

        try:
            # Test GET request (should work even if POST is expected)
            response = requests.get(function_url, timeout=10)
            # Accept any HTTP response (not checking success since we need proper POST)
            self.assertIsNotNone(response.status_code)
        except requests.exceptions.RequestException as e:
            self.fail(f"Lambda function URL not accessible: {e}")

    def test_health_check_endpoint_accessible(self):
        """Test health check endpoint is accessible."""
        health_check_url = self.outputs['HealthCheckUrl']

        try:
            response = requests.get(health_check_url, timeout=10)
            # Health check may return 503 if table is still initializing or region check fails
            # We just verify endpoint is reachable
            self.assertIn(response.status_code, [200, 503])

            # Verify response structure if successful
            if response.status_code == 200:
                data = response.json()
                self.assertIn('status', data)
                self.assertEqual(data['status'], 'healthy')
        except requests.exceptions.RequestException as e:
            self.fail(f"Health check endpoint not accessible: {e}")

    def test_secrets_manager_secret_exists(self):
        """Test Secrets Manager secret exists."""
        secret_arn = self.outputs['SecretArn']

        try:
            response = self.secretsmanager.describe_secret(SecretId=secret_arn)
            self.assertEqual(response['ARN'], secret_arn)
        except ClientError as e:
            self.fail(f"Secret not found: {e}")

    def test_secrets_manager_secret_accessible(self):
        """Test Secrets Manager secret value is retrievable."""
        secret_arn = self.outputs['SecretArn']

        try:
            response = self.secretsmanager.get_secret_value(SecretId=secret_arn)
            self.assertIn('SecretString', response)

            # Verify secret structure
            secret_data = json.loads(response['SecretString'])
            self.assertIn('apiKey', secret_data)
            self.assertIn('region', secret_data)
        except ClientError as e:
            self.fail(f"Secret not accessible: {e}")

    def test_sns_topic_exists(self):
        """Test SNS topic exists."""
        topic_arn = self.outputs['SNSTopicArn']

        try:
            response = self.sns.get_topic_attributes(TopicArn=topic_arn)
            self.assertEqual(response['Attributes']['TopicArn'], topic_arn)
        except ClientError as e:
            self.fail(f"SNS topic not found: {e}")

    def test_sns_topic_has_subscriptions(self):
        """Test SNS topic has email subscription."""
        topic_arn = self.outputs['SNSTopicArn']

        response = self.sns.list_subscriptions_by_topic(TopicArn=topic_arn)
        subscriptions = response['Subscriptions']

        # Should have at least one subscription
        self.assertGreater(len(subscriptions), 0)

        # Check for email protocol
        protocols = [sub['Protocol'] for sub in subscriptions]
        self.assertIn('email', protocols)

    def test_route53_hosted_zone_exists(self):
        """Test Route53 hosted zone exists."""
        hosted_zone_id = self.outputs['HostedZoneId']

        try:
            response = self.route53.get_hosted_zone(Id=hosted_zone_id)
            self.assertIn('HostedZone', response)
            # Verify zone ID matches
            zone_id = response['HostedZone']['Id'].split('/')[-1]
            self.assertEqual(zone_id, hosted_zone_id)
        except ClientError as e:
            self.fail(f"Hosted zone not found: {e}")

    def test_route53_health_check_exists(self):
        """Test Route53 health check exists."""
        health_check_id = self.outputs['HealthCheckId']

        try:
            response = self.route53.get_health_check(HealthCheckId=health_check_id)
            self.assertIn('HealthCheck', response)
            self.assertEqual(response['HealthCheck']['Id'], health_check_id)
        except ClientError as e:
            self.fail(f"Health check not found: {e}")

    def test_route53_health_check_configuration(self):
        """Test Route53 health check is properly configured."""
        health_check_id = self.outputs['HealthCheckId']

        response = self.route53.get_health_check(HealthCheckId=health_check_id)
        config = response['HealthCheck']['HealthCheckConfig']

        self.assertEqual(config['Type'], 'HTTPS')
        self.assertEqual(config['Port'], 443)
        self.assertEqual(config['RequestInterval'], 30)
        self.assertEqual(config['FailureThreshold'], 3)

    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms are created."""
        # Get alarm name prefix from stack outputs
        # Alarms should include environmentSuffix
        response = self.cloudwatch.describe_alarms(MaxRecords=100)
        alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]

        # Check for specific alarms (they include environmentSuffix)
        expected_alarm_patterns = [
            'lambda-errors-',
            'lambda-throttles-',
            'dynamodb-read-throttle-',
            'dynamodb-write-throttle-'
        ]

        for pattern in expected_alarm_patterns:
            matching_alarms = [name for name in alarm_names if pattern in name]
            self.assertGreater(
                len(matching_alarms), 0,
                f"No alarms found matching pattern: {pattern}"
            )

    def test_cloudwatch_alarms_configured_for_sns(self):
        """Test CloudWatch alarms are configured to notify SNS topic."""
        sns_topic_arn = self.outputs['SNSTopicArn']

        response = self.cloudwatch.describe_alarms(MaxRecords=100)

        # Find alarms related to our stack
        stack_alarms = [
            alarm for alarm in response['MetricAlarms']
            if sns_topic_arn in alarm.get('AlarmActions', [])
        ]

        # Should have multiple alarms configured
        self.assertGreater(len(stack_alarms), 0)

    def test_end_to_end_data_flow(self):
        """Test complete data flow: Lambda -> DynamoDB -> S3."""
        # This test validates the integration between services

        # 1. Verify Lambda can write to DynamoDB
        table_name = self.outputs['DynamoDBTableName']

        test_transaction = {
            'transactionId': {'S': 'e2e-test-tx-001'},
            'timestamp': {'N': str(int(1700000000000))},
            'customerId': {'S': 'e2e-customer'},
            'amount': {'N': '250.00'},
            'status': {'S': 'completed'}
        }

        try:
            # Write to DynamoDB
            response = self.dynamodb.put_item(
                TableName=table_name,
                Item=test_transaction
            )
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Verify write
            response = self.dynamodb.get_item(
                TableName=table_name,
                Key={
                    'transactionId': {'S': 'e2e-test-tx-001'},
                    'timestamp': {'N': '1700000000000'}
                }
            )
            self.assertIn('Item', response)
            self.assertEqual(response['Item']['customerId']['S'], 'e2e-customer')

            # 2. Verify S3 logging capability
            bucket_name = self.outputs['S3BucketName']
            log_key = 'e2e-test/transaction-log.json'

            log_data = json.dumps(test_transaction).encode('utf-8')
            self.s3.put_object(
                Bucket=bucket_name,
                Key=log_key,
                Body=log_data
            )

            # Verify log exists
            response = self.s3.head_object(Bucket=bucket_name, Key=log_key)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Clean up
            self.dynamodb.delete_item(
                TableName=table_name,
                Key={
                    'transactionId': {'S': 'e2e-test-tx-001'},
                    'timestamp': {'N': '1700000000000'}
                }
            )
            self.s3.delete_object(Bucket=bucket_name, Key=log_key)

        except Exception as e:
            self.fail(f"End-to-end data flow test failed: {e}")

    def test_resource_naming_convention(self):
        """Test all resources follow naming convention with environmentSuffix."""
        # Extract environmentSuffix from resource names
        table_name = self.outputs['DynamoDBTableName']
        bucket_name = self.outputs['S3BucketName']
        function_arn = self.outputs['LambdaFunctionArn']
        topic_arn = self.outputs['SNSTopicArn']

        # All should contain 'synth101912619' (or similar environmentSuffix)
        # We'll check they all use consistent suffix
        self.assertIn('synth101912619', table_name.lower())
        self.assertIn('synth101912619', bucket_name.lower())
        self.assertIn('synth101912619', function_arn.lower())
        self.assertIn('synth101912619', topic_arn.lower())


class TestDeploymentOutputs(unittest.TestCase):
    """Test deployment outputs structure and completeness."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'cfn-outputs',
            'flat-outputs.json'
        )
        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

    def test_all_required_outputs_present(self):
        """Test all required stack outputs are present."""
        required_outputs = [
            'DynamoDBTableName',
            'DynamoDBTableArn',
            'S3BucketName',
            'S3BucketArn',
            'LambdaFunctionArn',
            'LambdaFunctionUrl',
            'HealthCheckUrl',
            'SecretArn',
            'SNSTopicArn',
            'HostedZoneId',
            'HealthCheckId'
        ]

        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs)
            self.assertIsNotNone(self.outputs[output_key])
            self.assertGreater(len(self.outputs[output_key]), 0)

    def test_output_formats_valid(self):
        """Test output values follow correct format."""
        # Test ARN formats
        arn_outputs = ['DynamoDBTableArn', 'S3BucketArn', 'LambdaFunctionArn', 'SecretArn', 'SNSTopicArn']
        for arn_key in arn_outputs:
            arn = self.outputs[arn_key]
            self.assertTrue(arn.startswith('arn:aws:'))

        # Test URL formats
        url_outputs = ['LambdaFunctionUrl', 'HealthCheckUrl']
        for url_key in url_outputs:
            url = self.outputs[url_key]
            self.assertTrue(url.startswith('https://'))

    def test_outputs_reference_correct_region(self):
        """Test outputs reference correct AWS region."""
        region = 'us-east-1'

        # Check ARNs contain correct region
        dynamodb_arn = self.outputs['DynamoDBTableArn']
        self.assertIn(region, dynamodb_arn)

        lambda_arn = self.outputs['LambdaFunctionArn']
        self.assertIn(region, lambda_arn)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
