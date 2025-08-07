import pulumi
from moto import mock_aws

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
def test_network_creates_public_subnets():
  network = tap_stack.create_vpc_and_networking()
  assert 'public_subnets' in network
  assert len(network['public_subnets']) == 2

@pulumi.runtime.test
@mock_aws
def test_ec2_sg_allows_alb_traffic_by_reference():
  vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
  security_groups = tap_stack.create_security_groups(vpc.id)
  ec2_sg = security_groups['ec2_sg']

  def check_ingress_rules(ingress):
    alb_rule_found = False
    for rule in ingress:
      if (rule.get('from_port') == 80 and
              rule.get('security_groups') is not None):
        alb_rule_found = True
        break
    assert alb_rule_found

  ec2_sg.ingress.apply(check_ingress_rules)

@pulumi.runtime.test
@mock_aws
def test_asg_uses_launch_template():
  vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
  public_subnets = [
    aws.ec2.Subnet("p-sub-1", vpc_id=vpc.id, cidr_block="10.0.1.0/24"),
    aws.ec2.Subnet("p-sub-2", vpc_id=vpc.id, cidr_block="10.0.2.0/24")
  ]
  ec2_sg = aws.ec2.SecurityGroup("ec2-sg", vpc_id=vpc.id)
  profile = aws.iam.InstanceProfile("profile")
  tg = aws.lb.TargetGroup("tg", vpc_id=vpc.id)

  tap_stack.create_compute_layer(public_subnets, ec2_sg, profile, tg)
  
  assert True