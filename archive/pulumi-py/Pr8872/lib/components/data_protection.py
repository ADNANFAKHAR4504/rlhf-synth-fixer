from typing import Optional, List
import json
import re
import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions
from pulumi_aws import get_caller_identity
from .base import BaseInfrastructureComponent


class DataProtectionInfrastructure(pulumi.ComponentResource, BaseInfrastructureComponent):
    """Data Protection Infrastructure Component
    
    This component creates and manages:
    - S3 buckets with encryption at rest and versioning
    - Data retention and backup policies
    """
    
    def __init__(self,
                 name: str,
                 region: str,
                 vpc_id: pulumi.Input[str],
                 private_subnet_ids: pulumi.Input[List[str]],
                 database_security_group_id: pulumi.Input[str],
                 kms_key_arn: pulumi.Input[str],
                 sns_topic_arn: pulumi.Input[str],
                 tags: Optional[dict] = None,
                 opts: Optional[ResourceOptions] = None):
        pulumi.ComponentResource.__init__(self, 'projectx:data:DataProtection', name, None, opts)
        BaseInfrastructureComponent.__init__(self, region, tags)

        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.database_security_group_id = database_security_group_id
        self.kms_key_arn = kms_key_arn
        self.sns_topic_arn = sns_topic_arn

        self._create_s3_resources()

        self.register_outputs({
            "secure_s3_bucket": self.secure_s3_bucket.bucket,
            "secure_s3_bucket_arn": self.secure_s3_bucket.arn
        })

    def _create_s3_resources(self):
        # Generate unique bucket suffix
        bucket_suffix = random.RandomId(
            f"s3-suffix-{self.region.replace('-', '')}",
            byte_length=4,
            opts=ResourceOptions(parent=self)
        )

        # Create secure S3 bucket
        bucket_name = pulumi.Output.all(
            suffix=bucket_suffix.hex,
            region=self.region
        ).apply(lambda args: f"secure-projectx-{args['region'].replace('-', '')}-{args['suffix']}")

        self.secure_s3_bucket = aws.s3.Bucket(
            f"secure-s3-{self.region.replace('-', '')}",
            bucket=bucket_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[bucket_suffix])
        )

        # Enable versioning
        self.s3_versioning = aws.s3.BucketVersioning(
            f"secure-s3-versioning-{self.region.replace('-', '')}",
            bucket=self.secure_s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.secure_s3_bucket])
        )

        # Server-side encryption configuration
        self.s3_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f"secure-s3-encryption-{self.region.replace('-', '')}",
            bucket=self.secure_s3_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key_arn
                    )
                )
            )],
            opts=ResourceOptions(parent=self, depends_on=[self.secure_s3_bucket])
        )

        # Block public access
        self.s3_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"secure-s3-pab-{self.region.replace('-', '')}",
            bucket=self.secure_s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self, depends_on=[self.secure_s3_bucket])
        )

        # Lifecycle configuration for cost optimization
        self.s3_lifecycle = aws.s3.BucketLifecycleConfiguration(
            f"secure-s3-lifecycle-{self.region.replace('-', '')}",
            bucket=self.secure_s3_bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
                id="secure-lifecycle-rule",
                status="Enabled",
                noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=30
                )
            )],
            opts=ResourceOptions(parent=self, depends_on=[self.secure_s3_bucket, self.s3_versioning])
        )
