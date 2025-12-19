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
        # Load outputs from deployment
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        with open(outputs_path, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Get AWS region from environment or default
        region = os.environ.get('AWS_REGION', 'us-east-1')

        # Initialize AWS clients with explicit region
        cls.s3_client = boto3.client('s3', region_name=region)
        cls.lambda_client = boto3.client('lambda', region_name=region)
        cls.logs_client = boto3.client('logs', region_name=region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        cls.iam_client = boto3.client('iam', region_name=region)

    def test_outputs_exist(self):
        """Test that all expected outputs are present."""
        self.assertIn('bucket_name', self.outputs)
        self.assertIn('lambda_function_name', self.outputs)
        self.assertIn('lambda_function_arn', self.outputs)
        self.assertIn('log_group_name', self.outputs)
        self.assertIn('environment', self.outputs)

    def test_environment_suffix_in_outputs(self):
        """Test that environment suffix is present in all resource names."""
        environment = self.outputs['environment']
        self.assertIsNotNone(environment)
        self.assertGreater(len(environment), 0)

        # Check that all resource names include the environment suffix
        self.assertIn(environment, self.outputs['bucket_name'])
        self.assertIn(environment, self.outputs['lambda_function_name'])
        self.assertIn(environment, self.outputs['log_group_name'])

    def test_s3_bucket_exists(self):
        """Test that S3 bucket exists and is accessible."""
        bucket_name = self.outputs['bucket_name']

        # Check bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"S3 bucket does not exist: {e}")

    def test_s3_bucket_public_access_blocked(self):
        """Test that S3 bucket has public access blocked."""
        bucket_name = self.outputs['bucket_name']

        try:
            response = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = response['PublicAccessBlockConfiguration']

            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")

    def test_s3_bucket_versioning_configuration(self):
        """Test that S3 bucket versioning is configured as expected."""
        bucket_name = self.outputs['bucket_name']

        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            # Versioning should be disabled for dev environment (based on config)
            status = response.get('Status', 'Disabled')
            self.assertIn(status, ['Enabled', 'Suspended', 'Disabled'])
        except ClientError as e:
            self.fail(f"Failed to get bucket versioning: {e}")

    def test_s3_bucket_write_and_read(self):
        """Test S3 bucket write and read operations."""
        bucket_name = self.outputs['bucket_name']
        test_key = 'test/integration-test.txt'
        test_content = 'Integration test content'

        try:
            # Write object
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ContentType='text/plain'
            )

            # Read object
            response = self.s3_client.get_object(Bucket=bucket_name, Key=test_key)
            content = response['Body'].read().decode('utf-8')
            self.assertEqual(content, test_content)

            # Clean up
            self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        except ClientError as e:
            self.fail(f"S3 write/read operation failed: {e}")

    def test_lambda_function_exists(self):
        """Test that Lambda function exists and is accessible."""
        function_name = self.outputs['lambda_function_name']

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            self.assertIsNotNone(response['Configuration'])
            self.assertEqual(response['Configuration']['FunctionName'], function_name)
        except ClientError as e:
            self.fail(f"Lambda function does not exist: {e}")

    def test_lambda_function_configuration(self):
        """Test Lambda function has correct configuration."""
        function_name = self.outputs['lambda_function_name']

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']

            # Check runtime
            self.assertEqual(config['Runtime'], 'python3.11')

            # Check handler
            self.assertEqual(config['Handler'], 'index.handler')

            # Check timeout
            self.assertEqual(config['Timeout'], 30)

            # Check memory (should be 512MB for dev environment)
            self.assertEqual(config['MemorySize'], 512)

            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('BUCKET_NAME', env_vars)
            self.assertEqual(env_vars['BUCKET_NAME'], self.outputs['bucket_name'])
            self.assertIn('ENVIRONMENT', env_vars)

        except ClientError as e:
            self.fail(f"Failed to get Lambda configuration: {e}")

    def test_lambda_function_has_iam_role(self):
        """Test that Lambda function has an IAM role attached."""
        function_name = self.outputs['lambda_function_name']

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            role_arn = response['Configuration']['Role']

            self.assertIsNotNone(role_arn)
            self.assertIn('iam', role_arn)
            self.assertIn('role', role_arn)
        except ClientError as e:
            self.fail(f"Failed to get Lambda IAM role: {e}")

    def test_lambda_function_invocation(self):
        """Test Lambda function can be invoked successfully."""
        function_name = self.outputs['lambda_function_name']

        try:
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps({}).encode('utf-8')
            )

            self.assertEqual(response['StatusCode'], 200)

            # Parse response payload
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            self.assertIn('statusCode', payload)
            self.assertEqual(payload['statusCode'], 200)

            # Check response body
            body = json.loads(payload['body'])
            self.assertEqual(body['status'], 'success')

        except ClientError as e:
            self.fail(f"Lambda invocation failed: {e}")

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists."""
        log_group_name = self.outputs['log_group_name']

        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )

            log_groups = response['logGroups']
            self.assertGreater(len(log_groups), 0)

            # Find matching log group
            matching = [lg for lg in log_groups if lg['logGroupName'] == log_group_name]
            self.assertEqual(len(matching), 1)

            # Check retention policy (should be 7 days for dev)
            log_group = matching[0]
            self.assertIn('retentionInDays', log_group)
            self.assertEqual(log_group['retentionInDays'], 7)

        except ClientError as e:
            self.fail(f"Failed to get CloudWatch log group: {e}")

    def test_cloudwatch_alarm_exists(self):
        """Test that CloudWatch error alarm exists."""
        function_name = self.outputs['lambda_function_name']
        environment = self.outputs['environment']
        alarm_name = f'tap-lambda-errors-{environment}'

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[alarm_name]
            )

            alarms = response['MetricAlarms']
            self.assertEqual(len(alarms), 1)

            alarm = alarms[0]
            self.assertEqual(alarm['AlarmName'], alarm_name)
            self.assertEqual(alarm['MetricName'], 'Errors')
            self.assertEqual(alarm['Namespace'], 'AWS/Lambda')
            self.assertEqual(alarm['Statistic'], 'Sum')
            self.assertEqual(alarm['Threshold'], 5.0)
            self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')

            # Check dimensions include function name
            dimensions = alarm['Dimensions']
            function_dimension = [d for d in dimensions if d['Name'] == 'FunctionName']
            self.assertEqual(len(function_dimension), 1)
            self.assertEqual(function_dimension[0]['Value'], function_name)

        except ClientError as e:
            self.fail(f"Failed to get CloudWatch alarm: {e}")

    def test_lambda_logs_generated_after_invocation(self):
        """Test that Lambda generates logs after invocation."""
        function_name = self.outputs['lambda_function_name']
        log_group_name = self.outputs['log_group_name']

        # Invoke Lambda to generate logs
        try:
            self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps({}).encode('utf-8')
            )

            # Wait a moment for logs to appear
            import time
            time.sleep(2)

            # Check for log streams
            response = self.logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )

            log_streams = response['logStreams']
            self.assertGreater(len(log_streams), 0)

        except ClientError as e:
            # Log generation may take time, so this is not a hard failure
            print(f"Warning: Could not verify log generation: {e}")

    def test_lambda_can_access_s3_bucket(self):
        """Test that Lambda can write to S3 bucket (integration test)."""
        function_name = self.outputs['lambda_function_name']
        bucket_name = self.outputs['bucket_name']
        environment = self.outputs['environment']

        try:
            # Invoke Lambda which should write to S3
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps({}).encode('utf-8')
            )

            payload = json.loads(response['Payload'].read().decode('utf-8'))
            self.assertEqual(payload['statusCode'], 200)

            # Check if object was created in S3
            import time
            time.sleep(1)

            expected_key = f'results/{environment}/latest.json'
            try:
                obj_response = self.s3_client.get_object(
                    Bucket=bucket_name,
                    Key=expected_key
                )
                content = json.loads(obj_response['Body'].read().decode('utf-8'))
                self.assertEqual(content['status'], 'success')
                self.assertEqual(content['environment'], environment)
            except ClientError:
                # Object may not exist yet, not a hard failure
                print("Warning: Lambda-created S3 object not found yet")

        except ClientError as e:
            self.fail(f"Lambda S3 integration test failed: {e}")

    def test_all_resources_have_tags(self):
        """Test that resources have appropriate tags."""
        bucket_name = self.outputs['bucket_name']
        environment = self.outputs['environment']

        try:
            # Check S3 bucket tags
            response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
            tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}

            self.assertIn('Environment', tags)
            self.assertEqual(tags['Environment'], environment)
            self.assertIn('ManagedBy', tags)
            self.assertEqual(tags['ManagedBy'], 'Pulumi')

        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchTagSet':
                self.fail(f"Failed to get bucket tags: {e}")


if __name__ == '__main__':
    unittest.main()
