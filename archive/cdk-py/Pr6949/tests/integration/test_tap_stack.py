"""Integration tests for TapStack ETL Pipeline."""
import json
import os
import unittest

import boto3
from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed ETL pipeline resources."""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resources for all tests."""
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.sfn_client = boto3.client('stepfunctions', region_name='us-east-1')
        cls.events_client = boto3.client('events', region_name='us-east-1')
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')

    @mark.it("verifies raw S3 bucket exists and has correct configuration")
    def test_raw_bucket_configuration(self):
        """Test that raw S3 bucket is properly configured."""
        bucket_name = flat_outputs.get('RawBucketName')
        self.assertIsNotNone(bucket_name, "RawBucketName not found in outputs")

        # Verify bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

        # Verify lifecycle rules exist
        lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        self.assertGreater(len(lifecycle.get('Rules', [])), 0)

        # Verify EventBridge notification is enabled
        notification = self.s3_client.get_bucket_notification_configuration(Bucket=bucket_name)
        self.assertIn('EventBridgeConfiguration', notification)

    @mark.it("verifies processed S3 bucket exists and has correct configuration")
    def test_processed_bucket_configuration(self):
        """Test that processed S3 bucket is properly configured."""
        bucket_name = flat_outputs.get('ProcessedBucketName')
        self.assertIsNotNone(bucket_name, "ProcessedBucketName not found in outputs")

        # Verify bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

        # Verify lifecycle rules exist
        lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        self.assertGreater(len(lifecycle.get('Rules', [])), 0)

    @mark.it("verifies DynamoDB table exists with correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that DynamoDB table is properly configured."""
        table_name = flat_outputs.get('ProcessingTableName')
        self.assertIsNotNone(table_name, "ProcessingTableName not found in outputs")

        # Verify table exists and get configuration
        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Verify partition key
        key_schema = table['KeySchema']
        self.assertEqual(len(key_schema), 1)
        self.assertEqual(key_schema[0]['AttributeName'], 'file_id')
        self.assertEqual(key_schema[0]['KeyType'], 'HASH')

    @mark.it("verifies validation Lambda function exists and is configured correctly")
    def test_validation_lambda_configuration(self):
        """Test that validation Lambda function is properly configured."""
        function_name = flat_outputs.get('ValidationFunctionName')
        self.assertIsNotNone(function_name, "ValidationFunctionName not found in outputs")

        # Get function configuration
        response = self.lambda_client.get_function_configuration(FunctionName=function_name)

        self.assertEqual(response['Runtime'], 'python3.11')
        self.assertEqual(response['MemorySize'], 3072)
        self.assertEqual(response['Timeout'], 300)

        # Verify environment variables
        env_vars = response.get('Environment', {}).get('Variables', {})
        self.assertIn('TABLE_NAME', env_vars)
        self.assertIn('RAW_BUCKET', env_vars)

    @mark.it("verifies transformation Lambda function exists and is configured correctly")
    def test_transformation_lambda_configuration(self):
        """Test that transformation Lambda function is properly configured."""
        function_name = flat_outputs.get('TransformationFunctionName')
        self.assertIsNotNone(function_name, "TransformationFunctionName not found in outputs")

        # Get function configuration
        response = self.lambda_client.get_function_configuration(FunctionName=function_name)

        self.assertEqual(response['Runtime'], 'python3.11')
        self.assertEqual(response['MemorySize'], 3072)
        self.assertEqual(response['Timeout'], 300)

        # Verify environment variables
        env_vars = response.get('Environment', {}).get('Variables', {})
        self.assertIn('TABLE_NAME', env_vars)
        self.assertIn('RAW_BUCKET', env_vars)
        self.assertIn('PROCESSED_BUCKET', env_vars)

    @mark.it("verifies Step Functions state machine exists and is configured correctly")
    def test_state_machine_configuration(self):
        """Test that Step Functions state machine is properly configured."""
        state_machine_arn = flat_outputs.get('StateMachineArn')
        self.assertIsNotNone(state_machine_arn, "StateMachineArn not found in outputs")

        # Describe state machine
        response = self.sfn_client.describe_state_machine(stateMachineArn=state_machine_arn)

        self.assertEqual(response['status'], 'ACTIVE')
        self.assertIn('definition', response)

        # Verify definition contains Lambda tasks
        definition = json.loads(response['definition'])
        self.assertIn('States', definition)

    @mark.it("verifies EventBridge rule exists and targets state machine")
    def test_eventbridge_rule_configuration(self):
        """Test that EventBridge rule is properly configured."""
        rule_name = flat_outputs.get('EventRuleName')
        self.assertIsNotNone(rule_name, "EventRuleName not found in outputs")

        # Describe rule
        response = self.events_client.describe_rule(Name=rule_name)

        self.assertEqual(response['State'], 'ENABLED')
        self.assertIn('EventPattern', response)

        # Verify event pattern includes S3 source
        event_pattern = json.loads(response['EventPattern'])
        self.assertIn('source', event_pattern)
        self.assertIn('aws.s3', event_pattern['source'])

        # Verify rule targets the state machine
        targets_response = self.events_client.list_targets_by_rule(Rule=rule_name)
        self.assertGreater(len(targets_response['Targets']), 0)

        state_machine_arn = flat_outputs.get('StateMachineArn')
        target_arns = [target['Arn'] for target in targets_response['Targets']]
        self.assertIn(state_machine_arn, target_arns)

    @mark.it("verifies CloudWatch alarms exist for Lambda functions")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured for monitoring."""
        validation_alarm_name = flat_outputs.get('ValidationAlarmName')
        transformation_alarm_name = flat_outputs.get('TransformationAlarmName')
        
        if not validation_alarm_name or not transformation_alarm_name:
            self.skipTest("Alarm names not found in outputs")

        # Describe specific alarms by name
        try:
            validation_response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[validation_alarm_name]
            )
            self.assertGreater(
                len(validation_response.get('MetricAlarms', [])), 0,
                f"Validation alarm {validation_alarm_name} should exist"
            )
        except Exception as e:
            self.fail(f"Failed to find validation alarm {validation_alarm_name}: {e}")

        try:
            transformation_response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[transformation_alarm_name]
            )
            self.assertGreater(
                len(transformation_response.get('MetricAlarms', [])), 0,
                f"Transformation alarm {transformation_alarm_name} should exist"
            )
        except Exception as e:
            self.fail(f"Failed to find transformation alarm {transformation_alarm_name}: {e}")

    @mark.it("verifies Lambda functions have proper IAM permissions")
    def test_lambda_iam_permissions(self):
        """Test that Lambda functions have proper IAM permissions."""
        validation_function = flat_outputs.get('ValidationFunctionName')
        transformation_function = flat_outputs.get('TransformationFunctionName')

        for function_name in [validation_function, transformation_function]:
            if function_name:
                response = self.lambda_client.get_function_configuration(FunctionName=function_name)
                role_arn = response.get('Role')

                self.assertIsNotNone(role_arn)
                self.assertIn('iam', role_arn)
                self.assertIn('role', role_arn.lower())

    @mark.it("verifies resource naming includes environment suffix")
    def test_resource_naming_convention(self):
        """Test that all resources follow proper naming conventions with suffix."""
        # All resource names should contain environment identifiers
        raw_bucket = flat_outputs.get('RawBucketName', '')
        processed_bucket = flat_outputs.get('ProcessedBucketName', '')
        table_name = flat_outputs.get('ProcessingTableName', '')
        validation_func = flat_outputs.get('ValidationFunctionName', '')
        transformation_func = flat_outputs.get('TransformationFunctionName', '')

        # Verify all names are not empty and contain 'etl'
        for name in [raw_bucket, processed_bucket, table_name, validation_func, transformation_func]:
            self.assertTrue(len(name) > 0, f"Resource name should not be empty")
            self.assertIn('etl', name.lower(), f"Resource name {name} should contain 'etl'")

    @mark.it("verifies all outputs are present")
    def test_all_outputs_present(self):
        """Test that all required CloudFormation outputs are present."""
        required_outputs = [
            'RawBucketName',
            'ProcessedBucketName',
            'ProcessingTableName',
            'ValidationFunctionName',
            'TransformationFunctionName',
            'StateMachineArn',
            'EventRuleName'
        ]

        for output_key in required_outputs:
            self.assertIn(output_key, flat_outputs,
                          f"Output {output_key} not found in CloudFormation outputs")
            self.assertIsNotNone(flat_outputs.get(output_key),
                                 f"Output {output_key} is None")


if __name__ == '__main__':
    unittest.main()
