"""
Unit tests for AWS Infrastructure Compliance Scanner (lib/analyse.py)
Tests ComplianceScanner and ComplianceViolation classes with mocked AWS services
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))

# Import from analyse module
from analyse import ComplianceScanner, ComplianceViolation


class TestComplianceViolation:
    """Test ComplianceViolation class"""

    def test_violation_creation(self):
        """Test creating a compliance violation"""
        violation = ComplianceViolation(
            resource_id="test-123",
            resource_type="EC2::Instance",
            violation_type="UnencryptedVolume",
            severity="HIGH",
            details="Test details"
        )
        
        assert violation.resource_id == "test-123"
        assert violation.resource_type == "EC2::Instance"
        assert violation.violation_type == "UnencryptedVolume"
        assert violation.severity == "HIGH"

    def test_violation_to_dict(self):
        """Test converting violation to dictionary"""
        violation = ComplianceViolation(
            resource_id="test-123",
            resource_type="EC2::Instance",
            violation_type="UnencryptedVolume",
            severity="HIGH",
            details="Test details"
        )
        
        result = violation.to_dict()
        
        assert result['resourceId'] == "test-123"
        assert result['resourceType'] == "EC2::Instance"
        assert 'timestamp' in result


class TestComplianceScanner:
    """Test ComplianceScanner class"""

    @patch('boto3.client')
    def test_scanner_initialization(self, mock_boto_client):
        """Test initializing ComplianceScanner"""
        scanner = ComplianceScanner(
            region="us-east-1",
            environment_suffix="dev"
        )
        
        assert scanner.region == "us-east-1"
        assert scanner.environment_suffix == "dev"
        assert len(scanner.violations) == 0

    @patch('boto3.client')
    def test_check_ebs_encryption_no_instances(self, mock_boto_client):
        """Test EBS encryption check with no instances"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        
        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_ebs_encryption()
        
        assert len(scanner.violations) == 0

    @patch('boto3.client')
    def test_check_ebs_encryption_with_unencrypted(self, mock_boto_client):
        """Test EBS encryption check finds unencrypted volume"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test123',
                    'BlockDeviceMappings': [{'Ebs': {'VolumeId': 'vol-test'}}]
                }]
            }]
        }
        mock_ec2.describe_volumes.return_value = {
            'Volumes': [{'VolumeId': 'vol-test', 'Encrypted': False}]
        }
        
        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_ebs_encryption()
        
        assert len(scanner.violations) == 1

    @patch('boto3.client')
    def test_run_all_checks(self, mock_boto_client):
        """Test running all compliance checks"""
        mock_client = MagicMock()
        mock_client.describe_instances.return_value = {'Reservations': []}
        mock_client.describe_security_groups.return_value = {'SecurityGroups': []}
        mock_client.describe_parameters.return_value = {'Parameters': []}
        mock_client.list_buckets.return_value = {'Buckets': []}
        mock_client.describe_alarms.return_value = {'MetricAlarms': []}
        
        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_client
        scanner.ssm_client = mock_client
        scanner.cloudwatch_client = mock_client
        scanner.s3_client = mock_client
        
        report = scanner.run_all_checks()
        
        assert 'scanTimestamp' in report
        assert 'summary' in report
        assert report['summary']['totalViolations'] == 0

    @patch('boto3.client')
    def test_check_security_groups_no_groups(self, mock_boto_client):
        """Test security group check with no groups"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {'SecurityGroups': []}
        
        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_security_groups()
        
        assert len(scanner.violations) == 0

    @patch('boto3.client')
    def test_check_ssm_encryption_no_params(self, mock_boto_client):
        """Test SSM encryption check with no parameters"""
        mock_ssm = MagicMock()
        mock_ssm.describe_parameters.return_value = {'Parameters': []}
        
        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ssm_client = mock_ssm
        scanner.check_ssm_encryption()
        
        assert len(scanner.violations) == 0

    @patch('boto3.client')
    def test_check_s3_versioning_no_buckets(self, mock_boto_client):
        """Test S3 versioning check with no buckets"""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {'Buckets': []}
        
        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.s3_client = mock_s3
        scanner.check_s3_versioning()
        
        assert len(scanner.violations) == 0

    @patch('boto3.client')
    def test_full_scan_with_violations(self, mock_boto_client):
        """Test complete scan detecting violations"""
        mock_client = MagicMock()
        mock_client.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-violation',
                    'BlockDeviceMappings': [{'Ebs': {'VolumeId': 'vol-bad'}}]
                }]
            }]
        }
        mock_client.describe_volumes.return_value = {
            'Volumes': [{'VolumeId': 'vol-bad', 'Encrypted': False}]
        }
        mock_client.describe_security_groups.return_value = {'SecurityGroups': []}
        mock_client.describe_parameters.return_value = {'Parameters': []}
        mock_client.list_buckets.return_value = {'Buckets': []}
        mock_client.describe_alarms.return_value = {'MetricAlarms': []}
        
        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_client
        scanner.ssm_client = mock_client
        scanner.cloudwatch_client = mock_client
        scanner.s3_client = mock_client
        
        report = scanner.run_all_checks()
        
        assert report['summary']['totalViolations'] > 0
        assert len(report['violations']) > 0
