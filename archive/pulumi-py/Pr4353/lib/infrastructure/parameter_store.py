"""
Parameter Store module for EC2 failure recovery infrastructure.
Manages sensitive configuration data using SecureString parameters.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class ParameterStoreStack:
    """Parameter Store resources for EC2 recovery configuration."""
    
    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.parameters = self._create_parameters()
    
    def _create_parameters(self) -> Dict[str, aws.ssm.Parameter]:
        """Create Parameter Store parameters for configuration."""
        parameters = {}
        
        # Email configuration
        import random
        random_suffix = str(random.randint(1000, 9999))
        parameters['alert_email'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('alert-email-param')}-{random_suffix}",
            name=self.config.get_parameter_name("alert-email"),
            type="String",
            value=self.config.alert_email,
            description="Email address for EC2 recovery alerts",
            tags={
                "Name": self.config.get_tag_name("alert-email-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
        
        # Retry configuration
        parameters['max_retry_attempts'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('max-retry-param')}-{random_suffix}",
            name=self.config.get_parameter_name("max-retry-attempts"),
            type="String",
            value=str(self.config.max_retry_attempts),
            description="Maximum number of retry attempts for EC2 recovery",
            tags={
                "Name": self.config.get_tag_name("max-retry-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
        
        # Retry interval
        parameters['retry_interval_minutes'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('retry-interval-param')}-{random_suffix}",
            name=self.config.get_parameter_name("retry-interval-minutes"),
            type="String",
            value=str(self.config.retry_interval_minutes),
            description="Retry interval in minutes for EC2 recovery",
            tags={
                "Name": self.config.get_tag_name("retry-interval-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
        
        # S3 bucket name
        parameters['s3_bucket_name'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('s3-bucket-param')}-{random_suffix}",
            name=self.config.get_parameter_name("s3-bucket-name"),
            type="String",
            value=self.config.s3_bucket_name,
            description="S3 bucket name for EC2 recovery state storage",
            tags={
                "Name": self.config.get_tag_name("s3-bucket-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
        
        # SNS topic name
        parameters['sns_topic_arn'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('sns-topic-param')}-{random_suffix}",
            name=self.config.get_parameter_name("sns-topic-arn"),
            type="String",
            value=f"arn:aws:sns:{self.config.region}:*:{self.config.sns_topic_name}",
            description="SNS topic ARN for EC2 recovery alerts",
            tags={
                "Name": self.config.get_tag_name("sns-topic-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
        
        return parameters
    
    def get_parameter_name(self, key: str) -> str:
        """Get the full parameter name for a given key."""
        return self.config.get_parameter_name(key)
    
    def get_parameter_arn(self, key: str) -> str:
        """Get the parameter ARN for a given key."""
        return f"arn:aws:ssm:{self.config.region}:*:parameter{self.config.get_parameter_name(key)}"
