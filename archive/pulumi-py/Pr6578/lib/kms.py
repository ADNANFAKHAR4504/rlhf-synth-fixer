"""KMS Module for EKS Envelope Encryption.

This module creates a KMS key for encrypting Kubernetes secrets at rest.
"""

import pulumi
import pulumi_aws as aws
import json


def create_kms_key(environment_suffix: str, account_id: str) -> aws.kms.Key:
    """
    Create KMS key for EKS envelope encryption.

    Args:
        environment_suffix: Unique suffix for resource naming
        account_id: AWS account ID

    Returns:
        KMS Key resource
    """
    # KMS key policy
    key_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{account_id}:root"
                },
                "Action": "kms:*",
                "Resource": "*"
            },
            {
                "Sid": "Allow EKS to use the key",
                "Effect": "Allow",
                "Principal": {
                    "Service": "eks.amazonaws.com"
                },
                "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:CreateGrant"
                ],
                "Resource": "*"
            }
        ]
    }

    # Create KMS key
    kms_key = aws.kms.Key(
        f"eks-kms-key-{environment_suffix}",
        description=f"KMS key for EKS cluster {environment_suffix} envelope encryption",
        deletion_window_in_days=7,
        enable_key_rotation=True,
        policy=pulumi.Output.all().apply(lambda _: json.dumps(key_policy)),
        tags={
            "Name": f"eks-kms-key-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # Create KMS key alias
    aws.kms.Alias(
        f"eks-kms-alias-{environment_suffix}",
        name=f"alias/eks-{environment_suffix}",
        target_key_id=kms_key.id
    )

    return kms_key
