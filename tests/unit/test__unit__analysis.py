"""Unit Tests for S3 Security Auditor"""

import sys
import os
import json
import subprocess
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError

import pytest
import boto3
from moto import mock_aws

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import S3SecurityAuditor, Finding


class TestS3SecurityAuditor:
    """Test suite for S3SecurityAuditor class"""

    @patch('analyse.boto3.client')
    def test_initialization(self, mock_boto_client):
        """Test that auditor initializes correctly"""
        auditor = S3SecurityAuditor(region='us-east-1')

        assert auditor.region == 'us-east-1'
        assert auditor.findings == []
        assert auditor.bucket_cache == {}

    @patch('analyse.boto3.client')
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

    @patch('analyse.boto3.client')
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

    @patch('analyse.boto3.client')
    def test_encryption_checks(self, mock_boto_client):
        """Test encryption requirement detection"""
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Set up exceptions
        mock_s3_client.exceptions = MagicMock()
        mock_s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError = ClientError

        # Mock missing encryption
        mock_s3_client.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError'}}, 'GetBucketEncryption'
        )

        auditor = S3SecurityAuditor()
        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}
        auditor._check_encryption('test-bucket')

        assert len(auditor.findings) == 1
        assert auditor.findings[0].issue_type == 'NO_ENCRYPTION'

    @patch('analyse.boto3.client')
    def test_secure_transport_validation(self, mock_boto_client):
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

    @patch('analyse.boto3.client')
    def test_compliance_summary_generation(self, mock_boto_client):
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

    @patch('analyse.boto3.client')
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


# =========================================================================
# INTEGRATION TESTS (Using Moto for full AWS simulation)
# =========================================================================

def boto_client(service: str):
    """Helper to get boto3 client configured for testing"""
    # Don't set endpoint_url when using moto - let moto handle it
    return boto3.client(
        service,
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
    )


def setup_public_bucket():
    """Create a bucket with public access for testing"""
    # Temporarily clear AWS_ENDPOINT_URL to use moto
    old_endpoint = os.environ.get('AWS_ENDPOINT_URL')
    if 'AWS_ENDPOINT_URL' in os.environ:
        del os.environ['AWS_ENDPOINT_URL']

    try:
        s3 = boto3.client(
            "s3",
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

        # Create bucket
        s3.create_bucket(Bucket="public-test-bucket")

        # Set public ACL
        s3.put_bucket_acl(
            Bucket="public-test-bucket",
            ACL="public-read"
        )
    except Exception as e:
        print(f"Error creating public bucket: {e}")
    finally:
        # Restore environment variable
        if old_endpoint:
            os.environ['AWS_ENDPOINT_URL'] = old_endpoint


def setup_unencrypted_bucket():
    """Create a bucket without encryption for testing"""
    # Temporarily clear AWS_ENDPOINT_URL to use moto
    old_endpoint = os.environ.get('AWS_ENDPOINT_URL')
    if 'AWS_ENDPOINT_URL' in os.environ:
        del os.environ['AWS_ENDPOINT_URL']

    try:
        s3 = boto3.client(
            "s3",
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

        # Create bucket without encryption
        s3.create_bucket(Bucket="unencrypted-test-bucket")
    except Exception as e:
        print(f"Error creating unencrypted bucket: {e}")
    finally:
        # Restore environment variable
        if old_endpoint:
            os.environ['AWS_ENDPOINT_URL'] = old_endpoint


def setup_bucket_without_secure_transport():
    """Create a bucket without secure transport policy"""
    # Temporarily clear AWS_ENDPOINT_URL to use moto
    old_endpoint = os.environ.get('AWS_ENDPOINT_URL')
    if 'AWS_ENDPOINT_URL' in os.environ:
        del os.environ['AWS_ENDPOINT_URL']

    try:
        s3 = boto3.client(
            "s3",
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

        # Create bucket
        s3.create_bucket(Bucket="insecure-test-bucket")

        # Set policy without secure transport requirement
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject"
                    # Missing aws:SecureTransport condition
                }
            ]
        }

        s3.put_bucket_policy(
            Bucket="insecure-test-bucket",
            Policy=json.dumps(policy)
        )
    except Exception as e:
        print(f"Error creating insecure bucket: {e}")
    finally:
        # Restore environment variable
        if old_endpoint:
            os.environ['AWS_ENDPOINT_URL'] = old_endpoint


