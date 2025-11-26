"""
Unit Tests for ElastiCache Analysis Script

This test suite provides comprehensive coverage of the ElastiCacheAnalyzer class
using unittest.mock to test logic WITHOUT external services (no Moto).

Coverage Areas:
- Initialization and client setup
- Cluster filtering and exclusion logic
- Cluster analysis methods
- Metric collection and calculation
- Cost analysis and performance scoring
- Output generation
- Error handling
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch, mock_open, call
from collections import defaultdict

import pytest
from botocore.exceptions import ClientError

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import ElastiCacheAnalyzer


class TestElastiCacheAnalyzer:
    """Test suite for ElastiCacheAnalyzer class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = ElastiCacheAnalyzer()

        assert analyzer.region == 'us-east-1'
        assert mock_boto_client.call_count == 3

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    def test_initialization_uses_endpoint_from_environment(self, mock_boto_client):
        """Test analyzer uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""
        analyzer = ElastiCacheAnalyzer()

        # Verify endpoint_url was passed to boto3 clients
        calls = mock_boto_client.call_args_list
        for call in calls:
            assert call[1].get('endpoint_url') == 'http://localhost:5000'

    @patch('analyse.boto3.client')
    def test_initialization_creates_empty_analysis_structure(self, mock_boto_client):
        """Test that analysis results structure is initialized correctly"""
        analyzer = ElastiCacheAnalyzer()

        assert analyzer.clusters == []
        assert analyzer.analysis_results == []

    # =========================================================================
    # CLUSTER FILTERING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_should_exclude_cluster_with_test_prefix(self, mock_boto_client):
        """Test that test clusters are excluded"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {'CacheClusterId': 'test-redis-cluster'}
        assert analyzer.should_exclude_cluster(cluster) == True

        cluster = {'CacheClusterId': 'dev-memcached-cluster'}
        assert analyzer.should_exclude_cluster(cluster) == True

    @patch('analyse.boto3.client')
    def test_should_include_production_cluster(self, mock_boto_client):
        """Test that production clusters are included"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {'CacheClusterId': 'prod-redis-cluster'}
        assert analyzer.should_exclude_cluster(cluster) == False

    # =========================================================================
    # CLUSTER ANALYSIS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_over_provisioned_resources(self, mock_boto_client):
        """Test analyze_cluster identifies over-provisioned resources"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'test-cluster',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        # Mock metrics to show underutilization
        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95,
            'evictions_per_hour': 50,
            'cpu_avg': 5,
            'memory_usage_percent': 30,
            'connections_peak': 100,
            'network_utilization_percent': 2
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        assert len(result['issues']) > 0
        issue_types = [issue['type'] for issue in result['issues']]
        assert 'over_provisioned' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_old_engine_version(self, mock_boto_client):
        """Test analyze_cluster identifies old Redis versions"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'old-redis-cluster',
            'Engine': 'redis',
            'EngineVersion': '5.0.6',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'old_engine_version' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_no_auth_token(self, mock_boto_client):
        """Test analyze_cluster identifies Redis clusters without AUTH token"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-no-auth',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'no_auth_token' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_inadequate_backup(self, mock_boto_client):
        """Test analyze_cluster identifies inadequate backup retention"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-no-backup',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'inadequate_backup' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_no_vpc_deployment(self, mock_boto_client):
        """Test analyze_cluster identifies clusters not deployed in VPC"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-no-vpc',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'Tags': {}
            # No CacheSubnetGroupName - not in VPC
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'no_vpc_deployment' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_memory_pressure(self, mock_boto_client):
        """Test analyze_cluster identifies memory pressure issues"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-memory-pressure',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 150, 'cpu_avg': 50,
            'memory_usage_percent': 95, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'memory_pressure' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_single_az_deployment(self, mock_boto_client):
        """Test analyze_cluster identifies single AZ deployment for production clusters"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'prod-redis-single-az',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {'Environment': 'production'}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={'Environment': 'production'}):
                with patch.object(analyzer, 'is_multi_az', return_value=False):
                    result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'single_az_deployment' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_missing_encryption(self, mock_boto_client):
        """Test analyze_cluster identifies missing encryption for sensitive data"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-sensitive',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {'DataClassification': 'sensitive'}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={'DataClassification': 'sensitive'}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'missing_encryption' in issue_types

    # =========================================================================
    # METRIC COLLECTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_cluster_metrics_calculates_cache_hit_rate(self, mock_boto_client):
        """Test get_cluster_metrics calculates cache hit rate correctly"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        # Mock CloudWatch responses
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 95.0}]},  # CacheHits
            {'Datapoints': [{'Sum': 5.0}]},   # CacheMisses
            {'Datapoints': []},  # Evictions
            {'Datapoints': [{'Average': 50.0}]}, # CPU
            {'Datapoints': []},  # Memory
            {'Datapoints': [{'Maximum': 100}]},  # Connections
            {'Datapoints': []},  # NetworkBytesIn
            {'Datapoints': []}   # NetworkBytesOut
        ]

        analyzer = ElastiCacheAnalyzer()
        metrics = analyzer.get_cluster_metrics('test-cluster', 'redis')

        assert metrics['cache_hit_rate'] == 95.0  # (95 / (95 + 5)) * 100

    @patch('analyse.boto3.client')
    def test_get_cluster_metrics_handles_cloudwatch_errors(self, mock_boto_client):
        """Test get_cluster_metrics handles CloudWatch errors gracefully"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'InvalidParameterValue', 'Message': 'Invalid metric'}},
            'GetMetricStatistics'
        )

        analyzer = ElastiCacheAnalyzer()
        metrics = analyzer.get_cluster_metrics('test-cluster', 'redis')

        # Should return default values
        assert metrics['cache_hit_rate'] == 0
        assert metrics['cpu_avg'] == 0

    # =========================================================================
    # COST ANALYSIS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_calculate_cost_analysis_computes_monthly_cost(self, mock_boto_client):
        """Test calculate_cost_analysis computes monthly cost correctly"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'test-cluster',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 2,
            'CacheClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=400)  # Old cluster
        }

        issues = []
        metrics = {'cache_hit_rate': 95}

        result = analyzer.calculate_cost_analysis(cluster, issues, metrics)

        # cache.t3.medium = $0.068/hour * 2 nodes * 24 hours * 30 days = $98.88
        expected_cost = 0.068 * 2 * 24 * 30
        assert abs(result['current_monthly_cost'] - expected_cost) < 0.01

    @patch('analyse.boto3.client')
    def test_calculate_cost_analysis_identifies_rightsizing_opportunities(self, mock_boto_client):
        """Test calculate_cost_analysis identifies rightsizing opportunities"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'test-cluster',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=400)
        }

        issues = [{'type': 'over_provisioned'}]  # Mock over-provisioned issue
        metrics = {'cache_hit_rate': 95}

        result = analyzer.calculate_cost_analysis(cluster, issues, metrics)

        # Should have rightsizing savings
        assert result['rightsizing_savings'] > 0

    @patch('analyse.boto3.client')
    def test_calculate_cost_analysis_calculates_reserved_savings(self, mock_boto_client):
        """Test calculate_cost_analysis calculates reserved instance savings"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'test-cluster',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=400)  # Over 1 year old
        }

        issues = []
        metrics = {'cache_hit_rate': 95}

        result = analyzer.calculate_cost_analysis(cluster, issues, metrics)

        # Should have reserved pricing savings
        assert result['reserved_pricing_savings'] > 0

    @patch('analyse.boto3.client')
    def test_calculate_performance_score_handles_high_memory_usage(self, mock_boto_client):
        """Test calculate_performance_score deducts for high memory usage"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {'CacheClusterId': 'test-cluster'}
        issues = []
        metrics = {'cache_hit_rate': 95, 'evictions_per_hour': 50, 'memory_usage_percent': 95}  # High memory

        score = analyzer.calculate_performance_score(cluster, issues, metrics)

        # Should deduct 5 points for high memory usage
        assert score == 95  # 100 - 5

    @patch('analyse.boto3.client')
    def test_calculate_performance_score_handles_high_evictions(self, mock_boto_client):
        """Test calculate_performance_score deducts for high evictions"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {'CacheClusterId': 'test-cluster'}
        issues = []
        metrics = {'cache_hit_rate': 95, 'evictions_per_hour': 1500, 'memory_usage_percent': 50}  # High evictions

        score = analyzer.calculate_performance_score(cluster, issues, metrics)

        # Should deduct 10 points for high evictions
        assert score == 90  # 100 - 10

    # =========================================================================
    # PERFORMANCE SCORING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_calculate_performance_score_deducts_for_critical_issues(self, mock_boto_client):
        """Test calculate_performance_score deducts points for critical issues"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {'CacheClusterId': 'test-cluster'}
        issues = [
            {'severity': 'critical', 'type': 'no_vpc_deployment'},
            {'severity': 'high', 'type': 'no_auth_token'}
        ]
        metrics = {'cache_hit_rate': 95, 'evictions_per_hour': 50, 'memory_usage_percent': 50}

        score = analyzer.calculate_performance_score(cluster, issues, metrics)

        # Should deduct 20 points for critical + 15 for high = 35 points
        assert score == 100 - 20 - 15

    @patch('analyse.boto3.client')
    def test_calculate_performance_score_deducts_for_low_cache_hit_rate(self, mock_boto_client):
        """Test calculate_performance_score deducts for low cache hit rate"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {'CacheClusterId': 'test-cluster'}
        issues = []
        metrics = {'cache_hit_rate': 70, 'evictions_per_hour': 50, 'memory_usage_percent': 50}  # Below 85% threshold

        score = analyzer.calculate_performance_score(cluster, issues, metrics)

        # Should deduct 10 points for low cache hit rate
        assert score == 90

    # =========================================================================
    # HELPER METHOD TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_is_critical_cluster_identifies_critical_clusters(self, mock_boto_client):
        """Test is_critical_cluster identifies critical clusters"""
        analyzer = ElastiCacheAnalyzer()

        # Test by criticality tag
        assert analyzer.is_critical_cluster({'Tags': {'Criticality': 'critical'}}) == True
        assert analyzer.is_critical_cluster({'Tags': {'Criticality': 'high'}}) == True
        assert analyzer.is_critical_cluster({'Tags': {'Criticality': 'low'}}) == False

    @patch('analyse.boto3.client')
    def test_is_multi_az_checks_replication_group(self, mock_boto_client):
        """Test is_multi_az checks replication group MultiAZ setting"""
        analyzer = ElastiCacheAnalyzer()

        # Test with replication group
        cluster_with_rep = {'ReplicationGroupInfo': {'MultiAZ': True}}
        assert analyzer.is_multi_az(cluster_with_rep) == True

        cluster_no_multi_az = {'ReplicationGroupInfo': {'MultiAZ': False}}
        assert analyzer.is_multi_az(cluster_no_multi_az) == False

        # Test without replication group
        cluster_no_rep = {}
        assert analyzer.is_multi_az(cluster_no_rep) == False

    @patch('analyse.boto3.client')
    def test_is_old_engine_version_identifies_outdated_versions(self, mock_boto_client):
        """Test is_old_engine_version identifies outdated engine versions"""
        analyzer = ElastiCacheAnalyzer()

        # Redis versions
        assert analyzer.is_old_engine_version('redis', '5.0.6') == True
        assert analyzer.is_old_engine_version('redis', '6.2.6') == False

        # Memcached versions
        assert analyzer.is_old_engine_version('memcached', '1.4.5') == True
        assert analyzer.is_old_engine_version('memcached', '1.6.6') == False

    @patch('analyse.boto3.client')
    def test_get_cluster_tags_handles_errors_gracefully(self, mock_boto_client):
        """Test get_cluster_tags handles AWS errors gracefully"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_tags.side_effect = ClientError(
            {'Error': {'Code': 'InvalidClusterId.NotFound', 'Message': 'Cluster not found'}},
            'DescribeTags'
        )

        analyzer = ElastiCacheAnalyzer()
        tags = analyzer.get_cluster_tags('nonexistent-cluster')

        assert tags == {}

    # =========================================================================
    # OUTPUT GENERATION TESTS
    # =========================================================================


    @patch('analyse.boto3.client')
    @patch('analyse.pd.DataFrame.to_csv')
    def test_generate_csv_output_covers_over_provisioned_branch(self, mock_to_csv, mock_boto_client):
        """Test generate_csv_output covers the over_provisioned branch"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'test-cluster-over-provisioned',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.t3.large',  # Has 'large' for the replace logic
                'num_nodes': 1,
                'issues': [{'type': 'over_provisioned', 'severity': 'medium'}],  # Over-provisioned issue
                'performance_metrics': {'cache_hit_rate': 95, 'cpu_avg': 50, 'memory_usage_percent': 60},
                'cost_analysis': {'current_monthly_cost': 100, 'rightsizing_savings': 30, 'optimized_monthly_cost': 70},
                'performance_score': 85
            }
        ]

        analyzer.generate_csv_output()

        # Verify to_csv was called
        mock_to_csv.assert_called_once()

    @patch('analyse.boto3.client')
    @patch('analyse.pd.DataFrame.to_csv')
    def test_generate_csv_output_covers_memory_pressure_branch(self, mock_to_csv, mock_boto_client):
        """Test generate_csv_output covers the memory_pressure branch"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'test-cluster-memory-pressure',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.t3.medium',  # Has 'medium' for the replace logic
                'num_nodes': 1,
                'issues': [{'type': 'memory_pressure', 'severity': 'high'}],  # Memory pressure issue
                'performance_metrics': {'cache_hit_rate': 95, 'cpu_avg': 50, 'memory_usage_percent': 60},
                'cost_analysis': {'current_monthly_cost': 100, 'rightsizing_savings': 30, 'optimized_monthly_cost': 70},
                'performance_score': 85
            }
        ]

        analyzer.generate_csv_output()

        # Verify to_csv was called
        mock_to_csv.assert_called_once()

    @patch('analyse.boto3.client')
    @patch('analyse.pd.DataFrame.to_csv')
    def test_generate_csv_output_covers_inefficient_node_type_branch(self, mock_to_csv, mock_boto_client):
        """Test generate_csv_output covers the inefficient_node_type branch and CURRENT_GEN_EQUIVALENTS loop"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'test-cluster-inefficient',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.t2.medium',  # Starts with 'cache.t2' for CURRENT_GEN_EQUIVALENTS
                'num_nodes': 1,
                'issues': [{'type': 'inefficient_node_type', 'severity': 'medium'}],  # Inefficient node type issue
                'performance_metrics': {'cache_hit_rate': 95, 'cpu_avg': 50, 'memory_usage_percent': 60},
                'cost_analysis': {'current_monthly_cost': 100, 'rightsizing_savings': 15, 'optimized_monthly_cost': 85},
                'performance_score': 85
            }
        ]

        analyzer.generate_csv_output()

        # Verify to_csv was called
        mock_to_csv.assert_called_once()

    @patch('builtins.print')
    @patch('analyse.boto3.client')
    def test_print_cluster_summary_outputs_correctly(self, mock_boto_client, mock_print):
        """Test print_cluster_summary outputs cluster information"""
        analyzer = ElastiCacheAnalyzer()

        result = {
            'cluster_id': 'test-cluster',
            'engine': 'redis',
            'engine_version': '6.2',
            'node_type': 'cache.t3.medium',
            'num_nodes': 1,
            'performance_score': 85,
            'cost_analysis': {
                'current_monthly_cost': 48.96,
                'reserved_pricing_savings': 10.0,
                'rightsizing_savings': 5.0
            },
            'issues': [
                {'severity': 'high', 'type': 'no_auth_token', 'description': 'Redis cluster lacks AUTH token'},
                {'severity': 'medium', 'type': 'old_engine_version', 'description': 'Old Redis version'}
            ]
        }

        analyzer.print_cluster_summary(result)

        # Verify print was called multiple times
        assert mock_print.call_count > 5

    @patch('builtins.print')
    @patch('analyse.boto3.client')
    def test_print_final_summary_outputs_comprehensive_report(self, mock_boto_client, mock_print):
        """Test print_final_summary outputs comprehensive tabular report"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'test-cluster-1',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.t3.medium',
                'num_nodes': 1,
                'performance_score': 85,
                'performance_metrics': {'cache_hit_rate': 95, 'cpu_avg': 50, 'memory_usage_percent': 60},
                'cost_analysis': {'current_monthly_cost': 48.96, 'reserved_pricing_savings': 10, 'rightsizing_savings': 5},
                'issues': [{'severity': 'high', 'type': 'no_auth_token', 'description': 'Redis cluster lacks AUTH token'}]
            },
            {
                'cluster_id': 'test-cluster-2',
                'engine': 'memcached',
                'engine_version': '1.6.6',
                'node_type': 'cache.m5.large',
                'num_nodes': 2,
                'performance_score': 90,
                'performance_metrics': {'cache_hit_rate': 98, 'cpu_avg': 30, 'memory_usage_percent': 40},
                'cost_analysis': {'current_monthly_cost': 170.0, 'reserved_pricing_savings': 25, 'rightsizing_savings': 0},
                'issues': []
            }
        ]

        analyzer.print_final_summary()

        # Verify print was called many times for the comprehensive report
        assert mock_print.call_count > 20

    @patch('builtins.print')
    @patch('analyse.boto3.client')
    def test_print_final_summary_handles_empty_results(self, mock_boto_client, mock_print):
        """Test print_final_summary handles empty analysis results"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = []  # Empty results

        analyzer.print_final_summary()

        # Verify print was called for the empty case
        assert mock_print.call_count > 5
        # Should contain "No clusters found to analyze."
        mock_print.assert_any_call("No clusters found to analyze.")

    @patch('builtins.print')
    @patch('analyse.boto3.client')
    def test_print_final_summary_handles_clusters_with_no_issues(self, mock_boto_client, mock_print):
        """Test print_final_summary handles clusters with no issues"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'healthy-cluster',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.t3.medium',
                'num_nodes': 1,
                'performance_score': 100,
                'performance_metrics': {'cache_hit_rate': 98, 'cpu_avg': 30, 'memory_usage_percent': 40, 'evictions_per_hour': 0},
                'cost_analysis': {'current_monthly_cost': 48.96, 'reserved_pricing_savings': 0, 'rightsizing_savings': 0, 'optimized_monthly_cost': 48.96},
                'issues': []  # No issues
            }
        ]

        analyzer.print_final_summary()

        # Verify print was called
        assert mock_print.call_count > 20
        # Should contain "No issues detected - all clusters are well optimized!"
        mock_print.assert_any_call("No issues detected - all clusters are well optimized!")
        # Should contain "All clusters are well optimized - no recommendations needed!"
        mock_print.assert_any_call("All clusters are well optimized - no recommendations needed!")

    @patch('builtins.open', new_callable=mock_open)
    @patch('analyse.boto3.client')
    def test_generate_json_output_creates_file(self, mock_boto_client, mock_file):
        """Test generate_json_output creates JSON file correctly"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'test-cluster',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.t3.medium',
                'num_nodes': 1,
                'performance_score': 85,
                'performance_metrics': {'cache_hit_rate': 95},
                'cost_analysis': {'current_monthly_cost': 48.96, 'reserved_pricing_savings': 10, 'rightsizing_savings': 5},
                'issues': []
            }
        ]

        analyzer.generate_json_output()

        # Verify file was opened and json.dump was called
        mock_file.assert_called_once_with('aws_audit_results.json', 'w')

    @patch('builtins.open', new_callable=mock_open)
    @patch('analyse.go.Scatter')
    @patch('analyse.go.Bar')
    @patch('analyse.make_subplots')
    @patch('analyse.boto3.client')
    def test_generate_html_dashboard_creates_file(self, mock_boto_client, mock_make_subplots, mock_go_bar, mock_go_scatter, mock_file):
        """Test generate_html_dashboard creates HTML file correctly"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'test-cluster',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.t3.medium',
                'num_nodes': 1,
                'performance_score': 85,
                'performance_metrics': {'cache_hit_rate': 95, 'cpu_avg': 50, 'memory_usage_percent': 60, 'evictions_per_hour': 10},
                'cost_analysis': {'current_monthly_cost': 48.96, 'optimized_monthly_cost': 40.0},
                'issues': []
            }
        ]

        # Mock the plotly objects
        mock_go_bar.return_value = MagicMock()
        mock_go_scatter.return_value = MagicMock()
        
        # Mock the subplot figure
        mock_fig = MagicMock()
        mock_make_subplots.return_value = mock_fig
        mock_fig.add_trace.return_value = None
        mock_fig.update_layout.return_value = None
        mock_fig.to_html.return_value = '<html></html>'

        analyzer.generate_html_dashboard()

        # Verify file was opened for writing
        mock_file.assert_called_once_with('cache_performance_dashboard.html', 'w')

    @patch('analyse.ElastiCacheAnalyzer.generate_html_dashboard')
    @patch('analyse.ElastiCacheAnalyzer.generate_json_output')
    @patch('analyse.ElastiCacheAnalyzer.generate_csv_output')
    @patch('analyse.boto3.client')
    def test_generate_outputs_calls_all_output_methods(self, mock_boto_client, mock_csv, mock_json, mock_html):
        """Test generate_outputs calls all output generation methods"""
        analyzer = ElastiCacheAnalyzer()

        analyzer.generate_outputs()

        # Verify all output methods were called
        mock_json.assert_called_once()
        mock_html.assert_called_once()
        mock_csv.assert_called_once()

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_connection_exhaustion_risk(self, mock_boto_client):
        """Test analyze_cluster identifies connection exhaustion risk"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-connection-risk',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',  # max_connections = 65000
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 60000, 'network_utilization_percent': 20  # > 80% of 65000
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'connection_exhaustion_risk' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_inefficient_node_type(self, mock_boto_client):
        """Test analyze_cluster identifies inefficient previous generation node types"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-old-gen',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t2.medium',  # Previous generation
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'inefficient_node_type' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_no_cloudwatch_alarms(self, mock_boto_client):
        """Test analyze_cluster identifies clusters without CloudWatch alarms"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-no-alarms',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                with patch.object(analyzer, 'get_cluster_alarms', return_value=[]):  # No alarms
                    result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'no_cloudwatch_alarms' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_unused_parameter_groups(self, mock_boto_client):
        """Test analyze_cluster identifies unused parameter groups"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-unused-params',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                with patch.object(analyzer, 'check_unused_parameter_groups', return_value=['unused-param-group']):
                    result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'unused_parameter_groups' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_excessive_snapshot_retention(self, mock_boto_client):
        """Test analyze_cluster identifies excessive snapshot retention for non-critical clusters"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-excessive-retention',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'ReplicationGroupInfo': {'SnapshotRetentionLimit': 40},  # > 35
            'Tags': {}  # Not critical
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                with patch.object(analyzer, 'is_critical_cluster', return_value=False):
                    result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'excessive_snapshot_retention' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_reserved_node_opportunity(self, mock_boto_client):
        """Test analyze_cluster identifies reserved node opportunities for old clusters"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-old-cluster',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'CacheClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=500),  # Over 1 year old
            'Tags': {}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'reserved_node_opportunity' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_no_automatic_failover(self, mock_boto_client):
        """Test analyze_cluster identifies Redis clusters without automatic failover"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-no-failover',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'ReplicationGroupInfo': {'AutomaticFailover': 'disabled'},  # Disabled
            'Tags': {'Environment': 'production'}  # Production cluster
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={'Environment': 'production'}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'no_automatic_failover' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_cluster_identifies_missing_encryption_partial(self, mock_boto_client):
        """Test analyze_cluster identifies missing encryption when only partial encryption is enabled"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'redis-partial-encryption',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'test-subnet',
            'ReplicationGroupInfo': {
                'AtRestEncryptionEnabled': True,
                'TransitEncryptionEnabled': False  # Missing transit encryption
            },
            'Tags': {'DataClassification': 'sensitive'}
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value={
            'cache_hit_rate': 95, 'evictions_per_hour': 50, 'cpu_avg': 50,
            'memory_usage_percent': 50, 'connections_peak': 100, 'network_utilization_percent': 20
        }):
            with patch.object(analyzer, 'get_cluster_tags', return_value={'DataClassification': 'sensitive'}):
                result = analyzer.analyze_cluster(cluster)

        issue_types = [issue['type'] for issue in result['issues']]
        assert 'missing_encryption' in issue_types

    @patch('analyse.boto3.client')
    def test_get_cluster_metrics_calculates_memcached_hit_rate(self, mock_boto_client):
        """Test get_cluster_metrics calculates cache hit rate correctly for memcached"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        # Mock CloudWatch responses for memcached
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 80.0}]},  # GetHits
            {'Datapoints': [{'Sum': 20.0}]},  # GetMisses
            {'Datapoints': []},  # Evictions
            {'Datapoints': [{'Average': 50.0}]}, # CPU
            {'Datapoints': []},  # Memory (Redis specific)
            {'Datapoints': [{'Maximum': 100}]},  # Connections
            {'Datapoints': []},  # NetworkBytesIn
            {'Datapoints': []}   # NetworkBytesOut
        ]

        analyzer = ElastiCacheAnalyzer()
        metrics = analyzer.get_cluster_metrics('test-memcached-cluster', 'memcached')

        assert metrics['cache_hit_rate'] == 80.0  # (80 / (80 + 20)) * 100

    @patch('analyse.boto3.client')
    def test_get_replication_group_info_returns_group_data(self, mock_boto_client):
        """Test get_replication_group_info returns replication group information"""
        mock_elasticache = MagicMock()
        mock_boto_client.return_value = mock_elasticache

        mock_elasticache.describe_replication_groups.return_value = {
            'ReplicationGroups': [{
                'ReplicationGroupId': 'test-rep-group',
                'MultiAZ': True,
                'AutomaticFailover': 'enabled'
            }]
        }

        analyzer = ElastiCacheAnalyzer()
        result = analyzer.get_replication_group_info('test-rep-group')

        assert result['MultiAZ'] == True
        assert result['AutomaticFailover'] == 'enabled'

    @patch('analyse.boto3.client')
    def test_check_unused_parameter_groups_returns_unused_groups(self, mock_boto_client):
        """Test check_unused_parameter_groups identifies unused parameter groups"""
        mock_elasticache = MagicMock()
        mock_boto_client.return_value = mock_elasticache

        mock_elasticache.describe_cache_parameter_groups.return_value = {
            'CacheParameterGroups': [
                {'CacheParameterGroupName': 'default.redis6.x'},
                {'CacheParameterGroupName': 'custom-redis-params'}
            ]
        }

        analyzer = ElastiCacheAnalyzer()
        analyzer.clusters = [{'CacheParameterGroup': {'CacheParameterGroupName': 'default.redis6.x'}}]  # Only default is used

        unused = analyzer.check_unused_parameter_groups()

        assert 'custom-redis-params' in unused
        assert 'default.redis6.x' not in unused

    @patch('analyse.boto3.client')
    def test_get_cluster_alarms_returns_alarm_list(self, mock_boto_client):
        """Test get_cluster_alarms returns CloudWatch alarms for a cluster"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': [
                {'AlarmName': 'test-cluster-CPU', 'StateValue': 'OK'},
                {'AlarmName': 'test-cluster-Memory', 'StateValue': 'ALARM'}
            ]
        }

        analyzer = ElastiCacheAnalyzer()
        alarms = analyzer.get_cluster_alarms('test-cluster')

        assert len(alarms) == 2
        assert alarms[0]['AlarmName'] == 'test-cluster-CPU'

    @patch('analyse.boto3.client')
    def test_is_production_cluster_identifies_production_clusters(self, mock_boto_client):
        """Test is_production_cluster identifies production clusters by tags or naming"""
        analyzer = ElastiCacheAnalyzer()

        # Test by tag
        assert analyzer.is_production_cluster({'CacheClusterId': 'test', 'Tags': {'Environment': 'production'}}) == True
        assert analyzer.is_production_cluster({'CacheClusterId': 'test', 'Tags': {'Environment': 'dev'}}) == False

        # Test by naming
        assert analyzer.is_production_cluster({'CacheClusterId': 'prod-redis-001', 'Tags': {}}) == True
        assert analyzer.is_production_cluster({'CacheClusterId': 'dev-redis-001', 'Tags': {}}) == False

    @patch('analyse.boto3.client')
    def test_setup_mock_clusters_creates_test_clusters(self, mock_boto_client):
        """Test setup_mock_clusters creates mock clusters for testing"""
        mock_elasticache = MagicMock()
        mock_boto_client.return_value = mock_elasticache

        # Mock the create calls to succeed
        mock_elasticache.create_cache_cluster.return_value = None
        mock_elasticache.exceptions.CacheClusterAlreadyExistsFault = Exception

        analyzer = ElastiCacheAnalyzer()
        analyzer.setup_mock_clusters()

        # Verify create_cache_cluster was called
        assert mock_elasticache.create_cache_cluster.call_count == 3  # Redis + Memcached + old Redis

    @patch('analyse.ElastiCacheAnalyzer.generate_outputs')
    @patch('analyse.ElastiCacheAnalyzer.print_final_summary')
    @patch('analyse.ElastiCacheAnalyzer.get_all_clusters')
    @patch('analyse.ElastiCacheAnalyzer.analyze_cluster')
    @patch('analyse.ElastiCacheAnalyzer.setup_mock_clusters')
    @patch('analyse.boto3.client')
    def test_run_analysis_sets_up_mock_clusters_when_enabled(self, mock_boto_client, mock_setup, mock_analyze, mock_get_all, mock_print, mock_generate):
        """Test run_analysis sets up mock clusters when explicitly enabled"""
        analyzer = ElastiCacheAnalyzer(use_mock_data=True)

        mock_get_all.return_value = [{'CacheClusterId': 'test-cluster'}]
        mock_analyze.return_value = {
            'cluster_id': 'test', 
            'performance_score': 85, 
            'issues': [], 
            'cost_analysis': {
                'current_monthly_cost': 100,
                'reserved_pricing_savings': 10,
                'rightsizing_savings': 5
            },
            'engine': 'redis',
            'engine_version': '6.2',
            'node_type': 'cache.t3.medium',
            'num_nodes': 1
        }

        analyzer.run_analysis()

        # Verify setup_mock_clusters was called in test mode
        mock_setup.assert_called_once()

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_analysis_processes_all_clusters(self, mock_boto_client):
        """Test run_analysis processes all clusters and generates results"""
        analyzer = ElastiCacheAnalyzer()

        mock_clusters = [
            {'CacheClusterId': 'cluster-1', 'Engine': 'redis'},
            {'CacheClusterId': 'cluster-2', 'Engine': 'memcached'}
        ]

        with patch.object(analyzer, 'get_all_clusters', return_value=mock_clusters):
            with patch.object(analyzer, 'analyze_cluster', return_value={'cluster_id': 'test', 'engine': 'redis', 'engine_version': '6.2', 'node_type': 'cache.t3.medium', 'num_nodes': 1, 'performance_score': 85, 'cost_analysis': {'current_monthly_cost': 100, 'reserved_pricing_savings': 0, 'rightsizing_savings': 0}, 'issues': []}):
                with patch.object(analyzer, 'generate_outputs'):
                    with patch.object(analyzer, 'print_final_summary'):
                        analyzer.run_analysis()

        assert len(analyzer.analysis_results) == 2

    @patch('analyse.boto3.client')
    def test_get_all_clusters_filters_and_returns_clusters(self, mock_boto_client):
        """Test get_all_clusters filters and returns valid clusters"""
        mock_elasticache = MagicMock()
        mock_boto_client.return_value = mock_elasticache

        mock_paginator = MagicMock()
        mock_elasticache.get_paginator.return_value = mock_paginator

        mock_paginator.paginate.return_value = [
            {
                'CacheClusters': [
                    {
                        'CacheClusterId': 'prod-redis-001',
                        'Engine': 'redis',
                        'CacheClusterStatus': 'available'
                    },
                    {
                        'CacheClusterId': 'test-redis-001',
                        'Engine': 'redis',
                        'CacheClusterStatus': 'available'
                    }
                ]
            }
        ]

        analyzer = ElastiCacheAnalyzer()

        with patch.object(analyzer, 'should_exclude_cluster', side_effect=[False, True]):
            clusters = analyzer.get_all_clusters()

        assert len(clusters) == 1
        assert clusters[0]['CacheClusterId'] == 'prod-redis-001'

    # =========================================================================
    # ERROR HANDLING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_cluster_handles_missing_metrics_gracefully(self, mock_boto_client):
        """Test analyze_cluster handles missing metrics gracefully"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'test-cluster',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'Tags': {}
        }

        # Mock get_cluster_metrics to raise exception
        with patch.object(analyzer, 'get_cluster_metrics', side_effect=Exception("Metrics unavailable")):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        # Should still return a result structure
        assert 'cluster_id' in result
        assert 'issues' in result
        assert isinstance(result['issues'], list)

    @patch('analyse.boto3.client')
    def test_run_analysis_handles_empty_cluster_list(self, mock_boto_client):
        """Test run_analysis handles empty cluster list gracefully"""
        analyzer = ElastiCacheAnalyzer()

        with patch.object(analyzer, 'get_all_clusters', return_value=[]):
            with patch.object(analyzer, 'generate_outputs'):
                with patch.object(analyzer, 'print_final_summary'):
                    analyzer.run_analysis()

        assert analyzer.analysis_results == []

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_main_function_executes_successfully(self, mock_print, mock_boto_client):
        """Test main() function runs without errors and returns 0"""
        from analyse import main

        with patch('analyse.ElastiCacheAnalyzer') as MockAnalyzer:
            mock_instance = MockAnalyzer.return_value
            mock_instance.run_analysis.return_value = None

            result = main()

            assert result == 0
            mock_instance.run_analysis.assert_called_once()

    @patch('analyse.boto3.client')
    def test_main_function_returns_error_code_on_exception(self, mock_boto_client):
        """Test main() function handles exceptions and returns error code 1"""
        from analyse import main

        with patch('analyse.ElastiCacheAnalyzer') as MockAnalyzer:
            MockAnalyzer.side_effect = Exception("Test error")

            result = main()

            assert result == 1

    @patch('analyse.boto3.client')
    def test_calculate_cost_analysis_calculates_inefficient_node_type_savings(self, mock_boto_client):
        """Test calculate_cost_analysis calculates savings for inefficient node type"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {
            'CacheClusterId': 'test-cluster',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=400)
        }

        issues = [{'type': 'inefficient_node_type'}]  # Inefficient node type issue
        metrics = {'cache_hit_rate': 95}

        result = analyzer.calculate_cost_analysis(cluster, issues, metrics)

        # Should have rightsizing savings of 15% for inefficient node type
        expected_savings = (0.068 * 1 * 24 * 30) * 0.15  # 15% of monthly cost
        assert abs(result['rightsizing_savings'] - expected_savings) < 0.01

    @patch('analyse.boto3.client')
    def test_calculate_performance_score_clamps_score_to_valid_range(self, mock_boto_client):
        """Test calculate_performance_score clamps score between 0 and 100"""
        analyzer = ElastiCacheAnalyzer()

        cluster = {'CacheClusterId': 'test-cluster'}
        
        # Test score clamping to 0 (very bad cluster)
        issues = [
            {'severity': 'critical'} for _ in range(10)  # 10 critical issues = 200 points deduction
        ]
        metrics = {'cache_hit_rate': 50, 'evictions_per_hour': 2000, 'memory_usage_percent': 100}  # All bad metrics
        
        score = analyzer.calculate_performance_score(cluster, issues, metrics)
        
        # Should be clamped to 0
        assert score == 0

        # Test score clamping to 100 (perfect cluster)
        issues = []
        metrics = {'cache_hit_rate': 100, 'evictions_per_hour': 0, 'memory_usage_percent': 0}
        
        score = analyzer.calculate_performance_score(cluster, issues, metrics)
        
        # Should be clamped to 100
        assert score == 100

    # =========================================================================
    # ADDITIONAL COVERAGE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_analysis_skips_mock_setup_when_not_in_test_mode(self, mock_boto_client):
        """Ensure run_analysis takes the non-test-mode branch"""
        analyzer = ElastiCacheAnalyzer()

        with patch.object(analyzer, 'setup_mock_clusters') as mock_setup:
            with patch.object(analyzer, 'get_all_clusters', return_value=[]):
                with patch.object(analyzer, 'generate_outputs') as mock_outputs:
                    with patch.object(analyzer, 'print_final_summary'):
                        analyzer.run_analysis()

        mock_setup.assert_not_called()
        mock_outputs.assert_called_once()

    @patch('analyse.boto3.client')
    def test_get_all_clusters_excludes_tagged_clusters(self, mock_boto_client):
        """Clusters with ExcludeFromAnalysis tag should be skipped"""
        mock_elasticache = MagicMock()
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'CacheClusters': [{
                'CacheClusterId': 'prod-redis-001',
                'Engine': 'redis',
                'CacheClusterStatus': 'available'
            }]
        }]
        mock_elasticache.get_paginator.return_value = mock_paginator
        mock_boto_client.return_value = mock_elasticache

        analyzer = ElastiCacheAnalyzer()
        with patch.object(analyzer, 'get_cluster_tags', return_value={'ExcludeFromAnalysis': 'true'}):
            clusters = analyzer.get_all_clusters()

        assert clusters == []

@patch('analyse.boto3.client')
def test_should_exclude_cluster_by_age_when_not_in_test_mode(mock_boto_client):
    """Age-based exclusion should run when not in mock mode"""
    if 'AWS_ENDPOINT_URL' in os.environ:
        del os.environ['AWS_ENDPOINT_URL']
    with patch('analyse.datetime') as mock_datetime:
        mock_now = datetime(2023, 10, 1, 12, 0, 0, tzinfo=timezone.utc)
        mock_datetime.now.return_value = mock_now
        analyzer = ElastiCacheAnalyzer()
        recent_time = mock_now - timedelta(days=1)
        cluster = {'CacheClusterId': 'prod-redis-001', 'CacheClusterCreateTime': recent_time}
        assert analyzer.should_exclude_cluster(cluster) is True
    def test_get_cluster_tags_handles_generic_exception(self, mock_boto_client):
        """list_tags_for_resource errors should return an empty tag dict"""
        mock_elasticache = MagicMock()
        mock_elasticache.list_tags_for_resource.side_effect = Exception("boom")
        mock_boto_client.return_value = mock_elasticache

        analyzer = ElastiCacheAnalyzer()
        assert analyzer.get_cluster_tags('any') == {}

    @patch('analyse.boto3.client')
    def test_get_replication_group_info_handles_exception(self, mock_boto_client):
        """describe_replication_groups errors should return an empty dict"""
        mock_elasticache = MagicMock()
        mock_elasticache.describe_replication_groups.side_effect = Exception("fail")
        mock_boto_client.return_value = mock_elasticache

        analyzer = ElastiCacheAnalyzer()
        assert analyzer.get_replication_group_info('rg-1') == {}

    @patch('analyse.boto3.client')
    def test_analyze_cluster_flags_underutilized_cache(self, mock_boto_client):
        """Underutilized cache issue should be detected"""
        analyzer = ElastiCacheAnalyzer()
        cluster = {
            'CacheClusterId': 'prod-underutilized',
            'Engine': 'redis',
            'EngineVersion': '6.2',
            'CacheNodeType': 'cache.t3.medium',
            'NumCacheNodes': 1,
            'CacheSubnetGroupName': 'prod-subnet',
            'Tags': {}
        }

        metrics = {
            'cache_hit_rate': 50,
            'evictions_per_hour': 2000,
            'cpu_avg': 50,
            'memory_usage_percent': 40,
            'connections_peak': 100,
            'network_utilization_percent': 50
        }

        with patch.object(analyzer, 'get_cluster_metrics', return_value=metrics):
            with patch.object(analyzer, 'get_cluster_tags', return_value={}):
                result = analyzer.analyze_cluster(cluster)

        assert any(issue['type'] == 'underutilized_cache' for issue in result['issues'])

    @patch('analyse.boto3.client')
    def test_get_cluster_metrics_computes_network_utilization_for_memcached(self, mock_boto_client):
        """Memcached metric path should calculate network utilization"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 120.0}]},     # GetHits
            {'Datapoints': [{'Sum': 60.0}]},      # GetMisses
            {'Datapoints': [{'Sum': 3600.0}]},    # Evictions
            {'Datapoints': [{'Average': 40.0}]},  # CPU
            {'Datapoints': [{'Average': 0.0}]},   # BytesUsedForCache (unused for percent)
            {'Datapoints': [{'Maximum': 500.0}]}, # CurrConnections
            {'Datapoints': [{'Average': 7200.0}]},# NetworkBytesIn
            {'Datapoints': [{'Average': 7200.0}]} # NetworkBytesOut
        ]

        analyzer = ElastiCacheAnalyzer()
        analyzer.clusters = [{'CacheClusterId': 'memcached-1', 'CacheNodeType': 'cache.m5.large'}]

        metrics = analyzer.get_cluster_metrics('memcached-1', 'memcached')

        assert metrics['cache_hit_rate'] == pytest.approx(66.666, rel=1e-3)
        assert metrics['network_utilization_percent'] > 0
        assert metrics['memory_usage_percent'] == 75

    @patch('analyse.boto3.client')
    def test_get_cluster_alarms_handles_exception(self, mock_boto_client):
        """CloudWatch failures should return an empty alarm list"""
        mock_cloudwatch = MagicMock()
        mock_cloudwatch.describe_alarms.side_effect = Exception("fail")
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = ElastiCacheAnalyzer()
        assert analyzer.get_cluster_alarms('cluster') == []

    @patch('analyse.boto3.client')
    def test_check_unused_parameter_groups_handles_exception(self, mock_boto_client):
        """Parameter group lookup errors should return an empty list"""
        mock_elasticache = MagicMock()
        mock_elasticache.describe_cache_parameter_groups.side_effect = Exception("fail")
        mock_boto_client.return_value = mock_elasticache

        analyzer = ElastiCacheAnalyzer()
        assert analyzer.check_unused_parameter_groups() == []

    @patch('analyse.pd.DataFrame.to_csv')
    @patch('analyse.boto3.client')
    def test_generate_csv_output_handles_xlarge_and_upsize_paths(self, mock_boto_client, mock_to_csv):
        """Cover CSV recommendation branches for xlarge downsize and large upsize"""
        analyzer = ElastiCacheAnalyzer()
        analyzer.analysis_results = [
            {
                'cluster_id': 'over-provisioned-xlarge',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.m5.xlarge',
                'num_nodes': 1,
                'issues': [{'type': 'over_provisioned', 'severity': 'medium'}],
                'performance_metrics': {'cache_hit_rate': 95, 'cpu_avg': 10, 'memory_usage_percent': 20},
                'cost_analysis': {'current_monthly_cost': 200, 'rightsizing_savings': 60, 'optimized_monthly_cost': 140},
                'performance_score': 80
            },
            {
                'cluster_id': 'memory-pressure-large',
                'engine': 'redis',
                'engine_version': '6.2',
                'node_type': 'cache.m5.large',
                'num_nodes': 1,
                'issues': [{'type': 'memory_pressure', 'severity': 'high'}],
                'performance_metrics': {'cache_hit_rate': 80, 'cpu_avg': 60, 'memory_usage_percent': 95},
                'cost_analysis': {'current_monthly_cost': 150, 'rightsizing_savings': 0, 'optimized_monthly_cost': 150},
                'performance_score': 70
            }
        ]

        analyzer.generate_csv_output()

        mock_to_csv.assert_called_once()
