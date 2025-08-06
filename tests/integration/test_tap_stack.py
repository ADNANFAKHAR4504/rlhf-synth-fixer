import pytest
import subprocess
import json
import os
import urllib.request
import urllib.error

PULUMI_STACK_NAME = os.environ.get("PULUMI_STACK_NAME", "TapStackpr558")

# Define your deployment stage explicitly (e.g., "dev", "staging", etc.)
API_STAGE = os.environ.get("API_STAGE", "dev")  # default to "dev"


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
  base_url = pulumi_outputs.get("api_gateway_address")
  assert base_url, "Missing 'api_gateway_address' in Pulumi outputs."

  # Construct full URL manually with /<stage>/users
  full_url = f"{base_url.rstrip('/')}/dev/users"

  try:
    with urllib.request.urlopen(full_url) as response:
      assert response.status == 200, f"Expected 200 OK but got {response.status}"
      body = response.read().decode("utf-8")
      json_data = json.loads(body)
  except urllib.error.HTTPError as e:
    pytest.fail(f"HTTP error occurred: {e.code} - {e.reason}")
  except urllib.error.URLError as e:
    pytest.fail(f"URL error occurred: {e.reason}")
  except json.JSONDecodeError:
    pytest.fail("Response body is not valid JSON")

  assert "data" in json_data, "Missing 'data' in response."
  assert json_data["data"].get(
      "name") == "Jane Doe", "'Jane Doe' not found in API response"
