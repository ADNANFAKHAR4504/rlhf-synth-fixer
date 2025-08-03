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

    # Validate tags
    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")

    # Create KMS resources
    self._create_kms_resources()

    # Create IAM roles and policies
    self._create_ec2_roles()
    self._create_lambda_roles()
    self._create_rds_roles()
    self._create_s3_access_roles()
    self._create_monitoring_roles()

    # Create MFA policy
    self._create_mfa_policy()

    # Register outputs
    self.register_outputs({
      "kms_key_arn": self.kms_key.arn,
      "kms_key_id": self.kms_key.id,
      "ec2_instance_role_arn": self.ec2_instance_role.arn,
      "lambda_execution_role_arn": self.lambda_execution_role.arn,
      "rds_monitoring_role_arn": self.rds_monitoring_role.arn,
      "s3_access_policy_arn": self.s3_access_policy.arn,
      "cloudwatch_events_role_arn": self.cloudwatch_events_role.arn,
      "mfa_policy_arn": self.mfa_policy.arn
    })

  def _create_kms_resources(self):
    """Create KMS keys for encryption management"""
    kms_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Enable IAM User Permissions",
          "Effect": "Allow",
          "Principal": {
            "AWS": pulumi.Output.concat("arn:aws:iam::", get_caller_identity().account_id, ":root")
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
      f"secure-projectx-kms-key",
      description="ProjectX master encryption key for all services",
      key_usage="ENCRYPT_DECRYPT",
      customer_master_key_spec="SYMMETRIC_DEFAULT",
      policy=pulumi.Output.json_dumps(kms_policy),
      deletion_window_in_days=7,
      enable_key_rotation=True,
      tags={
        **self.tags,
        "Name": "secure-projectx-master-key",
        "Purpose": "Encryption"
      },
      opts=ResourceOptions(parent=self)
    )

    self.kms_alias = aws.kms.Alias(
      f"secure-projectx-kms-alias",
      name="alias/secure-projectx-master-key",
      target_key_id=self.kms_key.key_id,
      opts=ResourceOptions(parent=self)
    )

  def _create_ec2_roles(self):
    """Create IAM roles for EC2 instances with least privilege"""
    ec2_assume_role_policy = {
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
    }

    self.ec2_instance_role = aws.iam.Role(
      f"secure-projectx-ec2-role",
      name="secure-projectx-ec2-instance-role",
      assume_role_policy=json.dumps(ec2_assume_role_policy),
      tags={
        **self.tags,
        "Name": "secure-projectx-ec2-role",
        "Service": "EC2"
      },
      opts=ResourceOptions(parent=self)
    )

    ec2_policy_document = self.kms_key.arn.apply(lambda kms_arn: json.dumps({
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
          "Resource": kms_arn
        }
      ]
    }))



    self.ec2_policy = aws.iam.RolePolicy(
      f"secure-projectx-ec2-policy",
      role=self.ec2_instance_role.name,
      policy=ec2_policy_document,
    #   tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # aws.iam.RolePolicyAttachment(
    #   f"secure-projectx-ec2-policy-attachment",
    #   role=self.ec2_instance_role.name,
    #   policy_arn=self.ec2_policy.arn,
    #   opts=ResourceOptions(parent=self)
    # )

    self.ec2_instance_profile = aws.iam.InstanceProfile(
      f"secure-projectx-ec2-instance-profile",
      name="secure-projectx-ec2-instance-profile",
      role=self.ec2_instance_role.name,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def _create_lambda_roles(self):
    """Create IAM roles for Lambda functions with least privilege"""
    lambda_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    self.lambda_execution_role = aws.iam.Role(
      f"secure-projectx-lambda-role",
      name="secure-projectx-lambda-execution-role",
      assume_role_policy=json.dumps(lambda_assume_role_policy),
      tags={
        **self.tags,
        "Name": "secure-projectx-lambda-role",
        "Service": "Lambda"
      },
      opts=ResourceOptions(parent=self)
    )

    lambda_policy_document = self.kms_key.arn.apply(lambda kms_arn: json.dumps({
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
          "Resource": kms_arn
        }
      ]
    }))

    self.lambda_policy = aws.iam.Policy(
      f"secure-projectx-lambda-policy",
      name="secure-projectx-lambda-policy",
      description="Least privilege policy for ProjectX Lambda functions",
      policy=lambda_policy_document,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"secure-projectx-lambda-policy-attachment",
      role=self.lambda_execution_role.name,
      policy_arn=self.lambda_policy.arn,
      opts=ResourceOptions(parent=self)
    )

  def _create_rds_roles(self):
    """Create IAM roles for RDS enhanced monitoring"""
    rds_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "monitoring.rds.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    self.rds_monitoring_role = aws.iam.Role(
      f"secure-projectx-rds-monitoring-role",
      name="secure-projectx-rds-enhanced-monitoring-role",
      assume_role_policy=json.dumps(rds_assume_role_policy),
      tags={
        **self.tags,
        "Name": "secure-projectx-rds-monitoring-role",
        "Service": "RDS"
      },
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"secure-projectx-rds-monitoring-policy-attachment",
      role=self.rds_monitoring_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
      opts=ResourceOptions(parent=self)
    )

  def _create_s3_access_roles(self):
    """Create IAM roles for S3 access with encryption"""
    s3_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "ec2.amazonaws.com",
              "lambda.amazonaws.com"
            ]
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    self.s3_access_role = aws.iam.Role(
      f"secure-projectx-s3-access-role",
      name="secure-projectx-s3-access-role",
      assume_role_policy=json.dumps(s3_assume_role_policy),
      tags={
        **self.tags,
        "Name": "secure-projectx-s3-access-role",
        "Service": "S3"
      },
      opts=ResourceOptions(parent=self)
    )

    s3_policy_document = self.kms_key.arn.apply(lambda kms_arn: json.dumps({
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
          "Resource": kms_arn
        }
      ]
    }))

    self.s3_access_policy = aws.iam.Policy(
      f"secure-projectx-s3-access-policy",
      name="secure-projectx-s3-access-policy",
      description="Policy for secure S3 access with KMS encryption",
      policy=s3_policy_document,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"secure-projectx-s3-policy-attachment",
      role=self.s3_access_role.name,
      policy_arn=self.s3_access_policy.arn,
      opts=ResourceOptions(parent=self)
    )

  def _create_monitoring_roles(self):
    """Create IAM roles for CloudWatch and monitoring services"""
    cloudwatch_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "events.amazonaws.com",
              "lambda.amazonaws.com"
            ]
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    self.cloudwatch_events_role = aws.iam.Role(
      f"secure-projectx-cloudwatch-events-role",
      name="secure-projectx-cloudwatch-events-role",
      assume_role_policy=json.dumps(cloudwatch_assume_role_policy),
      tags={
        **self.tags,
        "Name": "secure-projectx-cloudwatch-events-role",
        "Service": "CloudWatch"
      },
      opts=ResourceOptions(parent=self)
    )

    cloudwatch_policy_document = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams",
            "logs:DescribeLogGroups"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "sns:Publish"
          ],
          "Resource": "arn:aws:sns:*:*:secure-projectx-*"
        }
      ]
    }

    self.cloudwatch_policy = aws.iam.Policy(
      f"secure-projectx-cloudwatch-policy",
      name="secure-projectx-cloudwatch-policy",
      description="Policy for CloudWatch monitoring and logging",
      policy=json.dumps(cloudwatch_policy_document),
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"secure-projectx-cloudwatch-policy-attachment",
      role=self.cloudwatch_events_role.name,
      policy_arn=self.cloudwatch_policy.arn,
      opts=ResourceOptions(parent=self)
    )

  def _create_mfa_policy(self):
    """Create MFA enforcement policy for IAM users"""
    mfa_policy_document = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowViewAccountInfo",
          "Effect": "Allow",
          "Action": [
            "iam:GetAccountPasswordPolicy",
            "iam:GetAccountSummary",
            "iam:ListVirtualMFADevices"
          ],
          "Resource": "*"
        },
        {
          "Sid": "AllowManageOwnPasswords",
          "Effect": "Allow",
          "Action": [
            "iam:ChangePassword",
            "iam:GetUser"
          ],
          "Resource": "arn:aws:iam::*:user/${aws:username}"
        },
        {
          "Sid": "AllowManageOwnMFA",
          "Effect": "Allow",
          "Action": [
            "iam:CreateVirtualMFADevice",
            "iam:DeleteVirtualMFADevice",
            "iam:EnableMFADevice",
            "iam:ListMFADevices",
            "iam:ResyncMFADevice"
          ],
          "Resource": [
            "arn:aws:iam::*:mfa/${aws:username}",
            "arn:aws:iam::*:user/${aws:username}"
          ]
        },
        {
          "Sid": "DenyAllExceptUnlessSignedInWithMFA",
          "Effect": "Deny",
          "NotAction": [
            "iam:CreateVirtualMFADevice",
            "iam:EnableMFADevice",
            "iam:GetUser",
            "iam:ListMFADevices",
            "iam:ListVirtualMFADevices",
            "iam:ResyncMFADevice",
            "sts:GetSessionToken"
          ],
          "Resource": "*",
          "Condition": {
            "BoolIfExists": {
              "aws:MultiFactorAuthPresent": "false"
            }
          }
        }
      ]
    }

    self.mfa_policy = aws.iam.Policy(
      f"secure-projectx-mfa-policy",
      name="secure-projectx-force-mfa-policy",
      description="Policy that enforces MFA for all ProjectX users",
      policy=json.dumps(mfa_policy_document),
      tags={
        **self.tags,
        "Name": "secure-projectx-mfa-policy",
        "Purpose": "MFA-Enforcement"
      },
      opts=ResourceOptions(parent=self)
    )

    self.mfa_user_group = aws.iam.Group(
      f"secure-projectx-mfa-users-group",
      name="secure-projectx-mfa-users",
      path="/",
      opts=ResourceOptions(parent=self)
    )

    aws.iam.GroupPolicyAttachment(
      f"secure-projectx-mfa-group-policy-attachment",
      group=self.mfa_user_group.name,
      policy_arn=self.mfa_policy.arn,
      opts=ResourceOptions(parent=self)
    )

  def create_service_user(self, service_name: str, policies: List[str]) -> aws.iam.User:
    """Create a service user with specific policies"""
    user = aws.iam.User(
      f"secure-projectx-{service_name}-user",
      name=f"secure-projectx-{service_name}-service-user",
      path="/service-users/",
      tags={
        **self.tags,
        "Name": f"secure-projectx-{service_name}-user",
        "Type": "ServiceUser"
      },
      opts=ResourceOptions(parent=self)
    )

    for i, policy_arn in enumerate(policies):
      aws.iam.UserPolicyAttachment(
        f"secure-projectx-{service_name}-user-policy-{i}",
        user=user.name,
        policy_arn=policy_arn,
        opts=ResourceOptions(parent=self)
      )

    aws.iam.UserGroupMembership(
      f"secure-projectx-{service_name}-user-group-membership",
      user=user.name,
      groups=[self.mfa_user_group.name],
      opts=ResourceOptions(parent=self)
    )

    return user