"""
KMS Key Construct
Creates customer-managed KMS keys with automatic rotation
"""

import json

from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from constructs import Construct


class KmsKeyConstruct(Construct):
    """
    KMS customer-managed key construct with automatic rotation.
    """

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str,
        description: str,
    ):
        super().__init__(scope, id)

        # KMS Key Policy
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::ACCOUNT_ID:root"
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
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "kms:ViaService": f"rds.{region}.amazonaws.com"
                        }
                    }
                },
                {
                    "Sid": "Allow DynamoDB to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "dynamodb.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey",
                        "kms:CreateGrant"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "kms:ViaService": f"dynamodb.{region}.amazonaws.com"
                        }
                    }
                },
                {
                    "Sid": "Allow Secrets Manager to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "secretsmanager.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "kms:ViaService": f"secretsmanager.{region}.amazonaws.com"
                        }
                    }
                }
            ]
        }

        # Create KMS Key
        self.kms_key = KmsKey(
            self,
            "key",
            description=description,
            deletion_window_in_days=7,  # Minimum for testing
            enable_key_rotation=True,  # Automatic rotation enabled
            policy=json.dumps(key_policy),
            tags={
                "Name": f"kms-key-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region,
            }
        )

        # Create KMS Alias
        KmsAlias(
            self,
            "alias",
            name=f"alias/{environment_suffix}-{region}",
            target_key_id=self.kms_key.key_id,
        )

    @property
    def key_id(self) -> str:
        return self.kms_key.key_id

    @property
    def key_arn(self) -> str:
        return self.kms_key.arn