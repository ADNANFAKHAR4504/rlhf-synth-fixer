"""
Pulumi program entry point for TapStack infrastructure.

This module serves as the main entry point for Pulumi deployments.
It reads configuration values and instantiates the TapStack component
with the appropriate environment suffix and configuration.
"""

import pulumi
import pulumi_aws as aws
from lib.vpc_component import VpcComponent
from lib.alb_component import AlbComponent
from lib.asg_component import AsgComponent
from lib.rds_component import RdsComponent
from lib.s3_component import S3Component

# Get configuration
config = pulumi.Config("TapStack")

# Read environment suffix from config
environment_suffix = config.require("environmentSuffix")

# Read other configuration values
instance_type = config.get("instanceType") or "t3.medium"
db_instance_class = config.get("dbInstanceClass") or "db.t3.medium"
db_username = config.get("dbUsername") or "admin"
db_password = config.require_secret("dbPassword")
environment_name = config.get("environmentName") or "dev"

# Define tags based on environment
tags = {
    "Environment": environment_name,
    "EnvironmentSuffix": environment_suffix,
    "ManagedBy": "Pulumi",
    "Project": "TapStack",
    "CostCenter": "engineering",
}

# Get availability zones
azs = aws.get_availability_zones(state="available")
availability_zones = azs.names[:2]  # Use first 2 AZs

# Deploy VPC
vpc = VpcComponent(
    "vpc",
    environment_suffix=environment_suffix,
    cidr_block="10.0.0.0/16",
    availability_zones=availability_zones,
    tags=tags,
)

# Deploy ALB
alb = AlbComponent(
    "alb",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    public_subnet_ids=vpc.public_subnet_ids,
    enable_waf=False,
    tags=tags,
)

# Deploy Auto Scaling Group
asg = AsgComponent(
    "asg",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    private_subnet_ids=vpc.private_subnet_ids,
    target_group_arn=alb.target_group_arn,
    min_size=1,
    max_size=3,
    tags=tags,
)

# Deploy RDS Aurora PostgreSQL
rds = RdsComponent(
    "rds",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    private_subnet_ids=vpc.private_subnet_ids,
    read_replica_count=1,
    backup_retention_days=7,
    tags=tags,
)

# Deploy S3 Buckets
s3 = S3Component(
    "s3",
    environment_suffix=environment_suffix,
    environment=environment_name,
    tags=tags,
)

# Export outputs required by integration tests
pulumi.export("vpc_id", vpc.vpc_id)
pulumi.export("alb_arn", alb.alb_arn)
pulumi.export("alb_dns_name", alb.alb_dns_name)
pulumi.export("rds_cluster_endpoint", rds.cluster_endpoint)
pulumi.export("rds_reader_endpoint", rds.reader_endpoint)
pulumi.export("static_assets_bucket", s3.static_assets_bucket)
pulumi.export("logs_bucket", s3.logs_bucket)