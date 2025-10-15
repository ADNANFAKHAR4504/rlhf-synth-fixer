import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export interface SecurityStackProps extends cdk.StackProps {
  cloudfrontDistributionArn: string;
  environmentSuffix: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create WAF Web ACL for CloudFront (must be in us-east-1 for CloudFront)
    this.webAcl = new wafv2.CfnWebACL(
      this,
      `PaymentsWebAcl-${props.environmentSuffix}`,
      {
        name: `payments-gateway-web-acl-${props.environmentSuffix}`,
        defaultAction: { allow: {} },
        scope: 'CLOUDFRONT',
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          sampledRequestsEnabled: true,
          metricName: `PaymentsWebAcl-${props.environmentSuffix}`,
        },
        rules: [
          // AWS Managed Rules Core rule set
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 0,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSet',
            },
          },
          // AWS Managed Rules IP reputation list
          {
            name: 'AWSManagedRulesAmazonIpReputationList',
            priority: 1,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesAmazonIpReputationList',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
              metricName: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          // Rate limiting rule to protect from DDoS
          {
            name: 'RateLimitRule',
            priority: 2,
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
        ],
      }
    );

    // Associate WAF Web ACL with CloudFront distribution
    new wafv2.CfnWebACLAssociation(
      this,
      `WebAclAssociation-${props.environmentSuffix}`,
      {
        resourceArn: props.cloudfrontDistributionArn,
        webAclArn: this.webAcl.attrArn,
      }
    );

    // Output values
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'ARN of the WAF Web ACL',
      exportName: `WebAclArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'ID of the WAF Web ACL',
      exportName: `WebAclId-${props.environmentSuffix}`,
    });
  }
}
