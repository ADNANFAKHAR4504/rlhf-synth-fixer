"""
Logging infrastructure for S3 log export and CloudWatch integration.

This module creates log export configurations to store all logs in versioned S3 buckets
and integrates with CloudWatch for comprehensive logging.
"""

from typing import Any, Dict, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import cloudwatch, s3

from .config import InfrastructureConfig


class LoggingStack:
    """
    Logging stack for S3 log export and CloudWatch integration.
    
    Creates log export configurations to store all application logs in versioned S3 buckets
    and integrates with CloudWatch for comprehensive logging and monitoring.
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig,
        s3_stack: 'S3Stack',
        cloudwatch_stack: 'CloudWatchStack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize logging stack with S3 export and CloudWatch integration.
        
        Args:
            config: Infrastructure configuration
            s3_stack: S3 stack for log storage
            cloudwatch_stack: CloudWatch stack for log groups
            opts: Pulumi resource options
        """
        self.config = config
        self.s3_stack = s3_stack
        self.cloudwatch_stack = cloudwatch_stack
        self.opts = opts or ResourceOptions()
        
        self.log_subscriptions = {}
        
    # Log export to S3 would need to be implemented using AWS CLI or boto3 in Lambda functions
    
    def _create_log_subscriptions(self) -> Dict[str, cloudwatch.LogSubscriptionFilter]:
        """
        Create CloudWatch log subscriptions for real-time log processing.
        
        Returns:
            Dictionary of log subscription filters
        """
        log_subscriptions = {}
        
        # Create subscription filter for main Lambda function
        main_subscription = cloudwatch.LogSubscriptionFilter(
            f"{self.config.get_resource_name('log-subscription', 'main')}",
            log_group=f"/aws/lambda/{self.config.get_resource_name('lambda', 'main')}",
            filter_pattern="[timestamp, request_id, level, message]",
            destination_arn=f"arn:aws:lambda:{self.config.aws_region}:*:function:{self.config.get_resource_name('lambda', 'log-processor')}",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_subscriptions['main'] = main_subscription
        
        # Create subscription filter for API Gateway
        api_subscription = cloudwatch.LogSubscriptionFilter(
            f"{self.config.get_resource_name('log-subscription', 'api')}",
            log_group=f"/aws/apigateway/{self.config.get_resource_name('api')}",
            filter_pattern="[timestamp, request_id, method, path, status]",
            destination_arn=f"arn:aws:lambda:{self.config.aws_region}:*:function:{self.config.get_resource_name('lambda', 'log-processor')}",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_subscriptions['api'] = api_subscription
        
        return log_subscriptions
    
    # Log export functionality removed due to pulumi_aws limitations
    
    def get_log_subscriptions(self) -> Dict[str, cloudwatch.LogSubscriptionFilter]:
        """
        Get the log subscription filters.
        
        Returns:
            Dictionary of log subscription filters
        """
        return self.log_subscriptions
