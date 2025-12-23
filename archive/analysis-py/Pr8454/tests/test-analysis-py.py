#!/usr/bin/env python3
"""
REQUIRED Mock Configuration Setup for AWS RDS Analysis Testing
================================================================

These tests validate the behaviour of ``lib/analyse.py`` against mocked AWS
RDS environments. Follow this framework exactly when adding new scenarios:

1. Environment Configuration
   - Ensure ``AWS_ENDPOINT_URL`` points at a Moto server (see scripts/analysis.sh)
   - Configure ``AWS_DEFAULT_REGION``, ``AWS_ACCESS_KEY_ID``, ``AWS_SECRET_ACCESS_KEY``
   - Use the helper ``boto_client`` to guarantee consistent clients

2. Mock Resource Setup
   - Isolate resources with unique DB identifiers per issue category
   - Use ``cleanup_rds_instances`` (invoked via fixture) to maintain idempotency
   - Seed CloudWatch metrics with ``seed_cloudwatch_metric`` for behavioural tests
   - Attach tags that the analysis relies on (Environment, DataClassification, etc.)

3. Test Execution
   - Call the targeted setup helper (e.g., ``setup_underutilized_instance``)
   - Execute the analysis via ``run_analysis_script``
   - Assert on ``aws_audit_results.json`` contents:
       * Section presence (summary/instances)
       * Specific instance level issues and severities
       * Derived metrics (e.g., issue counts) when applicable

Reference: ``archive/analysis-py/Pr6246/tests/test-analysis-lambda.py`` demonstrates
the required structure, isolation, and validation depth for IaC analysis suites.
"""

import contextlib
import io
import json
import os
import runpy
import subprocess
import sys
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

import boto3
import pytest


DEFAULT_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
MASTER_USERNAME = os.environ.get("TEST_DB_USERNAME", "analysis_admin")
MASTER_PASSWORD = os.environ.get("TEST_DB_PASSWORD", "Sup3rSecret!")


def boto_client(service: str):
    """Create a boto3 client that honours the local Moto endpoint when configured."""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=DEFAULT_REGION,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "testing"),
    )


def cleanup_rds_instances() -> None:
    """Delete every DB instance created by the tests to keep runs idempotent."""
    rds = boto_client("rds")
    try:
        instances = rds.describe_db_instances().get("DBInstances", [])
    except rds.exceptions.DBInstanceNotFoundFault:
        return

    for instance in instances:
        rds.delete_db_instance(
            DBInstanceIdentifier=instance["DBInstanceIdentifier"],
            SkipFinalSnapshot=True,
            DeleteAutomatedBackups=True,
        )

    # Give Moto a moment to finalise deletions before the next test provisions data
    time.sleep(0.2)


@pytest.fixture(autouse=True)
def isolated_rds_environment():
    """Ensure each test starts with a clean slate."""
    cleanup_rds_instances()
    yield


def create_rds_instance(
    identifier: str,
    overrides: Optional[Dict] = None,
    tags: Optional[List[Dict[str, str]]] = None,
) -> str:
    """Create an RDS instance with sensible defaults and optional overrides."""
    rds = boto_client("rds")
    payload = {
        "DBInstanceIdentifier": identifier,
        "DBInstanceClass": "db.m5.large",
        "Engine": "postgres",
        "EngineVersion": "15.5",
        "AllocatedStorage": 100,
        "MasterUsername": MASTER_USERNAME,
        "MasterUserPassword": MASTER_PASSWORD,
        "BackupRetentionPeriod": 7,
        "MultiAZ": True,
        "StorageEncrypted": True,
    }
    if overrides:
        payload.update(overrides)
    if tags:
        payload["Tags"] = tags

    try:
        rds.create_db_instance(**payload)
    except rds.exceptions.DBInstanceAlreadyExistsFault:
        rds.delete_db_instance(
            DBInstanceIdentifier=identifier,
            SkipFinalSnapshot=True,
            DeleteAutomatedBackups=True,
        )
        time.sleep(0.2)
        rds.create_db_instance(**payload)
    return identifier


def seed_cloudwatch_metric(db_identifier: str, metric_name: str, value: float, unit: str = "Percent"):
    """Publish a single datapoint for the supplied metric."""
    cloudwatch = boto_client("cloudwatch")
    cloudwatch.put_metric_data(
        Namespace="AWS/RDS",
        MetricData=[
            {
                "MetricName": metric_name,
                "Timestamp": datetime.now(timezone.utc),
                "Value": value,
                "Unit": unit,
                "Dimensions": [{"Name": "DBInstanceIdentifier", "Value": db_identifier}],
            }
        ],
    )


def setup_underutilized_instance() -> str:
    """Provision a large instance with idle CPU/connections to trigger rightsizing."""
    identifier = create_rds_instance(
        "db-underutilized-e2e",
        overrides={"DBInstanceClass": "db.m5.2xlarge"},
        tags=[{"Key": "Environment", "Value": "dev"}],
    )
    seed_cloudwatch_metric(identifier, "CPUUtilization", 10.0)
    seed_cloudwatch_metric(identifier, "DatabaseConnections", 5.0, unit="Count")
    return identifier


