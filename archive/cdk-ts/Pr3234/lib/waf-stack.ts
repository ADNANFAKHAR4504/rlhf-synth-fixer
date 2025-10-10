import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WafStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class WafStack extends cdk.NestedStack {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    // WAF Web ACL for CloudFront (must be in us-east-1)
    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: `portfolio-waf-${props.environmentSuffix}`,
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `RateLimitRule-${props.environmentSuffix}`,
          },
        },
        {
          name: 'CommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `CommonRuleSet-${props.environmentSuffix}`,
          },
        },
        {
          name: 'KnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `KnownBadInputs-${props.environmentSuffix}`,
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `WebACL-${props.environmentSuffix}`,
      },
    });

    this.webAclArn = webAcl.attrArn;

    // Output for cross-stack reference
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAclArn,
      description: 'WAF Web ACL ARN',
      exportName: `waf-webacl-arn-${props.environmentSuffix}`,
    });
  }
}
