"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless processor infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager, IAMStack,
                             KMSStack, LambdaStack, MonitoringStack,
                             ServerlessProcessorConfig, StorageStack)


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
    Represents the main Pulumi component resource for the serverless processor infrastructure.
    
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
        
        self.config = ServerlessProcessorConfig()
        
        self.provider_manager = AWSProviderManager(self.config)
        
        self.kms_stack = KMSStack(self.config, self.provider_manager)
        
        self.storage_stack = StorageStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.kms_stack
        )
        
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        
        self._register_outputs()
    
    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}
        
        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()
        outputs['api_gateway_endpoint'] = self.api_gateway_stack.get_api_endpoint()
        
        outputs['processed_data_bucket_name'] = self.storage_stack.get_bucket_name('processed-data')
        outputs['processed_data_bucket_arn'] = self.storage_stack.get_bucket_arn('processed-data')
        
        outputs['processor_function_name'] = self.lambda_stack.get_function_name('processor')
        outputs['processor_function_arn'] = self.lambda_stack.get_function_arn('processor')
        outputs['processor_log_group_name'] = self.lambda_stack.get_log_group_name('processor')
        
        outputs['kms_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['kms_key_arn'] = self.kms_stack.get_key_arn('s3')
        
        outputs['alarms_sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()
        
        self.register_outputs(outputs)
        
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass
