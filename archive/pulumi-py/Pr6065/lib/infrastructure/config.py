"""
Configuration module for the observability infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class ObservabilityConfig:
    """Centralized configuration for the observability infrastructure."""
    
    environment: str
    environment_suffix: str
    project_name: str
    
    primary_region: str
    normalized_region: str
    
    # CloudWatch Log configuration (from prompt)
    log_retention_days: int  # 90 days for compliance
    
    # Metric configuration (from prompt)
    metric_namespace: str
    metric_resolution: int  # 1 minute = 60 seconds
    
    # Alarm thresholds (from prompt)
    error_rate_threshold: float  # 1% = 0.01
    api_latency_threshold: int  # 500ms
    db_connection_failure_threshold: int  # 5 failures
    
    # Dashboard configuration (from prompt)
    dashboard_refresh_interval: int  # 60 seconds
    
    # Alert configuration
    alert_email: str
    slack_webhook_url: str
    
    # CloudTrail configuration (from prompt - compliance)
    cloudtrail_retention_days: int  # 7 years = 2555 days for PCI-DSS
    
    # Tags
    team: str
    cost_center: str
    compliance: str
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'payment-observability')
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        
        # CloudWatch Log configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '90'))
        
        # Metric configuration
        self.metric_namespace = f"PaymentSystem/{self.environment_suffix}"
        self.metric_resolution = int(os.getenv('METRIC_RESOLUTION', '60'))  # 1 minute
        
        # Alarm thresholds
        self.error_rate_threshold = float(os.getenv('ERROR_RATE_THRESHOLD', '1.0'))  # 1%
        self.api_latency_threshold = int(os.getenv('API_LATENCY_THRESHOLD', '500'))  # 500ms
        self.db_connection_failure_threshold = int(
            os.getenv('DB_CONNECTION_FAILURE_THRESHOLD', '5')
        )
        
        # Dashboard configuration
        self.dashboard_refresh_interval = int(
            os.getenv('DASHBOARD_REFRESH_INTERVAL', '60')
        )
        
        # Alert configuration
        self.alert_email = os.getenv('ALERT_EMAIL', 'alerts@example.com')
        self.slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL', '')
        
        # CloudTrail configuration
        self.cloudtrail_retention_days = int(
            os.getenv('CLOUDTRAIL_RETENTION_DAYS', '2555')  # 7 years
        )
        
        # Tags
        self.team = os.getenv('TEAM', 'payment-team')
        self.cost_center = os.getenv('COST_CENTER', 'eng-payment')
        self.compliance = os.getenv('COMPLIANCE', 'PCI-DSS')
    
    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.
        
        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources (e.g., S3 buckets).
        
        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized
    
    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.
        
        Args:
            resource_type: Type of resource (e.g., 'log-group', 'alarm')
            include_region: Whether to include normalized region in name
            
        Returns:
            Formatted resource name
        """
        parts = [self.project_name, resource_type]
        
        if include_region:
            parts.append(self.normalized_region)
        
        parts.append(self.environment_suffix)
        
        return '-'.join(parts)
    
    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.
        
        Args:
            resource_type: Type of resource
            include_region: Whether to include normalized region
            
        Returns:
            Normalized resource name (lowercase, no invalid chars)
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
            'Project': self.project_name,
            'ManagedBy': 'Pulumi',
            'Team': self.team,
            'CostCenter': self.cost_center,
            'EnvironmentSuffix': self.environment_suffix,
            'Region': self.normalized_region,
            'Compliance': self.compliance
        }
    
    def get_tags_for_resource(self, resource_type: str, **custom_tags) -> Dict[str, str]:
        """
        Get tags for a specific resource with optional custom tags.
        
        Args:
            resource_type: Type of resource
            **custom_tags: Additional custom tags to merge
            
        Returns:
            Dictionary of tags
        """
        tags = self.get_common_tags()
        tags['ResourceType'] = resource_type
        tags.update(custom_tags)
        return tags

