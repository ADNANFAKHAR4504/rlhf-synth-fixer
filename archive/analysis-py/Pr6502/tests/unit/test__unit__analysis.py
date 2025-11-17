"""Unit Tests for S3 Security Auditor"""

import sys
import os
import json
import subprocess
import builtins
import logging
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
from types import ModuleType
from unittest.mock import MagicMock, patch
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

import pytest
import boto3
from moto import mock_aws

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import (
    AWSResourceAuditor,
    HIGH_OBJECT_COUNT,
    LARGE_BUCKET_SIZE_GB,
    Finding,
    MotoDemoDataSeeder,
    S3SecurityAuditor,
    main,
    print_resource_report,
    run_resource_audit,
    run_s3_security_audit,
    seed_demo_data_if_needed,
    _resource_results_empty,
    _is_truthy,
)


def make_client_error(code: str, operation: str) -> ClientError:
    """Helper to create a ClientError with a specific error code."""
    return ClientError({'Error': {'Code': code, 'Message': code}}, operation)


@pytest.fixture
def auditor_with_mocks():
    """Provide an S3SecurityAuditor with mocked boto3 clients."""
    with patch('analyse.boto3.client') as mock_client:
        mock_s3 = MagicMock()
        mock_cloudwatch = MagicMock()
        mock_client.side_effect = [mock_s3, mock_cloudwatch]
        mock_s3.list_buckets.return_value = {'Buckets': []}
        auditor = S3SecurityAuditor()
        yield auditor, mock_s3, mock_cloudwatch


@pytest.fixture
def resource_auditor_with_mocks():
    """Provide AWSResourceAuditor with mocked boto3 clients."""
    with patch('analyse.boto3.client') as mock_client:
        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        mock_client.side_effect = [mock_ec2, mock_logs]
        auditor = AWSResourceAuditor(region_name='us-east-1')
        yield auditor, mock_ec2, mock_logs


@contextmanager
def stub_visualization_modules():
    """Create lightweight stand-ins for plotly and jinja2 so charts can render."""
    fake_jinja2 = ModuleType("jinja2")

    class FakeTemplate:
        def __init__(self, text):
            self.text = text

        def render(self, **kwargs):
            return "rendered html"

    fake_jinja2.Template = FakeTemplate

    class FakeFigure:
        def __init__(self, data=None):
            self.data = data or []

        def update_layout(self, **kwargs):
            self.layout = kwargs

    fake_go = ModuleType("plotly.graph_objects")
    fake_go.Figure = FakeFigure
    fake_go.Bar = lambda **kwargs: ('bar', kwargs)
    fake_go.Pie = lambda **kwargs: ('pie', kwargs)

    fake_io = ModuleType("plotly.io")
    fake_io.to_html = lambda fig, include_plotlyjs='cdn', div_id='': f"<div id='{div_id}'></div>"

    fake_plotly = ModuleType("plotly")
    fake_plotly.graph_objects = fake_go
    fake_plotly.io = fake_io

    modules = {
        'jinja2': fake_jinja2,
        'plotly': fake_plotly,
        'plotly.graph_objects': fake_go,
        'plotly.io': fake_io,
    }

    with patch.dict(sys.modules, modules, clear=False):
        yield


@contextmanager
def force_plotly_import_failure():
    """Force ImportError for plotly modules to exercise fallback code paths."""
    real_import = builtins.__import__

    def _fake_import(name, *args, **kwargs):
        if name.startswith('plotly'):
            raise ImportError("plotly unavailable")
        return real_import(name, *args, **kwargs)

    with patch('builtins.__import__', side_effect=_fake_import):
        yield


def minimal_summary():
    """Create a smallest valid compliance summary for report helpers."""
    return {
        'total_buckets_audited': 0,
        'compliant_buckets': 0,
        'non_compliant_buckets': 0,
        'compliant_bucket_names': [],
        'non_compliant_bucket_names': [],
        'findings_by_severity': {},
        'findings_by_issue_type': {},
        'framework_compliance': {
            'SOC2': {'compliant': 0, 'non_compliant': 0},
            'GDPR': {'compliant': 0, 'non_compliant': 0},
        },
        'audit_timestamp': '',
        'region': 'us-east-1',
    }


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


# =========================================================================
# Additional targeted unit tests to improve coverage
# =========================================================================

