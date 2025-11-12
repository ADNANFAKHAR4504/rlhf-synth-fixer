"""Security module for KMS keys, IAM roles, and policies."""

import json
from constructs import Construct
from cdktf import Token
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion


class SecurityModule(Construct):
    """Security infrastructure module."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        vpc_id: str,
    ):
        """Initialize security module."""
        super().__init__(scope, construct_id)

        # Get account and region data
        caller = DataAwsCallerIdentity(self, "caller")
        region = DataAwsRegion(self, "region")

        # Create KMS key for S3
        self.s3_kms_key = KmsKey(
            self,
            "s3_kms_key",
            description=f"KMS key for S3 encryption - {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{caller.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow S3 to use the key",
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
            }),
            tags={
                "Name": f"s3-kms-key-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        KmsAlias(
            self,
            "s3_kms_alias",
            name=f"alias/s3-encryption-{environment_suffix}",
            target_key_id=self.s3_kms_key.id,
        )

        # Create KMS key for Lambda
        self.lambda_kms_key = KmsKey(
            self,
            "lambda_kms_key",
            description=f"KMS key for Lambda encryption - {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{caller.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"lambda-kms-key-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        KmsAlias(
            self,
            "lambda_kms_alias",
            name=f"alias/lambda-encryption-{environment_suffix}",
            target_key_id=self.lambda_kms_key.id,
        )

        # Create KMS key for CloudWatch Logs
        self.cloudwatch_kms_key = KmsKey(
            self,
            "cloudwatch_kms_key",
            description=f"KMS key for CloudWatch Logs - {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{caller.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": f"logs.{aws_region}.amazonaws.com"
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
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{aws_region}:{caller.account_id}:*"
                            }
                        }
                    }
                ]
            }),
            tags={
                "Name": f"cloudwatch-kms-key-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        KmsAlias(
            self,
            "cloudwatch_kms_alias",
            name=f"alias/cloudwatch-encryption-{environment_suffix}",
            target_key_id=self.cloudwatch_kms_key.id,
        )

        # Create IAM role for Lambda
        self.lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"lambda-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
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
            }),
            tags={
                "Name": f"lambda-role-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        self.lambda_role_arn = self.lambda_role.arn

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_policy",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Create custom IAM policy for Lambda with least privilege
        lambda_policy = IamPolicy(
            self,
            "lambda_custom_policy",
            name=f"lambda-custom-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"arn:aws:s3:::*-{environment_suffix}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": [
                            self.lambda_kms_key.arn,
                            self.s3_kms_key.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": f"arn:aws:secretsmanager:{aws_region}:{caller.account_id}:secret:*-{environment_suffix}-*"
                    },
                    {
                        "Effect": "Deny",
                        "Action": "*",
                        "Resource": "*",
                        "Condition": {
                            "StringNotEquals": {
                                "aws:RequestedRegion": aws_region
                            }
                        }
                    }
                ]
            }),
            tags={
                "Name": f"lambda-policy-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_attachment",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn,
        )

        # Create IAM role for AWS Config
        self.config_role = IamRole(
            self,
            "config_role",
            name=f"config-recorder-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "config.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"config-role-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        self.config_role_arn = self.config_role.arn

        # Attach managed Config policy
        IamRolePolicyAttachment(
            self,
            "config_policy",
            role=self.config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
        )

        # Add S3 write permissions for Config
        IamRolePolicy(
            self,
            "config_s3_policy",
            name=f"config-s3-policy-{environment_suffix}",
            role=self.config_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        "Resource": f"arn:aws:s3:::config-bucket-{environment_suffix}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": "s3:GetBucketAcl",
                        "Resource": f"arn:aws:s3:::config-bucket-{environment_suffix}"
                    }
                ]
            }),
        )
