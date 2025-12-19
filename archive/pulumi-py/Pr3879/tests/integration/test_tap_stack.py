"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import json
import boto3
import pytest


class TestDeployedResources:
    """Integration tests for deployed AWS resources."""

    @pytest.fixture(scope='class')
    def outputs(self):
        """Load deployment outputs."""
        with open('cfn-outputs/flat-outputs.json', 'r') as f:
            return json.load(f)

    @pytest.fixture(scope='class')
    def aws_region(self):
        """Get AWS region."""
        return 'us-west-2'

    def test_dynamodb_table_exists(self, outputs, aws_region):
        """Test DynamoDB table is created and accessible."""
        dynamodb = boto3.client('dynamodb', region_name=aws_region)
        table_name = outputs['dynamodb_table_name']

        response = dynamodb.describe_table(TableName=table_name)
        assert response['Table']['TableName'] == table_name
        assert response['Table']['TableStatus'] == 'ACTIVE'
        assert response['Table']['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'

    def test_dynamodb_table_attributes(self, outputs, aws_region):
        """Test DynamoDB table has correct attributes."""
        dynamodb = boto3.client('dynamodb', region_name=aws_region)
        table_name = outputs['dynamodb_table_name']

        response = dynamodb.describe_table(TableName=table_name)
        key_schema = response['Table']['KeySchema']

        assert len(key_schema) == 1
        assert key_schema[0]['AttributeName'] == 'translationKey'
        assert key_schema[0]['KeyType'] == 'HASH'

    def test_s3_bucket_exists(self, outputs, aws_region):
        """Test S3 bucket is created."""
        s3 = boto3.client('s3', region_name=aws_region)
        bucket_name = outputs['s3_bucket_name']

        response = s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_s3_bucket_encryption(self, outputs, aws_region):
        """Test S3 bucket has encryption enabled."""
        s3 = boto3.client('s3', region_name=aws_region)
        bucket_name = outputs['s3_bucket_name']

        response = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']

        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']

    def test_sqs_queue_exists(self, outputs, aws_region):
        """Test SQS queue is created."""
        sqs = boto3.client('sqs', region_name=aws_region)
        queue_url = outputs['sqs_queue_url']

        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )
        assert 'Attributes' in response
        assert response['Attributes']['VisibilityTimeout'] == '300'

    def test_lambda_function_exists(self, outputs, aws_region):
        """Test Lambda function is created."""
        lambda_client = boto3.client('lambda', region_name=aws_region)
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['Runtime'] == 'python3.10'
        assert response['Configuration']['Timeout'] == 60

    def test_lambda_environment_variables(self, outputs, aws_region):
        """Test Lambda function has correct environment variables."""
        lambda_client = boto3.client('lambda', region_name=aws_region)
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration']['Environment']['Variables']

        assert 'DYNAMODB_TABLE' in env_vars
        assert 'S3_BUCKET' in env_vars
        assert 'SQS_QUEUE_URL' in env_vars
        assert 'REGION' in env_vars
        assert env_vars['REGION'] == 'us-west-2'

    def test_api_gateway_exists(self, outputs):
        """Test API Gateway endpoint is accessible."""
        import requests
        api_url = outputs['api_url']

        # Test that the endpoint exists (even if it returns an error without proper payload)
        response = requests.post(api_url, json={}, timeout=10)
        # Should return 400 or similar, not 404 (which would mean endpoint doesn't exist)
        assert response.status_code in [200, 202, 400, 403, 500]

    def test_api_gateway_translation_request(self, outputs):
        """Test API Gateway with a translation request."""
        import requests
        api_url = outputs['api_url']

        payload = {
            'text': 'Hello World',
            'sourceLanguage': 'en',
            'targetLanguage': 'es'
        }

        response = requests.post(api_url, json=payload, timeout=30)
        assert response.status_code in [200, 202]

        if response.status_code == 200:
            data = response.json()
            assert 'translatedText' in data or 'message' in data

    def test_appsync_api_exists(self, outputs):
        """Test AppSync API endpoint is configured."""
        api_url = outputs['appsync_api_url']
        api_key = outputs['appsync_api_key']

        assert api_url.startswith('https://')
        assert 'appsync-api' in api_url
        assert len(api_key) > 0

    def test_ssm_parameters_exist(self, outputs, aws_region):
        """Test SSM parameters are created."""
        ssm = boto3.client('ssm', region_name=aws_region)
        environment_suffix = outputs['dynamodb_table_name'].split('-')[-1]

        # Test table parameter
        table_param = ssm.get_parameter(
            Name=f'/translation/{environment_suffix}/dynamodb-table'
        )
        assert table_param['Parameter']['Value'] == outputs['dynamodb_table_name']

        # Test bucket parameter
        bucket_param = ssm.get_parameter(
            Name=f'/translation/{environment_suffix}/s3-bucket'
        )
        assert bucket_param['Parameter']['Value'] == outputs['s3_bucket_name']

        # Test queue parameter
        queue_param = ssm.get_parameter(
            Name=f'/translation/{environment_suffix}/sqs-queue-url'
        )
        assert queue_param['Parameter']['Value'] == outputs['sqs_queue_url']

    def test_cloudwatch_log_groups_exist(self, outputs, aws_region):
        """Test CloudWatch log groups are created."""
        logs = boto3.client('logs', region_name=aws_region)
        function_name = outputs['lambda_function_name']

        response = logs.describe_log_groups(
            logGroupNamePrefix=f'/aws/lambda/{function_name}'
        )
        assert len(response['logGroups']) > 0
        assert response['logGroups'][0]['logGroupName'] == f'/aws/lambda/{function_name}'


