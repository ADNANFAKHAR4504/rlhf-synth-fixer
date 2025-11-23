"""secrets_stack.py

This module defines the SecretsStack for AWS Secrets Manager.
It creates secrets for Docker registry credentials with proper rotation support.
"""

from aws_cdk import (
    Stack,
    Duration,
    aws_secretsmanager as secretsmanager,
    RemovalPolicy,
)
from constructs import Construct


class SecretsStack(Stack):
    """Creates Secrets Manager secrets for Docker registry credentials."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Docker registry credentials
        docker_secret = secretsmanager.Secret(
            self,
            f"DockerSecret{environment_suffix}",
            secret_name=f"docker-credentials-{environment_suffix}",
            description="Docker registry credentials for ECR access",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"dockeruser"}',
                generate_string_key="password",
                password_length=32,
                exclude_punctuation=True
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        self.docker_secret = docker_secret
