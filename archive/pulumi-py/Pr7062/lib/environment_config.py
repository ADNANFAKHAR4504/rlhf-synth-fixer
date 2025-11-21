"""
Environment-specific configuration for payment processing infrastructure.
Defines settings for dev, staging, and production environments.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class EnvironmentConfig:
    """Configuration settings for a specific environment."""

    name: str
    account_id: str
    region: str
    lambda_memory_mb: int
    dynamodb_capacity_mode: str  # 'on-demand' or 'provisioned'
    dynamodb_read_capacity: Optional[int]
    dynamodb_write_capacity: Optional[int]
    dynamodb_pitr_enabled: bool
    s3_log_retention_days: int
    lambda_error_alarm_threshold: int
    dynamodb_throttle_alarm_threshold: int
    cost_center: str
    data_classification: str
    multi_az: bool

    def get_tags(self) -> Dict[str, str]:
        """Generate standard tags for this environment."""
        return {
            'Environment': self.name,
            'CostCenter': self.cost_center,
            'DataClassification': self.data_classification,
        }


# Environment configurations
ENVIRONMENTS: Dict[str, EnvironmentConfig] = {
    'dev': EnvironmentConfig(
        name='dev',
        account_id='123456789012',
        region='us-east-1',
        lambda_memory_mb=512,
        dynamodb_capacity_mode='on-demand',
        dynamodb_read_capacity=None,
        dynamodb_write_capacity=None,
        dynamodb_pitr_enabled=False,
        s3_log_retention_days=30,
        lambda_error_alarm_threshold=5,
        dynamodb_throttle_alarm_threshold=10,
        cost_center='dev-payments',
        data_classification='internal',
        multi_az=False,
    ),
    'staging': EnvironmentConfig(
        name='staging',
        account_id='234567890123',
        region='us-east-1',
        lambda_memory_mb=1024,
        dynamodb_capacity_mode='provisioned',
        dynamodb_read_capacity=5,
        dynamodb_write_capacity=5,
        dynamodb_pitr_enabled=False,
        s3_log_retention_days=90,
        lambda_error_alarm_threshold=3,
        dynamodb_throttle_alarm_threshold=5,
        cost_center='staging-payments',
        data_classification='internal',
        multi_az=False,
    ),
    'prod': EnvironmentConfig(
        name='prod',
        account_id='345678901234',
        region='us-east-1',
        lambda_memory_mb=2048,
        dynamodb_capacity_mode='provisioned',
        dynamodb_read_capacity=20,
        dynamodb_write_capacity=20,
        dynamodb_pitr_enabled=True,
        s3_log_retention_days=365,
        lambda_error_alarm_threshold=1,
        dynamodb_throttle_alarm_threshold=2,
        cost_center='prod-payments',
        data_classification='confidential',
        multi_az=True,
    ),
}


def get_environment_config(environment_suffix: str) -> EnvironmentConfig:
    """Get configuration for a specific environment."""
    # Map environment suffix to environment name
    env_map = {
        'dev': 'dev',
        'development': 'dev',
        'staging': 'staging',
        'stg': 'staging',
        'prod': 'prod',
        'production': 'prod',
    }

    env_name = env_map.get(environment_suffix.lower(), 'dev')
    return ENVIRONMENTS[env_name]
