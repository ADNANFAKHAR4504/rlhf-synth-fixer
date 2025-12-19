"""
Integration tests for the Zero-Trust Data Processing Pipeline.

These tests verify that the deployed AWS resources are correctly configured
and functioning as expected. Tests use live AWS resources.

Requirements:
- Read from cfn-outputs/flat-outputs.json (no describeStack)
- No hardcoding (use environment variables)
- No try-catch blocks
- Test actual deployed resources
"""

import json
import os
import pathlib
import unittest

import boto3
from pytest import mark

# Get outputs path
outputs_path = pathlib.Path(
    os.getcwd(), 'cfn-outputs', 'flat-outputs.json'
)
outputs = json.loads(outputs_path.read_text(encoding='utf-8'))

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')

# Get outputs from flat-outputs.json
vpc_id = outputs.get('VPCId')
bucket_name = outputs.get('DataBucketName')
function_arn = outputs.get('ProcessingFunctionArn')
secret_arn = outputs.get('SecretArn')

# Initialize AWS clients
s3_client = boto3.client('s3', region_name=region)
lambda_client = boto3.client('lambda', region_name=region)
secretsmanager_client = boto3.client('secretsmanager', region_name=region)
ec2_client = boto3.client('ec2', region_name=region)
kms_client = boto3.client('kms', region_name=region)
logs_client = boto3.client('logs', region_name=region)


@mark.describe("S3 Bucket Integration Tests")
class TestS3BucketIntegration(unittest.TestCase):
    """Integration tests for S3 bucket"""

    @mark.it("should verify S3 bucket exists")
    def test_bucket_exists(self):
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    @mark.it("should verify S3 bucket has versioning enabled")
    def test_bucket_versioning_enabled(self):
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    @mark.it("should verify S3 bucket has encryption enabled")
    def test_bucket_encryption_enabled(self):
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        sse_config = rules[0]['ApplyServerSideEncryptionByDefault']
        assert sse_config['SSEAlgorithm'] == 'aws:kms'

    @mark.it("should verify S3 bucket blocks public access")
    def test_bucket_blocks_public_access(self):
        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True

    @mark.it("should verify S3 bucket has correct name pattern")
    def test_bucket_name_pattern(self):
        assert bucket_name == f'zero-trust-data-{environment_suffix}'

    @mark.it("should verify S3 bucket policy enforces SSL")
    def test_bucket_policy_enforces_ssl(self):
        response = s3_client.get_bucket_policy(Bucket=bucket_name)
        policy = json.loads(response['Policy'])
        ssl_enforced = False
        for statement in policy.get('Statement', []):
            if statement.get('Effect') == 'Deny':
                condition = statement.get('Condition', {})
                if condition.get('Bool', {}).get('aws:SecureTransport') == 'false':
                    ssl_enforced = True
                    break
        assert ssl_enforced is True


@mark.describe("Lambda Function Integration Tests")
class TestLambdaFunctionIntegration(unittest.TestCase):
    """Integration tests for Lambda function"""

    @mark.it("should verify Lambda function exists")
    def test_lambda_exists(self):
        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionArn'] == function_arn

    @mark.it("should verify Lambda function has correct runtime")
    def test_lambda_runtime(self):
        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['Runtime'] == 'python3.11'

    @mark.it("should verify Lambda function has correct handler")
    def test_lambda_handler(self):
        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['Handler'] == 'index.handler'

    @mark.it("should verify Lambda function has correct memory")
    def test_lambda_memory(self):
        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['MemorySize'] == 256

    @mark.it("should verify Lambda function has correct timeout")
    def test_lambda_timeout(self):
        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['Timeout'] == 30

    @mark.it("should verify Lambda function is in VPC")
    def test_lambda_in_vpc(self):
        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        vpc_config = response['Configuration'].get('VpcConfig', {})
        assert vpc_config.get('VpcId') == vpc_id
        assert len(vpc_config.get('SubnetIds', [])) > 0
        assert len(vpc_config.get('SecurityGroupIds', [])) > 0

    @mark.it("should verify Lambda function has environment variables")
    def test_lambda_environment_variables(self):
        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'SECRET_ARN' in env_vars
        assert 'BUCKET_NAME' in env_vars
        assert env_vars['BUCKET_NAME'] == bucket_name

    @mark.it("should verify Lambda function has correct name pattern")
    def test_lambda_name_pattern(self):
        function_name = function_arn.split(':')[-1]
        assert function_name == f'data-processing-{environment_suffix}'


@mark.describe("Secrets Manager Integration Tests")
class TestSecretsManagerIntegration(unittest.TestCase):
    """Integration tests for Secrets Manager"""

    @mark.it("should verify secret exists")
    def test_secret_exists(self):
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn

    @mark.it("should verify secret is encrypted with KMS")
    def test_secret_kms_encryption(self):
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert 'KmsKeyId' in response
        assert response['KmsKeyId'] is not None

    @mark.it("should verify secret value can be retrieved")
    def test_secret_value_retrieval(self):
        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret_string = json.loads(response['SecretString'])
        assert 'username' in secret_string
        assert 'password' in secret_string
        assert secret_string['username'] == 'admin'

    @mark.it("should verify secret has correct description")
    def test_secret_description(self):
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert environment_suffix in response.get('Description', '')


