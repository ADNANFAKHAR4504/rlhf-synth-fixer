import subprocess
import json
import os
import boto3
import pytest
from botocore.exceptions import ClientError

PULUMI_STACK_NAME = os.environ.get("PULUMI_STACK_NAME", "TapStackpr905")
# AWS region for Lambda invocation
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")


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


@pytest.fixture(scope="session")
def lambda_client():
  """Create AWS Lambda client for function invocation."""
  return boto3.client('lambda', region_name=AWS_REGION)


def test_vpc_connectivity_via_lambda_ping(pulumi_outputs, lambda_client):
  print("""
  Integration Test: Multi-Region VPC Connectivity via Lambda RDS Ping

  This test validates the complete multi-region VPC peering connectivity:

  AUTOMATED TEST REQUIREMENTS COVERAGE:
  ✓ VPC peering connection is established between us-east-1 and us-west-2
  ✓ Route tables are properly configured for cross-VPC communication
  ✓ Security groups allow cross-VPC RDS connectivity
  ✓ Lambda function can reach RDS endpoint across VPC boundaries
  ✓ Network connectivity between regions is functional

  TEST FLOW:
  1. Retrieves Lambda function ARN from Pulumi deployment outputs
  2. Invokes Lambda function without payload (Lambda has all required configuration)
  3. Lambda function performs the following operations:
     - Attempts to establish connection to RDS endpoint in the peered VPC
     - Makes HTTP/TCP ping requests to verify reachability
     - Tests network connectivity across VPC peering connection
     - Returns connectivity status and response metrics
  4. Test validates that the response indicates successful connectivity

  This comprehensive test ensures:
  - VPC peering connection is properly established and active
  - Route tables have correct routes for cross-VPC communication
  - Security groups allow the necessary traffic between VPCs
  - Lambda function has proper network access and permissions
  - RDS database is accessible from Lambda in the peered VPC
  - Complete multi-region network infrastructure is functional
  """)

  # Get the Lambda function ARN from Pulumi deployment outputs
  # This should be the connectivity test Lambda function deployed in us-east-1
  lambda_arn = pulumi_outputs.get("us_east_lambda_arn")
  assert lambda_arn, "Missing 'us_east_lambda_arn' in Pulumi outputs."

  print(f"Testing connectivity using Lambda: {lambda_arn}")
  print("Lambda function has all required configuration internally")

  try:
    print("Invoking Lambda function to test VPC connectivity...")

    # Invoke the Lambda function without any payload
    # Lambda has all the required configuration internally
    response = lambda_client.invoke(
        FunctionName=lambda_arn,
        InvocationType='RequestResponse'  # Synchronous invocation
    )

    # Verify Lambda invocation was successful
    assert response[
        'StatusCode'] == 200, f"Lambda invocation failed with status: {response['StatusCode']}"

    # Parse the Lambda response payload
    response_payload = json.loads(response['Payload'].read().decode('utf-8'))

    print(
        f"Lambda execution response: {json.dumps(response_payload, indent=2)}")

  except ClientError as e:
    pytest.fail(f"AWS Lambda client error: {e}")
  except json.JSONDecodeError as e:
    pytest.fail(f"Could not parse Lambda response: {e}")
  except Exception as e:
    pytest.fail(f"Unexpected error during Lambda invocation: {e}")

  # Validate the Lambda response structure
  assert 'statusCode' in response_payload, "Missing 'statusCode' in Lambda response"
  assert 'body' in response_payload, "Missing 'body' in Lambda response"

  # Parse the body which contains the actual connectivity test results
  try:
    body_data = json.loads(response_payload['body'])
  except json.JSONDecodeError:
    pytest.fail("Lambda response body is not valid JSON")

  # Verify VPC connectivity test was successful (requirement validation)
  # If reachable is True, it confirms:
  # - VPC peering connection is active and routing traffic
  # - Route tables have correct routes for cross-VPC communication
  # - Security groups allow Lambda to RDS connectivity
  # - Network path from us-east-1 Lambda to us-west-2 RDS is functional
  # - Complete multi-region VPC infrastructure is working correctly
  assert response_payload[
      'statusCode'] == 200, f"Expected statusCode 200 but got {response_payload['statusCode']}"

  assert body_data.get(
      'reachable') == True, f"VPC connectivity test failed - RDS endpoint not reachable. Response: {body_data}"

  # Verify success message indicating proper connectivity
  success_message = body_data.get('message', '')
  assert 'Successfully reached' in success_message, f"Expected success message but got: {success_message}"

  print("✅ VPC Connectivity Test PASSED:")
  print(f"   - Lambda function successfully invoked: {lambda_arn}")
  print(f"   - RDS endpoint reachable across VPC peering")
  print(f"   - Multi-region network connectivity confirmed")
  print(f"   - Response: {success_message}")
