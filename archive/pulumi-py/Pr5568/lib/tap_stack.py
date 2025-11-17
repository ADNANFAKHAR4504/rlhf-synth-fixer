"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless infrastructure architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager,
                             CloudFrontStack, DynamoDBStack, IAMStack,
                             KMSStack, LambdaStack, MonitoringStack, S3Stack,
                             SecretsStack, ServerlessConfig, SQSStack,
                             StepFunctionsStack, VPCStack)


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    
    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """
    
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless infrastructure.
    
    This component orchestrates the instantiation of all infrastructure components
    and manages the environment suffix used for naming and configuration.
    
    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """
    
    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}
        
        self.config = ServerlessConfig()
        
        self.provider_manager = AWSProviderManager(self.config)
        
        self.kms_stack = KMSStack(self.config, self.provider_manager)
        
        self.secrets_stack = SecretsStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.dynamodb_stack = DynamoDBStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.sqs_stack = SQSStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        
        self.s3_stack = S3Stack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.cloudfront_stack = CloudFrontStack(
            self.config,
            self.provider_manager,
            self.s3_stack
        )
        
        self.vpc_stack = VPCStack(self.config, self.provider_manager)
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.kms_stack,
            self.secrets_stack
        )
        
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        
        self.step_functions_stack = StepFunctionsStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.lambda_stack
        )
        
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack,
            self.step_functions_stack
        )
        
        self._register_outputs()
    
    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}
        
        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()
        
        outputs['cloudfront_domain_name'] = self.cloudfront_stack.get_distribution_domain_name('content')
        
        outputs['content_bucket_name'] = self.s3_stack.get_bucket_name('content')
        outputs['data_bucket_name'] = self.s3_stack.get_bucket_name('data')
        
        outputs['users_table_name'] = self.dynamodb_stack.get_table_name('users')
        outputs['orders_table_name'] = self.dynamodb_stack.get_table_name('orders')
        outputs['products_table_name'] = self.dynamodb_stack.get_table_name('products')
        
        outputs['user_service_function_name'] = self.lambda_stack.get_function_name('user-service')
        outputs['order_service_function_name'] = self.lambda_stack.get_function_name('order-service')
        outputs['product_service_function_name'] = self.lambda_stack.get_function_name('product-service')
        
        outputs['user_service_log_group'] = self.lambda_stack.get_log_group_name('user-service')
        outputs['order_service_log_group'] = self.lambda_stack.get_log_group_name('order-service')
        outputs['product_service_log_group'] = self.lambda_stack.get_log_group_name('product-service')
        
        outputs['user_service_dlq_url'] = self.sqs_stack.get_queue_url('user-service')
        outputs['order_service_dlq_url'] = self.sqs_stack.get_queue_url('order-service')
        outputs['product_service_dlq_url'] = self.sqs_stack.get_queue_url('product-service')
        
        outputs['order_workflow_arn'] = self.step_functions_stack.get_state_machine_arn('order-workflow')
        
        outputs['vpc_id'] = self.vpc_stack.get_vpc_id()
        outputs['dynamodb_endpoint_id'] = self.vpc_stack.get_dynamodb_endpoint_id()
        
        outputs['kms_key_id'] = self.kms_stack.get_key_id('data')
        outputs['kms_key_arn'] = self.kms_stack.get_key_arn('data')
        
        outputs['api_secret_arn'] = self.secrets_stack.get_secret_arn('api')
        outputs['database_secret_arn'] = self.secrets_stack.get_secret_arn('database')
        
        self.register_outputs(outputs)
        
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass
