"""
Payment Processing Infrastructure - Main Pulumi Program
Multi-environment deployment supporting dev, staging, and production
"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any
from vpc import create_vpc
from security import create_security_groups
from database import create_database
from cache import create_cache
from messaging import create_messaging_resources
from compute import create_ecs_cluster
from monitoring import create_monitoring

# Get configuration
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
environment = config.get("environment") or "dev"
vpc_cidr = config.get("vpcCidr") or "10.0.0.0/16"
enable_multi_az = config.get_bool("enableMultiAZ") or False

# Tags for all resources
common_tags = {
    "Project": "PaymentProcessing",
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

# Create database
database_resources = create_database(
    environment_suffix=environment_suffix,
    vpc_id=vpc_resources["vpc"].id,
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    security_group_id=security_groups["database_sg"].id,
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
    environment=environment,
    tags=common_tags
)

# Create monitoring
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
pulumi.export("database_endpoint", database_resources["cluster"].endpoint)
pulumi.export("cache_endpoint", cache_resources["cluster"].cache_nodes[0].address)
pulumi.export("payment_queue_url", messaging_resources["payment_queue"].url)
pulumi.export("alert_topic_arn", messaging_resources["alert_topic"].arn)
