import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, InvokeOptions
from ..config import InfrastructureConfig


class NetworkingComponent(ComponentResource):
  def __init__(self, name: str, region: str, config: InfrastructureConfig,
               opts: ResourceOptions = None):
    super().__init__('custom:networking:NetworkingComponent', name, None, opts)

    # Get availability zones for the specific region
    invoke_opts = InvokeOptions(provider=opts.provider) if opts and opts.provider else None
    azs = aws.get_availability_zones(state="available", opts=invoke_opts)

    # Create VPC
    self.vpc = aws.ec2.Vpc(
      f"{name}-vpc",
      cidr_block=config.networking.vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-vpc",
        "Region": region
      },
      opts=ResourceOptions(parent=self)
    )

    # Create Internet Gateway
    self.igw = aws.ec2.InternetGateway(
      f"{name}-igw",
      vpc_id=self.vpc.id,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-igw"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create public subnets
    self.public_subnets = []
    self.public_subnet_ids = []

    for i in range(min(config.networking.availability_zones_count, len(azs.names))):
      public_subnet = aws.ec2.Subnet(
        f"{name}-public-subnet-{i + 1}",
        vpc_id=self.vpc.id,
        cidr_block=(config.networking.public_subnet_cidrs[i]
                    if i < len(config.networking.public_subnet_cidrs)
                    else f"10.0.{i + 1}.0/24"),
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,
        tags={
          **config.tags,
          "Name": f"{config.app_name}-{config.environment}-public-subnet-{i + 1}",
          "Type": "public"
        },
        opts=ResourceOptions(parent=self)
      )
      self.public_subnets.append(public_subnet)
      self.public_subnet_ids.append(public_subnet.id)

    # Create private subnets
    self.private_subnets = []
    self.private_subnet_ids = []

    for i in range(min(config.networking.availability_zones_count, len(azs.names))):
      private_subnet = aws.ec2.Subnet(
        f"{name}-private-subnet-{i + 1}",
        vpc_id=self.vpc.id,
        cidr_block=(config.networking.private_subnet_cidrs[i]
                    if i < len(config.networking.private_subnet_cidrs)
                    else f"10.0.{i + 10}.0/24"),
        availability_zone=azs.names[i],
        tags={
          **config.tags,
          "Name": f"{config.app_name}-{config.environment}-private-subnet-{i + 1}",
          "Type": "private"
        },
        opts=ResourceOptions(parent=self)
      )
      self.private_subnets.append(private_subnet)
      self.private_subnet_ids.append(private_subnet.id)

    # Create NAT Gateways
    self.nat_gateways = []
    for i, public_subnet in enumerate(self.public_subnets):
      # Elastic IP for NAT Gateway
      eip = aws.ec2.Eip(
        f"{name}-nat-eip-{i + 1}",
        domain="vpc",
        tags={
          **config.tags,
          "Name": f"{config.app_name}-{config.environment}-nat-eip-{i + 1}"
        },
        opts=ResourceOptions(parent=self, depends_on=[self.igw])
      )

      # NAT Gateway
      nat_gw = aws.ec2.NatGateway(
        f"{name}-nat-gw-{i + 1}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
          **config.tags,
          "Name": f"{config.app_name}-{config.environment}-nat-gw-{i + 1}"
        },
        opts=ResourceOptions(parent=self)
      )
      self.nat_gateways.append(nat_gw)

    # Create route tables
    # Public route table
    self.public_rt = aws.ec2.RouteTable(
      f"{name}-public-rt",
      vpc_id=self.vpc.id,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-public-rt"
      },
      opts=ResourceOptions(parent=self)
    )

    # Public route to internet
    aws.ec2.Route(
      f"{name}-public-route",
      route_table_id=self.public_rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id,
      opts=ResourceOptions(parent=self)
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"{name}-public-rta-{i + 1}",
        subnet_id=subnet.id,
        route_table_id=self.public_rt.id,
        opts=ResourceOptions(parent=self)
      )

    # Private route tables (one per AZ for high availability)
    for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      private_rt = aws.ec2.RouteTable(
        f"{name}-private-rt-{i + 1}",
        vpc_id=self.vpc.id,
        tags={
          **config.tags,
          "Name": f"{config.app_name}-{config.environment}-private-rt-{i + 1}"
        },
        opts=ResourceOptions(parent=self)
      )

      # Private route to NAT Gateway
      aws.ec2.Route(
        f"{name}-private-route-{i + 1}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gw.id,
        opts=ResourceOptions(parent=self)
      )

      # Associate private subnet with private route table
      aws.ec2.RouteTableAssociation(
        f"{name}-private-rta-{i + 1}",
        subnet_id=private_subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self)
      )

    self.register_outputs({
      "vpc_id": self.vpc.id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids
    })
