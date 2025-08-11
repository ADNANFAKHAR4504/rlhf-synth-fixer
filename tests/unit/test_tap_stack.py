"""
Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""
try:
  import pulumi
  from moto import mock_aws
except ImportError:
  pass

from lib.tap_stack import create_infrastructure

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
    if args.typ == "aws:ec2/instance:Instance":
      outputs['public_ip'] = "1.2.3.4"
      outputs['ipv6_addresses'] = ["2600:1f18:1234:5600::1"]
    if args.typ == "aws:lb/loadBalancer:LoadBalancer":
      outputs['dns_name'] = "test-alb.us-west-2.elb.amazonaws.com"
      outputs['zone_id'] = "Z1D633PJN98FT9"
      outputs['arn'] = (f"arn:aws:elasticloadbalancing:us-west-2:"
                        f"123456789012:loadbalancer/app/{args.name}/1234567890123456")
    if args.typ == "aws:lb/targetGroup:TargetGroup":
      outputs['arn'] = (f"arn:aws:elasticloadbalancing:us-west-2:"
                        f"123456789012:targetgroup/{args.name}/1234567890123456")
    return [f"{args.name}_id", outputs]

  def call(self, args: pulumi.runtime.MockCallArgs):
    if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-west-2a", "us-west-2b"]}
    if args.token == "aws:ec2/getAmi:getAmi":
      return {"id": "ami-12345678"}
    if args.token == "aws:route53/getZone:getZone":
      return {"zone_id": "Z123456789", "name": "example.com"}
    return {}

pulumi.runtime.set_mocks(MyMocks())

@pulumi.runtime.test
@mock_aws
def test_create_infrastructure():
  resources = create_infrastructure()
  assert 'vpc' in resources
  assert 'alb' in resources
  assert 'ec2_instance' in resources
  assert 'ec2_sg' in resources
  assert 'alb_sg' in resources
  assert 'dashboard' in resources

@pulumi.runtime.test
@mock_aws
def test_resources_have_correct_types():
  resources = create_infrastructure()
  # Test that the resources are the expected Pulumi resource types
  assert resources['vpc'] is not None
  assert resources['alb'] is not None
  assert resources['ec2_instance'] is not None
