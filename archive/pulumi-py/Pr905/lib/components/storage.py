"""
Storage Component - Creates S3 buckets with encryption and security best practices
"""

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class StorageComponent(pulumi.ComponentResource):
  def __init__(
          self,
          name: str,
          environment: str,
          region_suffix: str,
          tags: dict,
          opts: pulumi.ResourceOptions = None):
    super().__init__("custom:aws:Storage", name, None, opts)

    account_id = aws.get_caller_identity_output().account_id
    child_opts = ResourceOptions.merge(opts, ResourceOptions(parent=self))

    self.environment = environment
    # S3 Bucket for application data
    self.bucket = aws.s3.Bucket(
        f"{name}-app-bucket-{region_suffix}",
        bucket=f"apprlhfturing{region_suffix}",
        tags={**tags, "Name": f"rlhfbucketturing{region_suffix}"},
        # opts=pulumi.ResourceOptions(parent=self),
        opts=child_opts
    )

    # S3 Bucket Versioning
    self.bucket_versioning = aws.s3.BucketVersioningV2(
        f"{name}-bucket-versioning",
        bucket=self.bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled"
        ),
        opts=child_opts
        # opts=pulumi.ResourceOptions(parent=self),
    )

    self.bucket_policy_doc = aws.iam.get_policy_document_output(statements=[
        # Allow CloudTrail to check bucket ACL
        aws.iam.GetPolicyDocumentStatementArgs(
            effect="Allow",
            principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                type="Service", identifiers=["cloudtrail.amazonaws.com"]
            )],
            actions=["s3:GetBucketAcl"],
            resources=[self.bucket.arn],
        ),
        # Allow CloudTrail to put logs with the required ACL
        aws.iam.GetPolicyDocumentStatementArgs(
            effect="Allow",
            principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                type="Service", identifiers=["cloudtrail.amazonaws.com"]
            )],
            actions=["s3:PutObject"],
            resources=[pulumi.Output.all(self.bucket.arn, account_id).apply(
                # arn:aws:s3:::<bucket>/AWSLogs/<acct>/*
                lambda x: f"{x[0]}/AWSLogs/{x[1]}/*"
            )],
            conditions=[aws.iam.GetPolicyDocumentStatementConditionArgs(
                test="StringEquals",
                variable="s3:x-amz-acl",
                values=["bucket-owner-full-control"],
            )],
        ),
    ])

    aws.s3.BucketPolicy(
        f"trail-bucket-policy-{region_suffix}",
        bucket=self.bucket.id,
        policy=self.bucket_policy_doc.json,
        opts=child_opts
    )

    # S3 Bucket Server-Side Encryption
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"{name}-bucket-encryption",
        bucket=self.bucket.id,
        rules=[  # pass rules directly, no extra nested arg class
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True,
            )
        ],
        # opts=pulumi.ResourceOptions(parent=self),
        opts=child_opts
    )

    # S3 Bucket Public Access Block
    self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
        f"{name}-bucket-pab",
        bucket=self.bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        # opts=pulumi.ResourceOptions(parent=self),
        opts=child_opts
    )

    # S3 Bucket Lifecycle Configuration
    self.bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
        f"{name}-bucket-lifecycle",
        bucket=self.bucket.id,
        rules=[
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="transition_to_ia",
                status="Enabled",
                transitions=[
                    aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                        days=30, storage_class="STANDARD_IA"
                    ),
                    aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                        days=90, storage_class="GLACIER"
                    ),
                ],
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="delete_old_versions",
                status="Enabled",
                noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=365
                ),
            ),
        ],
        # opts=pulumi.ResourceOptions(parent=self),
        opts=child_opts
    )
