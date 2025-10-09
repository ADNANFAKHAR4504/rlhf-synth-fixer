import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PodcastCdnStack } from '../lib/podcast-cdn-stack';
import { PodcastStorageStack } from '../lib/podcast-storage-stack';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';

describe('Step 3: CDN Stack Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: PodcastStorageStack;
  let subscriberStack: PodcastSubscriberStack;
  let cdnStack: PodcastCdnStack;
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
    subscriberStack = new PodcastSubscriberStack(stack, 'PodcastSubscriber', {
      environmentSuffix: 'test'
    });
    cdnStack = new PodcastCdnStack(stack, 'PodcastCdn', {
      audioBucket: storageStack.audioBucket,
      subscriberTable: subscriberStack.subscriberTable,
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Step 3.1: CDN stack is created', () => {
    expect(cdnStack).toBeDefined();
    expect(cdnStack.distribution).toBeDefined();
  });

  test('Step 3.2: CloudFront distribution is created', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        Enabled: true
      })
    });
  });

  test('Step 3.3: CloudFront distribution has HTTPS redirect', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https'
        }
      }
    });
  });

  test('Step 3.4: CloudFront OAI is created', () => {
    template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
      CloudFrontOriginAccessIdentityConfig: Match.objectLike({
        Comment: Match.stringLikeRegexp('.*')
      })
    });
  });

  test('Step 3.5: Lambda@Edge authorizer function is created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      MemorySize: 256,
      Timeout: 5
    });
  });

  test('Step 3.6: CloudFront KeyValueStore is created', () => {
    template.hasResourceProperties('AWS::CloudFront::KeyValueStore', {
      Name: Match.stringLikeRegexp('.*subscriber.*')
    });
  });

  test('Step 3.7: IAM role for Lambda@Edge is created', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: Match.arrayWith([
                'lambda.amazonaws.com',
                'edgelambda.amazonaws.com'
              ])
            }
          })
        ])
      }
    });
  });

  test('Step 3.8: Lambda@Edge has CloudWatch Logs permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents'
            ]),
            Effect: 'Allow'
          })
        ])
      }
    });
  });
});

