import json

import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from ..config import InfrastructureConfig


class SecretsComponent(ComponentResource):
  def __init__(self, name: str, config: InfrastructureConfig, opts: ResourceOptions = None):
    super().__init__('custom:secrets:SecretsComponent', name, None, opts)

    # Create application secrets
    self._create_app_secrets(name, config)

    # Create SSM parameters
    self._create_ssm_parameters(name, config)

    self.register_outputs({
      "app_secrets_arn": self.app_secrets.arn,
      "db_secrets_arn": self.db_secrets.arn
    })

  def _create_app_secrets(self, name: str, config: InfrastructureConfig):
    # Application configuration secrets
    self.app_secrets = aws.secretsmanager.Secret(
      f"{name}-app-secrets",
      name=f"{config.app_name}-{config.environment}-app-config",
      description=f"Application configuration for {config.app_name}-{config.environment}",
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-app-config"
      },
      opts=ResourceOptions(parent=self)
    )

    # Store application secrets
    app_config = {
      "api_key": "your-api-key-here",
      "jwt_secret": "your-jwt-secret-here",
      "encryption_key": "your-encryption-key-here"
    }

    aws.secretsmanager.SecretVersion(
      f"{name}-app-secrets-version",
      secret_id=self.app_secrets.id,
      secret_string=json.dumps(app_config),
      opts=ResourceOptions(parent=self)
    )

    # Database secrets
    self.db_secrets = aws.secretsmanager.Secret(
      f"{name}-db-secrets",
      name=f"{config.app_name}-{config.environment}-db-config",
      description=f"Database configuration for {config.app_name}-{config.environment}",
      tags={
        "Name": f"{config.app_name}-{config.environment}-db-config",
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    aws.secretsmanager.SecretVersion(
      f"{name}-db-secrets-version",
      secret_id=self.app_secrets.id,
      secret_string=json.dumps({
        "username": "admin",
        "engine": "mysql",
        "host": f"{config.app_name}-{config.environment}-db.region.rds.amazonaws.com",
        "port": 3306,
        "dbname": f"{config.app_name}_{config.environment}".replace("-", "_")
      }),
      opts=ResourceOptions(parent=self)
    )

  def _create_ssm_parameters(self, name: str, config: InfrastructureConfig):
    # Non-sensitive configuration parameters
    aws.ssm.Parameter(
      f"{name}-app-version",
      name=f"/{config.app_name}/{config.environment}/app/version",
      type="String",
      value="1.0.0",
      description="Application version",
      tags={
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    aws.ssm.Parameter(
      f"{name}-app-debug",
      name=f"/{config.app_name}/{config.environment}/app/debug",
      type="String",
      value="false" if config.environment == "prod" else "true",
      description="Debug mode flag",
      tags={
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    aws.ssm.Parameter(
      f"{name}-app-log-level",
      name=f"/{config.app_name}/{config.environment}/app/log_level",
      type="String",
      value="ERROR",
      description="Application log level",
      tags={
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )
