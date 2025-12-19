"""
Unit tests for CloudFrontAnalyzer helper logic.

These tests mock boto3 clients and CloudWatch responses so that the core
calculation helpers in lib/analyse.py can be validated without spinning up
Moto or touching AWS.
"""

from __future__ import annotations

import os
import sys
from types import ModuleType
from unittest.mock import MagicMock, patch

import pytest


def _install_optional_stubs():
    """Provide lightweight stand-ins for optional dependencies such as pandas/plotly."""
    if 'pandas' not in sys.modules:
        pandas_stub = ModuleType('pandas')

        class _StubSeries(list):
            def map(self, func):
                return [func(v) for v in self]

        class _StubDataFrame:
            def __init__(self, rows=None):
                rows = rows or []
                self._rows = [dict(row) for row in rows]
                self.columns = list(rows[0].keys()) if rows else []

            def copy(self):
                return _StubDataFrame([dict(row) for row in self._rows])

            def __getitem__(self, key):
                return _StubSeries(row.get(key) for row in self._rows)

            def __setitem__(self, key, values):
                values = list(values)
                if key not in self.columns:
                    self.columns.append(key)
                for row, value in zip(self._rows, values):
                    row[key] = value

            def to_html(self, **kwargs):
                header_html = ''.join(f"<th>{col}</th>" for col in self.columns)
                body_rows = []
                for row in self._rows:
                    cells = ''.join(f"<td>{row.get(col, '')}</td>" for col in self.columns)
                    body_rows.append(f"<tr>{cells}</tr>")
                body_html = ''.join(body_rows)
                return f"<table><thead><tr>{header_html}</tr></thead><tbody>{body_html}</tbody></table>"

        pandas_stub.DataFrame = _StubDataFrame
        sys.modules['pandas'] = pandas_stub

    if 'plotly' not in sys.modules:
        plotly_module = ModuleType('plotly')
        go_module = ModuleType('plotly.graph_objects')
        px_module = ModuleType('plotly.express')
        subplots_module = ModuleType('plotly.subplots')

        class _StubTrace:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        class _StubFigure:
            def __init__(self):
                self.traces = []

            def add_trace(self, trace, row=None, col=None):
                self.traces.append((trace, row, col))

            def update_layout(self, **kwargs):
                pass

            def to_html(self, **kwargs):
                return "<div>plot</div>"

        def _bar(**kwargs):
            return _StubTrace(**kwargs)

        go_module.Bar = lambda **kwargs: _StubTrace(**kwargs)
        go_module.Pie = lambda **kwargs: _StubTrace(**kwargs)
        go_module.Scatter = lambda **kwargs: _StubTrace(**kwargs)
        px_module.bar = lambda *args, **kwargs: _StubFigure()
        subplots_module.make_subplots = lambda **kwargs: _StubFigure()

        sys.modules['plotly'] = plotly_module
        sys.modules['plotly.graph_objects'] = go_module
        sys.modules['plotly.express'] = px_module
        sys.modules['plotly.subplots'] = subplots_module


_install_optional_stubs()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import (
    CloudFrontAnalyzer,
    CostAnalysis,
    DistributionAnalysis,
    Issue,
    MIN_REQUESTS_PER_DAY,
    DAYS_TO_ANALYZE,
    CLOUDFRONT_REQUEST_COST,
    CLOUDFRONT_DATA_TRANSFER_COST,
    ORIGIN_REQUEST_COST,
)


@pytest.fixture
def analyzer_instance():
    """Provide a CloudFrontAnalyzer with mocked boto3 clients."""
    with patch('analyse.boto3.client') as mock_client:
        mock_client.side_effect = lambda service, **kwargs: MagicMock(name=f"{service}_client")
        yield CloudFrontAnalyzer(region='us-east-1')


@patch('analyse.boto3.client')
def test_initialization_uses_endpoint_from_env(mock_client, monkeypatch):
    """Ensure boto3 clients receive the Moto endpoint when provided."""
    monkeypatch.setenv('AWS_ENDPOINT_URL', 'http://localhost:5005')
    analyzer = CloudFrontAnalyzer(region='us-west-1')
    assert analyzer.region == 'us-west-1'
    assert mock_client.call_count == 2
    for call in mock_client.call_args_list:
        assert call.kwargs['endpoint_url'] == 'http://localhost:5005'


def test_should_skip_distribution_detection(analyzer_instance):
    """Verify skip logic respects tags, comments, and domain hints."""
    analyzer = analyzer_instance
    assert analyzer._should_skip_distribution({'Id': 'A', 'Comment': 'public'}, {'ExcludeFromAnalysis': 'true'})
    assert analyzer._should_skip_distribution({'Id': 'B', 'Comment': 'Internal only'}, {})
    assert analyzer._should_skip_distribution({'Id': 'C', 'Comment': 'prod', 'DomainName': 'internal.example.com'}, {'Type': 'public'})
    assert not analyzer._should_skip_distribution({'Id': 'D', 'Comment': 'prod'}, {})


