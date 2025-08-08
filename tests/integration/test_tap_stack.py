# test_integration.py
"""
This module contains integration tests for a Pulumi stack using pytest and boto3.
It verifies that the deployed resources match the expected outputs from the stack.
This is a standalone file and does not require a separate conftest.py.
"""
import pytest
import boto3
import pulumi
import os

# Pulumi requires a project and stack name to be set for `pulumi.get_stack()` to work.
# We'll use the new stack name provided in the user's output.
PULUMI_PROJECT = "Pulumi-Tap-Stack"
PULUMI_STACK = "TapStackpr683"

@pytest.fixture(scope="session")
def pulumi_outputs():
  """
  Fixture to get all the outputs from the Pulumi stack.
  
  This function uses `pulumi stack output` to fetch the values,
  which requires the Pulumi CLI to be installed and logged in.
  The stack must be deployed before running these tests.
  """
  # Set the PULUMI_STACK environment variable for the Pulumi CLI
  os.environ['PULUMI_STACK'] = PULUMI_STACK

  try:
    # Use Pulumi's API to get all stack outputs
    stack_outputs = pulumi.get_stack().outputs
    return stack_outputs
  except Exception as e:
    pytest.fail(f"Could not retrieve Pulumi stack outputs: {e}. "
                "Make sure the stack is deployed and you are logged in.")


# A fixture for the boto3 clients
@pytest.fixture(scope="session")
def aws_clients(pulumi_outputs):
  """
  Fixture to provide a dictionary of boto3 clients for each deployed region.
  """
  clients = {}
  stack_data = pulumi_outputs[PULUMI_STACK]
  
  # The `all_regions_data` output is a list containing a single dictionary
  regions_data = stack_data['all_regions_data'][0]
  
  for region_name in regions_data.keys():
    clients[region_name] = {
      'ec2': boto3.client('ec2', region_name=region_name),
      'cloudwatch': boto3.client('cloudwatch', region_name=region_name),
      'autoscaling': boto3.client('autoscaling', region_name=region_name),
    }
  return clients

# Test for the overall stack properties
def test_stack_outputs(pulumi_outputs):
  """
  Verify that the high-level stack outputs match the deployed values.
  """
  stack_data = pulumi_outputs[PULUMI_STACK]
  
  assert stack_data['environment'] == 'dev'
  assert stack_data['total_regions'] == 2
  assert sorted(stack_data['deployed_regions']) == ['us-east-1', 'us-west-2']
  assert stack_data['primary_region'] == 'us-east-1'
  
  expected_tags = {
    'Application': 'custom-app',
    'Environment': 'dev',
    'ManagedBy': 'Pulumi',
    'Project': 'Pulumi-Tap-Stack'
  }
  assert stack_data['tags'] == expected_tags

# Test for primary region resources
def test_primary_region_resources(pulumi_outputs, aws_clients):
  """
  Verify that the primary region's VPC, Security Group, and Auto Scaling Group
  resources exist with the correct IDs from the stack outputs.
  """
  stack_data = pulumi_outputs[PULUMI_STACK]
  
  primary_region = stack_data['primary_region']
  primary_vpc_id = stack_data['primary_vpc_id']
  primary_sg_id = stack_data['primary_web_server_sg_id']
  primary_asg_arn = stack_data['primary_instance_ids'][0]

  ec2_client = aws_clients[primary_region]['ec2']
  autoscaling_client = aws_clients[primary_region]['autoscaling']

  # Test VPC existence
  try:
    response = ec2_client.describe_vpcs(VpcIds=[primary_vpc_id])
    assert response['Vpcs'], f"VPC with ID {primary_vpc_id} not found."
  except Exception as e:
    pytest.fail(f"Boto3 call for VPC {primary_vpc_id} failed: {e}")

  # Test Security Group existence
  try:
    response = ec2_client.describe_security_groups(GroupIds=[primary_sg_id])
    assert response['SecurityGroups'], f"Security Group with ID {primary_sg_id} not found."
  except Exception as e:
    pytest.fail(f"Boto3 call for Security Group {primary_sg_id} failed: {e}")
    
  # Test Auto Scaling Group existence by ARN
  try:
    # The ARN includes the ASG name. We need to parse it.
    asg_name = primary_asg_arn.split('/')[-1]
    response = autoscaling_client.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])
    assert response['AutoScalingGroups'], f"Auto Scaling Group with name {asg_name} not found."
  except Exception as e:
    pytest.fail(f"Boto3 call for ASG {primary_asg_arn} failed: {e}")
    

# Test for resources in all deployed regions
def test_all_regions_resources(pulumi_outputs, aws_clients):
  """
  Iterate through all deployed regions and verify their specific VPC, Security Group,
  and CloudWatch Dashboard resources.
  """
  stack_data = pulumi_outputs[PULUMI_STACK]
  
  # Access the nested dictionary correctly
  all_regions_data = stack_data['all_regions_data'][0]
  
  for region_name, region_info in all_regions_data.items():
    ec2_client = aws_clients[region_name]['ec2']
    cloudwatch_client = aws_clients[region_name]['cloudwatch']
    
    vpc_id = region_info['vpc_id']
    sg_id = region_info['security_group_id']
    dashboard_name = region_info['dashboard_name']
    
    # Test VPC existence in the current region
    try:
      response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
      assert response['Vpcs'], f"VPC with ID {vpc_id} not found in {region_name}."
    except Exception as e:
      pytest.fail(f"Boto3 call for VPC {vpc_id} in {region_name} failed: {e}")

    # Test Security Group existence in the current region
    try:
      response = ec2_client.describe_security_groups(GroupIds=[sg_id])
      assert response['SecurityGroups'], f"Security Group with ID {sg_id} not found in {region_name}."
    except Exception as e:
      pytest.fail(f"Boto3 call for Security Group {sg_id} in {region_name} failed: {e}")
      
    # Test CloudWatch Dashboard existence in the current region
    try:
      response = cloudwatch_client.list_dashboards(DashboardNamePrefix=dashboard_name)
      found = any(d['DashboardName'] == dashboard_name for d in response['DashboardEntries'])
      assert found, f"CloudWatch Dashboard '{dashboard_name}' not found in {region_name}."
    except Exception as e:
      pytest.fail(f"Boto3 call for CloudWatch Dashboard '{dashboard_name}' in {region_name} failed: {e}")
