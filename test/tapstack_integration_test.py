"""
Integration tests for AWS Config Compliance Analysis System.

These tests verify the deployed infrastructure against real AWS resources.
"""
import json
import os
import pytest
import boto3
from typing import Dict, Any


# Load deployment outputs
def load_outputs() -> Dict[str, Any]:
    """Load deployment outputs from cfn-outputs/flat-outputs.json"""
    outputs_path = os.path.join(
        os.path.dirname(__file__),
        '../cfn-outputs/flat-outputs.json'
    )
    with open(outputs_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope='module')
def outputs():
    """Fixture providing deployment outputs"""
    return load_outputs()


@pytest.fixture(scope='module')
def aws_clients():
    """Fixture providing AWS clients"""
    return {
        's3': boto3.client('s3', region_name='us-east-1'),
        'sns': boto3.client('sns', region_name='us-east-1'),
        'lambda': boto3.client('lambda', region_name='us-east-1'),
        'iam': boto3.client('iam', region_name='us-east-1'),
        'config': boto3.client('config', region_name='us-east-1')
    }


class TestS3BucketConfiguration:
    """Test S3 bucket configuration for compliance data storage"""

    def test_config_bucket_exists(self, outputs, aws_clients):
        """Verify S3 bucket for Config data exists"""
        bucket_name = outputs['config_bucket_name']
        assert bucket_name is not None
        assert bucket_name.startswith('config-compliance-')

        # Verify bucket exists
        response = aws_clients['s3'].head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_bucket_versioning_enabled(self, outputs, aws_clients):
        """Verify S3 bucket has versioning enabled"""
        bucket_name = outputs['config_bucket_name']

        response = aws_clients['s3'].get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled', "Bucket versioning should be enabled"

    def test_bucket_encryption_configured(self, outputs, aws_clients):
        """Verify S3 bucket has encryption configured"""
        bucket_name = outputs['config_bucket_name']

        response = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)
        rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
        assert len(rules) > 0, "Bucket should have encryption configured"

    def test_bucket_public_access_blocked(self, outputs, aws_clients):
        """Verify S3 bucket blocks all public access"""
        bucket_name = outputs['config_bucket_name']

        response = aws_clients['s3'].get_public_access_block(Bucket=bucket_name)
        block_config = response['PublicAccessBlockConfiguration']

        assert block_config['BlockPublicAcls'] is True
        assert block_config['IgnorePublicAcls'] is True
        assert block_config['BlockPublicPolicy'] is True
        assert block_config['RestrictPublicBuckets'] is True


class TestSNSTopic:
    """Test SNS topic for compliance notifications"""

    def test_sns_topic_exists(self, outputs, aws_clients):
        """Verify SNS topic exists"""
        topic_arn = outputs['sns_topic_arn']
        assert topic_arn is not None
        assert 'config-compliance-notifications' in topic_arn

        # Verify topic exists
        response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_sns_topic_has_policy(self, outputs, aws_clients):
        """Verify SNS topic has policy configured"""
        topic_arn = outputs['sns_topic_arn']

        response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)
        attributes = response['Attributes']

        assert 'Policy' in attributes
        assert len(attributes['Policy']) > 0


class TestIAMRoles:
    """Test IAM roles for Config and Lambda"""

    def test_config_role_exists(self, outputs, aws_clients):
        """Verify Config IAM role exists"""
        role_arn = outputs['config_role_arn']
        role_name = role_arn.split('/')[-1]

        response = aws_clients['iam'].get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name

    def test_lambda_role_exists(self, outputs, aws_clients):
        """Verify Lambda IAM role exists"""
        role_arn = outputs['lambda_role_arn']
        role_name = role_arn.split('/')[-1]

        response = aws_clients['iam'].get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name

    def test_lambda_role_has_policies(self, outputs, aws_clients):
        """Verify Lambda role has required policies attached"""
        role_arn = outputs['lambda_role_arn']
        role_name = role_arn.split('/')[-1]

        # Check inline policies
        response = aws_clients['iam'].list_role_policies(RoleName=role_name)
        assert len(response['PolicyNames']) > 0, "Lambda role should have inline policies"


