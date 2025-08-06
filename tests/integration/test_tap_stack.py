import pytest
import subprocess
import json
import os
import requests

PULUMI_STACK_NAME = os.environ.get("PULUMI_STACK_NAME", "TapStackpr558")


@pytest.fixture(scope="session")
def pulumi_outputs():
  """Fetch Pulumi outputs as a Python dictionary."""
  try:
    result = subprocess.run(
        ["pulumi", "stack", "output", "--json", "--stack", PULUMI_STACK_NAME],
        capture_output=True, text=True, check=True
    )
    outputs = json.loads(result.stdout)
    return outputs
  except subprocess.CalledProcessError as e:
    pytest.fail(f"Pulumi command failed: {e.stderr}")
  except json.JSONDecodeError as e:
    pytest.fail(f"Could not parse Pulumi output: {e}")


def test_api_gateway_response_contains_jane_doe(pulumi_outputs):
  """Checks if Jane Doe is present in the API Gateway response"""
  api_url = pulumi_outputs.get("api_gateway_address")
  assert api_url, "Missing 'api_gateway_address' in Pulumi outputs."

  # Optional: append /users/<id> or /health if needed
  full_url = f"{api_url}/users"

  response = requests.get(full_url)
  assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"

  json_data = response.json()

  assert "data" in json_data, "Missing 'data' in response."
  assert json_data["data"].get(
      "name") == "Jane Doe", "'Jane Doe' not found in API response"
