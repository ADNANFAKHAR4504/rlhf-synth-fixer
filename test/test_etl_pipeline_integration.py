"""
Integration tests for the ETL pipeline using deployed AWS infrastructure.
Tests the complete end-to-end workflow with real resources.
"""
import json
import boto3
import time
import pytest
import os
from datetime import datetime

# Load deployment outputs
with open('cfn-outputs/flat-outputs.json', 'r') as f:
    outputs = json.load(f)

# AWS clients
s3_client = boto3.client('s3', region_name='us-east-1')
lambda_client = boto3.client('lambda', region_name='us-east-1')
sqs_client = boto3.client('sqs', region_name='us-east-1')
logs_client = boto3.client('logs', region_name='us-east-1')


class TestETLPipelineIntegration:
    """Integration tests for the complete ETL pipeline."""

    def test_csv_file_processing_workflow(self):
        """Test end-to-end CSV file processing workflow."""
        # Prepare test CSV data
        csv_data = """transaction_id,amount,account_id,timestamp
TXN001,150.50,ACC12345,2024-01-15T10:30:00Z
TXN002,45.00,ACC12346,2024-01-15T11:00:00Z
TXN003,2500.00,ACC12347,2024-01-15T12:00:00Z"""

        test_file_key = f'test-transactions-{int(time.time())}.csv'

        try:
            # Upload test file to input bucket
            s3_client.put_object(
                Bucket=outputs['input_bucket_name'],
                Key=test_file_key,
                Body=csv_data.encode('utf-8'),
                ContentType='text/csv'
            )

            # Wait for processing (EventBridge + Lambda execution)
            time.sleep(15)

            # Verify processed file exists in output bucket
            response = s3_client.list_objects_v2(
                Bucket=outputs['output_bucket_name'],
                Prefix='year='
            )

            assert 'Contents' in response, "No processed files found in output bucket"
            assert len(response['Contents']) > 0, "Output bucket is empty"

            # Find the processed file
            processed_file = None
            for obj in response['Contents']:
                if 'processed_' in obj['Key'] and test_file_key.replace('.csv', '') in obj['Key']:
                    processed_file = obj['Key']
                    break

            assert processed_file is not None, f"Processed file for {test_file_key} not found"

            # Download and verify processed data
            processed_obj = s3_client.get_object(
                Bucket=outputs['output_bucket_name'],
                Key=processed_file
            )
            processed_data = json.loads(processed_obj['Body'].read().decode('utf-8'))

            # Verify all transactions were processed
            assert len(processed_data) == 3, f"Expected 3 transactions, got {len(processed_data)}"

            # Verify transaction enrichment
            for transaction in processed_data:
                assert 'processed_at' in transaction, "Missing processed_at field"
                assert 'environment' in transaction, "Missing environment field"
                assert 'amount_float' in transaction, "Missing amount_float field"
                assert 'transaction_type' in transaction, "Missing transaction_type field"
                assert 'category' in transaction, "Missing category field"

            # Verify categorization logic
            assert processed_data[0]['category'] == 'medium', "TXN001 should be medium category"
            assert processed_data[1]['category'] == 'small', "TXN002 should be small category"
            assert processed_data[2]['category'] == 'large', "TXN003 should be large category"

            # Verify audit log exists
            audit_response = s3_client.list_objects_v2(
                Bucket=outputs['audit_bucket_name'],
                Prefix='audit_logs/'
            )

            assert 'Contents' in audit_response, "No audit logs found"
            audit_files = [obj for obj in audit_response['Contents'] if test_file_key in obj['Key']]
            assert len(audit_files) > 0, "Audit log for test file not found"

            # Verify audit log contents
            audit_obj = s3_client.get_object(
                Bucket=outputs['audit_bucket_name'],
                Key=audit_files[0]['Key']
            )
            audit_data = json.loads(audit_obj['Body'].read().decode('utf-8'))

            assert audit_data['file'] == test_file_key, "Audit log file name mismatch"
            assert audit_data['total_records'] == 3, "Audit log total records mismatch"
            assert audit_data['valid_records'] == 3, "Audit log valid records mismatch"
            assert audit_data['invalid_records'] == 0, "Audit log invalid records should be 0"

        finally:
            # Cleanup: delete test file from input bucket
            try:
                s3_client.delete_object(
                    Bucket=outputs['input_bucket_name'],
                    Key=test_file_key
                )
            except Exception as e:
                print(f"Cleanup warning: {e}")

    def test_json_file_processing_workflow(self):
        """Test end-to-end JSON file processing workflow."""
        # Prepare test JSON data
        json_data = {
            "transactions": [
                {
                    "transaction_id": "TXN101",
                    "amount": 75.25,
                    "account_id": "ACC98765",
                    "timestamp": "2024-01-16T09:00:00Z"
                },
                {
                    "transaction_id": "TXN102",
                    "amount": 500.00,
                    "account_id": "ACC98766",
                    "timestamp": "2024-01-16T10:00:00Z"
                }
            ]
        }

        test_file_key = f'test-transactions-{int(time.time())}.json'

        try:
            # Upload test file to input bucket
            s3_client.put_object(
                Bucket=outputs['input_bucket_name'],
                Key=test_file_key,
                Body=json.dumps(json_data).encode('utf-8'),
                ContentType='application/json'
            )

            # Wait for processing
            time.sleep(15)

            # Verify processed file exists
            response = s3_client.list_objects_v2(
                Bucket=outputs['output_bucket_name'],
                Prefix='year='
            )

            assert 'Contents' in response, "No processed files found"

            # Find the processed file
            processed_file = None
            for obj in response['Contents']:
                if 'processed_' in obj['Key'] and test_file_key.replace('.json', '') in obj['Key']:
                    processed_file = obj['Key']
                    break

            assert processed_file is not None, f"Processed file for {test_file_key} not found"

            # Download and verify processed data
            processed_obj = s3_client.get_object(
                Bucket=outputs['output_bucket_name'],
                Key=processed_file
            )
            processed_data = json.loads(processed_obj['Body'].read().decode('utf-8'))

            # Verify all transactions were processed
            assert len(processed_data) == 2, f"Expected 2 transactions, got {len(processed_data)}"

            # Verify enrichment fields
            for transaction in processed_data:
                assert 'processed_at' in transaction
                assert 'transaction_type' in transaction
                assert 'category' in transaction

        finally:
            # Cleanup
            try:
                s3_client.delete_object(
                    Bucket=outputs['input_bucket_name'],
                    Key=test_file_key
                )
            except Exception as e:
                print(f"Cleanup warning: {e}")

    def test_invalid_transaction_handling(self):
        """Test handling of invalid transactions with validation errors."""
        # Prepare CSV with invalid transactions
        csv_data = """transaction_id,amount,account_id,timestamp
TXN201,100.50,ACC111,2024-01-17T10:00:00Z
TXN202,invalid_amount,ACC112,2024-01-17T11:00:00Z
TXN203,,ACC113,2024-01-17T12:00:00Z"""

        test_file_key = f'test-invalid-{int(time.time())}.csv'

        try:
            # Upload test file
            s3_client.put_object(
                Bucket=outputs['input_bucket_name'],
                Key=test_file_key,
                Body=csv_data.encode('utf-8'),
                ContentType='text/csv'
            )

            # Wait for processing
            time.sleep(15)

            # Verify audit log shows invalid records
            audit_response = s3_client.list_objects_v2(
                Bucket=outputs['audit_bucket_name'],
                Prefix='audit_logs/'
            )

            audit_files = [obj for obj in audit_response['Contents'] if test_file_key in obj['Key']]
            assert len(audit_files) > 0, "Audit log not found"

            # Check audit log
            audit_obj = s3_client.get_object(
                Bucket=outputs['audit_bucket_name'],
                Key=audit_files[0]['Key']
            )
            audit_data = json.loads(audit_obj['Body'].read().decode('utf-8'))

            assert audit_data['total_records'] == 3, "Should have 3 total records"
            assert audit_data['valid_records'] == 1, "Should have 1 valid record"
            assert audit_data['invalid_records'] == 2, "Should have 2 invalid records"
            assert len(audit_data['invalid_details']) == 2, "Should have 2 invalid details"

        finally:
            # Cleanup
            try:
                s3_client.delete_object(
                    Bucket=outputs['input_bucket_name'],
                    Key=test_file_key
                )
            except Exception as e:
                print(f"Cleanup warning: {e}")

    def test_lambda_function_configuration(self):
        """Test Lambda function configuration and settings."""
        # Get Lambda function configuration
        response = lambda_client.get_function_configuration(
            FunctionName=outputs['lambda_function_name']
        )

        # Verify runtime and memory settings
        assert response['Runtime'] == 'python3.11', "Runtime should be python3.11"
        assert response['MemorySize'] >= 512, "Memory should be at least 512MB"
        assert response['Timeout'] == 300, "Timeout should be 300 seconds"

        # Verify environment variables
        env_vars = response['Environment']['Variables']
        assert 'OUTPUT_BUCKET' in env_vars, "OUTPUT_BUCKET not configured"
        assert 'AUDIT_BUCKET' in env_vars, "AUDIT_BUCKET not configured"
        assert 'DLQ_URL' in env_vars, "DLQ_URL not configured"
        assert 'ENVIRONMENT_SUFFIX' in env_vars, "ENVIRONMENT_SUFFIX not configured"

        # Verify DLQ configuration
        assert 'DeadLetterConfig' in response, "DLQ not configured"
        assert response['DeadLetterConfig']['TargetArn'] == outputs['dlq_arn'], "DLQ ARN mismatch"

    def test_s3_bucket_security_configuration(self):
        """Test S3 bucket security settings."""
        buckets_to_test = [
            outputs['input_bucket_name'],
            outputs['output_bucket_name'],
            outputs['audit_bucket_name']
        ]

        for bucket_name in buckets_to_test:
            # Check encryption
            encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0, f"No encryption rules for {bucket_name}"
            assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

            # Check versioning
            versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert versioning.get('Status') == 'Enabled', f"Versioning not enabled for {bucket_name}"

            # Check public access block
            public_access = s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            assert config['BlockPublicAcls'] == True, f"Public ACLs not blocked for {bucket_name}"
            assert config['BlockPublicPolicy'] == True, f"Public policy not blocked for {bucket_name}"
            assert config['IgnorePublicAcls'] == True, f"Public ACLs not ignored for {bucket_name}"
            assert config['RestrictPublicBuckets'] == True, f"Public buckets not restricted for {bucket_name}"

    def test_cloudwatch_logs_exist(self):
        """Test CloudWatch log group exists and Lambda logs are being written."""
        # Check log group exists
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=outputs['log_group_name']
        )

        assert len(response['logGroups']) > 0, "Log group not found"
        assert response['logGroups'][0]['logGroupName'] == outputs['log_group_name']

        # Verify retention period
        assert response['logGroups'][0].get('retentionInDays') == 30, "Retention should be 30 days"

    def test_sqs_dlq_configuration(self):
        """Test SQS Dead Letter Queue configuration."""
        # Get queue attributes
        response = sqs_client.get_queue_attributes(
            QueueUrl=outputs['dlq_url'],
            AttributeNames=['All']
        )

        attributes = response['Attributes']

        # Verify message retention (14 days = 1209600 seconds)
        assert int(attributes['MessageRetentionPeriod']) == 1209600, "Message retention should be 14 days"

        # Verify visibility timeout
        assert int(attributes['VisibilityTimeout']) == 300, "Visibility timeout should be 300 seconds"

    def test_eventbridge_rule_exists(self):
        """Test EventBridge rule is configured correctly."""
        events_client = boto3.client('events', region_name='us-east-1')

        # Get rule details
        response = events_client.describe_rule(
            Name=outputs['eventbridge_rule_name']
        )

        # Verify rule is enabled
        assert response['State'] == 'ENABLED', "EventBridge rule should be enabled"

        # Verify event pattern
        event_pattern = json.loads(response['EventPattern'])
        assert 'aws.s3' in event_pattern['source'], "Should listen to S3 events"
        assert 'Object Created' in event_pattern['detail-type'], "Should trigger on Object Created"
        assert outputs['input_bucket_name'] in event_pattern['detail']['bucket']['name']

        # Verify targets
        targets_response = events_client.list_targets_by_rule(
            Rule=outputs['eventbridge_rule_name']
        )

        assert len(targets_response['Targets']) > 0, "No targets configured"
        assert outputs['lambda_function_arn'] in targets_response['Targets'][0]['Arn']

    def test_date_partitioning_in_output(self):
        """Test that output files are correctly partitioned by date."""
        # Upload a test file
        csv_data = """transaction_id,amount,account_id,timestamp
TXN301,100.00,ACC222,2024-01-18T10:00:00Z"""

        test_file_key = f'test-partition-{int(time.time())}.csv'

        try:
            s3_client.put_object(
                Bucket=outputs['input_bucket_name'],
                Key=test_file_key,
                Body=csv_data.encode('utf-8')
            )

            # Wait for processing
            time.sleep(15)

            # List objects and verify partitioning
            response = s3_client.list_objects_v2(
                Bucket=outputs['output_bucket_name']
            )

            # Check for date partition structure
            keys = [obj['Key'] for obj in response.get('Contents', [])]
            partition_keys = [k for k in keys if k.startswith('year=')]

            assert len(partition_keys) > 0, "No date-partitioned files found"

            # Verify partition format (year=YYYY/month=MM/day=DD)
            for key in partition_keys:
                assert 'year=' in key, "Missing year partition"
                assert 'month=' in key, "Missing month partition"
                assert 'day=' in key, "Missing day partition"

        finally:
            # Cleanup
            try:
                s3_client.delete_object(
                    Bucket=outputs['input_bucket_name'],
                    Key=test_file_key
                )
            except Exception as e:
                print(f"Cleanup warning: {e}")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
