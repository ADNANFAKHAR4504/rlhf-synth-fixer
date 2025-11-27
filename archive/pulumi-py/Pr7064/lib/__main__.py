"""Main Pulumi program for transaction processing infrastructure."""
import pulumi
import pulumi_aws as aws
import boto3
import os
from typing import Optional

# Import modular components
from vpc import create_vpc
from security import create_security_groups
from database import create_database
from cache import create_cache
from messaging import create_messaging_resources
from compute import create_ecs_cluster
from monitoring import create_monitoring
from storage import create_storage_buckets

# Get configuration using Pulumi Config (not environment variables)
config = pulumi.Config()

# Get environment suffix - use Pulumi config, fallback to env var, then stack name
environment_suffix: str = (
    config.get("environment_suffix")
    or os.environ.get("ENVIRONMENT_SUFFIX")
    or pulumi.get_stack()
)

# Get other configuration values
region: str = config.get("region") or "us-east-1"
environment: str = config.get("environment") or "dev"
vpc_cidr: str = config.get("vpc_cidr") or "10.0.0.0/16"
enable_multi_az: bool = config.get_bool("enable_multi_az") or False

# Get database password - try environment variable first (for CI/CD), then Pulumi config
db_password_env = os.environ.get('TF_VAR_db_password')
if db_password_env:
    # If environment variable is set, use it as a secret
    db_password = pulumi.Output.secret(db_password_env)
else:
    # Otherwise, try to get from Pulumi configuration
    db_password_config = config.get_secret("db_password")
    if db_password_config:
        db_password = db_password_config
    else:
        # Fail with clear error message
        raise ValueError(
            "Database password must be provided either via TF_VAR_db_password environment variable "
            "or via Pulumi configuration: pulumi config set --secret db_password <value>"
        )

# Get AWS account ID for unique resource naming
sts = boto3.client('sts')
aws_account_id = sts.get_caller_identity()['Account']

# Common tags for all resources
common_tags = {
    "Project": "TransactionProcessing",
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "EnvironmentSuffix": environment_suffix,
}

# Create VPC and networking
vpc_resources = create_vpc(
    environment_suffix=environment_suffix,
    vpc_cidr=vpc_cidr,
    enable_multi_az=enable_multi_az,
    tags=common_tags
)

# Create security groups
security_groups = create_security_groups(
    environment_suffix=environment_suffix,
    vpc_id=vpc_resources["vpc"].id,
    vpc_cidr=vpc_cidr,
    tags=common_tags
)

# Create storage buckets
storage_resources = create_storage_buckets(
    environment_suffix=environment_suffix,
    aws_account_id=aws_account_id,
    region=region,
    tags=common_tags
)

# Create database
database_resources = create_database(
    environment_suffix=environment_suffix,
    vpc_id=vpc_resources["vpc"].id,
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    security_group_id=security_groups["database_sg"].id,
    db_password=db_password,
    environment=environment,
    tags=common_tags
)

# Create cache
cache_resources = create_cache(
    environment_suffix=environment_suffix,
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    security_group_id=security_groups["cache_sg"].id,
    tags=common_tags
)

# Create messaging resources
messaging_resources = create_messaging_resources(
    environment_suffix=environment_suffix,
    tags=common_tags
)

# Create ECS cluster and services
ecs_resources = create_ecs_cluster(
    environment_suffix=environment_suffix,
    vpc_id=vpc_resources["vpc"].id,
    public_subnet_ids=vpc_resources["public_subnet_ids"],
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    alb_security_group_id=security_groups["alb_sg"].id,
    app_security_group_id=security_groups["app_sg"].id,
    database_endpoint=database_resources["cluster"].endpoint,
    cache_endpoint=cache_resources["cluster"].cache_nodes[0].address,
    queue_url=messaging_resources["payment_queue"].url,
    log_group=storage_resources["ecs_log_group"],
    environment=environment,
    tags=common_tags
)

# Create monitoring and alarms
monitoring_resources = create_monitoring(
    environment_suffix=environment_suffix,
    alb_arn=ecs_resources["alb"].arn_suffix,
    target_group_arn=ecs_resources["target_group"].arn_suffix,
    ecs_cluster_name=ecs_resources["cluster"].name,
    ecs_service_name=ecs_resources["service"].name,
    database_cluster_id=database_resources["cluster"].id,
    cache_cluster_id=cache_resources["cluster"].id,
    queue_name=messaging_resources["payment_queue"].name,
    sns_topic_arn=messaging_resources["alert_topic"].arn,
    tags=common_tags
)

# Exports
pulumi.export("vpc_id", vpc_resources["vpc"].id)
pulumi.export("alb_dns_name", ecs_resources["alb"].dns_name)
pulumi.export("rds_endpoint", database_resources["cluster"].endpoint)
pulumi.export("rds_reader_endpoint", database_resources["cluster"].reader_endpoint)
pulumi.export("app_logs_bucket", storage_resources["app_logs_bucket"].bucket)
pulumi.export("transaction_data_bucket", storage_resources["transaction_data_bucket"].bucket)
pulumi.export("ecs_cluster_name", ecs_resources["cluster"].name)
pulumi.export("ecs_task_role_arn", ecs_resources["task_role"].arn)
pulumi.export("ecs_task_execution_role_arn", ecs_resources["task_execution_role"].arn)
pulumi.export("ecs_security_group_id", security_groups["app_sg"].id)
pulumi.export("alb_target_group_arn", ecs_resources["target_group"].arn)
pulumi.export("private_subnet_ids", [subnet.id for subnet in vpc_resources["private_subnets"]])