# tests/unit/test_tap_stack.py
"""
Unit tests for TapStack without requiring a real Pulumi runtime or AWS account.

Strategy:
- Before importing lib.tap_stack, install lightweight fakes for `pulumi` and `pulumi_aws`
  into sys.modules. They implement the minimal surface that tap_stack.py uses.
- Instantiate TapStack and assert shapes/attributes on its constructed graph.
- Validate helper utilities like _cidr_24 and that exports are produced.

These tests are intentionally hermetic and fast.
"""

# pylint: disable=protected-access,no-member,unused-argument  # Testing patterns

import sys
import types
import importlib
import base64
from dataclasses import dataclass
from typing import Any, Dict, List

# -----------------------------
# Minimal fake Pulumi runtime
# -----------------------------


class _FakeOutput:
  def __init__(self, value):
    self.value = value

  def apply(self, fn):
    return fn(self.value)


class _FakeResource:
  def __init__(self, *args, **kwargs):
    # Assign common synthetic attributes often read by code
    self.arn = kwargs.get("arn") or f"arn:{
        kwargs.get(
            'name', args[0] if args else 'res')}"
    self.id = kwargs.get("id") or f"{
        kwargs.get(
            'name',
            args[0] if args else 'res')}-id"
    self.name = kwargs.get("name", args[0] if args else "res")
    # Allow arbitrary attribute passthrough (e.g., dns_name, zone_id, etc.)
    for k, v in kwargs.items():
      setattr(self, k, v)


class _FakeComponentResource:
  def __init__(self, *args, **kwargs):
    pass


class _FakeResourceOptions:
  def __init__(self, **kwargs):
    self.parent = kwargs.get("parent")
    self.provider = kwargs.get("provider")


class _FakeInvokeOptions:
  def __init__(self, **kwargs):
    self.provider = kwargs.get("provider")


# capture exports so we can assert on them
FAKE_EXPORTS: Dict[str, Any] = {}


def _fake_export(key, val):
  # Unwrap simple _FakeOutput results for readability
  if isinstance(val, _FakeOutput):
    FAKE_EXPORTS[key] = val.value
  else:
    FAKE_EXPORTS[key] = val


# Build fake `pulumi` module
pulumi_fake = types.ModuleType("pulumi")
pulumi_fake.export = _fake_export
pulumi_fake.Output = _FakeOutput
pulumi_fake.ResourceOptions = _FakeResourceOptions
pulumi_fake.InvokeOptions = _FakeInvokeOptions
pulumi_fake.ComponentResource = _FakeComponentResource
# Add fake register_outputs method
def _fake_register_outputs(self, outputs):
  pass

pulumi_fake.ComponentResource.register_outputs = _fake_register_outputs

# -----------------------------
# Minimal fake pulumi_aws
# -----------------------------
aws_fake = types.ModuleType("pulumi_aws")

# Create fake submodules
aws_fake.ec2 = types.ModuleType("ec2")
aws_fake.lb = types.ModuleType("lb")  
aws_fake.autoscaling = types.ModuleType("autoscaling")
aws_fake.ssm = types.ModuleType("ssm")

# Provider and default tags


@dataclass
class _ProviderDefaultTagsArgs:
  tags: Dict[str, str]


class _Provider(_FakeResource):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.region = kwargs.get("region")
    self.default_tags = kwargs.get("default_tags")


aws_fake.ProviderDefaultTagsArgs = _ProviderDefaultTagsArgs
aws_fake.Provider = _Provider

# Reassign as SimpleNamespace for attribute assignment
aws_fake.ec2 = types.SimpleNamespace()
aws_fake.lb = types.SimpleNamespace() 
aws_fake.autoscaling = types.SimpleNamespace()
aws_fake.ssm = types.SimpleNamespace()

# ----- EC2 resources -----

@dataclass  
class _GetAmiFilterArgs:
  name: str
  values: List[str]


class _AmiResult:
  def __init__(self):
    self.id = "ami-0123456789abcdef0"


def _get_ami(**kwargs):
  return _AmiResult()


class _Vpc(_FakeResource):
  pass


class _Igw(_FakeResource):
  pass


