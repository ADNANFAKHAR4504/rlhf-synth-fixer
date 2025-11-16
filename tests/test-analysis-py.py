#!/usr/bin/env python3
"""
Integration tests for the Container Resource Optimization Analyzer.

These tests exercise the CLI entrypoint (lib/analyse.py) against a running
Moto server to ensure the end-to-end workflow (data collection, analysis,
and artifact generation) behaves as expected when invoked via
./scripts/analysis.sh.
"""

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


def moto_client(service: str):
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
    """Create a minimal ECS environment that the analyzer can inspect."""
    ecs = moto_client("ecs")
    cluster_name = "integration-cluster"
    service_name = "integration-service"

    try:
        ecs.create_cluster(clusterName=cluster_name)
    except ecs.exceptions.ClusterAlreadyExistsException:
        pass

    task_definition = ecs.register_task_definition(
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
    )["taskDefinition"]["taskDefinitionArn"]

    try:
        ecs.create_service(
            cluster=cluster_name,
            serviceName=service_name,
            taskDefinition=task_definition,
            desiredCount=1,
            launchType="EC2",
            deploymentConfiguration={"maximumPercent": 200, "minimumHealthyPercent": 50},
        )
    except ecs.exceptions.ServiceNotFoundException:
        pass
    except ecs.exceptions.ClusterNotFoundException:
        pass
    except ecs.exceptions.ServiceAlreadyExistsException:
        pass

    return cluster_name, service_name


def seed_cloudwatch_metrics(cluster_name: str, service_name: str):
    """Populate minimal CloudWatch metrics required by the analyzer."""
    cloudwatch = moto_client("cloudwatch")
    now = datetime.utcnow()

    for hour in range(1, 5):
        timestamp = now - timedelta(hours=hour)
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
    cluster_name, service_name = setup_ecs_environment()
    seed_cloudwatch_metrics(cluster_name, service_name)

    results, stdout, csv_path = run_analysis_script(tmp_path)

    assert "CONTAINER RESOURCE OPTIMIZATION ANALYSIS RESULTS" in stdout
    assert "summary" in results
    summary = results["summary"]
    for key in [
        "total_ecs_services",
        "total_eks_nodes",
        "total_monthly_savings",
        "services_requiring_attention",
    ]:
        assert key in summary

    with open(csv_path, "r", encoding="utf-8") as handle:
        header = handle.readline().strip()
        assert "Type" in header
        assert "Action" in header
