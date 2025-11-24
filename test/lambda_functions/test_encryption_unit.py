import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import sys
import os

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

from encryption_check import (
    lambda_handler,
    evaluate_resource_encryption,
    check_ec2_encryption,
    check_rds_encryption,
    check_s3_encryption,
    scan_all_resources,
    send_notification
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

    @patch('encryption_check.evaluate_resource_encryption')
    @patch('encryption_check.config_client')
    @patch('encryption_check.send_notification')
    def test_lambda_handler_config_rule_compliant(self, mock_send_notif, mock_config, mock_evaluate, config_rule_event, mock_env):
        """Test lambda_handler with compliant Config rule event"""
        mock_evaluate.return_value = {
            'status': 'COMPLIANT',
            'message': 'Resource is compliant'
        }
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(config_rule_event, {})

        assert result['statusCode'] == 200
        assert 'Encryption compliance check completed' in result['body']
        mock_evaluate.assert_called_once_with('AWS::EC2::Instance', 'i-1234567890abcdef0')
        mock_config.put_evaluations.assert_called_once()
        mock_send_notif.assert_not_called()

    @patch('encryption_check.evaluate_resource_encryption')
    @patch('encryption_check.config_client')
    @patch('encryption_check.send_notification')
    def test_lambda_handler_config_rule_non_compliant(self, mock_send_notif, mock_config, mock_evaluate, config_rule_event, mock_env):
        """Test lambda_handler with non-compliant Config rule event"""
        mock_evaluate.return_value = {
            'status': 'NON_COMPLIANT',
            'message': 'Resource is not compliant'
        }
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(config_rule_event, {})

        assert result['statusCode'] == 200
        mock_evaluate.assert_called_once()
        mock_config.put_evaluations.assert_called_once()
        mock_send_notif.assert_called_once_with('AWS::EC2::Instance', 'i-1234567890abcdef0', 'Resource is not compliant')

    @patch('encryption_check.scan_all_resources')
    def test_lambda_handler_scheduled_event(self, mock_scan, scheduled_event, mock_env):
        """Test lambda_handler with scheduled event"""
        mock_scan.return_value = None

        result = lambda_handler(scheduled_event, {})

        assert result['statusCode'] == 200
        assert 'Encryption compliance check completed' in result['body']
        mock_scan.assert_called_once()


class TestEvaluateResourceEncryption:
    """Tests for evaluate_resource_encryption function"""

    @patch('encryption_check.check_ec2_encryption')
    def test_evaluate_ec2_instance(self, mock_check, mock_env):
        """Test evaluation of EC2 instance"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'All volumes encrypted'}

        result = evaluate_resource_encryption('AWS::EC2::Instance', 'i-12345')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('i-12345')

    @patch('encryption_check.check_rds_encryption')
    def test_evaluate_rds_instance(self, mock_check, mock_env):
        """Test evaluation of RDS instance"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'Storage encrypted'}

        result = evaluate_resource_encryption('AWS::RDS::DBInstance', 'db-12345')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('db-12345')

    @patch('encryption_check.check_s3_encryption')
    def test_evaluate_s3_bucket(self, mock_check, mock_env):
        """Test evaluation of S3 bucket"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'Encryption enabled'}

        result = evaluate_resource_encryption('AWS::S3::Bucket', 'my-bucket')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('my-bucket')

    def test_evaluate_unsupported_resource_type(self, mock_env):
        """Test evaluation of unsupported resource type"""
        result = evaluate_resource_encryption('AWS::Lambda::Function', 'func-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'not supported' in result['message']

    @patch('encryption_check.check_ec2_encryption')
    def test_evaluate_with_exception(self, mock_check, mock_env):
        """Test evaluation when check raises exception"""
        mock_check.side_effect = Exception('Test error')

        result = evaluate_resource_encryption('AWS::EC2::Instance', 'i-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckEC2Encryption:
    """Tests for check_ec2_encryption function"""

    @patch('encryption_check.ec2_client')
    def test_check_ec2_encryption_all_encrypted(self, mock_ec2, mock_env):
        """Test EC2 instance with all volumes encrypted"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'BlockDeviceMappings': [
                        {'Ebs': {'VolumeId': 'vol-12345'}}
                    ]
                }]
            }]
        }
        mock_ec2.describe_volumes.return_value = {
            'Volumes': [{'VolumeId': 'vol-12345', 'Encrypted': True}]
        }

        result = check_ec2_encryption('i-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'All EC2 instance volumes are encrypted' in result['message']

    @patch('encryption_check.ec2_client')
    def test_check_ec2_encryption_unencrypted_volumes(self, mock_ec2, mock_env):
        """Test EC2 instance with unencrypted volumes"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'BlockDeviceMappings': [
                        {'Ebs': {'VolumeId': 'vol-12345'}}
                    ]
                }]
            }]
        }
        mock_ec2.describe_volumes.return_value = {
            'Volumes': [{'VolumeId': 'vol-12345', 'Encrypted': False}]
        }

        result = check_ec2_encryption('i-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'unencrypted volumes' in result['message']
        assert 'vol-12345' in result['message']

    @patch('encryption_check.ec2_client')
    def test_check_ec2_encryption_instance_not_found(self, mock_ec2, mock_env):
        """Test EC2 instance not found"""
        mock_ec2.describe_instances.return_value = {'Reservations': []}

        result = check_ec2_encryption('i-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'Instance not found' in result['message']

    @patch('encryption_check.ec2_client')
    def test_check_ec2_encryption_no_block_devices(self, mock_ec2, mock_env):
        """Test EC2 instance with no block device mappings"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'BlockDeviceMappings': []
                }]
            }]
        }

        result = check_ec2_encryption('i-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'All EC2 instance volumes are encrypted' in result['message']

    @patch('encryption_check.ec2_client')
    def test_check_ec2_encryption_exception(self, mock_ec2, mock_env):
        """Test EC2 encryption check with exception"""
        mock_ec2.describe_instances.side_effect = Exception('Test error')

        result = check_ec2_encryption('i-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']

    @patch('encryption_check.ec2_client')
    def test_check_ec2_encryption_no_volume_id(self, mock_ec2, mock_env):
        """Test EC2 instance with block device mapping but no volume ID"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'BlockDeviceMappings': [
                        {'Ebs': {}},  # Ebs key present but no VolumeId
                        {'DeviceName': '/dev/sdf'}  # No Ebs key at all
                    ]
                }]
            }]
        }

        result = check_ec2_encryption('i-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'All EC2 instance volumes are encrypted' in result['message']
        # describe_volumes should not be called if volume_id is None
        mock_ec2.describe_volumes.assert_not_called()

    @patch('encryption_check.ec2_client')
    def test_check_ec2_encryption_empty_volumes_response(self, mock_ec2, mock_env):
        """Test EC2 instance when describe_volumes returns empty list"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'BlockDeviceMappings': [
                        {'Ebs': {'VolumeId': 'vol-12345'}}
                    ]
                }]
            }]
        }
        # describe_volumes returns empty list (volume not found)
        mock_ec2.describe_volumes.return_value = {'Volumes': []}

        result = check_ec2_encryption('i-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'All EC2 instance volumes are encrypted' in result['message']
        mock_ec2.describe_volumes.assert_called_once_with(VolumeIds=['vol-12345'])


class TestCheckRDSEncryption:
    """Tests for check_rds_encryption function"""

    @patch('encryption_check.rds_client')
    def test_check_rds_encryption_encrypted(self, mock_rds, mock_env):
        """Test RDS instance with encryption enabled"""
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'db-12345',
                'StorageEncrypted': True
            }]
        }

        result = check_rds_encryption('db-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'RDS instance storage is encrypted' in result['message']

    @patch('encryption_check.rds_client')
    def test_check_rds_encryption_not_encrypted(self, mock_rds, mock_env):
        """Test RDS instance without encryption"""
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'db-12345',
                'StorageEncrypted': False
            }]
        }

        result = check_rds_encryption('db-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'storage is not encrypted' in result['message']

    @patch('encryption_check.rds_client')
    def test_check_rds_encryption_not_found(self, mock_rds, mock_env):
        """Test RDS instance not found"""
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}

        result = check_rds_encryption('db-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'DB instance not found' in result['message']

    @patch('encryption_check.rds_client')
    def test_check_rds_encryption_exception(self, mock_rds, mock_env):
        """Test RDS encryption check with exception"""
        mock_rds.describe_db_instances.side_effect = Exception('Test error')

        result = check_rds_encryption('db-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckS3Encryption:
    """Tests for check_s3_encryption function"""

    @patch('encryption_check.s3_client')
    def test_check_s3_encryption_enabled(self, mock_s3, mock_env):
        """Test S3 bucket with encryption enabled"""
        mock_s3.get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {
                'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]
            }
        }

        result = check_s3_encryption('my-bucket')

        assert result['status'] == 'COMPLIANT'
        assert 'encryption enabled' in result['message']

    @patch('encryption_check.s3_client')
    def test_check_s3_encryption_no_rules(self, mock_s3, mock_env):
        """Test S3 bucket with no encryption rules"""
        mock_s3.get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {'Rules': []}
        }

        result = check_s3_encryption('my-bucket')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'does not have encryption configured' in result['message']

    @patch('encryption_check.s3_client')
    def test_check_s3_encryption_not_found_error(self, mock_s3, mock_env):
        """Test S3 bucket with no encryption configuration"""
        mock_s3.exceptions.ServerSideEncryptionConfigurationNotFoundError = type('ServerSideEncryptionConfigurationNotFoundError', (Exception,), {})
        mock_s3.get_bucket_encryption.side_effect = mock_s3.exceptions.ServerSideEncryptionConfigurationNotFoundError()

        result = check_s3_encryption('my-bucket')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'does not have encryption configured' in result['message']

    @patch('encryption_check.s3_client')
    def test_check_s3_encryption_exception(self, mock_s3, mock_env):
        """Test S3 encryption check with generic exception"""
        # Mock the exceptions attribute
        mock_s3.exceptions = Mock()
        mock_s3.exceptions.ServerSideEncryptionConfigurationNotFoundError = type('ServerSideEncryptionConfigurationNotFoundError', (Exception,), {})
        mock_s3.get_bucket_encryption.side_effect = RuntimeError('Test error')

        result = check_s3_encryption('my-bucket')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestScanAllResources:
    """Tests for scan_all_resources function"""

    @patch('encryption_check.sns_client')
    @patch('encryption_check.rds_client')
    @patch('encryption_check.ec2_client')
    @patch('encryption_check.check_rds_encryption')
    @patch('encryption_check.check_ec2_encryption')
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
            'message': 'Unencrypted volumes'
        }
        mock_rds_check.return_value = {
            'status': 'NON_COMPLIANT',
            'message': 'Storage not encrypted'
        }

        scan_all_resources()

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'Encryption Compliance Alert' in call_args[1]['Subject']
        assert 'Found 2 non-compliant resources' in call_args[1]['Message']

    @patch('encryption_check.sns_client')
    @patch('encryption_check.rds_client')
    @patch('encryption_check.ec2_client')
    @patch('encryption_check.check_rds_encryption')
    @patch('encryption_check.check_ec2_encryption')
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
            'message': 'All encrypted'
        }
        mock_rds_check.return_value = {
            'status': 'COMPLIANT',
            'message': 'Encrypted'
        }

        scan_all_resources()

        mock_sns.publish.assert_not_called()

    @patch('encryption_check.sns_client')
    @patch('encryption_check.rds_client')
    @patch('encryption_check.ec2_client')
    def test_scan_all_resources_ec2_exception(self, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with EC2 exception"""
        mock_ec2.describe_instances.side_effect = Exception('EC2 error')
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}

        scan_all_resources()

        # Should not crash, just log error
        mock_sns.publish.assert_not_called()

    @patch('encryption_check.sns_client')
    @patch('encryption_check.rds_client')
    @patch('encryption_check.ec2_client')
    def test_scan_all_resources_rds_exception(self, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with RDS exception"""
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_rds.describe_db_instances.side_effect = Exception('RDS error')

        scan_all_resources()

        # Should not crash, just log error
        mock_sns.publish.assert_not_called()


class TestSendNotification:
    """Tests for send_notification function"""

    @patch('encryption_check.sns_client')
    def test_send_notification_success(self, mock_sns, mock_env):
        """Test successful notification sending"""
        mock_sns.publish.return_value = {'MessageId': 'msg-12345'}

        send_notification('AWS::EC2::Instance', 'i-12345', 'Unencrypted volumes')

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'Encryption Compliance Alert' in call_args[1]['Subject']
        assert 'i-12345' in call_args[1]['Message']

    @patch('encryption_check.sns_client')
    def test_send_notification_exception(self, mock_sns, mock_env):
        """Test notification sending with exception"""
        mock_sns.publish.side_effect = Exception('SNS error')

        # Should not crash, just log error
        send_notification('AWS::EC2::Instance', 'i-12345', 'Unencrypted volumes')

        mock_sns.publish.assert_called_once()
