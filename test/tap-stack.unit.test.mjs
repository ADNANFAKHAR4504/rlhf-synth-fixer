import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Test environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('Content bucket should be created with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-content-${environmentSuffix}-us-east-1`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('Logging bucket should be created with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `news-platform-logs-${environmentSuffix}-us-east-1`,
        LifecycleConfiguration: {
          Rules: [{
            Id: 'TransitionToIA',
            Status: 'Enabled',
            Transitions: [
              {
                StorageClass: 'STANDARD_IA',
                TransitionInDays: 30
              },
              {
                StorageClass: 'GLACIER',
                TransitionInDays: 90
              }
            ],
            ExpirationInDays: 365
          }]
        }
      });
    });

    test('Content bucket should have CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: [{
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            AllowedHeaders: ['*'],
            MaxAge: 3000
          }]
        }
      });
    });

    test('Buckets should have proper removal policy for testing', () => {
      // Check that buckets can be destroyed (should not have Retain policy)
      const resources = template.findResources('AWS::S3::Bucket');
      
      Object.values(resources).forEach(resource => {
        // In testing, we want resources to be destroyable
        expect(resource.DeletionPolicy).not.toBe('Retain');
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
          PriceClass: 'PriceClass_100'
        }
      });
    });

    test('CloudFront should have correct cache behavior', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
            AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            CachedMethods: ['GET', 'HEAD', 'OPTIONS']
          }
        }
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
              ErrorCachingMinTTL: 300
            },
            {
              ErrorCode: 404,
              ResponseCode: 404,
              ResponsePagePath: '/404.html',
              ErrorCachingMinTTL: 300
            }
          ]
        }
      });
    });

    test('CloudFront should have logging enabled', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Logging: {
            IncludeCookies: false,
            Prefix: 'cloudfront-logs/'
          }
        }
      });
    });
  });

  describe('Origin Access Control Configuration', () => {
    test('Origin Access Control should be created', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: {
          OriginAccessControlOriginType: 's3',
          Signing: 'sigv4'
        }
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
          MaxTTL: 86400
        }
      });
    });

    test('Origin request policy should be created', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginRequestPolicy', {
        OriginRequestPolicyConfig: {
          Name: `news-platform-origin-policy-${environmentSuffix}`,
          Comment: 'Origin request policy for S3 content'
        }
      });
    });
  });

  describe('CloudWatch Configuration', () => {
    test('CloudWatch dashboard should be created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `news-platform-${environmentSuffix}-us-east-1`
      });
    });

    test('CloudWatch alarms should be created', () => {
      // Test for 4xx error rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-high-4xx-${environmentSuffix}-us-east-1`,
        AlarmDescription: 'Alert when 4xx error rate exceeds 5%',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      // Test for 5xx error rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-high-5xx-${environmentSuffix}-us-east-1`,
        AlarmDescription: 'Alert when 5xx error rate exceeds 1%',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      // Test for cache hit rate alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-low-cache-hit-${environmentSuffix}-us-east-1`,
        AlarmDescription: 'Alert when cache hit rate falls below 80%',
        Threshold: 80,
        ComparisonOperator: 'LessThanThreshold'
      });

      // Test for origin latency alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-platform-high-latency-${environmentSuffix}-us-east-1`,
        AlarmDescription: 'Alert when origin latency exceeds 1000ms',
        Threshold: 1000,
        ComparisonOperator: 'GreaterThanThreshold'
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
                Service: 'codebuild.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            },
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ])
        },
        Description: `Role for CI/CD to invalidate CloudFront cache - ${environmentSuffix}`,
        MaxSessionDuration: 3600
      });
    });

    test('CloudFront invalidation policy should be attached to role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'cloudfront:CreateInvalidation',
                'cloudfront:GetInvalidation',
                'cloudfront:ListInvalidations'
              ]
            }
          ])
        }
      });
    });

    test('S3 access policy should be attached to invalidation role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:ListBucket',
                's3:DeleteObject'
              ]
            }
          ])
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket policy should allow CloudFront access via OAC', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com'
              },
              Action: 's3:GetObject',
              Condition: {
                StringEquals: {
                  'AWS:SourceAccount': {
                    Ref: 'AWS::AccountId'
                  }
                }
              }
            }
          ])
        }
      });
    });

    test('CloudFront service principal should have access to logging bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com'
              },
              Action: 's3:PutObject'
            }
          ])
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Required outputs should be defined', () => {
      template.hasOutput('ContentBucketName', {
        Description: 'S3 bucket for article content',
        Export: {
          Name: `ContentBucket-${environmentSuffix}`
        }
      });

      template.hasOutput('LoggingBucketName', {
        Description: 'S3 bucket for logs',
        Export: {
          Name: `LoggingBucket-${environmentSuffix}`
        }
      });

      template.hasOutput('CloudFrontDistributionId', {
        Description: 'CloudFront Distribution ID',
        Export: {
          Name: `DistributionId-${environmentSuffix}`
        }
      });

      template.hasOutput('CloudFrontDistributionDomain', {
        Description: 'CloudFront Distribution Domain Name',
        Export: {
          Name: `DistributionDomain-${environmentSuffix}`
        }
      });

      template.hasOutput('InvalidationRoleArn', {
        Description: 'IAM Role ARN for CI/CD invalidation tasks',
        Export: {
          Name: `InvalidationRole-${environmentSuffix}`
        }
      });
    });

    test('CloudWatch dashboard URL should be generated correctly', () => {
      template.hasOutput('CloudWatchDashboardUrl', {
        Description: 'CloudWatch Dashboard URL'
      });
    });

    test('Deployment instructions should be provided', () => {
      template.hasOutput('DeploymentInstructions', {
        Description: 'Deployment commands (JSON format)'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('Resources should have environment tags', () => {
      // Check that S3 buckets have appropriate tags
      const s3Resources = template.findResources('AWS::S3::Bucket');
      
      Object.values(s3Resources).forEach(resource => {
        expect(resource.Properties.Tags).toBeDefined();
        const environmentTag = resource.Properties.Tags.find(tag => tag.Key === 'Environment');
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
  });

  describe('Configuration with Custom Parameters', () => {
    test('Should handle custom domain configuration', () => {
      // Create a new stack with custom domain parameters
      const customApp = new cdk.App({
        context: {
          domainName: 'news.example.com',
          certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test-cert-id'
        }
      });
      
      const customStack = new TapStack(customApp, 'CustomDomainTestStack', { environmentSuffix });
      const customTemplate = Template.fromStack(customStack);
      
      // Should have additional outputs for custom domain
      customTemplate.hasOutput('CustomDomainUrl', {
        Description: 'Custom domain URL'
      });
    });

    test('Should handle custom cache TTL configuration', () => {
      const customApp = new cdk.App({
        context: {
          cacheTtlSeconds: 7200,
          maxTtlSeconds: 172800
        }
      });
      
      const customStack = new TapStack(customApp, 'CustomCacheTestStack', { environmentSuffix });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          DefaultTTL: 7200,
          MaxTTL: 172800
        }
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('Should handle empty environment suffix gracefully', () => {
      const emptyEnvApp = new cdk.App();
      const emptyEnvStack = new TapStack(emptyEnvApp, 'EmptyEnvTestStack', {});
      const emptyEnvTemplate = Template.fromStack(emptyEnvStack);
      
      // Should still create resources with default 'dev' suffix
      emptyEnvTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'news-platform-content-dev-us-east-1'
      });
    });

    test('Should create resources even without custom domain', () => {
      // Default stack (no custom domain) should still work
      expect(() => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            Enabled: true
          }
        });
      }).not.toThrow();
    });
  });
});