"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the CI/CD pipeline infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.cicd import CICDStack
from infrastructure.config import CICDPipelineConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


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
    Represents the main Pulumi component resource for the CI/CD pipeline.

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

        self.config = CICDPipelineConfig()
        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        self.monitoring_stack = MonitoringStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.monitoring_stack
        )
        self.cicd_stack = CICDStack(
            self.config,
            self.provider_manager,
            self.storage_stack,
            self.iam_stack,
            self.lambda_stack,
            self.monitoring_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['project_name'] = self.config.project_name
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['primary_region'] = self.config.primary_region
        outputs['secondary_region'] = self.config.secondary_region
        outputs['normalized_region'] = self.config.normalized_region

        outputs['artifact_bucket_name'] = self.storage_stack.get_bucket_name('artifacts')
        outputs['artifact_bucket_arn'] = self.storage_stack.get_bucket_arn('artifacts')
        outputs['s3_kms_key_id'] = self.storage_stack.get_kms_key_id('s3')
        outputs['s3_kms_key_arn'] = self.storage_stack.get_kms_key_arn('s3')

        outputs['pipeline_name'] = self.cicd_stack.get_pipeline_name()
        outputs['pipeline_arn'] = self.cicd_stack.get_pipeline_arn()
        outputs['pipeline_url'] = pulumi.Output.concat(
            'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/',
            self.cicd_stack.get_pipeline_name(),
            '/view?region=',
            self.config.primary_region
        )

        outputs['main_build_project_name'] = self.cicd_stack.get_codebuild_project('main-build').name
        outputs['main_build_project_arn'] = self.cicd_stack.get_codebuild_project('main-build').arn
        outputs['security_scan_project_name'] = self.cicd_stack.get_codebuild_project('security-scan').name
        outputs['security_scan_project_arn'] = self.cicd_stack.get_codebuild_project('security-scan').arn

        outputs['deployment_logger_function_name'] = self.lambda_stack.get_function_name('deployment-logger')
        outputs['deployment_logger_function_arn'] = self.lambda_stack.get_function_arn('deployment-logger')
        outputs['deployment_logger_dlq_url'] = self.lambda_stack.dlqs['deployment-logger'].url
        outputs['deployment_logger_dlq_arn'] = self.lambda_stack.dlqs['deployment-logger'].arn

        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')

        outputs['deployment_logger_log_group_name'] = f'/aws/lambda/{self.config.get_resource_name("deployment-logger")}'
        outputs['deployment_logger_log_group_arn'] = f'arn:aws:logs:{self.config.primary_region}:{self.config.account_id}:log-group:/aws/lambda/{self.config.get_resource_name("deployment-logger")}'
        
        outputs['main_build_log_group_name'] = f'/aws/codebuild/{self.config.get_resource_name("main-build")}'
        outputs['security_scan_log_group_name'] = f'/aws/codebuild/{self.config.get_resource_name("security-scan")}'

        outputs['codepipeline_role_arn'] = self.iam_stack.get_role_arn('codepipeline')
        outputs['main_build_codebuild_role_arn'] = self.iam_stack.get_role_arn('main-build-codebuild')
        outputs['security_scan_codebuild_role_arn'] = self.iam_stack.get_role_arn('security-scan-codebuild')
        outputs['deployment_logger_lambda_role_arn'] = self.iam_stack.get_role_arn('deployment-logger-lambda')
        
        outputs['secondary_artifact_bucket_name'] = self.cicd_stack.secondary_artifact_bucket.id
        outputs['secondary_artifact_bucket_arn'] = self.cicd_stack.secondary_artifact_bucket.arn

        self.register_outputs(outputs)

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass
