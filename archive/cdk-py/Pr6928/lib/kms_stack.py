"""kms_stack.py
KMS customer-managed keys for encryption in both regions.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_kms as kms
from aws_cdk import aws_iam as iam
from constructs import Construct


class KmsStackProps:
    """Properties for KMS stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region


class KmsStack(Construct):
    """Creates customer-managed KMS keys in both regions."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: KmsStackProps
    ):
        super().__init__(scope, construct_id)

        # Primary region KMS key
        self.primary_key = kms.Key(
            self,
            f'PrimaryKmsKey{props.environment_suffix}',
            description=f'Primary region KMS key for DR solution - {props.environment_suffix}',
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            alias=f'alias/dr-primary-{props.environment_suffix}'
        )

        # Secondary region KMS key (multi-region key for cross-region access)
        self.secondary_key = kms.Key(
            self,
            f'SecondaryKmsKey{props.environment_suffix}',
            description=f'Secondary region KMS key for DR solution - {props.environment_suffix}',
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            alias=f'alias/dr-secondary-{props.environment_suffix}'
        )

        # Grant necessary permissions for cross-region access
        self.primary_key.grant_encrypt_decrypt(
            iam.ArnPrincipal(f'arn:aws:iam::{cdk.Aws.ACCOUNT_ID}:root')
        )
        self.secondary_key.grant_encrypt_decrypt(
            iam.ArnPrincipal(f'arn:aws:iam::{cdk.Aws.ACCOUNT_ID}:root')
        )

        # Tags
        cdk.Tags.of(self.primary_key).add('DR-Role', 'Primary-Encryption')
        cdk.Tags.of(self.secondary_key).add('DR-Role', 'Secondary-Encryption')

        # Outputs
        cdk.CfnOutput(
            self,
            'PrimaryKeyId',
            value=self.primary_key.key_id,
            description='Primary KMS key ID'
        )
        cdk.CfnOutput(
            self,
            'SecondaryKeyId',
            value=self.secondary_key.key_id,
            description='Secondary KMS key ID'
        )