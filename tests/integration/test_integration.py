# tests/integration/test_integration.py

import os
import sys
import boto3
import pytest

# Correct sys.path setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

REGION = "us-east-1"  # Or get this from a CI environment variable if needed

# A constant to define the stack name pattern
STACK_NAME_PREFIX = "tap"


@pytest.fixture(scope="module")
def stack_outputs():
  """
  Dynamically retrieves the outputs of the most recently deployed CloudFormation stack
  that matches the defined pattern.
  """
  cf_client = boto3.client("cloudformation", region_name=REGION)
  
  try:
    # List all stacks and filter for stacks with the correct prefix and status
    stacks = cf_client.list_stacks(
      StackStatusFilter=[
        'CREATE_COMPLETE',
        'UPDATE_COMPLETE',
        'ROLLBACK_FAILED' # You may want to test this too
      ]
    )
    
    # Find the most recently deployed stack that matches our naming convention
    # and isn't a nested stack. Nested stacks are typically not named 'tap...'
    target_stacks = [
      s for s in stacks['StackSummaries']
      if s['StackName'].startswith(STACK_NAME_PREFIX) and not s['StackName'].endswith("NestedStack")
    ]

    if not target_stacks:
      pytest.fail(f"No deployed stack found matching the pattern '{STACK_NAME_PREFIX}'")
    
    # Sort the stacks by creation date (most recent first)
    target_stacks.sort(key=lambda s: s.get('CreationTime', s.get('LastUpdatedTime')), reverse=True)
    
    stack_name = target_stacks[0]['StackName']
    
    print(f"  Found and targeting stack: {stack_name} in region: {REGION}")

    # Describe the selected stack to get its outputs
    response = cf_client.describe_stacks(StackName=stack_name)
    outputs = response["Stacks"][0]["Outputs"]
    
    # Convert outputs list to a dictionary for easier access
    output_dict = {item["OutputKey"]: item["OutputValue"] for item in outputs}
    
    return output_dict
    
  except Exception as e:
    pytest.fail(f"Could not retrieve stack outputs: {e}")


def test_deployed_stack_outputs(stack_outputs):
  """
  Tests the real output values of the deployed stack.
  """
  # ECS Stack
  # Ensure the Load Balancer DNS name is a CfnOutput with the correct key.
  assert "EcsStackLoadBalancerDNS" in stack_outputs
  load_balancer_dns_name = stack_outputs["EcsStackLoadBalancerDNS"]
  assert load_balancer_dns_name.endswith(".elb.amazonaws.com")

  # RDS Stack
  # Ensure the RDS endpoint hostname is a CfnOutput with the correct key.
  assert "RdsStackDBEndpointHostname" in stack_outputs
  rds_hostname = stack_outputs["RdsStackDBEndpointHostname"]
  assert ".rds.amazonaws.com" in rds_hostname

  # Route53 Stack
  # Check for hosted zone ID.
  assert "Route53StackHostedZoneId" in stack_outputs
  hosted_zone_id = stack_outputs["Route53StackHostedZoneId"]
  assert hosted_zone_id.startswith("Z")

  # VPC Stack
  # Check for VPC ID.
  assert "VpcStackVpcId" in stack_outputs
  vpc_id = stack_outputs["VpcStackVpcId"]
  assert vpc_id.startswith("vpc-")