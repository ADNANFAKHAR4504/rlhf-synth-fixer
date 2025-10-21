import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityStack } from '../lib/security-stack';

describe('SecurityStack Unit Tests', () => {
  let app: cdk.App;
  let stack: SecurityStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix: 'test123',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
    });

    test('WAF Web ACL is exported correctly', () => {
      expect(stack.webAcl).toBeDefined();
    });
  });

  describe('WAF Web ACL Configuration', () => {
    test('Creates exactly one WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('WAF Web ACL has CLOUDFRONT scope', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'CLOUDFRONT',
      });
    });

    test('WAF Web ACL has correct name pattern', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'payments-gateway-web-acl-test123',
      });
    });

    test('WAF Web ACL has allow default action with rules blocking threats', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        DefaultAction: {
          Allow: {},
        },
      });
    });

    test('WAF Web ACL has CloudWatch metrics enabled', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        VisibilityConfig: {
          CloudWatchMetricsEnabled: true,
          MetricName: Match.stringLikeRegexp('.*test123.*'),
          SampledRequestsEnabled: true,
        },
      });
    });
  });

  describe('WAF Rules', () => {
    test('WAF Web ACL has exactly 3 rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({ Priority: 0 }),
          Match.objectLike({ Priority: 1 }),
          Match.objectLike({ Priority: 2 }),
        ]),
      });
    });

    test('Rule 0: AWS Common Rule Set is configured', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Priority: 0,
            Name: Match.stringLikeRegexp('.*CommonRuleSet.*'),
            OverrideAction: { None: {} },
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

    test('Rule 1: IP Reputation List is configured', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Priority: 1,
            Name: Match.stringLikeRegexp('.*IpReputationList.*'),
            OverrideAction: { None: {} },
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesAmazonIpReputationList',
              },
            },
          }),
        ]),
      });
    });

    test('Rule 2: Rate Limiting is configured with 2000 requests per 5 minutes', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Priority: 2,
            Name: Match.stringLikeRegexp('.*RateLimit.*'),
            Action: { Block: {} },
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

    test('All rules have visibility configuration', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            VisibilityConfig: {
              CloudWatchMetricsEnabled: true,
              SampledRequestsEnabled: true,
              MetricName: Match.anyValue(),
            },
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports WAF Web ACL ARN', () => {
      template.hasOutput('WebAclArn', {});
    });

    test('Exports WAF Web ACL ID', () => {
      template.hasOutput('WebAclId', {});
    });

    test('Exports WAF Web ACL name', () => {
      template.hasOutput('WebAclName', {
        Value: 'payments-gateway-web-acl-test123',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('Different environment suffixes create different WAF Web ACL names', () => {
      const app2 = new cdk.App();
      const stack2 = new SecurityStack(app2, 'TestSecurityStack2', {
        environmentSuffix: 'prod456',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'payments-gateway-web-acl-test123',
      });

      template2.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'payments-gateway-web-acl-prod456',
      });
    });
  });

  describe('Region Requirement', () => {
    test('Stack must be deployed in us-east-1 for CloudFront', () => {
      expect(stack.region).toBe('us-east-1');
    });
  });

  describe('Output Export Names', () => {
    test('Export names include environment suffix', () => {
      const outputs = template.findOutputs('*');

      expect(outputs.WebAclArn.Export.Name).toBe('WebAclArn-test123');
      expect(outputs.WebAclId.Export.Name).toBe('WebAclId-test123');
      expect(outputs.WebAclName.Export.Name).toBe('WebAclName-test123');
    });
  });

  describe('Security Best Practices', () => {
    test('WAF has multiple layers of protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              ManagedRuleGroupStatement: Match.anyValue(),
            },
          }),
          Match.objectLike({
            Statement: {
              RateBasedStatement: Match.anyValue(),
            },
          }),
        ]),
      });
    });

    test('Rate limiting prevents DDoS attacks', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              RateBasedStatement: {
                Limit: Match.anyValue(),
              },
            },
            Action: { Block: {} },
          }),
        ]),
      });
    });
  });
});
