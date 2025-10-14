import os
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
        
        # Normalize names for AWS compliance
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        app_name_normalized = self.app_name.lower().replace('_', '-')
        region_normalized = self.region.replace('-', '')
        
        # Resource naming with stable identifiers (environment + region + environment for uniqueness)
        self.s3_bucket_name = f"{project_name_normalized}-{app_name_normalized}-mlogs-{region_normalized}-{environment_normalized}"
        self.iam_role_name = f"{project_name_normalized}-{app_name_normalized}-mec2-role-{region_normalized}-{environment_normalized}"
        self.launch_template_name = f"{project_name_normalized}-{app_name_normalized}-mtemplate-{region_normalized}-{environment_normalized}"
        self.asg_name = f"{project_name_normalized}-{app_name_normalized}-masg-{region_normalized}-{environment_normalized}"
        self.lb_name = f"{project_name_normalized}-{app_name_normalized}-mlb-{region_normalized}-{environment_normalized}"[:32]
        self.target_group_name = f"{project_name_normalized}-{app_name_normalized}-mtg-{region_normalized}-{environment_normalized}"[:32]
        self.log_group_name = f"/aws/ec2/{project_name_normalized}-{app_name_normalized}-mlogs-{region_normalized}-{environment_normalized}"
        
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
        region_normalized = self.region.replace('-', '')
        return f"{project_name_normalized}-{app_name_normalized}-{resource_name}-{environment_normalized}-{region_normalized}-{environment_normalized}"
    
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
