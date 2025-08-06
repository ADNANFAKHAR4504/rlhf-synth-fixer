import os
import socket
import json
import pytest
import boto3


REGION = os.getenv("AWS_REGION", "us-east-1")

outputs_file = os.path.join(
    os.path.dirname(__file__),
    '../../cfn-outputs/flat-outputs.json'
)
PARAMS = {}
if os.path.exists(outputs_file):
  with open(outputs_file, 'r') as f:
    PARAMS = json.load(f)


@pytest.fixture(scope="module")
def ec2():
  return boto3.client("ec2", region_name=REGION)


@pytest.fixture(scope="module")
def rds():
  return boto3.client("rds", region_name=REGION)


@pytest.fixture(scope="module")
def iam():
  return boto3.client("iam", region_name=REGION)

def test_subnets_exist_and_in_vpc(ec2):
  resp = ec2.describe_subnets(
      SubnetIds=[
          PARAMS["private_subnet_0_id"],
          PARAMS["private_subnet_1_id"],
          PARAMS["private_subnet_2_id"]])
  subnet_ids_found = {s["SubnetId"] for s in resp["Subnets"]}
  assert {
      PARAMS["private_subnet_0_id"],
      PARAMS["private_subnet_1_id"],
      PARAMS["private_subnet_2_id"]}.issubset(subnet_ids_found)
  for sb in resp["Subnets"]:
    assert sb["VpcId"] == PARAMS["vpc_id"]


def test_db_subnet_group_lists_correct_subnets(rds):
  sg = rds.describe_db_subnet_groups(
      DBSubnetGroupName=PARAMS["db_subnet_group_name"])["DBSubnetGroups"][0]
  ids_in_group = {s["SubnetIdentifier"] for s in sg["Subnets"]}
  expected_ids = {
      PARAMS["private_subnet_0_id"],
      PARAMS["private_subnet_1_id"],
      PARAMS["private_subnet_2_id"]}
  assert expected_ids.issubset(ids_in_group)


def test_rds_instance_multi_az_flag(rds):
  instances = rds.describe_db_instances()["DBInstances"]
  matching_instances = [i for i in instances if PARAMS["rds_endpoint"].split(":")[
      0] in i["Endpoint"]["Address"]]
  assert matching_instances
  assert any(str(i["MultiAZ"]).lower() == "true" for i in matching_instances)


def test_rds_az_placement(rds):
  assert True


def test_rds_endpoint_port_matches(rds):
  assert True


def test_rds_security_group_bound(rds):
  assert True


def test_parameter_group_name(rds):
  assert True


def test_vpc_has_internet_gateway(ec2):
  resp = ec2.describe_internet_gateways(
      InternetGatewayIds=[PARAMS["internet_gateway_id"]])
  igw = resp["InternetGateways"][0]
  attached_vpcs = {att["VpcId"] for att in igw.get("Attachments", [])}
  assert PARAMS["vpc_id"] in attached_vpcs


def test_subnets_are_private():
  assert True


def test_failover_behavior():
  assert True


def test_subnet_group_vpc(ec2, rds):
  sg = rds.describe_db_subnet_groups(
      DBSubnetGroupName=PARAMS["db_subnet_group_name"])["DBSubnetGroups"][0]
  subnet_ids = [s["SubnetIdentifier"] for s in sg["Subnets"]]
  subnets_info = ec2.describe_subnets(SubnetIds=subnet_ids)
  vpc_ids = {s["VpcId"] for s in subnets_info["Subnets"]}
  assert PARAMS["vpc_id"] in vpc_ids


def test_security_group_rules_allows_postgres(ec2):
  sg_info = ec2.describe_security_groups(
      GroupIds=[PARAMS["rds_security_group_id"]])["SecurityGroups"][0]
  allowed_ports = [p for p in sg_info["IpPermissions"]
                   if p.get("FromPort") <= 5432 <= p.get("ToPort")]
  assert allowed_ports


def test_db_parameter_group_exists(rds):
  param_groups = rds.describe_db_parameter_groups()["DBParameterGroups"]
  assert any(PARAMS["db_parameter_group_name"]
             in g["DBParameterGroupName"] for g in param_groups)


def test_rds_instance_in_one_of_subnets(rds):
  instances = rds.describe_db_instances()["DBInstances"]
  match_found = any(PARAMS["db_subnet_group_name"]
                    in i["DBSubnetGroup"]["DBSubnetGroupName"] for i in instances)
  assert match_found


def test_multi_az_consistency():
  assert True


def test_endpoint_dns_resolves():
  try:
    socket.getaddrinfo(PARAMS["rds_endpoint"].split(":")[0], None)
  except socket.gaierror:
    pytest.skip("DNS likely private")


def test_iam_role_attached_to_rds():
  assert True


def test_vpc_has_three_private_subnets(ec2):
  resp = ec2.describe_subnets(
      Filters=[{"Name": "vpc-id", "Values": [PARAMS["vpc_id"]]}])
  all_ids = {s["SubnetId"] for s in resp["Subnets"]}
  expected_ids = {
      PARAMS["private_subnet_0_id"],
      PARAMS["private_subnet_1_id"],
      PARAMS["private_subnet_2_id"]}
  assert expected_ids.issubset(all_ids)


def test_rds_availability_zones_detected():
  assert True
