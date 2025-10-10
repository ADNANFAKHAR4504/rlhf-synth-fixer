import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { StaticWebsiteStack } from '../lib/static-website-stack';
import { TapStack } from '../lib/tap-stack';
import { WafStack } from '../lib/waf-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Main Stack', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test123',
      });
      template = Template.fromStack(stack);
    });

    test('creates nested stacks', () => {
      // Check that nested stacks are created
      template.resourceCountIs('AWS::CloudFormation::Stack', 1);
    });

    test('creates required outputs', () => {
      // Check for main stack outputs
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('EnvironmentSuffix');
      expect(outputs).toHaveProperty('Region');
      expect(outputs).toHaveProperty('StackName');
    });

    test('uses correct environment suffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Value: 'test123',
        Description: 'Environment suffix used for this deployment',
        Export: {
          Name: 'environment-suffix-test123'
        }
      });
    });

    test('exports stack name correctly', () => {
      template.hasOutput('StackName', {
        Value: 'TestStack',
        Description: 'Main stack name'
      });
    });
  });

  describe('Different Environments', () => {
    test('handles default environment suffix', () => {
      stack = new TapStack(app, 'DefaultStack', {});
      template = Template.fromStack(stack);

      // Should have environment output
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('EnvironmentSuffix');
    });

    test('handles custom environment suffix', () => {
      stack = new TapStack(app, 'CustomStack', {
        environmentSuffix: 'prod-v2'
      });
      template = Template.fromStack(stack);

      template.hasOutput('EnvironmentSuffix', {
        Value: 'prod-v2',
        Export: {
          Name: 'environment-suffix-prod-v2'
        }
      });
    });

    test('uses context environment suffix when props is undefined', () => {
      // Set context value and create stack without environmentSuffix prop
      app.node.setContext('environmentSuffix', 'context-env');
      stack = new TapStack(app, 'ContextStack', {});
      template = Template.fromStack(stack);

      template.hasOutput('EnvironmentSuffix', {
        Value: 'context-env',
        Export: {
          Name: 'environment-suffix-context-env'
        }
      });
    });

    test('uses environment variable for SKIP_CERTIFICATE', () => {
      // Mock environment variable
      const originalEnv = process.env.SKIP_CERTIFICATE;
      process.env.SKIP_CERTIFICATE = 'false';

      try {
        stack = new TapStack(app, 'EnvVarStack', {
          environmentSuffix: 'env-test'
        });
        template = Template.fromStack(stack);

        // Should still create the stack successfully
        const outputs = template.findOutputs('*');
        expect(outputs).toHaveProperty('EnvironmentSuffix');
      } finally {
        // Restore original environment variable
        if (originalEnv !== undefined) {
          process.env.SKIP_CERTIFICATE = originalEnv;
        } else {
          delete process.env.SKIP_CERTIFICATE;
        }
      }
    });
  });

  describe('Nested Stack References', () => {
    test('creates StaticWebsiteStack nested stack', () => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test456',
        env: { region: 'us-west-1' }
      });
      template = Template.fromStack(stack);

      // Check for nested stack creation
      template.resourceCountIs('AWS::CloudFormation::Stack', 1);
    });

    test('passes environment suffix to nested stacks', () => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test789'
      });
      template = Template.fromStack(stack);

      // Should have outputs that reference nested stack outputs
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(3);
    });
  });

  describe('WAF Integration', () => {
    test('creates WAF stack when in us-east-1', () => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test-waf',
        env: { region: 'us-east-1', account: '123456789012' }
      });
      template = Template.fromStack(stack);

      // Should have 2 nested stacks (WAF and StaticWebsite)
      template.resourceCountIs('AWS::CloudFormation::Stack', 2);

      // Should have WAF output
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('WafWebAclArn');
    });

    test('does not create WAF stack when not in us-east-1', () => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test-nowaf',
        env: { region: 'us-west-2', account: '123456789012' }
      });
      template = Template.fromStack(stack);

      // Should only have 1 nested stack (StaticWebsite)
      template.resourceCountIs('AWS::CloudFormation::Stack', 1);

      // Should not have WAF output
      const outputs = template.findOutputs('*');
      expect(outputs).not.toHaveProperty('WafWebAclArn');
    });

    test('passes WAF ARN to StaticWebsiteStack when created', () => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test-waf-integration',
        env: { region: 'us-east-1', account: '123456789012' }
      });
      template = Template.fromStack(stack);

      // Verify WAF output is created
      template.hasOutput('WafWebAclArn', {
        Description: 'WAF Web ACL ARN'
      });
    });
  });
});

