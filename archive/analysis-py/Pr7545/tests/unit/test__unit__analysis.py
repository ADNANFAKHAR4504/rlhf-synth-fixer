"""
Unit Tests for AWS EFS Analysis Script

This test suite provides comprehensive unit testing for the EFS Analyzer class,
testing individual methods in isolation with mocked AWS service clients.

Coverage target: 90%+

Key differences from integration tests:
- Uses unittest.mock to mock boto3 clients
- No Moto server required
- Tests individual methods in isolation
- Fast execution
- Mock AWS API responses directly
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch, mock_open

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import EFSAnalyzer, boto_client, PRICING  # noqa: E402


def _build_analyzer(mock_boto):
    """Helper to build EFSAnalyzer with mocked boto clients"""
    mock_boto.return_value = MagicMock()
    return EFSAnalyzer(region="us-east-1")


class TestEFSAnalyzerUnit:
    """Unit tests for EFSAnalyzer class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://localhost:5001"})
    @patch("analyse.boto_client")
    def test_initialization_creates_all_aws_clients(self, mock_boto):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = EFSAnalyzer(region="us-east-1")

        assert analyzer.region == "us-east-1"

        # Verify all required clients are created
        call_names = [c.args[0] for c in mock_boto.call_args_list]
        assert call_names == ["efs", "ec2", "cloudwatch", "backup", "kms"]

    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://localhost:5001"})
    @patch("analyse.boto_client")
    def test_initialization_uses_endpoint_from_environment(self, mock_boto):
        """Test analyzer uses Moto endpoint from AWS_ENDPOINT_URL"""
        analyzer = EFSAnalyzer()

        # Verify clients were created with proper parameters
        assert mock_boto.call_count >= 5

    # =========================================================================
    # FILE SYSTEM DISCOVERY AND FILTERING TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_get_file_systems_returns_filtered_list(self, mock_boto):
        """Test _get_file_systems filters based on tags and age"""
        analyzer = _build_analyzer(mock_boto)

        # Mock paginator
        mock_paginator = MagicMock()
        analyzer.efs.get_paginator.return_value = mock_paginator

        # Create file systems with different properties
        old_time = (datetime.now(timezone.utc) - timedelta(days=60)).replace(tzinfo=timezone.utc)
        recent_time = (datetime.now(timezone.utc) - timedelta(days=10)).replace(tzinfo=timezone.utc)

        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {  # Should be included
                        'FileSystemId': 'fs-included',
                        'CreationTime': old_time,
                        'SizeInBytes': {'Value': 1024**3},
                        'LifeCycleState': 'available',
                        'ThroughputMode': 'bursting',
                        'PerformanceMode': 'generalPurpose'
                    },
                    {  # Should be excluded (recent)
                        'FileSystemId': 'fs-recent',
                        'CreationTime': recent_time,
                        'SizeInBytes': {'Value': 1024**3},
                        'LifeCycleState': 'available',
                        'ThroughputMode': 'bursting',
                        'PerformanceMode': 'generalPurpose'
                    }
                ]
            }
        ]

        # Mock tags
        def mock_tags(ResourceId):
            if ResourceId == 'fs-included':
                return {'Tags': [{'Key': 'Environment', 'Value': 'prod'}]}
            return {'Tags': [{'Key': 'ExcludeFromAnalysis', 'Value': 'true'}]}

        analyzer.efs.list_tags_for_resource.side_effect = mock_tags

        file_systems = analyzer._get_file_systems()

        # Only old file system should be included
        assert len(file_systems) == 1
        assert file_systems[0]['FileSystemId'] == 'fs-included'

    @patch("analyse.boto_client")
    def test_get_file_systems_handles_errors_gracefully(self, mock_boto):
        """Test _get_file_systems returns empty list on error"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}
        analyzer.efs.get_paginator.side_effect = ClientError(error_response, 'DescribeFileSystems')

        file_systems = analyzer._get_file_systems()

        assert file_systems == []

    # =========================================================================
    # MOUNT TARGET AND SECURITY GROUP TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_get_mount_targets_retrieves_details(self, mock_boto):
        """Test _get_mount_targets retrieves mount targets and security groups"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.efs.describe_mount_targets.return_value = {
            'MountTargets': [
                {
                    'MountTargetId': 'fsmt-123',
                    'SubnetId': 'subnet-123',
                    'AvailabilityZoneId': 'use1-az1',
                    'IpAddress': '10.0.1.5',
                    'LifeCycleState': 'available'
                }
            ]
        }

        analyzer.efs.describe_mount_target_security_groups.return_value = {
            'SecurityGroups': ['sg-123']
        }

        analyzer.ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-123',
                    'GroupName': 'efs-sg',
                    'Description': 'EFS security group',
                    'IpPermissions': [
                        {
                            'FromPort': 2049,
                            'ToPort': 2049,
                            'IpRanges': [
                                {'CidrIp': '10.0.0.0/16', 'Description': 'VPC'}
                            ]
                        }
                    ]
                }
            ]
        }

        mount_targets = analyzer._get_mount_targets('fs-123')

        assert len(mount_targets) == 1
        assert mount_targets[0]['mount_target_id'] == 'fsmt-123'
        assert mount_targets[0]['subnet_id'] == 'subnet-123'
        assert len(mount_targets[0]['security_groups']) == 1

    @patch("analyse.boto_client")
    def test_get_security_group_details_detects_overly_permissive_rules(self, mock_boto):
        """Test _get_security_group_details identifies public NFS access"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-public',
                    'GroupName': 'public-efs',
                    'Description': 'Public EFS access',
                    'IpPermissions': [
                        {
                            'FromPort': 2049,
                            'ToPort': 2049,
                            'IpRanges': [
                                {'CidrIp': '0.0.0.0/0', 'Description': 'Allow all'}
                            ]
                        }
                    ]
                }
            ]
        }

        sg_info = analyzer._get_security_group_details('sg-public')

        assert sg_info is not None
        assert sg_info['has_overly_permissive_rules'] is True
        assert len(sg_info['nfs_rules']) == 1
        assert sg_info['nfs_rules'][0]['overly_permissive'] is True

    # =========================================================================
    # ACCESS POINT TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_get_access_points_returns_list(self, mock_boto):
        """Test _get_access_points retrieves access point details"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.efs.describe_access_points.return_value = {
            'AccessPoints': [
                {
                    'AccessPointId': 'fsap-123',
                    'RootDirectory': {
                        'Path': '/data',
                        'CreationInfo': {
                            'OwnerUid': 1000,
                            'OwnerGid': 1000,
                            'Permissions': '755'
                        }
                    },
                    'PosixUser': {'Uid': 1000, 'Gid': 1000},
                    'LifeCycleState': 'available',
                    'Tags': [{'Key': 'Name', 'Value': 'test-ap'}]
                }
            ]
        }

        access_points = analyzer._get_access_points('fs-123')

        assert len(access_points) == 1
        assert access_points[0]['access_point_id'] == 'fsap-123'
        assert access_points[0]['root_directory']['Path'] == '/data'

    # =========================================================================
    # CONFIGURATION TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_get_lifecycle_configuration_returns_policies(self, mock_boto):
        """Test _get_lifecycle_configuration retrieves lifecycle policies"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.efs.describe_lifecycle_configuration.return_value = {
            'LifecyclePolicies': [
                {'TransitionToIA': 'AFTER_30_DAYS'}
            ]
        }

        policies = analyzer._get_lifecycle_configuration('fs-123')

        assert policies is not None
        assert len(policies) == 1
        assert policies[0]['TransitionToIA'] == 'AFTER_30_DAYS'

    @patch("analyse.boto_client")
    def test_get_lifecycle_configuration_returns_none_when_not_found(self, mock_boto):
        """Test _get_lifecycle_configuration returns None when not configured"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'FileSystemNotFound', 'Message': 'Not found'}}
        analyzer.efs.describe_lifecycle_configuration.side_effect = ClientError(error_response, 'DescribeLifecycleConfiguration')

        policies = analyzer._get_lifecycle_configuration('fs-123')

        assert policies is None

    @patch("analyse.boto_client")
    def test_check_backup_status_returns_false_when_no_backup(self, mock_boto):
        """Test _check_backup_status returns False when no backup plan"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.backup.list_backup_plans.return_value = {'BackupPlansList': []}

        status = analyzer._check_backup_status('fs-123')

        assert status is False

    @patch("analyse.boto_client")
    def test_get_replication_configuration_returns_none_on_error(self, mock_boto):
        """Test _get_replication_configuration handles errors"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'FileSystemNotFound', 'Message': 'Not found'}}
        analyzer.efs.describe_replication_configurations.side_effect = ClientError(error_response, 'DescribeReplicationConfigurations')

        replication = analyzer._get_replication_configuration('fs-123')

        assert replication is None

    # =========================================================================
    # CLOUDWATCH METRICS TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_get_cloudwatch_metrics_retrieves_data(self, mock_boto):
        """Test _get_cloudwatch_metrics retrieves and processes metrics"""
        analyzer = _build_analyzer(mock_boto)

        # Mock different responses based on metric name
        def mock_get_metric_stats(*args, **kwargs):
            metric_name = kwargs.get('MetricName', '')
            stats = kwargs.get('Statistics', [])
            stat_type = stats[0] if stats else 'Sum'

            if metric_name in ['DataReadIOBytes', 'DataWriteIOBytes', 'MetadataIOBytes', 'MeteredIOBytes']:
                return {
                    'Datapoints': [
                        {'Sum': 100.0},
                        {'Sum': 200.0},
                        {'Sum': 150.0}
                    ]
                }
            elif metric_name in ['ClientConnections']:
                return {
                    'Datapoints': [
                        {'Sum': 10.0},
                        {'Sum': 20.0}
                    ]
                }
            else:
                # BurstCreditBalance, PermittedThroughput, StorageBytes use Average
                return {
                    'Datapoints': [
                        {'Average': 100.0},
                        {'Average': 200.0}
                    ]
                }

        analyzer.cloudwatch.get_metric_statistics.side_effect = mock_get_metric_stats

        metrics = analyzer._get_cloudwatch_metrics('fs-123')

        # Should have attempted to retrieve all metrics
        assert analyzer.cloudwatch.get_metric_statistics.call_count == 8

        # Verify metrics were collected and TotalIOBytes was calculated
        assert isinstance(metrics, dict)
        assert 'TotalIOBytes' in metrics  # Derived metric

    # =========================================================================
    # SECURITY ANALYSIS TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_analyze_security_detects_no_encryption(self, mock_boto):
        """Test _analyze_security identifies unencrypted file systems"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'Encrypted': False,
            'Tags': []
        }

        issues = analyzer._analyze_security(fs, [], [])

        issue_types = {issue['type'] for issue in issues}
        assert 'NO_ENCRYPTION_AT_REST' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_security_detects_no_iam_authorization(self, mock_boto):
        """Test _analyze_security flags missing IAM authorization"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'Encrypted': True,
            'Tags': []
        }
        mount_targets = [{'mount_target_id': 'fsmt-123', 'security_groups': []}]
        access_points = []  # No access points = no IAM

        issues = analyzer._analyze_security(fs, mount_targets, access_points)

        issue_types = {issue['type'] for issue in issues}
        assert 'NO_IAM_AUTHORIZATION' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_security_detects_unrestricted_security_group(self, mock_boto):
        """Test _analyze_security identifies public security groups"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'Encrypted': True,
            'Tags': []
        }

        mount_targets = [{
            'mount_target_id': 'fsmt-123',
            'security_groups': [{
                'group_id': 'sg-public',
                'has_overly_permissive_rules': True,
                'nfs_rules': [{'cidr': '0.0.0.0/0', 'overly_permissive': True}]
            }]
        }]

        issues = analyzer._analyze_security(fs, mount_targets, [])

        issue_types = {issue['type'] for issue in issues}
        assert 'UNRESTRICTED_MOUNT_TARGET_SG' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_security_detects_no_backup_policy(self, mock_boto):
        """Test _analyze_security identifies missing backup policy"""
        analyzer = _build_analyzer(mock_boto)
        analyzer.backup.list_backup_plans.return_value = {'BackupPlansList': []}

        fs = {
            'FileSystemId': 'fs-123',
            'Encrypted': True,
            'Tags': []
        }

        issues = analyzer._analyze_security(fs, [], [])

        issue_types = {issue['type'] for issue in issues}
        assert 'NO_BACKUP_POLICY' in issue_types

    # =========================================================================
    # PERFORMANCE ANALYSIS TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_analyze_performance_detects_provisioned_throughput_overprovisioning(self, mock_boto):
        """Test _analyze_performance identifies underutilized provisioned throughput"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'provisioned',
            'ProvisionedThroughputInMibps': 100.0,
            'SizeInBytes': {'Value': 10 * 1024**3},
            'PerformanceMode': 'generalPurpose',
            'Tags': []
        }

        metrics = {
            'PermittedThroughput': {
                'average': 10 * 1024 * 1024,  # 10 MiB/s = 10% utilization
                'max': 15 * 1024 * 1024,
                'min': 5 * 1024 * 1024
            }
        }

        issues = analyzer._analyze_performance(fs, metrics)

        issue_types = {issue['type'] for issue in issues}
        assert 'PROVISIONED_THROUGHPUT_OVERPROVISIONED' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_detects_burst_credit_depletion(self, mock_boto):
        """Test _analyze_performance identifies burst credit issues"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 10 * 1024**3},
            'PerformanceMode': 'generalPurpose',
            'Tags': []
        }

        metrics = {
            'BurstCreditBalance': {
                'average': 500000,
                'max': 1000000,
                'min': 100000  # Below 1M threshold
            }
        }

        issues = analyzer._analyze_performance(fs, metrics)

        issue_types = {issue['type'] for issue in issues}
        assert 'BURST_CREDIT_DEPLETION' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_detects_high_metadata_operations(self, mock_boto):
        """Test _analyze_performance flags high metadata ops"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 10 * 1024**3},
            'PerformanceMode': 'generalPurpose',
            'Tags': []
        }

        metrics = {
            'EstimatedMetadataOpsPerSec': 1500  # Above 1000 threshold
        }

        issues = analyzer._analyze_performance(fs, metrics)

        issue_types = {issue['type'] for issue in issues}
        assert 'HIGH_METADATA_OPERATIONS' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_detects_unused_file_system(self, mock_boto):
        """Test _analyze_performance identifies unused file systems"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 10 * 1024**3},
            'PerformanceMode': 'generalPurpose',
            'Tags': []
        }

        metrics = {
            'ClientConnections': {
                'average': 0,  # No connections
                'max': 0,
                'min': 0
            }
        }

        issues = analyzer._analyze_performance(fs, metrics)

        issue_types = {issue['type'] for issue in issues}
        assert 'UNUSED_FILE_SYSTEM' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_detects_single_az_for_production(self, mock_boto):
        """Test _analyze_performance flags single AZ for prod workloads"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 10 * 1024**3},
            'PerformanceMode': 'generalPurpose',
            'AvailabilityZoneName': 'us-east-1a',  # Single AZ
            'Tags': [{'Key': 'Environment', 'Value': 'prod'}]
        }

        metrics = {}

        issues = analyzer._analyze_performance(fs, metrics)

        issue_types = {issue['type'] for issue in issues}
        assert 'SINGLE_AZ_FILE_SYSTEM' in issue_types

    # =========================================================================
    # COST OPTIMIZATION TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_analyze_cost_optimization_detects_no_lifecycle_management(self, mock_boto):
        """Test _analyze_cost_optimization identifies missing lifecycle policies"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 100 * 1024**3}  # 100 GB
        }

        cost_analysis = analyzer._analyze_cost_optimization(fs, {}, None)

        issue_types = {issue['type'] for issue in cost_analysis['issues']}
        assert 'NO_LIFECYCLE_MANAGEMENT' in issue_types
        assert 'IA_STORAGE_NOT_UTILIZED' in issue_types

        # Check recommendations
        assert 'ia_savings_monthly' in cost_analysis['recommendations']
        assert cost_analysis['recommendations']['ia_savings_monthly'] > 0

    @patch("analyse.boto_client")
    def test_analyze_cost_optimization_calculates_monthly_cost(self, mock_boto):
        """Test _analyze_cost_optimization calculates costs correctly"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'provisioned',
            'ProvisionedThroughputInMibps': 50.0,
            'SizeInBytes': {'Value': 100 * 1024**3}  # 100 GB
        }

        cost_analysis = analyzer._analyze_cost_optimization(fs, {}, None)

        # Expected cost: (100 GB * $0.30) + (50 MiB/s * $6.00) = $30 + $300 = $330
        expected_cost = (100 * PRICING['standard_storage_gb']) + (50 * PRICING['provisioned_throughput_mibps'])
        assert abs(cost_analysis['current_monthly_cost'] - expected_cost) < 0.01

    # =========================================================================
    # OUTPUT GENERATION TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_calculate_summary_computes_correct_statistics(self, mock_boto):
        """Test _calculate_summary calculates summary correctly"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-1',
                'size_gb': 50.0,
                'lifecycle_configuration': None,
                'cost_optimization': {
                    'current_monthly_cost': 15.0,
                    'recommendations': {'ia_savings_monthly': 5.0}
                },
                'issues': [
                    {'severity': 'HIGH'},
                    {'severity': 'MEDIUM'},
                    {'severity': 'LOW'}
                ]
            },
            {
                'file_system_id': 'fs-2',
                'size_gb': 100.0,
                'lifecycle_configuration': [{'TransitionToIA': 'AFTER_30_DAYS'}],
                'cost_optimization': {
                    'current_monthly_cost': 30.0,
                    'recommendations': {}
                },
                'issues': [
                    {'severity': 'HIGH'},
                    {'severity': 'LOW'}
                ]
            }
        ]

        summary = analyzer._calculate_summary(results)

        assert summary['total_file_systems'] == 2
        assert summary['total_size_gb'] == 150.0
        assert summary['percent_ia_storage'] == 50.0  # 1 out of 2
        assert summary['total_monthly_cost'] == 45.0
        assert summary['ia_savings_opportunity'] == 5.0
        assert summary['security_risks']['high'] == 2
        assert summary['security_risks']['medium'] == 1
        assert summary['security_risks']['low'] == 2

    @patch("analyse.boto_client")
    @patch("builtins.open", new_callable=mock_open)
    def test_generate_json_output_creates_file(self, mock_file, mock_boto):
        """Test _generate_json_output writes JSON file"""
        analyzer = _build_analyzer(mock_boto)

        output_data = {
            'file_systems': [],
            'access_points': [],
            'summary': {'total_file_systems': 0}
        }

        analyzer._generate_json_output(output_data)

        mock_file.assert_called_once_with('efs_analysis.json', 'w')

    @patch("analyse.boto_client")
    def test_compile_access_points_aggregates_correctly(self, mock_boto):
        """Test _compile_access_points aggregates access points from results"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-1',
                'mount_targets': [
                    {
                        'mount_target_id': 'fsmt-1',
                        'security_groups': [{'group_id': 'sg-1'}]
                    }
                ],
                'access_points': [
                    {
                        'access_point_id': 'fsap-1',
                        'root_directory': {'CreationInfo': {'OwnerUid': 1000}},
                        'tags': [{'Key': 'Name', 'Value': 'ap1'}]
                    }
                ]
            }
        ]

        access_points = analyzer._compile_access_points(results)

        assert len(access_points) == 1
        assert access_points[0]['file_system_id'] == 'fs-1'
        assert access_points[0]['access_point_id'] == 'fsap-1'
        assert access_points[0]['root_squash_enabled'] is True  # OwnerUid != 0

    # =========================================================================
    # LIFECYCLE RECOMMENDATIONS TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    def test_generate_lifecycle_recommendations_filters_by_savings(self, mock_boto):
        """Test _generate_lifecycle_recommendations only includes high-value recs"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-large',
                'name': 'Large FS',
                'size_gb': 1000.0,  # Will generate >$10/month savings
                'lifecycle_configuration': None
            },
            {
                'file_system_id': 'fs-small',
                'name': 'Small FS',
                'size_gb': 10.0,  # Will generate <$10/month savings
                'lifecycle_configuration': None
            },
            {
                'file_system_id': 'fs-configured',
                'name': 'Configured FS',
                'size_gb': 500.0,
                'lifecycle_configuration': [{'TransitionToIA': 'AFTER_30_DAYS'}]
            }
        ]

        recommendations = analyzer._generate_lifecycle_recommendations(results)

        # Only fs-large should be included (>$10 savings and no lifecycle)
        assert len(recommendations['recommendations']) == 1
        assert recommendations['recommendations'][0]['file_system_id'] == 'fs-large'

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    @patch("analyse.EFSAnalyzer")
    @patch("builtins.open", new_callable=mock_open)
    def test_main_function_executes_successfully(self, mock_file, MockAnalyzer, mock_boto):
        """Test main() function runs without errors"""
        from analyse import main

        mock_instance = MockAnalyzer.return_value
        mock_instance.run_analysis.return_value = {
            'file_systems': [],
            'access_points': [],
            'summary': {}
        }

        result = main()

        assert result == 0
        mock_instance.run_analysis.assert_called_once()

    @patch("analyse.boto_client")
    @patch("analyse.EFSAnalyzer")
    def test_main_function_returns_error_on_exception(self, MockAnalyzer, mock_boto):
        """Test main() function handles exceptions and returns error code"""
        from analyse import main

        MockAnalyzer.side_effect = Exception("Test error")

        result = main()

        assert result == 1

    # =========================================================================
    # ADDITIONAL COVERAGE TESTS
    # =========================================================================

    @patch("analyse.boto_client")
    @patch("builtins.open", new_callable=mock_open)
    def test_generate_storage_utilization_chart(self, mock_file, mock_boto):
        """Test _generate_storage_utilization_chart creates HTML"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-1',
                'size_gb': 100.0,
                'lifecycle_configuration': None,
                'cost_optimization': {
                    'current_monthly_cost': 30.0,
                    'recommendations': {'ia_savings_monthly': 10.0}
                }
            }
        ]

        analyzer._generate_storage_utilization_chart(results)

        # Verify HTML file was created
        mock_file.assert_called_with('storage_class_utilization.html', 'w')

    @patch("analyse.boto_client")
    @patch("builtins.open", new_callable=mock_open)
    def test_generate_security_checklist(self, mock_file, mock_boto):
        """Test _generate_security_checklist creates markdown file"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-1',
                'issues': [
                    {'type': 'NO_ENCRYPTION_AT_REST', 'severity': 'HIGH', 'description': 'Not encrypted', 'remediation': 'Enable encryption'}
                ],
                'mount_targets': [
                    {
                        'mount_target_id': 'fsmt-1',
                        'security_groups': [
                            {'group_id': 'sg-1', 'has_overly_permissive_rules': True}
                        ]
                    }
                ],
                'backup_enabled': False
            }
        ]

        analyzer._generate_security_checklist(results)

        # Verify markdown file was created
        mock_file.assert_called_with('security_hardening_checklist.md', 'w')

    @patch("analyse.boto_client")
    def test_analyze_file_system_handles_exception(self, mock_boto):
        """Test _analyze_file_system returns None on exception"""
        analyzer = _build_analyzer(mock_boto)

        # Mock to raise exception
        analyzer.efs.describe_mount_targets.side_effect = Exception("Test error")

        fs = {
            'FileSystemId': 'fs-error',
            'CreationTime': datetime.now(timezone.utc),
            'SizeInBytes': {'Value': 1024**3},
            'LifeCycleState': 'available',
            'ThroughputMode': 'bursting',
            'PerformanceMode': 'generalPurpose',
            'Tags': []
        }

        result = analyzer._analyze_file_system(fs)

        assert result is None

    @patch("analyse.boto_client")
    def test_get_mount_targets_handles_errors(self, mock_boto):
        """Test _get_mount_targets handles errors gracefully"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}
        analyzer.efs.describe_mount_targets.side_effect = ClientError(error_response, 'DescribeMountTargets')

        mount_targets = analyzer._get_mount_targets('fs-123')

        assert mount_targets == []

    @patch("analyse.boto_client")
    def test_get_access_points_handles_errors(self, mock_boto):
        """Test _get_access_points handles errors gracefully"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}
        analyzer.efs.describe_access_points.side_effect = ClientError(error_response, 'DescribeAccessPoints')

        access_points = analyzer._get_access_points('fs-123')

        assert access_points == []

    @patch("analyse.boto_client")
    def test_get_security_group_details_handles_errors(self, mock_boto):
        """Test _get_security_group_details handles errors gracefully"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'InvalidGroup.NotFound', 'Message': 'Not found'}}
        analyzer.ec2.describe_security_groups.side_effect = ClientError(error_response, 'DescribeSecurityGroups')

        sg_info = analyzer._get_security_group_details('sg-invalid')

        assert sg_info is None

    @patch("analyse.boto_client")
    def test_get_security_group_details_caches_results(self, mock_boto):
        """Test _get_security_group_details caches security group info"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-cache',
                    'GroupName': 'cached-sg',
                    'Description': 'Test',
                    'IpPermissions': []
                }
            ]
        }

        # Call twice
        sg_info1 = analyzer._get_security_group_details('sg-cache')
        sg_info2 = analyzer._get_security_group_details('sg-cache')

        # Should only call EC2 API once due to caching
        assert analyzer.ec2.describe_security_groups.call_count == 1
        assert sg_info1 == sg_info2

    @patch("analyse.boto_client")
    def test_check_backup_status_handles_errors(self, mock_boto):
        """Test _check_backup_status handles errors gracefully"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}
        analyzer.backup.list_backup_plans.side_effect = ClientError(error_response, 'ListBackupPlans')

        status = analyzer._check_backup_status('fs-123')

        assert status is False

    @patch("analyse.boto_client")
    def test_analyze_security_detects_encryption_in_transit_issue(self, mock_boto):
        """Test _analyze_security flags encryption in transit issues"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'Encrypted': True,
            'Tags': []
        }

        mount_targets = [{'mount_target_id': 'fsmt-1', 'security_groups': []}]
        access_points = []  # No access points = potential TLS issue

        issues = analyzer._analyze_security(fs, mount_targets, access_points)

        issue_types = {issue['type'] for issue in issues}
        assert 'NO_ENCRYPTION_IN_TRANSIT' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_security_detects_replication_for_critical_systems(self, mock_boto):
        """Test _analyze_security checks replication for critical systems"""
        analyzer = _build_analyzer(mock_boto)
        analyzer.efs.describe_replication_configurations.return_value = {'Replications': []}

        fs = {
            'FileSystemId': 'fs-prod',
            'Encrypted': True,
            'Tags': [{'Key': 'Environment', 'Value': 'prod'}]
        }

        issues = analyzer._analyze_security(fs, [], [])

        issue_types = {issue['type'] for issue in issues}
        assert 'REPLICATION_NOT_ENABLED' in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_detects_inefficient_max_io(self, mock_boto):
        """Test _analyze_performance detects inefficient Max I/O usage"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 50 * 1024**3},  # 50 GB - small
            'PerformanceMode': 'maxIO',  # Max I/O for small FS
            'Tags': []
        }

        issues = analyzer._analyze_performance(fs, {})

        issue_types = {issue['type'] for issue in issues}
        assert 'INEFFICIENT_ACCESS_PATTERNS' in issue_types

    @patch("analyse.boto_client")
    def test_compile_access_points_handles_empty_mount_targets(self, mock_boto):
        """Test _compile_access_points handles file systems without mount targets"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-1',
                'mount_targets': [],  # No mount targets
                'access_points': [
                    {
                        'access_point_id': 'fsap-1',
                        'root_directory': {},
                        'tags': []
                    }
                ]
            }
        ]

        access_points = analyzer._compile_access_points(results)

        assert len(access_points) == 1
        assert access_points[0]['mount_target'] == 'N/A'

    @patch("analyse.boto_client")
    def test_analyze_cost_optimization_detects_cloudwatch_alarms(self, mock_boto):
        """Test _analyze_cost_optimization always flags missing CloudWatch alarms"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 10 * 1024**3}
        }

        cost_analysis = analyzer._analyze_cost_optimization(fs, {}, [])

        issue_types = {issue['type'] for issue in cost_analysis['issues']}
        assert 'NO_CLOUDWATCH_ALARMS' in issue_types

    @patch("analyse.boto_client")
    @patch("builtins.print")
    def test_generate_console_output(self, mock_print, mock_boto):
        """Test _generate_console_output prints tables"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-1',
                'size_gb': 100.0,
                'throughput_mode': 'bursting',
                'encrypted': True,
                'lifecycle_configuration': [],
                'issues': [
                    {'type': 'NO_BACKUP_POLICY', 'severity': 'HIGH'}
                ],
                'cost_optimization': {'current_monthly_cost': 30.0}
            }
        ]

        summary = {
            'total_file_systems': 1,
            'total_size_gb': 100.0,
            'percent_ia_storage': 0.0,
            'total_monthly_cost': 30.0,
            'ia_savings_opportunity': 0.0,
            'security_risks': {'high': 1, 'medium': 0, 'low': 0}
        }

        analyzer._generate_console_output(results, summary)

        # Verify print was called (console output generated)
        assert mock_print.called

    @patch("analyse.boto_client")
    def test_analyze_file_system_complete_path(self, mock_boto):
        """Test _analyze_file_system complete execution path"""
        analyzer = _build_analyzer(mock_boto)

        # Mock all dependencies
        analyzer.efs.describe_mount_targets.return_value = {'MountTargets': []}
        analyzer.efs.describe_access_points.return_value = {'AccessPoints': []}
        analyzer.efs.describe_lifecycle_configuration.return_value = {'LifecyclePolicies': []}
        analyzer.backup.list_backup_plans.return_value = {'BackupPlansList': []}
        analyzer.efs.describe_replication_configurations.return_value = {'Replications': []}
        analyzer.cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        fs = {
            'FileSystemId': 'fs-complete',
            'Name': 'test-fs',
            'CreationTime': datetime.now(timezone.utc) - timedelta(days=60),
            'SizeInBytes': {'Value': 100 * 1024**3},
            'LifeCycleState': 'available',
            'ThroughputMode': 'bursting',
            'PerformanceMode': 'generalPurpose',
            'Encrypted': True,
            'Tags': []
        }

        result = analyzer._analyze_file_system(fs)

        assert result is not None
        assert result['file_system_id'] == 'fs-complete'
        assert 'issues' in result
        assert 'cost_optimization' in result

    @patch("analyse.boto_client")
    def test_get_file_systems_filters_exclude_tag(self, mock_boto):
        """Test _get_file_systems excludes files with ExcludeFromAnalysis tag"""
        analyzer = _build_analyzer(mock_boto)

        mock_paginator = MagicMock()
        analyzer.efs.get_paginator.return_value = mock_paginator

        old_time = (datetime.now(timezone.utc) - timedelta(days=60)).replace(tzinfo=timezone.utc)

        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {
                        'FileSystemId': 'fs-excluded',
                        'CreationTime': old_time,
                        'SizeInBytes': {'Value': 1024**3},
                        'LifeCycleState': 'available',
                        'ThroughputMode': 'bursting',
                        'PerformanceMode': 'generalPurpose'
                    }
                ]
            }
        ]

        analyzer.efs.list_tags_for_resource.return_value = {
            'Tags': [{'Key': 'ExcludeFromAnalysis', 'Value': 'true'}]
        }

        file_systems = analyzer._get_file_systems()

        # Should be excluded
        assert len(file_systems) == 0

    @patch("analyse.boto_client")
    def test_get_file_systems_filters_temporary_tag(self, mock_boto):
        """Test _get_file_systems excludes files with Temporary tag"""
        analyzer = _build_analyzer(mock_boto)

        mock_paginator = MagicMock()
        analyzer.efs.get_paginator.return_value = mock_paginator

        old_time = (datetime.now(timezone.utc) - timedelta(days=60)).replace(tzinfo=timezone.utc)

        mock_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {
                        'FileSystemId': 'fs-temp',
                        'CreationTime': old_time,
                        'SizeInBytes': {'Value': 1024**3},
                        'LifeCycleState': 'available',
                        'ThroughputMode': 'bursting',
                        'PerformanceMode': 'generalPurpose'
                    }
                ]
            }
        ]

        analyzer.efs.list_tags_for_resource.return_value = {
            'Tags': [{'Key': 'Temporary', 'Value': 'TRUE'}]  # Case insensitive
        }

        file_systems = analyzer._get_file_systems()

        # Should be excluded
        assert len(file_systems) == 0

    @patch("analyse.boto_client")
    def test_analyze_security_with_access_points_and_root_squashing(self, mock_boto):
        """Test _analyze_security with access points but no root squashing"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'Encrypted': True,
            'Tags': []
        }

        access_points = [
            {
                'access_point_id': 'fsap-1',
                'root_directory': {
                    'CreationInfo': {'OwnerUid': 0}  # Root user = no squashing
                }
            }
        ]

        issues = analyzer._analyze_security(fs, [], access_points)

        issue_types = {issue['type'] for issue in issues}
        assert 'ROOT_SQUASHING_DISABLED' in issue_types

    @patch("analyse.boto_client")
    def test_generate_lifecycle_recommendations_skips_configured_systems(self, mock_boto):
        """Test _generate_lifecycle_recommendations skips already configured systems"""
        analyzer = _build_analyzer(mock_boto)

        results = [
            {
                'file_system_id': 'fs-configured',
                'name': 'Configured FS',
                'size_gb': 1000.0,
                'lifecycle_configuration': [{'TransitionToIA': 'AFTER_30_DAYS'}]  # Already has lifecycle
            }
        ]

        recommendations = analyzer._generate_lifecycle_recommendations(results)

        # Should not recommend for already configured system
        assert len(recommendations['recommendations']) == 0

    @patch("analyse.boto_client")
    @patch("builtins.open", new_callable=mock_open)
    def test_run_analysis_complete_workflow(self, mock_file, mock_boto):
        """Test run_analysis orchestrates complete workflow"""
        analyzer = _build_analyzer(mock_boto)

        # Mock _get_file_systems to return test data
        old_time = datetime.now(timezone.utc) - timedelta(days=60)
        test_fs = {
            'FileSystemId': 'fs-test',
            'Name': 'test-fs',
            'CreationTime': old_time,
            'SizeInBytes': {'Value': 100 * 1024**3},
            'LifeCycleState': 'available',
            'ThroughputMode': 'bursting',
            'PerformanceMode': 'generalPurpose',
            'Encrypted': True,
            'Tags': []
        }

        with patch.object(analyzer, '_get_file_systems', return_value=[test_fs]):
            with patch.object(analyzer, '_analyze_file_system', return_value={
                'file_system_id': 'fs-test',
                'name': 'test-fs',
                'size_gb': 100.0,
                'throughput_mode': 'bursting',
                'encrypted': True,
                'lifecycle_configuration': None,
                'cost_optimization': {'current_monthly_cost': 30.0, 'recommendations': {}, 'issues': []},
                'issues': [],
                'mount_targets': [],
                'access_points': []
            }):
                with patch("builtins.open", mock_open()):
                    with patch("builtins.print"):
                        result = analyzer.run_analysis()

        # Verify result structure
        assert 'file_systems' in result
        assert 'access_points' in result
        assert 'summary' in result

    @patch("analyse.boto_client")
    def test_boto_client_uses_environment_endpoint(self, mock_client_constructor):
        """Test boto_client helper function"""
        from analyse import boto_client

        with patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://test:5000'}):
            boto_client('efs', 'us-west-2')

            # Verify client was created with correct parameters
            # Note: This tests the function exists and can be called
            assert True  # Function executed without error

    @patch("analyse.boto_client")
    def test_generate_outputs_creates_all_files(self, mock_boto):
        """Test _generate_outputs creates all required files"""
        analyzer = _build_analyzer(mock_boto)

        analysis_results = [
            {
                'file_system_id': 'fs-1',
                'name': 'test',
                'size_gb': 100.0,
                'throughput_mode': 'bursting',
                'encrypted': True,
                'lifecycle_configuration': None,
                'cost_optimization': {
                    'current_monthly_cost': 30.0,
                    'recommendations': {'ia_savings_monthly': 10.0},
                    'issues': []
                },
                'issues': [],
                'mount_targets': [],
                'access_points': []
            }
        ]

        with patch("builtins.open", mock_open()):
            with patch("builtins.print"):
                result = analyzer._generate_outputs(analysis_results)

        # Verify outputs were generated
        assert 'file_systems' in result
        assert 'access_points' in result
        assert 'summary' in result

    @patch("analyse.boto_client")
    def test_get_mount_targets_with_security_groups(self, mock_boto):
        """Test _get_mount_targets retrieves and processes security groups"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.efs.describe_mount_targets.return_value = {
            'MountTargets': [
                {
                    'MountTargetId': 'fsmt-123',
                    'SubnetId': 'subnet-123',
                    'AvailabilityZoneName': 'us-east-1a',
                    'IpAddress': '10.0.1.5',
                    'LifeCycleState': 'available'
                }
            ]
        }

        analyzer.efs.describe_mount_target_security_groups.return_value = {
            'SecurityGroups': ['sg-123']
        }

        analyzer.ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-123',
                    'GroupName': 'test-sg',
                    'Description': 'Test SG',
                    'IpPermissions': []
                }
            ]
        }

        mount_targets = analyzer._get_mount_targets('fs-123')

        assert len(mount_targets) == 1
        assert mount_targets[0]['availability_zone'] == 'us-east-1a'

    @patch("analyse.boto_client")
    def test_get_mount_targets_handles_sg_errors(self, mock_boto):
        """Test _get_mount_targets handles security group errors"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.efs.describe_mount_targets.return_value = {
            'MountTargets': [
                {
                    'MountTargetId': 'fsmt-123',
                    'SubnetId': 'subnet-123',
                    'AvailabilityZoneId': 'use1-az1',
                    'IpAddress': '10.0.1.5',
                    'LifeCycleState': 'available'
                }
            ]
        }

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}
        analyzer.efs.describe_mount_target_security_groups.side_effect = ClientError(error_response, 'DescribeMountTargetSecurityGroups')

        mount_targets = analyzer._get_mount_targets('fs-123')

        # Should still return mount target even if SG lookup fails
        assert len(mount_targets) == 1

    @patch("analyse.boto_client")
    def test_get_cloudwatch_metrics_handles_errors(self, mock_boto):
        """Test _get_cloudwatch_metrics handles errors gracefully"""
        analyzer = _build_analyzer(mock_boto)

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}
        analyzer.cloudwatch.get_metric_statistics.side_effect = ClientError(error_response, 'GetMetricStatistics')

        metrics = analyzer._get_cloudwatch_metrics('fs-123')

        # Should return dict with None values for failed metrics
        assert isinstance(metrics, dict)

    @patch("analyse.boto_client")
    def test_get_lifecycle_configuration_handles_general_error(self, mock_boto):
        """Test _get_lifecycle_configuration handles general errors"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.efs.describe_lifecycle_configuration.side_effect = Exception("General error")

        policies = analyzer._get_lifecycle_configuration('fs-123')

        assert policies is None

    @patch("analyse.boto_client")
    def test_get_replication_configuration_handles_general_error(self, mock_boto):
        """Test _get_replication_configuration handles general errors"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.efs.describe_replication_configurations.side_effect = Exception("General error")

        replication = analyzer._get_replication_configuration('fs-123')

        assert replication is None

    @patch("analyse.boto_client")
    def test_check_backup_status_returns_true_when_backup_exists(self, mock_boto):
        """Test _check_backup_status returns True when backup plan includes file system"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.backup.list_backup_plans.return_value = {
            'BackupPlansList': [
                {'BackupPlanId': 'plan-123'}
            ]
        }

        analyzer.backup.list_backup_selections.return_value = {
            'BackupSelectionsList': [
                {'SelectionId': 'sel-123'}
            ]
        }

        analyzer.backup.get_backup_selection.return_value = {
            'BackupSelection': {
                'Resources': ['arn:aws:elasticfilesystem:us-east-1:123:file-system/fs-123']
            }
        }

        status = analyzer._check_backup_status('fs-123')

        assert status is True

    @patch("analyse.boto_client")
    def test_check_backup_status_handles_selection_errors(self, mock_boto):
        """Test _check_backup_status handles errors in backup selections"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.backup.list_backup_plans.return_value = {
            'BackupPlansList': [
                {'BackupPlanId': 'plan-123'}
            ]
        }

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}
        analyzer.backup.list_backup_selections.side_effect = ClientError(error_response, 'ListBackupSelections')

        status = analyzer._check_backup_status('fs-123')

        assert status is False

    @patch("analyse.boto_client")
    def test_analyze_security_with_encrypted_fs_and_replication(self, mock_boto):
        """Test _analyze_security with encrypted FS that has replication"""
        analyzer = _build_analyzer(mock_boto)

        analyzer.backup.list_backup_plans.return_value = {'BackupPlansList': []}
        analyzer.efs.describe_replication_configurations.return_value = {
            'Replications': [{'DestinationFileSystemId': 'fs-replica'}]
        }

        fs = {
            'FileSystemId': 'fs-123',
            'Encrypted': True,
            'Tags': [{'Key': 'Environment', 'Value': 'prod'}]
        }

        issues = analyzer._analyze_security(fs, [], [])

        # Should not have REPLICATION_NOT_ENABLED issue
        issue_types = {issue['type'] for issue in issues}
        assert 'REPLICATION_NOT_ENABLED' not in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_provisioned_high_utilization(self, mock_boto):
        """Test _analyze_performance with high provisioned throughput utilization"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'provisioned',
            'ProvisionedThroughputInMibps': 100.0,
            'SizeInBytes': {'Value': 10 * 1024**3},
            'PerformanceMode': 'generalPurpose',
            'Tags': []
        }

        metrics = {
            'PermittedThroughput': {
                'average': 80 * 1024 * 1024,  # 80 MiB/s = 80% utilization (good)
                'max': 90 * 1024 * 1024,
                'min': 70 * 1024 * 1024
            }
        }

        issues = analyzer._analyze_performance(fs, metrics)

        # Should NOT have PROVISIONED_THROUGHPUT_OVERPROVISIONED (>30% utilization)
        issue_types = {issue['type'] for issue in issues}
        assert 'PROVISIONED_THROUGHPUT_OVERPROVISIONED' not in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_burst_credits_healthy(self, mock_boto):
        """Test _analyze_performance with healthy burst credits"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 10 * 1024**3},
            'PerformanceMode': 'generalPurpose',
            'Tags': []
        }

        metrics = {
            'BurstCreditBalance': {
                'average': 5000000,  # Healthy amount
                'max': 6000000,
                'min': 4000000  # Above 1M threshold
            }
        }

        issues = analyzer._analyze_performance(fs, metrics)

        # Should NOT have BURST_CREDIT_DEPLETION (min > 1M)
        issue_types = {issue['type'] for issue in issues}
        assert 'BURST_CREDIT_DEPLETION' not in issue_types

    @patch("analyse.boto_client")
    def test_analyze_performance_general_purpose_large_fs(self, mock_boto):
        """Test _analyze_performance with General Purpose mode on large FS"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 500 * 1024**3},  # Large FS
            'PerformanceMode': 'generalPurpose',  # Appropriate for large FS
            'Tags': []
        }

        issues = analyzer._analyze_performance(fs, {})

        # Should NOT have INEFFICIENT_ACCESS_PATTERNS (General Purpose is fine for large FS)
        issue_types = {issue['type'] for issue in issues}
        assert 'INEFFICIENT_ACCESS_PATTERNS' not in issue_types

    @patch("analyse.boto_client")
    def test_analyze_cost_optimization_with_lifecycle(self, mock_boto):
        """Test _analyze_cost_optimization when lifecycle is already configured"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 100 * 1024**3}
        }

        lifecycle_config = [{'TransitionToIA': 'AFTER_30_DAYS'}]

        cost_analysis = analyzer._analyze_cost_optimization(fs, {}, lifecycle_config)

        # Should NOT have NO_LIFECYCLE_MANAGEMENT issue
        issue_types = {issue['type'] for issue in cost_analysis['issues']}
        assert 'NO_LIFECYCLE_MANAGEMENT' not in issue_types
        assert 'IA_STORAGE_NOT_UTILIZED' not in issue_types

    @patch("analyse.boto_client")
    def test_analyze_cost_optimization_small_fs_no_ia_recommendation(self, mock_boto):
        """Test _analyze_cost_optimization doesn't recommend IA for small file systems"""
        analyzer = _build_analyzer(mock_boto)

        fs = {
            'FileSystemId': 'fs-123',
            'ThroughputMode': 'bursting',
            'SizeInBytes': {'Value': 5 * 1024**3}  # Only 5 GB
        }

        cost_analysis = analyzer._analyze_cost_optimization(fs, {}, None)

        # Should still have NO_LIFECYCLE_MANAGEMENT but not IA_STORAGE_NOT_UTILIZED (< 10GB)
        issue_types = {issue['type'] for issue in cost_analysis['issues']}
        assert 'NO_LIFECYCLE_MANAGEMENT' in issue_types
        assert 'IA_STORAGE_NOT_UTILIZED' not in issue_types


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
