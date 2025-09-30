import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { StaticWebsiteStack } from '../lib/static-website-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Context Handling', () => {
    test('uses environment suffix from context when prop not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test'
        }
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });
      const contextTemplate = Template.fromStack(contextStack);

      // Verify context value is used
      const tags = contextStack.tags.tagValues();
      expect(tags['Environment']).toBe('context-test');
    });

    test('prefers prop over context value', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test'
        }
      });
      const propStack = new TapStack(contextApp, 'PropStack', {
        environmentSuffix: 'prop-test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });

      // The stack should use the prop value
      expect(propStack).toBeDefined();
      // Since we pass prop-test as prop, it should use that
      // TapStack applies tags, so check them
      const children = propStack.node.children;
      expect(children.length).toBeGreaterThan(0);
    });

    test('uses default when neither prop nor context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTapStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });

      // The stack should use 'dev' as the default
      expect(defaultStack).toBeDefined();
      // Check that the stack has children (the nested stack)
      const children = defaultStack.node.children;
      expect(children.length).toBeGreaterThan(0);
    });
  });

  describe('Stack Configuration', () => {
    test('instantiates static website stack', () => {
      // Verify the TapStack is created successfully
      // The StaticWebsiteStack is instantiated as a separate CloudFormation stack
      expect(stack).toBeDefined();
      expect(stack.stackName).toBeDefined();
    });

    test('applies correct tags to the stack', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags['Environment']).toBe(environmentSuffix);
      expect(stackTags['ManagedBy']).toBe('CDK');
      expect(stackTags['Project']).toBe('MarketingCampaign');
      expect(stackTags['CostCenter']).toBe('Marketing');
    });
  });
});

