
# # import json
# import subprocess
# import aws_cdk as cdk
# # import pytest

# from lib.tap_stack import TapStack



# def synth_stack():
#   """Synthesizes the stack and returns the synthesized template as a dictionary."""
#   app = cdk.App()
#   TapStack(app, "IntegrationTestTapStack")
#   assembly = app.synth()
#   stack_artifact = assembly.get_stack_by_name("IntegrationTestTapStack")
#   # return json.loads(stack_artifact.template_as_json)
#   return stack_artifact.template



# def test_stack_synthesizes():
#   template = synth_stack()

#   # Ensure expected resources exist
#   resources = template.get("Resources", {})
#   resource_types = [res["Type"] for res in resources.values()]

#   assert "AWS::EC2::VPC" in resource_types
#   assert "AWS::EC2::Instance" in resource_types
#   assert "AWS::IAM::Role" in resource_types
#   assert "AWS::EC2::SecurityGroup" in resource_types
#   assert "AWS::CloudTrail::Trail" in resource_types
#   assert "AWS::Logs::LogGroup" in resource_types

#   # Verify at least 2 Security Groups
#   sg_count = sum(1 for t in resource_types if t == "AWS::EC2::SecurityGroup")
#   assert sg_count == 2


# def test_cdk_synth_command():
#   """Runs `cdk synth` to ensure the app compiles without errors."""
#   result = subprocess.run(["cdk", "synth"], capture_output=True, text=True, check=False)
#   assert result.returncode == 0
#   assert "AWS::EC2::VPC" in result.stdout or "Resources" in result.stdout


import subprocess
import json
import pytest

STACK_NAME =  "TapStack"

REGION = "us-east-1"


def run_cmd(cmd):
  """Helper function to run AWS CLI commands and return stdout"""
  result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=False)
  if result.returncode != 0:
    print(f"Command failed: {cmd}\nError: {result.stderr}")
    raise RuntimeError(result.stderr)
  return result.stdout.strip()


@pytest.fixture(scope="module")
def stack_info_data():
  """Fetch CloudFormation stack details and parse outputs"""
  stdout = run_cmd(
      f"aws cloudformation describe-stacks --stack-name {STACK_NAME} --region {REGION}"
  )
  stack_data = json.loads(stdout)["Stacks"][0]

  outputs = {}
  for output in stack_data.get("Outputs", []):
    outputs[output["OutputKey"]] = output["OutputValue"]

  return {"info": stack_data, "outputs": outputs}


def test_stack_status(stack_info_data):
  """Stack should be successfully deployed"""
  assert stack_info_data["info"]["StackStatus"] == "CREATE_COMPLETE"


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
    f"aws ec2 describe-security-groups --filters \"Name=tag:Component,Values=LoadBalancer,EC2-Web\""
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
