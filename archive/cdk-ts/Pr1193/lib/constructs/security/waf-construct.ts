import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { SecurityConfig } from '../../config/security-config';

/**
 * WAF Construct for web application firewall protection
 * Protects applications from common web exploits and DDoS attacks
 */
export class WafConstruct extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(
    scope: Construct,
    id: string,
    alb?: elbv2.IApplicationLoadBalancer
  ) {
    super(scope, id);

    // WAF v2 Web ACL with comprehensive protection
    this.webAcl = new wafv2.CfnWebACL(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-WebACL`,
      {
        name: `${SecurityConfig.RESOURCE_PREFIX}-WebACL`,
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        description:
          'WAF ACL for secure web application with comprehensive protection',
        rules: [
          // Rate limiting rule
          {
            name: 'RateLimitRule',
            priority: 1,
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
              metricName: 'RateLimitRule',
            },
          },
          // AWS Managed Rules - Common Rule Set
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
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
          // AWS Managed Rules - Known Bad Inputs
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
          // AWS Managed Rules - SQL Injection
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 4,
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
          // AWS Managed Rules - IP Reputation List
          {
            name: 'AWSManagedRulesAmazonIpReputationList',
            priority: 5,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesAmazonIpReputationList',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'IpReputationListMetric',
            },
          },
          // Custom rule for blocking specific user agents
          {
            name: 'BlockMaliciousUserAgents',
            priority: 6,
            action: { block: {} },
            statement: {
              byteMatchStatement: {
                searchString: 'sqlmap|nmap|nikto|dirbuster|gobuster',
                fieldToMatch: { singleHeader: { name: 'user-agent' } },
                textTransformations: [{ priority: 0, type: 'LOWERCASE' }],
                positionalConstraint: 'CONTAINS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'BlockMaliciousUserAgents',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${SecurityConfig.RESOURCE_PREFIX}-WebACLMetric`,
        },
      }
    );

    // Associate WAF with ALB if provided
    if (alb) {
      new wafv2.CfnWebACLAssociation(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-WebACLAssociation`,
        {
          resourceArn: alb.loadBalancerArn,
          webAclArn: this.webAcl.attrArn,
        }
      );
    }
  }
}
