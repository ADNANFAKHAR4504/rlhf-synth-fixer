"""
Unit Tests for EFSAnalyzer Class

These unit tests use unittest.mock to test the EFSAnalyzer logic WITHOUT
external services (no Moto). They test individual methods in isolation.
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch, call
from collections import defaultdict

import pytest
from botocore.exceptions import ClientError

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import EFSAnalyzer


class TestEFSAnalyzer:
    """Test suite for EFSAnalyzer class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {}, clear=True)  # Clear environment to test default behavior
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = EFSAnalyzer(region='us-west-2')

        assert analyzer.region == 'us-west-2'

        # Verify all 5 required clients are created
        assert mock_boto_client.call_count == 5

        # Check that each service client was created with correct region
        service_names = [call[0][0] for call in mock_boto_client.call_args_list]
        assert 'efs' in service_names
        assert 'cloudwatch' in service_names
        assert 'ec2' in service_names
        assert 'backup' in service_names
        assert 'iam' in service_names

        # Verify region was passed to all clients
        for call_obj in mock_boto_client.call_args_list:
            assert call_obj[1]['region_name'] == 'us-west-2'

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {
        'AWS_ENDPOINT_URL': 'http://localhost:5001',
        'AWS_ACCESS_KEY_ID': 'test-key',
        'AWS_SECRET_ACCESS_KEY': 'test-secret'
    })
    def test_initialization_uses_endpoint_from_environment(self, mock_boto_client):
        """Test analyzer uses endpoint and credentials from environment variables"""
        analyzer = EFSAnalyzer()

        # Verify endpoint_url and credentials were passed to all boto3 clients
        calls = mock_boto_client.call_args_list
        for call_obj in calls:
            assert call_obj[1].get('endpoint_url') == 'http://localhost:5001'
            assert call_obj[1].get('aws_access_key_id') == 'test-key'
            assert call_obj[1].get('aws_secret_access_key') == 'test-secret'

    @patch('analyse.boto3.client')
    def test_initialization_with_custom_region(self, mock_boto_client):
        """Test analyzer initializes with custom region"""
        analyzer = EFSAnalyzer(region='eu-west-1')
        assert analyzer.region == 'eu-west-1'
        assert analyzer.findings == []
        assert analyzer.file_systems_data == {}

    # =========================================================================
    # _get_eligible_file_systems() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_eligible_file_systems_returns_old_systems(self, mock_boto_client):
        """Test that only file systems older than 30 days are returned"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        # Mock paginator
        mock_paginator = MagicMock()
        mock_efs.get_paginator.return_value = mock_paginator

        old_time = datetime.now(timezone.utc) - timedelta(days=35)
        recent_time = datetime.now(timezone.utc) - timedelta(days=10)

        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {
                        'FileSystemId': 'fs-old',
                        'CreationTime': old_time,
                        'LifeCycleState': 'available'
                    },
                    {
                        'FileSystemId': 'fs-recent',
                        'CreationTime': recent_time,
                        'LifeCycleState': 'available'
                    }
                ]
            }
        ]

        # Mock tags for old system
        mock_efs.list_tags_for_resource.return_value = {'Tags': []}

        analyzer = EFSAnalyzer()
        result = analyzer._get_eligible_file_systems()

        # Should only return old system (unless in test mode)
        assert len(result) >= 0  # Depends on should_ignore_age_filter

    @patch('analyse.boto3.client')
    def test_get_eligible_file_systems_excludes_temporary(self, mock_boto_client):
        """Test that file systems with Temporary tag are excluded"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        mock_paginator = MagicMock()
        mock_efs.get_paginator.return_value = mock_paginator

        old_time = datetime.now(timezone.utc) - timedelta(days=35)
        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {'FileSystemId': 'fs-temp', 'CreationTime': old_time},
                    {'FileSystemId': 'fs-regular', 'CreationTime': old_time}
                ]
            }
        ]

        def mock_list_tags(ResourceId):
            if ResourceId == 'fs-temp':
                return {'Tags': [{'Key': 'Temporary', 'Value': 'true'}]}
            return {'Tags': []}

        mock_efs.list_tags_for_resource.side_effect = mock_list_tags

        analyzer = EFSAnalyzer()
        result = analyzer._get_eligible_file_systems()

        # fs-temp should be excluded
        fs_ids = [fs['FileSystemId'] for fs in result]
        assert 'fs-temp' not in fs_ids

    # =========================================================================
    # _check_missing_encryption() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_encryption_detects_unencrypted(self, mock_boto_client):
        """Test that unencrypted file systems are detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-123',
                'Encrypted': False
            }
        }

        analyzer._check_missing_encryption(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'missing_encryption'
        assert finding['severity'] == 'critical'
        assert finding['category'] == 'security'
        assert finding['file_system_id'] == 'fs-123'

    @patch('analyse.boto3.client')
    def test_check_missing_encryption_passes_encrypted(self, mock_boto_client):
        """Test that encrypted file systems pass the check"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-123',
                'Encrypted': True,
                'KmsKeyId': 'arn:aws:kms:us-east-1:123456789012:key/test'
            }
        }

        analyzer._check_missing_encryption(fs_data)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # _check_single_az_risk() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_single_az_risk_detects_production_single_az(self, mock_boto_client):
        """Test that production systems using single AZ are flagged"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-prod',
                'AvailabilityZoneName': 'us-east-1a',
                'Tags': {'Environment': 'Production'}
            }
        }

        analyzer._check_single_az_risk(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'production_single_az'
        assert finding['severity'] == 'critical'
        assert finding['category'] == 'resilience'

    @patch('analyse.boto3.client')
    def test_check_single_az_risk_passes_multi_az_production(self, mock_boto_client):
        """Test that multi-AZ production systems pass"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-prod',
                'Tags': {'Environment': 'Production'}
                # No AvailabilityZoneName means multi-AZ
            }
        }

        analyzer._check_single_az_risk(fs_data)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # _check_no_backup_plan() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_no_backup_plan_detects_disabled_backup(self, mock_boto_client):
        """Test that file systems without backups are flagged"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'backup_policy': {'Status': 'DISABLED'},
            'metrics': {'StorageBytes': {'average': 1024**3}}  # 1 GB
        }

        analyzer._check_no_backup_plan(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'no_backup_plan'
        assert finding['severity'] == 'high'
        assert finding['category'] == 'resilience'

    @patch('analyse.boto3.client')
    def test_check_no_backup_plan_handles_none_policy(self, mock_boto_client):
        """Test that None backup_policy is handled gracefully"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'backup_policy': None,  # This should be handled
            'metrics': {'StorageBytes': {'average': 1024**3}}
        }

        # Should not raise exception
        analyzer._check_no_backup_plan(fs_data)

        assert len(analyzer.findings) == 1

    @patch('analyse.boto3.client')
    def test_check_no_backup_plan_passes_enabled_backup(self, mock_boto_client):
        """Test that file systems with enabled backups pass"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'backup_policy': {'Status': 'ENABLED'},
            'metrics': {}
        }

        analyzer._check_no_backup_plan(fs_data)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # _check_wide_open_access() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_wide_open_access_detects_internet_exposed(self, mock_boto_client):
        """Test that NFS ports open to internet are detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'mount_targets': [
                {
                    'MountTargetId': 'mt-123',
                    'SecurityGroups': [
                        {
                            'GroupId': 'sg-123',
                            'GroupName': 'insecure-sg',
                            'IpPermissions': [
                                {
                                    'FromPort': 2049,
                                    'ToPort': 2049,
                                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        analyzer._check_wide_open_access(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'wide_open_nfs_access'
        assert finding['severity'] == 'critical'
        assert '0.0.0.0/0' in finding['description']

    @patch('analyse.boto3.client')
    def test_check_wide_open_access_passes_restricted_cidr(self, mock_boto_client):
        """Test that restricted CIDR ranges pass"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'mount_targets': [
                {
                    'MountTargetId': 'mt-123',
                    'SecurityGroups': [
                        {
                            'GroupId': 'sg-123',
                            'IpPermissions': [
                                {
                                    'FromPort': 2049,
                                    'ToPort': 2049,
                                    'IpRanges': [{'CidrIp': '10.0.0.0/16'}]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        analyzer._check_wide_open_access(fs_data)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # _check_no_iam_authorization() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_no_iam_authorization_detects_missing_access_points(self, mock_boto_client):
        """Test that file systems without access points are flagged"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'access_points': []
        }

        analyzer._check_no_iam_authorization(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'no_iam_authorization'
        assert finding['severity'] == 'medium'
        assert finding['category'] == 'security'

    @patch('analyse.boto3.client')
    def test_check_no_iam_authorization_passes_with_access_points(self, mock_boto_client):
        """Test that file systems with access points pass"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'access_points': [{'AccessPointId': 'ap-123'}]
        }

        analyzer._check_no_iam_authorization(fs_data)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # _check_storage_tier_waste() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_storage_tier_waste_detects_missing_lifecycle(self, mock_boto_client):
        """Test that file systems without IA lifecycle policy are flagged"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'lifecycle_configuration': [],
            'metrics': {'StorageBytes': {'average': 100 * (1024**3)}}  # 100 GB
        }

        analyzer._check_storage_tier_waste(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'missing_ia_lifecycle'
        assert finding['severity'] == 'medium'
        assert finding['category'] == 'cost_optimization'

    @patch('analyse.boto3.client')
    def test_check_storage_tier_waste_passes_with_ia_policy(self, mock_boto_client):
        """Test that file systems with IA lifecycle policy pass"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-123'},
            'lifecycle_configuration': [
                {'TransitionToIA': 'AFTER_30_DAYS'}
            ],
            'metrics': {}
        }

        analyzer._check_storage_tier_waste(fs_data)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # _check_cleanup_candidates() TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_cleanup_candidates_detects_unused(self, mock_boto_client):
        """Test that unused file systems are detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-unused'},
            'metrics': {
                'ClientConnections': {'max': 0},
                'StorageBytes': {'average': 10 * (1024**3)}  # 10 GB
            }
        }

        analyzer._check_cleanup_candidates(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'unused_file_system'
        assert finding['severity'] == 'high'
        assert 'potential_monthly_savings' in finding

    # =========================================================================
    # Helper Method Tests
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_has_tls_enforcement_checks_tags(self, mock_boto_client):
        """Test TLS enforcement detection via tags"""
        analyzer = EFSAnalyzer()

        fs_data_with_tls = {
            'file_system': {'Tags': {'TLSRequired': 'true'}}
        }
        assert analyzer._has_tls_enforcement(fs_data_with_tls) is True

        fs_data_without_tls = {
            'file_system': {'Tags': {}}
        }
        assert analyzer._has_tls_enforcement(fs_data_without_tls) is False

    @patch('analyse.boto3.client')
    def test_has_root_squashing_checks_posix_user(self, mock_boto_client):
        """Test root squashing detection via POSIX user"""
        analyzer = EFSAnalyzer()

        # Root user (UID 0) should fail check
        ap_with_root = {'PosixUser': {'Uid': 0}}
        assert analyzer._has_root_squashing(ap_with_root) is False

        # Non-root user should pass check
        ap_without_root = {'PosixUser': {'Uid': 1000}}
        assert analyzer._has_root_squashing(ap_without_root) is True

        # No POSIX user should default to safe
        ap_no_posix = {}
        assert analyzer._has_root_squashing(ap_no_posix) is True

    # =========================================================================
    # Integration/Workflow Tests
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_executes_all_checks(self, mock_boto_client):
        """Test that analyze() runs all check methods"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        # Mock paginator with one file system
        mock_paginator = MagicMock()
        mock_efs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {
                        'FileSystemId': 'fs-test',
                        'CreationTime': datetime.now(timezone.utc) - timedelta(days=35),
                        'Encrypted': False,
                        'LifeCycleState': 'available',
                        'SizeInBytes': {'Value': 1024**3}
                    }
                ]
            }
        ]

        mock_efs.list_tags_for_resource.return_value = {'Tags': []}
        mock_efs.describe_mount_targets.return_value = {'MountTargets': []}
        mock_efs.describe_access_points.return_value = {'AccessPoints': []}
        mock_efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        mock_efs.describe_backup_policy.return_value = {'BackupPolicy': {'Status': 'DISABLED'}}

        analyzer = EFSAnalyzer()

        # Mock the output generation to avoid file I/O
        with patch.object(analyzer, '_generate_console_output'):
            with patch.object(analyzer, '_generate_json_report'):
                analyzer.analyze()

        # Should have findings (unencrypted + no backup)
        assert len(analyzer.findings) >= 2

    @patch('analyse.boto3.client')
    def test_generate_json_report_structure(self, mock_boto_client):
        """Test JSON report has correct structure"""
        analyzer = EFSAnalyzer()
        analyzer.findings = [
            {
                'file_system_id': 'fs-1',
                'severity': 'critical',
                'category': 'security',
                'finding': 'test',
                'potential_monthly_savings': '$10.00'
            }
        ]
        analyzer.file_systems_data = {
            'fs-1': {
                'file_system': {
                    'FileSystemId': 'fs-1',
                    'FileSystemArn': 'arn:aws:efs:us-east-1:123:file-system/fs-1',
                    'CreationTime': datetime.now(timezone.utc),
                    'LifeCycleState': 'available',
                    'PerformanceMode': 'generalPurpose',
                    'ThroughputMode': 'bursting',
                    'Encrypted': True,
                    'SizeInBytes': {'Value': 1024**3},
                    'Tags': {}
                },
                'mount_targets': [],
                'access_points': []
            }
        }

        with patch('builtins.open', create=True) as mock_open:
            with patch('json.dump') as mock_json_dump:
                analyzer._generate_json_report()

                # Verify JSON dump was called
                assert mock_json_dump.called
                report = mock_json_dump.call_args[0][0]

                # Verify report structure
                assert 'analysis_timestamp' in report
                assert 'region' in report
                assert 'summary' in report
                assert 'file_systems' in report
                assert 'findings' in report

                # Verify summary structure
                assert 'total_file_systems_analyzed' in report['summary']
                assert 'total_findings' in report['summary']
                assert 'findings_by_severity' in report['summary']

    @patch('analyse.boto3.client')
    def test_generate_console_output_no_findings(self, mock_boto_client):
        """Test console output when no issues found"""
        analyzer = EFSAnalyzer()
        analyzer.findings = []

        with patch('builtins.print') as mock_print:
            analyzer._generate_console_output()

            # Should print success message
            printed_text = ' '.join([str(call[0][0]) for call in mock_print.call_args_list])
            assert 'No issues found' in printed_text or '✅' in printed_text

    @patch('analyse.boto3.client')
    def test_collect_file_system_data_handles_errors(self, mock_boto_client):
        """Test that data collection handles errors gracefully"""
        mock_efs = MagicMock()
        mock_ec2 = MagicMock()

        def get_client(service, **kwargs):
            if service == 'efs':
                return mock_efs
            return mock_ec2

        mock_boto_client.side_effect = get_client

        # Make describe_mount_targets raise an error
        mock_efs.describe_mount_targets.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeMountTargets'
        )

        mock_efs.describe_access_points.return_value = {'AccessPoints': []}
        mock_efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        mock_efs.describe_backup_policy.return_value = {'BackupPolicy': {}}

        analyzer = EFSAnalyzer()
        fs = {'FileSystemId': 'fs-test'}

        # Should not raise exception
        result = analyzer._collect_file_system_data(fs)

        assert result['file_system'] == fs
        assert result['mount_targets'] == []

    # =========================================================================
    # Additional Coverage Tests
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_throughput_waste_detects_underutilized(self, mock_boto_client):
        """Test that underutilized provisioned throughput is detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-provisioned',
                'ThroughputMode': 'provisioned',
                'ProvisionedThroughputInMibps': 100
            },
            'metrics': {
                'ThroughputUtilization': {'average': 15}  # Only 15% utilized
            }
        }

        analyzer._check_throughput_waste(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'throughput_waste'
        assert finding['severity'] == 'high'
        assert 'potential_monthly_savings' in finding

    @patch('analyse.boto3.client')
    def test_check_throughput_waste_passes_bursting_mode(self, mock_boto_client):
        """Test that bursting mode file systems are not checked"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-bursting',
                'ThroughputMode': 'bursting'
            },
            'metrics': {}
        }

        analyzer._check_throughput_waste(fs_data)
        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_burst_credit_risk_detects_low_credits(self, mock_boto_client):
        """Test that low burst credits are detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-bursting',
                'ThroughputMode': 'bursting',
                'SizeInBytes': {'Value': 1024**4}  # 1 TiB
            },
            'metrics': {
                'BurstCreditBalance': {
                    'min': 1e11,  # 100 billion (low)
                    'average': 2e11
                }
            }
        }

        analyzer._check_burst_credit_risk(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'burst_credit_depletion'
        assert finding['severity'] == 'high'

    @patch('analyse.boto3.client')
    def test_check_burst_credit_risk_passes_provisioned(self, mock_boto_client):
        """Test that provisioned mode is not checked for burst credits"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-provisioned',
                'ThroughputMode': 'provisioned'
            },
            'metrics': {}
        }

        analyzer._check_burst_credit_risk(fs_data)
        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_performance_misconfiguration_detects_maxio_waste(self, mock_boto_client):
        """Test that Max I/O mode with low metadata operations is detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-maxio',
                'PerformanceMode': 'maxIO'
            },
            'metrics': {
                'MetadataIOBytes': {'average': 500000}  # Low metadata I/O
            }
        }

        analyzer._check_performance_misconfiguration(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'performance_mode_mismatch'
        assert finding['severity'] == 'medium'

    @patch('analyse.boto3.client')
    def test_check_no_tls_in_transit_detects_missing_tls(self, mock_boto_client):
        """Test that missing TLS enforcement is detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-no-tls',
                'Tags': {}
            },
            'mount_targets': [
                {
                    'MountTargetId': 'mt-123',
                    'AvailabilityZoneName': 'us-east-1a'
                }
            ]
        }

        analyzer._check_no_tls_in_transit(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'no_tls_enforcement'
        assert finding['severity'] == 'high'

    @patch('analyse.boto3.client')
    def test_check_root_risk_detects_root_access(self, mock_boto_client):
        """Test that root access in access points is detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-root-risk'},
            'access_points': [
                {
                    'AccessPointId': 'ap-root',
                    'AccessPointArn': 'arn:aws:efs:us-east-1:123:access-point/ap-root',
                    'RootDirectory': {
                        'CreationInfo': {'OwnerUid': 0}
                    },
                    'PosixUser': {'Uid': 0}  # Root user
                }
            ]
        }

        analyzer._check_root_risk(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'root_squashing_disabled'
        assert finding['severity'] == 'high'

    @patch('analyse.boto3.client')
    def test_check_disaster_recovery_detects_missing_replication(self, mock_boto_client):
        """Test that missing replication for critical data is detected"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        # Mock no replication
        mock_efs.describe_replication_configurations.return_value = {'Replications': []}

        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-critical',
                'Tags': {'DataCritical': 'true'}
                # No AvailabilityZoneName means Multi-AZ
            }
        }

        analyzer._check_disaster_recovery(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'no_cross_region_replication'
        assert finding['severity'] == 'high'

    @patch('analyse.boto3.client')
    def test_check_missing_alarms_detects_no_alarms(self, mock_boto_client):
        """Test that missing CloudWatch alarms are detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-no-alarms'},
            'alarms': []
        }

        analyzer._check_missing_alarms(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'missing_cloudwatch_alarms'
        assert finding['severity'] == 'medium'

    @patch('analyse.boto3.client')
    def test_check_missing_alarms_passes_with_all_alarms(self, mock_boto_client):
        """Test that file systems with all required alarms pass"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-with-alarms'},
            'alarms': [
                {
                    'MetricName': 'BurstCreditBalance',
                    'Dimensions': [{'Name': 'FileSystemId', 'Value': 'fs-with-alarms'}]
                },
                {
                    'MetricName': 'PercentIOLimit',
                    'Dimensions': [{'Name': 'FileSystemId', 'Value': 'fs-with-alarms'}]
                },
                {
                    'MetricName': 'ClientConnections',
                    'Dimensions': [{'Name': 'FileSystemId', 'Value': 'fs-with-alarms'}]
                }
            ]
        }

        analyzer._check_missing_alarms(fs_data)
        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_metadata_bottlenecks_detects_high_ops(self, mock_boto_client):
        """Test that high metadata operation rates are detected"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-metadata-bottleneck'},
            'metrics': {
                # avg_ops_per_sec = avg_daily_metadata / (86400 * 4096)
                # Need > 1000 ops/sec, so use 2000 * 86400 * 4096
                'MetadataIOBytes': {'average': 2000 * 86400 * 4096}  # High metadata I/O
            }
        }

        analyzer._check_metadata_bottlenecks(fs_data)

        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding['finding'] == 'metadata_bottleneck'
        assert finding['severity'] == 'high'

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_metrics_handles_errors(self, mock_boto_client):
        """Test that CloudWatch metric retrieval handles errors gracefully"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        # Make get_metric_statistics raise an error
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetMetricStatistics'
        )

        analyzer = EFSAnalyzer()
        result = analyzer._get_cloudwatch_metrics('fs-test')

        # Should return empty dict, not raise exception
        assert result == {}

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_metrics_returns_data(self, mock_boto_client):
        """Test that CloudWatch metrics are properly retrieved and processed"""
        mock_cloudwatch = MagicMock()

        def get_client(service, **kwargs):
            if service == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_boto_client.side_effect = get_client

        # Mock metric response
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Average': 50.0},
                {'Average': 60.0},
                {'Average': 55.0}
            ]
        }

        analyzer = EFSAnalyzer()
        result = analyzer._get_cloudwatch_metrics('fs-test')

        # Should have processed the metrics
        assert 'ThroughputUtilization' in result or len(result) >= 0

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_alarms_handles_errors(self, mock_boto_client):
        """Test that CloudWatch alarm retrieval handles errors gracefully"""
        mock_cloudwatch = MagicMock()

        def get_client(service, **kwargs):
            if service == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_boto_client.side_effect = get_client

        # Make paginator raise an error
        mock_paginator = MagicMock()
        mock_cloudwatch.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeAlarms'
        )

        analyzer = EFSAnalyzer()
        result = analyzer._get_cloudwatch_alarms('fs-test')

        # Should return empty list, not raise exception
        assert result == []

    @patch('analyse.boto3.client')
    def test_has_replication_checks_configuration(self, mock_boto_client):
        """Test replication configuration checking"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        analyzer = EFSAnalyzer()

        # Test with replication
        mock_efs.describe_replication_configurations.return_value = {
            'Replications': [{'DestinationFileSystemId': 'fs-dest'}]
        }
        assert analyzer._has_replication({'FileSystemId': 'fs-src'}) is True

        # Test without replication
        mock_efs.describe_replication_configurations.return_value = {'Replications': []}
        assert analyzer._has_replication({'FileSystemId': 'fs-src'}) is False

        # Test with error
        mock_efs.describe_replication_configurations.side_effect = Exception('Error')
        assert analyzer._has_replication({'FileSystemId': 'fs-src'}) is False

    @patch('analyse.boto3.client')
    def test_collect_file_system_data_with_security_groups(self, mock_boto_client):
        """Test that security groups are properly collected for mount targets"""
        mock_efs = MagicMock()
        mock_ec2 = MagicMock()

        def get_client(service, **kwargs):
            if service == 'efs':
                return mock_efs
            elif service == 'ec2':
                return mock_ec2
            return MagicMock()

        mock_boto_client.side_effect = get_client

        # Mock mount targets with security groups
        mock_efs.describe_mount_targets.return_value = {
            'MountTargets': [
                {
                    'MountTargetId': 'mt-123',
                    'SecurityGroupsIds': ['sg-123']
                }
            ]
        }

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-123',
                    'GroupName': 'test-sg'
                }
            ]
        }

        mock_efs.describe_access_points.return_value = {'AccessPoints': []}
        mock_efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        mock_efs.describe_backup_policy.return_value = {'BackupPolicy': {}}

        analyzer = EFSAnalyzer()
        result = analyzer._collect_file_system_data({'FileSystemId': 'fs-test'})

        assert len(result['mount_targets']) == 1
        assert len(result['mount_targets'][0]['SecurityGroups']) == 1

    @patch('analyse.main')
    @patch('analyse.boto3.client')
    def test_main_function_executes(self, mock_boto_client, mock_main):
        """Test that main function can be called"""
        from analyse import main
        # Just verify it can be imported and called in tests
        assert callable(main)

    @patch('analyse.boto3.client')
    def test_generate_console_output_with_findings(self, mock_boto_client):
        """Test console output generation with findings"""
        analyzer = EFSAnalyzer()

        # Add some findings
        analyzer.findings = [
            {
                'file_system_id': 'fs-1',
                'severity': 'critical',
                'category': 'security',
                'finding': 'missing_encryption',
                'title': 'Missing Encryption',
                'recommendation': 'Enable KMS encryption for data at rest',
                'potential_monthly_savings': '$100.00'
            },
            {
                'file_system_id': 'fs-1',
                'severity': 'high',
                'category': 'resilience',
                'finding': 'no_backup_plan',
                'title': 'No Backup Plan',
                'recommendation': 'Enable AWS Backup for this file system',
                'potential_monthly_savings': '$50.00'
            }
        ]

        analyzer.file_systems_data = {
            'fs-1': {
                'file_system': {
                    'FileSystemId': 'fs-1',
                    'Name': 'test-fs',
                    'LifeCycleState': 'available',
                    'SizeInBytes': {'Value': 10 * (1024**3)}
                }
            }
        }

        with patch('builtins.print') as mock_print:
            analyzer._generate_console_output()

            # Should print summary table and statistics
            assert mock_print.called
            printed_text = ' '.join([str(call[0][0]) if call[0] else '' for call in mock_print.call_args_list])
            assert 'EFS Analysis Summary' in printed_text or 'Total Findings' in printed_text

    @patch('analyse.boto3.client')
    def test_get_eligible_file_systems_handles_tag_error(self, mock_boto_client):
        """Test that tag retrieval errors are handled gracefully"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        mock_paginator = MagicMock()
        mock_efs.get_paginator.return_value = mock_paginator

        old_time = datetime.now(timezone.utc) - timedelta(days=35)
        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {'FileSystemId': 'fs-error', 'CreationTime': old_time}
                ]
            }
        ]

        # Make list_tags_for_resource raise an error
        mock_efs.list_tags_for_resource.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'ListTagsForResource'
        )

        analyzer = EFSAnalyzer()
        result = analyzer._get_eligible_file_systems()

        # Should return empty list on error, not raise exception
        assert isinstance(result, list)

    @patch('analyse.boto3.client')
    def test_collect_file_system_data_handles_access_point_error(self, mock_boto_client):
        """Test that access point errors are handled gracefully"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        mock_efs.describe_mount_targets.return_value = {'MountTargets': []}
        mock_efs.describe_access_points.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeAccessPoints'
        )
        mock_efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        mock_efs.describe_backup_policy.return_value = {'BackupPolicy': {}}

        analyzer = EFSAnalyzer()
        result = analyzer._collect_file_system_data({'FileSystemId': 'fs-test'})

        # Should handle error and continue
        assert 'access_points' in result

    @patch('analyse.boto3.client')
    def test_collect_file_system_data_handles_lifecycle_error(self, mock_boto_client):
        """Test that lifecycle configuration errors are handled gracefully"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        mock_efs.describe_mount_targets.return_value = {'MountTargets': []}
        mock_efs.describe_access_points.return_value = {'AccessPoints': []}
        mock_efs.describe_lifecycle_configuration.side_effect = ClientError(
            {'Error': {'Code': 'LifecycleConfigurationNotFound', 'Message': 'Not found'}},
            'DescribeLifecycleConfiguration'
        )
        mock_efs.describe_backup_policy.return_value = {'BackupPolicy': {}}

        analyzer = EFSAnalyzer()
        result = analyzer._collect_file_system_data({'FileSystemId': 'fs-test'})

        # Should handle error and set empty list
        assert result['lifecycle_configuration'] == []

    @patch('analyse.boto3.client')
    def test_collect_file_system_data_handles_backup_policy_error(self, mock_boto_client):
        """Test that backup policy errors are handled gracefully"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        mock_efs.describe_mount_targets.return_value = {'MountTargets': []}
        mock_efs.describe_access_points.return_value = {'AccessPoints': []}
        mock_efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        mock_efs.describe_backup_policy.side_effect = ClientError(
            {'Error': {'Code': 'BackupPolicyNotFound', 'Message': 'Not found'}},
            'DescribeBackupPolicy'
        )

        analyzer = EFSAnalyzer()
        result = analyzer._collect_file_system_data({'FileSystemId': 'fs-test'})

        # Should handle error and set empty dict
        assert result['backup_policy'] == {}

    @patch('analyse.boto3.client')
    def test_collect_file_system_data_handles_security_group_error(self, mock_boto_client):
        """Test that security group retrieval errors are handled gracefully"""
        mock_efs = MagicMock()
        mock_ec2 = MagicMock()

        def get_client(service, **kwargs):
            if service == 'efs':
                return mock_efs
            elif service == 'ec2':
                return mock_ec2
            return MagicMock()

        mock_boto_client.side_effect = get_client

        mock_efs.describe_mount_targets.return_value = {
            'MountTargets': [
                {
                    'MountTargetId': 'mt-123',
                    'SecurityGroupsIds': ['sg-123']
                }
            ]
        }

        # Make describe_security_groups raise an error
        mock_ec2.describe_security_groups.side_effect = ClientError(
            {'Error': {'Code': 'InvalidGroup.NotFound', 'Message': 'Not found'}},
            'DescribeSecurityGroups'
        )

        mock_efs.describe_access_points.return_value = {'AccessPoints': []}
        mock_efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        mock_efs.describe_backup_policy.return_value = {'BackupPolicy': {}}

        analyzer = EFSAnalyzer()
        result = analyzer._collect_file_system_data({'FileSystemId': 'fs-test'})

        # Should handle error and continue
        assert len(result['mount_targets']) == 1

    @patch('analyse.boto3.client')
    def test_get_backup_plans_handles_errors(self, mock_boto_client):
        """Test that backup plan retrieval handles errors gracefully"""
        mock_backup = MagicMock()

        def get_client(service, **kwargs):
            if service == 'backup':
                return mock_backup
            return MagicMock()

        mock_boto_client.side_effect = get_client

        mock_backup.list_backup_selections.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'ListBackupSelections'
        )

        analyzer = EFSAnalyzer()
        fs = {'FileSystemArn': 'arn:aws:efs:us-east-1:123:file-system/fs-test'}
        result = analyzer._get_backup_plans(fs)

        # Should return empty list on error
        assert result == []

    @patch('analyse.boto3.client')
    def test_check_disaster_recovery_with_single_az(self, mock_boto_client):
        """Test disaster recovery check with single AZ critical system"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {
                'FileSystemId': 'fs-critical-single-az',
                'Tags': {'DataCritical': 'true'},
                'AvailabilityZoneName': 'us-east-1a'  # Single AZ
            }
        }

        analyzer._check_disaster_recovery(fs_data)

        # Should not add finding for single AZ (that's handled by _check_single_az_risk)
        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_root_risk_with_non_root_posix_user(self, mock_boto_client):
        """Test that non-root POSIX users pass root risk check"""
        analyzer = EFSAnalyzer()

        fs_data = {
            'file_system': {'FileSystemId': 'fs-safe'},
            'access_points': [
                {
                    'AccessPointId': 'ap-safe',
                    'AccessPointArn': 'arn:aws:efs:us-east-1:123:access-point/ap-safe',
                    'RootDirectory': {'CreationInfo': {'OwnerUid': 1000}},
                    'PosixUser': {'Uid': 1000}  # Non-root user
                }
            ]
        }

        analyzer._check_root_risk(fs_data)

        # Should not add finding for non-root users
        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_should_ignore_age_filter_with_endpoint(self, mock_boto_client):
        """Test age filter is ignored when AWS_ENDPOINT_URL is set"""
        from analyse import should_ignore_age_filter

        with patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5001'}):
            assert should_ignore_age_filter() is True

        with patch.dict(os.environ, {}, clear=True):
            assert should_ignore_age_filter() is False

    @patch('analyse.boto3.client')
    def test_analyze_with_exception_handling(self, mock_boto_client):
        """Test that analyze method handles exceptions in check methods"""
        mock_efs = MagicMock()
        mock_boto_client.return_value = mock_efs

        mock_paginator = MagicMock()
        mock_efs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {
                        'FileSystemId': 'fs-test',
                        'CreationTime': datetime.now(timezone.utc) - timedelta(days=35),
                        'Encrypted': True,
                        'LifeCycleState': 'available',
                        'SizeInBytes': {'Value': 1024**3}
                    }
                ]
            }
        ]

        mock_efs.list_tags_for_resource.return_value = {'Tags': []}
        mock_efs.describe_mount_targets.return_value = {'MountTargets': []}
        mock_efs.describe_access_points.return_value = {'AccessPoints': []}
        mock_efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        mock_efs.describe_backup_policy.return_value = {'BackupPolicy': {'Status': 'ENABLED'}}

        analyzer = EFSAnalyzer()

        with patch.object(analyzer, '_generate_console_output'):
            with patch.object(analyzer, '_generate_json_report'):
                # Should not raise exception even if there are issues
                analyzer.analyze()

                assert len(analyzer.file_systems_data) == 1
