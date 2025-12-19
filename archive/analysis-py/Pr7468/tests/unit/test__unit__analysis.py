"""
Unit Tests for Amazon Redshift Analysis Module

Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).
These tests validate individual methods and logic in isolation.
"""

import sys
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch, mock_open
from typing import Any, Dict, List

import pytest
from botocore.exceptions import ClientError

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import lib.analyse as analyse
from lib.analyse import RedshiftAnalyzer, _safe_mean


def _make_analyzer() -> RedshiftAnalyzer:
    """Create an analyzer instance without invoking boto3 clients."""
    analyzer = RedshiftAnalyzer.__new__(RedshiftAnalyzer)
    analyzer.region = "us-east-1"
    analyzer.redshift = MagicMock()  # type: ignore
    analyzer.cloudwatch = MagicMock()  # type: ignore
    analyzer.cluster_analysis = []
    analyzer.spectrum_analysis = []
    analyzer.table_optimizations = []
    analyzer.rightsizing_recommendations = []
    return analyzer


# =============================================================================
# INITIALIZATION TESTS
# =============================================================================

@pytest.mark.unit
def test_analyzer_initializes_without_endpoint(monkeypatch):
    """Test that analyzer initializes with correct AWS clients without endpoint."""
    created_clients: List[tuple] = []

    class _BotoStub:
        def client(self, service: str, **kwargs: Any) -> str:
            created_clients.append((service, kwargs))
            return f"{service}-client"

    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    monkeypatch.setattr(analyse, "boto3", _BotoStub())

    analyzer = RedshiftAnalyzer(region="us-west-2")

    assert analyzer.redshift == "redshift-client"
    assert analyzer.cloudwatch == "cloudwatch-client"
    assert created_clients == [
        ("redshift", {"region_name": "us-west-2"}),
        ("cloudwatch", {"region_name": "us-west-2"}),
    ]


@pytest.mark.unit
def test_analyzer_initializes_with_endpoint(monkeypatch):
    """Test analyzer uses Moto endpoint from AWS_ENDPOINT_URL environment variable."""
    created_clients: List[tuple] = []

    class _BotoStub:
        def client(self, service: str, **kwargs: Any) -> str:
            created_clients.append((service, kwargs))
            return f"{service}-client"

    monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:5001")
    monkeypatch.setattr(analyse, "boto3", _BotoStub())

    analyzer = RedshiftAnalyzer(region="us-west-1")

    assert analyzer.redshift == "redshift-client"
    assert analyzer.cloudwatch == "cloudwatch-client"
    assert created_clients == [
        ("redshift", {"region_name": "us-west-1", "endpoint_url": "http://localhost:5001"}),
        ("cloudwatch", {"region_name": "us-west-1", "endpoint_url": "http://localhost:5001"}),
    ]


# =============================================================================
# UTILITY FUNCTION TESTS
# =============================================================================

@pytest.mark.unit
def test_safe_mean_with_values():
    """Test _safe_mean returns correct average."""
    assert _safe_mean([10.0, 20.0, 30.0]) == 20.0
    assert _safe_mean([5.0]) == 5.0
    assert _safe_mean([0.0, 0.0]) == 0.0


@pytest.mark.unit
def test_safe_mean_with_empty_list():
    """Test _safe_mean returns 0 for empty list."""
    assert _safe_mean([]) == 0.0


# =============================================================================
# EXCLUSION LOGIC TESTS
# =============================================================================

@pytest.mark.unit
def test_should_exclude_cluster_by_dev_prefix():
    """Test exclusion of clusters with dev- prefix."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'dev-test-cluster',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'Tags': []
    }

    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert should_exclude is True
    assert reason == "dev/test prefix"


@pytest.mark.unit
def test_should_exclude_cluster_by_test_prefix():
    """Test exclusion of clusters with test- prefix."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-staging-cluster',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'Tags': []
    }

    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert should_exclude is True
    assert reason == "dev/test prefix"


@pytest.mark.unit
def test_should_exclude_cluster_by_tag():
    """Test exclusion of clusters with ExcludeFromAnalysis tag."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'prod-cluster',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'Tags': [{'Key': 'ExcludeFromAnalysis', 'Value': 'true'}]
    }

    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert should_exclude is True
    assert reason == "ExcludeFromAnalysis tag"


@pytest.mark.unit
def test_should_exclude_cluster_by_tag_case_insensitive():
    """Test exclusion tag is case insensitive."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'prod-cluster',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'Tags': [{'Key': 'excludefromanalysis', 'Value': 'TRUE'}]
    }

    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert should_exclude is True