describe('StaticWebsiteStack', () => {
  let stack: cdk.Stack;
  let websiteStack: StaticWebsiteStack;
  let template: Template;

  beforeEach(() => {
    stack = new cdk.Stack(undefined, 'ParentStack', {
      env: { account: '123456789012', region: 'us-west-1' }
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      websiteStack = new StaticWebsiteStack(stack, 'WebsiteStack', {
        environmentSuffix: 'test',
        domainName: 'example.com',
        subDomain: 'portfolio'
      });
      template = Template.fromStack(websiteStack);
    });

    test('creates website S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('pf-web-test-.*-us-west-1-[a-z0-9]{6}'),
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('creates logs S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('pf-logs-test-.*-us-west-1-[a-z0-9]{6}'),
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerPreferred'
            }
          ]
        }
      });
    });

    test('configures lifecycle rules for logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('pf-logs-test-.*-us-west-1-[a-z0-9]{6}'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldCloudFrontLogs',
              Status: 'Enabled',
              ExpirationInDays: 90
            })
          ])
        }
      });
    });

    test('sets correct removal policy', () => {
      // Both buckets should have delete policies
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('bucket names include unique stack ID hash for collision avoidance', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map(bucket => bucket.Properties.BucketName);

      // Both buckets should have names that include the stack ID hash
      bucketNames.forEach(bucketName => {
        // Should match pattern: prefix-envSuffix-account-region-hash
        expect(bucketName).toMatch(/^pf-(web|logs)-test-.*-us-west-1-[a-z0-9]{6}$/);
      });

      // Verify we have both website and logs buckets
      const websiteBucket = bucketNames.find(name => name.includes('web'));
      const logsBucket = bucketNames.find(name => name.includes('logs'));
      expect(websiteBucket).toBeDefined();
      expect(logsBucket).toBeDefined();

      // Both buckets should have the same hash suffix (from same stack)
      const websiteHash = websiteBucket?.split('-').pop();
      const logsHash = logsBucket?.split('-').pop();
      expect(websiteHash).toBe(logsHash);
    });
  });

  describe('CloudFront Distribution', () => {
    beforeEach(() => {
      websiteStack = new StaticWebsiteStack(stack, 'WebsiteStack', {
        environmentSuffix: 'test',
        domainName: 'example.com',
        subDomain: 'portfolio'
      });
      template = Template.fromStack(websiteStack);
    });

    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Comment: 'Portfolio distribution for test',
          DefaultRootObject: 'index.html',
          Enabled: true,
          HttpVersion: 'http2',
          IPV6Enabled: true
        })
      });
    });

    test('configures HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true
          })
        })
      });
    });

    test('configures error responses', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          CustomErrorResponses: Match.arrayWith([
            Match.objectLike({
              ErrorCode: 404,
              ResponseCode: 404,
              ResponsePagePath: '/error.html',
              ErrorCachingMinTTL: 300
            }),
            Match.objectLike({
              ErrorCode: 403,
              ResponseCode: 403,
              ResponsePagePath: '/error.html',
              ErrorCachingMinTTL: 300
            })
          ])
        })
      });
    });

    test('enables CloudFront logging', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Logging: Match.objectLike({
            Bucket: Match.anyValue(),
            Prefix: 'cloudfront-logs/'
          })
        })
      });
    });

    test('configures TLS version', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          ViewerCertificate: Match.objectLike({
            MinimumProtocolVersion: 'TLSv1.2_2021'
          })
        })
      });
    });
  });

  describe('Route 53', () => {
    beforeEach(() => {
      websiteStack = new StaticWebsiteStack(stack, 'WebsiteStack', {
        environmentSuffix: 'test',
        domainName: 'example.com',
        subDomain: 'portfolio'
      });
      template = Template.fromStack(websiteStack);
    });

    test('creates hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'portfolio-test.example.com.'
      });
    });

    test('creates A record for CloudFront', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'portfolio-test.portfolio-test.example.com.',
        Type: 'A',
        AliasTarget: Match.objectLike({
          DNSName: Match.anyValue(),
          HostedZoneId: Match.anyValue()
        })
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    beforeEach(() => {
      websiteStack = new StaticWebsiteStack(stack, 'WebsiteStack', {
        environmentSuffix: 'test',
        domainName: 'example.com',
        subDomain: 'portfolio'
      });
      template = Template.fromStack(websiteStack);
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'portfolio-website-dashboard-test'
      });
    });

    test('creates CloudWatch alarm for error rate', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'portfolio-high-error-rate-test',
        AlarmDescription: 'High 4xx error rate for test',
        EvaluationPeriods: 2,
        Threshold: 5,
        TreatMissingData: 'notBreaching'
      });
    });
  });

  describe('Origin Access Control', () => {
    beforeEach(() => {
      websiteStack = new StaticWebsiteStack(stack, 'WebsiteStack', {
        environmentSuffix: 'test',
        domainName: 'example.com',
        subDomain: 'portfolio'
      });
      template = Template.fromStack(websiteStack);
    });

    test('creates S3 Origin Access Control', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: Match.objectLike({
          Name: Match.anyValue(),
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'always',
          SigningProtocol: 'sigv4'
        })
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      websiteStack = new StaticWebsiteStack(stack, 'WebsiteStack', {
        environmentSuffix: 'test',
        domainName: 'example.com',
        subDomain: 'portfolio'
      });
      template = Template.fromStack(websiteStack);
    });

    test('exports all required outputs', () => {
      const outputs = template.findOutputs('*');

      expect(outputs).toHaveProperty('WebsiteURL');
      expect(outputs).toHaveProperty('BucketName');
      expect(outputs).toHaveProperty('LogsBucketName');
      expect(outputs).toHaveProperty('DistributionId');
      expect(outputs).toHaveProperty('DistributionDomainName');
      expect(outputs).toHaveProperty('HostedZoneId');
      expect(outputs).toHaveProperty('HostedZoneName');
      expect(outputs).toHaveProperty('DashboardUrl');
    });

    test('outputs have correct export names', () => {
      template.hasOutput('WebsiteURL', {
        Export: {
          Name: 'website-url-test'
        }
      });

      template.hasOutput('BucketName', {
        Export: {
          Name: 'bucket-name-test'
        }
      });
    });
  });
});

