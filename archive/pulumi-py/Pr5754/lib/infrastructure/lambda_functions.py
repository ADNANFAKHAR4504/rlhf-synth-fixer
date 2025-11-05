"""
Lambda functions module for deployment logging.

This module creates Lambda functions for logging deployment events
with proper configuration, DLQ, and X-Ray tracing.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class LambdaStack:
    """
    Manages Lambda functions for deployment logging.
    
    Creates Lambda functions with proper configuration, DLQ,
    X-Ray tracing, and CloudWatch Logs integration.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack,
        monitoring_stack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            monitoring_stack: MonitoringStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.monitoring_stack = monitoring_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}
        
        self._create_deployment_logger()
    
    def _create_deployment_logger(self):
        """Create deployment logger Lambda function."""
        function_name = self.config.get_resource_name('deployment-logger')
        
        log_group = aws.cloudwatch.LogGroup(
            'deployment-logger-log-group',
            name=f'/aws/lambda/{function_name}',
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f'/aws/lambda/{function_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        dlq = aws.sqs.Queue(
            'deployment-logger-dlq',
            name=f'{function_name}-dlq',
            message_retention_seconds=1209600,
            tags={
                **self.config.get_common_tags(),
                'Name': f'{function_name}-dlq'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        sns_topic_arns = [self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')]
        
        role = self.iam_stack.create_lambda_role(
            'deployment-logger',
            log_group.arn,
            sns_topic_arns
        )
        
        lambda_code_dir = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )
        
        function = aws.lambda_.Function(
            'deployment-logger-function',
            name=function_name,
            role=role.arn,
            runtime='python3.11',
            handler='deployment_logger.handler',
            code=pulumi.FileArchive(lambda_code_dir),
            timeout=60,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'PROJECT_NAME': self.config.project_name,
                    'SNS_TOPIC_ARN': self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=dlq.arn
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': function_name
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[log_group, role]
            )
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            'deployment-logger-event-invoke-config',
            function_name=function.name,
            maximum_retry_attempts=2,
            maximum_event_age_in_seconds=3600,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn
                )
            ),
            opts=self.provider_manager.get_resource_options()
        )
        
        Output.all(role.arn, dlq.arn).apply(
            lambda args: aws.iam.RolePolicy(
                'deployment-logger-dlq-policy',
                role=role.id,
                policy=pulumi.Output.json_dumps({
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': [
                            'sqs:SendMessage'
                        ],
                        'Resource': args[1]
                    }]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )
        
        self.functions['deployment-logger'] = function
        self.dlqs['deployment-logger'] = dlq
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions.get(function_name)
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        function = self.functions.get(function_name)
        return function.arn if function else Output.from_input('')
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        function = self.functions.get(function_name)
        return function.name if function else Output.from_input('')