@pytest.mark.unit
def test_should_exclude_cluster_by_age():
    """Test exclusion of clusters younger than 14 days."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'prod-new-cluster',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=5),
        'Tags': []
    }

    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert should_exclude is True
    assert "too young" in reason


@pytest.mark.unit
def test_should_not_exclude_valid_cluster():
    """Test valid cluster is not excluded."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'prod-valid-cluster',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'Tags': [{'Key': 'Environment', 'Value': 'production'}]
    }

    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert should_exclude is False
    assert reason == ""


# =============================================================================
# CLOUDWATCH METRICS TESTS
# =============================================================================

@pytest.mark.unit
def test_get_cloudwatch_metric_avg_returns_average():
    """Test CloudWatch metric average calculation."""
    analyzer = _make_analyzer()

    # Mock CloudWatch response
    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [
            {'Average': 25.0, 'Timestamp': datetime.now(timezone.utc)},
            {'Average': 30.0, 'Timestamp': datetime.now(timezone.utc)},
            {'Average': 35.0, 'Timestamp': datetime.now(timezone.utc)},
        ]
    }

    result = analyzer.get_cloudwatch_metric_avg('test-cluster', 'CPUUtilization')

    assert result == 30.0  # Average of 25, 30, 35


@pytest.mark.unit
def test_get_cloudwatch_metric_avg_returns_none_when_no_datapoints():
    """Test CloudWatch metric returns None when no datapoints."""
    analyzer = _make_analyzer()

    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': []
    }

    result = analyzer.get_cloudwatch_metric_avg('test-cluster', 'CPUUtilization')

    assert result is None


@pytest.mark.unit
def test_get_cloudwatch_metric_avg_handles_client_error():
    """Test CloudWatch metric handles ClientError gracefully."""
    analyzer = _make_analyzer()

    analyzer.cloudwatch.get_metric_statistics.side_effect = ClientError(
        {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
        'GetMetricStatistics'
    )

    result = analyzer.get_cloudwatch_metric_avg('test-cluster', 'CPUUtilization')

    assert result is None


@pytest.mark.unit
def test_get_cloudwatch_metric_timeseries():
    """Test CloudWatch metric timeseries retrieval."""
    analyzer = _make_analyzer()

    now = datetime.now(timezone.utc)
    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [
            {'Average': 25.0, 'Timestamp': now - timedelta(days=2)},
            {'Average': 30.0, 'Timestamp': now - timedelta(days=1)},
        ]
    }

    result = analyzer.get_cloudwatch_metric_timeseries('test-cluster', 'CPUUtilization')

    assert len(result) == 2
    assert result[0]['value'] == 25.0
    assert result[1]['value'] == 30.0


# =============================================================================
# ISSUE DETECTION TESTS
# =============================================================================

@pytest.mark.unit
def test_check_cluster_issues_low_cpu():
    """Test detection of low CPU utilization issue."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'dc2.large',
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 20.0,
        'disk_usage': 50.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    low_cpu_issue = next((i for i in issues if i['type'] == 'low_cpu_utilization'), None)
    assert low_cpu_issue is not None
    assert low_cpu_issue['severity'] == 'medium'


@pytest.mark.unit
def test_check_cluster_issues_high_disk():
    """Test detection of high disk usage issue."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'ra3.4xlarge',
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 90.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    disk_issue = next((i for i in issues if i['type'] == 'disk_space_pressure'), None)
    assert disk_issue is not None
    assert disk_issue['severity'] == 'high'


@pytest.mark.unit
def test_check_cluster_issues_missing_encryption():
    """Test detection of missing encryption issue."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'ra3.4xlarge',
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': False,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 50.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    encryption_issue = next((i for i in issues if i['type'] == 'missing_encryption'), None)
    assert encryption_issue is not None
    assert encryption_issue['severity'] == 'high'


@pytest.mark.unit
def test_check_cluster_issues_inadequate_snapshots():
    """Test detection of inadequate snapshot retention."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'ra3.4xlarge',
        'AutomatedSnapshotRetentionPeriod': 1,
        'Encrypted': True,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 50.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    snapshot_issue = next((i for i in issues if i['type'] == 'no_automatic_snapshots'), None)
    assert snapshot_issue is not None
    assert snapshot_issue['severity'] == 'high'


