"""KMS keys for encryption."""
import json

from cdktf_cdktf_provider_aws.data_aws_caller_identity import \
    DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from constructs import Construct


class KmsConstruct(Construct):
    """Manages KMS keys for various services."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # Get AWS account ID and region for KMS policies
        caller_identity = DataAwsCallerIdentity(self, "current")
        current_region = DataAwsRegion(self, "current-region")

        # Lambda encryption key
        self.lambda_key = KmsKey(
            self, "lambda-key",
            description=f"KMS key for Lambda encryption - {environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"payment-lambda-key-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        KmsAlias(self, "lambda-key-alias",
                name=f"alias/payment-lambda-{environment_suffix}-ef",
                target_key_id=self.lambda_key.key_id)

        # SQS encryption key
        self.sqs_key = KmsKey(
            self, "sqs-key",
            description=f"KMS key for SQS encryption - {environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"payment-sqs-key-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        KmsAlias(self, "sqs-key-alias",
                name=f"alias/payment-sqs-{environment_suffix}-ef",
                target_key_id=self.sqs_key.key_id)

        # DynamoDB encryption key
        self.dynamodb_key = KmsKey(
            self, "dynamodb-key",
            description=f"KMS key for DynamoDB encryption - {environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"payment-dynamodb-key-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        KmsAlias(self, "dynamodb-key-alias",
                name=f"alias/payment-dynamodb-{environment_suffix}-ef",
                target_key_id=self.dynamodb_key.key_id)

        # CloudWatch Logs encryption key with proper policy
        logs_key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{caller_identity.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{current_region.id}.amazonaws.com"
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
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{current_region.id}:{caller_identity.account_id}:log-group:*"
                        }
                    }
                }
            ]
        }

        self.logs_key = KmsKey(
            self, "logs-key",
            description=f"KMS key for CloudWatch Logs encryption - {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps(logs_key_policy),
            tags={
                "Name": f"payment-logs-key-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        KmsAlias(self, "logs-key-alias",
                name=f"alias/payment-logs-{environment_suffix}-ef",
                target_key_id=self.logs_key.key_id)
