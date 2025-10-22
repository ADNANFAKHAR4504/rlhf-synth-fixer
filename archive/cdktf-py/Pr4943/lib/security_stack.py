"""Security infrastructure stack with KMS and Secrets Manager."""

from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class SecurityStack(Construct):
    """Security infrastructure for encryption and secrets management."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        """Initialize security stack."""
        super().__init__(scope, construct_id)

        # Get AWS account information
        account = DataAwsCallerIdentity(self, "current")

        # Create KMS key for encryption with customer managed key
        self.kms_key = KmsKey(
            self,
            "healthcare_kms_key",
            description=f"KMS key for healthcare platform encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=30,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{account.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow services to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "rds.amazonaws.com",
                                "elasticache.amazonaws.com",
                                "ecs.amazonaws.com",
                                "secretsmanager.amazonaws.com",
                                "logs.amazonaws.com"
                            ]
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey",
                            "kms:CreateGrant"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": f"logs.us-east-1.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:us-east-1:{account.account_id}:log-group:*"
                            }
                        }
                    }
                ]
            }),
            tags={
                "Name": f"healthcare-kms-key-{environment_suffix}"
            }
        )

        # Create KMS alias for easier reference
        KmsAlias(
            self,
            "healthcare_kms_alias",
            name=f"alias/healthcare-{environment_suffix}",
            target_key_id=self.kms_key.id
        )

        # Create Secrets Manager secret for database credentials
        self.db_secret = SecretsmanagerSecret(
            self,
            "db_credentials",
            name=f"healthcare/db/credentials-{environment_suffix}",
            description="Database credentials for healthcare platform",
            kms_key_id=self.kms_key.id,
            recovery_window_in_days=0,
            force_overwrite_replica_secret=True,
            tags={
                "Name": f"healthcare-db-secret-{environment_suffix}"
            }
        )

        # Create initial secret version with placeholder values
        SecretsmanagerSecretVersion(
            self,
            "db_credentials_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                "username": "healthadmin",
                "password": "ChangeMe123!",
                "engine": "postgres",
                "host": "localhost",
                "port": 5432,
                "dbname": "healthcare"
            })
        )

    @property
    def kms_key_arn(self):
        """Return KMS key ARN."""
        return self.kms_key.arn

    @property
    def db_secret_id(self):
        """Return database secret ID."""
        return self.db_secret.id

    @property
    def db_secret_arn(self):
        """Return database secret ARN."""
        return self.db_secret.arn
