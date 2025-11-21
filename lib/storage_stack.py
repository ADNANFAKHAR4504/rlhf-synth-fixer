"""
Storage Stack - S3 Bucket for ALB Logs and KMS Key
"""

from typing import Dict

import pulumi
import pulumi_aws as aws


class StorageStackArgs:
    """Arguments for StorageStack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class StorageStack(pulumi.ComponentResource):
    """
    S3 bucket for ALB logs and KMS key for encryption.
    """

    def __init__(
        self,
        name: str,
        args: StorageStackArgs,
        opts: pulumi.ResourceOptions = None
    ):
        super().__init__("custom:storage:StorageStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # KMS Key for RDS encryption
        self.kms_key = aws.kms.Key(
            f"loan-kms-key-{self.environment_suffix}",
            description=f"KMS key for loan processing RDS encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={**self.tags, "Name": f"loan-kms-key-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        self.kms_key_id = self.kms_key.id

        self.kms_alias = aws.kms.Alias(
            f"loan-kms-alias-{self.environment_suffix}",
            name=f"alias/loan-kms-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # S3 Bucket for ALB logs
        self.log_bucket = aws.s3.Bucket(
            f"loan-alb-logs-{self.environment_suffix}",
            bucket=f"loan-alb-logs-{self.environment_suffix}",
            force_destroy=True,
            tags={**self.tags, "Name": f"loan-alb-logs-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        self.s3_bucket_id = self.log_bucket.id

        # Enable versioning
        aws.s3.BucketVersioning(
            f"loan-logs-versioning-{self.environment_suffix}",
            bucket=self.log_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"loan-logs-public-block-{self.environment_suffix}",
            bucket=self.log_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Lifecycle policy
        aws.s3.BucketLifecycleConfiguration(
            f"loan-logs-lifecycle-{self.environment_suffix}",
            bucket=self.log_bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
                id="glacier-transition",
                status="Enabled",
                transitions=[aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                    days=90,
                    storage_class="GLACIER"
                )]
            )],
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Bucket policy for ALB access logs
        aws.s3.BucketPolicy(
            f"loan-logs-policy-{self.environment_suffix}",
            bucket=self.log_bucket.id,
            policy=self.log_bucket.arn.apply(lambda arn: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Principal": {{
                            "AWS": "arn:aws:iam::652711504416:root"
                        }},
                        "Action": "s3:PutObject",
                        "Resource": "{arn}/*"
                    }}
                ]
            }}"""),
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.register_outputs({
            "log_bucket_name": self.log_bucket.bucket,
            "log_bucket_arn": self.log_bucket.arn,
            "kms_key_id": self.kms_key.id,
            "kms_key_arn": self.kms_key.arn
        })
