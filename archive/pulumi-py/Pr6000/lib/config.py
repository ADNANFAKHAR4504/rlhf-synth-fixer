"""
config.py

Environment-specific configuration for multi-environment deployments.
"""

from dataclasses import dataclass
from typing import Optional, List
import pulumi_aws as aws


@dataclass
class EnvironmentConfig:
    """Configuration class for environment-specific settings."""

    environment: str
    vpc_cidr: str
    db_instance_class: str
    enable_db_encryption: bool
    lambda_reserved_concurrency: Optional[int]
    enable_custom_domain: bool
    enable_s3_versioning: bool
    s3_lifecycle_days: Optional[int]
    dynamodb_billing_mode: str
    enable_storage_encryption: bool
    log_retention_days: int


def get_default_egress_rules() -> List[aws.ec2.SecurityGroupEgressArgs]:
    """
    Returns standard egress rules for security groups.

    Returns:
        List of security group egress rules allowing all outbound traffic
    """
    return [
        aws.ec2.SecurityGroupEgressArgs(
            protocol='-1',
            from_port=0,
            to_port=0,
            cidr_blocks=['0.0.0.0/0']
        )
    ]


def get_environment_config(environment_suffix: str) -> EnvironmentConfig:
    """
    Get environment-specific configuration based on environment suffix.

    Args:
        environment_suffix: The environment identifier (e.g., 'dev', 'prod')

    Returns:
        EnvironmentConfig object with appropriate settings
    """

    # Determine if this is production based on suffix
    is_production = 'prod' in environment_suffix.lower()

    if is_production:
        return EnvironmentConfig(
            environment='prod',
            vpc_cidr='10.1.0.0/16',
            db_instance_class='db.m5.large',
            enable_db_encryption=True,
            lambda_reserved_concurrency=100,
            enable_custom_domain=True,
            enable_s3_versioning=True,
            s3_lifecycle_days=90,
            dynamodb_billing_mode='PAY_PER_REQUEST',
            enable_storage_encryption=True,
            log_retention_days=30
        )

    return EnvironmentConfig(
        environment='dev',
        vpc_cidr='10.0.0.0/16',
        db_instance_class='db.t3.small',
        enable_db_encryption=False,
        lambda_reserved_concurrency=None,
        enable_custom_domain=False,
        enable_s3_versioning=False,
        s3_lifecycle_days=None,
        dynamodb_billing_mode='PROVISIONED',
        enable_storage_encryption=False,
        log_retention_days=7
    )
