import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { PodcastStorageStack } from '../lib/podcast-storage-stack';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';
import { PodcastTranscodingStack } from '../lib/podcast-transcoding-stack';
import { PodcastCdnStack } from '../lib/podcast-cdn-stack';
import { PodcastDnsStack } from '../lib/podcast-dns-stack';
import { PodcastMonitoringStack } from '../lib/podcast-monitoring-stack';
import { PodcastSchedulerStack } from '../lib/podcast-scheduler-stack';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

describe('Individual Stack Components', () => {
  let app: cdk.App;
  let stack: cdk.Stack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
  });

  describe('PodcastStorageStack', () => {
    test('creates storage stack with correct bucket configuration', () => {
      const storageStack = new PodcastStorageStack(stack, 'TestStorage', {
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(stack);

      // Verify bucket name pattern
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('podcast-audio-test-')
      });

      // Verify bucket is exported
      expect(storageStack.audioBucket).toBeDefined();
      expect(storageStack.audioBucket).toBeInstanceOf(s3.Bucket);
    });

    test('handles different environment suffixes', () => {
      const storageStack = new PodcastStorageStack(stack, 'TestStorage', {
        environmentSuffix: 'prod'
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('podcast-audio-prod-')
      });
    });
  });

  describe('PodcastSubscriberStack', () => {
    test('creates subscriber stack with correct table configuration', () => {
      const subscriberStack = new PodcastSubscriberStack(stack, 'TestSubscriber', {
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(stack);

      // Verify table name pattern
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-test'
      });

      // Verify table is exported
      expect(subscriberStack.subscriberTable).toBeDefined();
      expect(subscriberStack.subscriberTable).toBeInstanceOf(dynamodb.Table);
    });

    test('handles different environment suffixes', () => {
      const subscriberStack = new PodcastSubscriberStack(stack, 'TestSubscriber', {
        environmentSuffix: 'staging'
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'podcast-subscribers-staging'
      });
    });

    test('creates table with proper attributes', () => {
      new PodcastSubscriberStack(stack, 'TestSubscriber', {
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'email',
            AttributeType: 'S'
          }),
          Match.objectLike({
            AttributeName: 'subscriptionStatus',
            AttributeType: 'S'
          }),
          Match.objectLike({
            AttributeName: 'expirationDate',
            AttributeType: 'S'
          })
        ])
      });
    });
  });

  describe('PodcastTranscodingStack', () => {
    test('creates transcoding stack with MediaConvert resources', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      const transcodingStack = new PodcastTranscodingStack(stack, 'TestTranscoding', {
        environmentSuffix: 'test',
        audioBucket: mockBucket
      });

      const template = Template.fromStack(stack);

      // Verify job template name
      template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
        Name: 'podcast-audio-transcoding-test'
      });

      // Verify role is exported
      expect(transcodingStack.mediaConvertRole).toBeDefined();
    });

    test('grants S3 permissions to MediaConvert role', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      new PodcastTranscodingStack(stack, 'TestTranscoding', {
        environmentSuffix: 'test',
        audioBucket: mockBucket
      });

      const template = Template.fromStack(stack);

      // Verify S3 permissions are granted
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*'
              ])
            })
          ])
        }
      });
    });
  });

  describe('PodcastCdnStack', () => {
    test('creates CDN stack with CloudFront and Lambda@Edge', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      const mockTable = new dynamodb.Table(stack, 'MockTable', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
      });

      const cdnStack = new PodcastCdnStack(stack, 'TestCdn', {
        environmentSuffix: 'test',
        audioBucket: mockBucket,
        subscriberTable: mockTable
      });

      const template = Template.fromStack(stack);

      // Verify distribution is created
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Comment: 'Podcast CDN test'
        })
      });

      // Verify exports
      expect(cdnStack.distribution).toBeDefined();
      expect(cdnStack.edgeFunction).toBeDefined();
    });

    test('embeds table name in Lambda function code', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      const mockTable = new dynamodb.Table(stack, 'MockTable', {
        tableName: 'test-subscriber-table',
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
      });

      new PodcastCdnStack(stack, 'TestCdn', {
        environmentSuffix: 'test',
        audioBucket: mockBucket,
        subscriberTable: mockTable
      });

      const template = Template.fromStack(stack);

      // Verify Lambda function contains table name
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('test-subscriber-table')
        }
      });
    });
  });

  describe('PodcastDnsStack', () => {
    test('creates DNS stack with Route 53 resources', () => {
      const mockDistribution = {
        distributionId: 'test-distribution-id',
        distributionDomainName: 'test.cloudfront.net'
      } as cloudfront.IDistribution;

      const dnsStack = new PodcastDnsStack(stack, 'TestDns', {
        environmentSuffix: 'test',
        distribution: mockDistribution
      });

      const template = Template.fromStack(stack);

      // Verify hosted zone is created
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'podcast-test.example.com',
        Comment: 'Hosted zone for podcast platform test'
      });

      // Verify exports
      expect(dnsStack.hostedZone).toBeDefined();
    });

    test('creates both A and AAAA records', () => {
      const mockDistribution = {
        distributionId: 'test-distribution-id',
        distributionDomainName: 'test.cloudfront.net'
      } as cloudfront.IDistribution;

      new PodcastDnsStack(stack, 'TestDns', {
        environmentSuffix: 'test',
        distribution: mockDistribution
      });

      const template = Template.fromStack(stack);

      // Count record types
      const resources = template.findResources('AWS::Route53::RecordSet');
      const recordTypes = Object.values(resources).map((r: any) => r.Properties.Type);

      expect(recordTypes).toContain('A');
      expect(recordTypes).toContain('AAAA');
    });
  });

  describe('PodcastMonitoringStack', () => {
    test('creates monitoring stack with dashboard and alarms', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      const mockTable = new dynamodb.Table(stack, 'MockTable', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
      });
      const mockDistribution = {
        distributionId: 'test-distribution-id',
        distributionDomainName: 'test.cloudfront.net'
      } as cloudfront.IDistribution;

      new PodcastMonitoringStack(stack, 'TestMonitoring', {
        environmentSuffix: 'test',
        distribution: mockDistribution,
        subscriberTable: mockTable,
        audioBucket: mockBucket
      });

      const template = Template.fromStack(stack);

      // Verify dashboard is created
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'podcast-streaming-metrics-test'
      });

      // Verify SNS topic is created
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'podcast-alarms-test'
      });
    });

    test('creates multiple alarms with correct thresholds', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      const mockTable = new dynamodb.Table(stack, 'MockTable', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
      });
      const mockDistribution = {
        distributionId: 'test-distribution-id',
        distributionDomainName: 'test.cloudfront.net'
      } as cloudfront.IDistribution;

      new PodcastMonitoringStack(stack, 'TestMonitoring', {
        environmentSuffix: 'test',
        distribution: mockDistribution,
        subscriberTable: mockTable,
        audioBucket: mockBucket
      });

      const template = Template.fromStack(stack);

      // Verify multiple alarms
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(2);

      // Verify specific alarm configurations
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'podcast-high-error-rate-test',
        Threshold: 5
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'podcast-high-4xx-rate-test',
        Threshold: 10
      });
    });
  });

  describe('PodcastSchedulerStack', () => {
    test('creates scheduler stack with EventBridge schedules and Lambda functions', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      const mockTable = new dynamodb.Table(stack, 'MockTable', {
        partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING }
      });
      const mockKvs = { attrArn: 'arn:aws:cloudfront-keyvaluestore:us-west-2:123456789012:keyvaluestore/test' };
      const mockRole = { roleArn: 'arn:aws:iam::123456789012:role/test-role' };

      new PodcastSchedulerStack(stack, 'TestScheduler', {
        environmentSuffix: 'test',
        subscriberTable: mockTable,
        audioBucket: mockBucket,
        mediaConvertRole: mockRole as any,
        jobTemplateName: 'test-job-template',
        keyValueStore: mockKvs as any
      });

      const template = Template.fromStack(stack);

      // Verify scheduler role is created
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'scheduler.amazonaws.com'
              }
            })
          ])
        }
      });

      // Verify Lambda functions are created with correct memory and timeout
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 300
      });
    });

    test('creates EventBridge Scheduler schedules', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket2');
      const mockTable = new dynamodb.Table(stack, 'MockTable2', {
        partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING }
      });
      const mockKvs = { attrArn: 'arn:aws:cloudfront-keyvaluestore:us-west-2:123456789012:keyvaluestore/test' };
      const mockRole = { roleArn: 'arn:aws:iam::123456789012:role/test-role' };

      new PodcastSchedulerStack(stack, 'TestScheduler2', {
        environmentSuffix: 'test',
        subscriberTable: mockTable,
        audioBucket: mockBucket,
        mediaConvertRole: mockRole as any,
        jobTemplateName: 'test-job-template',
        keyValueStore: mockKvs as any
      });

      const template = Template.fromStack(stack);

      // Verify schedules are created
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: Match.stringLikeRegexp('podcast-.*-test'),
        ScheduleExpression: Match.anyValue(),
        State: 'ENABLED'
      });
    });
  });
});