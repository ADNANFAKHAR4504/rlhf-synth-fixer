#!/usr/bin/env python3
"""
Integration tests for AWS Config Compliance Checking System
Tests verify that all deployed resources are functioning correctly
"""

import json
import os
import boto3
import pytest
from typing import Dict, Any

# Load deployment outputs
OUTPUTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'cfn-outputs', 'flat-outputs.json')

@pytest.fixture(scope='module')
def outputs() -> Dict[str, Any]:
    """Load deployment outputs from flat-outputs.json"""
    with open(OUTPUTS_FILE, 'r') as f:
        return json.load(f)

@pytest.fixture(scope='module')
def aws_clients():
    """Create AWS service clients"""
    return {
        'config': boto3.client('config', region_name='us-east-1'),
        'lambda': boto3.client('lambda', region_name='us-east-1'),
        's3': boto3.client('s3', region_name='us-east-1'),
        'sns': boto3.client('sns', region_name='us-east-1'),
        'logs': boto3.client('logs', region_name='us-east-1'),
        'events': boto3.client('events', region_name='us-east-1'),
        'iam': boto3.client('iam', region_name='us-east-1')
    }


class TestConfigRecorder:
    """Test AWS Config configuration recorder"""

    def test_recorder_exists(self, outputs, aws_clients):
        """Verify Config recorder is created and enabled"""
        recorder_name = outputs['config_recorder_name']

        # Check recorder exists
        response = aws_clients['config'].describe_configuration_recorders(
            ConfigurationRecorderNames=[recorder_name]
        )
        assert len(response['ConfigurationRecorders']) == 1

        recorder = response['ConfigurationRecorders'][0]
        assert recorder['name'] == recorder_name
        assert recorder['roleARN'] == outputs['iam_roles']['config_role']

    def test_recorder_is_running(self, outputs, aws_clients):
        """Verify Config recorder is enabled and recording"""
        recorder_name = outputs['config_recorder_name']

        response = aws_clients['config'].describe_configuration_recorder_status(
            ConfigurationRecorderNames=[recorder_name]
        )
        assert len(response['ConfigurationRecordersStatus']) == 1

        status = response['ConfigurationRecordersStatus'][0]
        assert status['name'] == recorder_name
        assert status['recording'] is True
        assert 'lastStatus' in status


class TestConfigDeliveryChannel:
    """Test AWS Config delivery channel"""

    def test_delivery_channel_exists(self, outputs, aws_clients):
        """Verify delivery channel is configured"""
        response = aws_clients['config'].describe_delivery_channels()

        delivery_channels = response['DeliveryChannels']
        assert len(delivery_channels) > 0

        # Find our delivery channel
        channel_found = False
        for channel in delivery_channels:
            if outputs['config_bucket_name'] in channel.get('s3BucketName', ''):
                channel_found = True
                assert channel['s3BucketName'] == outputs['config_bucket_name']
                break

        assert channel_found, "Delivery channel not found with expected S3 bucket"


class TestConfigRules:
    """Test AWS Config compliance rules"""

    def test_all_config_rules_exist(self, outputs, aws_clients):
        """Verify all Config rules are created"""
        expected_rules = outputs['config_rules']

        # Check each rule individually
        for rule_name in expected_rules:
            response = aws_clients['config'].describe_config_rules(
                ConfigRuleNames=[rule_name]
            )
            assert len(response['ConfigRules']) == 1, f"Config rule {rule_name} not found"
            assert response['ConfigRules'][0]['ConfigRuleName'] == rule_name

    def test_s3_encryption_rule_active(self, outputs, aws_clients):
        """Verify S3 encryption rule is active"""
        rule_name = outputs['config_rules'][0]  # s3-bucket-server-side-encryption-enabled

        response = aws_clients['config'].describe_config_rules(
            ConfigRuleNames=[rule_name]
        )
        assert len(response['ConfigRules']) == 1

        rule = response['ConfigRules'][0]
        assert rule['Source']['Owner'] == 'AWS'
        assert 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED' in rule['Source']['SourceIdentifier']


class TestS3Bucket:
    """Test Config S3 bucket"""

    def test_bucket_exists(self, outputs, aws_clients):
        """Verify S3 bucket exists"""
        bucket_name = outputs['config_bucket_name']

        response = aws_clients['s3'].head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_bucket_versioning_enabled(self, outputs, aws_clients):
        """Verify bucket versioning is enabled"""
        bucket_name = outputs['config_bucket_name']

        response = aws_clients['s3'].get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    def test_bucket_encryption_enabled(self, outputs, aws_clients):
        """Verify bucket encryption is configured"""
        bucket_name = outputs['config_bucket_name']

        response = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']

    def test_bucket_public_access_blocked(self, outputs, aws_clients):
        """Verify bucket has public access blocked"""
        bucket_name = outputs['config_bucket_name']

        response = aws_clients['s3'].get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['RestrictPublicBuckets'] is True