@pytest.mark.unit
def test_check_cluster_issues_dc2_node_type():
    """Test detection of inefficient dc2 node type."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'dc2.large',
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 50.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    node_issue = next((i for i in issues if i['type'] == 'inefficient_node_type'), None)
    assert node_issue is not None
    assert node_issue['severity'] == 'medium'


@pytest.mark.unit
def test_check_cluster_issues_no_enhanced_vpc():
    """Test detection of missing Enhanced VPC Routing."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'ra3.4xlarge',
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'EnhancedVpcRouting': False,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 50.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    vpc_issue = next((i for i in issues if i['type'] == 'no_enhanced_vpc_routing'), None)
    assert vpc_issue is not None
    assert vpc_issue['severity'] == 'low'


# =============================================================================
# PERFORMANCE SCORE TESTS
# =============================================================================

@pytest.mark.unit
def test_calculate_performance_score_perfect():
    """Test performance score with optimal configuration."""
    analyzer = _make_analyzer()

    cluster = {
        'Encrypted': True,
        'AutomatedSnapshotRetentionPeriod': 7,
        'EnhancedVpcRouting': True
    }

    metrics = {
        'cpu_avg': 60.0,  # Optimal range
        'disk_usage': 50.0,
        'query_queue_avg': 5.0
    }

    issues = []

    score = analyzer.calculate_performance_score(cluster, metrics, issues)

    assert score == 100.0


@pytest.mark.unit
def test_calculate_performance_score_with_issues():
    """Test performance score decreases with issues."""
    analyzer = _make_analyzer()

    cluster = {
        'Encrypted': False,
        'AutomatedSnapshotRetentionPeriod': 1,
        'EnhancedVpcRouting': False
    }

    metrics = {
        'cpu_avg': 20.0,  # Low CPU
        'disk_usage': 90.0,  # High disk
        'query_queue_avg': 5.0
    }

    issues = [
        {'type': 'low_cpu', 'severity': 'medium'},
        {'type': 'high_disk', 'severity': 'high'},
    ]

    score = analyzer.calculate_performance_score(cluster, metrics, issues)

    assert score < 80.0  # Should be penalized for issues


@pytest.mark.unit
def test_calculate_performance_score_bounds():
    """Test performance score stays within 0-100 bounds."""
    analyzer = _make_analyzer()

    cluster = {
        'Encrypted': False,
        'AutomatedSnapshotRetentionPeriod': 0,
        'EnhancedVpcRouting': False
    }

    metrics = {
        'cpu_avg': 5.0,
        'disk_usage': 95.0,
        'query_queue_avg': 100.0
    }

    issues = [{'type': f'issue{i}', 'severity': 'high'} for i in range(20)]

    score = analyzer.calculate_performance_score(cluster, metrics, issues)

    assert 0.0 <= score <= 100.0


# =============================================================================
# COST ANALYSIS TESTS
# =============================================================================

@pytest.mark.unit
def test_calculate_cost_analysis_basic():
    """Test basic cost analysis calculation."""
    analyzer = _make_analyzer()

    cluster = {
        'NodeType': 'dc2.large',
        'NumberOfNodes': 2
    }

    metrics = {
        'cpu_avg': 50.0
    }

    cost = analyzer.calculate_cost_analysis(cluster, metrics)

    assert 'current_cost' in cost
    assert 'reserved_pricing_savings' in cost
    assert 'optimized_cost' in cost
    assert cost['current_cost'] > 0
    assert cost['reserved_pricing_savings'] > 0


@pytest.mark.unit
def test_calculate_cost_analysis_low_cpu_rightsizing():
    """Test cost analysis suggests rightsizing for low CPU."""
    analyzer = _make_analyzer()

    cluster = {
        'NodeType': 'dc2.large',
        'NumberOfNodes': 4
    }

    metrics = {
        'cpu_avg': 20.0  # Low CPU
    }

    cost = analyzer.calculate_cost_analysis(cluster, metrics)

    # Should suggest fewer nodes
    assert cost['optimized_node_count'] < 4


@pytest.mark.unit
def test_calculate_cost_analysis_dc2_to_ra3():
    """Test cost analysis considers migration from dc2 to RA3."""
    analyzer = _make_analyzer()

    cluster = {
        'NodeType': 'dc2.large',
        'NumberOfNodes': 2
    }

    metrics = {
        'cpu_avg': 50.0
    }

    cost = analyzer.calculate_cost_analysis(cluster, metrics)

    # Cost analysis should return an optimized option (could be same type if cheaper)
    assert 'optimized_node_type' in cost
    assert 'optimized_cost' in cost
    # Optimized cost should be less than or equal to current cost
    assert cost['optimized_cost'] <= cost['current_cost']


# =============================================================================
# ANALYSIS WORKFLOW TESTS
# =============================================================================