def test_cache_bucket_details_handles_errors(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    mock_s3.get_bucket_tagging.side_effect = make_client_error('AccessDenied', 'GetBucketTagging')
    mock_s3.get_bucket_location.side_effect = make_client_error('AccessDenied', 'GetBucketLocation')

    auditor._cache_bucket_details('cache-bucket')
    # Second call should return early and avoid hitting AWS again
    auditor._cache_bucket_details('cache-bucket')

    cached = auditor.bucket_cache['cache-bucket']
    assert cached['tags'] == {}
    assert cached['region'] == 'us-east-1'
    assert mock_s3.get_bucket_tagging.call_count == 1


def test_versioning_and_replication_checks(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'critical-bucket'
    auditor.bucket_cache[bucket] = {
        'arn': f'arn:aws:s3:::{bucket}',
        'tags': {'DataClassification': 'Critical'}
    }

    mock_s3.get_bucket_versioning.return_value = {'Status': 'Suspended'}
    auditor._check_versioning(bucket)
    assert any(f.issue_type == 'NO_VERSIONING' for f in auditor.findings)

    mock_s3.get_bucket_replication.side_effect = make_client_error(
        'ReplicationConfigurationNotFoundError',
        'GetBucketReplication'
    )
    auditor._check_replication(bucket)
    assert any(f.issue_type == 'NO_REPLICATION' for f in auditor.findings)


def test_logging_and_lifecycle_checks(auditor_with_mocks):
    auditor, mock_s3, mock_cloudwatch = auditor_with_mocks
    bucket = 'large-logs-bucket'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}

    mock_s3.get_bucket_logging.return_value = {}
    auditor._check_logging(bucket)
    assert any(f.issue_type == 'NO_LOGGING' for f in auditor.findings)

    mock_cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [{'Average': (LARGE_BUCKET_SIZE_GB + 5) * (1024 ** 3)}]
    }
    mock_s3.get_bucket_lifecycle_configuration.side_effect = make_client_error(
        'NoSuchLifecycleConfiguration',
        'GetBucketLifecycleConfiguration'
    )
    auditor._check_lifecycle_policies(bucket)
    assert any(f.issue_type == 'NO_LIFECYCLE' for f in auditor.findings)


def test_object_lock_and_mfa_delete_checks(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks

    compliance_bucket = 'compliance-bucket'
    auditor.bucket_cache[compliance_bucket] = {
        'arn': f'arn:aws:s3:::{compliance_bucket}',
        'tags': {'RequireCompliance': 'true'}
    }
    mock_s3.get_object_lock_configuration.side_effect = make_client_error(
        'ObjectLockConfigurationNotFoundError',
        'GetObjectLockConfiguration'
    )
    auditor._check_object_lock(compliance_bucket)

    financial_bucket = 'financial-records'
    auditor.bucket_cache[financial_bucket] = {
        'arn': f'arn:aws:s3:::{financial_bucket}',
        'tags': {}
    }
    mock_s3.get_bucket_versioning.return_value = {'Status': 'Enabled', 'MFADelete': 'Disabled'}
    auditor._check_mfa_delete(financial_bucket)

    issue_types = [f.issue_type for f in auditor.findings]
    assert 'NO_OBJECT_LOCK' in issue_types
    assert 'NO_MFA_DELETE' in issue_types


def test_access_logging_and_kms_checks(auditor_with_mocks):
    auditor, mock_s3, mock_cloudwatch = auditor_with_mocks
    bucket = 'vpc-sensitive-bucket'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {'Environment': 'prod'}}

    mock_cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [{'Average': HIGH_OBJECT_COUNT + 1000}]
    }
    mock_s3.get_bucket_logging.return_value = {'LoggingEnabled': {'TargetBucket': bucket}}
    auditor._check_access_logging_destination(bucket)

    mock_s3.get_bucket_encryption.return_value = {
        'ServerSideEncryptionConfiguration': {
            'Rules': [{
                'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}
            }]
        }
    }
    auditor._check_kms_encryption_for_vpc(bucket)

    issue_types = [f.issue_type for f in auditor.findings]
    assert 'SELF_LOGGING' in issue_types
    assert 'WEAK_ENCRYPTION' in issue_types