def setup_compliant_bucket():
    """Create a fully compliant bucket for testing"""
    # Temporarily clear AWS_ENDPOINT_URL to use moto
    old_endpoint = os.environ.get('AWS_ENDPOINT_URL')
    if 'AWS_ENDPOINT_URL' in os.environ:
        del os.environ['AWS_ENDPOINT_URL']

    try:
        s3 = boto3.client(
            "s3",
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

        # Create bucket
        s3.create_bucket(Bucket="compliant-test-bucket")

        # Set encryption
        s3.put_bucket_encryption(
            Bucket="compliant-test-bucket",
            ServerSideEncryptionConfiguration={
                'Rules': [
                    {
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'AES256'
                        }
                    }
                ]
            }
        )

        # Set secure transport policy (deny non-HTTPS, no public access)
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        "arn:aws:s3:::compliant-test-bucket",
                        "arn:aws:s3:::compliant-test-bucket/*"
                    ],
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        }

        s3.put_bucket_policy(
            Bucket="compliant-test-bucket",
            Policy=json.dumps(policy)
        )

        s3.put_bucket_policy(
            Bucket="compliant-test-bucket",
            Policy=json.dumps(policy)
        )

        # Note: Skipping server access logging setup for moto compatibility
        # In real AWS, you would enable logging to a separate logging bucket
    except Exception as e:
        print(f"Error creating compliant bucket: {e}")
    finally:
        # Restore environment variable
        if old_endpoint:
            os.environ['AWS_ENDPOINT_URL'] = old_endpoint


def run_analysis_script():
    """Helper to run the S3 security audit script and return JSON results"""
    # Import and run the auditor directly instead of as subprocess
    # This ensures it runs within the moto mock context
    from analyse import S3SecurityAuditor
    
    # For mock_aws to work, we need to clear AWS_ENDPOINT_URL
    old_endpoint = os.environ.get('AWS_ENDPOINT_URL')
    if 'AWS_ENDPOINT_URL' in os.environ:
        del os.environ['AWS_ENDPOINT_URL']
    
    # Mock the AUDIT_AGE_DAYS to -1 so all buckets are audited (including newly created ones)
    import analyse
    old_audit_age = analyse.AUDIT_AGE_DAYS
    analyse.AUDIT_AGE_DAYS = -1
    
    try:
        print("Creating S3SecurityAuditor...")
        auditor = S3SecurityAuditor()
        print("Running audit...")
        findings, summary = auditor.run_audit()
        print(f"Audit completed. Findings: {len(findings)}, Summary keys: {list(summary.keys())}")
        
        # Save JSON report
        json_output = os.path.join(os.path.dirname(__file__), "..", "s3_security_audit.json")
        auditor.save_json_report(summary, filename=json_output)
        print(f"JSON report saved to {json_output}")
        
        # Read the JSON file that was created
        if os.path.exists(json_output):
            with open(json_output, 'r') as f:
                return json.load(f)
        else:
            print(f"JSON file not found at {json_output}")
            return {}
    except Exception as e:
        print(f"Error running analysis script: {e}")
        import traceback
        traceback.print_exc()
        return {}
    finally:
        # Restore audit age
        analyse.AUDIT_AGE_DAYS = old_audit_age
        # Restore environment variable
        if old_endpoint:
            os.environ['AWS_ENDPOINT_URL'] = old_endpoint

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        print(f"JSON file not found at {json_output}")
        return {}