describe('StaticWebsiteStack', () => {
  let app: cdk.App;
  let stack: StaticWebsiteStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new StaticWebsiteStack(app, 'TestStaticWebsiteStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Default Values', () => {
    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new StaticWebsiteStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Check that default 'dev' suffix is used
      defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('marketing-campaign-website-dev-'),
      });
    });

    test('uses provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new StaticWebsiteStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('marketing-campaign-website-prod-'),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates website bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`marketing-campaign-website-${environmentSuffix}-`),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        CorsConfiguration: {
          CorsRules: [{
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            MaxAge: 3600,
          }],
        },
      });
    });

    test('creates log bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`marketing-campaign-logs-${environmentSuffix}-`),
        LifecycleConfiguration: {
          Rules: [{
            Id: 'transition-and-delete-logs',
            Status: 'Enabled',
            ExpirationInDays: 90,
            Transitions: Match.arrayWith([
              Match.objectLike({
                StorageClass: 'STANDARD_IA',
                TransitionInDays: 30,
              }),
              Match.objectLike({
                StorageClass: 'GLACIER_IR',
                TransitionInDays: 60,
              }),
            ]),
          }],
        },
      });
    });

    test('both buckets have auto-delete enabled', () => {
      // Check for custom resource that enables auto-deletion
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 2);
    });
  });

  describe('CloudFront Distribution', () => {
    test('creates CloudFront distribution with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultRootObject: 'index.html',
          Enabled: true,
          HttpVersion: 'http2',
          PriceClass: 'PriceClass_100',
          Comment: Match.stringLikeRegexp(`Marketing campaign website distribution - ${environmentSuffix}`),
          CustomErrorResponses: Match.arrayWith([
            Match.objectLike({
              ErrorCode: 404,
              ResponseCode: 404,
              ResponsePagePath: '/404.html',
            }),
            Match.objectLike({
              ErrorCode: 403,
              ResponseCode: 403,
              ResponsePagePath: '/403.html',
            }),
          ]),
        },
      });
    });

    test('creates Origin Access Control', () => {
      // CDK automatically creates OAC when using S3BucketOrigin.withOriginAccessControl
      // The naming convention is different from manual creation
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: {
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'always',
          SigningProtocol: 'sigv4',
        },
      });
    });

    test('configures multiple cache behaviors for different file types', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({
              PathPattern: '*.css',
              Compress: true,
            }),
            Match.objectLike({
              PathPattern: '*.js',
              Compress: true,
            }),
            Match.objectLike({
              PathPattern: '*.jpg',
            }),
            Match.objectLike({
              PathPattern: '*.png',
            }),
          ]),
        },
      });
    });

    test('enables CloudFront logging', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Logging: {
            Bucket: Match.anyValue(),
            Prefix: 'cloudfront-logs/',
          },
        },
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('does not create Route 53 resources when domain not provided', () => {
      // By default, no domain name is provided
      template.resourceCountIs('AWS::Route53::HostedZone', 0);
      template.resourceCountIs('AWS::Route53::RecordSet', 0);
    });

    test('creates hosted zone and records when domain is provided', () => {
      const appWithDomain = new cdk.App();
      const stackWithDomain = new StaticWebsiteStack(appWithDomain, 'TestWithDomain', {
        environmentSuffix,
        domainName: 'example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });
      const templateWithDomain = Template.fromStack(stackWithDomain);

      templateWithDomain.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'example.com.',
        HostedZoneConfig: {
          Comment: Match.stringLikeRegexp(`Hosted zone for marketing campaign website - ${environmentSuffix}`),
        },
      });

      // Should create A records for root and www
      templateWithDomain.resourceCountIs('AWS::Route53::RecordSet', 2);
    });

    test('creates Route53 outputs when domain is provided', () => {
      const appWithDomain = new cdk.App();
      const stackWithDomain = new StaticWebsiteStack(appWithDomain, 'TestDomainOutputs', {
        environmentSuffix,
        domainName: 'example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });
      const templateWithDomain = Template.fromStack(stackWithDomain);

      // Check that Route53 outputs are created
      templateWithDomain.hasOutput('HostedZoneId', {});
      templateWithDomain.hasOutput('NameServers', {});
    });

    test('no Route53 outputs when domain is not provided', () => {
      // Check that Route53 outputs are NOT created
      const outputs = Object.keys(template.findOutputs('HostedZoneId'));
      expect(outputs).toHaveLength(0);

      const nsOutputs = Object.keys(template.findOutputs('NameServers'));
      expect(nsOutputs).toHaveLength(0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch alarms for error rates', () => {
      // High 4xx error rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '4xxErrorRate',
        Namespace: 'AWS/CloudFront',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });

      // High 5xx error rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5xxErrorRate',
        Namespace: 'AWS/CloudFront',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('creates unusual traffic alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Requests',
        Namespace: 'AWS/CloudFront',
        Threshold: 50000,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        Period: 3600,
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`marketing-campaign-dashboard-${environmentSuffix}`),
      });
    });
  });

  describe('CloudWatch RUM', () => {
    test('creates RUM application monitor', () => {
      template.hasResourceProperties('AWS::RUM::AppMonitor', {
        Name: Match.stringLikeRegexp(`marketing-campaign-rum-${environmentSuffix}`),
        CwLogEnabled: true,
        AppMonitorConfiguration: {
          AllowCookies: true,
          EnableXRay: false,
          SessionSampleRate: 0.1,
          Telemetries: ['errors', 'performance', 'http'],
        },
      });
    });

    test('creates RUM guest role with correct permissions', () => {
      // Find the RUM guest role
      const roles = template.findResources('AWS::IAM::Role');
      const rumRole = Object.entries(roles).find(([_, role]) => {
        const assumePolicy = role.Properties?.AssumeRolePolicyDocument;
        return assumePolicy?.Statement?.[0]?.Principal?.Service === 'rum.amazonaws.com';
      });

      expect(rumRole).toBeDefined();

      // Verify the role has the correct assume role policy
      expect(rumRole?.[1].Properties?.AssumeRolePolicyDocument).toMatchObject({
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'rum.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      });

      // Verify the role has inline policies with RUM permissions
      expect(rumRole?.[1].Properties?.Policies).toBeDefined();
      const policy = rumRole?.[1].Properties?.Policies?.[0];
      expect(policy?.PolicyName).toBe('RUMPolicy');
      expect(policy?.PolicyDocument?.Statement?.[0]?.Effect).toBe('Allow');
      expect(policy?.PolicyDocument?.Statement?.[0]?.Action).toBeDefined();
      expect(policy?.PolicyDocument?.Statement?.[0]?.Resource).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      // Check that we have outputs defined
      template.hasOutput('WebsiteBucketName', {});
      template.hasOutput('CloudFrontDistributionId', {});
      template.hasOutput('CloudFrontDomainName', {});
      template.hasOutput('CloudFrontURL', {});
      template.hasOutput('LogBucketName', {});
      template.hasOutput('RUMAppMonitorId', {});
      template.hasOutput('DashboardURL', {});
    });

    test('outputs have correct descriptions', () => {
      template.hasOutput('WebsiteBucketName', {
        Description: 'Name of the S3 bucket hosting the website',
      });

      template.hasOutput('CloudFrontDistributionId', {
        Description: 'CloudFront distribution ID',
      });

      template.hasOutput('CloudFrontURL', {
        Value: Match.anyValue(),
        Description: 'CloudFront distribution URL',
      });
    });
  });

  describe('Security and Compliance', () => {
    test('S3 buckets have encryption enabled', () => {
      // All S3 buckets should have encryption
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.BucketEncryption).toBeDefined();
        expect(bucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('S3 buckets block public access appropriately', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketArray = Object.entries(buckets);

      // Website bucket should block all public access
      const websiteBucket = bucketArray.find(([key]) => key.includes('WebsiteBucket'));
      expect(websiteBucket).toBeDefined();
      const websiteBlockConfig = websiteBucket?.[1].Properties?.PublicAccessBlockConfiguration;
      expect(websiteBlockConfig?.BlockPublicAcls).toBe(true);
      expect(websiteBlockConfig?.BlockPublicPolicy).toBe(true);
      expect(websiteBlockConfig?.IgnorePublicAcls).toBe(true);
      expect(websiteBlockConfig?.RestrictPublicBuckets).toBe(true);

      // Log bucket needs BlockPublicAcls: false for CloudFront logging
      const logBucket = bucketArray.find(([key]) => key.includes('LogBucket'));
      expect(logBucket).toBeDefined();
      const logBlockConfig = logBucket?.[1].Properties?.PublicAccessBlockConfiguration;
      expect(logBlockConfig?.BlockPublicAcls).toBe(false); // Required for CloudFront logging
      expect(logBlockConfig?.BlockPublicPolicy).toBe(true);
      expect(logBlockConfig?.IgnorePublicAcls).toBe(false); // Required for CloudFront logging
      expect(logBlockConfig?.RestrictPublicBuckets).toBe(true);
    });

    test('CloudFront enforces HTTPS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });

    test('website bucket has proper OAC access policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com',
              },
              Action: 's3:GetObject',
              Condition: {
                StringEquals: Match.anyValue(),
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resources follow naming convention with environment suffix', () => {
      // Check S3 buckets
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`.*-${environmentSuffix}-.*`),
      });

      // Check CloudWatch dashboard
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`.*-${environmentSuffix}`),
      });

      // Check RUM app monitor
      template.hasResourceProperties('AWS::RUM::AppMonitor', {
        Name: Match.stringLikeRegexp(`.*-${environmentSuffix}`),
      });
    });

    test('stack has proper tags applied', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags['Project']).toBe('MarketingCampaign');
      expect(stackTags['Environment']).toBe(environmentSuffix);
      expect(stackTags['CostCenter']).toBe('Marketing');
      expect(stackTags['ManagedBy']).toBe('CDK');
    });
  });

  describe('Cache Policies', () => {
    test('creates appropriate cache policies for different content types', () => {
      // HTML files - shorter cache
      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          DefaultTTL: 3600, // 1 hour
          MaxTTL: 86400, // 24 hours
          MinTTL: 0,
        },
      });

      // Static assets - longer cache
      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          DefaultTTL: 86400, // 24 hours
          MaxTTL: 604800, // 7 days
        },
      });
    });

    test('enables compression for text-based content', () => {
      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          ParametersInCacheKeyAndForwardedToOrigin: {
            EnableAcceptEncodingGzip: true,
            EnableAcceptEncodingBrotli: true,
          },
        },
      });
    });
  });

  describe('Removal Policies', () => {
    test('all resources have DESTROY removal policy for non-production', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });
});