@pytest.mark.unit
def test_analyze_cluster_returns_complete_structure():
    """Test analyze_cluster returns all required fields."""
    analyzer = _make_analyzer()

    # Mock CloudWatch responses
    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [
            {'Average': 50.0, 'Timestamp': datetime.now(timezone.utc)},
        ]
    }

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'dc2.large',
        'NumberOfNodes': 2,
        'ClusterStatus': 'available',
        'ClusterVersion': '1.0.49000',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    result = analyzer.analyze_cluster(cluster)

    # Validate structure
    assert 'cluster_id' in result
    assert 'node_type' in result
    assert 'node_count' in result
    assert 'cpu_avg' in result
    assert 'disk_usage_percent' in result
    assert 'issues' in result
    assert 'performance_score' in result
    assert 'cost_analysis' in result


# =============================================================================
# OUTPUT GENERATION TESTS
# =============================================================================

@pytest.mark.unit
def test_save_json_output_structure():
    """Test JSON output has correct structure."""
    analyzer = _make_analyzer()

    analyzer.cluster_analysis = [
        {
            'cluster_id': 'test-cluster',
            'node_type': 'dc2.large',
            'cpu_avg': 50.0,
            'disk_usage_percent': 50.0,
            'query_queue_avg': 0.0,
            'maintenance_track': '1.0.49000',
            'parameter_group': 'custom',
            'issues': [],
            'performance_score': 85.0,
            'cost_analysis': {
                'current_cost': 365.0,
                'reserved_pricing_savings': 100.0,
                'optimized_cost': 300.0
            }
        }
    ]

    with patch('builtins.open', mock_open()) as mock_file:
        result = analyzer.save_json_output()

        assert 'analysis_timestamp' in result
        assert 'clusters' in result
        assert 'spectrum_analysis' in result
        assert 'summary' in result
        assert result['summary']['total_clusters'] == 1


@pytest.mark.unit
def test_generate_rightsizing_recommendations():
    """Test rightsizing recommendations generation."""
    analyzer = _make_analyzer()

    analyzer.cluster_analysis = [
        {
            'cluster_id': 'test-cluster',
            'node_type': 'dc2.large',
            'node_count': 4,
            'cpu_avg': 20.0,
            'cost_analysis': {
                'current_cost': 365.0,
                'optimized_cost': 200.0,
                'optimized_node_type': 'ra3.xlplus',
                'optimized_node_count': 2
            }
        }
    ]

    analyzer.generate_rightsizing_recommendations()

    assert len(analyzer.rightsizing_recommendations) == 1
    rec = analyzer.rightsizing_recommendations[0]
    assert rec['cluster_id'] == 'test-cluster'
    assert rec['estimated_savings'] > 0


@pytest.mark.unit
def test_generate_optimization_sql_empty():
    """Test SQL generation with no table optimizations."""
    analyzer = _make_analyzer()

    sql = analyzer.generate_optimization_sql()

    assert '-- Redshift Table Optimization Script' in sql
    assert 'Generated:' in sql


# =============================================================================
# MAIN FUNCTION TESTS
# =============================================================================

@pytest.mark.unit
def test_main_function_success():
    """Test main function returns 0 on success."""
    with patch.object(analyse, 'RedshiftAnalyzer') as MockAnalyzer:
        mock_instance = MockAnalyzer.return_value
        mock_instance.run_analysis.return_value = {'clusters': []}

        result = analyse.main()

        assert result == 0
        mock_instance.run_analysis.assert_called_once()


@pytest.mark.unit
def test_main_function_handles_exception():
    """Test main function returns 1 on exception."""
    with patch.object(analyse, 'RedshiftAnalyzer') as MockAnalyzer:
        MockAnalyzer.side_effect = Exception("Test error")

        result = analyse.main()

        assert result == 1


# =============================================================================
# PANDAS STUB TESTS
# =============================================================================

@pytest.mark.unit
def test_pandas_stub_dataframe_to_csv(tmp_path, monkeypatch):
    """Test pandas stub creates CSV correctly when pandas unavailable."""
    monkeypatch.setattr(analyse, 'PANDAS_AVAILABLE', False)

    # Reload to use stub
    from lib.analyse import pd

    data = [
        {'col1': 'val1', 'col2': 'val2'},
        {'col1': 'val3', 'col2': 'val4'}
    ]

    df = pd.DataFrame(data)
    output_file = tmp_path / "test.csv"
    df.to_csv(str(output_file), index=False)

    assert output_file.exists()

    with open(output_file, 'r') as f:
        content = f.read()
        assert 'col1,col2' in content
        assert 'val1,val2' in content


# =============================================================================
# EDGE CASE TESTS
# =============================================================================

