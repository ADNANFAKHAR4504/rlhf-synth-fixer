"""
SQS module for dead letter queue configuration.

This module creates SQS dead letter queues for Lambda functions
in the financial data processing pipeline.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class SQSStack:
    """
    Manages SQS queues for the financial data pipeline.
    
    Creates dead letter queues for Lambda error handling.
    """
    
    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the SQS stack.
        
        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.dlqs = {}
        
        self._create_dlqs()
    
    def _create_dlqs(self):
        """Create dead letter queues for Lambda functions."""
        function_names = ['upload', 'status', 'results', 'processor']
        
        for function_name in function_names:
            dlq_name = self.config.get_resource_name(f'{function_name}-dlq')
            
            dlq = aws.sqs.Queue(
                f"{function_name}-dlq",
                name=dlq_name,
                message_retention_seconds=1209600,
                tags=self.config.get_common_tags(),
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
            
            self.dlqs[function_name] = dlq
    
    def get_dlq_arn(self, function_name: str) -> Output[str]:
        """
        Get DLQ ARN for a specific function.
        
        Args:
            function_name: Name of the function
        
        Returns:
            DLQ ARN
        """
        return self.dlqs[function_name].arn
    
    def get_dlq_url(self, function_name: str) -> Output[str]:
        """
        Get DLQ URL for a specific function.
        
        Args:
            function_name: Name of the function
        
        Returns:
            DLQ URL
        """
        return self.dlqs[function_name].url