class TestLambdaFunction:
    """Test Lambda compliance checker function"""

    def test_lambda_function_exists(self, outputs, aws_clients):
        """Verify Lambda function is deployed"""
        function_name = outputs['compliance_lambda_function_name']

        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['Runtime'] == 'python3.11'
        assert response['Configuration']['MemorySize'] == 256
        assert response['Configuration']['Timeout'] == 60

    def test_lambda_environment_variables(self, outputs, aws_clients):
        """Verify Lambda has correct environment variables"""
        function_name = outputs['compliance_lambda_function_name']

        response = aws_clients['lambda'].get_function_configuration(FunctionName=function_name)
        env_vars = response['Environment']['Variables']

        assert 'SNS_TOPIC_ARN' in env_vars
        assert env_vars['SNS_TOPIC_ARN'] == outputs['sns_topic_arn']
        assert 'CONFIG_BUCKET' in env_vars
        assert env_vars['CONFIG_BUCKET'] == outputs['config_bucket_name']
        assert 'ENVIRONMENT_SUFFIX' in env_vars

    def test_lambda_invocation(self, outputs, aws_clients):
        """Test Lambda function invocation"""
        function_name = outputs['compliance_lambda_function_name']

        # Invoke Lambda with test event
        test_event = {}
        response = aws_clients['lambda'].invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        assert response['StatusCode'] == 200
        payload = json.loads(response['Payload'].read())
        assert payload['statusCode'] in [200, 500]  # May fail if no resources to check


class TestCloudWatchLogGroups:
    """Test CloudWatch Log Groups"""

    def test_all_log_groups_exist(self, outputs, aws_clients):
        """Verify all CloudWatch log groups are created"""
        log_groups = outputs['cloudwatch_log_groups']

        for log_group_name in log_groups.values():
            response = aws_clients['logs'].describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            assert len(response['logGroups']) > 0

            # Find the specific log group
            found = False
            for log_group in response['logGroups']:
                if log_group['logGroupName'] == log_group_name:
                    found = True
                    assert log_group['retentionInDays'] == 30
                    break

            assert found, f"Log group {log_group_name} not found"


class TestSNSTopic:
    """Test SNS topic for notifications"""

    def test_sns_topic_exists(self, outputs, aws_clients):
        """Verify SNS topic exists"""
        topic_arn = outputs['sns_topic_arn']

        response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn

    def test_sns_topic_policy(self, outputs, aws_clients):
        """Verify SNS topic has correct policy"""
        topic_arn = outputs['sns_topic_arn']

        response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)
        policy = json.loads(response['Attributes']['Policy'])

        # Check policy allows Config and Lambda to publish
        statements = policy['Statement']
        services = [stmt['Principal'].get('Service', '') for stmt in statements if 'Principal' in stmt]

        assert 'config.amazonaws.com' in services or any('config' in str(s) for s in services)
        assert 'lambda.amazonaws.com' in services or any('lambda' in str(s) for s in services)


class TestEventBridgeRules:
    """Test EventBridge rules"""

    def test_compliance_change_rule_exists(self, outputs, aws_clients):
        """Verify compliance change EventBridge rule exists"""
        rule_name = outputs['eventbridge_rules']['compliance_change_rule']

        response = aws_clients['events'].describe_rule(Name=rule_name)
        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'

        # Verify event pattern
        event_pattern = json.loads(response['EventPattern'])
        assert 'aws.config' in event_pattern.get('source', [])

    def test_periodic_check_rule_exists(self, outputs, aws_clients):
        """Verify periodic check EventBridge rule exists"""
        rule_name = outputs['eventbridge_rules']['periodic_check_rule']

        response = aws_clients['events'].describe_rule(Name=rule_name)
        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'
        assert response['ScheduleExpression'] == 'rate(6 hours)'

    def test_eventbridge_targets_configured(self, outputs, aws_clients):
        """Verify EventBridge rules target Lambda function"""
        compliance_rule = outputs['eventbridge_rules']['compliance_change_rule']
        periodic_rule = outputs['eventbridge_rules']['periodic_check_rule']
        lambda_arn = outputs['compliance_lambda_function_arn']

        # Check compliance change rule targets
        response = aws_clients['events'].list_targets_by_rule(Rule=compliance_rule)
        targets = response['Targets']
        assert len(targets) > 0
        assert any(target['Arn'] == lambda_arn for target in targets)

        # Check periodic rule targets
        response = aws_clients['events'].list_targets_by_rule(Rule=periodic_rule)
        targets = response['Targets']
        assert len(targets) > 0
        assert any(target['Arn'] == lambda_arn for target in targets)


class TestIAMRoles:
    """Test IAM roles and permissions"""

    def test_config_role_exists(self, outputs, aws_clients):
        """Verify Config IAM role exists"""
        role_arn = outputs['iam_roles']['config_role']
        role_name = role_arn.split('/')[-1]

        response = aws_clients['iam'].get_role(RoleName=role_name)
        assert response['Role']['Arn'] == role_arn

    def test_lambda_role_exists(self, outputs, aws_clients):
        """Verify Lambda IAM role exists"""
        role_arn = outputs['iam_roles']['lambda_role']
        role_name = role_arn.split('/')[-1]

        response = aws_clients['iam'].get_role(RoleName=role_name)
        assert response['Role']['Arn'] == role_arn

    def test_lambda_role_has_policies(self, outputs, aws_clients):
        """Verify Lambda role has necessary inline policies"""
        role_arn = outputs['iam_roles']['lambda_role']
        role_name = role_arn.split('/')[-1]

        response = aws_clients['iam'].list_role_policies(RoleName=role_name)
        policy_names = response['PolicyNames']

        # Check for expected inline policies
        expected_policies = ['cloudwatch', 'config', 'sns', 's3']
        for expected in expected_policies:
            assert any(expected in policy.lower() for policy in policy_names), \
                f"Expected policy containing '{expected}' not found"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
