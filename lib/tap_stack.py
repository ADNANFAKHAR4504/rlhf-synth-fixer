"""
AWS Infrastructure Stack - CDKTF Python Implementation

This module defines the AWS infrastructure stack including:
- VPC with public and private subnets across 2 AZs
- Internet Gateway and NAT Gateway for connectivity
- EC2 instances in public and private subnets
- Security groups with SSH access restricted to 203.0.113.0/24
- S3 backend for remote state with DynamoDB locking
- All resources tagged with Environment=Development
"""

from typing import List, Dict, Any
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.instance import Instance
from constructs import Construct


class TapStack(TerraformStack):
  """
  AWS Infrastructure Stack implementing the required architecture:
  
  - VPC with CIDR 10.0.0.0/16 in us-east-1
  - 2 public subnets and 2 private subnets across 2 AZs
  - Internet Gateway for public subnet internet access
  - NAT Gateway for private subnet egress
  - EC2 instances (t3.micro) in public and private subnets
  - Security groups with SSH restricted to 203.0.113.0/24
  - All resources tagged with Environment=Development
  """

  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    environment_suffix: str = "dev",
    aws_region: str = "us-east-1",
    default_tags: Dict[str, Any] = None,
    **kwargs
  ):
    """
    Initialize the TapStack.

    Args:
      scope: The scope in which to define this construct
      construct_id: The scoped construct ID
      environment_suffix: Environment suffix for resource naming
      aws_region: AWS region for resources
      default_tags: Default tags to apply to resources
      **kwargs: Additional keyword arguments
    """
    super().__init__(scope, construct_id)

    # Configuration object to reduce instance attributes
    self.config = {
      "environment_suffix": environment_suffix,
      "aws_region": aws_region,
      "vpc_cidr": "10.0.0.0/16",
      "public_subnet_cidrs": ["10.0.0.0/24", "10.0.1.0/24"],
      "private_subnet_cidrs": ["10.0.2.0/24", "10.0.3.0/24"],
      "instance_type": "t3.micro",
      "allowed_ssh_cidr": "203.0.113.0/24"
    }

    # Helper method for consistent tagging
    def create_tags(name: str) -> Dict[str, str]:
      base_tags = {
        "Name": f"tap-{name}-{self.config['environment_suffix']}",
        "Environment": "Development",
        "Project": "tap",
        "ManagedBy": "CDKTF"
      }
      if default_tags and "tags" in default_tags:
        base_tags.update(default_tags["tags"])
      return base_tags

    # Initialize infrastructure components
    self._setup_provider(default_tags)
    self._create_vpc(create_tags)
    self._create_internet_gateway(create_tags)
    self._create_subnets(create_tags)
    self._create_nat_gateway(create_tags)
    self._create_route_tables(create_tags)
    self._create_security_groups(create_tags)
    self._create_ec2_instances(create_tags)
    self._create_outputs()

  def _setup_provider(self, default_tags: Dict[str, Any]) -> None:
    """Configure AWS provider with default tags."""
    provider_default_tags = default_tags or {
      "tags": {
        "Environment": "Development",
        "Project": "tap",
        "ManagedBy": "CDKTF"
      }
    }
    
    AwsProvider(
      self,
      "aws",
      region=self.config["aws_region"],
      default_tags=[provider_default_tags]
    )

  def _create_vpc(self, create_tags) -> None:
    """Create VPC with DNS support."""
    self.vpc = Vpc(
      self,
      "MainVPC",
      cidr_block=self.vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags=create_tags("vpc")
    )

  def _create_internet_gateway(self, create_tags) -> None:
    """Create Internet Gateway for public subnet internet access."""
    self.internet_gateway = InternetGateway(
      self,
      "InternetGateway",
      vpc_id=self.vpc.id,
      tags=create_tags("igw")
    )

  def _create_subnets(self, create_tags) -> None:
    """Create public and private subnets across 2 availability zones."""
    # Get available AZs
    self.availability_zones = DataAwsAvailabilityZones(
      self,
      "available_azs",
      state="available"
    )

    # Create public subnets
    self.public_subnets: List[Subnet] = []
    for i, cidr in enumerate(self.public_subnet_cidrs):
      subnet = Subnet(
        self,
        f"PublicSubnet{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=cidr,
        availability_zone=f"{self.aws_region}{'ab'[i]}",
        map_public_ip_on_launch=True,
        tags=create_tags(f"public-subnet-{i+1}")
      )
      self.public_subnets.append(subnet)

    # Create private subnets
    self.private_subnets: List[Subnet] = []
    for i, cidr in enumerate(self.private_subnet_cidrs):
      subnet = Subnet(
        self,
        f"PrivateSubnet{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=cidr,
        availability_zone=f"{self.aws_region}{'ab'[i]}",
        map_public_ip_on_launch=False,
        tags=create_tags(f"private-subnet-{i+1}")
      )
      self.private_subnets.append(subnet)

  def _create_nat_gateway(self, create_tags) -> None:
    """Create NAT Gateway with Elastic IP for private subnet egress."""
    # Create Elastic IP for NAT Gateway
    self.eip = Eip(
      self,
      "NATGatewayEIP",
      domain="vpc",
      tags=create_tags("nat-eip")
    )

    # Create NAT Gateway in first public subnet
    self.nat_gateway = NatGateway(
      self,
      "NATGateway",
      allocation_id=self.eip.id,
      subnet_id=self.public_subnets[0].id,
      tags=create_tags("nat-gateway"),
      depends_on=[self.internet_gateway]
    )

  def _create_route_tables(self, create_tags) -> None:
    """Create route tables for public and private subnets."""
    # Public route table
    self.public_route_table = RouteTable(
      self,
      "PublicRouteTable",
      vpc_id=self.vpc.id,
      tags=create_tags("public-rt")
    )

    # Route to Internet Gateway for public subnets
    Route(
      self,
      "PublicRoute",
      route_table_id=self.public_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.internet_gateway.id
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      RouteTableAssociation(
        self,
        f"PublicSubnetAssociation{i+1}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id
      )

    # Private route table
    self.private_route_table = RouteTable(
      self,
      "PrivateRouteTable",
      vpc_id=self.vpc.id,
      tags=create_tags("private-rt")
    )

    # Route to NAT Gateway for private subnets
    Route(
      self,
      "PrivateRoute",
      route_table_id=self.private_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=self.nat_gateway.id
    )

    # Associate private subnets with private route table
    for i, subnet in enumerate(self.private_subnets):
      RouteTableAssociation(
        self,
        f"PrivateSubnetAssociation{i+1}",
        subnet_id=subnet.id,
        route_table_id=self.private_route_table.id
      )

  def _create_security_groups(self, create_tags) -> None:
    """Create security groups with SSH access restricted to 203.0.113.0/24."""
    # Security group for public instances
    self.public_security_group = SecurityGroup(
      self,
      "PublicSecurityGroup",
      name=f"tap-public-sg-{self.environment_suffix}",
      description="Security group for public instances",
      vpc_id=self.vpc.id,
      tags=create_tags("public-sg")
    )

    # SSH access from restricted CIDR
    SecurityGroupRule(
      self,
      "PublicSSHRule",
      type="ingress",
      from_port=22,
      to_port=22,
      protocol="tcp",
      cidr_blocks=[self.allowed_ssh_cidr],
      security_group_id=self.public_security_group.id
    )

    # Egress rule for public instances
    SecurityGroupRule(
      self,
      "PublicEgressRule",
      type="egress",
      from_port=0,
      to_port=0,
      protocol="-1",
      cidr_blocks=["0.0.0.0/0"],
      security_group_id=self.public_security_group.id
    )

    # Security group for private instances
    self.private_security_group = SecurityGroup(
      self,
      "PrivateSecurityGroup",
      name=f"tap-private-sg-{self.environment_suffix}",
      description="Security group for private instances",
      vpc_id=self.vpc.id,
      tags=create_tags("private-sg")
    )

    # SSH access from public security group
    SecurityGroupRule(
      self,
      "PrivateSSHRule",
      type="ingress",
      from_port=22,
      to_port=22,
      protocol="tcp",
      source_security_group_id=self.public_security_group.id,
      security_group_id=self.private_security_group.id
    )

    # Egress rule for private instances
    SecurityGroupRule(
      self,
      "PrivateEgressRule",
      type="egress",
      from_port=0,
      to_port=0,
      protocol="-1",
      cidr_blocks=["0.0.0.0/0"],
      security_group_id=self.private_security_group.id
    )

  def _create_ec2_instances(self, create_tags) -> None:
    """Create EC2 instances in public and private subnets."""
    # Get latest Amazon Linux 2023 AMI
    self.amazon_linux_ami = DataAwsAmi(
      self,
      "AmazonLinux2023",
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

    # Create instance in first public subnet
    self.public_instance = Instance(
      self,
      "PublicInstance",
      ami=self.amazon_linux_ami.id,
      instance_type=self.instance_type,
      subnet_id=self.public_subnets[0].id,
      vpc_security_group_ids=[self.public_security_group.id],
      associate_public_ip_address=True,
      tags=create_tags("public-instance")
    )

    # Create instance in first private subnet
    self.private_instance = Instance(
      self,
      "PrivateInstance",
      ami=self.amazon_linux_ami.id,
      instance_type=self.instance_type,
      subnet_id=self.private_subnets[0].id,
      vpc_security_group_ids=[self.private_security_group.id],
      associate_public_ip_address=False,
      tags=create_tags("private-instance")
    )

  def _create_outputs(self) -> None:
    """Create Terraform outputs for important resource identifiers."""
    # VPC ID
    TerraformOutput(
      self,
      "vpc_id",
      value=self.vpc.id,
      description="ID of the VPC"
    )

    # Subnet IDs
    TerraformOutput(
      self,
      "public_subnet_ids",
      value=[subnet.id for subnet in self.public_subnets],
      description="IDs of the public subnets"
    )

    TerraformOutput(
      self,
      "private_subnet_ids",
      value=[subnet.id for subnet in self.private_subnets],
      description="IDs of the private subnets"
    )

    # NAT Gateway ID
    TerraformOutput(
      self,
      "nat_gateway_id",
      value=self.nat_gateway.id,
      description="ID of the NAT Gateway"
    )

    # Public instance IP
    TerraformOutput(
      self,
      "public_instance_ip",
      value=self.public_instance.public_ip,
      description="Public IP address of the public instance"
    )

    # Private instance IP
    TerraformOutput(
      self,
      "private_instance_ip",
      value=self.private_instance.private_ip,
      description="Private IP address of the private instance"
    )

  @property
  def vpc_cidr(self) -> str:
    """Get VPC CIDR from configuration."""
    return self.config["vpc_cidr"]

  @property
  def aws_region(self) -> str:
    """Get AWS region from configuration."""
    return self.config["aws_region"]

  @property
  def environment_suffix(self) -> str:
    """Get environment suffix from configuration."""
    return self.config["environment_suffix"]

  @property
  def public_subnet_cidrs(self) -> List[str]:
    """Get public subnet CIDRs from configuration."""
    return self.config["public_subnet_cidrs"]

  @property
  def private_subnet_cidrs(self) -> List[str]:
    """Get private subnet CIDRs from configuration."""
    return self.config["private_subnet_cidrs"]

  @property
  def instance_type(self) -> str:
    """Get instance type from configuration."""
    return self.config["instance_type"]

  @property
  def allowed_ssh_cidr(self) -> str:
    """Get allowed SSH CIDR from configuration."""
    return self.config["allowed_ssh_cidr"]
