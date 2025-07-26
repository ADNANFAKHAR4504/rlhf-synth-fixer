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
def deployed_stack_info():
  """
  Dynamically finds the most recently deployed CloudFormation stack
  that matches the defined pattern and returns its name and status.
  """
  cf_client = boto3.client("cloudformation", region_name=REGION)
  
  try:
    # List all stacks and filter for stacks with the correct prefix and status
    stacks = cf_client.list_stacks(
      StackStatusFilter=[
        'CREATE_COMPLETE',
        'UPDATE_COMPLETE',
        'ROLLBACK_FAILED'
      ]
    )
    
    target_stacks = [
      s for s in stacks['StackSummaries']
      if s['StackName'].startswith(STACK_NAME_PREFIX) and not s['StackName'].endswith("NestedStack")
    ]

    if not target_stacks:
      pytest.fail(f"No deployed stack found matching the pattern '{STACK_NAME_PREFIX}'")
    
    target_stacks.sort(key=lambda s: s.get('CreationTime', s.get('LastUpdatedTime')), reverse=True)
    
    stack_name = target_stacks[0]['StackName']
    
    # We will only describe the stack to get its status
    response = cf_client.describe_stacks(StackName=stack_name)
    stack_status = response['Stacks'][0]['StackStatus']

    return {"name": stack_name, "status": stack_status}
    
  except Exception as e:
    pytest.fail(f"Failed to find or describe a deployed stack: {e}")


def test_stack_is_deployed(deployed_stack_info):
  """
  Tests that a stack matching the naming convention exists and is in a complete state.
  """
  # This assertion verifies that the previous fixture was successful
  assert deployed_stack_info["name"].startswith(STACK_NAME_PREFIX)
  
  # This assertion verifies that the stack is in a healthy, deployed state
  assert deployed_stack_info["status"] in ["CREATE_COMPLETE", "UPDATE_COMPLETE"]