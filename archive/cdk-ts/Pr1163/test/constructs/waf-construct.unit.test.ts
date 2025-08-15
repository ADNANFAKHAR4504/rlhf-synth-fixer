import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { WafConstruct } from '../../lib/constructs/waf-construct';

describe('WafConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  describe('Basic WAF Creation', () => {
    beforeEach(() => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create WAF Web ACL with correct configuration', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Scope: 'CLOUDFRONT',
          Name: 'WebACL-test',
          Description: 'WAF Web ACL for test environment',
          DefaultAction: { Allow: {} },
          VisibilityConfig: {
            SampledRequestsEnabled: true,
            CloudWatchMetricsEnabled: true,
            MetricName: 'WebACL-test',
          },
        },
      });
    });

    test('should tag WAF resources correctly', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Component',
              Value: 'Security',
            },
            {
              Key: 'Environment',
              Value: 'test',
            },
            {
              Key: 'Name',
              Value: 'WebACL-test',
            },
          ]),
        },
      });
    });
  });

  describe('SQL Injection Protection Rules', () => {
    beforeEach(() => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should include AWS Managed Rules Common Rule Set', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Name: 'AWSManagedRulesCommonRuleSet',
              Priority: 1,
              OverrideAction: { None: {} },
              Statement: {
                ManagedRuleGroupStatement: {
                  VendorName: 'AWS',
                  Name: 'AWSManagedRulesCommonRuleSet',
                },
              },
              VisibilityConfig: {
                SampledRequestsEnabled: true,
                CloudWatchMetricsEnabled: true,
                MetricName: 'CommonRuleSetMetric',
              },
            }),
          ]),
        },
      });
    });

    test('should include AWS Managed Rules SQL Injection Rule Set', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Name: 'AWSManagedRulesSQLiRuleSet',
              Priority: 2,
              OverrideAction: { None: {} },
              Statement: {
                ManagedRuleGroupStatement: {
                  VendorName: 'AWS',
                  Name: 'AWSManagedRulesSQLiRuleSet',
                },
              },
              VisibilityConfig: {
                SampledRequestsEnabled: true,
                CloudWatchMetricsEnabled: true,
                MetricName: 'SQLiRuleSetMetric',
              },
            }),
          ]),
        },
      });
    });

    test('should include AWS Managed Rules Known Bad Inputs Rule Set', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Name: 'AWSManagedRulesKnownBadInputsRuleSet',
              Priority: 3,
              OverrideAction: { None: {} },
              Statement: {
                ManagedRuleGroupStatement: {
                  VendorName: 'AWS',
                  Name: 'AWSManagedRulesKnownBadInputsRuleSet',
                },
              },
              VisibilityConfig: {
                SampledRequestsEnabled: true,
                CloudWatchMetricsEnabled: true,
                MetricName: 'KnownBadInputsMetric',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('XSS Protection Rules', () => {
    beforeEach(() => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should include custom XSS protection rule', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Name: 'XSSProtectionRule',
              Priority: 5,
              Action: { Block: {} },
              Statement: {
                XssMatchStatement: {
                  FieldToMatch: {
                    AllQueryArguments: {},
                  },
                  TextTransformations: Match.arrayWith([
                    {
                      Priority: 1,
                      Type: 'URL_DECODE',
                    },
                    {
                      Priority: 2,
                      Type: 'HTML_ENTITY_DECODE',
                    },
                  ]),
                },
              },
              VisibilityConfig: {
                SampledRequestsEnabled: true,
                CloudWatchMetricsEnabled: true,
                MetricName: 'XSSProtectionMetric',
              },
            }),
          ]),
        },
      });
    });

    test('should have correct XSS rule configuration', () => {
      const webAcl = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(webAcl)[0] as any;
      
      const xssRule = wafResource.Properties.Rules.find((rule: any) => 
        rule.Name === 'XSSProtectionRule'
      );
      
      expect(xssRule).toBeDefined();
      expect(xssRule.Action.Block).toBeDefined();
      expect(xssRule.Statement.XssMatchStatement.FieldToMatch.AllQueryArguments).toBeDefined();
      expect(xssRule.Statement.XssMatchStatement.TextTransformations).toHaveLength(2);
    });
  });

  describe('Rate Limiting Rules', () => {
    beforeEach(() => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should include rate limiting rule', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Name: 'RateLimitRule',
              Priority: 4,
              Action: { Block: {} },
              Statement: {
                RateBasedStatement: {
                  Limit: 2000,
                  AggregateKeyType: 'IP',
                },
              },
              VisibilityConfig: {
                SampledRequestsEnabled: true,
                CloudWatchMetricsEnabled: true,
                MetricName: 'RateLimitMetric',
              },
            }),
          ]),
        },
      });
    });

    test('should have appropriate rate limit threshold', () => {
      const webAcl = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(webAcl)[0] as any;
      
      const rateLimitRule = wafResource.Properties.Rules.find((rule: any) => 
        rule.Name === 'RateLimitRule'
      );
      
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rateLimitRule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
    });
  });

  describe('Rule Priority and Order', () => {
    beforeEach(() => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should have rules in correct priority order', () => {
      const webAcl = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(webAcl)[0] as any;
      
      const rules = wafResource.Properties.Rules;
      expect(rules).toHaveLength(5);
      
      // Check priority order
      const priorities = rules.map((rule: any) => rule.Priority);
      expect(priorities).toEqual([1, 2, 3, 4, 5]);
    });

    test('should have unique rule names', () => {
      const webAcl = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(webAcl)[0] as any;
      
      const ruleNames = wafResource.Properties.Rules.map((rule: any) => rule.Name);
      const uniqueNames = new Set(ruleNames);
      expect(uniqueNames.size).toBe(ruleNames.length);
    });
  });

  describe('Visibility Configuration', () => {
    beforeEach(() => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should enable sampling and metrics for all rules', () => {
      const webAcl = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(webAcl)[0] as any;
      
      wafResource.Properties.Rules.forEach((rule: any) => {
        expect(rule.VisibilityConfig.SampledRequestsEnabled).toBe(true);
        expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
        expect(rule.VisibilityConfig.MetricName).toBeDefined();
      });
    });

    test('should have main Web ACL visibility enabled', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          VisibilityConfig: {
            SampledRequestsEnabled: true,
            CloudWatchMetricsEnabled: true,
            MetricName: 'WebACL-test',
          },
        },
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should handle different environment names', () => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'prod',
      });
      template = Template.fromStack(stack);

      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Name: 'WebACL-prod',
          Description: 'WAF Web ACL for prod environment',
          VisibilityConfig: {
            MetricName: 'WebACL-prod',
          },
        },
      });
    });
  });

  describe('Security Rule Validation', () => {
    beforeEach(() => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should have blocking actions for security-critical rules', () => {
      const webAcl = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(webAcl)[0] as any;
      
      const blockingRules = wafResource.Properties.Rules.filter((rule: any) => 
        rule.Action && rule.Action.Block
      );
      
      // Rate limiting and XSS rules should block
      expect(blockingRules.length).toBeGreaterThanOrEqual(2);
      
      const blockingRuleNames = blockingRules.map((rule: any) => rule.Name);
      expect(blockingRuleNames).toContain('RateLimitRule');
      expect(blockingRuleNames).toContain('XSSProtectionRule');
    });

    test('should have managed rule sets with proper override actions', () => {
      const webAcl = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(webAcl)[0] as any;
      
      const managedRules = wafResource.Properties.Rules.filter((rule: any) => 
        rule.Statement.ManagedRuleGroupStatement
      );
      
      managedRules.forEach((rule: any) => {
        expect(rule.OverrideAction.None).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should expose webAcl property', () => {
      const wafConstruct = new WafConstruct(stack, 'TestWafConstruct', {
        environment: 'test',
      });
      expect(wafConstruct.webAcl).toBeDefined();
    });
  });
});
