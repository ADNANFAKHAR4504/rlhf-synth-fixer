"""
Configuration management for the High Availability infrastructure.

This module centralizes all configuration settings, naming conventions,
and environment variables for the infrastructure.
"""

import os
from typing import Dict, List, Optional

import pulumi
from pulumi import Output


class Config:
    """
    Centralized configuration for infrastructure deployment.
    
    Uses ENVIRONMENT_SUFFIX environment variable for naming consistency.
    All names are normalized to lowercase for case-sensitive resources.
    """
    
    def __init__(self):
        """Initialize configuration from environment variables and Pulumi config."""
        # Get environment suffix from environment variable
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        # Get Pulumi config
        self.pulumi_config = pulumi.Config()
        
        # Application settings
        self.app_name = 'ha-webapp'
        self.project_name = pulumi.get_project()
        self.stack_name = pulumi.get_stack()
        
        # AWS Region settings
        self.primary_region = self.pulumi_config.get('aws:region') or 'us-east-1'
        self.secondary_regions = self.pulumi_config.get_object('secondary_regions') or ['us-west-2']
        
        # Compute settings
        self.min_instances = self.pulumi_config.get_int('min_instances') or 2
        self.max_instances = self.pulumi_config.get_int('max_instances') or 10
        self.desired_capacity = self.pulumi_config.get_int('desired_capacity') or 2
        self.instance_type = self.pulumi_config.get('instance_type') or 't2.micro'  # Free tier eligible
        
        # Recovery settings
        self.recovery_timeout_minutes = 15
        self.health_check_interval_seconds = 60
        self.failure_threshold = 3
        
        # Monitoring settings
        self.log_retention_days = 30
        self.metric_namespace = 'HA/WebApp'
        
        # Storage settings
        self.log_bucket_lifecycle_days = 90
        self.state_retention_days = 30
        
        # Cleanup settings
        self.snapshot_retention_days = 7
        self.volume_retention_days = 7
        
        # Tags
        self.common_tags = {
            'Project': self.project_name,
            'Environment': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Stack': self.stack_name
        }
    
    def get_resource_name(self, resource_type: str, region: Optional[str] = None) -> str:
        """
        Generate a standardized resource name.
        
        Args:
            resource_type: Type of resource (e.g., 'logs-bucket', 'asg')
            region: Optional AWS region for region-specific resources
            
        Returns:
            Normalized resource name in lowercase
        """
        parts = [self.app_name, self.environment_suffix, resource_type]
        if region:
            parts.append(region)
        
        # Normalize to lowercase for case-sensitive resources like S3
        return '-'.join(parts).lower()
    
    def get_bucket_name(self, bucket_type: str) -> str:
        """
        Generate S3 bucket name (case-sensitive, must be lowercase).
        
        Args:
            bucket_type: Type of bucket (e.g., 'logs', 'state')
            
        Returns:
            Lowercase bucket name
        """
        # Include AWS account ID for uniqueness
        account_id = pulumi.Output.from_input(
            pulumi_aws.get_caller_identity().account_id
        )
        
        # Return as Output[str] for proper handling
        return account_id.apply(
            lambda aid: f"{self.app_name}-{self.environment_suffix}-{bucket_type}-{aid}".lower()
        )
    
    def get_tags(self, additional_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Get tags for a resource.
        
        Args:
            additional_tags: Optional additional tags to merge
            
        Returns:
            Merged tags dictionary
        """
        tags = self.common_tags.copy()
        if additional_tags:
            tags.update(additional_tags)
        return tags
    
    def get_region_specific_name(self, resource_type: str, region: str) -> str:
        """
        Generate region-specific resource name.
        
        Args:
            resource_type: Type of resource
            region: AWS region
            
        Returns:
            Region-specific resource name
        """
        return self.get_resource_name(resource_type, region)


# Import aws after Config is defined to avoid circular import
import pulumi_aws
