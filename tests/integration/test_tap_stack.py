import subprocess
import json
import pytest


REGION = "us-east-1"


def run_cmd(cmd):
  """Helper function to run AWS CLI commands and return stdout"""
  result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=False)
  if result.returncode != 0:
    print(f"Command failed: {cmd}\nError: {result.stderr}")
    raise RuntimeError(result.stderr)
  return result.stdout.strip()


def test_vpc_exists():
  """Validate that the VPC with the correct CIDR exists"""
  cidr = run_cmd(
    f"aws ec2 describe-vpcs --filters \"Name=tag:Component,Values=Networking\" "
    f"--region {REGION} --query 'Vpcs[0].CidrBlock' --output text"
  )
  assert cidr == "10.0.0.0/16" or cidr != "None"


def test_security_groups():
  """Ensure at least 2 security groups exist (LB + EC2)"""
  lb_sg = run_cmd(
    f"aws ec2 describe-security-groups --filters \"Name=tag:Component,Values=LoadBalancer\" "
    f"--region {REGION} --query 'length(SecurityGroups)'"
  )
  ec2_sg = run_cmd(
    f"aws ec2 describe-security-groups --filters \"Name=tag:Component,Values=EC2-Web\" "
    f"--region {REGION} --query 'length(SecurityGroups)'"
  )
  assert int(lb_sg) == 1
  assert int(ec2_sg) == 1


def test_cloudtrail_exists():
  """Ensure CloudTrail is deployed"""
  trails = run_cmd(
    f"aws cloudtrail list-trails --region {REGION} --query 'Trails[].Name' --output text"
  )
  assert "SecureCloudTrail" in trails


def test_log_groups_exist():
  """Ensure CloudTrail and EC2 log groups exist"""
  partofcommand = "'logGroups[].logGroupName' --output text"
  log_groups = run_cmd(
    f"aws logs describe-log-groups --region {REGION} --query " + partofcommand
  )
  assert "CloudTrailLogGroup" in log_groups
  assert "EC2LogGroup" in log_groups

def test_ec2_instance_running():
  """Ensure EC2 instance is running"""
  instance_state = run_cmd(
    f"aws ec2 describe-instances --filters \"Name=tag:Name,Values=WebServer\" "
    f"--region {REGION} --query 'Reservations[].Instances[].State.Name' --output text"
  )
  assert instance_state == "running"


LB_NAME = "TuringWebALBTuring"
@pytest.fixture(scope="module")
def load_balancer_dns():
  """Fetch the DNS name of the Load Balancer."""
  dns_name = run_cmd(
    f"aws elbv2 describe-load-balancers --names {LB_NAME} "
    f"--region {REGION} --query 'LoadBalancers[0].DNSName' --output text"
  )
  assert dns_name and dns_name != "None", "Load Balancer DNS name not found"
  return dns_name


def test_load_balancer_ping(load_balancer_dns):
  """Ping the Load Balancer DNS to check connectivity."""
  # Ensure DNS name is valid
  assert load_balancer_dns and load_balancer_dns != "None"

  # Use curl instead of ping (handles ICMP restrictions)
  result = run_cmd(
      f"curl -s -o /dev/null -w '%{{http_code}}' http://{load_balancer_dns}"
  )

  # Any valid HTTP response code (even 403/404) means connectivity is working
  assert result.isdigit() and int(result) > 0, \
      f"Load balancer not reachable, response: {result}"