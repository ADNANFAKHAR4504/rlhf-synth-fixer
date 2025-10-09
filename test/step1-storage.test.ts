import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PodcastStorageStack } from '../lib/podcast-storage-stack';

describe('Step 1: Storage Stack Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: PodcastStorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    storageStack = new PodcastStorageStack(stack, 'PodcastStorage', {
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Step 1.1: Storage stack is created', () => {
    expect(storageStack).toBeDefined();
    expect(storageStack.audioBucket).toBeDefined();
  });

  test('Step 1.2: S3 bucket is created with correct name', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('podcast-audio-.*test')
    });
  });

  test('Step 1.3: S3 bucket has encryption enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          })
        ])
      }
    });
  });

  test('Step 1.4: S3 bucket has CORS configured for audio streaming', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      CorsConfiguration: {
        CorsRules: Match.arrayWith([
          Match.objectLike({
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            MaxAge: 3600
          })
        ])
      }
    });
  });

  test('Step 1.5: S3 bucket has lifecycle rule for intelligent tiering', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Id: 'IntelligentTieringRule',
            Status: 'Enabled',
            Transitions: Match.arrayWith([
              Match.objectLike({
                StorageClass: 'INTELLIGENT_TIERING',
                TransitionInDays: 0
              })
            ])
          })
        ])
      }
    });
  });

  test('Step 1.6: S3 bucket has versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
  });

  test('Step 1.7: S3 bucket has public access blocked', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('Step 1.8: Stack outputs are defined', () => {
    template.hasOutput('AudioBucketName', {
      Description: 'S3 bucket for audio files'
    });
  });
});

