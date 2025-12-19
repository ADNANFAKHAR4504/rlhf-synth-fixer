"""
Lambda functions module for environment migration solution.

This module manages Lambda functions for migration, validation,
and rollback operations.
"""

import os
import shutil
import tempfile
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MigrationConfig


class LambdaStack:
    """
    Manages Lambda functions for migration operations.
    
    Creates Lambda functions with proper IAM roles, environment
    variables, and logging configuration.
    """
    
    def __init__(
        self,
        config: MigrationConfig,
        provider_manager: AWSProviderManager,
        lambda_roles: Dict[str, aws.iam.Role],
        bucket_names: Dict[str, Output[str]],
        parameter_names: Dict[str, Output[str]],
        topic_arns: Dict[str, Output[str]]
    ):
        """
        Initialize Lambda stack.
        
        Args:
            config: Migration configuration
            provider_manager: AWS provider manager
            lambda_roles: IAM roles for Lambda functions by region
            bucket_names: Deployment bucket names by region
            parameter_names: SSM parameter names by region
            topic_arns: SNS topic ARNs by region
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_roles = lambda_roles
        self.bucket_names = bucket_names
        self.parameter_names = parameter_names
        self.topic_arns = topic_arns
        self.functions: Dict[str, aws.lambda_.Function] = {}
        
        # Package Lambda code
        self.code_archive = self._package_lambda_code()
        
        # Create Lambda functions for all regions
        self._create_lambda_functions()
    
    def _package_lambda_code(self) -> pulumi.FileArchive:
        """
        Package Lambda function code.
        
        Returns:
            FileArchive containing Lambda code
        """
        # Get the path to the lambda_code directory
        lambda_code_dir = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )
        
        return pulumi.FileArchive(lambda_code_dir)
    
    def _create_lambda_functions(self):
        """Create Lambda functions in all regions."""
        for region in self.config.all_regions:
            self._create_migration_function(region)
    
    def _create_migration_function(self, region: str):
        """
        Create migration Lambda function for a region.
        
        Args:
            region: AWS region
        """
        function_name = self.config.get_resource_name('migration-function', region)
        provider = self.provider_manager.get_provider(region)
        role = self.lambda_roles[region]
        
        # Build environment variables
        env_vars = {
            'ENVIRONMENT': self.config.environment,
            'ENVIRONMENT_SUFFIX': self.config.environment_suffix,
            'REGION': region,
            'LOG_LEVEL': 'INFO',
            'ENABLE_VALIDATION': str(self.config.enable_validation).lower(),
            'ENABLE_AUTO_ROLLBACK': str(self.config.enable_auto_rollback).lower()
        }
        
        # Add deployment bucket
        if region in self.bucket_names:
            env_vars['DEPLOYMENT_BUCKET'] = self.bucket_names[region]
        
        # Add config parameter
        if region in self.parameter_names:
            env_vars['CONFIG_PARAMETER'] = self.parameter_names[region]
        
        # Add notification topic
        if region in self.topic_arns:
            env_vars['NOTIFICATION_TOPIC'] = self.topic_arns[region]
        
        # Create Lambda function
        function = aws.lambda_.Function(
            function_name,
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler='migration_handler.handler',
            role=role.arn,
            code=self.code_archive,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=env_vars
            ),
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        self.functions[region] = function
    
    def get_function(self, region: str) -> aws.lambda_.Function:
        """
        Get Lambda function for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Lambda function
        """
        return self.functions[region]
    
    def get_function_arn(self, region: str) -> Output[str]:
        """
        Get Lambda function ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Function ARN as Output
        """
        return self.functions[region].arn
    
    def get_function_name(self, region: str) -> Output[str]:
        """
        Get Lambda function name for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Function name as Output
        """
        return self.functions[region].name
    
    def get_function_invoke_arn(self, region: str) -> Output[str]:
        """
        Get Lambda function invoke ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Function invoke ARN as Output
        """
        return self.functions[region].invoke_arn

