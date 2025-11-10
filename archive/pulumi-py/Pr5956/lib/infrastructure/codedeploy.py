"""
CodeDeploy module for managing Lambda deployments.

This module creates and configures CodeDeploy applications and deployment
groups for safe canary deployments of Lambda functions.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .monitoring import MonitoringStack


class CodeDeployStack:
    """
    Manages CodeDeploy resources for Lambda deployments.
    
    Creates CodeDeploy applications and deployment groups with
    canary deployment configuration and automatic rollback.
    """
    
    def __init__(
        self,
        config: CICDConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack,
        monitoring_stack: MonitoringStack
    ):
        """
        Initialize the CodeDeploy stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
            monitoring_stack: MonitoringStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.monitoring_stack = monitoring_stack
        self.applications: Dict[str, aws.codedeploy.Application] = {}
        self.deployment_groups: Dict[str, aws.codedeploy.DeploymentGroup] = {}
        
        self._create_deployment_resources()
    
    def _create_deployment_resources(self):
        """Create CodeDeploy application and deployment group."""
        app_name = 'lambda-deploy'
        resource_name = self.config.get_resource_name(app_name)
        
        application = aws.codedeploy.Application(
            app_name,
            name=resource_name,
            compute_platform='Lambda',
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'Lambda deployment'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.applications[app_name] = application
        
        role = self.iam_stack.create_codedeploy_role(app_name)
        
        lambda_function = self.lambda_stack.get_function('deployment')
        lambda_alias = self.lambda_stack.get_alias('deployment')
        
        deployment_group = aws.codedeploy.DeploymentGroup(
            f'{app_name}-group',
            app_name=application.name,
            deployment_group_name=f'{resource_name}-group',
            service_role_arn=role.arn,
            deployment_config_name=self.config.deployment_config_name,
            deployment_style=aws.codedeploy.DeploymentGroupDeploymentStyleArgs(
                deployment_option='WITH_TRAFFIC_CONTROL',
                deployment_type='BLUE_GREEN'
            ),
            auto_rollback_configuration=aws.codedeploy.DeploymentGroupAutoRollbackConfigurationArgs(
                enabled=True,
                events=['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM']
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': f'{resource_name}-group'
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[application, role, lambda_function, lambda_alias]
            )
        )
        
        self.deployment_groups[app_name] = deployment_group
    
    def get_application(self, app_name: str) -> aws.codedeploy.Application:
        """
        Get a CodeDeploy application by name.
        
        Args:
            app_name: Name of the application
            
        Returns:
            CodeDeploy Application resource
        """
        if app_name not in self.applications:
            raise ValueError(f"Application '{app_name}' not found")
        return self.applications[app_name]
    
    def get_application_name(self, app_name: str) -> Output[str]:
        """
        Get the name of a CodeDeploy application.
        
        Args:
            app_name: Name of the application
            
        Returns:
            Application name as Output[str]
        """
        return self.get_application(app_name).name
    
    def get_application_arn(self, app_name: str) -> Output[str]:
        """
        Get the ARN of a CodeDeploy application.
        
        Args:
            app_name: Name of the application
            
        Returns:
            Application ARN as Output[str]
        """
        return self.get_application(app_name).arn
    
    def get_deployment_group(self, app_name: str) -> aws.codedeploy.DeploymentGroup:
        """
        Get a deployment group by application name.
        
        Args:
            app_name: Name of the application
            
        Returns:
            DeploymentGroup resource
        """
        if app_name not in self.deployment_groups:
            raise ValueError(f"Deployment group for '{app_name}' not found")
        return self.deployment_groups[app_name]
    
    def get_deployment_group_name(self, app_name: str) -> Output[str]:
        """
        Get the name of a deployment group.
        
        Args:
            app_name: Name of the application
            
        Returns:
            Deployment group name as Output[str]
        """
        return self.get_deployment_group(app_name).deployment_group_name

