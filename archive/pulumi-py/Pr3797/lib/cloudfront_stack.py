"""
CloudFront Stack for CDN distribution.
"""

import pulumi
from pulumi_aws import cloudfront, s3
from pulumi import ResourceOptions, Output
from typing import Optional
import json


class CloudFrontStack(pulumi.ComponentResource):
    """
    Creates CloudFront distribution with Lambda@Edge integration.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        origin_bucket: s3.Bucket,
        viewer_request_lambda_arn: Output[str],
        origin_response_lambda_arn: Output[str],
        web_acl_id: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:cloudfront:CloudFrontStack', name, None, opts)

        # Create separate S3 bucket for CloudFront logs with ACL enabled
        logs_bucket = s3.Bucket(
            f"cloudfront-logs-bucket-{environment_suffix}",
            bucket=f"tap-cdn-logs-{environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Enable ACL for logs bucket (required for CloudFront logging)
        s3.BucketAclV2(
            f"cloudfront-logs-bucket-acl-{environment_suffix}",
            bucket=logs_bucket.id,
            acl="log-delivery-write",
            opts=ResourceOptions(parent=self)
        )

        # Enable bucket ownership controls for logs bucket
        s3.BucketOwnershipControls(
            f"cloudfront-logs-bucket-ownership-{environment_suffix}",
            bucket=logs_bucket.id,
            rule=s3.BucketOwnershipControlsRuleArgs(
                object_ownership="BucketOwnerPreferred"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Origin Access Control for S3
        oac = cloudfront.OriginAccessControl(
            f"cloudfront-oac-{environment_suffix}",
            name=f"tap-oac-{environment_suffix}",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4",
            opts=ResourceOptions(parent=self)
        )

        # CloudFront distribution
        self.distribution = cloudfront.Distribution(
            f"cdn-distribution-{environment_suffix}",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"TAP CDN Distribution - {environment_suffix}",
            default_root_object="index.html",
            price_class="PriceClass_100",
            web_acl_id=web_acl_id,
            origins=[
                cloudfront.DistributionOriginArgs(
                    domain_name=origin_bucket.bucket_regional_domain_name,
                    origin_id=f"S3-{environment_suffix}",
                    origin_access_control_id=oac.id
                )
            ],
            default_cache_behavior=cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-{environment_suffix}",
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                forwarded_values=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=True,
                    cookies=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="all"
                    ),
                    headers=["CloudFront-Viewer-Country", "CloudFront-Is-Mobile-Viewer"]
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
                lambda_function_associations=[
                    cloudfront.DistributionDefaultCacheBehaviorLambdaFunctionAssociationArgs(
                        event_type="viewer-request",
                        lambda_arn=viewer_request_lambda_arn,
                        include_body=False
                    ),
                    cloudfront.DistributionDefaultCacheBehaviorLambdaFunctionAssociationArgs(
                        event_type="origin-response",
                        lambda_arn=origin_response_lambda_arn,
                        include_body=False
                    )
                ]
            ),
            ordered_cache_behaviors=[
                # Static assets cache behavior
                cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/static/*",
                    allowed_methods=["GET", "HEAD"],
                    cached_methods=["GET", "HEAD"],
                    target_origin_id=f"S3-{environment_suffix}",
                    viewer_protocol_policy="redirect-to-https",
                    compress=True,
                    forwarded_values=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=False,
                        cookies=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="none"
                        )
                    ),
                    min_ttl=0,
                    default_ttl=86400,
                    max_ttl=31536000
                ),
                # API cache behavior
                cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/api/*",
                    allowed_methods=["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    cached_methods=["GET", "HEAD"],
                    target_origin_id=f"S3-{environment_suffix}",
                    viewer_protocol_policy="redirect-to-https",
                    compress=True,
                    forwarded_values=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=True,
                        cookies=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="all"
                        ),
                        headers=["Authorization", "CloudFront-Viewer-Country"]
                    ),
                    min_ttl=0,
                    default_ttl=0,
                    max_ttl=0
                )
            ],
            restrictions=cloudfront.DistributionRestrictionsArgs(
                geo_restriction=cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            logging_config=cloudfront.DistributionLoggingConfigArgs(
                bucket=logs_bucket.bucket_regional_domain_name,
                include_cookies=False,
                prefix="cloudfront-logs/"
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Update S3 bucket policy to allow CloudFront OAC
        bucket_policy = s3.BucketPolicy(
            f"origin-bucket-policy-{environment_suffix}",
            bucket=origin_bucket.id,
            policy=pulumi.Output.all(
                origin_bucket.arn,
                self.distribution.arn
            ).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudfront.amazonaws.com"
                            },
                            "Action": "s3:GetObject",
                            "Resource": f"{args[0]}/*",
                            "Condition": {
                                "StringEquals": {
                                    "AWS:SourceArn": args[1]
                                }
                            }
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        self.distribution_id = self.distribution.id
        self.distribution_domain_name = self.distribution.domain_name
        self.distribution_hosted_zone_id = self.distribution.hosted_zone_id

        self.register_outputs({
            'distribution_id': self.distribution_id,
            'distribution_domain_name': self.distribution_domain_name,
            'distribution_hosted_zone_id': self.distribution_hosted_zone_id
        })
