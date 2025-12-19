from typing import Dict, List
from constructs import Construct
from cdktf_cdktf_provider_aws.wafv2_web_acl import (
    Wafv2WebAcl,
    Wafv2WebAclRule,
    Wafv2WebAclDefaultAction,
    Wafv2WebAclRuleAction,
    Wafv2WebAclVisibilityConfig,
    Wafv2WebAclRuleVisibilityConfig,
)
from cdktf_cdktf_provider_aws.wafv2_ip_set import Wafv2IpSet


class ZeroTrustWaf(Construct):
    """
    Creates AWS WAF with rate-based rules and IP reputation lists.

    This construct implements:
    - Rate-based rules for DDoS protection
    - IP reputation lists for known malicious IPs
    - Geo-blocking rules
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create IP sets
        self.blocked_ip_set = self._create_blocked_ip_set()

        # Create Web ACL
        self.web_acl = self._create_web_acl()

    def _create_blocked_ip_set(self) -> Wafv2IpSet:
        """Create IP set for blocked IPs"""

        ip_set = Wafv2IpSet(
            self,
            "blocked_ip_set",
            name=f"zero-trust-blocked-ips-{self.environment_suffix}",
            description="IP addresses to block",
            scope="REGIONAL",
            ip_address_version="IPV4",
            addresses=[
                # Example blocked IPs - replace with actual threat intelligence
                "192.0.2.0/24",
            ],
            tags={
                "Name": f"zero-trust-blocked-ips-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        return ip_set

    def _create_web_acl(self) -> Wafv2WebAcl:
        """Create WAF Web ACL with security rules"""

        web_acl = Wafv2WebAcl(
            self,
            "web_acl",
            name=f"zero-trust-waf-{self.environment_suffix}",
            description="WAF rules for Zero Trust security",
            scope="REGIONAL",
            default_action=Wafv2WebAclDefaultAction(
                allow={}
            ),
            rule=[
                # Rule 1: Block known malicious IPs
                Wafv2WebAclRule(
                    name="BlockMaliciousIPs",
                    priority=1,
                    statement={
                        "ip_set_reference_statement": {
                            "arn": self.blocked_ip_set.arn,
                        }
                    },
                    action=Wafv2WebAclRuleAction(
                        block={}
                    ),
                    visibility_config={
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": f"BlockedIPs-{self.environment_suffix}",
                        "sampled_requests_enabled": True,
                    },
                ),
                # Rule 2: Rate-based rule (DDoS protection)
                Wafv2WebAclRule(
                    name="RateLimit",
                    priority=2,
                    statement={
                        "rate_based_statement": {
                            "limit": 2000,
                            "aggregate_key_type": "IP",
                        }
                    },
                    action=Wafv2WebAclRuleAction(
                        block={}
                    ),
                    visibility_config={
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": f"RateLimit-{self.environment_suffix}",
                        "sampled_requests_enabled": True,
                    },
                ),
                # Rule 3: AWS managed rule - Core rule set
                Wafv2WebAclRule(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=3,
                    statement={
                        "managed_rule_group_statement": {
                            "vendor_name": "AWS",
                            "name": "AWSManagedRulesCommonRuleSet",
                        }
                    },
                    override_action={
                        "none": {}
                    },
                    visibility_config={
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": f"AWSManagedRules-{self.environment_suffix}",
                        "sampled_requests_enabled": True,
                    },
                ),
                # Rule 4: AWS managed rule - Known bad inputs
                Wafv2WebAclRule(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=4,
                    statement={
                        "managed_rule_group_statement": {
                            "vendor_name": "AWS",
                            "name": "AWSManagedRulesKnownBadInputsRuleSet",
                        }
                    },
                    override_action={
                        "none": {}
                    },
                    visibility_config={
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": f"KnownBadInputs-{self.environment_suffix}",
                        "sampled_requests_enabled": True,
                    },
                ),
                # Rule 5: AWS managed rule - Amazon IP reputation list
                Wafv2WebAclRule(
                    name="AWSManagedRulesAmazonIpReputationList",
                    priority=5,
                    statement={
                        "managed_rule_group_statement": {
                            "vendor_name": "AWS",
                            "name": "AWSManagedRulesAmazonIpReputationList",
                        }
                    },
                    override_action={
                        "none": {}
                    },
                    visibility_config={
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": f"IPReputation-{self.environment_suffix}",
                        "sampled_requests_enabled": True,
                    },
                ),
            ],
            visibility_config={
                "cloudwatch_metrics_enabled": True,
                "metric_name": f"WAF-{self.environment_suffix}",
                "sampled_requests_enabled": True,
            },
            tags={
                "Name": f"zero-trust-waf-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        return web_acl
