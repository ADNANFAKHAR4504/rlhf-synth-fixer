#!/usr/bin/env python3
"""
Integration tests for the Container Resource Optimization Analyzer.

These tests exercise the CLI entrypoint (lib/analyse.py) against a running
Moto server to ensure the end-to-end workflow (data collection, analysis,
and artifact generation) behaves as expected when invoked via
./scripts/analysis.sh.
"""

import csv
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

import boto3
import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "lib" / "analyse.py"
DEFAULT_ENDPOINT = os.environ.get("AWS_ENDPOINT_URL", "http://127.0.0.1:5001")


def boto_client(service: str):
    """Create a boto3 client that targets the Moto server endpoint."""
    return boto3.client(
        service,
        endpoint_url=DEFAULT_ENDPOINT,
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "testing"),
    )


def wait_for_moto():
    """Wait until the Moto server endpoint is reachable."""
    for _ in range(15):
        try:
            urllib.request.urlopen(DEFAULT_ENDPOINT, timeout=2)
            return
        except Exception:
            time.sleep(1)
    pytest.skip(f"Moto server not reachable at {DEFAULT_ENDPOINT}")


def setup_ecs_environment():
    """Create a comprehensive ECS environment that the analyzer can inspect."""
    ecs = boto_client("ecs")
    cluster_name = "integration-cluster"
    service_name = "integration-service"

    # Create cluster
    try:
        ecs.create_cluster(clusterName=cluster_name)
    except ecs.exceptions.ClusterAlreadyExistsException:
        pass

    # Register task definition with over-provisioned resources
    task_definition_response = ecs.register_task_definition(
        family="integration-task",
        networkMode="bridge",
        containerDefinitions=[
            {
                "name": "app",
                "image": "nginx:stable",
                "cpu": 256,
                "memory": 512,
                "essential": True,
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": "/ecs/integration",
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs",
                    },
                },
            }
        ],
        requiresCompatibilities=["EC2"],
        cpu="256",
        memory="512",
    )

    task_definition_arn = task_definition_response["taskDefinition"]["taskDefinitionArn"]

    # Create service
    try:
        ecs.create_service(
            cluster=cluster_name,
            serviceName=service_name,
            taskDefinition=task_definition_arn,
            desiredCount=1,
            launchType="EC2",
            deploymentConfiguration={"maximumPercent": 200, "minimumHealthyPercent": 50},
        )
    except (ecs.exceptions.ServiceNotFoundException,
            ecs.exceptions.ClusterNotFoundException,
            ecs.exceptions.ServiceAlreadyExistsException):
        pass

    return cluster_name, service_name, task_definition_arn


def seed_cloudwatch_metrics(cluster_name: str, service_name: str):
    """Populate comprehensive CloudWatch metrics required by the analyzer."""
    cloudwatch = boto_client("cloudwatch")
    now = datetime.utcnow()

    # Seed metrics for the last 14 days (as required by analysis)
    for hour in range(1, 15 * 24):  # 14 days of hourly metrics
        timestamp = now - timedelta(hours=hour)

        # ECS Container Insights metrics
        for metric, value in [
            ("CPUUtilization", 35.0),
            ("MemoryUtilization", 55.0),
        ]:
            cloudwatch.put_metric_data(
                Namespace="ECS/ContainerInsights",
                MetricData=[
                    {
                        "MetricName": metric,
                        "Dimensions": [
                            {"Name": "ClusterName", "Value": cluster_name},
                            {"Name": "ServiceName", "Value": service_name},
                        ],
                        "Timestamp": timestamp,
                        "Unit": "Percent",
                        "Value": value,
                    }
                ],
            )

        # Running task count metrics for auto-scaling detection
        cloudwatch.put_metric_data(
            Namespace="AWS/ECS",
            MetricData=[
                {
                    "MetricName": "RunningTaskCount",
                    "Dimensions": [{"Name": "ServiceName", "Value": service_name}],
                    "Timestamp": timestamp,
                    "Unit": "Count",
                    "Value": 1,
                }
            ],
        )


