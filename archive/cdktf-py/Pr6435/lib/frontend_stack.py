"""Frontend Stack - S3 and CloudFront for React application."""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA,
)
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
from cdktf_cdktf_provider_aws.cloudfront_origin_access_identity import CloudfrontOriginAccessIdentity
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class FrontendStack(Construct):
    """Frontend infrastructure for React application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        **kwargs
    ):
        """Initialize frontend stack."""
        super().__init__(scope, construct_id)

        # S3 Bucket for Frontend Assets
        self._frontend_bucket = S3Bucket(
            self,
            "frontend_bucket",
            bucket=f"payment-frontend-{environment_suffix}",
            tags={
                "Name": f"payment-frontend-{environment_suffix}",
            },
        )

        # Block Public Access
        S3BucketPublicAccessBlock(
            self,
            "frontend_bucket_pab",
            bucket=self._frontend_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Enable Versioning
        S3BucketVersioningA(
            self,
            "frontend_bucket_versioning",
            bucket=self._frontend_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled",
            ),
        )

        # Enable Encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "frontend_bucket_encryption",
            bucket=self._frontend_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="AES256",
                        )
                    ),
                )
            ],
        )

        # CloudFront Origin Access Identity
        oai = CloudfrontOriginAccessIdentity(
            self,
            "oai",
            comment=f"OAI for payment frontend {environment_suffix}",
        )

        # S3 Bucket Policy to allow CloudFront access
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "CloudFrontAccess",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity {oai.id}"
                    },
                    "Action": "s3:GetObject",
                    "Resource": f"{self._frontend_bucket.arn}/*"
                }
            ]
        }

        S3BucketPolicy(
            self,
            "frontend_bucket_policy",
            bucket=self._frontend_bucket.id,
            policy=json.dumps(bucket_policy),
        )

        # CloudFront Distribution
        self._cloudfront_distribution = CloudfrontDistribution(
            self,
            "cloudfront_distribution",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"CloudFront distribution for payment frontend {environment_suffix}",
            default_root_object="index.html",
            origin=[
                CloudfrontDistributionOrigin(
                    domain_name=self._frontend_bucket.bucket_regional_domain_name,
                    origin_id=f"S3-payment-frontend-{environment_suffix}",
                    s3_origin_config=CloudfrontDistributionOriginS3OriginConfig(
                        origin_access_identity=oai.cloudfront_access_identity_path,
                    ),
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-payment-frontend-{environment_suffix}",
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
    def frontend_bucket_name(self) -> str:
        """Return frontend bucket name."""
        return self._frontend_bucket.bucket

    @property
    def cloudfront_distribution_id(self) -> str:
        """Return CloudFront distribution ID."""
        return self._cloudfront_distribution.id

    @property
    def cloudfront_domain_name(self) -> str:
        """Return CloudFront domain name."""
        return self._cloudfront_distribution.domain_name
