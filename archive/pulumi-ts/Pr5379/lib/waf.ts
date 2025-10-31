/**
 * WAF Web ACL for API Gateway protection
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface WafArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class WafWebAcl extends pulumi.ComponentResource {
  public readonly webAcl: aws.wafv2.WebAcl;

  constructor(
    name: string,
    args: WafArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:WafWebAcl', name, {}, opts);

    this.webAcl = new aws.wafv2.WebAcl(
      `payment-waf-${args.environmentSuffix}`,
      {
        name: `payment-waf-${args.environmentSuffix}`,
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesKnownBadInputsRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `payment-waf-${args.environmentSuffix}`,
          sampledRequestsEnabled: true,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    this.registerOutputs({
      webAclArn: this.webAcl.arn,
      webAclId: this.webAcl.id,
    });
  }
}
