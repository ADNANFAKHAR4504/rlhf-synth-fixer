"""
EventBridge module for the serverless transaction pipeline.

This module creates EventBridge rules to trigger Lambda functions and route
failed validations to SQS queues.

Addresses Model Failures:
- EventBridge → SQS target missing role_arn
- EventBridge → Lambda target wiring with proper configuration
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .sqs import SQSStack


class EventBridgeStack:
    """
    Manages EventBridge rules for the transaction pipeline.
    
    Creates rules to trigger fraud-validator on transaction events and
    route failed validations to SQS.
    """
    
    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack,
        sqs_stack: SQSStack
    ):
        """
        Initialize the EventBridge stack.
        
        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
            sqs_stack: SQSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.sqs_stack = sqs_stack
        self.rules: Dict[str, aws.cloudwatch.EventRule] = {}
        
        self._create_eventbridge_sqs_role()
        self._create_transaction_received_rule()
        self._create_failed_validation_rule()
    
    def _create_eventbridge_sqs_role(self):
        """
        Create IAM role for EventBridge to send messages to SQS.
        
        Addresses Failure 4: EventBridge → SQS target missing role_arn.
        """
        self.eventbridge_sqs_role = self.iam_stack.create_eventbridge_sqs_role(
            event_bus_arn=f"arn:aws:events:{self.config.primary_region}:*:event-bus/default",
            queue_arns=[self.sqs_stack.get_queue_arn('failed-validations')]
        )
    
    def _create_transaction_received_rule(self):
        """
        Create EventBridge rule to trigger fraud-validator on transaction events.
        
        Addresses Failure 8: EventBridge → Lambda target with proper configuration.
        """
        rule_name = self.config.get_resource_name('transaction-received-rule')
        
        rule = aws.cloudwatch.EventRule(
            "transaction-received-rule",
            name=rule_name,
            description="Trigger fraud-validator when transaction is received",
            event_pattern="""{
                "source": ["transaction.receiver"],
                "detail-type": ["TransactionReceived"]
            }""",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        fraud_validator_function = self.lambda_stack.get_function('fraud-validator')
        
        target = aws.cloudwatch.EventTarget(
            "transaction-received-target",
            rule=rule.name,
            arn=fraud_validator_function.arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[rule, fraud_validator_function]
            )
        )
        
        aws.lambda_.Permission(
            "transaction-received-lambda-permission",
            action="lambda:InvokeFunction",
            function=fraud_validator_function.name,
            principal="events.amazonaws.com",
            source_arn=rule.arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[rule, fraud_validator_function]
            )
        )
        
        self.rules['transaction-received'] = rule
    
    def _create_failed_validation_rule(self):
        """
        Create EventBridge rule to route failed validations to SQS.
        
        Addresses Failure 4: Proper role_arn for EventBridge → SQS.
        """
        rule_name = self.config.get_resource_name('failed-validation-rule')
        
        rule = aws.cloudwatch.EventRule(
            "failed-validation-rule",
            name=rule_name,
            description="Route failed validations to SQS queue",
            event_pattern="""{
                "source": ["fraud.validator"],
                "detail-type": ["ValidationFailed"]
            }""",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        failed_queue = self.sqs_stack.get_queue('failed-validations')
        
        target = aws.cloudwatch.EventTarget(
            "failed-validation-target",
            rule=rule.name,
            arn=failed_queue.arn,
            role_arn=self.eventbridge_sqs_role.arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[rule, failed_queue, self.eventbridge_sqs_role]
            )
        )
        
        aws.sqs.QueuePolicy(
            "failed-validation-queue-policy",
            queue_url=failed_queue.url,
            policy=Output.all(failed_queue.arn, rule.arn).apply(
                lambda args: f"""{{
                    "Version": "2012-10-17",
                    "Statement": [{{
                        "Effect": "Allow",
                        "Principal": {{
                            "Service": "events.amazonaws.com"
                        }},
                        "Action": "sqs:SendMessage",
                        "Resource": "{args[0]}",
                        "Condition": {{
                            "ArnEquals": {{
                                "aws:SourceArn": "{args[1]}"
                            }}
                        }}
                    }}]
                }}"""
            ),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[failed_queue, rule]
            )
        )
        
        self.rules['failed-validation'] = rule
    
    def get_rule(self, rule_name: str) -> aws.cloudwatch.EventRule:
        """Get an EventBridge rule by name."""
        return self.rules[rule_name]
    
    def get_rule_arn(self, rule_name: str) -> Output[str]:
        """Get EventBridge rule ARN."""
        return self.rules[rule_name].arn