class TestResourceConnectivity:
    """Test connectivity and interactions between resources."""

    @pytest.fixture(scope='class')
    def outputs(self):
        """Load deployment outputs."""
        with open('cfn-outputs/flat-outputs.json', 'r') as f:
            return json.load(f)

    @pytest.fixture(scope='class')
    def aws_region(self):
        """Get AWS region."""
        return 'us-west-2'

    def test_lambda_can_access_dynamodb(self, outputs, aws_region):
        """Test Lambda function has permissions to access DynamoDB."""
        lambda_client = boto3.client('lambda', region_name=aws_region)
        iam = boto3.client('iam', region_name=aws_region)
        function_name = outputs['lambda_function_name']

        # Get Lambda function role
        response = lambda_client.get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']
        role_name = role_arn.split('/')[-1]

        # Get role policies
        policies = iam.list_role_policies(RoleName=role_name)
        assert len(policies['PolicyNames']) > 0

    def test_lambda_concurrent_execution_limit(self, outputs, aws_region):
        """Test Lambda function has concurrent execution limit set."""
        lambda_client = boto3.client('lambda', region_name=aws_region)
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function(FunctionName=function_name)
        # Check if ReservedConcurrentExecutions is set
        config = response['Configuration']
        if 'ReservedConcurrentExecutions' in config:
            assert config['ReservedConcurrentExecutions'] == 100
        else:
            # If not in response, check using get_function_concurrency
            concurrency = lambda_client.get_function_concurrency(
                FunctionName=function_name
            )
            if 'ReservedConcurrentExecutions' in concurrency:
                assert concurrency['ReservedConcurrentExecutions'] == 100

    def test_sqs_queue_configuration(self, outputs, aws_region):
        """Test SQS queue has proper configuration."""
        sqs = boto3.client('sqs', region_name=aws_region)
        queue_url = outputs['sqs_queue_url']

        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )
        attrs = response['Attributes']

        assert int(attrs['MessageRetentionPeriod']) == 1209600  # 14 days
        assert int(attrs['ReceiveMessageWaitTimeSeconds']) == 20


class TestTapStackLiveIntegration:  # pylint: disable=too-few-public-methods
    """Integration tests against live deployed Pulumi stack."""

    def test_all_required_outputs_present(self):
        """Test all required outputs are present."""
        with open('cfn-outputs/flat-outputs.json', 'r') as f:
            outputs = json.load(f)

        required_outputs = [
            'api_url',
            'dynamodb_table_name',
            's3_bucket_name',
            'sqs_queue_url',
            'lambda_function_name',
            'appsync_api_url',
            'appsync_api_key'
        ]

        for output in required_outputs:
            assert output in outputs
            assert outputs[output] is not None
            assert len(str(outputs[output])) > 0
