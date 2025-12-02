"""
cloudfront_stack.py

CloudFront distributions for content delivery.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from typing import Optional


class CloudFrontStack(pulumi.ComponentResource):
    """CloudFront distribution for API."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        api_domain: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:cloudfront:CloudFrontStack", name, None, opts)

        # CloudFront distribution
        self.distribution = aws.cloudfront.Distribution(
            f"cloudfront-{environment_suffix}",
            enabled=True,
            comment=f"CloudFront distribution for {environment_suffix}",
            origins=[
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=api_domain,
                    origin_id=f"api-{environment_suffix}",
                    custom_origin_config=aws.cloudfront.DistributionOriginCustomOriginConfigArgs(
                        http_port=80,
                        https_port=443,
                        origin_protocol_policy="https-only",
                        origin_ssl_protocols=["TLSv1.2"],
                    ),
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                target_origin_id=f"api-{environment_suffix}",
                viewer_protocol_policy="redirect-to-https",
                allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cached_methods=["GET", "HEAD"],
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=True,
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="all",
                    ),
                    headers=["Authorization", "Content-Type"],
                ),
                min_ttl=0,
                default_ttl=0,
                max_ttl=0,
                compress=True,
            ),
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none",
                ),
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True,
            ),
            price_class="PriceClass_100",
            tags={**tags, "Name": f"cloudfront-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "distribution_id": self.distribution.id,
            "distribution_domain": self.distribution.domain_name,
        })