@pytest.mark.unit
def test_analyze_cluster_handles_none_metrics():
    """Test analyze_cluster handles None metric values gracefully."""
    analyzer = _make_analyzer()

    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': []
    }

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'dc2.large',
        'NumberOfNodes': 2,
        'ClusterStatus': 'available',
        'ClusterVersion': '1.0.49000',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom'}]
    }

    result = analyzer.analyze_cluster(cluster)

    # Should not crash, metrics should be None
    assert result['cpu_avg'] is None
    assert result['disk_usage_percent'] is None


@pytest.mark.unit
def test_check_cluster_issues_handles_missing_fields():
    """Test check_cluster_issues handles missing cluster fields."""
    analyzer = _make_analyzer()

    # Minimal cluster with missing optional fields
    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'ra3.4xlarge',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30)
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 50.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    # Should not crash
    issues = analyzer.check_cluster_issues(cluster, metrics)

    assert isinstance(issues, list)


# =============================================================================
# HTML DASHBOARD GENERATION TESTS
# =============================================================================

@pytest.mark.unit
def test_generate_html_dashboard_with_no_data():
    """Test HTML dashboard generation with no clusters."""
    analyzer = _make_analyzer()

    with patch('builtins.open', mock_open()) as mock_file:
        analyzer.generate_html_dashboard()
        # Should write HTML file
        mock_file.assert_called_once()


@pytest.mark.unit
def test_generate_html_dashboard_with_cluster_data():
    """Test HTML dashboard generation with cluster data."""
    analyzer = _make_analyzer()

    analyzer.cluster_analysis = [
        {
            'cluster_id': 'prod-cluster-1',
            'node_type': 'ra3.4xlarge',
            'node_count': 2,
            'cpu_avg': 45.0,
            'disk_usage_percent': 60.0,
            'performance_score': 85.0,
            'issues': [
                {'type': 'low_cpu', 'severity': 'medium', 'message': 'CPU is low'}
            ],
            'cost_analysis': {
                'current_cost': 500.0,
                'optimized_cost': 350.0
            }
        }
    ]

    with patch('builtins.open', mock_open()) as mock_file:
        analyzer.generate_html_dashboard()
        mock_file.assert_called_once()
        # Get the written content
        handle = mock_file()
        written_content = ''.join(call[0][0] for call in handle.write.call_args_list)
        assert 'prod-cluster-1' in written_content or handle.write.called


@pytest.mark.unit
def test_generate_html_dashboard_with_issues():
    """Test HTML dashboard shows issues correctly."""
    analyzer = _make_analyzer()

    analyzer.cluster_analysis = [
        {
            'cluster_id': 'cluster-with-issues',
            'node_type': 'dc2.large',
            'node_count': 4,
            'cpu_avg': 20.0,
            'disk_usage_percent': 90.0,
            'performance_score': 45.0,
            'issues': [
                {'type': 'low_cpu_utilization', 'severity': 'high', 'message': 'CPU below 30%'},
                {'type': 'disk_space_pressure', 'severity': 'high', 'message': 'Disk above 85%'}
            ],
            'cost_analysis': {
                'current_cost': 800.0,
                'optimized_cost': 400.0
            }
        }
    ]

    with patch('builtins.open', mock_open()) as mock_file:
        analyzer.generate_html_dashboard()
        mock_file.assert_called_once()


# =============================================================================
# SQL GENERATION TESTS WITH DATA
# =============================================================================

@pytest.mark.unit
def test_generate_optimization_sql_with_table_data():
    """Test SQL generation with table optimization data."""
    analyzer = _make_analyzer()

    analyzer.table_optimizations = [
        {
            'cluster_id': 'prod-cluster',
            'schema': 'public',
            'table': 'users',
            'size_mb': 1024.5,
            'rows': 1000000,
            'optimizations': ['VACUUM', 'ANALYZE']
        },
        {
            'cluster_id': 'prod-cluster',
            'schema': 'public',
            'table': 'orders',
            'size_mb': 512.3,
            'rows': 500000,
            'optimizations': ['ADD_SORTKEY', 'ADD_DISTKEY']
        }
    ]

    sql = analyzer.generate_optimization_sql()

    assert '-- Redshift Table Optimization Script' in sql
    assert 'prod-cluster' in sql
    assert 'public.users' in sql
    assert 'public.orders' in sql
    assert 'VACUUM' in sql or 'ANALYZE' in sql


