"""
Monitoring Stack for Payment Processing Infrastructure

Creates CloudWatch log groups with 30-day retention for ECS tasks and ALB.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class MonitoringStackArgs:
    """
    Arguments for Monitoring Stack.

    Args:
        environment_suffix: Suffix for resource naming
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class MonitoringStack(pulumi.ComponentResource):
    """
    CloudWatch monitoring and logging infrastructure.

    Creates:
    - CloudWatch log group for ECS tasks
    - CloudWatch log group for ALB access logs
    - 30-day retention policy for all logs
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # Create CloudWatch log group for ECS tasks
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"payment-ecs-logs-{args.environment_suffix}",
            name=f"/aws/ecs/payment-api-{args.environment_suffix}",
            retention_in_days=30,
            tags={
                **args.tags,
                'Name': f'payment-ecs-logs-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group for ALB access logs
        self.alb_log_group = aws.cloudwatch.LogGroup(
            f"payment-alb-logs-{args.environment_suffix}",
            name=f"/aws/alb/payment-{args.environment_suffix}",
            retention_in_days=30,
            tags={
                **args.tags,
                'Name': f'payment-alb-logs-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        self.ecs_log_group_name = self.ecs_log_group.name
        self.alb_log_group_name = self.alb_log_group.name

        self.register_outputs({
            'ecs_log_group_name': self.ecs_log_group_name,
            'alb_log_group_name': self.alb_log_group_name,
        })
