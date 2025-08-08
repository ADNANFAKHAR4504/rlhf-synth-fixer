"""
test_tap_stack_integration.py
Integration tests for live deployed TapStack infrastructure.
This test finds the deployed stack outputs and verifies the live AWS resources.
"""
import os
import sys
import time
import json
import subprocess

import boto3
import pytest
import requests

# --- Test Configuration ---
# Aligned with the CI/CD pipeline's naming conventions.
PROJECT_NAME = "TapStack"
ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "dev")
STACK_NAME = f"{PROJECT_NAME}{ENVIRONMENT_SUFFIX}"
AWS_REGION = "us-east-1"
# -------------------------


def get_stack_outputs():
  """
  Gets Pulumi stack outputs by calling the Pulumi CLI directly.
  This mimics the successful pattern used by other developers in the project.
  """
  try:
    # This command runs `pulumi stack output --json` in the CI environment,
    # which is already configured with the correct backend and credentials.
    result = subprocess.run(
        ["pulumi", "stack", "output", "--json", "--stack", STACK_NAME],
        capture_output=True,
        text=True,
        check=True,
        cwd="."  # Ensures command runs from the project root
    )
    return json.loads(result.stdout)
  except (subprocess.CalledProcessError, FileNotFoundError) as e:
    pytest.fail(
        f"❌ FATAL: Failed to get outputs for stack '{STACK_NAME}'. "
        f"Ensure the 'deploy' job is creating the stack correctly.\nOriginal error: {e}"
    )
  except json.JSONDecodeError as e:
    pytest.fail(
        f"❌ FATAL: Failed to parse JSON from 'pulumi stack output'.\nOriginal error: {e}"
    )

# A single fixture to provide outputs to all tests.


@pytest.fixture(scope="module")
def stack_outputs():
  return get_stack_outputs()

# pylint: disable=redefined-outer_name


def test_alb_endpoint_is_reachable(stack_outputs):
  """
  Tests if the ALB endpoint is public and returns a successful HTTP response.
  """
  alb_dns = stack_outputs.get("alb_dns_name")
  assert alb_dns is not None, "ALB DNS name not found in stack outputs"

  endpoint = f"http://{alb_dns}"

  for i in range(10):
    try:
      response = requests.get(endpoint, timeout=10)
      if response.status_code == 200 and "Hello from" in response.text:
        print(f"✅ Success! Received HTTP 200 from {endpoint}")
        return
    except requests.exceptions.RequestException as e:
      print(f"Request failed: {e}")
    print(f"Attempt {i+1}/10: Endpoint not ready, retrying in 15 seconds...")
    time.sleep(15)

  pytest.fail(
      f"❌ Endpoint {endpoint} was not reachable after multiple retries.")


# pylint: disable=redefined-outer-name
def test_asg_live_configuration(stack_outputs):
  """
  Uses boto3 to check the configuration of the live Auto Scaling Group.
  """
  asg_name = stack_outputs.get("auto_scaling_group_name")
  assert asg_name is not None, "ASG name not found in stack outputs"

  client = boto3.client("autoscaling", region_name=AWS_REGION)
  response = client.describe_auto_scaling_groups(
      AutoScalingGroupNames=[asg_name])

  assert len(response["AutoScalingGroups"]
             ) > 0, f"ASG with name {asg_name} not found"
  asg = response["AutoScalingGroups"][0]
  assert asg["MinSize"] == 1
  assert asg["MaxSize"] == 3
  print(f"✅ Verified ASG '{asg_name}' has MinSize=1 and MaxSize=3.")


# pylint: disable=redefined-outer-name
def test_cpu_scaling_policy_exists(stack_outputs):
  """
  Uses boto3 to check that the target tracking policy exists and is configured correctly.
  """
  asg_name = stack_outputs.get("auto_scaling_group_name")
  policy_name = stack_outputs.get("cpu_scaling_policy_name")
  assert asg_name is not None
  assert policy_name is not None

  client = boto3.client("autoscaling", region_name=AWS_REGION)
  response = client.describe_policies(
      AutoScalingGroupName=asg_name, PolicyNames=[policy_name]
  )

  assert len(response["ScalingPolicies"]
             ) > 0, f"Scaling policy '{policy_name}' not found"
  policy = response["ScalingPolicies"][0]
  config = policy["TargetTrackingConfiguration"]
  assert config["PredefinedMetricSpecification"]["PredefinedMetricType"] == "ASGAverageCPUUtilization"
  assert config["TargetValue"] == 50.0
  print(f"✅ Verified CPU scaling policy '{policy_name}' is targeting 50.0%.")


# pylint: disable=redefined-outer-name
def test_unhealthy_host_alarm_exists(stack_outputs):
  """
  Uses boto3 to check that the UnhealthyHostCount alarm exists and is configured correctly.
  """
  alarm_name = stack_outputs.get("unhealthy_alarm_name")
  assert alarm_name is not None

  client = boto3.client("cloudwatch", region_name=AWS_REGION)
  response = client.describe_alarms(AlarmNames=[alarm_name])

  assert len(response["MetricAlarms"]
             ) > 0, f"CloudWatch alarm '{alarm_name}' not found"
  alarm = response["MetricAlarms"][0]
  assert alarm["MetricName"] == "UnHealthyHostCount"
  assert alarm["Threshold"] == 1.0
  assert alarm["ComparisonOperator"] == "GreaterThanOrEqualToThreshold"
  print(f"✅ Verified CloudWatch alarm '{alarm_name}' has a threshold of >= 1.")