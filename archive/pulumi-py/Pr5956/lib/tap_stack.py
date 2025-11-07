"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the CI/CD pipeline infrastructure architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (AWSProviderManager, CICDConfig, CodeBuildStack,
                             CodeDeployStack, CodePipelineStack,
                             EventBridgeStack, IAMStack, KMSStack, LambdaStack,
                             MonitoringStack, S3Stack)


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
    Represents the main Pulumi component resource for the CI/CD pipeline infrastructure.
    
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
        
        self.config = CICDConfig()
        
        self.provider_manager = AWSProviderManager(self.config)
        
        self.kms_stack = KMSStack(self.config, self.provider_manager)
        
        self.s3_stack = S3Stack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.kms_stack
        )
        
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.monitoring_stack.create_lambda_alarm(
            'deployment',
            self.lambda_stack.get_function_name('deployment')
        )
        
        self.codebuild_stack = CodeBuildStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.s3_stack,
            self.lambda_stack,
            self.kms_stack
        )
        
        self.codedeploy_stack = CodeDeployStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.lambda_stack,
            self.monitoring_stack
        )
        
        self.codepipeline_stack = CodePipelineStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.s3_stack,
            self.codebuild_stack,
            self.codedeploy_stack,
            self.kms_stack
        )
        
        self.monitoring_stack.create_pipeline_alarm(
            self.codepipeline_stack.get_pipeline_name('main')
        )
        
        self.eventbridge_stack = EventBridgeStack(
            self.config,
            self.provider_manager,
            self.s3_stack
        )
        
        pipeline_arn = self.codepipeline_stack.get_pipeline_arn('main')
        pipeline_role_arn = self.iam_stack.get_role('main-codepipeline').arn
        
        self.eventbridge_stack.create_s3_trigger_rule(
            pipeline_arn,
            pipeline_role_arn
        )
        
        self.s3_stack.enable_eventbridge_notifications('source')
        
        self._register_outputs()
        
        self.register_outputs({})
    
    def _register_outputs(self):
        """Register all stack outputs for integration testing."""
        try:
            pulumi.export('region', self.config.primary_region)
            pulumi.export('environment', self.config.environment)
            pulumi.export('environment_suffix', self.config.environment_suffix)
            
            pulumi.export('source_bucket_name', self.s3_stack.get_bucket_name('source'))
            pulumi.export('source_bucket_arn', self.s3_stack.get_bucket_arn('source'))
            
            pulumi.export('artifacts_bucket_name', self.s3_stack.get_bucket_name('artifacts'))
            pulumi.export('artifacts_bucket_arn', self.s3_stack.get_bucket_arn('artifacts'))
            
            pulumi.export('lambda_function_name', self.lambda_stack.get_function_name('deployment'))
            pulumi.export('lambda_function_arn', self.lambda_stack.get_function_arn('deployment'))
            pulumi.export('lambda_alias_name', self.lambda_stack.get_alias('deployment').name)
            pulumi.export('lambda_log_group_name', self.lambda_stack.get_log_group_name('deployment'))
            
            pulumi.export('build_project_name', self.codebuild_stack.get_project_name('build'))
            pulumi.export('build_project_arn', self.codebuild_stack.get_project_arn('build'))
            
            pulumi.export('test_project_name', self.codebuild_stack.get_project_name('test'))
            pulumi.export('test_project_arn', self.codebuild_stack.get_project_arn('test'))
            
            pulumi.export('codedeploy_app_name', self.codedeploy_stack.get_application_name('lambda-deploy'))
            pulumi.export('codedeploy_app_arn', self.codedeploy_stack.get_application_arn('lambda-deploy'))
            pulumi.export('codedeploy_group_name', self.codedeploy_stack.get_deployment_group_name('lambda-deploy'))
            
            pulumi.export('pipeline_name', self.codepipeline_stack.get_pipeline_name('main'))
            pulumi.export('pipeline_arn', self.codepipeline_stack.get_pipeline_arn('main'))
            
            pulumi.export('sns_topic_arn', self.monitoring_stack.get_sns_topic_arn('notifications'))
            
            pulumi.export('lambda_kms_key_id', self.kms_stack.get_key_id('lambda'))
            pulumi.export('lambda_kms_key_arn', self.kms_stack.get_key_arn('lambda'))
            
            pulumi.export('s3_kms_key_id', self.kms_stack.get_key_id('s3'))
            pulumi.export('s3_kms_key_arn', self.kms_stack.get_key_arn('s3'))
            
            pulumi.export('sns_kms_key_id', self.kms_stack.get_key_id('sns'))
            pulumi.export('sns_kms_key_arn', self.kms_stack.get_key_arn('sns'))
            
        except Exception as e:
            pulumi.log.warn(f"Failed to export some outputs: {e}")