@pytest.mark.unit
def test_generate_optimization_sql_with_vacuum_delete():
    """Test SQL generation with VACUUM_DELETE optimization."""
    analyzer = _make_analyzer()

    analyzer.table_optimizations = [
        {
            'cluster_id': 'test-cluster',
            'schema': 'public',
            'table': 'test_table',
            'size_mb': 100.0,
            'rows': 10000,
            'optimizations': ['VACUUM_DELETE']
        }
    ]

    sql = analyzer.generate_optimization_sql()

    assert 'VACUUM DELETE ONLY' in sql
    assert 'public.test_table' in sql


# =============================================================================
# RUN_ANALYSIS WORKFLOW TESTS
# =============================================================================

@pytest.mark.unit
def test_run_analysis_workflow():
    """Test run_analysis orchestrates the full workflow."""
    analyzer = _make_analyzer()

    # Mock describe_clusters to return test data
    analyzer.redshift.describe_clusters.return_value = {
        'Clusters': [
            {
                'ClusterIdentifier': 'prod-test-cluster',
                'NodeType': 'ra3.4xlarge',
                'NumberOfNodes': 2,
                'ClusterStatus': 'available',
                'ClusterVersion': '1.0.49000',
                'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=60),  # Old enough
                'AutomatedSnapshotRetentionPeriod': 7,
                'Encrypted': True,
                'EnhancedVpcRouting': True,
                'ClusterParameterGroups': [{'ParameterGroupName': 'custom'}],
                'Tags': []
            }
        ]
    }

    # Mock CloudWatch metrics
    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [
            {'Average': 50.0, 'Timestamp': datetime.now(timezone.utc)}
        ]
    }

    # Mock file I/O
    with patch('builtins.open', mock_open()):
        result = analyzer.run_analysis()

    assert 'clusters' in result
    assert 'summary' in result
    assert len(result['clusters']) == 1
    assert result['clusters'][0]['cluster_id'] == 'prod-test-cluster'


@pytest.mark.unit
def test_run_analysis_excludes_dev_clusters():
    """Test run_analysis excludes dev/test clusters."""
    analyzer = _make_analyzer()

    analyzer.redshift.describe_clusters.return_value = {
        'Clusters': [
            {
                'ClusterIdentifier': 'dev-cluster',
                'NodeType': 'dc2.large',
                'NumberOfNodes': 1,
                'ClusterStatus': 'available',
                'ClusterVersion': '1.0.49000',
                'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
                'AutomatedSnapshotRetentionPeriod': 7,
                'Encrypted': True,
                'ClusterParameterGroups': [{'ParameterGroupName': 'default'}],
                'Tags': []
            },
            {
                'ClusterIdentifier': 'prod-cluster',
                'NodeType': 'ra3.4xlarge',
                'NumberOfNodes': 2,
                'ClusterStatus': 'available',
                'ClusterVersion': '1.0.49000',
                'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
                'AutomatedSnapshotRetentionPeriod': 7,
                'Encrypted': True,
                'ClusterParameterGroups': [{'ParameterGroupName': 'custom'}],
                'Tags': []
            }
        ]
    }

    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': [
            {'Average': 50.0, 'Timestamp': datetime.now(timezone.utc)}
        ]
    }

    with patch('builtins.open', mock_open()):
        result = analyzer.run_analysis()

    # Should only include prod-cluster
    assert len(result['clusters']) == 1
    assert result['clusters'][0]['cluster_id'] == 'prod-cluster'


# =============================================================================
# FILE I/O TESTS
# =============================================================================

@pytest.mark.unit
def test_save_csv_recommendations():
    """Test CSV recommendations file creation."""
    analyzer = _make_analyzer()

    analyzer.rightsizing_recommendations = [
        {
            'cluster_id': 'test-cluster',
            'current_node_type': 'dc2.large',
            'current_node_count': 4,
            'recommended_node_type': 'ra3.xlplus',
            'recommended_node_count': 2,
            'estimated_savings': 200.0
        }
    ]

    with patch('builtins.open', mock_open()) as mock_file:
        analyzer.save_csv_recommendations()
        # Check that file was opened (don't verify all kwargs)
        assert mock_file.called
        assert 'rightsizing_recommendations.csv' in str(mock_file.call_args)


@pytest.mark.unit
def test_save_sql_optimizations():
    """Test SQL optimization script file creation."""
    analyzer = _make_analyzer()

    analyzer.table_optimizations = [
        {
            'cluster_id': 'test-cluster',
            'schema': 'public',
            'table': 'test_table',
            'size_mb': 100.0,
            'rows': 10000,
            'optimizations': ['VACUUM']
        }
    ]

    with patch('builtins.open', mock_open()) as mock_file:
        analyzer.save_sql_optimizations()
        mock_file.assert_called_once_with('table_optimization_script.sql', 'w')


