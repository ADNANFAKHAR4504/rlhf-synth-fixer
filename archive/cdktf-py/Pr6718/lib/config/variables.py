"""
Environment-specific configuration variables for multi-environment infrastructure.
Supports workspace-based configuration for dev, staging, and prod environments.
"""

from typing import Dict, Any


class EnvironmentConfig:
    """Environment-specific configuration manager."""

    # CIDR blocks for each environment (non-overlapping)
    VPC_CIDRS = {
        'dev': '10.0.0.0/16',
        'staging': '10.1.0.0/16',
        'prod': '10.2.0.0/16',
    }

    # ECS container counts per environment
    ECS_CONTAINER_COUNTS = {
        'dev': 2,
        'staging': 4,
        'prod': 8,
    }

    # RDS Multi-AZ configuration (only prod uses Multi-AZ)
    RDS_MULTI_AZ = {
        'dev': False,
        'staging': False,
        'prod': True,
    }

    # RDS instance classes per environment
    RDS_INSTANCE_CLASS = {
        'dev': 'db.t3.medium',
        'staging': 'db.r5.large',
        'prod': 'db.r5.xlarge',
    }

    # Availability zones per environment
    AVAILABILITY_ZONES = {
        'dev': 2,
        'staging': 2,
        'prod': 3,
    }

    # ALB settings
    ALB_ENABLE_DELETION_PROTECTION = {
        'dev': False,
        'staging': False,
        'prod': False,  # Set to False for destroyability in testing
    }

    @staticmethod
    def get_vpc_cidr(workspace: str) -> str:
        """Get VPC CIDR block for workspace."""
        return EnvironmentConfig.VPC_CIDRS.get(workspace, EnvironmentConfig.VPC_CIDRS['dev'])

    @staticmethod
    def get_ecs_container_count(workspace: str) -> int:
        """Get ECS container count for workspace."""
        return EnvironmentConfig.ECS_CONTAINER_COUNTS.get(workspace, 2)

    @staticmethod
    def get_rds_multi_az(workspace: str) -> bool:
        """Get RDS Multi-AZ setting for workspace."""
        return EnvironmentConfig.RDS_MULTI_AZ.get(workspace, False)

    @staticmethod
    def get_rds_instance_class(workspace: str) -> str:
        """Get RDS instance class for workspace."""
        return EnvironmentConfig.RDS_INSTANCE_CLASS.get(workspace, 'db.t3.medium')

    @staticmethod
    def get_availability_zones(workspace: str) -> int:
        """Get number of availability zones for workspace."""
        return EnvironmentConfig.AVAILABILITY_ZONES.get(workspace, 2)

    @staticmethod
    def get_alb_deletion_protection(workspace: str) -> bool:
        """Get ALB deletion protection setting for workspace."""
        return EnvironmentConfig.ALB_ENABLE_DELETION_PROTECTION.get(workspace, False)

    @staticmethod
    def validate_workspace(workspace: str) -> bool:
        """Validate that workspace is one of: dev, staging, prod."""
        return workspace in ['dev', 'staging', 'prod']

    @staticmethod
    def get_all_config(workspace: str) -> Dict[str, Any]:
        """Get all configuration values for a workspace."""
        if not EnvironmentConfig.validate_workspace(workspace):
            raise ValueError(f"Invalid workspace: {workspace}. Must be one of: dev, staging, prod")

        return {
            'workspace': workspace,
            'vpc_cidr': EnvironmentConfig.get_vpc_cidr(workspace),
            'ecs_container_count': EnvironmentConfig.get_ecs_container_count(workspace),
            'rds_multi_az': EnvironmentConfig.get_rds_multi_az(workspace),
            'rds_instance_class': EnvironmentConfig.get_rds_instance_class(workspace),
            'availability_zones': EnvironmentConfig.get_availability_zones(workspace),
            'alb_deletion_protection': EnvironmentConfig.get_alb_deletion_protection(workspace),
        }
