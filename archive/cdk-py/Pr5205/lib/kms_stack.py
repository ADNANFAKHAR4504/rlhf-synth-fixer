"""
KMS Stack for Disaster Recovery Infrastructure

This module creates KMS keys for encryption:
- Database encryption key for RDS
- EFS encryption key
- Secrets Manager encryption key
- Proper key policies for service access
"""

from aws_cdk import (
    aws_kms as kms,
    aws_iam as iam,
    CfnOutput,
    NestedStack,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class KMSStack(NestedStack):
    """
    Creates KMS keys for encrypting various AWS resources
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # KMS Key for RDS encryption
        self.rds_key = kms.Key(
            self,
            f"RDSEncryptionKey-{environment_suffix}",
            description=f"KMS key for RDS database encryption - {environment_suffix}",
            alias=f"alias/dr-rds-{environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
            pending_window=Duration.days(7),
        )

        # Grant RDS service permission to use the key
        self.rds_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Allow RDS to use the key",
                principals=[iam.ServicePrincipal("rds.amazonaws.com")],
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:CreateGrant",
                ],
                resources=["*"],
            )
        )

        # KMS Key for EFS encryption
        self.efs_key = kms.Key(
            self,
            f"EFSEncryptionKey-{environment_suffix}",
            description=f"KMS key for EFS file system encryption - {environment_suffix}",
            alias=f"alias/dr-efs-{environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
            pending_window=Duration.days(7),
        )

        # KMS Key for Secrets Manager
        self.secrets_key = kms.Key(
            self,
            f"SecretsEncryptionKey-{environment_suffix}",
            description=f"KMS key for Secrets Manager encryption - {environment_suffix}",
            alias=f"alias/dr-secrets-{environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
            pending_window=Duration.days(7),
        )

        # Grant Secrets Manager permission to use the key
        self.secrets_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Allow Secrets Manager to use the key",
                principals=[iam.ServicePrincipal("secretsmanager.amazonaws.com")],
                actions=[
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey",
                ],
                resources=["*"],
            )
        )

        # Outputs
        CfnOutput(
            self,
            "RDSKeyId",
            value=self.rds_key.key_id,
            description="KMS Key ID for RDS encryption",
            export_name=f"rds-kms-key-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "RDSKeyArn",
            value=self.rds_key.key_arn,
            description="KMS Key ARN for RDS encryption",
            export_name=f"rds-kms-key-arn-{environment_suffix}",
        )

        CfnOutput(
            self,
            "EFSKeyId",
            value=self.efs_key.key_id,
            description="KMS Key ID for EFS encryption",
            export_name=f"efs-kms-key-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "SecretsKeyId",
            value=self.secrets_key.key_id,
            description="KMS Key ID for Secrets encryption",
            export_name=f"secrets-kms-key-id-{environment_suffix}",
        )
