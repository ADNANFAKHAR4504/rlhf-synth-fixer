"""
CloudWatch Monitoring module for the serverless transaction pipeline.

This module creates CloudWatch Log Groups for Lambda functions with proper
retention policies.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the transaction pipeline.
    
    Creates log groups for Lambda functions with retention policies.
    """
    
    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the Monitoring stack.
        
        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        
        self._create_log_groups()
    
    def _create_log_groups(self):
        """Create CloudWatch Log Groups for all Lambda functions."""
        for function_name in self.lambda_stack.get_all_function_names():
            log_group_name = self.lambda_stack.get_function_name(function_name).apply(
                lambda name: f"/aws/lambda/{name}"
            )
            
            log_group = aws.cloudwatch.LogGroup(
                f"{function_name}-log-group",
                name=log_group_name,
                retention_in_days=self.config.log_retention_days,
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
            
            self.log_groups[function_name] = log_group
    
    def get_log_group(self, function_name: str) -> aws.cloudwatch.LogGroup:
        """Get a log group by function name."""
        return self.log_groups[function_name]
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get log group name."""
        return self.log_groups[function_name].name
    
    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """Get log group ARN."""
        return self.log_groups[function_name].arn

