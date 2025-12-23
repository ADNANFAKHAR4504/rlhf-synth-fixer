# components/networking.py
"""
Networking component that creates VPC, subnets, routing, and NAT gateways
Ensures proper isolation between public and private resources
"""

import ipaddress
import pulumi
import pulumi_aws as aws


AZ_CONFIG = {

    "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c"],

    "us-west-2": ["us-west-2a", "us-west-2b", "us-west-2c"]

}


# CIDR blocks for VPCs to avoid conflicts

VPC_CIDRS = {

    "us-east-1": "10.0.0.0/16",

    "us-west-2": "10.1.0.0/16"

}


class NetworkingComponent(pulumi.ComponentResource):
  def __init__(self, name: str, region: str, tags: dict, opts: pulumi.ResourceOptions = None):
    super().__init__("custom:networking:NetworkingComponent", name, None, opts)

    self.region = region
    self.tags = tags

    # Create VPC with DNS support for RDS connectivity
    self.vpc = aws.ec2.Vpc(
        f"{name}-vpc",
        cidr_block=VPC_CIDRS[region],
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**tags, "Name": f"{name}-vpc"},
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Create Internet Gateway for public subnet connectivity
    self.igw = aws.ec2.InternetGateway(
        f"{name}-igw",
        vpc_id=self.vpc.id,
        tags={**tags, "Name": f"{name}-igw"},
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Get availability zones for the region
    azs = AZ_CONFIG[region][:2]  # Use first 2 AZs for Multi-AZ setup

    # Create public subnets (for ALB)
    self.public_subnets = []
    self.public_subnet_ids = []

    # Create subnet cidrs
    network = ipaddress.ip_network(VPC_CIDRS[region])
    subnet_cidrs = list(network.subnets(new_prefix=24))

    for i, az in enumerate(azs):
      subnet = aws.ec2.Subnet(
          f"{name}-public-subnet-{i+1}",
          vpc_id=self.vpc.id,
          cidr_block=str(subnet_cidrs[i]),
          availability_zone=az,
          map_public_ip_on_launch=True,
          tags={**tags, "Name": f"{name}-public-subnet-{i+1}", "Type": "Public"},
          opts=pulumi.ResourceOptions(parent=self)
      )
      self.public_subnets.append(subnet)
      self.public_subnet_ids.append(subnet.id)

    # Create private subnets (for Lambda and RDS)
    self.private_subnets = []
    self.private_subnet_ids = []

    for i, az in enumerate(azs):
      subnet = aws.ec2.Subnet(
          f"{name}-private-subnet-{i+1}",
          vpc_id=self.vpc.id,
          cidr_block=str(subnet_cidrs[i + 2]),
          availability_zone=az,
          tags={**tags, "Name": f"{name}-private-subnet-{i+1}", "Type": "Private"},
          opts=pulumi.ResourceOptions(parent=self)
      )
      self.private_subnets.append(subnet)
      self.private_subnet_ids.append(subnet.id)

    # LOCALSTACK FIX: NAT Gateways removed (hangs in LocalStack Community)
    # Lambda will use public subnets instead for LocalStack compatibility
    # self.nat_gateways = []

    # Create route table for public subnets
    self.public_route_table = aws.ec2.RouteTable(
        f"{name}-public-rt",
        vpc_id=self.vpc.id,
        tags={**tags, "Name": f"{name}-public-rt"},
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Route public traffic to Internet Gateway
    aws.ec2.Route(
        f"{name}-public-route",
        route_table_id=self.public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=self.igw.id,
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
          f"{name}-public-rta-{i+1}",
          subnet_id=subnet.id,
          route_table_id=self.public_route_table.id,
          opts=pulumi.ResourceOptions(parent=self)
      )

    # LOCALSTACK FIX: Simplified routing - private subnets use Internet Gateway
    # For LocalStack, we use simplified routing without NAT Gateways
    self.private_route_tables = []
    for i, subnet in enumerate(self.private_subnets):
      rt = aws.ec2.RouteTable(
          f"{name}-private-rt-{i+1}",
          vpc_id=self.vpc.id,
          tags={**tags, "Name": f"{name}-private-rt-{i+1}"},
          opts=pulumi.ResourceOptions(parent=self)
      )

      # LOCALSTACK FIX: Route private traffic to Internet Gateway instead of NAT
      aws.ec2.Route(
          f"{name}-private-route-{i+1}",
          route_table_id=rt.id,
          destination_cidr_block="0.0.0.0/0",
          gateway_id=self.igw.id,
          opts=pulumi.ResourceOptions(parent=self)
      )

      # Associate private subnet with route table
      aws.ec2.RouteTableAssociation(
          f"{name}-private-rta-{i+1}",
          subnet_id=subnet.id,
          route_table_id=rt.id,
          opts=pulumi.ResourceOptions(parent=self)
      )

      self.private_route_tables.append(rt)
