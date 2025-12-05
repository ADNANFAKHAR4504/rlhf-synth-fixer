from constructs import Construct
from cdktf_cdktf_provider_aws.cloudfront_distribution import (
    CloudfrontDistribution,
    CloudfrontDistributionOrigin,
    CloudfrontDistributionOriginCustomOriginConfig,
    CloudfrontDistributionDefaultCacheBehavior,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValues,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies,
    CloudfrontDistributionRestrictions,
    CloudfrontDistributionRestrictionsGeoRestriction,
    CloudfrontDistributionViewerCertificate,
    CloudfrontDistributionOriginS3OriginConfig,
    CloudfrontDistributionOrderedCacheBehavior,
    CloudfrontDistributionOrderedCacheBehaviorForwardedValues,
    CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies
)
from cdktf_cdktf_provider_aws.cloudfront_origin_access_identity import CloudfrontOriginAccessIdentity
from cdktf_cdktf_provider_aws.wafv2_web_acl import (
    Wafv2WebAcl,
    Wafv2WebAclRule,
    Wafv2WebAclRuleAction,
    Wafv2WebAclDefaultAction,
    Wafv2WebAclVisibilityConfig,
    Wafv2WebAclRuleVisibilityConfig
)
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class CdnConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, alb, storage, security):
        super().__init__(scope, id)

        # CloudFront Origin Access Identity for S3
        oai = CloudfrontOriginAccessIdentity(self, "oai",
            comment=f"OAI for financial platform {environment_suffix}"
        )

        # S3 bucket policy to allow CloudFront access
        S3BucketPolicy(self, "static_assets_cf_policy",
            bucket=storage.static_assets_bucket.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": oai.iam_arn
                        },
                        "Action": "s3:GetObject",
                        "Resource": f"{storage.static_assets_bucket.arn}/*"
                    }
                ]
            })
        )

        # WAF Web ACL
        self.web_acl = Wafv2WebAcl(self, "waf_web_acl",
            name=f"financial-waf-{environment_suffix}",
            description="WAF for Financial Transaction Platform",
            scope="CLOUDFRONT",
            default_action=Wafv2WebAclDefaultAction(
                allow={}
            ),
            rule=[
                Wafv2WebAclRule(
                    name="RateLimitRule",
                    priority=1,
                    action=Wafv2WebAclRuleAction(
                        block={}
                    ),
                    statement={
                        "rate_based_statement": {
                            "limit": 2000,
                            "aggregate_key_type": "IP"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"financial-waf-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags={
                "Name": f"financial-waf-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudFront Distribution
        self.distribution = CloudfrontDistribution(self, "distribution",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Financial Transaction Platform Distribution {environment_suffix}",
            default_root_object="index.html",
            price_class="PriceClass_100",
            web_acl_id=self.web_acl.arn,
            origin=[
                # ALB Origin (dynamic content)
                CloudfrontDistributionOrigin(
                    origin_id="alb",
                    domain_name=alb.alb.dns_name,
                    custom_origin_config=CloudfrontDistributionOriginCustomOriginConfig(
                        http_port=80,
                        https_port=443,
                        origin_protocol_policy="http-only",
                        origin_ssl_protocols=["TLSv1.2"],
                        origin_keepalive_timeout=5,
                        origin_read_timeout=30
                    )
                ),
                # S3 Origin (static content)
                CloudfrontDistributionOrigin(
                    origin_id="s3",
                    domain_name=storage.static_assets_bucket.bucket_regional_domain_name,
                    s3_origin_config=CloudfrontDistributionOriginS3OriginConfig(
                        origin_access_identity=oai.cloudfront_access_identity_path
                    )
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                target_origin_id="alb",
                viewer_protocol_policy="redirect-to-https",
                allowed_methods=["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                cached_methods=["GET", "HEAD", "OPTIONS"],
                compress=True,
                forwarded_values=CloudfrontDistributionDefaultCacheBehaviorForwardedValues(
                    query_string=True,
                    headers=["Host", "Authorization"],
                    cookies=CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies(
                        forward="all"
                    )
                ),
                min_ttl=0,
                default_ttl=0,
                max_ttl=0
            ),
            ordered_cache_behavior=[
                # Static assets cache behavior
                CloudfrontDistributionOrderedCacheBehavior(
                    path_pattern="/static/*",
                    target_origin_id="s3",
                    viewer_protocol_policy="redirect-to-https",
                    allowed_methods=["GET", "HEAD", "OPTIONS"],
                    cached_methods=["GET", "HEAD", "OPTIONS"],
                    compress=True,
                    forwarded_values=CloudfrontDistributionOrderedCacheBehaviorForwardedValues(
                        query_string=False,
                        cookies=CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies(
                            forward="none"
                        )
                    ),
                    min_ttl=0,
                    default_ttl=86400,
                    max_ttl=31536000
                )
            ],
            restrictions=CloudfrontDistributionRestrictions(
                geo_restriction=CloudfrontDistributionRestrictionsGeoRestriction(
                    restriction_type="none"
                )
            ),
            viewer_certificate=CloudfrontDistributionViewerCertificate(
                cloudfront_default_certificate=True
            ),
            tags={
                "Name": f"financial-cloudfront-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )
