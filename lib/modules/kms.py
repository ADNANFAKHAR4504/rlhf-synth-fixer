"""KMS module for encryption key management."""
import pulumi
import pulumi_aws as aws
import os


class KMSManager:
  """Manages KMS keys for encryption across all services."""

  def __init__(self, project_name: str, environment: str):
    self.project_name = project_name
    self.environment = environment
    self.account_id = os.getenv('AWS_ACCOUNT_ID')

  def create_master_key(self) -> aws.kms.Key:
    """Create master KMS key for primary encryption."""
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
                    "kms:DescribeKey",
                    "kms:Encrypt",
                    "kms:ReEncrypt*",
                    "kms:Decrypt"
                ],
                "Resource": "*"
            },
            {
                "Sid": "Allow S3 service to use the key",
                "Effect": "Allow",
                "Principal": {
                    "Service": "s3.amazonaws.com"
                },
                "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey*"
                ],
                "Resource": "*"
            }
        ]
    }

    master_key = aws.kms.Key(
        f"{self.project_name}-master-key",
        description=f"Master KMS key for {self.project_name} encryption",
        key_usage="ENCRYPT_DECRYPT",
        customer_master_key_spec="SYMMETRIC_DEFAULT",
        key_rotation_status=True,
        deletion_window_in_days=30,
        policy=pulumi.Output.json_dumps(key_policy),
        tags={
            "Name": f"{self.project_name}-master-key",
            "Environment": self.environment,
            "Purpose": "master-encryption",
            "ManagedBy": "pulumi"
        }
    )

    # Create alias for the key
    aws.kms.Alias(
        f"{self.project_name}-master-key-alias",
        name=f"alias/{self.project_name}-master-key",
        target_key_id=master_key.key_id
    )

    return master_key

  def create_logging_key(self) -> aws.kms.Key:
    """Create dedicated KMS key for logging encryption."""
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
                "Sid": "Allow CloudWatch Logs",
                "Effect": "Allow",
                "Principal": {
                    "Service": f"logs.us-west-1.amazonaws.com"
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                "Resource": "*"
            }
        ]
    }

    logging_key = aws.kms.Key(
        f"{self.project_name}-logging-key",
        description=f"KMS key for {self.project_name} logging encryption",
        key_usage="ENCRYPT_DECRYPT",
        customer_master_key_spec="SYMMETRIC_DEFAULT",
        key_rotation_status=True,
        deletion_window_in_days=30,
        policy=pulumi.Output.json_dumps(key_policy),
        tags={
            "Name": f"{self.project_name}-logging-key",
            "Environment": self.environment,
            "Purpose": "logging-encryption",
            "ManagedBy": "pulumi"
        }
    )

    # Create alias for the logging key
    aws.kms.Alias(
        f"{self.project_name}-logging-key-alias",
        name=f"alias/{self.project_name}-logging-key",
        target_key_id=logging_key.key_id
    )

    return logging_key
