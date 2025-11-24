"""test_lambda_scanner_unit.py
Unit tests for scanner Lambda function.
"""

import json
import os
import pytest
from unittest.mock import patch, MagicMock, ANY
from botocore.exceptions import ClientError

# Set environment variables before importing the module
os.environ['AUDIT_BUCKET'] = 'test-audit-bucket'
os.environ['ALERT_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
os.environ['ENVIRONMENT_SUFFIX'] = 'test'

# Import after setting environment variables
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda/scanner'))
import scanner


class TestScannerLambda:
    """Unit tests for scanner Lambda function."""

    @patch('scanner.s3_client')
    def test_check_s3_bucket_encryption_with_encryption(self, mock_s3):
        """Test S3 bucket encryption check when encryption is enabled."""
        mock_s3.list_buckets.return_value = {
            'Buckets': [
                {'Name': 'test-bucket-encrypted'}
            ]
        }
        mock_s3.get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {
                'Rules': [{
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'AES256'
                    }
                }]
            }
        }

        result = scanner.check_s3_bucket_encryption()

        assert len(result) == 1
        assert result[0]['resource_type'] == 'S3Bucket'
        assert result[0]['resource_id'] == 'test-bucket-encrypted'
        assert result[0]['compliant'] is True

    @patch('scanner.s3_client')
    def test_check_s3_bucket_encryption_without_encryption(self, mock_s3):
        """Test S3 bucket encryption check when encryption is not enabled."""
        mock_s3.list_buckets.return_value = {
            'Buckets': [
                {'Name': 'test-bucket-unencrypted'}
            ]
        }
        mock_s3.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError', 'Message': 'Not found'}},
            'GetBucketEncryption'
        )

        result = scanner.check_s3_bucket_encryption()

        assert len(result) == 1
        assert result[0]['compliant'] is False

    @patch('scanner.ec2_client')
    def test_check_vpc_flow_logs_enabled(self, mock_ec2):
        """Test VPC flow logs check when flow logs are enabled."""
        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [
                {'VpcId': 'vpc-12345'}
            ]
        }
        mock_ec2.describe_flow_logs.return_value = {
            'FlowLogs': [
                {'FlowLogId': 'fl-12345'}
            ]
        }

        result = scanner.check_vpc_flow_logs()

        assert len(result) == 1
        assert result[0]['resource_type'] == 'VPC'
        assert result[0]['resource_id'] == 'vpc-12345'
        assert result[0]['compliant'] is True

    @patch('scanner.ec2_client')
    def test_check_vpc_flow_logs_disabled(self, mock_ec2):
        """Test VPC flow logs check when flow logs are not enabled."""
        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [
                {'VpcId': 'vpc-67890'}
            ]
        }
        mock_ec2.describe_flow_logs.return_value = {
            'FlowLogs': []
        }

        result = scanner.check_vpc_flow_logs()

        assert len(result) == 1
        assert result[0]['compliant'] is False

    @patch('scanner.lambda_client')
    def test_check_lambda_settings_tracing_enabled(self, mock_lambda):
        """Test Lambda settings check when tracing is enabled."""
        mock_paginator = MagicMock()
        mock_lambda.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Functions': [
                    {
                        'FunctionName': 'test-function',
                        'TracingConfig': {'Mode': 'Active'},
                        'ReservedConcurrentExecutions': 5
                    }
                ]
            }
        ]

        result = scanner.check_lambda_settings()

        assert len(result) == 2  # Two checks per function
        assert result[0]['compliant'] is True  # Tracing enabled
        assert result[1]['compliant'] is True  # Reserved concurrency set

    @patch('scanner.lambda_client')
    def test_check_lambda_settings_tracing_disabled(self, mock_lambda):
        """Test Lambda settings check when tracing is not enabled."""
        mock_paginator = MagicMock()
        mock_lambda.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Functions': [
                    {
                        'FunctionName': 'test-function-2',
                        'TracingConfig': {'Mode': 'PassThrough'}
                    }
                ]
            }
        ]

        result = scanner.check_lambda_settings()

        assert len(result) == 2
        assert result[0]['compliant'] is False  # Tracing not enabled
        assert result[1]['compliant'] is False  # No reserved concurrency

    @patch('scanner.check_lambda_settings')
    @patch('scanner.check_vpc_flow_logs')
    @patch('scanner.check_s3_bucket_encryption')
    def test_get_compliance_summary(self, mock_s3_check, mock_vpc_check, mock_lambda_check):
        """Test compliance summary aggregation."""
        mock_s3_check.return_value = [
            {'compliant': True, 'resource_type': 'S3Bucket'},
            {'compliant': False, 'resource_type': 'S3Bucket'}
        ]
        mock_vpc_check.return_value = [
            {'compliant': True, 'resource_type': 'VPC'}
        ]
        mock_lambda_check.return_value = [
            {'compliant': False, 'resource_type': 'LambdaFunction'}
        ]

        result = scanner.get_compliance_summary()

        assert result['compliant'] == 2
        assert result['non_compliant'] == 2
        assert result['total_checks'] == 4
        assert len(result['checks']) == 4

    @patch('scanner.s3_client')
    def test_save_scan_results_success(self, mock_s3):
        """Test successful save of scan results to S3."""
        scan_data = {'test': 'data'}

        result = scanner.save_scan_results(scan_data)

        assert result is not None
        assert result.startswith('scans/')
        mock_s3.put_object.assert_called_once()

    @patch('scanner.s3_client')
    def test_save_scan_results_failure(self, mock_s3):
        """Test failed save of scan results to S3."""
        mock_s3.put_object.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'PutObject'
        )

        scan_data = {'test': 'data'}
        result = scanner.save_scan_results(scan_data)

        assert result is None

    @patch('scanner.sns_client')
    def test_send_alert_success(self, mock_sns):
        """Test successful alert sending."""
        scanner.send_alert('Test Subject', 'Test Message')

        mock_sns.publish.assert_called_once_with(
            TopicArn=os.environ['ALERT_TOPIC_ARN'],
            Subject='Test Subject',
            Message='Test Message'
        )

    @patch('scanner.sns_client')
    def test_send_alert_failure(self, mock_sns):
        """Test alert sending failure."""
        mock_sns.publish.side_effect = ClientError(
            {'Error': {'Code': 'NotFound', 'Message': 'Topic not found'}},
            'Publish'
        )

        # Should not raise exception
        scanner.send_alert('Test Subject', 'Test Message')

    @patch('scanner.events_client')
    def test_trigger_report_generation_success(self, mock_events):
        """Test successful report generation trigger."""
        scanner.trigger_report_generation('scans/2024-01-01/scan.json')

        mock_events.put_events.assert_called_once()
        call_args = mock_events.put_events.call_args
        assert call_args[1]['Entries'][0]['Source'] == 'compliance.audit'
        assert call_args[1]['Entries'][0]['DetailType'] == 'Compliance Scan Complete'

    @patch('scanner.events_client')
    def test_trigger_report_generation_failure(self, mock_events):
        """Test report generation trigger failure."""
        mock_events.put_events.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Invalid event'}},
            'PutEvents'
        )

        # Should not raise exception
        scanner.trigger_report_generation('scans/2024-01-01/scan.json')

    @patch('scanner.trigger_report_generation')
    @patch('scanner.send_alert')
    @patch('scanner.save_scan_results')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_compliant(
        self, mock_sts, mock_get_compliance, mock_save, mock_send_alert, mock_trigger
    ):
        """Test handler with all compliant checks."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_get_compliance.return_value = {
            'compliant': 10,
            'non_compliant': 0,
            'total_checks': 10,
            'checks': []
        }
        mock_save.return_value = 'scans/2024-01-01/scan.json'

        event = {}
        context = {}

        result = scanner.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['total_non_compliant'] == 0
        mock_send_alert.assert_not_called()
        mock_trigger.assert_called_once()

    @patch('scanner.trigger_report_generation')
    @patch('scanner.send_alert')
    @patch('scanner.save_scan_results')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_non_compliant(
        self, mock_sts, mock_get_compliance, mock_save, mock_send_alert, mock_trigger
    ):
        """Test handler with non-compliant checks."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_get_compliance.return_value = {
            'compliant': 5,
            'non_compliant': 3,
            'total_checks': 8,
            'checks': []
        }
        mock_save.return_value = 'scans/2024-01-01/scan.json'

        event = {}
        context = {}

        result = scanner.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['total_non_compliant'] == 3
        mock_send_alert.assert_called_once()
        mock_trigger.assert_called_once()

    @patch('scanner.save_scan_results')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_save_failure_no_report_trigger(
        self, mock_sts, mock_get_compliance, mock_save
    ):
        """Test handler when save fails, report is not triggered."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_get_compliance.return_value = {
            'compliant': 10,
            'non_compliant': 0,
            'total_checks': 10,
            'checks': []
        }
        mock_save.return_value = None

        with patch('scanner.trigger_report_generation') as mock_trigger:
            event = {}
            context = {}

            result = scanner.handler(event, context)

            assert result['statusCode'] == 200
            mock_trigger.assert_not_called()
