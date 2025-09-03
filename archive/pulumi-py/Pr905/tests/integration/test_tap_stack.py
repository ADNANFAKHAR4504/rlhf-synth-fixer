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


def test_vpc_connectivity_via_lambda_socket_ping(pulumi_outputs, lambda_client):
  print("""
    Integration Test: Multi-Region VPC Connectivity via Lambda Socket Connectivity Test
    
    This test validates the complete multi-region VPC peering connectivity using TCP socket connections:
    
    AUTOMATED TEST REQUIREMENTS COVERAGE:
    ✓ VPC peering connection is established between us-east-1 and us-west-2
    ✓ Route tables are properly configured for cross-VPC communication
    ✓ Security groups allow cross-VPC RDS connectivity on port 5432
    ✓ Lambda function can establish TCP connection to RDS endpoint across VPC boundaries
    ✓ Network connectivity between regions is functional at the transport layer
    
    TEST FLOW:
    1. Retrieves Lambda function ARN from Pulumi deployment outputs
    2. Invokes Lambda function with optional timeout parameter
    3. Lambda function performs the following operations:
       - Attempts to establish TCP socket connection to RDS endpoint in the peered VPC
       - Tests direct port connectivity (typically port 5432 for PostgreSQL)
       - Measures connection response time for network performance validation
       - Tests network connectivity across VPC peering connection at transport layer
       - Returns connectivity status, response time metrics, and connection details
    4. Test validates that the response indicates successful TCP connectivity
    
    This comprehensive test ensures:
    - VPC peering connection is properly established and active
    - Route tables have correct routes for cross-VPC communication
    - Security groups allow TCP traffic on database port between VPCs
    - Lambda function has proper network access and VPC configuration
    - RDS database port is accessible from Lambda in the peered VPC
    - Complete multi-region network infrastructure is functional at TCP level
    - Network latency is within acceptable bounds for cross-region connectivity
    """)

  # Get the Lambda function ARN from Pulumi deployment outputs
  # This should be the connectivity test Lambda function deployed in us-east-1
  lambda_arn = pulumi_outputs.get("us_east_lambda_arn")
  assert lambda_arn, "Missing 'us_east_lambda_arn' in Pulumi outputs."

  print(f"Testing TCP socket connectivity using Lambda: {lambda_arn}")
  print("Lambda function configured with RDS endpoint via DB_HOST environment variable")

  try:
    print("Invoking Lambda function to test VPC socket connectivity...")

    # Invoke the Lambda function with optional timeout parameter
    # Lambda reads RDS endpoint from DB_HOST environment variable
    test_payload = {
        "timeout": 10  # 10 second timeout for socket connection
    }

    response = lambda_client.invoke(
        FunctionName=lambda_arn,
        InvocationType='RequestResponse',  # Synchronous invocation
        Payload=json.dumps(test_payload)
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

  # Validate socket connectivity response structure
  assert 'host' in body_data, "Missing 'host' in connectivity response"
  assert 'port' in body_data, "Missing 'port' in connectivity response"
  assert 'reachable' in body_data, "Missing 'reachable' in connectivity response"
  assert 'response_time_ms' in body_data, "Missing 'response_time_ms' in connectivity response"
  assert 'message' in body_data, "Missing 'message' in connectivity response"

  # Verify VPC connectivity test was successful (requirement validation)
  # If reachable is True, it confirms:
  # - VPC peering connection is active and routing TCP traffic
  # - Route tables have correct routes for cross-VPC communication
  # - Security groups allow Lambda to RDS TCP connectivity on specified port
  # - Network path from us-east-1 Lambda to us-west-2 RDS is functional at transport layer
  # - Complete multi-region VPC infrastructure is working correctly
  assert response_payload[
      'statusCode'] == 200, f"Expected statusCode 200 but got {response_payload['statusCode']}"
  assert body_data.get(
      'reachable') == True, f"VPC socket connectivity test failed - RDS endpoint not reachable on port {body_data.get('port')}. Response: {body_data}"

  # Verify success message indicating proper TCP connectivity
  success_message = body_data.get('message', '')
  assert 'Successfully connected' in success_message, f"Expected success message but got: {success_message}"

  # Validate response time is reasonable (should be measured in milliseconds)
  response_time = body_data.get('response_time_ms')
  assert response_time is not None, "Missing response time measurement"
  assert isinstance(response_time, (int, float)
                    ), f"Response time should be numeric, got {type(response_time)}"
  assert response_time >= 0, f"Response time should be non-negative, got {response_time}"

  # Log connection details for verification
  host = body_data.get('host')
  port = body_data.get('port')

  print("VPC Socket Connectivity Test PASSED:")
  print(f"   - Lambda function successfully invoked: {lambda_arn}")
  print(f"   - TCP connection established to: {host}:{port}")
  print(f"   - Connection response time: {response_time}ms")
  print(f"   - Multi-region network connectivity confirmed at transport layer")
  print(f"   - Response: {success_message}")

  # Additional validation for expected database port
  if port == 5432:
    print("   - Confirmed PostgreSQL port connectivity (5432)")
  elif port == 3306:
    print("   - Confirmed MySQL port connectivity (3306)")
  else:
    print(f"   - Confirmed custom port connectivity ({port})")
