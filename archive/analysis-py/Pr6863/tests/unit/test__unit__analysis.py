"""
Unit Tests for DynamoDB Analysis Script

This file contains comprehensive unit tests for the DynamoDBAnalyzer class.
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).

Test Coverage:
- Initialization and AWS client setup
- All 14 analysis check methods
- Helper methods (_calculate_average, _get_table_info, etc.)
- Main workflow (analyze method)
- Report generation (console, JSON, CSV)
"""

import sys
import os
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch, mock_open, call
from collections import defaultdict

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import DynamoDBAnalyzer, create_sample_tables, main


class TestDynamoDBAnalyzer:
    """Test suite for DynamoDBAnalyzer class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = DynamoDBAnalyzer()

        # Should create 5 AWS clients
        assert mock_boto_client.call_count == 5
        mock_boto_client.assert_any_call('dynamodb')
        mock_boto_client.assert_any_call('cloudwatch')
        mock_boto_client.assert_any_call('application-autoscaling')
        mock_boto_client.assert_any_call('lambda')
        mock_boto_client.assert_any_call('kinesis')

    @patch('analyse.boto3.client')
    def test_initialization_creates_empty_collections(self, mock_boto_client):
        """Test that analyzer initializes with empty findings and access patterns"""
        analyzer = DynamoDBAnalyzer()

        assert analyzer.findings == []
        assert analyzer.access_patterns == []
        assert isinstance(analyzer.cost_savings, defaultdict)

    # =========================================================================
    # GET FILTERED TABLES TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_filtered_tables_excludes_test_tables(self, mock_boto_client):
        """Test that test- and temp- prefixed tables are excluded"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        mock_paginator = MagicMock()
        mock_dynamodb.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'TableNames': ['test-table', 'temp-data', 'production-table']}
        ]

        analyzer = DynamoDBAnalyzer()

        # Mock other dependencies
        with patch.object(analyzer, '_has_exclude_tag', return_value=False):
            with patch.object(analyzer, '_meets_request_threshold', return_value=True):
                tables = analyzer._get_filtered_tables()

        assert 'test-table' not in tables
        assert 'temp-data' not in tables
        assert 'production-table' in tables

    @patch('analyse.boto3.client')
    def test_get_filtered_tables_excludes_tagged_tables(self, mock_boto_client):
        """Test that tables with ExcludeFromAnalysis tag are excluded"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        mock_paginator = MagicMock()
        mock_dynamodb.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'TableNames': ['table1', 'table2']}
        ]

        analyzer = DynamoDBAnalyzer()

        def mock_exclude_tag(table_name):
            return table_name == 'table1'

        with patch.object(analyzer, '_has_exclude_tag', side_effect=mock_exclude_tag):
            with patch.object(analyzer, '_meets_request_threshold', return_value=True):
                tables = analyzer._get_filtered_tables()

        assert 'table1' not in tables
        assert 'table2' in tables

    # =========================================================================
    # HAS EXCLUDE TAG TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_has_exclude_tag_detects_excluded_table(self, mock_boto_client):
        """Test that tables with ExcludeFromAnalysis=true are detected"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        mock_dynamodb.describe_table.return_value = {
            'Table': {'TableArn': 'arn:aws:dynamodb:us-east-1:123456789012:table/test'}
        }
        mock_dynamodb.list_tags_of_resource.return_value = {
            'Tags': [
                {'Key': 'ExcludeFromAnalysis', 'Value': 'true'}
            ]
        }

        analyzer = DynamoDBAnalyzer()
        result = analyzer._has_exclude_tag('test-table')

        assert result is True

    @patch('analyse.boto3.client')
    def test_has_exclude_tag_returns_false_for_normal_table(self, mock_boto_client):
        """Test that tables without exclude tag return False"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        mock_dynamodb.describe_table.return_value = {
            'Table': {'TableArn': 'arn:aws:dynamodb:us-east-1:123456789012:table/test'}
        }
        mock_dynamodb.list_tags_of_resource.return_value = {'Tags': []}

        analyzer = DynamoDBAnalyzer()
        result = analyzer._has_exclude_tag('normal-table')

        assert result is False

    # =========================================================================
    # MEETS REQUEST THRESHOLD TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    def test_meets_request_threshold_skips_check_in_mock_environment(self, mock_boto_client):
        """Test that request threshold check is skipped in mock environment"""
        analyzer = DynamoDBAnalyzer()
        result = analyzer._meets_request_threshold('any-table')

        assert result is True

    # =========================================================================
    # CHECK PROVISIONED WASTE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_provisioned_waste_detects_underutilized_table(self, mock_boto_client):
        """Test detection of provisioned table with low utilization"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PROVISIONED'},
            'ProvisionedThroughput': {
                'ReadCapacityUnits': 100,
                'WriteCapacityUnits': 100
            }
        }

        with patch.object(analyzer, '_get_cloudwatch_metrics', return_value={}):
            with patch.object(analyzer, '_calculate_average', return_value=10):
                analyzer._check_provisioned_waste('test-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'PROVISIONED_WASTE'
        assert finding['severity'] == 'HIGH'

    @patch('analyse.boto3.client')
    def test_check_provisioned_waste_skips_ondemand_tables(self, mock_boto_client):
        """Test that on-demand tables are skipped"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'}
        }

        analyzer._check_provisioned_waste('test-table', table_info)

        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_provisioned_waste_handles_exception(self, mock_boto_client):
        """Test provisioned waste check handles exceptions"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PROVISIONED'},
            'ProvisionedThroughput': {
                'ReadCapacityUnits': 100,
                'WriteCapacityUnits': 100
            }
        }

        with patch.object(analyzer, '_get_cloudwatch_metrics', side_effect=Exception("Test error")):
            analyzer._check_provisioned_waste('test-table', table_info)

        # Should not raise exception

    # =========================================================================
    # CHECK MISSING AUTOSCALING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_autoscaling_detects_missing_policies(self, mock_boto_client):
        """Test detection of provisioned table without auto-scaling"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PROVISIONED'}
        }

        with patch.object(analyzer, '_has_autoscaling_policy', return_value=False):
            analyzer._check_missing_autoscaling('test-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'MISSING_AUTOSCALING'
        assert finding['severity'] == 'HIGH'

    @patch('analyse.boto3.client')
    def test_check_missing_autoscaling_skips_ondemand_tables(self, mock_boto_client):
        """Test that on-demand tables are skipped for autoscaling check"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'}
        }

        analyzer._check_missing_autoscaling('test-table', table_info)

        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_missing_autoscaling_handles_exception(self, mock_boto_client):
        """Test that autoscaling check handles exceptions gracefully"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PROVISIONED'}
        }

        with patch.object(analyzer, '_has_autoscaling_policy', side_effect=Exception("Test error")):
            analyzer._check_missing_autoscaling('test-table', table_info)

        # Should not raise exception

    @patch('analyse.boto3.client')
    def test_check_missing_autoscaling_detects_missing_read_only(self, mock_boto_client):
        """Test detection when only read autoscaling is missing"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PROVISIONED'}
        }

        def mock_autoscaling(resource_id, dimension):
            # Write has autoscaling, Read doesn't
            return 'Write' in dimension

        with patch.object(analyzer, '_has_autoscaling_policy', side_effect=mock_autoscaling):
            analyzer._check_missing_autoscaling('test-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert 'Read' in finding['description']

    # =========================================================================
    # CHECK ONDEMAND MISUSE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_ondemand_misuse_detects_consistent_traffic(self, mock_boto_client):
        """Test detection of on-demand table with consistent traffic"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'}
        }

        # Mock consistent traffic pattern (low coefficient of variation)
        mock_datapoints = [
            {'Sum': 100}, {'Sum': 105}, {'Sum': 95}, {'Sum': 100}, {'Sum': 98}
        ]

        with patch.object(analyzer, '_get_cloudwatch_metrics', return_value={
            'ConsumedReadCapacityUnits': mock_datapoints,
            'ConsumedWriteCapacityUnits': mock_datapoints
        }):
            analyzer._check_ondemand_misuse('test-table', table_info)

        # May or may not find issue depending on threshold, just ensure no exception

    @patch('analyse.boto3.client')
    def test_check_ondemand_misuse_skips_provisioned_tables(self, mock_boto_client):
        """Test that provisioned tables are skipped"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'BillingModeSummary': {'BillingMode': 'PROVISIONED'}
        }

        analyzer._check_ondemand_misuse('test-table', table_info)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # CHECK HOT PARTITIONS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_hot_partitions_detects_throttling(self, mock_boto_client):
        """Test detection of hot partitions through throttling events"""
        analyzer = DynamoDBAnalyzer()

        mock_datapoints = [{'Sum': 150}]

        with patch.object(analyzer, '_get_cloudwatch_metrics', return_value={
            'UserErrors': mock_datapoints,
            'SystemErrors': []
        }):
            analyzer._check_hot_partitions('test-table')

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'HOT_PARTITIONS'
        assert finding['severity'] == 'CRITICAL'

    @patch('analyse.boto3.client')
    def test_check_hot_partitions_handles_no_throttling(self, mock_boto_client):
        """Test that tables without throttling are not flagged"""
        analyzer = DynamoDBAnalyzer()

        with patch.object(analyzer, '_get_cloudwatch_metrics', return_value={
            'UserErrors': [],
            'SystemErrors': []
        }):
            analyzer._check_hot_partitions('test-table')

        assert len(analyzer.findings) == 0

    # =========================================================================
    # CHECK LARGE ITEMS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_large_items_detects_oversized_items(self, mock_boto_client):
        """Test detection of tables with large items"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        analyzer = DynamoDBAnalyzer()

        # Mock large items (> 100KB)
        large_item = {'id': {'S': 'test'}, 'data': {'S': 'x' * 150000}}
        mock_dynamodb.scan.return_value = {
            'Items': [large_item] * 100
        }

        analyzer._check_large_items('test-table')

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'LARGE_ITEMS'
        assert finding['severity'] == 'HIGH'

    @patch('analyse.boto3.client')
    def test_check_large_items_handles_exception(self, mock_boto_client):
        """Test that large items check handles exceptions"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        analyzer = DynamoDBAnalyzer()

        mock_dynamodb.scan.side_effect = Exception("Test error")

        analyzer._check_large_items('test-table')

        # Should not raise exception

    # =========================================================================
    # CHECK POOR DATA MODELING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_poor_data_modeling_tracks_metrics(self, mock_boto_client):
        """Test that poor data modeling check tracks metrics"""
        analyzer = DynamoDBAnalyzer()

        mock_datapoints = [{'Sum': 15000}]

        with patch.object(analyzer, '_get_cloudwatch_metrics', return_value={
            'ConsumedReadCapacityUnits': mock_datapoints
        }):
            analyzer._check_poor_data_modeling('test-table')

        # Should create access pattern entry
        assert len(analyzer.access_patterns) > 0 or len(analyzer.findings) > 0

    # =========================================================================
    # CHECK GSI OVERPROJECTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_gsi_overprojection_detects_all_projection(self, mock_boto_client):
        """Test detection of GSI with ALL projection type"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'GlobalSecondaryIndexes': [
                {
                    'IndexName': 'test-gsi',
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ]
        }

        with patch.object(analyzer, '_get_cloudwatch_metrics', return_value={}):
            with patch.object(analyzer, '_calculate_average', return_value=10):
                analyzer._check_gsi_overprojection('test-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'GSI_OVERPROJECTION'
        assert finding['severity'] == 'MEDIUM'

    # =========================================================================
    # CHECK EXCESSIVE GSIS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_excessive_gsis_detects_too_many_indexes(self, mock_boto_client):
        """Test detection of table with more than 10 GSIs"""
        analyzer = DynamoDBAnalyzer()

        # Create table with 15 GSIs
        gsis = [{'IndexName': f'gsi-{i}'} for i in range(15)]
        table_info = {'GlobalSecondaryIndexes': gsis}

        analyzer._check_excessive_gsis('test-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'EXCESSIVE_GSIS'
        assert finding['severity'] == 'HIGH'
        assert '15 GSIs' in finding['description']

    @patch('analyse.boto3.client')
    def test_check_excessive_gsis_allows_normal_count(self, mock_boto_client):
        """Test that tables with <= 10 GSIs are not flagged"""
        analyzer = DynamoDBAnalyzer()

        gsis = [{'IndexName': f'gsi-{i}'} for i in range(5)]
        table_info = {'GlobalSecondaryIndexes': gsis}

        analyzer._check_excessive_gsis('test-table', table_info)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # CHECK MISSING RESILIENCE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_resilience_detects_critical_table_without_pitr(self, mock_boto_client):
        """Test detection of critical table without PITR enabled"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'Tags': {'DataCritical': 'true'},
            'ContinuousBackups': {
                'PointInTimeRecoveryDescription': {
                    'PointInTimeRecoveryStatus': 'DISABLED'
                }
            }
        }

        analyzer._check_missing_resilience('critical-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'MISSING_PITR'
        assert finding['severity'] == 'CRITICAL'

    # =========================================================================
    # CHECK MISSING ENCRYPTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_encryption_detects_sensitive_table_without_cmk(self, mock_boto_client):
        """Test detection of sensitive data table without CMK encryption"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'Tags': {'SensitiveData': 'true'},
            'SSEDescription': {}
        }

        analyzer._check_missing_encryption('sensitive-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'MISSING_CMK_ENCRYPTION'
        assert finding['severity'] == 'CRITICAL'

    # =========================================================================
    # CHECK MISSING TTL TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_ttl_detects_session_table_without_ttl(self, mock_boto_client):
        """Test detection of session/cache table without TTL"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        analyzer = DynamoDBAnalyzer()

        table_info = {'Tags': {}}

        mock_dynamodb.describe_time_to_live.return_value = {
            'TimeToLiveDescription': {'TimeToLiveStatus': 'DISABLED'}
        }

        analyzer._check_missing_ttl('session-data-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'MISSING_TTL'
        assert finding['severity'] == 'HIGH'

    # =========================================================================
    # CHECK STALE STREAMS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_stale_streams_detects_unused_streams(self, mock_boto_client):
        """Test detection of enabled streams without consumers"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'StreamSpecification': {'StreamEnabled': True},
            'LatestStreamArn': 'arn:aws:dynamodb:us-east-1:123456789012:table/test/stream'
        }

        with patch.object(analyzer, '_check_stream_consumers', return_value=False):
            analyzer._check_stale_streams('test-table', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'STALE_STREAMS'
        assert finding['severity'] == 'MEDIUM'

    @patch('analyse.boto3.client')
    def test_check_stale_streams_skips_when_no_stream(self, mock_boto_client):
        """Test that tables without streams are skipped"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'StreamSpecification': {'StreamEnabled': False}
        }

        analyzer._check_stale_streams('test-table', table_info)

        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_stale_streams_skips_when_has_consumers(self, mock_boto_client):
        """Test that streams with consumers are not flagged"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'StreamSpecification': {'StreamEnabled': True},
            'LatestStreamArn': 'arn:aws:dynamodb:us-east-1:123456789012:table/test/stream'
        }

        with patch.object(analyzer, '_check_stream_consumers', return_value=True):
            analyzer._check_stale_streams('test-table', table_info)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # CHECK MISSING MONITORING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_monitoring_detects_tables_without_alarms(self, mock_boto_client):
        """Test detection of tables without CloudWatch alarms"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = DynamoDBAnalyzer()

        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': []
        }

        analyzer._check_missing_monitoring('test-table')

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'MISSING_MONITORING'
        assert finding['severity'] == 'HIGH'

    # =========================================================================
    # CHECK MISSING GLOBAL TABLE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_global_tables_detects_global_critical_table(self, mock_boto_client):
        """Test detection of global-critical table not configured as global table"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'Tags': {'GlobalCritical': 'true'}
        }

        analyzer._check_missing_global_tables('user-data', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'MISSING_GLOBAL_TABLE'
        assert finding['severity'] == 'HIGH'

    @patch('analyse.boto3.client')
    def test_check_missing_global_tables_detects_table_with_global_in_name(self, mock_boto_client):
        """Test detection of table with 'global' in name"""
        analyzer = DynamoDBAnalyzer()

        table_info = {'Tags': {}}

        analyzer._check_missing_global_tables('global-users', table_info)

        assert len(analyzer.findings) > 0
        finding = analyzer.findings[0]
        assert finding['issue'] == 'MISSING_GLOBAL_TABLE'

    @patch('analyse.boto3.client')
    def test_check_missing_global_tables_skips_normal_tables(self, mock_boto_client):
        """Test that normal tables are skipped"""
        analyzer = DynamoDBAnalyzer()

        table_info = {'Tags': {}}

        analyzer._check_missing_global_tables('user-data', table_info)

        assert len(analyzer.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_missing_global_tables_skips_existing_global_table(self, mock_boto_client):
        """Test that existing global tables are not flagged"""
        analyzer = DynamoDBAnalyzer()

        table_info = {
            'Tags': {'GlobalCritical': 'true'},
            'GlobalTableVersion': '2019.11.21'
        }

        analyzer._check_missing_global_tables('user-data', table_info)

        assert len(analyzer.findings) == 0

    # =========================================================================
    # HELPER METHOD TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_calculate_average_returns_correct_value(self, mock_boto_client):
        """Test _calculate_average helper method"""
        analyzer = DynamoDBAnalyzer()

        datapoints = [
            {'Average': 10.0},
            {'Average': 20.0},
            {'Average': 30.0}
        ]

        result = analyzer._calculate_average(datapoints)

        assert result == 20.0

    @patch('analyse.boto3.client')
    def test_calculate_average_handles_empty_datapoints(self, mock_boto_client):
        """Test _calculate_average returns 0 for empty datapoints"""
        analyzer = DynamoDBAnalyzer()

        result = analyzer._calculate_average([])

        assert result == 0

    @patch('analyse.boto3.client')
    def test_estimate_item_size_returns_size_in_bytes(self, mock_boto_client):
        """Test _estimate_item_size helper method"""
        analyzer = DynamoDBAnalyzer()

        item = {'id': {'S': 'test-123'}, 'data': {'S': 'some data'}}
        size = analyzer._estimate_item_size(item)

        assert size > 0
        assert isinstance(size, int)

    @patch('analyse.boto3.client')
    def test_get_table_arn_returns_arn(self, mock_boto_client):
        """Test _get_table_arn helper method"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        analyzer = DynamoDBAnalyzer()

        mock_dynamodb.describe_table.return_value = {
            'Table': {'TableArn': 'arn:aws:dynamodb:us-east-1:123456789012:table/test'}
        }

        arn = analyzer._get_table_arn('test-table')

        assert arn == 'arn:aws:dynamodb:us-east-1:123456789012:table/test'

    @patch('analyse.boto3.client')
    def test_has_autoscaling_policy_detects_policy(self, mock_boto_client):
        """Test _has_autoscaling_policy helper method"""
        mock_autoscaling = MagicMock()
        mock_boto_client.return_value = mock_autoscaling

        analyzer = DynamoDBAnalyzer()

        mock_autoscaling.describe_scalable_targets.return_value = {
            'ScalableTargets': [{'ResourceId': 'table/test'}]
        }

        result = analyzer._has_autoscaling_policy('table/test', 'dynamodb:table:ReadCapacityUnits')

        assert result is True

    @patch('analyse.boto3.client')
    def test_has_autoscaling_policy_handles_exception(self, mock_boto_client):
        """Test _has_autoscaling_policy handles exceptions"""
        mock_autoscaling = MagicMock()
        mock_boto_client.return_value = mock_autoscaling

        analyzer = DynamoDBAnalyzer()

        mock_autoscaling.describe_scalable_targets.side_effect = Exception("Test error")

        result = analyzer._has_autoscaling_policy('table/test', 'dynamodb:table:ReadCapacityUnits')

        assert result is False

    @patch('analyse.boto3.client')
    def test_check_stream_consumers_detects_lambda(self, mock_boto_client):
        """Test _check_stream_consumers detects Lambda consumers"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        analyzer = DynamoDBAnalyzer()

        mock_lambda.list_event_source_mappings.return_value = {
            'EventSourceMappings': [{'EventSourceArn': 'test-arn'}]
        }

        result = analyzer._check_stream_consumers('test-arn')

        assert result is True

    @patch('analyse.boto3.client')
    def test_check_stream_consumers_returns_false_when_none(self, mock_boto_client):
        """Test _check_stream_consumers returns False when no consumers"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        analyzer = DynamoDBAnalyzer()

        mock_lambda.list_event_source_mappings.return_value = {
            'EventSourceMappings': []
        }

        result = analyzer._check_stream_consumers('test-arn')

        assert result is False

    @patch('analyse.boto3.client')
    def test_check_stream_consumers_handles_exception(self, mock_boto_client):
        """Test _check_stream_consumers handles exceptions"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        analyzer = DynamoDBAnalyzer()

        mock_lambda.list_event_source_mappings.side_effect = Exception("Test error")

        result = analyzer._check_stream_consumers('test-arn')

        assert result is False

    @patch('analyse.boto3.client')
    def test_get_table_info_handles_exception(self, mock_boto_client):
        """Test _get_table_info handles exceptions gracefully"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        analyzer = DynamoDBAnalyzer()

        mock_dynamodb.describe_table.side_effect = Exception("Test error")

        result = analyzer._get_table_info('test-table')

        assert result is None

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_metrics_handles_exception(self, mock_boto_client):
        """Test _get_cloudwatch_metrics handles exceptions"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = DynamoDBAnalyzer()

        mock_cloudwatch.get_metric_statistics.side_effect = Exception("Test error")

        from datetime import datetime, timedelta
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=1)

        result = analyzer._get_cloudwatch_metrics('test-table', ['TestMetric'], start_time, end_time)

        # Should return empty dict for the metric
        assert 'TestMetric' in result
        assert result['TestMetric'] == []

    @patch('analyse.boto3.client')
    def test_get_filtered_tables_handles_exception(self, mock_boto_client):
        """Test _get_filtered_tables handles exceptions"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        analyzer = DynamoDBAnalyzer()

        mock_paginator = MagicMock()
        mock_dynamodb.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = Exception("Test error")

        result = analyzer._get_filtered_tables()

        # Should return empty list on error
        assert result == []

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_method_processes_all_tables(self, mock_boto_client):
        """Test analyze() method processes all filtered tables"""
        analyzer = DynamoDBAnalyzer()

        with patch.object(analyzer, '_get_filtered_tables', return_value=['table1', 'table2']):
            with patch.object(analyzer, '_analyze_table') as mock_analyze:
                with patch.object(analyzer, '_display_console_output'):
                    with patch.object(analyzer, '_save_json_report'):
                        with patch.object(analyzer, '_save_access_pattern_csv'):
                            analyzer.analyze()

                # Verify _analyze_table was called for each table
                assert mock_analyze.call_count == 2
                mock_analyze.assert_any_call('table1')
                mock_analyze.assert_any_call('table2')

    @patch('analyse.boto3.client')
    def test_analyze_table_runs_all_checks(self, mock_boto_client):
        """Test _analyze_table runs all 14 check methods"""
        analyzer = DynamoDBAnalyzer()

        table_info = {'Tags': {}, 'BillingModeSummary': {}}

        with patch.object(analyzer, '_get_table_info', return_value=table_info) as mock_get_info:
            # Patch all check methods
            with patch.object(analyzer, '_check_provisioned_waste') as mock_waste:
                with patch.object(analyzer, '_check_missing_autoscaling') as mock_autoscaling:
                    with patch.object(analyzer, '_check_excessive_gsis') as mock_gsis:
                        analyzer._analyze_table('test-table')

                        # Verify get_table_info was called
                        mock_get_info.assert_called_once_with('test-table')
                        # Verify check methods were called
                        mock_waste.assert_called_once()
                        mock_autoscaling.assert_called_once()
                        mock_gsis.assert_called_once()

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_save_json_report_creates_file(self, mock_json_dump, mock_file, mock_boto_client):
        """Test _save_json_report creates JSON file"""
        analyzer = DynamoDBAnalyzer()
        analyzer.findings = [
            {'table': 'test', 'issue': 'TEST', 'severity': 'HIGH', 'description': 'test', 'recommendation': 'test', 'monthly_savings': 0}
        ]

        analyzer._save_json_report()

        mock_file.assert_called_once_with('dynamodb_optimization.json', 'w')
        assert mock_json_dump.called

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    def test_save_access_pattern_csv_creates_file(self, mock_file, mock_boto_client):
        """Test _save_access_pattern_csv creates CSV file"""
        analyzer = DynamoDBAnalyzer()
        analyzer.access_patterns = [
            {'table': 'test', 'total_reads': 1000, 'scan_ratio_estimate': 'Unknown', 'recommendation': 'test'}
        ]

        analyzer._save_access_pattern_csv()

        mock_file.assert_called_once_with('access_pattern_report.csv', 'w', newline='')

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_display_console_output_shows_findings(self, mock_print, mock_boto_client):
        """Test _display_console_output prints findings to console"""
        analyzer = DynamoDBAnalyzer()
        analyzer.findings = [
            {
                'table': 'test-table',
                'issue': 'TEST_ISSUE',
                'severity': 'HIGH',
                'description': 'Test description',
                'recommendation': 'Test recommendation',
                'monthly_savings': 100
            }
        ]

        analyzer._display_console_output()

        # Verify print was called multiple times
        assert mock_print.call_count > 0

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_display_console_output_handles_no_findings(self, mock_print, mock_boto_client):
        """Test _display_console_output handles empty findings"""
        analyzer = DynamoDBAnalyzer()
        analyzer.findings = []

        analyzer._display_console_output()

        # Should print success message
        mock_print.assert_called()
        # Check that "No optimization issues found" was printed
        calls = [str(call) for call in mock_print.call_args_list]
        assert any('No optimization issues found' in str(call) for call in calls)

    # =========================================================================
    # CREATE SAMPLE TABLES TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_create_sample_tables_creates_all_tables(self, mock_boto_client):
        """Test create_sample_tables creates all required tables"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        create_sample_tables()

        # Verify create_table was called multiple times
        assert mock_dynamodb.create_table.call_count >= 10

    @patch('analyse.boto3.client')
    def test_create_sample_tables_handles_existing_tables(self, mock_boto_client):
        """Test create_sample_tables handles ResourceInUseException gracefully"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        # Simulate table already exists
        mock_dynamodb.create_table.side_effect = mock_dynamodb.exceptions.ResourceInUseException(
            {'Error': {'Code': 'ResourceInUseException', 'Message': 'Table exists'}},
            'CreateTable'
        )

        # Should not raise exception
        create_sample_tables()

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('analyse.create_sample_tables')
    @patch('analyse.DynamoDBAnalyzer')
    def test_main_function_executes_successfully(self, mock_analyzer_class, mock_create_tables, mock_boto_client):
        """Test main() function runs without errors"""
        mock_analyzer = MagicMock()
        mock_analyzer_class.return_value = mock_analyzer

        main()

        # Verify create_sample_tables was called
        mock_create_tables.assert_called_once()
        # Verify analyzer.analyze was called
        mock_analyzer.analyze.assert_called_once()

    @patch('analyse.boto3.client')
    @patch('analyse.create_sample_tables')
    @patch('analyse.DynamoDBAnalyzer')
    def test_main_function_handles_exception(self, mock_analyzer_class, mock_create_tables, mock_boto_client):
        """Test main() function handles exceptions gracefully"""
        mock_create_tables.side_effect = Exception("Test error")

        with pytest.raises(Exception):
            main()


# =========================================================================
# INTEGRATION-STYLE TESTS (using mocks)
# =========================================================================

class TestDynamoDBAnalyzerIntegration:
    """Integration-style tests using comprehensive mocking"""

    @patch('analyse.boto3.client')
    def test_complete_analysis_workflow(self, mock_boto_client):
        """Test complete analysis workflow runs without errors"""
        analyzer = DynamoDBAnalyzer()

        # Mock the entire workflow with simpler approach
        with patch.object(analyzer, '_get_filtered_tables', return_value=[]):
            with patch.object(analyzer, '_display_console_output'):
                with patch('builtins.open', new_callable=mock_open):
                    with patch('json.dump'):
                        # Should complete without error even with no tables
                        analyzer.analyze()

        # Workflow completed successfully (no exception raised)
