"""
Secrets Manager Stack for Disaster Recovery Infrastructure

This module manages database credentials:
- Creates Secrets Manager secret for database credentials
- Configures automatic rotation every 30 days
- Uses KMS encryption for the secret
- Proper IAM policies for access control
"""

from aws_cdk import (
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_iam as iam,
    CfnOutput,
    NestedStack,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class SecretsStack(NestedStack):
    """
    Creates and manages Secrets Manager secret for database credentials
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        kms_key: kms.Key,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create database credentials secret
        self.db_secret = secretsmanager.Secret(
            self,
            f"DBCredentials-{environment_suffix}",
            secret_name=f"dr-db-credentials-{environment_suffix}",
            description=f"Database credentials for disaster recovery RDS - {environment_suffix}",
            encryption_key=kms_key,
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"dbadmin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                exclude_characters='/@"\\\'',
                password_length=32,
                require_each_included_type=True,
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Keep the hosted rotation Lambda name within AWS' 64 character limit
        base_rotation_name = f"dr-db-rotation-{environment_suffix}"
        rotation_function_name = base_rotation_name[:64]

        # Enable automated rotation every 30 days using the AWS hosted rotation Lambda
        self.rotation_schedule = self.db_secret.add_rotation_schedule(
            f"DBSecretRotation-{environment_suffix}",
            hosted_rotation=secretsmanager.HostedRotation.postgre_sql_single_user(
                function_name=rotation_function_name,
            ),
            automatically_after=Duration.days(30),
        )

        # The hosted rotation Lambda runs out-of-the-box. For stricter environments
        # (e.g., private subnets) provide VPC configuration to the hosted rotation.

        # Create IAM policy for secret access
        self.secret_read_policy = iam.ManagedPolicy(
            self,
            f"SecretReadPolicy-{environment_suffix}",
            managed_policy_name=f"dr-secret-read-policy-{environment_suffix}",
            description="Policy to read database credentials from Secrets Manager",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret",
                    ],
                    resources=[self.db_secret.secret_arn],
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Decrypt",
                        "kms:DescribeKey",
                    ],
                    resources=[kms_key.key_arn],
                ),
            ],
        )

        # Outputs
        CfnOutput(
            self,
            "SecretArn",
            value=self.db_secret.secret_arn,
            description="ARN of the database credentials secret",
            export_name=f"db-secret-arn-{environment_suffix}",
        )

        CfnOutput(
            self,
            "SecretName",
            value=self.db_secret.secret_name,
            description="Name of the database credentials secret",
            export_name=f"db-secret-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "SecretReadPolicyArn",
            value=self.secret_read_policy.managed_policy_arn,
            description="ARN of the secret read policy",
            export_name=f"secret-read-policy-arn-{environment_suffix}",
        )
