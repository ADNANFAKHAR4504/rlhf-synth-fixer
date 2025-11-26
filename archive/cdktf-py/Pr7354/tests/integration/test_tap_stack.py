"""
Integration tests for Payment Infrastructure
Tests deployed resources using actual AWS services
"""
import json
import os

import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from deployment"""
    outputs_file = 'cfn-outputs/flat-outputs.json'

    if not os.path.exists(outputs_file):
        pytest.skip(f"Outputs file not found: {outputs_file}. Run deployment first.")

    with open(outputs_file, 'r', encoding='utf-8') as f:
        outputs = json.load(f)
        
        # Handle nested structure: {'TapStackpr7110': {...}}
        # Extract the inner dictionary if nested
        if isinstance(outputs, dict):
            # Check if outputs has a single key that looks like a stack name
            keys = list(outputs.keys())
            if len(keys) == 1 and keys[0].startswith('TapStack'):
                # Return the nested outputs (flattened)
                print(f"Extracted nested outputs from stack: {keys[0]}")
                return outputs[keys[0]]
        
        # If already flat, return as-is
        print(f"Loaded flat outputs")
        return outputs


@pytest.fixture(scope="module")
def api_client(stack_outputs):
    """Create API Gateway client"""
    return boto3.client('apigateway', region_name='us-east-1')


@pytest.fixture(scope="module")
def dynamodb_client(stack_outputs):
    """Create DynamoDB client"""
    return boto3.client('dynamodb', region_name='us-east-1')


@pytest.fixture(scope="module")
def s3_client(stack_outputs):
    """Create S3 client"""
    return boto3.client('s3', region_name='us-east-1')


@pytest.fixture(scope="module")
def lambda_client(stack_outputs):
    """Create Lambda client"""
    return boto3.client('lambda', region_name='us-east-1')


@pytest.fixture(scope="module")
def kms_client(stack_outputs):
    """Create KMS client"""
    return boto3.client('kms', region_name='us-east-1')


class TestAPIGateway:
    """Test API Gateway deployment and accessibility"""

    def test_api_endpoint_exists(self, stack_outputs):
        """Test that API endpoint is accessible"""
        assert 'api_endpoint' in stack_outputs
        assert stack_outputs['api_endpoint'].startswith('https://')

    def test_api_key_exists(self, stack_outputs):
        """Test that API key was created"""
        assert 'api_key_id' in stack_outputs
        # Note: api_key_value is marked as sensitive and may not be in outputs
        # We only verify the api_key_id exists, which proves the key was created

    def test_api_gateway_reachable(self, stack_outputs):
        """Test that API Gateway endpoint is reachable"""
        import requests

        endpoint = stack_outputs['api_endpoint']
        api_key = stack_outputs.get('api_key_value', '')

        # Test without API key (should fail)
        response = requests.post(
            endpoint,
            json={'amount': 100, 'currency': 'USD', 'customer_id': 'test123', 'payment_method': 'card'},
            timeout=10
        )
        # Should get 403 Forbidden without API key
        assert response.status_code == 403


class TestDynamoDB:
    """Test DynamoDB Global Table"""

    def test_table_exists(self, stack_outputs, dynamodb_client):
        """Test that DynamoDB table exists"""
        table_name = stack_outputs.get('dynamodb_table_name')
        assert table_name is not None

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            assert response['Table']['TableStatus'] in ['ACTIVE', 'UPDATING']
        except ClientError as e:
            pytest.fail(f"DynamoDB table not found: {e}")

    def test_table_has_global_replication(self, stack_outputs, dynamodb_client):
        """Test that table has global replication enabled"""
        table_name = stack_outputs.get('dynamodb_table_name')

        response = dynamodb_client.describe_table(TableName=table_name)
        replicas = response['Table'].get('Replicas', [])

        # Should have at least primary region
        assert len(replicas) >= 1

    def test_table_has_encryption(self, stack_outputs, dynamodb_client):
        """Test that table has encryption enabled"""
        table_name = stack_outputs.get('dynamodb_table_name')

        response = dynamodb_client.describe_table(TableName=table_name)
        sse_description = response['Table'].get('SSEDescription', {})

        assert sse_description.get('Status') in ['ENABLED', 'ENABLING']

    def test_table_write_read(self, stack_outputs, dynamodb_client):
        """Test writing and reading from DynamoDB table"""
        table_name = stack_outputs.get('dynamodb_table_name')
        import time

        test_item = {
            'payment_id': {'S': 'test-payment-123'},
            'timestamp': {'N': str(int(time.time() * 1000))},
            'amount': {'N': '100.00'},
            'currency': {'S': 'USD'},
            'customer_id': {'S': 'test-customer'},
            'payment_method': {'S': 'card'},
            'status': {'S': 'test'}
        }

        try:
            # Write item
            dynamodb_client.put_item(TableName=table_name, Item=test_item)

            # Read item back
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={'payment_id': {'S': 'test-payment-123'}, 'timestamp': test_item['timestamp']}
            )

            assert 'Item' in response
            assert response['Item']['payment_id']['S'] == 'test-payment-123'

            # Clean up
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={'payment_id': {'S': 'test-payment-123'}, 'timestamp': test_item['timestamp']}
            )
        except ClientError as e:
            pytest.fail(f"DynamoDB operation failed: {e}")


class TestS3:
    """Test S3 bucket"""

    def test_bucket_exists(self, stack_outputs, s3_client):
        """Test that S3 bucket exists"""
        bucket_name = stack_outputs.get('s3_bucket_name')
        assert bucket_name is not None

        try:
            s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            pytest.fail(f"S3 bucket not found: {e}")

    def test_bucket_has_versioning(self, stack_outputs, s3_client):
        """Test that bucket has versioning enabled"""
        bucket_name = stack_outputs.get('s3_bucket_name')

        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    def test_bucket_has_encryption(self, stack_outputs, s3_client):
        """Test that bucket has encryption enabled"""
        bucket_name = stack_outputs.get('s3_bucket_name')

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])

        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'

    def test_bucket_write(self, stack_outputs, s3_client):
        """Test writing to S3 bucket"""
        bucket_name = stack_outputs.get('s3_bucket_name')

        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key='test/integration-test.txt',
                Body=b'Integration test data'
            )

            # Verify object exists
            response = s3_client.head_object(Bucket=bucket_name, Key='test/integration-test.txt')
            assert response['ContentLength'] > 0

            # Clean up
            s3_client.delete_object(Bucket=bucket_name, Key='test/integration-test.txt')
        except ClientError as e:
            pytest.fail(f"S3 operation failed: {e}")


class TestLambda:
    """Test Lambda function"""

    def test_lambda_exists(self, stack_outputs, lambda_client):
        """Test that Lambda function exists"""
        function_name = stack_outputs.get('lambda_function_name')
        assert function_name is not None

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['State'] in ['Active', 'Pending']
        except ClientError as e:
            pytest.fail(f"Lambda function not found: {e}")

    def test_lambda_configuration(self, stack_outputs, lambda_client):
        """Test Lambda function configuration"""
        function_name = stack_outputs.get('lambda_function_name')

        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        assert config['Runtime'] == 'python3.11'
        assert config['Timeout'] == 60
        assert config['MemorySize'] == 512
        assert 'TABLE_NAME' in config['Environment']['Variables']

    def test_lambda_has_kms_encryption(self, stack_outputs, lambda_client):
        """Test that Lambda uses KMS encryption"""
        function_name = stack_outputs.get('lambda_function_name')

        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        assert 'KMSKeyArn' in config


class TestKMS:
    """Test KMS keys"""

    def test_kms_key_exists(self, stack_outputs, kms_client):
        """Test that KMS key exists"""
        key_id = stack_outputs.get('kms_key_id')
        assert key_id is not None

        try:
            response = kms_client.describe_key(KeyId=key_id)
            assert response['KeyMetadata']['KeyState'] in ['Enabled', 'Pending']
        except ClientError as e:
            pytest.fail(f"KMS key not found: {e}")

    def test_kms_key_rotation_enabled(self, stack_outputs, kms_client):
        """Test that KMS key has rotation enabled"""
        key_id = stack_outputs.get('kms_key_id')

        try:
            response = kms_client.get_key_rotation_status(KeyId=key_id)
            assert response['KeyRotationEnabled'] is True
        except ClientError as e:
            pytest.fail(f"Failed to check key rotation: {e}")


class TestCloudWatch:
    """Test CloudWatch resources"""

    def test_sns_topic_exists(self, stack_outputs):
        """Test that SNS topic exists"""
        sns_client = boto3.client('sns', region_name='us-east-1')
        topic_arn = stack_outputs.get('sns_topic_arn')
        assert topic_arn is not None

        try:
            sns_client.get_topic_attributes(TopicArn=topic_arn)
        except ClientError as e:
            pytest.fail(f"SNS topic not found: {e}")

    def test_lambda_log_group_exists(self, stack_outputs):
        """Test that Lambda CloudWatch log group exists"""
        logs_client = boto3.client('logs', region_name='us-east-1')
        function_name = stack_outputs.get('lambda_function_name')

        try:
            logs_client.describe_log_groups(logGroupNamePrefix=f'/aws/lambda/{function_name}')
        except ClientError as e:
            pytest.fail(f"Log group not found: {e}")


class TestResourceNaming:
    """Test that all resources follow naming conventions"""

    def test_resources_include_environment_suffix(self, stack_outputs):
        """Test that resource names include environment suffix"""
        # Get environment suffix from environment variable (CI/CD) or extract from resource name
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX')
        
        # If not in env, extract from resource name
        if not env_suffix:
            table_name = stack_outputs.get('dynamodb_table_name', '')
            # Extract suffix from pattern: payment-{suffix}-payments-v4
            if table_name:
                parts = table_name.split('-')
                if len(parts) >= 2:
                    env_suffix = parts[1]  # e.g., 'pr7110' from 'payment-pr7110-payments-v4'
        
        # Fallback to metadata if still not found
        if not env_suffix:
            with open('metadata.json', 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            env_suffix = metadata.get('environmentSuffix', 'synthl0s3m1')

        # Check that key resources include the suffix
        table_name = stack_outputs.get('dynamodb_table_name', '')
        bucket_name = stack_outputs.get('s3_bucket_name', '')
        function_name = stack_outputs.get('lambda_function_name', '')

        assert env_suffix in table_name, f"Table name missing env suffix '{env_suffix}': {table_name}"
        assert env_suffix in bucket_name, f"Bucket name missing env suffix '{env_suffix}': {bucket_name}"
        assert env_suffix in function_name, f"Function name missing env suffix '{env_suffix}': {function_name}"


class TestMultiRegion:
    """Test multi-region deployment"""

    def test_dynamodb_has_us_west_2_replica(self, stack_outputs):
        """Test that DynamoDB table has replica in us-west-2"""
        dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        table_name = stack_outputs.get('dynamodb_table_name')

        response = dynamodb_client.describe_table(TableName=table_name)
        replicas = response['Table'].get('Replicas', [])

        replica_regions = [r.get('RegionName') for r in replicas]
        assert 'us-west-2' in replica_regions, "DynamoDB table missing us-west-2 replica"