def test_public_access_detection_integration():
    """Integration test: Detect public access in S3 buckets"""
    with mock_aws():
        # Setup public bucket
        setup_public_bucket()

        results = run_analysis_script()

        # Check that findings section exists
        assert "findings" in results, "findings key missing from JSON"

        # Look for public access findings
        findings = results["findings"]
        public_findings = [
            finding for finding in findings
            if finding.get("issue_type") == "PUBLIC_ACCESS"
        ]

        # Should have at least 1 public access finding
        assert len(public_findings) >= 1, f"Expected at least 1 public access finding, got {len(public_findings)}"

        # Validate finding structure
        for finding in public_findings:
            assert "bucket_name" in finding, "bucket_name field missing from finding"
            assert "issue_type" in finding, "issue_type field missing from finding"
            assert "severity" in finding, "severity field missing from finding"
            assert finding["severity"] == "CRITICAL", f"Expected CRITICAL severity, got {finding['severity']}"


def test_encryption_detection_integration():
    """Integration test: Detect missing encryption in S3 buckets"""
    with mock_aws():
        # Setup unencrypted bucket
        setup_unencrypted_bucket()

        results = run_analysis_script()

        # Check that findings section exists
        assert "findings" in results, "findings key missing from JSON"

        # Look for encryption findings
        findings = results["findings"]
        encryption_findings = [
            finding for finding in findings
            if finding.get("issue_type") == "NO_ENCRYPTION"
        ]

        # Should have at least 1 encryption finding
        assert len(encryption_findings) >= 1, f"Expected at least 1 encryption finding, got {len(encryption_findings)}"

        # Validate finding structure
        for finding in encryption_findings:
            assert "bucket_name" in finding, "bucket_name field missing from finding"
            assert "issue_type" in finding, "issue_type field missing from finding"
            assert "severity" in finding, "severity field missing from finding"


def test_secure_transport_detection_integration():
    """Integration test: Detect missing secure transport in S3 buckets"""
    with mock_aws():
        # Setup bucket without secure transport
        setup_bucket_without_secure_transport()

        results = run_analysis_script()

        # Check that findings section exists
        assert "findings" in results, "findings key missing from JSON"

        # Look for secure transport findings
        findings = results["findings"]
        transport_findings = [
            finding for finding in findings
            if finding.get("issue_type") == "NO_SECURE_TRANSPORT"
        ]

        # Should have at least 1 secure transport finding
        assert len(transport_findings) >= 1, f"Expected at least 1 secure transport finding, got {len(transport_findings)}"

        # Validate finding structure
        for finding in transport_findings:
            assert "bucket_name" in finding, "bucket_name field missing from finding"
            assert "issue_type" in finding, "issue_type field missing from finding"
            assert "severity" in finding, "severity field missing from finding"


def test_compliant_bucket_no_findings():
    """Integration test: Ensure compliant buckets don't generate findings"""
    with mock_aws():
        # Setup compliant bucket
        setup_compliant_bucket()

        results = run_analysis_script()

        # Check that findings section exists
        assert "findings" in results, "findings key missing from JSON"

        # The compliant bucket should NOT have CRITICAL or HIGH severity findings
        # (Medium/low severity findings like NO_LOGGING are acceptable)
        findings = results["findings"]
        compliant_bucket_critical_findings = [
            finding for finding in findings
            if finding.get("bucket_name") == "compliant-test-bucket" and 
            finding.get("severity") in ["CRITICAL", "HIGH"]
        ]

        # Should have no critical/high findings for the compliant bucket
        assert len(compliant_bucket_critical_findings) == 0, f"Expected no critical/high findings for compliant bucket, got {len(compliant_bucket_critical_findings)}"


