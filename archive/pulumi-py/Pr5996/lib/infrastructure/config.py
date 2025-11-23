"""
Centralized configuration for the AWS VPC infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions to ensure consistency across all resources.
"""

import os
import re
from typing import Dict, List


class InfraConfig:
    """
    Centralized configuration for the VPC infrastructure.
    
    This class manages all configuration settings including:
    - Environment variables
    - Naming conventions (region-aware and environment suffix-aware)
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
        self.project_name = 'infra001'
        
        # Region configuration - dynamically inherited by ALL resources
        # Change this via AWS_REGION environment variable
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Normalize region name for use in resource names (remove hyphens for S3, etc.)
        self.region_normalized = self._normalize_region_name(self.primary_region)
        
        # VPC Configuration
        self.vpc_cidr = '10.0.0.0/16'
        self.enable_dns_hostnames = True
        self.enable_dns_support = True
        self.enable_flow_logs = True
        
        # Subnet Configuration - will be adjusted based on available AZs
        # Using proper CIDR calculation to avoid overlaps
        self.public_subnet_cidrs = [
            '10.0.1.0/24',
            '10.0.2.0/24',
            '10.0.3.0/24',
            '10.0.4.0/24',
        ]
        self.private_subnet_cidrs = [
            '10.0.11.0/24',
            '10.0.12.0/24',
            '10.0.13.0/24',
            '10.0.14.0/24',
        ]
        
        # NAT Gateway Configuration - one per AZ for HA
        self.nat_gateway_per_az = True
        
        # EC2 Configuration
        self.instance_type = os.getenv('INSTANCE_TYPE', 't3.micro')
        self.ssh_allowed_cidr = os.getenv('SSH_ALLOWED_CIDR', '10.20.30.40/32')
        
        # CloudWatch Configuration
        self.log_retention_days = 30
        self.alarm_evaluation_periods = 2
        self.alarm_period = 300
        
        # Alarm thresholds
        self.cpu_high_threshold = int(os.getenv('CPU_HIGH_THRESHOLD', '80'))
        self.nat_packet_drop_threshold = int(os.getenv('NAT_PACKET_DROP_THRESHOLD', '10'))
        
        # SNS Configuration
        self.alarm_email = os.getenv('ALARM_EMAIL', '')
        
        # SSM Configuration
        self.enable_ssm = True
        
        # Tagging Configuration
        self.common_tags = self._get_common_tags()
    
    def _normalize_region_name(self, region: str) -> str:
        """
        Normalize region name for use in resource names.
        
        Removes hyphens and converts to lowercase for use in S3 bucket names
        and other resources that have strict naming requirements.
        
        Examples:
            us-east-1 -> useast1
            us-west-2 -> uswest2
            eu-central-1 -> eucentral1
        
        Args:
            region: AWS region name (e.g., 'us-east-1')
            
        Returns:
            Normalized region name
        """
        return re.sub(r'[^a-z0-9]', '', region.lower())
    
    def get_resource_name(self, resource_type: str, suffix: str = None) -> str:
        """
        Generate a standardized resource name.
        
        Format: {project_name}-{resource_type}-{region_normalized}-{environment_suffix}[-{suffix}]
        All names are lowercase for case-sensitive resources.
        
        Args:
            resource_type: Type of resource (e.g., 'vpc', 'subnet', 'ec2')
            suffix: Optional additional suffix for uniqueness (e.g., AZ suffix, '1', '2')
            
        Returns:
            Standardized resource name in lowercase
        """
        parts = [self.project_name, resource_type, self.region_normalized, self.environment_suffix]
        
        if suffix:
            parts.append(suffix)
        
        name = '-'.join(parts).lower()
        
        # Additional normalization for case-sensitive resources
        # Remove any characters that might be invalid
        name = re.sub(r'[^a-z0-9-]', '-', name)
        # Remove consecutive dashes
        name = re.sub(r'-+', '-', name)
        # Trim dashes from start and end
        name = name.strip('-')
        
        return name
    
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
            'ProjectName': self.project_name,
            'Environment': self.environment,
            'ENVIRONMENT_SUFFIX': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Region': self.primary_region,
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
    
    def get_subnet_cidrs_for_azs(self, az_count: int, subnet_type: str = 'public') -> List[str]:
        """
        Get subnet CIDRs based on the number of available AZs.
        
        Args:
            az_count: Number of availability zones
            subnet_type: 'public' or 'private'
            
        Returns:
            List of CIDR blocks for subnets
        """
        if subnet_type == 'public':
            return self.public_subnet_cidrs[:az_count]
        return self.private_subnet_cidrs[:az_count]

