import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { LoadBalancerStack } from './load-balancer';

export class WafShieldStack extends pulumi.ComponentResource {
  public readonly webAclArn: pulumi.Output<string>;
  public readonly webAclName: pulumi.Output<string>;
  public readonly webAclId: pulumi.Output<string>;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:waf:WafShieldStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // WAF Web ACL
    const webAcl = new aws.wafv2.WebAcl(
      `${args.environment}-web-acl`,
      {
        name: `${args.environment}-web-acl`,
        description: 'WAF Web ACL for application protection',
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
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
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
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'KnownBadInputsRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'RateLimitRule',
            priority: 3,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRuleMetric',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `${args.environment}WebAcl`,
          sampledRequestsEnabled: true,
        },
        tags: {
          ...commonTags,
          Name: `${args.environment}-Web-ACL`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.webAclArn = webAcl.arn;
    this.webAclName = webAcl.name;
    this.webAclId = webAcl.id;

    // Associate WAF with ALB
    new aws.wafv2.WebAclAssociation(
      `${args.environment}-waf-alb-association`,
      {
        resourceArn: args.loadBalancerStack.applicationLoadBalancer.arn,
        webAclArn: webAcl.arn,
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      webAclArn: this.webAclArn,
      webAclName: this.webAclName,
      webAclId: this.webAclId,
    });
  }
}
