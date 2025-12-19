import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('should create stack with correct environment suffix', () => {
      expect(stack.environmentSuffix).toBe(environmentSuffix);
    });

    test('should use default environment suffix when not provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack', {});
      expect(defaultStack.environmentSuffix).toBe('dev');
    });

    test('should use context environment suffix when props not provided', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'test');
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      expect(contextStack.environmentSuffix).toBe('test');
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for news website content encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue()
              },
              Action: 'kms:*',
              Resource: '*'
            })
          ])
        }
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/news-website-${environmentSuffix}`,
        TargetKeyId: Match.anyValue()
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create website content bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
              KMSMasterKeyID: Match.anyValue()
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
        },
        LifecycleConfiguration: {
          Rules: [{
            Id: 'DeleteOldVersions',
            Status: 'Enabled',
            NoncurrentVersionExpiration: {
              NoncurrentDays: 30
            }
          }]
        }
      });
    });

    test('should create log bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerPreferred'
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          BlockPublicPolicy: true,
          IgnorePublicAcls: false,
          RestrictPublicBuckets: true
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteLogs',
              Status: 'Enabled',
              ExpirationInDays: 90
            }
          ]
        }
      });
    });

    test('should create bucket policy for CloudFront access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowCloudFrontServicePrincipal',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com'
              },
              Action: 's3:GetObject',
              Resource: Match.anyValue(),
              Condition: Match.anyValue()
            })
          ])
        }
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution with correct properties', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Comment: `News website distribution - ${environmentSuffix}`,
          DefaultRootObject: 'index.html',
          Enabled: true,
          HttpVersion: 'http2',
          IPV6Enabled: true,
          PriceClass: 'PriceClass_100',
          Logging: {
            Bucket: Match.anyValue(),
            Prefix: 'cloudfront-logs/'
          },
          CustomErrorResponses: [
            {
              ErrorCode: 403,
              ResponseCode: 404,
              ResponsePagePath: '/404.html',
              ErrorCachingMinTTL: 300
            },
            {
              ErrorCode: 404,
              ResponsePagePath: '/404.html',
              ErrorCachingMinTTL: 300
            }
          ]
        }
      });
    });

    test('should create Origin Access Control', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: {
          Description: `OAC for news website - ${environmentSuffix}`,
          Name: Match.anyValue(),
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'always',
          SigningProtocol: 'sigv4'
        }
      });
    });
  });



  describe('CloudWatch Dashboard', () => {
    test('should create dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `NewsWebsiteMetrics-${environmentSuffix}`,
        DashboardBody: Match.anyValue()
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create high error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `news-website-high-error-rate-${environmentSuffix}`,
        AlarmDescription: `High error rate detected for news website - ${environmentSuffix}`,
        MetricName: 'TotalErrorRate',
        Namespace: 'AWS/CloudFront',
        Statistic: 'Average',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      template.hasOutput(`WebsiteBucketName${environmentSuffix}`, {
        Description: 'Name of the S3 bucket storing website content'
      });

      template.hasOutput(`DistributionId${environmentSuffix}`, {
        Description: 'CloudFront distribution ID'
      });

      template.hasOutput(`DistributionDomainName${environmentSuffix}`, {
        Description: 'CloudFront distribution domain name'
      });

      template.hasOutput(`KMSKeyId${environmentSuffix}`, {
        Description: 'KMS key ID for encryption'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map(r => r.Type);
      
      // Count expected resources (autoDeleteObjects creates additional resources)
      expect(resourceTypes.filter(t => t === 'AWS::S3::Bucket')).toHaveLength(2); // content + logs
      expect(resourceTypes.filter(t => t === 'AWS::CloudFront::Distribution')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::CloudFront::OriginAccessControl')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::KMS::Key')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::KMS::Alias')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::CloudWatch::Dashboard')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::CloudWatch::Alarm')).toHaveLength(1);
      // autoDeleteObjects creates additional bucket policies and Lambda functions
      expect(resourceTypes.filter(t => t === 'AWS::S3::BucketPolicy').length).toBeGreaterThanOrEqual(2);
      expect(resourceTypes.filter(t => t === 'AWS::Lambda::Function').length).toBeGreaterThanOrEqual(1);
      expect(resourceTypes.filter(t => t === 'AWS::IAM::Role').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Stack Properties', () => {
    test('should expose required properties for testing', () => {
      expect(stack.websiteBucket).toBeDefined();
      expect(stack.distribution).toBeDefined();
      expect(stack.encryptionKey).toBeDefined();
      expect(stack.dashboard).toBeDefined();
      expect(stack.environmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('Security Configuration', () => {
    test('should enforce HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https'
          }
        }
      });
    });


    test('should block all public S3 access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });
  });

  describe('Performance Optimization', () => {
    test('should enable compression', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            Compress: true
          }
        }
      });
    });

    test('should use optimized caching policy', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6' // CACHING_OPTIMIZED
          }
        }
      });
    });

    test('should use cost-effective price class', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          PriceClass: 'PriceClass_100'
        }
      });
    });
  });
});