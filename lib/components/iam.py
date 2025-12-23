"""
IAM Component - Creates IAM roles and policies following least privilege principle
"""

import json
import pulumi
import pulumi_aws as aws


class IAMComponent(pulumi.ComponentResource):
  def __init__(self, name: str, environment: str, tags: dict, opts=None):
    super().__init__("custom:aws:IAM", name, None, opts)

    # EC2 Instance Role
    self.instance_role = aws.iam.Role(
        f"{name}-ec2-role",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"},
                    }
                ],
            }
        ),
        tags={**tags, "Name": f"{environment}-ec2-role"},
        opts=pulumi.ResourceOptions(parent=self),
    )

    # EC2 Instance Policy
    self.instance_policy = aws.iam.RolePolicy(
        f"{name}-ec2-policy",
        role=self.instance_role.id,
        policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath",
                        ],
                        "Resource": f"arn:aws:ssm:*:*:parameter/{environment}/*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                        ],
                        "Resource": f"arn:aws:dynamodb:*:*:table/{environment}-*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                        ],
                        "Resource": f"arn:aws:s3:::{environment}-*/*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                        ],
                        "Resource": "*",
                    },
                ],
            }
        ),
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Instance Profile
    self.instance_profile = aws.iam.InstanceProfile(
        f"{name}-instance-profile",
        role=self.instance_role.name,
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Lambda Execution Role
    self.lambda_role = aws.iam.Role(
        f"{name}-lambda-role",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                    }
                ],
            }
        ),
        tags={**tags, "Name": f"{environment}-lambda-role"},
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Lambda Basic Execution Policy
    aws.iam.RolePolicyAttachment(
        f"{name}-lambda-basic-execution",
        role=self.lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Lambda Custom Policy
    self.lambda_policy = aws.iam.RolePolicy(
        f"{name}-lambda-policy",
        role=self.lambda_role.id,
        policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                        ],
                        "Resource": f"arn:aws:dynamodb:*:*:table/{environment}-*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath",
                        ],
                        "Resource": f"arn:aws:ssm:*:*:parameter/{environment}/*",
                    },
                ],
            }
        ),
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Backup Role for automated backups
    self.backup_role = aws.iam.Role(
        f"{name}-backup-role",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "backup.amazonaws.com"},
                    }
                ],
            }
        ),
        tags={**tags, "Name": f"{environment}-backup-role"},
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Attach AWS Backup service role policy
    aws.iam.RolePolicyAttachment(
        f"{name}-backup-service-role",
        role=self.backup_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
        opts=pulumi.ResourceOptions(parent=self),
    )

    self.register_outputs(
        {
            "instance_role_arn": self.instance_role.arn,
            "lambda_role_arn": self.lambda_role.arn,
            "backup_role_arn": self.backup_role.arn,
            "instance_profile_name": self.instance_profile.name,
        }
    )
