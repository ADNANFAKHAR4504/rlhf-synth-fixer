"""Unit tests for Lambda remediation functions."""
import os
import sys
import json
from unittest.mock import Mock, patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from botocore.exceptions import ClientError

from lib.lambda_remediation import (
    lambda_handler,
    remediate_s3_versioning,
    remediate_s3_encryption,
    report_to_config
)


class TestLambdaRemediation:
    """Test suite for Lambda remediation functions."""

    def setup_method(self):
        """Reset environment before each test."""
        os.environ.pop('KMS_KEY_ID', None)

    @patch('lib.lambda_remediation.s3_client')
    @patch('lib.lambda_remediation.config_client')
    def test_lambda_handler_versioning_success(self, mock_config, mock_s3):
        """Test successful versioning remediation."""
        event = {
            'configRuleName': 's3-bucket-versioning-enabled',
            'configRuleInvokingEvent': {
                'configurationItem': {
                    'resourceType': 'AWS::S3::Bucket',
                    'resourceId': 'test-bucket'
                }
            },
            'resultToken': 'test-token'
        }

        mock_s3.put_bucket_versioning.return_value = {}
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(event, None)

        assert result['statusCode'] == 200
        assert 'Remediation completed' in result['body']
        mock_s3.put_bucket_versioning.assert_called_once()
        mock_config.put_evaluations.assert_called_once()

    @patch('lib.lambda_remediation.s3_client')
    @patch('lib.lambda_remediation.config_client')
    def test_lambda_handler_encryption_success(self, mock_config, mock_s3):
        """Test successful encryption remediation."""
        os.environ['KMS_KEY_ID'] = 'test-kms-key'

        event = {
            'configRuleName': 's3-bucket-server-side-encryption',
            'configRuleInvokingEvent': {
                'configurationItem': {
                    'resourceType': 'AWS::S3::Bucket',
                    'resourceId': 'test-bucket'
                }
            },
            'resultToken': 'test-token'
        }

        mock_s3.put_bucket_encryption.return_value = {}
        mock_config.put_evaluations.return_value = {}

        result = lambda_handler(event, None)

        assert result['statusCode'] == 200
        assert 'Remediation completed' in result['body']
        mock_s3.put_bucket_encryption.assert_called_once()
        mock_config.put_evaluations.assert_called_once()

    def test_lambda_handler_no_resource_id(self):
        """Test handler with missing resource ID."""
        event = {
            'configRuleName': 's3-bucket-versioning-enabled',
            'configRuleInvokingEvent': {
                'configurationItem': {}
            }
        }

        result = lambda_handler(event, None)

        assert result['statusCode'] == 400
        assert 'No resource ID found' in result['body']

    def test_lambda_handler_unknown_rule(self):
        """Test handler with unknown rule type."""
        event = {
            'configRuleName': 'unknown-rule',
            'configRuleInvokingEvent': {
                'configurationItem': {
                    'resourceType': 'AWS::S3::Bucket',
                    'resourceId': 'test-bucket'
                }
            }
        }

        result = lambda_handler(event, None)

        assert result['statusCode'] == 400
        assert 'Unknown remediation type' in result['body']

    @patch('lib.lambda_remediation.s3_client')
    def test_lambda_handler_exception(self, mock_s3):
        """Test handler with exception."""
        event = {
            'configRuleName': 's3-bucket-versioning-enabled',
            'configRuleInvokingEvent': {
                'configurationItem': {
                    'resourceType': 'AWS::S3::Bucket',
                    'resourceId': 'test-bucket'
                }
            }
        }

        mock_s3.put_bucket_versioning.side_effect = Exception("Test error")

        result = lambda_handler(event, None)

        assert result['statusCode'] == 500
        assert 'Error' in result['body']

    @patch('lib.lambda_remediation.s3_client')
    def test_remediate_s3_versioning_success(self, mock_s3):
        """Test successful S3 versioning remediation."""
        mock_s3.put_bucket_versioning.return_value = {}

        result = remediate_s3_versioning('test-bucket')

        assert result['compliance_type'] == 'COMPLIANT'
        assert 'Versioning enabled' in result['annotation']
        mock_s3.put_bucket_versioning.assert_called_once_with(
            Bucket='test-bucket',
            VersioningConfiguration={'Status': 'Enabled'}
        )

    @patch('lib.lambda_remediation.s3_client')
    def test_remediate_s3_versioning_no_such_bucket(self, mock_s3):
        """Test versioning remediation with non-existent bucket."""
        error_response = {'Error': {'Code': 'NoSuchBucket'}}
        mock_s3.put_bucket_versioning.side_effect = ClientError(
            error_response, 'PutBucketVersioning'
        )

        result = remediate_s3_versioning('test-bucket')

        assert result['compliance_type'] == 'NOT_APPLICABLE'
        assert 'does not exist' in result['annotation']

    @patch('lib.lambda_remediation.s3_client')
    def test_remediate_s3_versioning_access_denied(self, mock_s3):
        """Test versioning remediation with access denied."""
        error_response = {'Error': {'Code': 'AccessDenied'}}
        mock_s3.put_bucket_versioning.side_effect = ClientError(
            error_response, 'PutBucketVersioning'
        )

        result = remediate_s3_versioning('test-bucket')

        assert result['compliance_type'] == 'NON_COMPLIANT'
        assert 'Failed to enable versioning' in result['annotation']

    @patch('lib.lambda_remediation.s3_client')
    def test_remediate_s3_encryption_success(self, mock_s3):
        """Test successful S3 encryption remediation."""
        os.environ['KMS_KEY_ID'] = 'test-kms-key'
        mock_s3.put_bucket_encryption.return_value = {}

        result = remediate_s3_encryption('test-bucket')

        assert result['compliance_type'] == 'COMPLIANT'
        assert 'Encryption enabled' in result['annotation']
        mock_s3.put_bucket_encryption.assert_called_once()

    @patch('lib.lambda_remediation.s3_client')
    def test_remediate_s3_encryption_no_kms_key(self, mock_s3):
        """Test encryption remediation without KMS key."""
        mock_s3.put_bucket_encryption.return_value = {}

        result = remediate_s3_encryption('test-bucket')

        assert result['compliance_type'] == 'COMPLIANT'
        assert 'Encryption enabled' in result['annotation']

    @patch('lib.lambda_remediation.s3_client')
    def test_remediate_s3_encryption_no_such_bucket(self, mock_s3):
        """Test encryption remediation with non-existent bucket."""
        error_response = {'Error': {'Code': 'NoSuchBucket'}}
        mock_s3.put_bucket_encryption.side_effect = ClientError(
            error_response, 'PutBucketEncryption'
        )

        result = remediate_s3_encryption('test-bucket')

        assert result['compliance_type'] == 'NOT_APPLICABLE'
        assert 'does not exist' in result['annotation']

    @patch('lib.lambda_remediation.s3_client')
    def test_remediate_s3_encryption_access_denied(self, mock_s3):
        """Test encryption remediation with access denied."""
        error_response = {'Error': {'Code': 'AccessDenied'}}
        mock_s3.put_bucket_encryption.side_effect = ClientError(
            error_response, 'PutBucketEncryption'
        )

        result = remediate_s3_encryption('test-bucket')

        assert result['compliance_type'] == 'NON_COMPLIANT'
        assert 'Failed to enable encryption' in result['annotation']

    @patch('lib.lambda_remediation.config_client')
    def test_report_to_config_success(self, mock_config):
        """Test successful Config reporting."""
        event = {
            'resultToken': 'test-token',
            'configRuleInvokingEvent': {
                'configurationItem': {
                    'resourceType': 'AWS::S3::Bucket',
                    'resourceId': 'test-bucket',
                    'configurationItemCaptureTime': '2024-01-01T00:00:00Z'
                }
            }
        }
        result = {
            'compliance_type': 'COMPLIANT',
            'annotation': 'Test annotation'
        }

        mock_config.put_evaluations.return_value = {}

        report_to_config(event, result)

        mock_config.put_evaluations.assert_called_once()
        call_args = mock_config.put_evaluations.call_args
        assert call_args[1]['ResultToken'] == 'test-token'
        assert len(call_args[1]['Evaluations']) == 1
        assert call_args[1]['Evaluations'][0]['ComplianceType'] == 'COMPLIANT'

    def test_report_to_config_no_result_token(self):
        """Test Config reporting without result token."""
        event = {'configRuleInvokingEvent': {}}
        result = {'compliance_type': 'COMPLIANT', 'annotation': 'Test'}

        # Should not raise exception
        report_to_config(event, result)

    @patch('lib.lambda_remediation.config_client')
    def test_report_to_config_exception(self, mock_config):
        """Test Config reporting with exception."""
        event = {
            'resultToken': 'test-token',
            'configRuleInvokingEvent': {
                'configurationItem': {
                    'resourceType': 'AWS::S3::Bucket',
                    'resourceId': 'test-bucket'
                }
            }
        }
        result = {'compliance_type': 'COMPLIANT', 'annotation': 'Test'}

        mock_config.put_evaluations.side_effect = Exception("Test error")

        # Should not raise exception
        report_to_config(event, result)
