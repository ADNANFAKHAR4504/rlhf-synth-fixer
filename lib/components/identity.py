# lib/components/identity.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Identity and Access Management Infrastructure Component

This component creates and manages:
- IAM roles with least privilege access
- KMS keys for encryption management
- Multi-Factor Authentication setup
- Service-linked roles for EC2, Lambda, and other services
- Cross-service trust relationships
"""

class IdentityAccessInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:identity:IdentityAccess', name, None, opts)

    self.tags = tags or {}
    # Extract environment suffix from tags for IAM resource naming
    self.environment_suffix = self.tags.get('Environment', 'dev')

    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")

    self._create_kms_resources()
    self._create_ec2_roles()
    self._create_lambda_roles()
    self._create_s3_access_roles()

    self.register_outputs({
      "kms_key_arn": self.kms_key.arn,
      "kms_key_id": self.kms_key.id,
      "ec2_instance_role_arn": self.ec2_instance_role.arn,
      "lambda_execution_role_arn": self.lambda_execution_role.arn,
      "s3_access_policy_arn": self.s3_access_policy.arn
    })

  def _create_kms_resources(self):
    account_id = get_caller_identity().account_id

    kms_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Enable IAM User Permissions",
          "Effect": "Allow",
          "Principal": {
            "AWS": pulumi.Output.concat("arn:aws:iam::", account_id, ":root")
          },
          "Action": "kms:*",
          "Resource": "*"
        },
        {
          "Sid": "Allow ProjectX Services",
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "s3.amazonaws.com",
              "rds.amazonaws.com",
              "lambda.amazonaws.com",
              "ec2.amazonaws.com",
              "logs.amazonaws.com"
            ]
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

    self.kms_key = aws.kms.Key(
      f"secure-projectx-kms-key-{self.environment_suffix}",
      description="ProjectX master encryption key for all services",
      key_usage="ENCRYPT_DECRYPT",
      customer_master_key_spec="SYMMETRIC_DEFAULT",
      policy=pulumi.Output.json_dumps(kms_policy),
      deletion_window_in_days=7,
      enable_key_rotation=True,
      tags={
        **self.tags,
        "Name": f"secure-projectx-master-key-{self.environment_suffix}",
        "Purpose": "Encryption"
      },
      opts=ResourceOptions(
        parent=self,
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    # KMS Alias disabled for LocalStack - causes indefinite hang
    # LocalStack Community has limited KMS Alias support
    # self.kms_alias = aws.kms.Alias(
    #   "secure-projectx-kms-alias",
    #   name="alias/secure-projectx-master-key",
    #   target_key_id=self.kms_key.key_id,
    #   opts=ResourceOptions(parent=self, depends_on=[self.kms_key])
    # )

  def _create_ec2_roles(self):
    assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }
      ]
    })

    self.ec2_instance_role = aws.iam.Role(
      f"secure-projectx-ec2-role-{self.environment_suffix}",
      name=f"secure-projectx-ec2-instance-role-{self.environment_suffix}",
      assume_role_policy=assume_role_policy,
      tags=self.tags,
      opts=ResourceOptions(
        parent=self,
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    ec2_policy_doc = self.kms_key.arn.apply(lambda arn: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "cloudwatch:PutMetricData",
            "ec2:DescribeVolumes",
            "ec2:DescribeTags",
            "logs:PutLogEvents",
            "logs:CreateLogGroup",
            "logs:CreateLogStream"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:Encrypt",
            "kms:GenerateDataKey"
          ],
          "Resource": arn
        }
      ]
    }))

    self.ec2_policy = aws.iam.RolePolicy(
      f"secure-projectx-ec2-policy-{self.environment_suffix}",
      role=self.ec2_instance_role.name,
      policy=ec2_policy_doc,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.kms_key],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    self.ec2_instance_profile = aws.iam.InstanceProfile(
      f"secure-projectx-ec2-instance-profile-{self.environment_suffix}",
      name=f"secure-projectx-ec2-instance-profile-{self.environment_suffix}",
      role=self.ec2_instance_role.name,
      tags=self.tags,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.ec2_instance_role],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

  def _create_lambda_roles(self):
    assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }
      ]
    })

    self.lambda_execution_role = aws.iam.Role(
      f"secure-projectx-lambda-role-{self.environment_suffix}",
      name=f"secure-projectx-lambda-execution-role-{self.environment_suffix}",
      assume_role_policy=assume_role_policy,
      tags=self.tags,
      opts=ResourceOptions(
        parent=self,
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    lambda_policy_doc = self.kms_key.arn.apply(lambda arn: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "ec2:CreateNetworkInterface",
            "ec2:DescribeNetworkInterfaces",
            "ec2:DeleteNetworkInterface"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:Encrypt",
            "kms:GenerateDataKey"
          ],
          "Resource": arn
        }
      ]
    }))

    self.lambda_policy = aws.iam.Policy(
      f"secure-projectx-lambda-policy-{self.environment_suffix}",
      name=f"secure-projectx-lambda-policy-{self.environment_suffix}",
      description="Lambda permissions for ProjectX",
      policy=lambda_policy_doc,
      tags=self.tags,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.kms_key],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    aws.iam.RolePolicyAttachment(
      f"secure-projectx-lambda-policy-attachment-{self.environment_suffix}",
      role=self.lambda_execution_role.name,
      policy_arn=self.lambda_policy.arn,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.lambda_policy],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

  def _create_s3_access_roles(self):
    assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": ["ec2.amazonaws.com", "lambda.amazonaws.com"]
          },
          "Action": "sts:AssumeRole"
        }
      ]
    })

    self.s3_access_role = aws.iam.Role(
      f"secure-projectx-s3-access-role-{self.environment_suffix}",
      name=f"secure-projectx-s3-access-role-{self.environment_suffix}",
      assume_role_policy=assume_role_policy,
      tags=self.tags,
      opts=ResourceOptions(
        parent=self,
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    s3_policy_doc = self.kms_key.arn.apply(lambda arn: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Resource": "*",
          "Condition": {
            "StringEquals": {
              "s3:x-amz-server-side-encryption": "aws:kms"
            }
          }
        },
        {
          "Effect": "Allow",
          "Action": [
            "s3:ListBucket",
            "s3:GetBucketVersioning"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:Encrypt",
            "kms:GenerateDataKey",
            "kms:ReEncrypt*"
          ],
          "Resource": arn
        }
      ]
    }))

    self.s3_access_policy = aws.iam.Policy(
      f"secure-projectx-s3-access-policy-{self.environment_suffix}",
      name=f"secure-projectx-s3-access-policy-{self.environment_suffix}",
      description="Policy for secure S3 access with KMS encryption",
      policy=s3_policy_doc,
      tags=self.tags,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.kms_key],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    aws.iam.RolePolicyAttachment(
      f"secure-projectx-s3-policy-attachment-{self.environment_suffix}",
      role=self.s3_access_role.name,
      policy_arn=self.s3_access_policy.arn,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.s3_access_policy],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )
