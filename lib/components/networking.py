# lib/components/networking.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class NetworkInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    region: str,
    environment: str,
    tags: dict,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('aws:components:NetworkInfrastructure', name, None, opts)

    self.region = region
    self.environment = environment
    self.tags = tags

    # Get availability zones for the region
    self.availability_zones = aws.get_availability_zones(
      state="available"
    ).names[:2]  # Get first 2 AZs

    # Create VPC
    self.vpc = aws.ec2.Vpc(
      f"{name}-vpc",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        **tags,
        "Name": f"{name}-vpc"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create Internet Gateway
    self.internet_gateway = aws.ec2.InternetGateway(
      f"{name}-igw",
      vpc_id=self.vpc.id,
      tags={
        **tags,
        "Name": f"{name}-igw"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create public subnets
    self.public_subnets = []
    self.public_subnet_ids = []

    for i, az in enumerate(self.availability_zones):
      public_subnet = aws.ec2.Subnet(
        f"{name}-public-subnet-{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
          **tags,
          "Name": f"{name}-public-subnet-{i+1}",
          "Type": "Public"
        },
        opts=ResourceOptions(parent=self)
      )
      self.public_subnets.append(public_subnet)
      self.public_subnet_ids.append(public_subnet.id)

    # Create private subnets
    self.private_subnets = []
    self.private_subnet_ids = []

    for i, az in enumerate(self.availability_zones):
      private_subnet = aws.ec2.Subnet(
        f"{name}-private-subnet-{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={
          **tags,
          "Name": f"{name}-private-subnet-{i+1}",
          "Type": "Private"
        },
        opts=ResourceOptions(parent=self)
      )
      self.private_subnets.append(private_subnet)
      self.private_subnet_ids.append(private_subnet.id)

    # Create NAT Gateways for private subnets
    self.nat_gateways = []
    self.elastic_ips = []

    for i, public_subnet in enumerate(self.public_subnets):
      # Create Elastic IP for NAT Gateway
      eip = aws.ec2.Eip(
        f"{name}-eip-{i+1}",
        domain="vpc",
        tags={
          **tags,
          "Name": f"{name}-eip-{i+1}"
        },
        opts=ResourceOptions(parent=self, depends_on=[self.internet_gateway])
      )
      self.elastic_ips.append(eip)

      # Create NAT Gateway
      nat_gw = aws.ec2.NatGateway(
        f"{name}-nat-gw-{i+1}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
          **tags,
          "Name": f"{name}-nat-gw-{i+1}"
        },
        opts=ResourceOptions(parent=self, depends_on=[self.internet_gateway])
      )
      self.nat_gateways.append(nat_gw)

    # Create route table for public subnets
    self.public_route_table = aws.ec2.RouteTable(
      f"{name}-public-rt",
      vpc_id=self.vpc.id,
      tags={
        **tags,
        "Name": f"{name}-public-rt"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create route to Internet Gateway for public subnets
    self.public_route = aws.ec2.Route(
      f"{name}-public-route",
      route_table_id=self.public_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.internet_gateway.id,
      opts=ResourceOptions(parent=self)
    )

    # Associate public subnets with public route table
    self.public_route_table_associations = []
    for i, public_subnet in enumerate(self.public_subnets):
      association = aws.ec2.RouteTableAssociation(
        f"{name}-public-rta-{i+1}",
        subnet_id=public_subnet.id,
        route_table_id=self.public_route_table.id,
        opts=ResourceOptions(parent=self)
      )
      self.public_route_table_associations.append(association)

    # Create route tables for private subnets
    self.private_route_tables = []
    self.private_routes = []
    self.private_route_table_associations = []

    for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      # Create route table for private subnet
      private_rt = aws.ec2.RouteTable(
        f"{name}-private-rt-{i+1}",
        vpc_id=self.vpc.id,
        tags={
          **tags,
          "Name": f"{name}-private-rt-{i+1}"
        },
        opts=ResourceOptions(parent=self)
      )
      self.private_route_tables.append(private_rt)

      # Create route to NAT Gateway for private subnet
      private_route = aws.ec2.Route(
        f"{name}-private-route-{i+1}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gw.id,
        opts=ResourceOptions(parent=self)
      )
      self.private_routes.append(private_route)

      # Associate private subnet with its route table
      private_rta = aws.ec2.RouteTableAssociation(
        f"{name}-private-rta-{i+1}",
        subnet_id=private_subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self)
      )
      self.private_route_table_associations.append(private_rta)

    # Create VPC Security Group (default)
    self.vpc_security_group = aws.ec2.SecurityGroup(
      f"{name}-vpc-sg",
      name=f"{name}-vpc-sg",
      description="Default VPC Security Group",
      vpc_id=self.vpc.id,
      ingress=[
        {
          "protocol": "tcp",
          "from_port": 443,
          "to_port": 443,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTPS"
        },
        {
          "protocol": "tcp",
          "from_port": 80,
          "to_port": 80,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTP"
        }
      ],
      egress=[
        {
          "protocol": "-1",
          "from_port": 0,
          "to_port": 0,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "All outbound traffic"
        }
      ],
      tags={
        **tags,
        "Name": f"{name}-vpc-sg"
      },
      opts=ResourceOptions(parent=self)
    )

    # Register outputs
    self.register_outputs({
      "vpc_id": self.vpc.id,
      "vpc_cidr_block": self.vpc.cidr_block,
      "internet_gateway_id": self.internet_gateway.id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids,
      "availability_zones": self.availability_zones,
      "vpc_security_group_id": self.vpc_security_group.id
    })
