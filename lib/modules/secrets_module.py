"""
Secrets Module - Manages AWS Secrets Manager secrets and data sources.
Provides workspace-aware secret paths and retrieval.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion
import json


class SecretsModule(Construct):
    """
    Secrets Module for managing sensitive configuration.
    Creates and retrieves secrets from AWS Secrets Manager with workspace-aware naming.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        version: str = "v2",
        **kwargs
    ):
        """
        Initialize Secrets module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
            version: Version suffix for resource naming (default: v2)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace
        self.version = version

        # Create database credentials secret
        self.db_secret = SecretsmanagerSecret(
            self,
            f"db-credentials-{version}-{environment_suffix}",
            name=f"{workspace}/database/credentials-{environment_suffix}-{version}",
            description=f"Database credentials for {workspace} environment",
            recovery_window_in_days=0,  # Set to 0 for immediate deletion (destroyability)
            tags={
                "Name": f"db-credentials-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create initial secret version with placeholder values
        # In production, these should be rotated and managed securely
        db_credentials = {
            "username": f"dbadmin_{workspace}",
            "password": "ChangeMe123!",  # Placeholder - should be rotated
            "engine": "aurora-postgresql",
            "host": "placeholder.rds.amazonaws.com",
            "port": 5432,
            "dbname": f"appdb_{workspace}"
        }

        self.db_secret_version = SecretsmanagerSecretVersion(
            self,
            f"db-secret-version-{version}-{environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(db_credentials)
        )

        # Create application config secret
        self.app_secret = SecretsmanagerSecret(
            self,
            f"app-config-{version}-{environment_suffix}",
            name=f"{workspace}/application/config-{environment_suffix}-{version}",
            description=f"Application configuration for {workspace} environment",
            recovery_window_in_days=0,
            tags={
                "Name": f"app-config-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        app_config = {
            "api_key": "placeholder-api-key",
            "encryption_key": "placeholder-encryption-key",
            "feature_flags": {
                "enable_advanced_features": workspace == "prod"
            }
        }

        self.app_secret_version = SecretsmanagerSecretVersion(
            self,
            f"app-secret-version-{version}-{environment_suffix}",
            secret_id=self.app_secret.id,
            secret_string=json.dumps(app_config)
        )

    def get_db_secret_arn(self) -> str:
        """Return database secret ARN."""
        return self.db_secret.arn

    def get_app_secret_arn(self) -> str:
        """Return application secret ARN."""
        return self.app_secret.arn

    @staticmethod
    def get_secret_value(scope: Construct, secret_name: str, construct_id: str) -> str:
        """
        Retrieve secret value from AWS Secrets Manager.

        Args:
            scope: The scope in which to define this data source
            secret_name: Name of the secret to retrieve
            construct_id: Unique construct ID

        Returns:
            Secret value as string
        """
        secret = DataAwsSecretsmanagerSecret(
            scope,
            construct_id,
            name=secret_name
        )

        secret_version = DataAwsSecretsmanagerSecretVersion(
            scope,
            f"{construct_id}-version",
            secret_id=secret.id
        )

        return secret_version.secret_string
