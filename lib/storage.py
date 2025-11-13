"""Storage infrastructure module with S3 and CloudFront."""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA,
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import (
    S3BucketPublicAccessBlock,
)
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.cloudfront_distribution import (
    CloudfrontDistribution,
    CloudfrontDistributionOrigin,
    CloudfrontDistributionOriginS3OriginConfig,
    CloudfrontDistributionDefaultCacheBehavior,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValues,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies,
    CloudfrontDistributionRestrictions,
    CloudfrontDistributionRestrictionsGeoRestriction,
    CloudfrontDistributionViewerCertificate,
)
from cdktf_cdktf_provider_aws.cloudfront_origin_access_identity import (
    CloudfrontOriginAccessIdentity,
)
import json


class StorageInfrastructure(Construct):
    """Storage infrastructure with S3 bucket and CloudFront distribution."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, region: str):
        """
        Initialize storage infrastructure.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Unique suffix for resource naming
            region: AWS region
        """
        super().__init__(scope, construct_id)

        # S3 Bucket for static content
        self.static_bucket = S3Bucket(
            self,
            "static_bucket",
            bucket=f"payment-static-{environment_suffix}",
            tags={
                "Name": f"payment-static-{environment_suffix}",
                "Purpose": "Static Content",
            },
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "bucket_versioning",
            bucket=self.static_bucket.id,
            versioning_configuration={
                "status": "Enabled",
            },
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "bucket_encryption",
            bucket=self.static_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(  # pylint: disable=line-too-long
                            sse_algorithm="AES256",
                        )
                    ),
                    bucket_key_enabled=True,
                )
            ],
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "bucket_public_access_block",
            bucket=self.static_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # CloudFront Origin Access Identity
        oai = CloudfrontOriginAccessIdentity(
            self,
            "oai",
            comment=f"OAI for payment static content {environment_suffix}",
        )

        # S3 Bucket Policy for CloudFront access
        bucket_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "CloudFrontOAIAccess",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"{oai.iam_arn}"
                    },
                    "Action": "s3:GetObject",
                    "Resource": f"{self.static_bucket.arn}/*",
                }
            ],
        }

        S3BucketPolicy(
            self,
            "bucket_policy",
            bucket=self.static_bucket.id,
            policy=json.dumps(bucket_policy_document),
        )

        # CloudFront Distribution
        self.cloudfront = CloudfrontDistribution(
            self,
            "cloudfront",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Payment processing static content distribution {environment_suffix}",
            default_root_object="index.html",
            origin=[
                CloudfrontDistributionOrigin(
                    domain_name=self.static_bucket.bucket_regional_domain_name,
                    origin_id=f"S3-{self.static_bucket.id}",
                    s3_origin_config=CloudfrontDistributionOriginS3OriginConfig(
                        origin_access_identity=oai.cloudfront_access_identity_path,
                    ),
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-{self.static_bucket.id}",
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                forwarded_values=CloudfrontDistributionDefaultCacheBehaviorForwardedValues(
                    query_string=False,
                    cookies=CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies(
                        forward="none",
                    ),
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
            ),
            restrictions=CloudfrontDistributionRestrictions(
                geo_restriction=CloudfrontDistributionRestrictionsGeoRestriction(
                    restriction_type="none",
                )
            ),
            viewer_certificate=CloudfrontDistributionViewerCertificate(
                cloudfront_default_certificate=True,
            ),
            tags={
                "Name": f"payment-cloudfront-{environment_suffix}",
            },
        )

    @property
    def static_content_bucket_name(self) -> str:
        """Return S3 bucket name."""
        return self.static_bucket.bucket

    @property
    def cloudfront_domain_name(self) -> str:
        """Return CloudFront distribution domain name."""
        return self.cloudfront.domain_name
