"""Unit Tests for S3 Security Auditor"""

import sys
import os
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import S3SecurityAuditor, Finding


class TestS3SecurityAuditor:
    """Test suite for S3SecurityAuditor class"""

    @patch('analyze_s3_security.boto3.client')
    def test_initialization(self, mock_boto_client):
        """Test that auditor initializes correctly"""
        auditor = S3SecurityAuditor(region='us-east-1')

        assert auditor.region == 'us-east-1'
        assert auditor.findings == []
        assert auditor.bucket_cache == {}

    @patch('analyze_s3_security.boto3.client')
    def test_bucket_filtering(self, mock_boto_client):
        """Test bucket filtering logic"""
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Mock buckets with different creation dates
        recent_date = datetime.now(timezone.utc) - timedelta(days=30)
        old_date = datetime.now(timezone.utc) - timedelta(days=90)

        mock_s3_client.list_buckets.return_value = {
            'Buckets': [
                {'Name': 'recent-bucket', 'CreationDate': recent_date},
                {'Name': 'old-bucket', 'CreationDate': old_date},
                {'Name': 'temp-bucket', 'CreationDate': old_date}
            ]
        }

        auditor = S3SecurityAuditor()
        buckets = auditor._get_buckets_to_audit()

        assert len(buckets) == 1
        assert buckets[0]['Name'] == 'old-bucket'

    @patch('analyze_s3_security.boto3.client')
    def test_public_access_detection(self, mock_boto_client):
        """Test public access detection"""
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Set up exceptions
        mock_s3_client.exceptions = MagicMock()
        mock_s3_client.exceptions.NoSuchBucketPolicy = ClientError

        # Mock ACL with public access
        mock_s3_client.get_bucket_acl.return_value = {
            'Grants': [{
                'Grantee': {
                    'Type': 'Group',
                    'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'
                },
                'Permission': 'READ'
            }]
        }

        # Mock bucket policy to raise NoSuchBucketPolicy
        mock_s3_client.get_bucket_policy.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchBucketPolicy'}}, 'GetBucketPolicy'
        )

        auditor = S3SecurityAuditor()
        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}
        auditor._check_public_access('test-bucket')

        assert len(auditor.findings) == 1
        assert auditor.findings[0].issue_type == 'PUBLIC_ACCESS'
        assert auditor.findings[0].severity == 'CRITICAL'

    @patch('analyze_s3_security.boto3.client')
    def test_encryption_check(self, mock_boto_client):
        """Test encryption requirement detection"""
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Set up exceptions
        mock_s3_client.exceptions = MagicMock()
        mock_s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError = ClientError

        # Mock missing encryption
        mock_s3_client.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFound'}}, 'GetBucketEncryption'
        )

        auditor = S3SecurityAuditor()
        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}
        auditor._check_encryption('test-bucket')

        assert len(auditor.findings) == 1
        assert auditor.findings[0].issue_type == 'NO_ENCRYPTION'

    @patch('analyze_s3_security.boto3.client')
    def test_secure_transport_check(self, mock_boto_client):
        """Test SSL/TLS enforcement detection"""
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Set up exceptions
        mock_s3_client.exceptions = MagicMock()
        mock_s3_client.exceptions.NoSuchBucketPolicy = ClientError

        # Mock policy without secure transport
        mock_s3_client.get_bucket_policy.return_value = {
            'Policy': json.dumps({
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': 's3:GetObject'
                    # Missing aws:SecureTransport condition
                }]
            })
        }

        auditor = S3SecurityAuditor()
        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}
        auditor._check_secure_transport('test-bucket')

        assert len(auditor.findings) == 1
        assert auditor.findings[0].issue_type == 'NO_SECURE_TRANSPORT'

    @patch('analyze_s3_security.boto3.client')
    def test_compliance_summary(self, mock_boto_client):
        """Test compliance summary generation"""
        auditor = S3SecurityAuditor()

        # Add mock findings
        auditor.findings = [
            Finding('bucket1', 'arn:aws:s3:::bucket1', 'PUBLIC_ACCESS', 'CRITICAL', ['SOC2'], '', '', ''),
            Finding('bucket2', 'arn:aws:s3:::bucket2', 'NO_ENCRYPTION', 'HIGH', ['SOC2'], '', '', '')
        ]

        audited_buckets = [
            {'Name': 'bucket1'},
            {'Name': 'bucket2'},
            {'Name': 'bucket3'}
        ]

        summary = auditor._generate_compliance_summary(audited_buckets)

        assert summary['total_buckets_audited'] == 3
        assert summary['compliant_buckets'] == 1
        assert summary['non_compliant_buckets'] == 2
        assert summary['findings_by_severity']['CRITICAL'] == 1
        assert summary['findings_by_severity']['HIGH'] == 1

    @patch('analyze_s3_security.boto3.client')
    def test_error_handling(self, mock_boto_client):
        """Test graceful error handling"""
        from botocore.exceptions import ClientError

        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Mock client error
        mock_s3_client.get_bucket_acl.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'GetBucketAcl'
        )

        auditor = S3SecurityAuditor()
        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        # Should not raise exception
        auditor._check_public_access('test-bucket')
        assert len(auditor.findings) == 0  # Errors don't create findings
