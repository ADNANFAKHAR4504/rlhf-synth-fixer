"""
Lambda functions module for the serverless backend.

This module creates Lambda functions with proper environment variables,
using FunctionEnvironmentArgs correctly, and ensures SSM parameters
are passed properly for runtime retrieval.
"""

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .iam import IAMStack
from .parameter_store import ParameterStoreStack
from .storage import StorageStack


class LambdaStack:
    """
    Manages Lambda functions for the serverless backend.
    
    Creates Lambda functions with:
    - Latest Python runtime (3.11)
    - Proper environment variables using FunctionEnvironmentArgs
    - SSM parameter names (not values) for runtime retrieval
    - Tightly scoped IAM roles
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        parameter_store_stack: ParameterStoreStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            storage_stack: StorageStack instance
            parameter_store_stack: ParameterStoreStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.parameter_store_stack = parameter_store_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        
        # Create Lambda functions
        self._create_users_function()
        self._create_items_function()
    
    def _create_users_function(self):
        """Create the users API Lambda function."""
        function_name = 'users'
        
        # Create IAM role with S3 and SSM access
        role = self.iam_stack.create_lambda_role(
            function_name,
            s3_bucket_arns=[
                self.storage_stack.get_bucket_arn('static'),
                self.storage_stack.get_bucket_arn('uploads')
            ],
            s3_permissions=[
                's3:GetObject',
                's3:ListBucket',
                's3:PutObject',
                's3:DeleteObject'
            ],
            ssm_parameter_arns=[
                self.parameter_store_stack.get_parameter_arn('db_connection_string'),
                self.parameter_store_stack.get_parameter_arn('api_key')
            ]
        )
        
        # Create Lambda function code archive
        code = pulumi.AssetArchive({
            'index.py': pulumi.FileAsset('lib/infrastructure/lambda_code/users_handler.py')
        })
        
        # Build environment variables with SSM parameter names for runtime retrieval
        env_vars = self._build_environment_variables(
            function_name,
            {
                'STATIC_BUCKET': self.storage_stack.get_bucket_name('static'),
                'UPLOADS_BUCKET': self.storage_stack.get_bucket_name('uploads')
            },
            ['db_connection_string', 'api_key']
        )
        
        # Create Lambda function
        resource_name = self.config.get_resource_name(f'function-{function_name}')
        
        function = aws.lambda_.Function(
            f'lambda-{function_name}',
            name=resource_name,
            runtime=self.config.lambda_runtime,
            code=code,
            handler='index.handler',
            role=role.arn,
            environment=env_vars,
            memory_size=self.config.lambda_memory_size,
            timeout=self.config.lambda_timeout,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.functions[function_name] = function
    
    def _create_items_function(self):
        """Create the items API Lambda function."""
        function_name = 'items'
        
        # Create IAM role with S3 and SSM access
        role = self.iam_stack.create_lambda_role(
            function_name,
            s3_bucket_arns=[
                self.storage_stack.get_bucket_arn('static'),
                self.storage_stack.get_bucket_arn('uploads')
            ],
            s3_permissions=[
                's3:GetObject',
                's3:ListBucket',
                's3:PutObject'
            ],
            ssm_parameter_arns=[
                self.parameter_store_stack.get_parameter_arn('db_connection_string')
            ]
        )
        
        # Create Lambda function code archive
        code = pulumi.AssetArchive({
            'index.py': pulumi.FileAsset('lib/infrastructure/lambda_code/items_handler.py')
        })
        
        # Build environment variables
        env_vars = self._build_environment_variables(
            function_name,
            {
                'STATIC_BUCKET': self.storage_stack.get_bucket_name('static'),
                'UPLOADS_BUCKET': self.storage_stack.get_bucket_name('uploads')
            },
            ['db_connection_string']
        )
        
        # Create Lambda function
        resource_name = self.config.get_resource_name(f'function-{function_name}')
        
        function = aws.lambda_.Function(
            f'lambda-{function_name}',
            name=resource_name,
            runtime=self.config.lambda_runtime,
            code=code,
            handler='index.handler',
            role=role.arn,
            environment=env_vars,
            memory_size=self.config.lambda_memory_size,
            timeout=self.config.lambda_timeout,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.functions[function_name] = function
    
    def _build_environment_variables(
        self,
        function_name: str,
        additional_vars: Dict[str, Output[str]],
        ssm_parameters: List[str]
    ) -> aws.lambda_.FunctionEnvironmentArgs:
        """
        Build environment variables for Lambda function.
        
        This uses FunctionEnvironmentArgs correctly and passes SSM parameter
        names (not values) so the Lambda can retrieve them at runtime.
        
        Args:
            function_name: Name of the function
            additional_vars: Additional environment variables
            ssm_parameters: List of SSM parameter names
            
        Returns:
            FunctionEnvironmentArgs with properly structured variables
        """
        # Build environment variables dict
        # FunctionEnvironmentArgs.variables accepts Input[Mapping[str, Input[str]]]
        # This means we can have a dict where each value is an Output
        env_vars = {
            'ENVIRONMENT': self.config.environment,
            'ENVIRONMENT_SUFFIX': self.config.environment_suffix,
            'PROJECT_NAME': self.config.project_name,
            'FUNCTION_NAME': function_name,
            'REGION': self.config.primary_region
        }
        
        # Add SSM parameter names for runtime retrieval
        # The Lambda function will use boto3 to fetch these values at runtime
        for param_name in ssm_parameters:
            param_full_name = self.parameter_store_stack.get_parameter_name(param_name)
            env_key = param_name.upper().replace('-', '_') + '_PARAMETER'
            env_vars[env_key] = param_full_name  # This is an Output[str]
        
        # Add additional variables (S3 bucket names, etc.)
        # These are also Output[str] values
        for key, output_value in additional_vars.items():
            env_vars[key] = output_value
        
        # Return FunctionEnvironmentArgs with dict of mixed plain strings and Outputs
        # Pulumi handles this correctly as Input[Mapping[str, Input[str]]]
        return aws.lambda_.FunctionEnvironmentArgs(
            variables=env_vars
        )
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """
        Get a Lambda function by name.
        
        Args:
            function_name: Function name identifier
            
        Returns:
            Lambda Function resource
        """
        return self.functions[function_name]
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """
        Get Lambda function ARN.
        
        Args:
            function_name: Function name identifier
            
        Returns:
            Function ARN as Output
        """
        return self.functions[function_name].arn
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """
        Get Lambda function name.
        
        Args:
            function_name: Function name identifier
            
        Returns:
            Function name as Output
        """
        return self.functions[function_name].name
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """
        Get Lambda function invoke ARN (for API Gateway).
        
        Args:
            function_name: Function name identifier
            
        Returns:
            Function invoke ARN as Output
        """
        return self.functions[function_name].invoke_arn
    
    def get_all_function_names(self) -> List[str]:
        """
        Get all function name identifiers.
        
        Returns:
            List of function name identifiers
        """
        return list(self.functions.keys())

