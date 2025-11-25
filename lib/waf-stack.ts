/**
 * waf-stack.ts
 *
 * Defines AWS WAFv2 Web ACL for protecting Application Load Balancer.
 *
 * Features:
 * - Rate limiting: 1000 requests per 5 minutes per IP
 * - AWS Managed Rule Groups (Common Rule Set, Known Bad Inputs)
 * - Optional geo-blocking
 * - CloudWatch metrics for all rules
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface WafStackArgs {
  environmentSuffix: string;
  albArn?: pulumi.Input<string>; // ALB ARN to associate WAF
  enableGeoBlocking?: boolean; // Optional geo-blocking
  blockedCountries?: string[]; // ISO country codes to block
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class WafStack extends pulumi.ComponentResource {
  public readonly webAcl: aws.wafv2.WebAcl;
  public readonly webAclArn: pulumi.Output<string>;
  public readonly webAclAssociation?: aws.wafv2.WebAclAssociation;

  constructor(
    name: string,
    args: WafStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:waf:WafStack', name, args, opts);

    const {
      environmentSuffix,
      albArn,
      enableGeoBlocking = false,
      blockedCountries = [],
      tags,
    } = args;

    // Define WAF rules
    const rules: aws.types.input.wafv2.WebAclRule[] = [
      // Rule 0: Rate-based rule (1000 requests per 5 minutes)
      {
        name: 'RateLimitRule',
        priority: 0,
        statement: {
          rateBasedStatement: {
            limit: 1000,
            aggregateKeyType: 'IP',
          },
        },
        action: {
          block: {},
        },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: 'RateLimitRule',
        },
      },
      // Rule 1: AWS Managed Rules - Common Rule Set
      {
        name: 'AWSManagedRulesCommon',
        priority: 1,
        statement: {
          managedRuleGroupStatement: {
            vendorName: 'AWS',
            name: 'AWSManagedRulesCommonRuleSet',
          },
        },
        overrideAction: {
          none: {},
        },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: 'AWSManagedRulesCommon',
        },
      },
      // Rule 2: AWS Managed Rules - Known Bad Inputs
      {
        name: 'AWSManagedRulesKnownBadInputs',
        priority: 2,
        statement: {
          managedRuleGroupStatement: {
            vendorName: 'AWS',
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
          },
        },
        overrideAction: {
          none: {},
        },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: 'AWSManagedRulesKnownBadInputs',
        },
      },
    ];

    // Add geo-blocking rule if enabled
    if (enableGeoBlocking && blockedCountries.length > 0) {
      rules.push({
        name: 'GeoBlockingRule',
        priority: 3,
        statement: {
          geoMatchStatement: {
            countryCodes: blockedCountries,
          },
        },
        action: {
          block: {},
        },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: 'GeoBlockingRule',
        },
      });
    }

    // Create WAFv2 Web ACL
    this.webAcl = new aws.wafv2.WebAcl(
      `cicd-waf-${environmentSuffix}`,
      {
        name: `cicd-waf-${environmentSuffix}`,
        scope: 'REGIONAL', // For ALB/API Gateway (use CLOUDFRONT for CloudFront)
        defaultAction: {
          allow: {}, // Default allow, rules will block bad traffic
        },
        rules,
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: `cicd-waf-${environmentSuffix}`,
        },
        tags: {
          ...tags,
          Name: `cicd-waf-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.webAclArn = this.webAcl.arn;

    // Associate WAF with ALB if provided
    if (albArn) {
      this.webAclAssociation = new aws.wafv2.WebAclAssociation(
        `alb-waf-association-${environmentSuffix}`,
        {
          resourceArn: albArn,
          webAclArn: this.webAcl.arn,
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      webAclId: this.webAcl.id,
      webAclArn: this.webAcl.arn,
      webAclName: this.webAcl.name,
    });
  }
}
