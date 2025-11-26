import pytest
import json
import os
from pathlib import Path


@pytest.fixture
def test_config():
    """Load test configuration"""
    return {
        'environment_suffix': 'test',
        'primary_region': 'us-east-1',
        'secondary_region': 'us-west-2',
        'organization_name': 'test-org',
        'enable_cloudtrail': True,
        'cloudwatch_log_retention_days': 90,
        'kms_key_rotation_days': 365,
    }


@pytest.fixture
def mock_aws_outputs():
    """Mock AWS deployment outputs"""
    return {
        'organization_id': 'o-test123456789',
        'organization_arn': 'arn:aws:organizations::123456789012:organization/o-test123456789',
        'root_id': 'r-test1234',
        'security_ou_id': 'ou-test-security',
        'production_ou_id': 'ou-test-production',
        'development_ou_id': 'ou-test-development',
        'primary_kms_key_id': 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'primary_kms_key_arn': 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'replica_kms_key_id': 'arn:aws:kms:us-west-2:123456789012:key/87654321-4321-4321-4321-210987654321',
        'central_log_group_name': '/aws/security/organization-logs',
        'cloudtrail_bucket_name': 'cloudtrail-logs-test-123456789012',
        'cloudtrail_trail_arn': 'arn:aws:cloudtrail:us-east-1:123456789012:trail/organization-trail-test',
        'security_role_arn': 'arn:aws:iam::123456789012:role/CrossAccountSecurityRole-test',
        's3_encryption_scp_id': 'p-test12345',
        'config_bucket_name': 'aws-config-bucket-test-123456789012',
    }


@pytest.fixture
def cfn_outputs_dir(tmp_path):
    """Create temporary cfn-outputs directory"""
    output_dir = tmp_path / "cfn-outputs"
    output_dir.mkdir()
    return output_dir
