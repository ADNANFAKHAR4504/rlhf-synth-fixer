# Pulumi Python Infrastructure Code

This file contains the complete Pulumi Python infrastructure code from the lib folder.

## __init__.py

```python
```

## tap_stack.py

```python
import os
import json
from typing import Optional, Dict, Any

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class Config:
  """Configuration class for environment-specific settings."""

  def __init__(self, environment: str = "dev"):
    self.environment = environment
    self.region = os.getenv("AWS_REGION", "us-west-2")
    self.project_name = "ecommerce"

  def get_resource_name(self, resource_type: str) -> str:
    return f"{self.project_name}-{resource_type}-{self.environment}"

  def get_vpc_config(self) -> Dict[str, Any]:
    return {
        "cidr_block": "10.0.0.0/16",
        "public_subnet_cidrs": ["10.0.1.0/24", "10.0.2.0/24"],
        "private_subnet_cidrs": ["10.0.3.0/24", "10.0.4.0/24"]
    }

  def get_dynamodb_config(self) -> Dict[str, Any]:
    capacity_configs = {
        "dev": {"read": 5, "write": 5},
        "staging": {"read": 10, "write": 10},
        "prod": {"read": 50, "write": 50}
    }
    return capacity_configs.get(self.environment, capacity_configs["dev"])

  def get_cors_domains(self) -> list:
    domains = {
        "dev": ["http://localhost:3000"],
        "staging": ["https://staging.ecommerce.com"],
        "prod": ["https://ecommerce.com", "https://www.ecommerce.com"]
    }
    return domains.get(self.environment, domains["dev"])


class VPCInfrastructure:
  def __init__(self, config: Config):
    self.config = config
    self.vpc = None
    self.public_subnets = []
    self.private_subnets = []
    self.security_group = None

  def create_vpc(self) -> None:
    vpc_config = self.config.get_vpc_config()
    self.vpc = aws.ec2.Vpc(
        self.config.get_resource_name("vpc"),
        cidr_block=vpc_config["cidr_block"],
        enable_dns_hostnames=True,
        enable_dns_support=True
    )
    pulumi.export("VpcId", self.vpc.id)
    pulumi.export("VpcCidr", self.vpc.cidr_block)

    igw = aws.ec2.InternetGateway(
        self.config.get_resource_name("igw"),
        vpc_id=self.vpc.id
    )
    pulumi.export("InternetGatewayId", igw.id)

    availability_zones = aws.get_availability_zones(state="available")

    for i, cidr in enumerate(vpc_config["public_subnet_cidrs"]):
      subnet = aws.ec2.Subnet(
          f"{self.config.get_resource_name('public-subnet')}-{i + 1}",
          vpc_id=self.vpc.id,
          cidr_block=cidr,
          availability_zone=availability_zones.names[i],
          map_public_ip_on_launch=True
      )
      self.public_subnets.append(subnet)
      pulumi.export(f"PublicSubnet-{i + 1}Id", subnet.id)
      pulumi.export(f"PublicSubnet-{i + 1}Az", subnet.availability_zone)

    for i, cidr in enumerate(vpc_config["private_subnet_cidrs"]):
      subnet = aws.ec2.Subnet(
          f"{self.config.get_resource_name('private-subnet')}-{i + 1}",
          vpc_id=self.vpc.id,
          cidr_block=cidr,
          availability_zone=availability_zones.names[i]
      )
      self.private_subnets.append(subnet)
      pulumi.export(f"PrivateSubnet-{i + 1}Id", subnet.id)
      pulumi.export(f"PrivateSubnet-{i + 1}Az", subnet.availability_zone)

    public_rt = aws.ec2.RouteTable(
        self.config.get_resource_name("public-rt"),
        vpc_id=self.vpc.id
    )
    pulumi.export("PublicRouteTableId", public_rt.id)

    aws.ec2.Route(
        self.config.get_resource_name("public-route"),
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    for i, subnet in enumerate(self.public_subnets):
      assoc = aws.ec2.RouteTableAssociation(
          f"{self.config.get_resource_name('public-rta')}-{i + 1}",
          subnet_id=subnet.id,
          route_table_id=public_rt.id
      )
      pulumi.export(f"PublicRTA-{i + 1}Id", assoc.id)

    self.security_group = aws.ec2.SecurityGroup(
        self.config.get_resource_name("lambda-sg"),
        description="Security group for Lambda functions",
        vpc_id=self.vpc.id,
        egress=[{"protocol": "-1", "from_port": 0, "to_port": 0, "cidr_blocks": ["0.0.0.0/0"]}]
    )
    pulumi.export("LambdaSecurityGroupId", self.security_group.id)


class IAMInfrastructure:
  def __init__(self, config: Config):
    self.config = config
    self.lambda_role = None

  def create_lambda_role(self) -> aws.iam.Role:
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"}
        }]
    })

    self.lambda_role = aws.iam.Role(
        self.config.get_resource_name("lambda-role"),
        assume_role_policy=assume_role_policy
    )
    pulumi.export("LambdaRoleArn", self.lambda_role.arn)

    aws.iam.RolePolicyAttachment(
        self.config.get_resource_name("lambda-basic-execution"),
        role=self.lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")

    aws.iam.RolePolicyAttachment(
        self.config.get_resource_name("lambda-vpc-access"),
        role=self.lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")

    dynamodb_policy = aws.iam.Policy(
        self.config.get_resource_name("lambda-dynamodb-policy"),
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"
                ],
                "Resource": f"arn:aws:dynamodb:{self.config.region}:*:table/{self.config.project_name}-*-{self.config.environment}"
            }]
        })
    )
    pulumi.export("LambdaDynamoDBPolicyArn", dynamodb_policy.arn)

    aws.iam.RolePolicyAttachment(
        self.config.get_resource_name("lambda-dynamodb-attachment"),
        role=self.lambda_role.name,
        policy_arn=dynamodb_policy.arn
    )

    return self.lambda_role


class DynamoDBInfrastructure:
  def __init__(self, config: Config):
    self.config = config
    self.tables = {}

  def create_tables(self) -> dict:
    capacity = self.config.get_dynamodb_config()
    self.tables['products'] = aws.dynamodb.Table(
        self.config.get_resource_name("products-table"),
        attributes=[{"name": "product_id", "type": "S"}],
        hash_key="product_id",
        read_capacity=capacity["read"],
        write_capacity=capacity["write"]
    )
    pulumi.export("ProductsTableName", self.tables['products'].name)

    self.tables['orders'] = aws.dynamodb.Table(
        self.config.get_resource_name("orders-table"),
        attributes=[{"name": "order_id", "type": "S"}],
        hash_key="order_id",
        read_capacity=capacity["read"],
        write_capacity=capacity["write"]
    )
    pulumi.export("OrdersTableName", self.tables['orders'].name)

    self.tables['users'] = aws.dynamodb.Table(
        self.config.get_resource_name("users-table"),
        attributes=[{"name": "user_id", "type": "S"}],
        hash_key="user_id",
        read_capacity=capacity["read"],
        write_capacity=capacity["write"]
    )
    pulumi.export("UsersTableName", self.tables['users'].name)

    return self.tables


class LambdaInfrastructure:
  def __init__(
          self,
          config: Config,
          iam_role: aws.iam.Role,
          vpc: VPCInfrastructure,
          tables: dict):
    self.config = config
    self.iam_role = iam_role
    self.vpc = vpc
    self.tables = tables
    self.functions = {}

  def create_lambda_functions(self) -> dict:
    env_vars = {
        "ENVIRONMENT": self.config.environment,
        "REGION": self.config.region,
        "PRODUCTS_TABLE": self.tables['products'].name,
        "ORDERS_TABLE": self.tables['orders'].name,
        "USERS_TABLE": self.tables['users'].name
    }

    vpc_conf = {
        "subnet_ids": [subnet.id for subnet in self.vpc.private_subnets],
        "security_group_ids": [self.vpc.security_group.id]
    }

    for fn in ["products", "orders", "users"]:
      self.functions[fn] = aws.lambda_.Function(
          self.config.get_resource_name(f"{fn}-lambda"),
          runtime="python3.9",
          code=pulumi.AssetArchive({".": pulumi.FileArchive(f"./lib/lambda/")}),
          handler="lib.lambda.handler.lambda_handler",
          role=self.iam_role.arn,
          environment={"variables": {**env_vars, "FUNCTION_NAME": fn}},
          vpc_config=vpc_conf,
          timeout=30,
          memory_size=256
      )
      pulumi.export(f"{fn.capitalize()}LambdaArn", self.functions[fn].arn)
      pulumi.export(f"{fn.capitalize()}LambdaName", self.functions[fn].name)

    return self.functions


class APIGatewayInfrastructure:
  def __init__(self, config: Config, lambda_functions: dict):
    self.config = config
    self.lambda_functions = lambda_functions

  def create_api_gateway(self) -> aws.apigateway.RestApi:
    api = aws.apigateway.RestApi(
        self.config.get_resource_name("api"),
        description=f"E-commerce API for {self.config.environment}"
    )
    pulumi.export("ApiGatewayId", api.id)
    pulumi.export("ApiGatewayName", api.name)

    for fn in ["products", "orders", "users"]:
      resource = aws.apigateway.Resource(
          self.config.get_resource_name(f"{fn}-resource"),
          rest_api=api.id,
          parent_id=api.root_resource_id,
          path_part=fn
      )
      pulumi.export(f"{fn.capitalize()}ApiResourceId", resource.id)

      method = aws.apigateway.Method(
          self.config.get_resource_name(f"{fn}-method"),
          rest_api=api.id,
          resource_id=resource.id,
          http_method="ANY",
          authorization="NONE"
      )
      pulumi.export(f"{fn.capitalize()}ApiMethodId", method.id)

      integration = aws.apigateway.Integration(
          self.config.get_resource_name(f"{fn}-integration"),
          rest_api=api.id,
          resource_id=resource.id,
          http_method=method.http_method,
          integration_http_method="POST",
          type="AWS_PROXY",
          uri=self.lambda_functions[fn].invoke_arn
      )
      pulumi.export(f"{fn.capitalize()}ApiIntegrationId", integration.id)

    return api


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags
    self.config = Config(args.environment_suffix)

    def setup_infrastructure(self):
      vpc = VPCInfrastructure(self.config)
      vpc.create_vpc()

      iam = IAMInfrastructure(self.config)
      lambda_role = iam.create_lambda_role()

      dynamo = DynamoDBInfrastructure(self.config)
      tables = dynamo.create_tables()

      lambdas = LambdaInfrastructure(self.config, lambda_role, vpc, tables)
      lambda_functions = lambdas.create_lambda_functions()

      api = APIGatewayInfrastructure(self.config, lambda_functions)
      api.create_api_gateway()

      pulumi.export("Environment", self.config.environment)
      pulumi.export("Region", self.config.region)

    setup_infrastructure(self)
```

