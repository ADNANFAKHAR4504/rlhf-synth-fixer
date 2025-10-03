import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { PodcastDnsStack } from '../lib/podcast-dns-stack';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';
import { PodcastSchedulerStack } from '../lib/podcast-scheduler-stack';
import { PodcastTranscodingStack } from '../lib/podcast-transcoding-stack';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

describe('Branch Coverage Edge Cases', () => {
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

  describe('PodcastDnsStack edge cases', () => {
    test('handles hosted zone without name servers', () => {
      const mockDistribution = {
        distributionId: 'test-distribution-id',
        distributionDomainName: 'test.cloudfront.net'
      } as cloudfront.IDistribution;

      const dnsStack = new PodcastDnsStack(stack, 'TestDns', {
        environmentSuffix: 'test',
        distribution: mockDistribution
      });

      const template = Template.fromStack(stack);

      // Verify CfnOutput exists even without nameservers
      template.hasOutput('NameServers', {
        Description: 'Route 53 name servers'
      });
    });

    test('handles null hostedZoneNameServers', () => {
      const mockDistribution = {
        distributionId: 'test-distribution-id',
        distributionDomainName: 'test.cloudfront.net'
      } as cloudfront.IDistribution;

      const dnsStack = new PodcastDnsStack(stack, 'TestDnsNull', {
        environmentSuffix: 'test-null',
        distribution: mockDistribution
      });

      // Set nameservers to undefined to test the branch
      Object.defineProperty(dnsStack.hostedZone, 'hostedZoneNameServers', {
        value: undefined,
        writable: false
      });

      const template = Template.fromStack(stack);

      // Should still create output with empty array fallback
      template.hasOutput('NameServers', {
        Description: 'Route 53 name servers'
      });
    });
  });

  describe('PodcastSubscriberStack edge cases', () => {
    test('handles stream configuration with undefined StreamViewType', () => {
      const subscriberStack = new PodcastSubscriberStack(stack, 'TestSub', {
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(stack);

      // Verify stream is configured
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
      });
    });

    test('creates output with stream ARN', () => {
      const subscriberStack = new PodcastSubscriberStack(stack, 'TestSubOutput', {
        environmentSuffix: 'test-output'
      });

      const template = Template.fromStack(stack);

      // Verify output exists
      template.hasOutput('SubscriberTableStreamArn', {
        Description: Match.stringLikeRegexp('DynamoDB.*stream.*ARN')
      });
    });
  });

  describe('PodcastSchedulerStack edge cases', () => {
    test('handles optional keyValueStore', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');
      const mockTable = new dynamodb.Table(stack, 'MockTable', {
        partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
      });
      const mockRole = { roleArn: 'arn:aws:iam::123456789012:role/test-role' };

      // Test with a mock KeyValueStore
      const mockKvs = {
        attrArn: 'arn:aws:cloudfront-keyvaluestore:us-west-2:123456789012:keyvaluestore/test',
        attrId: 'test-kvs-id',
        attrStatus: 'READY'
      };

      const schedulerStack = new PodcastSchedulerStack(stack, 'TestScheduler', {
        environmentSuffix: 'test',
        subscriberTable: mockTable,
        audioBucket: mockBucket,
        mediaConvertRole: mockRole as any,
        jobTemplateName: 'test-job-template',
        keyValueStore: mockKvs as any
      });

      const template = Template.fromStack(stack);

      // Verify Lambda environment variables include KVS
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            KVS_ARN: mockKvs.attrArn
          })
        }
      });
    });

    test('creates transcoding Lambda function', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket2');
      const mockTable = new dynamodb.Table(stack, 'MockTable2', {
        partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING }
      });
      const mockKvs = { attrArn: 'arn:aws:cloudfront-keyvaluestore:us-west-2:123456789012:keyvaluestore/test' };
      const mockRole = { roleArn: 'arn:aws:iam::123456789012:role/test-role' };

      new PodcastSchedulerStack(stack, 'TestScheduler2', {
        environmentSuffix: 'test2',
        subscriberTable: mockTable,
        audioBucket: mockBucket,
        mediaConvertRole: mockRole as any,
        jobTemplateName: 'test-job-template',
        keyValueStore: mockKvs as any
      });

      const template = Template.fromStack(stack);

      // Verify transcoding Lambda function exists
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            MEDIA_CONVERT_ROLE: mockRole.roleArn,
            JOB_TEMPLATE_NAME: 'test-job-template'
          })
        }
      });
    });
  });

  describe('PodcastTranscodingStack edge cases', () => {
    test('creates job template with correct settings', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket');

      const transcodingStack = new PodcastTranscodingStack(stack, 'TestTranscoding', {
        environmentSuffix: 'test',
        audioBucket: mockBucket
      });

      const template = Template.fromStack(stack);

      // Verify job template settings
      template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
        Name: 'podcast-audio-transcoding-test',
        Category: 'podcast',
        Priority: 0,
        StatusUpdateInterval: 'SECONDS_60'
      });

      // Check output exists
      template.hasOutput('MediaConvertJobTemplateName', {
        Description: 'MediaConvert job template name'
      });
    });

    test('grants S3 permissions to MediaConvert role', () => {
      const mockBucket = new s3.Bucket(stack, 'MockBucket2');

      const transcodingStack = new PodcastTranscodingStack(stack, 'TestTranscoding2', {
        environmentSuffix: 'test2',
        audioBucket: mockBucket
      });

      const template = Template.fromStack(stack);

      // Verify IAM policy for MediaConvert
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:PutObject*'
              ])
            })
          ])
        }
      });
    });
  });
});