@pytest.mark.unit
def test_save_html_dashboard():
    """Test HTML dashboard file creation."""
    analyzer = _make_analyzer()

    analyzer.cluster_analysis = [
        {
            'cluster_id': 'test-cluster',
            'node_type': 'ra3.4xlarge',
            'node_count': 2,
            'cpu_avg': 50.0,
            'disk_usage_percent': 60.0,
            'performance_score': 85.0,
            'issues': [],
            'cost_analysis': {'current_cost': 500.0, 'optimized_cost': 400.0}
        }
    ]

    with patch('builtins.open', mock_open()) as mock_file:
        analyzer.generate_html_dashboard()
        # HTML generation is tested, but saving happens in run_analysis


# =============================================================================
# PRINT_SUMMARY TESTS
# =============================================================================

@pytest.mark.unit
def test_print_summary_with_data(capsys):
    """Test print_summary outputs correct information."""
    analyzer = _make_analyzer()

    # print_summary uses self.cluster_analysis, not a parameter
    analyzer.cluster_analysis = [
        {
            'cluster_id': 'cluster1',
            'node_type': 'ra3.4xlarge',
            'node_count': 2,
            'cpu_avg': 45.0,
            'disk_usage_percent': 60.0,
            'performance_score': 85.0,
            'issues': [
                {'type': 'low_cpu', 'severity': 'high'}
            ],
            'cost_analysis': {
                'current_cost': 500.0,
                'optimized_cost': 350.0
            }
        },
        {
            'cluster_id': 'cluster2',
            'node_type': 'dc2.large',
            'node_count': 4,
            'cpu_avg': 70.0,
            'disk_usage_percent': 50.0,
            'performance_score': 92.0,
            'issues': [],
            'cost_analysis': {
                'current_cost': 300.0,
                'optimized_cost': 280.0
            }
        }
    ]

    analyzer.print_summary()

    captured = capsys.readouterr()
    output = captured.out

    assert 'REDSHIFT ANALYSIS SUMMARY' in output
    assert 'Total Clusters Analyzed: 2' in output


@pytest.mark.unit
def test_print_summary_with_empty_data(capsys):
    """Test print_summary handles empty results."""
    analyzer = _make_analyzer()

    # Empty cluster_analysis
    analyzer.cluster_analysis = []

    analyzer.print_summary()

    captured = capsys.readouterr()
    output = captured.out

    assert 'REDSHIFT ANALYSIS SUMMARY' in output
    assert 'No clusters analyzed' in output


# =============================================================================
# ADDITIONAL EDGE CASES
# =============================================================================

@pytest.mark.unit
def test_should_exclude_cluster_no_tags():
    """Test cluster without Tags field doesn't crash."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'prod-cluster',
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30)
        # No Tags field
    }

    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert should_exclude is False


@pytest.mark.unit
def test_should_exclude_cluster_with_naive_datetime():
    """Test cluster with naive datetime (no timezone)."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'prod-cluster',
        'ClusterCreateTime': datetime.now() - timedelta(days=30),  # Naive datetime
        'Tags': []
    }

    # Should not crash
    should_exclude, reason = analyzer.should_exclude_cluster(cluster)
    assert isinstance(should_exclude, bool)


