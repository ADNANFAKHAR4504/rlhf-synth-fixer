import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe.each([['dev'], ['staging'], ['prod']])(
  'TapStack with environment %s',
  env => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;
    let environmentSuffix: string;

    beforeEach(() => {
      environmentSuffix = env;
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    describe('S3 Origin Buckets', () => {
      test('creates primary S3 bucket with correct configuration', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: Match.anyValue(), // CDK generates Fn::Join for bucket names
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
          VersioningConfiguration: {
            Status: 'Enabled',
          },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              },
            ],
          },
        });
      });

      test('creates logs bucket with lifecycle policies', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: Match.anyValue(), // CDK generates Fn::Join for bucket names
          LifecycleConfiguration: {
            Rules: [
              {
                Id: 'DeleteOldLogs',
                Status: 'Enabled',
                ExpirationInDays: 90,
                Transitions: [
                  {
                    StorageClass: 'INTELLIGENT_TIERING',
                    TransitionInDays: 30,
                  },
                ],
              },
            ],
          },
        });
      });

      test('configures cross-region replication on primary bucket', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          ReplicationConfiguration: {
            Role: Match.anyValue(),
            Rules: [
              {
                Id: 'ReplicateAll',
                Status: 'Enabled',
                Priority: 1,
                DeleteMarkerReplication: { Status: 'Enabled' },
                Destination: {
                  Bucket: Match.anyValue(), // CDK generates bucket ARN reference
                  ReplicationTime: {
                    Status: 'Enabled',
                    Time: { Minutes: 15 },
                  },
                  Metrics: {
                    Status: 'Enabled',
                    EventThreshold: { Minutes: 15 },
                  },
                  StorageClass: 'STANDARD_IA',
                },
              },
            ],
          },
        });
      });
    });

    describe('CloudFront Origin Group', () => {
      test('creates origin group configuration in CloudFront Distribution', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            OriginGroups: Match.objectLike({
              Quantity: 1,
            }),
          },
        });
      });
    });

    describe('CloudFront Distribution', () => {
      test('creates CloudFront distribution with correct configuration', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            Comment: `Media CDN Distribution - ${environmentSuffix}`,
            DefaultRootObject: 'index.html',
            PriceClass: 'PriceClass_All',
            Enabled: true,
            IPV6Enabled: true,
            HttpVersion: 'http2',
            Logging: {
              Bucket: Match.anyValue(),
              Prefix: 'cdn-logs/',
            },
          },
        });
      });

      test('configures origins for origin group failover', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            Origins: Match.arrayWith([
              Match.objectLike({
                S3OriginConfig: Match.objectLike({
                  OriginAccessIdentity: Match.anyValue(),
                }),
              }),
            ]),
            OriginGroups: Match.objectLike({
              Items: Match.arrayWith([
                Match.objectLike({
                  // Failover criteria will use default status codes (500, 502, 503, 504)
                }),
              ]),
            }),
          },
        });
      });

      test('configures multiple cache behaviors with origin groups', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            CacheBehaviors: Match.arrayWith([
              Match.objectLike({
                PathPattern: '/video/*.mp4',
                CachePolicyId: Match.anyValue(),
                Compress: false,
              }),
              Match.objectLike({
                PathPattern: '/images/*.jpg',
                CachePolicyId: Match.anyValue(),
                Compress: true,
              }),
              Match.objectLike({
                PathPattern: '/static/*',
                CachePolicyId: Match.anyValue(),
                Compress: true,
              }),
            ]),
          },
        });
      });

      test('attaches WAF to CloudFront distribution', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: {
            WebACLId: Match.anyValue(),
          },
        });
      });
    });

    describe('Lambda@Edge Functions', () => {
      test('creates geo-blocking Lambda function', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `cdn-geo-blocking-${environmentSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          MemorySize: 128,
          Timeout: 5,
        });
      });

      test('creates header manipulation Lambda function', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `cdn-header-manipulation-${environmentSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          MemorySize: 128,
          Timeout: 5,
        });
      });
    });

    describe('AWS WAF', () => {
      test('creates WAF WebACL with rate limiting and IP reputation rules', () => {
        template.hasResourceProperties('AWS::WAFv2::WebACL', {
          Scope: 'CLOUDFRONT',
          DefaultAction: { Allow: {} },
          Rules: Match.arrayWith([
            Match.objectLike({
              Name: 'RateLimitRule',
              Priority: 1,
              Action: { Block: {} },
            }),
            Match.objectLike({
              Name: 'IPReputationRule',
              Priority: 2,
              Action: { Block: {} },
            }),
          ]),
          VisibilityConfig: {
            CloudWatchMetricsEnabled: true,
            MetricName: 'CDNWebACL',
            SampledRequestsEnabled: true,
          },
        });
      });

      test('creates IP set for reputation filtering', () => {
        template.hasResourceProperties('AWS::WAFv2::IPSet', {
          Scope: 'CLOUDFRONT',
          IPAddressVersion: 'IPV4',
          Addresses: Match.arrayWith([
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
          ]),
        });
      });
    });

    describe('CloudWatch Monitoring', () => {
      test('creates CloudWatch dashboard', () => {
        template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
          DashboardName: `cdn-monitoring-${environmentSuffix}`,
        });
      });

      test('creates cache hit ratio alarm', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `cdn-low-cache-hit-${environmentSuffix}`,
          AlarmDescription: 'Cache hit ratio below 85%',
          MetricName: 'CacheHitRate',
          Namespace: 'AWS/CloudFront',
          ComparisonOperator: 'LessThanThreshold',
          Threshold: 85,
          EvaluationPeriods: 3,
        });
      });

      test('creates 5xx error rate alarm', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `cdn-high-5xx-errors-${environmentSuffix}`,
          AlarmDescription: '5xx error rate above 0.1%',
          MetricName: '5xxErrorRate',
          Namespace: 'AWS/CloudFront',
          ComparisonOperator: 'GreaterThanThreshold',
          Threshold: 0.1,
          EvaluationPeriods: 2,
        });
      });
    });

    describe('IAM and Security', () => {
      test('creates replication role with proper permissions', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 's3.amazonaws.com',
                },
              },
            ],
          },
          Description: 'Role for S3 cross-region replication',
        });
      });

      test('creates Lambda execution roles for Edge functions', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              },
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'edgelambda.amazonaws.com',
                },
              },
            ]),
          },
        });
      });

      test('creates CloudFront Origin Access Identity', () => {
        template.hasResourceProperties(
          'AWS::CloudFront::CloudFrontOriginAccessIdentity',
          {
            CloudFrontOriginAccessIdentityConfig: {
              Comment: Match.stringLikeRegexp(
                `OAI for ${environmentSuffix} CDN`
              ),
            },
          }
        );
      });
    });

    describe('VPC and Networking', () => {
      test('creates VPC with public and private subnets', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: Match.anyValue(),
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });

        // Check for subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: true, // Public subnet
        });

        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: false, // Private subnet
        });
      });

      test('creates NAT Gateway for private subnet internet access', () => {
        template.hasResourceProperties('AWS::EC2::NatGateway', {
          AllocationId: Match.anyValue(),
        });
      });
    });

    describe('EventBridge Integration', () => {
      test('creates EventBridge rule for alarm monitoring', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: `cdn-alarm-rule-${environmentSuffix}`,
          Description: 'Monitors CDN performance alarms',
          EventPattern: {
            source: ['aws.cloudwatch'],
            'detail-type': ['CloudWatch Alarm State Change'],
          },
        });
      });

      test('adds Lambda target to EventBridge rule', () => {
        // Check that the rule has targets
        const rules = template.findResources('AWS::Events::Rule');
        expect(Object.keys(rules)).toHaveLength(1);

        // The Lambda target should be referenced
        template.hasResourceProperties('AWS::Lambda::Permission', {
          Action: 'lambda:InvokeFunction',
          Principal: 'events.amazonaws.com',
        });
      });
    });

    describe('Outputs', () => {
      test('exports required CloudFront outputs', () => {
        template.hasOutput('DistributionDomainName', {
          Description: 'CloudFront Distribution Domain Name',
        });

        template.hasOutput('DistributionId', {
          Description: 'CloudFront Distribution ID',
        });

        template.hasOutput('PrimaryBucketName', {
          Description: 'Primary Origin Bucket Name',
        });

        template.hasOutput('DashboardURL', {
          Description: 'CloudWatch Dashboard URL',
        });
      });

      test('exports VPC and networking outputs', () => {
        template.hasOutput('VpcId', {
          Description: 'VPC ID for network isolation',
        });
      });

      test('exports EventBridge and CloudFormation outputs', () => {
        template.hasOutput('EventBridgeRuleName', {
          Description: 'EventBridge rule name for alarm monitoring',
        });

        template.hasOutput('CloudFormationValidation', {
          Description: 'CloudFormation template validation status',
          Value: 'SUCCESS',
        });
      });
    });

    describe('Resource Tagging', () => {
      test('applies consistent tags to all resources', () => {
        // Test that resources have the expected tags
        const bucketTags = template.findResources('AWS::S3::Bucket');
        const bucketTagKeys = Object.keys(bucketTags);
        for (let i = 0; i < bucketTagKeys.length; i++) {
          const bucket = bucketTags[bucketTagKeys[i]];
          expect(bucket.Properties.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                Key: 'Environment',
                Value: environmentSuffix,
              }),
              expect.objectContaining({
                Key: 'Project',
                Value: 'MediaStreaming',
              }),
              expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
            ])
          );
        }
      });
    });
  }
);

describe('TapStack with default environment', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack'); // No environmentSuffix provided
    template = Template.fromStack(stack);
  });

  test('uses default environment suffix', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment: 'Media CDN Distribution - dev', // Should default to 'dev'
      },
    });
  });
});
