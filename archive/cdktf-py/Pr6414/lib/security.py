from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class SecurityModule(Construct):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, vpc_id: str):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Get current AWS account ID dynamically
        current = DataAwsCallerIdentity(self, "current")

        # KMS Key with dynamic account ID
        self.kms_key = KmsKey(self, "kms-key",
            description=f"KMS key for encryption - {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{current.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {"Service": "logs.us-east-1.amazonaws.com"},
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
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:us-east-1:{current.account_id}:*"
                            }
                        }
                    }
                ]
            }),
            tags={
                "Name": f"data-encryption-key-{environment_suffix}"
            },
            depends_on=[current]
        )

        # KMS Alias
        self.kms_alias = KmsAlias(self, "kms-alias",
            name=f"alias/data-key-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

        # Security Group for Lambda - Missing description requirement
        self.lambda_sg = SecurityGroup(self, "lambda-sg",
            name=f"lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=vpc_id,
            egress=[SecurityGroupEgress(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS outbound"
            )],
            tags={
                "Name": f"lambda-sg-{environment_suffix}"
            }
        )

        # IAM Role for Lambda
        self.lambda_role = IamRole(self, "lambda-role",
            name=f"lambda-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags={
                "Name": f"lambda-role-{environment_suffix}"
            }
        )

        # Lambda Execution Policy - Missing KMS permissions
        self.lambda_policy = IamPolicy(self, "lambda-policy",
            name=f"lambda-execution-policy-{environment_suffix}",
            policy=json.dumps({
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
                        "Effect": "Deny",
                        "Action": "*",
                        "Resource": "*",
                        "Condition": {
                            "StringNotEquals": {
                                "aws:RequestedRegion": "us-east-1"
                            }
                        }
                    }
                ]
            })
        )

        # Attach Policy to Role
        IamRolePolicyAttachment(self, "lambda-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn
        )
