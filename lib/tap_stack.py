"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of networking, security, monitoring, and
automation components for a secure AWS foundation.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions

from .networking_stack import NetworkingStack, NetworkingStackArgs
from .security_stack import SecurityStack, SecurityStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs
from .automation_stack import AutomationStack, AutomationStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
        region (str): AWS region for deployment (default: us-east-2).
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        region: str = "us-east-2"
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.region = region


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of:
    - NetworkingStack: VPC, subnets, NAT instances, route tables
    - SecurityStack: KMS keys, Parameter Store, IAM roles
    - MonitoringStack: VPC Flow Logs, CloudWatch Logs
    - AutomationStack: Lambda functions, EventBridge rules

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
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
        self.region = args.region

        # Create networking infrastructure
        self.networking = NetworkingStack(
            "networking",
            NetworkingStackArgs(
                environment_suffix=self.environment_suffix,
                region=self.region
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create security infrastructure
        self.security = SecurityStack(
            "security",
            SecurityStackArgs(
                environment_suffix=self.environment_suffix
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring infrastructure
        self.monitoring = MonitoringStack(
            "monitoring",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.networking.vpc_id,
                region=self.region
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.networking])
        )

        # Create automation infrastructure
        self.automation = AutomationStack(
            "automation",
            AutomationStackArgs(
                environment_suffix=self.environment_suffix,
                lambda_role_arn=self.security.lambda_role_arn,
                log_group_arn=self.monitoring.log_group.arn,
                kms_key_id=self.security.kms_key_id
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.security, self.monitoring])
        )

        # Register stack outputs for cross-stack references
        self.register_outputs({
            # Networking outputs
            "vpc_id": self.networking.vpc_id,
            "private_subnet_ids": self.networking.private_subnet_ids,
            "nat_instance_ips": self.networking.nat_instance_ips,

            # Security outputs
            "kms_key_id": self.security.kms_key_id,
            "kms_key_arn": self.security.kms_key_arn,
            "parameter_arns": self.security.parameter_arns,

            # Monitoring outputs
            "flow_logs_bucket_name": self.monitoring.flow_logs_bucket_name,
            "log_group_name": self.monitoring.log_group_name,

            # Automation outputs
            "lambda_function_arn": self.automation.lambda_function_arn,
            "event_bus_name": self.automation.event_bus_name
        })
