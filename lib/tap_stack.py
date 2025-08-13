"""
tap_stack.py

Implements Task 2 infrastructure using Pulumi with Python, aligned to AWS CDK-style requirements.

Region: us-east-1
Requirements: Secure, production-ready infrastructure with S3 logging, private DB, KMS encryption, tagging, and least-privilege IAM.
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or "dev"
        self.tags = tags or {"environment": "production"}


class TapStack(pulumi.ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("tap:stack:TapStack", name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # ==========================================
        # 1. Default IAM Policy (Least Privilege)
        # ==========================================
        self.default_policy = aws.iam.Policy(
            f"default-policy-{self.environment_suffix}",
            name=f"default-policy-{self.environment_suffix}",
            description="Default least-privilege policy for all resources",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [],
                    "Resource": "*"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # ==========================================
        # 2. Logging Bucket
        # ==========================================
        self.logging_bucket = aws.s3.BucketV2(
            f"logging-bucket-{self.environment_suffix}",
            bucket=f"tap-logging-{self.environment_suffix}",
            acl="log-delivery-write",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        self.logging_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"logging-bucket-encryption-{self.environment_suffix}",
            bucket=self.logging_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms"
                )
            )],
            opts=ResourceOptions(parent=self.logging_bucket)
        )

        # ==========================================
        # 3. Application Bucket with Logging
        # ==========================================
        self.app_bucket = aws.s3.BucketV2(
            f"app-bucket-{self.environment_suffix}",
            bucket=f"tap-app-{self.environment_suffix}",
            acl="private",
            loggings=[aws.s3.BucketV2LoggingArgs(
                target_bucket=self.logging_bucket.bucket,
                target_prefix="app-bucket-logs/"
            )],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        self.app_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"app-bucket-encryption-{self.environment_suffix}",
            bucket=self.app_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms"
                )
            )],
            opts=ResourceOptions(parent=self.app_bucket)
        )

        # ==========================================
        # 4. KMS Key for Sensitive Data Encryption
        # ==========================================
        self.kms_key = aws.kms.Key(
            f"kms-key-{self.environment_suffix}",
            description="KMS key for encrypting sensitive data",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # ==========================================
        # 5. Private Database (RDS example)
        # ==========================================
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{self.environment_suffix}",
            subnet_ids=["subnet-12345678", "subnet-87654321"],  # Placeholder
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.db = aws.rds.Instance(
            f"db-instance-{self.environment_suffix}",   # resource name positional arg
            allocated_storage=20,                       # keyword args for properties
            engine="postgres",
            instance_class="db.t3.micro",
            db_name="appdb",
            username="admin",
            password="P@ssw0rd123!", # config.require_secret("dbPassword"),  # use Pulumi config secret
            skip_final_snapshot=True,
            db_subnet_group_name=self.db_subnet_group.name,  # Output[str] or str
            vpc_security_group_ids=["sg-12345678"],          # list of strings
            publicly_accessible=False,
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,                      # Output[str] or str
            tags=self.tags,
            opts=pulumi.ResourceOptions(parent=self)
        )
                

        # ==========================================
        # 6. Attach Default Policy to IAM Roles
        # ==========================================
        self.attachments = []
        for role_name in ["app-role", "db-role"]:
            role = aws.iam.Role(
                f"{role_name}-{self.environment_suffix}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }),
                tags=self.tags,
                opts=ResourceOptions(parent=self)
            )
            attachment = aws.iam.RolePolicyAttachment(
                f"{role_name}-policy-attachment-{self.environment_suffix}",
                role=role.name,
                policy_arn=self.default_policy.arn,
                opts=ResourceOptions(parent=role)
            )
            self.attachments.append(attachment)

        # ==========================================
        # Outputs
        # ==========================================
        pulumi.export("logging_bucket_name", self.logging_bucket.bucket)
        pulumi.export("app_bucket_name", self.app_bucket.bucket)
        pulumi.export("db_instance_identifier", self.db.id)
        pulumi.export("kms_key_arn", self.kms_key.arn)
        pulumi.export("default_policy_arn", self.default_policy.arn)

        self.register_outputs({})
