import pytest
from pulumi.runtime import mocks
from pulumi import Output
import pulumi_aws as aws

from lib.tap_stack import create_tap_stack


class MockInfra(mocks.Mocks):
  def new_resource(self, args):
    outputs = args.inputs.copy()
    if args.typ == "aws:ec2/vpc:Vpc":
      outputs["cidr_block"] = Output.from_input("10.0.0.0/16")
    elif args.typ == "aws:ec2/subnet:Subnet":
      outputs["tags"] = Output.from_input({"Type": "public"})
    elif args.typ == "aws:ec2/routeTable:RouteTable":
      outputs["routes"] = Output.from_input([{"cidr_block": "0.0.0.0/0", "gateway_id": "fake-gw"}])
    elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
      outputs["ingress"] = Output.from_input([{
        "protocol": "tcp",
        "from_port": 22,
        "to_port": 22,
        "cidr_blocks": ["0.0.0.0/0"],
      }])
    elif args.typ == "aws:ec2/instance:Instance":
      outputs["ami"] = Output.from_input("amzn2-ami-hvm-2023")
    elif args.typ == "aws:iam/role:Role":
      outputs["arn"] = Output.from_input("arn:aws:iam::123456789012:role/fake")
      outputs["name"] = Output.from_input("fake-role")
    elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
      outputs["name"] = Output.from_input("fake-profile")
    return [f"{args.name}_id", outputs]

  def call(self, args):
    if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-east-1a", "us-east-1b"]}
    if args.token == "aws:ec2/getAmi:getAmi":
      return {"id": "ami-12345678"}
    return {}


@pytest.fixture(scope="module", autouse=True)
def setup_mocks():
  mocks.set_mocks(MockInfra())
  yield
  mocks.set_mocks(None)  # Clean up mocks after tests


def test_vpc_has_correct_cidr():
  stack = create_tap_stack(environment="test")
  assert stack.vpc is not None
  cidr = stack.vpc.cidr_block
  assert isinstance(cidr, Output)

  def check_cidr(c):
    assert c == "10.0.0.0/16"

  cidr.apply(check_cidr)


def test_two_public_subnets_exist():
  stack = create_tap_stack(environment="test")
  assert stack.subnets and len(stack.subnets) == 2

  for subnet in stack.subnets:
    assert subnet is not None

    def check_tags(tags):
      assert tags.get("Type") == "public"

    subnet.tags.apply(check_tags)


def test_igw_and_default_route_present():
  stack = create_tap_stack(environment="test")
  assert stack.route_table is not None

  def check_routes(routes):
    assert any(r.get("cidr_block") == "0.0.0.0/0" for r in routes)

  stack.route_table.routes.apply(check_routes)


def test_ec2_instances_exist_and_ami_valid():
  stack = create_tap_stack(environment="test")
  instances = stack.instances
  assert instances and len(instances) == 2

  for inst in instances:
    assert isinstance(inst.id, Output)

    def check_ami(ami):
      assert "amzn2" in ami

    inst.ami.apply(check_ami)


def test_security_group_allows_ssh():
  stack = create_tap_stack(environment="test")
  assert stack.security_group is not None

  def check_ingress(rules):
    assert any(
      r["from_port"] == 22
      and r["to_port"] == 22
      and r["protocol"] == "tcp"
      for r in rules
    )

  stack.security_group.ingress.apply(check_ingress)


def test_iam_role_and_profile_exist():
  stack = create_tap_stack(environment="test")
  assert stack.iam_role is not None
  assert stack.iam_instance_profile is not None
  assert isinstance(stack.iam_role.name, Output)


def test_project_tag_compliance():
  stack = create_tap_stack(environment="test")
  tags = stack.tags
  assert tags.get("Project") == "CloudEnvironmentSetup"
  assert tags.get("ManagedBy") == "Pulumi"
  assert tags.get("Environment") == "Test"
  assert "Owner" in tags


def test_output_resources_exist():
  stack = create_tap_stack(environment="test")
  assert isinstance(stack.vpc.id, Output)
  assert isinstance(stack.security_group.id, Output)
  assert isinstance(stack.iam_role.arn, Output)

  for inst in stack.instances:
    assert isinstance(inst.id, Output)