describe('WafStack', () => {
  let stack: cdk.Stack;
  let wafStack: WafStack;
  let template: Template;

  beforeEach(() => {
    stack = new cdk.Stack(undefined, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    wafStack = new WafStack(stack, 'WafStack', {
      environmentSuffix: 'test'
    });
    template = Template.fromStack(wafStack);
  });

  describe('WAF Web ACL', () => {
    test('creates WAF Web ACL for CloudFront', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'portfolio-waf-test',
        Scope: 'CLOUDFRONT',
        DefaultAction: {
          Allow: {}
        }
      });
    });

    test('configures rate limit rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
            Action: {
              Block: {}
            },
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP'
              }
            },
            VisibilityConfig: Match.objectLike({
              SampledRequestsEnabled: true,
              CloudWatchMetricsEnabled: true,
              MetricName: 'RateLimitRule-test'
            })
          })
        ])
      });
    });

    test('includes AWS managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'CommonRuleSet',
            Priority: 2,
            OverrideAction: {
              None: {}
            },
            Statement: {
              ManagedRuleGroupStatement: {
                Name: 'AWSManagedRulesCommonRuleSet',
                VendorName: 'AWS'
              }
            }
          }),
          Match.objectLike({
            Name: 'KnownBadInputsRuleSet',
            Priority: 3,
            OverrideAction: {
              None: {}
            },
            Statement: {
              ManagedRuleGroupStatement: {
                Name: 'AWSManagedRulesKnownBadInputsRuleSet',
                VendorName: 'AWS'
              }
            }
          })
        ])
      });
    });

    test('enables CloudWatch metrics', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        VisibilityConfig: {
          SampledRequestsEnabled: true,
          CloudWatchMetricsEnabled: true,
          MetricName: 'WebACL-test'
        }
      });
    });
  });

  describe('WAF Stack Outputs', () => {
    test('exports Web ACL ARN', () => {
      template.hasOutput('WebAclArn', {
        Description: 'WAF Web ACL ARN',
        Export: {
          Name: 'waf-webacl-arn-test'
        }
      });
    });
  });
});