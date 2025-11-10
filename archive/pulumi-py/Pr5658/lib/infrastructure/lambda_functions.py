"""
Lambda Functions module for the CI/CD pipeline.

This module creates Lambda functions with proper IAM roles, environment variables,
VPC configuration, DLQ, X-Ray tracing, and retry configuration.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig
from .iam import IAMStack
from .storage import StorageStack
from .vpc import VPCStack


class LambdaStack:
    """
    Manages Lambda functions for the CI/CD pipeline.
    
    Creates Lambda functions with proper configuration including VPC,
    DLQ, X-Ray tracing, and retry policies.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        vpc_stack: VPCStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            storage_stack: StorageStack instance
            vpc_stack: VPCStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.vpc_stack = vpc_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}
        
        self._create_pipeline_function()
    
    def _create_dlq(self, function_name: str) -> aws.sqs.Queue:
        """Create dead letter queue for Lambda function."""
        queue_name = self.config.get_resource_name(f'{function_name}-dlq')
        
        dlq = aws.sqs.Queue(
            f'{function_name}-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            tags={
                **self.config.get_common_tags(),
                'Name': queue_name,
                'Purpose': 'Lambda DLQ'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.dlqs[function_name] = dlq
        return dlq
    
    def _create_pipeline_function(self):
        """Create pipeline Lambda function."""
        function_name = 'pipeline-handler'
        
        dlq = self._create_dlq(function_name)
        
        log_group_arn = Output.concat(
            f'arn:aws:logs:{self.config.primary_region}:',
            aws.get_caller_identity().account_id,
            f':log-group:/aws/lambda/{self.config.get_resource_name(function_name)}'
        )
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group_arn,
            s3_bucket_arns=[
                self.storage_stack.get_bucket_arn('logs'),
                self.storage_stack.get_bucket_arn('artifacts')
            ],
            kms_key_arns=[self.storage_stack.get_kms_key_arn('s3')],
            dlq_arn=dlq.arn,
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        code_path = os.path.join(os.path.dirname(__file__), 'lambda_code')
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='handler.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': self.config.environment,
                    'LOG_BUCKET': self.storage_stack.get_bucket_name('logs'),
                    'ARTIFACT_BUCKET': self.storage_stack.get_bucket_name('artifacts')
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=self.vpc_stack.get_private_subnet_ids(),
                security_group_ids=[self.vpc_stack.get_lambda_security_group_id()]
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=dlq.arn
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-config',
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retry_attempts,
            maximum_event_age_in_seconds=21600,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn
                )
            ),
            opts=self.provider_manager.get_resource_options()
        )
        
        self.functions[function_name] = function
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions.get(function_name)
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        function = self.functions.get(function_name)
        return function.name if function else Output.from_input('')
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        function = self.functions.get(function_name)
        return function.arn if function else Output.from_input('')
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        function = self.functions.get(function_name)
        return function.invoke_arn if function else Output.from_input('')
    
    def get_dlq_url(self, function_name: str) -> Output[str]:
        """Get DLQ URL."""
        dlq = self.dlqs.get(function_name)
        return dlq.url if dlq else Output.from_input('')
    
    def get_dlq_arn(self, function_name: str) -> Output[str]:
        """Get DLQ ARN."""
        dlq = self.dlqs.get(function_name)
        return dlq.arn if dlq else Output.from_input('')

