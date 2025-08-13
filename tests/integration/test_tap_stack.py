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
  return os.getenv("AWS_REGION", "us-west-2")


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
_DEFAULT_FALLBACK_OUTPUTS = {
    "vpc1_alb_arn": "arn:aws:elasticloadbalancing:us-west-2:074055094769:loadbalancer/app/tap-vpc1-alb-234c75f/30208911987ab8d7",
    "vpc1_alb_dns": "tap-vpc1-alb-234c75f-1768595759.us-west-2.elb.amazonaws.com",
    "vpc1_alb_sg_id": "sg-058b6cce664801478",
    "vpc1_alb_url": "http://tap-vpc1-alb-234c75f-1768595759.us-west-2.elb.amazonaws.com",
    "vpc1_alb_zone_id": "Z1H1FL5HABSF5",
    "vpc1_asg_name": "tap-vpc1-asg-5d784d0",
    "vpc1_igw_id": "igw-0a0bc00d447b8a5b7",
    "vpc1_launch_template_id": "lt-063e6cf694dfc75f9",
    "vpc1_listener_arn": "arn:aws:elasticloadbalancing:us-west-2:074055094769:listener/app/tap-vpc1-alb-234c75f/30208911987ab8d7/096579da16ce6c6f",
    "vpc1_nat_eip_ids": [
        "eipalloc-05b36783d132d00df",
        "eipalloc-0f50d86b94dc475bb"
    ],
    "vpc1_nat_gw_ids": [
        "nat-051aa7d154600ec0c",
        "nat-0c9a5f198587ed65c"
    ],
    "vpc1_private_rt_ids": [
        "rtb-0ace9a295a26f1590",
        "rtb-08b90dac8817874da"
    ],
    "vpc1_private_sg_id": "sg-0d3fb9b2a0c65b675",
    "vpc1_private_subnet_ids": [
        "subnet-08f941be739edd454",
        "subnet-08f6861c98e5fdd5c"
    ],
    "vpc1_public_rt_id": "rtb-04308a3f588de2ce3",
    "vpc1_public_sg_id": "sg-044c62622a66f3505",
    "vpc1_public_subnet_ids": [
        "subnet-0fd8ea6036fd0e0db",
        "subnet-0ebafbe0b3f5a8b2e"
    ],
    "vpc1_tg_arn": "arn:aws:elasticloadbalancing:us-west-2:074055094769:targetgroup/tap-vpc1-tg-5e0c9e7/e95801e692cb833b",
    "vpc1_vpc_id": "vpc-0ccfb76ec2dbb9888",
    "vpc2_alb_arn": "arn:aws:elasticloadbalancing:us-west-2:074055094769:loadbalancer/app/tap-vpc2-alb-c21ec35/d777088b6c8684ec",
    "vpc2_alb_dns": "tap-vpc2-alb-c21ec35-1009659453.us-west-2.elb.amazonaws.com",
    "vpc2_alb_sg_id": "sg-06fd6c68bf4cba9e3",
    "vpc2_alb_url": "http://tap-vpc2-alb-c21ec35-1009659453.us-west-2.elb.amazonaws.com",
    "vpc2_alb_zone_id": "Z1H1FL5HABSF5",
    "vpc2_asg_name": "tap-vpc2-asg-f8a260f",
    "vpc2_igw_id": "igw-0bf80d0d88ead41d8",
    "vpc2_launch_template_id": "lt-027f33dcc1cad456f",
    "vpc2_listener_arn": "arn:aws:elasticloadbalancing:us-west-2:074055094769:listener/app/tap-vpc2-alb-c21ec35/d777088b6c8684ec/7c4c304f0b788dc7",
    "vpc2_nat_eip_ids": [
        "eipalloc-0112d28d36daa60b5",
        "eipalloc-0b296683d0bad6a63"
    ],
    "vpc2_nat_gw_ids": [
        "nat-01804d40fc638d977",
        "nat-0e71b744d630fc96d"
    ],
    "vpc2_private_rt_ids": [
        "rtb-0c4df7e4204d24430",
        "rtb-0dd853f3498bc4c5a"
    ],
    "vpc2_private_sg_id": "sg-061a15096c1209929",
    "vpc2_private_subnet_ids": [
        "subnet-074978bba46010bde",
        "subnet-0fe0902ba3ae84ead"
    ],
    "vpc2_public_rt_id": "rtb-05eeab3356a7e9fe1",
    "vpc2_public_sg_id": "sg-0aaf8f5a97dc00fb8",
    "vpc2_public_subnet_ids": [
        "subnet-0d01c6cc8c54b7c6c",
        "subnet-064e20724924f161d"
    ],
    "vpc2_tg_arn": "arn:aws:elasticloadbalancing:us-west-2:074055094769:targetgroup/tap-vpc2-tg-c8639b4/5850d312e9837a70",
    "vpc2_vpc_id": "vpc-0adbf394ff697d67a"
}
#


