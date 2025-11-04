"""
Configuration module for the TAP AWS infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions to ensure consistency across all resources.
"""

import os
import re
from typing import Dict, List, Optional

import pulumi_aws as aws


class InfraConfig:
    """Centralized configuration for the TAP infrastructure."""
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment and naming
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        # Default is only for local development - CI/CD MUST set ENVIRONMENT_SUFFIX
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'local')
        self.project_name = os.getenv('PROJECT_NAME', 'tap')
        
        # Region configuration - dynamically fetch available AZs
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        
        # VPC configuration
        self.vpc_cidr = os.getenv('VPC_CIDR', '10.0.0.0/16')
        self.enable_dns_hostnames = True
        self.enable_dns_support = True
        
        # Compute configuration
        self.instance_type = os.getenv('INSTANCE_TYPE', 't3.micro')
        self.asg_min_size = int(os.getenv('ASG_MIN_SIZE', '1'))
        self.asg_max_size = int(os.getenv('ASG_MAX_SIZE', '3'))
        self.asg_desired_capacity = int(os.getenv('ASG_DESIRED_CAPACITY', '1'))
        
        # Scaling policy configuration
        self.cpu_scale_up_threshold = int(os.getenv('CPU_SCALE_UP_THRESHOLD', '70'))
        self.cpu_scale_down_threshold = int(os.getenv('CPU_SCALE_DOWN_THRESHOLD', '30'))
        
        # Lambda configuration
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '60'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '256'))
        
        # Monitoring configuration
        self.health_check_interval = os.getenv('HEALTH_CHECK_INTERVAL', 'rate(5 minutes)')
        self.alarm_evaluation_periods = int(os.getenv('ALARM_EVALUATION_PERIODS', '2'))
        
        # Security configuration
        self.authorized_ip_ranges = os.getenv('AUTHORIZED_IP_RANGES', '10.0.0.0/8').split(',')
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources like S3 buckets.
        
        Args:
            name: The name to normalize
            
        Returns:
            Normalized lowercase name with only valid characters
        """
        # Convert to lowercase and replace invalid characters with dashes
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        # Remove consecutive dashes and trim
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        # Ensure it doesn't start or end with dash
        return normalized
    
    def get_resource_name(self, resource_type: str, include_region: bool = False) -> str:
        """
        Generate consistent resource names using environment suffix.
        
        Args:
            resource_type: Type of resource (e.g., 'vpc', 'subnet', 'asg')
            include_region: Whether to include region in the name
            
        Returns:
            Formatted resource name
        """
        parts = [self.project_name, resource_type]
        
        if include_region:
            # Normalize region name (e.g., us-east-1 -> useast1)
            region_normalized = self.primary_region.replace('-', '')
            parts.append(region_normalized)
        
        parts.append(self.environment_suffix)
        
        name = '-'.join(parts)
        return self.normalize_name(name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags for all resources.
        
        Returns:
            Dictionary of common tags
        """
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Region': self.primary_region
        }
    
    def get_availability_zones(self, count: int = 2) -> List[str]:
        """
        Dynamically fetch available AZs in the current region.
        
        Args:
            count: Number of AZs to return
            
        Returns:
            List of availability zone names
        """
        azs_data = aws.get_availability_zones(state="available")
        available_azs = azs_data.names[:count]
        return available_azs
    
    def calculate_subnet_cidr(self, vpc_cidr: str, subnet_index: int) -> str:
        """
        Calculate subnet CIDR blocks from VPC CIDR.
        
        Args:
            vpc_cidr: VPC CIDR block (e.g., '10.0.0.0/16')
            subnet_index: Index of the subnet (0, 1, 2, ...)
            
        Returns:
            Subnet CIDR block
        """
        # Extract base IP and prefix from VPC CIDR
        base_ip, prefix = vpc_cidr.split('/')
        octets = base_ip.split('.')
        
        # For /16 VPC, create /24 subnets by incrementing the third octet
        octets[2] = str(subnet_index)
        subnet_cidr = f"{'.'.join(octets)}/24"
        
        return subnet_cidr

