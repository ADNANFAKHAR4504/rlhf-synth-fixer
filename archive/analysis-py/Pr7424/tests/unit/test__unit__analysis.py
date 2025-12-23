"""
Unit Tests for AWS Kinesis Architecture Analysis Script

==============================================================================
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).
Tests individual methods and business logic in isolation.
==============================================================================
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch, call
import pytest
from botocore.exceptions import ClientError

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import KinesisAnalyzer, boto_client


class TestKinesisAnalyzer:
    """Unit tests for KinesisAnalyzer class with mocked AWS services"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = KinesisAnalyzer(region='us-east-1')

        assert analyzer.region == 'us-east-1'

        # Verify all 7 AWS service clients are created
        assert mock_boto_client.call_count == 7
        mock_boto_client.assert_any_call('kinesis', 'us-east-1')
        mock_boto_client.assert_any_call('firehose', 'us-east-1')
        mock_boto_client.assert_any_call('cloudwatch', 'us-east-1')
        mock_boto_client.assert_any_call('lambda', 'us-east-1')
        mock_boto_client.assert_any_call('s3', 'us-east-1')
        mock_boto_client.assert_any_call('kms', 'us-east-1')
        mock_boto_client.assert_any_call('ec2', 'us-east-1')

    @patch('analyse.boto_client')
    def test_initialization_sets_empty_data_structures(self, mock_boto_client):
        """Test that analyzer initializes with empty data structures"""
        analyzer = KinesisAnalyzer()

        assert analyzer.data_streams == []
        assert analyzer.firehose_streams == []
        assert analyzer.analysis_results == {
            'data_streams': [],
            'firehose_streams': [],
            'summary': {}
        }
        assert analyzer.consumer_lag_data == []
        assert analyzer.shard_optimization_plans == []

    # =========================================================================
    # STREAM GATHERING TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_gather_data_streams_excludes_test_streams(self, mock_boto_client):
        """Test _gather_data_streams excludes test- and dev- prefixed streams"""
        mock_kinesis = MagicMock()
        mock_boto_client.return_value = mock_kinesis

        mock_paginator = MagicMock()
        mock_kinesis.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'StreamNames': ['production-stream', 'test-stream', 'dev-stream', 'staging-stream']}
        ]

        analyzer = KinesisAnalyzer()
        analyzer._gather_data_streams()

        # Should only include production-stream and staging-stream
        assert len(analyzer.data_streams) == 2
        assert 'production-stream' in analyzer.data_streams
        assert 'staging-stream' in analyzer.data_streams
        assert 'test-stream' not in analyzer.data_streams
        assert 'dev-stream' not in analyzer.data_streams

    @patch('analyse.boto_client')
    def test_gather_data_streams_handles_errors_gracefully(self, mock_boto_client):
        """Test _gather_data_streams handles errors without raising exceptions"""
        mock_kinesis = MagicMock()
        mock_boto_client.return_value = mock_kinesis

        mock_paginator = MagicMock()
        mock_kinesis.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'ListStreams'
        )

        analyzer = KinesisAnalyzer()
        analyzer._gather_data_streams()

        # Should return empty list on error
        assert analyzer.data_streams == []

    @patch('analyse.boto_client')
    def test_gather_firehose_streams_excludes_test_streams(self, mock_boto_client):
        """Test _gather_firehose_streams excludes test- and dev- prefixed streams"""
        mock_firehose = MagicMock()
        mock_boto_client.return_value = mock_firehose

        mock_paginator = MagicMock()
        mock_firehose.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'DeliveryStreamNames': ['prod-firehose', 'test-firehose', 'dev-firehose']}
        ]

        analyzer = KinesisAnalyzer()
        analyzer._gather_firehose_streams()

        assert len(analyzer.firehose_streams) == 1
        assert 'prod-firehose' in analyzer.firehose_streams
        assert 'test-firehose' not in analyzer.firehose_streams

    # =========================================================================
    # STREAM FILTERING TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_should_analyze_stream_filters_correctly(self, mock_boto_client):
        """Test _should_analyze_stream filters streams by name prefix"""
        analyzer = KinesisAnalyzer()

        assert analyzer._should_analyze_stream('production-stream') == True
        assert analyzer._should_analyze_stream('staging-stream') == True
        assert analyzer._should_analyze_stream('test-stream') == False
        assert analyzer._should_analyze_stream('dev-stream') == False
        assert analyzer._should_analyze_stream('test-production') == False
        assert analyzer._should_analyze_stream('development-stream') == True

    @patch('analyse.boto_client')
    def test_check_stream_tags_excludes_tagged_streams(self, mock_boto_client):
        """Test _check_stream_tags excludes streams with ExcludeFromAnalysis tag"""
        mock_kinesis = MagicMock()
        mock_boto_client.return_value = mock_kinesis

        # Mock stream with ExcludeFromAnalysis tag
        mock_kinesis.list_tags_for_stream.return_value = {
            'Tags': [
                {'Key': 'ExcludeFromAnalysis', 'Value': 'true'},
                {'Key': 'Environment', 'Value': 'production'}
            ]
        }

        analyzer = KinesisAnalyzer()
        result = analyzer._check_stream_tags('arn:aws:kinesis:us-east-1:123456789012:stream/test')

        assert result == False

    @patch('analyse.boto_client')
    def test_check_stream_tags_includes_untagged_streams(self, mock_boto_client):
        """Test _check_stream_tags includes streams without exclude tag"""
        mock_kinesis = MagicMock()
        mock_boto_client.return_value = mock_kinesis

        mock_kinesis.list_tags_for_stream.return_value = {
            'Tags': [{'Key': 'Environment', 'Value': 'production'}]
        }

        analyzer = KinesisAnalyzer()
        result = analyzer._check_stream_tags('arn:aws:kinesis:us-east-1:123456789012:stream/test')

        assert result == True

    # =========================================================================
    # CLOUDWATCH METRICS TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_get_cloudwatch_metrics_returns_datapoints(self, mock_boto_client):
        """Test _get_cloudwatch_metrics retrieves metrics successfully"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Timestamp': datetime.now(timezone.utc), 'Average': 100},
                {'Timestamp': datetime.now(timezone.utc), 'Average': 150}
            ]
        }

        analyzer = KinesisAnalyzer()
        result = analyzer._get_cloudwatch_metrics(
            'AWS/Kinesis', 'IncomingRecords',
            [{'Name': 'StreamName', 'Value': 'test-stream'}],
            datetime.now(timezone.utc) - timedelta(hours=1),
            datetime.now(timezone.utc),
            'Average'
        )

        assert len(result) == 2
        assert result[0]['Average'] == 100

    @patch('analyse.boto_client')
    def test_get_cloudwatch_metrics_handles_errors(self, mock_boto_client):
        """Test _get_cloudwatch_metrics returns empty list on error"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetMetricStatistics'
        )

        analyzer = KinesisAnalyzer()
        result = analyzer._get_cloudwatch_metrics(
            'AWS/Kinesis', 'IncomingRecords',
            [{'Name': 'StreamName', 'Value': 'test-stream'}],
            datetime.now(timezone.utc) - timedelta(hours=1),
            datetime.now(timezone.utc)
        )

        assert result == []

    # =========================================================================
    # ITERATOR AGE CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_iterator_age_detects_high_age(self, mock_boto_client):
        """Test _check_iterator_age detects high iterator age"""
        analyzer = KinesisAnalyzer()
        analysis = {
            'findings': [],
            'metrics': {},
            'health_score': 100
        }

        # Mock high iterator age metrics
        with patch.object(analyzer, '_get_cloudwatch_metrics') as mock_metrics:
            mock_metrics.return_value = [
                {'Maximum': 70000},  # 70 seconds (exceeds 60000ms threshold)
                {'Maximum': 65000}
            ]

            analyzer._check_iterator_age(
                'test-stream', analysis, [],
                datetime.now(timezone.utc) - timedelta(days=7),
                datetime.now(timezone.utc)
            )

        # Verify finding was added
        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['issue'] == 'Iterator Age High'
        assert analysis['findings'][0]['severity'] == 'HIGH'
        assert analysis['health_score'] == 80  # 100 - 20

    @patch('analyse.boto_client')
    def test_check_iterator_age_no_issue_when_low(self, mock_boto_client):
        """Test _check_iterator_age doesn't flag low iterator age"""
        analyzer = KinesisAnalyzer()
        analysis = {
            'findings': [],
            'metrics': {},
            'health_score': 100
        }

        with patch.object(analyzer, '_get_cloudwatch_metrics') as mock_metrics:
            mock_metrics.return_value = [
                {'Maximum': 30000},  # 30 seconds (below threshold)
                {'Maximum': 25000}
            ]

            analyzer._check_iterator_age(
                'test-stream', analysis, [],
                datetime.now(timezone.utc) - timedelta(days=7),
                datetime.now(timezone.utc)
            )

        assert len(analysis['findings']) == 0
        assert analysis['health_score'] == 100

    # =========================================================================
    # THROTTLING CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_throttling_detects_high_throttle_rate(self, mock_boto_client):
        """Test _check_throttling detects throttle rate >1%"""
        analyzer = KinesisAnalyzer()
        analysis = {
            'findings': [],
            'metrics': {},
            'health_score': 100
        }

        with patch.object(analyzer, '_get_cloudwatch_metrics') as mock_metrics:
            # First call: throttled metrics (150 throttled)
            # Second call: success metrics (10000 success)
            # Rate = 150 / (150 + 10000) = 1.48%
            mock_metrics.side_effect = [
                [{'Sum': 150}],  # Throttled
                [{'Sum': 10000}]  # Success
            ]

            analyzer._check_throttling(
                'test-stream', analysis, [],
                datetime.now(timezone.utc) - timedelta(days=7),
                datetime.now(timezone.utc)
            )

        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['issue'] == 'Throttled Records'
        assert analysis['findings'][0]['severity'] == 'HIGH'
        assert analysis['health_score'] == 85

    # =========================================================================
    # THROUGHPUT UTILIZATION TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_throughput_utilization_detects_under_provisioned(self, mock_boto_client):
        """Test _check_throughput_utilization detects under-provisioned shards"""
        analyzer = KinesisAnalyzer()
        stream_info = {
            'StreamModeDetails': {'StreamMode': 'PROVISIONED'}
        }
        analysis = {
            'shard_count': 2,
            'findings': [],
            'metrics': {},
            'health_score': 100
        }

        with patch.object(analyzer, '_get_cloudwatch_metrics') as mock_metrics:
            # Mock high throughput (90% utilization)
            # 2 shards = 2MB/sec capacity
            # 1.8MB over 7 days = avg of 0.00000297 MB/sec, but we'll mock high values
            total_bytes = 2 * 1024 * 1024 * 7 * 24 * 3600 * 0.9  # 90% of capacity
            mock_metrics.side_effect = [
                [{'Sum': total_bytes}],  # IncomingBytes
                [{'Sum': 1000000}]  # IncomingRecords
            ]

            analyzer._check_throughput_utilization(
                'test-stream', analysis, stream_info, [],
                datetime.now(timezone.utc) - timedelta(days=7),
                datetime.now(timezone.utc)
            )

        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['issue'] == 'Under-Provisioned Shards'
        assert analysis['health_score'] == 80

    @patch('analyse.boto_client')
    def test_check_throughput_utilization_detects_over_provisioned(self, mock_boto_client):
        """Test _check_throughput_utilization detects over-provisioned shards"""
        analyzer = KinesisAnalyzer()
        stream_info = {
            'StreamModeDetails': {'StreamMode': 'PROVISIONED'}
        }
        analysis = {
            'shard_count': 10,
            'findings': [],
            'metrics': {},
            'health_score': 100
        }

        with patch.object(analyzer, '_get_cloudwatch_metrics') as mock_metrics:
            # Mock low throughput (15% utilization)
            total_bytes = 10 * 1024 * 1024 * 7 * 24 * 3600 * 0.15
            mock_metrics.side_effect = [
                [{'Sum': total_bytes}],
                [{'Sum': 100000}]
            ]

            analyzer._check_throughput_utilization(
                'test-stream', analysis, stream_info, [],
                datetime.now(timezone.utc) - timedelta(days=7),
                datetime.now(timezone.utc)
            )

        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['issue'] == 'Over-Provisioned Shards'
        assert analysis['findings'][0]['severity'] == 'MEDIUM'
        assert analysis['health_score'] == 90

    # =========================================================================
    # ENCRYPTION CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_encryption_flags_unencrypted_sensitive_streams(self, mock_boto_client):
        """Test _check_encryption flags sensitive streams without encryption"""
        analyzer = KinesisAnalyzer()

        sensitive_streams = [
            'customer-data-stream',
            'user-events-stream',
            'payment-transactions',
            'pii-processing-stream',
            'personal-info-stream',
            'credit-card-data'
        ]

        for stream_name in sensitive_streams:
            analysis = {
                'encryption': 'NONE',
                'findings': [],
                'health_score': 100
            }

            analyzer._check_encryption(stream_name, analysis)

            assert len(analysis['findings']) == 1
            assert analysis['findings'][0]['issue'] == 'No Encryption'
            assert analysis['findings'][0]['severity'] == 'HIGH'
            assert analysis['health_score'] == 80

    @patch('analyse.boto_client')
    def test_check_encryption_ignores_non_sensitive_streams(self, mock_boto_client):
        """Test _check_encryption doesn't flag non-sensitive streams"""
        analyzer = KinesisAnalyzer()
        analysis = {
            'encryption': 'NONE',
            'findings': [],
            'health_score': 100
        }

        analyzer._check_encryption('application-logs-stream', analysis)

        assert len(analysis['findings']) == 0
        assert analysis['health_score'] == 100

    # =========================================================================
    # RETENTION PERIOD CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_retention_period_flags_excessive_retention(self, mock_boto_client):
        """Test _check_retention_period flags 7-day retention"""
        analyzer = KinesisAnalyzer()
        analysis = {
            'retention_period_hours': 168,  # 7 days
            'findings': [],
            'health_score': 100
        }

        analyzer._check_retention_period('test-stream', analysis)

        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['issue'] == 'Excessive Retention'
        assert analysis['findings'][0]['severity'] == 'LOW'
        assert analysis['health_score'] == 95

    @patch('analyse.boto_client')
    def test_check_retention_period_accepts_24hour_retention(self, mock_boto_client):
        """Test _check_retention_period doesn't flag 24-hour retention"""
        analyzer = KinesisAnalyzer()
        analysis = {
            'retention_period_hours': 24,
            'findings': [],
            'health_score': 100
        }

        analyzer._check_retention_period('test-stream', analysis)

        assert len(analysis['findings']) == 0
        assert analysis['health_score'] == 100

    # =========================================================================
    # ENHANCED MONITORING CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_enhanced_monitoring_flags_missing_monitoring(self, mock_boto_client):
        """Test _check_enhanced_monitoring flags streams without enhanced monitoring"""
        analyzer = KinesisAnalyzer()

        # Test with no EnhancedMonitoring key
        stream_info = {}
        analysis = {'findings': [], 'health_score': 100}
        analyzer._check_enhanced_monitoring('test-stream', analysis, stream_info)
        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['issue'] == 'No Enhanced Monitoring'

        # Test with empty ShardLevelMetrics
        stream_info = {'EnhancedMonitoring': [{'ShardLevelMetrics': []}]}
        analysis = {'findings': [], 'health_score': 100}
        analyzer._check_enhanced_monitoring('test-stream', analysis, stream_info)
        assert len(analysis['findings']) == 1

    @patch('analyse.boto_client')
    def test_check_enhanced_monitoring_accepts_enabled_monitoring(self, mock_boto_client):
        """Test _check_enhanced_monitoring doesn't flag enabled monitoring"""
        analyzer = KinesisAnalyzer()
        stream_info = {
            'EnhancedMonitoring': [
                {'ShardLevelMetrics': ['IncomingBytes', 'IncomingRecords']}
            ]
        }
        analysis = {'findings': [], 'health_score': 100}

        analyzer._check_enhanced_monitoring('test-stream', analysis, stream_info)

        assert len(analysis['findings']) == 0

    # =========================================================================
    # CLOUDWATCH ALARMS CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_cloudwatch_alarms_flags_missing_alarms(self, mock_boto_client):
        """Test _check_cloudwatch_alarms flags streams without alarms"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        # Mock no alarms
        mock_cloudwatch.describe_alarms_for_metric.return_value = {'MetricAlarms': []}

        analyzer = KinesisAnalyzer()
        analysis = {'findings': [], 'health_score': 100}

        analyzer._check_cloudwatch_alarms('test-stream', analysis)

        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['issue'] == 'No CloudWatch Alarms'
        assert 'iterator age' in analysis['findings'][0]['details']
        assert 'throttling' in analysis['findings'][0]['details']

    # =========================================================================
    # CROSS-REGION REPLICATION CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_cross_region_replication_flags_critical_streams(self, mock_boto_client):
        """Test _check_cross_region_replication flags critical streams without DR"""
        analyzer = KinesisAnalyzer()

        critical_streams = [
            'payment-processor',
            'order-management-stream',
            'transaction-log',
            'critical-events',
            'primary-data-stream'
        ]

        for stream_name in critical_streams:
            analysis = {'findings': [], 'health_score': 100}

            with patch.object(analyzer, 'kinesis_client') as mock_kinesis:
                mock_kinesis.list_streams.return_value = {'StreamNames': []}

            # Mock boto_client to return mock kinesis clients
            with patch('analyse.boto_client') as mock_boto:
                mock_boto.return_value = mock_kinesis

                analyzer._check_cross_region_replication(stream_name, analysis)

            assert len(analysis['findings']) == 1
            assert analysis['findings'][0]['issue'] == 'No Cross-Region Replication'
            assert analysis['health_score'] == 90

    @patch('analyse.boto_client')
    def test_check_cross_region_replication_with_replica(self, mock_boto_client):
        """Cover replication branch when replica streams are found"""
        mock_dr_client = MagicMock()
        mock_dr_client.list_streams.return_value = {'StreamNames': ['payment-processor-replica']}
        mock_boto_client.side_effect = lambda service, region=None: mock_dr_client

        analyzer = KinesisAnalyzer()
        analysis = {'findings': [], 'health_score': 100}
        analyzer._check_cross_region_replication('payment-processor', analysis)

        assert analysis['findings'] == []

    # =========================================================================
    # FIREHOSE BATCH SIZE CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_firehose_batch_settings_flags_small_buffers(self, mock_boto_client):
        """Test _check_firehose_batch_settings flags small batch sizes"""
        analyzer = KinesisAnalyzer()

        test_cases = [
            ({'SizeInMBs': 3, 'IntervalInSeconds': 300}, True),  # Size too small
            ({'SizeInMBs': 5, 'IntervalInSeconds': 200}, True),  # Interval too small
            ({'SizeInMBs': 3, 'IntervalInSeconds': 200}, True),  # Both too small
            ({'SizeInMBs': 5, 'IntervalInSeconds': 300}, False),  # Both OK
        ]

        for buffer_hints, should_flag in test_cases:
            dest_desc = {
                'S3DestinationDescription': {
                    'BufferingHints': buffer_hints
                }
            }
            analysis = {'findings': [], 'health_score': 100}

            analyzer._check_firehose_batch_settings('test-stream', analysis, dest_desc)

            if should_flag:
                assert len(analysis['findings']) == 1
                assert analysis['findings'][0]['issue'] == 'Small Batch Sizes'
            else:
                assert len(analysis['findings']) == 0

    # =========================================================================
    # FIREHOSE ENCRYPTION CHECK TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_check_firehose_encryption_flags_sensitive_streams(self, mock_boto_client):
        """Test _check_firehose_encryption flags sensitive Firehose streams without encryption"""
        analyzer = KinesisAnalyzer()

        stream_info = {
            'DeliveryStreamEncryptionConfiguration': {'Status': 'DISABLED'}
        }

        sensitive_names = ['customer-events', 'user-data', 'payment-logs', 'pii-stream']

        for stream_name in sensitive_names:
            analysis = {'findings': [], 'health_score': 100}

            analyzer._check_firehose_encryption(stream_name, analysis, stream_info)

            assert len(analysis['findings']) == 1
            assert analysis['findings'][0]['issue'] == 'No Encryption'
            assert analysis['health_score'] == 80

    # =========================================================================
    # SUMMARY GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    def test_generate_summary_calculates_metrics_correctly(self, mock_boto_client):
        """Test _generate_summary calculates all metrics correctly"""
        analyzer = KinesisAnalyzer()

        # Setup mock analysis results
        analyzer.analysis_results = {
            'data_streams': [
                {
                    'stream_name': 'stream1',
                    'shard_count': 5,
                    'findings': [
                        {'issue': 'No Encryption', 'severity': 'HIGH'},
                        {'issue': 'Over-Provisioned Shards', 'severity': 'MEDIUM'}
                    ],
                    'metrics': {'throughput_utilization': 15},
                    'health_score': 75
                },
                {
                    'stream_name': 'stream2',
                    'shard_count': 2,
                    'findings': [
                        {'issue': 'Excessive Retention', 'severity': 'LOW'}
                    ],
                    'metrics': {},
                    'health_score': 95
                }
            ],
            'firehose_streams': [
                {
                    'findings': [
                        {'issue': 'Small Batch Sizes', 'severity': 'MEDIUM'}
                    ],
                    'health_score': 90
                }
            ],
            'summary': {}
        }

        analyzer._generate_summary()

        summary = analyzer.analysis_results['summary']

        assert summary['total_data_streams'] == 2
        assert summary['total_firehose_streams'] == 1
        assert summary['total_findings'] == 4
        assert summary['high_priority_issues'] == 1
        assert summary['average_health_score'] == (75 + 95 + 90) / 3
        # Small Batch Sizes, Over-Provisioned Shards, and Excessive Retention are all cost optimization issues
        assert summary['cost_optimization_opportunities'] == 3

    # =========================================================================
    # CONSOLE OUTPUT TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    @patch('builtins.print')
    def test_print_console_output_displays_summary(self, mock_print, mock_boto_client):
        """Test _print_console_output displays summary in tabular format"""
        analyzer = KinesisAnalyzer()
        analyzer.analysis_results = {
            'data_streams': [],
            'firehose_streams': [],
            'summary': {
                'total_data_streams': 5,
                'total_firehose_streams': 3,
                'average_health_score': 85.5,
                'high_priority_issues': 2,
                'estimated_monthly_savings': 150.75
            }
        }

        analyzer._print_console_output()

        # Verify print was called
        assert mock_print.called
        # Check that key information appears in output
        print_calls = [str(call) for call in mock_print.call_args_list]
        output = ' '.join(print_calls)
        assert 'KINESIS ARCHITECTURE ANALYSIS REPORT' in output or 'Kinesis' in output.lower()

    # =========================================================================
    # FILE OUTPUT TESTS
    # =========================================================================

    @patch('analyse.boto_client')
    @patch('builtins.open', create=True)
    @patch('json.dump')
    def test_save_json_output_creates_file(self, mock_json_dump, mock_open, mock_boto_client):
        """Test _save_json_output creates JSON file"""
        analyzer = KinesisAnalyzer()
        analyzer.analysis_results = {
            'data_streams': [],
            'firehose_streams': [],
            'summary': {}
        }

        analyzer._save_json_output()

        mock_open.assert_called_with('kinesis_analysis.json', 'w')
        assert mock_json_dump.called

    @patch('analyse.boto_client')
    @patch('builtins.open', create=True)
    def test_save_csv_report_creates_file(self, mock_open, mock_boto_client):
        """Test _save_csv_report creates CSV file"""
        analyzer = KinesisAnalyzer()
        analyzer.consumer_lag_data = [
            {'stream_name': 'test', 'consumer_name': 'consumer1', 'max_lag_ms': 1000}
        ]

        # Mock the file handle
        mock_file = MagicMock()
        mock_open.return_value.__enter__.return_value = mock_file

        analyzer._save_csv_report()

        # Verify CSV file was opened
        mock_open.assert_called()

    @patch('analyse.boto_client')
    @patch('builtins.open', create=True)
    @patch('json.dump')
    def test_save_optimization_plan_creates_file(self, mock_json_dump, mock_open, mock_boto_client):
        """Test _save_optimization_plan creates optimization plan file"""
        analyzer = KinesisAnalyzer()
        analyzer.analysis_results = {
            'data_streams': [
                {
                    'stream_name': 'test-stream',
                    'findings': [
                        {
                            'issue': 'Under-Provisioned Shards',
                            'severity': 'HIGH',
                            'remediation': 'Add 2 more shards'
                        }
                    ]
                }
            ],
            'firehose_streams': [],
            'summary': {}
        }
        analyzer.shard_optimization_plans = []

        analyzer._save_optimization_plan()

        mock_open.assert_called_with('shard_optimization_plan.json', 'w')
        assert mock_json_dump.called

    # =========================================================================
    # MAIN ANALYZE WORKFLOW TEST
    # =========================================================================

    @patch('analyse.boto_client')
    def test_analyze_executes_full_workflow(self, mock_boto_client):
        """Test analyze() executes complete analysis workflow"""
        analyzer = KinesisAnalyzer()

        # Mock all the individual methods
        with patch.object(analyzer, '_gather_data_streams') as mock_gather_data:
            with patch.object(analyzer, '_gather_firehose_streams') as mock_gather_firehose:
                with patch.object(analyzer, '_analyze_data_streams') as mock_analyze_data:
                    with patch.object(analyzer, '_analyze_firehose_streams') as mock_analyze_firehose:
                        with patch.object(analyzer, '_generate_summary') as mock_summary:
                            with patch.object(analyzer, '_print_console_output') as mock_console:
                                with patch.object(analyzer, '_save_json_output') as mock_json:
                                    with patch.object(analyzer, '_generate_html_dashboard') as mock_html:
                                        with patch.object(analyzer, '_save_csv_report') as mock_csv:
                                            with patch.object(analyzer, '_save_optimization_plan') as mock_plan:
                                                analyzer.analyze()

        # Verify all methods were called
        mock_gather_data.assert_called_once()
        mock_gather_firehose.assert_called_once()
        mock_analyze_data.assert_called_once()
        mock_analyze_firehose.assert_called_once()
        mock_summary.assert_called_once()
        mock_console.assert_called_once()
        mock_json.assert_called_once()
        mock_html.assert_called_once()
        mock_csv.assert_called_once()
        mock_plan.assert_called_once()

    # =========================================================================
    # ADDITIONAL COVERAGE TESTS FOR FULL WORKFLOW LOGIC
    # =========================================================================

    def test_boto_client_respects_custom_endpoint(self, monkeypatch):
        """Ensure boto_client uses custom endpoint credentials when provided"""
        monkeypatch.setenv('AWS_ENDPOINT_URL', 'http://localhost:4566')
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test-key')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test-secret')

        with patch('boto3.client') as mock_client:
            boto_client('kinesis', 'us-west-2')

        mock_client.assert_called_with(
            'kinesis',
            region_name='us-west-2',
            endpoint_url='http://localhost:4566',
            aws_access_key_id='test-key',
            aws_secret_access_key='test-secret'
        )

    def test_boto_client_defaults_without_endpoint(self, monkeypatch):
        """Cover branch when no custom endpoint is configured"""
        monkeypatch.delenv('AWS_ENDPOINT_URL', raising=False)

        with patch('boto3.client') as mock_client:
            boto_client('kinesis', 'us-east-1')

        mock_client.assert_called_with('kinesis', region_name='us-east-1')

    @patch('analyse.boto_client')
    def test_analyze_data_streams_processes_and_skips_streams(self, mock_boto_client):
        """Run _analyze_data_streams end-to-end with mocked AWS clients"""
        mock_kinesis = MagicMock()
        mock_cloudwatch = MagicMock()
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': mock_kinesis,
            'firehose': MagicMock(),
            'cloudwatch': mock_cloudwatch,
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()
        analyzer.data_streams = ['payments-stream', 'low-traffic']

        mock_kinesis.describe_stream.return_value = {
            'StreamDescription': {
                'StreamARN': 'arn:aws:kinesis:us-east-1:123:stream/payments-stream',
                'StreamStatus': 'ACTIVE',
                'Shards': [{'ShardId': 'shard-000'}],
                'RetentionPeriodHours': 24,
                'EncryptionType': 'NONE',
                'StreamModeDetails': {'StreamMode': 'PROVISIONED'},
                'EnhancedMonitoring': [{'ShardLevelMetrics': ['IncomingBytes']}]
            }
        }

        # Skip low-traffic stream, process payments-stream
        def metrics_side_effect(namespace, metric_name, dimensions, start_time, end_time, stat='Average'):
            if metric_name == 'IncomingRecords' and dimensions[0]['Value'] == 'low-traffic':
                return [{'Sum': 10}]
            if metric_name == 'IncomingRecords':
                return [{'Sum': 10000}]
            return []

        analyzer._get_cloudwatch_metrics = MagicMock(side_effect=metrics_side_effect)
        analyzer._check_stream_tags = MagicMock(side_effect=[True, False])
        for method in ['_check_iterator_age', '_check_throttling', '_check_throughput_utilization',
                       '_check_enhanced_monitoring', '_check_retention_period', '_check_encryption',
                       '_check_cloudwatch_alarms', '_check_consumer_lag', '_check_shard_distribution',
                       '_check_cross_region_replication', '_check_on_demand_usage']:
            setattr(analyzer, method, MagicMock())

        analyzer._analyze_data_streams()

        assert len(analyzer.analysis_results['data_streams']) == 1
        assert analyzer.analysis_results['data_streams'][0]['stream_name'] == 'payments-stream'

    @patch('analyse.boto_client')
    def test_analyze_data_streams_handles_empty_metrics(self, mock_boto_client):
        """Cover branch where record metrics are missing"""
        mock_kinesis = MagicMock()
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': mock_kinesis,
            'firehose': MagicMock(),
            'cloudwatch': MagicMock(),
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()
        analyzer.data_streams = ['empty-metrics']

        mock_kinesis.describe_stream.return_value = {
            'StreamDescription': {
                'StreamARN': 'arn:aws:kinesis:us-east-1:123:stream/empty-metrics',
                'StreamStatus': 'ACTIVE',
                'Shards': [{'ShardId': 'shard-000'}],
                'RetentionPeriodHours': 24,
                'EncryptionType': 'NONE',
                'StreamModeDetails': {'StreamMode': 'PROVISIONED'},
                'EnhancedMonitoring': []
            }
        }

        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[])
        analyzer._check_stream_tags = MagicMock(return_value=True)
        for method in ['_check_iterator_age', '_check_throttling', '_check_throughput_utilization',
                       '_check_enhanced_monitoring', '_check_retention_period', '_check_encryption',
                       '_check_cloudwatch_alarms', '_check_consumer_lag', '_check_shard_distribution',
                       '_check_cross_region_replication', '_check_on_demand_usage']:
            setattr(analyzer, method, MagicMock())

        analyzer._analyze_data_streams()
        assert len(analyzer.analysis_results['data_streams']) == 1

    @patch('analyse.boto_client')
    def test_check_consumer_lag_flags_slow_consumer(self, mock_boto_client):
        """Exercise consumer lag calculation with mocked metrics"""
        mock_kinesis = MagicMock()
        mock_kinesis.list_stream_consumers.return_value = {
            'Consumers': [{'ConsumerName': 'laggy', 'ConsumerStatus': 'ACTIVE'}]
        }
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': mock_kinesis,
            'firehose': MagicMock(),
            'cloudwatch': MagicMock(),
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[{'Maximum': 6000}, {'Maximum': 5500}])

        analysis = {'stream_arn': 'arn:aws:kinesis:us-east-1:123:stream/test', 'findings': [], 'health_score': 100}
        analyzer._check_consumer_lag('test-stream', analysis, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analyzer.consumer_lag_data[0]['flagged'] is True
        assert analysis['findings'][0]['issue'] == 'Consumer Lag'
        assert analysis['health_score'] == 85

    @patch('analyse.boto_client')
    def test_check_consumer_lag_handles_healthy_lag(self, mock_boto_client):
        """Cover consumer lag branch where lag is within limits"""
        mock_kinesis = MagicMock()
        mock_kinesis.list_stream_consumers.return_value = {
            'Consumers': [{'ConsumerName': 'healthy', 'ConsumerStatus': 'ACTIVE'}]
        }
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': mock_kinesis,
            'firehose': MagicMock(),
            'cloudwatch': MagicMock(),
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[{'Maximum': 100}])
        analysis = {'stream_arn': 'arn', 'findings': [], 'health_score': 100}

        analyzer._check_consumer_lag('test-stream', analysis, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analysis['findings'] == []
        assert analyzer.consumer_lag_data[0]['flagged'] is False

    @patch('analyse.boto_client')
    def test_check_iterator_age_skips_when_no_metrics(self, mock_boto_client):
        """Ensure iterator age check handles missing metrics"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[])
        analysis = {'findings': [], 'metrics': {}, 'health_score': 100}

        analyzer._check_iterator_age('test-stream', analysis, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_throttling_handles_missing_metrics(self, mock_boto_client):
        """Cover throttling branch when metrics are unavailable"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[])
        analysis = {'findings': [], 'metrics': {}, 'health_score': 100}

        analyzer._check_throttling('test-stream', analysis, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_throttling_handles_zero_success(self, mock_boto_client):
        """Cover branch where total success count is zero"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(side_effect=[
            [{'Sum': 10}],   # throttled
            [{'Sum': 0}]     # success zero
        ])
        analysis = {'findings': [], 'metrics': {}, 'health_score': 100}

        analyzer._check_throttling('test-stream', analysis, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_throughput_utilization_skips_without_bytes(self, mock_boto_client):
        """Exercise utilization branch when no byte metrics exist"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[])
        analysis = {'shard_count': 1, 'findings': [], 'metrics': {}, 'health_score': 100}
        stream_info = {'StreamModeDetails': {'StreamMode': 'PROVISIONED'}}

        analyzer._check_throughput_utilization('test-stream', analysis, stream_info, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_throughput_utilization_ignores_on_demand(self, mock_boto_client):
        """Ensure utilization check skips on-demand mode streams"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[{'Sum': 1000}])
        analysis = {'shard_count': 1, 'findings': [], 'metrics': {}, 'health_score': 100}
        stream_info = {'StreamModeDetails': {'StreamMode': 'ON_DEMAND'}}

        analyzer._check_throughput_utilization('on-demand', analysis, stream_info, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_encryption_allows_encrypted_sensitive_stream(self, mock_boto_client):
        """Ensure sensitive stream with encryption is not flagged"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analysis = {'encryption': 'KMS', 'findings': [], 'health_score': 100}

        analyzer._check_encryption('payment-stream', analysis)
        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_cloudwatch_alarms_with_existing_alarms(self, mock_boto_client):
        """Cover branch where required alarms already exist"""
        mock_cloudwatch = MagicMock()
        mock_cloudwatch.describe_alarms_for_metric.side_effect = [
            {'MetricAlarms': [{'AlarmName': 'iterator-age'}]},
            {'MetricAlarms': [{'AlarmName': 'throttle'}]}
        ]
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': MagicMock(),
            'firehose': MagicMock(),
            'cloudwatch': mock_cloudwatch,
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()
        analysis = {'findings': [], 'health_score': 100}

        analyzer._check_cloudwatch_alarms('test-stream', analysis)
        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_cloudwatch_alarms_with_partial_coverage(self, mock_boto_client):
        """Ensure missing iterator alarm but existing throttle alarm is reported"""
        mock_cloudwatch = MagicMock()
        mock_cloudwatch.describe_alarms_for_metric.side_effect = [
            {'MetricAlarms': []},
            {'MetricAlarms': [{'AlarmName': 'throttle'}]}
        ]
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': MagicMock(),
            'firehose': MagicMock(),
            'cloudwatch': mock_cloudwatch,
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()
        analysis = {'findings': [], 'health_score': 100}
        analyzer._check_cloudwatch_alarms('test-stream', analysis)

        assert any('iterator age' in f['details'] for f in analysis['findings'])

    @patch('analyse.boto_client')
    def test_check_shard_distribution_detects_hot_shard(self, mock_boto_client):
        """Validate shard distribution logic identifies hot shard"""
        mock_kinesis = MagicMock()
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': mock_kinesis,
            'firehose': MagicMock(),
            'cloudwatch': MagicMock(),
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()

        # shard-1 is significantly hotter than the others
        analyzer._get_cloudwatch_metrics = MagicMock(side_effect=[
            [{'Sum': 100}],   # shard-0 bytes
            [{'Sum': 6000}],  # shard-1 bytes (hot)
            [{'Sum': 50}]     # shard-2 bytes
        ])

        stream_info = {
            'EnhancedMonitoring': [{'ShardLevelMetrics': ['IncomingBytes']}],
            'Shards': [{'ShardId': 'shard-0'}, {'ShardId': 'shard-1'}, {'ShardId': 'shard-2'}]
        }
        analysis = {'findings': [], 'health_score': 100}

        analyzer._check_shard_distribution('test-stream', analysis, stream_info, [], datetime.now(timezone.utc) - timedelta(hours=1), datetime.now(timezone.utc))

        assert analyzer.shard_optimization_plans[0]['shard_id'] == 'shard-1'
        assert analysis['findings'][0]['issue'] == 'Shard Splitting Needed'
        assert analysis['health_score'] == 90

    @patch('analyse.boto_client')
    def test_check_shard_distribution_skips_without_monitoring(self, mock_boto_client):
        """Cover branch when enhanced monitoring is not configured"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        stream_info = {'Shards': [{'ShardId': 'shard-0'}]}
        analysis = {'findings': [], 'health_score': 100}

        analyzer._check_shard_distribution('test-stream', analysis, stream_info, [], datetime.now(timezone.utc) - timedelta(hours=1), datetime.now(timezone.utc))

        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_check_on_demand_usage_flags_steady_traffic(self, mock_boto_client, monkeypatch):
        """Ensure on-demand usage heuristic flags steady patterns"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        monkeypatch.setattr('analyse.PANDAS_AVAILABLE', True)

        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[{'Sum': 1000}])

        analysis = {'stream_mode': 'ON_DEMAND', 'findings': [], 'health_score': 100}
        analyzer._check_on_demand_usage('steady-stream', analysis, [], datetime.now(timezone.utc) - timedelta(days=7), datetime.now(timezone.utc))

        assert analysis['findings'][0]['issue'] == 'On-Demand Misconduct'
        assert analysis['health_score'] == 95

    @patch('analyse.boto_client')
    def test_analyze_firehose_streams_runs_checks(self, mock_boto_client):
        """Run firehose analysis with mocked clients to cover checks"""
        mock_firehose = MagicMock()
        mock_cloudwatch = MagicMock()
        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': MagicMock(),
            'firehose': mock_firehose,
            'cloudwatch': mock_cloudwatch,
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': mock_ec2
        }[service]

        analyzer = KinesisAnalyzer()
        analyzer.firehose_streams = ['raw-customer-stream']

        mock_firehose.describe_delivery_stream.return_value = {
            'DeliveryStreamDescription': {
                'DeliveryStreamARN': 'arn:aws:firehose:us-east-1:123:deliverystream/customer-stream',
                'DeliveryStreamStatus': 'ACTIVE',
                'Destinations': [{
                    'DestinationId': 's3-dest',
                    'S3DestinationDescription': {'BufferingHints': {'SizeInMBs': 1, 'IntervalInSeconds': 60}},
                    'ExtendedS3DestinationDescription': {'VpcConfiguration': {'VpcId': 'vpc-123'}},
                    'RedshiftDestinationDescription': {'S3BackupMode': 'Disabled'}
                }],
                'DeliveryStreamEncryptionConfiguration': {'Status': 'DISABLED'}
            }
        }

        mock_cloudwatch.describe_alarms_for_metric.return_value = {'MetricAlarms': []}
        mock_ec2.describe_vpc_endpoints.return_value = {'VpcEndpoints': []}

        analyzer._get_cloudwatch_metrics = MagicMock(side_effect=[
            [{'Sum': 12000}],      # record count metrics
            [{'Sum': 10}],         # delivery success
            [{'Maximum': 1200}]    # freshness (delayed)
        ])

        analyzer._analyze_firehose_streams()

        assert analyzer.analysis_results['firehose_streams']
        issues = {f['issue'] for f in analyzer.analysis_results['firehose_streams'][0]['findings']}
        assert 'Firehose Delivery Failures' in issues
        assert 'Small Batch Sizes' in issues
        assert 'No Data Transformation' in issues
        assert 'Missing S3 Backup' in issues
        assert 'No CloudWatch Alarms' in issues
        assert 'VPC Endpoint Not Used' in issues
        assert 'No Encryption' in issues

    @patch('analyse.boto_client')
    def test_firehose_checks_cover_false_branches(self, mock_boto_client):
        """Run Firehose helper checks where conditions are not met"""
        mock_firehose = MagicMock()
        mock_cloudwatch = MagicMock()
        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': MagicMock(),
            'firehose': mock_firehose,
            'cloudwatch': mock_cloudwatch,
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': mock_ec2
        }[service]

        analyzer = KinesisAnalyzer()
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[])

        # Delivery failures with no metrics
        analysis = {'findings': [], 'health_score': 100}
        analyzer._check_firehose_delivery_failures('stream', analysis, [], datetime.now(timezone.utc), datetime.now(timezone.utc))
        assert analysis['findings'] == []

        # Transformation with processor configured
        dest_desc = {
            'ExtendedS3DestinationDescription': {
                'ProcessingConfiguration': {'Processors': ['p1']}
            }
        }
        analyzer._check_firehose_transformation('raw-stream', analysis, dest_desc)
        assert analysis['findings'] == []

        # Backup with unsupported destination keys should skip
        analyzer._check_firehose_backup('stream', analysis, {})
        assert analysis['findings'] == []

        # Alarms exist, so no finding added
        mock_cloudwatch.describe_alarms_for_metric.return_value = {'MetricAlarms': [{'AlarmName': 'ok'}]}
        analyzer._check_firehose_alarms('stream', analysis)
        assert all(f['issue'] != 'No CloudWatch Alarms' for f in analysis['findings'])

        # VPC endpoint check with no VPC configuration
        analyzer._check_firehose_vpc_endpoint('stream', analysis, {})
        assert analysis['findings'] == []

    @patch('analyse.boto_client')
    def test_analyze_firehose_streams_skips_low_traffic(self, mock_boto_client):
        """Cover branch where firehose stream is skipped for low volume"""
        mock_firehose = MagicMock()
        mock_cloudwatch = MagicMock()
        mock_boto_client.side_effect = lambda service, region=None: {
            'kinesis': MagicMock(),
            'firehose': mock_firehose,
            'cloudwatch': mock_cloudwatch,
            'lambda': MagicMock(),
            's3': MagicMock(),
            'kms': MagicMock(),
            'ec2': MagicMock()
        }[service]

        analyzer = KinesisAnalyzer()
        analyzer.firehose_streams = ['quiet-stream']

        mock_firehose.describe_delivery_stream.return_value = {
            'DeliveryStreamDescription': {
                'DeliveryStreamARN': 'arn:aws:firehose:us-east-1:123:deliverystream/quiet-stream',
                'DeliveryStreamStatus': 'ACTIVE',
                'Destinations': [{'DestinationId': 'dest'}],
                'DeliveryStreamEncryptionConfiguration': {'Status': 'DISABLED'}
            }
        }

        mock_cloudwatch.describe_alarms_for_metric.return_value = {'MetricAlarms': []}
        analyzer._get_cloudwatch_metrics = MagicMock(return_value=[{'Sum': 50}])

        analyzer._analyze_firehose_streams()
        assert analyzer.analysis_results['firehose_streams'] == []

    @patch('analyse.boto_client')
    def test_generate_summary_includes_retention_savings(self, mock_boto_client):
        """Cover savings calculation paths that rely on throughput metrics"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer.analysis_results = {
            'data_streams': [
                {
                    'stream_name': 'oversized',
                    'shard_count': 4,
                    'findings': [{'issue': 'Over-Provisioned Shards', 'severity': 'MEDIUM'}],
                    'metrics': {'throughput_utilization': 10},
                    'health_score': 90
                },
                {
                    'stream_name': 'retention-heavy',
                    'shard_count': 2,
                    'findings': [{'issue': 'Excessive Retention', 'severity': 'LOW'}],
                    'metrics': {'throughput_utilization': 50},
                    'health_score': 95
                }
            ],
            'firehose_streams': [],
            'summary': {}
        }

        analyzer._generate_summary()

        summary = analyzer.analysis_results['summary']
        assert summary['estimated_monthly_savings'] > 0
        assert summary['cost_optimization_opportunities'] == 2

    @patch('analyse.boto_client')
    @patch('builtins.open', create=True)
    def test_generate_html_dashboard_fallback(self, mock_open, mock_boto_client, monkeypatch):
        """Ensure HTML dashboard fallback renders when plotly is unavailable"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer.analysis_results = {'data_streams': [], 'firehose_streams': [], 'summary': {}}

        monkeypatch.setattr('analyse.PLOTLY_AVAILABLE', False)

        analyzer._generate_html_dashboard()

        mock_open.assert_called_with('throughput_utilization_dashboard.html', 'w')

    @patch('analyse.boto_client')
    @patch('builtins.print')
    def test_print_console_output_with_streams(self, mock_print, mock_boto_client, monkeypatch):
        """Cover console printing paths that render stream tables without tabulate"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        monkeypatch.setattr('analyse.TABULATE_AVAILABLE', False)
        analyzer.analysis_results = {
            'data_streams': [
                {
                    'stream_name': 'stream-one',
                    'health_score': 90,
                    'shard_count': 2,
                    'stream_mode': 'PROVISIONED',
                    'metrics': {'throughput_utilization': 75},
                    'findings': []
                }
            ],
            'firehose_streams': [
                {
                    'stream_name': 'firehose-one',
                    'destination': 'dest-id',
                    'health_score': 95,
                    'findings': []
                }
            ],
            'summary': {
                'total_data_streams': 1,
                'total_firehose_streams': 1,
                'average_health_score': 92.5,
                'high_priority_issues': 0,
                'estimated_monthly_savings': 0
            }
        }

        analyzer._print_console_output()
        assert mock_print.called

    @patch('analyse.boto_client')
    def test_generate_html_dashboard_with_plotly(self, mock_boto_client, monkeypatch):
        """Exercise plotly dashboard path with mocked graph objects"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer.consumer_lag_data = []
        analyzer.analysis_results = {
            'data_streams': [
                {
                    'stream_name': 'data-stream',
                    'health_score': 70,
                    'metrics': {'throughput_utilization': 85},
                    'findings': [{'issue': 'Over-Provisioned Shards', 'severity': 'MEDIUM'}]
                }
            ],
            'firehose_streams': [
                {'stream_name': 'fh', 'health_score': 95, 'destination': 'dest', 'findings': []}
            ],
            'summary': {}
        }

        mock_fig = MagicMock()
        mock_make_subplots = MagicMock(return_value=mock_fig)
        mock_go = SimpleNamespace(
            Bar=MagicMock(return_value='bar'),
            Scatter=MagicMock(return_value='scatter'),
            Pie=MagicMock(return_value='pie')
        )

        monkeypatch.setattr('analyse.PLOTLY_AVAILABLE', True)
        monkeypatch.setattr('analyse.go', mock_go)
        monkeypatch.setattr('analyse.make_subplots', mock_make_subplots)

        analyzer._generate_html_dashboard()

        mock_make_subplots.assert_called()
        mock_fig.write_html.assert_called_with('throughput_utilization_dashboard.html')

    @patch('analyse.boto_client')
    @patch('builtins.open', create=True)
    def test_save_csv_report_writes_header_when_empty(self, mock_open, mock_boto_client):
        """Cover CSV generation when there is no consumer lag data"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer.consumer_lag_data = []

        mock_file = MagicMock()
        mock_open.return_value.__enter__.return_value = mock_file

        analyzer._save_csv_report()

        mock_open.assert_called_with('consumer_lag_report.csv', 'w', newline='')

    @patch('analyse.boto_client')
    @patch('builtins.open', create=True)
    def test_save_csv_report_without_pandas(self, mock_open, mock_boto_client, monkeypatch):
        """Cover manual CSV writing path when pandas is unavailable"""
        mock_boto_client.return_value = MagicMock()
        analyzer = KinesisAnalyzer()
        analyzer.consumer_lag_data = [
            {'stream_name': 'a', 'consumer_name': 'c1', 'max_lag_ms': 10, 'avg_lag_ms': 5, 'flagged': False}
        ]

        monkeypatch.setattr('analyse.PANDAS_AVAILABLE', False)

        mock_file = MagicMock()
        mock_open.return_value.__enter__.return_value = mock_file

        analyzer._save_csv_report()
        mock_open.assert_called_with('consumer_lag_report.csv', 'w', newline='')
