import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import sys
import os

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

from tagging_check import (
    lambda_handler,
    evaluate_resource_tags,
    check_ec2_tags,
    check_rds_tags,
    check_s3_tags,
    scan_all_resources,
    send_notification,
    REQUIRED_TAGS
)


@pytest.fixture
def mock_env(monkeypatch):
    """Set up environment variables for tests"""
    monkeypatch.setenv('SNS_TOPIC_ARN', 'arn:aws:sns:us-east-1:123456789012:test-topic')
    monkeypatch.setenv('ENVIRONMENT_SUFFIX', 'test')
    monkeypatch.setenv('AWS_REGION_NAME', 'us-east-1')


@pytest.fixture
def config_rule_event():
    """Sample Config rule evaluation event"""
    return {
        'configRuleId': 'rule-12345',
        'resultToken': 'token-12345',
        'configRuleInvokingEvent': json.dumps({
            'configurationItem': {
                'resourceType': 'AWS::EC2::Instance',
                'resourceId': 'i-1234567890abcdef0'
            }
        })
    }


@pytest.fixture
def scheduled_event():
    """Sample scheduled event"""
    return {
        'source': 'aws.events',
        'detail-type': 'Scheduled Event'
    }


class TestLambdaHandler:
    """Tests for lambda_handler function"""

    @patch('tagging_check.evaluate_resource_tags')
    @patch('tagging_check.config_client')
    @patch('tagging_check.send_notification')
    def test_lambda_handler_config_rule_compliant(self, mock_send_notif, mock_config, mock_evaluate, config_rule_event, mock_env):
        """Test lambda_handler with compliant Config rule event"""
        mock_evaluate.return_value = {
            'status': 'COMPLIANT',
            'message': 'Resource has all required tags'
        }
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(config_rule_event, {})

        assert result['statusCode'] == 200
        assert 'Tagging compliance check completed' in result['body']
        mock_evaluate.assert_called_once_with('AWS::EC2::Instance', 'i-1234567890abcdef0')
        mock_config.put_evaluations.assert_called_once()
        mock_send_notif.assert_not_called()

    @patch('tagging_check.evaluate_resource_tags')
    @patch('tagging_check.config_client')
    @patch('tagging_check.send_notification')
    def test_lambda_handler_config_rule_non_compliant(self, mock_send_notif, mock_config, mock_evaluate, config_rule_event, mock_env):
        """Test lambda_handler with non-compliant Config rule event"""
        mock_evaluate.return_value = {
            'status': 'NON_COMPLIANT',
            'message': 'Missing required tags'
        }
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(config_rule_event, {})

        assert result['statusCode'] == 200
        mock_evaluate.assert_called_once()
        mock_config.put_evaluations.assert_called_once()
        mock_send_notif.assert_called_once_with('AWS::EC2::Instance', 'i-1234567890abcdef0', 'Missing required tags')

    @patch('tagging_check.scan_all_resources')
    def test_lambda_handler_scheduled_event(self, mock_scan, scheduled_event, mock_env):
        """Test lambda_handler with scheduled event"""
        mock_scan.return_value = None

        result = lambda_handler(scheduled_event, {})

        assert result['statusCode'] == 200
        assert 'Tagging compliance check completed' in result['body']
        mock_scan.assert_called_once()


