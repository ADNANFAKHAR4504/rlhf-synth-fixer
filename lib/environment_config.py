"""Environment-specific configuration for multi-environment deployment."""

from typing import Dict, Any


class EnvironmentConfig:
    """Configuration manager for environment-specific settings."""

    # Environment-specific configurations
    CONFIGS: Dict[str, Dict[str, Any]] = {
        "dev": {
            "lambda_memory": 256,
            "lambda_timeout": 30,
            "rds_backup_retention": 1,
            "rds_instance_class": "db.t3.micro",
            "rds_multi_az": False,
            "dynamodb_billing_mode": "PAY_PER_REQUEST",
            "dynamodb_read_capacity": None,
            "dynamodb_write_capacity": None,
            "s3_versioning_enabled": False,
            "cloudwatch_log_retention": 7,
            "api_stage_name": "dev",
        },
        "staging": {
            "lambda_memory": 512,
            "lambda_timeout": 60,
            "rds_backup_retention": 7,
            "rds_instance_class": "db.t3.small",
            "rds_multi_az": False,
            "dynamodb_billing_mode": "PAY_PER_REQUEST",
            "dynamodb_read_capacity": None,
            "dynamodb_write_capacity": None,
            "s3_versioning_enabled": False,
            "cloudwatch_log_retention": 30,
            "api_stage_name": "staging",
        },
        "prod": {
            "lambda_memory": 1024,
            "lambda_timeout": 120,
            "rds_backup_retention": 30,
            "rds_instance_class": "db.t3.medium",
            "rds_multi_az": False,
            "dynamodb_billing_mode": "PROVISIONED",
            "dynamodb_read_capacity": 5,
            "dynamodb_write_capacity": 5,
            "s3_versioning_enabled": True,
            "cloudwatch_log_retention": 90,
            "api_stage_name": "prod",
        },
    }

    @classmethod
    def get_config(cls, environment: str) -> Dict[str, Any]:
        """
        Get configuration for specified environment.

        Args:
            environment: Environment name (dev, staging, prod)

        Returns:
            Configuration dictionary for the environment

        Raises:
            ValueError: If environment is not recognized
        """
        if environment not in cls.CONFIGS:
            raise ValueError(
                f"Unknown environment: {environment}. "
                f"Valid options: {', '.join(cls.CONFIGS.keys())}"
            )
        return cls.CONFIGS[environment]

    @classmethod
    def get_vpc_cidr(cls, environment: str) -> str:
        """
        Get VPC CIDR block for environment.

        Args:
            environment: Environment name (dev, staging, prod)

        Returns:
            CIDR block for the environment
        """
        vpc_cidrs = {
            "dev": "10.0.0.0/16",
            "staging": "10.1.0.0/16",
            "prod": "10.2.0.0/16",
        }
        return vpc_cidrs.get(environment, "10.0.0.0/16")
