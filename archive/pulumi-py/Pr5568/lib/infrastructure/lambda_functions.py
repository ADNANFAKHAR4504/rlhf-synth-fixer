"""
Lambda Functions module.

This module creates Lambda functions with proper DLQ attachment,
X-Ray tracing, sizing, and concurrency limits.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .secrets import SecretsStack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions.
    
    Creates Lambda functions with proper DLQ attachment, X-Ray tracing,
    sizing, concurrency, and CloudWatch Logs retention.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack,
        secrets_stack: SecretsStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
            secrets_stack: SecretsStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.secrets_stack = secrets_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        
        self._create_user_service()
        self._create_order_service()
        self._create_product_service()
    
    def _get_lambda_code_path(self) -> str:
        """Get the path to Lambda function code directory."""
        current_dir = os.path.dirname(__file__)
        return os.path.join(current_dir, 'lambda_code')
    
    def _create_user_service(self):
        """Create user service Lambda function."""
        function_name = 'user-service'
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('users')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('user-service')],
            kms_key_arns=[self.kms_stack.get_key_arn('data')],
            secrets_arns=[self.secrets_stack.get_secret_arn('api')],
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f"/aws/lambda/{resource_name}"
        
        opts = self.provider_manager.get_resource_options()
        
        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            kms_key_id=self.kms_stack.get_key_arn('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.log_groups[function_name] = log_group
        
        code_path = self._get_lambda_code_path()
        
        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[role, log_group]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[role, log_group]
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='user_service.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'USERS_TABLE_NAME': self.dynamodb_stack.get_table_name('users'),
                    'API_SECRET_ARN': self.secrets_stack.get_secret_arn('api')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_queue_arn('user-service')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=opts_with_deps
        )
        
        self.functions[function_name] = function
    
    def _create_order_service(self):
        """Create order service Lambda function."""
        function_name = 'order-service'
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('orders')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('order-service')],
            kms_key_arns=[self.kms_stack.get_key_arn('data')],
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f"/aws/lambda/{resource_name}"
        
        opts = self.provider_manager.get_resource_options()
        
        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            kms_key_id=self.kms_stack.get_key_arn('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.log_groups[function_name] = log_group
        
        code_path = self._get_lambda_code_path()
        
        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[role, log_group]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[role, log_group]
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='order_service.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'ORDERS_TABLE_NAME': self.dynamodb_stack.get_table_name('orders')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_queue_arn('order-service')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=opts_with_deps
        )
        
        self.functions[function_name] = function
    
    def _create_product_service(self):
        """Create product service Lambda function."""
        function_name = 'product-service'
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('products')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('product-service')],
            kms_key_arns=[self.kms_stack.get_key_arn('data')],
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f"/aws/lambda/{resource_name}"
        
        opts = self.provider_manager.get_resource_options()
        
        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            kms_key_id=self.kms_stack.get_key_arn('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.log_groups[function_name] = log_group
        
        code_path = self._get_lambda_code_path()
        
        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[role, log_group]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[role, log_group]
        )
        

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='product_service.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'PRODUCTS_TABLE_NAME': self.dynamodb_stack.get_table_name('products')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_queue_arn('product-service')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=opts_with_deps
        )
        
        self.functions[function_name] = function
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """
        Get a Lambda function by name.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Lambda Function resource
        """
        return self.functions.get(function_name)
    
    def get_function_name(self, function_name: str) -> pulumi.Output[str]:
        """
        Get the name of a Lambda function.
        
        Args:
            function_name: Key of the function
            
        Returns:
            Function name as Output
        """
        function = self.get_function(function_name)
        return function.name if function else None
    
    def get_function_arn(self, function_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a Lambda function.
        
        Args:
            function_name: Key of the function
            
        Returns:
            Function ARN as Output
        """
        function = self.get_function(function_name)
        return function.arn if function else None
    
    def get_log_group_name(self, function_name: str) -> pulumi.Output[str]:
        """
        Get the CloudWatch log group name for a function.
        
        Args:
            function_name: Key of the function
            
        Returns:
            Log group name as Output
        """
        log_group = self.log_groups.get(function_name)
        return log_group.name if log_group else None

