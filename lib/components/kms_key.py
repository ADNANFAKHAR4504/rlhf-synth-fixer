import pulumi
import pulumi_aws as aws
from typing import Optional


def _get_key_policy() -> str:
  import json

  # Get current AWS account ID and region
  current = aws.get_caller_identity()
  region = aws.get_region()

  policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Enable IAM User Permissions",
        "Effect": "Allow",
        "Principal": {
          "AWS": f"arn:aws:iam::{current.account_id}:root"
        },
        "Action": "kms:*",
        "Resource": "*"
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
      }
    ]
  }

  return json.dumps(policy)


class KMSKey(pulumi.ComponentResource):
  def __init__(self, name: str,
               description: str = "KMS key for S3 bucket encryption",
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:KMSKey", name, None, opts)

    # Create KMS key
    self.key = aws.kms.Key(
      f"{name}-key",
      description=description,
      deletion_window_in_days=7,
      enable_key_rotation=True,
      policy=pulumi.Output.all().apply(lambda _: _get_key_policy()),
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create KMS alias
    self.alias = aws.kms.Alias(
      f"{name}-alias",
      name=f"alias/{name}-s3-key",
      target_key_id=self.key.key_id,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "key_id": self.key.key_id,
      "key_arn": self.key.arn,
      "alias_name": self.alias.name
    })
