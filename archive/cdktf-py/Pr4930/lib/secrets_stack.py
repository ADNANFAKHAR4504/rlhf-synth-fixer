"""AWS Secrets Manager stack."""

from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json


class SecretsStack(Construct):
    """Secrets Manager for storing sensitive configuration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        """Initialize secrets."""
        super().__init__(scope, construct_id)

        # Database connection secret
        self.db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"pc/db-{environment_suffix}",
            description="Database connection string for product catalog",
            tags={
                "Name": f"product-catalog-db-secret-{environment_suffix}"
            }
        )

        # Store sample database connection string
        SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                "host": "localhost",
                "port": "5432",
                "username": "dbadmin",
                "password": "changeme123",
                "database": "product_catalog"
            })
        )

        # API keys secret
        self.api_secret = SecretsmanagerSecret(
            self,
            "api_secret",
            name=f"pc/api-{environment_suffix}",
            description="API keys for product catalog service",
            tags={
                "Name": f"product-catalog-api-secret-{environment_suffix}"
            }
        )

        # Store sample API keys
        SecretsmanagerSecretVersion(
            self,
            "api_secret_version",
            secret_id=self.api_secret.id,
            secret_string=json.dumps({
                "api_key": "sample-api-key-12345",
                "api_secret": "sample-api-secret-67890",
                "external_service_key": "external-key-abcdef"
            })
        )

    @property
    def db_secret_arn(self):
        """Return database secret ARN."""
        return self.db_secret.arn

    @property
    def api_secret_arn(self):
        """Return API secret ARN."""
        return self.api_secret.arn
