# lib/components/networking.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

"""
Network Security Infrastructure Component

This component creates and manages:
- VPC with public and private subnets across multiple AZs
- Security Groups with restricted access
- Network ACLs for subnet protection
- NAT Gateways for secure outbound access
- Internet Gateway for public access
- Route tables and associations
- VPC Endpoints for secure AWS service access
"""

class NetworkSecurityInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               region: str,
               environment: str,
               kms_key_arn: pulumi.Input[str],
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:networking:NetworkSecurity', name, None, opts)

    self.region = region
    self.environment = environment
    self.kms_key_arn = kms_key_arn
    self.tags = tags or {}

    # Validate inputs
    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")
    if not environment:
      raise ValueError("environment must be provided")
    if not kms_key_arn:
      raise ValueError("kms_key_arn must be provided")

    # VPC Configuration
    self._create_vpc()
    self._create_subnets()
    self._create_internet_gateway()
    self._create_nat_gateways()
    self._create_route_tables()
    self._create_security_groups()
    self._create_network_acls()
    self._create_vpc_endpoints()

    # Register outputs
    self.register_outputs({
      "vpc_id": self.vpc.id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids,
      "web_security_group_id": self.web_security_group.id,
      "app_security_group_id": self.app_security_group.id,
      "database_security_group_id": self.database_security_group.id,
      "nat_gateway_ids": [nat.id for nat in self.nat_gateways],
      "s3_endpoint_id": self.s3_endpoint.id,
      "dynamodb_endpoint_id": self.dynamodb_endpoint.id
    })

  def _create_vpc(self):
    """Create VPC with DNS support and hostname resolution"""
    self.vpc = aws.ec2.Vpc(
      f"{self.region.replace('-', '')}-secure-projectx-vpc-{self.environment}",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        **self.tags,
        "Name": f"secure-projectx-vpc-{self.region}-{self.environment}",
        "Type": "Security-VPC"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_subnets(self):
    """Create public and private subnets across multiple AZs"""
    azs = aws.get_availability_zones(state="available")

    self.public_subnets = []
    self.private_subnets = []
    self.public_subnet_ids = []
    self.private_subnet_ids = []

    # Use 2 AZs for cost efficiency; scale to 3+ for higher availability
    for i in range(min(2, len(azs.names))):
      az = azs.names[i]

      public_subnet = aws.ec2.Subnet(
        f"{self.region.replace('-', '')}-secure-projectx-public-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
          **self.tags,
          "Name": f"secure-projectx-public-{i+1}-{self.region}-{self.environment}",
          "Type": "Public-Subnet"
        },
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
      )
      self.public_subnets.append(public_subnet)
      self.public_subnet_ids.append(public_subnet.id)

      private_subnet = aws.ec2.Subnet(
        f"{self.region.replace('-', '')}-secure-projectx-private-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=False,
        tags={
          **self.tags,
          "Name": f"secure-projectx-private-{i+1}-{self.region}-{self.environment}",
          "Type": "Private-Subnet"
        },
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
      )
      self.private_subnets.append(private_subnet)
      self.private_subnet_ids.append(private_subnet.id)

  def _create_internet_gateway(self):
    """Create Internet Gateway for public subnet access"""
    self.igw = aws.ec2.InternetGateway(
      f"{self.region.replace('-', '')}-secure-projectx-igw-{self.environment}",
      vpc_id=self.vpc.id,
      tags={
        **self.tags,
        "Name": f"secure-projectx-igw-{self.region}-{self.environment}",
        "Type": "Internet-Gateway"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

  def _create_nat_gateways(self):
    """Create NAT Gateways in public subnets for private subnet outbound access"""
    self.nat_gateways = []
    self.eips = []

    for i, public_subnet in enumerate(self.public_subnets):
      eip = aws.ec2.Eip(
        f"{self.region.replace('-', '')}-secure-projectx-nat-eip-{i+1}-{self.environment}",
        domain="vpc",
        tags={
          **self.tags,
          "Name": f"secure-projectx-nat-eip-{i+1}-{self.region}-{self.environment}",
          "Type": "Elastic-IP"
        },
        opts=ResourceOptions(parent=self, depends_on=[self.igw, public_subnet])
      )
      self.eips.append(eip)

      nat_gw = aws.ec2.NatGateway(
        f"{self.region.replace('-', '')}-secure-projectx-nat-{i+1}-{self.environment}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
          **self.tags,
          "Name": f"secure-projectx-nat-{i+1}-{self.region}-{self.environment}",
          "Type": "NAT-Gateway"
        },
        opts=ResourceOptions(parent=self, depends_on=[eip, public_subnet])
      )
      self.nat_gateways.append(nat_gw)

  def _create_route_tables(self):
    """Create route tables and associations"""
    self.public_route_table = aws.ec2.RouteTable(
      f"{self.region.replace('-', '')}-secure-projectx-public-rt-{self.environment}",
      vpc_id=self.vpc.id,
      tags={
        **self.tags,
        "Name": f"secure-projectx-public-rt-{self.region}-{self.environment}",
        "Type": "Public-RouteTable"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    aws.ec2.Route(
      f"{self.region.replace('-', '')}-secure-projectx-public-route-{self.environment}",
      route_table_id=self.public_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id,
      opts=ResourceOptions(parent=self, depends_on=[self.public_route_table, self.igw])
    )

    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"{self.region.replace('-', '')}-secure-projectx-public-rta-{i+1}-{self.environment}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id,
        opts=ResourceOptions(parent=self, depends_on=[self.public_route_table, subnet])
      )

    self.private_route_tables = []
    for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      private_rt = aws.ec2.RouteTable(
        f"{self.region.replace('-', '')}-secure-projectx-private-rt-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        tags={
          **self.tags,
          "Name": f"secure-projectx-private-rt-{i+1}-{self.region}-{self.environment}",
          "Type": "Private-RouteTable"
        },
        opts=ResourceOptions(parent=self, depends_on=[self.vpc])
      )
      self.private_route_tables.append(private_rt)

      aws.ec2.Route(
        f"{self.region.replace('-', '')}-secure-projectx-private-route-{i+1}-{self.environment}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gw.id,
        opts=ResourceOptions(parent=self, depends_on=[private_rt, nat_gw])
      )

      aws.ec2.RouteTableAssociation(
        f"{self.region.replace('-', '')}-secure-projectx-private-rta-{i+1}-{self.environment}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self, depends_on=[private_rt, subnet])
      )

  def _create_security_groups(self):
    """Create security groups with restricted access"""
    self.web_security_group = aws.ec2.SecurityGroup(
      f"{self.region.replace('-', '')}-secure-projectx-web-sg-{self.environment}",
      name_prefix=f"secure-projectx-web-{self.region}-{self.environment}-",
      description="Security group for web tier with restricted HTTP/HTTPS access",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          description="HTTPS from Internet",
          from_port=443,
          to_port=443,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"]  # Placeholder: Use CloudFront IPs in production
        ),
        aws.ec2.SecurityGroupIngressArgs(
          description="HTTP redirect",
          from_port=80,
          to_port=80,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          description="All outbound",
          from_port=0,
          to_port=0,
          protocol="-1",
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      tags={
        **self.tags,
        "Name": f"secure-projectx-web-sg-{self.region}-{self.environment}",
        "Tier": "Web"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    self.app_security_group = aws.ec2.SecurityGroup(
      f"{self.region.replace('-', '')}-secure-projectx-app-sg-{self.environment}",
      name_prefix=f"secure-projectx-app-{self.region}-{self.environment}-",
      description="Security group for application tier with restricted access",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          description="SSH from VPC",
          from_port=22,
          to_port=22,
          protocol="tcp",
          cidr_blocks=["10.0.0.0/16"]  # Restrict to VPC; consider bastion SG
        ),
        aws.ec2.SecurityGroupIngressArgs(
          description="App traffic from web tier",
          from_port=8080,
          to_port=8080,
          protocol="tcp",
          security_groups=[self.web_security_group.id]
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          description="All outbound",
          from_port=0,
          to_port=0,
          protocol="-1",
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      tags={
        **self.tags,
        "Name": f"secure-projectx-app-sg-{self.region}-{self.environment}",
        "Tier": "Application"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc, self.web_security_group])
    )

    self.database_security_group = aws.ec2.SecurityGroup(
      f"{self.region.replace('-', '')}-secure-projectx-db-sg-{self.environment}",
      name_prefix=f"secure-projectx-db-{self.region}-{self.environment}-",
      description="Security group for database tier - no public access",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          description="PostgreSQL from app tier",
          from_port=5432,
          to_port=5432,
          protocol="tcp",
          security_groups=[self.app_security_group.id]
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          description="Outbound to VPC endpoints",
          from_port=443,
          to_port=443,
          protocol="tcp",
          cidr_blocks=["10.0.0.0/16"]  # Allow to VPC endpoints
        )
      ],
      tags={
        **self.tags,
        "Name": f"secure-projectx-db-sg-{self.region}-{self.environment}",
        "Tier": "Database"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc, self.app_security_group])
    )

    self.vpc_endpoint_security_group = aws.ec2.SecurityGroup(
      f"{self.region.replace('-', '')}-secure-projectx-vpce-sg-{self.environment}",
      name_prefix=f"secure-projectx-vpce-{self.region}-{self.environment}-",
      description="Security group for VPC endpoints",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          description="HTTPS from VPC",
          from_port=443,
          to_port=443,
          protocol="tcp",
          cidr_blocks=["10.0.0.0/16"]
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          description="All outbound",
          from_port=0,
          to_port=0,
          protocol="-1",
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      tags={
        **self.tags,
        "Name": f"secure-projectx-vpce-sg-{self.region}-{self.environment}",
        "Type": "VPC-Endpoint"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

  def _create_network_acls(self):
    """Create Network ACLs for subnet protection"""
    self.public_nacl = aws.ec2.NetworkAcl(
      f"{self.region.replace('-', '')}-secure-projectx-public-nacl-{self.environment}",
      vpc_id=self.vpc.id,
      tags={
        **self.tags,
        "Name": f"secure-projectx-public-nacl-{self.region}-{self.environment}",
        "Type": "Public-NACL"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    aws.ec2.NetworkAclRule(
      f"{self.region.replace('-', '')}-secure-projectx-public-nacl-inbound-http-{self.environment}",
      network_acl_id=self.public_nacl.id,
      rule_number=100,
      protocol="tcp",
      rule_action="allow",
      cidr_block="0.0.0.0/0",
      from_port=80,
      to_port=80,
      egress=False,
      opts=ResourceOptions(parent=self, depends_on=[self.public_nacl])
    )

    aws.ec2.NetworkAclRule(
      f"{self.region.replace('-', '')}-secure-projectx-public-nacl-inbound-https-{self.environment}",
      network_acl_id=self.public_nacl.id,
      rule_number=110,
      protocol="tcp",
      rule_action="allow",
      cidr_block="0.0.0.0/0",
      from_port=443,
      to_port=443,
      egress=False,
      opts=ResourceOptions(parent=self, depends_on=[self.public_nacl])
    )

    aws.ec2.NetworkAclRule(
      f"{self.region.replace('-', '')}-secure-projectx-public-nacl-inbound-ephemeral-{self.environment}",
      network_acl_id=self.public_nacl.id,
      rule_number=120,
      protocol="tcp",
      rule_action="allow",
      cidr_block="0.0.0.0/0",
      from_port=1024,
      to_port=65535,
      egress=False,
      opts=ResourceOptions(parent=self, depends_on=[self.public_nacl])
    )

    aws.ec2.NetworkAclRule(
      f"{self.region.replace('-', '')}-secure-projectx-public-nacl-outbound-{self.environment}",
      network_acl_id=self.public_nacl.id,
      rule_number=100,
      protocol="-1",
      rule_action="allow",
      cidr_block="0.0.0.0/0",
      egress=True,
      opts=ResourceOptions(parent=self, depends_on=[self.public_nacl])
    )

    self.private_nacl = aws.ec2.NetworkAcl(
      f"{self.region.replace('-', '')}-secure-projectx-private-nacl-{self.environment}",
      vpc_id=self.vpc.id,
      tags={
        **self.tags,
        "Name": f"secure-projectx-private-nacl-{self.region}-{self.environment}",
        "Type": "Private-NACL"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc])
    )

    aws.ec2.NetworkAclRule(
      f"{self.region.replace('-', '')}-secure-projectx-private-nacl-inbound-{self.environment}",
      network_acl_id=self.private_nacl.id,
      rule_number=100,
      protocol="-1",
      rule_action="allow",
      cidr_block="10.0.0.0/16",
      egress=False,
      opts=ResourceOptions(parent=self, depends_on=[self.private_nacl])
    )

    aws.ec2.NetworkAclRule(
      f"{self.region.replace('-', '')}-secure-projectx-private-nacl-inbound-ephemeral-{self.environment}",
      network_acl_id=self.private_nacl.id,
      rule_number=110,
      protocol="tcp",
      rule_action="allow",
      cidr_block="0.0.0.0/0",
      from_port=1024,
      to_port=65535,
      egress=False,
      opts=ResourceOptions(parent=self, depends_on=[self.private_nacl])
    )

    aws.ec2.NetworkAclRule(
      f"{self.region.replace('-', '')}-secure-projectx-private-nacl-outbound-{self.environment}",
      network_acl_id=self.private_nacl.id,
      rule_number=100,
      protocol="-1",
      rule_action="allow",
      cidr_block="0.0.0.0/0",
      egress=True,
      opts=ResourceOptions(parent=self, depends_on=[self.private_nacl])
    )

    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.NetworkAclAssociation(
        f"{self.region.replace('-', '')}-secure-projectx-public-nacl-assoc-{i+1}-{self.environment}",
        network_acl_id=self.public_nacl.id,
        subnet_id=subnet.id,
        opts=ResourceOptions(parent=self, depends_on=[self.public_nacl, subnet])
      )

    for i, subnet in enumerate(self.private_subnets):
      aws.ec2.NetworkAclAssociation(
        f"{self.region.replace('-', '')}-secure-projectx-private-nacl-assoc-{i+1}-{self.environment}",
        network_acl_id=self.private_nacl.id,
        subnet_id=subnet.id,
        opts=ResourceOptions(parent=self, depends_on=[self.private_nacl, subnet])
      )

  def _create_vpc_endpoints(self):
    """Create VPC endpoints for secure AWS service access"""
    s3_endpoint_policy = pulumi.Output.all(
      account_id=aws.get_caller_identity().account_id,
      region=self.region
    ).apply(lambda args: {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            f"arn:aws:s3:::secure-projectx-data-{args['region']}-{pulumi.get_stack()}/*",
            f"arn:aws:s3:::secure-projectx-cloudtrail-{args['region']}-{pulumi.get_stack()}/*",
            f"arn:aws:s3:::secure-projectx-config-{args['region']}-{pulumi.get_stack()}/*"
          ],
          "Condition": {
            "StringEquals": {
              "aws:SourceAccount": args["account_id"],
              "aws:SourceVpc": self.vpc.id
            }
          }
        }
      ]
    })

    self.s3_endpoint = aws.ec2.VpcEndpoint(
      f"{self.region.replace('-', '')}-secure-projectx-s3-endpoint-{self.environment}",
      vpc_id=self.vpc.id,
      service_name=f"com.amazonaws.{self.region}.s3",
      vpc_endpoint_type="Gateway",
      route_table_ids=[rt.id for rt in self.private_route_tables],
      policy=pulumi.Output.json_dumps(s3_endpoint_policy),
      tags={
        **self.tags,
        "Name": f"secure-projectx-s3-endpoint-{self.region}-{self.environment}",
        "Type": "VPC-Endpoint"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc, self.private_route_tables])
    )

    self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
      f"{self.region.replace('-', '')}-secure-projectx-dynamodb-endpoint-{self.environment}",
      vpc_id=self.vpc.id,
      service_name=f"com.amazonaws.{self.region}.dynamodb",
      vpc_endpoint_type="Gateway",
      route_table_ids=[rt.id for rt in self.private_route_tables],
      tags={
        **self.tags,
        "Name": f"secure-projectx-dynamodb-endpoint-{self.region}-{self.environment}",
        "Type": "VPC-Endpoint"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.vpc, self.private_route_tables])
    )