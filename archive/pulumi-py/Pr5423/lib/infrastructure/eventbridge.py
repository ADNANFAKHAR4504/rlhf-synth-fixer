"""
EventBridge module for S3 event rules.

This module creates EventBridge rules that trigger on S3 object creation events,
with proper event patterns and IAM roles for delivery.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .sqs import SQSStack
from .storage import StorageStack


class EventBridgeStack:
    """
    Manages EventBridge rules for S3 events.
    
    Creates rules that:
    - Trigger on S3 object creation events
    - Use correct EventBridge event patterns for S3
    - Include DLQs for failed deliveries
    - Have proper IAM roles for target invocation
    """
    
    def __init__(
        self,
        config: MultiEnvConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack,
        sqs_stack: SQSStack,
        storage_stack: StorageStack
    ):
        """
        Initialize the EventBridge stack.
        
        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
            sqs_stack: SQSStack instance
            storage_stack: StorageStack instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.sqs_stack = sqs_stack
        self.storage_stack = storage_stack
        self.rules: Dict[str, aws.cloudwatch.EventRule] = {}
        
        self._create_s3_event_rule()
    
    def _create_s3_event_rule(self) -> None:
        """Create EventBridge rule for S3 object creation events."""
        rule_name = self.config.get_resource_name('s3-object-created')
        
        bucket_name = self.storage_stack.get_bucket_name('data')
        lambda_arn = self.lambda_stack.get_function_arn('process-data')
        dlq_arn = self.sqs_stack.get_dlq_arn('eventbridge')
        
        event_pattern = bucket_name.apply(lambda name: {
            "source": ["aws.s3"],
            "detail-type": ["Object Created"],
            "detail": {
                "bucket": {
                    "name": [name]
                }
            }
        })
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        self.rules['s3-object-created'] = aws.cloudwatch.EventRule(
            f"{rule_name}-rule",
            name=rule_name,
            description=f"Trigger Lambda on S3 object creation in {self.config.environment}",
            event_pattern=event_pattern.apply(lambda p: pulumi.Output.json_dumps(p)),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        aws.lambda_.Permission(
            f"{rule_name}-lambda-permission",
            action='lambda:InvokeFunction',
            function=self.lambda_stack.get_function('process-data').name,
            principal='events.amazonaws.com',
            source_arn=self.rules['s3-object-created'].arn,
            opts=opts
        )
        
        aws.cloudwatch.EventTarget(
            f"{rule_name}-target",
            rule=self.rules['s3-object-created'].name,
            arn=lambda_arn,
            dead_letter_config=aws.cloudwatch.EventTargetDeadLetterConfigArgs(
                arn=dlq_arn
            ),
            opts=opts
        )
    
    def get_rule(self, name: str = 's3-object-created') -> aws.cloudwatch.EventRule:
        """
        Get EventBridge rule by name.
        
        Args:
            name: Rule name (default: 's3-object-created')
        
        Returns:
            EventRule resource
        """
        return self.rules.get(name)
    
    def get_rule_arn(self, name: str = 's3-object-created') -> Output[str]:
        """
        Get EventBridge rule ARN by name.
        
        Args:
            name: Rule name (default: 's3-object-created')
        
        Returns:
            Rule ARN as Output[str]
        """
        rule = self.get_rule(name)
        return rule.arn if rule else None

