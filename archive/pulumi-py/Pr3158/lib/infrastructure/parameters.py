"""
parameters.py

Parameter Store module for secure configuration management.
Addresses model failure: Parameter Store inconsistent.
"""

import json
import secrets
import string

import pulumi
import pulumi_aws as aws

from .config import config


def create_secure_parameters(name: str, parameters: dict):
    """
    Create secure parameters in AWS Parameter Store.
    Addresses model failure: Parameter Store inconsistent.
    """
    
    ssm_parameters = {}
    
    for param_name, param_value in parameters.items():
        # Create secure string parameter with KMS encryption
        ssm_param = aws.ssm.Parameter(
            f"{name}-{param_name}",
            name=f"/{name}/{param_name}",
            type="SecureString",
            value=param_value,
            key_id="alias/aws/ssm",  # Use AWS managed key for SSM
            description=f"Secure parameter for {name} - {param_name}",
            tags={
                **config.get_tags(),
                "ParameterName": param_name,
                "Purpose": "Configuration"
            },
            opts=pulumi.ResourceOptions(provider=config.aws_provider)
        )
        ssm_parameters[param_name] = ssm_param

    return ssm_parameters


def create_public_parameters(name: str, parameters: dict):
    """
    Create public parameters in AWS Parameter Store for non-sensitive configuration.
    """
    
    ssm_parameters = {}
    
    for param_name, param_value in parameters.items():
        # Create string parameter
        ssm_param = aws.ssm.Parameter(
            f"{name}-{param_name}-public",
            name=f"/{name}/{param_name}",
            type="String",
            value=param_value,
            description=f"Public parameter for {name} - {param_name}",
            tags={
                **config.get_tags(),
                "ParameterName": param_name,
                "Purpose": "Configuration",
                "Sensitivity": "Public"
            },
            opts=pulumi.ResourceOptions(provider=config.aws_provider)
        )
        ssm_parameters[param_name] = ssm_param

    return ssm_parameters


def create_parameter_hierarchy(name: str):
    """
    Create a hierarchical parameter structure for organized configuration management.
    """
    
    # Environment-specific parameters
    env_params = {
        "ENVIRONMENT": pulumi.get_stack(),
        "REGION": config.aws_region,
        "LOG_LEVEL": "INFO",
        "TIMEOUT": str(config.lambda_timeout)
    }
    
    # Application-specific parameters
    app_params = {
        "APP_NAME": name,
        "VERSION": "1.0.0",
        "DEPLOYMENT_DATE": f"deployed-{pulumi.get_stack()}"
    }
    
    # Generate random secrets using Python's built-in secrets module
    def generate_password(length=32, special_chars=True):
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits
        if special_chars:
            alphabet += "!@#$%^&*()_+-=[]{}|;:,.<>?"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    # Generate secure random values
    db_password = generate_password(32, special_chars=True)
    api_key = generate_password(64, special_chars=False)
    jwt_secret = generate_password(128, special_chars=True)
    
    # Security parameters using generated random values
    security_params = {
        "DB_PASSWORD": db_password,
        "API_KEY": api_key,
        "JWT_SECRET": jwt_secret
    }
    
    # Create all parameter types
    env_parameters = create_public_parameters(f"{name}/env", env_params)
    app_parameters = create_public_parameters(f"{name}/app", app_params)
    security_parameters = create_secure_parameters(f"{name}/security", security_params)
    
    return {
        "env": env_parameters,
        "app": app_parameters,
        "security": security_parameters
    }


def create_parameter_policy(name: str, lambda_role_arn: str):
    """
    Create IAM policy for Parameter Store access with least privilege.
    """
    
    parameter_policy = aws.iam.Policy(
        f"{name}-parameter-policy",
        name=f"{name}-parameter-policy",
        description="Allow access to specific parameters with least privilege",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                        "ssm:GetParametersByPath"
                    ],
                    "Resource": [
                        f"arn:aws:ssm:{config.aws_region}:*:parameter/{name}/*"
                    ]
                },
                {
                    "Effect": "Deny",
                    "Action": [
                        "ssm:PutParameter",
                        "ssm:DeleteParameter",
                        "ssm:DeleteParameters"
                    ],
                    "Resource": "*"
                }
            ]
        }),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return parameter_policy
