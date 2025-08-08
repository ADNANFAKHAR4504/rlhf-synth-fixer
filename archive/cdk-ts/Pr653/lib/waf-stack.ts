import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

interface WafStackProps extends cdk.StackProps {
  applicationLoadBalancer: elbv2.ApplicationLoadBalancer;
}

export class WafStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    const { applicationLoadBalancer } = props;

    // WAF v2 Web ACL with automatic DDoS protection
    this.webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: 'SecureWebAppAcl',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF ACL for secure web application with DDoS protection',
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
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
          overrideAction: { none: {} },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
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
          overrideAction: { none: {} },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
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
          overrideAction: { none: {} },
        },
        {
          name: 'AWSManagedRulesAmazonIpReputationList',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IpReputationMetric',
          },
          overrideAction: { none: {} },
        },
        {
          name: 'RateLimitRule',
          priority: 5,
          statement: {
            rateBasedStatement: {
              limit: 10000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SecureWebAppAclMetric',
      },
    });

    // Associate WAF with Application Load Balancer
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: applicationLoadBalancer.loadBalancerArn,
      webAclArn: this.webAcl.attrArn,
    });

    // Output the WAF ACL ARN
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
