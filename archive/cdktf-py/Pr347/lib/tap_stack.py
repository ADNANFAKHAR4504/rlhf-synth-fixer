"""TAP Stack implementation using CDKTF."""
from dataclasses import dataclass
from typing import Sequence
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider, AwsProviderDefaultTags
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.instance import Instance


@dataclass
class TapStackConfig:
  """Configuration for TAP Stack."""
  environment_suffix: str = "dev"
  aws_region: str = "us-east-1"
  vpc_cidr: str = "10.0.0.0/16"
  public_subnet_cidrs: Sequence[str] = ("10.0.1.0/24", "10.0.2.0/24")
  instance_type: str = "t2.micro"
  allowed_ssh_cidr: str = "0.0.0.0/0"
  allowed_http_cidr: str = "0.0.0.0/0"
  project_name: str = "tap"


class TapStack(TerraformStack):
  """Infrastructure stack for TAP deployment."""

  def __init__(
      self,
      scope: Construct,
      name: str,
      config: TapStackConfig = None
  ):
    """Initialize TAP Stack."""
    super().__init__(scope, name)
    self.config = config or TapStackConfig()

    # Helper method for consistent tagging
    def create_tags(name: str) -> dict:
      return {
          "Name": f"{self.config.project_name}-{name}-{self.config.environment_suffix}",
          "Environment": self.config.environment_suffix,
          "Project": self.config.project_name
      }

    # AWS Provider configuration
    provider_tags = AwsProviderDefaultTags(
        tags={
            "Environment": self.config.environment_suffix,
            "Project": self.config.project_name,
            "ManagedBy": "CDKTF"
        }
    )

    AwsProvider(
        self,
        "aws",
        region=self.config.aws_region,
        default_tags=[provider_tags]
    )

    # VPC
    vpc = Vpc(
        self,
        "MainVPC",
        cidr_block=self.config.vpc_cidr,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags=create_tags("vpc"),
    )

    # Internet Gateway
    igw = InternetGateway(self, "IGW", vpc_id=vpc.id, tags=create_tags("igw"))

    # Route Table
    rt = RouteTable(self, "PublicRT", vpc_id=vpc.id, tags=create_tags("rt"))

    Route(
        self,
        "IGWRoute",
        route_table_id=rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id,
    )

    # Create subnets with static AZ allocation
    subnets = []
    for idx, cidr in enumerate(self.config.public_subnet_cidrs):
      az_letter = chr(97 + (idx % 2))  # 'a' or 'b'
      subnet = Subnet(
          self,
          f"PublicSubnet{idx+1}",
          vpc_id=vpc.id,
          cidr_block=cidr,
          availability_zone=f"{self.config.aws_region}{az_letter}",  # e.g., us-east-1a
          map_public_ip_on_launch=True,
          tags=create_tags(f"subnet-{idx+1}"),
      )

      RouteTableAssociation(
          self, f"RTAssociation{idx+1}", subnet_id=subnet.id, route_table_id=rt.id
      )
      subnets.append(subnet)

    # Security Group
    sg = SecurityGroup(
        self,
        "WebSG",
        name=f"{self.config.project_name}-sg-{self.config.environment_suffix}",
        description="Allow HTTP and SSH traffic",
        vpc_id=vpc.id,
        tags=create_tags("sg"),
    )

    SecurityGroupRule(
        self,
        "SGRuleSSH",
        type="ingress",
        from_port=22,
        to_port=22,
        protocol="tcp",
        cidr_blocks=[self.config.allowed_ssh_cidr],
        security_group_id=sg.id,
    )

    SecurityGroupRule(
        self,
        "SGRuleHTTP",
        type="ingress",
        from_port=80,
        to_port=80,
        protocol="tcp",
        cidr_blocks=[self.config.allowed_http_cidr],
        security_group_id=sg.id,
    )

    SecurityGroupRule(
        self,
        "SGRuleEgress",
        type="egress",
        from_port=0,
        to_port=0,
        protocol="-1",
        cidr_blocks=["0.0.0.0/0"],
        security_group_id=sg.id,
    )

    # Get latest Amazon Linux 2023 AMI
    amazon_linux = DataAwsAmi(
        self,
        "amazon-linux-2023",
        most_recent=True,
        owners=["amazon"],
        filter=[
            DataAwsAmiFilter(
                name="name",
                values=["al2023-ami-2023.*-x86_64"]
            ),
            DataAwsAmiFilter(
                name="virtualization-type",
                values=["hvm"]
            )
        ]
    )

    # EC2 Instances with dynamic AMI ID
    instances = []
    for idx, subnet in enumerate(subnets):
      instance = Instance(
          self,
          f"WebServer{idx+1}",
          ami=amazon_linux.id,
          instance_type=self.config.instance_type,
          subnet_id=subnet.id,
          vpc_security_group_ids=[sg.id],
          tags=create_tags(f"instance-{idx+1}")
      )
      instances.append(instance)

    # Outputs
    TerraformOutput(self, "vpc_id", value=vpc.id)
    TerraformOutput(self, "subnet_ids", value=[s.id for s in subnets])
    TerraformOutput(self, "instance_ips", value=[i.public_ip for i in instances])
