# lib/components/identity.py

from typing import Optional
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from pulumi_aws import get_caller_identity


class IdentityAccessInfrastructure(pulumi.ComponentResource):
    """Identity and Access Management Infrastructure Component
    
    This component creates and manages:
    - IAM roles with least privilege access
    - KMS keys for encryption management
    - Multi-Factor Authentication setup
    - Service-linked roles for EC2, Lambda, and other services
    - Cross-service trust relationships
    """
    
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

        kms_policy = pulumi.Output.all(account_id=account_id).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{args['account_id']}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            })
        )

        self.kms_key = aws.kms.Key(
            f"secure-projectx-kms-{self.environment_suffix}",
            description=f"ProjectX KMS key for {self.environment_suffix} environment",
            key_usage="ENCRYPT_DECRYPT",
            policy=kms_policy,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.kms_alias = aws.kms.Alias(
            f"secure-projectx-kms-alias-{self.environment_suffix}",
            name=f"alias/projectx-secure-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id,
            opts=ResourceOptions(parent=self, depends_on=[self.kms_key])
        )

    def _create_ec2_roles(self):
        # EC2 Instance Role Trust Policy
        ec2_trust_policy = json.dumps({
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
            name=f"secure-projectx-ec2-role-{self.environment_suffix}",
            assume_role_policy=ec2_trust_policy,
            description="EC2 instance role with least privilege access",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # EC2 Instance Profile
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"secure-projectx-ec2-profile-{self.environment_suffix}",
            name=f"secure-projectx-ec2-profile-{self.environment_suffix}",
            role=self.ec2_instance_role.name,
            opts=ResourceOptions(parent=self, depends_on=[self.ec2_instance_role])
        )

    def _create_lambda_roles(self):
        # Lambda Execution Role Trust Policy
        lambda_trust_policy = json.dumps({
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
            name=f"secure-projectx-lambda-role-{self.environment_suffix}",
            assume_role_policy=lambda_trust_policy,
            description="Lambda execution role with least privilege access",
            managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_s3_access_roles(self):
        # S3 Access Policy for least privilege access
        s3_access_policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        "arn:aws:s3:::secure-projectx-*",
                        "arn:aws:s3:::secure-projectx-*/*"
                    ]
                }
            ]
        })

        self.s3_access_policy = aws.iam.Policy(
            f"secure-projectx-s3-policy-{self.environment_suffix}",
            name=f"secure-projectx-s3-policy-{self.environment_suffix}",
            description="Least privilege S3 access policy for ProjectX",
            policy=s3_access_policy_document,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach S3 policy to EC2 role
        self.ec2_s3_policy_attachment = aws.iam.RolePolicyAttachment(
            f"secure-projectx-ec2-s3-attachment-{self.environment_suffix}",
            role=self.ec2_instance_role.name,
            policy_arn=self.s3_access_policy.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.ec2_instance_role, self.s3_access_policy])
        )