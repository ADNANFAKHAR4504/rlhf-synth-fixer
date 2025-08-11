"""
Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""
try:
  import pulumi
  from moto import mock_aws
except ImportError:
  pass

from lib import tap_stack

class MyMocks(pulumi.runtime.Mocks):
  def new_resource(self, args: pulumi.runtime.MockResourceArgs):
    outputs = args.inputs.copy()
    outputs['id'] = f"{args.name}_id"
    if args.typ == "aws:ec2/vpc:Vpc":
      outputs['ipv6_cidr_block'] = "2600:1f18:1234:5600::/56"
    if args.typ == "aws:iam/role:Role":
      outputs['arn'] = f"arn:aws:iam::123456789012:role/{args.name}"
    if args.typ == "aws:iam/instanceProfile:InstanceProfile":
      outputs['arn'] = f"arn:aws:iam::123456789012:instance-profile/{args.name}"
    return [f"{args.name}_id", outputs]

  def call(self, args: pulumi.runtime.MockCallArgs):
    if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-east-1a", "us-east-1b"]}
    if args.token == "aws:ec2/getAmi:getAmi":
      return {"id": "ami-12345678"}
    return {}

pulumi.runtime.set_mocks(MyMocks())

@pulumi.runtime.test
@mock_aws
def test_tap_stack_imports():
  assert hasattr(tap_stack, 'vpc')
  assert hasattr(tap_stack, 'alb')
  assert hasattr(tap_stack, 'ec2_instance')

@pulumi.runtime.test
@mock_aws
def test_security_groups_exist():
  assert hasattr(tap_stack, 'ec2_sg')
  assert hasattr(tap_stack, 'alb_sg')
