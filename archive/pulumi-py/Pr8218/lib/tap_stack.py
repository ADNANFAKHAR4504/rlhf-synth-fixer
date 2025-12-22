"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of compliance scanning components.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from lib.config_stack import ConfigStack
from lib.compliance_stack import ComplianceStack
from lib.monitoring_stack import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of compliance scanning components.

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

        # Create monitoring infrastructure (SNS, DynamoDB, S3)
        self.monitoring_stack = MonitoringStack(
            name=f"monitoring-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            opts=ResourceOptions(parent=self)
        )

        # Create compliance Lambda functions
        self.compliance_stack = ComplianceStack(
            name=f"compliance-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            sns_topic_arn=self.monitoring_stack.sns_topic.arn,
            dynamodb_table_name=self.monitoring_stack.dynamodb_table.name,
            reports_bucket_name=self.monitoring_stack.reports_bucket.id,
            opts=ResourceOptions(parent=self, depends_on=[self.monitoring_stack])
        )

        # Create AWS Config setup
        self.config_stack = ConfigStack(
            name=f"config-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            config_bucket_name=self.monitoring_stack.config_bucket.id,
            compliance_rules=self.compliance_stack.compliance_rule_lambdas,
            opts=ResourceOptions(parent=self, depends_on=[self.compliance_stack])
        )

        # Register outputs
        outputs = {
            'dynamodb_table_name': self.monitoring_stack.dynamodb_table.name,
            'sns_topic_arn': self.monitoring_stack.sns_topic.arn,
            'reports_bucket_name': self.monitoring_stack.reports_bucket.id,
        }
        # Only include config_recorder_name if it was created
        if self.config_stack.config_recorder:
            outputs['config_recorder_name'] = self.config_stack.config_recorder.name
        self.register_outputs(outputs)
