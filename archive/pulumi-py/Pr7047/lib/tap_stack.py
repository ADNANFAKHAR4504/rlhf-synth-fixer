"""
tap_stack.py

Main Pulumi ComponentResource for cost-optimized ECS Fargate infrastructure.
Orchestrates VPC, ECS, ALB, and monitoring resources.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
from .vpc_stack import VpcStack
from .ecs_stack import EcsStack
from .alb_stack import AlbStack
from .monitoring_stack import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
        task_cpu (Optional[int]): CPU units for ECS tasks (default: 256)
        task_memory (Optional[int]): Memory for ECS tasks in MB (default: 512)
        desired_count (Optional[int]): Desired number of tasks (default: 2)
        use_spot (Optional[bool]): Use Fargate Spot capacity (default: True)
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        task_cpu: Optional[int] = 256,
        task_memory: Optional[int] = 512,
        desired_count: Optional[int] = 2,
        use_spot: Optional[bool] = True
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.task_cpu = task_cpu
        self.task_memory = task_memory
        self.desired_count = desired_count
        self.use_spot = use_spot


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for cost-optimized ECS Fargate infrastructure.

    This component orchestrates:
    - VPC with public/private subnets
    - Application Load Balancer
    - ECS Fargate cluster with auto-scaling
    - CloudWatch monitoring and Container Insights

    Cost optimizations include:
    - Right-sized tasks (256 CPU / 512 MB)
    - Fargate Spot for cost savings
    - Aggressive auto-scaling policies
    - 7-day CloudWatch log retention

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create VPC with public/private subnets
        self.vpc = VpcStack(
            f"vpc-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            opts=ResourceOptions(parent=self)
        )

        # Create Application Load Balancer
        self.alb = AlbStack(
            f"alb-{self.environment_suffix}",
            vpc_id=self.vpc.vpc.id,
            public_subnet_ids=self.vpc.public_subnet_ids,
            environment_suffix=self.environment_suffix,
            opts=ResourceOptions(parent=self)
        )

        # Create ECS Fargate cluster and service
        self.ecs = EcsStack(
            f"ecs-{self.environment_suffix}",
            vpc_id=self.vpc.vpc.id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            alb_target_group_arn=self.alb.target_group.arn,
            alb_security_group_id=self.alb.alb_security_group.id,
            environment_suffix=self.environment_suffix,
            task_cpu=args.task_cpu,
            task_memory=args.task_memory,
            desired_count=args.desired_count,
            use_spot=args.use_spot,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch monitoring and alarms
        self.monitoring = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            cluster_name=self.ecs.cluster.name,
            service_name=self.ecs.service.name,
            alb_arn=self.alb.alb.arn,
            target_group_arn=self.alb.target_group.arn,
            environment_suffix=self.environment_suffix,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.vpc.id,
            'cluster_name': self.ecs.cluster.name,
            'cluster_arn': self.ecs.cluster.arn,
            'service_name': self.ecs.service.name,
            'alb_dns': self.alb.alb.dns_name,
            'alb_url': pulumi.Output.concat('http://', self.alb.alb.dns_name),
            'target_group_arn': self.alb.target_group.arn,
            'log_group_name': self.ecs.log_group.name,
            'dashboard_name': self.monitoring.dashboard.dashboard_name,
        })
