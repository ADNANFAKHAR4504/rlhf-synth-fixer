"""Unit tests for the lib.analyse module."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List

import pytest
from botocore.exceptions import ClientError

import lib.analyse as analyse
from lib.analyse import RDSAnalyzer, _safe_mean


def _make_analyzer() -> RDSAnalyzer:
    """Create an analyzer instance without invoking boto3 clients."""
    analyzer = RDSAnalyzer.__new__(RDSAnalyzer)
    analyzer.region = "us-east-1"
    analyzer.rds = None  # type: ignore[attr-defined]
    analyzer.cloudwatch = None  # type: ignore[attr-defined]
    analyzer.instances_data = []
    analyzer.analysis_results = {}
    return analyzer


@pytest.mark.unit
def test_analyzer_initializes_without_endpoint(monkeypatch: pytest.MonkeyPatch) -> None:
    created_clients: List[tuple[str, Dict[str, Any]]] = []

    class _BotoStub:
        def client(self, service: str, **kwargs: Any) -> str:
            created_clients.append((service, kwargs))
            return f"{service}-client"

    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    monkeypatch.setattr(analyse, "boto3", _BotoStub())

    analyzer = RDSAnalyzer(region="us-west-2")

    assert analyzer.rds == "rds-client"
    assert analyzer.cloudwatch == "cloudwatch-client"
    assert created_clients == [
        ("rds", {"region_name": "us-west-2"}),
        ("cloudwatch", {"region_name": "us-west-2"}),
    ]


@pytest.mark.unit
def test_analyzer_initializes_with_endpoint(monkeypatch: pytest.MonkeyPatch) -> None:
    created_clients: List[tuple[str, Dict[str, Any]]] = []

    class _BotoStub:
        def client(self, service: str, **kwargs: Any) -> str:
            created_clients.append((service, kwargs))
            return f"{service}-client"

    monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:5001")
    monkeypatch.setattr(analyse, "boto3", _BotoStub())

    analyzer = RDSAnalyzer(region="us-west-1")

    assert analyzer.rds == "rds-client"
    assert analyzer.cloudwatch == "cloudwatch-client"
    assert created_clients == [
        ("rds", {"region_name": "us-west-1", "endpoint_url": "http://localhost:5001"}),
        ("cloudwatch", {"region_name": "us-west-1", "endpoint_url": "http://localhost:5001"}),
    ]


@pytest.mark.unit
def test_get_rds_instances_applies_filters(monkeypatch: pytest.MonkeyPatch) -> None:
    analyzer = _make_analyzer()

    class _Paginator:
        def __init__(self, pages: List[Dict[str, Any]]):
            self.pages = pages

        def paginate(self) -> Iterable[Dict[str, Any]]:
            yield from self.pages

    class _RDSStub:
        def __init__(self):
            now = datetime.now(timezone.utc)
            self.instances = [
                {"DBInstanceIdentifier": "test-ignore", "DBInstanceArn": "arn:test", "InstanceCreateTime": now - timedelta(days=40)},
                {"DBInstanceIdentifier": "prod-exclude", "DBInstanceArn": "arn:exclude", "InstanceCreateTime": now - timedelta(days=40)},
                {"DBInstanceIdentifier": "prod-young", "DBInstanceArn": "arn:young", "InstanceCreateTime": now - timedelta(days=5)},
                {"DBInstanceIdentifier": "prod-valid", "DBInstanceArn": "arn:valid", "InstanceCreateTime": now - timedelta(days=45)},
                {"DBInstanceIdentifier": "prod-error-tags", "DBInstanceArn": "arn:error", "InstanceCreateTime": now - timedelta(days=60)},
            ]
            self.tags = {
                "arn:exclude": [{"Key": "ExcludeFromAnalysis", "Value": "true"}],
                "arn:valid": [{"Key": "Environment", "Value": "production"}],
                "arn:young": [{"Key": "Environment", "Value": "dev"}],
            }

        def get_paginator(self, name: str) -> _Paginator:
            assert name == "describe_db_instances"
            return _Paginator([{"DBInstances": self.instances}])

        def list_tags_for_resource(self, ResourceName: str) -> Dict[str, Any]:
            if ResourceName == "arn:error":
                raise ClientError({"Error": {"Code": "AccessDenied", "Message": "denied"}}, "ListTagsForResource")
            return {"TagList": self.tags.get(ResourceName, [])}

    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    analyzer.rds = _RDSStub()  # type: ignore[assignment]

    instances = analyzer.get_rds_instances()
    identifiers = [instance["DBInstanceIdentifier"] for instance in instances]

    assert identifiers == ["prod-valid", "prod-error-tags"]
    assert instances[0]["Tags"]["Environment"] == "production"
    assert instances[1]["Tags"] == {}


@pytest.mark.unit
def test_get_rds_instances_respects_creation_age(monkeypatch: pytest.MonkeyPatch) -> None:
    analyzer = _make_analyzer()
    now = datetime.now(timezone.utc)

    class _Paginator:
        def paginate(self) -> Iterable[Dict[str, Any]]:
            yield {
                "DBInstances": [
                    {
                        "DBInstanceIdentifier": "db-old",
                        "DBInstanceArn": "arn:old",
                        "InstanceCreateTime": now - timedelta(days=40),
                    },
                    {
                        "DBInstanceIdentifier": "db-new",
                        "DBInstanceArn": "arn:new",
                        "InstanceCreateTime": now - timedelta(days=5),
                    },
                ]
            }

    class _RDSStub:
        def get_paginator(self, name: str) -> _Paginator:
            return _Paginator()

        def list_tags_for_resource(self, ResourceName: str) -> Dict[str, Any]:
            return {"TagList": []}

    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    analyzer.rds = _RDSStub()  # type: ignore[assignment]

    instances = analyzer.get_rds_instances()
    assert [instance["DBInstanceIdentifier"] for instance in instances] == ["db-old"]


@pytest.mark.unit
def test_get_cloudwatch_metrics_handles_client_error() -> None:
    analyzer = _make_analyzer()

    class _CloudWatchStub:
        def get_metric_statistics(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
            raise ClientError({"Error": {"Code": "Throttling", "Message": "retry"}}, "GetMetricStatistics")

    analyzer.cloudwatch = _CloudWatchStub()  # type: ignore[assignment]
    assert analyzer.get_cloudwatch_metrics("db-1", "CPUUtilization") == 0.0


@pytest.mark.unit
def test_get_cloudwatch_metrics_returns_mean() -> None:
    analyzer = _make_analyzer()

    class _CloudWatchStub:
        def get_metric_statistics(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
            return {"Datapoints": [{"Average": 5.0}, {"Average": 15.0}]}

    analyzer.cloudwatch = _CloudWatchStub()  # type: ignore[assignment]
    value = analyzer.get_cloudwatch_metrics("db-1", "CPUUtilization")
    assert value == pytest.approx(10.0)


@pytest.mark.unit
def test_get_storage_growth_rate_calculates_growth() -> None:
    analyzer = _make_analyzer()

    class _CloudWatchStub:
        def get_metric_statistics(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
            now = datetime.now(timezone.utc)
            datapoints = []
            for day in range(30):
                datapoints.append(
                    {"Timestamp": now - timedelta(days=29 - day), "Average": 1000 - (day * 5)}
                )
            return {"Datapoints": datapoints}

    analyzer.cloudwatch = _CloudWatchStub()  # type: ignore[assignment]
    growth = analyzer.get_storage_growth_rate("db-1")
    assert growth > 0


@pytest.mark.unit
def test_get_storage_growth_rate_returns_zero_without_growth() -> None:
    analyzer = _make_analyzer()

    class _CloudWatchStub:
        def get_metric_statistics(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
            now = datetime.now(timezone.utc)
            datapoints = []
            for day in range(30):
                datapoints.append(
                    {"Timestamp": now - timedelta(days=29 - day), "Average": 1000 + day}
                )
            return {"Datapoints": datapoints}

    analyzer.cloudwatch = _CloudWatchStub()  # type: ignore[assignment]
    assert analyzer.get_storage_growth_rate("db-2") == 0.0


@pytest.mark.unit
def test_get_storage_growth_rate_handles_client_error() -> None:
    analyzer = _make_analyzer()

    class _CloudWatchStub:
        def get_metric_statistics(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
            raise ClientError({"Error": {"Code": "AccessDenied"}}, "GetMetricStatistics")

    analyzer.cloudwatch = _CloudWatchStub()  # type: ignore[assignment]
    assert analyzer.get_storage_growth_rate("db-3") == 0.0


@pytest.mark.unit
def test_safe_mean_handles_empty_and_populated_sequences() -> None:
    assert _safe_mean([]) == 0.0
    assert _safe_mean([10, 20, 30]) == pytest.approx(20.0)


@pytest.mark.unit
def test_version_outdated_detection() -> None:
    analyzer = _make_analyzer()
    assert analyzer._is_version_outdated("8.0", "8.2")
    assert not analyzer._is_version_outdated("8.1", "8.2")
    assert not analyzer._is_version_outdated("invalid", "8.2")


@pytest.mark.unit
def test_performance_score_respects_severity_weights() -> None:
    analyzer = _make_analyzer()
    issues = [
        {"severity": "critical"},
        {"severity": "high"},
        {"severity": "medium"},
        {"severity": "low"},
    ]
    assert analyzer._calculate_performance_score(issues) == 45
    assert analyzer._calculate_performance_score([]) == 100


@pytest.mark.unit
def test_cost_optimization_recommends_smaller_class_for_underutilized() -> None:
    analyzer = _make_analyzer()
    instance = {"DBInstanceClass": "db.m5.xlarge"}
    issues = [{"type": "underutilized"}]

    result = analyzer._calculate_cost_optimization(instance, issues, avg_cpu=10.0, avg_connections=5.0)

    assert result["recommended_class"] == "db.m5.large"
    assert result["potential_savings"] > 0


@pytest.mark.unit
def test_cost_optimization_downsizes_t3_large() -> None:
    analyzer = _make_analyzer()
    instance = {"DBInstanceClass": "db.t3.large"}
    issues = [{"type": "underutilized"}]

    result = analyzer._calculate_cost_optimization(instance, issues, avg_cpu=5.0, avg_connections=2.0)
    assert result["recommended_class"] == "db.t3.medium"


@pytest.mark.unit
def test_cost_optimization_replaces_burstable_instances() -> None:
    analyzer = _make_analyzer()
    instance = {"DBInstanceClass": "db.t3.small"}
    issues = [{"type": "burst_credit_depletion"}]

    result = analyzer._calculate_cost_optimization(instance, issues, avg_cpu=80.0, avg_connections=200.0)
    assert result["recommended_class"] == "db.m5.large"


@pytest.mark.unit
def test_analyze_instance_detects_expected_issue_set() -> None:
    analyzer = _make_analyzer()

    metric_values = {
        ("CPUUtilization", "Average"): 10.0,
        ("DatabaseConnections", "Average"): 50.0,
        ("BurstBalance", "Average"): 5.0,
        ("DatabaseConnections", "Maximum"): 40.0,
    }

    def fake_metric(db_identifier: str, metric_name: str, stat: str = "Average", days: int = 30) -> float:
        return metric_values.get((metric_name, stat), 0.0)

    analyzer.get_cloudwatch_metrics = fake_metric  # type: ignore[assignment]
    analyzer.get_storage_growth_rate = lambda _db_id: 25.0  # type: ignore[assignment]

    instance = {
        "DBInstanceIdentifier": "prod-db-1",
        "DBInstanceClass": "db.t3.medium",
        "DBParameterGroups": [{"DBParameterGroupName": "default.postgres15"}],
        "Engine": "postgres",
        "EngineVersion": "13.4",
        "Tags": {"Environment": "production", "DataClassification": "Sensitive"},
        "MultiAZ": False,
        "BackupRetentionPeriod": 0,
        "AllocatedStorage": 2048,
        "EnabledCloudwatchLogsExports": None,
        "PerformanceInsightsEnabled": False,
        "StorageType": "standard",
        "StorageEncrypted": False,
        "IAMDatabaseAuthenticationEnabled": False,
    }

    result = analyzer.analyze_instance(instance)
    issue_types = {issue["type"] for issue in result["issues"]}

    expected_issues = {
        "underutilized",
        "high_storage_growth",
        "burst_credit_depletion",
        "missing_multi_az",
        "no_automated_backups",
        "outdated_engine",
        "no_enhanced_monitoring",
        "no_performance_insights",
        "inefficient_storage",
        "default_parameter_group",
        "no_encryption",
        "no_iam_auth",
    }

    assert expected_issues.issubset(issue_types)
    assert result["cost_optimization"]["recommended_class"] == "db.t3.small"
    assert result["metrics"]["storage_growth"] == 25.0


@pytest.mark.unit
def test_analyze_instance_handles_aurora_specific_checks() -> None:
    analyzer = _make_analyzer()

    metric_values = {
        ("AuroraReplicaLag", "Average"): 1500.0,
        ("DatabaseConnections", "Maximum"): 50.0,
    }

    def fake_metric(db_identifier: str, metric_name: str, stat: str = "Average", days: int = 30) -> float:
        return metric_values.get((metric_name, stat), 100.0)

    analyzer.get_cloudwatch_metrics = fake_metric  # type: ignore[assignment]
    analyzer.get_storage_growth_rate = lambda _db_id: 0.0  # type: ignore[assignment]

    instance = {
        "DBInstanceIdentifier": "aurora-db",
        "DBInstanceClass": "db.r5.large",
        "DBParameterGroups": [{"DBParameterGroupName": "custom"}],
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0",
        "Tags": {"Environment": "production"},
        "MultiAZ": True,
        "BackupRetentionPeriod": 7,
        "AllocatedStorage": 500,
        "EnabledCloudwatchLogsExports": True,
        "PerformanceInsightsEnabled": True,
        "StorageType": "gp3",
        "StorageEncrypted": True,
        "IAMDatabaseAuthenticationEnabled": True,
        "MaxConnectionsLimit": 2000,
    }

    result = analyzer.analyze_instance(instance)
    issue_types = {issue["type"] for issue in result["issues"]}

    assert "high_replica_lag" in issue_types
    assert "idle_connections" in issue_types


@pytest.mark.unit
def test_generate_console_output_renders_tables(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    analyzer = _make_analyzer()
    tables = []

    def fake_tabulate(data: Iterable[Iterable[Any]], **kwargs: Any) -> str:
        tables.append((list(data), kwargs))
        return f"T-{len(tables)}"

    monkeypatch.setattr(analyse, "tabulate", fake_tabulate)

    results = [
        {
            "db_identifier": "db-crit",
            "engine": "postgres",
            "instance_class": "db.m5.large",
            "performance_score": 80,
            "metrics": {"avg_cpu": 10.0, "avg_connections": 5.0, "storage_growth": 0.0},
            "cost_optimization": {
                "current_cost": 100.0,
                "optimized_cost": 80.0,
                "potential_savings": 20.0,
                "recommended_class": "db.m5.large",
            },
            "issues": [
                {"severity": "critical", "type": "no_encryption", "metric_value": "Off", "recommendation": "Fix"},
                {"severity": "high", "type": "missing_multi_az", "metric_value": "Disabled", "recommendation": "Enable"},
                {"severity": "medium", "type": "underutilized", "metric_value": "Low CPU", "recommendation": "Downsize"},
                {"severity": "low", "type": "default_parameter_group", "metric_value": "default", "recommendation": "Custom"},
            ],
        },
        {
            "db_identifier": "db-savings",
            "engine": "postgres",
            "instance_class": "db.m5.xlarge",
            "performance_score": 90,
            "metrics": {"avg_cpu": 50.0, "avg_connections": 100.0, "storage_growth": 5.0},
            "cost_optimization": {
                "current_cost": 200.0,
                "optimized_cost": 150.0,
                "potential_savings": 50.0,
                "recommended_class": "db.m5.large",
            },
            "issues": [],
        },
    ]

    analyzer.generate_console_output(results)
    output = capsys.readouterr().out

    assert "RDS PERFORMANCE ANALYSIS REPORT" in output
    assert tables


@pytest.mark.unit
def test_analyze_all_instances_populates_results() -> None:
    analyzer = _make_analyzer()
    analyzer.get_rds_instances = lambda: [  # type: ignore[assignment]
        {"DBInstanceIdentifier": "db-1"},
        {"DBInstanceIdentifier": "db-2"},
    ]

    def fake_analyze(instance: Dict[str, Any]) -> Dict[str, Any]:
        return {"db_identifier": instance["DBInstanceIdentifier"], "issues": []}

    analyzer.analyze_instance = fake_analyze  # type: ignore[assignment]

    results = analyzer.analyze_all_instances()
    assert len(results) == 2
    assert "db-1" in analyzer.analysis_results


@pytest.mark.unit
def test_save_json_report_emits_expected_payload(tmp_path: Path) -> None:
    analyzer = _make_analyzer()
    results = [
        {
            "db_identifier": "db-1",
            "engine": "postgres",
            "instance_class": "db.t3.medium",
            "performance_score": 80,
            "issues": [{"type": "noop"}],
            "cost_optimization": {"potential_savings": 12.5},
            "metrics": {},
        }
    ]

    output_file = tmp_path / "report.json"
    audit_file = Path("aws_audit_results.json")
    if audit_file.exists():
        audit_file.unlink()

    try:
        analyzer.save_json_report(results, filename=str(output_file))
        payload = json.loads(output_file.read_text())

        assert payload["summary"]["total_instances"] == 1
        assert payload["summary"]["total_potential_savings"] == 12.5
        assert audit_file.exists()
    finally:
        if audit_file.exists():
            audit_file.unlink()


@pytest.mark.unit
def test_save_rightsizing_csv_uses_dataframe_stub(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    analyzer = _make_analyzer()

    metric_values = {
        ("CPUUtilization", "Maximum"): 42.0,
        ("DatabaseConnections", "Maximum"): 15.0,
        ("ReadIOPS", "Maximum"): 100.0,
        ("WriteIOPS", "Maximum"): 50.0,
    }

    def fake_metric(db_identifier: str, metric_name: str, stat: str = "Average", days: int = 30) -> float:
        return metric_values.get((metric_name, stat), 0.0)

    analyzer.get_cloudwatch_metrics = fake_metric  # type: ignore[assignment]

    captured_rows: Dict[str, Iterable[Dict[str, Any]]] = {}

    class _DummyFrame:
        def __init__(self, rows: Iterable[Dict[str, Any]]):
            captured_rows["rows"] = list(rows)

        def to_csv(self, filename: str, index: bool = False) -> None:
            Path(filename).write_text("csv-output")

    class _DummyPandas:
        def DataFrame(self, rows: Iterable[Dict[str, Any]]) -> _DummyFrame:  # noqa: N802 - mimics pandas API
            return _DummyFrame(rows)

    monkeypatch.setattr(analyse, "pd", _DummyPandas())
    monkeypatch.setattr(analyse, "PANDAS_AVAILABLE", False)

    output_file = tmp_path / "rightsizing.csv"
    results = [
        {
            "db_identifier": "db-2",
            "engine": "postgres",
            "instance_class": "db.t3.medium",
            "cost_optimization": {"recommended_class": "db.t3.small", "potential_savings": 25.0},
        }
    ]

    analyzer.save_rightsizing_csv(results, filename=str(output_file))

    assert output_file.exists()
    assert captured_rows["rows"][0]["CPU_P95"] == 42.0
    assert captured_rows["rows"][0]["MonthlySavings"] == 25.0


@pytest.mark.unit
def test_save_rightsizing_csv_skips_when_no_recommendations(monkeypatch: pytest.MonkeyPatch) -> None:
    analyzer = _make_analyzer()
    monkeypatch.setattr(analyse.logger, "info", lambda *args, **kwargs: None)
    analyzer.save_rightsizing_csv([], filename="unused.csv")


@pytest.mark.unit
def test_save_rightsizing_csv_warns_when_pandas_missing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    analyzer = _make_analyzer()
    warnings: List[str] = []

    class _DummyFrame:
        def __init__(self, rows: Iterable[Dict[str, Any]]):
            self.rows = list(rows)

        def to_csv(self, filename: str, index: bool = False) -> None:
            Path(filename).write_text("csv")

    class _DummyPandas:
        def DataFrame(self, rows: Iterable[Dict[str, Any]]) -> _DummyFrame:  # noqa: N802
            return _DummyFrame(rows)

    monkeypatch.setattr(analyse, "PANDAS_AVAILABLE", False)
    monkeypatch.setattr(analyse, "pd", _DummyPandas())
    monkeypatch.setattr(analyse.logger, "warning", lambda message: warnings.append(str(message)))

    analyzer.get_cloudwatch_metrics = lambda *args, **kwargs: 0  # type: ignore[assignment]
    output_file = tmp_path / "rightsizing.csv"
    analyzer.save_rightsizing_csv(
        [
            {
                "db_identifier": "db-warn",
                "engine": "postgres",
                "instance_class": "db.m5.large",
                "cost_optimization": {"recommended_class": "db.m5.large", "potential_savings": 0.0},
            }
        ],
        filename=str(output_file),
    )

    assert warnings
    assert output_file.exists()


@pytest.mark.unit
def test_save_performance_distribution_handles_empty_scores_and_missing_matplotlib(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    analyzer = _make_analyzer()
    monkeypatch.setattr(analyse.logger, "info", lambda *args, **kwargs: None)
    monkeypatch.setattr(analyse.logger, "warning", lambda *args, **kwargs: None)

    analyzer.save_performance_distribution([])

    class _PlotStub:
        def figure(self, *args: Any, **kwargs: Any) -> None:
            return None

        def hist(self, *args: Any, **kwargs: Any) -> None:
            return None

        def xlabel(self, *args: Any, **kwargs: Any) -> None:
            return None

        def ylabel(self, *args: Any, **kwargs: Any) -> None:
            return None

        def title(self, *args: Any, **kwargs: Any) -> None:
            return None

        def axvline(self, *args: Any, **kwargs: Any) -> None:
            return None

        def legend(self, *args: Any, **kwargs: Any) -> None:
            return None

        def grid(self, *args: Any, **kwargs: Any) -> None:
            return None

        def savefig(self, filename: str, *args: Any, **kwargs: Any) -> None:
            Path(filename).write_text("plot")

        def close(self, *args: Any, **kwargs: Any) -> None:
            return None

    monkeypatch.setattr(analyse, "MATPLOTLIB_AVAILABLE", False)
    monkeypatch.setattr(analyse, "plt", _PlotStub())

    output = tmp_path / "chart.png"
    analyzer.save_performance_distribution(
        [{"performance_score": 80, "db_identifier": "db-1"}],
        filename=str(output),
    )
    assert output.exists()


@pytest.mark.unit
def test_save_performance_distribution_with_matplotlib(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    analyzer = _make_analyzer()

    class _PlotStub:
        def __init__(self) -> None:
            self.saved: Optional[str] = None

        def figure(self, *args: Any, **kwargs: Any) -> None:
            return None

        def hist(self, *args: Any, **kwargs: Any) -> None:
            return None

        def xlabel(self, *args: Any, **kwargs: Any) -> None:
            return None

        def ylabel(self, *args: Any, **kwargs: Any) -> None:
            return None

        def title(self, *args: Any, **kwargs: Any) -> None:
            return None

        def axvline(self, *args: Any, **kwargs: Any) -> None:
            return None

        def legend(self, *args: Any, **kwargs: Any) -> None:
            return None

        def grid(self, *args: Any, **kwargs: Any) -> None:
            return None

        def savefig(self, filename: str, *args: Any, **kwargs: Any) -> None:
            Path(filename).write_text("plot")
            self.saved = filename

        def close(self, *args: Any, **kwargs: Any) -> None:
            return None

    stub = _PlotStub()
    monkeypatch.setattr(analyse, "MATPLOTLIB_AVAILABLE", True)
    monkeypatch.setattr(analyse, "plt", stub)
    monkeypatch.setattr(analyse.logger, "info", lambda *args, **kwargs: None)
    monkeypatch.setattr(analyse.logger, "warning", lambda *args, **kwargs: None)

    output = tmp_path / "chart.png"
    analyzer.save_performance_distribution(
        [{"performance_score": 60}, {"performance_score": 90}],
        filename=str(output),
    )
    assert stub.saved == str(output)


@pytest.mark.unit
def test_main_handles_no_instances(monkeypatch: pytest.MonkeyPatch) -> None:
    class _AnalyzerStub:
        def analyze_all_instances(self) -> List[Dict[str, Any]]:
            return []

    monkeypatch.setattr(analyse, "RDSAnalyzer", lambda: _AnalyzerStub())
    warnings: List[str] = []
    monkeypatch.setattr(analyse.logger, "warning", lambda message: warnings.append(message))

    analyse.main()
    assert any("No RDS instances" in msg for msg in warnings)


@pytest.mark.unit
def test_main_exits_on_exception(monkeypatch: pytest.MonkeyPatch) -> None:
    class _AnalyzerStub:
        def analyze_all_instances(self) -> List[Dict[str, Any]]:
            raise RuntimeError("boom")

    monkeypatch.setattr(analyse, "RDSAnalyzer", lambda: _AnalyzerStub())

    exit_calls: List[int] = []

    def _fake_exit(code: int) -> None:
        exit_calls.append(code)
        raise SystemExit(code)

    monkeypatch.setattr(analyse.sys, "exit", _fake_exit)
    monkeypatch.setattr(analyse.logger, "error", lambda *args, **kwargs: None)

    with pytest.raises(SystemExit):
        analyse.main()

    assert exit_calls == [1]


@pytest.mark.unit
def test_main_success_path(monkeypatch: pytest.MonkeyPatch) -> None:
    class _AnalyzerStub:
        def __init__(self) -> None:
            self.calls: List[str] = []

        def analyze_all_instances(self) -> List[Dict[str, Any]]:
            self.calls.append("analyze")
            return [{"db_identifier": "db-1"}]

        def save_json_report(self, results: List[Dict[str, Any]]) -> None:
            self.calls.append("json")

        def save_rightsizing_csv(self, results: List[Dict[str, Any]]) -> None:
            self.calls.append("csv")

        def save_performance_distribution(self, results: List[Dict[str, Any]]) -> None:
            self.calls.append("chart")

        def generate_console_output(self, results: List[Dict[str, Any]]) -> None:
            self.calls.append("console")

    analyzer = _AnalyzerStub()
    monkeypatch.setattr(analyse, "RDSAnalyzer", lambda: analyzer)
    monkeypatch.setattr(analyse.logger, "info", lambda *args, **kwargs: None)
    monkeypatch.setattr(analyse.logger, "warning", lambda *args, **kwargs: None)

    analyse.main()
    assert analyzer.calls == ["analyze", "json", "csv", "chart", "console"]
