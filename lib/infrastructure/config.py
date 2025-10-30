"""
Configuration module for the multi-environment infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import json
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class MultiEnvConfig:
    """Centralized configuration for multi-environment deployment."""
    
    environment: str
    environment_suffix: str
    project_name: str
    
    primary_region: str
    normalized_region: str
    
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    
    dynamodb_billing_mode: str
    dynamodb_read_capacity: int
    dynamodb_write_capacity: int
    dynamodb_enable_autoscaling: bool
    dynamodb_enable_global_tables: bool
    
    s3_versioning_enabled: bool
    s3_lifecycle_rules: List[Dict[str, Any]]
    s3_encryption_algorithm: str
    
    dlq_retention_days: int
    
    team: str
    cost_center: str
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'multienv')
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '60'))
        self.lambda_memory_size = self._get_lambda_memory_size()
        
        self.dynamodb_billing_mode = self._get_dynamodb_billing_mode()
        self.dynamodb_read_capacity = self._get_dynamodb_read_capacity()
        self.dynamodb_write_capacity = self._get_dynamodb_write_capacity()
        self.dynamodb_enable_autoscaling = self._should_enable_autoscaling()
        self.dynamodb_enable_global_tables = self._should_enable_global_tables()
        
        self.s3_versioning_enabled = os.getenv('S3_VERSIONING_ENABLED', 'true').lower() == 'true'
        self.s3_lifecycle_rules = self._get_s3_lifecycle_rules()
        self.s3_encryption_algorithm = os.getenv('S3_ENCRYPTION_ALGORITHM', 'AES256')
        
        self.dlq_retention_days = self._get_dlq_retention_days()
        
        self.team = os.getenv('TEAM', 'platform')
        self.cost_center = os.getenv('COST_CENTER', 'eng-001')
    
    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.
        
        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')
    
    def _get_lambda_memory_size(self) -> int:
        """Get Lambda memory size based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 512
        elif env == 'staging':
            return 1024
        else:
            return 3008
    
    def _get_dynamodb_billing_mode(self) -> str:
        """Get DynamoDB billing mode based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 'PAY_PER_REQUEST'
        return 'PROVISIONED'
    
    def _get_dynamodb_read_capacity(self) -> int:
        """Get DynamoDB read capacity based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 5
        elif env == 'staging':
            return 25
        else:
            return 100
    
    def _get_dynamodb_write_capacity(self) -> int:
        """Get DynamoDB write capacity based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 5
        elif env == 'staging':
            return 25
        else:
            return 100
    
    def _should_enable_autoscaling(self) -> bool:
        """Check if autoscaling should be enabled based on environment."""
        env = self.environment.lower()
        return env in ['staging', 'prod']
    
    def _should_enable_global_tables(self) -> bool:
        """Check if global tables should be enabled based on environment."""
        env = self.environment.lower()
        return env in ['staging', 'prod']
    
    def _get_s3_lifecycle_rules(self) -> List[Dict[str, Any]]:
        """Get S3 lifecycle rules (consistent across all environments)."""
        return [
            {
                'id': 'expire-old-versions',
                'status': 'Enabled',
                'noncurrent_version_expiration': {
                    'noncurrent_days': 90
                },
                'abort_incomplete_multipart_upload': {
                    'days_after_initiation': 7
                }
            }
        ]
    
    def _get_dlq_retention_days(self) -> int:
        """Get DLQ retention days based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 7
        elif env == 'staging':
            return 14
        else:
            return 30
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources.
        
        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized
    
    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.
        
        Args:
            resource_type: Type of the resource
            include_region: Whether to include region in the name (default: True)
        
        Returns:
            Formatted resource name with region, environment, and environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"
        
        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"
        
        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"
        
        return base_name
    
    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.
        
        This is specifically for resources like S3 buckets that require lowercase names.
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'Team': self.team,
            'CostCenter': self.cost_center,
            'ManagedBy': 'Pulumi',
            'Region': self.normalized_region
        }


def validate_environment_configs(configs: Dict[str, MultiEnvConfig]) -> None:
    """
    Validate configuration consistency across environments.
    
    Ensures critical settings match across all environments:
    - S3 lifecycle rules
    - S3 versioning
    - S3 encryption
    - Tag structure (excluding Environment tag)
    
    Args:
        configs: Dictionary mapping environment names to their configs
    
    Raises:
        ValueError: If any validation check fails
    """
    env_names = list(configs.keys())
    if len(env_names) < 2:
        return
    
    reference_env = configs[env_names[0]]
    
    reference_lifecycle_canonical = _canonicalize_json(reference_env.s3_lifecycle_rules)
    
    for env_name, env_config in configs.items():
        if env_name == env_names[0]:
            continue
        
        current_lifecycle_canonical = _canonicalize_json(env_config.s3_lifecycle_rules)
        if reference_lifecycle_canonical != current_lifecycle_canonical:
            raise ValueError(
                f"S3 lifecycle rules for environment {env_name} don't match "
                f"the reference environment {env_names[0]}"
            )
        
        if reference_env.s3_versioning_enabled != env_config.s3_versioning_enabled:
            raise ValueError(
                f"S3 versioning for environment {env_name} doesn't match "
                f"the reference environment {env_names[0]}"
            )
        
        if reference_env.s3_encryption_algorithm != env_config.s3_encryption_algorithm:
            raise ValueError(
                f"S3 encryption for environment {env_name} doesn't match "
                f"the reference environment {env_names[0]}"
            )
    
    if 'prod' in configs and 'staging' in configs:
        prod_config = configs['prod']
        staging_config = configs['staging']
        
        if not prod_config.dynamodb_enable_global_tables:
            raise ValueError(
                "Production environment must have global tables enabled "
                "for prod to staging replication"
            )
        
        if not staging_config.dynamodb_enable_global_tables:
            raise ValueError(
                "Staging environment must have global tables enabled "
                "for prod to staging replication"
            )
    
    base_tags = {k: v for k, v in reference_env.get_common_tags().items() if k != 'Environment'}
    for env_name, env_config in configs.items():
        if env_name == env_names[0]:
            continue
        
        env_tags = {k: v for k, v in env_config.get_common_tags().items() if k != 'Environment'}
        if base_tags != env_tags:
            raise ValueError(
                f"Tags for environment {env_name} don't match "
                f"the reference environment {env_names[0]}"
            )


def _canonicalize_json(obj: Any) -> str:
    """
    Canonicalize JSON for comparison.
    
    Sorts keys and ensures consistent formatting to avoid false mismatches.
    """
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))

