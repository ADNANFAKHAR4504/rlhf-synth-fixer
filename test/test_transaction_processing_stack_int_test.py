"""
Integration tests for the CloudFormation transaction processing stack.
Tests the actual deployed infrastructure in AWS, validating end-to-end functionality.
Uses real AWS resources and stack outputs - no mocking.
"""

import os
import json
import boto3
import pytest
import time
from pathlib import Path
from datetime import datetime

# Load stack outputs
OUTPUTS_FILE = Path(__file__).parent.parent / "cfn-outputs" / "flat-outputs.json"


class TestStackDeployment:
    """Test that the stack is deployed and all resources exist."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load stack outputs from flat-outputs.json."""
        with open(OUTPUTS_FILE, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 client."""
        return boto3.client('ec2', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def dynamodb_client(self):
        """Create DynamoDB client."""
        return boto3.client('dynamodb', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def s3_client(self):
        """Create S3 client."""
        return boto3.client('s3', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def lambda_client(self):
        """Create Lambda client."""
        return boto3.client('lambda', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def kms_client(self):
        """Create KMS client."""
        return boto3.client('kms', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def logs_client(self):
        """Create CloudWatch Logs client."""
        return boto3.client('logs', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def iam_client(self):
        """Create IAM client."""
        return boto3.client('iam', region_name='us-east-1')

    def test_outputs_file_exists(self):
        """Test that stack outputs file exists."""
        assert OUTPUTS_FILE.exists(), "flat-outputs.json not found"

    def test_outputs_not_empty(self, outputs):
        """Test that outputs contain data."""
        assert len(outputs) > 0, "Stack outputs are empty"

    def test_vpc_exists(self, outputs, ec2_client):
        """Test that VPC exists and is available."""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'

    def test_private_subnets_exist(self, outputs, ec2_client):
        """Test that all 3 private subnets exist."""
        subnet_ids = [
            outputs['PrivateSubnet1Id'],
            outputs['PrivateSubnet2Id'],
            outputs['PrivateSubnet3Id']
        ]
        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response['Subnets']) == 3

        # Verify all subnets are in different AZs
        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        assert len(azs) == 3, "Subnets should be in 3 different AZs"

    def test_dynamodb_table_exists(self, outputs, dynamodb_client):
        """Test that DynamoDB table exists and is active."""
        table_name = outputs['TransactionTableName']
        response = dynamodb_client.describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE'

    def test_s3_bucket_exists(self, outputs, s3_client):
        """Test that S3 bucket exists."""
        bucket_name = outputs['AuditLogsBucketName']
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_lambda_function_exists(self, outputs, lambda_client):
        """Test that Lambda function exists and is active."""
        function_name = outputs['LambdaFunctionName']
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['State'] == 'Active'

    def test_kms_keys_exist(self, outputs, kms_client):
        """Test that both KMS keys exist and are enabled."""
        s3_key_id = outputs['S3KMSKeyId']
        cw_key_id = outputs['CloudWatchLogsKMSKeyId']

        s3_key = kms_client.describe_key(KeyId=s3_key_id)
        assert s3_key['KeyMetadata']['Enabled'] is True

        cw_key = kms_client.describe_key(KeyId=cw_key_id)
        assert cw_key['KeyMetadata']['Enabled'] is True

    def test_cloudwatch_log_group_exists(self, outputs, logs_client):
        """Test that CloudWatch log group exists."""
        log_group_name = outputs['LambdaLogGroupName']
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        assert len(response['logGroups']) == 1
        assert response['logGroups'][0]['logGroupName'] == log_group_name


class TestVPCConfiguration:
    """Test VPC network configuration."""

    @pytest.fixture(scope="class")
    def outputs(self):
        with open(OUTPUTS_FILE, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def ec2_client(self):
        return boto3.client('ec2', region_name='us-east-1')

    def test_vpc_cidr_block(self, outputs, ec2_client):
        """Test VPC has correct CIDR block."""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert response['Vpcs'][0]['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_dns_enabled(self, outputs, ec2_client):
        """Test VPC has DNS enabled."""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert response['Vpcs'][0]['EnableDnsSupport'] is True
        assert response['Vpcs'][0]['EnableDnsHostnames'] is True

    def test_subnets_no_public_ip(self, outputs, ec2_client):
        """Test subnets don't auto-assign public IPs."""
        subnet_ids = [
            outputs['PrivateSubnet1Id'],
            outputs['PrivateSubnet2Id'],
            outputs['PrivateSubnet3Id']
        ]
        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)

        for subnet in response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is False

    def test_vpc_endpoints_exist(self, outputs, ec2_client):
        """Test VPC endpoints exist."""
        vpc_id = outputs['VPCId']
        endpoint_ids = [
            outputs['S3VPCEndpointId'],
            outputs['DynamoDBVPCEndpointId'],
            outputs['LambdaVPCEndpointId']
        ]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=endpoint_ids)
        assert len(response['VpcEndpoints']) == 3

        # Verify all endpoints are available
        for endpoint in response['VpcEndpoints']:
            assert endpoint['State'] == 'available'

    def test_security_groups_exist(self, outputs, ec2_client):
        """Test security groups exist."""
        sg_id = outputs['LambdaSecurityGroupId']
        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        assert len(response['SecurityGroups']) == 1


