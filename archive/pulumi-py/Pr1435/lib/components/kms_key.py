from typing import Optional
import json
import dataclasses
import pulumi
import pulumi_aws as aws


def _get_key_policy() -> str:

  # Get current AWS account ID and region
  current = aws.get_caller_identity()

  policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Enable IAM Root User Permissions",
        "Effect": "Allow",
        "Principal": {
          "AWS": f"arn:aws:iam::{current.account_id}:root"
        },
        "Action": "kms:*",
        "Resource": "*"
      },
      {
        "Sid": "Allow Use of the Key for S3 and SNS",
        "Effect": "Allow",
        "Principal": {
          "AWS": f"arn:aws:iam::{current.account_id}:root"
        },
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ],
        "Resource": "*",
        "Condition": {
          "StringEquals": {
            "kms:ViaService": ["s3.*.amazonaws.com", "sns.*.amazonaws.com"]
          }
        }
      },
      {
        "Sid": "Allow S3 Service",
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
        "Sid": "Allow SNS Service",
        "Effect": "Allow",
        "Principal": {
          "Service": "sns.amazonaws.com"
        },
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": "*"
      }
    ]
  }

  return json.dumps(policy)


@dataclasses.dataclass
class KMSKeyConfig:
  description: str = "KMS key for S3 bucket encryption"
  deletion_window_days: int = 30
  tags: Optional[dict] = None


class KMSKey(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: KMSKeyConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:KMSKey", name, None, opts)

    # Apply default tags
    default_tags = {
      "Name": f"{name}-kms-key",
      "Component": "KMSKey",
      "Purpose": "S3 and SNS encryption"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create KMS key
    self.key = aws.kms.Key(
      f"{name}-key",
      description=config.description,
      deletion_window_in_days=config.deletion_window_days,
      enable_key_rotation=True,
      policy=_get_key_policy(),
      tags=default_tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create KMS alias
    self.alias = aws.kms.Alias(
      f"{name}-alias",
      name=f"alias/{name}-s3-key",
      target_key_id=self.key.key_id,
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.key]
      )
    )

    self.register_outputs({
      "key_id": self.key.key_id,
      "key_arn": self.key.arn,
      "alias_name": self.alias.name
    })
