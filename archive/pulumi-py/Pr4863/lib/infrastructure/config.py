"""
Centralized configuration for the infrastructure stack.

This module provides a centralized configuration class that manages all infrastructure
settings including naming conventions, region configuration, and resource parameters.
All resources dynamically inherit the region configuration.
"""
import os
import re
from typing import Dict, List, Optional


class InfraConfig:
    """
    Centralized configuration for infrastructure deployment.
    
    This class manages all configuration settings including:
    - Environment variables
    - Naming conventions (region-aware)
    - Region configuration (dynamically inherited by all resources)
    - Resource parameters
    - Tagging strategy
    
    All resources inherit the region from this config, ensuring consistency
    when switching regions.
    """
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment configuration
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = 'tap'
        
        # Region configuration - dynamically inherited by ALL resources
        # Change this via AWS_REGION environment variable
        self.primary_region = os.getenv('AWS_REGION', 'us-west-1')
        
        # Normalize region name for use in resource names (remove hyphens for S3, etc.)
        self.region_normalized = self._normalize_region_name(self.primary_region)
        
        # Availability zones - will be dynamically fetched from AWS
        # This is set to None here and populated in the networking module
        # to ensure AZs are always valid for the selected region
        self.availability_zones = None  # Populated dynamically
        
        # VPC Configuration
        self.vpc_cidr = '10.0.0.0/16'
        self.enable_dns_hostnames = True
        self.enable_dns_support = True
        self.enable_flow_logs = True
        
        # Subnet Configuration - will be adjusted based on available AZs
        # These are templates; actual count depends on available AZs
        self.public_subnet_cidrs = [
            '10.0.1.0/24',
            '10.0.2.0/24',
            '10.0.3.0/24',
            '10.0.4.0/24',  # Extra for regions with 4+ AZs
            '10.0.5.0/24',
            '10.0.6.0/24'
        ]
        self.private_subnet_cidrs = [
            '10.0.11.0/24',
            '10.0.12.0/24',
            '10.0.13.0/24',
            '10.0.14.0/24',  # Extra for regions with 4+ AZs
            '10.0.15.0/24',
            '10.0.16.0/24'
        ]
        
        # NAT Gateway Configuration - one per AZ for HA
        self.nat_gateway_per_az = True
        
        # Auto Scaling Configuration
        # Reduced to avoid AWS account throttling (RequestLimitExceeded)
        self.asg_min_size = 1
        self.asg_max_size = 2
        self.asg_desired_capacity = 1
        self.health_check_grace_period = 300  # 5 minutes grace period
        self.health_check_type = 'EC2'  # Use EC2 health checks (not ELB) to allow instances to launch
        
        # EC2 Configuration
        self.instance_type = 't3.micro'
        self.alb_idle_timeout = 60
        self.enable_deletion_protection = False
        self.enable_cross_zone_load_balancing = False
        
        # Target Group Configuration
        self.target_group_port = 80
        self.target_group_protocol = 'HTTP'
        self.health_check_path = '/health'
        self.health_check_interval = 30
        self.health_check_timeout = 10  # Increased from 5 to 10 seconds
        self.healthy_threshold = 2
        self.unhealthy_threshold = 5  # Increased from 3 to 5 for more tolerance during startup
        
        # CloudWatch Configuration
        self.log_retention_days = 7
        self.alarm_evaluation_periods = 2
        self.alarm_period = 300  # 5 minutes
        
        # SNS Configuration
        self.alarm_email = os.getenv('ALARM_EMAIL', '')
        
        # Secrets Configuration
        self.use_secrets_manager = True
        self.use_ssm_parameters = True
        
        # Backup and Recovery Configuration
        self.enable_automated_backups = True
        self.backup_retention_days = 7
        self.enable_point_in_time_recovery = True
        
        # S3 Lifecycle Configuration
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
            us-west-1 -> uswest1
            us-east-2 -> useast2
            eu-central-1 -> eucentral1
        
        Args:
            region: AWS region name (e.g., 'us-west-1')
            
        Returns:
            Normalized region name
        """
        return re.sub(r'[^a-z0-9]', '', region.lower())
    
    def get_resource_name(self, resource_type: str, suffix: Optional[str] = None, include_region: bool = False) -> str:
        """
        Generate a standardized resource name.
        
        Format: {project_name}-{resource_type}-{region_normalized}-{environment_suffix}[-{suffix}]
        All names are lowercase for case-sensitive resources like S3 buckets.
        
        Args:
            resource_type: Type of resource (e.g., 'vpc', 's3-bucket', 'lambda')
            suffix: Optional additional suffix for uniqueness (e.g., AZ suffix)
            include_region: Whether to include region in the name (useful for global resources like S3)
            
        Returns:
            Standardized resource name in lowercase
        """
        parts = [self.project_name, resource_type]
        
        # Include region for global resources or when explicitly requested
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
    
    def set_availability_zones(self, azs: List[str]):
        """
        Set availability zones dynamically from AWS query.
        
        This should be called by the networking module after querying
        AWS for available AZs in the selected region.
        
        Args:
            azs: List of availability zone names (e.g., ['us-west-1a', 'us-west-1b'])
        """
        self.availability_zones = azs
    
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
        else:
            return self.private_subnet_cidrs[:az_count]
