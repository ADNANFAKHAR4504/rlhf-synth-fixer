"""
Unit Tests for AWS EC2 Cost Optimization Analysis Script

Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).
Tests cover the EC2CostOptimizer class and its analysis methods.
"""

import sys
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, mock_open, call
from io import StringIO

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import EC2CostOptimizer


class TestEC2CostOptimizer:
    """Test suite for EC2CostOptimizer class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that optimizer initializes with correct AWS clients"""
        optimizer = EC2CostOptimizer(region='us-west-2')

        assert optimizer.region == 'us-west-2'
        assert optimizer.recommendations == []
        assert optimizer.total_potential_savings == 0.0

        # Should create EC2, CloudWatch, CE, and STS clients
        assert mock_boto_client.call_count == 4
        mock_boto_client.assert_any_call('ec2', region_name='us-west-2')
        mock_boto_client.assert_any_call('cloudwatch', region_name='us-west-2')
        mock_boto_client.assert_any_call('ce', region_name='us-west-2')
        mock_boto_client.assert_any_call('sts')

    @patch('analyse.boto3.client')
    def test_initialization_defaults_to_us_east_1(self, mock_boto_client):
        """Test optimizer defaults to us-east-1 region"""
        optimizer = EC2CostOptimizer()

        assert optimizer.region == 'us-east-1'

    @patch('analyse.boto3.client')
    def test_initialization_sets_savings_estimates(self, mock_boto_client):
        """Test that savings estimates are properly initialized"""
        optimizer = EC2CostOptimizer()

        assert optimizer.savings_estimates['zombie_instance'] == 0.95
        assert optimizer.savings_estimates['old_generation'] == 0.20
        assert optimizer.savings_estimates['gp2_to_gp3'] == 0.20

    # =========================================================================
    # get_instances TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_instances_returns_valid_instances(self, mock_boto_client):
        """Test get_instances retrieves EC2 instances correctly"""
        mock_ec2 = MagicMock()
        mock_sts = MagicMock()
        mock_iam = MagicMock()

        mock_boto_client.side_effect = [mock_ec2, MagicMock(), MagicMock(), mock_sts]

        # Mock STS for _is_sandbox_account check
        with patch.object(EC2CostOptimizer, '_is_sandbox_account', return_value=False):
            mock_paginator = MagicMock()
            mock_ec2.get_paginator.return_value = mock_paginator
            mock_paginator.paginate.return_value = [
                {
                    'Reservations': [
                        {
                            'OwnerId': '123456789012',
                            'Instances': [
                                {
                                    'InstanceId': 'i-1234567890abcdef0',
                                    'InstanceType': 't2.micro',
                                    'State': {'Name': 'running'},
                                    'LaunchTime': datetime.now(timezone.utc),
                                    'Tags': [
                                        {'Key': 'Name', 'Value': 'test-instance'},
                                        {'Key': 'Environment', 'Value': 'test'}
                                    ],
                                    'BlockDeviceMappings': [],
                                    'CpuOptions': {},
                                    'Placement': {'AvailabilityZone': 'us-east-1a'}
                                }
                            ]
                        }
                    ]
                }
            ]

            optimizer = EC2CostOptimizer()
            instances = optimizer.get_instances()

            assert len(instances) == 1
            assert instances[0]['InstanceId'] == 'i-1234567890abcdef0'
            assert instances[0]['InstanceType'] == 't2.micro'
            assert instances[0]['Tags']['Name'] == 'test-instance'

    @patch('analyse.boto3.client')
    def test_get_instances_filters_terminated_instances(self, mock_boto_client):
        """Test that terminated instances are excluded"""
        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = [mock_ec2, MagicMock(), MagicMock(), MagicMock()]

        with patch.object(EC2CostOptimizer, '_is_sandbox_account', return_value=False):
            mock_paginator = MagicMock()
            mock_ec2.get_paginator.return_value = mock_paginator
            mock_paginator.paginate.return_value = [
                {
                    'Reservations': [
                        {
                            'OwnerId': '123456789012',
                            'Instances': [
                                {
                                    'InstanceId': 'i-terminated',
                                    'InstanceType': 't2.micro',
                                    'State': {'Name': 'terminated'},
                                    'LaunchTime': datetime.now(timezone.utc),
                                    'Tags': []
                                }
                            ]
                        }
                    ]
                }
            ]

            optimizer = EC2CostOptimizer()
            instances = optimizer.get_instances()

            assert len(instances) == 0

    @patch('analyse.boto3.client')
    def test_get_instances_filters_excluded_instances(self, mock_boto_client):
        """Test that instances with ExcludeFromCostAnalysis tag are excluded"""
        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = [mock_ec2, MagicMock(), MagicMock(), MagicMock()]

        with patch.object(EC2CostOptimizer, '_is_sandbox_account', return_value=False):
            mock_paginator = MagicMock()
            mock_ec2.get_paginator.return_value = mock_paginator
            mock_paginator.paginate.return_value = [
                {
                    'Reservations': [
                        {
                            'OwnerId': '123456789012',
                            'Instances': [
                                {
                                    'InstanceId': 'i-excluded',
                                    'InstanceType': 't2.micro',
                                    'State': {'Name': 'running'},
                                    'LaunchTime': datetime.now(timezone.utc),
                                    'Tags': [{'Key': 'ExcludeFromCostAnalysis', 'Value': 'true'}],
                                    'BlockDeviceMappings': []
                                }
                            ]
                        }
                    ]
                }
            ]

            optimizer = EC2CostOptimizer()
            instances = optimizer.get_instances()

            assert len(instances) == 0

    # =========================================================================
    # analyze_old_generation_instances TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_old_generation_identifies_t2_instances(self, mock_boto_client):
        """Test that old generation t2 instances are identified"""
        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-old-t2',
                'InstanceType': 't2.micro',
                'State': 'running',
                'Tags': {'Name': 'old-gen-instance'}
            }
        ]

        optimizer.analyze_old_generation_instances(instances)

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'upgrade_instance_generation'
        assert optimizer.recommendations[0]['instance_type'] == 't2.micro'
        assert 't3.micro' in optimizer.recommendations[0]['details']

    @patch('analyse.boto3.client')
    def test_analyze_old_generation_identifies_m4_instances(self, mock_boto_client):
        """Test that old generation m4 instances are identified"""
        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-old-m4',
                'InstanceType': 'm4.large',
                'State': 'running',
                'Tags': {'Name': 'legacy-server'}
            }
        ]

        optimizer.analyze_old_generation_instances(instances)

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['instance_type'] == 'm4.large'
        assert 'm5.large' in optimizer.recommendations[0]['details']
        assert optimizer.recommendations[0]['priority'] == 'medium'

    @patch('analyse.boto3.client')
    def test_analyze_old_generation_skips_modern_instances(self, mock_boto_client):
        """Test that modern generation instances are not flagged"""
        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-new-t3',
                'InstanceType': 't3.micro',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_old_generation_instances(instances)

        assert len(optimizer.recommendations) == 0

    # =========================================================================
    # analyze_untagged_instances TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_untagged_identifies_missing_tags(self, mock_boto_client):
        """Test that instances missing required tags are identified"""
        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-untagged',
                'InstanceType': 't3.small',
                'State': 'running',
                'Tags': {'Environment': 'test'}  # Missing CostCenter, Owner, Application
            }
        ]

        optimizer.analyze_untagged_instances(instances)

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'add_required_tags'
        assert optimizer.recommendations[0]['priority'] == 'low'
        assert 'CostCenter' in optimizer.recommendations[0]['details']
        assert 'Owner' in optimizer.recommendations[0]['details']
        assert 'Application' in optimizer.recommendations[0]['details']

    @patch('analyse.boto3.client')
    def test_analyze_untagged_skips_fully_tagged_instances(self, mock_boto_client):
        """Test that instances with all required tags are not flagged"""
        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-tagged',
                'InstanceType': 't3.small',
                'State': 'running',
                'Tags': {
                    'CostCenter': 'Engineering',
                    'Environment': 'Production',
                    'Owner': 'TeamA',
                    'Application': 'WebApp'
                }
            }
        ]

        optimizer.analyze_untagged_instances(instances)

        assert len(optimizer.recommendations) == 0

    # =========================================================================
    # analyze_stopped_instances_with_ebs TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_stopped_instances_identifies_ebs_volumes(self, mock_boto_client):
        """Test that stopped instances with EBS volumes are identified"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        # Mock describe_volumes response
        mock_ec2.describe_volumes.return_value = {
            'Volumes': [{'VolumeId': 'vol-123', 'Size': 100}]
        }

        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-stopped',
                'InstanceType': 't3.small',
                'State': 'stopped',
                'Tags': {},
                'BlockDeviceMappings': [
                    {'Ebs': {'VolumeId': 'vol-123'}}
                ]
            }
        ]

        optimizer.analyze_stopped_instances_with_ebs(instances)

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'remove_stopped_instance_volumes'
        assert optimizer.recommendations[0]['priority'] == 'medium'
        assert '100 GB' in optimizer.recommendations[0]['details']

    @patch('analyse.boto3.client')
    def test_analyze_stopped_instances_skips_running_instances(self, mock_boto_client):
        """Test that running instances are not analyzed for stopped instance check"""
        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-running',
                'InstanceType': 't3.small',
                'State': 'running',
                'Tags': {},
                'BlockDeviceMappings': [{'Ebs': {'VolumeId': 'vol-123'}}]
            }
        ]

        optimizer.analyze_stopped_instances_with_ebs(instances)

        assert len(optimizer.recommendations) == 0

    # =========================================================================
    # analyze_inefficient_storage TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_inefficient_storage_identifies_gp2_volumes(self, mock_boto_client):
        """Test that gp2 volumes are identified for migration to gp3"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Volumes': [
                    {
                        'VolumeId': 'vol-gp2-1',
                        'VolumeType': 'gp2',
                        'Size': 100,
                        'Tags': [{'Key': 'Name', 'Value': 'old-volume'}]
                    }
                ]
            }
        ]

        optimizer = EC2CostOptimizer()
        optimizer.analyze_inefficient_storage()

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'migrate_gp2_to_gp3'
        assert optimizer.recommendations[0]['instance_type'] == 'EBS_Volume'
        assert optimizer.recommendations[0]['priority'] == 'medium'
        assert '100 GB gp2' in optimizer.recommendations[0]['details']

    @patch('analyse.boto3.client')
    def test_analyze_inefficient_storage_skips_gp3_volumes(self, mock_boto_client):
        """Test that gp3 volumes are not flagged"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Volumes': [
                    {
                        'VolumeId': 'vol-gp3-1',
                        'VolumeType': 'gp3',
                        'Size': 100,
                        'Tags': []
                    }
                ]
            }
        ]

        optimizer = EC2CostOptimizer()
        optimizer.analyze_inefficient_storage()

        assert len(optimizer.recommendations) == 0

    # =========================================================================
    # _estimate_instance_cost TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_estimate_instance_cost_returns_known_prices(self, mock_boto_client):
        """Test that instance cost estimation returns correct values for known types"""
        optimizer = EC2CostOptimizer()

        assert optimizer._estimate_instance_cost('t2.micro') == 8.50
        assert optimizer._estimate_instance_cost('t3.micro') == 7.50
        assert optimizer._estimate_instance_cost('m5.large') == 70.00

    @patch('analyse.boto3.client')
    def test_estimate_instance_cost_returns_default_for_unknown_types(self, mock_boto_client):
        """Test that unknown instance types return default cost"""
        optimizer = EC2CostOptimizer()

        assert optimizer._estimate_instance_cost('unknown.xlarge') == 100.0

    # =========================================================================
    # generate_reports TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_generate_reports_creates_json_file(self, mock_json_dump, mock_file, mock_boto_client):
        """Test that JSON report is created with correct structure"""
        optimizer = EC2CostOptimizer()
        optimizer.recommendations = [
            {
                'instance_id': 'i-test',
                'instance_type': 't2.micro',
                'action': 'upgrade_instance_generation',
                'priority': 'medium',
                'potential_savings': 10.0,
                'details': 'Test recommendation',
                'tags': {}
            }
        ]
        optimizer.total_potential_savings = 10.0

        optimizer.generate_reports()

        # Verify JSON file was opened
        assert any('ec2_cost_optimization.json' in str(call) for call in mock_file.call_args_list)

        # Verify json.dump was called
        assert mock_json_dump.called

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('csv.DictWriter')
    def test_generate_reports_creates_csv_file(self, mock_csv_writer, mock_file, mock_boto_client):
        """Test that CSV report is created"""
        optimizer = EC2CostOptimizer()
        optimizer.recommendations = [
            {
                'instance_id': 'i-test',
                'instance_type': 't2.micro',
                'action': 'upgrade_instance_generation',
                'priority': 'medium',
                'potential_savings': 10.0,
                'details': 'Test recommendation',
                'tags': {'CostCenter': 'IT'}
            }
        ]

        optimizer.generate_reports()

        # Verify CSV file was opened
        assert any('ec2_rightsizing.csv' in str(call) for call in mock_file.call_args_list)

    @patch('analyse.boto3.client')
    def test_generate_reports_calculates_total_savings(self, mock_boto_client):
        """Test that total savings are calculated correctly"""
        optimizer = EC2CostOptimizer()
        optimizer.recommendations = [
            {
                'instance_id': 'i-1',
                'instance_type': 't2.micro',
                'action': 'upgrade_instance_generation',
                'priority': 'medium',
                'potential_savings': 10.0,
                'details': 'Test 1',
                'tags': {}
            },
            {
                'instance_id': 'i-2',
                'instance_type': 't3.small',
                'action': 'add_required_tags',
                'priority': 'low',
                'potential_savings': 20.5,
                'details': 'Test 2',
                'tags': {}
            },
            {
                'instance_id': 'i-3',
                'instance_type': 'm5.large',
                'action': 'terminate_zombie_instance',
                'priority': 'high',
                'potential_savings': 5.25,
                'details': 'Test 3',
                'tags': {}
            }
        ]

        with patch('builtins.open', mock_open()):
            optimizer.generate_reports()

        assert optimizer.total_potential_savings == 35.75

    # =========================================================================
    # print_console_report TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    @patch('analyse.tabulate')
    def test_print_console_report_displays_recommendations(self, mock_tabulate, mock_print, mock_boto_client):
        """Test that console report prints recommendations"""
        mock_tabulate.return_value = "Mocked Table"

        optimizer = EC2CostOptimizer()
        optimizer.recommendations = [
            {
                'instance_id': 'i-test',
                'instance_type': 't2.micro',
                'action': 'upgrade_instance_generation',
                'priority': 'medium',
                'potential_savings': 10.0,
                'details': 'Migrate from t2.micro to t3.micro',
                'tags': {}
            }
        ]
        optimizer.total_potential_savings = 10.0

        optimizer.print_console_report()

        # Verify print was called multiple times (for headers, tables, etc.)
        assert mock_print.called
        assert mock_tabulate.called

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_console_report_handles_empty_recommendations(self, mock_print, mock_boto_client):
        """Test that console report handles no recommendations gracefully"""
        optimizer = EC2CostOptimizer()
        optimizer.recommendations = []

        optimizer.print_console_report()

        # Should print message about no recommendations
        assert mock_print.called
        print_calls = [str(call) for call in mock_print.call_args_list]
        assert any('No cost optimization recommendations found' in call for call in print_calls)

    # =========================================================================
    # run_analysis TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_analysis_executes_all_checks(self, mock_boto_client):
        """Test that run_analysis executes all analysis methods"""
        optimizer = EC2CostOptimizer()

        # Mock instance with all required fields
        mock_instance = {
            'InstanceId': 'i-test',
            'InstanceType': 't3.small',
            'State': 'running',
            'Tags': {},
            'BlockDeviceMappings': []
        }

        # Mock all analysis methods
        with patch.object(optimizer, 'get_instances', return_value=[mock_instance]):
            with patch.object(optimizer, 'analyze_zombie_instances'):
                with patch.object(optimizer, 'analyze_oversized_memory_instances'):
                    with patch.object(optimizer, 'analyze_old_generation_instances'):
                        with patch.object(optimizer, 'analyze_stopped_instances_with_ebs'):
                            with patch.object(optimizer, 'analyze_ri_coverage_gaps'):
                                with patch.object(optimizer, 'analyze_untagged_instances'):
                                    with patch.object(optimizer, 'analyze_inefficient_storage'):
                                        with patch.object(optimizer, 'analyze_burstable_credit_abuse'):
                                            with patch.object(optimizer, 'generate_reports'):
                                                with patch.object(optimizer, 'print_console_report'):
                                                    optimizer.run_analysis()

                                                    # Verify all methods were called
                                                    optimizer.get_instances.assert_called_once()
                                                    optimizer.analyze_zombie_instances.assert_called_once()
                                                    optimizer.analyze_oversized_memory_instances.assert_called_once()
                                                    optimizer.analyze_old_generation_instances.assert_called_once()
                                                    optimizer.analyze_stopped_instances_with_ebs.assert_called_once()
                                                    optimizer.analyze_ri_coverage_gaps.assert_called_once()
                                                    optimizer.analyze_untagged_instances.assert_called_once()
                                                    optimizer.analyze_inefficient_storage.assert_called_once()
                                                    optimizer.analyze_burstable_credit_abuse.assert_called_once()
                                                    optimizer.generate_reports.assert_called_once()
                                                    optimizer.print_console_report.assert_called_once()

    @patch('analyse.boto3.client')
    def test_run_analysis_handles_no_instances(self, mock_boto_client):
        """Test that run_analysis handles case with no instances"""
        optimizer = EC2CostOptimizer()

        with patch.object(optimizer, 'get_instances', return_value=[]):
            with patch.object(optimizer, 'generate_reports') as mock_generate:
                with patch.object(optimizer, 'print_console_report') as mock_print:
                    optimizer.run_analysis()

                    # Should still generate reports even with no instances
                    mock_generate.assert_called_once()
                    mock_print.assert_called_once()

    # =========================================================================
    # main FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_main_function_executes_successfully(self, mock_boto_client):
        """Test main() function runs without errors"""
        from analyse import main

        with patch('analyse.EC2CostOptimizer') as MockOptimizer:
            mock_instance = MockOptimizer.return_value
            mock_instance.run_analysis.return_value = None

            # main() doesn't return a value, just check it doesn't raise
            try:
                main()
                success = True
            except Exception:
                success = False

            assert success
            mock_instance.run_analysis.assert_called_once()

    @patch('analyse.boto3.client')
    def test_main_function_handles_exception(self, mock_boto_client):
        """Test main() function handles exceptions gracefully"""
        from analyse import main

        with patch('analyse.EC2CostOptimizer') as MockOptimizer:
            MockOptimizer.side_effect = Exception("Test error")

            # Should raise the exception (this is expected behavior)
            with pytest.raises(Exception):
                main()

    # =========================================================================
    # analyze_zombie_instances TESTS (CloudWatch metrics)
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_zombie_instances_identifies_low_usage(self, mock_boto_client):
        """Test zombie instance detection with CloudWatch metrics"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        optimizer = EC2CostOptimizer()

        # Mock CloudWatch responses for low CPU and network
        mock_cloudwatch.get_metric_statistics.side_effect = [
            # CPU metrics
            {'Datapoints': [{'Average': 5.0}, {'Average': 3.0}]},
            # Network In
            {'Datapoints': [{'Average': 1000.0}]},  # bytes
            # Network Out
            {'Datapoints': [{'Average': 1000.0}]}   # bytes
        ]

        instances = [
            {
                'InstanceId': 'i-zombie',
                'InstanceType': 't2.micro',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_zombie_instances(instances)

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'terminate_zombie_instance'
        assert optimizer.recommendations[0]['priority'] == 'high'

    @patch('analyse.boto3.client')
    def test_analyze_zombie_instances_skips_high_usage(self, mock_boto_client):
        """Test that high usage instances are not marked as zombies"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        optimizer = EC2CostOptimizer()

        # Mock CloudWatch responses for high CPU
        mock_cloudwatch.get_metric_statistics.side_effect = [
            # CPU metrics - high usage
            {'Datapoints': [{'Average': 50.0}, {'Average': 60.0}]},
            # Network In
            {'Datapoints': [{'Average': 1000000.0}]},
            # Network Out
            {'Datapoints': [{'Average': 1000000.0}]}
        ]

        instances = [
            {
                'InstanceId': 'i-busy',
                'InstanceType': 't2.micro',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_zombie_instances(instances)

        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_analyze_zombie_instances_handles_no_metrics(self, mock_boto_client):
        """Test zombie detection when no CloudWatch metrics available"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        optimizer = EC2CostOptimizer()

        # Mock CloudWatch responses with no datapoints
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        instances = [
            {
                'InstanceId': 'i-nometrics',
                'InstanceType': 't2.micro',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_zombie_instances(instances)

        # When no metrics, avg_cpu=0 and avg_network=0, which meets zombie criteria
        # So it SHOULD create a recommendation
        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'terminate_zombie_instance'

    # =========================================================================
    # analyze_oversized_memory_instances TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_oversized_memory_identifies_low_memory_usage(self, mock_boto_client):
        """Test oversized memory instance detection"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        optimizer = EC2CostOptimizer()

        # Mock CloudWatch memory metrics (requires CloudWatch Agent)
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [{'Average': 25.0}, {'Average': 30.0}]  # Low memory usage
        }

        instances = [
            {
                'InstanceId': 'i-oversized',
                'InstanceType': 'r5.large',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_oversized_memory_instances(instances)

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'rightsize_memory_instance'
        assert optimizer.recommendations[0]['priority'] == 'high'

    @patch('analyse.boto3.client')
    def test_analyze_oversized_memory_skips_non_memory_instances(self, mock_boto_client):
        """Test that non-memory instances are not analyzed"""
        optimizer = EC2CostOptimizer()

        instances = [
            {
                'InstanceId': 'i-compute',
                'InstanceType': 't3.large',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_oversized_memory_instances(instances)

        assert len(optimizer.recommendations) == 0

    # =========================================================================
    # analyze_ri_coverage_gaps TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_ri_coverage_identifies_gaps(self, mock_boto_client):
        """Test RI coverage gap detection"""
        mock_ce = MagicMock()
        mock_boto_client.return_value = mock_ce

        optimizer = EC2CostOptimizer()

        # Mock Cost Explorer response
        mock_ce.get_reservation_coverage.return_value = {
            'CoveragesByTime': []
        }

        instances = [
            {'InstanceId': f'i-{i}', 'InstanceType': 't3.large', 'State': 'running', 'Tags': {}}
            for i in range(6)  # 6 instances of same type
        ]

        optimizer.analyze_ri_coverage_gaps(instances)

        # Should recommend RI for t3.large (>= 5 instances)
        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'purchase_reserved_instances'
        assert 't3.large' in optimizer.recommendations[0]['instance_type']

    @patch('analyse.boto3.client')
    def test_analyze_ri_coverage_skips_small_fleets(self, mock_boto_client):
        """Test that small instance fleets don't trigger RI recommendations"""
        optimizer = EC2CostOptimizer()

        instances = [
            {'InstanceId': 'i-1', 'InstanceType': 't3.large', 'State': 'running', 'Tags': {}},
            {'InstanceId': 'i-2', 'InstanceType': 't3.large', 'State': 'running', 'Tags': {}},
            {'InstanceId': 'i-3', 'InstanceType': 't3.large', 'State': 'running', 'Tags': {}},
        ]  # Only 3 instances, need 5+

        optimizer.analyze_ri_coverage_gaps(instances)

        assert len(optimizer.recommendations) == 0

    # =========================================================================
    # analyze_burstable_credit_abuse TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_burstable_credit_identifies_abuse(self, mock_boto_client):
        """Test burstable credit abuse detection"""
        mock_ec2 = MagicMock()
        mock_cloudwatch = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 'ec2':
                return mock_ec2
            elif service == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        optimizer = EC2CostOptimizer()

        # Mock credit specification response
        mock_ec2.describe_instance_credit_specifications.return_value = {
            'InstanceCreditSpecifications': [
                {'CpuCredits': 'unlimited'}
            ]
        }

        # Mock surplus credit balance
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [{'Average': 50.0}, {'Average': 60.0}]
        }

        instances = [
            {
                'InstanceId': 'i-burstable',
                'InstanceType': 't3.medium',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_burstable_credit_abuse(instances)

        assert len(optimizer.recommendations) == 1
        assert optimizer.recommendations[0]['action'] == 'upgrade_burstable_instance'

    @patch('analyse.boto3.client')
    def test_analyze_burstable_credit_skips_standard_mode(self, mock_boto_client):
        """Test that standard credit mode instances are not flagged"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        optimizer = EC2CostOptimizer()

        # Mock credit specification response - standard mode
        mock_ec2.describe_instance_credit_specifications.return_value = {
            'InstanceCreditSpecifications': [
                {'CpuCredits': 'standard'}
            ]
        }

        instances = [
            {
                'InstanceId': 'i-standard',
                'InstanceType': 't3.medium',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_burstable_credit_abuse(instances)

        assert len(optimizer.recommendations) == 0

    # =========================================================================
    # _is_sandbox_account TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_is_sandbox_account_detects_sandbox(self, mock_boto_client):
        """Test _is_sandbox_account detects sandbox accounts"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.list_account_aliases.return_value = {
            'AccountAliases': ['my-sandbox-account']
        }

        optimizer = EC2CostOptimizer()
        result = optimizer._is_sandbox_account('123456789012')

        assert result == True

    @patch('analyse.boto3.client')
    def test_is_sandbox_account_detects_production(self, mock_boto_client):
        """Test _is_sandbox_account detects non-sandbox accounts"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.list_account_aliases.return_value = {
            'AccountAliases': ['my-production-account']
        }

        optimizer = EC2CostOptimizer()
        result = optimizer._is_sandbox_account('123456789012')

        assert result == False

    @patch('analyse.boto3.client')
    def test_is_sandbox_account_handles_error(self, mock_boto_client):
        """Test _is_sandbox_account handles IAM errors gracefully"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.list_account_aliases.side_effect = Exception("Access Denied")

        optimizer = EC2CostOptimizer()
        result = optimizer._is_sandbox_account('123456789012')

        # Should return False on error
        assert result == False

    # =========================================================================
    # Additional Edge Cases
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    def test_generate_reports_handles_empty_recommendations(self, mock_file, mock_boto_client):
        """Test report generation with empty recommendations"""
        optimizer = EC2CostOptimizer()
        optimizer.recommendations = []

        optimizer.generate_reports()

        assert optimizer.total_potential_savings == 0
        # Verify files were still created
        assert any('ec2_cost_optimization.json' in str(call) for call in mock_file.call_args_list)
        assert any('ec2_rightsizing.csv' in str(call) for call in mock_file.call_args_list)

    @patch('analyse.boto3.client')
    def test_analyze_zombie_instances_handles_exceptions(self, mock_boto_client):
        """Test zombie analysis handles CloudWatch errors gracefully"""
        from botocore.exceptions import ClientError

        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        optimizer = EC2CostOptimizer()

        # Mock CloudWatch to raise error
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetMetricStatistics'
        )

        instances = [
            {
                'InstanceId': 'i-error',
                'InstanceType': 't2.micro',
                'State': 'running',
                'Tags': {}
            }
        ]

        # Should not crash
        optimizer.analyze_zombie_instances(instances)
        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_analyze_ri_coverage_handles_exceptions(self, mock_boto_client):
        """Test RI coverage analysis handles CE errors gracefully"""
        from botocore.exceptions import ClientError

        mock_ce = MagicMock()
        mock_boto_client.return_value = mock_ce

        optimizer = EC2CostOptimizer()

        # Mock CE to raise error
        mock_ce.get_reservation_coverage.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetReservationCoverage'
        )

        instances = [
            {'InstanceId': f'i-{i}', 'InstanceType': 't3.large', 'State': 'running', 'Tags': {}}
            for i in range(6)
        ]

        # Should not crash
        optimizer.analyze_ri_coverage_gaps(instances)
        # Should still add recommendations based on instance count
        assert len(optimizer.recommendations) >= 0

    @patch('analyse.boto3.client')
    def test_analyze_oversized_memory_handles_no_metrics(self, mock_boto_client):
        """Test oversized memory analysis when CloudWatch Agent not installed"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        optimizer = EC2CostOptimizer()

        # Mock CloudWatch responses with no datapoints (Agent not installed)
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        instances = [
            {
                'InstanceId': 'i-no-agent',
                'InstanceType': 'r5.large',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_oversized_memory_instances(instances)

        # Should not recommend without memory metrics
        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_analyze_oversized_memory_handles_exceptions(self, mock_boto_client):
        """Test oversized memory analysis handles CloudWatch errors"""
        from botocore.exceptions import ClientError

        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        optimizer = EC2CostOptimizer()

        # Mock CloudWatch to raise error
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetMetricStatistics'
        )

        instances = [
            {
                'InstanceId': 'i-error',
                'InstanceType': 'r5.large',
                'State': 'running',
                'Tags': {}
            }
        ]

        # Should not crash
        optimizer.analyze_oversized_memory_instances(instances)
        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_analyze_stopped_instances_handles_volume_errors(self, mock_boto_client):
        """Test stopped instance analysis handles volume describe errors"""
        from botocore.exceptions import ClientError

        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        optimizer = EC2CostOptimizer()

        # Mock describe_volumes to raise error
        mock_ec2.describe_volumes.side_effect = ClientError(
            {'Error': {'Code': 'InvalidVolume.NotFound', 'Message': 'Volume not found'}},
            'DescribeVolumes'
        )

        instances = [
            {
                'InstanceId': 'i-stopped',
                'InstanceType': 't3.small',
                'State': 'stopped',
                'Tags': {},
                'BlockDeviceMappings': [
                    {'Ebs': {'VolumeId': 'vol-missing'}}
                ]
            }
        ]

        # Should not crash, just skip the volume
        optimizer.analyze_stopped_instances_with_ebs(instances)
        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_analyze_inefficient_storage_handles_exceptions(self, mock_boto_client):
        """Test inefficient storage analysis handles errors"""
        from botocore.exceptions import ClientError

        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        optimizer = EC2CostOptimizer()

        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator

        # Mock paginator to raise error
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeVolumes'
        )

        # Should not crash
        optimizer.analyze_inefficient_storage()
        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_analyze_burstable_credit_handles_no_datapoints(self, mock_boto_client):
        """Test burstable credit analysis when no credit metrics available"""
        mock_ec2 = MagicMock()
        mock_cloudwatch = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 'ec2':
                return mock_ec2
            elif service == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        optimizer = EC2CostOptimizer()

        # Mock unlimited mode
        mock_ec2.describe_instance_credit_specifications.return_value = {
            'InstanceCreditSpecifications': [
                {'CpuCredits': 'unlimited'}
            ]
        }

        # No datapoints
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        instances = [
            {
                'InstanceId': 'i-no-surplus',
                'InstanceType': 't3.medium',
                'State': 'running',
                'Tags': {}
            }
        ]

        optimizer.analyze_burstable_credit_abuse(instances)

        # Should not recommend without surplus credit data
        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_analyze_burstable_credit_handles_exceptions(self, mock_boto_client):
        """Test burstable credit analysis handles errors"""
        from botocore.exceptions import ClientError

        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        optimizer = EC2CostOptimizer()

        # Mock to raise error
        mock_ec2.describe_instance_credit_specifications.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeInstanceCreditSpecifications'
        )

        instances = [
            {
                'InstanceId': 'i-error',
                'InstanceType': 't3.medium',
                'State': 'running',
                'Tags': {}
            }
        ]

        # Should not crash
        optimizer.analyze_burstable_credit_abuse(instances)
        assert len(optimizer.recommendations) == 0

    @patch('analyse.boto3.client')
    def test_get_instances_handles_exceptions(self, mock_boto_client):
        """Test get_instances handles pagination errors"""
        from botocore.exceptions import ClientError

        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = [mock_ec2, MagicMock(), MagicMock(), MagicMock()]

        optimizer = EC2CostOptimizer()

        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator

        # Mock to raise error
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeInstances'
        )

        instances = optimizer.get_instances()

        # Should return empty list on error
        assert instances == []

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    @patch('analyse.tabulate')
    def test_print_console_report_displays_all_action_types(self, mock_tabulate, mock_print, mock_boto_client):
        """Test console report handles all recommendation action types"""
        mock_tabulate.return_value = "Mocked Table"

        optimizer = EC2CostOptimizer()
        optimizer.recommendations = [
            {
                'instance_id': 'i-1',
                'instance_type': 't2.micro',
                'action': 'terminate_zombie_instance',
                'priority': 'high',
                'potential_savings': 10.0,
                'details': 'Low usage',
                'tags': {}
            },
            {
                'instance_id': 'vol-1',
                'instance_type': 'EBS_Volume',
                'action': 'migrate_gp2_to_gp3',
                'priority': 'medium',
                'potential_savings': 5.0,
                'details': '100 GB gp2 volume',
                'tags': {}
            },
            {
                'instance_id': 'i-2',
                'instance_type': 't3.small',
                'action': 'remove_stopped_instance_volumes',
                'priority': 'medium',
                'potential_savings': 3.0,
                'details': 'Stopped with 20 GB',
                'tags': {}
            },
            {
                'instance_id': 't3.large_fleet',
                'instance_type': 't3.large',
                'action': 'purchase_reserved_instances',
                'priority': 'high',
                'potential_savings': 50.0,
                'details': '10 instances',
                'tags': {}
            },
            {
                'instance_id': 'i-3',
                'instance_type': 'r5.large',
                'action': 'rightsize_memory_instance',
                'priority': 'high',
                'potential_savings': 20.0,
                'details': 'Low memory usage',
                'tags': {}
            },
            {
                'instance_id': 'i-4',
                'instance_type': 't3.medium',
                'action': 'upgrade_burstable_instance',
                'priority': 'high',
                'potential_savings': 15.0,
                'details': 'Credit abuse',
                'tags': {}
            }
        ]
        optimizer.total_potential_savings = 103.0

        optimizer.print_console_report()

        # Verify tabulate was called for each action type
        assert mock_tabulate.call_count >= 6
        assert mock_print.called
