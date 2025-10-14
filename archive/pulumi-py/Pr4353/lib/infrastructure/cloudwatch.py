"""
CloudWatch module for EC2 failure recovery infrastructure.
Manages log groups and retention policies.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class CloudWatchStack:
    """CloudWatch resources for EC2 recovery logging."""
    
    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.log_group = self._create_log_group()
        self.log_stream = self._create_log_stream()
    
    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for Lambda function."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.LogGroup(
            f"{self.config.get_tag_name('lambda-log-group')}-{random_suffix}",
            name=self.config.cloudwatch_log_group_name,
            retention_in_days=30,
            tags={
                "Name": self.config.get_tag_name("lambda-log-group"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-Logs"
            }
        )
    
    def _create_log_stream(self) -> aws.cloudwatch.LogStream:
        """Create CloudWatch log stream for Lambda function."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.LogStream(
            f"{self.config.get_tag_name('lambda-log-stream')}-{random_suffix}",
            name=f"{self.config.lambda_function_name}-stream",
            log_group_name=self.log_group.name
        )
    
    def get_log_group_name(self) -> pulumi.Output[str]:
        """Get the CloudWatch log group name."""
        return self.log_group.name
    
    def get_log_group_arn(self) -> pulumi.Output[str]:
        """Get the CloudWatch log group ARN."""
        return self.log_group.arn
