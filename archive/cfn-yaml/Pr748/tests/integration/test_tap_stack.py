import subprocess
import json
import os
import urllib.request
import urllib.error
import pytest

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
  print("""
  Integration Test: API Gateway → Lambda → RDS End-to-End Flow

  This test validates the complete integration between all system components:

  AUTOMATED TEST REQUIREMENTS COVERAGE:
  ✓ API Gateway endpoint responds successfully (HTTP 200 status check)
  ✓ Lambda retrieves data from RDS correctly (validates Jane Doe data returned)

  TEST FLOW:
  1. Sends a GET request to the API Gateway domain endpoint
  2. API Gateway triggers the Lambda function upon receiving the request
  3. Lambda function performs the following operations:
     - Creates a table in the RDS database (if not exists)
     - Adds a row with user data (Jane Doe) to the RDS table
     - Fetches the added row from the RDS table
     - Returns the retrieved data as JSON response
  4. Test validates that the response contains the expected Jane Doe data

  This comprehensive test ensures:
  - API Gateway is properly configured and accessible
  - Lambda function is correctly deployed and can be triggered
  - Lambda has proper permissions to connect to RDS
  - RDS database is accessible and functional
  - Complete data flow from API → Lambda → RDS → Lambda → API works correctly
  """)
  # Get the API Gateway base URL from Pulumi deployment outputs
  base_url = pulumi_outputs.get("api_gateway_address")
  assert base_url, "Missing 'api_gateway_address' in Pulumi outputs."

  # Construct full URL manually with /<stage>/users endpoint
  # This endpoint will trigger the Lambda function when accessed
  full_url = f"{base_url.rstrip('/')}/dev/users"

  try:
    # Send GET request to API Gateway domain
    # This request will:
    # 1. Hit the API Gateway endpoint
    # 2. Trigger the Lambda function execution
    # 3. Lambda will create RDS table, insert data, and fetch it back
    with urllib.request.urlopen(full_url) as response:
      # Verify API Gateway endpoint responds successfully (requirement 1)
      assert response.status == 200, f"Expected 200 OK but got {response.status}"

      # Read the response body containing data retrieved from RDS
      body = response.read().decode("utf-8")
      json_data = json.loads(body)

  except urllib.error.HTTPError as e:
    pytest.fail(f"HTTP error occurred: {e.code} - {e.reason}")
  except urllib.error.URLError as e:
    pytest.fail(f"URL error occurred: {e.reason}")
  except json.JSONDecodeError:
    pytest.fail("Response body is not valid JSON")

  # Validate the response structure and content
  assert "data" in json_data, "Missing 'data' in response."

  # Verify Lambda retrieves data from RDS correctly (requirement 2)
  # If Jane Doe data is present, it confirms:
  # - Lambda successfully connected to RDS
  # - Lambda created the table in RDS
  # - Lambda inserted the Jane Doe record
  # - Lambda fetched the record back from RDS
  # - Complete end-to-end data flow is working
  assert json_data["data"].get(
      "name") == "Jane Doe", "'Jane Doe' not found in API response"
