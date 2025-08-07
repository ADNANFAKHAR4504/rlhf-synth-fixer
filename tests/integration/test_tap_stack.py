import os
import time
import socket
import requests
import pytest
import boto3

# --- Configuration for Integration Tests ---
# In a real CI/CD pipeline, these outputs would typically be passed as
# environment variables from the `pulumi up` step.
# For local testing, you can uncomment and set these manually after `pulumi up`.

# Get outputs from environment variables or use placeholders for local testing
# Replace these with actual values from your `pulumi up` output if running locally
STACK_OUTPUTS = {
  "availability_zones": ["us-east-1a", "us-east-1b"],
  "ec2_instance_ids": os.environ.get(
    "PULUMI_EC2_INSTANCE_IDS",
    '["i-04535cdaf28d1c4a8","i-00fb0f160a3e7dc85"]'
  ),
  "load_balancer_dns": os.environ.get(
    "PULUMI_LOAD_BALANCER_DNS",
    "pulumi-infra-lb-alb-482883949.us-east-1.elb.amazonaws.com"
  ),
  "load_balancer_zone_id": os.environ.get(
    "PULUMI_LOAD_BALANCER_ZONE_ID",
    "Z35SXDOTRQ7X7K"
  ),
  "rds_endpoint": os.environ.get(
    "PULUMI_RDS_ENDPOINT",
    "pulumi-infra-database-postgres.c43eiskmcd0s.us-east-1.rds.amazonaws.com:5432"
  ),
  "vpc_id": os.environ.get(
    "PULUMI_VPC_ID",
    "vpc-0c5d6f637be46cfde"
  ),
  "region": os.environ.get("AWS_REGION", "us-east-1") # Ensure this matches your deployment region
}

# Parse JSON string outputs if they come from environment variables
if isinstance(STACK_OUTPUTS["ec2_instance_ids"], str):
  import json
  STACK_OUTPUTS["ec2_instance_ids"] = json.loads(STACK_OUTPUTS["ec2_instance_ids"])

if isinstance(STACK_OUTPUTS["availability_zones"], str):
  import json
  STACK_OUTPUTS["availability_zones"] = json.loads(
    STACK_OUTPUTS["availability_zones"]
  )


# Initialize Boto3 clients
ec2_client = boto3.client("ec2", region_name=STACK_OUTPUTS["region"])
rds_client = boto3.client("rds", region_name=STACK_OUTPUTS["region"])
elb_client = boto3.client("elbv2", region_name=STACK_OUTPUTS["region"])


# --- Helper Functions ---
def wait_for_http_ok(url, timeout=300, interval=10):
  """Waits for an HTTP endpoint to return a 200 OK status."""
  start_time = time.time()
  while time.time() - start_time < timeout:
    try:
      response = requests.get(url, timeout=5)
      if response.status_code == 200:
        print(f"HTTP endpoint {url} is reachable and returned 200 OK.")
        return True
    except requests.exceptions.RequestException as e:
      print(f"Waiting for {url}... Error: {e}")
    time.sleep(interval)
  print(f"HTTP endpoint {url} did not become reachable within {timeout} seconds.")
  return False


def is_port_open(host, port, timeout=5):
  """Checks if a specific port on a host is open."""
  try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0
  except socket.error as e:
    print(f"Error checking port {port} on {host}: {e}")
    return False


