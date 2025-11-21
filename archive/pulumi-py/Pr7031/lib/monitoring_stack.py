"""
Monitoring Stack - CloudWatch Log Groups
"""

from typing import Dict

import pulumi
import pulumi_aws as aws


class MonitoringStackArgs:
    """Arguments for MonitoringStack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class MonitoringStack(pulumi.ComponentResource):
    """
    CloudWatch Log Groups for compliance-ready logging.
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: pulumi.ResourceOptions = None
    ):
        super().__init__("custom:monitoring:MonitoringStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # CloudWatch Log Group for ECS
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"loan-ecs-logs-{self.environment_suffix}",
            name=f"/aws/ecs/loan-app-{self.environment_suffix}",
            retention_in_days=365,
            tags={**self.tags, "Name": f"loan-ecs-logs-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        self.ecs_log_group_name = self.ecs_log_group.name

        # CloudWatch Log Group for RDS
        self.rds_log_group = aws.cloudwatch.LogGroup(
            f"loan-rds-logs-{self.environment_suffix}",
            name=f"/aws/rds/cluster/loan-aurora-cluster-{self.environment_suffix}",
            retention_in_days=365,
            tags={**self.tags, "Name": f"loan-rds-logs-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.register_outputs({
            "ecs_log_group_name": self.ecs_log_group.name,
            "rds_log_group_name": self.rds_log_group.name
        })
