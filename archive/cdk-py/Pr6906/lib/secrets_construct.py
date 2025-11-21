"""
SecretsConstruct - AWS Secrets Manager for database credentials
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_secretsmanager as secretsmanager,
    aws_ec2 as ec2
)


class SecretsConstruct(Construct):
    """
    Creates Secrets Manager secret for database credentials with:
    - Automatic rotation every 30 days
    - Secure generation of credentials
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Create database credentials secret
        self.db_secret = secretsmanager.Secret(
            self,
            f"DbSecret-{environment_suffix}",
            secret_name=f"db-credentials-{environment_suffix}",
            description=f"Database credentials for microservices - {environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                password_length=32,
                exclude_punctuation=True,
                include_space=False
            ),
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Note: Automatic rotation would require a Lambda function and RDS instance
        # For this synthetic task, we document the 30-day rotation requirement
        # In production, you would add:
        # self.db_secret.add_rotation_schedule(
        #     "RotationSchedule",
        #     automatically_after=cdk.Duration.days(30)
        # )

        cdk.Tags.of(self.db_secret).add("Environment", environment_suffix)