def test_glacier_transition_detection(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'archive-bucket'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}

    old_object = {'LastModified': datetime.now(timezone.utc) - timedelta(days=120)}
    mock_paginator = MagicMock()
    mock_paginator.paginate.return_value = [{'Contents': [old_object]}]
    mock_s3.get_paginator.return_value = mock_paginator

    mock_s3.get_bucket_lifecycle_configuration.side_effect = make_client_error(
        'NoSuchLifecycleConfiguration',
        'GetBucketLifecycleConfiguration'
    )

    auditor._check_glacier_transitions(bucket)
    assert any(f.issue_type == 'NO_COLD_STORAGE' for f in auditor.findings)


def test_reporting_helpers_and_charts(tmp_path, auditor_with_mocks):
    auditor, _, _ = auditor_with_mocks
    auditor.findings = [
        Finding(
            bucket_name='bucket-critical',
            bucket_arn='arn:aws:s3:::bucket-critical',
            issue_type='PUBLIC_ACCESS',
            severity='CRITICAL',
            compliance_frameworks=['SOC2', 'GDPR'],
            current_config='public',
            required_config='private',
            remediation_steps='fix'
        ),
        Finding(
            bucket_name='bucket-medium',
            bucket_arn='arn:aws:s3:::bucket-medium',
            issue_type='NO_LOGGING',
            severity='MEDIUM',
            compliance_frameworks=['SOC2', 'GDPR'],
            current_config='off',
            required_config='on',
            remediation_steps='turn on'
        ),
    ]

    audited = [{'Name': 'bucket-critical'}, {'Name': 'bucket-medium'}]
    summary = auditor._generate_compliance_summary(audited)

    json_path = tmp_path / 'report.json'
    auditor.save_json_report(summary, filename=str(json_path))
    assert json_path.exists()

    # Ensure print_findings iterates through severities without raising
    auditor.print_findings()

    with stub_visualization_modules():
        severity_html = auditor._create_severity_chart(summary)
        compliance_html = auditor._create_compliance_chart(summary)
        issue_html = auditor._create_issue_type_chart(summary)

        assert '<div' in severity_html
        assert '<div' in compliance_html
        assert '<div' in issue_html

        html_path = tmp_path / 'report.html'
        auditor.save_html_report(auditor.findings, summary, filename=str(html_path))
        assert html_path.exists()


