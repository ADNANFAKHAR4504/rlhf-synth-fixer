"""
Centralized configuration for the infrastructure stack.

This module provides a centralized configuration class that manages all infrastructure
settings including naming conventions, region configuration, and resource parameters.
All resources dynamically inherit the region configuration.
"""
import os
import re
from typing import Dict, Optional


class InfraConfig:
    """
    Centralized configuration for infrastructure deployment.
    
    This class manages all configuration settings including:
    - Environment variables
    - Naming conventions (region-aware, lowercase for S3)
    - Region configuration (dynamically inherited by all resources)
    - Resource parameters
    - Tagging strategy
    
    All resources inherit the region from this config, ensuring consistency
    when switching regions.
    """
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment configuration
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = 'scalable-ec2'
        
        # Region configuration - dynamically inherited by ALL resources
        # Change this via AWS_REGION environment variable
        self.primary_region = os.getenv('AWS_REGION', 'us-west-2')
        
        # Normalize region name for use in resource names (remove hyphens for S3, etc.)
        self.region_normalized = self._normalize_region_name(self.primary_region)
        
        # VPC Configuration
        self.vpc_cidr = '10.0.0.0/16'
        self.enable_dns_hostnames = True
        self.enable_dns_support = True
        
        # Subnet Configuration
        self.public_subnet_cidrs = [
            '10.0.1.0/24',
            '10.0.2.0/24',
            '10.0.3.0/24'
        ]
        
        # EC2 Configuration
        self.instance_type = 't2.micro'
        
        # Auto Scaling Configuration
        self.asg_min_size = 1
        self.asg_max_size = 3
        self.asg_desired_capacity = 1
        self.health_check_grace_period = 300
        self.health_check_type = 'EC2'
        
        # Scaling Policy Configuration
        self.scale_up_cpu_threshold = 70.0
        self.scale_down_cpu_threshold = 30.0
        self.scale_up_adjustment = 1
        self.scale_down_adjustment = -1
        
        # CloudWatch Configuration
        self.log_retention_days = 7
        self.alarm_evaluation_periods = 2
        self.alarm_period = 300
        
        # S3 Configuration
        self.s3_encryption_algorithm = 'AES256'
        self.s3_enable_versioning = True
        self.s3_transition_to_ia_days = 30
        self.s3_transition_to_glacier_days = 90
        self.s3_expiration_days = 365
        
        # Tagging Configuration
        self.common_tags = self._get_common_tags()
    
    def _normalize_region_name(self, region: str) -> str:
        """
        Normalize region name for use in resource names.
        
        Removes hyphens and converts to lowercase for use in S3 bucket names
        and other resources that have strict naming requirements.
        
        Examples:
            us-west-2 -> uswest2
            us-east-1 -> useast1
            eu-central-1 -> eucentral1
        
        Args:
            region: AWS region name (e.g., 'us-west-2')
            
        Returns:
            Normalized region name
        """
        return re.sub(r'[^a-z0-9]', '', region.lower())
    
    def get_resource_name(self, resource_type: str, suffix: Optional[str] = None, include_region: bool = True) -> str:
        """
        Generate a standardized resource name.
        
        Format: {project_name}-{resource_type}-{region_normalized}-{environment_suffix}[-{suffix}]
        All names are lowercase for case-sensitive resources like S3 buckets.
        
        Args:
            resource_type: Type of resource (e.g., 'vpc', 's3-bucket', 'lambda')
            suffix: Optional additional suffix for uniqueness
            include_region: Whether to include region in the name (default True for consistency)
            
        Returns:
            Standardized resource name in lowercase
        """
        parts = [self.project_name, resource_type]
        
        # Include region for global resources and consistency
        if include_region:
            parts.append(self.region_normalized)
        
        parts.append(self.environment_suffix)
        
        if suffix:
            parts.append(suffix)
        
        return '-'.join(parts).lower()
    
    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags to apply to all resources.
        
        Returns:
            Dictionary of common tags
        """
        return self._get_common_tags()
    
    def _get_common_tags(self) -> Dict[str, str]:
        """
        Generate common tags for all resources.
        
        Returns:
            Dictionary of tags
        """
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Region': self.primary_region,
            'Repository': os.getenv('REPOSITORY', 'unknown'),
            'CommitAuthor': os.getenv('COMMIT_AUTHOR', 'unknown')
        }
    
    def get_tags_for_resource(self, resource_type: str, **additional_tags) -> Dict[str, str]:
        """
        Get tags for a specific resource type.
        
        Args:
            resource_type: Type of resource
            **additional_tags: Additional tags to merge
            
        Returns:
            Dictionary of tags
        """
        tags = self.common_tags.copy()
        tags['ResourceType'] = resource_type
        tags.update(additional_tags)
        return tags

