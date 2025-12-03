"""
config.py

Configuration module for multi-environment infrastructure.
Provides environment-specific settings and validation.
"""

from typing import Dict, Any, Optional
import pulumi


class EnvironmentConfig:
    """Environment-specific configuration values."""

    def __init__(self, environment: str):
        self.environment = environment
        self.config = pulumi.Config()

        # Base domain configuration
        self.base_domain = self.config.get("base_domain") or "example.com"

        # Environment-specific configurations
        self.configs = {
            "dev": {
                "dynamodb_read_capacity": 5,
                "dynamodb_write_capacity": 5,
                "lambda_memory": 512,
                "lambda_timeout": 30,
                "s3_log_retention_days": 7,
                "api_throttle_burst": 500,
                "api_throttle_rate": 250,
                "dynamodb_pitr": False,
                "cost_center": "DEV-001",
                "domain_prefix": "dev.api",
            },
            "staging": {
                "dynamodb_read_capacity": 25,
                "dynamodb_write_capacity": 25,
                "lambda_memory": 1024,
                "lambda_timeout": 60,
                "s3_log_retention_days": 30,
                "api_throttle_burst": 2000,
                "api_throttle_rate": 1000,
                "dynamodb_pitr": True,
                "cost_center": "STG-001",
                "domain_prefix": "staging.api",
            },
            "prod": {
                "dynamodb_read_capacity": 100,
                "dynamodb_write_capacity": 100,
                "lambda_memory": 3008,
                "lambda_timeout": 120,
                "s3_log_retention_days": 90,
                "api_throttle_burst": 5000,
                "api_throttle_rate": 2500,
                "dynamodb_pitr": True,
                "cost_center": "PROD-001",
                "domain_prefix": "api",
            }
        }

        # Validate environment
        if environment not in self.configs:
            raise ValueError(f"Invalid environment: {environment}. Must be one of: {list(self.configs.keys())}")

        self.current_config = self.configs[environment]

    def get(self, key: str) -> Any:
        """Get configuration value for current environment."""
        return self.current_config.get(key)

    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            "Environment": self.environment,
            "ManagedBy": "Pulumi",
            "CostCenter": self.get("cost_center"),
            "Project": "PaymentProcessing",
        }

    def get_domain(self) -> str:
        """Get full domain for current environment."""
        return f"{self.get('domain_prefix')}.{self.base_domain}"

    def validate_capacity(self) -> None:
        """Validate that capacity values are within acceptable ranges."""
        read_capacity = self.get("dynamodb_read_capacity")
        write_capacity = self.get("dynamodb_write_capacity")

        if read_capacity < 1 or read_capacity > 1000:
            raise ValueError(f"DynamoDB read capacity must be between 1 and 1000, got {read_capacity}")

        if write_capacity < 1 or write_capacity > 1000:
            raise ValueError(f"DynamoDB write capacity must be between 1 and 1000, got {write_capacity}")

        memory = self.get("lambda_memory")
        if memory < 128 or memory > 10240:
            raise ValueError(f"Lambda memory must be between 128 and 10240 MB, got {memory}")
