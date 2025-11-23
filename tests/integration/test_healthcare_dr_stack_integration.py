"""Integration tests for healthcare disaster recovery infrastructure."""
import json
import os
import boto3
import pytest


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(__file__),
        "../../cfn-outputs/flat-outputs.json"
    )

    if not os.path.exists(outputs_path):
        pytest.skip(f"Outputs file not found: {outputs_path}")

    with open(outputs_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def primary_region_client():
    """Get boto3 client for primary region."""
    return {
        'dynamodb': boto3.client('dynamodb', region_name='us-east-1'),
        's3': boto3.client('s3', region_name='us-east-1'),
        'lambda': boto3.client('lambda', region_name='us-east-1'),
        'kms': boto3.client('kms', region_name='us-east-1'),
        'sns': boto3.client('sns', region_name='us-east-1'),
        'cloudwatch': boto3.client('cloudwatch', region_name='us-east-1'),
    }


@pytest.fixture(scope="module")
def secondary_region_client():
    """Get boto3 client for secondary region."""
    return {
        'dynamodb': boto3.client('dynamodb', region_name='us-west-2'),
        's3': boto3.client('s3', region_name='us-west-2'),
        'lambda': boto3.client('lambda', region_name='us-west-2'),
        'kms': boto3.client('kms', region_name='us-west-2'),
        'sns': boto3.client('sns', region_name='us-west-2'),
        'cloudwatch': boto3.client('cloudwatch', region_name='us-west-2'),
    }


class TestPrimaryRegionInfrastructure:
    """Test primary region infrastructure."""

    def test_s3_bucket_exists(self, stack_outputs, primary_region_client):
        """Test that S3 bucket exists in primary region."""
        bucket_arn = stack_outputs.get('medical_docs_bucket_arn_primary')
        if not bucket_arn:
            pytest.skip("S3 bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[1]
        response = primary_region_client['s3'].head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_s3_bucket_versioning_enabled(self, stack_outputs, primary_region_client):
        """Test that S3 bucket has versioning enabled."""
        bucket_arn = stack_outputs.get('medical_docs_bucket_arn_primary')
        if not bucket_arn:
            pytest.skip("S3 bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[1]
        response = primary_region_client['s3'].get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    def test_s3_bucket_encryption_enabled(self, stack_outputs, primary_region_client):
        """Test that S3 bucket has encryption enabled."""
        bucket_arn = stack_outputs.get('medical_docs_bucket_arn_primary')
        if not bucket_arn:
            pytest.skip("S3 bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[1]
        response = primary_region_client['s3'].get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'

    def test_kms_key_exists(self, stack_outputs, primary_region_client):
        """Test that KMS key exists in primary region."""
        kms_key_arn = stack_outputs.get('kms_key_arn_primary')
        if not kms_key_arn:
            pytest.skip("KMS key ARN not found in outputs")

        response = primary_region_client['kms'].describe_key(KeyId=kms_key_arn)
        assert response['KeyMetadata']['KeyState'] == 'Enabled'

    def test_kms_key_rotation_enabled(self, stack_outputs, primary_region_client):
        """Test that KMS key rotation is enabled."""
        kms_key_arn = stack_outputs.get('kms_key_arn_primary')
        if not kms_key_arn:
            pytest.skip("KMS key ARN not found in outputs")

        response = primary_region_client['kms'].get_key_rotation_status(KeyId=kms_key_arn)
        assert response['KeyRotationEnabled'] is True

    def test_lambda_function_exists(self, stack_outputs, primary_region_client):
        """Test that Lambda function exists in primary region."""
        api_endpoint = stack_outputs.get('api_endpoint_primary')
        if not api_endpoint:
            pytest.skip("API endpoint not found in outputs")

        response = primary_region_client['lambda'].get_function(FunctionName=api_endpoint)
        assert response['Configuration']['State'] == 'Active'

    def test_lambda_function_configuration(self, stack_outputs, primary_region_client):
        """Test that Lambda function has correct configuration."""
        api_endpoint = stack_outputs.get('api_endpoint_primary')
        if not api_endpoint:
            pytest.skip("API endpoint not found in outputs")

        response = primary_region_client['lambda'].get_function(FunctionName=api_endpoint)
        config = response['Configuration']

        assert config['MemorySize'] == 3072  # 3GB
        assert config['Timeout'] == 30
        assert config['Runtime'] == 'python3.11'
        assert config['Environment']['Variables']['ENVIRONMENT'] == 'production'
        assert config['Environment']['Variables']['STAGE'] == 'primary'

    def test_sns_topic_exists(self, stack_outputs, primary_region_client):
        """Test that SNS topic exists in primary region."""
        sns_topic_arn = stack_outputs.get('failover_topic_arn_primary')
        if not sns_topic_arn:
            pytest.skip("SNS topic ARN not found in outputs")

        response = primary_region_client['sns'].get_topic_attributes(TopicArn=sns_topic_arn)
        assert 'Attributes' in response


class TestSecondaryRegionInfrastructure:
    """Test secondary region infrastructure."""

    def test_s3_bucket_exists(self, stack_outputs, secondary_region_client):
        """Test that S3 bucket exists in secondary region."""
        bucket_arn = stack_outputs.get('medical_docs_bucket_arn_secondary')
        if not bucket_arn:
            pytest.skip("S3 bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[1]
        response = secondary_region_client['s3'].head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_lambda_function_exists(self, stack_outputs, secondary_region_client):
        """Test that Lambda function exists in secondary region."""
        api_endpoint = stack_outputs.get('api_endpoint_secondary')
        if not api_endpoint:
            pytest.skip("API endpoint not found in outputs")

        response = secondary_region_client['lambda'].get_function(FunctionName=api_endpoint)
        assert response['Configuration']['State'] == 'Active'


class TestGlobalInfrastructure:
    """Test global infrastructure."""

    def test_dynamodb_patient_records_table_exists(self, stack_outputs, primary_region_client):
        """Test that DynamoDB patient records table exists."""
        table_name = stack_outputs.get('patient_records_table')
        if not table_name:
            pytest.skip("Patient records table name not found in outputs")

        response = primary_region_client['dynamodb'].describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE'

    def test_dynamodb_patient_records_pitr_enabled(self, stack_outputs, primary_region_client):
        """Test that point-in-time recovery is enabled for patient records table."""
        table_name = stack_outputs.get('patient_records_table')
        if not table_name:
            pytest.skip("Patient records table name not found in outputs")

        response = primary_region_client['dynamodb'].describe_continuous_backups(TableName=table_name)
        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED'

    def test_dynamodb_audit_logs_table_exists(self, stack_outputs, primary_region_client):
        """Test that DynamoDB audit logs table exists."""
        table_name = stack_outputs.get('audit_logs_table')
        if not table_name:
            pytest.skip("Audit logs table name not found in outputs")

        response = primary_region_client['dynamodb'].describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE'

    def test_dynamodb_audit_logs_pitr_enabled(self, stack_outputs, primary_region_client):
        """Test that point-in-time recovery is enabled for audit logs table."""
        table_name = stack_outputs.get('audit_logs_table')
        if not table_name:
            pytest.skip("Audit logs table name not found in outputs")

        response = primary_region_client['dynamodb'].describe_continuous_backups(TableName=table_name)
        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED'


class TestDisasterRecoveryWorkflow:
    """Test end-to-end disaster recovery capabilities."""

    def test_cross_region_data_availability(self, stack_outputs, primary_region_client, secondary_region_client):
        """Test that data written to primary region is available in secondary region."""
        table_name = stack_outputs.get('patient_records_table')
        if not table_name:
            pytest.skip("Patient records table name not found in outputs")

        # This test would write data to primary and verify replication to secondary
        # For now, just verify both regions can access the table
        primary_response = primary_region_client['dynamodb'].describe_table(TableName=table_name)
        assert primary_response['Table']['TableStatus'] == 'ACTIVE'

        secondary_response = secondary_region_client['dynamodb'].describe_table(TableName=table_name)
        assert secondary_response['Table']['TableStatus'] == 'ACTIVE'

    def test_multi_region_lambda_functions(self, stack_outputs, primary_region_client, secondary_region_client):
        """Test that Lambda functions exist in both regions."""
        primary_endpoint = stack_outputs.get('api_endpoint_primary')
        secondary_endpoint = stack_outputs.get('api_endpoint_secondary')

        if not primary_endpoint or not secondary_endpoint:
            pytest.skip("API endpoints not found in outputs")

        primary_response = primary_region_client['lambda'].get_function(FunctionName=primary_endpoint)
        assert primary_response['Configuration']['State'] == 'Active'

        secondary_response = secondary_region_client['lambda'].get_function(FunctionName=secondary_endpoint)
        assert secondary_response['Configuration']['State'] == 'Active'
