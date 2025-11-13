"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the multi-region serverless infrastructure architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager, CICDStack,
                             DynamoDBStack, IAMStack, KMSStack, LambdaStack,
                             MonitoringStack, S3Stack, ServerlessConfig,
                             SQSStack, VPCStack)


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
        
        self.dynamodb_stack = DynamoDBStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.s3_stack = S3Stack(
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
        
        self.vpc_stack = VPCStack(self.config, self.provider_manager)
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.s3_stack,
            self.sqs_stack,
            self.kms_stack,
            self.vpc_stack
        )
        
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack,
            self.dynamodb_stack
        )
        
        self.cicd_stack = CICDStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.s3_stack,
            self.kms_stack
        )
        
        self._register_outputs()
    
    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}
        
        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()
        outputs['api_stage_name'] = self.api_gateway_stack.get_stage_name()
        
        outputs['data_bucket_name'] = self.s3_stack.get_bucket_name('data')
        outputs['pipeline_artifacts_bucket_name'] = self.s3_stack.get_bucket_name('pipeline-artifacts')
        
        outputs['dynamodb_table_name'] = self.dynamodb_stack.get_table_name('data')
        
        outputs['api_handler_function_name'] = self.lambda_stack.get_function_name('api-handler')
        outputs['api_handler_function_arn'] = self.lambda_stack.get_function_arn('api-handler')
        outputs['s3_processor_function_name'] = self.lambda_stack.get_function_name('s3-processor')
        outputs['s3_processor_function_arn'] = self.lambda_stack.get_function_arn('s3-processor')
        
        outputs['api_handler_log_group'] = self.lambda_stack.get_log_group_name('api-handler')
        outputs['s3_processor_log_group'] = self.lambda_stack.get_log_group_name('s3-processor')
        
        outputs['api_handler_dlq_url'] = self.sqs_stack.get_queue_url('api-handler')
        outputs['s3_processor_dlq_url'] = self.sqs_stack.get_queue_url('s3-processor')
        
        outputs['vpc_id'] = self.vpc_stack.get_vpc_id()
        outputs['dynamodb_endpoint_id'] = self.vpc_stack.get_dynamodb_endpoint_id()
        
        outputs['s3_kms_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['s3_kms_key_arn'] = self.kms_stack.get_key_arn('s3')
        outputs['dynamodb_kms_key_id'] = self.kms_stack.get_key_id('dynamodb')
        outputs['dynamodb_kms_key_arn'] = self.kms_stack.get_key_arn('dynamodb')
        
        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()
        
        outputs['codebuild_project_name'] = self.cicd_stack.get_codebuild_project_name()
        
        outputs['primary_region'] = self.config.primary_region
        outputs['secondary_region'] = self.config.secondary_region
        
        self.register_outputs(outputs)
        
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass
