# Ideal Response - CDKTF Python Infrastructure

## Overview
This implementation provides a production-ready AWS infrastructure using CDKTF (Cloud Development Kit for Terraform) with Python.

## Implementation Files

### lib/tap_stack.py

```python
"""
AWS Production Infrastructure Stack - CDKTF Python Implementation

This module defines the AWS production infrastructure stack with comprehensive
security measures, high availability design, and production-grade components
including VPC, subnets, Bastion host, and secure S3 storage.
"""

from typing import Any, Dict

from cdktf import Fn, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi
from cdktf_cdktf_provider_aws.data_aws_availability_zones import \
    DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import \
    S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class TapStack(TerraformStack):
  """
  AWS Production Infrastructure Stack - TapStack

  This stack creates a complete production-grade AWS infrastructure including:
  - VPC with DNS support and security
  - Public and private subnets across multiple AZs
  - Internet Gateway and NAT Gateways for connectivity
  - Bastion host for secure access to private resources
  - Security groups with strict access controls
  - S3 buckets with Block Public Access enabled
  - Comprehensive tagging and monitoring

  All resources are tagged with Environment: Production
  """

  def __init__(self, scope: Construct, construct_id: str, description: str = None):
    """
    Initialize the TapStack.

    Args:
      scope: The scope in which to define this construct
      construct_id: The scoped construct ID
      description: Optional description for the stack
    """
    super().__init__(scope, construct_id)

    # Configuration constants
    self.vpc_cidr = "10.0.0.0/16"
    self.allowed_ssh_cidr = "203.0.113.0/24"
    self.aws_region = "us-west-2"
    self.environment = "Production"

    # Infrastructure resource containers (reduces instance attributes)
    self.networking: Dict[str, Any] = {}
    self.security: Dict[str, Any] = {}
    self.storage: Dict[str, Any] = {}
    self.config: Dict[str, Any] = {}

    # Set stack description if provided
    if description:
      self.description = description

    # Initialize infrastructure components
    self._setup_providers()
    self._create_networking_infrastructure()
    self._create_security_groups()
    self._create_bastion_host()
    self._create_storage_infrastructure()
    self._create_outputs()

  def _setup_providers(self) -> None:
    """Configure AWS and Random providers with production settings."""
    # Configure AWS Provider
    AwsProvider(
      self, "aws",
      region=self.aws_region,
      default_tags=[{
        "tags": {
          "Project": "AWS Nova Model Breaking",
          "ManagedBy": "CDKTF",
          "Environment": self.environment,
          "Owner": "Infrastructure Team",
          "CostCenter": "Production-Infrastructure"
        }
      }]
    )

  def _create_networking_infrastructure(self) -> None:
    """Create VPC, subnets, gateways, and routing components."""
    # Get availability zones for high availability deployment
    self.config['azs'] = DataAwsAvailabilityZones(
      self, "available_azs",
      state="available"
    )

    # Use a static infrastructure identifier instead of random
    self.config['infrastructure_id'] = "prod-infra"

    # Common tags for all networking resources
    self.config['common_tags'] = {
      "Environment": self.environment,
      "Project": "AWS Nova Model Breaking",
      "Component": "Networking"
    }

    # Create infrastructure components in order
    self._create_vpc()
    self._create_internet_gateway()
    self._create_subnets()
    self._create_nat_gateways()
    self._create_routing()

  def _create_vpc(self) -> None:
    """Create the main VPC with production-grade settings."""
    self.networking['vpc'] = Vpc(
      self, "production_vpc",
      cidr_block=self.vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        **self.config['common_tags'],
        "Name": f"nova-production-vpc-{self.config['infrastructure_id']}",
        "Description": "Main VPC for production infrastructure"
      }
    )

  def _create_internet_gateway(self) -> None:
    """Create Internet Gateway for public subnet access."""
    self.networking['internet_gateway'] = InternetGateway(
      self, "production_internet_gateway",
      vpc_id=self.networking['vpc'].id,
      tags={
        **self.config['common_tags'],
        "Name": f"nova-production-igw-{self.config['infrastructure_id']}",
        "Description": "Internet Gateway for public subnet access"
      }
    )

  def _create_subnets(self) -> None:
    """Create public and private subnets across multiple availability zones."""
    # Create 2 subnets across 2 AZs using Fn.element for safe access
    
    # Public Subnets (2 subnets across 2 AZs)
    self.networking['public_subnets'] = []
    for i in range(2):
      subnet = Subnet(
        self, f"production_public_subnet_{i+1}",
        vpc_id=self.networking['vpc'].id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=Fn.element(self.config['azs'].names, i),
        map_public_ip_on_launch=True,
        tags={
          **self.config['common_tags'],
          "Name": f"nova-production-public-subnet-{i+1}-{self.config['infrastructure_id']}",
          "Type": "Public",
          "AZ": Fn.element(self.config['azs'].names, i),
          "Description": f"Public subnet {i+1} in AZ {i+1}"
        }
      )
      self.networking['public_subnets'].append(subnet)

    # Private Subnets (2 subnets across 2 AZs)
    self.networking['private_subnets'] = []
    for i in range(2):
      subnet = Subnet(
        self, f"production_private_subnet_{i+1}",
        vpc_id=self.networking['vpc'].id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=Fn.element(self.config['azs'].names, i),
        tags={
          **self.config['common_tags'],
          "Name": f"nova-production-private-subnet-{i+1}-{self.config['infrastructure_id']}",
          "Type": "Private",
          "AZ": Fn.element(self.config['azs'].names, i),
          "Description": f"Private subnet {i+1} in AZ {i+1}"
        }
      )
      self.networking['private_subnets'].append(subnet)

  def _create_nat_gateways(self) -> None:
    """Create NAT Gateways with Elastic IPs for private subnet internet access."""
    # Create Elastic IPs for NAT Gateways (2 for 2 AZs)
    self.networking['nat_eips'] = []
    for i in range(2):
      eip = Eip(
        self, f"production_nat_eip_{i+1}",
        domain="vpc",
        depends_on=[self.networking['internet_gateway']],
        tags={
          **self.config['common_tags'],
          "Name": f"nova-production-nat-eip-{i+1}-{self.config['infrastructure_id']}",
          "Description": f"Elastic IP for NAT Gateway {i+1}"
        }
      )
      self.networking['nat_eips'].append(eip)

    # Create NAT Gateways in public subnets (2 for 2 AZs)
    self.networking['nat_gateways'] = []
    for i in range(2):
      nat_gw = NatGateway(
        self, f"production_nat_gateway_{i+1}",
        allocation_id=self.networking['nat_eips'][i].id,
        subnet_id=self.networking['public_subnets'][i].id,
        depends_on=[self.networking['internet_gateway']],
        tags={
          **self.config['common_tags'],
          "Name": f"nova-production-nat-gw-{i+1}-{self.config['infrastructure_id']}",
          "AZ": Fn.element(self.config['azs'].names, i),
          "Description": f"NAT Gateway {i+1} in AZ {i+1}"
        }
      )
      self.networking['nat_gateways'].append(nat_gw)

  def _create_routing(self) -> None:
    """Create route tables and associations for public and private subnets."""
    # Public Route Table
    self.networking['public_route_table'] = RouteTable(
      self, "production_public_route_table",
      vpc_id=self.networking['vpc'].id,
      tags={
        **self.config['common_tags'],
        "Name": f"nova-production-public-rt-{self.config['infrastructure_id']}",
        "Type": "Public",
        "Description": "Route table for public subnets"
      }
    )

    # Route to Internet Gateway for public subnets
    Route(
      self, "production_public_internet_route",
      route_table_id=self.networking['public_route_table'].id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.networking['internet_gateway'].id
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.networking['public_subnets']):
      RouteTableAssociation(
        self, f"production_public_subnet_{i+1}_association",
        subnet_id=subnet.id,
        route_table_id=self.networking['public_route_table'].id
      )

    # Private Route Tables (one per AZ for high availability)
    self.networking['private_route_tables'] = []
    for i in range(2):
      route_table = RouteTable(
        self, f"production_private_route_table_{i+1}",
        vpc_id=self.networking['vpc'].id,
        tags={
          **self.config['common_tags'],
          "Name": f"nova-production-private-rt-{i+1}-{self.config['infrastructure_id']}",
          "Type": "Private",
          "AZ": Fn.element(self.config['azs'].names, i),
          "Description": f"Route table for private subnet {i+1}"
        }
      )
      self.networking['private_route_tables'].append(route_table)

      # Route to NAT Gateway for private subnets
      Route(
        self, f"production_private_nat_route_{i+1}",
        route_table_id=route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=self.networking['nat_gateways'][i].id
      )

      # Associate private subnet with its route table
      RouteTableAssociation(
        self, f"production_private_subnet_{i+1}_association",
        subnet_id=self.networking['private_subnets'][i].id,
        route_table_id=route_table.id
      )

  def _create_security_groups(self) -> None:
    """Create security groups with strict access controls."""
    # Security Group for Bastion Host
    self.security['bastion_sg'] = SecurityGroup(
      self, "production_bastion_security_group",
      name=f"nova-production-bastion-sg-{self.config['infrastructure_id']}",
      description="Security group for Bastion host with restricted SSH access",
      vpc_id=self.networking['vpc'].id,
      tags={
        "Environment": self.environment,
        "Project": "AWS Nova Model Breaking",
        "Component": "Security",
        "Purpose": "Bastion Host Access",
        "Name": f"nova-production-bastion-sg-{self.config['infrastructure_id']}",
        "Description": "Security group for Bastion host"
      }
    )

    self._create_bastion_security_rules()

    # Security Group for Private Instances
    self.security['private_sg'] = SecurityGroup(
      self, "production_private_security_group",
      name=f"nova-production-private-sg-{self.config['infrastructure_id']}",
      description="Security group for private subnet instances",
      vpc_id=self.networking['vpc'].id,
      tags={
        "Environment": self.environment,
        "Project": "AWS Nova Model Breaking",
        "Component": "Security",
        "Purpose": "Private Instance Access",
        "Name": f"nova-production-private-sg-{self.config['infrastructure_id']}",
        "Description": "Security group for private instances"
      }
    )

    self._create_private_security_rules()

  def _create_bastion_security_rules(self) -> None:
    """Create security group rules for the Bastion host."""
    # Bastion inbound SSH rule
    SecurityGroupRule(
      self, "bastion_ssh_inbound",
      type="ingress",
      from_port=22,
      to_port=22,
      protocol="tcp",
      cidr_blocks=[self.allowed_ssh_cidr],
      security_group_id=self.security['bastion_sg'].id,
      description="SSH access from authorized networks"
    )

    # Bastion outbound SSH to private subnets
    for i, subnet in enumerate(self.networking['private_subnets']):
      SecurityGroupRule(
        self, f"bastion_ssh_outbound_private_{i+1}",
        type="egress",
        from_port=22,
        to_port=22,
        protocol="tcp",
        cidr_blocks=[subnet.cidr_block],
        security_group_id=self.security['bastion_sg'].id,
        description=f"SSH access to private subnet {i+1}"
      )

    # Bastion outbound HTTPS for updates
    SecurityGroupRule(
      self, "bastion_https_outbound",
      type="egress",
      from_port=443,
      to_port=443,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
      security_group_id=self.security['bastion_sg'].id,
      description="HTTPS outbound for package updates"
    )

    # Bastion outbound HTTP for updates
    SecurityGroupRule(
      self, "bastion_http_outbound",
      type="egress",
      from_port=80,
      to_port=80,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
      security_group_id=self.security['bastion_sg'].id,
      description="HTTP outbound for package updates"
    )

  def _create_private_security_rules(self) -> None:
    """Create security group rules for private instances."""
    # Private instances SSH from Bastion
    SecurityGroupRule(
      self, "private_ssh_from_bastion",
      type="ingress",
      from_port=22,
      to_port=22,
      protocol="tcp",
      source_security_group_id=self.security['bastion_sg'].id,
      security_group_id=self.security['private_sg'].id,
      description="SSH access from Bastion host"
    )

    # Private instances HTTP within VPC
    SecurityGroupRule(
      self, "private_http_internal",
      type="ingress",
      from_port=80,
      to_port=80,
      protocol="tcp",
      cidr_blocks=[self.vpc_cidr],
      security_group_id=self.security['private_sg'].id,
      description="HTTP access within VPC"
    )

    # Private instances HTTPS within VPC
    SecurityGroupRule(
      self, "private_https_internal",
      type="ingress",
      from_port=443,
      to_port=443,
      protocol="tcp",
      cidr_blocks=[self.vpc_cidr],
      security_group_id=self.security['private_sg'].id,
      description="HTTPS access within VPC"
    )

    # Private instances outbound internet access
    SecurityGroupRule(
      self, "private_internet_outbound",
      type="egress",
      from_port=0,
      to_port=65535,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
      security_group_id=self.security['private_sg'].id,
      description="Outbound internet access via NAT Gateway"
    )

  def _create_bastion_host(self) -> None:
    """Create Bastion host for secure access to private resources."""
    # Get the latest Amazon Linux 2 AMI
    self.security['amazon_linux_ami'] = DataAwsAmi(
      self, "amazon_linux_ami",
      most_recent=True,
      owners=["amazon"],
      filter=[
        {
          "name": "name",
          "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
          "name": "virtualization-type",
          "values": ["hvm"]
        }
      ]
    )

    # Create Bastion Host Instance (No SSH key - using Session Manager)
    self.security['bastion_host'] = Instance(
      self, "production_bastion_host",
      ami=self.security['amazon_linux_ami'].id,
      instance_type="t3.micro",
      # No key_name parameter - Session Manager access only
      subnet_id=self.networking['public_subnets'][0].id,
      vpc_security_group_ids=[self.security['bastion_sg'].id],
      associate_public_ip_address=True,
      user_data="""#!/bin/bash
yum update -y
yum install -y htop amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
echo 'Bastion host setup complete' > /var/log/bastion-setup.log
""",
      tags={
        "Environment": self.environment,
        "Project": "AWS Nova Model Breaking",
        "Component": "Security",
        "Purpose": "Bastion Host",
        "Name": f"nova-production-bastion-{self.config['infrastructure_id']}",
        "Description": "Bastion host for secure access via Session Manager"
      }
    )

  def _create_storage_infrastructure(self) -> None:
    """Create S3 buckets with Block Public Access enabled."""
    # Application Logs Bucket
    self.storage['logs_bucket'] = S3Bucket(
      self, "production_application_logs_bucket",
      tags={
        "Environment": self.environment,
        "Project": "AWS Nova Model Breaking",
        "Component": "Storage",
        "Purpose": "Application Logs",
        "Name": f"nova-production-app-logs-{self.config['infrastructure_id']}",
        "DataClassification": "Internal"
      }
    )

    self._configure_s3_bucket_security(self.storage['logs_bucket'], "logs")

    # Backup Bucket
    self.storage['backup_bucket'] = S3Bucket(
      self, "production_backup_bucket",
      tags={
        "Environment": self.environment,
        "Project": "AWS Nova Model Breaking",
        "Component": "Storage",
        "Purpose": "Backup Storage",
        "Name": f"nova-production-backup-{self.config['infrastructure_id']}",
        "DataClassification": "Confidential"
      }
    )

    self._configure_s3_bucket_security(self.storage['backup_bucket'], "backup")

  def _configure_s3_bucket_security(self, bucket: S3Bucket, bucket_type: str) -> None:
    """Configure S3 bucket security settings including versioning and public access block."""
    # Enable versioning on bucket
    S3BucketVersioningA(
      self, f"production_{bucket_type}_bucket_versioning",
      bucket=bucket.id,
      versioning_configuration={
        "status": "Enabled"
      }
    )

    # Block public access on bucket
    S3BucketPublicAccessBlock(
      self, f"production_{bucket_type}_bucket_public_access_block",
      bucket=bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True
    )

  def _create_outputs(self) -> None:
    """Create Terraform outputs for important resource references."""
    # VPC Information
    TerraformOutput(
      self, "vpc_id",
      value=self.networking['vpc'].id,
      description="ID of the production VPC"
    )

    TerraformOutput(
      self, "vpc_cidr_block",
      value=self.networking['vpc'].cidr_block,
      description="CIDR block of the production VPC"
    )

    # Subnet Information
    TerraformOutput(
      self, "public_subnet_ids",
      value=[subnet.id for subnet in self.networking['public_subnets']],
      description="IDs of the public subnets"
    )

    TerraformOutput(
      self, "private_subnet_ids",
      value=[subnet.id for subnet in self.networking['private_subnets']],
      description="IDs of the private subnets"
    )

    # Gateway Information
    TerraformOutput(
      self, "internet_gateway_id",
      value=self.networking['internet_gateway'].id,
      description="ID of the Internet Gateway"
    )

    TerraformOutput(
      self, "nat_gateway_ids",
      value=[nat_gw.id for nat_gw in self.networking['nat_gateways']],
      description="IDs of the NAT Gateways"
    )

    # Security Group Information
    TerraformOutput(
      self, "bastion_security_group_id",
      value=self.security['bastion_sg'].id,
      description="ID of the Bastion host security group"
    )

    TerraformOutput(
      self, "private_security_group_id",
      value=self.security['private_sg'].id,
      description="ID of the private instances security group"
    )

    # Bastion Host Information
    TerraformOutput(
      self, "bastion_host_id",
      value=self.security['bastion_host'].id,
      description="ID of the Bastion host instance"
    )

    TerraformOutput(
      self, "bastion_host_public_ip",
      value=self.security['bastion_host'].public_ip,
      description="Public IP address of the Bastion host"
    )

    # Storage Information
    TerraformOutput(
      self, "logs_bucket_name",
      value=self.storage['logs_bucket'].bucket,
      description="Name of the application logs S3 bucket"
    )

    TerraformOutput(
      self, "backup_bucket_name",
      value=self.storage['backup_bucket'].bucket,
      description="Name of the backup S3 bucket"
    )

    # Availability Zones
    TerraformOutput(
      self, "availability_zones",
      value=[Fn.element(self.config['azs'].names, 0), Fn.element(self.config['azs'].names, 1)],
      description="Availability zones used for deployment"
    )
```

### tap.py

```python
#!/usr/bin/env python3

"""
AWS Production Infrastructure - CDKTF Application Entry Point

This file serves as the entry point for the CDKTF application,
orchestrating the deployment of production-grade AWS infrastructure
components with comprehensive security and high availability.
"""

from cdktf import App

from lib.tap_stack import TapStack


def main():
  """
  Main function to initialize and synthesize the CDKTF application.
  
  Creates the CDKTF app and instantiates the AWS production infrastructure stack
  with all required components including VPC, subnets, security groups,
  Bastion host, and S3 storage with comprehensive security measures.
  """
  # Initialize the CDKTF application
  app = App()
  
  # Create the AWS production infrastructure stack
  TapStack(
    app, 
    "aws-production-infrastructure",
    description="Production-grade AWS infrastructure with Bastion host and security controls"
  )
  
  # Synthesize the Terraform configuration
  app.synth()


if __name__ == "__main__":
  main()
```

