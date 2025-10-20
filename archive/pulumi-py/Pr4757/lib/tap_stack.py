"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the AWS environment migration solution.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import MigrationConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.notifications import NotificationsStack
from infrastructure.secrets import SecretsStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the environment migration solution.

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

        # Initialize configuration
        self.config = MigrationConfig()
        
        # Initialize AWS provider manager
        self.provider_manager = AWSProviderManager(self.config)
        
        # Initialize storage stack (S3 buckets)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        
        # Initialize secrets/parameters stack
        self.secrets_stack = SecretsStack(self.config, self.provider_manager)
        
        # Initialize IAM stack
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        
        # Initialize notifications stack
        self.notifications_stack = NotificationsStack(self.config, self.provider_manager)
        
        # Collect data for Lambda stack
        lambda_roles = {}
        bucket_names = {}
        parameter_names = {}
        topic_arns = {}
        
        for region in self.config.all_regions:
            lambda_roles[region] = self.iam_stack.get_lambda_role(region)
            bucket_names[region] = self.storage_stack.get_deployment_bucket_name(region)
            
            # Get parameter or secret names
            if self.config.use_secrets_manager:
                try:
                    parameter_names[region] = self.secrets_stack.get_secret_name(region, 'deployment-config')
                except ValueError:
                    pass
            else:
                try:
                    parameter_names[region] = self.secrets_stack.get_parameter_name(region, 'deployment-config')
                except ValueError:
                    pass
            
            # Get notification topic ARNs
            topic_arn = self.notifications_stack.get_deployment_topic_arn(region)
            if topic_arn:
                topic_arns[region] = topic_arn
        
        # Get Lambda function names for monitoring (need to initialize first)
        lambda_function_names = {}
        
        # Initialize Lambda stack
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            lambda_roles,
            bucket_names,
            parameter_names,
            topic_arns
        )
        
        # Get Lambda function names after creation
        for region in self.config.all_regions:
            lambda_function_names[region] = self.lambda_stack.get_function_name(region)
        
        # Initialize monitoring stack
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            lambda_function_names
        )
        
        # Attach IAM policies to Lambda roles (after monitoring stack is created)
        self._attach_lambda_policies()
        
        # Register outputs
        self._register_outputs()

    def _attach_lambda_policies(self):
        """Attach necessary IAM policies to Lambda execution roles."""
        for region in self.config.all_regions:
            role = self.iam_stack.get_lambda_role(region)
            
            # Attach CloudWatch Logs policy
            log_group_arns = self.monitoring_stack.get_all_log_group_arns(region)
            if log_group_arns:
                self.iam_stack.attach_cloudwatch_logs_policy(role, region, log_group_arns)
            
            # Attach S3 policy
            bucket_arns = [
                self.storage_stack.get_deployment_bucket_arn(region),
                self.storage_stack.get_log_bucket_arn(region)
            ]
            self.iam_stack.attach_s3_policy(role, region, bucket_arns)
            
            # Attach SSM or Secrets Manager policy
            if self.config.use_secrets_manager:
                secret_arns = self.secrets_stack.get_all_secret_arns(region)
                if secret_arns:
                    self.iam_stack.attach_secrets_manager_policy(role, region, secret_arns)
            else:
                parameter_arns = self.secrets_stack.get_all_parameter_arns(region)
                if parameter_arns:
                    self.iam_stack.attach_ssm_policy(role, region, parameter_arns)
            
            # Attach SNS policy
            topic_arns = self.notifications_stack.get_all_topic_arns(region)
            if topic_arns:
                self.iam_stack.attach_sns_publish_policy(role, region, topic_arns)

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}
        
        # Configuration outputs
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['primary_region'] = self.config.primary_region
        outputs['secondary_regions'] = Output.from_input(self.config.secondary_regions)
        
        # Lambda function outputs for all regions
        for region in self.config.all_regions:
            region_key = 'primary' if region == self.config.primary_region else region.replace('-', '_')
            
            outputs[f'lambda_function_arn_{region_key}'] = self.lambda_stack.get_function_arn(region)
            outputs[f'lambda_function_name_{region_key}'] = self.lambda_stack.get_function_name(region)
            outputs[f'lambda_role_arn_{region_key}'] = self.iam_stack.get_lambda_role_arn(region)
        
        # S3 bucket outputs for all regions
        for region in self.config.all_regions:
            region_key = 'primary' if region == self.config.primary_region else region.replace('-', '_')
            
            outputs[f'deployment_bucket_name_{region_key}'] = self.storage_stack.get_deployment_bucket_name(region)
            outputs[f'deployment_bucket_arn_{region_key}'] = self.storage_stack.get_deployment_bucket_arn(region)
            outputs[f'log_bucket_name_{region_key}'] = self.storage_stack.get_log_bucket_name(region)
            outputs[f'log_bucket_arn_{region_key}'] = self.storage_stack.get_log_bucket_arn(region)
        
        # Secrets/Parameters outputs for all regions
        for region in self.config.all_regions:
            region_key = 'primary' if region == self.config.primary_region else region.replace('-', '_')
            
            if self.config.use_secrets_manager:
                try:
                    outputs[f'deployment_config_secret_arn_{region_key}'] = self.secrets_stack.get_secret_arn(region, 'deployment-config')
                except ValueError:
                    pass
            else:
                try:
                    outputs[f'deployment_config_parameter_arn_{region_key}'] = self.secrets_stack.get_parameter_arn(region, 'deployment-config')
                    outputs[f'deployment_config_parameter_name_{region_key}'] = self.secrets_stack.get_parameter_name(region, 'deployment-config')
                except ValueError:
                    pass
        
        # Monitoring outputs for all regions
        for region in self.config.all_regions:
            region_key = 'primary' if region == self.config.primary_region else region.replace('-', '_')
            
            outputs[f'lambda_log_group_name_{region_key}'] = self.monitoring_stack.get_log_group_name(region, 'lambda')
            outputs[f'validation_log_group_name_{region_key}'] = self.monitoring_stack.get_log_group_name(region, 'validation')
            outputs[f'deployment_log_group_name_{region_key}'] = self.monitoring_stack.get_log_group_name(region, 'deployment')
        
        # Notification outputs for all regions (if enabled)
        if self.config.enable_notifications:
            for region in self.config.all_regions:
                region_key = 'primary' if region == self.config.primary_region else region.replace('-', '_')
                
                deployment_topic_arn = self.notifications_stack.get_deployment_topic_arn(region)
                if deployment_topic_arn:
                    outputs[f'deployment_topic_arn_{region_key}'] = deployment_topic_arn
                
                alarm_topic_arn = self.notifications_stack.get_alarm_topic_arn(region)
                if alarm_topic_arn:
                    outputs[f'alarm_topic_arn_{region_key}'] = alarm_topic_arn
        
        # Register component outputs
        self.register_outputs(outputs)
        
        # Export outputs to stack level with error handling for test environments
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception as e:
            # Gracefully handle test environments where pulumi.export may not be available
            pass
