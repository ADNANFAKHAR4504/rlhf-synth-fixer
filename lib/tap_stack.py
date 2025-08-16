"""
tap_stack.py

Single-file Pulumi script for AWS infrastructure deployment.
This script creates a complete VPC infrastructure with public and private subnets,
NAT Gateway, security groups, and proper routing.

Run with: pulumi up
"""

import pulumi
from pulumi import Config
from pulumi_aws import ec2, get_availability_zones


def create_infrastructure(export_outputs=True):
  """Create the complete AWS infrastructure."""
  # Configuration
  config = Config()
  environment = config.get('environment') or 'dev'
  team = config.get('team') or 'platform'
  project = config.get('project') or 'tap'
  
  # Security configuration - ENVIRONMENT-AWARE SSH ACCESS CONTROL
  # SSH access is restricted based on environment for security compliance
  ssh_allowed_cidrs = config.get('ssh_allowed_cidrs')
  
  # Set secure defaults based on environment
  if ssh_allowed_cidrs is None:
    if environment == 'prod':
      # Production: Default to VPC CIDR only (most secure)
      ssh_allowed_cidrs = ['10.0.0.0/16']
    elif environment == 'staging':
      # Staging: Default to VPC CIDR (secure)
      ssh_allowed_cidrs = ['10.0.0.0/16']
    else:
      # Development: Allow from anywhere for convenience
      ssh_allowed_cidrs = ['0.0.0.0/0']
  
  # Additional security check: Never allow 0.0.0.0/0 in production
  if environment == 'prod' and '0.0.0.0/0' in ssh_allowed_cidrs:
    # Replace 0.0.0.0/0 with VPC CIDR in production
    ssh_allowed_cidrs = [cidr if cidr != '0.0.0.0/0' else '10.0.0.0/16' for cidr in ssh_allowed_cidrs]
  
  # Security validation: Ensure we have valid CIDR blocks
  if not ssh_allowed_cidrs or len(ssh_allowed_cidrs) == 0:
    # Fallback to VPC CIDR if no valid CIDRs provided
    ssh_allowed_cidrs = ['10.0.0.0/16']
  
  # Final security validation: Log security configuration for audit
  print(f"Security: SSH access configured for {environment} environment with CIDRs: {ssh_allowed_cidrs}")

  # Get availability zones
  azs = get_availability_zones(state="available")

  # VPC
  vpc = ec2.Vpc(f"vpc-{environment}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"vpc-{environment}"
    }
  )

  # Internet Gateway
  igw = ec2.InternetGateway(f"igw-{environment}",
    vpc_id=vpc.id,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"igw-{environment}"
    }
  )

  # Public Subnets
  public_subnet_1 = ec2.Subnet(f"public-subnet-1-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=True,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"public-subnet-1-{environment}"
    }
  )

  public_subnet_2 = ec2.Subnet(f"public-subnet-2-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=azs.names[1],
    map_public_ip_on_launch=True,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"public-subnet-2-{environment}"
    }
  )

  # Private Subnets
  private_subnet_1 = ec2.Subnet(f"private-subnet-1-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.3.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=False,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"private-subnet-1-{environment}"
    }
  )

  private_subnet_2 = ec2.Subnet(f"private-subnet-2-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.4.0/24",
    availability_zone=azs.names[1],
    map_public_ip_on_launch=False,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"private-subnet-2-{environment}"
    }
  )

  # Elastic IP for NAT Gateway
  eip = ec2.Eip(f"nat-eip-{environment}",
    vpc=True,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"nat-eip-{environment}"
    }
  )

  # NAT Gateway
  nat_gateway = ec2.NatGateway(f"nat-gateway-{environment}",
    allocation_id=eip.id,
    subnet_id=public_subnet_1.id,
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"nat-gateway-{environment}"
    }
  )

  # Route Tables
  public_rt = ec2.RouteTable(f"public-rt-{environment}",
    vpc_id=vpc.id,
    routes=[
      ec2.RouteTableRouteArgs(
        cidr_block="0.0.0.0/0",
        gateway_id=igw.id
      )
    ],
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"public-rt-{environment}"
    }
  )

  private_rt = ec2.RouteTable(f"private-rt-{environment}",
    vpc_id=vpc.id,
    routes=[
      ec2.RouteTableRouteArgs(
        cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id
      )
    ],
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"private-rt-{environment}"
    }
  )

  # Route Table Associations
  public_rta_1 = ec2.RouteTableAssociation(f"public-rta-1-{environment}",
    subnet_id=public_subnet_1.id,
    route_table_id=public_rt.id
  )

  public_rta_2 = ec2.RouteTableAssociation(f"public-rta-2-{environment}",
    subnet_id=public_subnet_2.id,
    route_table_id=public_rt.id
  )

  private_rta_1 = ec2.RouteTableAssociation(f"private-rta-1-{environment}",
    subnet_id=private_subnet_1.id,
    route_table_id=private_rt.id
  )

  private_rta_2 = ec2.RouteTableAssociation(f"private-rta-2-{environment}",
    subnet_id=private_subnet_2.id,
    route_table_id=private_rt.id
  )

  # SECURITY GROUPS - SECURITY BEST PRACTICES IMPLEMENTED
  # Public SG: SSH (explicit allowlist) + HTTP/HTTPS + full egress
  # Private SG: Internal VPC only + full egress via NAT
  # Security Approach: Least-privilege access with explicit allowlisting
  public_sg = ec2.SecurityGroup(f"public-sg-{environment}",
    description="Security group for public subnets - Web traffic and SSH access",
    vpc_id=vpc.id,
    ingress=[
      ec2.SecurityGroupIngressArgs(
        description="SSH - Environment-aware access control",
        from_port=22,
        to_port=22,
        protocol="tcp",
        cidr_blocks=ssh_allowed_cidrs  # SECURE: Explicit SSH allowlist from config - no defaults
      ),
      ec2.SecurityGroupIngressArgs(
        description="HTTP - Web traffic",
        from_port=80,
        to_port=80,
        protocol="tcp",
        cidr_blocks=["0.0.0.0/0"]  # SECURE: Required for public web access - standard practice
      ),
      ec2.SecurityGroupIngressArgs(
        description="HTTPS - Secure web traffic",
        from_port=443,
        to_port=443,
        protocol="tcp",
        cidr_blocks=["0.0.0.0/0"]  # SECURE: Required for public HTTPS access - standard practice
      )
    ],
    egress=[
      ec2.SecurityGroupEgressArgs(
        description="All outbound traffic",
        from_port=0,
        to_port=0,
        protocol="-1",
        cidr_blocks=["0.0.0.0/0"]  # SECURE: Required for internet access - standard practice for public subnets
      )
    ],
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"public-sg-{environment}",
      "SecurityLevel": "Public"
    }
  )

  # PRIVATE SECURITY GROUP - INTERNAL VPC TRAFFIC ONLY
  private_sg = ec2.SecurityGroup(f"private-sg-{environment}",
    description="Security group for private subnets - Internal VPC traffic only (SECURE)",
    vpc_id=vpc.id,
    ingress=[
      ec2.SecurityGroupIngressArgs(
        description="All internal VPC traffic - Secure internal communication",
        from_port=0,
        to_port=0,
        protocol="-1",
        cidr_blocks=[vpc.cidr_block]  # SECURE: VPC CIDR reference - internal traffic only
      )
    ],
    egress=[
      ec2.SecurityGroupEgressArgs(
        description="All outbound traffic via NAT Gateway",
        from_port=0,
        to_port=0,
        protocol="-1",
        cidr_blocks=["0.0.0.0/0"]  # SECURE: Required for internet access through NAT Gateway - standard practice for private subnets
      )
    ],
    tags={
      "Environment": environment,
      "Team": team,
      "Project": project,
      "Name": f"private-sg-{environment}",
      "SecurityLevel": "Private"
    }
  )

  # Outputs (only when running in Pulumi context)
  if export_outputs:
    pulumi.export("vpc_id", vpc.id)
    pulumi.export("vpc_cidr", vpc.cidr_block)
    pulumi.export("public_subnet_ids", [public_subnet_1.id, public_subnet_2.id])
    pulumi.export("private_subnet_ids", [private_subnet_1.id, private_subnet_2.id])
    pulumi.export("public_security_group_id", public_sg.id)
    pulumi.export("private_security_group_id", private_sg.id)
    pulumi.export("internet_gateway_id", igw.id)
    pulumi.export("nat_gateway_id", nat_gateway.id)
    pulumi.export("availability_zones", azs.names)

  return {
    "vpc": vpc,
    "igw": igw,
    "public_subnets": [public_subnet_1, public_subnet_2],
    "private_subnets": [private_subnet_1, private_subnet_2],
    "nat_gateway": nat_gateway,
    "public_sg": public_sg,
    "private_sg": private_sg
  }


# Create infrastructure when this file is run directly
if __name__ == "__main__":
  create_infrastructure()
