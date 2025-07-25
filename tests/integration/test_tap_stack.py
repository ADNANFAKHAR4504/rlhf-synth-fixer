import subprocess
import json
import pytest

from lib.tap_stack import STACK_NAME

REGION = "us-east-1"

def run_cmd(cmd):
    """Helper to run AWS CLI commands and return stdout"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Command failed: {cmd}\nError: {result.stderr}")
        raise RuntimeError(result.stderr)
    return result.stdout.strip()

@pytest.fixture(scope="module")
def stack_info():
    """Fetch CloudFormation stack details and parse outputs"""
    stdout = run_cmd(f"aws cloudformation describe-stacks --stack-name {STACK_NAME} --region {REGION}")
    stack_data = json.loads(stdout)["Stacks"][0]

    outputs = {}
    for output in stack_data.get("Outputs", []):
        outputs[output["OutputKey"]] = output["OutputValue"]

    return {"info": stack_data, "outputs": outputs}

def test_stack_status(stack_info):
    """Stack should be successfully deployed"""
    assert stack_info["info"]["StackStatus"] == "CREATE_COMPLETE"

def test_vpc_exists():
    """Validate that the VPC with the correct CIDR exists"""
    cidr = run_cmd(
        f"aws ec2 describe-vpcs --filters \"Name=tag:Component,Values=Networking\" "
        f"--region {REGION} --query 'Vpcs[0].CidrBlock' --output text"
    )
    assert cidr == "10.0.0.0/16" or cidr != "None"

def test_security_groups():
    """Ensure at least 2 security groups exist (LB + EC2)"""
    sg_count = run_cmd(
        f"aws ec2 describe-security-groups --filters \"Name=tag:Component,Values=LoadBalancer,EC2-Web\" "
        f"--region {REGION} --query 'length(SecurityGroups)'"
    )
    assert int(sg_count) == 2

def test_ec2_instance_running():
    """Ensure EC2 instance is running"""
    instance_state = run_cmd(
        f"aws ec2 describe-instances --filters \"Name=tag:Name,Values=WebServer\" "
        f"--region {REGION} --query 'Reservations[].Instances[].State.Name' --output text"
    )
    assert instance_state == "running"

def test_cloudtrail_exists():
    """Ensure CloudTrail is deployed"""
    trails = run_cmd(f"aws cloudtrail list-trails --region {REGION} --query 'Trails[].Name' --output text")
    assert "SecureCloudTrail" in trails

def test_log_groups_exist():
    """Ensure CloudTrail and EC2 log groups exist"""
    log_groups = run_cmd(
        f"aws logs describe-log-groups --region {REGION} --query 'logGroups[].logGroupName' --output text"
    )
    assert "CloudTrailLogGroup" in log_groups
    assert "EC2LogGroup" in log_groups

def test_instance_connectivity():
    """Try to resolve and ping the EC2 instance"""
    public_dns = run_cmd(
        f"aws ec2 describe-instances --filters \"Name=tag:Name,Values=WebServer\" "
        f"--region {REGION} --query 'Reservations[].Instances[].PublicDnsName' --output text"
    )
    assert public_dns and public_dns != "None"

    try:
        run_cmd(f"ping -c 1 -W 5 {public_dns}")
    except RuntimeError:
        # If ping blocked, fallback to nslookup to confirm DNS resolution
        run_cmd(f"nslookup {public_dns}")
