import os
import random
import time
from typing import Any, Dict


class WebAppConfig:
    """Centralized configuration for web application infrastructure."""
    
    def __init__(self):
        # Environment configuration
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', f'-{self.environment}')
        self.region = os.getenv('AWS_REGION', 'us-west-2')
        self.project_name = os.getenv('PROJECT_NAME', 'web-app')
        
        # Application configuration
        self.app_name = os.getenv('APP_NAME', 'webapp')
        self.instance_type = os.getenv('INSTANCE_TYPE', 't3.micro')
        self.min_size = int(os.getenv('MIN_SIZE', '1'))
        self.max_size = int(os.getenv('MAX_SIZE', '3'))
        self.desired_capacity = int(os.getenv('DESIRED_CAPACITY', '2'))
        
        # S3 configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '30'))
        
        # Generate unique identifiers
        timestamp = str(int(time.time()))[-6:]
        random_suffix = str(random.randint(1000, 9999))
        
        # Normalize names for AWS compliance
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        app_name_normalized = self.app_name.lower().replace('_', '-')
        
        # Resource naming with environment suffix
        self.s3_bucket_name = f"{project_name_normalized}-{app_name_normalized}-logs{self.environment_suffix}-{timestamp}-{random_suffix}"
        self.iam_role_name = f"{project_name_normalized}-{app_name_normalized}-ec2-role{self.environment_suffix}-{timestamp}-{random_suffix}"
        self.launch_template_name = f"{project_name_normalized}-{app_name_normalized}-template{self.environment_suffix}-{timestamp}-{random_suffix}"
        self.asg_name = f"{project_name_normalized}-{app_name_normalized}-asg{self.environment_suffix}-{timestamp}-{random_suffix}"
        self.lb_name = f"{project_name_normalized}-{app_name_normalized}-lb{self.environment_suffix}-{timestamp}-{random_suffix}"[:32]
        self.target_group_name = f"{project_name_normalized}-{app_name_normalized}-tg{self.environment_suffix}-{timestamp}-{random_suffix}"[:32]
        self.log_group_name = f"/aws/ec2/{project_name_normalized}-{app_name_normalized}{self.environment_suffix}-{timestamp}-{random_suffix}"
        
        # Validate region
        if self.region not in ['us-west-2', 'us-east-1']:
            raise ValueError(f"Region must be us-west-2 or us-east-1, got {self.region}")
    
    def get_resource_name(self, resource_type: str, suffix: str = "") -> str:
        """Generate normalized resource name."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        app_name_normalized = self.app_name.lower().replace('_', '-')
        base_name = f"{project_name_normalized}-{app_name_normalized}-{resource_type}{self.environment_suffix}"
        return f"{base_name}{suffix}" if suffix else base_name
    
    def get_tag_name(self, resource_name: str) -> str:
        """Generate tag name for resources."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        app_name_normalized = self.app_name.lower().replace('_', '-')
        return f"{project_name_normalized}-{app_name_normalized}-{resource_name}{self.environment_suffix}"
    
    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            "Name": self.get_tag_name("webapp"),
            "Environment": self.environment,
            "Project": self.project_name,
            "Application": self.app_name,
            "ManagedBy": "Pulumi",
            "Purpose": "WebApplication"
        }