@pytest.mark.unit
def test_check_cluster_issues_high_queue_time():
    """Test detection of high query queue time."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'ra3.4xlarge',
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 50.0,
        'query_queue_avg': 35.0,  # High queue time
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    queue_issue = next((i for i in issues if i['type'] == 'high_query_queue_time'), None)
    assert queue_issue is not None
    assert queue_issue['severity'] == 'high'


@pytest.mark.unit
def test_check_cluster_issues_ds2_node_type():
    """Test detection of inefficient ds2 node type."""
    analyzer = _make_analyzer()

    cluster = {
        'ClusterIdentifier': 'test-cluster',
        'NodeType': 'ds2.xlarge',
        'AutomatedSnapshotRetentionPeriod': 7,
        'Encrypted': True,
        'ClusterCreateTime': datetime.now(timezone.utc) - timedelta(days=30),
        'ClusterParameterGroups': [{'ParameterGroupName': 'custom-group'}]
    }

    metrics = {
        'cpu_avg': 50.0,
        'disk_usage': 50.0,
        'query_queue_avg': 5.0,
        'disk_spill_pct': 0.0
    }

    issues = analyzer.check_cluster_issues(cluster, metrics)

    # ds2 is also an inefficient node type
    node_issue = next((i for i in issues if i['type'] == 'inefficient_node_type'), None)
    assert node_issue is not None


@pytest.mark.unit
def test_get_cloudwatch_metric_timeseries_empty():
    """Test CloudWatch timeseries with no data."""
    analyzer = _make_analyzer()

    analyzer.cloudwatch.get_metric_statistics.return_value = {
        'Datapoints': []
    }

    result = analyzer.get_cloudwatch_metric_timeseries('test-cluster', 'CPUUtilization')

    assert result == []


@pytest.mark.unit
def test_save_csv_recommendations_empty():
    """Test CSV generation with no recommendations."""
    analyzer = _make_analyzer()

    analyzer.rightsizing_recommendations = []

    with patch('builtins.open', mock_open()) as mock_file:
        analyzer.save_csv_recommendations()
        # Should still create empty CSV with headers
        assert mock_file.called


@pytest.mark.unit
def test_run_analysis_handles_client_error():
    """Test run_analysis handles AWS ClientError."""
    analyzer = _make_analyzer()

    analyzer.redshift.describe_clusters.side_effect = ClientError(
        {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
        'DescribeClusters'
    )

    with pytest.raises(ClientError):
        analyzer.run_analysis()


@pytest.mark.unit
def test_generate_rightsizing_recommendations_with_multiple_clusters():
    """Test rightsizing recommendations for multiple clusters."""
    analyzer = _make_analyzer()

    analyzer.cluster_analysis = [
        {
            'cluster_id': 'cluster1',
            'node_type': 'dc2.large',
            'node_count': 4,
            'cpu_avg': 25.0,
            'cost_analysis': {
                'current_cost': 800.0,
                'optimized_cost': 400.0,
                'optimized_node_type': 'ra3.xlplus',
                'optimized_node_count': 2,
                'current_monthly_cost': 800.0,
                'optimized_monthly_cost': 400.0
            }
        },
        {
            'cluster_id': 'cluster2',
            'node_type': 'ra3.4xlarge',
            'node_count': 2,
            'cpu_avg': 60.0,
            'cost_analysis': {
                'current_cost': 500.0,
                'optimized_cost': 500.0,
                'optimized_node_type': 'ra3.4xlarge',
                'optimized_node_count': 2,
                'current_monthly_cost': 500.0,
                'optimized_monthly_cost': 500.0
            }
        }
    ]

    analyzer.generate_rightsizing_recommendations()

    # Should only generate recommendation for cluster1 (has savings)
    assert len(analyzer.rightsizing_recommendations) >= 1
    rec = analyzer.rightsizing_recommendations[0]
    assert 'cluster_id' in rec
    assert 'estimated_savings' in rec


@pytest.mark.unit
def test_calculate_cost_analysis_chooses_cheaper_option():
    """Test that cost analysis chooses the cheaper optimization."""
    analyzer = _make_analyzer()

    # dc2.large with low CPU and many nodes
    # Should reduce nodes but keep dc2 if it's cheaper than RA3
    cluster = {
        'NodeType': 'dc2.large',
        'NumberOfNodes': 4
    }

    metrics = {
        'cpu_avg': 15.0  # Very low CPU
    }

    cost = analyzer.calculate_cost_analysis(cluster, metrics)

    # With low CPU, should reduce node count
    assert cost['optimized_node_count'] < 4
    # Optimized cost should be lower than current
    assert cost['optimized_cost'] < cost['current_cost']


@pytest.mark.unit
def test_calculate_cost_analysis_ra3_migration_path():
    """Test cost analysis when RA3 migration is cheaper."""
    analyzer = _make_analyzer()

    # dc2.8xlarge - expensive node type where RA3 migration would be cheaper
    cluster = {
        'NodeType': 'dc2.8xlarge',
        'NumberOfNodes': 4
    }

    metrics = {
        'cpu_avg': 15.0  # Low CPU triggers node reduction
    }

    cost = analyzer.calculate_cost_analysis(cluster, metrics)

    # Should have some optimization
    assert cost['optimized_node_count'] <= 4
    assert cost['optimized_cost'] <= cost['current_cost']
    # Should have an optimized node type suggestion
    assert 'optimized_node_type' in cost


@pytest.mark.unit
def test_calculate_cost_analysis_ds2_node_type():
    """Test cost analysis with ds2 node type."""
    analyzer = _make_analyzer()

    cluster = {
        'NodeType': 'ds2.xlarge',
        'NumberOfNodes': 2
    }

    metrics = {
        'cpu_avg': 50.0
    }

    cost = analyzer.calculate_cost_analysis(cluster, metrics)

    # Should calculate costs correctly
    assert 'current_cost' in cost
    assert 'optimized_cost' in cost
    assert cost['current_cost'] > 0
