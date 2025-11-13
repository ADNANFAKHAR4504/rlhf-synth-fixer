"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from components.vpc import VpcComponent
from components.alb import AlbComponent
from components.asg import AsgComponent
from components.rds import RdsComponent
from components.s3 import S3Component


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment (str): The environment name (e.g., 'dev', 'staging', 'prod').
        environment_suffix (str): A suffix for identifying the deployment environment.
        vpc_cidr (str): The CIDR block for the VPC.
        instance_type (str): EC2 instance type for ASG.
        asg_min_size (int): Minimum size for Auto Scaling Group.
        asg_max_size (int): Maximum size for Auto Scaling Group.
        asg_desired_capacity (int): Desired capacity for Auto Scaling Group.
        rds_instance_class (str): RDS instance class.
        rds_multi_az (bool): Whether RDS should use Multi-AZ deployment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(
        self,
        environment: str,
        environment_suffix: str,
        vpc_cidr: str,
        instance_type: str,
        asg_min_size: int,
        asg_max_size: int,
        asg_desired_capacity: int,
        rds_instance_class: str,
        rds_multi_az: bool = False,
        tags: Optional[dict] = None
    ):
        self.environment = environment
        self.environment_suffix = environment_suffix
        self.vpc_cidr = vpc_cidr
        self.instance_type = instance_type
        self.asg_min_size = asg_min_size
        self.asg_max_size = asg_max_size
        self.asg_desired_capacity = asg_desired_capacity
        self.rds_instance_class = rds_instance_class
        self.rds_multi_az = rds_multi_az
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of VPC, ALB, ASG, RDS, and S3 components
    for multi-environment infrastructure (dev, staging, prod).

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment settings.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        # Create VPC with subnets, route tables, IGW, and NAT Gateway
        self.vpc = VpcComponent(
            f"vpc-{args.environment}-{args.environment_suffix}",
            vpc_cidr=args.vpc_cidr,
            environment=args.environment,
            environment_suffix=args.environment_suffix,
            tags=args.tags,
            opts=ResourceOptions(parent=self),
        )

        # Create RDS MySQL instance with Secrets Manager password
        self.rds = RdsComponent(
            f"rds-{args.environment}-{args.environment_suffix}",
            vpc_id=self.vpc.vpc_id,
            subnet_ids=self.vpc.private_subnet_ids,
            environment=args.environment,
            environment_suffix=args.environment_suffix,
            instance_class=args.rds_instance_class,
            multi_az=args.rds_multi_az,
            tags=args.tags,
            opts=ResourceOptions(parent=self),
        )

        # Create Application Load Balancer
        self.alb = AlbComponent(
            f"alb-{args.environment}-{args.environment_suffix}",
            vpc_id=self.vpc.vpc_id,
            subnet_ids=self.vpc.public_subnet_ids,
            environment=args.environment,
            environment_suffix=args.environment_suffix,
            tags=args.tags,
            opts=ResourceOptions(parent=self),
        )

        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"],
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="virtualization-type",
                    values=["hvm"],
                ),
            ],
        )

        # Create Auto Scaling Group with EC2 instances
        self.asg = AsgComponent(
            f"asg-{args.environment}-{args.environment_suffix}",
            vpc_id=self.vpc.vpc_id,
            subnet_ids=self.vpc.private_subnet_ids,
            target_group_arn=self.alb.target_group_arn,
            environment=args.environment,
            environment_suffix=args.environment_suffix,
            instance_type=args.instance_type,
            ami_id=ami.id,
            min_size=args.asg_min_size,
            max_size=args.asg_max_size,
            desired_capacity=args.asg_desired_capacity,
            tags=args.tags,
            opts=ResourceOptions(parent=self),
        )

        # Create S3 bucket for static assets
        self.s3_bucket = S3Component(
            f"s3-{args.environment}-{args.environment_suffix}",
            environment=args.environment,
            environment_suffix=args.environment_suffix,
            tags=args.tags,
            opts=ResourceOptions(parent=self),
        )

        # Register outputs for validation
        self.register_outputs({
            "vpc_id": self.vpc.vpc_id,
            "vpc_cidr": args.vpc_cidr,
            "public_subnet_ids": pulumi.Output.all(*self.vpc.public_subnet_ids),
            "private_subnet_ids": pulumi.Output.all(*self.vpc.private_subnet_ids),
            "alb_dns_name": self.alb.alb_dns_name,
            "alb_arn": self.alb.alb_arn,
            "target_group_arn": self.alb.target_group_arn,
            "asg_name": self.asg.asg_name,
            "asg_arn": self.asg.asg_arn,
            "rds_endpoint": self.rds.rds_endpoint,
            "rds_arn": self.rds.rds_arn,
            "rds_secret_arn": self.rds.secret_arn,
            "s3_bucket_name": self.s3_bucket.bucket_name,
            "s3_bucket_arn": self.s3_bucket.bucket_arn,
            "environment": args.environment,
        })
