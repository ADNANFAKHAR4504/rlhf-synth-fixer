"""
SSM Parameter Store module for secure configuration management.

This module handles creation and management of SSM parameters for
sensitive configuration and credentials.
"""

from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class ParameterStoreStack:
    """
    Manages SSM Parameter Store parameters.
    
    Creates secure parameters for sensitive configuration data.
    """
    
    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the parameter store stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parameters: Dict[str, aws.ssm.Parameter] = {}
        
        # Create default parameters
        self._create_default_parameters()
    
    def _create_default_parameters(self):
        """Create default SSM parameters."""
        # Database connection string (example)
        self.create_parameter(
            'db_connection_string',
            'postgresql://user:pass@localhost:5432/db',
            'Database connection string',
            secure=True
        )
        
        # API key (example)
        self.create_parameter(
            'api_key',
            'example-api-key-change-in-production',
            'External API key',
            secure=True
        )
        
        # App configuration (example non-secure parameter)
        self.create_parameter(
            'app_config',
            '{"feature_flags": {"new_ui": true}}',
            'Application configuration',
            secure=False
        )
    
    def create_parameter(
        self,
        name: str,
        value: str,
        description: str,
        secure: bool = True
    ) -> aws.ssm.Parameter:
        """
        Create an SSM parameter.
        
        Args:
            name: Parameter name (without prefix)
            value: Parameter value
            description: Parameter description
            secure: Whether to create as SecureString
            
        Returns:
            SSM Parameter resource
        """
        full_name = self.config.get_ssm_parameter_name(name)
        
        parameter = aws.ssm.Parameter(
            f"param-{name}",
            name=full_name,
            type="SecureString" if secure else "String",
            value=value,
            description=description,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.parameters[name] = parameter
        return parameter
    
    def get_parameter(self, name: str) -> Optional[aws.ssm.Parameter]:
        """
        Get a parameter by name.
        
        Args:
            name: Parameter name (without prefix)
            
        Returns:
            SSM Parameter resource or None
        """
        return self.parameters.get(name)
    
    def get_parameter_name(self, name: str) -> Output[str]:
        """
        Get the full parameter name.
        
        Args:
            name: Parameter name (without prefix)
            
        Returns:
            Full parameter name as Output
        """
        parameter = self.parameters.get(name)
        if parameter:
            return parameter.name
        else:
            raise ValueError(f"Parameter '{name}' not found. Ensure parameter is created before accessing.")
    
    def get_parameter_arn(self, name: str) -> Output[str]:
        """
        Get the parameter ARN.
        
        Args:
            name: Parameter name (without prefix)
            
        Returns:
            Parameter ARN as Output
        """
        parameter = self.parameters.get(name)
        if parameter:
            return parameter.arn
        else:
            raise ValueError(f"Parameter '{name}' not found")