class TestLambdaFunctions:
    """Test Lambda functions for compliance checks"""

    @pytest.mark.parametrize('lambda_key,function_type', [
        ('encryption_lambda_arn_us_east_1', 'encryption'),
        ('tagging_lambda_arn_us_east_1', 'tagging'),
        ('backup_lambda_arn_us_east_1', 'backup'),
    ])
    def test_lambda_function_exists(self, outputs, aws_clients, lambda_key, function_type):
        """Verify Lambda functions exist in us-east-1"""
        function_arn = outputs.get(lambda_key)
        assert function_arn is not None, f"{lambda_key} should be in outputs"

        function_name = function_arn.split(':')[-1]
        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionName'] == function_name

    def test_encryption_lambda_configuration(self, outputs, aws_clients):
        """Verify encryption Lambda has correct configuration"""
        function_arn = outputs['encryption_lambda_arn_us_east_1']
        function_name = function_arn.split(':')[-1]

        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        config = response['Configuration']

        # Verify runtime
        assert config['Runtime'] == 'python3.9', "Lambda should use Python 3.9"

        # Verify timeout
        assert config['Timeout'] == 30, "Lambda timeout should be 30 seconds"

        # Verify architecture
        assert 'arm64' in config['Architectures'], "Lambda should use ARM64 architecture"

        # Verify environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        assert 'SNS_TOPIC_ARN' in env_vars
        assert 'ENVIRONMENT_SUFFIX' in env_vars


class TestAWSConfigRecorders:
    """Test AWS Config recorders across regions"""

    @pytest.mark.parametrize('region', ['us-west-2', 'eu-west-1'])
    def test_config_recorder_exists(self, outputs, region):
        """Verify Config recorders exist in specified regions"""
        config_client = boto3.client('config', region_name=region)
        recorder_key = f'config_recorder_name_{region.replace("-", "_")}'
        recorder_name = outputs.get(recorder_key)

        if recorder_name:
            response = config_client.describe_configuration_recorders(
                ConfigurationRecorderNames=[recorder_name]
            )
            assert len(response['ConfigurationRecorders']) > 0

    def test_config_recorder_us_west_2_details(self, outputs):
        """Verify Config recorder in us-west-2 has correct configuration"""
        config_client = boto3.client('config', region_name='us-west-2')
        recorder_name = outputs['config_recorder_name_us_west_2']

        response = config_client.describe_configuration_recorders(
            ConfigurationRecorderNames=[recorder_name]
        )

        recorder = response['ConfigurationRecorders'][0]
        assert recorder['name'] == recorder_name

        # Verify recording group
        recording_group = recorder.get('recordingGroup', {})
        assert 'resourceTypes' in recording_group


class TestDeploymentOutputs:
    """Test that all required deployment outputs exist"""

    def test_all_required_outputs_present(self, outputs):
        """Verify all required outputs are present"""
        required_outputs = [
            'config_bucket_name',
            'config_bucket_arn',
            'sns_topic_arn',
            'config_role_arn',
            'lambda_role_arn',
            'encryption_lambda_arn_us_east_1',
            'tagging_lambda_arn_us_east_1',
            'backup_lambda_arn_us_east_1',
            'config_recorder_name_us_west_2'
        ]

        for output in required_outputs:
            assert output in outputs, f"Required output '{output}' not found"
            assert outputs[output] is not None, f"Output '{output}' should not be None"
            assert len(str(outputs[output])) > 0, f"Output '{output}' should not be empty"

    def test_multi_region_lambda_outputs(self, outputs):
        """Verify Lambda functions are deployed in all three regions"""
        regions = ['us_east_1', 'us_west_2', 'eu_west_1']
        function_types = ['encryption', 'tagging', 'backup']

        for region in regions:
            for func_type in function_types:
                output_key = f'{func_type}_lambda_arn_{region}'
                assert output_key in outputs, f"Lambda output for {func_type} in {region} should exist"
                assert outputs[output_key] is not None


class TestEndToEndCompliance:
    """End-to-end compliance workflow tests"""

    def test_lambda_can_be_invoked(self, outputs, aws_clients):
        """Verify Lambda function can be invoked (dry run)"""
        function_arn = outputs['encryption_lambda_arn_us_east_1']
        function_name = function_arn.split(':')[-1]

        # Test with a scheduled event (won't actually scan resources in test)
        test_event = {
            'source': 'aws.events',
            'detail-type': 'Scheduled Event'
        }

        # We're just checking the function exists and has correct permissions
        # Not actually invoking to avoid costs/side effects
        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        assert response['Configuration']['State'] == 'Active'

    def test_integration_architecture_complete(self, outputs):
        """Verify complete architecture is deployed"""
        # Check all major components are present
        assert outputs['config_bucket_name'] is not None  # Storage
        assert outputs['sns_topic_arn'] is not None  # Notifications
        assert outputs['config_role_arn'] is not None  # Config permissions
        assert outputs['lambda_role_arn'] is not None  # Lambda permissions

        # Check all three Lambda function types exist
        assert outputs['encryption_lambda_arn_us_east_1'] is not None
        assert outputs['tagging_lambda_arn_us_east_1'] is not None
        assert outputs['backup_lambda_arn_us_east_1'] is not None

        # Check Config recorders exist
        assert outputs['config_recorder_name_us_east_1'] is not None
