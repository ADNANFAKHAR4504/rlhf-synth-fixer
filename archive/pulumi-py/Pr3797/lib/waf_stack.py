"""
WAF Stack for CloudFront security and geo-blocking.
"""

import pulumi
from pulumi_aws import wafv2, Provider
from pulumi import ResourceOptions
from typing import Optional


class WAFStack(pulumi.ComponentResource):
    """
    Creates AWS WAF Web ACL with geo-blocking rules for CloudFront.
    Note: WAF for CloudFront must be created in us-east-1 region.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:waf:WAFStack', name, None, opts)

        # Create provider for us-east-1 (required for CloudFront WAF)
        us_east_1_provider = Provider(
            f"waf-us-east-1-provider-{environment_suffix}",
            region="us-east-1",
            opts=ResourceOptions(parent=self)
        )

        # Create IP Set for additional blocking if needed
        ip_set = wafv2.IpSet(
            f"waf-ip-set-{environment_suffix}",
            name=f"tap-blocked-ips-{environment_suffix}",
            scope="CLOUDFRONT",
            ip_address_version="IPV4",
            addresses=[],
            tags=tags,
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Create Web ACL with geo-blocking
        self.web_acl = wafv2.WebAcl(
            f"cloudfront-web-acl-{environment_suffix}",
            name=f"tap-cloudfront-acl-{environment_suffix}",
            scope="CLOUDFRONT",
            default_action=wafv2.WebAclDefaultActionArgs(
                allow=wafv2.WebAclDefaultActionAllowArgs()
            ),
            rules=[
                # Geo-blocking rule
                wafv2.WebAclRuleArgs(
                    name="geo-blocking-rule",
                    priority=1,
                    action=wafv2.WebAclRuleActionArgs(
                        block=wafv2.WebAclRuleActionBlockArgs()
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        geo_match_statement=wafv2.WebAclRuleStatementGeoMatchStatementArgs(
                            country_codes=["CN", "RU", "KP"]
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="geo-blocking-rule",
                        sampled_requests_enabled=True
                    )
                ),
                # Rate limiting rule
                wafv2.WebAclRuleArgs(
                    name="rate-limiting-rule",
                    priority=2,
                    action=wafv2.WebAclRuleActionArgs(
                        block=wafv2.WebAclRuleActionBlockArgs()
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        rate_based_statement=wafv2.WebAclRuleStatementRateBasedStatementArgs(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="rate-limiting-rule",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS managed rule - Common Rule Set
                wafv2.WebAclRuleArgs(
                    name="aws-managed-common-rule",
                    priority=3,
                    override_action=wafv2.WebAclRuleOverrideActionArgs(
                        none=wafv2.WebAclRuleOverrideActionNoneArgs()
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="aws-managed-common-rule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"tap-cloudfront-acl-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        self.web_acl_id = self.web_acl.arn

        self.register_outputs({
            'web_acl_id': self.web_acl_id
        })
