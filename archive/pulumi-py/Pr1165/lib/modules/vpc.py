"""
VPC infrastructure module
Creates VPC, subnets, internet gateway, NAT gateways, and route tables
"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List


def create_vpc_infrastructure(region: str, cidr_block: str, tags: Dict, provider: aws.Provider) -> Dict:
  """Create complete VPC infrastructure for a region"""

  # Create VPC
  vpc = aws.ec2.Vpc(
    f"vpc-{region}",
    cidr_block=cidr_block,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**tags, "Name": f"vpc-{region}"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Get availability zones
  azs = aws.get_availability_zones(
    state="available",
    opts=pulumi.InvokeOptions(provider=provider)
  )

  # Create Internet Gateway
  igw = aws.ec2.InternetGateway(
    f"igw-{region}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"igw-{region}"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Create public subnets
  public_subnets = []
  for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
    subnet = aws.ec2.Subnet(
      f"public-subnet-{region}-{i + 1}",
      vpc_id=vpc.id,
      cidr_block=f"{cidr_block.split('/')[0].rsplit('.', 2)[0]}.{i}.0/24",
      availability_zone=az,
      map_public_ip_on_launch=True,
      tags={**tags, "Name": f"public-subnet-{region}-{i + 1}", "Type": "Public"},
      opts=pulumi.ResourceOptions(provider=provider)
    )
    public_subnets.append(subnet)

  # Create private subnets
  private_subnets = []
  for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
    subnet = aws.ec2.Subnet(
      f"private-subnet-{region}-{i + 1}",
      vpc_id=vpc.id,
      cidr_block=f"{cidr_block.split('/')[0].rsplit('.', 2)[0]}.{i + 10}.0/24",
      availability_zone=az,
      tags={**tags, "Name": f"private-subnet-{region}-{i + 1}", "Type": "Private"},
      opts=pulumi.ResourceOptions(provider=provider)
    )
    private_subnets.append(subnet)

  # Create Elastic IPs for NAT Gateways
  eips = []
  for i in range(len(public_subnets)):
    eip = aws.ec2.Eip(
      f"eip-nat-{region}-{i + 1}",
      domain="vpc",
      tags={**tags, "Name": f"eip-nat-{region}-{i + 1}"},
      opts=pulumi.ResourceOptions(provider=provider, depends_on=[igw])
    )
    eips.append(eip)

  # Create NAT Gateways
  nat_gateways = []
  for i, (subnet, eip) in enumerate(zip(public_subnets, eips)):
    nat_gw = aws.ec2.NatGateway(
      f"nat-gw-{region}-{i + 1}",
      allocation_id=eip.id,
      subnet_id=subnet.id,
      tags={**tags, "Name": f"nat-gw-{region}-{i + 1}"},
      opts=pulumi.ResourceOptions(provider=provider, depends_on=[igw])
    )
    nat_gateways.append(nat_gw)

  # Create route tables
  public_rt = aws.ec2.RouteTable(
    f"public-rt-{region}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"public-rt-{region}"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Public route to Internet Gateway
  aws.ec2.Route(
    f"public-route-{region}",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Associate public subnets with public route table
  for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
      f"public-rta-{region}-{i + 1}",
      subnet_id=subnet.id,
      route_table_id=public_rt.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

  # Create private route tables and routes to NAT Gateways
  for i, (subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
    private_rt = aws.ec2.RouteTable(
      f"private-rt-{region}-{i + 1}",
      vpc_id=vpc.id,
      tags={**tags, "Name": f"private-rt-{region}-{i + 1}"},
      opts=pulumi.ResourceOptions(provider=provider)
    )

    # Private route to NAT Gateway
    aws.ec2.Route(
      f"private-route-{region}-{i + 1}",
      route_table_id=private_rt.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=nat_gw.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

    # Associate private subnet with private route table
    aws.ec2.RouteTableAssociation(
      f"private-rta-{region}-{i + 1}",
      subnet_id=subnet.id,
      route_table_id=private_rt.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

  return {
    "vpc": vpc,
    "public_subnets": public_subnets,
    "private_subnets": private_subnets,
    "internet_gateway": igw,
    "nat_gateways": nat_gateways
  }
