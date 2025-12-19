"""
Configuration module for the CI/CD pipeline infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class CICDConfig:
    """Centralized configuration for the CI/CD pipeline infrastructure."""
    
    environment: str
    environment_suffix: str
    project_name: str
    
    primary_region: str
    normalized_region: str
    
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    
    codebuild_compute_type: str
    codebuild_image: str
    
    source_object_key: str
    
    deployment_config_name: str
    
    log_retention_days: int
    enable_xray_tracing: bool
    
    alarm_evaluation_periods: int
    alarm_threshold: int
    
    team: str
    application: str
    cost_center: str
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'cicd-lambda')
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.8')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '128'))
        
        self.codebuild_compute_type = os.getenv('CODEBUILD_COMPUTE_TYPE', 'BUILD_GENERAL1_SMALL')
        self.codebuild_image = os.getenv('CODEBUILD_IMAGE', 'aws/codebuild/amazonlinux2-x86_64-standard:3.0')
        
        self.source_object_key = os.getenv('SOURCE_OBJECT_KEY', 'source.zip')
        
        self.deployment_config_name = os.getenv('DEPLOYMENT_CONFIG_NAME', 'CodeDeployDefault.LambdaCanary10Percent5Minutes')
        
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        
        self.alarm_evaluation_periods = int(os.getenv('ALARM_EVALUATION_PERIODS', '2'))
        self.alarm_threshold = int(os.getenv('ALARM_THRESHOLD', '1'))
        
        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'cicd-pipeline')
        self.cost_center = os.getenv('COST_CENTER', 'engineering-001')
    
    def _normalize_region(self, region: str) -> str:
        """
        Normalize AWS region by removing hyphens for use in resource names.
        
        Args:
            region: AWS region (e.g., 'us-east-1')
            
        Returns:
            Normalized region string (e.g., 'useast1')
        """
        return region.replace('-', '')
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize resource name to be lowercase and alphanumeric.
        
        Args:
            name: Resource name to normalize
            
        Returns:
            Normalized name (lowercase, alphanumeric with hyphens)
        """
        normalized = re.sub(r'[^a-zA-Z0-9-]', '', name.lower())
        normalized = re.sub(r'-+', '-', normalized)
        return normalized.strip('-')
    
    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate a consistent resource name following the naming convention.
        
        Args:
            resource_type: Type of resource (e.g., 'lambda', 'codebuild')
            include_region: Whether to include region in the name
            
        Returns:
            Formatted resource name
        """
        base_name = f"{self.project_name}-{resource_type}"
        
        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"
        
        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"
        
        return base_name
    
    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate a normalized resource name (lowercase, suitable for S3, etc.).
        
        Args:
            resource_type: Type of resource
            include_region: Whether to include region in the name
            
        Returns:
            Normalized resource name
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags to apply to all resources.
        
        Returns:
            Dictionary of common tags
        """
        return {
            'Environment': self.environment,
            'Application': self.application,
            'CostCenter': self.cost_center,
            'Team': self.team,
            'ManagedBy': 'Pulumi',
            'Project': self.project_name,
            'EnvironmentSuffix': self.environment_suffix
        }

