"""
CloudWatch Events module for EC2 failure recovery infrastructure.
Manages event rules and triggers for monitoring.
"""
import json
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class CloudWatchEventsStack:
    """CloudWatch Events resources for EC2 recovery monitoring."""
    
    def __init__(self, config: EC2RecoveryConfig, lambda_function_arn: pulumi.Output[str]):
        self.config = config
        self.lambda_function_arn = lambda_function_arn
        self.event_rule = self._create_event_rule()
        self.lambda_permission = self._create_lambda_permission()
        self.event_target = self._create_event_target()
    
    def _create_event_rule(self) -> aws.cloudwatch.EventRule:
        """Create CloudWatch Events rule for monitoring."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.EventRule(
            f"{self.config.get_tag_name('event-rule')}-{random_suffix}",
            name=self.config.event_rule_name,
            description="Trigger EC2 recovery monitoring every 10 minutes",
            schedule_expression=f"rate({self.config.monitoring_interval_minutes} minutes)",
            tags={
                "Name": self.config.get_tag_name("event-rule"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-Monitoring"
            }
        )
    
    def _create_lambda_permission(self) -> aws.lambda_.Permission:
        """Create Lambda permission for CloudWatch Events."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.lambda_.Permission(
            f"{self.config.get_tag_name('lambda-permission')}-{random_suffix}",
            statement_id="AllowExecutionFromCloudWatch",
            action="lambda:InvokeFunction",
            function=self.lambda_function_arn,
            principal="events.amazonaws.com",
            source_arn=self.event_rule.arn
        )
    
    def _create_event_target(self) -> aws.cloudwatch.EventTarget:
        """Create CloudWatch Events target for Lambda function."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.EventTarget(
            f"{self.config.get_tag_name('event-target')}-{random_suffix}",
            rule=self.event_rule.name,
            target_id="EC2RecoveryTarget",
            arn=self.lambda_function_arn,
            input=json.dumps({
                "source": "ec2-recovery-monitoring",
                "timestamp": "{{.Timestamp}}"
            })
        )
    
    def get_event_rule_arn(self) -> pulumi.Output[str]:
        """Get the CloudWatch Events rule ARN."""
        return self.event_rule.arn
    
    def get_event_rule_name(self) -> pulumi.Output[str]:
        """Get the CloudWatch Events rule name."""
        return self.event_rule.name
