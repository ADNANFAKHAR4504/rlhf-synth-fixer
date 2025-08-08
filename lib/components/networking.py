"""
Pulumi Component for Networking Infrastructure
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class NetworkingInfrastructure(pulumi.ComponentResource):
  """
  Creates a VPC, subnets, internet gateway, and NAT gateway.
  """
  def __init__(self,
               name: str,
               environment: str,
               region: str,
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('tap:components:NetworkingInfrastructure', name, None, opts)

    # Use a default CIDR block for the VPC
    vpc_cidr_block = "10.0.0.0/16"
    private_subnet_1_cidr = "10.0.1.0/24"
    private_subnet_2_cidr = "10.0.2.0/24"
    public_subnet_1_cidr = "10.0.101.0/24"
    public_subnet_2_cidr = "10.0.102.0/24"

    # Create the VPC
    self.vpc = aws.ec2.Vpc(
        f"{name}-vpc",
        cidr_block=vpc_cidr_block,
        enable_dns_hostnames=True,
        tags={**tags, "Name": f"{name}-vpc"},
        opts=ResourceOptions(parent=self)
    )

    # Create an Internet Gateway for the VPC
    self.igw = aws.ec2.InternetGateway(
        f"{name}-igw",
        vpc_id=self.vpc.id,
        tags={**tags, "Name": f"{name}-igw"},
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    # Create public subnets
    self.public_subnet_1 = aws.ec2.Subnet(
        f"{name}-public-subnet-1",
        vpc_id=self.vpc.id,
        cidr_block=public_subnet_1_cidr,
        map_public_ip_on_launch=True,
        availability_zone=pulumi.Output.concat(region, "a"),
        tags={**tags, "Name": f"{name}-public-subnet-1"},
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    self.public_subnet_2 = aws.ec2.Subnet(
        f"{name}-public-subnet-2",
        vpc_id=self.vpc.id,
        cidr_block=public_subnet_2_cidr,
        map_public_ip_on_launch=True,
        availability_zone=pulumi.Output.concat(region, "b"),
        tags={**tags, "Name": f"{name}-public-subnet-2"},
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    # Create private subnets
    self.private_subnet_1 = aws.ec2.Subnet(
        f"{name}-private-subnet-1",
        vpc_id=self.vpc.id,
        cidr_block=private_subnet_1_cidr,
        availability_zone=pulumi.Output.concat(region, "a"),
        tags={**tags, "Name": f"{name}-private-subnet-1"},
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    self.private_subnet_2 = aws.ec2.Subnet(
        f"{name}-private-subnet-2",
        vpc_id=self.vpc.id,
        cidr_block=private_subnet_2_cidr,
        availability_zone=pulumi.Output.concat(region, "b"),
        tags={**tags, "Name": f"{name}-private-subnet-2"},
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    # Create a NAT Gateway and EIP for private subnet internet access
    self.eip = aws.ec2.Eip(
        f"{name}-nat-eip",
        domain="vpc",
        tags={**tags, "Name": f"{name}-nat-eip"},
        opts=ResourceOptions(parent=self, depends_on=[self.igw])
    )

    self.nat_gateway = aws.ec2.NatGateway(
        f"{name}-nat-gateway",
        subnet_id=self.public_subnet_1.id,
        allocation_id=self.eip.id,
        tags={**tags, "Name": f"{name}-nat-gateway"},
        opts=ResourceOptions(parent=self, depends_on=[self.eip, self.public_subnet_1])
    )

    # Create a public route table
    self.public_route_table = aws.ec2.RouteTable(
        f"{name}-public-rt",
        vpc_id=self.vpc.id,
        tags={**tags, "Name": f"{name}-public-rt"},
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    # Create a private route table
    self.private_route_table = aws.ec2.RouteTable(
        f"{name}-private-rt",
        vpc_id=self.vpc.id,
        tags={**tags, "Name": f"{name}-private-rt"},
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    # Create a default route for the public route table
    aws.ec2.Route(
        f"{name}-public-route",
        route_table_id=self.public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=self.igw.id,
        opts=ResourceOptions(parent=self.public_route_table)
    )

    # Create a default route for the private route table
    aws.ec2.Route(
        f"{name}-private-route",
        route_table_id=self.private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=self.nat_gateway.id,
        opts=ResourceOptions(parent=self.private_route_table)
    )

    # Associate subnets with route tables
    aws.ec2.RouteTableAssociation(
        f"{name}-public-rt-assoc-1",
        subnet_id=self.public_subnet_1.id,
        route_table_id=self.public_route_table.id,
        opts=ResourceOptions(parent=self.public_route_table)
    )

    aws.ec2.RouteTableAssociation(
        f"{name}-public-rt-assoc-2",
        subnet_id=self.public_subnet_2.id,
        route_table_id=self.public_route_table.id,
        opts=ResourceOptions(parent=self.public_route_table)
    )

    aws.ec2.RouteTableAssociation(
        f"{name}-private-rt-assoc-1",
        subnet_id=self.private_subnet_1.id,
        route_table_id=self.private_route_table.id,
        opts=ResourceOptions(parent=self.private_route_table)
    )

    aws.ec2.RouteTableAssociation(
        f"{name}-private-rt-assoc-2",
        subnet_id=self.private_subnet_2.id,
        route_table_id=self.private_route_table.id,
        opts=ResourceOptions(parent=self.private_route_table)
    )

    # Export key outputs to be used by other components
    self.vpc_id = self.vpc.id
    # FIX: Convert list of Outputs to a proper Pulumi Output
    self.private_subnet_ids = pulumi.Output.all(self.private_subnet_1.id, self.private_subnet_2.id)