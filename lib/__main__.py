"""
Main entry point for the multi-environment infrastructure Pulumi program.

This module initializes the Pulumi stack with proper configuration,
environment settings, and deploys VPC, ALB, ASG, RDS, and S3 resources
across multiple environments (dev, staging, prod).
"""

import pulumi
from tap_stack import TapStack, TapStackArgs


def main():
    """
    Main entry point for the Pulumi program.
    
    Initializes the multi-environment infrastructure stack with proper
    configuration including VPC, ALB, ASG, RDS, and S3 components.
    """
    # Get Pulumi configuration
    config = pulumi.Config()
    
    # Read configuration values with defaults
    environment = config.get("environment") or "dev"
    environment_suffix = config.get("environment_suffix") or environment
    vpc_cidr = config.get("vpc_cidr") or "10.0.0.0/16"
    instance_type = config.get("instance_type") or "t3.micro"
    asg_min_size = config.get_int("asg_min_size") or 1
    asg_max_size = config.get_int("asg_max_size") or 3
    asg_desired_capacity = config.get_int("asg_desired_capacity") or 2
    rds_instance_class = config.get("rds_instance_class") or "db.t3.micro"
    rds_multi_az = config.get_bool("rds_multi_az") or False
    
    # Define common tags for all resources
    common_tags = {
        "Project": config.get("project_name") or "TapStack",
        "Environment": environment,
        "ManagedBy": "Pulumi",
        "Team": config.get("team") or "Infrastructure",
    }
    
    # Create stack arguments
    stack_args = TapStackArgs(
        environment=environment,
        environment_suffix=environment_suffix,
        vpc_cidr=vpc_cidr,
        instance_type=instance_type,
        asg_min_size=asg_min_size,
        asg_max_size=asg_max_size,
        asg_desired_capacity=asg_desired_capacity,
        rds_instance_class=rds_instance_class,
        rds_multi_az=rds_multi_az,
        tags=common_tags,
    )
    
    # Create the main infrastructure stack
    stack = TapStack(
        name=f"tap-stack-{environment_suffix}",
        args=stack_args,
    )
    
    # Export key infrastructure outputs
    pulumi.export("vpc_id", stack.vpc.vpc_id)
    pulumi.export("vpc_cidr", vpc_cidr)
    pulumi.export("public_subnet_ids", stack.vpc.public_subnet_ids)
    pulumi.export("private_subnet_ids", stack.vpc.private_subnet_ids)
    pulumi.export("alb_dns_name", stack.alb.alb_dns_name)
    pulumi.export("alb_arn", stack.alb.alb_arn)
    pulumi.export("target_group_arn", stack.alb.target_group_arn)
    pulumi.export("asg_name", stack.asg.asg_name)
    pulumi.export("asg_arn", stack.asg.asg_arn)
    pulumi.export("rds_endpoint", stack.rds.rds_endpoint)
    pulumi.export("rds_arn", stack.rds.rds_arn)
    pulumi.export("rds_secret_arn", stack.rds.secret_arn)
    pulumi.export("s3_bucket_name", stack.s3_bucket.bucket_name)
    pulumi.export("s3_bucket_arn", stack.s3_bucket.bucket_arn)
    pulumi.export("environment", environment)
    pulumi.export("environment_suffix", environment_suffix)
    
    return stack


if __name__ == "__main__":
    main()
