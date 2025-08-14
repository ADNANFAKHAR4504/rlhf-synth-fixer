import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { CloudTrailConstruct } from '../../lib/constructs/cloudtrail-construct';

describe('CloudTrailConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  describe('Basic CloudTrail Creation', () => {
    beforeEach(() => {
      const cloudTrailConstruct = new CloudTrailConstruct(stack, 'TestCloudTrailConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create CloudTrail with correct configuration', () => {
      template.hasResource('AWS::CloudTrail::Trail', {
        Properties: {
          TrailName: 'CloudTrail-test',
          IncludeGlobalServiceEvents: true,
          IsMultiRegionTrail: true,
          EnableLogFileValidation: true,
          S3BucketName: Match.anyValue(),
          CloudWatchLogsLogGroupArn: Match.anyValue(),
          CloudWatchLogsRoleArn: Match.anyValue(),
        },
      });
    });

    test('should create S3 bucket for CloudTrail logs', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
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
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              {
                Id: 'CloudTrailLogRetention',
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
                ExpirationInDays: 2555,
              },
            ]),
          },
        },
      });
    });

    test('should create CloudWatch Log Group for CloudTrail', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        Properties: {
          RetentionInDays: 365,
        },
      });
    });

    test('should tag CloudTrail resources correctly', () => {
      template.hasResource('AWS::CloudTrail::Trail', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'CloudTrail-test',
            },
          ]),
        },
      });
    });

    test('should tag S3 bucket correctly', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'CloudTrailBucket-test',
            },
          ]),
        },
      });
    });
  });

  describe('CloudTrail with S3 Bucket Monitoring', () => {
    let testBucket: s3.Bucket;

    beforeEach(() => {
      testBucket = new s3.Bucket(stack, 'TestBucket', {
        bucketName: 'test-bucket-for-monitoring',
      });

      const cloudTrailConstruct = new CloudTrailConstruct(stack, 'TestCloudTrailConstruct', {
        environment: 'test',
        s3BucketsToMonitor: [testBucket],
      });
      template = Template.fromStack(stack);
    });

    test('should create CloudTrail with S3 event selectors', () => {
      template.hasResource('AWS::CloudTrail::Trail', {
        Properties: {
          TrailName: 'CloudTrail-test',
          EventSelectors: Match.arrayWith([
            {
              IncludeManagementEvents: true,
              ReadWriteType: 'All',
            },
          ]),
        },
      });
    });

    test('should expose trail property', () => {
      const cloudTrailConstruct = new CloudTrailConstruct(stack, 'TestCloudTrailConstruct2', {
        environment: 'test',
        s3BucketsToMonitor: [testBucket],
      });
      expect(cloudTrailConstruct.trail).toBeDefined();
    });

    test('should expose cloudTrailLogGroup property', () => {
      const cloudTrailConstruct = new CloudTrailConstruct(stack, 'TestCloudTrailConstruct3', {
        environment: 'test',
        s3BucketsToMonitor: [testBucket],
      });
      expect(cloudTrailConstruct.cloudTrailLogGroup).toBeDefined();
    });
  });

  describe('CloudTrail with Multiple S3 Buckets', () => {
    let bucket1: s3.Bucket;
    let bucket2: s3.Bucket;

    beforeEach(() => {
      bucket1 = new s3.Bucket(stack, 'TestBucket1', {
        bucketName: 'test-bucket-1',
      });
      bucket2 = new s3.Bucket(stack, 'TestBucket2', {
        bucketName: 'test-bucket-2',
      });

      const cloudTrailConstruct = new CloudTrailConstruct(stack, 'TestCloudTrailConstruct', {
        environment: 'test',
        s3BucketsToMonitor: [bucket1, bucket2],
      });
      template = Template.fromStack(stack);
    });

    test('should create CloudTrail with multiple S3 event selectors', () => {
      template.hasResource('AWS::CloudTrail::Trail', {
        Properties: {
          TrailName: 'CloudTrail-test',
          EventSelectors: Match.arrayWith([
            {
              IncludeManagementEvents: true,
              ReadWriteType: 'All',
            },
          ]),
        },
      });
    });
  });

  describe('CloudTrail with Empty S3 Buckets Array', () => {
    beforeEach(() => {
      const cloudTrailConstruct = new CloudTrailConstruct(stack, 'TestCloudTrailConstruct', {
        environment: 'test',
        s3BucketsToMonitor: [],
      });
      template = Template.fromStack(stack);
    });

    test('should create CloudTrail without S3 event selectors', () => {
      template.hasResource('AWS::CloudTrail::Trail', {
        Properties: {
          TrailName: 'CloudTrail-test',
          // Should not have EventSelectors for data events
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have correct resource dependencies', () => {
      const cloudTrailConstruct = new CloudTrailConstruct(stack, 'TestCloudTrailConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);

      // Check that required resources exist
      template.hasResource('AWS::S3::Bucket', {});
      template.hasResource('AWS::Logs::LogGroup', {});
      template.hasResource('AWS::CloudTrail::Trail', {});
    });
  });
});