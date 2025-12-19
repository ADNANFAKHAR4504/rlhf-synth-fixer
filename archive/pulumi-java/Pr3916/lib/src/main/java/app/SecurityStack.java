package app;

import com.pulumi.Context;
import com.pulumi.aws.wafv2.WebAcl;
import com.pulumi.aws.wafv2.WebAclArgs;
import com.pulumi.aws.wafv2.inputs.WebAclDefaultActionArgs;
import com.pulumi.aws.wafv2.inputs.WebAclDefaultActionAllowArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleActionArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleActionBlockArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleStatementArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleStatementRateBasedStatementArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleVisibilityConfigArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleOverrideActionArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleOverrideActionNoneArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleStatementManagedRuleGroupStatementArgs;
import com.pulumi.aws.wafv2.inputs.WebAclVisibilityConfigArgs;

import java.util.Map;

/**
 * Security stack for WAF configuration.
 */
public class SecurityStack {
    private final WebAcl webAcl;

    public SecurityStack(final Context ctx) {
        // Create WAF Web ACL with rate limiting
        this.webAcl = new WebAcl("news-portal-waf",
            WebAclArgs.builder()
                .name("news-portal-waf")
                .description("WAF for news portal with rate limiting")
                .scope("CLOUDFRONT")
                .defaultAction(
                    WebAclDefaultActionArgs.builder()
                        .allow(WebAclDefaultActionAllowArgs.builder().build())
                        .build()
                )
                .rules(
                    // Rate limiting rule - 2000 requests per 5 minutes
                    WebAclRuleArgs.builder()
                        .name("rate-limit-rule")
                        .priority(1)
                        .action(
                            WebAclRuleActionArgs.builder()
                                .block(WebAclRuleActionBlockArgs.builder().build())
                                .build()
                        )
                        .statement(
                            WebAclRuleStatementArgs.builder()
                                .rateBasedStatement(
                                    WebAclRuleStatementRateBasedStatementArgs.builder()
                                        .limit(2000)
                                        .aggregateKeyType("IP")
                                        .build()
                                )
                                .build()
                        )
                        .visibilityConfig(
                            WebAclRuleVisibilityConfigArgs.builder()
                                .cloudwatchMetricsEnabled(true)
                                .metricName("RateLimitRule")
                                .sampledRequestsEnabled(true)
                                .build()
                        )
                        .build(),
                    // AWS Managed Rules - Common Rule Set
                    WebAclRuleArgs.builder()
                        .name("aws-managed-rules")
                        .priority(2)
                        .overrideAction(
                            WebAclRuleOverrideActionArgs.builder()
                                .none(WebAclRuleOverrideActionNoneArgs.builder().build())
                                .build()
                        )
                        .statement(
                            WebAclRuleStatementArgs.builder()
                                .managedRuleGroupStatement(
                                    WebAclRuleStatementManagedRuleGroupStatementArgs.builder()
                                        .vendorName("AWS")
                                        .name("AWSManagedRulesCommonRuleSet")
                                        .build()
                                )
                                .build()
                        )
                        .visibilityConfig(
                            WebAclRuleVisibilityConfigArgs.builder()
                                .cloudwatchMetricsEnabled(true)
                                .metricName("AWSManagedRules")
                                .sampledRequestsEnabled(true)
                                .build()
                        )
                        .build()
                )
                .visibilityConfig(
                    WebAclVisibilityConfigArgs.builder()
                        .cloudwatchMetricsEnabled(true)
                        .metricName("NewsPortalWAF")
                        .sampledRequestsEnabled(true)
                        .build()
                )
                .tags(Map.of(
                    "Name", "NewsPortalWAF",
                    "Environment", "production"
                ))
                .build());

        // Note: WAF association with CloudFront is handled in the distribution configuration
    }

    public WebAcl getWebAcl() {
        return webAcl;
    }
}
