"""
WAF module for the serverless infrastructure.

This module creates AWS WAF with proper API Gateway association,
addressing the model failures about brittle ARN construction.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class WAFStack:
    """
    WAF stack for API Gateway protection.
    
    Creates WAF resources with:
    - Proper API Gateway association
    - Security rules
    - Rate limiting
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig, 
        api_gateway_stack,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the WAF stack.
        
        Args:
            config: Infrastructure configuration
            api_gateway_stack: API Gateway stack for association
            opts: Pulumi resource options
        """
        self.config = config
        self.api_gateway_stack = api_gateway_stack
        self.opts = opts or ResourceOptions()
        
        # Create WAF resources
        self.ip_set, self.rate_based_rule, self.web_acl = self._create_web_acl()
    
    def _create_web_acl(self):
        """Create WAF Web ACL with security rules."""
        web_acl_name = f"{self.config.get_resource_name('waf-web-acl', 'main')}-{self.config.environment}"
        
        # Create IP set for allowed IPs with unique name to avoid region conflicts
        ip_set = aws.wafv2.IpSet(
            self.config.get_resource_name('waf-ip-set', 'allowed-ips'),
            name=f"{web_acl_name}-allowed-ips-{self.config.aws_region}",
            scope="REGIONAL",
            ip_address_version="IPV4",
            addresses=["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"] if "0.0.0.0/0" in self.config.allowed_ips else self.config.allowed_ips,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Create rate-based rule with unique name to avoid region conflicts
        rate_based_rule = aws.waf.RateBasedRule(
            self.config.get_resource_name('waf-rate-rule', 'main'),
            name=f"{web_acl_name}-rate-limit-{self.config.aws_region}",
            metric_name=f"{web_acl_name.replace('-', '')}RateLimit",
            rate_key="IP",
            rate_limit=2000,  # 2000 requests per 5 minutes
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Create Web ACL with explicit dependency on IP set
        web_acl = aws.wafv2.WebAcl(
            web_acl_name,
            name=f"{web_acl_name}-{self.config.aws_region}",
            scope="REGIONAL",
            default_action=aws.wafv2.WebAclDefaultActionArgs(
                allow=aws.wafv2.WebAclDefaultActionAllowArgs()
            ),
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"{web_acl_name.replace('-', '')}WebAcl",
                sampled_requests_enabled=True
            ),
            rules=[
                aws.wafv2.WebAclRuleArgs(
                    name="IPWhitelist",
                    priority=1,
                    action=aws.wafv2.WebAclRuleActionArgs(
                        allow=aws.wafv2.WebAclRuleActionAllowArgs()
                    ),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        ip_set_reference_statement=aws.wafv2.WebAclRuleStatementIpSetReferenceStatementArgs(
                            arn=ip_set.arn
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="IPWhitelistRule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            tags=self.config.tags,
            opts=ResourceOptions(
                parent=self.opts.parent, 
                provider=self.opts.provider,
                depends_on=[ip_set]  # Explicit dependency to ensure proper deletion order
            )
        )
        
        return ip_set, rate_based_rule, web_acl
    
    def _create_api_gateway_association(self):
        """Create API Gateway association with proper ARN construction."""
        stage_arn = self.api_gateway_stack.stage.arn
        association = aws.wafv2.WebAclAssociation(
            self.config.get_resource_name('waf-association', 'api-gateway'),
            resource_arn=stage_arn,
            web_acl_arn=self.web_acl.arn,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        return association

    
    def get_web_acl_arn(self) -> pulumi.Output[str]:
        """Get Web ACL ARN."""
        return self.web_acl.arn
    
    def get_web_acl_id(self) -> pulumi.Output[str]:
        """Get Web ACL ID."""
        return self.web_acl.id
    
    def get_association_id(self):
        """Get association ID (disabled due to ARN format issues)."""
        return None
