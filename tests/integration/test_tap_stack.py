import json
import subprocess
import aws_cdk as cdk
# import pytest

from lib.tap_stack import TapStack



def synth_stack():
  """Synthesizes the stack and returns the synthesized template as a dictionary."""
  app = cdk.App()
  stack = TapStack(app, "IntegrationTestTapStack")
  assembly = app.synth()
  stack_artifact = assembly.get_stack_by_name("IntegrationTestTapStack")
  return json.loads(stack_artifact.template_as_json)


def test_stack_synthesizes():
  template = synth_stack()

  # Ensure expected resources exist
  resources = template.get("Resources", {})
  resource_types = [res["Type"] for res in resources.values()]

  assert "AWS::EC2::VPC" in resource_types
  assert "AWS::EC2::Instance" in resource_types
  assert "AWS::IAM::Role" in resource_types
  assert "AWS::EC2::SecurityGroup" in resource_types
  assert "AWS::CloudTrail::Trail" in resource_types
  assert "AWS::Logs::LogGroup" in resource_types

  # Verify at least 2 Security Groups
  sg_count = sum(1 for t in resource_types if t == "AWS::EC2::SecurityGroup")
  assert sg_count == 2


def test_cdk_synth_command():
  """Runs `cdk synth` to ensure the app compiles without errors."""
  result = subprocess.run(["cdk", "synth"], capture_output=True, text=True, check=False)
  assert result.returncode == 0
  assert "AWS::EC2::VPC" in result.stdout or "Resources" in result.stdout
