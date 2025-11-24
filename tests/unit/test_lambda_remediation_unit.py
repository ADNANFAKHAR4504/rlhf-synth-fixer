"""test_lambda_remediation_unit.py
Unit tests for remediation Lambda function.
"""

import json
import os
import pytest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

# Set environment variables before importing
os.environ['ALERT_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
os.environ['ENVIRONMENT_SUFFIX'] = 'test'

# Import after setting environment variables
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda/remediation'))
import remediation


class TestRemediationLambda:
    """Unit tests for remediation Lambda function."""

    @patch('remediation.s3_client')
    def test_enable_s3_encryption_success(self, mock_s3):
        """Test successful S3 bucket encryption enablement."""
        mock_s3.put_bucket_encryption.return_value = {}

        result = remediation.enable_s3_encryption('test-bucket')

        assert result is True
        mock_s3.put_bucket_encryption.assert_called_once()

    @patch('remediation.s3_client')
    def test_enable_s3_encryption_failure(self, mock_s3):
        """Test failed S3 bucket encryption enablement."""
        mock_s3.put_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchBucket', 'Message': 'Bucket not found'}},
            'PutBucketEncryption'
        )

        result = remediation.enable_s3_encryption('test-bucket')

        assert result is False

    @patch('remediation.s3_client')
    def test_enable_s3_versioning_success(self, mock_s3):
        """Test successful S3 bucket versioning enablement."""
        mock_s3.put_bucket_versioning.return_value = {}

        result = remediation.enable_s3_versioning('test-bucket')

        assert result is True
        mock_s3.put_bucket_versioning.assert_called_once()

    @patch('remediation.s3_client')
    def test_enable_s3_versioning_failure(self, mock_s3):
        """Test failed S3 bucket versioning enablement."""
        mock_s3.put_bucket_versioning.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchBucket', 'Message': 'Bucket not found'}},
            'PutBucketVersioning'
        )

        result = remediation.enable_s3_versioning('test-bucket')

        assert result is False

    @patch('remediation.lambda_client')
    def test_enable_lambda_tracing_success(self, mock_lambda):
        """Test successful Lambda X-Ray tracing enablement."""
        mock_lambda.update_function_configuration.return_value = {}

        result = remediation.enable_lambda_tracing('test-function')

        assert result is True
        mock_lambda.update_function_configuration.assert_called_once()

    @patch('remediation.lambda_client')
    def test_enable_lambda_tracing_failure(self, mock_lambda):
        """Test failed Lambda X-Ray tracing enablement."""
        mock_lambda.update_function_configuration.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Function not found'}},
            'UpdateFunctionConfiguration'
        )

        result = remediation.enable_lambda_tracing('test-function')

        assert result is False

    @patch('remediation.sns_client')
    @patch('remediation.boto3.client')
    def test_send_remediation_alert_success(self, mock_boto3_client, mock_sns):
        """Test successful remediation alert sending."""
        mock_sts = MagicMock()
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_boto3_client.return_value = mock_sts

        mock_sns.publish.return_value = {}

        remediation.send_remediation_alert('AWS::S3::Bucket', 'test-bucket', 'Enable encryption', True)

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'SUCCESS' in call_args[1]['Subject']

    @patch('remediation.sns_client')
    @patch('remediation.boto3.client')
    def test_send_remediation_alert_failure_status(self, mock_boto3_client, mock_sns):
        """Test remediation alert with failure status."""
        mock_sts = MagicMock()
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_boto3_client.return_value = mock_sts

        mock_sns.publish.return_value = {}

        remediation.send_remediation_alert('AWS::S3::Bucket', 'test-bucket', 'Enable encryption', False)

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'FAILED' in call_args[1]['Subject']

    @patch('remediation.sns_client')
    @patch('remediation.boto3.client')
    def test_send_remediation_alert_sns_failure(self, mock_boto3_client, mock_sns):
        """Test remediation alert when SNS publish fails."""
        mock_sts = MagicMock()
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_boto3_client.return_value = mock_sts

        mock_sns.publish.side_effect = ClientError(
            {'Error': {'Code': 'NotFound', 'Message': 'Topic not found'}},
            'Publish'
        )

        # Should not raise exception
        remediation.send_remediation_alert('AWS::S3::Bucket', 'test-bucket', 'Enable encryption', True)

    @patch('remediation.send_remediation_alert')
    @patch('remediation.enable_s3_encryption')
    def test_handler_s3_encryption_remediation(self, mock_enable_encryption, mock_send_alert):
        """Test handler with S3 encryption remediation."""
        mock_enable_encryption.return_value = True

        event = {
            'detail': {
                'resource_type': 'S3Bucket',
                'resource_id': 'test-bucket',
                'check': 'EncryptionEnabled'
            }
        }
        context = {}

        result = remediation.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['success'] is True
        assert 'encryption' in body['action'].lower()
        mock_enable_encryption.assert_called_once_with('test-bucket')
        mock_send_alert.assert_called_once()

    @patch('remediation.send_remediation_alert')
    @patch('remediation.enable_s3_versioning')
    def test_handler_s3_versioning_remediation(self, mock_enable_versioning, mock_send_alert):
        """Test handler with S3 versioning remediation."""
        mock_enable_versioning.return_value = True

        event = {
            'detail': {
                'resource_type': 'S3Bucket',
                'resource_id': 'test-bucket',
                'check': 'VersioningEnabled'
            }
        }
        context = {}

        result = remediation.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['success'] is True
        assert 'versioning' in body['action'].lower()
        mock_enable_versioning.assert_called_once_with('test-bucket')
        mock_send_alert.assert_called_once()

    @patch('remediation.send_remediation_alert')
    @patch('remediation.enable_lambda_tracing')
    def test_handler_lambda_tracing_remediation(self, mock_enable_tracing, mock_send_alert):
        """Test handler with Lambda tracing remediation."""
        mock_enable_tracing.return_value = True

        event = {
            'detail': {
                'resource_type': 'LambdaFunction',
                'resource_id': 'test-function',
                'check': 'XRayTracingEnabled'
            }
        }
        context = {}

        result = remediation.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['success'] is True
        assert 'tracing' in body['action'].lower()
        mock_enable_tracing.assert_called_once_with('test-function')
        mock_send_alert.assert_called_once()

    @patch('remediation.send_remediation_alert')
    @patch('remediation.enable_s3_encryption')
    def test_handler_remediation_failure(self, mock_enable_encryption, mock_send_alert):
        """Test handler when remediation fails."""
        mock_enable_encryption.return_value = False

        event = {
            'detail': {
                'resource_type': 'S3Bucket',
                'resource_id': 'test-bucket',
                'check': 'EncryptionEnabled'
            }
        }
        context = {}

        result = remediation.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['success'] is False
        mock_send_alert.assert_called_once_with(
            'S3Bucket', 'test-bucket', 'Enable S3 encryption', False
        )

    def test_handler_no_remediation_available(self):
        """Test handler when no remediation is available for the violation."""
        event = {
            'detail': {
                'resource_type': 'VPC',
                'resource_id': 'vpc-1234567890',
                'check': 'FlowLogsEnabled'
            }
        }
        context = {}

        result = remediation.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert 'No remediation available' in body['message']

    def test_handler_missing_event_details(self):
        """Test handler with missing event details."""
        event = {}
        context = {}

        result = remediation.handler(event, context)

        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'Missing required parameters' in body['message']

    def test_handler_direct_invocation(self):
        """Test handler with direct invocation format (no detail wrapper)."""
        event = {
            'resource_type': 'S3Bucket',
            'resource_id': 'test-bucket',
            'check': 'EncryptionEnabled'
        }
        context = {}

        with patch('remediation.enable_s3_encryption') as mock_enable:
            with patch('remediation.send_remediation_alert'):
                mock_enable.return_value = True
                result = remediation.handler(event, context)

                assert result['statusCode'] == 200
                mock_enable.assert_called_once_with('test-bucket')