def test_check_request_volume_threshold(analyzer_instance):
    """Confirm request volume helper enforces the 10k/day rule."""
    analyzer = analyzer_instance
    total_required = MIN_REQUESTS_PER_DAY * DAYS_TO_ANALYZE
    with patch.object(analyzer, '_fetch_metric_value', return_value=total_required):
        assert analyzer._check_request_volume('DIST123')
    with patch.object(analyzer, '_fetch_metric_value', return_value=(MIN_REQUESTS_PER_DAY - 2000) * DAYS_TO_ANALYZE):
        assert not analyzer._check_request_volume('DIST999')


def test_analyze_distribution_detects_all_issue_types(analyzer_instance):
    """Ensure _analyze_distribution raises every issue when configurations require it."""
    analyzer = analyzer_instance
    distribution = {
        'Id': 'DIST-UNIT',
        'DomainName': 'unit.example.cloudfront.net',
        'DistributionConfig': {
            'Origins': {
                'Items': [
                    {
                        'Id': 'origin-1',
                        'DomainName': 'origin.example.com',
                        'CustomOriginConfig': {'OriginProtocolPolicy': 'http-only'},
                        'OriginShield': {'Enabled': False}
                    },
                    {
                        'Id': 'origin-2',
                        'DomainName': 'secondary.example.com',
                        'CustomOriginConfig': {'OriginProtocolPolicy': 'match-viewer'},
                        'OriginShield': {'Enabled': False}
                    }
                ]
            },
            'OriginGroups': {'Items': []},
            'DefaultCacheBehavior': {
                'TargetOriginId': 'origin-1',
                'Compress': False,
                'DefaultTTL': 300,
                'ResponseHeadersPolicyId': '',
                'ViewerProtocolPolicy': 'allow-all',
                'ForwardedValues': {
                    'QueryString': True,
                    'Cookies': {'Forward': 'all'},
                    'Headers': {'Quantity': 0, 'Items': []}
                },
                'LambdaFunctionAssociations': {'Items': []}
            },
            'CacheBehaviors': {'Items': []},
            'CustomErrorResponses': {'Items': []},
            'Logging': {'Enabled': False},
            'PriceClass': 'PriceClass_All',
            'WebACLId': '',
            'Comment': ''
        }
    }
    expected_issues = {
        "Low Cache Hit Ratio",
        "No Origin Shield",
        "No Compression",
        "Inadequate TTL",
        "Missing Security Headers",
        "HTTP Origin",
        "No Origin Failover",
        "Inefficient Price Class",
        "No WAF Integration",
        "Logging Disabled",
        "No Lambda@Edge",
        "Insecure Viewer Protocol Policy",
        "Forward All Cookies",
        "No Custom Error Pages",
    }
    metric_store = {
        ('CacheHitRate', 'Global', 'Average'): 60.0,
        ('Requests', 'Global', 'Sum'): 30_000_000,
        ('OriginRequests', 'Global', 'Sum'): 10_000_000,
        ('BytesDownloaded', 'Global', 'Sum'): 400 * (1024 ** 3),
        ('Requests', 'NA', 'Sum'): 900_000,
        ('Requests', 'EU', 'Sum'): 120_000,
        ('Requests', 'AP', 'Sum'): 5_000,
    }

    def fake_fetch(dist_id, metric_name, statistics='Sum', region='Global', **_):
        return metric_store.get((metric_name, region, statistics), 0.0)

    with patch.object(analyzer, '_fetch_metric_value', side_effect=fake_fetch), \
            patch.object(analyzer, '_check_single_origin', return_value=True):
        analysis = analyzer._analyze_distribution(distribution)

    issue_types = {issue.type for issue in analysis.issues}
    assert expected_issues.issubset(issue_types)
    assert analysis.domain_name == 'unit.example.cloudfront.net'
    assert analysis.cost_analysis.current_monthly_cost > 0


