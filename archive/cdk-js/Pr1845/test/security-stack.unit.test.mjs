import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityStack } from '../lib/security-stack.mjs';

describe('SecurityStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';
  const mockApi = {
    restApiId: 'mock-api-id',
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix,
      api: mockApi,
    });
    template = Template.fromStack(stack);
  });

  describe('WAF Web ACL Configuration', () => {
    test('should create regional WAF web ACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `prod-api-waf-${environmentSuffix}`,
        Scope: 'REGIONAL',
        Description: 'WAF for API Gateway protection with IP whitelisting',
      });
    });

    test('should have default block action', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        DefaultAction: {
          Block: {},
        },
      });
    });

    test('should create IP Set for whitelisting', () => {
      template.hasResourceProperties('AWS::WAFv2::IPSet', {
        Name: `prod-whitelist-ipset-${environmentSuffix}`,
        Scope: 'REGIONAL',
        IPAddressVersion: 'IPV4',
        Addresses: Match.arrayWith([
          '10.0.0.0/8',
          '192.168.0.0/16',
          '172.16.0.0/12',
        ]),
      });
    });

    test('should enable CloudWatch metrics', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        VisibilityConfig: {
          SampledRequestsEnabled: true,
          CloudWatchMetricsEnabled: true,
          MetricName: `prod-api-waf-${environmentSuffix}`,
        },
      });
    });
  });

  describe('WAF Rules', () => {
    test('should include IP whitelist rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'IPWhitelistRule',
            Priority: 1,
            Action: {
              Allow: {},
            },
          }),
        ]),
      });
    });

    test('should include rate limiting rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 2,
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
            Action: {
              Block: {},
            },
          }),
        ]),
      });
    });

    test('should include AWS managed common rule set', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 3,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          }),
        ]),
      });
    });

    test('should have correct rule priorities', () => {
      const resources = template.toJSON().Resources;
      const webAcl = Object.values(resources).find(r => r.Type === 'AWS::WAFv2::WebACL');
      expect(webAcl.Properties.Rules[0].Priority).toBe(1);
      expect(webAcl.Properties.Rules[1].Priority).toBe(2);
    });
  });

  describe('WAF Rule Visibility', () => {
    test('should enable sampled requests for rate limit rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            VisibilityConfig: {
              SampledRequestsEnabled: true,
              CloudWatchMetricsEnabled: true,
              MetricName: 'RateLimitRule',
            },
          }),
        ]),
      });
    });

    test('should enable metrics for managed rule set', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            VisibilityConfig: {
              SampledRequestsEnabled: true,
              CloudWatchMetricsEnabled: true,
              MetricName: 'CommonRuleSetMetric',
            },
          }),
        ]),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should store WAF ARN in SSM', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/waf/web-acl-arn-${environmentSuffix}`,
        Type: 'String',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output WAF Web ACL ARN', () => {
      template.hasOutput('WebAclArn', {
        Description: 'WAF Web ACL ARN',
      });
    });

    test('should output WAF Web ACL ID', () => {
      template.hasOutput('WebAclId', {
        Description: 'WAF Web ACL ID',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should use rate limiting to prevent DDoS', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
          }),
        ]),
      });
    });

    test('should use AWS managed rules for common threats', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          }),
        ]),
      });
    });
  });

  describe('Production Configuration', () => {
    test('should use prod naming convention', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `prod-api-waf-${environmentSuffix}`,
      });
    });

    test('should have appropriate rate limit threshold', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
              },
            },
          }),
        ]),
      });
    });
  });
});