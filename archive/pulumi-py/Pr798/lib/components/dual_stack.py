import pulumi
import pulumi_aws as aws

class DualStackInfrastructure(pulumi.ComponentResource):
  """
  A Pulumi component that provisions a complete dual-stack
  (IPv4 and IPv6) network infrastructure.
  """
  def __init__(self, name: str, region: str, ipv4_cidr: str, opts: pulumi.ResourceOptions = None):
    super().__init__("custom:x:DualStackInfrastructure", name, None, opts)

    base_name = f"{name}-{region}"
    tags = {
      "Project": "nova-model-breaking",
      "Environment": "production",
      "Region": region,
    }

    # Use a Pulumi Provider to specify the region
    provider = aws.Provider(f"provider-{region}", region=region, opts=pulumi.ResourceOptions(parent=self))
    resource_opts = pulumi.ResourceOptions(parent=self, provider=provider)

    # 1. Create a Dual-Stack VPC
    self.vpc = aws.ec2.Vpc(
      f"{base_name}-vpc",
      cidr_block=ipv4_cidr,
      instance_tenancy="default",
      enable_dns_support=True,
      enable_dns_hostnames=True,
      assign_generated_ipv6_cidr_block=True,
      tags={**tags, "Name": f"{base_name}-vpc"},
      opts=resource_opts
    )

    # 2. Create an Internet Gateway for IPv4 and IPv6 public access
    self.igw = aws.ec2.InternetGateway(
      f"{base_name}-igw",
      vpc_id=self.vpc.id,
      tags={**tags, "Name": f"{base_name}-igw"},
      opts=resource_opts
    )

    # 3. Create an Egress-Only Internet Gateway for IPv6 private subnet access
    self.eigw = aws.ec2.EgressOnlyInternetGateway(
      f"{base_name}-eigw",
      vpc_id=self.vpc.id,
      opts=resource_opts
    )

    # 4. Create Public and Private Subnets (dual-stack)
    # Fix the IPv6 CIDR generation to create valid subnet blocks
    self.public_subnet = aws.ec2.Subnet(
      f"{base_name}-public-subnet",
      vpc_id=self.vpc.id,
      cidr_block=f"{ipv4_cidr.split('.')[0]}.{ipv4_cidr.split('.')[1]}.1.0/24",
      assign_ipv6_address_on_creation=True,
      ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
        lambda cidr: cidr.replace("/56", "/64")
      ),
      map_public_ip_on_launch=True,
      tags={**tags, "Name": f"{base_name}-public-subnet"},
      opts=resource_opts
    )

    self.private_subnet = aws.ec2.Subnet(
      f"{base_name}-private-subnet",
      vpc_id=self.vpc.id,
      cidr_block=f"{ipv4_cidr.split('.')[0]}.{ipv4_cidr.split('.')[1]}.2.0/24",
      assign_ipv6_address_on_creation=True,
      ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
        lambda cidr: f"{cidr[:-6]}1::/64"
      ),
      map_public_ip_on_launch=False,
      tags={**tags, "Name": f"{base_name}-private-subnet"},
      opts=resource_opts
    )

    # 5. Create a NAT Gateway for IPv4 private subnets
    eip = aws.ec2.Eip(f"{base_name}-nat-eip", opts=resource_opts)
    self.nat_gateway = aws.ec2.NatGateway(
      f"{base_name}-nat-gateway",
      subnet_id=self.public_subnet.id,
      allocation_id=eip.id,
      tags={**tags, "Name": f"{base_name}-nat-gateway"},
      opts=resource_opts
    )

    # 6. Create Route Tables
    self.public_rt = aws.ec2.RouteTable(
      f"{base_name}-public-rt",
      vpc_id=self.vpc.id,
      tags={**tags, "Name": f"{base_name}-public-rt"},
      opts=resource_opts
    )

    # Route for IPv4 and IPv6 public internet traffic
    aws.ec2.Route(
      f"{base_name}-public-route-ipv4",
      route_table_id=self.public_rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id,
      opts=resource_opts
    )
    aws.ec2.Route(
      f"{base_name}-public-route-ipv6",
      route_table_id=self.public_rt.id,
      destination_ipv6_cidr_block="::/0",
      gateway_id=self.igw.id,
      opts=resource_opts
    )

    # Associate public route table with public subnet
    aws.ec2.RouteTableAssociation(
      f"{base_name}-public-rta",
      subnet_id=self.public_subnet.id,
      route_table_id=self.public_rt.id,
      opts=resource_opts
    )

    self.private_rt = aws.ec2.RouteTable(
      f"{base_name}-private-rt",
      vpc_id=self.vpc.id,
      tags={**tags, "Name": f"{base_name}-private-rt"},
      opts=resource_opts
    )

    # Route for IPv4 and IPv6 private internet traffic
    aws.ec2.Route(
      f"{base_name}-private-route-ipv4",
      route_table_id=self.private_rt.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=self.nat_gateway.id,
      opts=resource_opts
    )
    aws.ec2.Route(
      f"{base_name}-private-route-ipv6",
      route_table_id=self.private_rt.id,
      destination_ipv6_cidr_block="::/0",
      egress_only_gateway_id=self.eigw.id,
      opts=resource_opts
    )

    # Associate private route table with private subnet
    aws.ec2.RouteTableAssociation(
      f"{base_name}-private-rta",
      subnet_id=self.private_subnet.id,
      route_table_id=self.private_rt.id,
      opts=resource_opts
    )

    self.register_outputs({
      "vpc": self.vpc,
      "public_subnet": self.public_subnet,
      "private_subnet": self.private_subnet,
      "public_rt": self.public_rt,
      "private_rt": self.private_rt
    })