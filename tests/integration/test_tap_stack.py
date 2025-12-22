import json
import os
import pytest
import requests
import boto3

# Constants
EXPECTED_ENV = "Production"

# Load outputs from flat-outputs.json


@pytest.fixture(scope="session")
def outputs():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    flat_outputs_path = os.path.join(
        base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
    )

    if not os.path.exists(flat_outputs_path):
        pytest.fail(f"Missing outputs file at {flat_outputs_path}")

    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture(scope="session")
def logs():
    return boto3.client('logs', region_name='us-east-1')


def test_environment_tag(outputs):
    assert outputs.get("Environment") == EXPECTED_ENV, "Environment tag mismatch"


def test_lambda_function_exists(outputs):
    lambda_name = outputs.get("LambdaFunctionName")
    assert lambda_name, "Missing LambdaFunctionName in outputs"
    assert lambda_name.startswith(
        "StatusHandler-"), f"Unexpected Lambda name: {lambda_name}"


def test_status_endpoint(outputs):
    url = outputs.get("ApiEndpoint") or outputs.get(
        "ProductionServicepr277EndpointE6F7572B")
    assert url, "No status endpoint URL found in outputs"

    resp = requests.get(url.rstrip("/") + "/status", timeout=5)
    assert resp.status_code == 200, f"Unexpected status code: {resp.status_code}"

    data = resp.json()
    assert "message" in data
    assert "environment" in data
    assert data["environment"] == EXPECTED_ENV


def test_api_version_output(outputs):
    version = outputs.get("ApiVersion")
    if not version:
        pytest.skip("ApiVersion not found in outputs")

    assert version.startswith("v"), f"Version does not start with 'v': {version}"
    assert len(version) > 1


def test_lambda_log_group_exists(outputs, logs):
    log_group = outputs.get("LambdaLogGroup")
    if not log_group:
        pytest.skip("LambdaLogGroup not found in outputs")

    response = logs.describe_log_groups(logGroupNamePrefix=log_group)
    log_groups = response.get("logGroups", [])

    assert any(
        g["logGroupName"] == log_group for g in log_groups
    ), f"Log group {log_group} not found"