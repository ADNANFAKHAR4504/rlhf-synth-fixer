"""security_construct.py
KMS encryption keys and security configurations.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_kms as kms,
    aws_iam as iam
)


class SecurityConstruct(Construct):
    """
    Creates security resources including KMS keys and IAM policies
    for HIPAA-compliant healthcare data platform.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_region: str,
        dr_region: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS key for encryption
        self.kms_key = kms.Key(
            self,
            f"EncryptionKey-{environment_suffix}",
            alias=f"healthcare-key-{environment_suffix}",
            description="KMS key for healthcare data encryption",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            pending_window=cdk.Duration.days(7)
        )

        # Grant necessary permissions for CloudWatch Logs
        self.kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Allow CloudWatch Logs",
                principals=[
                    iam.ServicePrincipal(f"logs.{primary_region}.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn":
                        f"arn:aws:logs:{primary_region}:{cdk.Aws.ACCOUNT_ID}:*"
                    }
                }
            )
        )
