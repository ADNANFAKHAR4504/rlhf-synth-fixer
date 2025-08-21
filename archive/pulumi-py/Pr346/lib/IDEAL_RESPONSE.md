# Pulumi Python Infrastructure Code

This file contains the complete Pulumi Python infrastructure code from the lib folder.

## __init__.py

```python
```

## tap_stack.py

```python
import re
import hashlib
from typing import Optional, Dict, List
from dataclasses import dataclass, field
import pulumi
from pulumi import ResourceOptions, Config
import pulumi_aws as aws



@dataclass
class TapStackArgs:
  environment_suffix: str = 'dev'
  aws_region: str = 'us-east-1'
  tags: Dict[str, str] = field(default_factory=dict)
  vpc_cidr: str = '10.0.0.0/16'
  enable_monitoring: bool = True
  instance_types: List[str] = field(default_factory=lambda: ['t3.micro', 't3.micro'])
  backup_retention_days: int = 7
  enable_multi_az: bool = True
  project_name: str = 'CloudEnvironmentSetup'

  def __post_init__(self) -> None:
    self._validate_environment_suffix()
    self._validate_vpc_cidr()
    if not self.aws_region:
      self.aws_region = Config().require("aws:region")
    self._validate_region()
    self._set_default_tags()

  def _validate_environment_suffix(self) -> None:
    if not (
      self.environment_suffix in {'dev', 'staging', 'prod', 'test'} or
      re.match(r'^pr\d+$', self.environment_suffix)
    ):
      raise ValueError(
        "Environment suffix must be one of: {'dev', 'staging', 'prod', 'test'} "
        "or start with 'pr' followed by digits"
      )

  def _validate_vpc_cidr(self) -> None:
    if not self.vpc_cidr.endswith(('/16', '/17', '/18', '/19', '/20')):
      raise ValueError("VPC CIDR should typically be /16 to /20 for proper subnet allocation")

  def _validate_region(self) -> None:
    if self.aws_region.count('-') < 2:
      raise ValueError(f"Invalid AWS region format: {self.aws_region}")

  def _set_default_tags(self) -> None:
    default_tags = {
      'Environment': self.environment_suffix.title(),
      'ManagedBy': 'Pulumi',
      'Project': self.project_name,
      'CreatedDate': pulumi.get_stack(),
      'Owner': 'InfrastructureTeam'
    }
    self.tags = {**default_tags, **self.tags}


class TapStack(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    args: TapStackArgs,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__(f"{args.project_name}:stack:TapStack", name, None, opts)
    self.args = args
    self.tags = args.tags
    self.config = Config()

    self.vpc = None
    self.subnets = []
    self.igw = None
    self.route_table = None
    self.instances = []
    self.security_group = None
    self.iam_role = None
    self.iam_instance_profile = None

    self._create_networking()
    self._create_security()
    self._create_ec2_instances()
    self._create_monitoring()
    self._register_outputs()

  def _unique_suffix(self, base: str) -> str:
    return hashlib.sha1(base.encode()).hexdigest()[:6]

  def _create_networking(self) -> None:
    self.vpc = aws.ec2.Vpc(
            f"{self.args.environment_suffix}-vpc",
            cidr_block=self.args.vpc_cidr,
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags=self._merge_tags({"Name": f"{self.args.environment_suffix}-vpc"}),
            opts=ResourceOptions(parent=self)
        )

    self.igw = aws.ec2.InternetGateway(
            f"{self.args.environment_suffix}-igw",
            vpc_id=self.vpc.id,
            tags=self._merge_tags({"Name": f"{self.args.environment_suffix}-igw"}),
            opts=ResourceOptions(parent=self)
        )

    self.route_table = aws.ec2.RouteTable(
            f"{self.args.environment_suffix}-rt",
            vpc_id=self.vpc.id,
            routes=[{
                'cidr_block': '0.0.0.0/0',
                'gateway_id': self.igw.id
            }],
            tags=self._merge_tags({"Name": f"{self.args.environment_suffix}-rt"}),
            opts=ResourceOptions(parent=self)
        )

        # FIXED: Get availability zones and create subnets properly
    azs = aws.get_availability_zones(state='available').names
        # Use a simple approach for creating 2 subnets in first 2 AZs
    for i in range(2):
            # Create subnet using index-based AZ selection
      subnet = aws.ec2.Subnet(
                f"{self.args.environment_suffix}-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                map_public_ip_on_launch=True,
                availability_zone=azs[i],
                tags=self._merge_tags({
                    "Name": f"{self.args.environment_suffix}-public-subnet-{i}",
                    "Type": "public"
                }),
                opts=ResourceOptions(parent=self)
            )

      aws.ec2.RouteTableAssociation(
                f"{self.args.environment_suffix}-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=self.route_table.id,
                opts=ResourceOptions(parent=self)
            )

      self.subnets.append(subnet)



  def _create_security(self) -> None:
    self.security_group = aws.ec2.SecurityGroup(
      f"{self.args.environment_suffix}-sg",
      vpc_id=self.vpc.id,
      description='Allow egress only, no SSH (SSM enabled)',
      ingress=[],
      egress=[{
        'protocol': '-1',
        'from_port': 0,
        'to_port': 0,
        'cidr_blocks': ['0.0.0.0/0']
      }],
      tags=self._merge_tags({"Name": f"{self.args.environment_suffix}-sg"}),
      opts=ResourceOptions(parent=self)
    )

    self.iam_role = aws.iam.Role(
      f"{self.args.environment_suffix}-ec2-role",
      assume_role_policy=pulumi.Output.json_dumps({
        'Version': '2012-10-17',
        'Statement': [{
          'Action': 'sts:AssumeRole',
          'Principal': {'Service': 'ec2.amazonaws.com'},
          'Effect': 'Allow',
          'Sid': ''
        }]
      }),
      tags=self._merge_tags({"Name": f"{self.args.environment_suffix}-role"}),
      opts=ResourceOptions(parent=self)
    )

    # Inline policy with minimal S3 access and SSM session support
    aws.iam.RolePolicy(
      f"{self.args.environment_suffix}-inline-policy",
      role=self.iam_role.id,
      policy=pulumi.Output.json_dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:ListBucket"
            ],
            "Resource": "*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "ssm:DescribeAssociation",
              "ssm:GetDeployablePatchSnapshotForInstance",
              "ssm:GetDocument",
              "ssm:DescribeDocument",
              "ssm:GetParameters",
              "ssm:ListAssociations",
              "ssm:ListInstanceAssociations",
              "ssm:UpdateInstanceInformation",
              "ssmmessages:CreateControlChannel",
              "ssmmessages:CreateDataChannel",
              "ssmmessages:OpenControlChannel",
              "ssmmessages:OpenDataChannel",
              "ec2messages:AcknowledgeMessage",
              "ec2messages:DeleteMessage",
              "ec2messages:FailMessage",
              "ec2messages:GetEndpoint",
              "ec2messages:GetMessages",
              "ec2messages:SendReply",
              "cloudwatch:PutMetricData",
              "ec2:DescribeInstanceStatus"
            ],
            "Resource": "*"
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )

    self.iam_instance_profile = aws.iam.InstanceProfile(
      f"{self.args.environment_suffix}-profile",
      role=self.iam_role.name,
      opts=ResourceOptions(parent=self)
    )


  def _create_ec2_instances(self) -> None:
    for i, subnet in enumerate(self.subnets):
      instance = aws.ec2.Instance(
        f"{self.args.environment_suffix}-ec2-{i}",
        ami=aws.ec2.get_ami(
          most_recent=True,
          owners=["amazon"],
          filters=[
            {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}
          ]
        ).id,
        instance_type=self.args.instance_types[i % len(self.args.instance_types)],
        subnet_id=subnet.id,
        associate_public_ip_address=True,
        vpc_security_group_ids=[self.security_group.id],
        iam_instance_profile=self.iam_instance_profile.name,
        tags=self._merge_tags({"Name": f"{self.args.environment_suffix}-ec2-{i}"}),
        opts=ResourceOptions(parent=self)
      )
      self.instances.append(instance)

  def _create_monitoring(self) -> None:
    if not self.args.enable_monitoring:
      return

    aws.cloudwatch.LogGroup(
      f"{self.args.environment_suffix}-log-group",
      retention_in_days=self.args.backup_retention_days,
      tags=self._merge_tags({"Name": f"{self.args.environment_suffix}-log-group"}),
      opts=ResourceOptions(parent=self)
    )

  def _merge_tags(self, extra: Dict[str, str]) -> Dict[str, str]:
    return {**self.tags, **extra}

  def _register_outputs(self) -> None:
    pulumi.export("vpc_id", self.vpc.id)
    pulumi.export("subnet_ids", [s.id for s in self.subnets])
    pulumi.export("security_group_id", self.security_group.id)
    pulumi.export("iam_role_arn", self.iam_role.arn)
    pulumi.export("ec2_instance_ids", [inst.id for inst in self.instances])


def create_tap_stack(
  stack_name: str | None = None,
  environment: str | None = None,
  project_name: str = "CloudEnvironmentSetup",
  **kwargs
) -> TapStack:
  environment = environment or "dev"
  if not stack_name:
    stack_name = f"{project_name}-{environment}"
  args = TapStackArgs(environment_suffix=environment, project_name=project_name, **kwargs)
  return TapStack(stack_name, args)```
