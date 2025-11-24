import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import sys
import os

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

from backup_check import (
    lambda_handler,
    evaluate_resource_backup,
    check_ec2_backup,
    check_rds_backup,
    check_s3_backup,
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

    @patch('backup_check.evaluate_resource_backup')
    @patch('backup_check.config_client')
    @patch('backup_check.send_notification')
    def test_lambda_handler_config_rule_compliant(self, mock_send_notif, mock_config, mock_evaluate, config_rule_event, mock_env):
        """Test lambda_handler with compliant Config rule event"""
        mock_evaluate.return_value = {
            'status': 'COMPLIANT',
            'message': 'Backup configured'
        }
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(config_rule_event, {})

        assert result['statusCode'] == 200
        assert 'Backup compliance check completed' in result['body']
        mock_evaluate.assert_called_once_with('AWS::EC2::Instance', 'i-1234567890abcdef0')
        mock_config.put_evaluations.assert_called_once()
        mock_send_notif.assert_not_called()

    @patch('backup_check.evaluate_resource_backup')
    @patch('backup_check.config_client')
    @patch('backup_check.send_notification')
    def test_lambda_handler_config_rule_non_compliant(self, mock_send_notif, mock_config, mock_evaluate, config_rule_event, mock_env):
        """Test lambda_handler with non-compliant Config rule event"""
        mock_evaluate.return_value = {
            'status': 'NON_COMPLIANT',
            'message': 'No backup configured'
        }
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(config_rule_event, {})

        assert result['statusCode'] == 200
        mock_evaluate.assert_called_once()
        mock_config.put_evaluations.assert_called_once()
        mock_send_notif.assert_called_once_with('AWS::EC2::Instance', 'i-1234567890abcdef0', 'No backup configured')

    @patch('backup_check.scan_all_resources')
    def test_lambda_handler_scheduled_event(self, mock_scan, scheduled_event, mock_env):
        """Test lambda_handler with scheduled event"""
        mock_scan.return_value = None

        result = lambda_handler(scheduled_event, {})

        assert result['statusCode'] == 200
        assert 'Backup compliance check completed' in result['body']
        mock_scan.assert_called_once()


class TestEvaluateResourceBackup:
    """Tests for evaluate_resource_backup function"""

    @patch('backup_check.check_ec2_backup')
    def test_evaluate_ec2_instance(self, mock_check, mock_env):
        """Test evaluation of EC2 instance"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'Backup configured'}

        result = evaluate_resource_backup('AWS::EC2::Instance', 'i-12345')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('i-12345')

    @patch('backup_check.check_rds_backup')
    def test_evaluate_rds_instance(self, mock_check, mock_env):
        """Test evaluation of RDS instance"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'Backup configured'}

        result = evaluate_resource_backup('AWS::RDS::DBInstance', 'db-12345')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('db-12345')

    @patch('backup_check.check_s3_backup')
    def test_evaluate_s3_bucket(self, mock_check, mock_env):
        """Test evaluation of S3 bucket"""
        mock_check.return_value = {'status': 'COMPLIANT', 'message': 'Versioning enabled'}

        result = evaluate_resource_backup('AWS::S3::Bucket', 'my-bucket')

        assert result['status'] == 'COMPLIANT'
        mock_check.assert_called_once_with('my-bucket')

    def test_evaluate_unsupported_resource_type(self, mock_env):
        """Test evaluation of unsupported resource type"""
        result = evaluate_resource_backup('AWS::Lambda::Function', 'func-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'not supported' in result['message']

    @patch('backup_check.check_ec2_backup')
    def test_evaluate_with_exception(self, mock_check, mock_env):
        """Test evaluation when check raises exception"""
        mock_check.side_effect = Exception('Test error')

        result = evaluate_resource_backup('AWS::EC2::Instance', 'i-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckEC2Backup:
    """Tests for check_ec2_backup function"""

    @patch('backup_check.ec2_client')
    def test_check_ec2_backup_with_tag_and_snapshots(self, mock_ec2, mock_env):
        """Test EC2 instance with backup tag and recent snapshots"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': [{'Key': 'Backup', 'Value': 'true'}],
                    'BlockDeviceMappings': [
                        {'Ebs': {'VolumeId': 'vol-12345'}}
                    ]
                }]
            }]
        }
        mock_ec2.describe_snapshots.return_value = {
            'Snapshots': [{
                'SnapshotId': 'snap-12345',
                'StartTime': datetime.utcnow(),
                'Status': 'completed'
            }]
        }

        result = check_ec2_backup('i-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'recent snapshots' in result['message']

    @patch('backup_check.ec2_client')
    def test_check_ec2_backup_no_backup_tag(self, mock_ec2, mock_env):
        """Test EC2 instance without backup tag"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': []
                }]
            }]
        }

        result = check_ec2_backup('i-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'does not have Backup tag set to true' in result['message']

    @patch('backup_check.ec2_client')
    def test_check_ec2_backup_tag_false(self, mock_ec2, mock_env):
        """Test EC2 instance with backup tag set to false"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': [{'Key': 'Backup', 'Value': 'false'}]
                }]
            }]
        }

        result = check_ec2_backup('i-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'does not have Backup tag set to true' in result['message']

    @patch('backup_check.ec2_client')
    def test_check_ec2_backup_no_recent_snapshots(self, mock_ec2, mock_env):
        """Test EC2 instance with backup tag but no recent snapshots"""
        old_date = datetime.utcnow() - timedelta(days=10)
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': [{'Key': 'Backup', 'Value': 'true'}],
                    'BlockDeviceMappings': [
                        {'Ebs': {'VolumeId': 'vol-12345'}}
                    ]
                }]
            }]
        }
        mock_ec2.describe_snapshots.return_value = {
            'Snapshots': [{
                'SnapshotId': 'snap-12345',
                'StartTime': old_date,
                'Status': 'completed'
            }]
        }

        result = check_ec2_backup('i-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'has no recent snapshots' in result['message']

    @patch('backup_check.ec2_client')
    def test_check_ec2_backup_no_volumes(self, mock_ec2, mock_env):
        """Test EC2 instance with backup tag but no volumes"""
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345',
                    'Tags': [{'Key': 'Backup', 'Value': 'true'}],
                    'BlockDeviceMappings': []
                }]
            }]
        }

        result = check_ec2_backup('i-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'no volumes to check' in result['message']

    @patch('backup_check.ec2_client')
    def test_check_ec2_backup_instance_not_found(self, mock_ec2, mock_env):
        """Test EC2 instance not found"""
        mock_ec2.describe_instances.return_value = {'Reservations': []}

        result = check_ec2_backup('i-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'Instance not found' in result['message']

    @patch('backup_check.ec2_client')
    def test_check_ec2_backup_exception(self, mock_ec2, mock_env):
        """Test EC2 backup check with exception"""
        mock_ec2.describe_instances.side_effect = Exception('Test error')

        result = check_ec2_backup('i-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckRDSBackup:
    """Tests for check_rds_backup function"""

    @patch('backup_check.rds_client')
    def test_check_rds_backup_enabled(self, mock_rds, mock_env):
        """Test RDS instance with automated backups enabled"""
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'db-12345',
                'BackupRetentionPeriod': 7
            }]
        }

        result = check_rds_backup('db-12345')

        assert result['status'] == 'COMPLIANT'
        assert 'automated backups enabled' in result['message']
        assert '7 days retention' in result['message']

    @patch('backup_check.rds_client')
    def test_check_rds_backup_disabled(self, mock_rds, mock_env):
        """Test RDS instance with backups disabled"""
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'db-12345',
                'BackupRetentionPeriod': 0
            }]
        }

        result = check_rds_backup('db-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'does not have automated backups enabled' in result['message']

    @patch('backup_check.rds_client')
    def test_check_rds_backup_insufficient_retention(self, mock_rds, mock_env):
        """Test RDS instance with insufficient backup retention"""
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'db-12345',
                'BackupRetentionPeriod': 3
            }]
        }

        result = check_rds_backup('db-12345')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'backup retention period (3 days) is less than 7 days' in result['message']

    @patch('backup_check.rds_client')
    def test_check_rds_backup_not_found(self, mock_rds, mock_env):
        """Test RDS instance not found"""
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}

        result = check_rds_backup('db-12345')

        assert result['status'] == 'NOT_APPLICABLE'
        assert 'DB instance not found' in result['message']

    @patch('backup_check.rds_client')
    def test_check_rds_backup_exception(self, mock_rds, mock_env):
        """Test RDS backup check with exception"""
        mock_rds.describe_db_instances.side_effect = Exception('Test error')

        result = check_rds_backup('db-12345')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestCheckS3Backup:
    """Tests for check_s3_backup function"""

    @patch('backup_check.s3_client')
    def test_check_s3_backup_versioning_enabled(self, mock_s3, mock_env):
        """Test S3 bucket with versioning enabled"""
        mock_s3.get_bucket_versioning.return_value = {
            'Status': 'Enabled'
        }

        result = check_s3_backup('my-bucket')

        assert result['status'] == 'COMPLIANT'
        assert 'versioning enabled' in result['message']

    @patch('backup_check.s3_client')
    def test_check_s3_backup_versioning_disabled(self, mock_s3, mock_env):
        """Test S3 bucket with versioning disabled"""
        mock_s3.get_bucket_versioning.return_value = {
            'Status': 'Disabled'
        }

        result = check_s3_backup('my-bucket')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'does not have versioning enabled' in result['message']

    @patch('backup_check.s3_client')
    def test_check_s3_backup_no_versioning_status(self, mock_s3, mock_env):
        """Test S3 bucket with no versioning status"""
        mock_s3.get_bucket_versioning.return_value = {}

        result = check_s3_backup('my-bucket')

        assert result['status'] == 'NON_COMPLIANT'
        assert 'does not have versioning enabled' in result['message']

    @patch('backup_check.s3_client')
    def test_check_s3_backup_exception(self, mock_s3, mock_env):
        """Test S3 backup check with exception"""
        mock_s3.get_bucket_versioning.side_effect = Exception('Test error')

        result = check_s3_backup('my-bucket')

        assert result['status'] == 'INSUFFICIENT_DATA'
        assert 'Test error' in result['message']


class TestScanAllResources:
    """Tests for scan_all_resources function"""

    @patch('backup_check.sns_client')
    @patch('backup_check.rds_client')
    @patch('backup_check.ec2_client')
    @patch('backup_check.check_rds_backup')
    @patch('backup_check.check_ec2_backup')
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
            'message': 'No backup'
        }
        mock_rds_check.return_value = {
            'status': 'NON_COMPLIANT',
            'message': 'No backup'
        }

        scan_all_resources()

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'Backup Compliance Alert' in call_args[1]['Subject']
        assert 'Found 2 non-compliant resources' in call_args[1]['Message']

    @patch('backup_check.sns_client')
    @patch('backup_check.rds_client')
    @patch('backup_check.ec2_client')
    @patch('backup_check.check_rds_backup')
    @patch('backup_check.check_ec2_backup')
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
            'message': 'Backup configured'
        }
        mock_rds_check.return_value = {
            'status': 'COMPLIANT',
            'message': 'Backup configured'
        }

        scan_all_resources()

        mock_sns.publish.assert_not_called()

    @patch('backup_check.sns_client')
    @patch('backup_check.rds_client')
    @patch('backup_check.ec2_client')
    def test_scan_all_resources_ec2_exception(self, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with EC2 exception"""
        mock_ec2.describe_instances.side_effect = Exception('EC2 error')
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}

        scan_all_resources()

        # Should not crash, just log error
        mock_sns.publish.assert_not_called()

    @patch('backup_check.sns_client')
    @patch('backup_check.rds_client')
    @patch('backup_check.ec2_client')
    def test_scan_all_resources_rds_exception(self, mock_ec2, mock_rds, mock_sns, mock_env):
        """Test scanning all resources with RDS exception"""
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_rds.describe_db_instances.side_effect = Exception('RDS error')

        scan_all_resources()

        # Should not crash, just log error
        mock_sns.publish.assert_not_called()


class TestSendNotification:
    """Tests for send_notification function"""

    @patch('backup_check.sns_client')
    def test_send_notification_success(self, mock_sns, mock_env):
        """Test successful notification sending"""
        mock_sns.publish.return_value = {'MessageId': 'msg-12345'}

        send_notification('AWS::EC2::Instance', 'i-12345', 'No backup configured')

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'Backup Compliance Alert' in call_args[1]['Subject']
        assert 'i-12345' in call_args[1]['Message']

    @patch('backup_check.sns_client')
    def test_send_notification_exception(self, mock_sns, mock_env):
        """Test notification sending with exception"""
        mock_sns.publish.side_effect = Exception('SNS error')

        # Should not crash, just log error
        send_notification('AWS::EC2::Instance', 'i-12345', 'No backup configured')

        mock_sns.publish.assert_called_once()