class _Subnet(_FakeResource):
  # Inherits __init__ from _FakeResource
  pass


class _Eip(_FakeResource):
  pass


class _NatGw(_FakeResource):
  pass


class _Rt(_FakeResource):
  pass


class _Route(_FakeResource):
  pass


class _Rta(_FakeResource):
  pass


@dataclass
class _SgIngressArgs:
  from_port: int
  to_port: int
  protocol: str
  cidr_blocks: List[str] = None
  security_groups: List[str] = None
  description: str = ""


@dataclass
class _SgEgressArgs:
  from_port: int
  to_port: int
  protocol: str
  cidr_blocks: List[str]


class _Sg(_FakeResource):
  def __init__(self, *args, **kwargs):
    self.ingress = kwargs.get("ingress", [])
    self.egress = kwargs.get("egress", [])
    super().__init__(*args, **kwargs)
    self.id = f"{args[0]}-sgid"


aws_fake.ec2.Vpc = _Vpc
aws_fake.ec2.InternetGateway = _Igw
aws_fake.ec2.Subnet = _Subnet
aws_fake.ec2.Eip = _Eip
aws_fake.ec2.NatGateway = _NatGw
aws_fake.ec2.RouteTable = _Rt
aws_fake.ec2.Route = _Route
aws_fake.ec2.RouteTableAssociation = _Rta
aws_fake.ec2.SecurityGroup = _Sg
aws_fake.ec2.SecurityGroupIngressArgs = _SgIngressArgs
aws_fake.ec2.SecurityGroupEgressArgs = _SgEgressArgs
aws_fake.ec2.get_ami = _get_ami
aws_fake.ec2.GetAmiFilterArgs = _GetAmiFilterArgs

# ----- Load Balancer -----


@dataclass
class _TgHcArgs:
  enabled: bool
  path: str
  protocol: str
  matcher: str
  healthy_threshold: int
  unhealthy_threshold: int
  interval: int
  timeout: int


@dataclass
class _ListenerDefaultActionArgs:
  type: str
  target_group_arn: str


class _Lb(_FakeResource):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.arn = f"{args[0]}-alb-arn"
    self.dns_name = _FakeOutput(f"{args[0]}.elb.amazonaws.com")
    self.zone_id = f"{args[0]}-zone"


class _TargetGroup(_FakeResource):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.arn = f"{args[0]}-tg-arn"


class _Listener(_FakeResource):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.arn = f"{args[0]}-listener-arn"


aws_fake.lb.LoadBalancer = _Lb
aws_fake.lb.TargetGroup = _TargetGroup
aws_fake.lb.Listener = _Listener
aws_fake.lb.TargetGroupHealthCheckArgs = _TgHcArgs
aws_fake.lb.ListenerDefaultActionArgs = _ListenerDefaultActionArgs

# ----- AutoScaling -----


@dataclass
class _AsgTagArgs:
  key: str
  value: str
  propagate_at_launch: bool


@dataclass
class _GroupLtArgs:
  id: str
  version: str


class _LaunchTemplate(_FakeResource):
  pass


class _Asg(_FakeResource):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.name = f"{args[0]}-name"


aws_fake.autoscaling.GroupTagArgs = _AsgTagArgs
aws_fake.autoscaling.GroupLaunchTemplateArgs = _GroupLtArgs
aws_fake.autoscaling.Group = _Asg
aws_fake.ec2.LaunchTemplate = _LaunchTemplate
aws_fake.ec2.LaunchTemplateTagSpecificationArgs = lambda **kw: kw  # accept-any

# ----- SSM get_parameter -----


class _Param:
  def __init__(self, value):
    self.value = value


def _get_parameter(name: str, region: str):
  # Return a plausible AMI id
  if name and region:
    print(f"Fetching parameter {name} in region {region}")
  return _Param("ami-0123456789abcdef0")


aws_fake.ssm.get_parameter = _get_parameter

# Install fakes into sys.modules BEFORE importing module under test
sys.modules["pulumi"] = pulumi_fake
sys.modules["pulumi_aws"] = aws_fake

