"""
Multi-Region AWS Infrastructure Deployment with Pulumi
Deploys identical infrastructure across us-west-1 and us-east-1 regions
with cross-region replication and disaster recovery capabilities.
"""

import json
from typing import Dict, List, Optional, Any

import pulumi
import pulumi_aws as aws


# Configuration constants
REGIONS = ["us-west-1", "us-east-1"]
VPC_CIDR = "10.0.0.0/16"
PUBLIC_SUBNET_CIDRS = ["10.0.1.0/24", "10.0.2.0/24"]
PRIVATE_SUBNET_CIDRS = ["10.0.10.0/24", "10.0.20.0/24"]
PROJECT_NAME = "tap-multi-region"


def get_availability_zones(region: str) -> List[str]:
  """Get availability zones for a specific region."""
  az_mapping = {
    "us-west-1": ["us-west-1a", "us-west-1c"],
    "us-east-1": ["us-east-1a", "us-east-1b"]
  }
  return az_mapping.get(region, [])


def create_vpc_resources(region: str, provider: aws.Provider) -> Dict[str, Any]:
  """Create VPC and related networking resources for a region."""
  # Create VPC
  vpc = aws.ec2.Vpc(
    f"{PROJECT_NAME}-vpc-{region}",
    cidr_block=VPC_CIDR,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
      "Name": f"{PROJECT_NAME}-vpc-{region}",
      "Region": region,
      "Environment": "production"
    },
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Create Internet Gateway
  igw = aws.ec2.InternetGateway(
    f"{PROJECT_NAME}-igw-{region}",
    vpc_id=vpc.id,
    tags={
      "Name": f"{PROJECT_NAME}-igw-{region}",
      "Region": region
    },
    opts=pulumi.ResourceOptions(provider=provider)
  )

  availability_zones = get_availability_zones(region)
  public_subnets = []
  private_subnets = []
  nat_gateways = []
  elastic_ips = []

  # Create public and private subnets
  for i, az in enumerate(availability_zones):
    # Public subnet
    public_subnet = aws.ec2.Subnet(
      f"{PROJECT_NAME}-public-subnet-{region}-{i+1}",
      vpc_id=vpc.id,
      cidr_block=PUBLIC_SUBNET_CIDRS[i],
      availability_zone=az,
      map_public_ip_on_launch=True,
      tags={
        "Name": f"{PROJECT_NAME}-public-subnet-{region}-{i+1}",
        "Type": "public",
        "Region": region
      },
      opts=pulumi.ResourceOptions(provider=provider)
    )
    public_subnets.append(public_subnet)

    # Private subnet
    private_subnet = aws.ec2.Subnet(
      f"{PROJECT_NAME}-private-subnet-{region}-{i+1}",
      vpc_id=vpc.id,
      cidr_block=PRIVATE_SUBNET_CIDRS[i],
      availability_zone=az,
      tags={
        "Name": f"{PROJECT_NAME}-private-subnet-{region}-{i+1}",
        "Type": "private",
        "Region": region
      },
      opts=pulumi.ResourceOptions(provider=provider)
    )
    private_subnets.append(private_subnet)

    # Elastic IP for NAT Gateway
    eip = aws.ec2.Eip(
      f"{PROJECT_NAME}-eip-{region}-{i+1}",
      domain="vpc",
      tags={
        "Name": f"{PROJECT_NAME}-eip-{region}-{i+1}",
        "Region": region
      },
      opts=pulumi.ResourceOptions(provider=provider)
    )
    elastic_ips.append(eip)

    # NAT Gateway
    nat_gw = aws.ec2.NatGateway(
      f"{PROJECT_NAME}-nat-{region}-{i+1}",
      allocation_id=eip.id,
      subnet_id=public_subnet.id,
      tags={
        "Name": f"{PROJECT_NAME}-nat-{region}-{i+1}",
        "Region": region
      },
      opts=pulumi.ResourceOptions(provider=provider)
    )
    nat_gateways.append(nat_gw)

  # Create route tables
  public_rt = aws.ec2.RouteTable(
    f"{PROJECT_NAME}-public-rt-{region}",
    vpc_id=vpc.id,
    tags={
      "Name": f"{PROJECT_NAME}-public-rt-{region}",
      "Type": "public",
      "Region": region
    },
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Public route to internet gateway
  aws.ec2.Route(
    f"{PROJECT_NAME}-public-route-{region}",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Associate public subnets with public route table
  for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
      f"{PROJECT_NAME}-public-rta-{region}-{i+1}",
      subnet_id=subnet.id,
      route_table_id=public_rt.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

  # Create private route tables and routes
  private_route_tables = []
  for i, (subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
    private_rt = aws.ec2.RouteTable(
      f"{PROJECT_NAME}-private-rt-{region}-{i+1}",
      vpc_id=vpc.id,
      tags={
        "Name": f"{PROJECT_NAME}-private-rt-{region}-{i+1}",
        "Type": "private",
        "Region": region
      },
      opts=pulumi.ResourceOptions(provider=provider)
    )
    private_route_tables.append(private_rt)

    # Private route to NAT gateway
    aws.ec2.Route(
      f"{PROJECT_NAME}-private-route-{region}-{i+1}",
      route_table_id=private_rt.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=nat_gw.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

    # Associate private subnet with private route table
    aws.ec2.RouteTableAssociation(
      f"{PROJECT_NAME}-private-rta-{region}-{i+1}",
      subnet_id=subnet.id,
      route_table_id=private_rt.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

  return {
    "vpc": vpc,
    "igw": igw,
    "public_subnets": public_subnets,
    "private_subnets": private_subnets,
    "nat_gateways": nat_gateways,
    "elastic_ips": elastic_ips,
    "public_route_table": public_rt,
    "private_route_tables": private_route_tables
  }


def create_security_groups(region: str, vpc_id: pulumi.Output[str], 
                          provider: aws.Provider) -> Dict[str, aws.ec2.SecurityGroup]:
  """Create security groups with consistent rules across regions."""
  # Web tier security group
  web_sg = aws.ec2.SecurityGroup(
    f"{PROJECT_NAME}-web-sg-{region}",
    name=f"{PROJECT_NAME}-web-sg-{region}",
    description="Security group for web tier",
    vpc_id=vpc_id,
    ingress=[
      {
        "protocol": "tcp",
        "from_port": 80,
        "to_port": 80,
        "cidr_blocks": ["0.0.0.0/0"]
      },
      {
        "protocol": "tcp",
        "from_port": 443,
        "to_port": 443,
        "cidr_blocks": ["0.0.0.0/0"]
      }
    ],
    egress=[
      {
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"]
      }
    ],
    tags={
      "Name": f"{PROJECT_NAME}-web-sg-{region}",
      "Tier": "web",
      "Region": region
    },
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Application tier security group
  app_sg = aws.ec2.SecurityGroup(
    f"{PROJECT_NAME}-app-sg-{region}",
    name=f"{PROJECT_NAME}-app-sg-{region}",
    description="Security group for application tier",
    vpc_id=vpc_id,
    ingress=[
      {
        "protocol": "tcp",
        "from_port": 8080,
        "to_port": 8080,
        "security_groups": [web_sg.id]
      }
    ],
    egress=[
      {
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"]
      }
    ],
    tags={
      "Name": f"{PROJECT_NAME}-app-sg-{region}",
      "Tier": "application",
      "Region": region
    },
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Database tier security group
  db_sg = aws.ec2.SecurityGroup(
    f"{PROJECT_NAME}-db-sg-{region}",
    name=f"{PROJECT_NAME}-db-sg-{region}",
    description="Security group for database tier",
    vpc_id=vpc_id,
    ingress=[
      {
        "protocol": "tcp",
        "from_port": 3306,
        "to_port": 3306,
        "security_groups": [app_sg.id]
      }
    ],
    egress=[
      {
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"]
      }
    ],
    tags={
      "Name": f"{PROJECT_NAME}-db-sg-{region}",
      "Tier": "database",
      "Region": region
    },
    opts=pulumi.ResourceOptions(provider=provider)
  )

  return {
    "web": web_sg,
    "app": app_sg,
    "db": db_sg
  }


def create_s3_bucket_with_replication(primary_region: str, 
                                    secondary_region: str) -> Dict[str, Any]:
  """Create S3 buckets with cross-region replication."""
  # Create primary bucket
  primary_bucket = aws.s3.Bucket(
    f"{PROJECT_NAME}-primary-{primary_region}",
    bucket=f"{PROJECT_NAME}-primary-{primary_region}-{pulumi.get_stack()}",
    versioning={
      "enabled": True
    },
    tags={
      "Name": f"{PROJECT_NAME}-primary-{primary_region}",
      "Region": primary_region,
      "Type": "primary"
    }
  )

  # Create secondary bucket
  secondary_provider = aws.Provider(
    f"aws-{secondary_region}",
    region=secondary_region
  )

  secondary_bucket = aws.s3.Bucket(
    f"{PROJECT_NAME}-secondary-{secondary_region}",
    bucket=f"{PROJECT_NAME}-secondary-{secondary_region}-{pulumi.get_stack()}",
    versioning={
      "enabled": True
    },
    tags={
      "Name": f"{PROJECT_NAME}-secondary-{secondary_region}",
      "Region": secondary_region,
      "Type": "secondary"
    },
    opts=pulumi.ResourceOptions(provider=secondary_provider)
  )

  # IAM role for replication
  replication_role = aws.iam.Role(
    f"{PROJECT_NAME}-replication-role",
    assume_role_policy=json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "s3.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    })
  )

  # IAM policy for replication
  replication_policy = aws.iam.RolePolicy(
    f"{PROJECT_NAME}-replication-policy",
    role=replication_role.id,
    policy=pulumi.Output.all(primary_bucket.arn, secondary_bucket.arn).apply(
      lambda arns: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl"
            ],
            "Resource": f"{arns[0]}/*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket"
            ],
            "Resource": arns[0]
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ReplicateObject",
              "s3:ReplicateDelete"
            ],
            "Resource": f"{arns[1]}/*"
          }
        ]
      })
    )
  )

  # Configure replication
  replication_config = aws.s3.BucketReplicationConfiguration(
    f"{PROJECT_NAME}-replication-config",
    role=replication_role.arn,
    bucket=primary_bucket.id,
    rules=[
      {
        "id": "ReplicateEverything",
        "status": "Enabled",
        "destination": {
          "bucket": secondary_bucket.arn,
          "storage_class": "STANDARD_IA"
        }
      }
    ],
    opts=pulumi.ResourceOptions(depends_on=[replication_policy])
  )

  return {
    "primary_bucket": primary_bucket,
    "secondary_bucket": secondary_bucket,
    "replication_role": replication_role,
    "replication_config": replication_config
  }


