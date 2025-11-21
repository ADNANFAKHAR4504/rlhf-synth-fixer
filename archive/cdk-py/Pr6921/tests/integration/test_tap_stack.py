"""Integration tests for TapStack CDK stack - tests against deployed resources."""
import json
import os
import unittest
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack."""

    @classmethod
    def setUpClass(cls) -> None:
        """Load deployment outputs once for all tests."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        flat_outputs_path = os.path.join(
            base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        if os.path.exists(flat_outputs_path):
            with open(flat_outputs_path, 'r', encoding='utf-8') as f:
                cls.outputs: Dict[str, Any] = json.load(f)
        else:
            cls.outputs = {}

        # Initialize AWS clients
        cls.kinesis = boto3.client('kinesis')
        cls.dynamodb = boto3.client('dynamodb')
        cls.s3 = boto3.client('s3')
        cls.lambda_client = boto3.client('lambda')
        cls.ssm = boto3.client('ssm')
        cls.cloudwatch = boto3.client('cloudwatch')

    def test_outputs_file_exists(self) -> None:
        """Test that flat-outputs.json file exists and is not empty."""
        self.assertIsNotNone(self.outputs, "Outputs file should exist")
        self.assertGreater(
            len(self.outputs),
            0,
            "Outputs should contain deployment information"
        )

    def test_kinesis_stream_exists(self) -> None:
        """Test that Kinesis stream exists and is active."""
        stream_name = None
        for key, value in self.outputs.items():
            if 'stream' in key.lower() and 'name' in key.lower():
                stream_name = value
                break

        if not stream_name:
            # Try to find stream by pattern
            for key, value in self.outputs.items():
                if 'fraud-transactions' in str(value):
                    stream_name = value
                    break

        self.assertIsNotNone(stream_name, "Stream name should be in outputs")

        try:
            response = self.kinesis.describe_stream(StreamName=stream_name)
            self.assertEqual(
                response['StreamDescription']['StreamStatus'],
                'ACTIVE',
                "Kinesis stream should be active"
            )
        except ClientError as e:
            self.fail(f"Failed to describe Kinesis stream: {e}")

    def test_dynamodb_table_exists(self) -> None:
        """Test that DynamoDB table exists and is active."""
        table_name = None
        for key, value in self.outputs.items():
            if 'table' in key.lower() and 'name' in key.lower():
                table_name = value
                break

        if not table_name:
            # Try to find table by pattern
            for key, value in self.outputs.items():
                if 'fraud-results' in str(value):
                    table_name = value
                    break

        self.assertIsNotNone(table_name, "Table name should be in outputs")

        try:
            response = self.dynamodb.describe_table(TableName=table_name)
            self.assertEqual(
                response['Table']['TableStatus'],
                'ACTIVE',
                "DynamoDB table should be active"
            )
        except ClientError as e:
            self.fail(f"Failed to describe DynamoDB table: {e}")

    def test_s3_bucket_exists(self) -> None:
        """Test that S3 bucket exists and is accessible."""
        bucket_name = None
        for key, value in self.outputs.items():
            if 'bucket' in key.lower() and 'name' in key.lower():
                bucket_name = value
                break

        if not bucket_name:
            # Try to find bucket by pattern
            for key, value in self.outputs.items():
                if 'company-fraud-data' in str(value):
                    bucket_name = value
                    break

        self.assertIsNotNone(bucket_name, "Bucket name should be in outputs")

        try:
            self.s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"Failed to access S3 bucket: {e}")

    def test_lambda_function_exists(self) -> None:
        """Test that Lambda function exists and is ready."""
        function_name = None
        for key, value in self.outputs.items():
            if 'function' in key.lower() and 'name' in key.lower():
                function_name = value
                break

        if not function_name:
            # Try to find function by pattern
            for key, value in self.outputs.items():
                if 'fraud-processor' in str(value):
                    function_name = value
                    break

        self.assertIsNotNone(function_name, "Function name should be in outputs")

        try:
            response = self.lambda_client.get_function(
                FunctionName=function_name
            )
            self.assertIn(
                'Configuration',
                response,
                "Lambda function should have configuration"
            )
            self.assertEqual(
                response['Configuration']['State'],
                'Active',
                "Lambda function should be active"
            )
        except ClientError as e:
            self.fail(f"Failed to get Lambda function: {e}")

    def test_ssm_parameters_exist(self) -> None:
        """Test that SSM parameters exist."""
        # Determine environment from outputs
        env_name = "dev"
        for key, value in self.outputs.items():
            if isinstance(value, str):
                if '-staging-' in value:
                    env_name = "staging"
                    break
                if '-prod-' in value:
                    env_name = "prod"
                    break

        # Determine environment suffix from outputs
        env_suffix = None
        for key, value in self.outputs.items():
            if isinstance(value, str) and '-' in value:
                # Extract suffix from resource names like fraud-transactions-dev-pr6921
                parts = value.split('-')
                if len(parts) >= 3:
                    env_suffix = parts[-1]
                    break
        
        if not env_suffix:
            env_suffix = "default"
        
        api_key_param = f"/fraud-detection/{env_name}-{env_suffix}/api-key"
        conn_string_param = f"/fraud-detection/{env_name}-{env_suffix}/connection-string"

        try:
            response = self.ssm.get_parameter(Name=api_key_param)
            self.assertIn('Parameter', response, "API key parameter should exist")
        except ClientError as e:
            self.fail(f"Failed to get SSM parameter {api_key_param}: {e}")

        try:
            response = self.ssm.get_parameter(Name=conn_string_param)
            self.assertIn(
                'Parameter',
                response,
                "Connection string parameter should exist"
            )
        except ClientError as e:
            self.fail(f"Failed to get SSM parameter {conn_string_param}: {e}")

    def test_cloudwatch_alarms_exist(self) -> None:
        """Test that CloudWatch alarms exist."""
        # Find alarm name from outputs or construct it
        alarm_prefix = None
        for key, value in self.outputs.items():
            if isinstance(value, str) and 'fraud-processor' in value:
                # Extract environment suffix for alarm name
                parts = value.split('-')
                if len(parts) >= 2:
                    alarm_prefix = f"fraud-processor-errors-{parts[-2]}-{parts[-1]}"
                    break

        if alarm_prefix:
            try:
                response = self.cloudwatch.describe_alarms(
                    AlarmNamePrefix=alarm_prefix
                )
                # Should have at least one alarm
                self.assertGreater(
                    len(response.get('MetricAlarms', [])),
                    0,
                    "Should have at least one CloudWatch alarm"
                )
            except ClientError as e:
                self.fail(f"Failed to describe CloudWatch alarms: {e}")

    def test_kinesis_stream_can_put_record(self) -> None:
        """Test that we can put a record to the Kinesis stream."""
        stream_name = None
        for key, value in self.outputs.items():
            if 'stream' in key.lower() and 'name' in key.lower():
                stream_name = value
                break

        if not stream_name:
            for key, value in self.outputs.items():
                if 'fraud-transactions' in str(value):
                    stream_name = value
                    break

        if not stream_name:
            self.skipTest("Stream name not found in outputs")

        test_data = {
            "transaction_id": "test-integration-12345",
            "amount": 100,
            "hour": 12,
            "location_mismatch": False,
            "velocity_flag": False
        }

        try:
            response = self.kinesis.put_record(
                StreamName=stream_name,
                Data=json.dumps(test_data),
                PartitionKey='test-partition'
            )
            self.assertIn('SequenceNumber', response, "Should get sequence number")
        except ClientError as e:
            self.fail(f"Failed to put record to Kinesis: {e}")

    def test_s3_bucket_has_correct_configuration(self) -> None:
        """Test that S3 bucket has correct configuration."""
        bucket_name = None
        for key, value in self.outputs.items():
            if 'bucket' in key.lower() and 'name' in key.lower():
                bucket_name = value
                break

        if not bucket_name:
            for key, value in self.outputs.items():
                if 'company-fraud-data' in str(value):
                    bucket_name = value
                    break

        if not bucket_name:
            self.skipTest("Bucket name not found in outputs")

        try:
            # Check encryption
            encryption = self.s3.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn(
                'ServerSideEncryptionConfiguration',
                encryption,
                "Bucket should have encryption"
            )

            # Check public access block
            public_access = self.s3.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(
                config['BlockPublicAcls'],
                "Should block public ACLs"
            )
            self.assertTrue(
                config['BlockPublicPolicy'],
                "Should block public policy"
            )
        except ClientError as e:
            self.fail(f"Failed to check S3 bucket configuration: {e}")

    def test_dynamodb_table_has_gsi(self) -> None:
        """Test that DynamoDB table has GSI configured."""
        table_name = None
        for key, value in self.outputs.items():
            if 'table' in key.lower() and 'name' in key.lower():
                table_name = value
                break

        if not table_name:
            for key, value in self.outputs.items():
                if 'fraud-results' in str(value):
                    table_name = value
                    break

        if not table_name:
            self.skipTest("Table name not found in outputs")

        try:
            response = self.dynamodb.describe_table(TableName=table_name)
            gsis = response['Table'].get('GlobalSecondaryIndexes', [])
            self.assertGreater(
                len(gsis),
                0,
                "Table should have at least one GSI"
            )
            # Check for fraud-score-index
            gsi_names = [gsi['IndexName'] for gsi in gsis]
            self.assertIn(
                'fraud-score-index',
                gsi_names,
                "Should have fraud-score-index GSI"
            )
        except ClientError as e:
            self.fail(f"Failed to check DynamoDB GSI: {e}")


if __name__ == '__main__':
    unittest.main()
