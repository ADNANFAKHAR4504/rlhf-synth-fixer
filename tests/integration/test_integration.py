# tests/integration/test_integration.py

import os
import sys
import boto3
import pytest
from aws_cdk import App, Environment

# Correct sys.path setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

# Get the name of the deployed stack from the CI environment
# You'll need to set this environment variable in your CI workflow
# Example: - name: Set stack name
#          run: echo "STACK_NAME=MyDeployedStack-dev" >> $GITHUB_ENV
STACK_NAME = os.environ.get("STACK_NAME")
REGION = "us-east-1" # Or get this from an environment variable as well

if not STACK_NAME:
  raise RuntimeError("STACK_NAME environment variable not set. Cannot run integration tests.")


@pytest.fixture(scope="module")
def stack_outputs():
  """
  Retrieves the outputs of the deployed CloudFormation stack using Boto3.
  """
  print(f"  Retrieving outputs for stack: {STACK_NAME} in region: {REGION}")
  
  cf_client = boto3.client("cloudformation", region_name=REGION)
  
  try:
    response = cf_client.describe_stacks(StackName=STACK_NAME)
    outputs = response["Stacks"][0]["Outputs"]
    
    # Convert outputs list to a dictionary for easier access
    output_dict = {item["OutputKey"]: item["OutputValue"] for item in outputs}
    
    return output_dict
    
  except Exception as e:
    pytest.fail(f"Could not retrieve stack outputs for {STACK_NAME}: {e}")


def test_deployed_stack_outputs(stack_outputs):
  """
  Tests the real output values of the deployed stack.
  """
  # ECS Stack
  # Corrected assertion to check for a real DNS name format
  # Your stack's Load Balancer DNS name should be exposed via a CfnOutput
  assert "EcsStackLoadBalancerDNS" in stack_outputs
  load_balancer_dns_name = stack_outputs["EcsStackLoadBalancerDNS"]
  assert load_balancer_dns_name.endswith(".elb.amazonaws.com")

  # RDS Stack
  # Corrected assertion to check for a real RDS endpoint format
  assert "RdsStackDBEndpointHostname" in stack_outputs
  rds_hostname = stack_outputs["RdsStackDBEndpointHostname"]
  assert ".rds.amazonaws.com" in rds_hostname

  # Route53 Stack
  # Check for hosted zone ID
  assert "Route53StackHostedZoneId" in stack_outputs
  hosted_zone_id = stack_outputs["Route53StackHostedZoneId"]
  assert hosted_zone_id.startswith("Z")

  # VPC Stack
  # Check for VPC ID
  assert "VpcStackVpcId" in stack_outputs
  vpc_id = stack_outputs["VpcStackVpcId"]
  assert vpc_id.startswith("vpc-")