def test_cache_bucket_details_populates_tags(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    mock_s3.get_bucket_tagging.return_value = {'TagSet': [{'Key': 'Env', 'Value': 'Prod'}]}
    mock_s3.get_bucket_location.return_value = {'LocationConstraint': 'eu-west-1'}

    auditor._cache_bucket_details('tagged-bucket')

    cached = auditor.bucket_cache['tagged-bucket']
    assert cached['tags'] == {'Env': 'Prod'}
    assert cached['region'] == 'eu-west-1'


def test_get_buckets_to_audit_handles_failures(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    mock_s3.list_buckets.side_effect = Exception("boom")

    assert auditor._get_buckets_to_audit() == []


def test_get_buckets_to_audit_exclusions_and_warnings(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    old_date = datetime.now(timezone.utc) - timedelta(days=90)
    mock_s3.list_buckets.return_value = {
        'Buckets': [
            {'Name': 'excluded-bucket', 'CreationDate': old_date},
            {'Name': 'denied-bucket', 'CreationDate': old_date},
            {'Name': 'throttled-bucket', 'CreationDate': old_date},
            {'Name': 'error-bucket', 'CreationDate': old_date},
        ]
    }

    mock_s3.get_bucket_tagging.side_effect = [
        {'TagSet': [{'Key': 'ExcludeFromAudit', 'Value': 'true'}]},
        make_client_error('AccessDenied', 'GetBucketTagging'),
        make_client_error('Throttling', 'GetBucketTagging'),
        BotoCoreError(),
    ]

    buckets = auditor._get_buckets_to_audit()
    assert len(buckets) == 3
    assert {'Name': 'excluded-bucket', 'CreationDate': old_date} not in buckets


def test_auditor_init_handles_missing_credentials():
    with patch('analyse.boto3.client', side_effect=NoCredentialsError()):
        with pytest.raises(NoCredentialsError):
            S3SecurityAuditor()


def test_auditor_init_handles_client_errors():
    mock_s3 = MagicMock()
    mock_cloudwatch = MagicMock()
    error = make_client_error('AccessDenied', 'ListBuckets')
    mock_s3.list_buckets.side_effect = error

    with patch('analyse.boto3.client', side_effect=[mock_s3, mock_cloudwatch]):
        with pytest.raises(ClientError):
            S3SecurityAuditor()


def test_public_access_policy_error_logging(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'policy-bucket'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}
    mock_s3.get_bucket_acl.return_value = {'Grants': []}
    mock_s3.get_bucket_policy.side_effect = make_client_error('AccessDenied', 'GetBucketPolicy')

    auditor._check_public_access(bucket)
    assert auditor.findings == []


def test_encryption_and_logging_error_branches(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'error-bucket'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}

    mock_s3.get_bucket_encryption.side_effect = make_client_error('AccessDenied', 'GetBucketEncryption')
    auditor._check_encryption(bucket)
    mock_s3.get_bucket_encryption.side_effect = Exception("boom")
    auditor._check_encryption(bucket)

    mock_s3.get_bucket_logging.side_effect = Exception("log error")
    auditor._check_logging(bucket)


def test_lifecycle_and_replication_error_branches(auditor_with_mocks):
    auditor, mock_s3, mock_cloudwatch = auditor_with_mocks
    bucket = 'critical-bucket'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {'DataClassification': 'Critical'}}

    mock_cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [{'Average': (LARGE_BUCKET_SIZE_GB + 10) * (1024 ** 3)}]
    }
    mock_s3.get_bucket_lifecycle_configuration.side_effect = make_client_error(
        'AccessDenied', 'GetBucketLifecycleConfiguration'
    )
    auditor._check_lifecycle_policies(bucket)

    mock_cloudwatch.get_metric_statistics.side_effect = Exception("cw error")
    auditor._check_lifecycle_policies(bucket)

    mock_s3.get_bucket_replication.side_effect = make_client_error('AccessDenied', 'GetBucketReplication')
    auditor._check_replication(bucket)
    mock_s3.get_bucket_replication.side_effect = Exception("replication boom")
    auditor._check_replication(bucket)


def test_secure_transport_error_logging(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'transport-bucket'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}
    mock_s3.get_bucket_policy.side_effect = make_client_error('AccessDenied', 'GetBucketPolicy')
    auditor._check_secure_transport(bucket)

    mock_s3.get_bucket_policy.side_effect = Exception("policy boom")
    auditor._check_secure_transport(bucket)


def test_object_lock_additional_paths(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'compliance-2'
    auditor.bucket_cache[bucket] = {
        'arn': f'arn:aws:s3:::{bucket}',
        'tags': {'RequireCompliance': 'true'}
    }
    mock_s3.get_object_lock_configuration.return_value = {
        'ObjectLockConfiguration': {'ObjectLockEnabled': 'Disabled'}
    }
    auditor._check_object_lock(bucket)
    assert any(f.issue_type == 'NO_OBJECT_LOCK' for f in auditor.findings)


def test_mfa_and_access_logging_error_paths(auditor_with_mocks):
    auditor, mock_s3, mock_cloudwatch = auditor_with_mocks
    bucket = 'financial-error'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}
    mock_s3.get_bucket_versioning.side_effect = Exception("mfa error")
    auditor._check_mfa_delete(bucket)

    mock_cloudwatch.get_metric_statistics.side_effect = Exception("cw failure")
    auditor._check_access_logging_destination(bucket)


def test_kms_error_path(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'vpc-error'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}
    mock_s3.get_bucket_encryption.side_effect = Exception("kms error")
    auditor._check_kms_encryption_for_vpc(bucket)


def test_glacier_transition_additional_paths(auditor_with_mocks):
    auditor, mock_s3, _ = auditor_with_mocks
    bucket = 'archive-extra'
    auditor.bucket_cache[bucket] = {'arn': f'arn:aws:s3:::{bucket}', 'tags': {}}

    old_object = {'LastModified': datetime.now(timezone.utc) - timedelta(days=120)}
    mock_paginator = MagicMock()
    mock_paginator.paginate.return_value = [{'Contents': [old_object]}]
    mock_s3.get_paginator.return_value = mock_paginator
    mock_s3.get_bucket_lifecycle_configuration.return_value = {
        'Rules': [{'Transitions': [{'StorageClass': 'STANDARD'}]}]
    }
    auditor._check_glacier_transitions(bucket)

    mock_s3.get_paginator.side_effect = Exception("timeout")
    auditor._check_glacier_transitions(bucket)


def test_print_findings_when_empty(auditor_with_mocks):
    auditor, _, _ = auditor_with_mocks
    auditor.findings = []
    auditor.print_findings()


def test_save_html_report_handles_missing_dependencies(tmp_path, auditor_with_mocks):
    auditor, _, _ = auditor_with_mocks
    summary = minimal_summary()

    real_import = builtins.__import__

    def failing_import(name, *args, **kwargs):
        if name.startswith('jinja2') or name.startswith('plotly'):
            raise ImportError("missing dependency")
        return real_import(name, *args, **kwargs)

    with patch('builtins.__import__', side_effect=failing_import):
        auditor.save_html_report([], summary, filename=str(tmp_path / 'unused.html'))


def test_save_html_report_missing_template_path(tmp_path, auditor_with_mocks):
    auditor, _, _ = auditor_with_mocks
    summary = minimal_summary()

    with stub_visualization_modules():
        with patch('analyse.os.path.exists', return_value=False):
            auditor.save_html_report([], summary, filename=str(tmp_path / 'unused.html'))


def test_save_html_report_file_open_error(tmp_path, auditor_with_mocks):
    auditor, _, _ = auditor_with_mocks
    summary = minimal_summary()

    with stub_visualization_modules():
        with patch('analyse.os.path.exists', return_value=True):
            with patch('builtins.open', side_effect=FileNotFoundError):
                auditor.save_html_report([], summary, filename=str(tmp_path / 'unused.html'))


def test_chart_helpers_handle_missing_plotly(auditor_with_mocks):
    auditor, _, _ = auditor_with_mocks
    summary = minimal_summary()

    with force_plotly_import_failure():
        sev = auditor._create_severity_chart(summary)
        comp = auditor._create_compliance_chart(summary)
        issue = auditor._create_issue_type_chart(summary)

    assert sev.startswith('<!--')
    assert comp.startswith('<!--')
    assert issue.startswith('<!--')


def test_run_s3_security_audit_success_and_html_warning():
    summary = minimal_summary()
    summary['total_buckets_audited'] = 1
    fake_auditor = MagicMock()
    fake_auditor.run_audit.return_value = ([], summary)
    fake_auditor.save_html_report.side_effect = Exception("html fail")

    with patch('analyse.S3SecurityAuditor', return_value=fake_auditor):
        assert run_s3_security_audit() == 0
        assert fake_auditor.print_findings.called
        assert fake_auditor.save_json_report.called


def test_run_s3_security_audit_returns_nonzero_on_critical():
    summary = minimal_summary()
    critical_finding = Finding(
        bucket_name='b',
        bucket_arn='arn',
        issue_type='PUBLIC_ACCESS',
        severity='CRITICAL',
        compliance_frameworks=['SOC2'],
        current_config='',
        required_config='',
        remediation_steps='',
    )
    fake_auditor = MagicMock()
    fake_auditor.run_audit.return_value = ([critical_finding], summary)

    with patch('analyse.S3SecurityAuditor', return_value=fake_auditor):
        assert run_s3_security_audit() == 1


def test_run_s3_security_audit_handles_fatal_error():
    with patch('analyse.S3SecurityAuditor', side_effect=Exception("boom")):
        assert run_s3_security_audit() == 2


def test_main_defaults_to_resource_audit():
    with patch('sys.argv', ['analyse.py']):
        with patch('analyse.run_resource_audit', return_value=42):
            assert main() == 42


def test_main_s3_argument_invokes_s3_audit():
    with patch('sys.argv', ['analyse.py', 's3']):
        with patch('analyse.run_s3_security_audit', return_value=24):
            assert main() == 24


# =========================================================================
# AWS resource auditor coverage
# =========================================================================


def test_aws_resource_auditor_collects_data(resource_auditor_with_mocks):
    auditor, mock_ec2, mock_logs = resource_auditor_with_mocks

    vol_paginator = MagicMock()
    vol_paginator.paginate.return_value = [{
        'Volumes': [{
            'VolumeId': 'vol-001',
            'State': 'available',
            'Size': 5,
            'VolumeType': 'gp3',
            'CreateTime': datetime.now(timezone.utc),
            'AvailabilityZone': 'us-east-1a',
            'Encrypted': False,
            'Tags': [{'Key': 'Name', 'Value': 'test-volume'}]
        }]
    }]

    sg_paginator = MagicMock()
    sg_paginator.paginate.return_value = [{
        'SecurityGroups': [{
            'GroupId': 'sg-123',
            'GroupName': 'public',
            'Description': 'test',
            'VpcId': 'vpc-1',
            'IpPermissions': [{
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}],
                'Ipv6Ranges': []
            }]
        }]
    }]

    def ec2_paginator(name):
        if name == 'describe_volumes':
            return vol_paginator
        if name == 'describe_security_groups':
            return sg_paginator
        raise ValueError(name)

    mock_ec2.get_paginator.side_effect = ec2_paginator

    log_group_paginator = MagicMock()
    log_group_paginator.paginate.return_value = [{
        'logGroups': [{'logGroupName': '/test-group'}]
    }]
    log_stream_paginator = MagicMock()
    log_stream_paginator.paginate.return_value = [{
        'logStreams': [{'storedBytes': 100}, {'storedBytes': 300}]
    }]

    def logs_paginator(name):
        if name == 'describe_log_groups':
            return log_group_paginator
        if name == 'describe_log_streams':
            return log_stream_paginator
        raise ValueError(name)

    mock_logs.get_paginator.side_effect = logs_paginator

    unused = auditor.find_unused_ebs_volumes()
    assert len(unused) == 1
    assert unused[0]['VolumeId'] == 'vol-001'

    public_sgs = auditor.find_public_security_groups()
    assert len(public_sgs) == 1
    assert public_sgs[0]['PublicIngressRules'][0]['Source'] == '0.0.0.0/0'

    metrics = auditor.calculate_log_stream_metrics()
    assert metrics['TotalLogStreams'] == 2
    assert metrics['LogGroupMetrics'][0]['AverageStreamSize'] == 200

    combined = auditor.audit_resources()
    assert combined['UnusedEBSVolumes']['Count'] == 1
    assert combined['PublicSecurityGroups']['Count'] == 1
    assert combined['CloudWatchLogMetrics']['TotalLogStreams'] == 2


