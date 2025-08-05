"""
Networking Infrastructure Component
Handles VPC, subnets, security groups, and network-related resources
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class NetworkingInfrastructure(pulumi.ComponentResource):
  def __init__(self, 
               name: str,
               region: str,
               is_primary: bool,
               environment: str,
               tags: dict,
               opts: Optional[ResourceOptions] = None):
    super().__init__('nova:infrastructure:Networking', name, None, opts)

    self.region = region
    self.is_primary = is_primary
    self.environment = environment
    self.tags = tags
    self.region_suffix = region.replace('-', '').replace('gov', '')

    self.vpc_cidr = "10.0.0.0/16" if is_primary else "10.1.0.0/16"

    self._create_vpc()
    self._create_subnets()
    self._create_internet_gateway()
    self._create_nat_gateways()
    self._create_route_tables()
    self._create_security_groups()

    self.register_outputs({
      'vpc_id': self.vpc.id,
      'vpc_cidr': self.vpc.cidr_block,
      'public_subnet_ids': [subnet.id for subnet in self.public_subnets],
      'private_subnet_ids': [subnet.id for subnet in self.private_subnets],
      'alb_security_group_id': self.alb_security_group.id,
      'eb_security_group_id': self.eb_security_group.id
    })

  def _create_vpc(self):
    """Create VPC with DNS support"""
    self.vpc = aws.ec2.Vpc(
      f"vpc-{self.region_suffix}",
      cidr_block=self.vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**self.tags, "Name": f"nova-vpc-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_subnets(self):
    """Create public and private subnets across multiple AZs"""
    self.azs = aws.get_availability_zones(state="available", region=self.region)

    self.public_subnets = []
    self.private_subnets = []

    for i in range(2):
      az_output = pulumi.Output.from_input(self.azs).apply(lambda az: az.names[i])

      public_subnet = aws.ec2.Subnet(
        f"public-subnet-{i}-{self.region_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.{'0' if self.is_primary else '1'}.{i+1}.0/24",
        availability_zone=az_output,
        map_public_ip_on_launch=True,
        tags={**self.tags, "Name": f"nova-public-{i}-{self.region_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.public_subnets.append(public_subnet)

      private_subnet = aws.ec2.Subnet(
        f"private-subnet-{i}-{self.region_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.{'0' if self.is_primary else '1'}.{i+20}.0/24",
        availability_zone=az_output,
        tags={**self.tags, "Name": f"nova-private-{i}-{self.region_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.private_subnets.append(private_subnet)

  def _create_internet_gateway(self):
    """Create Internet Gateway for public internet access"""
    self.igw = aws.ec2.InternetGateway(
      f"igw-{self.region_suffix}",
      vpc_id=self.vpc.id,
      tags={**self.tags, "Name": f"nova-igw-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_nat_gateways(self):
    """Create NAT Gateways for private subnet internet access"""
    self.nat_gateways = []

    for i, public_subnet in enumerate(self.public_subnets):
      eip = aws.ec2.Eip(
        f"nat-eip-{i}-{self.region_suffix}",
        domain="vpc",
        tags={**self.tags, "Name": f"nova-nat-eip-{i}-{self.region_suffix}"},
        opts=ResourceOptions(parent=self)
      )

      nat_gw = aws.ec2.NatGateway(
        f"nat-gw-{i}-{self.region_suffix}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={**self.tags, "Name": f"nova-nat-gw-{i}-{self.region_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.nat_gateways.append(nat_gw)

  def _create_route_tables(self):
    """Create and configure route tables"""
    self.public_rt = aws.ec2.RouteTable(
      f"public-rt-{self.region_suffix}",
      vpc_id=self.vpc.id,
      routes=[
        aws.ec2.RouteTableRouteArgs(
          cidr_block="0.0.0.0/0",
          gateway_id=self.igw.id
        )
      ],
      tags={**self.tags, "Name": f"nova-public-rt-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"public-rt-assoc-{i}-{self.region_suffix}",
        subnet_id=subnet.id,
        route_table_id=self.public_rt.id,
        opts=ResourceOptions(parent=self)
      )

    self.private_rts = []
    for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      private_rt = aws.ec2.RouteTable(
        f"private-rt-{i}-{self.region_suffix}",
        vpc_id=self.vpc.id,
        routes=[
          aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gw.id
          )
        ],
        tags={**self.tags, "Name": f"nova-private-rt-{i}-{self.region_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.private_rts.append(private_rt)

      aws.ec2.RouteTableAssociation(
        f"private-rt-assoc-{i}-{self.region_suffix}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self)
      )

  def _create_security_groups(self):
    """Create security groups for ALB and Elastic Beanstalk"""
    self.alb_security_group = aws.ec2.SecurityGroup(
      f"alb-sg-{self.region_suffix}",
      description="Security group for Application Load Balancer",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTP from anywhere"
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=443,
          to_port=443,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTPS from anywhere"
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"],
          description="All outbound traffic"
        )
      ],
      tags={**self.tags, "Name": f"nova-alb-sg-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    self.eb_security_group = aws.ec2.SecurityGroup(
      f"eb-sg-{self.region_suffix}",
      description="Security group for Elastic Beanstalk instances",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          security_groups=[self.alb_security_group.id],
          description="HTTP from ALB"
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=22,
          to_port=22,
          cidr_blocks=[self.vpc_cidr],
          description="SSH from VPC"
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"],
          description="All outbound traffic"
        )
      ],
      tags={**self.tags, "Name": f"nova-eb-sg-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  @property
  def vpc_id(self):
    return self.vpc.id

  @property
  def public_subnet_ids(self):
    return [subnet.id for subnet in self.public_subnets]

  @property
  def private_subnet_ids(self):
    return [subnet.id for subnet in self.private_subnets]

  @property
  def alb_security_group_id(self):
    return self.alb_security_group.id

  @property
  def eb_security_group_id(self):
    return self.eb_security_group.id
