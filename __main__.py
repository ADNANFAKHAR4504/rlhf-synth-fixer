"""
Main Pulumi program for deploying Flask API infrastructure on AWS ECS Fargate.
"""

import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get Pulumi configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or pulumi.get_stack()

# Define common tags for all resources
tags = {
    "Environment": "production",
    "Project": "ecommerce-api",
    "ManagedBy": "Pulumi"
}

# Create the infrastructure stack
stack = TapStack(
    name="ecommerce-api-stack",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=tags
    )
)

# Export important outputs
pulumi.export("alb_dns_name", stack.alb_dns_name)
pulumi.export("ecr_repository_uri", stack.ecr_repository_uri)
pulumi.export("rds_cluster_endpoint", stack.rds_cluster_endpoint)
pulumi.export("vpc_id", stack.vpc_id)
pulumi.export("ecs_cluster_name", stack.ecs_cluster_name)
