"""
SQS module for managing queues and dead-letter queues.

This module creates SQS queues for async processing with their own DLQs
and KMS encryption.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .kms import KMSStack


class SQSStack:
    """Manages SQS queues and dead-letter queues."""
    
    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the SQS stack.
        
        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues: Dict[str, aws.sqs.Queue] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}
        
        self._create_queues()
    
    def _create_queues(self):
        """Create SQS queues."""
        self._create_queue_with_dlq('analytics', 'Analytics processing queue')
        self._create_queue_with_dlq('reporting', 'Reporting processing queue')
        
        self._create_lambda_dlqs()
    
    def _create_queue_with_dlq(self, queue_name: str, description: str):
        """
        Create an SQS queue with its own DLQ.
        
        Args:
            queue_name: Name identifier for the queue
            description: Description of the queue's purpose
        """
        dlq_resource_name = self.config.get_resource_name(f'{queue_name}-dlq')
        queue_resource_name = self.config.get_resource_name(f'{queue_name}-queue')
        
        dlq = aws.sqs.Queue(
            f'{queue_name}-dlq',
            name=dlq_resource_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('sqs'),
            tags={
                **self.config.get_common_tags(),
                'Name': dlq_resource_name,
                'Description': f'DLQ for {description}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        queue = aws.sqs.Queue(
            f'{queue_name}-queue',
            name=queue_resource_name,
            visibility_timeout_seconds=300,
            message_retention_seconds=86400,
            kms_master_key_id=self.kms_stack.get_key_id('sqs'),
            redrive_policy=dlq.arn.apply(
                lambda arn: f'{{"deadLetterTargetArn":"{arn}","maxReceiveCount":{self.config.dlq_max_receive_count}}}'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': queue_resource_name,
                'Description': description
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.queues[queue_name] = queue
        self.dlqs[f'{queue_name}-dlq'] = dlq
    
    def _create_lambda_dlqs(self):
        """Create DLQs for Lambda functions."""
        lambda_functions = [
            'transaction-validator',
            'notification-handler',
            'analytics-processor',
            'reporting-processor'
        ]
        
        for func_name in lambda_functions:
            dlq_resource_name = self.config.get_resource_name(f'{func_name}-dlq')
            
            dlq = aws.sqs.Queue(
                f'{func_name}-lambda-dlq',
                name=dlq_resource_name,
                message_retention_seconds=1209600,
                kms_master_key_id=self.kms_stack.get_key_id('sqs'),
                tags={
                    **self.config.get_common_tags(),
                    'Name': dlq_resource_name,
                    'Description': f'DLQ for {func_name} Lambda function'
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            self.dlqs[f'{func_name}-lambda'] = dlq
    
    def get_queue_url(self, queue_name: str) -> Output[str]:
        """Get SQS queue URL."""
        return self.queues[queue_name].url
    
    def get_queue_arn(self, queue_name: str) -> Output[str]:
        """Get SQS queue ARN."""
        return self.queues[queue_name].arn
    
    def get_dlq_url(self, dlq_name: str) -> Output[str]:
        """Get DLQ URL."""
        return self.dlqs[dlq_name].url
    
    def get_dlq_arn(self, dlq_name: str) -> Output[str]:
        """Get DLQ ARN."""
        return self.dlqs[dlq_name].arn
