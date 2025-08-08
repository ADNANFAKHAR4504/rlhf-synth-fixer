import os
import json
import boto3
import pytest

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
OUTPUTS_FILE = 'cfn-outputs/flat-outputs.json'


@pytest.fixture(scope="session")
def outputs():
  with open(OUTPUTS_FILE) as f:
    return json.load(f)


@pytest.fixture(scope="session")
def boto_clients():
  return {
      "ec2": boto3.client("ec2", region_name=AWS_REGION),
      "lambda": boto3.client("lambda", region_name=AWS_REGION),
      "apigateway": boto3.client("apigateway", region_name=AWS_REGION),
      "dynamodb": boto3.client("dynamodb", region_name=AWS_REGION)
  }

# ---------- VPC ----------


def test_vpc(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  vpc_id = outputs["VpcId"]
  resp = ec2.describe_vpcs(VpcIds=[vpc_id])
  assert resp["Vpcs"], f"VPC {vpc_id} not found"


def test_vpc_cidr(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  vpc_id = outputs["VpcId"]
  resp = ec2.describe_vpcs(VpcIds=[vpc_id])
  assert resp["Vpcs"][0]["CidrBlock"] == outputs["VpcCidr"]

# ---------- Subnets ----------


def test_public_subnet_1(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  resp = ec2.describe_subnets(SubnetIds=[outputs["PublicSubnet-1Id"]])
  assert resp["Subnets"], "Public Subnet 1 not found"


def test_public_subnet_2(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  resp = ec2.describe_subnets(SubnetIds=[outputs["PublicSubnet-2Id"]])
  assert resp["Subnets"], "Public Subnet 2 not found"


def test_private_subnet_1(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  resp = ec2.describe_subnets(SubnetIds=[outputs["PrivateSubnet-1Id"]])
  assert resp["Subnets"], "Private Subnet 1 not found"


def test_private_subnet_2(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  resp = ec2.describe_subnets(SubnetIds=[outputs["PrivateSubnet-2Id"]])
  assert resp["Subnets"], "Private Subnet 2 not found"

# ---------- Networking ----------


def test_security_group(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  resp = ec2.describe_security_groups(
      GroupIds=[outputs["LambdaSecurityGroupId"]])
  assert resp["SecurityGroups"], "Lambda Security Group not found"


def test_internet_gateway(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  resp = ec2.describe_internet_gateways(
      InternetGatewayIds=[outputs["InternetGatewayId"]])
  assert resp["InternetGateways"], "Internet Gateway not found"


def test_public_route_table(boto_clients, outputs):
  ec2 = boto_clients["ec2"]
  resp = ec2.describe_route_tables(
      RouteTableIds=[outputs["PublicRouteTableId"]])
  assert resp["RouteTables"], "Public Route Table not found"

# ---------- Lambda ----------


def test_orders_lambda(boto_clients, outputs):
  lambda_client = boto_clients["lambda"]
  resp = lambda_client.get_function(FunctionName=outputs["OrdersLambdaName"])
  assert "Configuration" in resp, "Orders Lambda not found"


def test_products_lambda(boto_clients, outputs):
  lambda_client = boto_clients["lambda"]
  resp = lambda_client.get_function(FunctionName=outputs["ProductsLambdaName"])
  assert "Configuration" in resp, "Products Lambda not found"


def test_users_lambda(boto_clients, outputs):
  lambda_client = boto_clients["lambda"]
  resp = lambda_client.get_function(FunctionName=outputs["UsersLambdaName"])
  assert "Configuration" in resp, "Users Lambda not found"

# ---------- DynamoDB ----------


def test_orders_table(boto_clients, outputs):
  dynamodb_client = boto_clients["dynamodb"]
  resp = dynamodb_client.describe_table(TableName=outputs["OrdersTableName"])
  assert resp["Table"]["TableStatus"] in ["ACTIVE", "UPDATING"]


def test_products_table(boto_clients, outputs):
  dynamodb_client = boto_clients["dynamodb"]
  resp = dynamodb_client.describe_table(TableName=outputs["ProductsTableName"])
  assert resp["Table"]["TableStatus"] in ["ACTIVE", "UPDATING"]


def test_users_table(boto_clients, outputs):
  dynamodb_client = boto_clients["dynamodb"]
  resp = dynamodb_client.describe_table(TableName=outputs["UsersTableName"])
  assert resp["Table"]["TableStatus"] in ["ACTIVE", "UPDATING"]
