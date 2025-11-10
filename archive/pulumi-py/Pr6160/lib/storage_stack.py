"""
storage_stack.py

S3 buckets for static assets and ALB logs.
Versioning enabled only for production environment.
"""

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class StorageStack(pulumi.ComponentResource):
    """
    Storage infrastructure component.

    Creates S3 buckets for static assets and ALB logs with environment-specific configuration.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        # Get current AWS account and region
        current = aws.get_caller_identity()
        current_region = aws.get_region()

        # Create bucket for static assets
        self.static_assets_bucket = aws.s3.Bucket(
            f'static-assets-{environment_suffix}',
            bucket=f'tap-static-assets-{environment_suffix}-{current.account_id}',
            tags={**tags, 'Name': f'static-assets-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning for production
        if environment_suffix == 'prod':
            aws.s3.BucketVersioningV2(
                f'static-assets-versioning-{environment_suffix}',
                bucket=self.static_assets_bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status='Enabled'
                ),
                opts=ResourceOptions(parent=self)
            )

        # Enable encryption
        # pylint: disable=line-too-long
        default_args = aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm='AES256'
        )
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f'static-assets-encryption-{environment_suffix}',
            bucket=self.static_assets_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=default_args,
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access for static assets bucket
        aws.s3.BucketPublicAccessBlock(
            f'static-assets-public-access-block-{environment_suffix}',
            bucket=self.static_assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create bucket for ALB logs
        self.alb_logs_bucket = aws.s3.Bucket(
            f'alb-logs-{environment_suffix}',
            bucket=f'tap-alb-logs-{environment_suffix}-{current.account_id}',
            force_destroy=True,  # Allow deletion with logs for testing
            tags={**tags, 'Name': f'alb-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Enable encryption for ALB logs bucket
        # pylint: disable=line-too-long
        alb_encryption_args = aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm='AES256'
        )
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f'alb-logs-encryption-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=alb_encryption_args,
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access for ALB logs bucket
        aws.s3.BucketPublicAccessBlock(
            f'alb-logs-public-access-block-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Get ELB service account for the region
        elb_service_account = aws.elb.get_service_account()

        # Create bucket policy to allow ALB to write logs
        alb_logs_policy = pulumi.Output.all(
            self.alb_logs_bucket.arn,
            elb_service_account.arn
        ).apply(lambda args: f"""{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Effect": "Allow",
                    "Principal": {{
                        "AWS": "{args[1]}"
                    }},
                    "Action": "s3:PutObject",
                    "Resource": "{args[0]}/alb-logs-{environment_suffix}/*"
                }}
            ]
        }}""")

        aws.s3.BucketPolicy(
            f'alb-logs-policy-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            policy=alb_logs_policy,
            opts=ResourceOptions(parent=self)
        )

        # Add lifecycle policy for log retention
        aws.s3.BucketLifecycleConfigurationV2(
            f'alb-logs-lifecycle-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id='delete-old-logs',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=90 if environment_suffix == 'prod' else 30
                    ),
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.static_assets_bucket_name = self.static_assets_bucket.bucket
        self.static_assets_bucket_arn = self.static_assets_bucket.arn
        self.alb_logs_bucket_name = self.alb_logs_bucket.bucket
        self.alb_logs_bucket_arn = self.alb_logs_bucket.arn

        self.register_outputs({
            'static_assets_bucket_name': self.static_assets_bucket_name,
            'alb_logs_bucket_name': self.alb_logs_bucket_name,
        })
