import os
import json
import boto3
import pytest
from botocore.exceptions import ClientError

data = {}
outputs_file = os.path.join(
    os.path.dirname(__file__),
    '../../cfn-outputs/flat-outputs.json'
)
if os.path.exists(outputs_file):
  with open(outputs_file, 'r') as f:
    data = json.load(f)

# Convert stringified lists to real lists


def parse_list(val):
  return json.loads(val) if val.startswith('[') else val


for k, v in data.items():
  if isinstance(v, str) and v.startswith('['):
    data[k] = parse_list(v)

# AWS clients
ec2 = boto3.client('ec2')
iam = boto3.client('iam')
logs = boto3.client('logs')
apigw = boto3.client('apigateway')
lambda_client = boto3.client('lambda')
events = boto3.client('events')
kms = boto3.client('kms')

# ---- TEST CASES ----


def test_api_gateway_exists():
  resp = apigw.get_rest_api(restApiId=data['api_id'])
  assert resp['id'] == data['api_id']


def test_api_gateway_stage_exists():
  stage = apigw.get_stage(
      restApiId=data['api_id'],
      stageName=data['api_stage_name'])
  assert stage['stageName'] == data['api_stage_name']


def test_api_gateway_cloudwatch_log_group_exists():
  resp = logs.describe_log_groups(
      logGroupNamePrefix=data['api_log_group_name'])
  assert any(lg['logGroupName'] == data['api_log_group_name']
             for lg in resp['logGroups'])


def test_vpc_exists():
  resp = ec2.describe_vpcs(VpcIds=[data['vpc_id']])
  assert resp['Vpcs'][0]['CidrBlock'] == data['vpc_cidr']


def test_availability_zones_present():
  resp = ec2.describe_availability_zones()
  azs = [az['ZoneName'] for az in resp['AvailabilityZones']]
  for az in data['availability_zones']:
    assert az in azs


@pytest.mark.parametrize("instance_id", data['ec2_instance_ids'])
def test_ec2_instance_running(instance_id):
  resp = ec2.describe_instances(InstanceIds=[instance_id])
  state = resp['Reservations'][0]['Instances'][0]['State']['Name']
  assert state in ('running', 'stopped')


@pytest.mark.parametrize("eip_id", data['elastic_ip_ids'])
def test_eip_exists(eip_id):
  resp = ec2.describe_addresses(AllocationIds=[eip_id])
  assert len(resp['Addresses']) == 1


def test_lambda_function_exists():
  resp = lambda_client.get_function(FunctionName=data['health_lambda_name'])
  assert resp['Configuration']['FunctionName'] == data['health_lambda_name']


def test_lambda_log_group_exists():
  resp = logs.describe_log_groups(
      logGroupNamePrefix=data['health_lambda_log_group'])
  assert any(lg['logGroupName'] == data['health_lambda_log_group']
             for lg in resp['logGroups'])


def test_lambda_role_exists():
  resp = iam.get_role(RoleName=data['health_lambda_role'])
  assert resp['Role']['RoleName'] == data['health_lambda_role']


def test_cloudwatch_event_rule_exists():
  resp = events.describe_rule(Name=data['health_schedule_rule'])
  assert resp['Name'] == data['health_schedule_rule']


def test_internet_gateway_exists():
  resp = ec2.describe_internet_gateways(
      InternetGatewayIds=[data['internet_gateway_id']])
  assert len(resp['InternetGateways']) == 1


def test_kms_key_exists():
  resp = kms.describe_key(KeyId=data['kms_key_id'])
  assert resp['KeyMetadata']['KeyId'] == data['kms_key_id']


def test_kms_alias_exists():
  resp = kms.list_aliases()
  assert any(a['AliasName'] == data['kms_alias'] for a in resp['Aliases'])


def test_security_group_exists():
  resp = ec2.describe_security_groups(
      GroupIds=[data['lambda_security_group_id']])
  assert len(resp['SecurityGroups']) == 1


@pytest.mark.parametrize("nat_id", data['nat_gateway_ids'])
def test_nat_gateway_exists(nat_id):
  resp = ec2.describe_nat_gateways(NatGatewayIds=[nat_id])
  assert len(resp['NatGateways']) == 1


def test_private_nacl_exists():
  resp = ec2.describe_network_acls(NetworkAclIds=[data['private_nacl_id']])
  assert len(resp['NetworkAcls']) == 1


def test_public_nacl_exists():
  resp = ec2.describe_network_acls(NetworkAclIds=[data['public_nacl_id']])
  assert len(resp['NetworkAcls']) == 1


@pytest.mark.parametrize("subnet_id", data['public_subnet_ids'])
def test_public_subnet_exists(subnet_id):
  resp = ec2.describe_subnets(SubnetIds=[subnet_id])
  assert len(resp['Subnets']) == 1


@pytest.mark.parametrize("subnet_id", data['private_subnet_ids'])
def test_private_subnet_exists(subnet_id):
  resp = ec2.describe_subnets(SubnetIds=[subnet_id])
  assert len(resp['Subnets']) == 1


def test_vpc_flow_logs_exists():
  resp = ec2.describe_flow_logs(FlowLogIds=[data['vpc_flow_logs_id']])
  assert len(resp['FlowLogs']) == 1