def _load_outputs() -> Dict[str, Any]:
  path = os.getenv("OUTPUTS_JSON", "./cfn-outputs/all-outputs.json")
  if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
      return json.load(f)
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


@pytest.mark.live
def test_28_vpc1_alb_exists(elbv2, outputs):
  lb = _get_lb_by_arn(elbv2, outputs["vpc1_alb_arn"])
  assert lb["DNSName"] == outputs["vpc1_alb_dns"]


@pytest.mark.live
def test_29_vpc2_alb_exists(elbv2, outputs):
  lb = _get_lb_by_arn(elbv2, outputs["vpc2_alb_arn"])
  assert lb["DNSName"] == outputs["vpc2_alb_dns"]


@pytest.mark.live
def test_30_vpc1_listener_exists(elbv2, outputs):
  lst = elbv2.describe_listeners(
      ListenerArns=[
          outputs["vpc1_listener_arn"]])["Listeners"][0]
  assert lst["Port"] in (80, 443)


@pytest.mark.live
def test_31_vpc2_listener_exists(elbv2, outputs):
  lst = elbv2.describe_listeners(
      ListenerArns=[
          outputs["vpc2_listener_arn"]])["Listeners"][0]
  assert lst["Port"] in (80, 443)


@pytest.mark.live
def test_32_vpc1_tg_registered_targets(elbv2, outputs):
  th = elbv2.describe_target_health(TargetGroupArn=outputs["vpc1_tg_arn"])[
      "TargetHealthDescriptions"]
  assert len(th) >= 2


@pytest.mark.live
def test_33_vpc2_tg_registered_targets(elbv2, outputs):
  th = elbv2.describe_target_health(TargetGroupArn=outputs["vpc2_tg_arn"])[
      "TargetHealthDescriptions"]
  assert len(th) >= 2


# ==================================
# Auto Scaling (Tests 34..39)
# ==================================

def _get_asg(autoscaling, name: str) -> Dict[str, Any]:
  asgs = autoscaling.describe_auto_scaling_groups(
      AutoScalingGroupNames=[name])["AutoScalingGroups"]
  assert asgs, f"ASG {name} not found"
  return asgs[0]


