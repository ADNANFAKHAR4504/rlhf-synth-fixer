"""
Payment Processing Web Application Infrastructure Stack

This module implements a production-grade fintech payment processing infrastructure
with ECS Fargate, Aurora PostgreSQL, S3 CloudFront distribution, and comprehensive
monitoring and security features.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws

from .vpc_stack import VpcStack, VpcStackArgs
from .database_stack import DatabaseStack, DatabaseStackArgs
from .ecs_stack import EcsStack, EcsStackArgs
from .frontend_stack import FrontendStack, FrontendStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs


class TapStackArgs:
    """
    Arguments for the Payment Processing Web Application Stack.

    Args:
        environment_suffix: Suffix for resource naming to ensure global uniqueness
        tags: Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main stack orchestrating payment processing web application infrastructure.

    This stack creates:
    - VPC with 3 AZs, public and private subnets, NAT Gateways
    - Aurora PostgreSQL cluster with multi-AZ and encryption
    - ECS Fargate cluster with auto-scaling
    - Application Load Balancer with HTTPS
    - S3 bucket with CloudFront distribution
    - CloudWatch monitoring and logging
    - Secrets Manager for database credentials
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            'Environment': 'production',
            'CostCenter': 'payments',
            **args.tags
        }

        # Create VPC with 3 AZs, public and private subnets, NAT Gateways
        self.vpc_stack = VpcStack(
            f"vpc-{self.environment_suffix}",
            VpcStackArgs(
                environment_suffix=self.environment_suffix,
                availability_zone_count=3,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring and logging infrastructure
        self.monitoring_stack = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora PostgreSQL cluster with multi-AZ and encryption
        self.database_stack = DatabaseStack(
            f"database-{self.environment_suffix}",
            DatabaseStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.vpc_stack.vpc_id,
                private_subnet_ids=self.vpc_stack.private_subnet_ids,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.vpc_stack])
        )

        # Create ECS Fargate cluster with ALB and auto-scaling
        self.ecs_stack = EcsStack(
            f"ecs-{self.environment_suffix}",
            EcsStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.vpc_stack.vpc_id,
                public_subnet_ids=self.vpc_stack.public_subnet_ids,
                private_subnet_ids=self.vpc_stack.private_subnet_ids,
                database_secret_arn=self.database_stack.db_secret_arn,
                database_connection_string=self.database_stack.connection_string,
                ecs_log_group_name=self.monitoring_stack.ecs_log_group_name,
                alb_log_group_name=self.monitoring_stack.alb_log_group_name,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.vpc_stack, self.database_stack, self.monitoring_stack])
        )

        # Create S3 bucket with CloudFront distribution for frontend
        self.frontend_stack = FrontendStack(
            f"frontend-{self.environment_suffix}",
            FrontendStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export important outputs
        self.register_outputs({
            'vpc_id': self.vpc_stack.vpc_id,
            'public_subnet_ids': self.vpc_stack.public_subnet_ids,
            'private_subnet_ids': self.vpc_stack.private_subnet_ids,
            'database_cluster_endpoint': self.database_stack.cluster_endpoint,
            'database_secret_arn': self.database_stack.db_secret_arn,
            'alb_dns_name': self.ecs_stack.alb_dns_name,
            'alb_url': self.ecs_stack.alb_url,
            'ecs_cluster_name': self.ecs_stack.cluster_name,
            'ecs_service_name': self.ecs_stack.service_name,
            'frontend_bucket_name': self.frontend_stack.bucket_name,
            'cloudfront_domain': self.frontend_stack.cloudfront_domain,
            'cloudfront_url': self.frontend_stack.cloudfront_url,
        })
