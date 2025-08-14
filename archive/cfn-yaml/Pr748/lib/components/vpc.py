import ipaddress
import pulumi
import pulumi_aws as aws


class ComputeComponent(pulumi.ComponentResource):
  def __init__(
      self,
      name: str,
      cidr_block: str,
      environment: str,
      opts=None,
  ):
    super().__init__("custom:aws:Compute", name, None, opts)

    # Create VPC with DNS support for RDS connectivity
    self.vpc = aws.ec2.Vpc(
        f"vpc-{environment}",
        cidr_block=cidr_block,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"vpc-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Create Internet Gateway for public subnet connectivity
    self.igw = aws.ec2.InternetGateway(
        f"igw-{environment}",
        vpc_id=self.vpc.id,
        tags={
            "Name": f"igw-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Get availability zones for multi-AZ deployment
    azs = aws.get_availability_zones(state="available")

    # Create public subnets (2 for high availability)
    self.public_subnets = []
    self.public_subnet_ids = []
    # Create subnet cidrs
    network = ipaddress.ip_network(cidr_block)
    subnet_cidrs = list(network.subnets(new_prefix=24))

    for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
      subnet = aws.ec2.Subnet(
          f"public-subnet-{environment}-{i+1}",
          vpc_id=self.vpc.id,
          cidr_block=str(subnet_cidrs[i]),
          availability_zone=az,
          map_public_ip_on_launch=True,
          tags={
              "Name": f"public-subnet-{environment}-{i+1}",
              "Environment": environment,
              "Type": "Public"
          }
      )
      self.public_subnets.append(subnet)
      self.public_subnet_ids.append(subnet.id)

    self.private_subnets = []
    self.private_subnet_ids = []
    # Create private subnets (for Lambda and RDS)
    for i, az in enumerate(azs.names[:2]):
      subnet = aws.ec2.Subnet(
          f"private-subnet-{environment}-{i+1}",
          vpc_id=self.vpc.id,
          cidr_block=str(subnet_cidrs[i + 2]),
          availability_zone=az,
          tags={
              "Name": f"private-subnet-{environment}-{i+1}",
              "Environment": environment,
              "Type": "Private"
          }
      )
      self.private_subnets.append(subnet)
      self.private_subnet_ids.append(subnet.id)

    # Create Elastic IP for NAT Gateway
    self.nat_eip = aws.ec2.Eip(
        f"nat-eip-{environment}",
        domain="vpc",
        tags={
            "Name": f"nat-eip-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Create NAT Gateway in first public subnet
    self.nat_gateway = aws.ec2.NatGateway(
        f"nat-gateway-{environment}",
        allocation_id=self.nat_eip.id,
        subnet_id=self.public_subnets[0].id,
        tags={
            "Name": f"nat-gateway-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Create route table for public subnets
    self.public_rt = aws.ec2.RouteTable(
        f"public-rt-{environment}",
        vpc_id=self.vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )
        ],
        tags={
            "Name": f"public-rt-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Create route table for private subnets
    self.private_rt = aws.ec2.RouteTable(
        f"private-rt-{environment}",
        vpc_id=self.vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id
            )
        ],
        tags={
            "Name": f"private-rt-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
          f"public-rta-{environment}-{i+1}",
          subnet_id=subnet.id,
          route_table_id=self.public_rt.id
      )

    # Associate private subnets with private route table
    for i, subnet in enumerate(self.private_subnets):
      aws.ec2.RouteTableAssociation(
          f"private-rta-{environment}-{i+1}",
          subnet_id=subnet.id,
          route_table_id=self.private_rt.id
      )

    # Security group for Lambda function
    self.lambda_sg = aws.ec2.SecurityGroup(
        f"lambda-sg-{environment}",
        name=f"lambda-sg-{environment}",
        description="Security group for Lambda function",
        vpc_id=self.vpc.id,
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )
        ],
        tags={
            "Name": f"lambda-sg-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Security group for RDS instance
    self.db_sg = aws.ec2.SecurityGroup(
        f"db-sg-{environment}",
        name=f"db-sg-{environment}",
        description="Security group for RDS database",
        vpc_id=self.vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,  # PostgreSQL port
                to_port=5432,
                security_groups=[self.lambda_sg.id]
            )
        ],
        tags={
            "Name": f"db-sg-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    self.register_outputs(
        {
            "vpc_id": self.vpc.id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "lambda_security_group_id": self.lambda_sg.id,
            "db_security_group_id": self.db_sg.id,
            "nat_gateway_id": self.nat_gateway.id
        }
    )