# --- Pytest Integration Test Class ---
class TestPulumiInfrastructure:
  """
  Integration tests for the deployed Pulumi infrastructure.
  These tests run against live AWS resources.
  """

  def test_01_alb_is_reachable(self):
    """Verify the Application Load Balancer is reachable via HTTP."""
    alb_dns = STACK_OUTPUTS["load_balancer_dns"]
    assert alb_dns, "ALB DNS name not found in stack outputs."
    alb_url = f"http://{alb_dns}"
    print(f"\nAttempting to reach ALB at: {alb_url}")
    # Increased timeout to 1800 seconds (30 minutes) for ALB to become reachable
    assert wait_for_http_ok(alb_url, timeout=1800, interval=15), \
      f"ALB at {alb_url} is not reachable or did not return 200 OK."
    print("ALB is reachable and returned 200 OK.")

  def test_02_ec2_instances_are_running(self):
    """Verify EC2 instances are in 'running' state."""
    instance_ids = STACK_OUTPUTS["ec2_instance_ids"]
    assert instance_ids, "EC2 instance IDs not found in stack outputs."
    print(f"\nChecking status of EC2 instances: {instance_ids}")

    try:
      response = ec2_client.describe_instance_status(
        InstanceIds=instance_ids,
        IncludeAllInstances=True
      )
      instance_statuses = {
        s["InstanceId"]: s["InstanceState"]["Name"]
        for s in response["InstanceStatuses"]
      }
      print(f"Current EC2 instance statuses: {instance_statuses}")

      for instance_id in instance_ids:
        assert instance_id in instance_statuses, \
          f"Instance {instance_id} not found in EC2 status response."
        assert instance_statuses[instance_id] == "running", \
          f"Instance {instance_id} is not running. Current state: " \
          f"{instance_statuses[instance_id]}"
      print("All EC2 instances are running.")

    except Exception as e:
      pytest.fail(f"Failed to describe EC2 instance status: {e}")

  def test_03_vpc_exists(self):
    """Verify the VPC exists."""
    vpc_id = STACK_OUTPUTS["vpc_id"]
    assert vpc_id, "VPC ID not found in stack outputs."
    print(f"\nChecking if VPC {vpc_id} exists.")
    try:
      response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
      assert len(response["Vpcs"]) == 1, f"VPC {vpc_id} not found."
      print(f"VPC {vpc_id} exists.")
    except Exception as e:
      pytest.fail(f"Failed to describe VPC {vpc_id}: {e}")

  def test_04_rds_instance_exists_and_is_available(self):
    """Verify the RDS instance exists and is in 'available' state."""
    rds_endpoint_full = STACK_OUTPUTS["rds_endpoint"]
    assert rds_endpoint_full, "RDS endpoint not found in stack outputs."

    rds_host, rds_port_str = rds_endpoint_full.split(":")
    rds_port = int(rds_port_str)
    rds_identifier = rds_host.split(".")[0] # Extract identifier from endpoint

    print(f"\nChecking RDS instance {rds_identifier} status.")
    try:
      response = rds_client.describe_db_instances(
        DBInstanceIdentifier=rds_identifier
      )
      db_instance = response["DBInstances"][0]
      assert db_instance["DBInstanceStatus"] == "available", \
        f"RDS instance {rds_identifier} is not available. Current status: " \
        f"{db_instance['DBInstanceStatus']}"
      print(f"RDS instance {rds_identifier} is available.")

      # Optional: Check if RDS port is open from the test runner's perspective.
      # NOTE: This only works if your CI/CD runner has network access to the RDS
      # endpoint, which is unlikely for a private RDS instance unless the runner
      # is within the VPC or has a direct connection (e.g., VPN/Direct Connect).
      # For true private connectivity, you'd need to run this check from an EC2
      # instance within the private subnet.
      print(f"Attempting to check if RDS port {rds_port} is open on {rds_host}...")
      if is_port_open(rds_host, rds_port, timeout=10):
        print(f"RDS port {rds_port} on {rds_host} is open (from test runner).")
      else:
        print(f"WARNING: RDS port {rds_port} on {rds_host} is NOT open "
              f"(from test runner). This is expected if RDS is private "
              f"and runner is external to VPC.")
        # You might choose to fail the test here if direct connectivity
        # from the runner is a strict requirement, but typically for
        # private RDS, it's not.

    except Exception as e:
      pytest.fail(f"Failed to describe RDS instance {rds_identifier}: {e}")
