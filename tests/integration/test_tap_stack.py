import json
import os
import pytest
import requests
from pytest import mark


# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

outputs = json.loads(flat_outputs)

EXPECTED_ENV = "Production"


@pytest.fixture(scope="session")
def check_stack_have_outputs_and_correct_tag():
  assert outputs.get("Environment") == EXPECTED_ENV


def test_lambda_function_exists(outputs):
  lambda_name = outputs.get("LambdaFunctionName")
  assert lambda_name and lambda_name.startswith("StatusHandler-")


def test_status_endpoint(outputs):
  url = outputs.get("ApiEndpoint") or outputs.get(
      "ProductionServicepr277EndpointE6F7572B")
  assert url
  resp = requests.get(url.rstrip("/") + "/status", timeout=5)
  assert resp.status_code == 200

  data = resp.json()
  assert "message" in data
  assert "environment" in data
  assert data["environment"] == "Production"


def test_health_check_endpoint(outputs):
  if "HealthCheckEndpoint" in outputs:
    url = outputs["HealthCheckEndpoint"]
    resp = requests.get(url, timeout=5)
    assert resp.status_code == 200


def test_api_version_output(outputs):
  if "ApiVersion" in outputs:
    assert outputs["ApiVersion"].startswith("v")
    assert len(outputs["ApiVersion"]) > 1


def test_lambda_log_group_exists(outputs):
  log_group = outputs.get("LambdaLogGroup")
  if log_group:
    response = logs.describe_log_groups(logGroupNamePrefix=log_group)
    assert any(
        g["logGroupName"] == log_group for g in response.get(
            "logGroups", []))
