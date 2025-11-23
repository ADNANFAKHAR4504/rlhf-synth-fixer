"""
SQS module for the serverless transaction pipeline.

This module creates SQS queues with proper dead-letter queue configuration.

Addresses Model Failures:
- SQS redrive / DLQ configuration
- SQS target wiring for failed-validations
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig


class SQSStack:
    """
    Manages SQS queues with dead-letter queue configuration.
    
    Creates main queues for each Lambda with proper DLQ redrive policy.
    """
    
    def __init__(self, config: TransactionPipelineConfig, provider_manager: AWSProviderManager):
        """
        Initialize the SQS stack.
        
        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.queues: Dict[str, aws.sqs.Queue] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}
        
        self._create_lambda_queues()
        self._create_failed_validations_queue()
    
    def _create_lambda_queues(self):
        """
        Create queues with DLQs for each Lambda function.
        
        Addresses Failure 3: Proper redrive_policy configuration with maxReceiveCount=3.
        """
        lambda_functions = [
            'transaction-receiver',
            'fraud-validator',
            'audit-logger'
        ]
        
        for function_name in lambda_functions:
            dlq_name = self.config.get_resource_name(f'{function_name}-dlq')
            dlq = aws.sqs.Queue(
                f"{function_name}-dlq",
                name=dlq_name,
                message_retention_seconds=1209600,
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
            self.dlqs[function_name] = dlq
            
            queue_name = self.config.get_resource_name(f'{function_name}-queue')
            
            redrive_policy = dlq.arn.apply(
                lambda arn: json.dumps({
                    "deadLetterTargetArn": arn,
                    "maxReceiveCount": self.config.dlq_max_receive_count
                })
            )
            
            queue = aws.sqs.Queue(
                f"{function_name}-queue",
                name=queue_name,
                visibility_timeout_seconds=self.config.lambda_timeout * 6,
                redrive_policy=redrive_policy,
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    depends_on=[dlq]
                )
            )
            self.queues[function_name] = queue
    
    def _create_failed_validations_queue(self):
        """
        Create queue for failed validations with its own DLQ.
        
        Addresses Failure 7: Proper wiring of failed-validations queue.
        """
        dlq_name = self.config.get_resource_name('failed-validations-dlq')
        dlq = aws.sqs.Queue(
            "failed-validations-dlq",
            name=dlq_name,
            message_retention_seconds=1209600,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.dlqs['failed-validations'] = dlq
        
        queue_name = self.config.get_resource_name('failed-validations-queue')
        
        redrive_policy = dlq.arn.apply(
            lambda arn: json.dumps({
                "deadLetterTargetArn": arn,
                "maxReceiveCount": self.config.dlq_max_receive_count
            })
        )
        
        queue = aws.sqs.Queue(
            "failed-validations-queue",
            name=queue_name,
            visibility_timeout_seconds=self.config.lambda_timeout * 6,
            redrive_policy=redrive_policy,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[dlq]
            )
        )
        self.queues['failed-validations'] = queue
    
    def get_queue(self, queue_name: str) -> aws.sqs.Queue:
        """Get a queue by name."""
        return self.queues[queue_name]
    
    def get_queue_arn(self, queue_name: str) -> Output[str]:
        """Get queue ARN."""
        return self.queues[queue_name].arn
    
    def get_queue_url(self, queue_name: str) -> Output[str]:
        """Get queue URL."""
        return self.queues[queue_name].url
    
    def get_dlq(self, dlq_name: str) -> aws.sqs.Queue:
        """Get a DLQ by name."""
        return self.dlqs[dlq_name]
    
    def get_dlq_arn(self, dlq_name: str) -> Output[str]:
        """Get DLQ ARN."""
        return self.dlqs[dlq_name].arn