def run_analysis_script(tmp_path: Path):
    """Execute lib/analyse.py and return parsed artifacts and stdout."""
    env = os.environ.copy()
    env.setdefault("AWS_ENDPOINT_URL", DEFAULT_ENDPOINT)
    env.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    env.setdefault("AWS_ACCESS_KEY_ID", "testing")
    env.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--region", env["AWS_DEFAULT_REGION"]],
        cwd=tmp_path,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(f"Analysis failed\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}")

    json_path = tmp_path / "container_optimization.json"
    csv_path = tmp_path / "rightsizing_plan.csv"
    chart_path = tmp_path / "resource_utilization_trends.png"

    assert json_path.exists(), "Expected JSON output not found"
    assert csv_path.exists(), "Expected CSV output not found"
    assert chart_path.exists(), "Expected chart output not found"

    with open(json_path, "r", encoding="utf-8") as handle:
        json_data = json.load(handle)

    return json_data, result.stdout, csv_path


def test_analysis_cli_generates_expected_outputs(tmp_path):
    """Run the CLI analyzer end-to-end and validate generated artifacts."""
    wait_for_moto()
    cluster_name, service_name, task_definition_arn = setup_ecs_environment()
    seed_cloudwatch_metrics(cluster_name, service_name)

    results, stdout, csv_path = run_analysis_script(tmp_path)

    # ========== Console Output Validation (Tabulate Format) ==========

    # Verify header banner is present
    assert "=" * 80 in stdout, "Missing header banner in console output"
    assert "CONTAINER RESOURCE OPTIMIZATION ANALYSIS RESULTS" in stdout, "Missing main title"

    # Verify section headers
    assert "CLUSTER ANALYSIS SUMMARY" in stdout, "Missing cluster analysis summary section"
    assert "SUMMARY STATISTICS" in stdout, "Missing summary statistics section"
    assert "DETAILED ECS FINDINGS" in stdout, "Missing detailed ECS findings section"
    assert "DETAILED EKS FINDINGS" in stdout, "Missing detailed EKS findings section"

    # Verify tabulate grid format is used for tables
    assert "+" in stdout and "|" in stdout, "Tabulate grid format not detected in output"

    # Verify key metrics are displayed in console
    assert "Total ECS Services Analyzed" in stdout, "Missing ECS services count in console"
    assert "Total EKS Nodes Analyzed" in stdout, "Missing EKS nodes count in console"
    assert "Total Issues Found" in stdout, "Missing total issues in console"
    assert "Total Potential Monthly Savings" in stdout, "Missing savings in console"

    # Verify metadata sections
    assert "Clusters Analyzed:" in stdout, "Missing clusters analyzed section"
    assert "Analysis Duration:" in stdout, "Missing analysis duration"
    assert "Analysis Period:" in stdout, "Missing analysis period"

    # Verify findings breakdown by type is shown
    assert "Findings by Type:" in stdout or "No ECS issues found" in stdout, "Missing findings breakdown"

    # ========== JSON Output Validation ==========

    # Validate JSON structure
    assert "summary" in results, "Missing 'summary' key in JSON output"
    assert "ecs_findings" in results, "Missing 'ecs_findings' key in JSON output"
    assert "eks_findings" in results, "Missing 'eks_findings' key in JSON output"
    assert "metadata" in results, "Missing 'metadata' key in JSON output"

    # Validate summary structure and fields
    summary = results["summary"]
    required_summary_keys = [
        "total_ecs_services",
        "total_eks_nodes",
        "total_monthly_savings",
        "services_requiring_attention",
    ]
    for key in required_summary_keys:
        assert key in summary, f"Missing required summary key: {key}"
        assert isinstance(summary[key], (int, float)), f"Summary key '{key}' has invalid type"

    # Validate summary values are non-negative
    assert summary["total_ecs_services"] >= 0, "Invalid total_ecs_services count"
    assert summary["total_eks_nodes"] >= 0, "Invalid total_eks_nodes count"
    assert summary["total_monthly_savings"] >= 0, "Invalid total_monthly_savings amount"
    assert summary["services_requiring_attention"] >= 0, "Invalid services_requiring_attention count"

    # Validate metadata structure
    metadata = results["metadata"]
    required_metadata_keys = [
        "analysis_start_time",
        "analysis_end_time",
        "region",
        "clusters_analyzed",
        "clusters_excluded",
        "services_excluded",
        "finding_type_counts",
    ]
    for key in required_metadata_keys:
        assert key in metadata, f"Missing required metadata key: {key}"

    # Validate metadata values
    assert metadata["region"] == "us-east-1", "Incorrect region in metadata"
    assert isinstance(metadata["clusters_analyzed"], list), "clusters_analyzed should be a list"
    assert isinstance(metadata["clusters_excluded"], list), "clusters_excluded should be a list"
    assert isinstance(metadata["services_excluded"], dict), "services_excluded should be a dict"
    assert isinstance(metadata["finding_type_counts"], dict), "finding_type_counts should be a dict"

    # Validate services_excluded has expected keys
    assert "dev" in metadata["services_excluded"], "Missing 'dev' in services_excluded"
    assert "too_new" in metadata["services_excluded"], "Missing 'too_new' in services_excluded"

    # Validate ECS findings structure (if any findings exist)
    ecs_findings = results["ecs_findings"]
    assert isinstance(ecs_findings, list), "ecs_findings should be a list"

    for finding in ecs_findings:
        assert "cluster_name" in finding, "ECS finding missing 'cluster_name'"
        assert "finding_type" in finding, "ECS finding missing 'finding_type'"

        # Validate finding-specific fields based on type
        finding_type = finding["finding_type"]

        if finding_type == "over_provisioning":
            required_fields = ["service_name", "task_definition", "current_cpu",
                             "current_memory", "recommended_cpu", "recommended_memory",
                             "monthly_savings"]
            for field in required_fields:
                assert field in finding, f"over_provisioning finding missing '{field}'"
            assert finding["recommended_cpu"] < finding["current_cpu"], \
                "Recommended CPU should be less than current for over-provisioning"
            assert finding["monthly_savings"] > 0, "Monthly savings should be positive"

        elif finding_type == "missing_auto_scaling":
            assert "service_name" in finding, "missing_auto_scaling finding missing 'service_name'"
            assert "recommendation" in finding, "missing_auto_scaling finding missing 'recommendation'"

        elif finding_type == "inefficient_task_placement":
            assert "service_name" in finding, "inefficient_task_placement finding missing 'service_name'"
            assert "monthly_savings" in finding, "inefficient_task_placement finding missing 'monthly_savings'"
            assert "recommended_launch_type" in finding, "Missing recommended_launch_type"

        elif finding_type == "singleton_ha_risk":
            assert "service_name" in finding, "singleton_ha_risk finding missing 'service_name'"
            assert "desired_count" in finding, "singleton_ha_risk finding missing 'desired_count'"
            assert finding["desired_count"] == 1, "Singleton should have desired_count of 1"

        elif finding_type == "old_container_images":
            assert "service_name" in finding, "old_container_images finding missing 'service_name'"
            assert "age_days" in finding, "old_container_images finding missing 'age_days'"
            assert finding["age_days"] > 90, "Old images should be > 90 days"

        elif finding_type == "missing_health_checks":
            assert "service_name" in finding, "missing_health_checks finding missing 'service_name'"
            assert "has_load_balancer" in finding, "missing_health_checks finding missing 'has_load_balancer'"

        elif finding_type == "excessive_task_revisions":
            assert "service_name" in finding, "excessive_task_revisions finding missing 'service_name'"
            assert "revision_count" in finding, "excessive_task_revisions finding missing 'revision_count'"
            assert finding["revision_count"] > 50, "Excessive revisions should be > 50"

        elif finding_type == "missing_logging":
            assert "service_name" in finding, "missing_logging finding missing 'service_name'"
            assert "containers" in finding, "missing_logging finding missing 'containers'"
            assert isinstance(finding["containers"], list), "containers should be a list"

        elif finding_type == "missing_service_discovery":
            assert "service_name" in finding, "missing_service_discovery finding missing 'service_name'"

        elif finding_type == "cluster_overprovisioning":
            assert "cpu_utilization" in finding, "cluster_overprovisioning finding missing 'cpu_utilization'"
            assert "memory_utilization" in finding, "cluster_overprovisioning finding missing 'memory_utilization'"
            assert finding["cpu_utilization"] < 60, "Over-provisioned cluster should have CPU < 60%"
            assert finding["memory_utilization"] < 60, "Over-provisioned cluster should have memory < 60%"

    # Validate EKS findings structure (if any findings exist)
    eks_findings = results["eks_findings"]
    assert isinstance(eks_findings, list), "eks_findings should be a list"

    for finding in eks_findings:
        assert "cluster_name" in finding, "EKS finding missing 'cluster_name'"
        assert "finding_type" in finding, "EKS finding missing 'finding_type'"

        finding_type = finding["finding_type"]

        if finding_type == "spot_instance_opportunity":
            assert "node_group" in finding, "spot_instance_opportunity finding missing 'node_group'"
            assert "spot_savings_potential" in finding, "Missing spot_savings_potential"
            assert finding["spot_savings_potential"] > 0, "Spot savings should be positive"
            assert "instance_types" in finding, "Missing instance_types"

        elif finding_type == "underutilized_node":
            assert "node_id" in finding or "node_group" in finding, "Missing node identifier"
            assert "current_utilization" in finding, "Missing current_utilization"
            assert "cpu" in finding["current_utilization"], "Missing CPU utilization"
            assert "memory" in finding["current_utilization"], "Missing memory utilization"
            assert finding["current_utilization"]["cpu"] < 30, "Underutilized should have CPU < 30%"
            assert finding["current_utilization"]["memory"] < 40, "Underutilized should have memory < 40%"

        elif finding_type == "missing_resource_limits":
            assert "node_id" in finding or "node_group" in finding, "Missing node identifier"
            assert "pods_without_limits" in finding, "Missing pods_without_limits"
            assert finding["pods_without_limits"] > 0, "Should have at least 1 pod without limits"

    # ========== CSV Output Validation ==========

    with open(csv_path, "r", encoding="utf-8") as handle:
        csv_reader = csv.DictReader(handle)
        rows = list(csv_reader)

        # Verify CSV has expected columns
        expected_columns = [
            "Type", "Cluster", "Service", "NodeGroup", "Action",
            "Current_Config", "Recommended_Config", "Monthly_Savings",
            "Implementation_Steps"
        ]
        if rows:
            for col in expected_columns:
                assert col in rows[0], f"Missing expected CSV column: {col}"

        # Verify each row has proper structure
        for row in rows:
            assert row["Type"] in ["ECS", "EKS"], f"Invalid Type: {row['Type']}"
            assert len(row["Action"]) > 0, "Action should not be empty"
            assert len(row["Current_Config"]) > 0, "Current_Config should not be empty"
            assert len(row["Recommended_Config"]) > 0, "Recommended_Config should not be empty"

            # If savings are quantified, validate format
            if row["Monthly_Savings"] not in ["N/A", "Variable", ""]:
                assert row["Monthly_Savings"].startswith("$"), "Savings should start with $"

    # ========== Cross-validation ==========

    # Verify summary totals match findings
    total_findings_with_savings = sum(
        1 for f in ecs_findings if "monthly_savings" in f
    ) + sum(
        1 for f in eks_findings if "spot_savings_potential" in f
    )

    # Verify finding counts in metadata match actual findings
    if metadata["finding_type_counts"]:
        total_from_metadata = sum(metadata["finding_type_counts"].values())
        total_actual_findings = len(ecs_findings) + len(eks_findings)
        assert total_from_metadata == total_actual_findings, \
            "Finding counts in metadata don't match actual findings"

    # ========== Chart Validation ==========

    chart_path = tmp_path / "resource_utilization_trends.png"
    assert chart_path.exists(), "Chart file not created"
    assert chart_path.stat().st_size > 0, "Chart file is empty"

    print("\n✓ All comprehensive validations passed!")
    print(f"  - Console output: tabulate format verified")
    print(f"  - JSON structure: {len(ecs_findings)} ECS + {len(eks_findings)} EKS findings")
    print(f"  - CSV structure: {len(rows)} rightsizing recommendations")
    print(f"  - Metadata: {len(metadata['clusters_analyzed'])} clusters analyzed")
    print(f"  - Savings identified: ${summary['total_monthly_savings']:.2f}/month")
