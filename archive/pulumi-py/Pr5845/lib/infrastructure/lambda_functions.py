"""
Lambda functions module.

This module creates and manages Lambda functions with VPC configuration,
X-Ray tracing, dead letter queues, and proper IAM permissions.
"""

import os
from typing import Dict

import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .s3 import S3Stack
from .sqs import SQSStack
from .vpc import VPCStack


class LambdaStack:
    """Manages Lambda functions with VPC, X-Ray, and DLQ configuration."""
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        s3_stack: S3Stack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack,
        vpc_stack: VPCStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            s3_stack: S3Stack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
            vpc_stack: VPCStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.s3_stack = s3_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.vpc_stack = vpc_stack
        
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        
        self._create_functions()
    
    def _create_functions(self):
        """Create Lambda functions."""
        self.functions['api-handler'] = self._create_function(
            'api-handler',
            'api_handler.py',
            'api_handler.handler'
        )
        
        self.functions['s3-processor'] = self._create_function(
            's3-processor',
            's3_processor.py',
            's3_processor.handler'
        )
        
        self.s3_stack.setup_event_notification(
            'data',
            self.functions['s3-processor'].arn,
            self.functions['s3-processor'].name
        )
    
    def _create_function(
        self,
        function_name: str,
        handler_file: str,
        handler: str
    ) -> aws.lambda_.Function:
        """
        Create a Lambda function with all required configuration.
        
        Args:
            function_name: Name identifier for the function
            handler_file: Handler file name
            handler: Handler function path
            
        Returns:
            Lambda Function resource
        """
        resource_name = self.config.get_resource_name(f'lambda-{function_name}')
        log_group_name = f'/aws/lambda/{resource_name}'
        
        log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{function_name}',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.log_groups[function_name] = log_group
        
        dlq = self.sqs_stack.create_dlq(function_name)
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('data')],
            s3_bucket_arns=[
                self.s3_stack.get_bucket_arn('data'),
                self.s3_stack.get_bucket_arn('pipeline-artifacts')
            ],
            kms_key_arns=[
                self.kms_stack.get_key_arn('s3'),
                self.kms_stack.get_key_arn('dynamodb'),
                self.kms_stack.get_key_arn('sqs')
            ],
            dlq_arn=dlq.arn,
            log_group_arn=log_group.arn
        )
        
        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )
        
        function = aws.lambda_.Function(
            f'lambda-{function_name}',
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler=handler,
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE_NAME': self.dynamodb_stack.get_table_name('data'),
                    'S3_BUCKET_NAME': self.s3_stack.get_bucket_name('data'),
                    'ENVIRONMENT': self.config.environment,
                    'LOG_LEVEL': 'INFO'
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
            opts=self.provider_manager.get_resource_options(depends_on=[role, log_group, dlq])
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            f'lambda-event-config-{function_name}',
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retry_attempts,
            opts=self.provider_manager.get_resource_options(depends_on=[function])
        )
        
        return function
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        return self.functions[function_name].name
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.functions[function_name].arn
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        return self.functions[function_name].invoke_arn
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get CloudWatch log group name."""
        return self.log_groups[function_name].name

