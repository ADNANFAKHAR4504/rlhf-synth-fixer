"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the file upload system infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager,
                             DynamoDBStack, FileUploadConfig, IAMStack,
                             KMSStack, LambdaStack, MonitoringStack, S3Stack,
                             SQSStack, StepFunctionsStack)


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
    Represents the main Pulumi component resource for the file upload system.
    
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
        
        self.config = FileUploadConfig()
        
        self.provider_manager = AWSProviderManager(self.config)
        
        self.kms_stack = KMSStack(self.config, self.provider_manager)
        
        self.s3_stack = S3Stack(
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
        
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.s3_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.kms_stack,
            self.monitoring_stack.get_sns_topic_arn()
        )
        
        self.monitoring_stack._create_lambda_alarms_for_stack(self.lambda_stack)
        self.monitoring_stack._create_dashboard_for_stack(self.lambda_stack)
        
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
        
        self._register_outputs()
    
    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}
        
        outputs['primary_region'] = self.config.primary_region
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        
        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()
        
        outputs['uploads_bucket_name'] = self.s3_stack.get_bucket_name('uploads')
        outputs['uploads_bucket_arn'] = self.s3_stack.get_bucket_arn('uploads')
        
        outputs['file_metadata_table_name'] = self.dynamodb_stack.get_table_name('file-metadata')
        outputs['file_metadata_table_arn'] = self.dynamodb_stack.get_table_arn('file-metadata')
        
        outputs['file_processor_function_name'] = self.lambda_stack.get_function_name('file-processor')
        outputs['file_processor_function_arn'] = self.lambda_stack.get_function_arn('file-processor')
        outputs['file_processor_log_group'] = self.lambda_stack.get_log_group_name('file-processor')
        
        outputs['file_processor_dlq_url'] = self.sqs_stack.get_queue_url('file-processor-dlq')
        outputs['file_processor_dlq_arn'] = self.sqs_stack.get_queue_arn('file-processor-dlq')
        
        outputs['file_workflow_arn'] = self.step_functions_stack.get_state_machine_arn('file-workflow')
        
        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()
        
        outputs['s3_kms_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['s3_kms_key_arn'] = self.kms_stack.get_key_arn('s3')
        outputs['dynamodb_kms_key_id'] = self.kms_stack.get_key_id('dynamodb')
        outputs['dynamodb_kms_key_arn'] = self.kms_stack.get_key_arn('dynamodb')
        
        self.register_outputs(outputs)
        
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass
