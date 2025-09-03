# tests/live/test_vpc_alb_asg_integration.py
import json
import os
from ipaddress import ip_network
from typing import Dict, Any, List, Tuple

import boto3
import botocore
import pytest


@pytest.fixture(scope="session")
def region() -> str:
  return "us-west-2"


@pytest.fixture(scope="session")
def session(region):
  return boto3.Session(region_name=region)


@pytest.fixture(scope="session")
def ec2(session):
  return session.client("ec2")


@pytest.fixture(scope="session")
def elbv2(session):
  return session.client("elbv2")


@pytest.fixture(scope="session")
def autoscaling(session):
  return session.client("autoscaling")


# --- Load outputs.json ---
#
_DEFAULT_FALLBACK_OUTPUTS = {}
#


def _load_outputs() -> Dict[str, Any]:
  path = os.getenv("OUTPUTS_JSON", "./cfn-outputs/all-outputs.json")
  if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
      env = os.getenv("ENVIRONMENT_SUFFIX", "")
      data = json.load(f)
      return data.get(f"TapStack{env}")
  return _DEFAULT_FALLBACK_OUTPUTS.copy()


@pytest.fixture(scope="session")
def outputs() -> Dict[str, Any]:
  return _load_outputs()


# --- Helpers ---

def _get_tags(obj: Dict[str, Any]) -> Dict[str, str]:
  tags = obj.get("Tags") or []
  return {t["Key"]: t["Value"] for t in tags if "Key" in t and "Value" in t}


def _describe_vpc(ec2, vpc_id: str) -> Dict[str, Any]:
  return ec2.describe_vpcs(VpcIds=[vpc_id])["Vpcs"][0]


def _describe_subnets(ec2, subnet_ids: List[str]) -> List[Dict[str, Any]]:
  return ec2.describe_subnets(SubnetIds=subnet_ids)["Subnets"]


def _describe_route_tables(ec2, rt_ids: List[str]) -> List[Dict[str, Any]]:
  return ec2.describe_route_tables(RouteTableIds=rt_ids)["RouteTables"]


def _has_route_to_igw(rt: Dict[str, Any], igw_id: str) -> bool:
  for r in rt.get("Routes", []):
    if r.get("DestinationCidrBlock") == "0.0.0.0/0" and r.get("GatewayId") == igw_id:
      return True
  return False


def _has_route_to_nat(rt: Dict[str, Any], nat_ids: List[str]) -> bool:
  nat_set = set(nat_ids)
  for r in rt.get("Routes", []):
    if r.get(
            "DestinationCidrBlock") == "0.0.0.0/0" and r.get("NatGatewayId") in nat_set:
      return True
  return False


def _sg_allows(sg: Dict[str, Any], port: int, cidr: str) -> bool:
  for perm in sg.get("IpPermissions", []):
    if perm.get("FromPort") == port and perm.get("ToPort") == port:
      for rng in perm.get("IpRanges", []):
        if rng.get("CidrIp") == cidr:
          return True
  return False


def _sg_world_open_ports(sg: Dict[str, Any]) -> List[int]:
  world = []
  for perm in sg.get("IpPermissions", []):
    ports = set()
    if perm.get("IpProtocol") in ("tcp", "-1"):
      fp = perm.get("FromPort")
      tp = perm.get("ToPort")
      if fp is not None and tp is not None:
        ports.update(range(fp, tp + 1))
    for rng in perm.get("IpRanges", []):
      if rng.get("CidrIp") == "0.0.0.0/0":
        world.extend(list(ports or []))
  return sorted(set(world))


# ===============================
# VPC & Subnets (Tests 1..11)
# ===============================

@pytest.mark.live
def test_01_vpc1_exists(ec2, outputs):
  v = _describe_vpc(ec2, outputs["vpc1_vpc_id"])
  assert v["VpcId"] == outputs["vpc1_vpc_id"]


@pytest.mark.live
def test_02_vpc2_exists(ec2, outputs):
  v = _describe_vpc(ec2, outputs["vpc2_vpc_id"])
  assert v["VpcId"] == outputs["vpc2_vpc_id"]


@pytest.mark.live
def test_03_vpc_cidrs_do_not_overlap(ec2, outputs):
  v1 = _describe_vpc(ec2, outputs["vpc1_vpc_id"])
  v2 = _describe_vpc(ec2, outputs["vpc2_vpc_id"])
  n1 = ip_network(v1["CidrBlock"])
  n2 = ip_network(v2["CidrBlock"])
  assert not n1.overlaps(n2), "VPC CIDRs must not overlap"


@pytest.mark.live
def test_04_vpc1_has_2_public_subnets(ec2, outputs):
  subnets = _describe_subnets(ec2, outputs["vpc1_public_subnet_ids"])
  assert len(subnets) == 2


@pytest.mark.live
def test_05_vpc1_has_2_private_subnets(ec2, outputs):
  subnets = _describe_subnets(ec2, outputs["vpc1_private_subnet_ids"])
  assert len(subnets) == 2


@pytest.mark.live
def test_06_vpc2_has_2_public_subnets(ec2, outputs):
  subnets = _describe_subnets(ec2, outputs["vpc2_public_subnet_ids"])
  assert len(subnets) == 2


@pytest.mark.live
def test_07_vpc2_has_2_private_subnets(ec2, outputs):
  subnets = _describe_subnets(ec2, outputs["vpc2_private_subnet_ids"])
  assert len(subnets) == 2


@pytest.mark.live
def test_08_public_subnets_spread_azs(ec2, outputs):
  for key in ("vpc1_public_subnet_ids", "vpc2_public_subnet_ids"):
    azs = {s["AvailabilityZone"] for s in _describe_subnets(ec2, outputs[key])}
    assert len(azs) >= 2


@pytest.mark.live
def test_09_private_subnets_spread_azs(ec2, outputs):
  for key in ("vpc1_private_subnet_ids", "vpc2_private_subnet_ids"):
    azs = {s["AvailabilityZone"] for s in _describe_subnets(ec2, outputs[key])}
    assert len(azs) >= 2


@pytest.mark.live
def test_10_igw_attached_vpc1(ec2, outputs):
  igw = ec2.describe_internet_gateways(
      InternetGatewayIds=[
          outputs["vpc1_igw_id"]])["InternetGateways"][0]
  attachments = [a["VpcId"] for a in igw.get("Attachments", [])]
  assert outputs["vpc1_vpc_id"] in attachments


@pytest.mark.live
def test_11_igw_attached_vpc2(ec2, outputs):
  igw = ec2.describe_internet_gateways(
      InternetGatewayIds=[
          outputs["vpc2_igw_id"]])["InternetGateways"][0]
  attachments = [a["VpcId"] for a in igw.get("Attachments", [])]
  assert outputs["vpc2_vpc_id"] in attachments


# ==================================
# Routing & NAT (Tests 12..21)
# ==================================

@pytest.mark.live
def test_12_public_rt_has_igw_default_route_vpc1(ec2, outputs):
  rts = _describe_route_tables(ec2, [outputs["vpc1_public_rt_id"]])
  assert _has_route_to_igw(rts[0], outputs["vpc1_igw_id"])


@pytest.mark.live
def test_13_public_rt_has_igw_default_route_vpc2(ec2, outputs):
  rts = _describe_route_tables(ec2, [outputs["vpc2_public_rt_id"]])
  assert _has_route_to_igw(rts[0], outputs["vpc2_igw_id"])


@pytest.mark.live
def test_14_vpc1_two_nat_gateways_exist(ec2, outputs):
  nat_ids = outputs["vpc1_nat_gw_ids"]
  resp = ec2.describe_nat_gateways(NatGatewayIds=nat_ids)
  assert len(resp["NatGateways"]) == 2


@pytest.mark.live
def test_15_vpc2_two_nat_gateways_exist(ec2, outputs):
  nat_ids = outputs["vpc2_nat_gw_ids"]
  resp = ec2.describe_nat_gateways(NatGatewayIds=nat_ids)
  assert len(resp["NatGateways"]) == 2


@pytest.mark.live
def test_16_vpc1_nat_have_eips(ec2, outputs):
  ngws = ec2.describe_nat_gateways(
      NatGatewayIds=outputs["vpc1_nat_gw_ids"])["NatGateways"]
  eips = [a.get("AllocationId")
          for g in ngws for a in g.get("NatGatewayAddresses", [])]
  for eid in outputs["vpc1_nat_eip_ids"]:
    assert eid in eips


@pytest.mark.live
def test_17_vpc2_nat_have_eips(ec2, outputs):
  ngws = ec2.describe_nat_gateways(
      NatGatewayIds=outputs["vpc2_nat_gw_ids"])["NatGateways"]
  eips = [a.get("AllocationId")
          for g in ngws for a in g.get("NatGatewayAddresses", [])]
  for eid in outputs["vpc2_nat_eip_ids"]:
    assert eid in eips


@pytest.mark.live
def test_18_vpc1_private_rts_route_to_nat(ec2, outputs):
  rts = _describe_route_tables(ec2, outputs["vpc1_private_rt_ids"])
  assert any(_has_route_to_nat(rt, outputs["vpc1_nat_gw_ids"]) for rt in rts)


