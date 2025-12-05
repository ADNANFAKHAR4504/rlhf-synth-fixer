"""Unit tests for compliance checking logic."""

import json
import sys
import os
import pytest
from unittest.mock import Mock, patch, MagicMock

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))

import index  # pylint: disable=wrong-import-position


def test_calculate_risk_score_high_violations():
    """Test risk score calculation with high violations."""
    check_results = [
        {
            'checks': [
                {'status': 'FAIL', 'severity': 'HIGH'},
                {'status': 'FAIL', 'severity': 'HIGH'},
                {'status': 'FAIL', 'severity': 'HIGH'},
                {'status': 'PASS', 'severity': 'MEDIUM'}
            ]
        }
    ]

    score = index.calculate_risk_score(check_results)
    assert score >= 7
    assert score <= 10


def test_calculate_risk_score_low_violations():
    """Test risk score calculation with low violations."""
    check_results = [
        {
            'checks': [
                {'status': 'PASS', 'severity': 'HIGH'},
                {'status': 'PASS', 'severity': 'MEDIUM'},
                {'status': 'FAIL', 'severity': 'LOW'},
                {'status': 'PASS', 'severity': 'MEDIUM'}
            ]
        }
    ]

    score = index.calculate_risk_score(check_results)
    assert score <= 3
    assert score >= 1


def test_calculate_risk_score_no_checks():
    """Test risk score calculation with no checks."""
    check_results = []

    score = index.calculate_risk_score(check_results)
    assert score == 1


def test_caching_functionality():
    """Test that caching works correctly."""
    # Clear cache
    index.resource_cache.clear()

    cache_key = index.get_cache_key('test_type', 'test_id')

    # Add to cache
    test_data = {'test': 'data', 'value': 42}
    index.add_to_cache(cache_key, test_data)

    # Retrieve from cache
    cached_data = index.get_from_cache(cache_key)
    assert cached_data == test_data

    # Test cache miss
    miss_data = index.get_from_cache('non_existent_key')
    assert miss_data is None


def test_get_cache_key_consistency():
    """Test that cache key generation is consistent."""
    key1 = index.get_cache_key('s3', 'my-bucket')
    key2 = index.get_cache_key('s3', 'my-bucket')
    key3 = index.get_cache_key('rds', 'my-bucket')

    assert key1 == key2
    assert key1 != key3


@patch('index.boto3')
def test_check_s3_bucket_encryption_pass(mock_boto3):
    """Test S3 bucket compliance check with encryption enabled."""
    # Mock S3 client
    mock_s3 = MagicMock()
    mock_boto3.Session.return_value.client.return_value = mock_s3

    mock_s3.get_bucket_encryption.return_value = {
        'ServerSideEncryptionConfiguration': {
            'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]
        }
    }

    mock_s3.get_public_access_block.return_value = {
        'PublicAccessBlockConfiguration': {
            'BlockPublicAcls': True,
            'IgnorePublicAcls': True,
            'BlockPublicPolicy': True,
            'RestrictPublicBuckets': True
        }
    }

    with patch('index.assume_role', return_value=None):
        index.resource_cache.clear()
        result = index.check_s3_bucket_compliance('test-bucket')

    assert result['type'] == 'S3Bucket'
    assert len(result['checks']) == 2
    assert result['checks'][0]['status'] == 'PASS'
    assert result['checks'][1]['status'] == 'PASS'


@patch('index.boto3')
def test_check_security_group_permissive_fail(mock_boto3):
    """Test security group check with permissive rules."""
    # Mock EC2 client
    mock_ec2 = MagicMock()
    mock_boto3.Session.return_value.client.return_value = mock_ec2

    mock_ec2.describe_security_groups.return_value = {
        'SecurityGroups': [{
            'GroupId': 'sg-123',
            'IpPermissions': [{
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        }]
    }

    with patch('index.assume_role', return_value=None):
        index.resource_cache.clear()
        result = index.check_security_group_compliance('sg-123')

    assert result['type'] == 'SecurityGroup'
    assert result['checks'][0]['status'] == 'FAIL'
    assert 'Unrestricted inbound access detected' in result['checks'][0]['message']
    assert 'Port 22' in result['checks'][0]['message']


@patch('index.boto3')
def test_check_rds_encrypted_pass(mock_boto3):
    """Test RDS compliance check with encryption enabled."""
    # Mock RDS client
    mock_rds = MagicMock()
    mock_boto3.Session.return_value.client.return_value = mock_rds

    mock_rds.describe_db_instances.return_value = {
        'DBInstances': [{
            'StorageEncrypted': True,
            'BackupRetentionPeriod': 7
        }]
    }

    with patch('index.assume_role', return_value=None):
        index.resource_cache.clear()
        result = index.check_rds_compliance('test-db')

    assert result['type'] == 'RDSInstance'
    assert len(result['checks']) == 2
    assert all(c['status'] == 'PASS' for c in result['checks'])
