import pulumi
import pulumi_aws as aws
from typing import Optional
import json


def _create_policy_document(bucket_arn: str, kms_key_arn: str) -> str:
  policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:DeleteObjectVersion"
        ],
        "Resource": f"{bucket_arn}/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:GetBucketLocation"
        ],
        "Resource": bucket_arn
      },
      {
        "Effect": "Allow",
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": kms_key_arn
      }
    ]
  }

  return json.dumps(policy)


class S3IAMRole(pulumi.ComponentResource):
  def __init__(self, name: str,
               bucket_arn: pulumi.Output[str],
               kms_key_arn: pulumi.Output[str],
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:S3IAMRole", name, None, opts)

    self.bucket_arn = bucket_arn
    self.kms_key_arn = kms_key_arn

    # Create IAM role
    self.role = aws.iam.Role(
      f"{name}-role",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }
        ]
      }),
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create policy for S3 bucket access
    self.policy = aws.iam.Policy(
      f"{name}-policy",
      description=f"Least privilege policy for {name} S3 bucket access",
      policy=pulumi.Output.all(bucket_arn, kms_key_arn).apply(
        lambda args: _create_policy_document(args[0], args[1])
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Attach policy to role
    self.role_policy_attachment = aws.iam.RolePolicyAttachment(
      f"{name}-policy-attachment",
      role=self.role.name,
      policy_arn=self.policy.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create instance profile for EC2 instances
    self.instance_profile = aws.iam.InstanceProfile(
      f"{name}-instance-profile",
      role=self.role.name,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "role_arn": self.role.arn,
      "role_name": self.role.name,
      "policy_arn": self.policy.arn,
      "instance_profile_name": self.instance_profile.name
    })
