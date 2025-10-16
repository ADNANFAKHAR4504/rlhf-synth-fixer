"""
AWS Systems Manager Parameter Store management.

This module creates parameters with SecureString for sensitive values,
addressing the secrecy requirements.
"""

from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class ParameterStoreManager:
    """
    Manages configuration via AWS Systems Manager Parameter Store.
    
    Uses SecureString for sensitive parameters.
    """
    
    def __init__(self, config: Config):
        """
        Initialize Parameter Store manager.
        
        Args:
            config: Configuration object
        """
        self.config = config
        self.prefix = f"/{config.app_name}"
        self.parameters: Dict[str, aws.ssm.Parameter] = {}
        
        # Create initial parameters
        self._create_initial_parameters()
    
    def _create_initial_parameters(self):
        """Create initial configuration parameters."""
        # Non-sensitive parameters
        self.create_parameter(
            'environment',
            self.config.environment_suffix,
            'Deployment environment',
            secure=False
        )
        
        self.create_parameter(
            'recovery-timeout-minutes',
            str(self.config.recovery_timeout_minutes),
            'Recovery timeout in minutes',
            secure=False
        )
        
        self.create_parameter(
            'health-check-interval',
            str(self.config.health_check_interval_seconds),
            'Health check interval in seconds',
            secure=False
        )
        
        self.create_parameter(
            'failure-threshold',
            str(self.config.failure_threshold),
            'Number of failures before triggering rollback',
            secure=False
        )
        
        # Sensitive parameter placeholders (SecureString)
        # These would be populated with actual sensitive data
        self.create_parameter(
            'api-key-placeholder',
            'changeme',
            'API key for external services (SecureString)',
            secure=True
        )
        
        self.create_parameter(
            'database-connection-string',
            'changeme',
            'Database connection string (SecureString)',
            secure=True
        )
    
    def create_parameter(
        self,
        name: str,
        value: str,
        description: str = '',
        secure: bool = False
    ) -> aws.ssm.Parameter:
        """
        Create or update a parameter in Parameter Store.
        
        Args:
            name: Parameter name (will be prefixed)
            value: Parameter value
            description: Parameter description
            secure: If True, use SecureString type
            
        Returns:
            SSM Parameter resource
        """
        param_name = f"{self.prefix}/{name}"
        resource_name = f"param-{name.replace('/', '-')}"
        
        param = aws.ssm.Parameter(
            resource_name,
            name=param_name,
            type='SecureString' if secure else 'String',
            value=value,
            description=description,
            tags=self.config.get_tags({
                'Purpose': 'Configuration',
                'Secure': str(secure)
            })
        )
        
        self.parameters[name] = param
        return param
    
    def get_parameter_value(self, name: str) -> Output[str]:
        """
        Retrieve parameter value.
        
        Args:
            name: Parameter name
            
        Returns:
            Parameter value as Output[str]
        """
        if name in self.parameters:
            return self.parameters[name].value
        
        # If not created by this stack, retrieve from AWS
        param_name = f"{self.prefix}/{name}"
        param = aws.ssm.get_parameter(
            name=param_name,
            with_decryption=True
        )
        return Output.from_input(param.value)
    
    def get_parameter_arn(self, name: str) -> Output[str]:
        """
        Get parameter ARN.
        
        Args:
            name: Parameter name
            
        Returns:
            Parameter ARN as Output[str]
        """
        if name not in self.parameters:
            raise ValueError(f"Parameter {name} not found")
        return self.parameters[name].arn

