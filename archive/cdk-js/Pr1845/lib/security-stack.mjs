import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class SecurityStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const { api } = props;

    // Create IP Set for whitelisted CIDR ranges
    this.ipSet = new wafv2.CfnIPSet(this, 'WhitelistedIPSet', {
      name: `prod-whitelist-ipset-${envSuffix}`,
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: [
        '10.0.0.0/8',          // Private network range
        '192.168.0.0/16',      // Private network range
        '172.16.0.0/12',       // Private network range
        '203.0.113.0/24',      // Example public CIDR for testing
      ],
      description: 'IP addresses allowed to access the API',
    });

    // WAF Web ACL for API Gateway with IP whitelisting
    this.webAcl = new wafv2.CfnWebACL(this, 'ApiGatewayWebAcl', {
      name: `prod-api-waf-${envSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { block: {} }, // Block all traffic by default
      description: 'WAF for API Gateway protection with IP whitelisting',
      rules: [
        {
          name: 'IPWhitelistRule',
          priority: 1,
          statement: {
            ipSetReferenceStatement: {
              arn: this.ipSet.attrArn,
            },
          },
          action: { allow: {} }, // Allow traffic from whitelisted IPs
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IPWhitelistRule',
          },
        },
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
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 3,
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
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 4,
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
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 5,
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
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `prod-api-waf-${envSuffix}`,
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'ApiGatewayWafAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${envSuffix}`,
      webAclArn: this.webAcl.attrArn,
    });

    // Store WAF ARN in SSM Parameter for reference
    new ssm.StringParameter(this, 'WafArnParameter', {
      parameterName: `/waf/web-acl-arn-${envSuffix}`,
      stringValue: this.webAcl.attrArn,
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'WAF Web ACL ID',
    });

    new cdk.CfnOutput(this, 'IPSetArn', {
      value: this.ipSet.attrArn,
      description: 'WAF IP Set ARN for whitelisted IPs',
    });
  }
}