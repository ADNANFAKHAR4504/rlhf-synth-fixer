"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the CI/CD pipeline infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.cicd import CICDStack
from infrastructure.config import CICDPipelineConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.storage import StorageStack
from infrastructure.vpc import VPCStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'pr1234'
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
        self.vpc_stack = VPCStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.vpc_stack
        )
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        self.cicd_stack = CICDStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.lambda_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_id'] = self.api_gateway_stack.get_api_id()
        outputs['api_key_value'] = self.api_gateway_stack.get_api_key_value()

        outputs['lambda_function_name'] = self.lambda_stack.get_function_name('pipeline-handler')
        outputs['lambda_function_arn'] = self.lambda_stack.get_function_arn('pipeline-handler')
        outputs['lambda_dlq_url'] = self.lambda_stack.get_dlq_url('pipeline-handler')
        outputs['lambda_dlq_arn'] = self.lambda_stack.get_dlq_arn('pipeline-handler')

        outputs['log_bucket_name'] = self.storage_stack.get_bucket_name('logs')
        outputs['log_bucket_arn'] = self.storage_stack.get_bucket_arn('logs')
        outputs['artifact_bucket_name'] = self.storage_stack.get_bucket_name('artifacts')
        outputs['artifact_bucket_arn'] = self.storage_stack.get_bucket_arn('artifacts')
        outputs['kms_key_arn'] = self.storage_stack.get_kms_key_arn('s3')

        outputs['vpc_id'] = self.vpc_stack.get_vpc_id()
        outputs['lambda_security_group_id'] = self.vpc_stack.get_lambda_security_group_id()

        outputs['log_group_name'] = self.monitoring_stack.get_log_group_name('pipeline-handler')
        outputs['log_group_arn'] = self.monitoring_stack.get_log_group_arn('pipeline-handler')
        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()

        outputs['codebuild_project_name'] = self.cicd_stack.get_build_project_name('lambda-build')
        outputs['codebuild_project_arn'] = self.cicd_stack.get_build_project_arn('lambda-build')

        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['region'] = self.config.primary_region
        outputs['normalized_region'] = self.config.normalized_region
        outputs['project_name'] = self.config.project_name

        self.register_outputs(outputs)
        
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

    def get_api_url(self) -> Output[str]:
        """Get API Gateway URL."""
        return self.api_gateway_stack.get_api_url()

    def get_lambda_function_arn(self) -> Output[str]:
        """Get Lambda function ARN."""
        return self.lambda_stack.get_function_arn('pipeline-handler')

    def get_lambda_function_name(self) -> Output[str]:
        """Get Lambda function name."""
        return self.lambda_stack.get_function_name('pipeline-handler')

    def get_log_bucket_name(self) -> Output[str]:
        """Get log bucket name."""
        return self.storage_stack.get_bucket_name('logs')

    def get_artifact_bucket_name(self) -> Output[str]:
        """Get artifact bucket name."""
        return self.storage_stack.get_bucket_name('artifacts')
