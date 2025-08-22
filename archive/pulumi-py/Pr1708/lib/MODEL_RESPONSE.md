"""
tap_stack.py

Enhanced AWS Multi-Region VPC Infrastructure with Pulumi
This script creates a complete VPC infrastructure with public and private subnets,
NAT Gateway, security groups, and proper routing across multiple regions.

Run with: pulumi up
"""

from typing import Dict, List, Any
import ipaddress

import pulumi
from pulumi import Config
from pulumi_aws import ec2, get_availability_zones
import pulumi_aws as aws

def create_infrastructure(export_outputs=True):
"""Create the complete AWS infrastructure."""

# Configuration

config = Config()
environment = config.get("environment") or "dev"
team = config.get("team") or "platform"
project = config.get("project") or "tap"

# Multi-region support

regions = config.get_object("regions") or ["us-east-1"]

# High availability NAT Gateway option (default: false for cost optimization)

enable_ha_nat = config.get_bool("enable_ha_nat") or False

# CIDR blocks for each region (non-overlapping)

region_cidrs = {
"us-east-1": "10.0.0.0/16",
"us-west-2": "10.1.0.0/16",
"us-east-2": "10.2.0.0/16",
"us-west-1": "10.3.0.0/16",
"eu-west-1": "10.4.0.0/16",
"eu-central-1": "10.5.0.0/16",
"ap-southeast-1": "10.6.0.0/16",
"ap-northeast-1": "10.7.0.0/16",
}

# Security configuration - ENVIRONMENT-AWARE SSH ACCESS CONTROL

# SSH access is restricted based on environment for security compliance

ssh_allowed_cidrs = config.get("ssh_allowed_cidrs")

# Set secure defaults based on environment using dictionary lookup

if ssh_allowed_cidrs is None:
default_cidrs = {
"prod": ["10.0.0.0/16"], # Production: VPC CIDR only
"staging": ["10.0.0.0/16"], # Staging: VPC CIDR only
}
ssh_allowed_cidrs = default_cidrs.get(environment, ["0.0.0.0/0"])

# Additional security check: Never allow 0.0.0.0/0 in production

if environment == "prod" and "0.0.0.0/0" in ssh_allowed_cidrs: # Replace 0.0.0.0/0 with VPC CIDR in production
ssh_allowed_cidrs = [
cidr if cidr != "0.0.0.0/0" else "10.0.0.0/16" for cidr in ssh_allowed_cidrs
]

# Security validation: Ensure we have valid CIDR blocks

if not ssh_allowed_cidrs or len(ssh_allowed_cidrs) == 0: # Fallback to VPC CIDR if no valid CIDRs provided
ssh_allowed_cidrs = ["10.0.0.0/16"]

# Final security validation: Log security configuration for audit

print(
f"Security: SSH access configured for {environment} "
f"environment with CIDRs: {ssh_allowed_cidrs}"
)

def calculate_subnet_cidrs(vpc_cidr: str, num_subnets: int) -> List[str]:
"""Calculate subnet CIDR blocks from VPC CIDR"""
vpc_network = ipaddress.IPv4Network(vpc_cidr) # Use /24 subnets (256 IPs each)
subnet_size = 24
subnets = list(vpc_network.subnets(new_prefix=subnet_size))

    return [str(subnet) for subnet in subnets[:num_subnets]]