def test_run_resource_audit_writes_file(tmp_path):
    fake_results = {'ok': True}
    fake_auditor = MagicMock()
    fake_auditor.audit_resources.return_value = fake_results
    out_path = tmp_path / 'aws.json'

    with patch('analyse.AWSResourceAuditor', return_value=fake_auditor):
        with patch('analyse.AWS_AUDIT_RESULTS_FILE', out_path):
            assert run_resource_audit() == 0
            with open(out_path, 'r') as fh:
                assert json.load(fh) == fake_results


class TestMotoSeederAndHelpers:
    def test_truthy_helper(self):
        assert _is_truthy('true')
        assert _is_truthy('  YES ')
        assert not _is_truthy('')
        assert not _is_truthy(None)

    def test_moto_seeder_from_environment_flag_handling(self, monkeypatch):
        monkeypatch.delenv('AWS_ENDPOINT_URL', raising=False)
        assert MotoDemoDataSeeder.from_environment() is None

        monkeypatch.setenv('AWS_ENDPOINT_URL', 'http://localhost:5001')
        seeder = MotoDemoDataSeeder.from_environment()
        assert isinstance(seeder, MotoDemoDataSeeder)

        monkeypatch.setenv('ANALYSE_SKIP_DEMO_DATA', 'true')
        assert MotoDemoDataSeeder.from_environment() is None

        monkeypatch.setenv('ANALYSE_SKIP_DEMO_DATA', '0')
        monkeypatch.setenv('ANALYSE_FORCE_DEMO_DATA', '1')
        seeder = MotoDemoDataSeeder.from_environment()
        assert isinstance(seeder, MotoDemoDataSeeder)

    def test_moto_seeder_seed_all_provisions_resources(self, monkeypatch):
        seeder = MotoDemoDataSeeder('us-west-2', 'http://endpoint')
        ec2 = MagicMock()
        ec2.describe_volumes.side_effect = Exception("boom")
        ec2.describe_security_groups.return_value = {
            'SecurityGroups': [{'GroupName': 'analyse-public', 'GroupId': 'sg-existing'}]
        }
        ec2.create_security_group.side_effect = lambda **kw: {'GroupId': f"sg-{kw['GroupName']}"}
        ec2.authorize_security_group_ingress.side_effect = make_client_error(
            'InvalidPermission.Duplicate', 'AuthorizeSecurityGroupIngress'
        )

        class AlreadyExists(Exception):
            pass

        logs = MagicMock()
        logs.exceptions = type('Exceptions', (), {'ResourceAlreadyExistsException': AlreadyExists})
        logs.create_log_group.side_effect = AlreadyExists("exists")
        logs.create_log_stream.side_effect = [AlreadyExists("exists"), AlreadyExists("exists")]
        logs.put_log_events.return_value = {}

        s3 = MagicMock()
        s3.list_buckets.side_effect = Exception("oops")

        clients = {'ec2': ec2, 'logs': logs, 's3': s3}
        monkeypatch.setattr(seeder, '_client', lambda service: clients[service])

        seeder.seed_all()
        first_volume_calls = ec2.create_volume.call_count

        assert seeder._seeded is True
        assert first_volume_calls == 3  # all demo sizes created
        assert ec2.create_security_group.call_count == 1  # only missing private group created
        assert logs.put_log_events.call_count == 2
        assert s3.create_bucket.call_count == 3
        assert s3.create_bucket.call_args.kwargs['CreateBucketConfiguration']['LocationConstraint'] == 'us-west-2'

        seeder.seed_all()  # idempotent path should not call clients again
        assert ec2.create_volume.call_count == first_volume_calls
        assert s3.create_bucket.call_count == 3

    def test_seed_demo_data_if_needed_handles_absence(self):
        with patch('analyse.MotoDemoDataSeeder.from_environment', return_value=None):
            assert seed_demo_data_if_needed() is False

        fake_seeder = MagicMock()
        with patch('analyse.MotoDemoDataSeeder.from_environment', return_value=fake_seeder):
            assert seed_demo_data_if_needed() is True
            fake_seeder.seed_all.assert_called_once()

    def test_print_resource_report_outputs_tables(self, caplog):
        caplog.set_level(logging.INFO)
        results = {
            'UnusedEBSVolumes': {
                'Count': 1,
                'TotalSize': 1,
                'Volumes': [{
                    'VolumeId': 'vol-123',
                    'Size': 1,
                    'VolumeType': 'gp2',
                    'AvailabilityZone': 'us-east-1a',
                    'Encrypted': False,
                }],
            },
            'PublicSecurityGroups': {
                'Count': 0,
                'SecurityGroups': []
            },
            'CloudWatchLogMetrics': {
                'TotalLogStreams': 1,
                'LogGroupMetrics': [{
                    'LogGroupName': '/demo',
                    'StreamCount': 1,
                    'TotalSize': 128,
                    'AverageStreamSize': 128,
                }]
            }
        }

        print_resource_report(results)

        assert "Unused EBS Volumes" in caplog.text
        assert "Public Security Groups" in caplog.text
        assert "none detected" in caplog.text
        assert "Summary" in caplog.text

    def test_resource_results_empty_detection(self):
        empty = {
            'UnusedEBSVolumes': {'Volumes': []},
            'PublicSecurityGroups': {'SecurityGroups': []},
            'CloudWatchLogMetrics': {'LogGroupMetrics': []},
        }
        assert _resource_results_empty(empty) is True

        not_empty = {
            'UnusedEBSVolumes': {'Volumes': [{'VolumeId': 'vol'}]},
            'PublicSecurityGroups': {'SecurityGroups': []},
            'CloudWatchLogMetrics': {'LogGroupMetrics': []},
        }
        assert _resource_results_empty(not_empty) is False

    def test_estimate_stream_size_fallback(self, resource_auditor_with_mocks):
        auditor, _, mock_logs = resource_auditor_with_mocks
        mock_logs.get_log_events.return_value = {'events': [{'message': 'abc'}, {'message': 'de'}]}
        assert auditor._estimate_stream_size('/demo', 's1') == 5

        mock_logs.get_log_events.side_effect = Exception("boom")
        assert auditor._estimate_stream_size('/demo', 's1') == 0

    def test_moto_seeder_client_factory_uses_boto3(self):
        with patch('analyse.boto3.client') as mock_client:
            fake_client = MagicMock()
            mock_client.return_value = fake_client
            seeder = MotoDemoDataSeeder('us-east-1', None)
            assert seeder._client('logs') is fake_client
            mock_client.assert_called_once_with('logs', region_name='us-east-1')
