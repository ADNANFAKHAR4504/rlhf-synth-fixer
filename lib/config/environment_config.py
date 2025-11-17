"""Environment-specific configuration."""
from typing import Dict, Any


class EnvironmentConfig:
    """Configuration for different environments."""

    # Development configuration
    DEV = {
        "environment": "dev",
        "account_id": "123456789012",
        "region": "us-east-1",
        "vpc_cidr": "10.0.0.0/16",
        "rds_instance_class": "db.t3.micro",
        "rds_multi_az": False,
        "rds_backup_retention": 1,
        "rds_skip_final_snapshot": True,
        "ecs_task_cpu": "256",
        "ecs_task_memory": "512",
        "ecs_desired_count": 1,
        "enable_nat_gateway": False,
        "database_name": "appdb",
        "master_username": "dbadmin"
    }

    # Staging configuration
    STAGING = {
        "environment": "staging",
        "account_id": "234567890123",
        "region": "us-east-1",
        "vpc_cidr": "10.1.0.0/16",
        "rds_instance_class": "db.t3.small",
        "rds_multi_az": False,
        "rds_backup_retention": 3,
        "rds_skip_final_snapshot": True,
        "ecs_task_cpu": "512",
        "ecs_task_memory": "1024",
        "ecs_desired_count": 2,
        "enable_nat_gateway": True,
        "database_name": "appdb",
        "master_username": "dbadmin"
    }

    # Production configuration
    PROD = {
        "environment": "prod",
        "account_id": "345678901234",
        "region": "us-east-1",
        "vpc_cidr": "10.2.0.0/16",
        "rds_instance_class": "db.t3.medium",
        "rds_multi_az": True,
        "rds_backup_retention": 7,
        "rds_skip_final_snapshot": False,
        "ecs_task_cpu": "1024",
        "ecs_task_memory": "2048",
        "ecs_desired_count": 3,
        "enable_nat_gateway": True,
        "database_name": "appdb",
        "master_username": "dbadmin"
    }

    @classmethod
    def get_config(cls, environment: str) -> Dict[str, Any]:
        """Get configuration for specified environment."""
        configs = {
            "dev": cls.DEV,
            "staging": cls.STAGING,
            "prod": cls.PROD
        }
        return configs.get(environment.lower(), cls.DEV)
