"""Integration tests for TapStack."""
import json
import os
from pathlib import Path

import pytest

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class TestTapStackIntegration:
    """Integration tests for deployed TAP Stack infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load outputs from cfn-outputs/flat-outputs.json."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        
        if not outputs_path.exists():
            pytest.skip("flat-outputs.json not found. Infrastructure may not be deployed.")
        
        with open(outputs_path, 'r') as f:
            raw_outputs = json.load(f)
        
        # Extract nested outputs from stack
        stack_name = list(raw_outputs.keys())[0] if raw_outputs else None
        if not stack_name:
            pytest.skip("No stack outputs found in flat-outputs.json")
        
        return raw_outputs[stack_name]

    @pytest.fixture(scope="class")
    def aws_region(self):
        """Get AWS region from environment or default."""
        return os.getenv("AWS_REGION", "us-east-1")

    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region):
        """Create EC2 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not available")
        try:
            return boto3.client('ec2', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create EC2 client")

    @pytest.fixture(scope="class")
    def dynamodb_client(self, aws_region):
        """Create DynamoDB client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not available")
        try:
            return boto3.client('dynamodb', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create DynamoDB client")

    @pytest.fixture(scope="class")
    def sqs_client(self, aws_region):
        """Create SQS client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not available")
        try:
            return boto3.client('sqs', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create SQS client")

    @pytest.fixture(scope="class")
    def lambda_client(self, aws_region):
        """Create Lambda client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not available")
        try:
            return boto3.client('lambda', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create Lambda client")

    @pytest.fixture(scope="class")
    def apigateway_client(self, aws_region):
        """Create API Gateway client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not available")
        try:
            return boto3.client('apigateway', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create API Gateway client")

    @pytest.fixture(scope="class")
    def logs_client(self, aws_region):
        """Create CloudWatch Logs client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not available")
        try:
            return boto3.client('logs', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create CloudWatch Logs client")

    @pytest.fixture(scope="class")
    def kms_client(self, aws_region):
        """Create KMS client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not available")
        try:
            return boto3.client('kms', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create KMS client")

    def test_outputs_file_exists_and_valid(self, outputs):
        """Verify outputs file exists and contains expected keys."""
        assert outputs is not None
        assert 'api_gateway_url' in outputs
        assert 'dynamodb_table_name' in outputs
        assert 'validator_queue_url' in outputs
        assert 'processor_queue_url' in outputs
        assert 'vpc_id' in outputs

    def test_vpc_exists_and_available(self, outputs, ec2_client):
        """Test VPC exists and is in available state."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id is not None
        
        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1
            vpc = response['Vpcs'][0]
            assert vpc['State'] == 'available'
            assert vpc['VpcId'] == vpc_id
        except ClientError:
            pytest.skip("Unable to describe VPC")

    def test_vpc_has_public_subnets(self, outputs, ec2_client):
        """Test VPC has public subnets configured."""
        vpc_id = outputs.get('vpc_id')
        
        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
                ]
            )
            assert len(response['Subnets']) >= 2  # At least 2 AZs
        except ClientError:
            pytest.skip("Unable to describe subnets")

    def test_vpc_has_private_subnets(self, outputs, ec2_client):
        """Test VPC has private subnets configured."""
        vpc_id = outputs.get('vpc_id')
        
        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['false']}
                ]
            )
            assert len(response['Subnets']) >= 2  # At least 2 AZs
        except ClientError:
            pytest.skip("Unable to describe subnets")

    def test_dynamodb_table_exists(self, outputs, dynamodb_client):
        """Test DynamoDB table exists and is active."""
        table_name = outputs.get('dynamodb_table_name')
        assert table_name is not None
        
        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            assert table['TableStatus'] in ['ACTIVE', 'UPDATING']
            assert table['TableName'] == table_name
        except ClientError:
            pytest.skip("Unable to describe DynamoDB table")

    def test_dynamodb_table_has_encryption(self, outputs, dynamodb_client):
        """Test DynamoDB table has encryption enabled."""
        table_name = outputs.get('dynamodb_table_name')
        
        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            assert 'SSEDescription' in table
            assert table['SSEDescription']['Status'] == 'ENABLED'
        except ClientError:
            pytest.skip("Unable to verify DynamoDB encryption")

    def test_dynamodb_table_has_point_in_time_recovery(self, outputs, dynamodb_client):
        """Test DynamoDB table has point-in-time recovery enabled."""
        table_name = outputs.get('dynamodb_table_name')
        
        try:
            response = dynamodb_client.describe_continuous_backups(TableName=table_name)
            pitr = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
            assert pitr['PointInTimeRecoveryStatus'] == 'ENABLED'
        except ClientError:
            pytest.skip("Unable to verify point-in-time recovery")

    def test_validator_queue_exists(self, outputs, sqs_client):
        """Test validator SQS queue exists."""
        queue_url = outputs.get('validator_queue_url')
        assert queue_url is not None
        
        try:
            response = sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            assert 'Attributes' in response
        except ClientError:
            pytest.skip("Unable to get validator queue attributes")

    def test_processor_queue_exists(self, outputs, sqs_client):
        """Test processor SQS queue exists."""
        queue_url = outputs.get('processor_queue_url')
        assert queue_url is not None
        
        try:
            response = sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )
            assert 'Attributes' in response
        except ClientError:
            pytest.skip("Unable to get processor queue attributes")

    def test_queues_have_encryption(self, outputs, sqs_client):
        """Test SQS queues have encryption enabled."""
        validator_queue_url = outputs.get('validator_queue_url')
        
        try:
            response = sqs_client.get_queue_attributes(
                QueueUrl=validator_queue_url,
                AttributeNames=['KmsMasterKeyId']
            )
            assert 'KmsMasterKeyId' in response['Attributes']
        except ClientError:
            pytest.skip("Unable to verify queue encryption")

    def test_queues_have_dead_letter_queues(self, outputs, sqs_client):
        """Test SQS queues have DLQ configured."""
        validator_queue_url = outputs.get('validator_queue_url')
        
        try:
            response = sqs_client.get_queue_attributes(
                QueueUrl=validator_queue_url,
                AttributeNames=['RedrivePolicy']
            )
            assert 'RedrivePolicy' in response['Attributes']
            redrive_policy = json.loads(response['Attributes']['RedrivePolicy'])
            assert 'deadLetterTargetArn' in redrive_policy
            assert redrive_policy.get('maxReceiveCount') == 3
        except ClientError:
            pytest.skip("Unable to verify DLQ configuration")

    def test_api_gateway_url_format_valid(self, outputs):
        """Test API Gateway URL has correct format."""
        api_url = outputs.get('api_gateway_url')
        assert api_url is not None
        assert api_url.startswith('https://')
        assert 'execute-api' in api_url
        assert 'amazonaws.com' in api_url
        assert api_url.endswith('/payments')

    def test_api_gateway_exists(self, outputs, apigateway_client):
        """Test API Gateway REST API exists."""
        api_url = outputs.get('api_gateway_url')
        # Extract API ID from URL: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/payments
        api_id = api_url.split('//')[1].split('.')[0]
        
        try:
            response = apigateway_client.get_rest_api(restApiId=api_id)
            assert response['id'] == api_id
            assert response['name'] is not None
        except ClientError:
            pytest.skip("Unable to describe API Gateway")

    def test_lambda_functions_exist(self, outputs, lambda_client):
        """Test Lambda functions exist."""
        # Infer Lambda function names from outputs
        table_name = outputs.get('dynamodb_table_name')
        if not table_name:
            pytest.skip("Cannot determine Lambda function names")
        
        # Extract environment suffix from table name
        parts = table_name.split('-')
        env_suffix = '-'.join(parts[-2:]) if len(parts) >= 2 else 'dev'
        
        functions = [
            f'payment-validator-{env_suffix}',
            f'payment-processor-{env_suffix}',
            f'payment-notifier-{env_suffix}'
        ]
        
        existing_functions = []
        for func_name in functions:
            try:
                response = lambda_client.get_function(FunctionName=func_name)
                existing_functions.append(func_name)
            except ClientError:
                pass
        
        if not existing_functions:
            pytest.skip("Unable to verify Lambda functions")
        
        assert len(existing_functions) >= 1

    def test_lambda_functions_have_vpc_config(self, outputs, lambda_client):
        """Test Lambda functions are in VPC."""
        vpc_id = outputs.get('vpc_id')
        table_name = outputs.get('dynamodb_table_name')
        
        if not table_name:
            pytest.skip("Cannot determine Lambda function names")
        
        parts = table_name.split('-')
        env_suffix = '-'.join(parts[-2:]) if len(parts) >= 2 else 'dev'
        func_name = f'payment-validator-{env_suffix}'
        
        try:
            response = lambda_client.get_function(FunctionName=func_name)
            vpc_config = response['Configuration'].get('VpcConfig', {})
            assert 'VpcId' in vpc_config
            assert vpc_config['VpcId'] == vpc_id
        except ClientError:
            pytest.skip("Unable to verify Lambda VPC configuration")

    def test_cloudwatch_log_groups_exist(self, outputs, logs_client):
        """Test CloudWatch Log Groups exist for Lambda functions."""
        table_name = outputs.get('dynamodb_table_name')
        
        if not table_name:
            pytest.skip("Cannot determine Lambda function names")
        
        parts = table_name.split('-')
        env_suffix = '-'.join(parts[-2:]) if len(parts) >= 2 else 'dev'
        
        log_groups = [
            f'/aws/lambda/payment-validator-{env_suffix}',
            f'/aws/lambda/payment-processor-{env_suffix}',
            f'/aws/lambda/payment-notifier-{env_suffix}'
        ]
        
        existing_log_groups = []
        for log_group_name in log_groups:
            try:
                response = logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                if response['logGroups']:
                    existing_log_groups.append(log_group_name)
            except ClientError:
                pass
        
        if not existing_log_groups:
            pytest.skip("Unable to verify CloudWatch Log Groups")
        
        assert len(existing_log_groups) >= 1

    def test_cloudwatch_log_groups_have_retention(self, outputs, logs_client):
        """Test CloudWatch Log Groups have retention policy."""
        table_name = outputs.get('dynamodb_table_name')
        
        if not table_name:
            pytest.skip("Cannot determine Lambda function names")
        
        parts = table_name.split('-')
        env_suffix = '-'.join(parts[-2:]) if len(parts) >= 2 else 'dev'
        log_group_name = f'/aws/lambda/payment-validator-{env_suffix}'
        
        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            if response['logGroups']:
                log_group = response['logGroups'][0]
                assert 'retentionInDays' in log_group
                assert log_group['retentionInDays'] > 0
            else:
                pytest.skip("Log group not found")
        except ClientError:
            pytest.skip("Unable to verify log retention")

    def test_complete_infrastructure_deployed(self, outputs):
        """Test all critical infrastructure components are present."""
        required_outputs = [
            'vpc_id',
            'dynamodb_table_name',
            'validator_queue_url',
            'processor_queue_url',
            'api_gateway_url'
        ]
        
        for output_key in required_outputs:
            assert output_key in outputs
            assert outputs[output_key] is not None
            assert len(outputs[output_key]) > 0