## lambda/handler.py

```python
import json
import os
import boto3
from botocore.exceptions import ClientError

# Shared DynamoDB initialization
dynamodb = boto3.resource("dynamodb", region_name=os.getenv("REGION"))

# Table reference will differ per Lambda deployment via environment variables
table_name = os.getenv("TABLE_NAME")
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """Generic CRUD Lambda handler for table operations."""
    http_method = event.get("httpMethod")
    path_params = event.get("pathParameters") or {}
    body = event.get("body")

    try:
        if http_method == "GET":
            if path_params:
                return get_item(path_params)
            return list_items()
        elif http_method == "POST":
            return create_item(json.loads(body or "{}"))
        elif http_method == "DELETE":
            return delete_item(path_params)
        else:
            return response(405, {"error": "Method not allowed"})
    except Exception as e:
        return response(500, {"error": str(e)})

def get_item(keys):
    try:
        result = table.get_item(Key=keys)
        if "Item" not in result:
            return response(404, {"error": "Item not found"})
        return response(200, result["Item"])
    except ClientError as e:
        return response(500, {"error": e.response["Error"]["Message"]})

def list_items():
    items = table.scan().get("Items", [])
    return response(200, {"items": items})

def create_item(item_data):
    if not item_data:
        return response(400, {"error": "No item data provided"})
    table.put_item(Item=item_data)
    return response(201, {"message": "Item created"})

def delete_item(keys):
    if not keys:
        return response(400, {"error": "No key provided"})
    table.delete_item(Key=keys)
    return response(200, {"message": "Item deleted"})

def response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }
```
