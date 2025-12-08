"""
Unit tests for AWS Infrastructure Compliance Scanner (lib/analyse.py)
Tests ComplianceScanner and ComplianceViolation classes with mocked AWS services
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

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

    @patch('analyse.boto3.client')
    def test_scanner_initialization(self, mock_boto_client):
        """Test initializing ComplianceScanner"""
        scanner = ComplianceScanner(
            region="us-east-1",
            environment_suffix="dev"
        )

        assert scanner.region == "us-east-1"
        assert scanner.environment_suffix == "dev"
        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_ebs_encryption_no_instances(self, mock_boto_client):
        """Test EBS encryption check with no instances"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {'Reservations': []}

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_ebs_encryption()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
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

    @patch('analyse.boto3.client')
    def test_check_ebs_encryption_error(self, mock_boto_client):
        """Test EBS encryption check with error"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_ebs_encryption()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_s3_buckets_no_buckets(self, mock_boto_client):
        """Test S3 bucket check with no buckets"""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {'Buckets': []}

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.s3_client = mock_s3
        scanner.check_s3_buckets()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_s3_buckets_versioning_disabled(self, mock_boto_client):
        """Test S3 bucket with versioning disabled"""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket'}]
        }
        mock_s3.get_bucket_versioning.return_value = {'Status': 'Disabled'}
        mock_s3.get_bucket_encryption.return_value = {}
        mock_s3.get_public_access_block.return_value = {
            'PublicAccessBlockConfiguration': {
                'BlockPublicAcls': True,
                'BlockPublicPolicy': True,
                'IgnorePublicAcls': True,
                'RestrictPublicBuckets': True
            }
        }

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.s3_client = mock_s3
        scanner.check_s3_buckets()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_s3_buckets_encryption_disabled(self, mock_boto_client):
        """Test S3 bucket with encryption disabled"""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket'}]
        }
        mock_s3.get_bucket_versioning.return_value = {'Status': 'Enabled'}
        mock_s3.exceptions.ServerSideEncryptionConfigurationNotFoundError = type('ServerSideEncryptionConfigurationNotFoundError', (Exception,), {})
        mock_s3.get_bucket_encryption.side_effect = mock_s3.exceptions.ServerSideEncryptionConfigurationNotFoundError()
        mock_s3.get_public_access_block.return_value = {
            'PublicAccessBlockConfiguration': {
                'BlockPublicAcls': True,
                'BlockPublicPolicy': True,
                'IgnorePublicAcls': True,
                'RestrictPublicBuckets': True
            }
        }

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.s3_client = mock_s3
        scanner.check_s3_buckets()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_s3_buckets_public_access_not_blocked(self, mock_boto_client):
        """Test S3 bucket with public access not blocked"""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket'}]
        }
        mock_s3.get_bucket_versioning.return_value = {'Status': 'Enabled'}
        mock_s3.get_bucket_encryption.return_value = {}
        mock_s3.get_public_access_block.return_value = {
            'PublicAccessBlockConfiguration': {
                'BlockPublicAcls': False,
                'BlockPublicPolicy': False,
                'IgnorePublicAcls': False,
                'RestrictPublicBuckets': False
            }
        }

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.s3_client = mock_s3
        scanner.check_s3_buckets()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_s3_buckets_no_public_access_block(self, mock_boto_client):
        """Test S3 bucket with no public access block configured"""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket'}]
        }
        mock_s3.get_bucket_versioning.return_value = {'Status': 'Enabled'}
        mock_s3.get_bucket_encryption.return_value = {}
        mock_s3.exceptions.NoSuchPublicAccessBlockConfiguration = type('NoSuchPublicAccessBlockConfiguration', (Exception,), {})
        mock_s3.get_public_access_block.side_effect = mock_s3.exceptions.NoSuchPublicAccessBlockConfiguration()

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.s3_client = mock_s3
        scanner.check_s3_buckets()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_s3_buckets_error(self, mock_boto_client):
        """Test S3 bucket check with error"""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.s3_client = mock_s3
        scanner.check_s3_buckets()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_security_groups_no_groups(self, mock_boto_client):
        """Test security group check with no groups"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {'SecurityGroups': []}

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_security_groups()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_security_groups_unrestricted_ssh(self, mock_boto_client):
        """Test security group with unrestricted SSH access"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [{
                'GroupId': 'sg-test123',
                'GroupName': 'test-sg',
                'IpPermissions': [{
                    'FromPort': 22,
                    'ToPort': 22,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}],
                    'Ipv6Ranges': []
                }]
            }]
        }

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_security_groups()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_security_groups_error(self, mock_boto_client):
        """Test security group check with error"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_security_groups()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_required_tags(self, mock_boto_client):
        """Test required tags check"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test123',
                    'Tags': [{'Key': 'Environment', 'Value': 'dev'}]
                }]
            }]
        }

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_required_tags()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_required_tags_error(self, mock_boto_client):
        """Test required tags check with error"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_required_tags()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_approved_amis(self, mock_boto_client):
        """Test approved AMIs check"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test123',
                    'ImageId': 'ami-unapproved'
                }]
            }]
        }

        scanner = ComplianceScanner(
            region="us-east-1",
            environment_suffix="dev",
            approved_amis=['ami-approved']
        )
        scanner.ec2_client = mock_ec2
        scanner.check_approved_amis()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_approved_amis_error(self, mock_boto_client):
        """Test approved AMIs check with error"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_approved_amis()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_ssm_agent_status(self, mock_boto_client):
        """Test SSM agent status check"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test123'
                }]
            }]
        }

        mock_ssm = MagicMock()
        mock_ssm.describe_instance_information.return_value = {
            'InstanceInformationList': []
        }

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.ssm_client = mock_ssm
        scanner.check_ssm_agent_status()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_ssm_agent_status_error(self, mock_boto_client):
        """Test SSM agent status check with error"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_ssm_agent_status()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_check_vpc_flow_logs(self, mock_boto_client):
        """Test VPC flow logs check"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [{'VpcId': 'vpc-test123'}]
        }
        mock_ec2.describe_flow_logs.return_value = {'FlowLogs': []}

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_vpc_flow_logs()

        assert len(scanner.violations) == 1

    @patch('analyse.boto3.client')
    def test_check_vpc_flow_logs_error(self, mock_boto_client):
        """Test VPC flow logs check with error"""
        mock_ec2 = MagicMock()
        mock_ec2.describe_vpcs.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_ec2
        scanner.check_vpc_flow_logs()

        assert len(scanner.violations) == 0

    @patch('analyse.boto3.client')
    def test_get_total_resources_scanned(self, mock_boto_client):
        """Test getting total resources scanned"""
        mock_client = MagicMock()
        mock_client.describe_instances.return_value = {
            'Reservations': [
                {'Instances': [{'InstanceId': 'i-1'}]},
                {'Instances': [{'InstanceId': 'i-2'}]}
            ]
        }
        mock_client.describe_vpcs.return_value = {
            'Vpcs': [{'VpcId': 'vpc-1'}]
        }
        mock_client.list_buckets.return_value = {
            'Buckets': [{'Name': 'bucket-1'}]
        }

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_client
        scanner.s3_client = mock_client

        total = scanner.get_total_resources_scanned()
        assert total == 4

    @patch('analyse.boto3.client')
    def test_get_total_resources_scanned_error(self, mock_boto_client):
        """Test getting total resources with error"""
        mock_client = MagicMock()
        mock_client.describe_instances.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_client

        total = scanner.get_total_resources_scanned()
        assert total == 0

    @patch('analyse.boto3.client')
    def test_generate_report(self, mock_boto_client):
        """Test report generation"""
        mock_client = MagicMock()
        mock_client.describe_instances.return_value = {'Reservations': []}
        mock_client.describe_vpcs.return_value = {'Vpcs': []}
        mock_client.list_buckets.return_value = {'Buckets': []}

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_client
        scanner.s3_client = mock_client

        scanner.violations.append(ComplianceViolation(
            resource_id="test-123",
            resource_type="EC2::Instance",
            violation_type="TestViolation",
            severity="HIGH",
            details="Test details"
        ))

        report = scanner.generate_report()

        assert 'scanTimestamp' in report
        assert report['region'] == "us-east-1"
        assert report['environmentSuffix'] == "dev"
        assert report['summary']['totalViolations'] == 1

    @patch('analyse.boto3.client')
    def test_export_metrics(self, mock_boto_client):
        """Test exporting metrics to CloudWatch"""
        mock_cw = MagicMock()

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.cloudwatch_client = mock_cw

        report = {
            'summary': {
                'totalResourcesScanned': 10,
                'totalViolations': 2,
                'complianceRate': 80.0
            }
        }

        scanner.export_metrics(report)

        mock_cw.put_metric_data.assert_called_once()
        call_args = mock_cw.put_metric_data.call_args
        assert call_args[1]['Namespace'] == 'ComplianceScanner/dev'
        assert len(call_args[1]['MetricData']) == 3

    @patch('analyse.boto3.client')
    def test_export_metrics_error(self, mock_boto_client):
        """Test exporting metrics with error"""
        mock_cw = MagicMock()
        mock_cw.put_metric_data.side_effect = Exception("API Error")

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.cloudwatch_client = mock_cw

        report = {
            'summary': {
                'totalResourcesScanned': 10,
                'totalViolations': 2,
                'complianceRate': 80.0
            }
        }

        scanner.export_metrics(report)

    @patch('analyse.boto3.client')
    def test_run_all_checks(self, mock_boto_client):
        """Test running all compliance checks"""
        mock_client = MagicMock()
        mock_client.describe_instances.return_value = {'Reservations': []}
        mock_client.describe_security_groups.return_value = {'SecurityGroups': []}
        mock_client.list_buckets.return_value = {'Buckets': []}
        mock_client.describe_vpcs.return_value = {'Vpcs': []}
        mock_client.describe_instance_information.return_value = {'InstanceInformationList': []}

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_client
        scanner.ssm_client = mock_client
        scanner.cloudwatch_client = mock_client
        scanner.s3_client = mock_client

        report = scanner.run_all_checks()

        assert 'scanTimestamp' in report
        assert 'summary' in report
        assert report['summary']['totalViolations'] == 0

    @patch('analyse.boto3.client')
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
        mock_client.list_buckets.return_value = {'Buckets': []}
        mock_client.describe_vpcs.return_value = {'Vpcs': []}
        mock_client.describe_instance_information.return_value = {'InstanceInformationList': []}

        scanner = ComplianceScanner(region="us-east-1", environment_suffix="dev")
        scanner.ec2_client = mock_client
        scanner.ssm_client = mock_client
        scanner.cloudwatch_client = mock_client
        scanner.s3_client = mock_client

        report = scanner.run_all_checks()

        assert report['summary']['totalViolations'] > 0
        assert len(report['violations']) > 0
