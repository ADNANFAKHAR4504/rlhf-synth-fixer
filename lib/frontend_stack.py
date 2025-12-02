"""
Frontend Stack for Payment Processing Infrastructure

Creates S3 bucket and CloudFront distribution for React frontend hosting.
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class FrontendStackArgs:
    """
    Arguments for Frontend Stack.

    Args:
        environment_suffix: Suffix for resource naming
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class FrontendStack(pulumi.ComponentResource):
    """
    Frontend hosting infrastructure with S3 and CloudFront.

    Creates:
    - S3 bucket for static website hosting
    - CloudFront Origin Access Identity
    - CloudFront distribution with S3 origin
    - Bucket policy allowing CloudFront access
    """

    def __init__(
        self,
        name: str,
        args: FrontendStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:frontend:FrontendStack', name, None, opts)

        # Create S3 bucket for frontend
        self.bucket = aws.s3.Bucket(
            f"payment-frontend-{args.environment_suffix}",
            force_destroy=True,  # For destroyability
            tags={
                **args.tags,
                'Name': f'payment-frontend-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create bucket ACL
        self.bucket_acl = aws.s3.BucketAclV2(
            f"payment-frontend-acl-{args.environment_suffix}",
            bucket=self.bucket.id,
            acl="private",
            opts=ResourceOptions(parent=self, depends_on=[self.bucket])
        )

        # Create bucket website configuration
        self.bucket_website = aws.s3.BucketWebsiteConfigurationV2(
            f"payment-frontend-website-{args.environment_suffix}",
            bucket=self.bucket.id,
            index_document=aws.s3.BucketWebsiteConfigurationV2IndexDocumentArgs(
                suffix="index.html"
            ),
            error_document=aws.s3.BucketWebsiteConfigurationV2ErrorDocumentArgs(
                key="error.html"
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.bucket])
        )

        # Block public access to S3 bucket (CloudFront will access via OAI)
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"payment-frontend-public-access-block-{args.environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self, depends_on=[self.bucket])
        )

        # Create CloudFront Origin Access Identity
        self.oai = aws.cloudfront.OriginAccessIdentity(
            f"payment-oai-{args.environment_suffix}",
            comment=f"OAI for payment frontend {args.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # Create bucket policy to allow CloudFront access
        self.bucket_policy = aws.s3.BucketPolicy(
            f"payment-frontend-policy-{args.environment_suffix}",
            bucket=self.bucket.id,
            policy=pulumi.Output.all(self.bucket.arn, self.oai.iam_arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": args[1]
                        },
                        "Action": "s3:GetObject",
                        "Resource": f"{args[0]}/*"
                    }]
                })
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.bucket, self.oai])
        )

        # Create CloudFront distribution
        self.distribution = aws.cloudfront.Distribution(
            f"payment-cdn-{args.environment_suffix}",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Payment frontend CDN {args.environment_suffix}",
            default_root_object="index.html",
            origins=[
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=self.bucket.bucket_regional_domain_name,
                    origin_id=f"S3-{self.bucket.id}",
                    s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=self.oai.cloudfront_access_identity_path
                    )
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=self.bucket.id.apply(lambda id: f"S3-{id}"),
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="none"
                    )
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400
            ),
            price_class="PriceClass_100",
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            custom_error_responses=[
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=404,
                    response_code=200,
                    response_page_path="/index.html",
                    error_caching_min_ttl=300
                )
            ],
            tags=args.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.bucket, self.oai, self.bucket_policy, self.bucket_acl, self.bucket_website])
        )

        # Export outputs
        self.bucket_name = self.bucket.id
        self.cloudfront_domain = self.distribution.domain_name
        self.cloudfront_url = self.distribution.domain_name.apply(lambda d: f"https://{d}")

        self.register_outputs({
            'bucket_name': self.bucket_name,
            'cloudfront_domain': self.cloudfront_domain,
            'cloudfront_url': self.cloudfront_url,
        })
