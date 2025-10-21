import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Test environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = 'us-east-1'; // Default region for tests

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('Content bucket should be created with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-content-${region}-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Logging bucket should be created with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-logs-${region}-${environmentSuffix}`,
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
              ExpirationInDays: 365,
            },
          ],
        },
      });
    });

    test('Content bucket should have CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: [
            {
              AllowedMethods: ['GET', 'HEAD'],
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              MaxAge: 3000,
            },
          ],
        },
      });
    });

    test('Buckets should have proper removal policy for production', () => {
      // Check that buckets have Retain policy for production safety
      const resources = template.findResources('AWS::S3::Bucket');

      Object.values(resources).forEach(resource => {
        // In production, we want resources to be retained
        expect(resource.DeletionPolicy).toBe('Retain');
      });
    });

    test('Content bucket should have server access logging configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: {
          LogFilePrefix: 's3-access-logs/',
        },
      });
    });

    test('Logging bucket should have object ownership configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-logs-${region}-${environmentSuffix}`,
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerPreferred',
            },
          ],
        },
      });
    });
  });

  describe('CloudFront Distribution Configuration', () => {
    test('CloudFront distribution should be created with correct settings', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Comment: `News Platform Distribution - ${environmentSuffix}`,
          Enabled: true,
          DefaultRootObject: 'index.html',
          HttpVersion: 'http2and3',
        },
      });
    });

    test('CloudFront should have correct cache behavior', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
            AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          },
        },
      });
    });

    test('CloudFront should have error response configuration', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CustomErrorResponses: [
            {
              ErrorCode: 403,
              ResponseCode: 404,
              ResponsePagePath: '/404.html',
              ErrorCachingMinTTL: 300,
            },
            {
              ErrorCode: 404,
              ResponseCode: 404,
              ResponsePagePath: '/404.html',
              ErrorCachingMinTTL: 300,
            },
          ],
        },
      });
    });

    test('CloudFront should have logging enabled', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Logging: {
            IncludeCookies: false,
            Prefix: 'cloudfront-logs/',
          },
        },
      });
    });

    test('CloudFront distribution should not have custom domain when not configured', () => {
      const distributions = template.findResources(
        'AWS::CloudFront::Distribution'
      );
      Object.values(distributions).forEach(distribution => {
        const config = distribution.Properties.DistributionConfig;
        expect(config.Aliases).toBeUndefined();
      });
    });
  });

  describe('Origin Access Control Configuration', () => {
    test('Origin Access Control should be created', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: {
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'always',
          SigningProtocol: 'sigv4',
        },
      });
    });
  });

  describe('Cache and Origin Request Policies', () => {
    test('Custom cache policy should be created', () => {
      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          Name: `news-platform-cache-policy-${environmentSuffix}`,
          Comment: 'Cache policy for static article content',
          DefaultTTL: 3600,
          MinTTL: 0,
          MaxTTL: 86400,
        },
      });
    });

    test('Cache policy should have compression enabled', () => {
      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          ParametersInCacheKeyAndForwardedToOrigin: {
            EnableAcceptEncodingGzip: true,
            EnableAcceptEncodingBrotli: true,
          },
        },
      });
    });

    test('Origin request policy should be created', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginRequestPolicy', {
        OriginRequestPolicyConfig: {
          Name: `news-platform-origin-policy-${environmentSuffix}`,
          Comment: 'Origin request policy for S3 content',
        },
      });
    });
  });

  describe('CloudWatch Configuration', () => {
    test('CloudWatch dashboard should be created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `news-platform-${region}-${environmentSuffix}`,
      });
    });

    test('CloudWatch alarms should be created', () => {
      // Test for 4xx error rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-high-4xx-${region}-${environmentSuffix}`,
        AlarmDescription: 'Alert when 4xx error rate exceeds 5%',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
      });

      // Test for 5xx error rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-high-5xx-${region}-${environmentSuffix}`,
        AlarmDescription: 'Alert when 5xx error rate exceeds 1%',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });

      // Test for cache hit rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-low-cache-hit-${region}-${environmentSuffix}`,
        AlarmDescription: 'Alert when cache hit rate falls below 80%',
        Threshold: 80,
        ComparisonOperator: 'LessThanThreshold',
      });

      // Test for origin latency alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-high-latency-${region}-${environmentSuffix}`,
        AlarmDescription: 'Alert when origin latency exceeds 1000ms',
        Threshold: 1000,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('All alarms should have correct evaluation periods', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarm4xx = Object.values(alarms).find(
        a =>
          a.Properties.AlarmName ===
          `news-platform-high-4xx-${region}-${environmentSuffix}`
      );
      const alarm5xx = Object.values(alarms).find(
        a =>
          a.Properties.AlarmName ===
          `news-platform-high-5xx-${region}-${environmentSuffix}`
      );
      const alarmCache = Object.values(alarms).find(
        a =>
          a.Properties.AlarmName ===
          `news-platform-low-cache-hit-${region}-${environmentSuffix}`
      );
      const alarmLatency = Object.values(alarms).find(
        a =>
          a.Properties.AlarmName ===
          `news-platform-high-latency-${region}-${environmentSuffix}`
      );

      expect(alarm4xx.Properties.EvaluationPeriods).toBe(2);
      expect(alarm5xx.Properties.EvaluationPeriods).toBe(2);
      expect(alarmCache.Properties.EvaluationPeriods).toBe(3);
      expect(alarmLatency.Properties.EvaluationPeriods).toBe(2);
    });

    test('Alarms should treat missing data correctly', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach(alarm => {
        expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
      });
    });
  });

  describe('IAM Configuration', () => {
    test('Invalidation role should be created with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ]),
        },
        Description: `Role for CI/CD to invalidate CloudFront cache - ${environmentSuffix}`,
        MaxSessionDuration: 3600,
      });
    });

    test('Invalidation role should allow account principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                AWS: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      'arn:',
                      Match.objectLike({ Ref: 'AWS::Partition' }),
                      ':iam::',
                      Match.objectLike({ Ref: 'AWS::AccountId' }),
                      ':root',
                    ]),
                  ]),
                },
              },
            }),
          ]),
        },
      });
    });

    test('CloudFront invalidation policy should be attached to role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                'cloudfront:CreateInvalidation',
                'cloudfront:GetInvalidation',
                'cloudfront:ListInvalidations',
              ],
              Sid: 'AllowCloudFrontInvalidation',
            }),
          ]),
        },
      });
    });

    test('S3 access policy should be attached to invalidation role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:ListBucket',
                's3:DeleteObject',
              ],
              Sid: 'AllowS3ContentUpload',
            }),
          ]),
        },
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket policy should allow CloudFront access via OAC', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com',
              },
              Action: 's3:GetObject',
              Sid: 'AllowCloudFrontServicePrincipalReadOnly',
              Condition: {
                StringEquals: {
                  'AWS:SourceAccount': {
                    Ref: 'AWS::AccountId',
                  },
                },
              },
            }),
          ]),
        },
      });
    });

    test('CloudFront service principal should have access to logging bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com',
              },
              Action: 's3:PutObject',
              Sid: 'AllowCloudFrontServicePrincipal',
            }),
          ]),
        },
      });
    });

    test('S3 buckets should block all public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Required outputs should be defined', () => {
      template.hasOutput('ContentBucketName', {
        Description: 'S3 bucket for article content',
        Export: {
          Name: `ContentBucket-${environmentSuffix}`,
        },
      });

      template.hasOutput('LoggingBucketName', {
        Description: 'S3 bucket for logs',
        Export: {
          Name: `LoggingBucket-${environmentSuffix}`,
        },
      });

      template.hasOutput('CloudFrontDistributionId', {
        Description: 'CloudFront Distribution ID',
        Export: {
          Name: `DistributionId-${environmentSuffix}`,
        },
      });

      template.hasOutput('CloudFrontDistributionDomain', {
        Description: 'CloudFront Distribution Domain Name',
        Export: {
          Name: `DistributionDomain-${environmentSuffix}`,
        },
      });

      template.hasOutput('InvalidationRoleArn', {
        Description: 'IAM Role ARN for CI/CD invalidation tasks',
        Export: {
          Name: `InvalidationRole-${environmentSuffix}`,
        },
      });
    });

    test('CloudWatch dashboard URL should be generated correctly', () => {
      template.hasOutput('CloudWatchDashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });
    });

    test('Deployment instructions should be provided', () => {
      template.hasOutput('DeploymentInstructions', {
        Description: 'Deployment commands (JSON format)',
      });
    });

    test('CloudFront distribution URL output should exist', () => {
      template.hasOutput('CloudFrontDistributionUrl', {
        Description: 'CloudFront Distribution URL',
      });
    });

    test('Custom domain URL should not exist without certificate', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.CustomDomainUrl).toBeUndefined();
    });
  });

  describe('Resource Tagging', () => {
    test('Resources should have environment tags', () => {
      // Check that S3 buckets have appropriate tags
      const s3Resources = template.findResources('AWS::S3::Bucket');

      Object.values(s3Resources).forEach(resource => {
        expect(resource.Properties.Tags).toBeDefined();
        const environmentTag = resource.Properties.Tags.find(
          tag => tag.Key === 'Environment'
        );
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe(environmentSuffix);
      });
    });

    test('CloudFront distribution should have environment tag', () => {
      const distributions = template.findResources(
        'AWS::CloudFront::Distribution'
      );
      Object.values(distributions).forEach(distribution => {
        expect(distribution.Properties.Tags).toBeDefined();
        const environmentTag = distribution.Properties.Tags.find(
          tag => tag.Key === 'Environment'
        );
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe(environmentSuffix);
      });
    });

    test('IAM role should have environment and purpose tags', () => {
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach(role => {
        expect(role.Properties.Tags).toBeDefined();
        const environmentTag = role.Properties.Tags.find(
          tag => tag.Key === 'Environment'
        );
        const purposeTag = role.Properties.Tags.find(
          tag => tag.Key === 'Purpose'
        );
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe(environmentSuffix);
        expect(purposeTag).toBeDefined();
        expect(purposeTag.Value).toBe('CI/CD Invalidation');
      });
    });

    test('Alarms should have environment tags', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach(alarm => {
        expect(alarm.Properties.Tags).toBeDefined();
        const environmentTag = alarm.Properties.Tags.find(
          tag => tag.Key === 'Environment'
        );
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe(environmentSuffix);
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('Should create expected number of resources', () => {
      // Verify we have the right number of each resource type
      template.resourceCountIs('AWS::S3::Bucket', 2); // Content + Logging
      template.resourceCountIs('AWS::S3::BucketPolicy', 2); // One for each bucket
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
      template.resourceCountIs('AWS::CloudFront::CachePolicy', 1);
      template.resourceCountIs('AWS::CloudFront::OriginRequestPolicy', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4); // 4xx, 5xx, cache hit, latency
      template.resourceCountIs('AWS::IAM::Role', 1); // Invalidation role
    });

    test('Should not create Route53 resources without domain', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 0);
      template.resourceCountIs('AWS::Route53::RecordSet', 0);
    });
  });

  describe('Configuration with Custom Parameters', () => {
    test('Should handle custom domain configuration with certificate', () => {
      // Create a new stack with custom domain parameters
      const customApp = new cdk.App({
        context: {
          domainName: 'news.example.com',
          certificateArn:
            'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
        },
      });

      const customStack = new TapStack(customApp, 'CustomDomainTestStack', {
        environmentSuffix,
        env: { region, account: '123456789012' },
      });
      const customTemplate = Template.fromStack(customStack);

      // Should have additional outputs for custom domain
      customTemplate.hasOutput('CustomDomainUrl', {
        Description: 'Custom domain URL',
      });

      // CloudFront should have domain names configured
      customTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Aliases: ['news.example.com'],
        },
      });
    });

    test('Should handle custom cache TTL configuration', () => {
      const customApp = new cdk.App({
        context: {
          cacheTtlSeconds: 7200,
          maxTtlSeconds: 172800,
        },
      });

      const customStack = new TapStack(customApp, 'CustomCacheTestStack', {
        environmentSuffix,
        env: { region },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          DefaultTTL: 7200,
          MaxTTL: 172800,
        },
      });
    });

    test('Should support props-based configuration', () => {
      const propsApp = new cdk.App();
      const propsStack = new TapStack(propsApp, 'PropsConfigStack', {
        environmentSuffix: 'prod',
        cacheTtlSeconds: 10800,
        maxTtlSeconds: 259200,
        env: { region },
      });
      const propsTemplate = Template.fromStack(propsStack);

      propsTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-content-${region}-prod`,
      });
    });

    test('Should handle domain without certificate gracefully', () => {
      const domainOnlyApp = new cdk.App({
        context: {
          domainName: 'news.example.com',
        },
      });

      const domainOnlyStack = new TapStack(
        domainOnlyApp,
        'DomainOnlyTestStack',
        {
          environmentSuffix,
          env: { region },
        }
      );
      const domainOnlyTemplate = Template.fromStack(domainOnlyStack);

      // Should not have custom domain output without certificate
      const outputs = domainOnlyTemplate.toJSON().Outputs;
      expect(outputs.CustomDomainUrl).toBeUndefined();

      // Should not have aliases without certificate
      const distributions = domainOnlyTemplate.findResources(
        'AWS::CloudFront::Distribution'
      );
      Object.values(distributions).forEach(distribution => {
        const config = distribution.Properties.DistributionConfig;
        expect(config.Aliases).toBeUndefined();
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('Should handle empty environment suffix gracefully', () => {
      const emptyEnvApp = new cdk.App();
      const emptyEnvStack = new TapStack(emptyEnvApp, 'EmptyEnvTestStack', {
        env: { region },
      });
      const emptyEnvTemplate = Template.fromStack(emptyEnvStack);

      // Should still create resources with default 'dev' suffix
      emptyEnvTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-content-${region}-dev`,
      });
    });

    test('Should create resources even without custom domain', () => {
      // Default stack (no custom domain) should still work
      expect(() => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            Enabled: true,
          },
        });
      }).not.toThrow();
    });

    test('Should handle undefined props', () => {
      const undefinedPropsApp = new cdk.App();
      const undefinedPropsStack = new TapStack(
        undefinedPropsApp,
        'UndefinedPropsStack',
        {
          env: { region },
        }
      );

      expect(undefinedPropsStack).toBeDefined();
      const undefinedPropsTemplate = Template.fromStack(undefinedPropsStack);
      undefinedPropsTemplate.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('Should handle context overriding props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
          cacheTtlSeconds: 5400,
        },
      });

      const contextStack = new TapStack(contextApp, 'ContextOverrideStack', {
        environmentSuffix: 'props-env',
        cacheTtlSeconds: 1800,
        env: { region },
      });

      const contextTemplate = Template.fromStack(contextStack);

      // Props should take precedence over context
      contextTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-content-${region}-props-env`,
      });
    });
  });

  describe('Route 53 Configuration', () => {
    describe('Creating New Hosted Zone', () => {
      test('Should create new hosted zone when createHostedZone is true', () => {
        const hostedZoneApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
          },
        });

        const hostedZoneStack = new TapStack(
          hostedZoneApp,
          'HostedZoneTestStack',
          {
            environmentSuffix,
            env: { region, account: '123456789012' },
          }
        );
        const hostedZoneTemplate = Template.fromStack(hostedZoneStack);

        // Should create hosted zone
        hostedZoneTemplate.hasResourceProperties('AWS::Route53::HostedZone', {
          Name: 'news.example.com.',
          HostedZoneConfig: {
            Comment: `Hosted zone for news.example.com - ${environmentSuffix}`,
          },
        });

        // Verify resource count
        hostedZoneTemplate.resourceCountIs('AWS::Route53::HostedZone', 1);
      });

      test('Should add environment tag to created hosted zone', () => {
        const hostedZoneApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
          },
        });

        const hostedZoneStack = new TapStack(
          hostedZoneApp,
          'HostedZoneTagTestStack',
          {
            environmentSuffix: 'staging',
            env: { region, account: '123456789012' },
          }
        );
        const hostedZoneTemplate = Template.fromStack(hostedZoneStack);

        const hostedZones = hostedZoneTemplate.findResources(
          'AWS::Route53::HostedZone'
        );
        Object.values(hostedZones).forEach(hostedZone => {
          expect(hostedZone.Properties.HostedZoneTags).toBeDefined();
          const environmentTag = hostedZone.Properties.HostedZoneTags.find(
            tag => tag.Key === 'Environment'
          );
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toBe('staging');
        });
      });

      test('Should create HostedZoneId output when hosted zone is created', () => {
        const hostedZoneApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
          },
        });

        const hostedZoneStack = new TapStack(
          hostedZoneApp,
          'HostedZoneOutputTestStack',
          {
            environmentSuffix,
            env: { region, account: '123456789012' },
          }
        );
        const hostedZoneTemplate = Template.fromStack(hostedZoneStack);

        hostedZoneTemplate.hasOutput('HostedZoneId', {
          Description: 'Route 53 Hosted Zone ID',
        });
      });

      test('Should create NameServers output when hosted zone is created', () => {
        const hostedZoneApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
          },
        });

        const hostedZoneStack = new TapStack(
          hostedZoneApp,
          'NameServersTestStack',
          {
            environmentSuffix,
            env: { region, account: '123456789012' },
          }
        );
        const hostedZoneTemplate = Template.fromStack(hostedZoneStack);

        hostedZoneTemplate.hasOutput('NameServers', {
          Description: 'Name servers for the hosted zone',
        });

        // Verify the output uses Fn::Join
        const outputs = hostedZoneTemplate.toJSON().Outputs;
        expect(outputs.NameServers.Value).toHaveProperty('Fn::Join');
      });
    });

    describe('Importing Existing Hosted Zone', () => {
      test('Should attempt to import hosted zone when createHostedZone is false and certificateArn exists', () => {
        const importApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'false',
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
            // Mock the hosted zone lookup to avoid AWS API calls
            'hosted-zones:account=123456789012:domainName=news.example.com:region=us-east-1':
              {
                hostedZoneId: 'Z1234567890ABC',
                zoneName: 'news.example.com',
              },
          },
        });

        const importStack = new TapStack(
          importApp,
          'ImportHostedZoneTestStack',
          {
            environmentSuffix,
            env: { region: 'us-east-1', account: '123456789012' },
          }
        );

        // Should not throw error and should create the stack
        expect(importStack).toBeDefined();
        const importTemplate = Template.fromStack(importStack);

        // Should NOT create a new hosted zone (fromLookup imports existing one)
        importTemplate.resourceCountIs('AWS::Route53::HostedZone', 0);

        // Should still create A and AAAA records since hostedZone and certificate exist
        importTemplate.resourceCountIs('AWS::Route53::RecordSet', 2);
      });

      test('Should not output HostedZoneId when importing existing hosted zone', () => {
        const importApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'false',
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
            'hosted-zones:account=123456789012:domainName=news.example.com:region=us-east-1':
              {
                hostedZoneId: 'Z1234567890ABC',
                zoneName: 'news.example.com',
              },
          },
        });

        const importStack = new TapStack(importApp, 'NoOutputImportTestStack', {
          environmentSuffix,
          env: { region: 'us-east-1', account: '123456789012' },
        });
        const importTemplate = Template.fromStack(importStack);

        const outputs = importTemplate.toJSON().Outputs;
        // These outputs should not exist when importing (only when creating)
        expect(outputs.HostedZoneId).toBeUndefined();
        expect(outputs.NameServers).toBeUndefined();
      });
    });

    describe('DNS Record Creation', () => {
      test('Should create A and AAAA records when hosted zone and certificate both exist', () => {
        const recordsApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
          },
        });

        const recordsStack = new TapStack(recordsApp, 'RecordsTestStack', {
          environmentSuffix,
          env: { region, account: '123456789012' },
        });
        const recordsTemplate = Template.fromStack(recordsStack);

        // Should create A record
        recordsTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
          Name: 'news.example.com.',
          Type: 'A',
          AliasTarget: Match.objectLike({
            HostedZoneId: Match.anyValue(),
          }),
        });

        // Should create AAAA record
        recordsTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
          Name: 'news.example.com.',
          Type: 'AAAA',
          AliasTarget: Match.objectLike({
            HostedZoneId: Match.anyValue(),
          }),
        });

        // Verify both records are created
        recordsTemplate.resourceCountIs('AWS::Route53::RecordSet', 2);
      });

      test('Should NOT create DNS records when hosted zone exists but certificate does not', () => {
        const noCertApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
            // No certificateArn provided
          },
        });

        const noCertStack = new TapStack(noCertApp, 'NoCertTestStack', {
          environmentSuffix,
          env: { region, account: '123456789012' },
        });
        const noCertTemplate = Template.fromStack(noCertStack);

        // Should create hosted zone
        noCertTemplate.resourceCountIs('AWS::Route53::HostedZone', 1);

        // Should NOT create A/AAAA records without certificate
        noCertTemplate.resourceCountIs('AWS::Route53::RecordSet', 0);
      });

      test('Should create records pointing to CloudFront distribution', () => {
        const recordsApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
          },
        });

        const recordsStack = new TapStack(
          recordsApp,
          'CloudFrontTargetTestStack',
          {
            environmentSuffix,
            env: { region, account: '123456789012' },
          }
        );
        const recordsTemplate = Template.fromStack(recordsStack);

        // Both records should have AliasTarget configuration
        const recordSets = recordsTemplate.findResources(
          'AWS::Route53::RecordSet'
        );

        Object.values(recordSets).forEach(recordSet => {
          expect(recordSet.Properties.AliasTarget).toBeDefined();
          // Verify it references the CloudFront distribution
          expect(recordSet.Properties.AliasTarget.DNSName).toBeDefined();
          expect(recordSet.Properties.AliasTarget.HostedZoneId).toBeDefined();
        });
      });
    });

    describe('Edge Cases', () => {
      test('Should not create any Route53 resources when domainName is not provided', () => {
        // Default stack without domain
        template.resourceCountIs('AWS::Route53::HostedZone', 0);
        template.resourceCountIs('AWS::Route53::RecordSet', 0);

        const outputs = template.toJSON().Outputs;
        expect(outputs.HostedZoneId).toBeUndefined();
        expect(outputs.NameServers).toBeUndefined();
      });

      test('Should not create hosted zone when domain exists but createHostedZone is false and no certificateArn', () => {
        const noHostedZoneApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'false',
            // No certificateArn
          },
        });

        const noHostedZoneStack = new TapStack(
          noHostedZoneApp,
          'NoHostedZoneTestStack',
          {
            environmentSuffix,
            env: { region, account: '123456789012' },
          }
        );
        const noHostedZoneTemplate = Template.fromStack(noHostedZoneStack);

        // hostedZone stays undefined, so no resources created
        noHostedZoneTemplate.resourceCountIs('AWS::Route53::HostedZone', 0);
        noHostedZoneTemplate.resourceCountIs('AWS::Route53::RecordSet', 0);
      });

      test('Should handle empty string for createHostedZone as false', () => {
        const emptyStringApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: '', // Empty string should be falsy
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
            'hosted-zones:account=123456789012:domainName=news.example.com:region=us-east-1':
              {
                hostedZoneId: 'Z1234567890ABC',
                zoneName: 'news.example.com',
              },
          },
        });

        const emptyStringStack = new TapStack(
          emptyStringApp,
          'EmptyStringTestStack',
          {
            environmentSuffix,
            env: { region: 'us-east-1', account: '123456789012' },
          }
        );
        const emptyStringTemplate = Template.fromStack(emptyStringStack);

        // Should attempt import (else if branch) instead of creating new
        emptyStringTemplate.resourceCountIs('AWS::Route53::HostedZone', 0);
        // But should still create records
        emptyStringTemplate.resourceCountIs('AWS::Route53::RecordSet', 2);
      });
    });

    describe('Integration Scenarios', () => {
      test('Complete flow: new hosted zone with certificate and records', () => {
        const completeApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'true',
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
          },
        });

        const completeStack = new TapStack(
          completeApp,
          'CompleteFlowTestStack',
          {
            environmentSuffix: 'prod',
            env: { region, account: '123456789012' },
          }
        );
        const completeTemplate = Template.fromStack(completeStack);

        // Should have all components
        completeTemplate.resourceCountIs('AWS::Route53::HostedZone', 1);
        completeTemplate.resourceCountIs('AWS::Route53::RecordSet', 2);
        completeTemplate.hasOutput('HostedZoneId', {});
        completeTemplate.hasOutput('NameServers', {});
        completeTemplate.hasOutput('CustomDomainUrl', {
          Description: 'Custom domain URL',
        });
      });

      test('Import flow: existing hosted zone with certificate and records', () => {
        const importFlowApp = new cdk.App({
          context: {
            domainName: 'news.example.com',
            createHostedZone: 'false',
            certificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id',
            'hosted-zones:account=123456789012:domainName=news.example.com:region=us-east-1':
              {
                hostedZoneId: 'Z1234567890ABC',
                zoneName: 'news.example.com',
              },
          },
        });

        const importFlowStack = new TapStack(
          importFlowApp,
          'ImportFlowTestStack',
          {
            environmentSuffix: 'prod',
            env: { region: 'us-east-1', account: '123456789012' },
          }
        );
        const importFlowTemplate = Template.fromStack(importFlowStack);

        // Should NOT create new hosted zone
        importFlowTemplate.resourceCountIs('AWS::Route53::HostedZone', 0);
        // Should create records
        importFlowTemplate.resourceCountIs('AWS::Route53::RecordSet', 2);
        // Should have custom domain output
        importFlowTemplate.hasOutput('CustomDomainUrl', {});
        // Should NOT have hosted zone creation outputs
        const outputs = importFlowTemplate.toJSON().Outputs;
        expect(outputs.HostedZoneId).toBeUndefined();
        expect(outputs.NameServers).toBeUndefined();
      });
    });
  });
});