def test_perform_cost_analysis_uses_metric_helpers(analyzer_instance):
    """Validate cost calculations, savings application, and returned structure."""
    analyzer = analyzer_instance
    with patch.object(analyzer, '_get_data_transfer', return_value=200.0):
        with patch.object(analyzer, '_get_origin_requests', return_value=5_000_000):
            with patch.object(analyzer, '_get_total_requests', return_value=20_000_000):
                issues = [
                    Issue("Low Cache Hit Ratio", "high", "bad", "fix", 40.0),
                    Issue("No Compression", "medium", "bad", "fix", 20.0),
                ]
                result = analyzer._perform_cost_analysis('DIST', issues)
    current_cost = (
        20_000_000 * CLOUDFRONT_REQUEST_COST +
        200.0 * CLOUDFRONT_DATA_TRANSFER_COST +
        5_000_000 * ORIGIN_REQUEST_COST
    )
    assert result.current_monthly_cost == pytest.approx(current_cost)
    assert result.data_transfer_out == 200.0
    assert result.origin_requests == 5_000_000
    assert result.potential_savings == 60.0
    assert result.optimized_monthly_cost == pytest.approx(current_cost - 60.0)


def test_fetch_metric_value_handles_average_and_sum(analyzer_instance):
    """Exercise the CloudWatch metric helper for both sum and average statistics."""
    analyzer = analyzer_instance
    analyzer.cloudwatch = MagicMock()
    analyzer.cloudwatch.get_metric_statistics.side_effect = [
        {'Datapoints': [{'Average': 80.0}, {'Average': 60.0}]},
        {'Datapoints': [{'Sum': 1500.0}]},
        {'Datapoints': []}
    ]
    avg = analyzer._fetch_metric_value('DIST', 'CacheHitRate', statistics='Average')
    total = analyzer._fetch_metric_value('DIST', 'Requests')
    none = analyzer._fetch_metric_value('DIST', 'BytesDownloaded')
    assert avg == pytest.approx(70.0)
    assert total == 1500.0
    assert none is None


def test_reporting_helpers_generate_artifacts(tmp_path, analyzer_instance):
    """Ensure reporting helpers create JSON, HTML, CSV, and summary output."""
    analyzer = analyzer_instance
    analyzer.base_dir = tmp_path
    issues = [
        Issue("Low Cache Hit Ratio", "high", "60%", ">80%", 10.0),
        Issue("Logging Disabled", "medium", "off", "enable", 0.0),
    ]
    analyses = [
        DistributionAnalysis(
            distribution_id="DIST1",
            domain_name="d1.cloudfront.net",
            performance_score=70,
            cache_hit_ratio=0.65,
            issues=issues,
            cost_analysis=CostAnalysis(
                current_monthly_cost=100.0,
                data_transfer_out=10.0,
                origin_requests=1000,
                optimized_monthly_cost=80.0,
                potential_savings=20.0
            )
        ),
        DistributionAnalysis(
            distribution_id="DIST2",
            domain_name="d2.cloudfront.net",
            performance_score=90,
            cache_hit_ratio=0.9,
            issues=[],
            cost_analysis=CostAnalysis(
                current_monthly_cost=50.0,
                data_transfer_out=5.0,
                origin_requests=500,
                optimized_monthly_cost=45.0,
                potential_savings=5.0
            )
        ),
    ]
    summary = analyzer._generate_summary(analyses)
    analyzer._print_summary_table(analyses, summary)
    analyzer._save_json_report(analyses, summary)
    analyzer._generate_html_report(analyses, summary)
    analyzer._generate_csv_roadmap(analyses)
    assert summary['distributions_analyzed'] == 2
    assert summary['total_potential_savings'] == 25.0
    assert (tmp_path / 'cloudfront_optimization.json').exists()
    assert (tmp_path / 'cache_efficiency_report.html').exists()
    assert (tmp_path / 'cdn_optimization_roadmap.csv').exists()


def test_get_eligible_distributions_filters_by_tags(analyzer_instance):
    """Verify distribution filtering honors exclusion tags and request volumes."""
    analyzer = analyzer_instance
    paginator = MagicMock()
    paginator.paginate.return_value = [
        {'DistributionList': {'Items': [
            {'Id': 'skip', 'ARN': 'arn1', 'Comment': 'prod'},
            {'Id': 'internal', 'ARN': 'arn2', 'Comment': 'internal traffic'},
            {'Id': 'keep', 'ARN': 'arn3', 'Comment': 'prod'},
        ]}}
    ]
    analyzer.cloudfront = MagicMock()
    analyzer.cloudfront.get_paginator.return_value = paginator

    def tag_response(resource):
        if resource.endswith('skip'):
            return {'Tags': {'Items': [{'Key': 'ExcludeFromAnalysis', 'Value': 'true'}]}}
        if resource.endswith('internal'):
            return {'Tags': {'Items': [{'Key': 'Type', 'Value': 'internal-only'}]}}
        return {'Tags': {'Items': []}}

    analyzer.cloudfront.list_tags_for_resource.side_effect = tag_response
    analyzer.cloudfront.get_distribution.return_value = {'Distribution': {'Id': 'keep', 'DistributionConfig': {}}}

    with patch.object(analyzer, '_check_request_volume', side_effect=lambda dist_id: dist_id == 'keep'):
        eligible = analyzer._get_eligible_distributions()
    assert len(eligible) == 1
    assert eligible[0]['Id'] == 'keep'


