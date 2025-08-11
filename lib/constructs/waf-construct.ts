import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WafConstructProps {
  environment: string;
}

export class WafConstruct extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WafConstructProps) {
    super(scope, id);

    const { environment } = props;

    // CloudWatch Log Group for WAF logs
    const wafLogGroup = new logs.LogGroup(this, `WAFLogGroup-${environment}`, {
      retention: logs.RetentionDays.THREE_MONTHS,
      logGroupName: `/aws/waf/${environment}/web-acl-logs`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, `WebACL-${environment}`, {
      scope: 'CLOUDFRONT', // Use CLOUDFRONT for CloudFront, REGIONAL for ALB
      defaultAction: { allow: {} },
      name: `WebACL-${environment}`,
      description: `WAF Web ACL for ${environment} environment`,

      rules: [
        // AWS Managed Rule - Core Rule Set
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },

        // AWS Managed Rule - SQL Injection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },

        // AWS Managed Rule - Known Bad Inputs
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsMetric',
          },
        },

        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 4,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
          },
        },

        // Custom XSS protection rule
        {
          name: 'XSSProtectionRule',
          priority: 5,
          action: { block: {} },
          statement: {
            xssMatchStatement: {
              fieldToMatch: {
                allQueryArguments: {},
              },
              textTransformations: [
                {
                  priority: 1,
                  type: 'URL_DECODE',
                },
                {
                  priority: 2,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'XSSProtectionMetric',
          },
        },
      ],

      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `WebACL-${environment}`,
      },
    });

    // WAF Logging Configuration - Enabled for production
    new wafv2.CfnLoggingConfiguration(this, `WAFLoggingConfig-${environment}`, {
      resourceArn: this.webAcl.attrArn,
      logDestinationConfigs: [wafLogGroup.logGroupArn.replace(':*', '')],
    });

    // Tag WAF resources
    cdk.Tags.of(this.webAcl).add('Name', `WebACL-${environment}`);
    cdk.Tags.of(this.webAcl).add('Component', 'Security');
    cdk.Tags.of(this.webAcl).add('Environment', environment);

    // Tag WAF log group
    cdk.Tags.of(wafLogGroup).add('Name', `WAFLogGroup-${environment}`);
    cdk.Tags.of(wafLogGroup).add('Component', 'Security');
    cdk.Tags.of(wafLogGroup).add('Environment', environment);
  }
}