@pytest.mark.live
def test_34_vpc1_asg_exists(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc1_asg_name"])
  assert asg["AutoScalingGroupName"] == outputs["vpc1_asg_name"]


@pytest.mark.live
def test_35_vpc2_asg_exists(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc2_asg_name"])
  assert asg["AutoScalingGroupName"] == outputs["vpc2_asg_name"]


@pytest.mark.live
def test_36_vpc1_asg_desired_at_least_two(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc1_asg_name"])
  assert asg["DesiredCapacity"] >= 2


@pytest.mark.live
def test_37_vpc2_asg_desired_at_least_two(autoscaling, outputs):
  asg = _get_asg(autoscaling, outputs["vpc2_asg_name"])
  assert asg["DesiredCapacity"] >= 2


@pytest.mark.live
def test_38_resources_in_us_west_2(elbv2, region, outputs):
  lb = _get_lb_by_arn(elbv2, outputs["vpc1_alb_arn"])
  assert region == "us-west-2"
  assert lb["AvailabilityZones"][0]["ZoneName"].startswith("us-west-2")


#
# # tests/live/test_vpc_alb_asg_integration.py
# import json
# import os
# from ipaddress import ip_network
# from typing import Dict, Any, List
#
# import boto3
# import pytest
#
#
# @pytest.fixture(scope="session")
# def region() -> str:
#     return os.getenv("AWS_REGION", "us-west-2")
#
#
# @pytest.fixture(scope="session")
# def session(region):
#     return boto3.Session(region_name=region)
#
#
# @pytest.fixture(scope="session")
# def ec2(session):
#     return session.client("ec2")
#
#
# @pytest.fixture(scope="session")
# def autoscaling(session):
#     return session.client("autoscaling")
#
#
# # _DEFAULT_FALLBACK_OUTPUTS = { ... }  # Truncated for brevity
#
# def _load_outputs() -> Dict[str, Any]:
#     path = os.getenv("OUTPUTS_JSON", "./cfn-outputs/all-outputs.json")
#     if os.path.exists(path):
#         with open(path, "r", encoding="utf-8") as f:
#             return json.load(f)
#     return _DEFAULT_FALLBACK_OUTPUTS.copy()
#
#
# @pytest.fixture(scope="session")
# def outputs() -> Dict[str, Any]:
#     return _load_outputs()
#
#
# def _describe_vpc(ec2, vpc_id: str) -> Dict[str, Any]:
#     return ec2.describe_vpcs(VpcIds=[vpc_id])["Vpcs"][0]
#
#
# def _describe_subnets(ec2, subnet_ids: List[str]) -> List[Dict[str, Any]]:
#     return ec2.describe_subnets(SubnetIds=subnet_ids)["Subnets"]
#
#
# def _describe_route_tables(ec2, rt_ids: List[str]) -> List[Dict[str, Any]]:
#     return ec2.describe_route_tables(RouteTableIds=rt_ids)["RouteTables"]
#
#
# def _has_route_to_igw(rt: Dict[str, Any], igw_id: str) -> bool:
#     return any(r.get("DestinationCidrBlock") == "0.0.0.0/0" and r.get("GatewayId") == igw_id for r in rt.get("Routes", []))
#
#
# def _has_route_to_nat(rt: Dict[str, Any], nat_ids: List[str]) -> bool:
#     return any(r.get("DestinationCidrBlock") == "0.0.0.0/0" and r.get("NatGatewayId") in nat_ids for r in rt.get("Routes", []))
#
#
# def _sg_allows(sg: Dict[str, Any], port: int, cidr: str) -> bool:
#     return any(perm.get("FromPort") == port and perm.get("ToPort") == port and any(rng.get("CidrIp") == cidr for rng in perm.get("IpRanges", [])) for perm in sg.get("IpPermissions", []))
#
#
# def _sg_world_open_ports(sg: Dict[str, Any]) -> List[int]:
#     world = []
#     for perm in sg.get("IpPermissions", []):
#         ports = set()
#         if perm.get("IpProtocol") in ("tcp", "-1"):
#             fp = perm.get("FromPort")
#             tp = perm.get("ToPort")
#             if fp is not None and tp is not None:
#                 ports.update(range(fp, tp + 1))
#         for rng in perm.get("IpRanges", []):
#             if rng.get("CidrIp") == "0.0.0.0/0":
#                 world.extend(list(ports or []))
#     return sorted(set(world))
#
#
# # ===============================
# # VPC & Subnets
# # ===============================
#
# @pytest.mark.live
# def test_01_vpc1_exists(ec2, outputs):
#     assert _describe_vpc(ec2, outputs["vpc1_vpc_id"])["VpcId"] == outputs["vpc1_vpc_id"]
#
#
# @pytest.mark.live
# def test_02_vpc2_exists(ec2, outputs):
#     assert _describe_vpc(ec2, outputs["vpc2_vpc_id"])["VpcId"] == outputs["vpc2_vpc_id"]
#
#
# @pytest.mark.live
# def test_03_vpc_cidrs_do_not_overlap(ec2, outputs):
#     n1 = ip_network(_describe_vpc(ec2, outputs["vpc1_vpc_id"])["CidrBlock"])
#     n2 = ip_network(_describe_vpc(ec2, outputs["vpc2_vpc_id"])["CidrBlock"])
#     assert not n1.overlaps(n2)
#
#
# @pytest.mark.live
# def test_04_vpc1_has_2_public_subnets(ec2, outputs):
#     assert len(_describe_subnets(ec2, outputs["vpc1_public_subnet_ids"])) == 2
#
#
# @pytest.mark.live
# def test_05_vpc1_has_2_private_subnets(ec2, outputs):
#     assert len(_describe_subnets(ec2, outputs["vpc1_private_subnet_ids"])) == 2
#
#
# @pytest.mark.live
# def test_06_vpc2_has_2_public_subnets(ec2, outputs):
#     assert len(_describe_subnets(ec2, outputs["vpc2_public_subnet_ids"])) == 2
#
#
# @pytest.mark.live
# def test_07_vpc2_has_2_private_subnets(ec2, outputs):
#     assert len(_describe_subnets(ec2, outputs["vpc2_private_subnet_ids"])) == 2
#
#
# @pytest.mark.live
# def test_08_public_subnets_spread_azs(ec2, outputs):
#     for key in ("vpc1_public_subnet_ids", "vpc2_public_subnet_ids"):
#         assert len({s["AvailabilityZone"] for s in _describe_subnets(ec2, outputs[key])}) >= 2
#
#
# @pytest.mark.live
# def test_09_private_subnets_spread_azs(ec2, outputs):
#     for key in ("vpc1_private_subnet_ids", "vpc2_private_subnet_ids"):
#         assert len({s["AvailabilityZone"] for s in _describe_subnets(ec2, outputs[key])}) >= 2
#
#
# @pytest.mark.live
# def test_10_igw_attached_vpc1(ec2, outputs):
#     igw = ec2.describe_internet_gateways(InternetGatewayIds=[outputs["vpc1_igw_id"]])["InternetGateways"][0]
#     assert outputs["vpc1_vpc_id"] in [a["VpcId"] for a in igw.get("Attachments", [])]
#
#
# @pytest.mark.live
# def test_11_igw_attached_vpc2(ec2, outputs):
#     igw = ec2.describe_internet_gateways(InternetGatewayIds=[outputs["vpc2_igw_id"]])["InternetGateways"][0]
#     assert outputs["vpc2_vpc_id"] in [a["VpcId"] for a in igw.get("Attachments", [])]
#
#
# # ==================================
# # Routing & NAT
# # ==================================
#
# @pytest.mark.live
# def test_12_public_rt_has_igw_default_route_vpc1(ec2, outputs):
#     assert _has_route_to_igw(_describe_route_tables(ec2, [outputs["vpc1_public_rt_id"]])[0], outputs["vpc1_igw_id"])
#
#
# @pytest.mark.live
# def test_13_public_rt_has_igw_default_route_vpc2(ec2, outputs):
#     assert _has_route_to_igw(_describe_route_tables(ec2, [outputs["vpc2_public_rt_id"]])[0], outputs["vpc2_igw_id"])
#
#
# @pytest.mark.live
# def test_14_vpc1_two_nat_gateways_exist(ec2, outputs):
#     assert len(ec2.describe_nat_gateways(NatGatewayIds=outputs["vpc1_nat_gw_ids"])["NatGateways"]) == 2
#
#
# @pytest.mark.live
# def test_15_vpc2_two_nat_gateways_exist(ec2, outputs):
#     assert len(ec2.describe_nat_gateways(NatGatewayIds=outputs["vpc2_nat_gw_ids"])["NatGateways"]) == 2
#
#
# @pytest.mark.live
# def test_16_vpc1_nat_have_eips(ec2, outputs):
#     eips = [a.get("AllocationId") for g in ec2.describe_nat_gateways(NatGatewayIds=outputs["vpc1_nat_gw_ids"])["NatGateways"] for a in g.get("NatGatewayAddresses", [])]
#     for eid in outputs["vpc1_nat_eip_ids"]:
#         assert eid in eips
#
#
# @pytest.mark.live
# def test_17_vpc2_nat_have_eips(ec2, outputs):
#     eips = [a.get("AllocationId") for g in ec2.describe_nat_gateways(NatGatewayIds=outputs["vpc2_nat_gw_ids"])["NatGateways"] for a in g.get("NatGatewayAddresses", [])]
#     for eid in outputs["vpc2_nat_eip_ids"]:
#         assert eid in eips
#
#
# @pytest.mark.live
# def test_18_vpc1_private_rts_route_to_nat(ec2, outputs):
#     assert any(_has_route_to_nat(rt, outputs["vpc1_nat_gw_ids"]) for rt in _describe_route_tables(ec2, outputs["vpc1_private_rt_ids"]))
#
#
# @pytest.mark.live
# def test_19_vpc2_private_rts_route_to_nat(ec2, outputs):
#     assert any(_has_route_to_nat(rt, outputs["vpc2_nat_gw_ids"]) for rt in _describe_route_tables(ec2, outputs["vpc2_private_rt_ids"]))
#
#
# @pytest.mark.live
# def test_20_vpc1_nat_in_public_subnets(ec2, outputs):
#     assert {g["SubnetId"] for g in ec2.describe_nat_gateways(NatGatewayIds=outputs["vpc1_nat_gw_ids"])["NatGateways"]}.issubset(set(outputs["vpc1_public_subnet_ids"]))
#
#
# @pytest.mark.live
# def test_21_vpc2_nat_in_public_subnets(ec2, outputs):
#     assert {g["SubnetId"] for g in ec2.describe_nat_gateways(NatGatewayIds=outputs["vpc2_nat_gw_ids"])["NatGateways"]}.issubset(set(outputs["vpc2_public_subnet_ids"]))
#
#
# # ==================================
# # Security Groups
# # ==================================
#
# @pytest.mark.live
# def test_22_vpc1_alb_sg_allows_http_https_world(ec2, outputs):
#     sg = ec2.describe_security_groups(GroupIds=[outputs["vpc1_alb_sg_id"]])["SecurityGroups"][0]
#     assert _sg_allows(sg, 80, "0.0.0.0/0") or _sg_allows(sg, 443, "0.0.0.0/0")
#
#
# @pytest.mark.live
# def test_23_vpc2_alb_sg_allows_http_https_world(ec2, outputs):
#     sg = ec2.describe_security_groups(GroupIds=[outputs["vpc2_alb_sg_id"]])["SecurityGroups"][0]
#     assert _sg_allows(sg, 80, "0.0.0.0/0") or _sg_allows(sg, 443, "0.0.0.0/0")
#
#
# @pytest.mark.live
# def test_24_vpc1_alb_sg_not_world_open_ssh(ec2, outputs):
#     assert 22 not in _sg_world_open_ports(ec2.describe_security_groups(GroupIds=[outputs["vpc1_alb_sg_id"]])["SecurityGroups"][0])
#
#
# @pytest.mark.live
# def test_25_vpc2_alb_sg_not_world_open_ssh(ec2, outputs):
#     assert 22 not in _sg_world_open_ports(ec2.describe_security_groups(GroupIds=[outputs["vpc2_alb_sg_id"]])["SecurityGroups"][0])
#
#
# @pytest.mark.live
# def test_26_vpc1_private_sg_ssh_not_world_open(ec2, outputs):
#     assert 22 not in _sg_world_open_ports(ec2.describe_security_groups(GroupIds=[outputs["vpc1_private_sg_id"]])["SecurityGroups"][0])
#
#
# @pytest.mark.live
# def test_27_vpc2_private_sg_ssh_not_world_open(ec2, outputs):
#     assert 22 not in _sg_world_open_ports(ec2.describe_security_groups(GroupIds=[outputs["vpc2_private_sg_id"]])["SecurityGroups"][0])
#
#
# # ==================================
# # Auto Scaling
# # ==================================
#
# def _get_asg(autoscaling, name: str) -> Dict[str, Any]:
#     asgs = autoscaling.describe_auto_scaling_groups(AutoScalingGroupNames=[name])["AutoScalingGroups"]
#     assert asgs, f"ASG {name} not found"
#     return asgs[0]
#
#
# @pytest.mark.live
# def test_34_vpc1_asg_exists(autoscaling, outputs):
#     assert _get_asg(autoscaling, outputs["vpc1_asg_name"])["AutoScalingGroupName"] == outputs["vpc1_asg_name"]
#
#
# @pytest.mark.live
# def test_35_vpc2_asg_exists(autoscaling, outputs):
#     assert _get_asg(autoscaling, outputs["vpc2_asg_name"])["AutoScalingGroupName"] == outputs["vpc2_asg_name"]
#
#
# @pytest.mark.live
# def test_36_vpc1_asg_desired_at_least_two(autoscaling, outputs):
#     assert _get_asg(autoscaling, outputs["vpc1_asg_name"])["DesiredCapacity"] >= 2
#
#
# @pytest.mark.live
# def test_37_vpc2_asg_desired_at_least_two(autoscaling, outputs):
#     assert _get_asg(autoscaling, outputs["vpc2_asg_name"])["DesiredCapacity"] >= 2