def create_nat_gateways(
region: str, num_azs: int, public_subnets: List, provider: aws.Provider
) -> List:
"""Create NAT Gateways based on HA configuration"""
nat_eips = []
nat_gateways = []

    if enable_ha_nat:
      # One NAT Gateway per AZ for high availability
      for i in range(num_azs):
        eip = ec2.Eip(
          f"nat-eip-{region}-{i + 1}-{environment}",
          vpc=True,
          tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"nat-eip-{region}-{i + 1}-{environment}",
            "Region": region,
            "Purpose": "NAT Gateway",
          },
          opts=pulumi.ResourceOptions(provider=provider),
        )
        nat_eips.append(eip)

        nat_gw = ec2.NatGateway(
          f"nat-gw-{region}-{i + 1}-{environment}",
          allocation_id=eip.id,
          subnet_id=public_subnets[i].id,
          tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"nat-gw-{region}-{i + 1}-{environment}",
            "Region": region,
            "Purpose": "NAT Gateway",
            "HighAvailability": "true",
          },
          opts=pulumi.ResourceOptions(provider=provider),
        )
        nat_gateways.append(nat_gw)
    else:
      # Single NAT Gateway for cost optimization
      eip = ec2.Eip(
        f"nat-eip-{region}-{environment}",
        vpc=True,
        tags={
          "Environment": environment,
          "Team": team,
          "Project": project,
          "Name": f"nat-eip-{region}-{environment}",
          "Region": region,
          "Purpose": "NAT Gateway",
        },
        opts=pulumi.ResourceOptions(provider=provider),
      )
      nat_eips.append(eip)

      nat_gw = ec2.NatGateway(
        f"nat-gw-{region}-{environment}",
        allocation_id=eip.id,
        subnet_id=public_subnets[0].id,  # Use first public subnet
        tags={
          "Environment": environment,
          "Team": team,
          "Project": project,
          "Name": f"nat-gw-{region}-{environment}",
          "Region": region,
          "Purpose": "NAT Gateway",
          "HighAvailability": "false",
        },
        opts=pulumi.ResourceOptions(provider=provider),
      )
      nat_gateways.append(nat_gw)

    return nat_gateways

def create_vpc_infrastructure(region: str) -> Dict[str, Any]:
"""Create complete VPC infrastructure for a region"""

    # Create AWS provider for this region
    provider = aws.Provider(
      f"aws-{region}",
      region=region,
      default_tags=aws.ProviderDefaultTagsArgs(
        tags={
          "Environment": environment,
          "Team": team,
          "Project": project,
          "Region": region,
        }
      ),
    )

    # Get VPC CIDR for this region
    vpc_cidr = region_cidrs.get(region, f"10.{hash(region) % 200 + 10}.0.0/16")

    # Create VPC
    vpc = ec2.Vpc(
      f"vpc-{region}-{environment}",
      cidr_block=vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"vpc-{region}-{environment}",
        "Region": region,
        "Purpose": "Main VPC",
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )

    # Get availability zones
    azs = get_availability_zones(
      state="available", opts=pulumi.InvokeOptions(provider=provider)
    )
    az_names = azs.names[:4]  # Limit to first 4 AZs

    # Use exactly 2 AZs for cost optimization
    num_azs = max(2, min(len(az_names), 2))
    total_subnets = num_azs * 4  # 2 public + 2 private per AZ
    subnet_cidrs = calculate_subnet_cidrs(vpc_cidr, total_subnets)

    # Create Internet Gateway
    igw = ec2.InternetGateway(
      f"igw-{region}-{environment}",
      vpc_id=vpc.id,
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"igw-{region}-{environment}",
        "Region": region,
        "Purpose": "Internet Gateway",
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )

    # Create public and private subnets
    public_subnets = []
    private_subnets = []

    # Create 2 public and 2 private subnets per AZ
    for i in range(num_azs):
      az = az_names[i]

      # Public subnets (2 per AZ)
      for j in range(2):
        subnet_idx = i * 4 + j
        public_subnet = ec2.Subnet(
          f"public-subnet-{region}-{i + 1}-{j + 1}-{environment}",
          vpc_id=vpc.id,
          cidr_block=subnet_cidrs[subnet_idx],
          availability_zone=az,
          map_public_ip_on_launch=True,
          tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"public-subnet-{region}-{i + 1}-{j + 1}-{environment}",
            "Type": "public",
            "Region": region,
            "AZ": az,
            "Purpose": "Public Subnet",
          },
          opts=pulumi.ResourceOptions(provider=provider),
        )
        public_subnets.append(public_subnet)

      # Private subnets (2 per AZ)
      for j in range(2):
        subnet_idx = i * 4 + j + 2
        private_subnet = ec2.Subnet(
          f"private-subnet-{region}-{i + 1}-{j + 1}-{environment}",
          vpc_id=vpc.id,
          cidr_block=subnet_cidrs[subnet_idx],
          availability_zone=az,
          map_public_ip_on_launch=False,  # Ensure no public IPs
          tags={
            "Environment": environment,
            "Team": team,
            "Project": project,
            "Name": f"private-subnet-{region}-{i + 1}-{j + 1}-{environment}",
            "Type": "private",
            "Region": region,
            "AZ": az,
            "Purpose": "Private Subnet",
          },
          opts=pulumi.ResourceOptions(provider=provider),
        )
        private_subnets.append(private_subnet)

    # Create NAT Gateways
    nat_gateways = create_nat_gateways(region, num_azs, public_subnets, provider)

    # Create route tables
    # Public route table
    public_rt = ec2.RouteTable(
      f"public-rt-{region}-{environment}",
      vpc_id=vpc.id,
      routes=[
        ec2.RouteTableRouteArgs(
          cidr_block="0.0.0.0/0",
          gateway_id=igw.id,
        )
      ],
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"public-rt-{region}-{environment}",
        "Region": region,
        "Purpose": "Public Route Table",
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )

    # Private route table
    private_rt = ec2.RouteTable(
      f"private-rt-{region}-{environment}",
      vpc_id=vpc.id,
      routes=[
        ec2.RouteTableRouteArgs(
          cidr_block="0.0.0.0/0",
          nat_gateway_id=nat_gateways[0].id,  # Use first NAT Gateway
        )
      ],
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"private-rt-{region}-{environment}",
        "Region": region,
        "Purpose": "Private Route Table",
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )

    # Associate subnets with route tables
    # Associates public subnets in this AZ
    for i, subnet in enumerate(public_subnets):
      ec2.RouteTableAssociation(
        f"public-rta-{region}-{i + 1}-{environment}",
        subnet_id=subnet.id,
        route_table_id=public_rt.id,
        opts=pulumi.ResourceOptions(provider=provider),
      )

    # Associates private subnets in this AZ
    for i, subnet in enumerate(private_subnets):
      ec2.RouteTableAssociation(
        f"private-rta-{region}-{i + 1}-{environment}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id,
        opts=pulumi.ResourceOptions(provider=provider),
      )

    # Create security groups
    # Web tier security group
    web_sg = ec2.SecurityGroup(
      f"web-sg-{region}-{environment}",
      description="Security group for web tier",
      vpc_id=vpc.id,
      ingress=[
        ec2.SecurityGroupIngressArgs(
          description="HTTP from anywhere",
          from_port=80,
          to_port=80,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"],
        ),
        ec2.SecurityGroupIngressArgs(
          description="HTTPS from anywhere",
          from_port=443,
          to_port=443,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"],
        ),
        ec2.SecurityGroupIngressArgs(
          description="SSH from allowed CIDRs",
          from_port=22,
          to_port=22,
          protocol="tcp",
          cidr_blocks=ssh_allowed_cidrs,
        ),
      ],
      egress=[
        ec2.SecurityGroupEgressArgs(
          description="All traffic to anywhere",
          from_port=0,
          to_port=0,
          protocol="-1",
          cidr_blocks=["0.0.0.0/0"],
        ),
      ],
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"web-sg-{region}-{environment}",
        "Tier": "web",
        "Region": region,
        "SecurityLevel": "Public",
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )

    # App tier security group
    app_sg = ec2.SecurityGroup(
      f"app-sg-{region}-{environment}",
      description="Security group for application tier",
      vpc_id=vpc.id,
      ingress=[
        ec2.SecurityGroupIngressArgs(
          description="HTTP from web tier",
          from_port=80,
          to_port=80,
          protocol="tcp",
          security_groups=[web_sg.id],
        ),
        ec2.SecurityGroupIngressArgs(
          description="HTTPS from web tier",
          from_port=443,
          to_port=443,
          protocol="tcp",
          security_groups=[web_sg.id],
        ),
        ec2.SecurityGroupIngressArgs(
          description="SSH from allowed CIDRs",
          from_port=22,
          to_port=22,
          protocol="tcp",
          cidr_blocks=ssh_allowed_cidrs,
        ),
      ],
      egress=[
        ec2.SecurityGroupEgressArgs(
          description="All traffic to anywhere",
          from_port=0,
          to_port=0,
          protocol="-1",
          cidr_blocks=["0.0.0.0/0"],
        ),
      ],
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"app-sg-{region}-{environment}",
        "Tier": "application",
        "Region": region,
        "SecurityLevel": "Internal",
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )

    # Database tier security group
    db_sg = ec2.SecurityGroup(
      f"db-sg-{region}-{environment}",
      description="Security group for database tier",
      vpc_id=vpc.id,
      ingress=[
        ec2.SecurityGroupIngressArgs(
          description="MySQL from app tier",
          from_port=3306,
          to_port=3306,
          protocol="tcp",
          security_groups=[app_sg.id],
        ),
        ec2.SecurityGroupIngressArgs(
          description="PostgreSQL from app tier",
          from_port=5432,
          to_port=5432,
          protocol="tcp",
          security_groups=[app_sg.id],
        ),
        ec2.SecurityGroupIngressArgs(
          description="SSH from allowed CIDRs",
          from_port=22,
          to_port=22,
          protocol="tcp",
          cidr_blocks=ssh_allowed_cidrs,
        ),
      ],
      egress=[
        # Very minimal egress - only for updates via HTTPS
        ec2.SecurityGroupEgressArgs(
          description="HTTPS for updates only",
          from_port=443,
          to_port=443,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"],
        ),
        # DNS
        ec2.SecurityGroupEgressArgs(
          description="DNS TCP",
          from_port=53,
          to_port=53,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"],
        ),
        ec2.SecurityGroupEgressArgs(
          description="DNS UDP",
          from_port=53,
          to_port=53,
          protocol="udp",
          cidr_blocks=["0.0.0.0/0"],
        ),
      ],
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"db-sg-{region}-{environment}",
        "Tier": "database",
        "Region": region,
        "SecurityLevel": "Restricted",
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )

    return {
      "vpc": vpc,
      "igw": igw,
      "public_subnets": public_subnets,
      "private_subnets": private_subnets,
      "nat_gateways": nat_gateways,
      "security_groups": {"web": web_sg, "app": app_sg, "db": db_sg},
      "region": region,
    }

# Create infrastructure for all regions

regional_infrastructure = {}
for region in regions:
regional_infrastructure[region] = create_vpc_infrastructure(region)

# Outputs (only when running in Pulumi context)

if export*outputs: # Export VPC information for all regions
for region, infra in regional_infrastructure.items():
region_key = region.replace("-", "*")
pulumi.export(f"vpc*{region_key}\_id", infra["vpc"].id)
pulumi.export(f"vpc*{region_key}\_cidr", infra["vpc"].cidr_block)

      # Export subnet IDs
      pulumi.export(
        f"public_subnets_{region_key}", [subnet.id for subnet in infra["public_subnets"]]
      )
      pulumi.export(
        f"private_subnets_{region_key}", [subnet.id for subnet in infra["private_subnets"]]
      )

      # Export security group IDs
      pulumi.export(f"web_sg_{region_key}_id", infra["security_groups"]["web"].id)
      pulumi.export(f"app_sg_{region_key}_id", infra["security_groups"]["app"].id)
      pulumi.export(f"db_sg_{region_key}_id", infra["security_groups"]["db"].id)

      # Export NAT Gateway IDs
      pulumi.export(
        f"nat_gateways_{region_key}", [nat_gw.id for nat_gw in infra["nat_gateways"]]
      )

    # Export configuration for verification
    pulumi.export("regions", regions)
    pulumi.export("environment", environment)
    pulumi.export("enable_ha_nat", enable_ha_nat)

    # Export summary information for easy verification
    pulumi.export(
      "infrastructure_summary",
      {
        "total_regions": len(regions),
        "total_vpcs": len(regional_infrastructure),
        "total_public_subnets": sum(
          len(infra["public_subnets"]) for infra in regional_infrastructure.values()
        ),
        "total_private_subnets": sum(
          len(infra["private_subnets"]) for infra in regional_infrastructure.values()
        ),
        "total_security_groups": sum(
          len(infra["security_groups"]) for infra in regional_infrastructure.values()
        ),
        "ha_nat_enabled": enable_ha_nat,
      },
    )

return regional_infrastructure

# Create infrastructure when this file is run directly

if **name** == "**main**":
create_infrastructure()

```

```
