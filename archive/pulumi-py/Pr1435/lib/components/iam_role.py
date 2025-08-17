import json
from typing import Optional
import dataclasses
import pulumi
import pulumi_aws as aws


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


@dataclasses.dataclass
class S3IAMRoleConfig:
  bucket_arn: pulumi.Output[str]
  kms_key_arn: pulumi.Output[str]
  service_principals: Optional[list] = None
  path: str = "/"
  permissions_boundary_arn: Optional[str] = None
  tags: Optional[dict] = None


class S3IAMRole(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: S3IAMRoleConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:S3IAMRole", name, None, opts)

    self.bucket_arn = config.bucket_arn
    self.kms_key_arn = config.kms_key_arn
    
    # Default service principals
    service_principals = config.service_principals or ["ec2.amazonaws.com"]
    
    # Apply default tags
    default_tags = {
      "Name": f"{name}-iam-role",
      "Component": "S3IAMRole",
      "Purpose": "S3 bucket access with least privilege"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create assume role policy with configurable service principals
    assume_role_statements = []
    for principal in service_principals:
      assume_role_statements.append({
        "Effect": "Allow",
        "Principal": {
          "Service": principal
        },
        "Action": "sts:AssumeRole"
      })
    
    # Create IAM role
    role_args = {
      "assume_role_policy": json.dumps({
        "Version": "2012-10-17",
        "Statement": assume_role_statements
      }),
      "description": f"IAM role for {name} with S3 and KMS access",
      "path": config.path,
      "tags": default_tags
    }
    
    if config.permissions_boundary_arn:
      role_args["permissions_boundary"] = config.permissions_boundary_arn
    
    self.role = aws.iam.Role(
      f"{name}-role",
      **role_args,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create policy for S3 bucket access
    self.policy = aws.iam.Policy(
      f"{name}-policy",
      description=f"Least privilege policy for {name} S3 bucket access",
      policy=pulumi.Output.all(config.bucket_arn, config.kms_key_arn).apply(
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
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.role]
      )
    )

    self.register_outputs({
      "role_arn": self.role.arn,
      "role_name": self.role.name,
      "policy_arn": self.policy.arn,
      "instance_profile_name": self.instance_profile.name
    })
