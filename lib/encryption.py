"""KMS encryption keys with granular key policies"""
from typing import Dict, Any
import json
from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias


class ZeroTrustEncryption(Construct):
    """
    Creates KMS keys with granular policies for Zero Trust encryption.

    This construct implements:
    - KMS keys with automatic rotation
    - Granular key policies restricting usage to specific services and principals
    - Separate keys for different data classification levels
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        account_id: str,
        aws_region: str,
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.account_id = account_id
        self.aws_region = aws_region

        # Create KMS keys for different purposes
        self.cloudtrail_key = self._create_cloudtrail_key()
        self.s3_key = self._create_s3_key()
        self.rds_key = self._create_rds_key()
        self.general_key = self._create_general_key()

    def _create_cloudtrail_key(self) -> KmsKey:
        """Create KMS key for CloudTrail logs"""

        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudTrail to encrypt logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": [
                        "kms:GenerateDataKey*",
                        "kms:DecryptDataKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringLike": {
                            "kms:EncryptionContext:aws:cloudtrail:arn": (
                                f"arn:aws:cloudtrail:{self.aws_region}:"
                                f"{self.account_id}:trail/*"
                            )
                        }
                    }
                },
                {
                    "Sid": "Allow CloudTrail to describe key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "kms:DescribeKey",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{self.aws_region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                }
            ]
        }

        key = KmsKey(
            self,
            "cloudtrail_key",
            description=f"KMS key for CloudTrail logs - {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps(key_policy),
            tags={
                "Name": f"zero-trust-cloudtrail-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "CloudTrail",
            },
        )

        KmsAlias(
            self,
            "cloudtrail_key_alias",
            name=f"alias/zero-trust-cloudtrail-{self.environment_suffix}",
            target_key_id=key.key_id,
        )

        return key

    def _create_s3_key(self) -> KmsKey:
        """Create KMS key for S3 bucket encryption"""

        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow S3 to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "s3.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*"
                },
                {
                    "Sid": "Deny unencrypted uploads",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:PutObject",
                    "Resource": "*",
                    "Condition": {
                        "StringNotEquals": {
                            "s3:x-amz-server-side-encryption": "aws:kms"
                        }
                    }
                }
            ]
        }

        key = KmsKey(
            self,
            "s3_key",
            description=f"KMS key for S3 bucket encryption - {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps(key_policy),
            tags={
                "Name": f"zero-trust-s3-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "S3",
            },
        )

        KmsAlias(
            self,
            "s3_key_alias",
            name=f"alias/zero-trust-s3-{self.environment_suffix}",
            target_key_id=key.key_id,
        )

        return key

    def _create_rds_key(self) -> KmsKey:
        """Create KMS key for RDS encryption"""

        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow RDS to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "rds.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey",
                        "kms:CreateGrant"
                    ],
                    "Resource": "*"
                }
            ]
        }

        key = KmsKey(
            self,
            "rds_key",
            description=f"KMS key for RDS encryption - {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps(key_policy),
            tags={
                "Name": f"zero-trust-rds-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "RDS",
            },
        )

        KmsAlias(
            self,
            "rds_key_alias",
            name=f"alias/zero-trust-rds-{self.environment_suffix}",
            target_key_id=key.key_id,
        )

        return key

    def _create_general_key(self) -> KmsKey:
        """Create general-purpose KMS key"""

        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                }
            ]
        }

        key = KmsKey(
            self,
            "general_key",
            description=f"General KMS key for Zero Trust - {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps(key_policy),
            tags={
                "Name": f"zero-trust-general-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "General",
            },
        )

        KmsAlias(
            self,
            "general_key_alias",
            name=f"alias/zero-trust-general-{self.environment_suffix}",
            target_key_id=key.key_id,
        )

        return key
