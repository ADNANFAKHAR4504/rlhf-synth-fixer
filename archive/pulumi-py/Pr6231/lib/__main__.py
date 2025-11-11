"""
Containerized Flask Application Infrastructure
Pulumi Python implementation for ECS Fargate deployment with auto-scaling
"""

import os
import sys
import pulumi
import pulumi_aws as aws
import json

# Add lib directory to path
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

from vpc import create_vpc
from ecr import create_ecr_repository
from rds import create_rds_instance
from dynamodb import create_dynamodb_table
from ecs import create_ecs_cluster, create_ecs_service
from alb import create_alb
from autoscaling import create_autoscaling_policy

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()

# AWS Region
aws_config = pulumi.Config("aws")
region = aws_config.get("region") or "us-east-2"

# Create VPC and networking
vpc_resources = create_vpc(environment_suffix, region)

# Create ECR repository for container images
ecr_repo = create_ecr_repository(environment_suffix)

# Create DynamoDB table for session management
dynamodb_table = create_dynamodb_table(environment_suffix)

# Create RDS PostgreSQL database
rds_resources = create_rds_instance(
    environment_suffix,
    vpc_resources["vpc"],
    vpc_resources["private_subnets"],
    vpc_resources["database_security_group"]
)

# Create ECS cluster
ecs_cluster = create_ecs_cluster(environment_suffix)

# Create Application Load Balancer
alb_resources = create_alb(
    environment_suffix,
    vpc_resources["vpc"],
    vpc_resources["public_subnets"],
    vpc_resources["alb_security_group"]
)

# Create ECS Service (depends on listener being created)
ecs_resources = create_ecs_service(
    environment_suffix,
    ecs_cluster,
    vpc_resources["private_subnets"],
    vpc_resources["ecs_security_group"],
    alb_resources["target_group"],
    ecr_repo,
    rds_resources["db_secret"],
    alb_resources["listener"]
)

# Create Auto-scaling policies
autoscaling_resources = create_autoscaling_policy(
    environment_suffix,
    ecs_cluster,
    ecs_resources["service"]
)

# Export stack outputs
pulumi.export("alb_dns_name", alb_resources["alb"].dns_name)
pulumi.export("alb_url", pulumi.Output.concat("http://", alb_resources["alb"].dns_name))
pulumi.export("vpc_id", vpc_resources["vpc"].id)
pulumi.export("ecr_repository_url", ecr_repo.repository_url)
pulumi.export("ecs_cluster_name", ecs_cluster.name)
pulumi.export("ecs_service_name", ecs_resources["service"].name)
pulumi.export("rds_endpoint", rds_resources["db_instance"].endpoint)
pulumi.export("dynamodb_table_name", dynamodb_table.name)
pulumi.export("log_group_name", ecs_resources["log_group"].name)
