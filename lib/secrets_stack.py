"""
secrets_stack.py

AWS Secrets Manager for database credentials.
Securely stores RDS PostgreSQL credentials with encryption.
"""

from typing import Optional, Dict
import json
import pulumi
from pulumi import ResourceOptions
from pulumi_aws import secretsmanager
import pulumi_random as random


class SecretsStack(pulumi.ComponentResource):
    """
    Secrets Manager stack for database credentials.

    Creates:
    - Random password for RDS
    - Secrets Manager secret with database credentials
    - Encryption at rest
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: Optional[Dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:secrets:SecretsStack', name, None, opts)

        resource_tags = tags or {}

        # Generate random password for database
        self.db_password = random.RandomPassword(
            f"db-password-{environment_suffix}",
            length=32,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?",
            opts=ResourceOptions(parent=self)
        )

        # Create database username
        db_username = "japancart_admin"

        # Create secret with credentials
        # Build secret value using Output.concat to avoid json.dumps in apply()
        secret_value = pulumi.Output.concat(
            '{"username": "', db_username,
            '", "password": "', self.db_password.result,
            '", "engine": "postgres", "host": "placeholder", "port": 5432, "dbname": "transactions"}'
        )

        self.db_secret = secretsmanager.Secret(
            f"db-credentials-{environment_suffix}",
            name=f"db-credentials-{environment_suffix}",
            description=f"RDS PostgreSQL credentials for {environment_suffix}",
            tags={
                **resource_tags,
                'Name': f"db-credentials-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        self.db_secret_version = secretsmanager.SecretVersion(
            f"db-credentials-version-{environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=secret_value,
            opts=ResourceOptions(parent=self)
        )

        # Export values
        self.db_secret_arn = self.db_secret.arn
        self.db_username = db_username
        self.db_password_value = self.db_password.result

        self.register_outputs({
            'db_secret_arn': self.db_secret_arn,
            'db_username': pulumi.Output.secret(db_username),
            'db_password': pulumi.Output.secret(self.db_password_value)
        })
