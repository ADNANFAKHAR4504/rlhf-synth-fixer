import pulumi
import pulumi_aws as aws
from lib.vpc_component import VpcComponent
from lib.alb_component import AlbComponent
from lib.asg_component import AsgComponent
from lib.rds_component import RdsComponent
from lib.s3_component import S3Component

# Load configuration
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
environment = config.require("environment")
min_capacity = config.require_int("minCapacity")
max_capacity = config.require_int("maxCapacity")
read_replica_count = config.require_int("readReplicaCount")
backup_retention_days = config.require_int("backupRetentionDays")
enable_waf = config.get_bool("enableWaf") or False
cost_center = config.require("costCenter")

# Common tags
tags = {
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "CostCenter": cost_center,
}

# Deploy VPC
vpc = VpcComponent(
    "vpc",
    environment_suffix=environment_suffix,
    cidr_block="10.0.0.0/16",
    availability_zones=["us-east-1a", "us-east-1b"],
    tags=tags,
)

# Deploy ALB
alb = AlbComponent(
    "alb",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    public_subnet_ids=vpc.public_subnet_ids,
    enable_waf=enable_waf,
    tags=tags,
)

# Deploy Auto Scaling Group
asg = AsgComponent(
    "asg",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    private_subnet_ids=vpc.private_subnet_ids,
    target_group_arn=alb.target_group_arn,
    min_size=min_capacity,
    max_size=max_capacity,
    tags=tags,
)

# Deploy RDS Aurora PostgreSQL
rds = RdsComponent(
    "rds",
    environment_suffix=environment_suffix,
    vpc_id=vpc.vpc_id,
    private_subnet_ids=vpc.private_subnet_ids,
    read_replica_count=read_replica_count,
    backup_retention_days=backup_retention_days,
    tags=tags,
)

# Deploy S3 Buckets
s3 = S3Component(
    "s3",
    environment_suffix=environment_suffix,
    environment=environment,
    tags=tags,
)

# Export outputs
pulumi.export("vpc_id", vpc.vpc_id)
pulumi.export("alb_dns_name", alb.alb_dns_name)
pulumi.export("alb_arn", alb.alb_arn)
pulumi.export("rds_cluster_endpoint", rds.cluster_endpoint)
pulumi.export("rds_reader_endpoint", rds.reader_endpoint)
pulumi.export("static_assets_bucket", s3.static_assets_bucket)
pulumi.export("logs_bucket", s3.logs_bucket)