class TestEvaluateResourceTags:
    """Tests for evaluate_resource_tags function"""

    @patch('tagging_check.check_ec2_tags')
    def test_evaluate_ec2_instance(self, mock_check, mock_env):
        """Test evaluation of EC2 instance"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'All tags present'}

        result = evaluate_resource_tags('AWS::EC2::Instance', 'i-12345')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('i-12345')

    @patch('tagging_check.check_rds_tags')
    def test_evaluate_rds_instance(self, mock_check, mock_env):
        """Test evaluation of RDS instance"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'All tags present'}

        result = evaluate_resource_tags('AWS::RDS::DBInstance', 'db-12345')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('db-12345')

    @patch('tagging_check.check_s3_tags')
    def test_evaluate_s3_bucket(self, mock_check, mock_env):
        """Test evaluation of S3 bucket"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'All tags present'}

        result = evaluate_resource_tags('AWS::S3::Bucket', 'my-bucket')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('my-bucket')

    def test_evaluate_unsupported_resource_type(self, mock_env):
        """Test evaluation of unsupported resource type"""
        result = evaluate_resource_tags('AWS::Lambda::Function', 'func-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'not supported' in result['message']

    @patch('tagging_check.check_ec2_tags')
    def test_evaluate_with_exception(self, mock_check, mock_env):
        """Test evaluation when check raises exception"""
        mock_check.side_effect = Exception('Test error')

        result = evaluate_resource_tags('AWS::EC2::Instance', 'i-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckEC2Tags:
    """Tests for check_ec2_tags function"""

    @patch('tagging_check.ec2_client')
    def test_check_ec2_tags_all_present(self, mock_ec2, mock_env):
        """Test EC2 instance with all required tags"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'prod'},
                        {'Key': 'Owner', 'Value': 'team'},
                        {'Key': 'CostCenter', 'Value': 'eng'}
                    ]
                }]
            }]
        }

        result = check_ec2_tags('i-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'has all required tags' in result['message']

    @patch('tagging_check.ec2_client')
    def test_check_ec2_tags_missing_tags(self, mock_ec2, mock_env):
        """Test EC2 instance with missing tags"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'prod'}
                    ]
                }]
            }]
        }

        result = check_ec2_tags('i-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'missing required tags' in result['message']
        assert 'Owner' in result['message']
        assert 'CostCenter' in result['message']

    @patch('tagging_check.ec2_client')
    def test_check_ec2_tags_no_tags(self, mock_ec2, mock_env):
        """Test EC2 instance with no tags"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': []
                }]
            }]
        }

        result = check_ec2_tags('i-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'missing required tags' in result['message']

    @patch('tagging_check.ec2_client')
    def test_check_ec2_tags_instance_not_found(self, mock_ec2, mock_env):
        """Test EC2 instance not found"""
        mock_ec2.describe_instances.return_value = {'Reservations': []}

        result = check_ec2_tags('i-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'Instance not found' in result['message']

    @patch('tagging_check.ec2_client')
    def test_check_ec2_tags_exception(self, mock_ec2, mock_env):
        """Test EC2 tags check with exception"""
        mock_ec2.describe_instances.side_effect = Exception('Test error')

        result = check_ec2_tags('i-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckRDSTags:
    """Tests for check_rds_tags function"""

    @patch('tagging_check.rds_client')
    def test_check_rds_tags_all_present(self, mock_rds, mock_env):
        """Test RDS instance with all required tags"""
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'db-12345',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:db-12345'
            }]
        }
        mock_rds.list_tags_for_resource.return_value = {
            'TagList': [
                {'Key': 'Environment', 'Value': 'prod'},
                {'Key': 'Owner', 'Value': 'team'},
                {'Key': 'CostCenter', 'Value': 'eng'}
            ]
        }

        result = check_rds_tags('db-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'has all required tags' in result['message']

    @patch('tagging_check.rds_client')
    def test_check_rds_tags_missing_tags(self, mock_rds, mock_env):
        """Test RDS instance with missing tags"""
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'db-12345',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:db-12345'
            }]
        }
        mock_rds.list_tags_for_resource.return_value = {
            'TagList': [
                {'Key': 'Environment', 'Value': 'prod'}
            ]
        }

        result = check_rds_tags('db-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'missing required tags' in result['message']

    @patch('tagging_check.rds_client')
    def test_check_rds_tags_not_found(self, mock_rds, mock_env):
        """Test RDS instance not found"""
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}

        result = check_rds_tags('db-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'DB instance not found' in result['message']

    @patch('tagging_check.rds_client')
    def test_check_rds_tags_exception(self, mock_rds, mock_env):
        """Test RDS tags check with exception"""
        mock_rds.describe_db_instances.side_effect = Exception('Test error')

        result = check_rds_tags('db-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckS3Tags:
    """Tests for check_s3_tags function"""

    @patch('tagging_check.s3_client')
    def test_check_s3_tags_all_present(self, mock_s3, mock_env):
        """Test S3 bucket with all required tags"""
        mock_s3.get_bucket_tagging.return_value = {
            'TagSet': [
                {'Key': 'Environment', 'Value': 'prod'},
                {'Key': 'Owner', 'Value': 'team'},
                {'Key': 'CostCenter', 'Value': 'eng'}
            ]
        }

        result = check_s3_tags('my-bucket')

        assert result['status'] == 'COMPLIANT'
        assert 'has all required tags' in result['message']

    @patch('tagging_check.s3_client')
    def test_check_s3_tags_missing_tags(self, mock_s3, mock_env):
        """Test S3 bucket with missing tags"""
        mock_s3.get_bucket_tagging.return_value = {
            'TagSet': [
                {'Key': 'Environment', 'Value': 'prod'}
            ]
        }

        result = check_s3_tags('my-bucket')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'missing required tags' in result['message']

    @patch('tagging_check.s3_client')
    def test_check_s3_tags_no_tags(self, mock_s3, mock_env):
        """Test S3 bucket with no tag set"""
        mock_s3.exceptions.NoSuchTagSet = type('NoSuchTagSet', (Exception,), {})
        mock_s3.get_bucket_tagging.side_effect = mock_s3.exceptions.NoSuchTagSet()

        result = check_s3_tags('my-bucket')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'has no tags' in result['message']

    @patch('tagging_check.s3_client')
    def test_check_s3_tags_exception(self, mock_s3, mock_env):
        """Test S3 tags check with generic exception"""
        # Mock the exceptions attribute
        mock_s3.exceptions = Mock()
        mock_s3.exceptions.NoSuchTagSet = type('NoSuchTagSet', (Exception,), {})
        mock_s3.get_bucket_tagging.side_effect = RuntimeError('Test error')

        result = check_s3_tags('my-bucket')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestScanAllResources:
    """Tests for scan_all_resources function"""

    @patch('tagging_check.sns_client')
    @patch('tagging_check.rds_client')
    @patch('tagging_check.ec2_client')
    @patch('tagging_check.check_rds_tags')
    @patch('tagging_check.check_ec2_tags')
    def test_scan_all_resources_with_non_compliant(self, mock_ec2_check, mock_rds_check, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with non-compliant findings"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{'InstanceId': 'i-12345'}]
            }]
        }
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{'DBInstanceIdentifier': 'db-12345'}]
        }
        mock_ec2_check.return_value = {
            'status': 'NON_COMPLIANT',
            'message': 'Missing tags'
        }
        mock_rds_check.return_value = {
            'status': 'NON_COMPLIANT',
            'message': 'Missing tags'
        }

        scan_all_resources()

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'Tagging Compliance Alert' in call_args[1]['Subject']
        assert 'Found 2 non-compliant resources' in call_args[1]['Message']

    @patch('tagging_check.sns_client')
    @patch('tagging_check.rds_client')
    @patch('tagging_check.ec2_client')
    @patch('tagging_check.check_rds_tags')
    @patch('tagging_check.check_ec2_tags')
    def test_scan_all_resources_all_compliant(self, mock_ec2_check, mock_rds_check, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with all compliant"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{'InstanceId': 'i-12345'}]
            }]
        }
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{'DBInstanceIdentifier': 'db-12345'}]
        }
        mock_ec2_check.return_value = {
            'status': 'COMPLIANT',
            'message': 'All tags present'
        }
        mock_rds_check.return_value = {
            'status': 'COMPLIANT',
            'message': 'All tags present'
        }

        scan_all_resources()

        mock_sns.publish.assert_not_called()

    @patch('tagging_check.sns_client')
    @patch('tagging_check.rds_client')
    @patch('tagging_check.ec2_client')
    def test_scan_all_resources_ec2_exception(self, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with EC2 exception"""
        mock_ec2.describe_instances.side_effect = Exception('EC2 error')
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}

        scan_all_resources()

        # Should not crash, just log error
        mock_sns.publish.assert_not_called()

    @patch('tagging_check.sns_client')
    @patch('tagging_check.rds_client')
    @patch('tagging_check.ec2_client')
    def test_scan_all_resources_rds_exception(self, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with RDS exception"""
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_rds.describe_db_instances.side_effect = Exception('RDS error')

        scan_all_resources()

        # Should not crash, just log error
        mock_sns.publish.assert_not_called()


class TestSendNotification:
    """Tests for send_notification function"""

    @patch('tagging_check.sns_client')
    def test_send_notification_success(self, mock_sns, mock_env):
        """Test successful notification sending"""
        mock_sns.publish.return_value = {'MessageId': 'msg-12345'}

        send_notification('AWS::EC2::Instance', 'i-12345', 'Missing tags')

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'Tagging Compliance Alert' in call_args[1]['Subject']
        assert 'i-12345' in call_args[1]['Message']
        assert 'Required Tags:' in call_args[1]['Message']

    @patch('tagging_check.sns_client')
    def test_send_notification_exception(self, mock_sns, mock_env):
        """Test notification sending with exception"""
        mock_sns.publish.side_effect = Exception('SNS error')

        # Should not crash, just log error
        send_notification('AWS::EC2::Instance', 'i-12345', 'Missing tags')

        mock_sns.publish.assert_called_once()


class TestRequiredTags:
    """Test REQUIRED_TAGS constant"""

    def test_required_tags_defined(self):
        """Test that REQUIRED_TAGS is properly defined"""
        assert REQUIRED_TAGS == ['Environment', 'Owner', 'CostCenter']
        assert len(REQUIRED_TAGS) == 3
