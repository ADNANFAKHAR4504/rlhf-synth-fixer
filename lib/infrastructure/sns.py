"""
SNS module for the serverless infrastructure.

This module creates SNS topics for critical alert notifications.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class SNSStack:
    """
    SNS stack for critical alert notifications.
    
    Creates SNS topics for:
    - Critical alerts
    - Error notifications
    - Compliance violations
    """
    
    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize the SNS stack.
        
        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()
        
        # Create critical alerts topic
        self.critical_topic = self._create_critical_topic()
        
        # Create error notifications topic
        self.error_topic = self._create_error_topic()
        
        # Create compliance topic
        self.compliance_topic = self._create_compliance_topic()
    
    def _create_critical_topic(self):
        """Create SNS topic for critical alerts."""
        topic_name = f"{self.config.get_resource_name('sns-topic', 'critical-alerts')}-{self.config.environment}"
        
        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return topic
    
    def _create_error_topic(self):
        """Create SNS topic for error notifications."""
        topic_name = f"{self.config.get_resource_name('sns-topic', 'error-notifications')}-{self.config.environment}"
        
        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return topic
    
    def _create_compliance_topic(self):
        """Create SNS topic for compliance violations."""
        topic_name = f"{self.config.get_resource_name('sns-topic', 'compliance-violations')}-{self.config.environment}"
        
        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return topic
    
    def get_critical_topic_arn(self) -> pulumi.Output[str]:
        """Get critical alerts topic ARN."""
        return self.critical_topic.arn
    
    def get_error_topic_arn(self) -> pulumi.Output[str]:
        """Get error notifications topic ARN."""
        return self.error_topic.arn
    
    def get_compliance_topic_arn(self) -> pulumi.Output[str]:
        """Get compliance violations topic ARN."""
        return self.compliance_topic.arn