def setup_backup_disabled_instance() -> str:
    """Provision an instance with backups explicitly disabled."""
    return create_rds_instance(
        "db-no-backups-e2e",
        overrides={"BackupRetentionPeriod": 0},
    )


def setup_production_single_az_instance() -> str:
    """Create a production-tagged instance without Multi-AZ protection."""
    return create_rds_instance(
        "db-prod-single-az",
        overrides={"MultiAZ": False},
        tags=[{"Key": "Environment", "Value": "production"}],
    )


def setup_sensitive_unencrypted_instance() -> str:
    """Create a sensitive workload without storage encryption to trigger a critical issue."""
    return create_rds_instance(
        "db-sensitive-plain",
        overrides={"StorageEncrypted": False},
        tags=[{"Key": "DataClassification", "Value": "Sensitive"}],
    )


def run_analysis_script():
    """Execute the RDS analysis script and return the parsed JSON output."""
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "aws_audit_results.json")

    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    run_in_process = env.get("RUN_ANALYSIS_IN_PROCESS", "1") == "1"

    if run_in_process:
        stdout_buffer = io.StringIO()
        stderr_buffer = io.StringIO()
        with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
            runpy.run_path(script, run_name="__main__")
        completed_stdout = stdout_buffer.getvalue()
        completed_stderr = stderr_buffer.getvalue()
    else:
        completed = subprocess.run(
            [sys.executable, script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
        )
        completed_stdout = completed.stdout
        completed_stderr = completed.stderr

    if not os.path.exists(json_output):
        print(f"STDOUT: {completed_stdout}")
        print(f"STDERR: {completed_stderr}")
        raise AssertionError("Analysis script did not generate aws_audit_results.json")

    with open(json_output, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _find_instance(results: Dict, identifier: str) -> Optional[Dict]:
    """Fetch a single instance entry from the JSON payload."""
    for instance in results.get("instances", []):
        if instance.get("db_identifier") == identifier:
            return instance
    return None


def _issue_types(instance: Dict) -> List[str]:
    return [issue.get("type") for issue in instance.get("issues", [])]


def test_underutilized_instance_detection():
    """The analysis should flag large but idle instances for downsizing."""
    identifier = setup_underutilized_instance()

    results = run_analysis_script()
    instance = _find_instance(results, identifier)

    assert instance is not None, "Underutilized instance missing from report"
    assert "underutilized" in _issue_types(instance), "Expected underutilized issue type"
    assert instance["cost_optimization"]["recommended_class"] != instance["instance_class"]


def test_backup_retention_is_enforced():
    """Instances with disabled automated backups must be marked critical."""
    identifier = setup_backup_disabled_instance()

    results = run_analysis_script()
    instance = _find_instance(results, identifier)

    assert instance is not None, "No-backup instance missing from report"
    issues = [issue for issue in instance.get("issues", []) if issue.get("type") == "no_automated_backups"]
    assert issues, "Expected no_automated_backups issue"
    assert any(issue.get("severity") == "critical" for issue in issues)


def test_production_instances_require_multi_az():
    """Production-tagged databases must enforce Multi-AZ deployments."""
    identifier = setup_production_single_az_instance()

    results = run_analysis_script()
    instance = _find_instance(results, identifier)

    assert instance is not None, "Production instance missing from report"
    assert "missing_multi_az" in _issue_types(instance), "Expected missing_multi_az issue"


def test_sensitive_workloads_require_encryption():
    """Sensitive datasets must highlight encryption gaps as critical issues."""
    identifier = setup_sensitive_unencrypted_instance()

    results = run_analysis_script()
    instance = _find_instance(results, identifier)

    assert instance is not None, "Sensitive instance missing from report"
    issues = [issue for issue in instance.get("issues", []) if issue.get("type") == "no_encryption"]
    assert issues, "Expected no_encryption issue"
    assert all(issue.get("severity") == "critical" for issue in issues)

    # Ensure summary exists for downstream dashboards
    assert "summary" in results, "Summary section missing from audit output"
    assert results["summary"]["total_instances"] >= 1, "Summary total should reflect analyzed instances"


def test_console_demo_data_available():
    """Provision demo instances that remain for manual analysis console runs."""
    identifiers = [
        setup_underutilized_instance(),
        setup_backup_disabled_instance(),
        setup_production_single_az_instance(),
        setup_sensitive_unencrypted_instance(),
    ]

    rds = boto_client("rds")
    dbs = {db["DBInstanceIdentifier"] for db in rds.describe_db_instances().get("DBInstances", [])}

    for identifier in identifiers:
        assert identifier in dbs, f"{identifier} missing from Moto RDS dataset"