class TestEncryption:
    """Test encryption configurations."""

    @pytest.fixture(scope="class")
    def outputs(self):
        with open(OUTPUTS_FILE, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def s3_client(self):
        return boto3.client('s3', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def dynamodb_client(self):
        return boto3.client('dynamodb', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def kms_client(self):
        return boto3.client('kms', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def logs_client(self):
        return boto3.client('logs', region_name='us-east-1')

    def test_s3_encryption_configured(self, outputs, s3_client):
        """Test S3 bucket has encryption configured."""
        bucket_name = outputs['AuditLogsBucketName']
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)

        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'

    def test_s3_versioning_enabled(self, outputs, s3_client):
        """Test S3 bucket has versioning enabled."""
        bucket_name = outputs['AuditLogsBucketName']
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response['Status'] == 'Enabled'

    def test_s3_public_access_blocked(self, outputs, s3_client):
        """Test S3 bucket has public access blocked."""
        bucket_name = outputs['AuditLogsBucketName']
        response = s3_client.get_public_access_block(Bucket=bucket_name)

        config = response['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_dynamodb_encryption_enabled(self, outputs, dynamodb_client):
        """Test DynamoDB table has encryption enabled."""
        table_name = outputs['TransactionTableName']
        response = dynamodb_client.describe_table(TableName=table_name)

        sse_desc = response['Table']['SSEDescription']
        assert sse_desc['Status'] == 'ENABLED'
        assert sse_desc['SSEType'] == 'KMS'

    def test_dynamodb_pitr_enabled(self, outputs, dynamodb_client):
        """Test DynamoDB table has point-in-time recovery enabled."""
        table_name = outputs['TransactionTableName']
        response = dynamodb_client.describe_continuous_backups(TableName=table_name)

        pitr = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
        assert pitr['PointInTimeRecoveryStatus'] == 'ENABLED'

    def test_kms_key_rotation_enabled(self, outputs, kms_client):
        """Test KMS keys have rotation enabled."""
        s3_key_id = outputs['S3KMSKeyId']
        cw_key_id = outputs['CloudWatchLogsKMSKeyId']

        s3_rotation = kms_client.get_key_rotation_status(KeyId=s3_key_id)
        assert s3_rotation['KeyRotationEnabled'] is True

        cw_rotation = kms_client.get_key_rotation_status(KeyId=cw_key_id)
        assert cw_rotation['KeyRotationEnabled'] is True

    def test_cloudwatch_logs_encrypted(self, outputs, logs_client):
        """Test CloudWatch log group is encrypted."""
        log_group_name = outputs['LambdaLogGroupName']
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        assert 'kmsKeyId' in response['logGroups'][0]
        assert response['logGroups'][0]['kmsKeyId'] is not None


class TestLambdaFunction:
    """Test Lambda function configuration and execution."""

    @pytest.fixture(scope="class")
    def outputs(self):
        with open(OUTPUTS_FILE, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def lambda_client(self):
        return boto3.client('lambda', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def ec2_client(self):
        return boto3.client('ec2', region_name='us-east-1')

    def test_lambda_configuration(self, outputs, lambda_client):
        """Test Lambda function has correct configuration."""
        function_name = outputs['LambdaFunctionName']
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        assert response['MemorySize'] == 1024
        assert response['Timeout'] == 300
        assert response['Runtime'].startswith('nodejs')

    def test_lambda_in_vpc(self, outputs, lambda_client):
        """Test Lambda function is in VPC."""
        function_name = outputs['LambdaFunctionName']
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        assert 'VpcConfig' in response
        assert len(response['VpcConfig']['SubnetIds']) == 3
        assert len(response['VpcConfig']['SecurityGroupIds']) > 0

    def test_lambda_environment_variables(self, outputs, lambda_client):
        """Test Lambda function has required environment variables."""
        function_name = outputs['LambdaFunctionName']
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        env_vars = response['Environment']['Variables']
        assert 'TRANSACTION_TABLE' in env_vars
        assert 'AUDIT_BUCKET' in env_vars
        assert env_vars['TRANSACTION_TABLE'] == outputs['TransactionTableName']
        assert env_vars['AUDIT_BUCKET'] == outputs['AuditLogsBucketName']

    def test_lambda_execution_role(self, outputs, lambda_client):
        """Test Lambda function has execution role."""
        function_name = outputs['LambdaFunctionName']
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        assert 'Role' in response
        assert outputs['LambdaExecutionRoleArn'] in response['Role']


class TestEndToEndWorkflow:
    """Test end-to-end transaction processing workflow."""

    @pytest.fixture(scope="class")
    def outputs(self):
        with open(OUTPUTS_FILE, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def lambda_client(self):
        return boto3.client('lambda', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def dynamodb_client(self):
        return boto3.client('dynamodb', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def s3_client(self):
        return boto3.client('s3', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def logs_client(self):
        return boto3.client('logs', region_name='us-east-1')

    def test_lambda_invocation_success(self, outputs, lambda_client):
        """Test Lambda function can be invoked successfully."""
        function_name = outputs['LambdaFunctionName']

        test_event = {
            'transactionId': f'test-{int(time.time())}',
            'amount': 100.50,
            'cardNumber': '****1234',
            'timestamp': int(time.time())
        }

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        assert response['StatusCode'] == 200
        assert 'FunctionError' not in response

        payload = json.loads(response['Payload'].read())
        assert payload['statusCode'] == 200

        body = json.loads(payload['body'])
        assert 'transactionId' in body
        assert 'timestamp' in body

        return test_event['transactionId']

    def test_transaction_stored_in_dynamodb(self, outputs, lambda_client, dynamodb_client):
        """Test transaction is stored in DynamoDB."""
        function_name = outputs['LambdaFunctionName']
        table_name = outputs['TransactionTableName']

        # Invoke Lambda
        test_event = {
            'transactionId': f'test-dynamodb-{int(time.time())}',
            'amount': 250.75
        }

        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        # Wait a moment for write to complete
        time.sleep(2)

        # Query DynamoDB
        response = dynamodb_client.scan(
            TableName=table_name,
            FilterExpression='transactionId = :tid',
            ExpressionAttributeValues={
                ':tid': {'S': test_event['transactionId']}
            }
        )

        assert response['Count'] > 0
        item = response['Items'][0]
        assert item['transactionId']['S'] == test_event['transactionId']
        assert item['status']['S'] == 'processed'

    def test_audit_log_written_to_s3(self, outputs, lambda_client, s3_client):
        """Test audit log is written to S3."""
        function_name = outputs['LambdaFunctionName']
        bucket_name = outputs['AuditLogsBucketName']

        # Invoke Lambda
        test_event = {
            'transactionId': f'test-s3-{int(time.time())}',
            'amount': 500.00
        }

        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        # Wait for S3 write
        time.sleep(3)

        # Check S3 for audit log
        today = datetime.now().strftime('%Y-%m-%d')
        prefix = f'audit-logs/{today}/'

        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix
        )

        # Should have at least one audit log
        assert 'Contents' in response
        assert len(response['Contents']) > 0

    def test_lambda_logs_to_cloudwatch(self, outputs, lambda_client, logs_client):
        """Test Lambda writes logs to CloudWatch."""
        function_name = outputs['LambdaFunctionName']
        log_group_name = outputs['LambdaLogGroupName']

        # Invoke Lambda
        test_event = {
            'transactionId': f'test-logs-{int(time.time())}',
            'amount': 75.25
        }

        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        # Wait for logs to appear
        time.sleep(5)

        # Check CloudWatch Logs
        response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=1
        )

        assert len(response['logStreams']) > 0
        assert response['logStreams'][0]['storedBytes'] > 0


class TestCompliance:
    """Test PCI-DSS compliance requirements."""

    @pytest.fixture(scope="class")
    def outputs(self):
        with open(OUTPUTS_FILE, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def ec2_client(self):
        return boto3.client('ec2', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def s3_client(self):
        return boto3.client('s3', region_name='us-east-1')

    def test_no_internet_gateway(self, outputs, ec2_client):
        """Test VPC has no internet gateway (network isolation)."""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
            ]
        )

        assert len(response['InternetGateways']) == 0

    def test_s3_lifecycle_configured(self, outputs, s3_client):
        """Test S3 bucket has lifecycle policies for log retention."""
        bucket_name = outputs['AuditLogsBucketName']
        response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)

        assert len(response['Rules']) >= 3

        # Check for transition rules
        rules = response['Rules']
        has_ia_transition = any(
            any(t.get('StorageClass') == 'STANDARD_IA' for t in rule.get('Transitions', []))
            for rule in rules
        )
        has_glacier_transition = any(
            any(t.get('StorageClass') == 'GLACIER' for t in rule.get('Transitions', []))
            for rule in rules
        )

        assert has_ia_transition
        assert has_glacier_transition

    def test_cloudwatch_log_retention(self, outputs, logs_client):
        """Test CloudWatch logs have 90-day retention."""
        logs_client = boto3.client('logs', region_name='us-east-1')
        log_group_name = outputs['LambdaLogGroupName']

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        assert response['logGroups'][0]['retentionInDays'] == 90

    def test_vpc_flow_logs_enabled(self, outputs, ec2_client):
        """Test VPC Flow Logs are enabled."""
        vpc_id = outputs['VPCId']
        flow_log_id = outputs['VPCFlowLogId']

        response = ec2_client.describe_flow_logs(FlowLogIds=[flow_log_id])

        assert len(response['FlowLogs']) == 1
        assert response['FlowLogs'][0]['ResourceId'] == vpc_id
        assert response['FlowLogs'][0]['TrafficType'] == 'ALL'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