def test_json_output_structure():
    """Test overall JSON output structure"""
    with mock_aws():
        # Setup some test resources
        setup_public_bucket()
        setup_unencrypted_bucket()

        results = run_analysis_script()

        # Check top-level keys
        assert "findings" in results, "findings key missing from JSON"
        assert "compliance_summary" in results, "compliance_summary key missing from JSON"

        # Check compliance_summary structure
        summary = results["compliance_summary"]
        assert "audit_timestamp" in summary, "audit_timestamp key missing from compliance_summary"
        assert "region" in summary, "region key missing from compliance_summary"

        # Check data types
        assert isinstance(summary["audit_timestamp"], str), "audit_timestamp should be a string"
        assert isinstance(summary["region"], str), "region should be a string"
        assert isinstance(results["findings"], list), "findings should be a list"
        assert isinstance(results["compliance_summary"], dict), "compliance_summary should be a dict"

        # Check region matches expected
        assert summary["region"] == "us-east-1", f"Expected region 'us-east-1', got {summary['region']}"

        # Check compliance summary structure
        assert "total_buckets_audited" in summary, "total_buckets_audited missing from summary"
        assert "compliant_buckets" in summary, "compliant_buckets missing from summary"
        assert "non_compliant_buckets" in summary, "non_compliant_buckets missing from summary"
        assert "findings_by_severity" in summary, "findings_by_severity missing from summary"


def test_comprehensive_security_audit():
    """
    Comprehensive integration test that creates ALL test resources
    and validates the complete security audit functionality.
    """
    with mock_aws():
        print("\n=== Setting up all mock S3 resources for comprehensive audit ===")
        setup_public_bucket()
        setup_unencrypted_bucket()
        setup_bucket_without_secure_transport()
        setup_compliant_bucket()
        print("=== All mock S3 resources created ===\n")

        results = run_analysis_script()

        # Save the analysis results to a file that can be read later
        results_file = os.path.join(os.path.dirname(__file__), "test-s3-results.json")
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n✓ Saved comprehensive S3 audit results to {results_file}")

        # Check that the analysis ran successfully
        assert "findings" in results, "findings key missing from JSON"
        assert "compliance_summary" in results, "compliance_summary key missing from JSON"

        findings = results["findings"]
        summary = results["compliance_summary"]

        # Should have multiple types of findings
        issue_types = set(finding['issue_type'] for finding in findings)

        # Verify we have at least 3 different types of findings
        assert len(issue_types) >= 3, f"Expected at least 3 different finding types, got {len(issue_types)}: {issue_types}"

        # Verify specific finding types exist
        assert any(finding['issue_type'] == 'PUBLIC_ACCESS' for finding in findings), \
            "Should have public access findings"

        assert any(finding['issue_type'] == 'NO_ENCRYPTION' for finding in findings), \
            "Should have encryption findings"

        assert any(finding['issue_type'] == 'NO_SECURE_TRANSPORT' for finding in findings), \
            "Should have secure transport findings"

        # Verify compliance summary
        assert summary['total_buckets_audited'] >= 4, \
            f"Expected at least 4 buckets audited, got {summary['total_buckets_audited']}"

        assert summary['non_compliant_buckets'] >= 3, \
            f"Expected at least 3 non-compliant buckets, got {summary['non_compliant_buckets']}"

        assert summary['compliant_buckets'] >= 1, \
            f"Expected at least 1 compliant bucket, got {summary['compliant_buckets']}"

        # Count findings by issue type
        findings_by_type = {}
        for finding in findings:
            issue_type = finding['issue_type']
            findings_by_type[issue_type] = findings_by_type.get(issue_type, 0) + 1

        print(f"\n=== S3 Security Audit Summary ===")
        print(f"Total Buckets Audited: {summary['total_buckets_audited']}")
        print(f"Compliant Buckets: {summary['compliant_buckets']}")
        print(f"Non-compliant Buckets: {summary['non_compliant_buckets']}")
        print(f"Total Findings: {len(findings)}")
        print(f"Findings by Type:")
        for issue_type, count in findings_by_type.items():
            print(f"  {issue_type}: {count}")
        print(f"Findings by Severity: {summary['findings_by_severity']}")
        print("="*50 + "\n")
