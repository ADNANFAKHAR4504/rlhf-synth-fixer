"""
Configuration management module for Pulumi infrastructure.
Centralizes all configuration values and provides validation.
"""
from typing import Any, Dict, Optional

import pulumi


class InfraConfig:
    """Centralized configuration management for infrastructure."""

    def __init__(self):
        self.config = pulumi.Config()

        # EC2 Configuration
        self.ami_id = self.config.get("ami_id") or "ami-0c02fb55956c7d316"
        self.instance_type = self.config.get("instance_type") or "t3.medium"
        self.min_size = self.config.get_int("min_size") or 2
        self.max_size = self.config.get_int("max_size") or 6
        self.desired_capacity = self.config.get_int("desired_capacity") or 3

        # RDS Configuration
        self.db_instance_class = self.config.get("db_instance_class") or "db.t3.medium"
        self.db_name = self.config.get("db_name") or "financialdb"
        self.db_username = self.config.get("db_username") or "admin"
        self.db_password = self.config.get_secret("db_password") or pulumi.Output.secret("DefaultPassword123!")
        self.db_allocated_storage = self.config.get_int("db_allocated_storage") or 100

        # S3 Configuration
        self.data_bucket_name = self.config.get("data_bucket_name")
        self.logs_bucket_name = self.config.get("logs_bucket_name")

        # Tagging Configuration
        self.environment = self.config.get("environment") or "dev"
        self.owner = self.config.get("owner") or "default-owner"
        self.cost_center = self.config.get("cost_center") or "default-cc"
        self.project = self.config.get("project") or "default-project"

    def get_common_tags(self, additional_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Returns common tags to be applied to all resources.

        Args:
            additional_tags: Optional additional tags to merge

        Returns:
            Dictionary of tags
        """
        tags = {
            "Environment": self.environment,
            "Owner": self.owner,
            "CostCenter": self.cost_center,
            "Project": self.project,
            "ManagedBy": "Pulumi"
        }

        if additional_tags:
            tags.update(additional_tags)

        return tags