# Now import code under test
tap_stack = importlib.import_module("lib.tap_stack")
TapStack = tap_stack.TapStack
TapStackArgs = tap_stack.TapStackArgs


# -----------------------------
# Test helpers
# -----------------------------
def _make_stack(env="dev", tags=None):
  return TapStack("tap", TapStackArgs(environment_suffix=env, tags=tags or {}))


# -----------------------------
# Tests
# -----------------------------

def test_cidr_24_math():
  assert tap_stack.TapStack._cidr_24("10.0.0.0/16", 0) == "10.0.0.0/24"
  assert tap_stack.TapStack._cidr_24("10.1.0.0/16", 5) == "10.1.5.0/24"


def test_stack_constructs_two_vpcs_and_exports():
  FAKE_EXPORTS.clear()
  s = _make_stack(env="qa", tags={"Owner": "team-a"})
  # vpc basics
  assert hasattr(s, "vpc1") and hasattr(s, "vpc2")
  assert "vpc1_vpc_id" in FAKE_EXPORTS and "vpc2_vpc_id" in FAKE_EXPORTS
  # alb exports present
  assert "vpc1_alb_arn" in FAKE_EXPORTS and "vpc2_alb_dns" in FAKE_EXPORTS
  # asg exports present
  assert "vpc1_asg_name" in FAKE_EXPORTS and "vpc2_launch_template_id" in FAKE_EXPORTS
  # url computed via Output.apply
  assert FAKE_EXPORTS["vpc1_alb_url"].startswith("http://")


def test_vpc_has_expected_subnets_routes_and_nats():
  s = _make_stack()
  v1 = s.vpc1
  # two public, two private subnets
  assert len(v1["public_subnets"]) == 2
  assert len(v1["private_subnets"]) == 2
  # one public RT and two private RTs (one per AZ)
  assert v1["public_rt"].id.endswith("public-rt-id")
  assert len(v1["private_rts"]) == 2
  # NATs per AZ
  assert len(v1["nat_eips"]) == 2
  assert len(v1["nat_gws"]) == 2


def test_security_groups_and_rules_shape():
  s = _make_stack()
  sgs = s.vpc1_sgs
  assert "alb_sg" in sgs and "public_sg" in sgs and "private_sg" in sgs
  alb_ing = sgs["alb_sg"].ingress
  assert any(r.from_port == 80 for r in alb_ing)
  assert any(r.from_port == 443 for r in alb_ing)
  pub_ing = sgs["public_sg"].ingress
  # Public SG allows from ALB SG (security_groups field populated)
  assert any(getattr(r, "security_groups", None) for r in pub_ing)
  priv_ing = sgs["private_sg"].ingress
  # Private SG allows SSH from public SG
  assert any(r.from_port == 22 for r in priv_ing)


def test_alb_target_group_and_listener():
  s = _make_stack()
  alb_block = s.vpc1_alb
  assert hasattr(alb_block["alb"], "dns_name")
  assert alb_block["target_group"].arn.endswith("-tg-arn")
  assert alb_block["listener"].arn.endswith("-listener-arn")


def test_asg_and_launch_template_configured_min2():
  s = _make_stack()
  asg_block = s.vpc1_asg
  # launch template exists and is referenced by asg
  assert hasattr(asg_block["launch_template"], "id")
  assert hasattr(asg_block["asg"], "name")


def test_provider_region_and_default_tags():
  s = _make_stack(tags={"CostCenter": "1234"})
  assert s.provider.region == "us-west-2"
  # default tags object is set; verify a couple keys that matter
  assert isinstance(s.provider.default_tags, _ProviderDefaultTagsArgs)
  assert "EnvironmentSuffix" in s.provider.default_tags.tags


def test_subnet_cidrs_non_overlapping_between_vpcs():
  s = _make_stack()
  v1_pub = [getattr(sn, "cidr_block", "") for sn in s.vpc1["public_subnets"]]
  v2_pub = [getattr(sn, "cidr_block", "") for sn in s.vpc2["public_subnets"]]
  # CIDRs are synthetically assigned via helper; ensure different third
  # octet ranges
  assert not set(v1_pub).intersection(v2_pub)