@mark.describe("VPC Integration Tests")
class TestVPCIntegration(unittest.TestCase):
    """Integration tests for VPC"""

    @mark.it("should verify VPC exists")
    def test_vpc_exists(self):
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['VpcId'] == vpc_id

    @mark.it("should verify VPC has DNS hostnames enabled")
    def test_vpc_dns_hostnames(self):
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert response['EnableDnsHostnames']['Value'] is True

    @mark.it("should verify VPC has DNS support enabled")
    def test_vpc_dns_support(self):
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert response['EnableDnsSupport']['Value'] is True

    @mark.it("should verify VPC has private subnets")
    def test_vpc_has_private_subnets(self):
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        assert len(response['Subnets']) >= 2
        for subnet in response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is False

    @mark.it("should verify VPC has no internet gateway")
    def test_vpc_no_internet_gateway(self):
        response = ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
            ]
        )
        assert len(response['InternetGateways']) == 0

    @mark.it("should verify VPC has VPC endpoints")
    def test_vpc_has_endpoints(self):
        response = ec2_client.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        endpoints = response['VpcEndpoints']
        assert len(endpoints) >= 5

        service_names = [ep['ServiceName'] for ep in endpoints]
        assert any('s3' in sn for sn in service_names)
        assert any('lambda' in sn for sn in service_names)
        assert any('kms' in sn for sn in service_names)
        assert any('secretsmanager' in sn for sn in service_names)
        assert any('logs' in sn for sn in service_names)


@mark.describe("Security Groups Integration Tests")
class TestSecurityGroupsIntegration(unittest.TestCase):
    """Integration tests for Security Groups"""

    @mark.it("should verify VPC has security groups")
    def test_vpc_has_security_groups(self):
        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        assert len(response['SecurityGroups']) >= 2

    @mark.it("should verify security groups have HTTPS rules")
    def test_security_groups_https_rules(self):
        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        https_found = False
        for sg in response['SecurityGroups']:
            for rule in sg.get('IpPermissions', []):
                if rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                    https_found = True
                    break
            for rule in sg.get('IpPermissionsEgress', []):
                if rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                    https_found = True
                    break
        assert https_found is True


@mark.describe("CloudWatch Logs Integration Tests")
class TestCloudWatchLogsIntegration(unittest.TestCase):
    """Integration tests for CloudWatch Logs"""

    @mark.it("should verify log group exists")
    def test_log_group_exists(self):
        log_group_name = f'/aws/lambda/data-processing-{environment_suffix}'
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        log_groups = response['logGroups']
        matching_groups = [
            lg for lg in log_groups
            if lg['logGroupName'] == log_group_name
        ]
        assert len(matching_groups) == 1

    @mark.it("should verify log group has 90-day retention")
    def test_log_group_retention(self):
        log_group_name = f'/aws/lambda/data-processing-{environment_suffix}'
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        log_groups = response['logGroups']
        matching_groups = [
            lg for lg in log_groups
            if lg['logGroupName'] == log_group_name
        ]
        assert matching_groups[0]['retentionInDays'] == 90

    @mark.it("should verify log group is encrypted with KMS")
    def test_log_group_encryption(self):
        log_group_name = f'/aws/lambda/data-processing-{environment_suffix}'
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        log_groups = response['logGroups']
        matching_groups = [
            lg for lg in log_groups
            if lg['logGroupName'] == log_group_name
        ]
        assert 'kmsKeyId' in matching_groups[0]
        assert matching_groups[0]['kmsKeyId'] is not None


@mark.describe("Resource Tags Integration Tests")
class TestResourceTagsIntegration(unittest.TestCase):
    """Integration tests for resource tags"""

    @mark.it("should verify VPC has Environment tag")
    def test_vpc_environment_tag(self):
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        tags = {t['Key']: t['Value'] for t in response['Vpcs'][0].get('Tags', [])}
        assert tags.get('Environment') == environment_suffix

    @mark.it("should verify VPC has DataClassification tag")
    def test_vpc_data_classification_tag(self):
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        tags = {t['Key']: t['Value'] for t in response['Vpcs'][0].get('Tags', [])}
        assert tags.get('DataClassification') == 'Sensitive'

    @mark.it("should verify VPC has Owner tag")
    def test_vpc_owner_tag(self):
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        tags = {t['Key']: t['Value'] for t in response['Vpcs'][0].get('Tags', [])}
        assert tags.get('Owner') == 'SecurityTeam'


@mark.describe("End-to-End Integration Tests")
class TestEndToEndIntegration(unittest.TestCase):
    """End-to-end integration tests"""

    @mark.it("should verify S3 bucket can receive encrypted objects")
    def test_s3_put_encrypted_object(self):
        test_key = f'test-object-{environment_suffix}.txt'
        test_content = 'Integration test content'

        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content,
            ServerSideEncryption='aws:kms'
        )

        response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
        assert response['ServerSideEncryption'] == 'aws:kms'

        s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    @mark.it("should verify full pipeline connectivity")
    def test_pipeline_connectivity(self):
        assert vpc_id is not None
        assert bucket_name is not None
        assert function_arn is not None
        assert secret_arn is not None

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert response['Vpcs'][0]['State'] == 'available'

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        function_name = function_arn.split(':')[-1]
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['State'] == 'Active'

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn


if __name__ == "__main__":
    unittest.main()
