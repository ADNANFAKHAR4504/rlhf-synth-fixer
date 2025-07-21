import os
import pytest
import boto3

STACK_NAME = f"TapStack-{os.getenv('ENVIRONMENT_SUFFIX', 'dev')}"

@pytest.fixture(scope="module")
def boto_cfn():
    return boto3.client("cloudformation")

@pytest.fixture(scope="module")
def boto_ec2():
    return boto3.client("ec2")

@pytest.fixture(scope="module")
def outputs(boto_cfn):
    response = boto_cfn.describe_stacks(StackName=STACK_NAME)
    return {o["OutputKey"]: o["OutputValue"] for o in response["Stacks"][0]["Outputs"]}

def test_stack_deployed(boto_cfn):
    resp = boto_cfn.describe_stacks(StackName=STACK_NAME)
    status = resp["Stacks"][0]["StackStatus"]
    assert status in ("CREATE_COMPLETE", "UPDATE_COMPLETE")

def test_vpc_exists(boto_ec2, outputs):
    vpc_id = outputs["VPCId"]
    resp = boto_ec2.describe_vpcs(VpcIds=[vpc_id])
    assert resp["Vpcs"][0]["State"] == "available"

def test_subnets_exist(boto_ec2, outputs):
    for key in ("PublicSubnetId", "PrivateSubnetId"):
        sid = outputs[key]
        resp = boto_ec2.describe_subnets(SubnetIds=[sid])
        assert resp["Subnets"][0]["State"] == "available"

def test_internet_gateway_attached(boto_ec2, outputs):
    vpc_id = outputs["VPCId"]
    resp = boto_ec2.describe_internet_gateways(Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}])
    assert len(resp["InternetGateways"]) == 1

def test_nat_gateway_exists(boto_ec2, outputs):
    # Find NAT Gateways in the VPC's public subnet
    sid = outputs["PublicSubnetId"]
    resp = boto_ec2.describe_nat_gateways(Filter=[{"Name":"subnet-id","Values":[sid]}])
    ngw = resp["NatGateways"]
    assert len(ngw) == 1
    assert ngw[0]["State"] in ("available", "pending")

def test_route_tables_attached(boto_ec2, outputs):
    vpc_id = outputs["VPCId"]
    rts = boto_ec2.describe_route_tables(Filters=[{"Name":"vpc-id","Values":[vpc_id]}])["RouteTables"]
    # Should have at least one route table with IGW route and one with NAT route
    has_igw_route = False
    has_nat_route = False
    for rt in rts:
        for route in rt.get("Routes", []):
            if route.get("GatewayId") and route["DestinationCidrBlock"] == "0.0.0.0/0":
                has_igw_route = True
            if route.get("NatGatewayId") and route["DestinationCidrBlock"] == "0.0.0.0/0":
                has_nat_route = True

    assert has_igw_route, "Route table without IGW default route"
    assert has_nat_route, "Route table without NAT Gateway default route"

def test_instances_running_and_public_ip(boto_ec2, outputs):
    pub_id = outputs["PublicInstanceId"]
    priv_id = outputs["PrivateInstanceId"]
    resp = boto_ec2.describe_instances(InstanceIds=[pub_id, priv_id])
    states = {i["State"]["Name"] for r in resp["Reservations"] for i in r["Instances"]}
    assert "running" in states
    # Check public instance has a public IP
    pub = next(i for r in resp["Reservations"] for i in r["Instances"] if i["InstanceId"] == pub_id)
    assert "PublicIpAddress" in pub