def test_analyze_all_distributions_pipeline(tmp_path, analyzer_instance):
    """Ensure analyze_all_distributions orchestrates downstream helpers."""
    analyzer = analyzer_instance
    analyzer.base_dir = tmp_path
    fake_analysis = DistributionAnalysis(
        distribution_id="DISTX",
        domain_name="dx.cloudfront.net",
        performance_score=80,
        cache_hit_ratio=0.8,
        issues=[],
        cost_analysis=CostAnalysis(
            current_monthly_cost=10.0,
            data_transfer_out=1.0,
            origin_requests=1000,
            optimized_monthly_cost=9.0,
            potential_savings=1.0,
        )
    )
    with patch.object(analyzer, '_get_eligible_distributions', return_value=[{'Id': 'DISTX'}]), \
            patch.object(analyzer, '_analyze_distribution', return_value=fake_analysis), \
            patch.object(analyzer, '_save_json_report') as save_json, \
            patch.object(analyzer, '_generate_html_report') as gen_html, \
            patch.object(analyzer, '_generate_csv_roadmap') as gen_csv:
        result = analyzer.analyze_all_distributions()
    assert result['summary']['distributions_analyzed'] == 1
    assert save_json.called
    assert gen_html.called
    assert gen_csv.called


def test_fetch_metric_value_handles_exception(analyzer_instance):
    analyzer = analyzer_instance
    analyzer.cloudwatch = MagicMock()
    analyzer.cloudwatch.get_metric_statistics.side_effect = RuntimeError("boom")
    assert analyzer._fetch_metric_value('DIST', 'Requests') is None


def test_get_cache_hit_ratio_defaults_on_missing_data(analyzer_instance):
    analyzer = analyzer_instance
    analyzer.cloudwatch = MagicMock()
    analyzer.cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}
    assert analyzer._get_cache_hit_ratio('DIST') == 0.85


def test_origin_shield_helpers(analyzer_instance):
    analyzer = analyzer_instance
    multi_origin_config = {'Origins': {'Items': [{}, {}]}}
    assert analyzer._requires_origin_shield(multi_origin_config)
    enabled_config = {'Origins': {'Items': [{'OriginShield': {'Enabled': True}}]}}
    assert analyzer._origin_shield_enabled(enabled_config)


def test_check_compression_enabled_inspects_behaviors(analyzer_instance):
    analyzer = analyzer_instance
    config = {
        'DefaultCacheBehavior': {'Compress': True},
        'CacheBehaviors': {'Items': [
            {'PathPattern': '/static/app.html', 'Compress': False}
        ]}
    }
    assert not analyzer._check_compression_enabled(config)


def test_analyze_traffic_pattern_handles_zero_requests(analyzer_instance):
    analyzer = analyzer_instance
    with patch.object(analyzer, '_fetch_metric_value', return_value=0):
        pattern = analyzer._analyze_traffic_pattern('DIST')
    assert pattern['concentrated_regions'] is False
    assert pattern['recommended_price_class'] == 'PriceClass_All'


def test_lambda_edge_helpers(analyzer_instance):
    analyzer = analyzer_instance
    config = {
        'DefaultCacheBehavior': {
            'ForwardedValues': {'QueryString': False, 'Cookies': {'Forward': 'none'}},
            'LambdaFunctionAssociations': {'Items': [
                {'LambdaFunctionARN': 'arn', 'EventType': 'viewer-request'}
            ]}
        },
        'CacheBehaviors': {'Items': []}
    }
    assert not analyzer._should_use_lambda_edge(config)
    assert analyzer._has_lambda_edge(config)


def test_print_console_output_lists_issues(capsys, analyzer_instance):
    analyzer = analyzer_instance
    issues = [
        Issue("Low Cache Hit Ratio", "high", "60%", ">80%", 10.0),
        Issue("Logging Disabled", "medium", "off", "enable", 0.0),
    ]
    analysis = DistributionAnalysis(
        distribution_id="DISTZ",
        domain_name="dz.cloudfront.net",
        performance_score=60,
        cache_hit_ratio=0.6,
        issues=issues,
        cost_analysis=CostAnalysis(100.0, 10.0, 1000, 80.0, 20.0)
    )
    analyzer._print_console_output(analysis)
    output = capsys.readouterr().out
    assert "Top Issues" in output
    assert "[HIGH] Low Cache Hit Ratio" in output


def test_generate_summary_handles_empty(analyzer_instance):
    analyzer = analyzer_instance
    summary = analyzer._generate_summary([])
    assert summary['distributions_analyzed'] == 0
