# Pulumi Python Infrastructure Code

This file contains the complete Pulumi Python infrastructure code from the lib folder.

## __init__.py

```python
```

## tap_stack.py

```python
# tap_stack.py
import json
from typing import Any, Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from pulumi.log import warn


class TapStackArgs:
  def __init__(
      self,
      environment_suffix: Optional[str] = None,
      tags: Optional[dict] = None,
  ) -> None:
    self.environment_suffix = environment_suffix or "dev"
    # Ensure default tag for environment is present when args are provided
    self.tags = tags or {"Environment": "Production"}


class SecureVPC:
  """
  Secure VPC module retained from original file.
  It already creates a VPC, public/private subnets in 2 AZs, NATs, route tables,
  NACLs and VPC Flow Logs.
  """

  def __init__(self, name_prefix: str, vpc_cidr: str,
               tags: Dict[str, str]) -> None:
    self.name_prefix = name_prefix
    self.vpc_cidr = vpc_cidr
    self.tags = tags
    self.region = aws.get_region().name
    # limit to two AZs to satisfy requirement
    self.availability_zones = aws.get_availability_zones(
        state="available"
    ).names[:2]

    self.vpc = self._create_vpc()
    self.igw = self._create_internet_gateway()
    self.public_subnets = self._create_public_subnets()
    self.private_subnets = self._create_private_subnets()
    self.eips = self._create_elastic_ips()
    self.nat_gateways = self._create_nat_gateways()
    self.public_rt = self._create_public_route_table()
    self.private_rts = self._create_private_route_tables()
    self.public_nacl = self._create_public_nacl()
    self.private_nacl = self._create_private_nacl()
    self.flow_logs_role = self._create_flow_logs_role()
    self.flow_logs = self._create_flow_logs()

  def _create_vpc(self) -> aws.ec2.Vpc:
    return aws.ec2.Vpc(
        f"{self.name_prefix}-vpc",
        cidr_block=self.vpc_cidr,
        enable_dns_support=True,
        enable_dns_hostnames=True,
        tags={**self.tags, "Name": f"{self.name_prefix}-vpc"},
    )

  def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
    return aws.ec2.InternetGateway(
        f"{self.name_prefix}-igw",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-igw"},
    )

  def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
    subnets: List[aws.ec2.Subnet] = []
    for i, az in enumerate(self.availability_zones):
      subnets.append(
          aws.ec2.Subnet(
              f"{self.name_prefix}-public-{i + 1}",
              vpc_id=self.vpc.id,
              cidr_block=f"10.0.{i + 1}.0/24",
              availability_zone=az,
              map_public_ip_on_launch=True,
              tags={
                  **self.tags,
                  "Name": f"{self.name_prefix}-public-{i + 1}",
              },
          )
      )
    return subnets

  def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
    subnets: List[aws.ec2.Subnet] = []
    for i, az in enumerate(self.availability_zones):
      subnets.append(
          aws.ec2.Subnet(
              f"{self.name_prefix}-private-{i + 1}",
              vpc_id=self.vpc.id,
              cidr_block=f"10.0.{(i + 1) * 10}.0/24",
              availability_zone=az,
              tags={
                  **self.tags,
                  "Name": f"{self.name_prefix}-private-{i + 1}",
              },
          )
      )
    return subnets

  def _create_elastic_ips(self) -> List[aws.ec2.Eip]:
    return [
        aws.ec2.Eip(
            f"{self.name_prefix}-nat-eip-{i + 1}",
            domain="vpc",
            tags={**self.tags, "Name": f"{self.name_prefix}-nat-eip-{i + 1}"},
        )
        for i in range(len(self.availability_zones))
    ]

  def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
    return [
        aws.ec2.NatGateway(
            f"{self.name_prefix}-nat-{i + 1}",
            allocation_id=self.eips[i].id,
            subnet_id=self.public_subnets[i].id,
            tags={**self.tags, "Name": f"{self.name_prefix}-nat-{i + 1}"},
        )
        for i in range(len(self.availability_zones))
    ]

  def _create_public_route_table(self) -> aws.ec2.RouteTable:
    rt = aws.ec2.RouteTable(
        f"{self.name_prefix}-public-rt",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-public-rt"},
    )
    aws.ec2.Route(
        f"{self.name_prefix}-public-route",
        route_table_id=rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=self.igw.id,
    )
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
          f"{self.name_prefix}-public-rta-{i + 1}",
          route_table_id=rt.id,
          subnet_id=subnet.id,
      )
    return rt

  def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
    rts: List[aws.ec2.RouteTable] = []
    for i, subnet in enumerate(self.private_subnets):
      rt = aws.ec2.RouteTable(
          f"{self.name_prefix}-private-rt-{i + 1}",
          vpc_id=self.vpc.id,
          tags={**self.tags, "Name": f"{self.name_prefix}-private-rt-{i + 1}"},
      )
      aws.ec2.Route(
          f"{self.name_prefix}-private-route-{i + 1}",
          route_table_id=rt.id,
          destination_cidr_block="0.0.0.0/0",
          nat_gateway_id=self.nat_gateways[i].id,
      )
      aws.ec2.RouteTableAssociation(
          f"{self.name_prefix}-private-rta-{i + 1}",
          route_table_id=rt.id,
          subnet_id=subnet.id,
      )
      rts.append(rt)
    return rts

  def _create_public_nacl(self) -> aws.ec2.NetworkAcl:
    nacl = aws.ec2.NetworkAcl(
        f"{self.name_prefix}-public-nacl",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-public-nacl"},
    )
    aws.ec2.NetworkAclRule(
        f"{self.name_prefix}-public-http",
        network_acl_id=nacl.id,
        rule_number=100,
        protocol="tcp",
        rule_action="allow",
        from_port=80,
        to_port=80,
        cidr_block="0.0.0.0/0",
    )
    aws.ec2.NetworkAclRule(
        f"{self.name_prefix}-public-https",
        network_acl_id=nacl.id,
        rule_number=110,
        protocol="tcp",
        rule_action="allow",
        from_port=443,
        to_port=443,
        cidr_block="0.0.0.0/0",
    )
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.NetworkAclAssociation(
          f"{self.name_prefix}-public-nacl-assoc-{i + 1}",
          network_acl_id=nacl.id,
          subnet_id=subnet.id,
      )
    return nacl

  def _create_private_nacl(self) -> aws.ec2.NetworkAcl:
    nacl = aws.ec2.NetworkAcl(
        f"{self.name_prefix}-private-nacl",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-private-nacl"},
    )
    for i, subnet in enumerate(self.private_subnets):
      aws.ec2.NetworkAclAssociation(
          f"{self.name_prefix}-private-nacl-assoc-{i + 1}",
          network_acl_id=nacl.id,
          subnet_id=subnet.id,
      )
    return nacl

  def _create_flow_logs_role(self) -> aws.iam.Role:
    assume_policy = json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                }
            ],
        }
    )
    role = aws.iam.Role(
        f"{self.name_prefix}-flowlogs-role",
        assume_role_policy=assume_policy,
        tags={**self.tags, "Name": f"{self.name_prefix}-flowlogs-role"},
    )
    # Define inline policy with required permissions
    policy = aws.iam.RolePolicy(
        f"{self.name_prefix}-flowlogs-inline-policy",
        role=role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams",
                ],
                "Resource": "*"
            }]
        })
    )
    return role

  def _create_flow_logs(self) -> aws.ec2.FlowLog:
    log_group = aws.cloudwatch.LogGroup(
        f"{self.name_prefix}-flowlogs-lg",
        retention_in_days=30,
        tags={**self.tags, "Name": f"{self.name_prefix}-flowlogs-lg"},
    )
    return aws.ec2.FlowLog(
        f"{self.name_prefix}-flowlogs",
        iam_role_arn=self.flow_logs_role.arn,
        log_destination=log_group.arn,
        log_destination_type="cloud-watch-logs",
        vpc_id=self.vpc.id,
        traffic_type="ALL",
        tags={**self.tags, "Name": f"{self.name_prefix}-flowlogs"},
    )


# ---------- Helpers from MODEL_RESPONSE.md integrated here ----------


def create_kms_key(tags: Dict[str, str]) -> aws.kms.Key:
  """
  Create a KMS key and alias for encryption of logs and EBS volumes.
  """
  current = aws.get_caller_identity()

  key_policy = json.dumps({"Version": "2012-10-17",
                           "Statement": [{"Sid": "Enable IAM User Permissions",
                                          "Effect": "Allow",
                                          "Principal": {"AWS": f"arn:aws:iam::{current.account_id}:root"},
                                          "Action": "kms:*",
                                          "Resource": "*",
                                          },
                                         {"Sid": "Allow CloudWatch Logs",
                                          "Effect": "Allow",
                                          "Principal": {"Service": "logs.us-east-1.amazonaws.com"},
                                          "Action": ["kms:Encrypt",
                                                     "kms:Decrypt",
                                                     "kms:ReEncrypt*",
                                                     "kms:GenerateDataKey*",
                                                     "kms:DescribeKey",
                                                     ],
                                          "Resource": "*",
                                          },
                                         ],
                           })

  kms_key = aws.kms.Key(
      "nova-kms-key",
      description="KMS key for Nova Model Breaking infrastructure encryption",
      policy=key_policy,
      tags={**tags, "Name": "nova-production-kms-key"},
  )

  aws.kms.Alias(
      "nova-kms-alias",
      name="alias/nova-production-key",
      target_key_id=kms_key.key_id,
  )

  return kms_key


def create_security_groups(
        vpc: aws.ec2.Vpc, tags: Dict[str, str]) -> Dict[str, Any]:
  """
  Create web and lambda security groups (HTTP/HTTPS inbound only for web).
  """
  web_sg = aws.ec2.SecurityGroup(
      "nova-web-sg",
      description="Security group for web servers - HTTP/HTTPS only",
      vpc_id=vpc.id,
      ingress=[
          aws.ec2.SecurityGroupIngressArgs(
              description="HTTP",
              from_port=80,
              to_port=80,
              protocol="tcp",
              cidr_blocks=["0.0.0.0/0"]),
          aws.ec2.SecurityGroupIngressArgs(
              description="HTTPS",
              from_port=443,
              to_port=443,
              protocol="tcp",
              cidr_blocks=["0.0.0.0/0"]),
      ],
      egress=[
          aws.ec2.SecurityGroupEgressArgs(
              description="All outbound traffic",
              from_port=0,
              to_port=0,
              protocol="-1",
              cidr_blocks=["0.0.0.0/0"])],
      tags={
          **tags,
          "Name": "nova-web-security-group"},
  )

  lambda_sg = aws.ec2.SecurityGroup(
      "nova-lambda-sg",
      description="Security group for Lambda functions",
      vpc_id=vpc.id,
      egress=[
          aws.ec2.SecurityGroupEgressArgs(
              description="All outbound traffic",
              from_port=0,
              to_port=0,
              protocol="-1",
              cidr_blocks=["0.0.0.0/0"])],
      tags={
          **tags,
          "Name": "nova-lambda-security-group"},
  )

  return {"web_sg": web_sg, "lambda_sg": lambda_sg}


def create_compute_resources(
    subnets: List[aws.ec2.Subnet],
    security_group: aws.ec2.SecurityGroup,
    kms_key: aws.kms.Key,
    tags: Dict[str, str],
) -> Dict[str, Any]:
  """
  Create two EC2 instances (one per subnet/az) with unique IAM roles and encrypted root volumes.
  """
  instances: List[aws.ec2.Instance] = []
  roles: List[aws.iam.Role] = []
  instance_profiles: List[aws.iam.InstanceProfile] = []

  # Get latest Amazon Linux 2 AMI
  ami = aws.ec2.get_ami(
      most_recent=True,
      owners=["amazon"],
      filters=[
          aws.ec2.GetAmiFilterArgs(
              name="name",
              values=["amzn2-ami-hvm-*-x86_64-gp2"])],
  )

  for i in range(2):
    assume_role_policy = json.dumps({"Version": "2012-10-17",
                                     "Statement": [{"Action": "sts:AssumeRole",
                                                    "Effect": "Allow",
                                                    "Principal": {"Service": "ec2.amazonaws.com"}}],
                                     })

    role = aws.iam.Role(
        f"nova-ec2-role-{i + 1}",
        assume_role_policy=assume_role_policy,
        tags={**tags, "Name": f"nova-ec2-role-{i + 1}"},
    )

    aws.iam.RolePolicyAttachment(
        f"nova-ec2-policy-attachment-{i + 1}",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    )

    instance_profile = aws.iam.InstanceProfile(
        f"nova-instance-profile-{i + 1}",
        role=role.name,
        tags={**tags, "Name": f"nova-instance-profile-{i + 1}"},
    )

    user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Nova Production Server {}</h1>" > /var/www/html/index.html
""".format(i + 1)

    instance = aws.ec2.Instance(
        f"nova-instance-{i + 1}",
        ami=ami.id,
        instance_type="t3.micro",
        subnet_id=subnets[i].id,
        vpc_security_group_ids=[security_group.id],
        iam_instance_profile=instance_profile.name,
        user_data=user_data,
        root_block_device=aws.ec2.InstanceRootBlockDeviceArgs(
            volume_type="gp3", volume_size=20, encrypted=True, kms_key_id=kms_key.arn
        ),
        tags={**tags, "Name": f"nova-production-instance-{i + 1}"},
    )

    instances.append(instance)
    roles.append(role)
    instance_profiles.append(instance_profile)

  return {
      "instances": instances,
      "roles": roles,
      "instance_profiles": instance_profiles}


def create_api_gateway(kms_key: aws.kms.Key,
                       tags: Dict[str, str]) -> Dict[str, Any]:
  """
  Create API Gateway REST API with CloudWatch logging to the specified KMS-encrypted log group.
  """
  log_group = aws.cloudwatch.LogGroup(
      "nova-api-gateway-logs",
      name="/aws/apigateway/nova-api",
      retention_in_days=14,
      kms_key_id=kms_key.arn,
      tags={**tags, "Name": "nova-api-gateway-logs"},
  )

  api = aws.apigateway.RestApi(
      "nova-api",
      name="nova-production-api",
      description="Nova Model Breaking API",
      tags={**tags, "Name": "nova-production-api"},
  )

  resource = aws.apigateway.Resource(
      "nova-api-resource",
      rest_api=api.id,
      parent_id=api.root_resource_id,
      path_part="health")

  method = aws.apigateway.Method(
      "nova-api-method",
      rest_api=api.id,
      resource_id=resource.id,
      http_method="GET",
      authorization="NONE")

  integration = aws.apigateway.Integration(
      "nova-api-integration",
      rest_api=api.id,
      resource_id=resource.id,
      http_method=method.http_method,
      integration_http_method="GET",
      type="MOCK",
      request_templates={"application/json": json.dumps({"statusCode": 200})},
  )

  method_response = aws.apigateway.MethodResponse(
      "nova-api-method-response",
      rest_api=api.id,
      resource_id=resource.id,
      http_method=method.http_method,
      status_code="200",
  )

  integration_response = aws.apigateway.IntegrationResponse(
      "nova-api-integration-response",
      rest_api=api.id,
      resource_id=resource.id,
      http_method=method.http_method,
      status_code=method_response.status_code,
      response_templates={"application/json": json.dumps({"message": "API is healthy"})},
      opts=ResourceOptions(depends_on=[integration])
  )

  deployment = aws.apigateway.Deployment(
      "nova-api-deployment",
      rest_api=api.id,
      # ensures deployment runs after integration
      opts=ResourceOptions(depends_on=[integration, integration_response])
  )

  stage = aws.apigateway.Stage(
      "nova-api-stage",
      deployment=deployment.id,
      rest_api=api.id,
      stage_name="prod",
      access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
          destination_arn=log_group.arn,
          format=json.dumps(
              {
                  "requestId": "$context.requestId",
                  "ip": "$context.identity.sourceIp",
                  "caller": "$context.identity.caller",
                  "user": "$context.identity.user",
                  "requestTime": "$context.requestTime",
                  "httpMethod": "$context.httpMethod",
                  "resourcePath": "$context.resourcePath",
                  "status": "$context.status",
                  "protocol": "$context.protocol",
                  "responseLength": "$context.responseLength",
              }
          ),
      ),
      tags={**tags, "Name": "nova-api-prod-stage"},
  )

  # Create API Gateway IAM role for CloudWatch logging
  api_gw_role = create_api_gateway_cloudwatch_role(tags)

  aws.apigateway.Account(
      "nova-api-account",
      cloudwatch_role_arn=api_gw_role.arn,
  )

  api_url = pulumi.Output.concat(
      "https://",
      api.id,
      ".execute-api.us-east-1.amazonaws.com/prod")

  return {
      "api": api,
      "api_url": api_url,
      "log_group": log_group,
      "stage": stage,
      "account_role": api_gw_role}


def create_api_gateway_cloudwatch_role(tags: Dict[str, str]) -> aws.iam.Role:
  """
  IAM role allowing API Gateway to push logs to CloudWatch.
  """
  assume_role_policy = json.dumps({"Version": "2012-10-17",
                                   "Statement": [{"Action": "sts:AssumeRole",
                                                  "Effect": "Allow",
                                                  "Principal": {"Service": "apigateway.amazonaws.com"}}]})

  role = aws.iam.Role(
      "nova-api-gateway-cloudwatch-role",
      assume_role_policy=assume_role_policy,
      tags={**tags, "Name": "nova-api-gateway-cloudwatch-role"},
  )

  aws.iam.RolePolicyAttachment(
      "nova-api-gateway-cloudwatch-policy",
      role=role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
  )

  return role


def create_monitoring(
    subnets: List[aws.ec2.Subnet],
    security_group: aws.ec2.SecurityGroup,
    instances: List[aws.ec2.Instance],
    kms_key: aws.kms.Key,
    tags: Dict[str, str],
) -> Dict[str, Any]:
  """
  Create a Lambda function that checks EC2 instance health every 5 minutes and pushes metrics to CloudWatch.
  """
  log_group = aws.cloudwatch.LogGroup(
      "nova-health-check-logs",
      name="/aws/lambda/nova-health-check",
      retention_in_days=14,
      kms_key_id=kms_key.arn,
      tags={**tags, "Name": "nova-health-check-logs"},
  )

  assume_role_policy = json.dumps({"Version": "2012-10-17",
                                   "Statement": [{"Action": "sts:AssumeRole",
                                                  "Effect": "Allow",
                                                  "Principal": {"Service": "lambda.amazonaws.com"}}]})

  lambda_role = aws.iam.Role(
      "nova-lambda-role",
      assume_role_policy=assume_role_policy,
      tags={
          **tags,
          "Name": "nova-lambda-health-check-role"})

  aws.iam.RolePolicyAttachment(
      "nova-lambda-vpc-policy",
      role=lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
  )

  aws.iam.RolePolicyAttachment(
      "nova-lambda-basic-policy",
      role=lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  )

  lambda_policy = aws.iam.RolePolicy(
      "nova-lambda-custom-policy",
      role=lambda_role.id,
      policy=json.dumps({
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                  # Your existing actions
                  "ec2:DescribeInstances",
                  "ec2:DescribeInstanceStatus",
                  "cloudwatch:PutMetricData",
                  # Required VPC actions
                  "ec2:CreateNetworkInterface",
                  "ec2:DescribeNetworkInterfaces",
                  "ec2:DeleteNetworkInterface",
                  "ec2:DescribeSubnets",
                  "ec2:AssignPrivateIpAddresses",
                  "ec2:UnassignPrivateIpAddresses"
              ],
              "Resource": "*"
          }]
      })
  )

  lambda_code = """
import json
import boto3
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    ec2_client = boto3.client('ec2')
    cloudwatch_client = boto3.client('cloudwatch')

    try:
        response = ec2_client.describe_instance_status(IncludeAllInstances=True)
        healthy_instances = 0
        total_instances = len(response.get('InstanceStatuses', []))

        for instance_status in response.get('InstanceStatuses', []):
            instance_id = instance_status['InstanceId']
            instance_state = instance_status['InstanceState']['Name']
            if instance_state == 'running':
                system_status = instance_status.get('SystemStatus', {}).get('Status', 'unknown')
                instance_check = instance_status.get('InstanceStatus', {}).get('Status', 'unknown')
                if system_status == 'ok' and instance_check == 'ok':
                    healthy_instances += 1
        cloudwatch_client.put_metric_data(
            Namespace='Nova/HealthCheck',
            MetricData=[
                {'MetricName': 'HealthyInstances', 'Value': healthy_instances, 'Unit': 'Count'},
                {'MetricName': 'TotalInstances', 'Value': total_instances, 'Unit': 'Count'}
            ]
        )
        return {'statusCode': 200, 'body': json.dumps({'message': 'Health check completed','healthy_instances': healthy_instances,'total_instances': total_instances})}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {'statusCode': 500, 'body': json.dumps({'message': 'Health check failed','error': str(e)})}
"""

  lambda_function = aws.lambda_.Function(
      "nova-model-health-check",
      name="nova-model-health-check",
      runtime="python3.9",
      code=pulumi.AssetArchive(
          {
              "lambda_function.py": pulumi.StringAsset(lambda_code)}),
      handler="lambda_function.lambda_handler",
      role=lambda_role.arn,
      timeout=60,
      vpc_config=aws.lambda_.FunctionVpcConfigArgs(
          subnet_ids=[
              s.id for s in subnets],
          security_group_ids=[
              security_group.id]),
      environment=aws.lambda_.FunctionEnvironmentArgs(
          variables={
              "ENVIRONMENT": "production"}),
      kms_key_arn=kms_key.arn,
      tags={
          **tags,
          "Name": "nova-health-check-lambda"},
  )

  schedule_rule = aws.cloudwatch.EventRule(
      "nova-health-check-schedule",
      description="Trigger health check every 5 minutes",
      schedule_expression="rate(5 minutes)",
      tags={**tags, "Name": "nova-health-check-schedule"},
  )

  event_target = aws.cloudwatch.EventTarget(
      "nova-health-check-target",
      rule=schedule_rule.name,
      arn=lambda_function.arn)

  lambda_permission = aws.lambda_.Permission(
      "nova-health-check-permission",
      statement_id="AllowExecutionFromEventBridge",
      action="lambda:InvokeFunction",
      function=lambda_function.name,
      principal="events.amazonaws.com",
      source_arn=schedule_rule.arn,
  )

  return {
      "lambda_function": lambda_function,
      "log_group": log_group,
      "schedule_rule": schedule_rule,
      "role": lambda_role}


# ---------- TapStack: orchestrates modules and exports everything ----------


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs,
               opts: Optional[ResourceOptions] = None) -> None:
    # Do not change the resource type or signature of TapStack (constraint)
    super().__init__("tap:stack:TapStack", name, None, opts)

    # Enforce region is us-east-1 per PROMPT.md
    cfg = pulumi.Config("aws")
    configured_region = cfg.get("region")
    current_region = aws.get_region().name
    # # If region explicitly provided via Pulumi config, ensure it matches constraint
    # if configured_region and configured_region != "us-east-1":
    #     raise ValueError("This stack must be deployed in us-east-1 (configured region mismatch).")
    # if not configured_region and current_region != "us-east-1":
    #     raise ValueError("This stack must be deployed in us-east-1 (detected region mismatch).")

    # Common tags (ensuring Environment: Production present)
    common_tags: Dict[str, str] = {
        **{"Environment": "Production"}, **(args.tags or {})}

    # 1) KMS key (used by logs and EBS)
    kms_key = create_kms_key(common_tags)

    # 2) VPC and networking (uses SecureVPC class)
    vpc_module = SecureVPC(
        name_prefix=f"tap-{args.environment_suffix}", vpc_cidr="10.0.0.0/16", tags=common_tags)

    # 3) Security groups
    sgs = create_security_groups(vpc_module.vpc, common_tags)
    web_sg = sgs["web_sg"]
    lambda_sg = sgs["lambda_sg"]

    # 4) Compute resources (EC2 instances)
    compute = create_compute_resources(
        vpc_module.public_subnets, web_sg, kms_key, common_tags)
    instances = compute["instances"]
    roles = compute["roles"]
    instance_profiles = compute["instance_profiles"]

    # 5) API Gateway
    api = create_api_gateway(kms_key, common_tags)

    # 6) Monitoring (Lambda + schedule)
    monitoring = create_monitoring(
        vpc_module.private_subnets,
        lambda_sg,
        instances,
        kms_key,
        common_tags)
    health_lambda = monitoring["lambda_function"]

    # ---------------- Pulumi Exports: export all resources (top-level and nes
    # VPC & networking
    pulumi.export("vpc_id", vpc_module.vpc.id)
    pulumi.export("vpc_cidr", vpc_module.vpc.cidr_block)
    pulumi.export("availability_zones", vpc_module.availability_zones)
    pulumi.export("internet_gateway_id", vpc_module.igw.id)
    pulumi.export(
        "public_subnet_ids", [
            s.id for s in vpc_module.public_subnets])
    pulumi.export(
        "private_subnet_ids", [
            s.id for s in vpc_module.private_subnets])
    pulumi.export("public_route_table_id", vpc_module.public_rt.id)
    pulumi.export("private_route_table_ids",
                  [rt.id for rt in vpc_module.private_rts])
    pulumi.export("nat_gateway_ids", [n.id for n in vpc_module.nat_gateways])
    pulumi.export("elastic_ip_ids", [e.id for e in vpc_module.eips])
    pulumi.export("public_nacl_id", vpc_module.public_nacl.id)
    pulumi.export("private_nacl_id", vpc_module.private_nacl.id)
    pulumi.export("vpc_flow_logs_id", vpc_module.flow_logs.id)
    pulumi.export("vpc_flow_logs_role_arn", vpc_module.flow_logs_role.arn)

    # KMS
    pulumi.export("kms_key_id", kms_key.id)
    pulumi.export("kms_key_arn", kms_key.arn)
    pulumi.export("kms_alias", "alias/nova-production-key")

    # Security groups
    pulumi.export("web_security_group_id", web_sg.id)
    pulumi.export("lambda_security_group_id", lambda_sg.id)

    # EC2 / IAM
    pulumi.export("ec2_instance_ids", [inst.id for inst in instances])
    pulumi.export(
        "ec2_instance_public_ips", [
            inst.public_ip for inst in instances])
    pulumi.export(
        "ec2_instance_private_ips", [
            inst.private_ip for inst in instances])
    pulumi.export(
        "ec2_instance_types", [
            inst.instance_type for inst in instances])
    pulumi.export("ec2_iam_role_names", [r.name for r in roles])
    pulumi.export(
        "ec2_instance_profile_names", [
            ip.name for ip in instance_profiles])

    # API Gateway
    pulumi.export("api_id", api["api"].id)
    pulumi.export("api_url", api["api_url"])
    pulumi.export("api_log_group_name", api["log_group"].name)
    pulumi.export("api_stage_name", api["stage"].stage_name)
    pulumi.export("api_cloudwatch_role_arn", api["account_role"].arn)

    # Lambda monitoring
    pulumi.export("health_lambda_name", health_lambda.name)
    pulumi.export("health_lambda_arn", health_lambda.arn)
    pulumi.export("health_lambda_log_group", monitoring["log_group"].name)
    pulumi.export("health_schedule_rule", monitoring["schedule_rule"].name)
    pulumi.export("health_lambda_role", monitoring["role"].name)

    # register outputs for component resource
    self.register_outputs(
        {
            "vpc_id": vpc_module.vpc.id,
            "kms_key_id": kms_key.id,
            "ec2_instance_ids": [inst.id for inst in instances],
            "api_url": api["api_url"],
            "health_lambda": health_lambda.arn,
        }
    )
```