def create_rds_with_cross_region_backup(primary_region: str, 
                                       secondary_region: str,
                                       primary_subnets: List[aws.ec2.Subnet],
                                       secondary_subnets: List[aws.ec2.Subnet],
                                       primary_sg: aws.ec2.SecurityGroup,
                                       secondary_sg: aws.ec2.SecurityGroup) -> Dict[str, Any]:
  """Create RDS instances with cross-region automated backups."""
  # Primary DB subnet group
  primary_subnet_group = aws.rds.SubnetGroup(
    f"{PROJECT_NAME}-db-subnet-group-{primary_region}",
    subnet_ids=[subnet.id for subnet in primary_subnets],
    tags={
      "Name": f"{PROJECT_NAME}-db-subnet-group-{primary_region}",
      "Region": primary_region
    }
  )

  # Secondary DB subnet group
  secondary_provider = aws.Provider(
    f"aws-db-{secondary_region}",
    region=secondary_region
  )

  secondary_subnet_group = aws.rds.SubnetGroup(
    f"{PROJECT_NAME}-db-subnet-group-{secondary_region}",
    subnet_ids=[subnet.id for subnet in secondary_subnets],
    tags={
      "Name": f"{PROJECT_NAME}-db-subnet-group-{secondary_region}",
      "Region": secondary_region
    },
    opts=pulumi.ResourceOptions(provider=secondary_provider)
  )

  # Primary RDS instance
  primary_db = aws.rds.Instance(
    f"{PROJECT_NAME}-db-{primary_region}",
    identifier=f"{PROJECT_NAME}-db-{primary_region}",
    engine="mysql",
    engine_version="8.0",
    instance_class="db.t3.micro",
    allocated_storage=20,
    db_name="tapdb",
    username="admin",
    password="changeme123!",
    vpc_security_group_ids=[primary_sg.id],
    db_subnet_group_name=primary_subnet_group.name,
    backup_retention_period=7,
    backup_window="03:00-04:00",
    maintenance_window="sun:04:00-sun:05:00",
    copy_tags_to_snapshot=True,
    skip_final_snapshot=True,
    tags={
      "Name": f"{PROJECT_NAME}-db-{primary_region}",
      "Region": primary_region,
      "Type": "primary"
    }
  )

  # Read replica in secondary region
  read_replica = aws.rds.Instance(
    f"{PROJECT_NAME}-db-replica-{secondary_region}",
    identifier=f"{PROJECT_NAME}-db-replica-{secondary_region}",
    replicate_source_db=primary_db.identifier,
    instance_class="db.t3.micro",
    vpc_security_group_ids=[secondary_sg.id],
    copy_tags_to_snapshot=True,
    skip_final_snapshot=True,
    tags={
      "Name": f"{PROJECT_NAME}-db-replica-{secondary_region}",
      "Region": secondary_region,
      "Type": "replica"
    },
    opts=pulumi.ResourceOptions(provider=secondary_provider)
  )

  return {
    "primary_db": primary_db,
    "read_replica": read_replica,
    "primary_subnet_group": primary_subnet_group,
    "secondary_subnet_group": secondary_subnet_group
  }


def deploy_multi_region_infrastructure() -> Dict[str, Any]:
  """Deploy the complete multi-region infrastructure."""
  infrastructure = {}
  
  # Deploy to each region
  for region in REGIONS:
    # Create provider for this region
    provider = aws.Provider(f"aws-{region}", region=region)
    
    # Create VPC resources
    vpc_resources = create_vpc_resources(region, provider)
    
    # Create security groups
    security_groups = create_security_groups(
      region, 
      vpc_resources["vpc"].id, 
      provider
    )
    
    infrastructure[region] = {
      "provider": provider,
      "vpc_resources": vpc_resources,
      "security_groups": security_groups
    }

  # Create cross-region services
  primary_region = REGIONS[0]
  secondary_region = REGIONS[1]

  # S3 cross-region replication
  s3_resources = create_s3_bucket_with_replication(
    primary_region, 
    secondary_region
  )

  # RDS with cross-region read replica
  rds_resources = create_rds_with_cross_region_backup(
    primary_region,
    secondary_region,
    infrastructure[primary_region]["vpc_resources"]["private_subnets"],
    infrastructure[secondary_region]["vpc_resources"]["private_subnets"],
    infrastructure[primary_region]["security_groups"]["db"],
    infrastructure[secondary_region]["security_groups"]["db"]
  )

  infrastructure["cross_region"] = {
    "s3": s3_resources,
    "rds": rds_resources
  }

  return infrastructure


