"""
Configuration module for EC2 failure recovery infrastructure.
Centralizes environment variables and configuration management.
"""
import os
from typing import Optional

import pulumi


class EC2RecoveryConfig:
    """Configuration class for EC2 failure recovery infrastructure."""
    
    def __init__(self):
        # Environment variables with defaults
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', f'-{self.environment}')
        self.region = os.getenv('AWS_REGION', 'us-west-2')
        self.project_name = os.getenv('PROJECT_NAME', 'ec2-recovery')
        
        # Email for SNS notifications
        self.alert_email = os.getenv('ALERT_EMAIL', 'admin@example.com')
        
        # Retry configuration
        self.max_retry_attempts = int(os.getenv('MAX_RETRY_ATTEMPTS', '3'))
        self.retry_interval_minutes = int(os.getenv('RETRY_INTERVAL_MINUTES', '5'))
        self.monitoring_interval_minutes = int(os.getenv('MONITORING_INTERVAL_MINUTES', '10'))
        
        # Resource naming with timestamp for uniqueness and proper normalization
        import random
        import time
        timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        random_suffix = str(random.randint(1000, 9999))
        
        # Normalize project name to lowercase for AWS resource naming
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        
        self.lambda_function_name = f"{project_name_normalized}-ec2-recovery-{environment_normalized}-{timestamp}-{random_suffix}"
        self.sns_topic_name = f"{project_name_normalized}-alerts-{environment_normalized}-{timestamp}-{random_suffix}"
        self.s3_bucket_name = f"{project_name_normalized}-state-{environment_normalized}-{timestamp}-{random_suffix}"
        self.parameter_store_prefix = f"/{project_name_normalized}/ec2-recovery-{environment_normalized}-{timestamp}-{random_suffix}"
        self.cloudwatch_log_group_name = f"/aws/lambda/{self.lambda_function_name}"
        self.iam_role_name = f"{project_name_normalized}-ec2-recovery-role-{environment_normalized}-{timestamp}-{random_suffix}"
        self.event_rule_name = f"{project_name_normalized}-ec2-monitoring-{environment_normalized}-{timestamp}-{random_suffix}"
        
        # Validate region - allow us-west-2 as default, but permit other regions for CI/CD
        if self.region not in ['us-west-2', 'us-east-1']:
            raise ValueError(f"Region must be us-west-2 or us-east-1, got {self.region}")
    
    def get_resource_name(self, resource_type: str, suffix: str = "") -> str:
        """Generate consistent resource names with environment suffix."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        base_name = f"{project_name_normalized}-{resource_type}-{environment_normalized}"
        return f"{base_name}{suffix}" if suffix else base_name
    
    def get_parameter_name(self, key: str) -> str:
        """Generate Parameter Store parameter names."""
        return f"{self.parameter_store_prefix}/{key}"
    
    def get_s3_key(self, key: str) -> str:
        """Generate S3 object keys for state storage."""
        return f"ec2-recovery/{key}"
    
    def get_tag_name(self, resource_name: str) -> str:
        """Generate consistent tag names."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        return f"{project_name_normalized}-{resource_name}-{environment_normalized}"
