import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { PodcastSchedulerStack } from '../lib/podcast-scheduler-stack';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';
import { PodcastTranscodingStack } from '../lib/podcast-transcoding-stack';

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
  });

  describe('PodcastTranscodingStack edge cases', () => {
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
                's3:GetBucket*',
                's3:List*',
                's3:DeleteObject*',
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*'
              ])
            })
          ])
        }
      });
    });
  });
});