class TapStackArgs:
  """Arguments for TapStack - minimal implementation for test compatibility."""
  
  def __init__(self, regions: Optional[List[str]] = None):
    self.regions = regions or REGIONS


class TapStack:
  """Main stack class for test compatibility - wraps function-based infrastructure."""
  
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[pulumi.ResourceOptions] = None):
    self.name = name
    self.args = args
    self.opts = opts
    
    # Deploy the infrastructure using our function-based approach
    self.infrastructure = deploy_multi_region_infrastructure()
    
    # Export key outputs
    self._setup_outputs()

  def _setup_outputs(self):
    """Setup Pulumi outputs for the infrastructure."""
    for region in self.args.regions:
      if region in self.infrastructure:
        vpc_resources = self.infrastructure[region]["vpc_resources"]
        
        # Export VPC ID
        pulumi.export(f"vpc_id_{region.replace('-', '_')}", vpc_resources["vpc"].id)
        
        # Export subnet IDs
        for i, subnet in enumerate(vpc_resources["public_subnets"]):
          pulumi.export(f"public_subnet_{region.replace('-', '_')}_{i+1}_id", subnet.id)
        
        for i, subnet in enumerate(vpc_resources["private_subnets"]):
          pulumi.export(f"private_subnet_{region.replace('-', '_')}_{i+1}_id", subnet.id)

    # Export cross-region resource information
    if "cross_region" in self.infrastructure:
      s3_resources = self.infrastructure["cross_region"]["s3"]
      pulumi.export("primary_bucket_name", s3_resources["primary_bucket"].bucket)
      pulumi.export("secondary_bucket_name", s3_resources["secondary_bucket"].bucket)
      
      rds_resources = self.infrastructure["cross_region"]["rds"]
      pulumi.export("primary_db_endpoint", rds_resources["primary_db"].endpoint)
      pulumi.export("replica_db_endpoint", rds_resources["read_replica"].endpoint)


# Main execution when run directly
if __name__ == "__main__":
  # Create and deploy the stack
  stack_args = TapStackArgs()
  stack = TapStack("tap-multi-region", stack_args)