@pytest.mark.live
def test_19_vpc2_private_rts_route_to_nat(ec2, outputs):
  rts = _describe_route_tables(ec2, outputs["vpc2_private_rt_ids"])
  assert any(_has_route_to_nat(rt, outputs["vpc2_nat_gw_ids"]) for rt in rts)


@pytest.mark.live
def test_20_vpc1_nat_in_public_subnets(ec2, outputs):
  pub_subnets = set(outputs["vpc1_public_subnet_ids"])
  ngws = ec2.describe_nat_gateways(
      NatGatewayIds=outputs["vpc1_nat_gw_ids"])["NatGateways"]
  subnet_ids = {g["SubnetId"] for g in ngws}
  assert subnet_ids.issubset(pub_subnets)


@pytest.mark.live
def test_21_vpc2_nat_in_public_subnets(ec2, outputs):
  pub_subnets = set(outputs["vpc2_public_subnet_ids"])
  ngws = ec2.describe_nat_gateways(
      NatGatewayIds=outputs["vpc2_nat_gw_ids"])["NatGateways"]
  subnet_ids = {g["SubnetId"] for g in ngws}
  assert subnet_ids.issubset(pub_subnets)


# ==================================
# Security Groups (Tests 22..27)
# ==================================

@pytest.mark.live
def test_22_vpc1_alb_sg_allows_http_https_world(ec2, outputs):
  sg = ec2.describe_security_groups(GroupIds=[outputs["vpc1_alb_sg_id"]])[
      "SecurityGroups"][0]
  assert _sg_allows(sg, 80, "0.0.0.0/0") or _sg_allows(sg, 443, "0.0.0.0/0")


@pytest.mark.live
def test_23_vpc2_alb_sg_allows_http_https_world(ec2, outputs):
  sg = ec2.describe_security_groups(GroupIds=[outputs["vpc2_alb_sg_id"]])[
      "SecurityGroups"][0]
  assert _sg_allows(sg, 80, "0.0.0.0/0") or _sg_allows(sg, 443, "0.0.0.0/0")


@pytest.mark.live
def test_24_vpc1_alb_sg_not_world_open_ssh(ec2, outputs):
  sg = ec2.describe_security_groups(GroupIds=[outputs["vpc1_alb_sg_id"]])[
      "SecurityGroups"][0]
  assert 22 not in _sg_world_open_ports(sg)


@pytest.mark.live
def test_25_vpc2_alb_sg_not_world_open_ssh(ec2, outputs):
  sg = ec2.describe_security_groups(GroupIds=[outputs["vpc2_alb_sg_id"]])[
      "SecurityGroups"][0]
  assert 22 not in _sg_world_open_ports(sg)


@pytest.mark.live
def test_26_vpc1_private_sg_ssh_not_world_open(ec2, outputs):
  sg = ec2.describe_security_groups(GroupIds=[outputs["vpc1_private_sg_id"]])[
      "SecurityGroups"][0]
  assert 22 not in _sg_world_open_ports(sg)


@pytest.mark.live
def test_27_vpc2_private_sg_ssh_not_world_open(ec2, outputs):
  sg = ec2.describe_security_groups(GroupIds=[outputs["vpc2_private_sg_id"]])[
      "SecurityGroups"][0]
  assert 22 not in _sg_world_open_ports(sg)


# ==================================
# Load Balancers & Listeners (Tests 28..33)
# ==================================

def _get_lb_by_arn(elbv2, lb_arn: str) -> Dict[str, Any]:
  return elbv2.describe_load_balancers(LoadBalancerArns=[lb_arn])[
      "LoadBalancers"][0]



# ==================================
# Auto Scaling (Tests 34..39)
# ==================================

def _get_asg(autoscaling, name: str) -> Dict[str, Any]:
  asgs = autoscaling.describe_auto_scaling_groups(
      AutoScalingGroupNames=[name])["AutoScalingGroups"]
  assert asgs, f"ASG {name} not found"
  return asgs[0]


@pytest.mark.live
def test_29_vpc1_asg_exists(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc1_asg_name"])
  assert asg["AutoScalingGroupName"] == outputs["vpc1_asg_name"]


@pytest.mark.live
def test_30_vpc2_asg_exists(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc2_asg_name"])
  assert asg["AutoScalingGroupName"] == outputs["vpc2_asg_name"]


@pytest.mark.live
def test_31_vpc1_asg_desired_at_least_two(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc1_asg_name"])
  assert asg["DesiredCapacity"] >= 2


@pytest.mark.live
def test_32_vpc2_asg_desired_at_least_two(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc2_asg_name"])
  assert asg["DesiredCapacity"] >= 2

